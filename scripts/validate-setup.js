#!/usr/bin/env node

/**
 * Validation script to check if the Fagun Automation Framework is properly set up
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Fagun Automation Framework Setup...\n');

const checks = [
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      if (majorVersion < 16) {
        throw new Error(`Node.js version ${version} is too old. Please upgrade to Node.js 16 or higher.`);
      }
      return `✅ Node.js ${version}`;
    }
  },
  {
    name: 'Package Dependencies',
    check: () => {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredDeps = [
        '@playwright/test',
        'playwright',
        '@google/generative-ai',
        'commander',
        'inquirer',
        'chalk',
        'ora',
        'fs-extra',
        'dotenv',
        'uuid'
      ];
      
      const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      return '✅ All required dependencies found';
    }
  },
  {
    name: 'TypeScript Configuration',
    check: () => {
      const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        throw new Error('tsconfig.json not found');
      }
      
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.target) {
        throw new Error('Invalid TypeScript configuration');
      }
      
      return '✅ TypeScript configuration valid';
    }
  },
  {
    name: 'Source Files Structure',
    check: () => {
      const requiredFiles = [
        'src/main.ts',
        'src/types/index.ts',
        'src/config/index.ts',
        'src/analyzer/WebsiteAnalyzer.ts',
        'src/ai/GeminiService.ts',
        'src/generator/TestGenerator.ts',
        'src/runner/PlaywrightRunner.ts',
        'src/reporter/TestReporter.ts',
        'src/utils/helpers.ts',
        'src/utils/logger.ts',
        'src/utils/errors.ts',
        'src/utils/validator.ts'
      ];
      
      const missingFiles = requiredFiles.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing source files: ${missingFiles.join(', ')}`);
      }
      
      return '✅ All source files present';
    }
  },
  {
    name: 'Configuration Files',
    check: () => {
      const configFiles = [
        'config.env.example',
        'README.md',
        'requirements.txt',
        'setup.py'
      ];
      
      const missingFiles = configFiles.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing configuration files: ${missingFiles.join(', ')}`);
      }
      
      return '✅ All configuration files present';
    }
  },
  {
    name: 'Test Files',
    check: () => {
      const testFiles = [
        'tests/unit/utils.test.ts',
        'tests/integration/automation.test.ts',
        'tests/setup.ts',
        'jest.config.js'
      ];
      
      const missingFiles = testFiles.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing test files: ${missingFiles.join(', ')}`);
      }
      
      return '✅ All test files present';
    }
  },
  {
    name: 'Example Files',
    check: () => {
      const exampleFiles = [
        'examples/basic-usage.js',
        'examples/basic-usage.py'
      ];
      
      const missingFiles = exampleFiles.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing example files: ${missingFiles.join(', ')}`);
      }
      
      return '✅ All example files present';
    }
  },
  {
    name: 'TypeScript Compilation',
    check: () => {
      try {
        execSync('npx tsc --noEmit', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        return '✅ TypeScript compilation successful';
      } catch (error) {
        throw new Error('TypeScript compilation failed. Check for type errors.');
      }
    }
  },
  {
    name: 'Environment Configuration',
    check: () => {
      const configEnvPath = path.join(__dirname, '..', 'config.env');
      const configEnvExamplePath = path.join(__dirname, '..', 'config.env.example');
      
      if (!fs.existsSync(configEnvExamplePath)) {
        throw new Error('config.env.example not found');
      }
      
      if (!fs.existsSync(configEnvPath)) {
        console.log('⚠️  config.env not found. Please copy config.env.example to config.env and configure your settings.');
        return '⚠️  Environment configuration needs setup';
      }
      
      return '✅ Environment configuration present';
    }
  }
];

let passed = 0;
let failed = 0;
let warnings = 0;

console.log('Running validation checks...\n');

for (const check of checks) {
  try {
    const result = check.check();
    console.log(result);
    if (result.startsWith('✅')) {
      passed++;
    } else if (result.startsWith('⚠️')) {
      warnings++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ${error.message}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 Framework setup validation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set your GEMINI_API_KEY in config.env');
  console.log('2. Run: npm install');
  console.log('3. Run: npx playwright install');
  console.log('4. Run: npm run start');
} else {
  console.log('\n❌ Setup validation failed. Please fix the issues above.');
  process.exit(1);
}

if (warnings > 0) {
  console.log('\n⚠️  Please address the warnings above for optimal setup.');
}
