#!/usr/bin/env python3
"""
Fagun Automation Framework - Python Implementation
AI-powered automated testing using Playwright and Gemini AI
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

import google.generativeai as genai
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

# Configuration
@dataclass
class Config:
    gemini_api_key: str = os.getenv('GEMINI_API_KEY', '')
    browser_type: str = 'chromium'
    headless: bool = True
    timeout: int = 30000
    max_test_cases: int = 50
    include_accessibility: bool = True
    include_performance: bool = True
    include_security: bool = True
    reports_dir: str = './reports'
    screenshots_dir: str = './screenshots'
    videos_dir: str = './videos'

# Data Models
@dataclass
class WebsiteElement:
    type: str
    selector: str
    text: Optional[str] = None
    placeholder: Optional[str] = None
    href: Optional[str] = None
    action: Optional[str] = None
    method: Optional[str] = None
    required: bool = False
    input_type: Optional[str] = None
    options: List[str] = None
    attributes: Dict[str, str] = None

@dataclass
class WebsitePage:
    url: str
    title: str
    elements: List[WebsiteElement]
    forms: List[WebsiteElement]
    links: List[WebsiteElement]
    images: List[WebsiteElement]
    meta: Dict[str, str]
    performance: Dict[str, float]

@dataclass
class TestStep:
    action: str
    target: Optional[str] = None
    value: Optional[str] = None
    assertion: Optional[str] = None
    timeout: int = 30000
    description: str = ""

@dataclass
class TestCase:
    id: str
    name: str
    description: str
    type: str
    priority: str
    steps: List[TestStep]
    expected_result: str
    page: str
    element: Optional[WebsiteElement] = None
    data: Dict[str, Any] = None

@dataclass
class TestResult:
    test_case_id: str
    status: str
    duration: int
    error: Optional[str] = None
    screenshot: Optional[str] = None
    video: Optional[str] = None
    logs: List[str] = None
    timestamp: datetime = None

@dataclass
class TestSuite:
    id: str
    name: str
    description: str
    website: str
    test_cases: List[TestCase]
    results: List[TestResult]
    created_at: datetime
    status: str

class GeminiService:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def generate_test_cases(self, analysis: Dict) -> List[TestCase]:
        """Generate test cases using Gemini AI"""
        prompt = self._build_test_generation_prompt(analysis)
        
        try:
            response = self.model.generate_content(prompt)
            test_cases_data = json.loads(response.text)
            
            test_cases = []
            for tc_data in test_cases_data:
                steps = [TestStep(**step) for step in tc_data.get('steps', [])]
                test_case = TestCase(
                    id=tc_data.get('id', ''),
                    name=tc_data.get('name', ''),
                    description=tc_data.get('description', ''),
                    type=tc_data.get('type', 'functional'),
                    priority=tc_data.get('priority', 'medium'),
                    steps=steps,
                    expected_result=tc_data.get('expected_result', ''),
                    page=tc_data.get('page', ''),
                    data=tc_data.get('data', {})
                )
                test_cases.append(test_case)
            
            return test_cases
            
        except Exception as e:
            print(f"Error generating test cases: {e}")
            return self._generate_fallback_test_cases(analysis)
    
    def _build_test_generation_prompt(self, analysis: Dict) -> str:
        return f"""
You are an expert QA automation engineer. Based on the following website analysis, generate comprehensive test cases for automated testing using Playwright.

Website Analysis:
- Base URL: {analysis.get('base_url', '')}
- Total Pages: {len(analysis.get('pages', []))}
- Total Elements: {analysis.get('total_elements', 0)}

Please generate test cases covering:
1. Functional Testing (form submissions, button clicks, navigation)
2. UI Testing (element visibility, responsiveness, user interactions)
3. Accessibility Testing (ARIA labels, keyboard navigation, screen reader compatibility)
4. Performance Testing (page load times, resource optimization)
5. Security Testing (input validation, XSS prevention, CSRF protection)

For each test case, provide:
- Unique ID
- Descriptive name
- Detailed description
- Test type (functional, ui, accessibility, performance, security)
- Priority (high, medium, low)
- Step-by-step test steps with specific actions
- Expected result
- Target page URL

