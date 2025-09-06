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
        }
        
        .screenshot img {
            max-width: 100%;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            <h1>🧪 Test Report</h1>
            <p><strong>Suite:</strong> ${testSuite.name}</p>
            <p><strong>Website:</strong> ${testSuite.website}</p>
            <p><strong>Generated:</strong> ${new Date(testSuite.createdAt).toLocaleString()}</p>
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
        </div>
        ${broken.length ? `
        <div class="test-results" style="margin-top:20px;">
            <h2>🔗 Broken Links (${broken.length})</h2>
            <ul>${broken.map(b => `<li>${b.status} - ${b.url}</li>`).join('')}</ul>
        </div>` : ''}
        
        <div class="test-results">
            <h2>📋 Test Results</h2>
            ${this.generateTestResultsHTML(testResults)}
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
        });
    </script>
</body>
</html>`;
  }

  private generateTestResultsHTML(testResults: TestResult[]): string {
    return testResults.map(result => {
      const testCase = this.findTestCaseById(result.testCaseId);
      const statusClass = result.status;
      
      return `
        <div class="test-item">
            <div class="test-header ${statusClass}">
                <div class="test-title">${testCase?.name || result.testCaseId}</div>
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
                
                ${result.screenshot ? `
                <div class="screenshot">
                    <strong>Screenshot:</strong><br>
                    <img src="${result.screenshot}" alt="Test Screenshot">
                </div>
                ` : ''}
            </div>
        </div>
      `;
    }).join('');
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

