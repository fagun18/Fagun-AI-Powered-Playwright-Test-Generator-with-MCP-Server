import { TestCase, TestStep, WebsiteElement } from '../types';
import { PageAnalysis, FormField } from '../analyzer/EnhancedPageAnalyzer';

export class IntelligentTestGenerator {
  generateComprehensiveTests(pageAnalysis: PageAnalysis[]): TestCase[] {
    const allTests: TestCase[] = [];

    pageAnalysis.forEach(page => {
      // Generate page-level tests
      allTests.push(...this.generatePageTests(page));
      
      // Generate form-specific tests
      if (page.hasContactForm) {
        allTests.push(...this.generateFormTests(page));
      }
      
      // Generate button tests
      allTests.push(...this.generateButtonTests(page));
      
      // Generate link tests
      allTests.push(...this.generateLinkTests(page));
      
      // Generate validation tests
      allTests.push(...this.generateValidationTests(page));
      
      // Generate new advanced test types
      allTests.push(...this.generatePerformanceTests(page));
      allTests.push(...this.generateSecurityTests(page));
      allTests.push(...this.generateAccessibilityTests(page));
      allTests.push(...this.generateMobileTests(page));
      allTests.push(...this.generateAPITests(page));
      allTests.push(...this.generateVisualRegressionTests(page));
      allTests.push(...this.generateEdgeCaseTests(page));
      allTests.push(...this.generateDataDrivenTests(page));
    });

    return allTests;
  }

