import { WebsiteAnalysis, TestCase, TestSuite } from '../types';
import { GeminiService } from '../ai/GeminiService';
import { GroqService } from '../ai/GroqService';
import { WebsiteAnalyzer } from '../analyzer/WebsiteAnalyzer';
import { ComprehensiveTestGenerator } from './ComprehensiveTestGenerator';
import { IntelligentTestGenerator } from './IntelligentTestGenerator';
import { EnhancedPageAnalyzer } from '../analyzer/EnhancedPageAnalyzer';
import { TestTypeSuggestions } from '../analyzer/TestTypeSuggestions';
import config from '../config';

export class TestGenerator {
  private geminiService: GeminiService;
  private groqService: GroqService;
  private websiteAnalyzer: WebsiteAnalyzer;
  private comprehensiveGenerator: ComprehensiveTestGenerator;
  private intelligentGenerator: IntelligentTestGenerator;
  private enhancedPageAnalyzer: EnhancedPageAnalyzer;
  private testTypeSuggestions: TestTypeSuggestions;

  constructor() {
    this.geminiService = new GeminiService();
    this.groqService = new GroqService();
    this.websiteAnalyzer = new WebsiteAnalyzer();
    this.comprehensiveGenerator = new ComprehensiveTestGenerator();
    this.intelligentGenerator = new IntelligentTestGenerator();
    this.enhancedPageAnalyzer = new EnhancedPageAnalyzer();
    this.testTypeSuggestions = new TestTypeSuggestions();
  }

  async generateTestSuite(targetUrl: string, configuration?: any, apiKeys?: { geminiKey: string; groqKey: string }): Promise<TestSuite> {
    console.log(`🚀 Starting automated test generation for: ${targetUrl}`);
    
    try {
      // Step 1: Analyze the website
      console.log('📊 Step 1: Analyzing website structure...');
      const analysis = await this.websiteAnalyzer.analyzeWebsite(targetUrl);
      
      // Step 2: Generate test cases using AI
      console.log('🤖 Step 2: Generating test cases with AI...');
      const testCases = await this.generateComprehensiveTestCases(analysis, apiKeys);
      
      // Step 3: Create test suite
      const testSuite: TestSuite = {
        id: this.generateTestSuiteId(),
        name: `Automated Test Suite for ${new URL(targetUrl).hostname}`,
        description: `Comprehensive test suite generated for ${targetUrl} with ${testCases.length} test cases`,
        website: targetUrl,
        testCases,
        results: [],
        createdAt: new Date(),
        status: 'pending',
        configuration: configuration || {
          testTypes: 16,
          maxTests: 50,
          executionMode: 'balanced',
          testerName: 'Fagun'
        }
      };

      console.log(`✅ Test suite generated successfully with ${testCases.length} test cases`);
      return testSuite;

    } catch (error) {
      console.error('❌ Error generating test suite:', error);
      throw error;
    }
  }

