import { TestGenerator } from '../../src/generator/TestGenerator';
import { PlaywrightRunner } from '../../src/runner/PlaywrightRunner';
import { TestReporter } from '../../src/reporter/TestReporter';
import { WebsiteAnalyzer } from '../../src/analyzer/WebsiteAnalyzer';
import { GeminiService } from '../../src/ai/GeminiService';
import { TestSuite, TestCase } from '../../src/types';
import { Utils } from '../../src/utils/helpers';
import { Validator } from '../../src/utils/validator';
import { ErrorFactory } from '../../src/utils/errors';

// Mock dependencies
jest.mock('../../src/ai/GeminiService');
jest.mock('../../src/analyzer/WebsiteAnalyzer');
jest.mock('playwright');

describe('Integration Tests', () => {
  let testGenerator: TestGenerator;
  let testRunner: PlaywrightRunner;
  let reporter: TestReporter;
  let mockGeminiService: jest.Mocked<GeminiService>;
  let mockWebsiteAnalyzer: jest.Mocked<WebsiteAnalyzer>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockGeminiService = new GeminiService('mock-api-key') as jest.Mocked<GeminiService>;
    mockWebsiteAnalyzer = new WebsiteAnalyzer() as jest.Mocked<WebsiteAnalyzer>;
    
    // Create instances with mocked dependencies
    testGenerator = new TestGenerator();
    testRunner = new PlaywrightRunner();
    reporter = new TestReporter();
    
    // Mock the dependencies
    (testGenerator as any).geminiService = mockGeminiService;
    (testGenerator as any).websiteAnalyzer = mockWebsiteAnalyzer;
  });

  describe('TestGenerator Integration', () => {
    it('should generate test suite successfully', async () => {
      // Mock website analysis
      const mockAnalysis = {
        baseUrl: 'https://example.com',
        pages: [
          {
            url: 'https://example.com',
            title: 'Example Page',
            elements: [
              {
                type: 'button',
                selector: 'button.submit',
                text: 'Submit'
              }
            ],
            forms: [],
            links: [],
            images: [],
            meta: {},
            performance: { loadTime: 1000, domSize: 100, resourceCount: 10 }
          }
        ],
        sitemap: ['https://example.com'],
        technologies: ['HTML', 'CSS'],
        forms: [],
        navigation: [],
        totalElements: 1,
        analysisDate: new Date()
      };

      // Mock AI test generation
      const mockTestCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test Button Click',
          description: 'Test clicking the submit button',
          type: 'functional',
          priority: 'high',
          steps: [
            {
              action: 'navigate',
              target: 'https://example.com',
              description: 'Navigate to page',
              timeout: 30000
            },
            {
              action: 'click',
              target: 'button.submit',
              description: 'Click submit button',
              timeout: 5000
            }
          ],
          expectedResult: 'Button click works',
          page: 'https://example.com'
        }
      ];

      mockWebsiteAnalyzer.analyzeWebsite.mockResolvedValue(mockAnalysis);
      mockGeminiService.generateTestCases.mockResolvedValue(mockTestCases);

      // Execute
      const testSuite = await testGenerator.generateTestSuite('https://example.com');

      // Verify
      expect(testSuite).toBeDefined();
      expect(testSuite.website).toBe('https://example.com');
      expect(testSuite.testCases).toHaveLength(1);
      expect(testSuite.testCases[0].name).toBe('Test Button Click');
      expect(mockWebsiteAnalyzer.analyzeWebsite).toHaveBeenCalledWith('https://example.com');
      expect(mockGeminiService.generateTestCases).toHaveBeenCalledWith(mockAnalysis);
    });

    it('should handle website analysis failure', async () => {
      // Mock website analysis failure
      mockWebsiteAnalyzer.analyzeWebsite.mockRejectedValue(new Error('Analysis failed'));

      // Execute and verify
      await expect(testGenerator.generateTestSuite('https://example.com'))
        .rejects.toThrow('Analysis failed');
    });

    it('should handle AI generation failure', async () => {
      // Mock successful website analysis
      const mockAnalysis = {
        baseUrl: 'https://example.com',
        pages: [],
        sitemap: [],
        technologies: [],
        forms: [],
        navigation: [],
        totalElements: 0,
        analysisDate: new Date()
      };

      mockWebsiteAnalyzer.analyzeWebsite.mockResolvedValue(mockAnalysis);
      mockGeminiService.generateTestCases.mockRejectedValue(new Error('AI generation failed'));

      // Execute and verify
      await expect(testGenerator.generateTestSuite('https://example.com'))
        .rejects.toThrow('AI generation failed');
    });
  });

  describe('PlaywrightRunner Integration', () => {
    it('should run test suite successfully', async () => {
      // Mock test suite
      const mockTestSuite: TestSuite = {
        id: 'suite-1',
        name: 'Test Suite',
        description: 'Test suite description',
        website: 'https://example.com',
        testCases: [
          {
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
            expectedResult: 'Page loads',
            page: 'https://example.com'
          }
        ],
        results: [],
        createdAt: new Date(),
        status: 'pending'
      };

      // Mock Playwright
      const mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
        evaluate: jest.fn().mockResolvedValue(true)
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockBrowser = {
        newContext: jest.fn().mockResolvedValue(mockContext),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockPlaywright = {
        chromium: {
          launch: jest.fn().mockResolvedValue(mockBrowser)
        }
      };

      // Mock the playwright module
      jest.doMock('playwright', () => ({
        chromium: mockPlaywright.chromium
      }));

      // Execute
      const results = await testRunner.runTestSuite(mockTestSuite);

      // Verify
      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(results[0].testCaseId).toBe('test-1');
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
    });

    it('should handle test execution failure', async () => {
      // Mock test suite with failing test
      const mockTestSuite: TestSuite = {
        id: 'suite-1',
        name: 'Test Suite',
        description: 'Test suite description',
        website: 'https://example.com',
        testCases: [
          {
            id: 'test-1',
            name: 'Failing Test',
            description: 'Test that will fail',
            type: 'functional',
            priority: 'high',
            steps: [
              {
                action: 'navigate',
                target: 'https://invalid-url.com',
                description: 'Navigate to invalid URL',
                timeout: 30000
              }
            ],
            expectedResult: 'Page loads',
            page: 'https://invalid-url.com'
          }
        ],
        results: [],
        createdAt: new Date(),
        status: 'pending'
      };

      // Mock Playwright with failure
      const mockPage = {
        goto: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot'))
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockBrowser = {
        newContext: jest.fn().mockResolvedValue(mockContext),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockPlaywright = {
        chromium: {
          launch: jest.fn().mockResolvedValue(mockBrowser)
        }
      };

      jest.doMock('playwright', () => ({
        chromium: mockPlaywright.chromium
      }));

      // Execute
      const results = await testRunner.runTestSuite(mockTestSuite);

      // Verify
      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('Navigation failed');
    });
  });

  describe('TestReporter Integration', () => {
    it('should generate HTML report successfully', async () => {
      // Mock test suite with results
      const mockTestSuite: TestSuite = {
        id: 'suite-1',
        name: 'Test Suite',
        description: 'Test suite description',
        website: 'https://example.com',
        testCases: [
          {
            id: 'test-1',
            name: 'Test Case',
            description: 'Test description',
            type: 'functional',
            priority: 'high',
            steps: [],
            expectedResult: 'Test passes',
            page: 'https://example.com'
          }
        ],
        results: [
          {
            testCaseId: 'test-1',
            status: 'passed',
            duration: 1000,
            logs: ['Test executed successfully'],
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        status: 'completed'
      };

      // Mock file system
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      const mockEnsureDir = jest.fn().mockResolvedValue(undefined);

      jest.doMock('fs-extra', () => ({
        writeFile: mockWriteFile,
        ensureDir: mockEnsureDir
      }));

      // Execute
      const reportPath = await reporter.generateReport(mockTestSuite);

      // Verify
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('.html');
      expect(mockEnsureDir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should generate JSON report successfully', async () => {
      // Mock test suite
      const mockTestSuite: TestSuite = {
        id: 'suite-1',
        name: 'Test Suite',
        description: 'Test suite description',
        website: 'https://example.com',
        testCases: [],
        results: [],
        createdAt: new Date(),
        status: 'completed'
      };

      // Mock file system
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      const mockEnsureDir = jest.fn().mockResolvedValue(undefined);

      jest.doMock('fs-extra', () => ({
        writeFile: mockWriteFile,
        ensureDir: mockEnsureDir
      }));

      // Execute
      const reportPath = await reporter.generateJSONReport(mockTestSuite);

      // Verify
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('.json');
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full automation workflow', async () => {
      // Mock all dependencies
      const mockAnalysis = {
        baseUrl: 'https://example.com',
        pages: [
          {
            url: 'https://example.com',
            title: 'Example Page',
            elements: [
              {
                type: 'button',
                selector: 'button.submit',
                text: 'Submit'
              }
            ],
            forms: [],
            links: [],
            images: [],
            meta: {},
            performance: { loadTime: 1000, domSize: 100, resourceCount: 10 }
          }
        ],
        sitemap: ['https://example.com'],
        technologies: ['HTML', 'CSS'],
        forms: [],
        navigation: [],
        totalElements: 1,
        analysisDate: new Date()
      };

      const mockTestCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test Button Click',
          description: 'Test clicking the submit button',
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
          expectedResult: 'Button click works',
          page: 'https://example.com'
        }
      ];

      // Mock all services
      mockWebsiteAnalyzer.analyzeWebsite.mockResolvedValue(mockAnalysis);
      mockGeminiService.generateTestCases.mockResolvedValue(mockTestCases);

      // Mock Playwright
      const mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot'))
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockBrowser = {
        newContext: jest.fn().mockResolvedValue(mockContext),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockPlaywright = {
        chromium: {
          launch: jest.fn().mockResolvedValue(mockBrowser)
        }
      };

      jest.doMock('playwright', () => ({
        chromium: mockPlaywright.chromium
      }));

      // Mock file system
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      const mockEnsureDir = jest.fn().mockResolvedValue(undefined);

      jest.doMock('fs-extra', () => ({
        writeFile: mockWriteFile,
        ensureDir: mockEnsureDir
      }));

      // Execute full workflow
      const testSuite = await testGenerator.generateTestSuite('https://example.com');
      const results = await testRunner.runTestSuite(testSuite);
      const reportPath = await reporter.generateReport(testSuite);

      // Verify complete workflow
      expect(testSuite).toBeDefined();
      expect(testSuite.testCases).toHaveLength(1);
      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('.html');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors gracefully', () => {
      // Test URL validation
      expect(() => Validator.validateUrl('invalid-url')).toThrow();
      
      // Test API key validation
      expect(() => Validator.validateApiKey('')).toThrow();
      
      // Test test case validation
      expect(() => Validator.validateTestCase({})).toThrow();
    });

    it('should handle error factory correctly', () => {
      const error = ErrorFactory.missingApiKey();
      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIG_ERROR');
    });

    it('should handle utility functions with errors', () => {
      expect(() => Utils.isValidUrl('invalid')).toBe(false);
      expect(Utils.formatDuration(1000)).toBe('1.0s');
    });
  });
});
