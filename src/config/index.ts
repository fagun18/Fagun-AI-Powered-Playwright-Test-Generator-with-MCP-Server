import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../config.env') });

export const config = {
  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    maxTokens: 2048,
    temperature: 0.7,
    // Enable grounding with Google Search where supported
    useGrounding: true as boolean,
    useV1Alpha: true as boolean,
  },

  // Playwright Configuration
  playwright: {
    timeout: parseInt(process.env.DEFAULT_TIMEOUT || '35000'),
    headless: process.env.HEADLESS_MODE === 'true',
    browser: process.env.BROWSER_TYPE || 'chromium',
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  // Test Configuration
  test: {
    maxTestCases: parseInt(process.env.MAX_TEST_CASES || '20'),
    includeAccessibility: process.env.INCLUDE_ACCESSIBILITY_TESTS === 'true',
    includePerformance: process.env.INCLUDE_PERFORMANCE_TESTS === 'true',
    includeSecurity: process.env.INCLUDE_SECURITY_TESTS === 'true',
    retryCount: 2,
    parallel: true,
    maxConcurrency: 2,
    maxStepsPerTest: parseInt(process.env.MAX_STEPS_PER_TEST || '6'),
    maxTestDurationMs: parseInt(process.env.MAX_TEST_DURATION_MS || '20000'),
  },

  // Output Configuration
  output: {
    reportsDir: process.env.REPORTS_DIR || './reports',
    screenshotsDir: process.env.SCREENSHOTS_DIR || './screenshots',
    videosDir: process.env.VIDEOS_DIR || './videos',
    logsDir: './logs',
  },

  // Website Analysis Configuration
  analysis: {
    maxDepth: 2,
    maxPages: 15,
    includeExternalLinks: false,
    respectRobotsTxt: true,
    crawlDelay: 1000,
  },
};

export default config;