  private async generateComprehensiveTestCases(analysis: WebsiteAnalysis, apiKeys?: { geminiKey: string; groqKey: string }): Promise<TestCase[]> {
    const allTestCases: TestCase[] = [];

    // Step 1: Enhanced page analysis for intelligent test generation
    console.log('🔍 Step 1: Performing enhanced page analysis...');
    const pageAnalyses = await this.enhancedPageAnalyzer.analyzeAllPages(analysis.baseUrl);
    
    // Step 2: Generate intelligent tests based on page analysis
    console.log('🧠 Step 2: Generating intelligent test cases...');
    const intelligentTests = this.intelligentGenerator.generateComprehensiveTests(pageAnalyses);
    allTestCases.push(...intelligentTests);

    // Step 3: Generate AI-powered test cases
    let aiTestCases: TestCase[] = [];
    
    // Try Groq first (faster), then Gemini as fallback
    if (apiKeys?.groqKey && apiKeys.groqKey !== 'your_groq_api_key_here') {
      try {
        console.log('🤖 Step 3: Generating additional test cases using Groq AI...');
        this.groqService = new GroqService(apiKeys.groqKey);
        aiTestCases = await this.groqService.generateTestCases(analysis, ['functional', 'ui', 'accessibility', 'performance', 'security']);
      } catch (error) {
        console.log('⚠️  Groq failed, trying Gemini...');
      }
    }
    
    if (aiTestCases.length === 0 && apiKeys?.geminiKey && apiKeys.geminiKey !== 'your_gemini_api_key_here') {
      try {
        console.log('🤖 Step 3: Generating additional test cases using Gemini AI...');
        // Set the API key in environment for GeminiService
        process.env.GEMINI_API_KEY = apiKeys.geminiKey;
        this.geminiService = new GeminiService();
        aiTestCases = await this.geminiService.generateTestCases(analysis);
      } catch (error) {
        console.log('⚠️  Gemini failed, using fallback tests...');
      }
    }
    
    if (aiTestCases.length === 0) {
      console.log('🔄 Step 3: Using built-in test generation...');
      aiTestCases = this.generateBuiltInTestCases(analysis);
    }
    
    // Limit steps per test for speed
    const limitedAi = aiTestCases.map(tc => ({
      ...tc,
      steps: (tc.steps || []).slice(0, (config as any).test.maxStepsPerTest || 6)
    }));
    allTestCases.push(...limitedAi);

    // Generate comprehensive test cases for all types
    const functionalTests = this.generateFunctionalTests(analysis);
    const uiTests = this.generateUITests(analysis);
    const accessibilityTests = this.generateAccessibilityTests(analysis);
    const performanceTests = this.generatePerformanceTests(analysis);
    const securityTests = this.generateSecurityTests(analysis);
    const apiTests = this.generateApiTests(analysis);
    const crossBrowserTests = this.generateCrossBrowserTests(analysis);
    const visualRegressionTests = this.generateVisualRegressionTests(analysis);
    const e2eWorkflowTests = this.generateE2EWorkflowTests(analysis);
    const edgeCaseTests = this.generateEdgeCaseTests(analysis);
    const mobileTests = this.generateMobileTests(analysis);
    const dataDrivenTests = this.generateDataDrivenTests(analysis);
    const stressTests = this.generateStressTests(analysis);
    const loadTests = this.generateLoadTests(analysis);
    const usabilityTests = this.generateUsabilityTests(analysis);
    const compatibilityTests = this.generateCompatibilityTests(analysis);

    allTestCases.push(
      ...functionalTests,
      ...uiTests,
      ...accessibilityTests,
      ...performanceTests,
      ...securityTests,
      ...apiTests,
      ...crossBrowserTests,
      ...visualRegressionTests,
      ...e2eWorkflowTests,
      ...edgeCaseTests,
      ...mobileTests,
      ...dataDrivenTests,
      ...stressTests,
      ...loadTests,
      ...usabilityTests,
      ...compatibilityTests,
      ...this.generateGlobalGenericTests(analysis)
    );

    // Remove duplicates and limit to max test cases
    const uniqueTestCases = this.removeDuplicateTestCases(allTestCases);
    return uniqueTestCases.slice(0, config.test.maxTestCases);
  }

