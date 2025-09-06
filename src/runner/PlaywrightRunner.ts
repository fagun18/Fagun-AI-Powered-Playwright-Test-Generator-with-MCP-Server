import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { TestSuite, TestCase, TestResult, TestStep, LoginConfig } from '../types';
import config from '../config';
import * as fs from 'fs-extra';
import * as path from 'path';

export class PlaywrightRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private results: TestResult[] = [];

  constructor() {
    this.results = [];
  }

  async runTestSuite(testSuite: TestSuite, login?: LoginConfig): Promise<TestResult[]> {
    console.log(`🧪 Starting test execution for suite: ${testSuite.name}`);
    console.log(`📊 Total test cases: ${testSuite.testCases.length}`);

    testSuite.status = 'running';
    this.results = [];

    try {
      // Initialize browser
      await this.initializeBrowser();

      // Optional login step
      if (login && login.required) {
        const page = await this.context!.newPage();
        try {
          await page.goto(login.loginUrl || testSuite.website, { waitUntil: 'load', timeout: config.playwright.timeout });
          if (login.username && login.password) {
            const userSel = login.usernameSelector || 'input[type="email"], input[name*="user" i], input[name*="email" i]';
            const passSel = login.passwordSelector || 'input[type="password"], input[name*="pass" i]';
            const submitSel = login.submitSelector || 'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), input[type="submit"]';
            await page.fill(userSel, login.username, { timeout: 10000 }).catch(() => {});
            await page.fill(passSel, login.password, { timeout: 10000 }).catch(() => {});
            await page.click(submitSel, { timeout: 10000 }).catch(() => {});
            await page.waitForLoadState('load', { timeout: config.playwright.timeout }).catch(() => {});
          }
        } finally {
          await page.close();
        }
      }

      // Run tests
      if (config.test.parallel) {
        await this.runTestsInParallel(testSuite.testCases);
      } else {
        await this.runTestsSequentially(testSuite.testCases);
      }

      testSuite.status = 'completed';
      testSuite.results = this.results;

      console.log(`✅ Test execution completed. Results: ${this.getPassedCount()}/${this.results.length} passed`);
      return this.results;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      testSuite.status = 'failed';
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initializeBrowser(): Promise<void> {
    console.log('🌐 Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: config.playwright.headless,
      timeout: config.playwright.timeout,
    });

    this.context = await this.browser.newContext({
      viewport: config.playwright.viewport,
      userAgent: config.playwright.userAgent,
      recordVideo: {
        dir: config.output.videosDir,
        size: config.playwright.viewport,
      },
    });

    // Ensure output directories exist
    await fs.ensureDir(config.output.screenshotsDir);
    await fs.ensureDir(config.output.videosDir);
    await fs.ensureDir(config.output.reportsDir);
  }

  private async runTestsInParallel(testCases: TestCase[]): Promise<void> {
    const chunks = this.chunkArray(testCases, config.test.maxConcurrency);
    
    for (const chunk of chunks) {
      const promises = chunk.map(testCase => this.runTestCase(testCase));
      await Promise.all(promises);
    }
  }

  private async runTestsSequentially(testCases: TestCase[]): Promise<void> {
    for (const testCase of testCases) {
      await this.runTestCase(testCase);
    }
  }

  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    console.log(`🔍 Running test: ${testCase.name} (${testCase.type})`);

    const result: TestResult = {
      testCaseId: testCase.id,
      status: 'pending',
      duration: 0,
      logs,
      timestamp: new Date(),
    };

    let page: Page | null = null;

    try {
      // Create new page for each test
      page = await this.context!.newPage();
      
      // Set up logging
      page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
      });

      page.on('pageerror', error => {
        logs.push(`[ERROR] ${error.message}`);
      });

      // Collect HTTP errors for this test case
      const httpErrors: { url: string; status: number }[] = [];
      page.on('response', resp => {
        const status = resp.status();
        if (status >= 400) {
          httpErrors.push({ url: resp.url(), status });
        }
      });

      // Execute test steps with per-test timeout
      const perTestTimeout = (config as any).test.maxTestDurationMs || 20000;
      const controller = { cancelled: false };
      const timer = setTimeout(() => { controller.cancelled = true; }, perTestTimeout);
      try {
        for (const step of testCase.steps) {
          if (controller.cancelled) throw new Error('Test timed out');
          await this.executeStep(page, step, logs);
        }
      } finally {
        clearTimeout(timer);
      }

      result.status = 'passed';
      result.duration = Date.now() - startTime;

      // Take screenshot on success
      const screenshotPath = path.join(config.output.screenshotsDir, `${testCase.id}_success.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;

      console.log(`✅ Test passed: ${testCase.name} (${result.duration}ms)`);

    } catch (error) {
      result.status = 'failed';
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : String(error);

      // Take screenshot on failure
      if (page) {
        const screenshotPath = path.join(config.output.screenshotsDir, `${testCase.id}_failed.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
      }

      console.log(`❌ Test failed: ${testCase.name} - ${result.error}`);

    } finally {
      if (page) {
        await page.close();
      }
    }

    // attach collected http errors if any
    if (!result.httpErrors) result.httpErrors = [];
    // Note: httpErrors is captured per page listener scope; option to attach if needed
    this.results.push(result);
    return result;
  }

  private async executeStep(page: Page, step: TestStep, logs: string[]): Promise<void> {
    logs.push(`Executing: ${step.description}`);

    try {
      switch (step.action) {
        case 'navigate':
          await page.goto(step.target!, { 
            waitUntil: 'networkidle',
            timeout: step.timeout || config.playwright.timeout 
          });
          break;

        case 'click':
          await page.click(step.target!, { 
            timeout: step.timeout || 5000 
          });
          break;

        case 'type':
          await page.fill(step.target!, step.value || '', { 
            timeout: step.timeout || 5000 
          });
          break;

        case 'select':
          await page.selectOption(step.target!, step.value!, { 
            timeout: step.timeout || 5000 
          });
          break;

        case 'hover':
          await page.hover(step.target!, { 
            timeout: step.timeout || 5000 
          });
          break;

        case 'scroll':
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          break;

        case 'wait':
          await page.waitForTimeout(step.timeout || 1000);
          break;

        case 'assert':
          await this.executeAssertion(page, step.assertion!, step.timeout);
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      logs.push(`✅ Step completed: ${step.description}`);

    } catch (error) {
      logs.push(`❌ Step failed: ${step.description} - ${error}`);
      throw error;
    }
  }

  private async executeAssertion(page: Page, assertion: string, timeout?: number): Promise<void> {
    const timeoutMs = timeout || 5000;
    
    try {
      // Handle different types of assertions
      if (assertion.includes('isVisible()')) {
        const selector = assertion.match(/page\.locator\('([^']+)'\)/)?.[1];
        if (selector) {
          await page.waitForSelector(selector, { 
            state: 'visible',
            timeout: timeoutMs 
          });
        }
      } else if (assertion.includes('count()')) {
        const selector = assertion.match(/page\.locator\('([^']+)'\)/)?.[1];
        const expectedCount = assertion.match(/count\(\)\s*([><=]+)\s*(\d+)/);
        if (selector && expectedCount) {
          const operator = expectedCount[1];
          const count = parseInt(expectedCount[2]);
          const actualCount = await page.locator(selector).count();
          
          if (operator === '>' && actualCount <= count) {
            throw new Error(`Expected count > ${count}, got ${actualCount}`);
          } else if (operator === '<' && actualCount >= count) {
            throw new Error(`Expected count < ${count}, got ${actualCount}`);
          } else if (operator === '=' && actualCount !== count) {
            throw new Error(`Expected count = ${count}, got ${actualCount}`);
          }
        }
      } else if (assertion.includes('page.url()')) {
        const expectedUrl = assertion.match(/page\.url\(\)\s*===\s*['"]([^'"]+)['"]/)?.[1];
        if (expectedUrl) {
          const currentUrl = page.url();
          if (currentUrl !== expectedUrl) {
            throw new Error(`Expected URL ${expectedUrl}, got ${currentUrl}`);
          }
        }
      } else if (assertion.includes('performance.now()')) {
        const performanceTime = await page.evaluate(() => performance.now());
        const expectedTime = assertion.match(/performance\.now\(\)\s*([><=]+)\s*(\d+)/);
        if (expectedTime) {
          const operator = expectedTime[1];
          const time = parseInt(expectedTime[2]);
          
          if (operator === '<' && performanceTime >= time) {
            throw new Error(`Expected performance time < ${time}ms, got ${performanceTime}ms`);
          }
        }
      } else if (assertion.includes('page.content()')) {
        const content = await page.content();
        const expectedContent = assertion.match(/page\.content\(\)\.includes\(['"]([^'"]+)['"]/)?.[1];
        const shouldInclude = !assertion.includes('!');
        
        if (expectedContent) {
          const includes = content.includes(expectedContent);
          if (shouldInclude && !includes) {
            throw new Error(`Expected content to include "${expectedContent}"`);
          } else if (!shouldInclude && includes) {
            throw new Error(`Expected content to not include "${expectedContent}"`);
          }
        }
      } else {
        // Generic assertion evaluation
        const result = await page.evaluate((assertion) => {
          try {
            return eval(assertion);
          } catch (error) {
            return false;
          }
        }, assertion);
        
        if (!result) {
          throw new Error(`Assertion failed: ${assertion}`);
        }
      }
    } catch (error) {
      throw new Error(`Assertion failed: ${assertion} - ${error}`);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private getPassedCount(): number {
    return this.results.filter(result => result.status === 'passed').length;
  }

  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runSingleTest(testCase: TestCase): Promise<TestResult> {
    console.log(`🧪 Running single test: ${testCase.name}`);
    
    try {
      await this.initializeBrowser();
      const result = await this.runTestCase(testCase);
      return result;
    } finally {
      await this.cleanup();
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary(): { total: number; passed: number; failed: number; skipped: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
    };
  }
}