Format the response as a JSON array of test cases.
"""
    
    def _generate_fallback_test_cases(self, analysis: Dict) -> List[TestCase]:
        """Generate basic test cases as fallback"""
        test_cases = []
        test_id = 1
        
        for page in analysis.get('pages', []):
            # Navigation test
            test_cases.append(TestCase(
                id=f"nav_{test_id}",
                name=f"Navigate to {page.get('title', '')}",
                description=f"Test navigation to {page.get('url', '')}",
                type="functional",
                priority="high",
                steps=[
                    TestStep(
                        action="navigate",
                        target=page.get('url', ''),
                        description=f"Navigate to {page.get('url', '')}",
                        timeout=30000
                    )
                ],
                expected_result="Page loads successfully",
                page=page.get('url', '')
            ))
            test_id += 1
        
        return test_cases

class WebsiteAnalyzer:
    def __init__(self):
        self.visited_urls = set()
    
    async def analyze_website(self, base_url: str) -> Dict:
        """Analyze website structure and elements"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            
            try:
                analysis = {
                    'base_url': base_url,
                    'pages': [],
                    'total_elements': 0,
                    'technologies': []
                }
                
                # Start crawling from base URL
                await self._crawl_website(context, base_url, analysis, 0)
                
                return analysis
                
            finally:
                await browser.close()
    
    async def _crawl_website(self, context: BrowserContext, url: str, analysis: Dict, depth: int):
        """Crawl website pages"""
        if depth > 3 or url in self.visited_urls or len(analysis['pages']) >= 20:
            return
        
        self.visited_urls.add(url)
        page = await context.new_page()
        
        try:
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Analyze page
            page_analysis = await self._analyze_page(page, url)
            analysis['pages'].append(page_analysis)
            analysis['total_elements'] += len(page_analysis['elements'])
            
            # Extract internal links
            internal_links = await self._extract_internal_links(page, analysis['base_url'])
            
            for link in internal_links:
                if link not in self.visited_urls:
                    await self._crawl_website(context, link, analysis, depth + 1)
                    await asyncio.sleep(1)  # Be respectful
                    
        except Exception as e:
            print(f"Error analyzing page {url}: {e}")
        finally:
            await page.close()
    
    async def _analyze_page(self, page: Page, url: str) -> Dict:
        """Analyze individual page"""
        title = await page.title()
        
        # Extract elements
        elements = await self._extract_elements(page)
        forms = [el for el in elements if el['type'] == 'form']
        links = [el for el in elements if el['type'] == 'link']
        images = [el for el in elements if el['type'] == 'image']
        
        # Extract meta information
        meta = await self._extract_meta_information(page)
        
        # Measure performance
        performance = await self._measure_performance(page)
        
        return {
            'url': url,
            'title': title,
            'elements': elements,
            'forms': forms,
            'links': links,
            'images': images,
            'meta': meta,
            'performance': performance
        }
    
    async def _extract_elements(self, page: Page) -> List[Dict]:
        """Extract interactive elements from page"""
        elements = []
        
        # Extract buttons
        buttons = await page.evaluate("""
            () => {
                const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]');
                return Array.from(buttons).map((el, index) => ({
                    type: 'button',
                    selector: `button:nth-of-type(${index + 1}), input[type="button"]:nth-of-type(${index + 1})`,
                    text: el.textContent?.trim() || '',
                    attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
                }));
            }
        """)
        elements.extend(buttons)
        
        # Extract input fields
        inputs = await page.evaluate("""
            () => {
                const inputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select');
                return Array.from(inputs).map((el, index) => ({
                    type: el.tagName.toLowerCase() === 'select' ? 'select' : 
                          el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'input',
                    selector: `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
                    placeholder: el.getAttribute('placeholder') || '',
                    required: el.hasAttribute('required'),
                    input_type: el.getAttribute('type') || 'text',
                    attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
                }));
            }
        """)
        elements.extend(inputs)
        
        # Extract forms
        forms = await page.evaluate("""
            () => {
                const forms = document.querySelectorAll('form');
                return Array.from(forms).map((el, index) => ({
                    type: 'form',
                    selector: `form:nth-of-type(${index + 1})`,
                    action: el.getAttribute('action') || '',
                    method: el.getAttribute('method') || 'get',
                    attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
                }));
            }
        """)
        elements.extend(forms)
        
        # Extract links
        links = await page.evaluate("""
            () => {
                const links = document.querySelectorAll('a[href]');
                return Array.from(links).map((el, index) => ({
                    type: 'link',
                    selector: `a:nth-of-type(${index + 1})`,
                    text: el.textContent?.trim() || '',
                    href: el.getAttribute('href') || '',
                    attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
                }));
            }
        """)
        elements.extend(links)
        
        return elements
    
    async def _extract_internal_links(self, page: Page, base_url: str) -> List[str]:
        """Extract internal links from page"""
        links = await page.evaluate("""
            (baseUrl) => {
                const base = new URL(baseUrl);
                const links = document.querySelectorAll('a[href]');
                const internalLinks = [];
                
                for (const link of links) {
                    try {
                        const url = new URL(link.getAttribute('href'), baseUrl);
                        if (url.origin === base.origin && url.href !== baseUrl) {
                            internalLinks.push(url.href);
                        }
                    } catch (e) {
                        // Invalid URL, skip
                    }
                }
                
                return [...new Set(internalLinks)]; // Remove duplicates
            }
        """, base_url)
        
        return links
    
    async def _extract_meta_information(self, page: Page) -> Dict:
        """Extract meta information from page"""
        return await page.evaluate("""
            () => {
                const meta = {};
                
                const description = document.querySelector('meta[name="description"]');
                if (description) meta.description = description.getAttribute('content');
                
                const keywords = document.querySelector('meta[name="keywords"]');
                if (keywords) meta.keywords = keywords.getAttribute('content');
                
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) meta.viewport = viewport.getAttribute('content');
                
                return meta;
            }
        """)
    
    async def _measure_performance(self, page: Page) -> Dict:
        """Measure page performance"""
        return await page.evaluate("""
            () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    load_time: navigation.loadEventEnd - navigation.loadEventStart,
                    dom_size: document.querySelectorAll('*').length,
                    resource_count: performance.getEntriesByType('resource').length
                };
            }
        """)