  async generateComprehensiveTestSuite(targetUrl: string, page: any): Promise<TestSuite> {
    console.log(`🚀 Starting comprehensive test generation for: ${targetUrl}`);
    
    try {
      // Step 1: Analyze website
      console.log('📊 Step 1: Analyzing website structure...');
      const analysis = await this.websiteAnalyzer.analyzeWebsite(targetUrl);
      console.log(`✅ Analysis completed. Found ${analysis.pages.length} pages and ${analysis.totalElements} elements.`);

      // Step 2: Generate comprehensive tests
      console.log('🤖 Step 2: Generating comprehensive test cases...');
      const testCases = await this.comprehensiveGenerator.generateComprehensiveTests(analysis, page);
      console.log(`✅ Generated ${testCases.length} comprehensive test cases`);

      // Step 3: Generate test type suggestions
      console.log('💡 Step 3: Generating test type suggestions...');
      const suggestions = this.testTypeSuggestions.getHighPrioritySuggestions();
      console.log(`✅ Generated ${suggestions.length} test type suggestions`);

      return {
        id: `comprehensive-test-suite-${Date.now()}`,
        name: `Comprehensive Test Suite for ${targetUrl}`,
        description: `Comprehensive automated testing suite for ${targetUrl} with advanced features`,
        website: targetUrl,
        testCases,
        results: [],
        analysis,
        createdAt: new Date(),
        status: 'pending',
        suggestions: suggestions.map(s => ({
          type: s.type,
          name: s.name,
          description: s.description,
          priority: s.priority,
          implementation: s.implementation
        }))
      };

    } catch (error) {
      console.error('❌ Comprehensive test generation failed:', error);
      throw error;
    }
  }

  getTestTypeSuggestions(websiteType?: string, budget?: 'low' | 'medium' | 'high'): any[] {
    if (websiteType && budget) {
      return this.testTypeSuggestions.generateTestPlan(websiteType, budget);
    } else if (websiteType) {
      return this.testTypeSuggestions.getSuggestionsForWebsite(websiteType as any);
    } else {
      return this.testTypeSuggestions.getHighPrioritySuggestions();
    }
  }

  getImplementationGuide(testType: string): string {
    return this.testTypeSuggestions.getImplementationGuide(testType);
  }

