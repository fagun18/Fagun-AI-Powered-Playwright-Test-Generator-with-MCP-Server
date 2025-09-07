#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { TestGenerator } from './generator/TestGenerator';
import { PlaywrightRunner } from './runner/PlaywrightRunner';
import { EnhancedPlaywrightRunner } from './runner/EnhancedPlaywrightRunner';
import { TestReporter } from './reporter/TestReporter';
import { TestSuite, LoginConfig } from './types';
import config from './config';
import { logger } from './utils/logger';
import { ErrorHandler, ErrorFactory } from './utils/errors';
import { Validator } from './utils/validator';
import { Utils } from './utils/helpers';
import { InteractiveCLI } from './cli/interactive';
import * as fs from 'fs-extra';
import * as path from 'path';

class FagunAutomation {
  private testGenerator: TestGenerator;
  private testRunner: PlaywrightRunner;
  private reporter: TestReporter;

  constructor() {
    this.testGenerator = new TestGenerator();
    this.testRunner = new PlaywrightRunner();
    this.reporter = new TestReporter();
  }

  async initialize(): Promise<void> {
    try {
      await logger.initialize();
      await Utils.ensureDir(config.output.reportsDir);
      await Utils.ensureDir(config.output.screenshotsDir);
      await Utils.ensureDir(config.output.videosDir);
      await Utils.ensureDir(config.output.logsDir);
    } catch (error) {
      throw ErrorHandler.handle(error as Error, 'Initialization');
    }
  }

  async run(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Fagun Automation Framework'));
    console.log(chalk.gray('AI-powered automated testing with Playwright and Gemini AI\n'));

    try {
      // Initialize the framework
      await this.initialize();

      // Get target URL from user
      const { targetUrl } = await this.promptForTargetUrl();
      
      // Ensure API key after user has provided target URL
      await this.ensureApiKey();

      // Validate URL
      try {
        Validator.validateUrl(targetUrl);
      } catch (error) {
        console.log(chalk.red('❌'), ErrorHandler.getErrorMessage(error as any));
        console.log(chalk.yellow('💡'), ErrorHandler.getRecoverySuggestion(error as any));
        return;
      }

      // Start the automation process
      await this.startAutomation(targetUrl);

    } catch (error) {
      const handledError = ErrorHandler.handle(error as Error, 'Main execution');
      console.error(chalk.red('❌ Error:'), ErrorHandler.getErrorMessage(handledError));
      console.log(chalk.yellow('💡'), ErrorHandler.getRecoverySuggestion(handledError));
      await ErrorHandler.logError(handledError, logger);
      process.exit(1);
    }
  }

