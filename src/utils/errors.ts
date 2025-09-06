export class FagunAutomationError extends Error {
  public readonly code: string;
  public readonly context?: any;

  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = 'FagunAutomationError';
    this.code = code;
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FagunAutomationError);
    }
  }
}

export class ConfigurationError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class AIError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'AI_ERROR', context);
    this.name = 'AIError';
  }
}

export class TestExecutionError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'TEST_EXECUTION_ERROR', context);
    this.name = 'TestExecutionError';
  }
}

export class BrowserError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'BROWSER_ERROR', context);
    this.name = 'BrowserError';
  }
}

export class ReportGenerationError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'REPORT_GENERATION_ERROR', context);
    this.name = 'ReportGenerationError';
  }
}

export class WebsiteAnalysisError extends FagunAutomationError {
  constructor(message: string, context?: any) {
    super(message, 'WEBSITE_ANALYSIS_ERROR', context);
    this.name = 'WebsiteAnalysisError';
  }
}

// Error codes enum for better type safety
export enum ErrorCodes {
  // Configuration errors
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_BROWSER = 'MISSING_BROWSER',
  
  // Validation errors
  INVALID_URL = 'INVALID_URL',
  INVALID_TEST_CASE = 'INVALID_TEST_CASE',
  INVALID_ELEMENT = 'INVALID_ELEMENT',
  
  // Network errors
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',
  SSL_ERROR = 'SSL_ERROR',
  
  // AI errors
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  
  // Test execution errors
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ASSERTION_FAILED = 'ASSERTION_FAILED',
  
  // Browser errors
  BROWSER_LAUNCH_FAILED = 'BROWSER_LAUNCH_FAILED',
  PAGE_LOAD_FAILED = 'PAGE_LOAD_FAILED',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  
  // Report errors
  REPORT_WRITE_FAILED = 'REPORT_WRITE_FAILED',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  
  // Analysis errors
  CRAWL_FAILED = 'CRAWL_FAILED',
  ELEMENT_EXTRACTION_FAILED = 'ELEMENT_EXTRACTION_FAILED',
  SITEMAP_GENERATION_FAILED = 'SITEMAP_GENERATION_FAILED'
}

// Error factory functions
export class ErrorFactory {
  static missingApiKey(): ConfigurationError {
    return new ConfigurationError(
      'Gemini API key is required. Please set GEMINI_API_KEY environment variable or provide it in configuration.',
      { code: ErrorCodes.MISSING_API_KEY }
    );
  }

  static invalidUrl(url: string): ValidationError {
    return new ValidationError(
      `Invalid URL provided: ${url}. Please provide a valid URL starting with http:// or https://`,
      { code: ErrorCodes.INVALID_URL, url }
    );
  }

  static connectionTimeout(url: string, timeout: number): NetworkError {
    return new NetworkError(
      `Connection timeout after ${timeout}ms while trying to reach ${url}`,
      { code: ErrorCodes.CONNECTION_TIMEOUT, url, timeout }
    );
  }

  static elementNotFound(selector: string): TestExecutionError {
    return new TestExecutionError(
      `Element not found: ${selector}`,
      { code: ErrorCodes.ELEMENT_NOT_FOUND, selector }
    );
  }

  static assertionFailed(assertion: string, actual?: any): TestExecutionError {
    return new TestExecutionError(
      `Assertion failed: ${assertion}${actual ? ` (actual: ${actual})` : ''}`,
      { code: ErrorCodes.ASSERTION_FAILED, assertion, actual }
    );
  }

  static browserLaunchFailed(browser: string, error: string): BrowserError {
    return new BrowserError(
      `Failed to launch ${browser} browser: ${error}`,
      { code: ErrorCodes.BROWSER_LAUNCH_FAILED, browser, originalError: error }
    );
  }

  static pageLoadFailed(url: string, error: string): BrowserError {
    return new BrowserError(
      `Failed to load page ${url}: ${error}`,
      { code: ErrorCodes.PAGE_LOAD_FAILED, url, originalError: error }
    );
  }

  static aiGenerationFailed(error: string): AIError {
    return new AIError(
      `AI test generation failed: ${error}`,
      { code: ErrorCodes.GENERATION_FAILED, originalError: error }
    );
  }

  static apiQuotaExceeded(): AIError {
    return new AIError(
      'Gemini API quota exceeded. Please check your API usage limits.',
      { code: ErrorCodes.API_QUOTA_EXCEEDED }
    );
  }

  static invalidAiResponse(response: string): AIError {
    return new AIError(
      'Invalid response received from Gemini AI. The response could not be parsed as valid test cases.',
      { code: ErrorCodes.INVALID_RESPONSE, response }
    );
  }

  static crawlFailed(url: string, error: string): WebsiteAnalysisError {
    return new WebsiteAnalysisError(
      `Failed to crawl website ${url}: ${error}`,
      { code: ErrorCodes.CRAWL_FAILED, url, originalError: error }
    );
  }

  static elementExtractionFailed(page: string, error: string): WebsiteAnalysisError {
    return new WebsiteAnalysisError(
      `Failed to extract elements from page ${page}: ${error}`,
      { code: ErrorCodes.ELEMENT_EXTRACTION_FAILED, page, originalError: error }
    );
  }

