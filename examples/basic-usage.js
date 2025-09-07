#!/usr/bin/env node

/**
 * Comprehensive Usage Example for Fagun Automation Framework
 * 
 * This example demonstrates how to use the framework with all the new test types
 * and advanced features including templates, test data, and specialized testing.
 */

const { TestGenerator } = require('../dist/generator/TestGenerator');
const { PlaywrightRunner } = require('../dist/runner/PlaywrightRunner');
const { TestReporter } = require('../dist/reporter/TestReporter');
const { TestTemplates } = require('../dist/templates/TestTemplates');
const { TestDataManager } = require('../dist/data/TestDataManager');
const inquirer = require('inquirer').default;

async function runComprehensiveExample() {
    console.log('🚀 Fagun Automation Framework - Comprehensive Usage Example\n');
    
    try {
        // Get target URL from user
        const { targetUrl } = await inquirer.prompt([
            {
                type: 'input',
                name: 'targetUrl',
                message: 'Enter the target website URL to test:',
                default: 'https://devxhub.com',
                validate: (input) => {
                    try {
                        new URL(input);
                        return true;
                    } catch {
                        return 'Please enter a valid URL (e.g., https://example.com)';
                    }
                }
            }
        ]);

        // Initialize components
        const testGenerator = new TestGenerator();
        const testRunner = new PlaywrightRunner();
        const reporter = new TestReporter();
        
        console.log(`📊 Analyzing website: ${targetUrl}`);
        
        // Step 1: Generate comprehensive test suite
        console.log('🤖 Generating comprehensive test suite...');
        const testSuite = await testGenerator.generateTestSuite(targetUrl);
        
        // Display test types breakdown
        const testTypes = {};
        testSuite.testCases.forEach(test => {
            testTypes[test.type] = (testTypes[test.type] || 0) + 1;
        });
        
        console.log(`✅ Generated ${testSuite.testCases.length} test cases across ${Object.keys(testTypes).length} test types:`);
        Object.entries(testTypes).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count} tests`);
        });
        
        // Step 2: Demonstrate test templates
        console.log('\n📋 Available Test Templates:');
        const templates = TestTemplates.getAllTemplates();
        templates.forEach(template => {
            console.log(`   - ${template.name} (${template.category}/${template.type})`);
        });
        
        // Step 3: Demonstrate test data
        console.log('\n📊 Available Test Data Sets:');
        const testDataSets = TestDataManager.getAllTestData();
        testDataSets.forEach(dataSet => {
            console.log(`   - ${dataSet.name} (${dataSet.type}): ${dataSet.data.length} records`);
        });
        
        // Step 4: Generate custom test using template
        console.log('\n🔧 Generating custom test using template...');
        const loginTemplate = TestTemplates.getTemplate('login_flow');
        if (loginTemplate) {
            const customTest = TestTemplates.generateTestCaseFromTemplate('login_flow', {
                userType: 'admin',
                loginUrl: targetUrl + '/login',
                usernameSelector: '#username',
                passwordSelector: '#password',
                submitSelector: '#login-btn',
                username: 'admin@example.com',
                password: 'Admin123!',
                successUrl: '/dashboard'
            });
            console.log(`✅ Generated custom test: ${customTest.name}`);
        }
        
        // Step 5: Run tests with different configurations
        console.log('\n🧪 Executing test cases...');
        
        // Run functional tests first
        const functionalTests = testSuite.testCases.filter(tc => tc.type === 'functional');
        if (functionalTests.length > 0) {
            console.log(`   Running ${functionalTests.length} functional tests...`);
            const functionalSuite = { ...testSuite, testCases: functionalTests };
            await testRunner.runTestSuite(functionalSuite);
        }
        
        // Run API tests
        const apiTests = testSuite.testCases.filter(tc => tc.type === 'api');
        if (apiTests.length > 0) {
            console.log(`   Running ${apiTests.length} API tests...`);
            const apiSuite = { ...testSuite, testCases: apiTests };
            await testRunner.runTestSuite(apiSuite);
        }
        
        // Run mobile tests
        const mobileTests = testSuite.testCases.filter(tc => tc.type === 'mobile');
        if (mobileTests.length > 0) {
            console.log(`   Running ${mobileTests.length} mobile tests...`);
            const mobileSuite = { ...testSuite, testCases: mobileTests };
            await testRunner.runTestSuite(mobileSuite);
        }
        
        // Run all remaining tests
        const remainingTests = testSuite.testCases.filter(tc => 
            !['functional', 'api', 'mobile'].includes(tc.type)
        );
        if (remainingTests.length > 0) {
            console.log(`   Running ${remainingTests.length} additional tests...`);
            const remainingSuite = { ...testSuite, testCases: remainingTests };
            await testRunner.runTestSuite(remainingSuite);
        }
        
        // Step 6: Generate comprehensive report
        console.log('\n📊 Generating comprehensive report...');
        const reportPath = await reporter.generateReport(testSuite);
        
        // Display detailed summary
        const summary = testRunner.getSummary();
        console.log('\n📋 Comprehensive Test Summary:');
        console.log(`Total Tests: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏭️  Skipped: ${summary.skipped}`);
        console.log(`⏱️  Total Duration: ${summary.duration}ms`);
        
        // Test type breakdown
        console.log('\n📊 Test Results by Type:');
        Object.entries(testTypes).forEach(([type, count]) => {
            const typeResults = testSuite.results.filter(r => {
                const testCase = testSuite.testCases.find(tc => tc.id === r.testCaseId);
                return testCase && testCase.type === type;
            });
            const passed = typeResults.filter(r => r.status === 'passed').length;
            const failed = typeResults.filter(r => r.status === 'failed').length;
            console.log(`   ${type}: ${passed}/${count} passed (${failed} failed)`);
        });
        
        console.log(`\n📄 Comprehensive report generated: ${reportPath}`);
        
        // Step 7: Demonstrate test data usage
        console.log('\n🔍 Test Data Examples:');
        const userCredentials = TestDataManager.getTestData('user_credentials');
        if (userCredentials) {
            console.log('   Sample user credentials:');
            userCredentials.data.slice(0, 3).forEach(cred => {
                console.log(`     - ${cred.username} (${cred.role})`);
            });
        }
        
        const securityPayloads = TestDataManager.getTestData('security_payloads');
        if (securityPayloads) {
            console.log('   Sample security test payloads:');
            securityPayloads.data.slice(0, 3).forEach(payload => {
                console.log(`     - ${payload.type}: ${payload.payload.substring(0, 30)}...`);
            });
        }
        
        console.log('\n🎉 Comprehensive testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    runComprehensiveExample();
}

module.exports = { runComprehensiveExample };

