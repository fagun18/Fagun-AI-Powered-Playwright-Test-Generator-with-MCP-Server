import { TestTemplate, TestCase } from '../types';

export class TestTemplates {
  private static templates: TestTemplate[] = [
    {
      id: 'login_flow',
      name: 'User Login Flow',
      description: 'Complete user login workflow with validation',
      category: 'authentication',
      type: 'e2e-workflow',
      template: {
        id: 'login_flow_template',
        name: 'User Login Flow - {{userType}}',
        description: 'Test complete login process for {{userType}} user',
        type: 'e2e-workflow',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: '{{loginUrl}}',
            description: 'Navigate to login page',
            timeout: 30000,
          },
          {
            action: 'type',
            target: '{{usernameSelector}}',
            value: '{{username}}',
            description: 'Enter username',
            timeout: 5000,
          },
          {
            action: 'type',
            target: '{{passwordSelector}}',
            value: '{{password}}',
            description: 'Enter password',
            timeout: 5000,
          },
          {
            action: 'click',
            target: '{{submitSelector}}',
            description: 'Click login button',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.url().includes("{{successUrl}}")',
            description: 'Verify successful login redirect',
            timeout: 10000,
          }
        ],
        expectedResult: 'User successfully logs in and is redirected',
        page: '{{loginUrl}}',
        tags: ['login', 'authentication', '{{userType}}'],
        category: 'user-journey',
      },
      variables: ['userType', 'loginUrl', 'usernameSelector', 'passwordSelector', 'submitSelector', 'username', 'password', 'successUrl'],
      tags: ['authentication', 'login', 'e2e'],
    },
    {
      id: 'form_validation',
      name: 'Form Validation Test',
      description: 'Test form validation with various input scenarios',
      category: 'validation',
      type: 'data-driven',
      template: {
        id: 'form_validation_template',
        name: 'Form Validation - {{fieldName}} - {{testCase}}',
        description: 'Test {{fieldName}} field validation with {{testCase}}',
        type: 'data-driven',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: '{{formUrl}}',
            description: 'Navigate to form page',
            timeout: 30000,
          },
          {
            action: 'type',
            target: '{{fieldSelector}}',
            value: '{{testValue}}',
            description: 'Enter test value in {{fieldName}}',
            timeout: 5000,
          },
          {
            action: 'click',
            target: '{{submitSelector}}',
            description: 'Submit form',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: '{{expectedAssertion}}',
            description: 'Verify validation result',
            timeout: 5000,
          }
        ],
        expectedResult: 'Form validation works correctly for {{testCase}}',
        page: '{{formUrl}}',
        tags: ['form', 'validation', '{{fieldName}}'],
        category: 'validation',
        testData: ['{{testValue}}'],
      },
      variables: ['fieldName', 'testCase', 'formUrl', 'fieldSelector', 'submitSelector', 'testValue', 'expectedAssertion'],
      tags: ['form', 'validation', 'data-driven'],
    },
    {
      id: 'api_endpoint',
      name: 'API Endpoint Test',
      description: 'Test API endpoint functionality and responses',
      category: 'api',
      type: 'api',
      template: {
        id: 'api_endpoint_template',
        name: 'API Test - {{method}} {{endpoint}}',
        description: 'Test {{method}} request to {{endpoint}}',
        type: 'api',
        priority: 'high',
        steps: [
          {
            action: 'api-call',
            method: 'GET' as any, // Will be replaced by template variables
            target: '{{endpoint}}',
            headers: {} as any, // Will be replaced by template variables
            body: '{{body}}',
            expectedStatus: 200 as any, // Will be replaced by template variables
            description: 'Make {{method}} request to {{endpoint}}',
            timeout: 10000,
          },
          {
            action: 'assert',
            assertion: 'response.status === {{expectedStatus}}',
            description: 'Verify response status',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: '{{responseAssertion}}',
            description: 'Verify response content',
            timeout: 5000,
          }
        ],
        expectedResult: 'API endpoint responds correctly',
        page: '{{endpoint}}',
        tags: ['api', '{{method}}', 'endpoint'],
        category: 'api-testing',
      },
      variables: ['method', 'endpoint', 'headers', 'body', 'expectedStatus', 'responseAssertion'],
      tags: ['api', 'endpoint', 'testing'],
    },
    {
      id: 'mobile_responsive',
      name: 'Mobile Responsive Test',
      description: 'Test mobile responsiveness and touch interactions',
      category: 'mobile',
      type: 'mobile',
      template: {
        id: 'mobile_responsive_template',
        name: 'Mobile Test - {{deviceName}} - {{pageName}}',
        description: 'Test {{pageName}} on {{deviceName}}',
        type: 'mobile',
        priority: 'high',
        device: ['{{deviceName}}'],
        viewport: { width: 390 as any, height: 844 as any }, // Will be replaced by template variables
        steps: [
          {
            action: 'emulate-device',
            device: '{{deviceName}}',
            viewport: { width: 390 as any, height: 844 as any }, // Will be replaced by template variables
            description: 'Emulate {{deviceName}}',
            timeout: 2000,
          },
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.viewportSize().width === {{viewportWidth}}',
            description: 'Verify mobile viewport',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("{{touchElement}}").isVisible()',
            description: 'Verify touch-friendly elements',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page works correctly on {{deviceName}}',
        page: '{{pageUrl}}',
        tags: ['mobile', '{{deviceName}}', 'responsive'],
        category: 'mobile-testing',
      },
      variables: ['deviceName', 'pageName', 'viewportWidth', 'viewportHeight', 'pageUrl', 'touchElement'],
      tags: ['mobile', 'responsive', 'touch'],
    },
    {
      id: 'visual_regression',
      name: 'Visual Regression Test',
      description: 'Test visual consistency and UI changes',
      category: 'visual',
      type: 'visual-regression',
      template: {
        id: 'visual_regression_template',
        name: 'Visual Test - {{pageName}} - {{viewport}}',
        description: 'Test visual consistency of {{pageName}} at {{viewport}}',
        type: 'visual-regression',
        priority: 'medium',
        viewport: { width: 390 as any, height: 844 as any }, // Will be replaced by template variables
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
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
        page: '{{pageUrl}}',
        tags: ['visual', 'regression', '{{viewport}}'],
        category: 'visual-testing',
      },
      variables: ['pageName', 'viewport', 'viewportWidth', 'viewportHeight', 'pageUrl'],
      tags: ['visual', 'regression', 'ui'],
    },
    {
      id: 'performance_audit',
      name: 'Performance Audit Test',
      description: 'Test page performance and Core Web Vitals',
      category: 'performance',
      type: 'performance',
      template: {
        id: 'performance_audit_template',
        name: 'Performance Test - {{pageName}}',
        description: 'Test performance metrics for {{pageName}}',
        type: 'performance',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
            timeout: 30000,
          },
          {
            action: 'wait',
            timeout: 2000,
            description: 'Wait for page to stabilize',
          },
          {
            action: 'assert',
            assertion: 'performance.now() < {{maxLoadTime}}',
            description: 'Verify load time is acceptable',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("{{performanceElement}}").isVisible()',
            description: 'Verify critical content is visible',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page meets performance requirements',
        page: '{{pageUrl}}',
        tags: ['performance', 'speed', 'metrics'],
        category: 'performance-testing',
      },
      variables: ['pageName', 'pageUrl', 'maxLoadTime', 'performanceElement'],
      tags: ['performance', 'speed', 'audit'],
    },
    {
      id: 'accessibility_audit',
      name: 'Accessibility Audit Test',
      description: 'Test accessibility compliance and WCAG guidelines',
      category: 'accessibility',
      type: 'accessibility',
      template: {
        id: 'accessibility_audit_template',
        name: 'Accessibility Test - {{pageName}}',
        description: 'Test accessibility compliance for {{pageName}}',
        type: 'accessibility',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("[aria-label], [aria-labelledby]").count() > 0',
            description: 'Check for ARIA labels',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("img[alt]").count() === page.locator("img").count()',
            description: 'Verify all images have alt text',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("h1, h2, h3").count() > 0',
            description: 'Verify proper heading structure',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page meets accessibility standards',
        page: '{{pageUrl}}',
        tags: ['accessibility', 'a11y', 'wcag'],
        category: 'accessibility-testing',
      },
      variables: ['pageName', 'pageUrl'],
      tags: ['accessibility', 'a11y', 'compliance'],
    },
    {
      id: 'security_scan',
      name: 'Security Scan Test',
      description: 'Test security vulnerabilities and protections',
      category: 'security',
      type: 'security',
      template: {
        id: 'security_scan_template',
        name: 'Security Test - {{vulnerabilityType}} - {{pageName}}',
        description: 'Test {{vulnerabilityType}} protection on {{pageName}}',
        type: 'security',
        priority: 'high',
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
            timeout: 30000,
          },
          {
            action: 'type',
            target: '{{inputSelector}}',
            value: '{{maliciousPayload}}',
            description: 'Input {{vulnerabilityType}} payload',
            timeout: 5000,
          },
          {
            action: 'click',
            target: '{{submitSelector}}',
            description: 'Submit form',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: '{{securityAssertion}}',
            description: 'Verify security protection',
            timeout: 5000,
          }
        ],
        expectedResult: 'Security vulnerability is prevented',
        page: '{{pageUrl}}',
        tags: ['security', '{{vulnerabilityType}}', 'protection'],
        category: 'security-testing',
      },
      variables: ['vulnerabilityType', 'pageName', 'pageUrl', 'inputSelector', 'maliciousPayload', 'submitSelector', 'securityAssertion'],
      tags: ['security', 'vulnerability', 'protection'],
    },
    {
      id: 'cross_browser',
      name: 'Cross-Browser Compatibility Test',
      description: 'Test compatibility across different browsers',
      category: 'compatibility',
      type: 'cross-browser',
      template: {
        id: 'cross_browser_template',
        name: 'Cross-Browser Test - {{browserName}} - {{pageName}}',
        description: 'Test {{pageName}} compatibility in {{browserName}}',
        type: 'cross-browser',
        priority: 'medium',
        browser: ['{{browserName}}'],
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}} in {{browserName}}',
            timeout: 30000,
          },
          {
            action: 'assert',
            assertion: 'page.title() !== ""',
            description: 'Verify page loads correctly',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: 'page.locator("{{criticalElement}}").isVisible()',
            description: 'Verify critical elements are visible',
            timeout: 5000,
          }
        ],
        expectedResult: 'Page works correctly in {{browserName}}',
        page: '{{pageUrl}}',
        tags: ['cross-browser', '{{browserName}}', 'compatibility'],
        category: 'browser-testing',
      },
      variables: ['browserName', 'pageName', 'pageUrl', 'criticalElement'],
      tags: ['cross-browser', 'compatibility', 'browser'],
    },
    {
      id: 'edge_case',
      name: 'Edge Case Test',
      description: 'Test boundary conditions and error scenarios',
      category: 'edge-case',
      type: 'edge-case',
      template: {
        id: 'edge_case_template',
        name: 'Edge Case Test - {{scenarioType}} - {{pageName}}',
        description: 'Test {{scenarioType}} edge case on {{pageName}}',
        type: 'edge-case',
        priority: 'medium',
        steps: [
          {
            action: 'navigate',
            target: '{{pageUrl}}',
            description: 'Navigate to {{pageName}}',
            timeout: 30000,
          },
          {
            action: 'click' as any, // Will be replaced by template variables
            target: '{{targetElement}}',
            value: '{{edgeCaseValue}}',
            description: 'Execute {{scenarioType}} scenario',
            timeout: 5000,
          },
          {
            action: 'assert',
            assertion: '{{edgeCaseAssertion}}',
            description: 'Verify edge case handling',
            timeout: 5000,
          }
        ],
        expectedResult: 'Application handles {{scenarioType}} correctly',
        page: '{{pageUrl}}',
        tags: ['edge-case', '{{scenarioType}}', 'boundary'],
        category: 'edge-case-testing',
      },
      variables: ['scenarioType', 'pageName', 'pageUrl', 'edgeCaseAction', 'targetElement', 'edgeCaseValue', 'edgeCaseAssertion'],
      tags: ['edge-case', 'boundary', 'error-handling'],
    }
  ];

  static getTemplate(templateId: string): TestTemplate | undefined {
    return this.templates.find(template => template.id === templateId);
  }

  static getAllTemplates(): TestTemplate[] {
    return this.templates;
  }

  static getTemplatesByCategory(category: string): TestTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  static getTemplatesByType(type: string): TestTemplate[] {
    return this.templates.filter(template => template.type === type);
  }

  static generateTestCaseFromTemplate(templateId: string, variables: Record<string, any>): TestCase {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const testCase = JSON.parse(JSON.stringify(template.template));
    
    // Replace variables in the test case
    this.replaceVariables(testCase, variables);
    
    return testCase;
  }

  private static replaceVariables(obj: any, variables: Record<string, any>): void {
    if (typeof obj === 'string') {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        obj = obj.replace(regex, variables[key]);
      });
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.replaceVariables(item, variables));
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        this.replaceVariables(obj[key], variables);
      });
    }
  }
}
