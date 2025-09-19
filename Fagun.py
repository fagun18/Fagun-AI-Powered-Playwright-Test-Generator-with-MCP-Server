import asyncio
import os
import sys
import json
import base64
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from browser_use import Agent
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def get_user_prompt():
    """Get testing prompt from user input or command line arguments"""
    # Check if prompt was provided as command line argument
    if len(sys.argv) > 1:
        return " ".join(sys.argv[1:])
    
    print("🚀 Advanced Browser Automation Testing Agent")
    print("=" * 50)
    print("Enter your testing prompt:")
    print("💡 Examples:")
    print("   - 'visit https://fagun.sqatesting.com and test full website each and everything'")
    print("   - 'test https://example.com for performance, security, and functionality'")
    print("   - 'comprehensive testing of https://mysite.com with detailed report'")
    print("💡 Or run: python Fagun.py 'your prompt here'")
    print("=" * 50)
    
    try:
        user_input = input().strip()
        if user_input:
            return user_input
        else:
            print("❌ No prompt provided. Please provide a testing prompt.")
            print("Example: python Fagun.py 'visit https://example.com and test everything'")
            sys.exit(1)
    except (EOFError, KeyboardInterrupt):
        print("\n⚠️  Input interrupted. Exiting...")
        sys.exit(1)

