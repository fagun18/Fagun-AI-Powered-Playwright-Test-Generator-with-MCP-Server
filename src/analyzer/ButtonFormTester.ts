import { Page, ElementHandle } from 'playwright';

export interface ButtonTestResult {
  selector: string;
  text: string;
  isClickable: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  error?: string;
  responseTime?: number;
  action?: string;
}

export interface FormTestResult {
  selector: string;
  action: string;
  method: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    value: string;
  }>;
  submissionResult: {
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    redirectUrl?: string;
  };
  validationErrors: string[];
}

export interface APITestResult {
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  error?: string;
  responseSize?: number;
  headers?: Record<string, string>;
}

export class ButtonFormTester {
  async testAllButtons(page: Page): Promise<ButtonTestResult[]> {
    const results: ButtonTestResult[] = [];
    
    // Find all clickable elements
    const buttonSelectors = [
      'button',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      'a[role="button"]',
      '[onclick]',
      '.btn',
      '.button',
      '[data-testid*="button"]',
      '[data-testid*="btn"]'
    ];

    for (const selector of buttonSelectors) {
      const elements = await page.$$(selector);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const result = await this.testButton(page, element, selector, i);
        results.push(result);
      }
    }

    return results;
  }

  private async testButton(page: Page, element: ElementHandle, selector: string, index: number): Promise<ButtonTestResult> {
    const startTime = Date.now();
    
    try {
      // Get button text
      const text = await element.textContent() || '';
      
      // Check if element is visible
      const isVisible = await element.isVisible();
      
      // Check if element is enabled
      const isEnabled = await element.isEnabled();
      
      let isClickable = false;
      let error: string | undefined;
      let action: string | undefined;

      if (isVisible && isEnabled) {
        try {
          // Try to click the button
          await element.click({ timeout: 5000 });
          isClickable = true;
          action = 'clicked';
          
          // Check if it's a form submission
          const form = await element.evaluateHandle(el => (el as Element).closest('form'));
          if (form) {
            action = 'form_submitted';
          }
          
          // Check if it's a navigation
          const href = await element.getAttribute('href');
          if (href) {
            action = 'navigation';
          }
          
        } catch (clickError) {
          error = `Click failed: ${clickError}`;
          isClickable = false;
        }
      } else if (!isVisible) {
        error = 'Button not visible';
      } else if (!isEnabled) {
        error = 'Button not enabled';
      }

      const responseTime = Date.now() - startTime;

      return {
        selector: `${selector}:nth-of-type(${index + 1})`,
        text: text.trim(),
        isClickable,
        isVisible,
        isEnabled,
        error,
        responseTime,
        action
      };

    } catch (err) {
      return {
        selector: `${selector}:nth-of-type(${index + 1})`,
        text: '',
        isClickable: false,
        isVisible: false,
        isEnabled: false,
        error: `Test failed: ${err}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  async testAllForms(page: Page): Promise<FormTestResult[]> {
    const results: FormTestResult[] = [];
    
    const forms = await page.$$('form');
    
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const result = await this.testForm(page, form, i);
      results.push(result);
    }

    return results;
  }

  private async testForm(page: Page, form: ElementHandle, index: number): Promise<FormTestResult> {
    const startTime = Date.now();
    
    try {
      // Get form attributes
      const action = await form.getAttribute('action') || '';
      const method = await form.getAttribute('method') || 'GET';
      
      // Get form fields
      const fields = await form.$$eval('input, select, textarea', elements => 
        elements.map(el => ({
          name: el.getAttribute('name') || '',
          type: el.getAttribute('type') || el.tagName.toLowerCase(),
          required: el.hasAttribute('required'),
          value: (el as HTMLInputElement).value || ''
        }))
      );

      // Fill form with test data
      const testData = this.generateTestData(fields);
      await this.fillForm(form, testData);

      // Submit form and test API response
      const submissionResult = await this.submitFormAndTestAPI(page, form, action, method);
      
      // Check for validation errors
      const validationErrors = await this.checkValidationErrors(page);

      const responseTime = Date.now() - startTime;

      return {
        selector: `form:nth-of-type(${index + 1})`,
        action,
        method,
        fields,
        submissionResult: {
          ...submissionResult,
          responseTime
        },
        validationErrors
      };

    } catch (err) {
      return {
        selector: `form:nth-of-type(${index + 1})`,
        action: '',
        method: 'GET',
        fields: [],
        submissionResult: {
          success: false,
          error: `Form test failed: ${err}`,
          responseTime: Date.now() - startTime
        },
        validationErrors: []
      };
    }
  }

  private generateTestData(fields: Array<{ name: string; type: string; required: boolean }>): Record<string, string> {
    const testData: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required) {
        switch (field.type) {
          case 'email':
            testData[field.name] = 'test@example.com';
            break;
          case 'tel':
          case 'phone':
            testData[field.name] = '+1234567890';
            break;
          case 'url':
            testData[field.name] = 'https://example.com';
            break;
          case 'number':
            testData[field.name] = '123';
            break;
          case 'date':
            testData[field.name] = '2024-01-01';
            break;
          case 'password':
            testData[field.name] = 'TestPassword123!';
            break;
          case 'text':
          case 'textarea':
            testData[field.name] = 'Test content for validation';
            break;
          default:
            testData[field.name] = 'Test value';
        }
      }
    });

    return testData;
  }

  private async fillForm(form: ElementHandle, testData: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(testData)) {
      try {
        const input = await form.$(`[name="${name}"]`);
        if (input) {
          await input.fill(value);
        }
      } catch (err) {
        console.warn(`Failed to fill field ${name}: ${err}`);
      }
    }
  }

  private async submitFormAndTestAPI(page: Page, form: ElementHandle, action: string, method: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    redirectUrl?: string;
  }> {
    try {
      // Set up response monitoring
      const responsePromise = page.waitForResponse(response => 
        response.url().includes(action) || response.url().includes('api')
      ).catch(() => null);

      // Submit form
      await form.evaluate((form: HTMLFormElement) => form.submit());

      // Wait for response
      const response = await responsePromise;
      
      if (response) {
        const statusCode = response.status();
        const responseTime = response.request().timing()?.responseEnd || 0;
        
        return {
          success: statusCode >= 200 && statusCode < 400,
          statusCode,
          responseTime,
          redirectUrl: response.url()
        };
      } else {
        // Check if page redirected
        const currentUrl = page.url();
        if (currentUrl !== action) {
          return {
            success: true,
            redirectUrl: currentUrl
          };
        }
        
        return {
          success: false,
          error: 'No response received'
        };
      }
    } catch (err) {
      return {
        success: false,
        error: `API test failed: ${err}`
      };
    }
  }

  private async checkValidationErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    
    // Check for HTML5 validation errors
    const invalidElements = await page.$$(':invalid');
    for (const element of invalidElements) {
      const validationMessage = await element.evaluate((el: HTMLInputElement) => el.validationMessage);
      if (validationMessage) {
        errors.push(validationMessage);
      }
    }

    // Check for custom error messages
    const errorElements = await page.$$('.error, .invalid, [class*="error"], [class*="invalid"]');
    for (const element of errorElements) {
      const errorText = await element.textContent();
      if (errorText) {
        errors.push(errorText.trim());
      }
    }

    return errors;
  }

  async testAPIEndpoints(page: Page, baseUrl: string): Promise<APITestResult[]> {
    const results: APITestResult[] = [];
    
    // Common API endpoints to test
    const commonEndpoints = [
      '/api/health',
      '/api/status',
      '/api/version',
      '/api/users',
      '/api/auth',
      '/api/data',
      '/api/config'
    ];

    for (const endpoint of commonEndpoints) {
      const url = `${baseUrl}${endpoint}`;
      const result = await this.testAPIEndpoint(page, url, 'GET');
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private async testAPIEndpoint(page: Page, url: string, method: string): Promise<APITestResult | null> {
    try {
      const startTime = Date.now();
      
      const response = await page.request.get(url);
      const responseTime = Date.now() - startTime;
      
      const responseText = await response.text();
      const responseSize = responseText.length;
      
      return {
        url,
        method,
        statusCode: response.status(),
        responseTime,
        success: response.ok(),
        responseSize,
        headers: response.headers()
      };
    } catch (err) {
      return {
        url,
        method,
        statusCode: 0,
        responseTime: 0,
        success: false,
        error: `API test failed: ${err}`
      };
    }
  }
}
