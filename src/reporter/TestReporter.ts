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
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${testSuite.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            /* Reserve space for fixed header */
            padding-top: 140px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999;
            border-radius: 0;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }
        
        .summary-card:hover {
            transform: translateY(-2px);
        }
        
        .summary-card.total { border-top: 4px solid #3498db; }
        .summary-card.passed { border-top: 4px solid #27ae60; }
        .summary-card.failed { border-top: 4px solid #e74c3c; }
        .summary-card.skipped { border-top: 4px solid #f39c12; }
        
        .summary-card h3 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .summary-card.total h3 { color: #3498db; }
        .summary-card.passed h3 { color: #27ae60; }
        .summary-card.failed h3 { color: #e74c3c; }
        .summary-card.skipped h3 { color: #f39c12; }
        
        .test-results {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .test-results h2 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .test-item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }
        
        .test-item:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .test-header {
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        }
        
        .test-header.passed { border-left: 4px solid #27ae60; }
        .test-header.failed { border-left: 4px solid #e74c3c; }
        .test-header.skipped { border-left: 4px solid #f39c12; }
        
        .test-title {
            font-weight: 600;
            font-size: 1.1em;
        }
        
        .test-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .test-status.passed {
            background: #d4edda;
            color: #155724;
        }
        
        .test-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .test-status.skipped {
            background: #fff3cd;
            color: #856404;
        }
        
        .test-details {
            padding: 20px;
            display: none;
            background: white;
        }
        
        .test-details.show {
            display: block;
        }
        
        .test-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .info-label {
            font-weight: 600;
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .info-value {
            margin-top: 5px;
            color: #2c3e50;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            border-left: 4px solid #e74c3c;
        }
        
        .logs {
            background: #f8f9fa;
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
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .screenshot img {
            max-width: 100%;
            max-height: 600px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            border: 2px solid #fff;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .screenshot img:hover {
            transform: scale(1.02);
        }
        
        .screenshot-placeholder {
            background: #e9ecef;
            border: 2px dashed #6c757d;
            border-radius: 5px;
            padding: 40px;
            color: #6c757d;
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
            color: #6c757d;
            border-top: 1px solid #e0e0e0;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Fagun Automation Framework</h1>
            <p><strong>Suite:</strong> ${testSuite.name}</p>
            <p><strong>Website:</strong> ${testSuite.website}</p>
            <p><strong>Generated:</strong> ${new Date(testSuite.createdAt).toLocaleString()}</p>
            <p style="margin-top:8px;opacity:0.95;">
              Build be <strong>Mejbaur Bahar Fagun</strong> · Software Engineer in Test · Connect: 
              <a href="https://www.linkedin.com/in/mejbaur/" target="_blank">Linkedin</a>
            </p>
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
        <div class="test-results" style="margin-top:20px;">
            <h2>📚 Test Case Types</h2>
            <p>${Object.entries(typeCounts).map(([t,c]) => `${t}: <strong>${c}</strong>`).join(' &middot; ')}</p>
            <p><strong>Pages analyzed:</strong> ${testSuite.analysis?.pages.length || 0} &middot; <strong>Elements:</strong> ${testSuite.analysis?.totalElements || 0}</p>
            <div id="chart-wrapper" style="margin-top:20px; display:flex; gap:20px; flex-wrap:wrap; align-items:center;">
              <svg id="pieChart" width="260" height="260" viewBox="0 0 32 32" style="background:#fff; border-radius:8px; padding:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06);"></svg>
              <div>
                <div style="margin-bottom:8px;"><span style="display:inline-block;width:12px;height:12px;background:#27ae60;margin-right:8px;border-radius:2px;"></span>Passed: ${summary.passed}</div>
                <div style="margin-bottom:8px;"><span style="display:inline-block;width:12px;height:12px;background:#e74c3c;margin-right:8px;border-radius:2px;"></span>Failed: ${summary.failed}</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#f39c12;margin-right:8px;border-radius:2px;"></span>Skipped: ${summary.skipped}</div>
              </div>
            </div>
        </div>
        ${broken.length ? `
        <div class="test-results" style="margin-top:20px;">
            <h2>🔗 Broken Links (${broken.length})</h2>
            <ul>${broken.map(b => `<li>${b.status} - ${b.url}</li>`).join('')}</ul>
        </div>` : ''}
        
        <div class="test-results">
            <h2>📋 Test Results</h2>
            ${this.generateTestResultsHTML(testResults, testCases)}
        </div>
        
        <div class="footer">
            <p>Generated by Fagun Automation Framework</p>
            <p>Report generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const testHeaders = document.querySelectorAll('.test-header');
            
            testHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const details = this.nextElementSibling;
                    const icon = this.querySelector('.toggle-icon');
                    
                    if (details.classList.contains('show')) {
                        details.classList.remove('show');
                        icon.classList.remove('rotated');
                    } else {
                        details.classList.add('show');
                        icon.classList.add('rotated');
                    }
                });
            });

            // Simple pie chart using SVG arcs (passed/failed/skipped)
            (function(){
              var passed = ${summary.passed};
              var failed = ${summary.failed};
              var skipped = ${summary.skipped};
              var total = Math.max(1, passed + failed + skipped);
              var segments = [
                { value: passed, color: '#27ae60' },
                { value: failed, color: '#e74c3c' },
                { value: skipped, color: '#f39c12' }
              ];
              var svg = document.getElementById('pieChart');
              if (!svg) return;
              var cx = 16, cy = 16, r = 15.915;
              var cumulative = 0;
              segments.forEach(function(seg){
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
                svg.appendChild(path);
              });
            })();
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