  static reportWriteFailed(path: string, error: string): ReportGenerationError {
    return new ReportGenerationError(
      `Failed to write report to ${path}: ${error}`,
      { code: ErrorCodes.REPORT_WRITE_FAILED, path, originalError: error }
    );
  }

  static screenshotFailed(path: string, error: string): BrowserError {
    return new BrowserError(
      `Failed to take screenshot: ${error}`,
      { code: ErrorCodes.SCREENSHOT_FAILED, path, originalError: error }
    );
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: Error, context?: string): FagunAutomationError {
    // If it's already our custom error, return as is
    if (error instanceof FagunAutomationError) {
      return error;
    }

    // Convert common errors to our custom errors
    if (error.name === 'TimeoutError') {
      return new TestExecutionError(
        `Operation timed out: ${error.message}`,
        { code: ErrorCodes.TIMEOUT_ERROR, originalError: error.message, context }
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError(
        `Network request failed: ${error.message}`,
        { code: ErrorCodes.CONNECTION_TIMEOUT, originalError: error.message, context }
      );
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return new NetworkError(
        `Network connection failed: ${error.message}`,
        { code: ErrorCodes.DNS_RESOLUTION_FAILED, originalError: error.message, context }
      );
    }

    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      return new NetworkError(
        `SSL/TLS error: ${error.message}`,
        { code: ErrorCodes.SSL_ERROR, originalError: error.message, context }
      );
    }

    // Default to generic automation error
    return new FagunAutomationError(
      error.message,
      'UNKNOWN_ERROR',
      { originalError: error.message, context, stack: error.stack }
    );
  }

  static async logError(error: FagunAutomationError, logger: any): Promise<void> {
    const logData = {
      name: error.name,
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack
    };

    logger.error(`Automation Error: ${error.message}`, logData);
  }

  static getErrorMessage(error: FagunAutomationError): string {
    const messages: Record<string, string> = {
      [ErrorCodes.MISSING_API_KEY]: 'Please set your Gemini API key in the environment variables or configuration file.',
      [ErrorCodes.INVALID_URL]: 'Please provide a valid URL starting with http:// or https://.',
      [ErrorCodes.CONNECTION_TIMEOUT]: 'The website is taking too long to respond. Please check if the URL is accessible.',
      [ErrorCodes.ELEMENT_NOT_FOUND]: 'The test could not find the required element on the page.',
      [ErrorCodes.ASSERTION_FAILED]: 'A test assertion failed. Check the test logic and page state.',
      [ErrorCodes.BROWSER_LAUNCH_FAILED]: 'Failed to start the browser. Please ensure Playwright is properly installed.',
      [ErrorCodes.PAGE_LOAD_FAILED]: 'Failed to load the webpage. Please check the URL and network connection.',
      [ErrorCodes.GENERATION_FAILED]: 'AI test generation failed. Please check your API key and try again.',
      [ErrorCodes.API_QUOTA_EXCEEDED]: 'API quota exceeded. Please check your Gemini API usage limits.',
      [ErrorCodes.CRAWL_FAILED]: 'Failed to analyze the website. Please check if the URL is accessible.',
      [ErrorCodes.REPORT_WRITE_FAILED]: 'Failed to generate the test report. Please check file permissions.',
      [ErrorCodes.SCREENSHOT_FAILED]: 'Failed to capture screenshot. Please check file permissions.'
    };

    return messages[error.code] || error.message;
  }

  static getRecoverySuggestion(error: FagunAutomationError): string {
    const suggestions: Record<string, string> = {
      [ErrorCodes.MISSING_API_KEY]: 'Get your API key from https://makersuite.google.com/app/apikey and set it as GEMINI_API_KEY environment variable.',
      [ErrorCodes.INVALID_URL]: 'Make sure the URL includes the protocol (http:// or https://) and is properly formatted.',
      [ErrorCodes.CONNECTION_TIMEOUT]: 'Try increasing the timeout value in configuration or check if the website is accessible.',
      [ErrorCodes.ELEMENT_NOT_FOUND]: 'The page structure may have changed. Try running the analysis again or check the element selectors.',
      [ErrorCodes.ASSERTION_FAILED]: 'Review the test case and ensure the expected conditions are correct.',
      [ErrorCodes.BROWSER_LAUNCH_FAILED]: 'Run "npx playwright install" to install browser dependencies.',
      [ErrorCodes.PAGE_LOAD_FAILED]: 'Verify the URL is correct and the website is accessible from your network.',
      [ErrorCodes.GENERATION_FAILED]: 'Check your internet connection and API key validity.',
      [ErrorCodes.API_QUOTA_EXCEEDED]: 'Wait for quota reset or upgrade your API plan.',
      [ErrorCodes.CRAWL_FAILED]: 'Ensure the website is accessible and not blocking automated requests.',
      [ErrorCodes.REPORT_WRITE_FAILED]: 'Check if the reports directory exists and has write permissions.',
      [ErrorCodes.SCREENSHOT_FAILED]: 'Ensure the screenshots directory exists and has write permissions.'
    };

    return suggestions[error.code] || 'Please check the error details and try again.';
  }
}
