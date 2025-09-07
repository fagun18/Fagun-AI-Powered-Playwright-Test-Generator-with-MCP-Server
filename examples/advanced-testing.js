#!/usr/bin/env node

/**
 * Advanced Testing Example for Fagun Automation Framework
 * 
 * This example demonstrates advanced testing scenarios including:
 * - API testing with authentication
 * - Cross-browser testing
 * - Visual regression testing
 * - Mobile device testing
 * - Data-driven testing
 * - Security testing
 * - Performance testing
 * - Edge case testing
 */

const { TestGenerator } = require('../dist/generator/TestGenerator');
const { PlaywrightRunner } = require('../dist/runner/PlaywrightRunner');
const { TestReporter } = require('../dist/reporter/TestReporter');
const { TestTemplates } = require('../dist/templates/TestTemplates');
const { TestDataManager } = require('../dist/data/TestDataManager');
const inquirer = require('inquirer').default;

async function runAdvancedTestingExample() {
    console.log('🚀 Fagun Automation Framework - Advanced Testing Example\n');
    
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
        console.log('🤖 Generating comprehensive test suite with all test types...');
        const testSuite = await testGenerator.generateTestSuite(targetUrl);
        
        // Step 2: API Testing Example
        console.log('\n🔌 API Testing Example:');
        const apiTests = testSuite.testCases.filter(tc => tc.type === 'api');
        if (apiTests.length > 0) {
            console.log(`   Found ${apiTests.length} API tests`);
            apiTests.slice(0, 3).forEach(test => {
                console.log(`   - ${test.name}: ${test.description}`);
            });
            
            // Run API tests
            const apiSuite = { ...testSuite, testCases: apiTests };
            console.log('   Running API tests...');
            await testRunner.runTestSuite(apiSuite);
        }
        
        // Step 3: Cross-Browser Testing Example
        console.log('\n🌐 Cross-Browser Testing Example:');
        const crossBrowserTests = testSuite.testCases.filter(tc => tc.type === 'cross-browser');
        if (crossBrowserTests.length > 0) {
            console.log(`   Found ${crossBrowserTests.length} cross-browser tests`);
            const browsers = [...new Set(crossBrowserTests.map(tc => tc.browser?.[0]).filter(Boolean))];
            console.log(`   Testing across browsers: ${browsers.join(', ')}`);
            
            // Run cross-browser tests
            const crossBrowserSuite = { ...testSuite, testCases: crossBrowserTests };
            console.log('   Running cross-browser tests...');
            await testRunner.runTestSuite(crossBrowserSuite);
        }
        
        // Step 4: Visual Regression Testing Example
        console.log('\n👁️ Visual Regression Testing Example:');
        const visualTests = testSuite.testCases.filter(tc => tc.type === 'visual-regression');
        if (visualTests.length > 0) {
            console.log(`   Found ${visualTests.length} visual regression tests`);
            visualTests.slice(0, 3).forEach(test => {
                console.log(`   - ${test.name}: ${test.description}`);
            });
            
            // Run visual regression tests
            const visualSuite = { ...testSuite, testCases: visualTests };
            console.log('   Running visual regression tests...');
            await testRunner.runTestSuite(visualSuite);
        }
        
        // Step 5: Mobile Testing Example
        console.log('\n📱 Mobile Testing Example:');
        const mobileTests = testSuite.testCases.filter(tc => tc.type === 'mobile');
        if (mobileTests.length > 0) {
            console.log(`   Found ${mobileTests.length} mobile tests`);
            const devices = [...new Set(mobileTests.map(tc => tc.device?.[0]).filter(Boolean))];
            console.log(`   Testing on devices: ${devices.join(', ')}`);
            
            // Run mobile tests
            const mobileSuite = { ...testSuite, testCases: mobileTests };
            console.log('   Running mobile tests...');
            await testRunner.runTestSuite(mobileSuite);
        }
        
        // Step 6: Data-Driven Testing Example
        console.log('\n📊 Data-Driven Testing Example:');
        const dataDrivenTests = testSuite.testCases.filter(tc => tc.type === 'data-driven');
        if (dataDrivenTests.length > 0) {
            console.log(`   Found ${dataDrivenTests.length} data-driven tests`);
            
            // Demonstrate test data usage
            const userCredentials = TestDataManager.getTestData('user_credentials');
            if (userCredentials) {
                console.log(`   Using ${userCredentials.data.length} user credential sets`);
                userCredentials.data.slice(0, 3).forEach(cred => {
                    console.log(`     - ${cred.username} (${cred.role})`);
                });
            }
            
            // Run data-driven tests
            const dataDrivenSuite = { ...testSuite, testCases: dataDrivenTests };
            console.log('   Running data-driven tests...');
            await testRunner.runTestSuite(dataDrivenSuite);
        }
        
        // Step 7: Security Testing Example
        console.log('\n🔒 Security Testing Example:');
        const securityTests = testSuite.testCases.filter(tc => tc.type === 'security');
        if (securityTests.length > 0) {
            console.log(`   Found ${securityTests.length} security tests`);
            
            // Demonstrate security payloads
            const securityPayloads = TestDataManager.getTestData('security_payloads');
            if (securityPayloads) {
                console.log(`   Using ${securityPayloads.data.length} security test payloads`);
                const payloadTypes = [...new Set(securityPayloads.data.map(p => p.type))];
                console.log(`   Testing for: ${payloadTypes.join(', ')}`);
            }
            
            // Run security tests
            const securitySuite = { ...testSuite, testCases: securityTests };
            console.log('   Running security tests...');
            await testRunner.runTestSuite(securitySuite);
        }
        
        // Step 8: Performance Testing Example
        console.log('\n⚡ Performance Testing Example:');
        const performanceTests = testSuite.testCases.filter(tc => tc.type === 'performance');
        if (performanceTests.length > 0) {
            console.log(`   Found ${performanceTests.length} performance tests`);
            
            // Demonstrate performance metrics
            const performanceData = TestDataManager.getTestData('performance_data');
            if (performanceData) {
                console.log(`   Monitoring ${performanceData.data.length} performance metrics:`);
                performanceData.data.slice(0, 5).forEach(metric => {
                    console.log(`     - ${metric.metric}: ${metric.threshold}${metric.unit} (${metric.priority})`);
                });
            }
            
            // Run performance tests
            const performanceSuite = { ...testSuite, testCases: performanceTests };
            console.log('   Running performance tests...');
            await testRunner.runTestSuite(performanceSuite);
        }
        
        // Step 9: Edge Case Testing Example
        console.log('\n🎯 Edge Case Testing Example:');
        const edgeCaseTests = testSuite.testCases.filter(tc => tc.type === 'edge-case');
        if (edgeCaseTests.length > 0) {
            console.log(`   Found ${edgeCaseTests.length} edge case tests`);
            edgeCaseTests.slice(0, 3).forEach(test => {
                console.log(`   - ${test.name}: ${test.description}`);
            });
            
            // Run edge case tests
            const edgeCaseSuite = { ...testSuite, testCases: edgeCaseTests };
            console.log('   Running edge case tests...');
            await testRunner.runTestSuite(edgeCaseSuite);
        }
        
        // Step 10: End-to-End Workflow Testing Example
        console.log('\n🔄 End-to-End Workflow Testing Example:');
        const e2eTests = testSuite.testCases.filter(tc => tc.type === 'e2e-workflow');
        if (e2eTests.length > 0) {
            console.log(`   Found ${e2eTests.length} E2E workflow tests`);
            e2eTests.slice(0, 3).forEach(test => {
                console.log(`   - ${test.name}: ${test.description}`);
                console.log(`     Steps: ${test.steps.length}`);
            });
            
            // Run E2E workflow tests
            const e2eSuite = { ...testSuite, testCases: e2eTests };
            console.log('   Running E2E workflow tests...');
            await testRunner.runTestSuite(e2eSuite);
        }
        
        // Step 11: Stress and Load Testing Example
        console.log('\n💪 Stress and Load Testing Example:');
        const stressTests = testSuite.testCases.filter(tc => tc.type === 'stress');
        const loadTests = testSuite.testCases.filter(tc => tc.type === 'load');
        
        if (stressTests.length > 0 || loadTests.length > 0) {
            console.log(`   Found ${stressTests.length} stress tests and ${loadTests.length} load tests`);
            
            // Run stress tests
            if (stressTests.length > 0) {
                const stressSuite = { ...testSuite, testCases: stressTests };
                console.log('   Running stress tests...');
                await testRunner.runTestSuite(stressSuite);
            }
            
            // Run load tests
            if (loadTests.length > 0) {
                const loadSuite = { ...testSuite, testCases: loadTests };
                console.log('   Running load tests...');
                await testRunner.runTestSuite(loadSuite);
            }
        }
        
        // Step 12: Usability and Compatibility Testing Example
        console.log('\n👥 Usability and Compatibility Testing Example:');
        const usabilityTests = testSuite.testCases.filter(tc => tc.type === 'usability');
        const compatibilityTests = testSuite.testCases.filter(tc => tc.type === 'compatibility');
        
        if (usabilityTests.length > 0 || compatibilityTests.length > 0) {
            console.log(`   Found ${usabilityTests.length} usability tests and ${compatibilityTests.length} compatibility tests`);
            
            // Run usability tests
            if (usabilityTests.length > 0) {
                const usabilitySuite = { ...testSuite, testCases: usabilityTests };
                console.log('   Running usability tests...');
                await testRunner.runTestSuite(usabilitySuite);
            }
            
            // Run compatibility tests
            if (compatibilityTests.length > 0) {
                const compatibilitySuite = { ...testSuite, testCases: compatibilityTests };
                console.log('   Running compatibility tests...');
                await testRunner.runTestSuite(compatibilitySuite);
            }
        }
        
        // Step 13: Generate comprehensive report
        console.log('\n📊 Generating comprehensive report...');
        const reportPath = await reporter.generateReport(testSuite);
        
        // Step 14: Display detailed results
        const summary = testRunner.getSummary();
        console.log('\n📋 Advanced Testing Summary:');
        console.log(`Total Tests Executed: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏭️  Skipped: ${summary.skipped}`);
        console.log(`⏱️  Total Duration: ${summary.duration}ms`);
        
        // Test type breakdown
        const testTypes = {};
        testSuite.testCases.forEach(test => {
            testTypes[test.type] = (testTypes[test.type] || 0) + 1;
        });
        
        console.log('\n📊 Test Results by Type:');
        Object.entries(testTypes).forEach(([type, count]) => {
            const typeResults = testSuite.results.filter(r => {
                const testCase = testSuite.testCases.find(tc => tc.id === r.testCaseId);
                return testCase && testCase.type === type;
            });
            const passed = typeResults.filter(r => r.status === 'passed').length;
            const failed = typeResults.filter(r => r.status === 'failed').length;
            const skipped = typeResults.filter(r => r.status === 'skipped').length;
            console.log(`   ${type}: ${passed}/${count} passed (${failed} failed, ${skipped} skipped)`);
        });
        
        console.log(`\n📄 Comprehensive report generated: ${reportPath}`);
        
        // Step 15: Demonstrate test template usage
        console.log('\n🔧 Test Template Usage Examples:');
        const templates = TestTemplates.getAllTemplates();
        templates.slice(0, 5).forEach(template => {
            console.log(`   - ${template.name}: ${template.description}`);
            console.log(`     Category: ${template.category}, Type: ${template.type}`);
            console.log(`     Variables: ${template.variables.join(', ')}`);
        });
        
        console.log('\n🎉 Advanced testing completed successfully!');
        console.log('🚀 Your application has been thoroughly tested across multiple dimensions!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    runAdvancedTestingExample();
}

module.exports = { runAdvancedTestingExample };