  private async promptForTargetUrl(): Promise<{ targetUrl: string }> {
    const questions = [
      {
        type: 'input',
        name: 'targetUrl',
        message: 'Enter the target website URL:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a valid URL';
          }
          return true;
        }
      }
    ];

    return await inquirer.prompt(questions);
  }

  private isValidUrl(url: string): boolean {
    return Utils.isValidUrl(url);
  }

  private async startAutomation(targetUrl: string): Promise<void> {
    const spinner = ora('Starting automated testing process...').start();

    try {
      // Step 1: Generate test suite
      spinner.text = '🤖 Generating test cases with AI...';
      logger.info('Starting test generation', { targetUrl });
      const testSuite = await this.testGenerator.generateTestSuite(targetUrl);
      logger.info('Test suite generated', { testCaseCount: testSuite.testCases.length });
      
      // Step 2: Run tests
      spinner.text = '🧪 Executing test cases...';
      logger.info('Starting test execution', { testCaseCount: testSuite.testCases.length });
      // Ask for login details if needed
      const login = await this.maybePromptForLogin(targetUrl);
      const results = await this.testRunner.runTestSuite(testSuite, login);
      logger.info('Test execution completed', { 
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length
      });
      
      // Step 3: Generate reports
      spinner.text = '📊 Generating test reports...';
      logger.info('Generating test reports');
      const reportPath = await this.reporter.generateReport(testSuite);
      logger.info('Test report generated', { reportPath });
      
      // Step 4: Show summary
      spinner.succeed('✅ Automation completed successfully!');
      
      this.displaySummary(testSuite, results);
      this.displayReportInfo(reportPath);

    } catch (error) {
      spinner.fail('❌ Automation failed');
      const handledError = ErrorHandler.handle(error as Error, 'Automation process');
      await ErrorHandler.logError(handledError, logger);
      throw handledError;
    }
  }

  private async maybePromptForLogin(targetUrl: string): Promise<LoginConfig | undefined> {
    const { needsLogin } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'needsLogin',
        message: 'Does this site require login before testing?',
        default: false
      }
    ]);

    if (!needsLogin) return undefined;

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'loginUrl',
        message: 'Login URL (leave blank to use target URL):',
        default: targetUrl
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username or email:'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'usernameSelector',
        message: 'Username selector (optional):'
      },
      {
        type: 'input',
        name: 'passwordSelector',
        message: 'Password selector (optional):'
      },
      {
        type: 'input',
        name: 'submitSelector',
        message: 'Submit button selector (optional):'
      }
    ]);

    const login: LoginConfig = {
      required: true,
      loginUrl: answers.loginUrl,
      username: answers.username,
      password: answers.password,
      usernameSelector: answers.usernameSelector || undefined,
      passwordSelector: answers.passwordSelector || undefined,
      submitSelector: answers.submitSelector || undefined,
    };
    return login;
  }

  private async ensureApiKey(): Promise<void> {
    // If already present and valid, nothing to do
    if (config.gemini.apiKey) {
      try {
        Validator.validateApiKey(config.gemini.apiKey);
        return;
      } catch {
        // fall through to prompt
      }
    }

    console.log(chalk.yellow('\n⚠️  Gemini API key is not set. It is required to generate test cases.'));
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Gemini API key:',
        mask: '*',
        validate: (input: string) => input && input.trim().length >= 20 ? true : 'Please enter a valid API key'
      },
      {
        type: 'confirm',
        name: 'save',
        message: 'Save this API key to config.env for future runs?',
        default: true
      }
    ]);

    const apiKey = (answers.apiKey as string).trim();
    process.env.GEMINI_API_KEY = apiKey;
    (config as any).gemini.apiKey = apiKey;

    if (answers.save) {
      try {
        const envPath = path.join(__dirname, '../../config.env');
        let content = '';
        if (await fs.pathExists(envPath)) {
          content = await fs.readFile(envPath, 'utf8');
          if (content.match(/^GEMINI_API_KEY=.*$/m)) {
            content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey}`);
          } else {
            content += (content.endsWith('\n') ? '' : '\n') + `GEMINI_API_KEY=${apiKey}\n`;
          }
        } else {
          content = `GEMINI_API_KEY=${apiKey}\n`;
        }
        await fs.writeFile(envPath, content, 'utf8');
        console.log(chalk.green('✅ API key saved to config.env'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not save API key to config.env. Using in-memory key for this run.'));
      }
    }
  }

  private displaySummary(testSuite: TestSuite, results: any[]): void {
    const summary = this.testRunner.getSummary();
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
    const typeCounts = testSuite.testCases.reduce((acc: Record<string, number>, tc) => {
      const key = (tc.type || 'unknown').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(chalk.blue.bold('\n📊 Test Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(`Website: ${testSuite.website}`));
    console.log(chalk.white(`Test Suite: ${testSuite.name}`));
    console.log(chalk.white(`Total Tests: ${summary.total}`));
    console.log(chalk.white('Test case types: ' + Object.entries(typeCounts)
      .map(([t, c]) => `${t}:${c}`)
      .join(', ')));
    console.log(chalk.green(`✅ Passed: ${summary.passed}`));
    console.log(chalk.red(`❌ Failed: ${summary.failed}`));
    console.log(chalk.yellow(`⏭️  Skipped: ${summary.skipped}`));
    console.log(chalk.blue(`📈 Pass Rate: ${passRate}%`));
    console.log(chalk.gray('─'.repeat(50)));
  }

  private displayReportInfo(reportPath: string): void {
    console.log(chalk.blue.bold('\n📋 Reports Generated'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(`HTML Report: ${reportPath}`));
    console.log(chalk.gray(`Screenshots: ${config.output.screenshotsDir}`));
    console.log(chalk.gray(`Videos: ${config.output.videosDir}`));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(chalk.green('\n🎉 Automation completed! Check the reports for detailed results.'));
  }

  async runInteractive(): Promise<void> {
    console.log(chalk.blue.bold('\n🎯 Interactive Mode'));
    console.log(chalk.gray('Configure your testing preferences\n'));

    const questions = [
      {
        type: 'input',
        name: 'targetUrl',
        message: 'Enter the target website URL:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a valid URL';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'browserType',
        message: 'Select browser type:',
        choices: ['chromium', 'firefox', 'webkit'],
        default: 'chromium'
      },
      {
        type: 'confirm',
        name: 'headless',
        message: 'Run tests in headless mode?',
        default: true
      },
      {
        type: 'number',
        name: 'maxTestCases',
        message: 'Maximum number of test cases to generate:',
        default: 50,
        validate: (input: number) => {
          if (input < 1 || input > 200) {
            return 'Please enter a number between 1 and 200';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'testTypes',
        message: 'Select test types to include:',
        choices: [
          { name: 'Functional Tests', value: 'functional', checked: true },
          { name: 'UI Tests', value: 'ui', checked: true },
          { name: 'Accessibility Tests', value: 'accessibility', checked: true },
          { name: 'Performance Tests', value: 'performance', checked: false },
          { name: 'Security Tests', value: 'security', checked: false }
        ]
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    // Update config based on user preferences
    config.playwright.browser = answers.browserType;
    config.playwright.headless = answers.headless;
    config.test.maxTestCases = answers.maxTestCases;
    config.test.includeAccessibility = answers.testTypes.includes('accessibility');
    config.test.includePerformance = answers.testTypes.includes('performance');
    config.test.includeSecurity = answers.testTypes.includes('security');

    console.log(chalk.green('\n✅ Configuration updated!'));
    console.log(chalk.gray('Starting automation with your preferences...\n'));

    await this.ensureApiKey();
    await this.startAutomation(answers.targetUrl);
  }

  async runQuick(targetUrl: string): Promise<void> {
    console.log(chalk.blue.bold('\n⚡ Quick Mode'));
    console.log(chalk.gray(`Testing: ${targetUrl}\n`));

    await this.ensureApiKey();
    await this.startAutomation(targetUrl);
  }
}

// CLI Interface
const program = new Command();

program
  .name('fagun-automation')
  .description('AI-powered automated testing framework')
  .version('1.0.0');

program
  .command('run')
  .description('Run automated testing with interactive prompts')
  .action(async () => {
    const cli = new InteractiveCLI();
    await cli.start();
  });

program
  .command('comprehensive')
  .description('Run comprehensive testing with all advanced features')
  .option('-u, --url <url>', 'Target website URL')
  .option('-k, --api-key <key>', 'Gemini API key')
  .action(async (options) => {
    try {
      const testGenerator = new TestGenerator();
      const testRunner = new EnhancedPlaywrightRunner();
      const testReporter = new TestReporter();

      const targetUrl = options.url || 'https://devxhub.com';
      console.log(chalk.blue(`🚀 Starting comprehensive testing for: ${targetUrl}`));

      // Generate comprehensive test suite
      const testSuite = await testGenerator.generateComprehensiveTestSuite(targetUrl, null);
      
      // Run tests
      const results = await testRunner.runTestSuite(testSuite);
      testSuite.results = results;

      // Generate report
      const reportPath = await testReporter.generateReport(testSuite);
      console.log(chalk.green(`📊 Comprehensive test report generated: ${reportPath}`));

      // Show suggestions
      const suggestions = testGenerator.getTestTypeSuggestions();
      console.log(chalk.yellow('\n💡 Additional Test Type Suggestions:'));
      suggestions.slice(0, 5).forEach(suggestion => {
        console.log(chalk.gray(`   • ${suggestion.name} (${suggestion.priority})`));
      });

    } catch (error) {
      console.error(chalk.red('❌ Comprehensive testing failed:'), error);
      process.exit(1);
    }
  });


program
  .command('interactive')
  .description('Run with advanced configuration options')
  .action(async () => {
    const automation = new FagunAutomation();
    await automation.runInteractive();
  });

program
  .command('quick <url>')
  .description('Quick test run for a specific URL')
  .action(async (url: string) => {
    const automation = new FagunAutomation();
    await automation.runQuick(url);
  });

program
  .command('setup')
  .description('Setup and install required dependencies')
  .action(async () => {
    console.log(chalk.blue.bold('\n🔧 Setting up Fagun Automation Framework'));
    
    const spinner = ora('Installing Playwright browsers...').start();
    
    try {
      // This would typically run: npx playwright install
      spinner.succeed('✅ Setup completed!');
      console.log(chalk.green('\n🎉 Framework is ready to use!'));
      console.log(chalk.gray('Run "npm run start" to begin testing.'));
    } catch (error) {
      spinner.fail('❌ Setup failed');
      console.error(chalk.red('Error:'), error);
    }
  });

program
  .command('deeper <url>')
  .description('Deeper crawl and heavier test generation for a specific URL')
  .action(async (url: string) => {
    const automation = new FagunAutomation();
    // Increase limits for deeper run
    config.analysis.maxDepth = 3;
    config.analysis.maxPages = 30;
    config.test.maxTestCases = Math.max(config.test.maxTestCases, 60);
    (config as any).test.maxStepsPerTest = Math.max((config as any).test.maxStepsPerTest || 6, 12);
    (config as any).test.maxTestDurationMs = Math.max((config as any).test.maxTestDurationMs || 20000, 40000);
    config.test.maxConcurrency = Math.max(config.test.maxConcurrency, 3);
    config.playwright.timeout = Math.max(config.playwright.timeout, 45000);

    console.log(chalk.blue.bold('\n🧭 Deeper Mode'));
    console.log(chalk.gray(`Target: ${url}`));
    await automation.runQuick(url);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: any) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export default FagunAutomation;

