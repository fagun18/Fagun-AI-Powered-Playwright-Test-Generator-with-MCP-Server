import { WebsiteAnalysis, TestCase, TestSuite } from '../types';
import { GeminiService } from '../ai/GeminiService';
import { WebsiteAnalyzer } from '../analyzer/WebsiteAnalyzer';
import config from '../config';

export class TestGenerator {
  private geminiService: GeminiService;
  private websiteAnalyzer: WebsiteAnalyzer;

  constructor() {
    this.geminiService = new GeminiService();
    this.websiteAnalyzer = new WebsiteAnalyzer();
  }

  async generateTestSuite(targetUrl: string): Promise<TestSuite> {
    console.log(`🚀 Starting automated test generation for: ${targetUrl}`);
    
    try {
      // Step 1: Analyze the website
      console.log('📊 Step 1: Analyzing website structure...');
      const analysis = await this.websiteAnalyzer.analyzeWebsite(targetUrl);
      
      // Step 2: Generate test cases using AI
      console.log('🤖 Step 2: Generating test cases with AI...');
      const testCases = await this.generateComprehensiveTestCases(analysis);
      
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
      };

      console.log(`✅ Test suite generated successfully with ${testCases.length} test cases`);
      return testSuite;

    } catch (error) {
      console.error('❌ Error generating test suite:', error);
      throw error;
    }
  }

  private async generateComprehensiveTestCases(analysis: WebsiteAnalysis): Promise<TestCase[]> {
    const allTestCases: TestCase[] = [];

    // Generate AI-powered test cases
    const aiTestCases = await this.geminiService.generateTestCases(analysis);
    // Limit steps per test for speed
    const limitedAi = aiTestCases.map(tc => ({
      ...tc,
      steps: (tc.steps || []).slice(0, (config as any).test.maxStepsPerTest || 6)
    }));
    allTestCases.push(...limitedAi);

    // Generate additional specialized test cases
    const functionalTests = this.generateFunctionalTests(analysis);
    const uiTests = this.generateUITests(analysis);
    const accessibilityTests = this.generateAccessibilityTests(analysis);
    const performanceTests = this.generatePerformanceTests(analysis);
    const securityTests = this.generateSecurityTests(analysis);

    allTestCases.push(
      ...functionalTests,
      ...uiTests,
      ...accessibilityTests,
      ...performanceTests,
      ...securityTests
    );

    // Remove duplicates and limit to max test cases
    const uniqueTestCases = this.removeDuplicateTestCases(allTestCases);
    return uniqueTestCases.slice(0, config.test.maxTestCases);
  }

  private generateFunctionalTests(analysis: WebsiteAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    let testId = 1;

    analysis.pages.forEach(page => {
      // Form submission tests
      page.forms.forEach(form => {
        tests.push({
          id: `func_form_${testId++}`,
          name: `Form Submission Test - ${page.title}`,
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
          tests.push({
            id: `func_nav_${testId++}`,
            name: `Navigation Test - ${link.text || 'Link'}`,
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

  private generateUITests(analysis: WebsiteAnalysis): TestCase[] {
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

  private generateAccessibilityTests(analysis: WebsiteAnalysis): TestCase[] {
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

  private generatePerformanceTests(analysis: WebsiteAnalysis): TestCase[] {
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

  private generateSecurityTests(analysis: WebsiteAnalysis): TestCase[] {
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

  private generateTestSuiteId(): string {
    return `test_suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

