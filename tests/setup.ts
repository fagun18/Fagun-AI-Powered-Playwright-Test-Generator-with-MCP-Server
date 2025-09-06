// Test setup file
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createMockTestCase: () => ({
    id: 'test-1',
    name: 'Test Case',
    description: 'Test description',
    type: 'functional',
    priority: 'high',
    steps: [
      {
        action: 'navigate',
        target: 'https://example.com',
        description: 'Navigate to page',
        timeout: 30000
      }
    ],
    expectedResult: 'Test passes',
    page: 'https://example.com'
  }),
  
  createMockTestSuite: () => ({
    id: 'suite-1',
    name: 'Test Suite',
    description: 'Test suite description',
    website: 'https://example.com',
    testCases: [global.testUtils.createMockTestCase()],
    results: [],
    createdAt: new Date(),
    status: 'pending'
  }),
  
  createMockWebsiteElement: () => ({
    type: 'button',
    selector: 'button.submit',
    text: 'Submit',
    attributes: { class: 'submit' }
  })
};
