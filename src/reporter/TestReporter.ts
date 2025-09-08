import { TestSuite, TestResult } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import config from '../config';

export class TestReporter {
  private outputDir: string;

  constructor() {
    this.outputDir = config.output.reportsDir;
  }

  async generateReport(testSuite: TestSuite): Promise<string> {
    console.log('📊 Generating test report...');
    
    await fs.ensureDir(this.outputDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `test-report-${timestamp}.html`;
    const reportPath = path.join(this.outputDir, reportFileName);
    
    const htmlContent = this.generateHTMLReport(testSuite);
    await fs.writeFile(reportPath, htmlContent, 'utf8');
    
    // Also generate JSON report
    const jsonReportPath = path.join(this.outputDir, `test-report-${timestamp}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(testSuite, null, 2), 'utf8');
    
    console.log(`✅ Report generated: ${reportPath}`);
    return reportPath;
  }

  private generateHTMLReport(testSuite: TestSuite): string {
    const summary = this.calculateSummary(testSuite.results);
    const testResults = testSuite.results;
    const testCases = testSuite.testCases; // Store test cases for lookup
    const typeCounts = testSuite.testCases.reduce((acc: Record<string, number>, tc) => {
      const k = (tc.type || 'unknown').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const broken = (testSuite.analysis?.brokenLinks || []).slice(0, 100);
    
    // Extract configuration from testSuite if available
    const configSummary = testSuite.configuration || {
      testTypes: 16,
      maxTests: 50,
      executionMode: 'balanced',
      testerName: 'Fagun'
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Fagun AI Test Report - ${testSuite.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-neon: #00ffff;
            --secondary-neon: #ff00ff;
            --accent-neon: #ffff00;
            --success-neon: #00ff00;
            --error-neon: #ff0040;
            --warning-neon: #ffaa00;
            --bg-dark: #0a0a0f;
            --bg-darker: #050508;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Exo 2', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: 
                radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255, 255, 0, 0.05) 0%, transparent 50%),
                linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-darker) 100%);
            min-height: 100vh;
            overflow-x: hidden;
            padding-top: 200px;
        }

        /* Animated Background Particles */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--primary-neon);
            border-radius: 50%;
            animation: float 6s infinite linear;
            opacity: 0.7;
        }

        @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 0.7; }
            90% { opacity: 0.7; }
            100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 10;
        }
        
        /* Futuristic Header with Holographic Effect */
        .header {
            background: 
                linear-gradient(135deg, 
                    rgba(0, 255, 255, 0.1) 0%, 
                    rgba(255, 0, 255, 0.1) 50%, 
                    rgba(255, 255, 0, 0.1) 100%),
                linear-gradient(45deg, 
                    rgba(0, 0, 0, 0.8) 0%, 
                    rgba(20, 20, 40, 0.9) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 0 0 20px 20px;
            color: white;
            padding: 25px 30px;
            margin-bottom: 30px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 0 50px rgba(0, 255, 255, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            animation: headerGlow 4s ease-in-out infinite alternate;
        }

        @keyframes headerGlow {
            0% { 
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 50px rgba(0, 255, 255, 0.1);
            }
            100% { 
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 80px rgba(255, 0, 255, 0.2);
            }
        }
        .header .summary-inline { 
            margin-top: 20px; 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
            gap: 15px; 
        }

        .chip { 
            display: inline-block; 
            padding: 10px 16px; 
            border-radius: 25px; 
            font-weight: 700;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .chip::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .chip:hover::before {
            left: 100%;
        }

        .chip:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }

        .chip.active {
            transform: scale(1.1);
            box-shadow: 0 0 30px currentColor;
        }

        /* Configuration Summary Styles */
        .config-summary {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .config-summary h3 {
            font-family: 'Orbitron', monospace;
            color: var(--primary-neon);
            text-align: center;
            margin-bottom: 15px;
            font-size: 1.3em;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .config-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 10px;
            border-left: 3px solid var(--accent-neon);
        }

        .config-label {
            font-weight: 600;
            color: var(--accent-neon);
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .config-value {
            color: #ffffff;
            font-size: 1.1em;
            margin-top: 5px;
        }

        /* Filter functionality */
        .test-item.hidden {
            display: none;
        }

        .chip.total { 
            background: linear-gradient(135deg, rgba(0, 150, 255, 0.2), rgba(0, 100, 200, 0.3));
            border-color: var(--primary-neon);
            color: var(--primary-neon);
            box-shadow: 0 0 20px rgba(0, 150, 255, 0.3);
        }
        .chip.passed { 
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.3));
            border-color: var(--success-neon);
            color: var(--success-neon);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        .chip.failed { 
            background: linear-gradient(135deg, rgba(255, 0, 64, 0.2), rgba(200, 0, 50, 0.3));
            border-color: var(--error-neon);
            color: var(--error-neon);
            box-shadow: 0 0 20px rgba(255, 0, 64, 0.3);
        }
        .chip.skipped { 
            background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(200, 140, 0, 0.3));
            border-color: var(--warning-neon);
            color: var(--warning-neon);
            box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
        }
        
        .header h1 {
            font-family: 'Orbitron', monospace;
            font-size: 2.8em;
            font-weight: 900;
            margin-bottom: 15px;
            background: linear-gradient(45deg, var(--primary-neon), var(--secondary-neon), var(--accent-neon));
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: textShimmer 3s ease-in-out infinite;
            text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            text-align: center;
        }

        @keyframes textShimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .header p {
            font-size: 1.1em;
            margin: 8px 0;
            opacity: 0.9;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .summary {
            display: none; /* Hide the old summary cards as requested */
        }
        
        .summary-card {
            background: rgba(255,255,255,0.06);
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            transition: transform 0.25s, box-shadow 0.25s;
            animation: fadeInUp 500ms ease both;
        }
        
        .summary-card:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        }
        
        .summary-card.total { border-top: 4px solid #3498db; }
        .summary-card.passed { border-top: 4px solid #27ae60; }
        .summary-card.failed { border-top: 4px solid #e74c3c; }
        .summary-card.skipped { border-top: 4px solid #f39c12; }
        
        .summary-card h3 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .summary-card.total h3 { color: #60a5fa; }
        .summary-card.passed h3 { color: #4ade80; }
        .summary-card.failed h3 { color: #f87171; }
        .summary-card.skipped h3 { color: #fbbf24; }
        
        .test-results {
            margin-top: 30px;
        }

        .test-section {
            margin-bottom: 40px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            overflow: hidden;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: slideInUp 0.6s ease-out;
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .test-section h2 {
            font-family: 'Orbitron', monospace;
            font-size: 1.8em;
            font-weight: 700;
            padding: 25px 30px;
            margin: 0;
            background: linear-gradient(135deg, 
                rgba(0, 255, 255, 0.1) 0%, 
                rgba(255, 0, 255, 0.1) 100%);
            border-bottom: 1px solid var(--glass-border);
            color: var(--primary-neon);
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            position: relative;
        }

        .test-section h2::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, 
                var(--primary-neon), 
                var(--secondary-neon), 
                var(--accent-neon));
            animation: borderGlow 2s ease-in-out infinite alternate;
        }

        @keyframes borderGlow {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .test-item {
            border: 1px solid var(--glass-border);
            border-radius: 15px;
            margin: 15px 30px;
            overflow: hidden;
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .test-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, 
                var(--primary-neon), 
                var(--secondary-neon), 
                var(--accent-neon));
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .test-item:hover::before {
            opacity: 1;
        }

        .test-item:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            border-color: var(--primary-neon);
        }
        
        .test-header {
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.2);
        }
        
        .test-header.passed { border-left: 4px solid #27ae60; }
        .test-header.failed { border-left: 4px solid #e74c3c; }
        .test-header.skipped { border-left: 4px solid #f39c12; }
        
        .test-title {
            font-weight: 600;
            font-size: 1.1em;
        }
        
        .test-status {
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            backdrop-filter: blur(10px);
            border: 1px solid;
            transition: all 0.3s ease;
        }

        .test-status.passed {
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.3));
            border-color: var(--success-neon);
            color: var(--success-neon);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }

        .test-status.failed {
            background: linear-gradient(135deg, rgba(255, 0, 64, 0.2), rgba(200, 0, 50, 0.3));
            border-color: var(--error-neon);
            color: var(--error-neon);
            box-shadow: 0 0 20px rgba(255, 0, 64, 0.3);
        }

        .test-status.skipped {
            background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(200, 140, 0, 0.3));
            border-color: var(--warning-neon);
            color: var(--warning-neon);
            box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
        }

        .toggle-icon {
            margin-left: 8px;
            transition: transform 0.3s ease;
            display: inline-block;
        }

        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        
        .test-details {
            padding: 25px;
            display: none;
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.3) 0%, 
                rgba(20, 20, 40, 0.4) 100%);
            border-top: 1px solid var(--glass-border);
            backdrop-filter: blur(10px);
            animation: expand 300ms ease;
        }
        
        .test-details.show {
            display: block;
        }

        @keyframes expand {
            from { 
                opacity: 0; 
                transform: scaleY(0.95); 
                max-height: 0;
            }
            to { 
                opacity: 1; 
                transform: scaleY(1); 
                max-height: 1000px;
            }
        }
        
        .test-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            padding: 10px;
            background: rgba(255,255,255,0.06);
            border-radius: 5px;
        }
        
        .info-label {
            font-weight: 600;
            color: #9aa3b2;
            font-size: 0.9em;
        }
        
        .info-value {
            margin-top: 5px;
            color: #e9ecf1;
        }
        
        .error-message {
            background: rgba(239,68,68,0.18);
            color: #fecaca;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            border-left: 4px solid #ef4444;
        }
        
        .logs {
            background: rgba(255,255,255,0.06);
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .screenshot {
            margin-top: 15px;
            text-align: center;
            background: rgba(255,255,255,0.06);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .screenshot img {
            max-width: 100%;
            max-height: 600px;
            border-radius: 5px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.3);
            border: 2px solid #fff;
            cursor: pointer;
            transition: transform 0.25s, box-shadow 0.25s;
        }
        
        .screenshot img:hover {
            transform: scale(1.03);
            box-shadow: 0 18px 36px rgba(0,0,0,0.4);
        }
        
        .screenshot-placeholder {
            background: rgba(255,255,255,0.04);
            border: 2px dashed rgba(255,255,255,0.2);
            border-radius: 5px;
            padding: 40px;
            color: #9aa3b2;
            font-style: italic;
        }
        
        .toggle-icon {
            transition: transform 0.2s;
        }
        
        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #9aa3b2;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .summary {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        /* Animations */
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expand {
            from { opacity: 0; transform: scaleY(0.98); }
            to { opacity: 1; transform: scaleY(1); }
        }
    </style>
</head>
<body>
    <!-- Animated Background Particles -->
    <div class="particles" id="particles"></div>
    
    <div class="container">
        <div class="header">
            <h1>🚀 FAGUN AI TEST REPORT</h1>
            <p><strong>Suite:</strong> ${testSuite.name}</p>
            <p><strong>Website:</strong> ${testSuite.website}</p>
            <p><strong>Generated:</strong> ${new Date(testSuite.createdAt).toLocaleString()}</p>
            <p style="margin-top:8px;opacity:0.95;">
              Built by <strong>Mejbaur Bahar Fagun</strong> · Software Engineer in Test · Connect: 
              <a href="https://www.linkedin.com/in/mejbaur/" target="_blank" style="color: var(--primary-neon); text-decoration: none;">LinkedIn</a>
            </p>
            <div class="summary-inline">
              <span class="chip total" data-filter="all">Total: ${summary.total}</span>
              <span class="chip passed" data-filter="passed">Passed: ${summary.passed}</span>
              <span class="chip failed" data-filter="failed">Failed: ${summary.failed}</span>
              <span class="chip skipped" data-filter="skipped">Skipped: ${summary.skipped}</span>
            </div>
        </div>
        
        <div class="config-summary">
            <h3>📊 Test Configuration Summary</h3>
            <div class="config-grid">
                <div class="config-item">
                    <div class="config-label">Test Types</div>
                    <div class="config-value">${configSummary.testTypes} selected</div>
                </div>
                <div class="config-item">
                    <div class="config-label">Max Tests</div>
                    <div class="config-value">${configSummary.maxTests}</div>
                </div>
                <div class="config-item">
                    <div class="config-label">Execution Mode</div>
                    <div class="config-value">${configSummary.executionMode}</div>
                </div>
                <div class="config-item">
                    <div class="config-label">Tester</div>
                    <div class="config-value">${configSummary.testerName}</div>
                </div>
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>${summary.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="summary-card passed">
                <h3>${summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card failed">
                <h3>${summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="summary-card skipped">
                <h3>${summary.skipped}</h3>
                <p>Skipped</p>
            </div>
        </div>
        <div class="test-results">
            <div class="test-section">
                <h2>📊 Test Analytics</h2>
                <div style="padding: 30px;">
                    <p style="font-size: 1.1em; margin-bottom: 20px; color: var(--primary-neon);">
                        <strong>Test Types:</strong> ${Object.entries(typeCounts).map(([t,c]) => `${t}: <strong style="color: var(--accent-neon);">${c}</strong>`).join(' &middot; ')}
                    </p>
                    <p style="font-size: 1.1em; margin-bottom: 20px; color: var(--primary-neon);">
                        <strong>Pages Analyzed:</strong> <span style="color: var(--accent-neon);">${testSuite.analysis?.pages.length || 0}</span> &middot; 
                        <strong>Elements Found:</strong> <span style="color: var(--accent-neon);">${testSuite.analysis?.totalElements || 0}</span>
                    </p>
                    <div id="chart-wrapper" style="margin-top:30px; display:flex; gap:30px; flex-wrap:wrap; align-items:center; justify-content: center;">
                        <svg id="pieChart" width="300" height="300" viewBox="0 0 32 32" style="background:var(--glass-bg); border-radius:20px; padding:20px; border:1px solid var(--glass-border); backdrop-filter: blur(20px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);"></svg>
                        <div style="background: var(--glass-bg); padding: 25px; border-radius: 20px; border: 1px solid var(--glass-border); backdrop-filter: blur(20px);">
                            <div style="margin-bottom:15px; font-size: 1.1em;"><span style="display:inline-block;width:15px;height:15px;background:var(--success-neon);margin-right:12px;border-radius:50%; box-shadow: 0 0 10px var(--success-neon);"></span><strong>Passed:</strong> <span style="color: var(--success-neon);">${summary.passed}</span></div>
                            <div style="margin-bottom:15px; font-size: 1.1em;"><span style="display:inline-block;width:15px;height:15px;background:var(--error-neon);margin-right:12px;border-radius:50%; box-shadow: 0 0 10px var(--error-neon);"></span><strong>Failed:</strong> <span style="color: var(--error-neon);">${summary.failed}</span></div>
                            <div style="font-size: 1.1em;"><span style="display:inline-block;width:15px;height:15px;background:var(--warning-neon);margin-right:12px;border-radius:50%; box-shadow: 0 0 10px var(--warning-neon);"></span><strong>Skipped:</strong> <span style="color: var(--warning-neon);">${summary.skipped}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${broken.length ? `
            <div class="test-section">
                <h2>🔗 Broken Links Detected (${broken.length})</h2>
                <div style="padding: 30px;">
                    <div style="background: var(--glass-bg); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border); backdrop-filter: blur(10px);">
                        <ul style="list-style: none; padding: 0;">
                            ${broken.map(b => `<li style="padding: 10px; margin: 5px 0; background: rgba(255, 0, 64, 0.1); border-left: 3px solid var(--error-neon); border-radius: 5px; color: var(--error-neon);"><strong>${b.status}</strong> - ${b.url}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>` : ''}
            
            <div class="test-section">
                <h2>🧪 Test Execution Results</h2>
                <div style="padding: 30px;">
                    ${this.generateTestResultsHTML(testResults, testCases)}
                </div>
            </div>
        </div>
        
        <div class="footer" style="margin-top: 50px; padding: 30px; text-align: center; background: var(--glass-bg); border-radius: 20px; border: 1px solid var(--glass-border); backdrop-filter: blur(20px);">
            <p style="font-size: 1.2em; color: var(--primary-neon); text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);">
                🚀 Generated by <strong>Fagun AI Automation Framework</strong>
            </p>
            <p style="margin-top: 10px; opacity: 0.8; color: var(--accent-neon);">
                Report generated at ${new Date().toLocaleString()} • Built with ❤️ by Mejbaur Bahar Fagun
            </p>
        </div>
    </div>
    
    <script>
        // Create animated background particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                // Random position and animation delay
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
                
                // Random neon color
                const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                
                particlesContainer.appendChild(particle);
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize particles
            createParticles();
            
            const testHeaders = document.querySelectorAll('.test-header');
            
            testHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    console.log('Test header clicked');
                    const details = this.nextElementSibling;
                    const icon = this.querySelector('.toggle-icon');
                    
                    console.log('Details element:', details);
                    console.log('Icon element:', icon);
                    
                    if (details && details.classList.contains('show')) {
                        details.classList.remove('show');
                        if (icon) icon.classList.remove('rotated');
                    } else if (details) {
                        details.classList.add('show');
                        if (icon) icon.classList.add('rotated');
                    }
                });
            });

