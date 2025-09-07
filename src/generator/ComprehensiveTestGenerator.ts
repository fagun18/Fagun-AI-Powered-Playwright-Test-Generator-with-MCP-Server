import { TestCase, TestStep, WebsiteAnalysis } from '../types';
import { GrammarChecker, GrammarCheckResult } from '../analyzer/GrammarChecker';
import { SEOTester, SEOTestResult } from '../analyzer/SEOTester';
import { ButtonFormTester, ButtonTestResult, FormTestResult, APITestResult } from '../analyzer/ButtonFormTester';
import { URLTester, URLTestResult } from '../analyzer/URLTester';
import { Page } from 'playwright';
import config from '../config';

export class ComprehensiveTestGenerator {
  private grammarChecker: GrammarChecker;
  private seoTester: SEOTester;
  private buttonFormTester: ButtonFormTester;
  private urlTester: URLTester;

  constructor() {
    this.grammarChecker = new GrammarChecker();
    this.seoTester = new SEOTester();
    this.buttonFormTester = new ButtonFormTester();
    this.urlTester = new URLTester('');
  }

  async generateComprehensiveTests(analysis: WebsiteAnalysis, page: Page | null): Promise<TestCase[]> {
    const allTests: TestCase[] = [];
    let testId = 1;

    // Set base URL for URL testing
    this.urlTester = new URLTester(analysis.baseUrl);

    // 1. Grammar and Content Quality Tests
    console.log('📝 Generating grammar and content quality tests...');
    const grammarTests = await this.generateGrammarTests(analysis, page, testId);
    allTests.push(...grammarTests);
    testId += grammarTests.length;

    // 2. SEO Tests
    console.log('🔍 Generating SEO tests...');
    const seoTests = await this.generateSEOTests(analysis, page, testId);
    allTests.push(...seoTests);
    testId += seoTests.length;

    // 3. Button Clickability Tests
    console.log('🔘 Generating button clickability tests...');
    const buttonTests = await this.generateButtonTests(analysis, page, testId);
    allTests.push(...buttonTests);
    testId += buttonTests.length;

    // 4. Form Submission and API Tests
    console.log('📋 Generating form and API tests...');
    const formTests = await this.generateFormTests(analysis, page, testId);
    allTests.push(...formTests);
    testId += formTests.length;

    // 5. URL and Link Tests
    console.log('🔗 Generating URL and link tests...');
    const urlTests = await this.generateURLTests(analysis, page, testId);
    allTests.push(...urlTests);
    testId += urlTests.length;

    // 6. Performance Tests
    console.log('⚡ Generating performance tests...');
    const performanceTests = await this.generatePerformanceTests(analysis, page, testId);
    allTests.push(...performanceTests);
    testId += performanceTests.length;

    // 7. Accessibility Tests
    console.log('♿ Generating accessibility tests...');
    const accessibilityTests = await this.generateAccessibilityTests(analysis, page, testId);
    allTests.push(...accessibilityTests);
    testId += accessibilityTests.length;

    // 8. Security Tests
    console.log('🔒 Generating security tests...');
    const securityTests = await this.generateSecurityTests(analysis, page, testId);
    allTests.push(...securityTests);
    testId += securityTests.length;

    return allTests;
  }