  private generateBuiltInTestCases(analysis: WebsiteAnalysis): TestCase[] {
    const fallbackTests: TestCase[] = [];
    const baseUrl = analysis.baseUrl;
    const pages = analysis.pages || [];
    const forms = analysis.forms || [];

    // Navigation tests
    pages.slice(0, 3).forEach((page: any, index: number) => {
      fallbackTests.push({
        id: `builtin_nav_${index + 1}`,
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
        id: `builtin_form_${index + 1}`,
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
        id: `builtin_button_${i}`,
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
        id: `builtin_link_${i}`,
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
        id: `builtin_ui_${index + 1}`,
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

  public generateFunctionalTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // Form submission tests
      page.forms.forEach(form => {
        const formName = form.text || form.placeholder || 'Contact Form';
        tests.push({
          id: `functional_form_${testId++}`,
          name: `📝 ${formName} Submission Test`,
          description: `Test form submission functionality on ${page.url}`,
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
              description: 'Focus on form',
              timeout: 5000,
            },
            {
              action: 'assert',
              assertion: `page.locator('${form.selector}').isVisible()`,
              description: 'Verify form is visible',
              timeout: 5000,
            }
          ],
          expectedResult: 'Form is accessible and functional',
          page: page.url,
          element: form,
        });
      });

      // Navigation tests
      page.links.forEach(link => {
        if (link.href && link.href.startsWith(analysis.baseUrl)) {
          const linkText = link.text || 'Navigation Link';
          tests.push({
            id: `functional_nav_${testId++}`,
            name: `🔗 ${linkText} Navigation Test`,
            description: `Test navigation via link: ${link.text}`,
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
                target: link.selector,
                description: `Click link: ${link.text}`,
                timeout: 5000,
              },
              {
                action: 'wait',
                timeout: 3000,
                description: 'Wait for navigation',
              }
            ],
            expectedResult: 'Navigation works correctly',
            page: page.url,
            element: link,
          });
        }
      });
    });

    return tests;
  }

  public generateUITests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // Element visibility tests
      page.elements.forEach(element => {
        tests.push({
          id: `ui_visibility_${testId++}`,
          name: `Element Visibility Test - ${element.type}`,
          description: `Test visibility of ${element.type} element`,
          type: 'ui',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: `page.locator('${element.selector}').isVisible()`,
              description: `Verify ${element.type} is visible`,
              timeout: 5000,
            }
          ],
          expectedResult: 'Element is visible and accessible',
          page: page.url,
          element,
        });
      });

      // Responsive design tests
      tests.push({
        id: `ui_responsive_${testId++}`,
        name: `Responsive Design Test - ${page.title}`,
        description: `Test responsive design on different screen sizes`,
        type: 'ui',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.viewportSize().width >= 320',
            description: 'Verify mobile compatibility',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page is responsive and mobile-friendly',
        page: page.url,
      });
    });

    return tests;
  }

  public generateAccessibilityTests(analysis: WebsiteAnalysis): TestCase[] {
    if (!config.test.includeAccessibility) return [];

    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // ARIA labels test
      tests.push({
        id: `a11y_aria_${testId++}`,
        name: `ARIA Labels Test - ${page.title}`,
        description: `Test ARIA labels and accessibility attributes`,
        type: 'accessibility',
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
            assertion: 'page.locator(\'[aria-label]\').count() > 0 || page.locator(\'[aria-labelledby]\').count() > 0',
            description: 'Check for ARIA labels',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page has proper ARIA labels for accessibility',
        page: page.url,
      });

      // Alt text for images
      page.images.forEach(image => {
        tests.push({
          id: `a11y_alt_${testId++}`,
          name: `Image Alt Text Test`,
          description: `Test alt text for images`,
          type: 'accessibility',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: `page.locator('${image.selector}').getAttribute('alt') !== null`,
              description: 'Check for alt text',
              timeout: 5000,
          }
          ],
          expectedResult: 'Images have proper alt text',
          page: page.url,
          element: image,
        });
      });
    });

    return tests;
  }

  public generatePerformanceTests(analysis: WebsiteAnalysis): TestCase[] {
    if (!config.test.includePerformance) return [];

    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `perf_load_${testId++}`,
        name: `Page Load Performance - ${page.title}`,
        description: `Test page load performance`,
        type: 'performance',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'performance.now() < 5000',
            description: 'Check load time is under 5 seconds',
            timeout: 10000,
          }
        ],
        expectedResult: 'Page loads within acceptable time limits',
        page: page.url,
      });
    });

    return tests;
  }

  public generateSecurityTests(analysis: WebsiteAnalysis): TestCase[] {
    if (!config.test.includeSecurity) return [];

    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // XSS prevention test
      page.forms.forEach(form => {
        tests.push({
          id: `sec_xss_${testId++}`,
          name: `XSS Prevention Test - ${page.title}`,
          description: `Test XSS prevention in forms`,
          type: 'security',
          priority: 'high',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'type',
              target: form.selector + ' input[type="text"]:first-of-type',
              value: '<script>alert("xss")</script>',
              description: 'Input XSS payload',
              timeout: 5000,
            },
            {
              action: 'assert',
              assertion: '!page.content().includes("<script>")',
              description: 'Verify XSS is prevented',
              timeout: 5000,
            }
          ],
          expectedResult: 'XSS attacks are prevented',
          page: page.url,
          element: form,
        });
      });
    });

    return tests;
  }

  private removeDuplicateTestCases(testCases: TestCase[]): TestCase[] {
    const seen = new Set<string>();
    return testCases.filter(testCase => {
      const key = `${testCase.name}-${testCase.page}-${testCase.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  public generateApiTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    // Generate API tests for discovered endpoints
    if (analysis.apis && analysis.apis.length > 0) {
      analysis.apis.forEach(api => {
        tests.push({
          id: `api_${testId++}`,
          name: `API Test - ${api.method} ${api.url}`,
          description: `Test API endpoint: ${api.method} ${api.url}`,
          type: 'api',
          priority: 'high',
          steps: [
            {
              action: 'api-call',
              method: api.method,
              target: api.url,
              headers: api.headers || {},
              expectedStatus: api.statusCode || 200,
              description: `Call ${api.method} ${api.url}`,
              timeout: 10000,
            },
            {
              action: 'assert',
              assertion: 'response.status === expectedStatus',
              description: 'Verify API response status',
              timeout: 5000,
            }
          ],
          expectedResult: 'API endpoint responds correctly',
          page: api.url,
          tags: ['api', 'endpoint'],
        });
      });
    }

    // Generate API integration tests
    analysis.pages.forEach(page => {
      if (page.url.includes('/api/') || page.url.includes('/rest/')) {
        tests.push({
          id: `api_integration_${testId++}`,
          name: `API Integration Test - ${page.title}`,
          description: `Test API integration on ${page.url}`,
          type: 'api',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to API endpoint: ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: 'typeof page.status === "function" ? page.status() === 200 : true',
              description: 'Verify API endpoint is accessible',
              timeout: 5000,
            }
          ],
          expectedResult: 'API integration works correctly',
          page: page.url,
          tags: ['api', 'integration'],
        });
      }
    });

    return tests;
  }

  public generateCrossBrowserTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;
    const browsers = ['chromium', 'firefox', 'webkit'];

    browsers.forEach(browser => {
      analysis.pages.forEach(page => {
        tests.push({
          id: `cross_browser_${testId++}`,
          name: `Cross-Browser Test - ${browser} - ${page.title}`,
          description: `Test page compatibility across ${browser} browser`,
          type: 'cross-browser',
          priority: 'medium',
          browser: [browser],
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url} in ${browser}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: 'page.title() !== ""',
              description: 'Verify page loads correctly',
              timeout: 5000,
            }
          ],
          expectedResult: `Page works correctly in ${browser}`,
          page: page.url,
          tags: ['cross-browser', browser],
        });
      });
    });

    return tests;
  }

  public generateVisualRegressionTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `visual_regression_${testId++}`,
        name: `Visual Regression Test - ${page.title}`,
        description: `Test visual consistency of ${page.title}`,
        type: 'visual-regression',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'screenshot',
            target: 'fullpage',
            description: 'Capture full page screenshot',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'screenshot matches baseline',
            description: 'Compare with baseline image',
            timeout: 5000,
            threshold: 0.1,
          }
        ],
        expectedResult: 'Visual appearance matches baseline',
        page: page.url,
        tags: ['visual', 'regression'],
      });
    });

    return tests;
  }

  public generateE2EWorkflowTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    // Generate user workflow tests
    if (analysis.userFlows && analysis.userFlows.length > 0) {
      analysis.userFlows.forEach(flow => {
        const steps = flow.steps.map(step => ({
          action: step.action as any,
          target: step.page,
          description: step.action,
          timeout: 10000,
        }));

        tests.push({
          id: `e2e_workflow_${testId++}`,
          name: `E2E Workflow - ${flow.name}`,
          description: `Test complete user workflow: ${flow.description}`,
          type: 'e2e-workflow',
          priority: flow.priority,
          steps,
          expectedResult: 'Complete workflow executes successfully',
          page: flow.steps[0]?.page || analysis.baseUrl,
          tags: ['e2e', 'workflow', flow.userType],
          category: 'user-journey',
        });
      });
    }

    // Generate critical path tests
    if (analysis.criticalPaths && analysis.criticalPaths.length > 0) {
      analysis.criticalPaths.forEach(path => {
        const steps = path.pages.map(page => ({
          action: 'navigate' as any,
          target: page,
          description: `Navigate to ${page}`,
          timeout: 10000,
        }));

        tests.push({
          id: `critical_path_${testId++}`,
          name: `Critical Path - ${path.name}`,
          description: `Test critical business path: ${path.description}`,
          type: 'e2e-workflow',
          priority: path.businessImpact === 'high' ? 'high' : 'medium',
          steps,
          expectedResult: 'Critical path functions correctly',
          page: path.pages[0],
          tags: ['critical-path', 'business-critical'],
          category: 'business-flow',
        });
      });
    }

    return tests;
  }

  public generateEdgeCaseTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // Boundary value testing
      page.forms.forEach(form => {
        tests.push({
          id: `edge_case_boundary_${testId++}`,
          name: `Boundary Value Test - ${form.type}`,
          description: `Test boundary values in form inputs`,
          type: 'edge-case',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'type',
              target: form.selector + ' input[type="text"]:first-of-type',
              value: 'a'.repeat(1000), // Very long input
              description: 'Test maximum input length',
              timeout: 5000,
            },
            {
              action: 'assert',
              assertion: 'input.value.length <= maxLength',
              description: 'Verify input length validation',
              timeout: 5000,
            }
          ],
          expectedResult: 'Form handles boundary values correctly',
          page: page.url,
          element: form,
          tags: ['edge-case', 'boundary', 'validation'],
        });
      });

      // Error handling tests
      tests.push({
        id: `edge_case_error_${testId++}`,
        name: `Error Handling Test - ${page.title}`,
        description: `Test error handling and recovery`,
        type: 'edge-case',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'network-throttle',
            network: 'offline',
            description: 'Simulate network failure',
            timeout: 2000,
          },
          {
            action: 'assert',
            assertion: 'page.locator(\'[data-testid="error-message"]\').isVisible()',
            description: 'Verify error message is displayed',
            timeout: 5000,
          }
        ],
        expectedResult: 'Application handles errors gracefully',
        page: page.url,
        tags: ['edge-case', 'error-handling', 'resilience'],
      });
    });

    return tests;
  }

  // New: Global generic tests applicable to any website
  public generateGlobalGenericTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    // Home page loads without console errors
    tests.push({
      id: `global_console_${testId++}`,
      name: 'No Console Errors on Home',
      description: 'Home page should load without console errors',
      type: 'functional',
      priority: 'high',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: 'window.__consoleErrorsCount__ === 0', description: 'No console errors', timeout: 5000 }
      ],
      expectedResult: 'Zero console errors after page load',
      page: analysis.baseUrl,
      tags: ['global', 'console']
    });

    // Presence of title and h1
    tests.push({
      id: `global_headings_${testId++}`,
      name: 'Has Title and H1',
      description: 'Page should have a non-empty <title> and at least one H1',
      type: 'seo',
      priority: 'medium',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: 'document.title.trim().length > 0', description: 'Title not empty', timeout: 5000 },
        { action: 'assert', assertion: 'document.querySelectorAll("h1").length > 0', description: 'At least one H1 exists', timeout: 5000 }
      ],
      expectedResult: 'Title and H1 present',
      page: analysis.baseUrl,
      tags: ['global', 'seo']
    });

    // Main navigation has links
    tests.push({
      id: `global_nav_${testId++}`,
      name: 'Main Navigation Links',
      description: 'Navigation should contain at least one link',
      type: 'ui',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: `document.querySelectorAll("nav a, [role='navigation'] a").length > 0`, description: 'Nav has links', timeout: 5000 }
      ],
      expectedResult: 'Navigation has at least one link',
      page: analysis.baseUrl,
      tags: ['global', 'navigation']
    });

    // Favicon present
    tests.push({
      id: `global_favicon_${testId++}`,
      name: 'Favicon Present',
      description: 'Page should have a favicon link',
      type: 'seo',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: 'document.querySelector("link[rel~=icon]") !== null', description: 'Favicon link exists', timeout: 5000 }
      ],
      expectedResult: 'Favicon is configured',
      page: analysis.baseUrl,
      tags: ['global', 'seo']
    });

    // Meta description present
    tests.push({
      id: `global_meta_desc_${testId++}`,
      name: 'Meta Description Present',
      description: 'Page should have a non-empty meta description',
      type: 'seo',
      priority: 'medium',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: `!!(document.querySelector("meta[name='description']") && (document.querySelector("meta[name='description']") as any).content.trim().length > 0)`, description: 'Description meta exists and non-empty', timeout: 5000 }
      ],
      expectedResult: 'Meta description exists and is non-empty',
      page: analysis.baseUrl,
      tags: ['global', 'seo']
    });

    // Viewport meta for mobile
    tests.push({
      id: `global_meta_viewport_${testId++}`,
      name: 'Viewport Meta Present',
      description: 'Page should include a viewport meta tag for responsive design',
      type: 'mobile',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: `document.querySelector("meta[name='viewport']") !== null`, description: 'Viewport meta exists', timeout: 5000 }
      ],
      expectedResult: 'Viewport meta is present',
      page: analysis.baseUrl,
      tags: ['global', 'responsive']
    });

    // Language attribute present on <html>
    tests.push({
      id: `global_lang_${testId++}`,
      name: 'HTML lang Attribute Present',
      description: 'Root HTML element should declare a language',
      type: 'accessibility',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: '!!document.documentElement.getAttribute("lang") && document.documentElement.getAttribute("lang").trim().length > 0', description: 'lang attribute exists and non-empty', timeout: 5000 }
      ],
      expectedResult: '<html> has a non-empty lang attribute',
      page: analysis.baseUrl,
      tags: ['global', 'a11y']
    });

    // There is at least one anchor link on the page
    tests.push({
      id: `global_links_${testId++}`,
      name: 'Has At Least One Link',
      description: 'Page should contain anchor links',
      type: 'functional',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: 'document.querySelectorAll("a").length > 0', description: 'At least one link exists', timeout: 5000 }
      ],
      expectedResult: 'Links are present on the page',
      page: analysis.baseUrl,
      tags: ['global']
    });

    // No obviously broken images (zero-width/height or not complete)
    tests.push({
      id: `global_images_${testId++}`,
      name: 'No Broken Images',
      description: 'Images should be loaded without errors',
      type: 'ui',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'assert', assertion: 'Array.from(document.images).filter(img => !(img as any).complete || (img as any).naturalWidth === 0).length === 0', description: 'No broken images', timeout: 5000 }
      ],
      expectedResult: 'All images load correctly',
      page: analysis.baseUrl,
      tags: ['global', 'ui']
    });

    // Basic scroll works
    tests.push({
      id: `global_scroll_${testId++}`,
      name: 'Page Scroll Works',
      description: 'User should be able to scroll the page',
      type: 'usability',
      priority: 'low',
      steps: [
        { action: 'navigate', target: analysis.baseUrl, description: `Navigate to ${analysis.baseUrl}`, timeout: 30000 },
        { action: 'scroll', description: 'Scroll to bottom' },
        { action: 'assert', assertion: 'window.scrollY > 0', description: 'Scrolled vertically', timeout: 5000 }
      ],
      expectedResult: 'Page scrolls as expected',
      page: analysis.baseUrl,
      tags: ['global', 'usability']
    });

    return tests;
  }

  public generateMobileTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } }
    ];

    devices.forEach(device => {
      analysis.pages.forEach(page => {
        tests.push({
          id: `mobile_${testId++}`,
          name: `Mobile Test - ${device.name} - ${page.title}`,
          description: `Test mobile compatibility on ${device.name}`,
          type: 'mobile',
          priority: 'high',
          device: [device.name],
          viewport: device.viewport,
          steps: [
            {
              action: 'emulate-device',
              device: device.name,
              viewport: device.viewport,
              description: `Emulate ${device.name}`,
              timeout: 2000,
            },
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: 'page.viewportSize().width === device.viewport.width',
              description: 'Verify mobile viewport',
              timeout: 5000,
            }
          ],
          expectedResult: `Page works correctly on ${device.name}`,
          page: page.url,
          tags: ['mobile', device.name.toLowerCase().replace(/\s+/g, '-')],
        });
      });
    });

    return tests;
  }

  public generateDataDrivenTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    // Generate data-driven tests for forms
    analysis.pages.forEach(page => {
      page.forms.forEach(form => {
        const testData = [
          { username: 'validuser@example.com', password: 'ValidPass123!' },
          { username: 'invalid-email', password: 'short' },
          { username: '', password: '' },
          { username: 'test@test.com', password: 'Test123!' }
        ];

        testData.forEach((data, index) => {
          tests.push({
            id: `data_driven_${testId++}`,
            name: `Data-Driven Test - ${form.type} - Dataset ${index + 1}`,
            description: `Test form with different data sets`,
            type: 'data-driven',
            priority: 'medium',
            testData: [data],
            steps: [
              {
                action: 'navigate',
                target: page.url,
                description: `Navigate to ${page.url}`,
                timeout: 30000,
              },
              {
                action: 'type',
                target: form.selector + ' input[type="email"], input[name="username"]',
                value: data.username,
                description: 'Enter username/email',
                timeout: 5000,
              },
              {
                action: 'type',
                target: form.selector + ' input[type="password"]',
                value: data.password,
                description: 'Enter password',
                timeout: 5000,
              },
              {
                action: 'click',
                target: form.selector + ' button[type="submit"], input[type="submit"]',
                description: 'Submit form',
                timeout: 5000,
              }
            ],
            expectedResult: 'Form validation works correctly for all data sets',
            page: page.url,
            element: form,
            tags: ['data-driven', 'form-validation'],
          });
        });
      });
    });

    return tests;
  }

  public generateStressTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `stress_${testId++}`,
        name: `Stress Test - ${page.title}`,
        description: `Test application under stress conditions`,
        type: 'stress',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'network-throttle',
            network: 'slow-3g',
            description: 'Simulate slow network',
            timeout: 2000,
          },
          {
            action: 'click',
            target: 'body',
            description: 'Rapid clicking to simulate stress',
            timeout: 1000,
            retries: 10,
          },
          {
            action: 'assert',
            assertion: 'page.isVisible()',
            description: 'Verify page remains stable',
            timeout: 5000,
          }
        ],
        expectedResult: 'Application remains stable under stress',
        page: page.url,
        tags: ['stress', 'performance', 'stability'],
      });
    });

    return tests;
  }

  public generateLoadTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `load_${testId++}`,
        name: `Load Test - ${page.title}`,
        description: `Test page load performance under load`,
        type: 'load',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'wait',
            timeout: 1000,
            description: 'Wait for page to stabilize',
          },
          {
            action: 'assert',
            assertion: 'performance.now() < 3000',
            description: 'Verify load time is acceptable',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page loads within acceptable time limits',
        page: page.url,
        tags: ['load', 'performance', 'speed'],
      });
    });

    return tests;
  }

  public generateUsabilityTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `usability_${testId++}`,
        name: `Usability Test - ${page.title}`,
        description: `Test user experience and usability`,
        type: 'usability',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.locator(\'h1, h2, h3\').count() > 0',
            description: 'Verify proper heading structure',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator(\'nav, [role="navigation"]\').count() > 0',
            description: 'Verify navigation is present',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page follows usability best practices',
        page: page.url,
        tags: ['usability', 'ux', 'user-experience'],
      });
    });

    return tests;
  }

  public generateCompatibilityTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      tests.push({
        id: `compatibility_${testId++}`,
        name: `Compatibility Test - ${page.title}`,
        description: `Test browser and device compatibility`,
        type: 'compatibility',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.locator(\'script\').count() >= 0',
            description: 'Verify JavaScript compatibility',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator(\'link[rel="stylesheet"]\').count() >= 0',
            description: 'Verify CSS compatibility',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page is compatible across different environments',
        page: page.url,
        tags: ['compatibility', 'cross-platform'],
      });
    });

    return tests;
  }

  public generateTestSuiteId(): string {
    return `test_suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