class PlaywrightRunner:
    def __init__(self, config: Config):
        self.config = config
        self.results = []
    
    async def run_test_suite(self, test_suite: TestSuite) -> List[TestResult]:
        """Run all test cases in the suite"""
        async with async_playwright() as p:
            browser = await getattr(p, self.config.browser_type).launch(
                headless=self.config.headless
            )
            context = await browser.new_context()
            
            try:
                for test_case in test_suite.test_cases:
                    result = await self._run_test_case(context, test_case)
                    self.results.append(result)
                
                return self.results
                
            finally:
                await browser.close()
    
    async def _run_test_case(self, context: BrowserContext, test_case: TestCase) -> TestResult:
        """Run individual test case"""
        start_time = datetime.now()
        logs = []
        
        page = await context.new_page()
        
        try:
            # Set up logging
            page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
            page.on("pageerror", lambda error: logs.append(f"[ERROR] {error}"))
            
            # Execute test steps
            for step in test_case.steps:
                await self._execute_step(page, step, logs)
            
            status = "passed"
            error = None
            
        except Exception as e:
            status = "failed"
            error = str(e)
            logs.append(f"[ERROR] {error}")
        
        finally:
            await page.close()
        
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return TestResult(
            test_case_id=test_case.id,
            status=status,
            duration=duration,
            error=error,
            logs=logs,
            timestamp=datetime.now()
        )
    
    async def _execute_step(self, page: Page, step: TestStep, logs: List[str]):
        """Execute individual test step"""
        logs.append(f"Executing: {step.description}")
        
        try:
            if step.action == "navigate":
                await page.goto(step.target, wait_until='networkidle', timeout=step.timeout)
            elif step.action == "click":
                await page.click(step.target, timeout=step.timeout)
            elif step.action == "type":
                await page.fill(step.target, step.value or "", timeout=step.timeout)
            elif step.action == "wait":
                await page.wait_for_timeout(step.timeout)
            elif step.action == "assert":
                await self._execute_assertion(page, step.assertion, step.timeout)
            
            logs.append(f"✅ Step completed: {step.description}")
            
        except Exception as e:
            logs.append(f"❌ Step failed: {step.description} - {e}")
            raise
    
    async def _execute_assertion(self, page: Page, assertion: str, timeout: int):
        """Execute assertion"""
        if assertion and "isVisible()" in assertion:
            selector = assertion.split("'")[1] if "'" in assertion else ""
            if selector:
                await page.wait_for_selector(selector, state='visible', timeout=timeout)