class TestReportGenerator:
    """Generate advanced HTML test reports"""
    
    def __init__(self):
        self.test_results = {
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'duration': None,
            'website_url': '',
            'test_steps': [],
            'screenshots': [],
            'performance_metrics': {},
            'security_checks': [],
            'accessibility_checks': [],
            'summary': {
                'total_tests': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
    
    def add_test_step(self, step_name, status, details, screenshot=None):
        """Add a test step to the report"""
        step = {
            'id': len(self.test_results['test_steps']) + 1,
            'name': step_name,
            'status': status,  # 'passed', 'failed', 'warning'
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'screenshot': screenshot
        }
        self.test_results['test_steps'].append(step)
        
        # Update summary
        self.test_results['summary']['total_tests'] += 1
        if status == 'passed':
            self.test_results['summary']['passed'] += 1
        elif status == 'failed':
            self.test_results['summary']['failed'] += 1
        elif status == 'warning':
            self.test_results['summary']['warnings'] += 1
    
    def add_screenshot(self, name, base64_data):
        """Add a screenshot to the report"""
        screenshot = {
            'name': name,
            'data': base64_data,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['screenshots'].append(screenshot)
    
    def set_website_url(self, url):
        """Set the website URL being tested"""
        self.test_results['website_url'] = url
    
    def finalize_report(self):
        """Finalize the report with end time and duration"""
        self.test_results['end_time'] = datetime.now().isoformat()
        start = datetime.fromisoformat(self.test_results['start_time'])
        end = datetime.fromisoformat(self.test_results['end_time'])
        self.test_results['duration'] = str(end - start)
    
    def generate_html_report(self, filename=None):
        """Generate a colorful modern HTML report"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_report_{timestamp}.html"
        
        html_content = self._create_html_template()
        
        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return filename
    
    def _create_html_template(self):
        """Create the HTML template for the report"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Browser Automation Test Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        
        .header p {{
            font-size: 1.2em;
            opacity: 0.9;
        }}
        
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }}
        
        .summary-card {{
            background: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }}
        
        .summary-card:hover {{
            transform: translateY(-5px);
        }}
        
        .summary-card h3 {{
            font-size: 2em;
            margin-bottom: 10px;
        }}
        
        .summary-card.passed h3 {{
            color: #28a745;
        }}
        
        .summary-card.failed h3 {{
            color: #dc3545;
        }}
        
        .summary-card.warning h3 {{
            color: #ffc107;
        }}
        
        .summary-card.total h3 {{
            color: #007bff;
        }}
        
        .test-details {{
            padding: 30px;
        }}
        
        .test-step {{
            background: white;
            margin-bottom: 20px;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 5px solid #ddd;
        }}
        
        .test-step.passed {{
            border-left-color: #28a745;
        }}
        
        .test-step.failed {{
            border-left-color: #dc3545;
        }}
        
        .test-step.warning {{
            border-left-color: #ffc107;
        }}
        
        .test-step-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        
        .test-step-name {{
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
        }}
        
        .test-step-status {{
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
        }}
        
        .status-passed {{
            background: #d4edda;
            color: #155724;
        }}
        
        .status-failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .status-warning {{
            background: #fff3cd;
            color: #856404;
        }}
        
        .test-step-details {{
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
        }}
        
        .test-step-timestamp {{
            font-size: 0.9em;
            color: #999;
        }}
        
        .screenshot {{
            margin-top: 15px;
            text-align: center;
        }}
        
        .screenshot img {{
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}
        
        .footer {{
            background: #343a40;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        .footer p {{
            margin-bottom: 10px;
        }}
        
        .footer a {{
            color: #007bff;
            text-decoration: none;
        }}
        
        .footer a:hover {{
            text-decoration: underline;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                margin: 10px;
                border-radius: 15px;
            }}
            
            .header {{
                padding: 30px 20px;
            }}
            
            .header h1 {{
                font-size: 2em;
            }}
            
            .summary {{
                grid-template-columns: repeat(2, 1fr);
                padding: 20px;
            }}
            
            .test-details {{
                padding: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Advanced Browser Automation Test Report</h1>
            <p>Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}</p>
            <p>Website: {self.test_results['website_url']}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>{self.test_results['summary']['total_tests']}</h3>
                <p>Total Tests</p>
            </div>
            <div class="summary-card passed">
                <h3>{self.test_results['summary']['passed']}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card failed">
                <h3>{self.test_results['summary']['failed']}</h3>
                <p>Failed</p>
            </div>
            <div class="summary-card warning">
                <h3>{self.test_results['summary']['warnings']}</h3>
                <p>Warnings</p>
            </div>
        </div>
        
        <div class="test-details">
            <h2 style="margin-bottom: 30px; color: #333;">Test Steps Details</h2>
            {self._generate_test_steps_html()}
        </div>
        
        <div class="footer">
            <p><strong>Test Duration:</strong> {self.test_results['duration']}</p>
            <p><strong>Generated by:</strong> Advanced Browser Automation Agent</p>
            <p><a href="https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server">View on GitHub</a></p>
        </div>
    </div>
</body>
</html>
        """
    
    def _generate_test_steps_html(self):
        """Generate HTML for test steps"""
        html = ""
        for step in self.test_results['test_steps']:
            status_class = f"status-{step['status']}"
            step_class = f"test-step {step['status']}"
            
            html += f"""
            <div class="{step_class}">
                <div class="test-step-header">
                    <div class="test-step-name">{step['name']}</div>
                    <div class="test-step-status {status_class}">{step['status'].upper()}</div>
                </div>
                <div class="test-step-details">{step['details']}</div>
                <div class="test-step-timestamp">Executed at: {step['timestamp']}</div>
            </div>
            """
        
        return html


async def main():
    # Get prompt from user
    task_prompt = get_user_prompt()
    
    # Check if API key is available
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment variables.")
        print("Please create a .env file with your API key:")
        print("GEMINI_API_KEY=your_api_key_here")
        return

    # Initialize test report generator
    report_generator = TestReportGenerator()
    
    # Extract URL from task prompt for reporting
    import re
    url_match = re.search(r'https?://[^\s]+', task_prompt)
    if url_match:
        report_generator.set_website_url(url_match.group())
    
    google_llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.0,
        google_api_key=api_key
    )

    try:
        print(f"🚀 Starting advanced browser automation...")
        print(f"📋 Task: {task_prompt}")
        print("⏳ This may take a few minutes...")
        print("=" * 60)
        
        # Add initial test step
        report_generator.add_test_step(
            "Test Initialization",
            "passed",
            f"Browser automation agent initialized successfully. Task: {task_prompt}"
        )
        
        # Create agent
        agent = Agent(
            task=task_prompt,
            llm=google_llm,
        )
        
        # Run the automation
        result = await agent.run()
        
        # Add completion test step
        report_generator.add_test_step(
            "Test Execution",
            "passed",
            f"Browser automation completed successfully. Result: {str(result)[:200]}..."
        )
        
        # Finalize report
        report_generator.finalize_report()
        
        # Generate HTML report
        report_filename = report_generator.generate_html_report()
        
        print("=" * 60)
        print("✅ Advanced browser automation completed successfully!")
        print(f"📊 Test Report Generated: {report_filename}")
        print(f"🌐 Open the report in your browser to view detailed results")
        print("=" * 60)
        
        return result
        
    except Exception as e:
        # Add error test step
        report_generator.add_test_step(
            "Test Execution",
            "failed",
            f"Browser automation failed with error: {str(e)}"
        )
        
        # Finalize report even on error
        report_generator.finalize_report()
        report_filename = report_generator.generate_html_report()
        
        print("=" * 60)
        print(f"❌ Error during automation: {str(e)}")
        print(f"📊 Error Report Generated: {report_filename}")
        print("💡 Suggestions:")
        print("   - Check if the website is accessible")
        print("   - Try with a simpler, more specific prompt")
        print("   - Ensure your internet connection is stable")
        print("   - Check the generated report for more details")
        print("=" * 60)
        return None

if __name__ == "__main__":
    asyncio.run(main())
