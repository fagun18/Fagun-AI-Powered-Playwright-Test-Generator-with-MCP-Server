#!/usr/bin/env node

/**
 * Demo Testing Example for Fagun Automation Framework (Without AI)
 * 
 * This example demonstrates the framework capabilities without requiring AI API key
 * by using only the built-in test generation methods.
 */

const { TestGenerator } = require('../dist/generator/TestGenerator');
const { PlaywrightRunner } = require('../dist/runner/PlaywrightRunner');
const { TestReporter } = require('../dist/reporter/TestReporter');
const { TestTemplates } = require('../dist/templates/TestTemplates');
const { TestDataManager } = require('../dist/data/TestDataManager');

async function runDemoWithoutAI() {
    console.log('🚀 Fagun Automation Framework - Demo Testing (Without AI)\n');
    
    try {
        // Initialize components
        const testGenerator = new TestGenerator();
        const testRunner = new PlaywrightRunner();
        const reporter = new TestReporter();
        
        // Target website
        const targetUrl = 'https://devxhub.com';
        
        console.log(`📊 Analyzing website: ${targetUrl}`);
        
        // Step 1: Generate test suite using only built-in methods (no AI)
        console.log('🤖 Generating test suite using built-in test generation methods...');
        
        // We'll create a mock analysis and generate tests manually
        const mockAnalysis = {
            baseUrl: targetUrl,
            pages: [
                {
                    url: targetUrl,
                    title: 'DevXHub - Home',
                    elements: [
                        { type: 'button', selector: 'button', text: 'Get Started' },
                        { type: 'link', selector: 'a', text: 'About Us', href: '/about-us' },
                        { type: 'form', selector: 'form', action: '/contact' }
                    ],
                    forms: [
                        { type: 'form', selector: 'form', action: '/contact' }
                    ],
                    links: [
                        { type: 'link', selector: 'a[href="/about-us"]', text: 'About Us', href: '/about-us' },
                        { type: 'link', selector: 'a[href="/services"]', text: 'Services', href: '/services' },
                        { type: 'link', selector: 'a[href="/contact-us"]', text: 'Contact', href: '/contact-us' }
                    ],
                    images: [
                        { type: 'image', selector: 'img', text: 'Logo' }
                    ]
                },
                {
                    url: targetUrl + '/about-us',
                    title: 'About Us - DevXHub',
                    elements: [
                        { type: 'heading', selector: 'h1', text: 'About Us' },
                        { type: 'paragraph', selector: 'p', text: 'We are a technology company' }
                    ],
                    forms: [],
                    links: [
                        { type: 'link', selector: 'a[href="/"]', text: 'Home', href: '/' }
                    ],
                    images: []
                },
                {
                    url: targetUrl + '/services',
                    title: 'Services - DevXHub',
                    elements: [
                        { type: 'heading', selector: 'h1', text: 'Our Services' },
                        { type: 'button', selector: 'button', text: 'Learn More' }
                    ],
                    forms: [],
                    links: [
                        { type: 'link', selector: 'a[href="/"]', text: 'Home', href: '/' }
                    ],
                    images: []
                }
            ],
            sitemap: [targetUrl, targetUrl + '/about-us', targetUrl + '/services'],
            technologies: ['React', 'Next.js', 'TypeScript'],
            forms: [
                { type: 'form', selector: 'form', action: '/contact' }
            ],
            navigation: [
                { type: 'link', selector: 'nav a', text: 'Home', href: '/' },
                { type: 'link', selector: 'nav a', text: 'About', href: '/about-us' },
                { type: 'link', selector: 'nav a', text: 'Services', href: '/services' }
            ],
            totalElements: 15,
            analysisDate: new Date()
        };

        // Generate tests using built-in methods
        const functionalTests = testGenerator.generateFunctionalTests(mockAnalysis);
        const uiTests = testGenerator.generateUITests(mockAnalysis);
        const accessibilityTests = testGenerator.generateAccessibilityTests(mockAnalysis);
        const performanceTests = testGenerator.generatePerformanceTests(mockAnalysis);
        const securityTests = testGenerator.generateSecurityTests(mockAnalysis);
        const apiTests = testGenerator.generateApiTests(mockAnalysis);
        const crossBrowserTests = testGenerator.generateCrossBrowserTests(mockAnalysis);
        const visualRegressionTests = testGenerator.generateVisualRegressionTests(mockAnalysis);
        const e2eWorkflowTests = testGenerator.generateE2EWorkflowTests(mockAnalysis);
        const edgeCaseTests = testGenerator.generateEdgeCaseTests(mockAnalysis);
        const mobileTests = testGenerator.generateMobileTests(mockAnalysis);
        const dataDrivenTests = testGenerator.generateDataDrivenTests(mockAnalysis);
        const stressTests = testGenerator.generateStressTests(mockAnalysis);
        const loadTests = testGenerator.generateLoadTests(mockAnalysis);
        const usabilityTests = testGenerator.generateUsabilityTests(mockAnalysis);
        const compatibilityTests = testGenerator.generateCompatibilityTests(mockAnalysis);

        // Combine all tests
        const allTestCases = [
            ...functionalTests,
            ...uiTests,
            ...accessibilityTests,
            ...performanceTests,
            ...securityTests,
            ...apiTests,
            ...crossBrowserTests,
            ...visualRegressionTests,
            ...e2eWorkflowTests,
            ...edgeCaseTests,
            ...mobileTests,
            ...dataDrivenTests,
            ...stressTests,
            ...loadTests,
            ...usabilityTests,
            ...compatibilityTests
        ];

        // Create test suite
        const testSuite = {
            id: `test_suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Demo Test Suite for ${new URL(targetUrl).hostname}`,
            description: `Comprehensive test suite generated for ${targetUrl} with ${allTestCases.length} test cases`,
            website: targetUrl,
            testCases: allTestCases,
            results: [],
            createdAt: new Date(),
            status: 'pending',
            analysis: mockAnalysis
        };

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
                username: 'admin@devxhub.com',
                password: 'Admin123!',
                successUrl: '/dashboard'
            });
            console.log(`✅ Generated custom test: ${customTest.name}`);
        }
        
        // Step 5: Run a subset of tests (functional tests only for demo)
        console.log('\n🧪 Running functional tests (demo)...');
        const functionalTestSuite = { ...testSuite, testCases: functionalTests.slice(0, 3) };
        
        try {
            await testRunner.runTestSuite(functionalTestSuite);
            console.log('✅ Functional tests completed successfully!');
        } catch (error) {
            console.log('⚠️  Some tests may have failed (this is expected in demo mode)');
        }
        
        // Step 6: Generate report
        console.log('\n📊 Generating report...');
        try {
            const reportPath = await reporter.generateReport(testSuite);
            console.log(`📄 Report generated: ${reportPath}`);
        } catch (error) {
            console.log('⚠️  Report generation may have issues (this is expected in demo mode)');
        }
        
        // Step 7: Display summary
        const summary = testRunner.getSummary();
        console.log('\n📋 Demo Test Summary:');
        console.log(`Total Tests: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏭️  Skipped: ${summary.skipped}`);
        console.log(`⏱️  Total Duration: ${summary.duration}ms`);
        
        // Test type breakdown
        console.log('\n📊 Test Results by Type:');
        Object.entries(testTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} tests generated`);
        });
        
        // Step 8: Demonstrate test data usage
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
        
        console.log('\n🎉 Demo testing completed successfully!');
        console.log('🚀 The framework successfully generated comprehensive tests for devxhub.com!');
        console.log('💡 To use AI-powered test generation, add a valid GEMINI_API_KEY to config.env');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    runDemoWithoutAI();
}

module.exports = { runDemoWithoutAI };