class TestReporter:
    def __init__(self, config: Config):
        self.config = config
    
    async def generate_report(self, test_suite: TestSuite) -> str:
        """Generate HTML test report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = Path(self.config.reports_dir) / f"test_report_{timestamp}.html"
        
        # Ensure reports directory exists
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        html_content = self._generate_html_report(test_suite)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return str(report_path)
    
    def _generate_html_report(self, test_suite: TestSuite) -> str:
        """Generate HTML report content"""
        summary = self._calculate_summary(test_suite.results)
        
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - {test_suite.name}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }}
        .summary-card {{ background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .summary-card.passed {{ border-top: 4px solid #27ae60; }}
        .summary-card.failed {{ border-top: 4px solid #e74c3c; }}
        .test-results {{ background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .test-item {{ border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }}
        .test-header {{ padding: 15px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center; }}
        .test-header.passed {{ border-left: 4px solid #27ae60; }}
        .test-header.failed {{ border-left: 4px solid #e74c3c; }}
        .test-details {{ padding: 20px; display: none; }}
        .test-details.show {{ display: block; }}
        .error-message {{ background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-top: 15px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Report</h1>
        <p><strong>Suite:</strong> {test_suite.name}</p>
        <p><strong>Website:</strong> {test_suite.website}</p>
        <p><strong>Generated:</strong> {test_suite.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>{summary['total']}</h3>
            <p>Total Tests</p>
        </div>
        <div class="summary-card passed">
            <h3>{summary['passed']}</h3>
            <p>Passed</p>
        </div>
        <div class="summary-card failed">
            <h3>{summary['failed']}</h3>
            <p>Failed</p>
        </div>
    </div>
    
    <div class="test-results">
        <h2>📋 Test Results</h2>
        {self._generate_test_results_html(test_suite.results)}
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {{
            const testHeaders = document.querySelectorAll('.test-header');
            testHeaders.forEach(header => {{
                header.addEventListener('click', function() {{
                    const details = this.nextElementSibling;
                    if (details.classList.contains('show')) {{
                        details.classList.remove('show');
                    }} else {{
                        details.classList.add('show');
                    }}
                }});
            }});
        }});
    </script>
</body>
</html>
"""
    
    def _generate_test_results_html(self, results: List[TestResult]) -> str:
        """Generate HTML for test results"""
        html = ""
        for result in results:
            status_class = result.status
            html += f"""
            <div class="test-item">
                <div class="test-header {status_class}">
                    <div class="test-title">{result.test_case_id}</div>
                    <div class="test-status">{result.status}</div>
                </div>
                <div class="test-details">
                    <p><strong>Duration:</strong> {result.duration}ms</p>
                    <p><strong>Timestamp:</strong> {result.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    {f'<div class="error-message"><strong>Error:</strong> {result.error}</div>' if result.error else ''}
                    {f'<div><strong>Logs:</strong><br>{chr(10).join(result.logs)}</div>' if result.logs else ''}
                </div>
            </div>
            """
        return html
    
    def _calculate_summary(self, results: List[TestResult]) -> Dict[str, int]:
        """Calculate test summary"""
        return {
            'total': len(results),
            'passed': len([r for r in results if r.status == 'passed']),
            'failed': len([r for r in results if r.status == 'failed']),
            'skipped': len([r for r in results if r.status == 'skipped'])
        }

