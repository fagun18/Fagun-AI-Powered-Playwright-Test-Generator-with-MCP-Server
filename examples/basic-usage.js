#!/usr/bin/env node

/**
 * Basic Usage Example for Fagun Automation Framework
 * 
 * This example demonstrates how to use the framework programmatically
 * instead of using the CLI interface.
 */

const { TestGenerator } = require('../src/generator/TestGenerator');
const { PlaywrightRunner } = require('../src/runner/PlaywrightRunner');
const { TestReporter } = require('../src/reporter/TestReporter');

async function runBasicExample() {
    console.log('🚀 Fagun Automation Framework - Basic Usage Example\n');
    
    try {
        // Initialize components
        const testGenerator = new TestGenerator();
        const testRunner = new PlaywrightRunner();
        const reporter = new TestReporter();
        
        // Target website
        const targetUrl = 'https://example.com';
        
        console.log(`📊 Analyzing website: ${targetUrl}`);
        
        // Step 1: Generate test suite
        const testSuite = await testGenerator.generateTestSuite(targetUrl);
        console.log(`✅ Generated ${testSuite.testCases.length} test cases`);
        
        // Step 2: Run tests
        console.log('🧪 Executing test cases...');
        const results = await testRunner.runTestSuite(testSuite);
        
        // Step 3: Generate report
        console.log('📊 Generating report...');
        const reportPath = await reporter.generateReport(testSuite);
        
        // Display summary
        const summary = testRunner.getSummary();
        console.log('\n📋 Test Summary:');
        console.log(`Total: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Skipped: ${summary.skipped}`);
        console.log(`\n📄 Report generated: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    runBasicExample();
}

module.exports = { runBasicExample };

