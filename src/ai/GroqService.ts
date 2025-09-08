import { TestCase } from '../types';

export class GroqService {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async generateTestCases(websiteAnalysis: any, testTypes: string[]): Promise<TestCase[]> {
    if (!this.apiKey || this.apiKey === 'your_groq_api_key_here') {
      console.log('⚠️  Groq API key not configured, using fallback test generation');
      return this.generateFallbackTestCases(websiteAnalysis, testTypes);
    }

    try {
      const prompt = this.buildPrompt(websiteAnalysis, testTypes);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert QA automation engineer specializing in comprehensive test case generation. Generate detailed, actionable test cases in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_completion_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from Groq API');
      }

      return this.parseTestCases(content, websiteAnalysis);

    } catch (error) {
      console.error('❌ Error generating test cases with Groq:', error);
      console.log('🔄 Falling back to built-in test generation...');
      return this.generateFallbackTestCases(websiteAnalysis, testTypes);
    }
  }

  private buildPrompt(websiteAnalysis: any, testTypes: string[]): string {
    const pages = websiteAnalysis.pages?.slice(0, 5) || [];
    const forms = websiteAnalysis.forms || [];
    const links = websiteAnalysis.navigation || [];

    return `
Generate comprehensive test cases for the website: ${websiteAnalysis.baseUrl}

Website Analysis:
- Pages found: ${pages.length}
- Forms found: ${forms.length}
- Navigation links: ${links.length}
- Total elements: ${websiteAnalysis.totalElements}

Test Types to Generate: ${testTypes.join(', ')}

Please generate test cases in the following JSON format:
[
  {
    "id": "unique_test_id",
    "name": "Descriptive test name",
    "description": "Detailed test description",
    "type": "one of the requested test types",
    "priority": "high|medium|low",
    "steps": [
      {
        "action": "navigate|click|type|assert|wait",
        "target": "selector or URL",
        "value": "input value if needed",
        "description": "step description"
      }
    ],
    "expectedResult": "Expected outcome",
    "page": "target page URL"
  }
]

Generate 15-25 diverse test cases covering:
1. Functional testing (forms, navigation, user workflows)
2. UI testing (element visibility, responsiveness)
3. Performance testing (load times, Core Web Vitals)
4. Security testing (XSS, injection, validation)
5. Accessibility testing (WCAG compliance, screen readers)
6. Cross-browser compatibility
7. Mobile responsiveness
8. API endpoint testing
9. Error handling and edge cases
10. Data validation and form submissions

Focus on real-world scenarios that users would encounter. Make test names descriptive and user-friendly.
`;
  }

  private parseTestCases(content: string, websiteAnalysis: any): TestCase[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const testCases = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(testCases)) {
        throw new Error('Response is not an array');
      }

      return testCases.map((tc: any, index: number) => ({
        id: tc.id || `groq_test_${index + 1}`,
        name: tc.name || `Generated Test ${index + 1}`,
        description: tc.description || 'AI-generated test case',
        type: tc.type || 'functional',
        priority: tc.priority || 'medium',
        steps: tc.steps || [],
        expectedResult: tc.expectedResult || 'Test should pass',
        page: tc.page || websiteAnalysis.baseUrl,
        data: tc.data || {}
      }));

    } catch (error) {
      console.error('❌ Error parsing Groq response:', error);
      throw new Error('Failed to parse test cases from Groq response');
    }
  }

  private generateFallbackTestCases(websiteAnalysis: any, testTypes: string[]): TestCase[] {
    const fallbackTests: TestCase[] = [];
    const baseUrl = websiteAnalysis.baseUrl;
    const pages = websiteAnalysis.pages || [];
    const forms = websiteAnalysis.forms || [];

    // Navigation tests
    pages.slice(0, 3).forEach((page: any, index: number) => {
      fallbackTests.push({
        id: `fallback_nav_${index + 1}`,
        name: `🌐 Navigate to ${page.title || 'Page'}`,
        description: `Test navigation to ${page.url}`,
        type: 'functional',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'assert',
            target: 'title',
            assertion: 'contains',
            value: page.title || '',
            description: 'Verify page title is correct'
          }
        ],
        expectedResult: 'Page loads successfully with correct title',
        page: page.url
      });
    });

    // Form tests
    forms.slice(0, 2).forEach((form: any, index: number) => {
      fallbackTests.push({
        id: `fallback_form_${index + 1}`,
        name: `📝 Form Submission Test`,
        description: `Test form submission on ${form.action || 'current page'}`,
        type: 'functional',
        priority: 'medium',
        steps: [
          {
            action: 'click',
            target: 'form:nth-of-type(1)',
            description: 'Click on form'
          },
          {
            action: 'wait',
            timeout: 2000,
            description: 'Wait for form to load'
          }
        ],
        expectedResult: 'Form submission works correctly',
        page: baseUrl
      });
    });

    // Button tests
    for (let i = 1; i <= 3; i++) {
      fallbackTests.push({
        id: `fallback_button_${i}`,
        name: `🔘 Test Button: Unnamed Button`,
        description: `Test button clickability`,
        type: 'functional',
        priority: 'medium',
        steps: [
          {
            action: 'click',
            target: `button:nth-of-type(${i}), input[type="button"]:nth-of-type(${i}), input[type="submit"]:nth-of-type(${i}), input[type="reset"]:nth-of-type(${i})`,
            description: `Click on button ${i}`
          }
        ],
        expectedResult: 'Button click works without errors',
        page: baseUrl
      });
    }

    // Link tests
    for (let i = 120; i <= 125; i++) {
      fallbackTests.push({
        id: `fallback_link_${i}`,
        name: `🔗 ${baseUrl} Navigation Test`,
        description: `Test link navigation`,
        type: 'functional',
        priority: 'low',
        steps: [
          {
            action: 'click',
            target: `a:nth-of-type(${i})`,
            description: `Click on link ${i}`
          }
        ],
        expectedResult: 'Link navigation works correctly',
        page: baseUrl
      });
    }

    // UI tests
    const uiElements = ['button', 'input', 'textarea', 'form'];
    uiElements.forEach((element, index) => {
      fallbackTests.push({
        id: `fallback_ui_${index + 1}`,
        name: `Element Visibility Test - ${element}`,
        description: `Test ${element} element visibility`,
        type: 'ui',
        priority: 'medium',
        steps: [
          {
            action: 'assert',
            target: `${element}:nth-of-type(1)`,
            assertion: 'isVisible',
            description: `Verify ${element} is visible`
          }
        ],
        expectedResult: `${element} element is visible`,
        page: baseUrl
      });
    });

    return fallbackTests.slice(0, 25); // Limit to 25 tests
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_groq_api_key_here') {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error validating Groq API key:', error);
      return false;
    }
  }
}