            // Chip filtering functionality
            const chips = document.querySelectorAll('.chip[data-filter]');
            chips.forEach(chip => {
                chip.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    // Remove active class from all chips
                    chips.forEach(c => c.classList.remove('active'));
                    // Add active class to clicked chip
                    this.classList.add('active');
                    
                    // Filter test items
                    const testItems = document.querySelectorAll('.test-item');
                    testItems.forEach(item => {
                        if (filter === 'all') {
                            item.classList.remove('hidden');
                        } else {
                            const testHeader = item.querySelector('.test-header');
                            if (testHeader && testHeader.classList.contains(filter)) {
                                item.classList.remove('hidden');
                            } else {
                                item.classList.add('hidden');
                            }
                        }
                    });
                    
                    console.log('Filtered by:', filter);
                });
            });

            // Futuristic pie chart with neon colors
            (function(){
              var passed = ${summary.passed};
              var failed = ${summary.failed};
              var skipped = ${summary.skipped};
              var total = Math.max(1, passed + failed + skipped);
              var segments = [
                { value: passed, color: '#00ff00', glow: 'rgba(0, 255, 0, 0.3)' },
                { value: failed, color: '#ff0040', glow: 'rgba(255, 0, 64, 0.3)' },
                { value: skipped, color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.3)' }
              ];
              var svg = document.getElementById('pieChart');
              if (!svg) {
                console.log('Pie chart SVG not found');
                return;
              }
              console.log('Creating pie chart with:', passed, failed, skipped);
              var cx = 16, cy = 16, r = 15.915;
              var cumulative = 0;
              segments.forEach(function(seg){
                if (seg.value === 0) return; // Skip segments with no data
                var fraction = seg.value / total;
                var startAngle = 2 * Math.PI * cumulative;
                var endAngle = 2 * Math.PI * (cumulative + fraction);
                cumulative += fraction;
                var x1 = cx + r * Math.sin(startAngle);
                var y1 = cy - r * Math.cos(startAngle);
                var x2 = cx + r * Math.sin(endAngle);
                var y2 = cy - r * Math.cos(endAngle);
                var largeArc = fraction > 0.5 ? 1 : 0;
                var d = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', seg.color);
                path.style.opacity = '0';
                path.style.transformOrigin = '50% 50%';
                path.style.filter = 'drop-shadow(0 0 10px ' + seg.glow + ')';
                svg.appendChild(path);
                setTimeout(function(){
                  path.style.transition = 'opacity 800ms ease, transform 800ms ease';
                  path.style.opacity = '1';
                  path.style.transform = 'scale(1)';
                }, 100);
              });
            })();
            // Stagger summary cards
            Array.from(document.querySelectorAll('.summary-card')).forEach(function(card, idx){
              (card as HTMLElement).style.animationDelay = (idx * 100) + 'ms';
            });
            // Floating controls
            const toolbar = document.createElement('div');
            Object.assign(toolbar.style, { position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: '1000' });
            function button(label){ const b = document.createElement('button'); b.textContent = label; Object.assign(b.style, { background: 'linear-gradient(135deg, #6c5ce7, #00c2ff)', color: '#fff', border: '0', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', fontWeight: '700' }); return b; }
            const expandAll = button('Expand All');
            const collapseAll = button('Collapse All');
            expandAll.onclick = () => { document.querySelectorAll('.test-details').forEach(d => d.classList.add('show')); document.querySelectorAll('.toggle-icon').forEach(i => i.classList.add('rotated')); };
            collapseAll.onclick = () => { document.querySelectorAll('.test-details').forEach(d => d.classList.remove('show')); document.querySelectorAll('.toggle-icon').forEach(i => i.classList.remove('rotated')); };
            toolbar.appendChild(expandAll);
            toolbar.appendChild(collapseAll);
            document.body.appendChild(toolbar);
        });
    </script>
</body>
</html>`;
  }

  private generateTestResultsHTML(testResults: TestResult[], testCases: any[]): string {
    return testResults.map(result => {
      const testCase = testCases.find(tc => tc.id === result.testCaseId);
      const statusClass = result.status;
      const displayName = this.getDisplayName(result.testCaseId, testCase?.name);
      const fixSuggestions = this.generateFixSuggestions(testCase, result);
      
      return `
        <div class="test-item">
            <div class="test-header ${statusClass}">
                <div class="test-title">${displayName}</div>
                <div class="test-status ${statusClass}">
                    ${result.status}
                    <span class="toggle-icon">▼</span>
                </div>
            </div>
            <div class="test-details">
                <div class="test-info">
                    <div class="info-item">
                        <div class="info-label">Test ID</div>
                        <div class="info-value">${result.testCaseId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Duration</div>
                        <div class="info-value">${result.duration}ms</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Timestamp</div>
                        <div class="info-value">${new Date(result.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Type</div>
                        <div class="info-value">${testCase?.type || 'Unknown'}</div>
                    </div>
                </div>
                
                ${testCase ? `
                <div class="info-item">
                    <div class="info-label">Description</div>
                    <div class="info-value">${testCase.description}</div>
                </div>
                ` : ''}
                
                ${result.error ? `
                <div class="error-message">
                    <strong>Error:</strong> ${result.error}
                </div>
                ` : ''}
                
                ${result.logs.length > 0 ? `
                <div class="logs">
                    <strong>Logs:</strong><br>
                    ${result.logs.map(log => `${log}<br>`).join('')}
                </div>
                ` : ''}
                ${fixSuggestions ? `
                <div class="logs" style="margin-top:10px;">
                    <strong>Fix Suggestions:</strong><br>
                    ${fixSuggestions}
                </div>
                ` : ''}
                
                ${result.screenshot ? `
                <div class="screenshot">
                    <strong>📸 Screenshot:</strong><br>
                    ${this.generateScreenshotHTML(result.screenshot)}
                </div>
                ` : `
                <div class="screenshot">
                    <div class="screenshot-placeholder">
                        📸 No screenshot available for this test
                    </div>
                </div>
                `}
            </div>
        </div>
      `;
    }).join('');
  }

  private generateFixSuggestions(testCase: any, result: TestResult): string {
    try {
      let suggestions: string[] = [];
      // Grammar errors
      if (testCase?.type === 'content-quality' || testCase?.type === 'grammar-check') {
        const errors = Array.isArray(testCase?.data?.errors) ? testCase.data.errors : [];
        if (errors.length > 0) {
          const items = errors.slice(0, 10).map((e: any, idx: number) => {
            const ctx = e?.context ? ` — Context: ${this.escapeHtml(String(e.context)).slice(0,200)}` : '';
            const sug = e?.suggestion ? ` → Suggestion: ${this.escapeHtml(String(e.suggestion))}` : '';
            return `#${idx+1}: "${this.escapeHtml(String(e.text))}" — ${this.escapeHtml(String(e.error))}${sug}${ctx}`;
          });
          suggestions.push(items.join('<br>'));
        }
      }
      // SEO issues
      if (testCase?.type === 'seo' && Array.isArray(testCase?.data?.issues)) {
        const items = testCase.data.issues.slice(0, 10).map((i: any, idx: number) => {
          const exp = i?.expected ? ` (expected: ${this.escapeHtml(String(i.expected))})` : '';
          const el = i?.element ? ` [element: ${this.escapeHtml(String(i.element))}]` : '';
          return `#${idx+1}: ${this.escapeHtml(String(i.message))}${exp}${el} — Suggestion: ${this.escapeHtml(String(i.suggestion || 'Fix the issue'))}`;
        });
        if (items.length) suggestions.push(items.join('<br>'));
      }
      // Button/Form/API hints
      if ((testCase?.type === 'ui' || testCase?.type === 'functional' || testCase?.type === 'api') && result.status === 'failed') {
        suggestions.push('Verify selector accuracy, ensure element is visible/enabled, remove overlays (e.g., cookie bars), and increase timeouts if needed.');
      }
      return suggestions.length ? suggestions.join('<br>') : '';
    } catch {
      return '';
    }
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private calculateSummary(results: TestResult[]): { total: number; passed: number; failed: number; skipped: number } {
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };
  }

  private findTestCaseById(testCaseId: string): any {
    // This would need to be passed from the test suite
    // For now, return null
    return null;
  }

  private getDisplayName(testCaseId: string, testCaseName?: string): string {
    if (testCaseName) {
      return testCaseName;
    }

    // Generate user-friendly names based on test ID patterns
    if (testCaseId.startsWith('functional_form_')) {
      return `📝 Form Submission Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('functional_nav_')) {
      return `🔗 Navigation Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('ai_nav_')) {
      return `🌐 AI Navigation Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('ai_form_')) {
      return `📝 AI Form Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('ai_btn_')) {
      return `🔘 AI Button Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('ui_')) {
      return `🎨 UI Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('accessibility_')) {
      return `♿ Accessibility Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('performance_')) {
      return `⚡ Performance Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('security_')) {
      return `🔒 Security Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('api_')) {
      return `🔌 API Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('mobile_')) {
      return `📱 Mobile Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('cross-browser_')) {
      return `🌐 Cross-Browser Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('visual-regression_')) {
      return `👁️ Visual Regression Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('e2e-workflow_')) {
      return `🔄 E2E Workflow Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('edge-case_')) {
      return `⚠️ Edge Case Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('data-driven_')) {
      return `📊 Data-Driven Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('stress_')) {
      return `💪 Stress Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('load_')) {
      return `📈 Load Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('usability_')) {
      return `👤 Usability Test #${testCaseId.split('_').pop()}`;
    } else if (testCaseId.startsWith('compatibility_')) {
      return `🔧 Compatibility Test #${testCaseId.split('_').pop()}`;
    } else {
      return `🧪 Test Case #${testCaseId}`;
    }
  }

  private generateScreenshotHTML(screenshotPath: string): string {
    try {
      // Check if it's an absolute path
      const isAbsolute = path.isAbsolute(screenshotPath);
      const resolvedPath = isAbsolute ? screenshotPath : path.resolve(screenshotPath);
      
      // Check if file exists
      if (require('fs').existsSync(resolvedPath)) {
        // Convert to file:// URL for local display
        const fileUrl = `file:///${resolvedPath.replace(/\\/g, '/')}`;
        return `<img src="${fileUrl}" alt="Test Screenshot" onclick="window.open('${fileUrl}', '_blank')" title="Click to view full size">`;
      } else {
        return `<div class="screenshot-placeholder">📸 Screenshot file not found: ${screenshotPath}</div>`;
      }
    } catch (error) {
      return `<div class="screenshot-placeholder">📸 Error loading screenshot: ${error}</div>`;
    }
  }

  async generateJSONReport(testSuite: TestSuite): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.outputDir, `test-report-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(testSuite, null, 2), 'utf8');
    
    console.log(`✅ JSON report generated: ${reportPath}`);
    return reportPath;
  }

  async generateCSVReport(testSuite: TestSuite): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.outputDir, `test-report-${timestamp}.csv`);
    
    const csvContent = this.generateCSVContent(testSuite);
    await fs.writeFile(reportPath, csvContent, 'utf8');
    
    console.log(`✅ CSV report generated: ${reportPath}`);
    return reportPath;
  }

  private generateCSVContent(testSuite: TestSuite): string {
    const headers = ['Test ID', 'Name', 'Type', 'Status', 'Duration (ms)', 'Timestamp', 'Error'];
    const rows = testSuite.results.map(result => {
      const testCase = testSuite.testCases.find(tc => tc.id === result.testCaseId);
      return [
        result.testCaseId,
        testCase?.name || '',
        testCase?.type || '',
        result.status,
        result.duration,
        new Date(result.timestamp).toISOString(),
        result.error || ''
      ];
    });

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}

