import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TestGenerator } from '../generator/TestGenerator';
import { PlaywrightRunner } from '../runner/PlaywrightRunner';
import { TestReporter } from '../reporter/TestReporter';
import { TestTemplates } from '../templates/TestTemplates';
import { TestDataManager } from '../data/TestDataManager';

export class InteractiveCLI {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config.env');
  }

  async start(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Fagun AI-Powered Playwright Test Generator\n'));
    console.log(chalk.gray('Welcome to the comprehensive automated testing framework!\n'));

    try {
      // Step 1: Get target website from user
      const { targetUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'targetUrl',
          message: 'Enter the target website URL to test:',
          default: 'https://example.com',
          validate: (input: string) => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL (e.g., https://example.com)';
            }
          }
        }
      ]);

      console.log(chalk.green(`\n✅ Target website: ${targetUrl}\n`));

      // Step 2: Check and validate API key
      const apiKey = await this.validateApiKey();

      // Step 3: Get testing preferences
      const preferences = await this.getTestingPreferences();

      // Step 4: Run the testing
      await this.runTesting(targetUrl, apiKey, preferences);

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), (error as Error).message);
      process.exit(1);
    }
  }

  private async validateApiKey(): Promise<string> {
    // Check if config.env exists and has API key
    let config = {};
    if (await fs.pathExists(this.configPath)) {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      config = this.parseConfig(configContent);
    }

    let apiKey = (config as any)['GEMINI_API_KEY'] || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log(chalk.yellow('\n🔑 Gemini API Key Required'));
      console.log(chalk.gray('To use AI-powered test generation, you need a valid Gemini API key.'));
      console.log(chalk.gray('Get your API key from: https://makersuite.google.com/app/apikey\n'));

      const { useAI } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useAI',
          message: 'Do you want to use AI-powered test generation?',
          default: true
        }
      ]);

      if (useAI) {
        const { apiKeyInput } = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKeyInput',
            message: 'Enter your Gemini API key:',
            mask: '*',
            validate: (input: string) => {
              if (!input || input.trim().length === 0) {
                return 'API key is required';
              }
              return true;
            }
          }
        ]);

        apiKey = apiKeyInput.trim();

        // Save API key to config.env
        await this.saveApiKey(apiKey);
        console.log(chalk.green('✅ API key saved to config.env\n'));
      } else {
        console.log(chalk.yellow('⚠️  Proceeding with built-in test generation (no AI)\n'));
      }
    } else {
      console.log(chalk.green('✅ Using existing API key from config.env\n'));
    }

    return apiKey;
  }

  private async getTestingPreferences(): Promise<any> {
    // First ask for tester name
    const { testerName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'testerName',
        message: 'Enter your name as tester:',
        default: 'Fagun',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Tester name is required';
          }
          return true;
        }
      }
    ]);

    // Then ask if user wants all test types
    const { selectAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'selectAll',
        message: 'Do you want to run ALL test types? (Recommended for comprehensive testing)',
        default: true
      }
    ]);

    let testTypes: string[] = [];

    if (selectAll) {
      // Select all test types
      testTypes = [
        'functional', 'ui', 'accessibility', 'performance', 'security',
        'api', 'cross-browser', 'visual-regression', 'e2e-workflow', 'edge-case',
        'mobile', 'data-driven', 'stress', 'load', 'usability', 'compatibility'
      ];
      console.log(chalk.green('✅ All test types selected for comprehensive testing!'));
    } else {
      // Show numbered list for specific selection
      const testTypeOptions = [
        { name: '1. Functional Testing', value: 'functional', description: 'Forms, navigation, user workflows' },
        { name: '2. UI Testing', value: 'ui', description: 'Element visibility, responsiveness, interactions' },
        { name: '3. Accessibility Testing', value: 'accessibility', description: 'WCAG compliance, screen reader support' },
        { name: '4. Performance Testing', value: 'performance', description: 'Load times, Core Web Vitals' },
        { name: '5. Security Testing', value: 'security', description: 'XSS, injection attacks, validation' },
        { name: '6. API Testing', value: 'api', description: 'REST/GraphQL endpoint testing' },
        { name: '7. Cross-Browser Testing', value: 'cross-browser', description: 'Chrome, Firefox, Safari, Edge' },
        { name: '8. Visual Regression Testing', value: 'visual-regression', description: 'UI consistency validation' },
        { name: '9. End-to-End Workflow Testing', value: 'e2e-workflow', description: 'Complete user journeys' },
        { name: '10. Edge Case Testing', value: 'edge-case', description: 'Boundary conditions, error scenarios' },
        { name: '11. Mobile Testing', value: 'mobile', description: 'Device emulation, touch interactions' },
        { name: '12. Data-Driven Testing', value: 'data-driven', description: 'Parameterized test execution' },
        { name: '13. Stress Testing', value: 'stress', description: 'High load simulation' },
        { name: '14. Load Testing', value: 'load', description: 'Performance under normal/peak loads' },
        { name: '15. Usability Testing', value: 'usability', description: 'User experience validation' },
        { name: '16. Compatibility Testing', value: 'compatibility', description: 'Browser/OS compatibility' }
      ];

      console.log(chalk.blue('\n📋 Available Test Types:'));
      testTypeOptions.forEach(option => {
        console.log(chalk.gray(`   ${option.name} - ${option.description}`));
      });
      
      console.log(chalk.yellow('\n💡 Quick Examples:'));
      console.log(chalk.gray('   • All tests: Enter "all" or select "Yes" for all test types'));
      console.log(chalk.gray('   • Basic tests: Enter "1,2,3,4,5" (Functional, UI, Accessibility, Performance, Security)'));
      console.log(chalk.gray('   • Range: Enter "1-5" for tests 1 through 5'));
      console.log(chalk.gray('   • Mixed: Enter "1,3-5,8" for tests 1, 3, 4, 5, and 8'));
      console.log(chalk.gray('   • Mobile focus: Enter "1,2,11" (Functional, UI, Mobile)'));
      console.log(chalk.gray('   • Security focus: Enter "5,9,10" (Security, E2E, Edge Case)'));

      const { testTypeNumbers } = await inquirer.prompt([
        {
          type: 'input',
          name: 'testTypeNumbers',
          message: 'Enter test type numbers (comma-separated, e.g., 1,2,3,4,5 or 1-5 for range):',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Please enter at least one test type number';
            }
            
            // Handle "all" shortcut
            if (input.trim().toLowerCase() === 'all') {
              return true;
            }
            
            // Handle ranges like "1-5" and individual numbers like "1,2,3"
            const parts = input.split(',');
            const numbers: number[] = [];
            
            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.includes('-')) {
                // Handle range like "1-5"
                const [start, end] = trimmed.split('-').map((n: string) => parseInt(n.trim()));
                if (isNaN(start) || isNaN(end) || start < 1 || end > 16 || start > end) {
                  return `Invalid range: ${trimmed}. Please use format like "1-5" where 1 ≤ start ≤ end ≤ 16`;
                }
                for (let i = start; i <= end; i++) {
                  numbers.push(i);
                }
              } else {
                // Handle individual number
                const num = parseInt(trimmed);
                if (isNaN(num) || num < 1 || num > 16) {
                  return `Invalid number: ${trimmed}. Please enter numbers between 1 and 16`;
                }
                numbers.push(num);
              }
            }
            
            if (numbers.length === 0) {
              return 'Please enter at least one valid test type number';
            }
            
            return true;
          }
        }
      ]);

      // Parse selected numbers (including ranges and "all" shortcut)
      if (testTypeNumbers.trim().toLowerCase() === 'all') {
        // Select all test types
        testTypes = testTypeOptions.map(option => option.value);
      } else {
        const parts = testTypeNumbers.split(',');
        const selectedNumbers: number[] = [];
        
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            // Handle range like "1-5"
            const [start, end] = trimmed.split('-').map((n: string) => parseInt(n.trim()));
            for (let i = start; i <= end; i++) {
              selectedNumbers.push(i);
            }
          } else {
            // Handle individual number
            selectedNumbers.push(parseInt(trimmed));
          }
        }
        
        // Remove duplicates and sort
        const uniqueNumbers = [...new Set(selectedNumbers)].sort((a, b) => a - b);
        testTypes = uniqueNumbers.map(num => testTypeOptions[num - 1].value);
      }

      console.log(chalk.green(`\n✅ Selected ${testTypes.length} test types:`));
      testTypes.forEach((type, index) => {
        const option = testTypeOptions.find(opt => opt.value === type);
        console.log(chalk.gray(`   ${index + 1}. ${option?.name.replace(/^\d+\.\s*/, '')}`));
      });
    }

    // Ask for test execution preferences
    const { executionMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'executionMode',
        message: 'Choose execution mode:',
        choices: [
          { name: '🚀 Quick Test (10-20 tests, fast execution)', value: 'quick' },
          { name: '⚖️  Balanced Test (30-50 tests, moderate execution)', value: 'balanced' },
          { name: '🔍 Comprehensive Test (50-100 tests, thorough execution)', value: 'comprehensive' },
          { name: '🎯 Custom (specify exact number)', value: 'custom' }
        ],
        default: 'balanced'
      }
    ]);

    let maxTests: number;
    let runTests: boolean = true;

    if (executionMode === 'custom') {
      const { customMaxTests } = await inquirer.prompt([
        {
          type: 'number',
          name: 'customMaxTests',
          message: 'Enter maximum number of test cases to generate:',
          default: 50,
          validate: (input: number) => {
            if (input < 1 || input > 500) {
              return 'Please enter a number between 1 and 500';
            }
            return true;
          }
        }
      ]);
      maxTests = customMaxTests;
    } else {
      // Set maxTests based on execution mode
      switch (executionMode) {
        case 'quick':
          maxTests = 20;
          break;
        case 'balanced':
          maxTests = 50;
          break;
        case 'comprehensive':
          maxTests = 100;
          break;
        default:
          maxTests = 50;
      }
    }

    // Ask if user wants to execute tests immediately
    const { runTestsConfirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runTestsConfirm',
        message: 'Do you want to execute the tests immediately?',
        default: true
      }
    ]);

    runTests = runTestsConfirm;

    // Show summary of selected options
    console.log(chalk.blue('\n📊 Test Configuration Summary:'));
    console.log(chalk.gray(`   Test Types: ${testTypes.length} selected`));
    console.log(chalk.gray(`   Max Tests: ${maxTests}`));
    console.log(chalk.gray(`   Execution Mode: ${executionMode}`));
    console.log(chalk.gray(`   Tester: ${testerName}`));
    console.log(chalk.gray(`   Run Immediately: ${runTests ? 'Yes' : 'No'}`));

    return { testTypes, maxTests, runTests, testerName };
  }

  private async runTesting(targetUrl: string, apiKey: string, preferences: any): Promise<void> {
    console.log(chalk.blue('\n🚀 Starting test generation and execution...\n'));

    try {
      // Initialize components
      const testGenerator = new TestGenerator();
      const testRunner = new PlaywrightRunner();
      const reporter = new TestReporter();

      // Generate test suite
      console.log(chalk.blue('📊 Analyzing website...'));
      const configuration = {
        testTypes: preferences.testTypes.length,
        maxTests: preferences.maxTests,
        executionMode: preferences.executionMode || 'balanced',
        testerName: preferences.testerName || 'Fagun'
      };
      
      const testSuite = await testGenerator.generateTestSuite(targetUrl, configuration);

      // Filter tests based on user preferences
      const filteredTests = testSuite.testCases.filter(test => 
        preferences.testTypes.includes(test.type)
      ).slice(0, preferences.maxTests);

      const filteredTestSuite = {
        ...testSuite,
        testCases: filteredTests,
        configuration
      };

      // Display test breakdown
      const testTypes: Record<string, number> = {};
      filteredTestSuite.testCases.forEach(test => {
        testTypes[test.type] = (testTypes[test.type] || 0) + 1;
      });

      console.log(chalk.green(`\n✅ Generated ${filteredTestSuite.testCases.length} test cases:`));
      Object.entries(testTypes).forEach(([type, count]) => {
        console.log(chalk.gray(`   - ${type}: ${count} tests`));
      });

      if (preferences.runTests) {
        console.log(chalk.blue('\n🧪 Executing tests...'));
        await testRunner.runTestSuite(filteredTestSuite);

        // Display results
        const summary = testRunner.getSummary();
        console.log(chalk.blue('\n📋 Test Results:'));
        console.log(chalk.green(`✅ Passed: ${summary.passed}`));
        console.log(chalk.red(`❌ Failed: ${summary.failed}`));
        console.log(chalk.yellow(`⏭️  Skipped: ${summary.skipped}`));
        console.log(chalk.gray(`⏱️  Total Duration: ${(summary as any).duration || 'N/A'}ms`));

        // Generate report
        console.log(chalk.blue('\n📊 Generating report...'));
        const reportPath = await reporter.generateReport(filteredTestSuite);
        console.log(chalk.green(`📄 Report generated: ${reportPath}`));
      } else {
        console.log(chalk.yellow('\n⚠️  Tests generated but not executed.'));
        console.log(chalk.gray('Run the tests later using the generated test suite.'));
      }

      // Show additional features
      console.log(chalk.blue('\n🔧 Available Features:'));
      console.log(chalk.gray('   - Test Templates: Pre-built test scenarios'));
      console.log(chalk.gray('   - Test Data: Comprehensive test data sets'));
      console.log(chalk.gray('   - Advanced Actions: 40+ test actions'));
      console.log(chalk.gray('   - Multi-Device Testing: Mobile, tablet, desktop'));
      console.log(chalk.gray('   - Cross-Browser Testing: Chrome, Firefox, Safari, Edge'));

      console.log(chalk.green('\n🎉 Testing process completed successfully!'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error during testing:'), (error as Error).message);
      throw error;
    }
  }

  private async saveApiKey(apiKey: string): Promise<void> {
    let configContent = '';
    if (await fs.pathExists(this.configPath)) {
      configContent = await fs.readFile(this.configPath, 'utf8');
    } else {
      configContent = await fs.readFile(path.join(process.cwd(), 'config.env.example'), 'utf8');
    }

    // Update or add API key
    if (configContent.includes('GEMINI_API_KEY=')) {
      configContent = configContent.replace(
        /GEMINI_API_KEY=.*/,
        `GEMINI_API_KEY=${apiKey}`
      );
    } else {
      configContent += `\nGEMINI_API_KEY=${apiKey}\n`;
    }

    await fs.writeFile(this.configPath, configContent);
  }

  private parseConfig(configContent: string): Record<string, string> {
    const config: Record<string, string> = {};
    configContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    });
    return config;
  }
}
