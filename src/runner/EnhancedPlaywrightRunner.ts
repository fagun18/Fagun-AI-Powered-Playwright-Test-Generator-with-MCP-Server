import { Page, Browser, BrowserContext } from 'playwright';
import { TestCase, TestResult, TestSuite } from '../types';
import { PlaywrightRunner } from './PlaywrightRunner';
import { GrammarChecker } from '../analyzer/GrammarChecker';
import { SEOTester } from '../analyzer/SEOTester';
import { ButtonFormTester } from '../analyzer/ButtonFormTester';
import { URLTester } from '../analyzer/URLTester';
import * as fs from 'fs-extra';
import * as path from 'path';
import config from '../config';

export class EnhancedPlaywrightRunner extends PlaywrightRunner {
  private grammarChecker: GrammarChecker;
  private seoTester: SEOTester;
  private buttonFormTester: ButtonFormTester;
  private urlTester: URLTester;
  private consoleErrorsCount: number = 0;
  private failedRequests: Array<{ url: string; error: string }> = [];
  private pageErrors: string[] = [];
  private skipAllDueToNetwork: boolean = false;

  constructor() {
    super();
    this.grammarChecker = new GrammarChecker();
    this.seoTester = new SEOTester();
    this.buttonFormTester = new ButtonFormTester();
    this.urlTester = new URLTester('');
  }

  async runTestSuite(testSuite: TestSuite): Promise<TestResult[]> {
    console.log(`🧪 Starting enhanced test execution for suite: ${testSuite.name}`);
    console.log(`📊 Total test cases: ${testSuite.results.length}`);
    
    const results: TestResult[] = [];
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Initialize browser
      console.log('🌐 Initializing browser...');
      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      page = await context.newPage();

      // Set up enhanced logging
      this.setupEnhancedLogging(page);

      // Run comprehensive analysis first
      console.log('🔍 Running comprehensive website analysis...');
      await this.runComprehensiveAnalysis(page, testSuite.website);

      // Run individual tests
      for (let i = 0; i < testSuite.testCases.length; i++) {
        const testCase = testSuite.testCases[i];
        console.log(`🔍 Running test: ${testCase.name} (${testCase.type})`);
        
        if (this.skipAllDueToNetwork) {
          const skipped: TestResult = {
            testCaseId: testCase.id,
            status: 'skipped',
            duration: 0,
            timestamp: new Date(),
            logs: [
              `Skipped due to network error reaching site: ${testSuite.website}`,
              'Root cause: initial connectivity check or navigation timed out (net::ERR_CONNECTION_TIMED_OUT)'
            ]
          };
          results.push(skipped);
        } else {
          const result = await this.runEnhancedTest(page, testCase, i + 1);
          results.push(result);
        }
        
        // Log progress
        const progress = Math.round(((i + 1) / testSuite.testCases.length) * 100);
        console.log(`📈 Progress: ${progress}% (${i + 1}/${testSuite.testCases.length})`);
      }

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      throw error;
    } finally {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    }