class FagunAutomation:
    def __init__(self, config: Config):
        self.config = config
        self.gemini_service = GeminiService(config.gemini_api_key)
        self.website_analyzer = WebsiteAnalyzer()
        self.test_runner = PlaywrightRunner(config)
        self.reporter = TestReporter(config)
    
    async def run_automation(self, target_url: str):
        """Main automation workflow"""
        console = Console()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            
            # Step 1: Analyze website
            task1 = progress.add_task("🔍 Analyzing website structure...", total=None)
            analysis = await self.website_analyzer.analyze_website(target_url)
            progress.update(task1, description="✅ Website analysis completed")
            
            # Step 2: Generate test cases
            task2 = progress.add_task("🤖 Generating test cases with AI...", total=None)
            test_cases = await self.gemini_service.generate_test_cases(analysis)
            progress.update(task2, description="✅ Test cases generated")
            
            # Step 3: Create test suite
            test_suite = TestSuite(
                id=f"test_suite_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                name=f"Automated Test Suite for {target_url}",
                description=f"Comprehensive test suite generated for {target_url}",
                website=target_url,
                test_cases=test_cases,
                results=[],
                created_at=datetime.now(),
                status="pending"
            )
            
            # Step 4: Run tests
            task3 = progress.add_task("🧪 Executing test cases...", total=None)
            results = await self.test_runner.run_test_suite(test_suite)
            test_suite.results = results
            progress.update(task3, description="✅ Test execution completed")
            
            # Step 5: Generate reports
            task4 = progress.add_task("📊 Generating test reports...", total=None)
            report_path = await self.reporter.generate_report(test_suite)
            progress.update(task4, description="✅ Reports generated")
        
        # Display summary
        self._display_summary(test_suite, report_path)
    
    def _display_summary(self, test_suite: TestSuite, report_path: str):
        """Display test summary"""
        console = Console()
        
        summary = {
            'total': len(test_suite.results),
            'passed': len([r for r in test_suite.results if r.status == 'passed']),
            'failed': len([r for r in test_suite.results if r.status == 'failed']),
            'skipped': len([r for r in test_suite.results if r.status == 'skipped'])
        }
        
        pass_rate = (summary['passed'] / summary['total'] * 100) if summary['total'] > 0 else 0
        
        # Create summary table
        table = Table(title="📊 Test Summary")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", style="magenta")
        
        table.add_row("Total Tests", str(summary['total']))
        table.add_row("✅ Passed", str(summary['passed']))
        table.add_row("❌ Failed", str(summary['failed']))
        table.add_row("⏭️ Skipped", str(summary['skipped']))
        table.add_row("📈 Pass Rate", f"{pass_rate:.1f}%")
        
        console.print(table)
        
        # Display report info
        console.print(Panel(
            f"📋 Report generated: {report_path}\n"
            f"🎉 Automation completed! Check the report for detailed results.",
            title="🎯 Results",
            border_style="green"
        ))

@click.command()
@click.option('--url', '-u', required=True, help='Target website URL to test')
@click.option('--api-key', '-k', help='Gemini API key (or set GEMINI_API_KEY env var)')
@click.option('--browser', '-b', default='chromium', type=click.Choice(['chromium', 'firefox', 'webkit']), help='Browser type')
@click.option('--headless/--no-headless', default=True, help='Run in headless mode')
@click.option('--max-tests', '-m', default=50, help='Maximum number of test cases to generate')
def main(url: str, api_key: Optional[str], browser: str, headless: bool, max_tests: int):
    """Fagun Automation Framework - AI-powered automated testing"""
    
    # Setup configuration
    config = Config(
        gemini_api_key=api_key or os.getenv('GEMINI_API_KEY', ''),
        browser_type=browser,
        headless=headless,
        max_test_cases=max_tests
    )
    
    if not config.gemini_api_key:
        rprint("[red]❌ Gemini API key not found![/red]")
        rprint("[yellow]Please set GEMINI_API_KEY environment variable or use --api-key option.[/yellow]")
        rprint("[blue]Get your API key from: https://makersuite.google.com/app/apikey[/blue]")
        sys.exit(1)
    
    # Run automation
    automation = FagunAutomation(config)
    asyncio.run(automation.run_automation(url))

if __name__ == "__main__":
    main()