  private generatePageTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    // URL validation test
    tests.push({
      id: `url_validation_${this.getPageId(page.url)}`,
      name: `🔗 URL Validation - ${page.title}`,
      description: `Validate URL structure and standards for ${page.url}`,
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
          target: 'url',
          assertion: 'equals',
          value: page.url,
          description: 'Verify URL is correct'
        }
      ],
      expectedResult: 'URL loads correctly and follows standards',
      page: page.url,
      data: { urlIssues: page.urlIssues }
    });

    // Page title test
    tests.push({
      id: `title_validation_${this.getPageId(page.url)}`,
      name: `📄 Page Title Validation - ${page.title}`,
      description: `Validate page title for ${page.url}`,
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
          value: page.title,
          description: 'Verify page title is present'
        }
      ],
      expectedResult: 'Page title is present and meaningful',
      page: page.url,
      data: { seoIssues: page.seoIssues }
    });

    // Grammar check test
    if (page.grammarErrors.length > 0) {
      tests.push({
        id: `grammar_check_${this.getPageId(page.url)}`,
        name: `📝 Grammar Check - ${page.title}`,
        description: `Check for grammatical errors on ${page.url}`,
        type: 'content-quality',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'evaluate',
            script: 'document.body.textContent',
            description: 'Extract page text for analysis'
          }
        ],
        expectedResult: 'No grammatical errors found',
        page: page.url,
        data: { grammarErrors: page.grammarErrors }
      });
    }

    return tests;
  }

  private generateFormTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    page.formFields.forEach((field, index) => {
      // Valid input test
      tests.push({
        id: `form_valid_${this.getPageId(page.url)}_${field.name}_${index}`,
        name: `✅ Valid ${field.name} Input Test`,
        description: `Test valid input for ${field.name} field on ${page.url}`,
        type: 'functional',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'click',
            target: 'form',
            description: 'Click on form to focus'
          },
          {
            action: 'type',
            target: field.selector,
            value: this.getValidTestData(field.type),
            description: `Enter valid ${field.name}`
          },
          {
            action: 'assert',
            target: field.selector,
            assertion: 'hasValue',
            value: this.getValidTestData(field.type),
            description: `Verify ${field.name} has correct value`
          }
        ],
        expectedResult: `${field.name} accepts valid input`,
        page: page.url,
        data: { fieldType: field.type, fieldName: field.name }
      });

      // Invalid input test
      tests.push({
        id: `form_invalid_${this.getPageId(page.url)}_${field.name}_${index}`,
        name: `❌ Invalid ${field.name} Input Test`,
        description: `Test invalid input for ${field.name} field on ${page.url}`,
        type: 'functional',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'click',
            target: 'form',
            description: 'Click on form to focus'
          },
          {
            action: 'type',
            target: field.selector,
            value: this.getInvalidTestData(field.type),
            description: `Enter invalid ${field.name}`
          },
          {
            action: 'click',
            target: 'button[type="submit"], input[type="submit"]',
            description: 'Submit form'
          },
          {
            action: 'wait',
            timeout: 3000,
            description: 'Wait for validation response'
          }
        ],
        expectedResult: `${field.name} rejects invalid input with proper error message`,
        page: page.url,
        data: { fieldType: field.type, fieldName: field.name }
      });

      // Empty field test (if required)
      if (field.required) {
        tests.push({
          id: `form_empty_${this.getPageId(page.url)}_${field.name}_${index}`,
          name: `🚫 Empty Required ${field.name} Test`,
          description: `Test empty required ${field.name} field on ${page.url}`,
          type: 'functional',
          priority: 'high',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`
            },
            {
              action: 'clear',
              target: field.selector,
              description: `Clear ${field.name} field`
            },
            {
              action: 'click',
              target: 'button[type="submit"], input[type="submit"]',
              description: 'Submit form without required field'
            },
            {
              action: 'wait',
              timeout: 3000,
              description: 'Wait for validation response'
            }
          ],
          expectedResult: `${field.name} shows required field error`,
          page: page.url,
          data: { fieldType: field.type, fieldName: field.name, required: true }
        });
      }
    });

    // Form submission test
    tests.push({
      id: `form_submission_${this.getPageId(page.url)}`,
      name: `📤 Complete Form Submission Test`,
      description: `Test complete form submission on ${page.url}`,
      type: 'functional',
      priority: 'high',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        ...page.formFields.map(field => ({
          action: 'type' as const,
          target: field.selector,
          value: this.getValidTestData(field.type),
          description: `Fill ${field.name} field`
        })),
        {
          action: 'click',
          target: 'button[type="submit"], input[type="submit"]',
          description: 'Submit form'
        },
        {
          action: 'wait',
          timeout: 5000,
          description: 'Wait for submission response'
        },
        {
          action: 'evaluate',
          script: 'document.body.textContent.includes("success") || document.body.textContent.includes("thank") || document.body.textContent.includes("sent")',
          description: 'Check for success message'
        }
      ],
      expectedResult: 'Form submits successfully with confirmation',
      page: page.url,
      data: { formFields: page.formFields }
    });

    return tests;
  }

  private generateButtonTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    page.buttons.forEach((button, index) => {
      tests.push({
        id: `button_click_${this.getPageId(page.url)}_${index}`,
        name: `🔘 Button Click Test - ${button.text || 'Unnamed Button'}`,
        description: `Test button clickability on ${page.url}`,
        type: 'functional',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'ensure-visible',
            target: button.selector,
            description: `Ensure button is visible`
          },
          {
            action: 'click',
            target: button.selector,
            description: `Click ${button.text || 'button'}`
          },
          {
            action: 'wait',
            timeout: 2000,
            description: 'Wait for button action'
          }
        ],
        expectedResult: 'Button click works without errors',
        page: page.url,
        data: { buttonText: button.text, buttonType: button.type }
      });
    });

    return tests;
  }

  private generateLinkTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    page.links.slice(0, 5).forEach((link, index) => { // Limit to 5 links per page
      tests.push({
        id: `link_navigation_${this.getPageId(page.url)}_${index}`,
        name: `🔗 Link Navigation Test - ${link.text || 'Unnamed Link'}`,
        description: `Test link navigation on ${page.url}`,
        type: 'functional',
        priority: 'low',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'click',
            target: link.selector,
            description: `Click ${link.text || 'link'}`
          },
          {
            action: 'wait',
            timeout: 3000,
            description: 'Wait for navigation'
          }
        ],
        expectedResult: 'Link navigation works correctly',
        page: page.url,
        data: { linkText: link.text, linkHref: link.href }
      });
    });

    return tests;
  }

  private generateValidationTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    // SEO validation test
    if (page.seoIssues.length > 0) {
      tests.push({
        id: `seo_validation_${this.getPageId(page.url)}`,
        name: `🔍 SEO Validation - ${page.title}`,
        description: `Check SEO compliance for ${page.url}`,
        type: 'seo',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          {
            action: 'evaluate',
            script: 'document.title.length',
            description: 'Check title length'
          }
        ],
        expectedResult: 'Page meets SEO standards',
        page: page.url,
        data: { seoIssues: page.seoIssues }
      });
    }

    return tests;
  }

  private getPageId(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    } catch {
      return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    }
  }

  private getValidTestData(fieldType: string): string {
    const testData: Record<string, string> = {
      'text': 'John Doe',
      'email': 'john.doe@example.com',
      'tel': '+1234567890',
      'password': 'SecurePass123!',
      'number': '12345',
      'url': 'https://example.com',
      'textarea': 'This is a test message for the contact form.',
      'select': 'option1'
    };
    
    return testData[fieldType] || 'Test Data';
  }

  private getInvalidTestData(fieldType: string): string {
    const testData: Record<string, string> = {
      'text': '', // Empty for required fields
      'email': 'invalid-email',
      'tel': 'abc123',
      'password': '123', // Too short
      'number': 'not-a-number',
      'url': 'not-a-url',
      'textarea': '', // Empty for required fields
      'select': ''
    };
    
    return testData[fieldType] || 'Invalid Data';
  }

  // New advanced test generation methods
  private generatePerformanceTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `performance_load_${this.getPageId(page.url)}`,
      name: `⚡ Page Load Performance Test`,
      description: `Test page load time and performance metrics for ${page.url}`,
      type: 'performance',
      priority: 'high',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'evaluate',
          script: 'performance.timing.loadEventEnd - performance.timing.navigationStart',
          description: 'Measure page load time'
        },
        {
          action: 'evaluate',
          script: 'document.querySelectorAll("*").length',
          description: 'Count DOM elements'
        }
      ],
      expectedResult: 'Page loads within acceptable time limits',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateSecurityTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `security_xss_${this.getPageId(page.url)}`,
      name: `🔒 XSS Protection Test`,
      description: `Test for XSS vulnerabilities on ${page.url}`,
      type: 'security',
      priority: 'high',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'evaluate',
          script: 'document.querySelector("meta[http-equiv=\'Content-Security-Policy\']") !== null',
          description: 'Check for CSP header'
        },
        {
          action: 'evaluate',
          script: 'document.querySelector("meta[http-equiv=\'X-Frame-Options\']") !== null',
          description: 'Check for X-Frame-Options'
        }
      ],
      expectedResult: 'Page has proper security headers',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateAccessibilityTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `accessibility_alt_${this.getPageId(page.url)}`,
      name: `♿ Image Alt Text Accessibility Test`,
      description: `Check image accessibility on ${page.url}`,
      type: 'accessibility',
      priority: 'medium',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'evaluate',
          script: 'Array.from(document.querySelectorAll("img")).filter(img => !img.alt).length',
          description: 'Count images without alt text'
        },
        {
          action: 'evaluate',
          script: 'document.querySelectorAll("h1, h2, h3, h4, h5, h6").length',
          description: 'Count heading elements'
        }
      ],
      expectedResult: 'All images have proper alt text',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateMobileTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `mobile_responsive_${this.getPageId(page.url)}`,
      name: `📱 Mobile Responsiveness Test`,
      description: `Test mobile responsiveness for ${page.url}`,
      type: 'mobile',
      priority: 'medium',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'evaluate',
          script: 'document.querySelector("meta[name=\'viewport\']") !== null',
          description: 'Check for viewport meta tag'
        },
        {
          action: 'evaluate',
          script: 'document.querySelectorAll("input[type=\'text\'], input[type=\'email\']").length',
          description: 'Count text inputs for mobile testing'
        }
      ],
      expectedResult: 'Page is mobile responsive',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateAPITests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    if (page.hasContactForm) {
      tests.push({
        id: `api_form_submission_${this.getPageId(page.url)}`,
        name: `🔌 Form API Response Test`,
        description: `Test form submission API response for ${page.url}`,
        type: 'api',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: page.url,
            description: `Navigate to ${page.url}`
          },
          ...page.formFields.slice(0, 3).map(field => ({
            action: 'type' as const,
            target: field.selector,
            value: this.getValidTestData(field.type),
            description: `Fill ${field.name} field`
          })),
          {
            action: 'click',
            target: 'button[type="submit"], input[type="submit"]',
            description: 'Submit form'
          },
          {
            action: 'wait',
            timeout: 5000,
            description: 'Wait for API response'
          },
          {
            action: 'evaluate',
            script: 'document.body.textContent.includes("success") || document.body.textContent.includes("error")',
            description: 'Check for API response'
          }
        ],
        expectedResult: 'Form submission returns proper API response',
        page: page.url,
        data: { formFields: page.formFields }
      });
    }

    return tests;
  }

  private generateVisualRegressionTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `visual_regression_${this.getPageId(page.url)}`,
      name: `👁️ Visual Regression Test`,
      description: `Capture and compare visual elements on ${page.url}`,
      type: 'visual-regression',
      priority: 'medium',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'screenshot',
          target: 'body',
          description: 'Capture full page screenshot'
        },
        {
          action: 'evaluate',
          script: 'document.querySelectorAll("img").length',
          description: 'Count images for visual comparison'
        }
      ],
      expectedResult: 'Visual elements match expected design',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateEdgeCaseTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    tests.push({
      id: `edge_case_empty_${this.getPageId(page.url)}`,
      name: `⚠️ Empty Page Edge Case Test`,
      description: `Test edge cases for ${page.url}`,
      type: 'edge-case',
      priority: 'low',
      steps: [
        {
          action: 'navigate',
          target: page.url,
          description: `Navigate to ${page.url}`
        },
        {
          action: 'evaluate',
          script: 'document.body.textContent.trim().length === 0',
          description: 'Check if page is empty'
        },
        {
          action: 'evaluate',
          script: 'document.querySelectorAll("*").length < 10',
          description: 'Check for minimal content'
        }
      ],
      expectedResult: 'Page handles edge cases gracefully',
      page: page.url,
      data: { pageType: page.pageType }
    });

    return tests;
  }

  private generateDataDrivenTests(page: PageAnalysis): TestCase[] {
    const tests: TestCase[] = [];

    if (page.hasContactForm) {
      const testData = [
        { name: 'John Doe', email: 'john@example.com', message: 'Test message 1' },
        { name: 'Jane Smith', email: 'jane@example.com', message: 'Test message 2' },
        { name: 'Bob Johnson', email: 'bob@example.com', message: 'Test message 3' }
      ];

      testData.forEach((data, index) => {
        tests.push({
          id: `data_driven_form_${this.getPageId(page.url)}_${index}`,
          name: `📊 Data-Driven Form Test #${index + 1}`,
          description: `Test form with data set ${index + 1} for ${page.url}`,
          type: 'data-driven',
          priority: 'medium',
          steps: [
            {
              action: 'navigate',
              target: page.url,
              description: `Navigate to ${page.url}`
            },
            {
              action: 'type',
              target: 'input[name="name"], input[type="text"]',
              value: data.name,
              description: `Enter name: ${data.name}`
            },
            {
              action: 'type',
              target: 'input[name="email"], input[type="email"]',
              value: data.email,
              description: `Enter email: ${data.email}`
            },
            {
              action: 'type',
              target: 'textarea, input[name="message"]',
              value: data.message,
              description: `Enter message: ${data.message}`
            },
            {
              action: 'click',
              target: 'button[type="submit"], input[type="submit"]',
              description: 'Submit form'
            }
          ],
          expectedResult: `Form accepts data set ${index + 1}`,
          page: page.url,
          data: { testData: data, formFields: page.formFields }
        });
      });
    }

    return tests;
  }
}