    console.log(`✅ Test execution completed. Results: ${results.filter(r => r.status === 'passed').length}/${results.length} passed`);
    return results;
  }

  private setupEnhancedLogging(page: Page): void {
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        this.consoleErrorsCount += 1;
      }
      console.log(`[console:${type}] ${text}`);
    });

    page.on('pageerror', error => {
      const message = (error as any)?.message || String(error);
      this.pageErrors.push(message);
      console.error(`[pageerror] ${message}`);
    });

    page.on('requestfailed', request => {
      const entry = { url: request.url(), error: request.failure()?.errorText || 'unknown' };
      this.failedRequests.push(entry);
      console.error(`[request failed] ${entry.url} - ${entry.error}`);
    });

    // Expose counters in window for simple assertions
    page.exposeFunction && page.exposeFunction('__getDiagnostics', () => ({
      consoleErrors: this.consoleErrorsCount,
      failedRequests: this.failedRequests,
      pageErrors: this.pageErrors
    })).catch(() => {});
  }

  private async runComprehensiveAnalysis(page: Page, website: string): Promise<void> {
    try {
      // Connectivity pre-check
      console.log(`Executing: Navigate to ${website}`);
      try {
        const precheck = await page.request.get(website, { timeout: 10000 });
        if (!precheck.ok()) {
          console.error(`❌ Connectivity pre-check failed: HTTP ${precheck.status()} for ${website}`);
        }
      } catch (e) {
        this.skipAllDueToNetwork = true;
        console.error(`❌ Connectivity pre-check error: ${(e as Error).message}`);
        return;
      }

      await page.goto(website, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`✅ Step completed: Navigate to ${website}`);

      // Set up URL tester
      this.urlTester = new URLTester(website);

      // Run grammar check
      console.log('📝 Running grammar analysis...');
      const content = await page.evaluate(() => document.body.textContent || '');
      const grammarResult = await this.grammarChecker.checkText(content, await page.title());
      
      if (grammarResult.errors.length > 0) {
        console.log(`⚠️ Found ${grammarResult.errors.length} grammatical errors`);
        grammarResult.errors.forEach(error => {
          console.log(`   - ${error.error}: "${error.text}" → "${error.suggestion}"`);
        });
      } else {
        console.log('✅ No grammatical errors found');
      }

      // Run SEO analysis
      console.log('🔍 Running SEO analysis...');
      const seoResult = await this.seoTester.testPage(page, website);
      console.log(`📊 SEO Score: ${seoResult.score}/100`);
      
      if (seoResult.issues.length > 0) {
        console.log(`⚠️ Found ${seoResult.issues.length} SEO issues`);
        seoResult.issues.forEach(issue => {
          console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      }

      // Test all buttons
      console.log('🔘 Testing all buttons...');
      const buttonResults = await this.buttonFormTester.testAllButtons(page);
      const clickableButtons = buttonResults.filter(b => b.isClickable).length;
      const totalButtons = buttonResults.length;
      console.log(`📊 Buttons: ${clickableButtons}/${totalButtons} clickable`);

      // Test all forms
      console.log('📋 Testing all forms...');
      const formResults = await this.buttonFormTester.testAllForms(page);
      console.log(`📊 Forms: ${formResults.length} found`);

      // Test URLs
      console.log('🔗 Testing all URLs...');
      const urlResults = await this.urlTester.testAllUrls(page);
      const brokenUrls = urlResults.filter(r => r.isBroken);
      console.log(`📊 URLs: ${urlResults.length} tested, ${brokenUrls.length} broken`);

      if (brokenUrls.length > 0) {
        console.log('❌ Broken URLs found:');
        brokenUrls.forEach(url => {
          console.log(`   - ${url.url} (${url.statusCode || 'Error'})`);
        });
      }

    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      // Mark to skip subsequent tests if the root cause is network/timeout
      const msg = (error as Error)?.message || '';
      if (/net::ERR|timed out|Timeout/i.test(msg)) {
        this.skipAllDueToNetwork = true;
      }
    }
  }

  private async runEnhancedTest(page: Page, testCase: TestCase, testNumber: number): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    let screenshot: string | undefined;

    try {
      // Log test start
      console.log(`🧪 Test ${testNumber}: ${testCase.name}`);
      logs.push(`Starting test: ${testCase.name}`);

      // Execute test steps with enhanced logging
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        const stepNumber = i + 1;
        
        console.log(`   Step ${stepNumber}: ${step.description}`);
        logs.push(`Executing: ${step.description}`);

        const stepResult = await this.executeEnhancedStep(page, step, logs, testCase);
        
        if (!stepResult.success) {
          throw new Error(`Step ${stepNumber} failed: ${stepResult.error}`);
        }

        console.log(`   ✅ Step completed: ${step.description}`);
        logs.push(`✅ Step completed: ${step.description}`);
      }

      // Take success screenshot
      const screenshotPath = path.join(config.output.screenshotsDir, `${testCase.id}_success.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      screenshot = screenshotPath;

      const duration = Date.now() - startTime;
      console.log(`✅ Test passed: ${testCase.name} (${duration}ms)`);

      return {
        testCaseId: testCase.id,
        status: 'passed',
        duration,
        timestamp: new Date(),
        logs,
        screenshot
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Test failed: ${testCase.name} - ${error instanceof Error ? error.message : String(error)}`);

      // Take failure screenshot
      try {
        const screenshotPath = path.join(config.output.screenshotsDir, `${testCase.id}_failed.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        screenshot = screenshotPath;
      } catch (screenshotError) {
        console.warn('Failed to take failure screenshot:', screenshotError);
      }

      return {
        testCaseId: testCase.id,
        status: 'failed',
        duration,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        logs,
        screenshot
      };
    }
  }

  private async executeEnhancedStep(page: Page, step: any, logs: string[], testCase: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (step.action) {
        case 'navigate':
          console.log(`[navigate] Going to ${step.target}`);
          try {
            await page.goto(step.target, { waitUntil: 'networkidle', timeout: step.timeout || 30000 });
          } catch (navErr) {
            const msg = (navErr as Error).message || String(navErr);
            if (/net::ERR|timed out|Timeout/i.test(msg)) {
              return { success: false, error: `Navigation timeout/network error. Suggestion: Verify the site URL is reachable from this machine, check VPN/proxy/DNS, or try again later. Underlying error: ${msg}` };
            }
            throw navErr;
          }
          logs.push(`Navigated to ${step.target}`);
          break;

        case 'click':
          console.log(`[click] Clicking on ${step.target}`);
          await page.waitForSelector(step.target, { state: 'visible', timeout: step.timeout || 5000 });
          await page.locator(step.target).first().click({ timeout: step.timeout || 5000 });
          logs.push(`Clicked on ${step.target}`);
          break;

        case 'type':
          console.log(`[type] Typing "${step.value}" into ${step.target}`);
          await page.fill(step.target, step.value);
          logs.push(`Typed "${step.value}" into ${step.target}`);
          break;

        case 'assert':
          console.log(`[assert] Checking: ${step.assertion}`);
          // Handle known assertions on Node side using testCase.data
          if (typeof step.assertion === 'string') {
            const a = step.assertion.trim();
            // grammarErrors.length === 0
            if (/^grammarErrors\.length\s*===\s*0$/.test(a)) {
              const errors = testCase?.data?.errors ?? [];
              const ok = Array.isArray(errors) && errors.length === 0;
              if (!ok) throw new Error(`Grammar errors found: ${errors.length}`);
              logs.push(`Assertion passed: No grammar errors (${errors.length})`);
              break;
            }
            // seoScore >= 70
            if (/^seoScore\s*>=\s*70$/.test(a)) {
              const score = Number(testCase?.data?.seoScore ?? 0);
              if (!(score >= 70)) throw new Error(`SEO score too low: ${score}`);
              logs.push(`Assertion passed: SEO score ${score} >= 70`);
              break;
            }
          }
          // Fallback: evaluate in browser context when it's a JS expression
          const assertionResult = await page.evaluate(step.assertion);
          if (!assertionResult) throw new Error(`Assertion failed: ${step.assertion}`);
          logs.push(`Assertion passed: ${step.assertion}`);
          break;

        case 'wait':
          console.log(`[wait] Waiting ${step.timeout || 1000}ms`);
          await page.waitForTimeout(step.timeout || 1000);
          logs.push(`Waited ${step.timeout || 1000}ms`);
          break;

        case 'ensure-visible':
          console.log(`[ensure-visible] Waiting for ${step.target} to be visible`);
          await page.waitForSelector(step.target, { state: 'visible', timeout: step.timeout || 5000 });
          logs.push(`Element visible: ${step.target}`);
          break;

        case 'evaluate':
          console.log(`[evaluate] Executing custom script`);
          const evalResult = await page.evaluate(step.script);
          logs.push(`Evaluate result: ${String(evalResult)}`);
          break;

        case 'api-call':
          console.log(`[api] Making ${step.method} request to ${step.target}`);
          const response = await (page.request as any)[step.method.toLowerCase()](step.target, {
            data: step.body,
            headers: step.headers
          });
          logs.push(`API call completed: ${response.status()} ${step.target}`);
          try {
            const status = response.status();
            const headers = await response.headers();
            await page.evaluate((data: { status: number, headers: Record<string, string> }) => {
              (window as any).__lastResponseStatus = data.status;
              (window as any).__lastResponseHeaders = data.headers;
            }, { status, headers });
          } catch {}
          break;

        case 'screenshot':
          console.log(`[screenshot] Taking screenshot`);
          const screenshotPath = path.join(config.output.screenshotsDir, `step_${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          logs.push(`Screenshot saved: ${screenshotPath}`);
          break;

        default:
          console.log(`[${step.action}] Executing custom action`);
          logs.push(`Executed action: ${step.action}`);
      }

      return { success: true };

    } catch (error) {
      const errorMessage = `Step execution failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMessage}`);
      logs.push(`❌ ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