  private async generateGrammarTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    // Test grammar on each page
    for (const pageInfo of analysis.pages) {
      let content = '';
      if (page) {
        try {
          content = await page.evaluate(() => document.body.textContent || '');
        } catch (err) {
          content = pageInfo.title; // Fallback to page title
        }
      } else {
        content = pageInfo.title; // Fallback to page title
      }
      
      const grammarResult = await this.grammarChecker.checkText(content, pageInfo.title);

      if (grammarResult.errors.length > 0) {
        tests.push({
          id: `grammar_${testId++}`,
          name: `📝 Grammar Check - ${pageInfo.title}`,
          description: `Check for grammatical errors on ${pageInfo.url}`,
          type: 'content-quality',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: pageInfo.url,
              description: `Navigate to ${pageInfo.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: `grammarErrors.length === 0`,
              description: 'Verify no grammatical errors found',
              timeout: 5000,
            }
          ],
          expectedResult: 'No grammatical errors found',
          page: pageInfo.url,
          data: {
            grammarScore: grammarResult.score,
            errors: grammarResult.errors,
            suggestions: grammarResult.suggestions
          }
        });
      }
    }

    return tests;
  }

  private async generateSEOTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    for (const pageInfo of analysis.pages) {
      if (!page) continue; // Skip SEO tests if no page available
      const seoResult = await this.seoTester.testPage(page, pageInfo.url);

      // SEO Score Test
      tests.push({
        id: `seo_score_${testId++}`,
        name: `🔍 SEO Score Test - ${pageInfo.title}`,
        description: `Check SEO score for ${pageInfo.url}`,
        type: 'seo',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `seoScore >= 70`,
            description: 'Verify SEO score is at least 70',
            timeout: 5000,
          }
        ],
        expectedResult: 'SEO score is 70 or higher',
        page: pageInfo.url,
        data: {
          seoScore: seoResult.score,
          issues: seoResult.issues,
          metrics: seoResult.metrics
        }
      });

      // Meta Tags Test
      if (seoResult.issues.some(issue => issue.category === 'meta')) {
        tests.push({
          id: `seo_meta_${testId++}`,
          name: `🏷️ Meta Tags Test - ${pageInfo.title}`,
          description: `Check meta tags for ${pageInfo.url}`,
          type: 'seo',
          priority: 'high',
          steps: [
            {
              action: 'navigate',
              target: pageInfo.url,
              description: `Navigate to ${pageInfo.url}`,
              timeout: 30000,
            },
            {
              action: 'assert',
              assertion: `document.querySelector('title') !== null`,
              description: 'Verify title tag exists',
              timeout: 5000,
            },
            {
              action: 'assert',
              assertion: `document.querySelector('meta[name="description"]') !== null`,
              description: 'Verify meta description exists',
              timeout: 5000,
            }
          ],
          expectedResult: 'All required meta tags are present',
          page: pageInfo.url
        });
      }
    }

    return tests;
  }

  private async generateButtonTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    if (!page) return tests; // Skip if no page available
    const buttonResults = await this.buttonFormTester.testAllButtons(page);

    for (const buttonResult of buttonResults) {
      if (!buttonResult.isClickable) {
        tests.push({
          id: `button_click_${testId++}`,
          name: `🔘 Button Click Test - ${buttonResult.text || 'Unnamed Button'}`,
          description: `Test if button is clickable: ${buttonResult.text}`,
          type: 'ui',
          priority: 'high',
          steps: [
            {
              action: 'click',
              target: buttonResult.selector,
              description: `Click on button: ${buttonResult.text}`,
              timeout: 5000,
            },
            {
              action: 'assert',
              assertion: `buttonClicked === true`,
              description: 'Verify button click was successful',
              timeout: 2000,
            }
          ],
          expectedResult: 'Button is clickable and responds correctly',
          page: analysis.baseUrl,
          data: {
            buttonText: buttonResult.text,
            isClickable: buttonResult.isClickable,
            error: buttonResult.error
          }
        });
      }
    }

    return tests;
  }

  private async generateFormTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    if (!page) return tests; // Skip if no page available
    const formResults = await this.buttonFormTester.testAllForms(page);

    for (const formResult of formResults) {
      // Form Submission Test
      tests.push({
        id: `form_submit_${testId++}`,
        name: `📋 Form Submission Test - ${formResult.action || 'Contact Form'}`,
        description: `Test form submission: ${formResult.action}`,
        type: 'functional',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: analysis.baseUrl,
            description: `Navigate to ${analysis.baseUrl}`,
            timeout: 30000,
          },
          {
            action: 'click',
            target: formResult.selector,
            description: `Click on form: ${formResult.action}`,
            timeout: 5000,
          },
          {
            action: 'type',
            target: 'input[type="email"]',
            value: 'test@example.com',
            description: 'Fill email field',
            timeout: 2000,
          },
          {
            action: 'click',
            target: 'input[type="submit"], button[type="submit"]',
            description: 'Submit form',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: `formSubmitted === true`,
            description: 'Verify form submission was successful',
            timeout: 10000,
          }
        ],
        expectedResult: 'Form submits successfully with proper validation',
        page: analysis.baseUrl,
        data: {
          formAction: formResult.action,
          submissionResult: formResult.submissionResult,
          validationErrors: formResult.validationErrors
        }
      });

      // API Response Test
      if (formResult.submissionResult.statusCode) {
        tests.push({
          id: `api_response_${testId++}`,
          name: `🔌 API Response Test - ${formResult.action}`,
          description: `Test API response for form: ${formResult.action}`,
          type: 'api',
          priority: 'high',
          steps: [
            {
              action: 'api-call',
              method: formResult.method as any,
              target: formResult.action,
              description: `Make ${formResult.method} request to ${formResult.action}`,
              timeout: 10000,
            },
            {
              action: 'assert',
              assertion: `response.status >= 200 && response.status < 400`,
              description: 'Verify API response is successful',
              timeout: 5000,
            }
          ],
          expectedResult: 'API responds with success status code',
          page: formResult.action,
          data: {
            statusCode: formResult.submissionResult.statusCode,
            responseTime: formResult.submissionResult.responseTime
          }
        });
      }
    }

    return tests;
  }

  private async generateURLTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    if (!page) return tests; // Skip if no page available
    const urlResults = await this.urlTester.testAllUrls(page);
    const brokenUrls = urlResults.filter(r => r.isBroken);

    for (const brokenUrl of brokenUrls) {
      tests.push({
        id: `url_broken_${testId++}`,
        name: `🔗 Broken URL Test - ${brokenUrl.url}`,
        description: `Test if URL is accessible: ${brokenUrl.url}`,
        type: 'functional',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: brokenUrl.url,
            description: `Navigate to ${brokenUrl.url}`,
            timeout: 10000,
          },
          {
            action: 'assert',
            assertion: `page.statusCode < 400`,
            description: 'Verify URL is accessible',
            timeout: 5000,
          }
        ],
        expectedResult: 'URL is accessible and returns valid response',
        page: brokenUrl.url,
        data: {
          statusCode: brokenUrl.statusCode,
          error: brokenUrl.error,
          issues: brokenUrl.issues
        }
      });
    }

    return tests;
  }

  private async generatePerformanceTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    for (const pageInfo of analysis.pages) {
      tests.push({
        id: `performance_load_${testId++}`,
        name: `⚡ Page Load Performance - ${pageInfo.title}`,
        description: `Test page load performance for ${pageInfo.url}`,
        type: 'performance',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `performance.timing.loadEventEnd - performance.timing.navigationStart < 3000`,
            description: 'Verify page loads within 3 seconds',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page loads within acceptable time limits',
        page: pageInfo.url
      });
    }

    return tests;
  }

  private async generateAccessibilityTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    for (const pageInfo of analysis.pages) {
      tests.push({
        id: `accessibility_images_${testId++}`,
        name: `♿ Image Alt Text Test - ${pageInfo.title}`,
        description: `Check image alt text for accessibility on ${pageInfo.url}`,
        type: 'accessibility',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `document.querySelectorAll('img:not([alt])').length === 0`,
            description: 'Verify all images have alt text',
            timeout: 5000,
          }
        ],
        expectedResult: 'All images have proper alt text for accessibility',
        page: pageInfo.url
      });

      tests.push({
        id: `accessibility_headings_${testId++}`,
        name: `♿ Heading Structure Test - ${pageInfo.title}`,
        description: `Check heading structure for accessibility on ${pageInfo.url}`,
        type: 'accessibility',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `document.querySelectorAll('h1').length === 1`,
            description: 'Verify page has exactly one H1 tag',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page has proper heading structure for accessibility',
        page: pageInfo.url
      });
    }

    return tests;
  }

  private async generateSecurityTests(analysis: WebsiteAnalysis, page: Page | null, startId: number): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    let testId = startId;

    for (const pageInfo of analysis.pages) {
      tests.push({
        id: `security_https_${testId++}`,
        name: `🔒 HTTPS Security Test - ${pageInfo.title}`,
        description: `Check HTTPS security for ${pageInfo.url}`,
        type: 'security',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `location.protocol === 'https:'`,
            description: 'Verify page uses HTTPS',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page uses secure HTTPS protocol',
        page: pageInfo.url
      });

      tests.push({
        id: `security_forms_${testId++}`,
        name: `🔒 Form Security Test - ${pageInfo.title}`,
        description: `Check form security for ${pageInfo.url}`,
        type: 'security',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: pageInfo.url,
            description: `Navigate to ${pageInfo.url}`,
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: `document.querySelectorAll('form:not([action^="https"])').length === 0`,
            description: 'Verify all forms use HTTPS',
            timeout: 5000,
          }
        ],
        expectedResult: 'All forms use secure HTTPS protocol',
        page: pageInfo.url
      });
    }

    return tests;
  }
}
