import { GoogleGenerativeAI } from '@google/generative-ai';
// Experimental: Google Search grounding via tools config on newer SDKs may differ.
// We'll attempt to pass a tools definition when config.gemini.useGrounding is true.
import { WebsiteAnalysis, TestCase, TestStep } from '../types';
import config from '../config';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your environment variables.');
    }
    
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxTokens,
        temperature: config.gemini.temperature,
      }
    });
  }

  async generateTestCases(analysis: WebsiteAnalysis): Promise<TestCase[]> {
    console.log('🤖 Generating test cases using Gemini AI...');
    
    try {
      const prompts: string[] = [
        this.buildJsonOnlyPrompt(analysis, config.test.maxTestCases),
        this.buildCompactPrompt(analysis, 20),
        this.buildCompactPrompt(analysis, 10)
      ];

      for (const p of prompts) {
        const result = await this.model.generateContent(p);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          const testCases = this.parseTestCasesFromResponse(text, analysis);
          if (testCases && testCases.length > 0) {
            console.log(`✅ Generated ${testCases.length} test cases`);
            return testCases;
          }
        }
      }

      console.warn('Empty/invalid AI responses; using fallback tests');
      return this.generateFallbackTestCases(analysis);
      
    } catch (error) {
      console.error('❌ Error generating test cases:', error);
      throw error;
    }
  }

  // v1alpha structured output disabled for current SDK compatibility

  private buildTestGenerationPrompt(analysis: WebsiteAnalysis): string {
    const pagesInfo = analysis.pages.map(page => ({
      url: page.url,
      title: page.title,
      elements: page.elements.map(el => ({
        type: el.type,
        text: el.text,
        placeholder: el.placeholder,
        selector: el.selector
      }))
    })).slice(0, 5); // Limit to first 5 pages for prompt size

    return `
You are an expert QA automation engineer. Based on the following website analysis, generate comprehensive test cases for automated testing using Playwright.

Website Analysis:
- Base URL: ${analysis.baseUrl}
- Total Pages: ${analysis.pages.length}
- Total Elements: ${analysis.totalElements}
- Technologies: ${analysis.technologies.join(', ')}

Sample Pages and Elements:
${JSON.stringify(pagesInfo, null, 2)}

Please generate test cases covering the following categories:
1. Functional Testing (form submissions, button clicks, navigation)
2. UI Testing (element visibility, responsiveness, user interactions)
3. Accessibility Testing (ARIA labels, keyboard navigation, screen reader compatibility)
4. Performance Testing (page load times, resource optimization)
5. Security Testing (input validation, XSS prevention, CSRF protection)
6. Integration Testing (API calls, third-party integrations)

For each test case, provide:
- Unique ID
- Descriptive name
- Detailed description
- Test type (functional, ui, accessibility, performance, security, integration)
- Priority (high, medium, low)
- Step-by-step test steps with specific actions
- Expected result
- Target page URL
- Element selector (if applicable)

Format the response as a JSON array of test cases. Each test case should have this structure:
{
  "id": "unique_id",
  "name": "Test Case Name",
  "description": "Detailed description of what this test validates",
  "type": "functional|ui|accessibility|performance|security|integration",
  "priority": "high|medium|low",
  "steps": [
    {
      "action": "click|type|select|hover|scroll|wait|assert|navigate",
      "target": "element_selector_or_url",
      "value": "input_value_if_applicable",
      "assertion": "expected_condition",
      "timeout": 30000,
      "description": "Step description"
    }
  ],
  "expectedResult": "What should happen when this test passes",
  "page": "target_page_url",
  "element": {
    "type": "element_type",
    "selector": "css_selector",
    "text": "element_text"
  },
  "data": {
    "testData": "any_required_test_data"
  }
}

Generate approximately ${config.test.maxTestCases} test cases, prioritizing high-impact scenarios and common user workflows. Focus on real-world usage patterns and edge cases.
`;
  }

  private buildJsonOnlyPrompt(analysis: WebsiteAnalysis, limit: number): string {
    const pages = analysis.pages.slice(0, 5).map(p => ({ url: p.url, title: p.title })).map(p => `${p.title} (${p.url})`).join(', ');
    return `ONLY return a valid JSON array with at most ${limit} items. No prose, no markdown, no comments.
Each item must strictly match keys: id,name,description,type,priority,steps,expectedResult,page,element,data.
Allowed types: functional, ui, accessibility, performance, security, integration.
Actions: click,type,select,hover,scroll,wait,assert,navigate.
Target site: ${analysis.baseUrl}. Sample pages: ${pages}.`;
  }

  private buildCompactPrompt(analysis: WebsiteAnalysis, limit: number): string {
    return `Return ONLY JSON array (max ${Math.min(limit, config.test.maxTestCases)} items) of Playwright test cases for ${analysis.baseUrl}. Each item keys: id,name,description,type,priority,steps(page actions),expectedResult,page.`;
  }

  private parseTestCasesFromResponse(response: string, analysis: WebsiteAnalysis): TestCase[] {
    try {
      // Prefer a fenced code block first
      let candidate = response;
      const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence && fence[1]) candidate = fence[1];

      // Extract the first JSON array
      const arrStart = candidate.indexOf('[');
      const arrEnd = candidate.lastIndexOf(']');
      if (arrStart === -1 || arrEnd === -1 || arrEnd <= arrStart) {
        throw new Error('No JSON array found in AI response');
      }
      let jsonStr = candidate.substring(arrStart, arrEnd + 1);

      // Sanitize common issues: control chars, single quotes, trailing commas, dangling comments
      jsonStr = jsonStr
        .replace(/\r?\n/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/[\u0000-\u001F\u007F]/g, ' ') // remove control chars
        .replace(/\/(?:\*[^*]*\*+([^/*][^*]*\*+)*\/|\/.*)/g, '') // remove // and /* */ comments
        .replace(/'([^']*)'/g, '"$1"') // single to double quotes (best effort)
        .replace(/,\s*([\]\}])/g, '$1'); // trailing commas before ] or }

      const testCasesData = JSON.parse(jsonStr);

      if (!Array.isArray(testCasesData)) {
        throw new Error('Parsed JSON is not an array');
      }

      return testCasesData.map((tc: any, index: number) => ({
        id: tc.id || `test_${index + 1}`,
        name: tc.name || `Generated Test ${index + 1}`,
        description: tc.description || 'AI-generated test case',
        type: tc.type || 'functional',
        priority: tc.priority || 'medium',
        steps: Array.isArray(tc.steps) ? tc.steps : [],
        expectedResult: tc.expectedResult || 'Test should pass',
        page: tc.page || analysis.baseUrl,
        element: tc.element,
        data: tc.data || {},
      }));

    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: generate basic test cases
      return this.generateFallbackTestCases(analysis);
    }
  }

  private generateFallbackTestCases(analysis: WebsiteAnalysis): TestCase[] {
    const testCases: TestCase[] = [];
    let testId = 1;

    // Generate basic functional tests
    analysis.pages.forEach(page => {
      // Navigation test
      testCases.push({
        id: `nav_${testId++}`,
        name: `Navigate to ${page.title}`,
        description: `Test navigation to ${page.url}`,
        type: 'functional',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `page.url() === '${page.url}'`,
            description: 'Verify correct page loaded',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page loads successfully and URL is correct',
        page: page.url,
      });

      // Form tests
      page.forms.forEach(form => {
        testCases.push({
          id: `form_${testId++}`,
          name: `Test form submission on ${page.title}`,
          description: `Test form functionality on ${page.url}`,
          type: 'functional',
          priority: 'high',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'click',
              target: form.selector,
              description: 'Click on form',
              timeout: 5000,
            }
          ],
          expectedResult: 'Form interaction works correctly',
          page: page.url,
          element: form,
        });
      });

      // Button tests
      const buttons = page.elements.filter(el => el.type === 'button');
      buttons.forEach(button => {
        testCases.push({
          id: `button_${testId++}`,
          name: `Test button: ${button.text || 'Unnamed button'}`,
          description: `Test button functionality on ${page.url}`,
          type: 'functional',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'click',
              target: button.selector,
              description: `Click button: ${button.text}`,
              timeout: 5000,
            }
          ],
          expectedResult: 'Button click works correctly',
          page: page.url,
          element: button,
        });
      });
    });

    return testCases.slice(0, config.test.maxTestCases);
  }

  async generateTestData(element: any): Promise<Record<string, any>> {
    const prompt = `
Generate realistic test data for the following form element:
Type: ${element.type}
Input Type: ${element.inputType}
Placeholder: ${element.placeholder}
Required: ${element.required}

Provide test data in JSON format with valid values for testing.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error generating test data:', error);
    }

    // Fallback test data
    return this.getFallbackTestData(element);
  }

  private getFallbackTestData(element: any): Record<string, any> {
    const testData: Record<string, any> = {};

    switch (element.inputType) {
      case 'email':
        testData.email = 'test@example.com';
        break;
      case 'password':
        testData.password = 'TestPassword123!';
        break;
      case 'tel':
        testData.phone = '+1234567890';
        break;
      case 'url':
        testData.url = 'https://example.com';
        break;
      case 'number':
        testData.number = '123';
        break;
      case 'date':
        testData.date = '2024-01-01';
        break;
      default:
        testData.text = 'Test Input';
    }

    return testData;
  }
}

