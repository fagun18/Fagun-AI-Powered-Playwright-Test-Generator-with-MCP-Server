import { Utils } from './helpers';
import { ValidationError, ErrorFactory } from './errors';
import { TestCase, TestStep, WebsiteElement } from '../types';

export class Validator {
  /**
   * Validate URL format and accessibility
   */
  static validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw ErrorFactory.invalidUrl(url);
    }

    if (!Utils.isValidUrl(url)) {
      throw ErrorFactory.invalidUrl(url);
    }

    // Check if URL has proper protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw ErrorFactory.invalidUrl(url);
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new ValidationError('API key is required and must be a string');
    }

    if (apiKey.trim().length === 0) {
      throw new ValidationError('API key cannot be empty');
    }

    // Basic format validation for Gemini API key
    if (apiKey.length < 20) {
      throw new ValidationError('API key appears to be too short');
    }
  }

  /**
   * Validate test case structure
   */
  static validateTestCase(testCase: any): TestCase {
    if (!testCase || typeof testCase !== 'object') {
      throw new ValidationError('Test case must be an object');
    }

    // Required fields
    const requiredFields = ['id', 'name', 'description', 'type', 'priority', 'steps', 'expectedResult', 'page'];
    for (const field of requiredFields) {
      if (!testCase[field]) {
        throw new ValidationError(`Test case is missing required field: ${field}`);
      }
    }

    // Validate ID
    if (typeof testCase.id !== 'string' || testCase.id.trim().length === 0) {
      throw new ValidationError('Test case ID must be a non-empty string');
    }

    // Validate name
    if (typeof testCase.name !== 'string' || testCase.name.trim().length === 0) {
      throw new ValidationError('Test case name must be a non-empty string');
    }

    // Validate description
    if (typeof testCase.description !== 'string' || testCase.description.trim().length === 0) {
      throw new ValidationError('Test case description must be a non-empty string');
    }

    // Validate type
    const validTypes = ['functional', 'ui', 'accessibility', 'performance', 'security', 'integration'];
    if (!validTypes.includes(testCase.type)) {
      throw new ValidationError(`Test case type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate priority
    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(testCase.priority)) {
      throw new ValidationError(`Test case priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate steps
    if (!Array.isArray(testCase.steps)) {
      throw new ValidationError('Test case steps must be an array');
    }

    if (testCase.steps.length === 0) {
      throw new ValidationError('Test case must have at least one step');
    }

    // Validate each step
    testCase.steps.forEach((step: any, index: number) => {
      this.validateTestStep(step, index);
    });

    // Validate expected result
    if (typeof testCase.expectedResult !== 'string' || testCase.expectedResult.trim().length === 0) {
      throw new ValidationError('Test case expected result must be a non-empty string');
    }

    // Validate page URL
    this.validateUrl(testCase.page);

    return testCase as TestCase;
  }

  /**
   * Validate test step structure
   */
  static validateTestStep(step: any, index?: number): TestStep {
    if (!step || typeof step !== 'object') {
      throw new ValidationError(`Test step ${index !== undefined ? `at index ${index}` : ''} must be an object`);
    }

    // Required fields
    const requiredFields = ['action', 'description'];
    for (const field of requiredFields) {
      if (!step[field]) {
        throw new ValidationError(`Test step ${index !== undefined ? `at index ${index}` : ''} is missing required field: ${field}`);
      }
    }

    // Validate action
    const validActions = ['click', 'type', 'select', 'hover', 'scroll', 'wait', 'assert', 'navigate'];
    if (!validActions.includes(step.action)) {
      throw new ValidationError(`Test step action must be one of: ${validActions.join(', ')}`);
    }

    // Validate description
    if (typeof step.description !== 'string' || step.description.trim().length === 0) {
      throw new ValidationError(`Test step description must be a non-empty string`);
    }

    // Validate target (required for most actions)
    if (['click', 'type', 'select', 'hover', 'assert'].includes(step.action)) {
      if (!step.target || typeof step.target !== 'string') {
        throw new ValidationError(`Test step with action '${step.action}' must have a target`);
      }
    }

    // Validate value (required for type and select actions)
    if (['type', 'select'].includes(step.action)) {
      if (step.value === undefined || step.value === null) {
        throw new ValidationError(`Test step with action '${step.action}' must have a value`);
      }
    }

    // Validate assertion (required for assert action)
    if (step.action === 'assert') {
      if (!step.assertion || typeof step.assertion !== 'string') {
        throw new ValidationError('Test step with action "assert" must have an assertion');
      }
    }

    // Validate timeout
    if (step.timeout !== undefined) {
      if (typeof step.timeout !== 'number' || step.timeout <= 0) {
        throw new ValidationError('Test step timeout must be a positive number');
      }
    }

    return step as TestStep;
  }

  /**
   * Validate website element structure
   */
  static validateWebsiteElement(element: any): WebsiteElement {
    if (!element || typeof element !== 'object') {
      throw new ValidationError('Website element must be an object');
    }

    // Required fields
    const requiredFields = ['type', 'selector'];
    for (const field of requiredFields) {
      if (!element[field]) {
        throw new ValidationError(`Website element is missing required field: ${field}`);
      }
    }

    // Validate type
    const validTypes = ['button', 'input', 'link', 'form', 'select', 'textarea', 'image', 'navigation'];
    if (!validTypes.includes(element.type)) {
      throw new ValidationError(`Website element type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate selector
    if (typeof element.selector !== 'string' || element.selector.trim().length === 0) {
      throw new ValidationError('Website element selector must be a non-empty string');
    }

    // Validate optional fields
    if (element.text !== undefined && typeof element.text !== 'string') {
      throw new ValidationError('Website element text must be a string');
    }

    if (element.placeholder !== undefined && typeof element.placeholder !== 'string') {
      throw new ValidationError('Website element placeholder must be a string');
    }

    if (element.href !== undefined && typeof element.href !== 'string') {
      throw new ValidationError('Website element href must be a string');
    }

    if (element.action !== undefined && typeof element.action !== 'string') {
      throw new ValidationError('Website element action must be a string');
    }

    if (element.method !== undefined && typeof element.method !== 'string') {
      throw new ValidationError('Website element method must be a string');
    }

    if (element.required !== undefined && typeof element.required !== 'boolean') {
      throw new ValidationError('Website element required must be a boolean');
    }

    if (element.inputType !== undefined && typeof element.inputType !== 'string') {
      throw new ValidationError('Website element inputType must be a string');
    }

    if (element.options !== undefined && !Array.isArray(element.options)) {
      throw new ValidationError('Website element options must be an array');
    }

    if (element.attributes !== undefined && typeof element.attributes !== 'object') {
      throw new ValidationError('Website element attributes must be an object');
    }

    return element as WebsiteElement;
  }

  /**
   * Validate configuration object
   */
  static validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new ValidationError('Configuration must be an object');
    }

    // Validate Gemini configuration
    if (config.gemini) {
      if (!config.gemini.apiKey) {
        throw new ValidationError('Gemini API key is required in configuration');
      }
      this.validateApiKey(config.gemini.apiKey);

      if (config.gemini.model && typeof config.gemini.model !== 'string') {
        throw new ValidationError('Gemini model must be a string');
      }

      if (config.gemini.maxTokens && (typeof config.gemini.maxTokens !== 'number' || config.gemini.maxTokens <= 0)) {
        throw new ValidationError('Gemini maxTokens must be a positive number');
      }

      if (config.gemini.temperature !== undefined && (typeof config.gemini.temperature !== 'number' || config.gemini.temperature < 0 || config.gemini.temperature > 1)) {
        throw new ValidationError('Gemini temperature must be a number between 0 and 1');
      }
    }

    // Validate Playwright configuration
    if (config.playwright) {
      if (config.playwright.timeout && (typeof config.playwright.timeout !== 'number' || config.playwright.timeout <= 0)) {
        throw new ValidationError('Playwright timeout must be a positive number');
      }

      if (config.playwright.headless !== undefined && typeof config.playwright.headless !== 'boolean') {
        throw new ValidationError('Playwright headless must be a boolean');
      }

      if (config.playwright.browser && typeof config.playwright.browser !== 'string') {
        throw new ValidationError('Playwright browser must be a string');
      }

      if (config.playwright.viewport && typeof config.playwright.viewport !== 'object') {
        throw new ValidationError('Playwright viewport must be an object');
      }
    }

    // Validate test configuration
    if (config.test) {
      if (config.test.maxTestCases && (typeof config.test.maxTestCases !== 'number' || config.test.maxTestCases <= 0)) {
        throw new ValidationError('Test maxTestCases must be a positive number');
      }

      if (config.test.includeAccessibility !== undefined && typeof config.test.includeAccessibility !== 'boolean') {
        throw new ValidationError('Test includeAccessibility must be a boolean');
      }

      if (config.test.includePerformance !== undefined && typeof config.test.includePerformance !== 'boolean') {
        throw new ValidationError('Test includePerformance must be a boolean');
      }

      if (config.test.includeSecurity !== undefined && typeof config.test.includeSecurity !== 'boolean') {
        throw new ValidationError('Test includeSecurity must be a boolean');
      }

      if (config.test.retryCount && (typeof config.test.retryCount !== 'number' || config.test.retryCount < 0)) {
        throw new ValidationError('Test retryCount must be a non-negative number');
      }

      if (config.test.parallel !== undefined && typeof config.test.parallel !== 'boolean') {
        throw new ValidationError('Test parallel must be a boolean');
      }

      if (config.test.maxConcurrency && (typeof config.test.maxConcurrency !== 'number' || config.test.maxConcurrency <= 0)) {
        throw new ValidationError('Test maxConcurrency must be a positive number');
      }
    }

    // Validate output configuration
    if (config.output) {
      const outputFields = ['reportsDir', 'screenshotsDir', 'videosDir', 'logsDir'];
      for (const field of outputFields) {
        if (config.output[field] && typeof config.output[field] !== 'string') {
          throw new ValidationError(`Output ${field} must be a string`);
        }
      }
    }
  }

  /**
   * Validate test data
   */
  static validateTestData(data: any): void {
    if (data === null || data === undefined) {
      return; // Test data is optional
    }

    if (typeof data !== 'object') {
      throw new ValidationError('Test data must be an object');
    }

    // Validate each property in test data
    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== 'string' || key.trim().length === 0) {
        throw new ValidationError('Test data keys must be non-empty strings');
      }

      if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new ValidationError(`Test data value for key '${key}' must be a string, number, boolean, or null`);
      }
    }
  }

  /**
   * Validate array of test cases
   */
  static validateTestCases(testCases: any[]): TestCase[] {
    if (!Array.isArray(testCases)) {
      throw new ValidationError('Test cases must be an array');
    }

    if (testCases.length === 0) {
      throw new ValidationError('Test cases array cannot be empty');
    }

    return testCases.map((testCase, index) => {
      try {
        return this.validateTestCase(testCase);
      } catch (error) {
        throw new ValidationError(`Invalid test case at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Validate array of website elements
   */
  static validateWebsiteElements(elements: any[]): WebsiteElement[] {
    if (!Array.isArray(elements)) {
      throw new ValidationError('Website elements must be an array');
    }

    return elements.map((element, index) => {
      try {
        return this.validateWebsiteElement(element);
      } catch (error) {
        throw new ValidationError(`Invalid website element at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Sanitize and validate input
   */
  static sanitizeInput(input: any, type: 'string' | 'number' | 'boolean' | 'url' | 'email'): any {
    if (input === null || input === undefined) {
      return input;
    }

    switch (type) {
      case 'string':
        return typeof input === 'string' ? input.trim() : String(input).trim();
      
      case 'number':
        const num = Number(input);
        if (isNaN(num)) {
          throw new ValidationError(`Invalid number: ${input}`);
        }
        return num;
      
      case 'boolean':
        if (typeof input === 'boolean') {
          return input;
        }
        if (typeof input === 'string') {
          const lower = input.toLowerCase();
          if (['true', '1', 'yes', 'on'].includes(lower)) {
            return true;
          }
          if (['false', '0', 'no', 'off'].includes(lower)) {
            return false;
          }
        }
        throw new ValidationError(`Invalid boolean: ${input}`);
      
      case 'url':
        const url = typeof input === 'string' ? input.trim() : String(input).trim();
        this.validateUrl(url);
        return url;
      
      case 'email':
        const email = typeof input === 'string' ? input.trim() : String(input).trim();
        if (!Utils.isValidEmail(email)) {
          throw new ValidationError(`Invalid email: ${email}`);
        }
        return email;
      
      default:
        return input;
    }
  }
}
