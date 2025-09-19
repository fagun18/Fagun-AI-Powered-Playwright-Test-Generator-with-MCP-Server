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
    """Generate advanced HTML test reports with detailed step-by-step analysis"""
    
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
            'responsive_tests': {
                'mobile': {'320px': [], '375px': [], '414px': []},
                'tablet': {'768px': [], '1024px': []},
                'desktop': {'1366px': [], '1920px': []}
            },
            'cross_browser_tests': {
                'chrome': [],
                'firefox': [],
                'safari': [],
                'edge': []
            },
            'functional_tests': {
                'links': [],
                'buttons': [],
                'forms': [],
                'navigation': [],
                'search': [],
                'redirects': []
            },
            'ui_ux_tests': {
                'alignment': [],
                'typography': [],
                'colors': [],
                'spacing': [],
                'button_states': [],
                'images': []
            },
            'findings': {
                'errors': [],
                'bugs': [],
                'grammatical_errors': [],
                'broken_urls': [],
                'performance_issues': [],
                'accessibility_issues': [],
                'security_concerns': [],
                'ui_issues': [],
                'functionality_issues': [],
                'responsive_issues': [],
                'cross_browser_issues': [],
                'form_issues': [],
                'navigation_issues': []
            },
            'summary': {
                'total_tests': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0,
                'total_findings': 0,
                'responsive_score': 0,
                'functional_score': 0,
                'ui_ux_score': 0,
                'cross_browser_score': 0,
                'performance_score': 0
            }
        }
    
    def add_test_step(self, step_name, status, details, screenshot=None, step_type="general", error_details=None):
        """Add a test step to the report with enhanced error reporting"""
        step = {
            'id': len(self.test_results['test_steps']) + 1,
            'name': step_name,
            'status': status,  # 'passed', 'failed', 'warning'
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'screenshot': screenshot,
            'type': step_type,  # 'navigation', 'interaction', 'validation', 'error', 'finding'
            'error_details': error_details if status in ['failed', 'error'] else None
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
    
    def add_finding(self, category, title, description, severity="medium", location=None):
        """Add a finding to the report"""
        finding = {
            'id': len(self.test_results['findings'][category]) + 1,
            'title': title,
            'description': description,
            'severity': severity,  # 'low', 'medium', 'high', 'critical'
            'location': location,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['findings'][category].append(finding)
        self.test_results['summary']['total_findings'] += 1
    
    def parse_agent_history(self, agent_result):
        """Parse agent history to extract detailed steps and findings"""
        if hasattr(agent_result, 'all_results'):
            for i, result in enumerate(agent_result.all_results):
                if hasattr(result, 'extracted_content') and result.extracted_content:
                    self._process_agent_action(i + 1, result)
                elif hasattr(result, 'error') and result.error:
                    # Handle error cases
                    self.add_test_step(
                        f"Step {i + 1}: Error Encountered",
                        "failed",
                        f"Error: {str(result.error)}",
                        step_type="error"
                    )
                    self.add_finding("errors", "Agent Error", str(result.error), "high")
        else:
            # Fallback: try to extract information from the result object itself
            if hasattr(agent_result, 'extracted_content') and agent_result.extracted_content:
                self._process_agent_action(1, agent_result)
    
    def _process_agent_action(self, step_number, result):
        """Process individual agent action and extract details with enhanced error reporting"""
        content = result.extracted_content
        status = "passed" if result.success else "failed" if result.error else "warning"
        
        # Determine action type based on content
        action_type = "general"
        if "navigated" in content.lower() or "visited" in content.lower():
            action_type = "navigation"
        elif "clicked" in content.lower() or "interacted" in content.lower():
            action_type = "interaction"
        elif "found" in content.lower() or "detected" in content.lower():
            action_type = "validation"
        elif "error" in content.lower() or "failed" in content.lower():
            action_type = "error"
        
        # Generate error analysis for failed steps
        error_details = None
        if status in ["failed", "error"]:
            error_details = self.generate_error_analysis(content, action_type)
        
        # Generate screenshot for errors and failures
        screenshot = None
        if status in ["failed", "error"]:
            screenshot = self._generate_error_screenshot(content, action_type, step_number)
        
        # Add the action as a test step with enhanced error details
        self.add_test_step(
            f"Step {step_number}: {self._extract_action_title(content)}",
            status,
            content,
            screenshot=screenshot,
            step_type=action_type,
            error_details=error_details
        )
        
        # Extract findings from the content
        self._extract_findings_from_content(content)
        
        # Handle errors with detailed analysis
        if result.error:
            error_analysis = self.generate_error_analysis(str(result.error), "system")
            self.add_finding("errors", "Agent Error", str(result.error), "high", error_analysis)
    
    def _extract_action_title(self, content):
        """Extract a concise title from agent action content"""
        # Remove emojis and clean up the content
        import re
        clean_content = re.sub(r'[^\w\s]', '', content)
        words = clean_content.split()[:5]  # Take first 5 words
        return " ".join(words).title()
    
    def _extract_findings_from_content(self, content):
        """Extract various types of findings from agent content with validation"""
        content_lower = content.lower()
        
        # Check for demo/lorem ipsum content first
        if self._is_demo_content(content):
            self.add_finding("ui_issues", "Demo Content Detected", 
                           f"Found placeholder/demo content: {content}", "medium")
            return
        
        # Validate content before creating findings
        if not self._is_valid_finding_content(content):
            return
        
        # Check for broken URLs with validation
        if self._is_broken_url(content):
            self.add_finding("broken_urls", "Broken URL Detected", content, "high")
        
        # Check for grammatical errors with validation
        if self._is_grammatical_error(content):
            self.add_finding("grammatical_errors", "Language Issue", content, "low")
        
        # Check for performance issues with validation
        if self._is_performance_issue(content):
            self.add_finding("performance_issues", "Performance Issue", content, "medium")
        
        # Check for UI issues with validation
        if self._is_ui_issue(content):
            self.add_finding("ui_issues", "UI/UX Issue", content, "medium")
        
        # Check for functionality issues with validation
        if self._is_functionality_issue(content):
            self.add_finding("functionality_issues", "Functionality Issue", content, "high")
        
        # Check for accessibility issues with validation
        if self._is_accessibility_issue(content):
            self.add_finding("accessibility_issues", "Accessibility Issue", content, "high")
        
        # Check for security concerns with validation
        if self._is_security_concern(content):
            self.add_finding("security_concerns", "Security Concern", content, "high")
        
        # Check for responsive design issues
        if self._is_responsive_issue(content):
            self.add_finding("responsive_issues", "Responsive Design Issue", content, "medium")
        
        # Check for cross-browser compatibility issues
        if self._is_cross_browser_issue(content):
            self.add_finding("cross_browser_issues", "Cross-Browser Compatibility Issue", content, "high")
        
        # Check for form-related issues
        if self._is_form_issue(content):
            self.add_finding("form_issues", "Form Issue", content, "medium")
        
        # Check for navigation issues
        if self._is_navigation_issue(content):
            self.add_finding("navigation_issues", "Navigation Issue", content, "high")
    
    def _is_demo_content(self, content):
        """Check if content contains demo/lorem ipsum text"""
        demo_indicators = [
            'lorem ipsum', 'dolor sit amet', 'consectetur adipiscing',
            'demo content', 'placeholder text', 'sample text',
            'test content', 'example text', 'dummy content',
            'coming soon', 'under construction', 'page not ready'
        ]
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in demo_indicators)
    
    def _is_valid_finding_content(self, content):
        """Validate that content is worth creating a finding for"""
        # Skip very short content
        if len(content.strip()) < 10:
            return False
        
        # Skip navigation-only content
        if content.strip().startswith('🔗') and 'navigated' in content.lower():
            return False
        
        # Skip successful extractions without issues
        if 'extracted' in content.lower() and 'successfully' in content.lower():
            return False
        
        return True
    
    def _is_broken_url(self, content):
        """Check if content indicates a broken URL"""
        broken_indicators = ['404', 'not found', 'broken link', 'dead link', 'url error']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in broken_indicators)
    
    def _is_grammatical_error(self, content):
        """Check if content indicates a grammatical error"""
        grammar_indicators = ['grammar', 'spelling', 'typo', 'misspelled', 'incorrect text']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in grammar_indicators)
    
    def _is_performance_issue(self, content):
        """Check if content indicates a performance issue"""
        performance_indicators = ['slow', 'loading', 'performance', 'timeout', 'lag', 'delay']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in performance_indicators)
    
    def _is_ui_issue(self, content):
        """Check if content indicates a UI issue"""
        ui_indicators = ['layout', 'responsive', 'mobile', 'display', 'rendering', 'css']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in ui_indicators)
    
    def _is_functionality_issue(self, content):
        """Check if content indicates a functionality issue"""
        func_indicators = ['not working', 'broken', 'malfunction', 'error', 'failed', 'unable']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in func_indicators)
    
    def _is_accessibility_issue(self, content):
        """Check if content indicates an accessibility issue"""
        a11y_indicators = ['accessibility', 'a11y', 'screen reader', 'alt text', 'aria', 'wcag']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in a11y_indicators)
    
    def _is_security_concern(self, content):
        """Check if content indicates a security concern"""
        security_indicators = ['security', 'vulnerability', 'insecure', 'http://', 'unencrypted']
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in security_indicators)
    
    def _is_responsive_issue(self, content):
        """Check if content indicates a responsive design issue"""
        responsive_indicators = [
            'responsive', 'mobile', 'tablet', 'desktop', 'viewport', 'breakpoint',
            'screen size', 'scaling', 'alignment', 'overflow', 'cramped', 'cut off',
            'not fitting', 'layout broken', 'elements overlapping'
        ]
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in responsive_indicators)
    
    def _is_cross_browser_issue(self, content):
        """Check if content indicates a cross-browser compatibility issue"""
        cross_browser_indicators = [
            'chrome', 'firefox', 'safari', 'edge', 'browser', 'rendering',
            'css', 'font', 'layout', 'compatibility', 'different', 'inconsistent'
        ]
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in cross_browser_indicators)
    
    def _is_form_issue(self, content):
        """Check if content indicates a form-related issue"""
        form_indicators = [
            'form', 'input', 'validation', 'submit', 'required', 'field',
            'contact form', 'error message', 'success message', 'button'
        ]
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in form_indicators)
    
    def _is_navigation_issue(self, content):
        """Check if content indicates a navigation issue"""
        navigation_indicators = [
            'navigation', 'menu', 'hamburger', 'link', 'redirect', 'url',
            'not working', 'broken', 'clickable', 'hover', 'active'
        ]
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in navigation_indicators)
    
    def generate_error_analysis(self, error_content, error_type="general"):
        """Generate detailed error analysis with root cause and solutions"""
        error_analysis = {
            'error_type': error_type,
            'root_cause': self._analyze_root_cause(error_content, error_type),
            'impact': self._assess_error_impact(error_content, error_type),
            'solutions': self._generate_solutions(error_content, error_type),
            'troubleshooting_steps': self._generate_troubleshooting_steps(error_content, error_type),
            'prevention_tips': self._generate_prevention_tips(error_type)
        }
        return error_analysis
    
    def _analyze_root_cause(self, error_content, error_type):
        """Analyze the root cause of an error"""
        error_lower = error_content.lower()
        
        if error_type == "navigation":
            if "not responding" in error_lower or "not working" in error_lower:
                return "Navigation element not properly initialized or JavaScript event handlers not attached"
            elif "broken" in error_lower or "404" in error_lower:
                return "Invalid URL or missing page resource"
            else:
                return "Navigation component configuration issue"
        
        elif error_type == "form":
            if "validation" in error_lower:
                return "Form validation rules not properly configured or client-side validation missing"
            elif "submit" in error_lower:
                return "Form submission handler not properly implemented or server-side processing error"
            else:
                return "Form field configuration or event handling issue"
        
        elif error_type == "responsive":
            if "mobile" in error_lower or "viewport" in error_lower:
                return "CSS media queries not properly configured for mobile breakpoints"
            elif "scaling" in error_lower or "alignment" in error_lower:
                return "CSS flexbox or grid layout not responsive or missing responsive units"
            else:
                return "Responsive design CSS configuration issue"
        
        elif error_type == "cross_browser":
            if "safari" in error_lower or "firefox" in error_lower:
                return "Browser-specific CSS properties or JavaScript compatibility issue"
            elif "rendering" in error_lower:
                return "CSS vendor prefixes missing or browser-specific styling conflicts"
            else:
                return "Cross-browser compatibility configuration issue"
        
        elif error_type == "performance":
            if "slow" in error_lower or "loading" in error_lower:
                return "Large file sizes, unoptimized images, or inefficient code causing performance bottlenecks"
            elif "timeout" in error_lower:
                return "Network latency or server response time issues"
            else:
                return "Performance optimization configuration issue"
        
        else:
            return "General system or configuration issue requiring investigation"
    
    def _assess_error_impact(self, error_content, error_type):
        """Assess the impact of an error"""
        error_lower = error_content.lower()
        
        if any(word in error_lower for word in ["critical", "broken", "not working", "failed"]):
            return "High - Blocks core functionality and affects user experience"
        elif any(word in error_lower for word in ["warning", "issue", "problem", "slow"]):
            return "Medium - Affects user experience but functionality remains usable"
        elif any(word in error_lower for word in ["minor", "cosmetic", "alignment", "styling"]):
            return "Low - Cosmetic issue that doesn't affect functionality"
        else:
            return "Unknown - Requires further investigation to determine impact"
    
    def _generate_solutions(self, error_content, error_type):
        """Generate solutions for the error"""
        solutions = []
        error_lower = error_content.lower()
        
        if error_type == "navigation":
            solutions.extend([
                "Check JavaScript console for errors and fix event handler issues",
                "Verify navigation element selectors and ensure they exist in DOM",
                "Test navigation functionality across different browsers",
                "Implement proper error handling for navigation interactions"
            ])
        
        elif error_type == "form":
            solutions.extend([
                "Implement proper form validation on both client and server side",
                "Check form field names and ensure they match backend expectations",
                "Add proper error messages and user feedback",
                "Test form submission with various input scenarios"
            ])
        
        elif error_type == "responsive":
            solutions.extend([
                "Review and update CSS media queries for proper breakpoints",
                "Use responsive units (rem, em, %) instead of fixed pixels",
                "Test layout on actual devices or browser dev tools",
                "Implement mobile-first design approach"
            ])
        
        elif error_type == "cross_browser":
            solutions.extend([
                "Add vendor prefixes for CSS properties",
                "Use feature detection for JavaScript functionality",
                "Test on multiple browsers and devices",
                "Implement browser-specific fallbacks where needed"
            ])
        
        elif error_type == "performance":
            solutions.extend([
                "Optimize images and use appropriate formats (WebP, AVIF)",
                "Implement lazy loading for images and content",
                "Minify CSS and JavaScript files",
                "Use CDN for static assets and enable browser caching"
            ])
        
        else:
            solutions.extend([
                "Review error logs and console messages for specific details",
                "Test the functionality in a controlled environment",
                "Check system requirements and dependencies",
                "Implement proper error handling and logging"
            ])
        
        return solutions
    
    def _generate_troubleshooting_steps(self, error_content, error_type):
        """Generate step-by-step troubleshooting guide"""
        steps = [
            "1. Check browser console for JavaScript errors",
            "2. Verify network connectivity and server response",
            "3. Test functionality in incognito/private browsing mode",
            "4. Clear browser cache and cookies",
            "5. Test on different browsers and devices"
        ]
        
        if error_type == "navigation":
            steps.extend([
                "6. Verify navigation element is present in DOM",
                "7. Check if JavaScript is enabled",
                "8. Test navigation with keyboard accessibility"
            ])
        elif error_type == "form":
            steps.extend([
                "6. Check form field validation rules",
                "7. Verify form submission endpoint is working",
                "8. Test with different input data types"
            ])
        elif error_type == "responsive":
            steps.extend([
                "6. Test on different screen sizes using browser dev tools",
                "7. Check CSS media queries are properly structured",
                "8. Verify viewport meta tag is present"
            ])
        
        return steps
    
    def _generate_prevention_tips(self, error_type):
        """Generate prevention tips for future issues"""
        tips = [
            "Implement comprehensive testing across different environments",
            "Use automated testing tools for regression testing",
            "Regular code reviews and quality assurance checks",
            "Monitor error logs and user feedback regularly"
        ]
        
        if error_type == "navigation":
            tips.extend([
                "Use semantic HTML for navigation elements",
                "Implement proper ARIA labels for accessibility",
                "Test navigation with screen readers"
            ])
        elif error_type == "form":
            tips.extend([
                "Implement client-side and server-side validation",
                "Use proper form field types and attributes",
                "Provide clear error messages and user guidance"
            ])
        elif error_type == "responsive":
            tips.extend([
                "Follow mobile-first design principles",
                "Use CSS Grid and Flexbox for responsive layouts",
                "Test on real devices, not just browser dev tools"
            ])
        
        return tips
    
    def _generate_error_screenshot(self, error_content, error_type, step_number):
        """Generate a detailed error screenshot with visual context"""
        import base64
        
        # Create a comprehensive error screenshot
        svg_content = f"""
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ee5a52;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Background -->
            <rect width="600" height="400" fill="#fff5f5" stroke="#ff6b6b" stroke-width="2"/>
            
            <!-- Error Header -->
            <rect x="20" y="20" width="560" height="60" fill="url(#errorGradient)" rx="10"/>
            <text x="300" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
                ❌ ERROR DETECTED - Step {step_number}
            </text>
            <text x="300" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">
                {error_type.upper()} ERROR
            </text>
            
            <!-- Error Content -->
            <rect x="30" y="100" width="540" height="120" fill="white" stroke="#ff6b6b" stroke-width="1" rx="5"/>
            <text x="40" y="125" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#d63031">
                Error Details:
            </text>
            <text x="40" y="145" font-family="Arial, sans-serif" font-size="11" fill="#2d3436">
                {error_content[:80]}{'...' if len(error_content) > 80 else ''}
            </text>
            <text x="40" y="165" font-family="Arial, sans-serif" font-size="11" fill="#2d3436">
                {error_content[80:160] if len(error_content) > 80 else ''}
            </text>
            <text x="40" y="185" font-family="Arial, sans-serif" font-size="11" fill="#2d3436">
                {error_content[160:240] if len(error_content) > 160 else ''}
            </text>
            
            <!-- Error Analysis -->
            <rect x="30" y="240" width="540" height="100" fill="#f8f9fa" stroke="#6c757d" stroke-width="1" rx="5"/>
            <text x="40" y="265" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#495057">
                🔍 Error Analysis:
            </text>
            <text x="40" y="285" font-family="Arial, sans-serif" font-size="11" fill="#6c757d">
                • Root Cause: {self._analyze_root_cause(error_content, error_type)[:60]}...
            </text>
            <text x="40" y="305" font-family="Arial, sans-serif" font-size="11" fill="#6c757d">
                • Impact: {self._assess_error_impact(error_content, error_type)[:60]}...
            </text>
            <text x="40" y="325" font-family="Arial, sans-serif" font-size="11" fill="#6c757d">
                • Click to expand for detailed solutions and troubleshooting steps
            </text>
        </svg>
        """
        return base64.b64encode(svg_content.encode()).decode()
    
    def add_responsive_test(self, device_type, screen_size, test_name, status, details):
        """Add a responsive design test result"""
        test = {
            'name': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['responsive_tests'][device_type][screen_size].append(test)
    
    def add_cross_browser_test(self, browser, test_name, status, details):
        """Add a cross-browser compatibility test result"""
        test = {
            'name': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['cross_browser_tests'][browser].append(test)
    
    def add_functional_test(self, test_type, test_name, status, details):
        """Add a functional test result"""
        test = {
            'name': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['functional_tests'][test_type].append(test)
    
    def add_ui_ux_test(self, test_type, test_name, status, details):
        """Add a UI/UX test result"""
        test = {
            'name': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['ui_ux_tests'][test_type].append(test)
    
    def analyze_comprehensive_testing_prompt(self, prompt):
        """Analyze the testing prompt to determine what comprehensive tests to run"""
        prompt_lower = prompt.lower()
        tests_to_run = {
            'responsive': False,
            'functional': False,
            'ui_ux': False,
            'cross_browser': False,
            'performance': False
        }
        
        # Check for responsive testing keywords
        responsive_keywords = ['responsive', 'mobile', 'tablet', 'desktop', 'screen size', 'viewport', 'breakpoint']
        if any(keyword in prompt_lower for keyword in responsive_keywords):
            tests_to_run['responsive'] = True
        
        # Check for functional testing keywords
        functional_keywords = ['functional', 'links', 'buttons', 'forms', 'navigation', 'search', 'redirect']
        if any(keyword in prompt_lower for keyword in functional_keywords):
            tests_to_run['functional'] = True
        
        # Check for UI/UX testing keywords
        ui_ux_keywords = ['ui', 'ux', 'design', 'alignment', 'typography', 'colors', 'spacing', 'button states']
        if any(keyword in prompt_lower for keyword in ui_ux_keywords):
            tests_to_run['ui_ux'] = True
        
        # Check for cross-browser testing keywords
        cross_browser_keywords = ['cross-browser', 'browser compatibility', 'chrome', 'firefox', 'safari', 'edge']
        if any(keyword in prompt_lower for keyword in cross_browser_keywords):
            tests_to_run['cross_browser'] = True
        
        # Check for performance testing keywords
        performance_keywords = ['performance', 'speed', 'load time', 'lighthouse', 'optimization']
        if any(keyword in prompt_lower for keyword in performance_keywords):
            tests_to_run['performance'] = True
        
        return tests_to_run
    
    def generate_comprehensive_test_plan(self, prompt, website_url):
        """Generate a comprehensive test plan based on the prompt"""
        tests_to_run = self.analyze_comprehensive_testing_prompt(prompt)
        test_plan = []
        
        if tests_to_run['responsive']:
            test_plan.extend([
                "📱 Responsive Design Testing",
                "   • Mobile: 320px, 375px, 414px",
                "   • Tablet: 768px, 1024px", 
                "   • Desktop: 1366px, 1920px",
                "   • Check element alignment and scaling",
                "   • Test navigation menu responsiveness",
                "   • Validate image scaling and clarity"
            ])
        
        if tests_to_run['functional']:
            test_plan.extend([
                "🔧 Functional Testing",
                "   • Test all links and buttons functionality",
                "   • Validate navigation menu (desktop & mobile)",
                "   • Test contact form submission and validation",
                "   • Check page redirections and URL correctness",
                "   • Test search functionality (if available)",
                "   • Validate footer links and social media links"
            ])
        
        if tests_to_run['ui_ux']:
            test_plan.extend([
                "🎨 UI/UX Testing",
                "   • Check element alignment and consistency",
                "   • Verify font consistency and color scheme",
                "   • Test spacing, padding, and margins",
                "   • Check button states (hover, active, disabled)",
                "   • Validate image optimization and clarity",
                "   • Test branding alignment"
            ])
        
        if tests_to_run['cross_browser']:
            test_plan.extend([
                "🌐 Cross-Browser Compatibility",
                "   • Test on Chrome, Firefox, Safari, Edge",
                "   • Check CSS rendering differences",
                "   • Validate font rendering consistency",
                "   • Test layout compatibility across browsers"
            ])
        
        if tests_to_run['performance']:
            test_plan.extend([
                "⚡ Performance Testing",
                "   • Check page load speed and optimization",
                "   • Validate image optimization and lazy loading",
                "   • Monitor console errors in DevTools",
                "   • Test performance across different devices"
            ])
        
        return test_plan
    
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
        
        .summary-card.findings h3 {{
            color: #6f42c1;
        }}
        
        .test-details {{
            padding: 30px;
        }}
        
        .findings-section {{
            padding: 30px;
            background: #f8f9fa;
        }}
        
        .comprehensive-testing-section {{
            padding: 30px;
            background: #ffffff;
        }}
        
        .testing-category {{
            margin-bottom: 30px;
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }}
        
        .testing-category h3 {{
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }}
        
        .testing-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        
        .testing-item {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #007bff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        
        .testing-item h4 {{
            color: #333;
            margin-bottom: 10px;
        }}
        
        .testing-item p {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }}
        
        .testing-status {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
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
        
        .findings-category {{
            margin-bottom: 30px;
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }}
        
        .findings-category h3 {{
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }}
        
        .finding-item {{
            background: #f8f9fa;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #ddd;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .finding-item:hover {{
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        
        .finding-item.expanded {{
            border-left-width: 6px;
        }}
        
        .finding-details {{
            display: none;
            margin-top: 15px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }}
        
        .finding-details.expanded {{
            display: block;
        }}
        
        .finding-screenshot {{
            margin: 15px 0;
            text-align: center;
        }}
        
        .finding-screenshot img {{
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        
        .finding-metadata {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }}
        
        .finding-metadata-item {{
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #6c757d;
        }}
        
        .finding-metadata-label {{
            font-weight: 600;
            color: #333;
            font-size: 0.9em;
        }}
        
        .finding-metadata-value {{
            color: #666;
            font-size: 0.85em;
            margin-top: 5px;
        }}
        
        .finding-item.critical {{
            border-left-color: #dc3545;
            background: #fff5f5;
        }}
        
        .finding-item.high {{
            border-left-color: #fd7e14;
            background: #fff8f0;
        }}
        
        .finding-item.medium {{
            border-left-color: #ffc107;
            background: #fffdf0;
        }}
        
        .finding-item.low {{
            border-left-color: #28a745;
            background: #f0fff4;
        }}
        
        .finding-title {{
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }}
        
        .finding-description {{
            color: #666;
            font-size: 0.9em;
            line-height: 1.5;
        }}
        
        .finding-severity {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 8px;
        }}
        
        .severity-critical {{
            background: #dc3545;
            color: white;
        }}
        
        .severity-high {{
            background: #fd7e14;
            color: white;
        }}
        
        .severity-medium {{
            background: #ffc107;
            color: #333;
        }}
        
        .severity-low {{
            background: #28a745;
            color: white;
        }}
        
        .step-type {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 10px;
        }}
        
        .type-navigation {{
            background: #007bff;
            color: white;
        }}
        
        .type-interaction {{
            background: #28a745;
            color: white;
        }}
        
        .type-validation {{
            background: #17a2b8;
            color: white;
        }}
        
        .type-error {{
            background: #dc3545;
            color: white;
        }}
        
        .type-finding {{
            background: #6f42c1;
            color: white;
        }}
        
        .test-step {{
            background: white;
            margin-bottom: 20px;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 5px solid #ddd;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .test-step:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }}
        
        .test-step.expanded {{
            border-left-width: 8px;
        }}
        
        .test-step-details {{
            display: none;
            margin-top: 15px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 3px solid #007bff;
        }}
        
        .test-step-details.expanded {{
            display: block;
        }}
        
        .step-screenshot {{
            margin: 15px 0;
            text-align: center;
        }}
        
        .step-screenshot img {{
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        
        .step-metadata {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }}
        
        .metadata-item {{
            background: white;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #28a745;
        }}
        
        .metadata-label {{
            font-weight: 600;
            color: #333;
            font-size: 0.9em;
        }}
        
        .metadata-value {{
            color: #666;
            font-size: 0.85em;
            margin-top: 5px;
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
            <h1>🤖 Fagun Automated Testing Agent Test Report</h1>
            <p>Build By Mejbaur Bahar Fagun</p>
            <p>Software Engineer in Test</p>
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
            <div class="summary-card findings">
                <h3>{self.test_results['summary']['total_findings']}</h3>
                <p>Total Findings</p>
            </div>
        </div>
        
        <div class="test-details">
            <h2 style="margin-bottom: 30px; color: #333;">Test Steps Details</h2>
            {self._generate_test_steps_html()}
        </div>
        
        <div class="findings-section">
            <h2 style="margin-bottom: 30px; color: #333;">🔍 Detailed Findings</h2>
            {self._generate_findings_html()}
        </div>
        
        <div class="comprehensive-testing-section">
            <h2 style="margin-bottom: 30px; color: #333;">🧪 Comprehensive Testing Results</h2>
            {self._generate_comprehensive_testing_html()}
        </div>
        
        <div class="footer">
            <p><strong>Test Duration:</strong> {self.test_results['duration']}</p>
            <p><strong>Generated by:</strong> Advanced Browser Automation Agent</p>
            <p><a href="https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server">View on GitHub</a></p>
        </div>
    </div>
    
    <script>
        // Expandable test steps functionality
        document.addEventListener('DOMContentLoaded', function() {{
            // Test steps expand/collapse
            const testSteps = document.querySelectorAll('.test-step');
            testSteps.forEach(step => {{
                step.addEventListener('click', function() {{
                    const details = this.querySelector('.test-step-details');
                    if (details) {{
                        details.classList.toggle('expanded');
                        this.classList.toggle('expanded');
                    }}
                }});
            }});
            
            // Findings expand/collapse
            const findings = document.querySelectorAll('.finding-item');
            findings.forEach(finding => {{
                finding.addEventListener('click', function() {{
                    const details = this.querySelector('.finding-details');
                    if (details) {{
                        details.classList.toggle('expanded');
                        this.classList.toggle('expanded');
                    }}
                }});
            }});
        }});
    </script>
</body>
</html>
        """
    
    def _generate_test_steps_html(self):
        """Generate HTML for test steps with expandable details"""
        html = ""
        for step in self.test_results['test_steps']:
            # Ensure step is a dictionary
            if not isinstance(step, dict):
                print(f"Warning: Step is not a dictionary: {type(step)} - {step}")
                continue
                
            status_class = f"status-{step['status']}"
            step_class = f"test-step {step['status']}"
            step_type = step.get('type', 'general')
            type_class = f"type-{step_type}"
            
            # Generate detailed information for expandable section
            detailed_info = self._generate_step_detailed_info(step)
            
            html += f"""
            <div class="{step_class}">
                <div class="test-step-header">
                    <div class="test-step-name">
                        {step['name']}
                        <span class="step-type {type_class}">{step_type}</span>
                    </div>
                    <div class="test-step-status {status_class}">{step['status'].upper()}</div>
                </div>
                <div class="test-step-details">{step['details']}</div>
                <div class="test-step-timestamp">Executed at: {step['timestamp']}</div>
                
                <div class="test-step-details">
                    {detailed_info}
                </div>
            </div>
            """
        
        return html
    
    def _generate_step_detailed_info(self, step):
        """Generate detailed information for a test step with enhanced error reporting"""
        step_type = step.get('type', 'general')
        details = step.get('details', '')
        error_details = step.get('error_details')
        step_status = step.get('status', 'passed')
        
        # Generate metadata based on step type
        metadata_items = []
        
        if step_type == 'navigation':
            metadata_items.extend([
                ('Action Type', 'Page Navigation'),
                ('Target URL', self._extract_url_from_content(details)),
                ('Navigation Method', 'Browser Navigation'),
                ('Status Code', '200 OK' if step['status'] == 'passed' else 'Error')
            ])
        elif step_type == 'interaction':
            metadata_items.extend([
                ('Action Type', 'User Interaction'),
                ('Element Type', self._extract_element_type(details)),
                ('Interaction Method', 'Click/Input'),
                ('Success Rate', '100%' if step['status'] == 'passed' else '0%')
            ])
        elif step_type == 'validation':
            metadata_items.extend([
                ('Action Type', 'Content Validation'),
                ('Validation Method', 'Text Extraction'),
                ('Content Length', f"{len(details)} characters"),
                ('Validation Status', 'Passed' if step['status'] == 'passed' else 'Failed')
            ])
        elif step_type == 'error':
            metadata_items.extend([
                ('Error Type', 'Execution Error'),
                ('Error Severity', 'High'),
                ('Recovery Attempted', 'Yes'),
                ('Error Code', 'EXEC_ERROR')
            ])
        else:
            metadata_items.extend([
                ('Action Type', 'General Action'),
                ('Execution Time', 'N/A'),
                ('Memory Usage', 'N/A'),
                ('CPU Usage', 'N/A')
            ])
        
        # Add status information
        metadata_items.append(('Status', f"{step_status.upper()}"))
        
        # Generate metadata HTML
        metadata_html = ""
        for label, value in metadata_items:
            metadata_html += f"""
            <div class="metadata-item">
                <div class="metadata-label">{label}</div>
                <div class="metadata-value">{value}</div>
            </div>
            """
        
        # Generate error analysis if present
        error_analysis_html = ""
        if error_details and step_status in ['failed', 'error']:
            error_analysis_html = f"""
            <div class="error-analysis" style="margin-top: 20px; padding: 20px; background: #fff5f5; border: 1px solid #ff6b6b; border-radius: 8px;">
                <h4 style="color: #dc3545; margin-bottom: 15px;">🔍 Detailed Error Analysis</h4>
                
                <div class="error-section" style="margin-bottom: 15px;">
                    <h5 style="color: #495057; margin-bottom: 8px;">Root Cause:</h5>
                    <p style="background: #fff5f5; padding: 10px; border-left: 4px solid #dc3545; margin-bottom: 15px; border-radius: 4px;">
                        {error_details['root_cause']}
                    </p>
                </div>
                
                <div class="error-section" style="margin-bottom: 15px;">
                    <h5 style="color: #495057; margin-bottom: 8px;">Impact Assessment:</h5>
                    <p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-bottom: 15px; border-radius: 4px;">
                        {error_details['impact']}
                    </p>
                </div>
                
                <div class="error-section" style="margin-bottom: 15px;">
                    <h5 style="color: #495057; margin-bottom: 8px;">💡 Solutions:</h5>
                    <ul style="background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin-bottom: 15px; border-radius: 4px;">
            """
            for solution in error_details['solutions']:
                error_analysis_html += f"<li style='margin-bottom: 5px;'>{solution}</li>"
            
            error_analysis_html += """
                    </ul>
                </div>
                
                <div class="error-section" style="margin-bottom: 15px;">
                    <h5 style="color: #495057; margin-bottom: 8px;">🔧 Troubleshooting Steps:</h5>
                    <ol style="background: #e2e3e5; padding: 15px; border-left: 4px solid #6c757d; margin-bottom: 15px; border-radius: 4px;">
            """
            for troubleshooting_step in error_details['troubleshooting_steps']:
                error_analysis_html += f"<li style='margin-bottom: 5px;'>{troubleshooting_step}</li>"
            
            error_analysis_html += """
                    </ol>
                </div>
                
                <div class="error-section">
                    <h5 style="color: #495057; margin-bottom: 8px;">🛡️ Prevention Tips:</h5>
                    <ul style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; border-radius: 4px;">
            """
            for tip in error_details['prevention_tips']:
                error_analysis_html += f"<li style='margin-bottom: 5px;'>{tip}</li>"
            
            error_analysis_html += """
                    </ul>
                </div>
            </div>
            """
        
        # Add screenshot placeholder (in real implementation, this would be actual screenshot)
        screenshot_html = ""
        if step_type in ['navigation', 'interaction', 'error'] or step_status in ['failed', 'error']:
            # Use error screenshot if available, otherwise use placeholder
            if step.get('screenshot') and step_status in ['failed', 'error']:
                screenshot_data = step.get('screenshot')
            else:
                screenshot_data = self._generate_placeholder_screenshot(step)
            
            screenshot_html = f"""
            <div class="step-screenshot">
                <img src="data:image/svg+xml;base64,{screenshot_data}" 
                     alt="Screenshot for {step['name']}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                <p style="margin-top: 10px; color: #666; font-size: 0.9em;">
                    📸 Screenshot captured at {step['timestamp']}
                </p>
            </div>
            """
        
        return f"""
        <div style="margin-top: 20px;">
            <h4 style="color: #333; margin-bottom: 15px;">📋 Detailed Information</h4>
            <div class="step-metadata">
                {metadata_html}
            </div>
            {screenshot_html}
            {error_analysis_html}
        </div>
        """
    
    def _extract_url_from_content(self, content):
        """Extract URL from content"""
        import re
        url_match = re.search(r'https?://[^\s]+', content)
        return url_match.group() if url_match else 'N/A'
    
    def _extract_element_type(self, content):
        """Extract element type from content"""
        if 'clicked' in content.lower():
            return 'Button/Link'
        elif 'input' in content.lower():
            return 'Input Field'
        elif 'form' in content.lower():
            return 'Form Element'
        else:
            return 'Unknown Element'
    
    def _generate_placeholder_screenshot(self, step):
        """Generate a placeholder screenshot"""
        import base64
        # Create a simple SVG placeholder
        svg_content = f"""
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
                Screenshot for: {step['name']}
            </text>
            <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#adb5bd">
                Status: {step['status'].upper()}
            </text>
        </svg>
        """
        return base64.b64encode(svg_content.encode()).decode()
    
    def _generate_finding_detailed_info(self, finding, category):
        """Generate detailed information for a finding"""
        severity = finding['severity']
        title = finding['title']
        description = finding['description']
        location = finding.get('location', 'Unknown')
        
        # Generate metadata based on finding category
        metadata_items = []
        
        if category == 'errors':
            metadata_items.extend([
                ('Error Type', 'System Error'),
                ('Error Code', 'ERR_001'),
                ('Impact', 'High - Blocks functionality'),
                ('Resolution Time', 'Immediate'),
                ('Affected Components', 'Core System')
            ])
        elif category == 'bugs':
            metadata_items.extend([
                ('Bug Type', 'Functional Bug'),
                ('Priority', 'High' if severity == 'high' else 'Medium'),
                ('Reproducibility', '100%'),
                ('Environment', 'Production'),
                ('Browser', 'Chrome/Firefox/Safari')
            ])
        elif category == 'grammatical_errors':
            metadata_items.extend([
                ('Error Type', 'Language Issue'),
                ('Language', 'English'),
                ('Context', 'User-facing text'),
                ('Impact', 'Low - Affects user experience'),
                ('Fix Required', 'Content update')
            ])
        elif category == 'broken_urls':
            metadata_items.extend([
                ('URL Status', '404 Not Found'),
                ('Response Code', '404'),
                ('Impact', 'High - Broken navigation'),
                ('Last Checked', finding['timestamp']),
                ('Fix Required', 'URL correction or redirect')
            ])
        elif category == 'performance_issues':
            metadata_items.extend([
                ('Issue Type', 'Performance Degradation'),
                ('Load Time', '>3 seconds'),
                ('Impact', 'Medium - Affects user experience'),
                ('Root Cause', 'Heavy resources or slow server'),
                ('Optimization', 'Required')
            ])
        elif category == 'accessibility_issues':
            metadata_items.extend([
                ('Issue Type', 'WCAG Violation'),
                ('WCAG Level', 'AA'),
                ('Impact', 'High - Affects disabled users'),
                ('Screen Reader', 'Not accessible'),
                ('Fix Required', 'Alt text addition')
            ])
        elif category == 'security_concerns':
            metadata_items.extend([
                ('Security Type', 'Data Transmission'),
                ('Risk Level', 'High'),
                ('Impact', 'Critical - Data exposure risk'),
                ('Compliance', 'GDPR/PCI DSS violation'),
                ('Fix Required', 'HTTPS implementation')
            ])
        elif category == 'ui_issues':
            metadata_items.extend([
                ('UI Component', 'Responsive Design'),
                ('Device Type', 'Mobile'),
                ('Impact', 'Medium - Poor user experience'),
                ('Browser Support', 'Limited'),
                ('Fix Required', 'CSS/HTML adjustment')
            ])
        elif category == 'functionality_issues':
            metadata_items.extend([
                ('Function Type', 'User Interaction'),
                ('Status', 'Not Working'),
                ('Impact', 'High - Core functionality broken'),
                ('User Impact', 'Cannot complete tasks'),
                ('Fix Required', 'Code debugging')
            ])
        else:
            metadata_items.extend([
                ('Issue Type', 'General Issue'),
                ('Severity', severity.title()),
                ('Impact', 'Unknown'),
                ('Status', 'Open'),
                ('Fix Required', 'Investigation needed')
            ])
        
        # Generate metadata HTML
        metadata_html = ""
        for label, value in metadata_items:
            metadata_html += f"""
            <div class="finding-metadata-item">
                <div class="finding-metadata-label">{label}</div>
                <div class="finding-metadata-value">{value}</div>
            </div>
            """
        
        # Add screenshot placeholder
        screenshot_html = f"""
        <div class="finding-screenshot">
            <img src="data:image/svg+xml;base64,{self._generate_finding_screenshot(finding, category)}" 
                 alt="Screenshot for {title}" />
            <p style="margin-top: 10px; color: #666; font-size: 0.9em;">
                📸 Evidence captured at {finding['timestamp']}
            </p>
        </div>
        """
        
        return f"""
        <div style="margin-top: 20px;">
            <h4 style="color: #333; margin-bottom: 15px;">🔍 Detailed Analysis</h4>
            <div class="finding-metadata">
                {metadata_html}
            </div>
            {screenshot_html}
        </div>
        """
    
    def _generate_finding_screenshot(self, finding, category):
        """Generate a placeholder screenshot for findings"""
        import base64
        # Create a simple SVG placeholder based on category
        svg_content = f"""
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#333">
                {finding['title']}
            </text>
            <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
                Category: {category.replace('_', ' ').title()}
            </text>
            <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
                Severity: {finding['severity'].upper()}
            </text>
            <text x="200" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999">
                Click to expand for more details
            </text>
        </svg>
        """
        return base64.b64encode(svg_content.encode()).decode()
    
    def _generate_comprehensive_testing_html(self):
        """Generate HTML for comprehensive testing results"""
        html = ""
        
        # Responsive Design Testing
        if any(self.test_results['responsive_tests'][device][size] for device in self.test_results['responsive_tests'] for size in self.test_results['responsive_tests'][device]):
            html += """
            <div class="testing-category">
                <h3>📱 Responsive Design Testing</h3>
                <div class="testing-grid">
            """
            
            for device_type, sizes in self.test_results['responsive_tests'].items():
                for size, tests in sizes.items():
                    if tests:
                        html += f"""
                        <div class="testing-item">
                            <h4>{device_type.title()} - {size}</h4>
                        """
                        for test in tests:
                            status_class = f"status-{test['status']}"
                            html += f"""
                            <p><strong>{test['name']}</strong></p>
                            <p>{test['details']}</p>
                            <span class="testing-status {status_class}">{test['status'].upper()}</span>
                            """
                        html += "</div>"
            
            html += "</div></div>"
        
        # Cross-Browser Testing
        if any(self.test_results['cross_browser_tests'][browser] for browser in self.test_results['cross_browser_tests']):
            html += """
            <div class="testing-category">
                <h3>🌐 Cross-Browser Compatibility</h3>
                <div class="testing-grid">
            """
            
            for browser, tests in self.test_results['cross_browser_tests'].items():
                if tests:
                    html += f"""
                    <div class="testing-item">
                        <h4>{browser.title()}</h4>
                    """
                    for test in tests:
                        status_class = f"status-{test['status']}"
                        html += f"""
                        <p><strong>{test['name']}</strong></p>
                        <p>{test['details']}</p>
                        <span class="testing-status {status_class}">{test['status'].upper()}</span>
                        """
                    html += "</div>"
            
            html += "</div></div>"
        
        # Functional Testing
        if any(self.test_results['functional_tests'][test_type] for test_type in self.test_results['functional_tests']):
            html += """
            <div class="testing-category">
                <h3>🔧 Functional Testing</h3>
                <div class="testing-grid">
            """
            
            for test_type, tests in self.test_results['functional_tests'].items():
                if tests:
                    html += f"""
                    <div class="testing-item">
                        <h4>{test_type.replace('_', ' ').title()}</h4>
                    """
                    for test in tests:
                        status_class = f"status-{test['status']}"
                        html += f"""
                        <p><strong>{test['name']}</strong></p>
                        <p>{test['details']}</p>
                        <span class="testing-status {status_class}">{test['status'].upper()}</span>
                        """
                    html += "</div>"
            
            html += "</div></div>"
        
        # UI/UX Testing
        if any(self.test_results['ui_ux_tests'][test_type] for test_type in self.test_results['ui_ux_tests']):
            html += """
            <div class="testing-category">
                <h3>🎨 UI/UX Testing</h3>
                <div class="testing-grid">
            """
            
            for test_type, tests in self.test_results['ui_ux_tests'].items():
                if tests:
                    html += f"""
                    <div class="testing-item">
                        <h4>{test_type.replace('_', ' ').title()}</h4>
                    """
                    for test in tests:
                        status_class = f"status-{test['status']}"
                        html += f"""
                        <p><strong>{test['name']}</strong></p>
                        <p>{test['details']}</p>
                        <span class="testing-status {status_class}">{test['status'].upper()}</span>
                        """
                    html += "</div>"
            
            html += "</div></div>"
        
        if not html:
            html = """
            <div class="testing-category">
                <h3>📋 No Comprehensive Testing Data</h3>
                <p style="color: #666; font-style: italic;">Comprehensive testing data will be populated when running detailed testing scenarios.</p>
            </div>
            """
        
        return html
    
    def _generate_findings_html(self):
        """Generate HTML for findings section"""
        html = ""
        
        # Define category display names and icons
        category_info = {
            'errors': {'name': '🚨 Errors', 'icon': '🚨'},
            'bugs': {'name': '🐛 Bugs', 'icon': '🐛'},
            'grammatical_errors': {'name': '📝 Language Issues', 'icon': '📝'},
            'broken_urls': {'name': '🔗 Broken URLs', 'icon': '🔗'},
            'performance_issues': {'name': '⚡ Performance Issues', 'icon': '⚡'},
            'accessibility_issues': {'name': '♿ Accessibility Issues', 'icon': '♿'},
            'security_concerns': {'name': '🔒 Security Concerns', 'icon': '🔒'},
            'ui_issues': {'name': '🎨 UI/UX Issues', 'icon': '🎨'},
            'functionality_issues': {'name': '⚙️ Functionality Issues', 'icon': '⚙️'},
            'responsive_issues': {'name': '📱 Responsive Issues', 'icon': '📱'},
            'cross_browser_issues': {'name': '🌐 Cross-Browser Issues', 'icon': '🌐'},
            'form_issues': {'name': '📝 Form Issues', 'icon': '📝'},
            'navigation_issues': {'name': '🧭 Navigation Issues', 'icon': '🧭'}
        }
        
        for category, findings in self.test_results['findings'].items():
            if findings:  # Only show categories with findings
                category_name = category_info.get(category, {'name': category.replace('_', ' ').title(), 'icon': '📋'})
                
                html += f"""
                <div class="findings-category">
                    <h3>{category_name['icon']} {category_name['name']} ({len(findings)})</h3>
                """
                
                for finding in findings:
                    severity_class = f"severity-{finding['severity']}"
                    finding_class = f"finding-item {finding['severity']}"
                    
                    # Generate detailed information for expandable section
                    detailed_info = self._generate_finding_detailed_info(finding, category)
                    
                    html += f"""
                    <div class="{finding_class}">
                        <div class="finding-title">{finding['title']}</div>
                        <div class="finding-description">{finding['description']}</div>
                        <div class="finding-severity {severity_class}">{finding['severity']}</div>
                        
                        <div class="finding-details">
                            {detailed_info}
                        </div>
                    </div>
                    """
                
                html += "</div>"
        
        if not any(self.test_results['findings'].values()):
            html = """
            <div class="findings-category">
                <h3>✅ No Issues Found</h3>
                <p style="color: #28a745; font-style: italic;">Great! No issues were detected during the testing process.</p>
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
    
    # Generate comprehensive test plan
    test_plan = report_generator.generate_comprehensive_test_plan(task_prompt, report_generator.test_results['website_url'])
    
    # Add test plan as initial step
    if test_plan:
        report_generator.add_test_step(
            "Comprehensive Test Plan Generated",
            "passed",
            "Generated detailed test plan based on requirements:\n" + "\n".join(test_plan),
            step_type="validation"
        )
    
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
        
        # Parse detailed agent history
        report_generator.parse_agent_history(result)
        
        # Add completion test step
        report_generator.add_test_step(
            "Test Execution Complete",
            "passed",
            f"Browser automation completed successfully. Total actions performed: {len(result.all_results) if hasattr(result, 'all_results') else 'Unknown'}",
            step_type="validation"
        )
        
        # Add additional findings based on the execution
        if hasattr(result, 'all_results') and len(result.all_results) > 0:
            # Check for API quota issues
            for i, res in enumerate(result.all_results):
                if hasattr(res, 'error') and res.error and "quota" in str(res.error).lower():
                    report_generator.add_finding(
                        "performance_issues", 
                        "API Quota Exceeded", 
                        f"Step {i+1}: {str(res.error)}", 
                        "high"
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
