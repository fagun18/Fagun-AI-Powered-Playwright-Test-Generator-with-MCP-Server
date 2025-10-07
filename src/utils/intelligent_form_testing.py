"""
🤖 Fagun Browser Automation Testing Agent - Intelligent Form Testing
====================================================================

Advanced AI-powered form testing with comprehensive scenario coverage.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import logging
import random
import string
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import json

from playwright.async_api import Page, Locator, Error as PlaywrightError
from langchain_core.language_models.chat_models import BaseChatModel

from src.utils.advanced_error_handler import AdvancedErrorHandler, DetailedError

logger = logging.getLogger(__name__)

@dataclass
class FormField:
    """Represents a form field with its properties and testing data."""
    element: Locator
    field_type: str
    name: str
    placeholder: str
    required: bool
    validation_pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    options: List[str] = None

@dataclass
class TestScenario:
    """Represents a test scenario with input data and expected behavior."""
    name: str
    data: Dict[str, Any]
    expected_result: str
    description: str
    priority: int = 1  # 1=high, 2=medium, 3=low

@dataclass
class TestResult:
    """Represents the result of a test scenario."""
    scenario: TestScenario
    success: bool
    actual_result: str
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None
    timestamp: datetime = None

class IntelligentFormTester:
    """Advanced AI-powered form testing engine."""
    
    def __init__(self, llm: BaseChatModel, page: Page):
        self.llm = llm
        self.page = page
        self.test_results: List[TestResult] = []
        self.form_fields: List[FormField] = []
        self.error_handler = AdvancedErrorHandler(page)
        self.testing_stats = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "skipped_tests": 0,
            "error_tests": 0
        }
        
        # Test data generators
        self.valid_emails = [
            "test@example.com",
            "user@domain.org",
            "admin@company.net",
            "support@website.com"
        ]
        
        self.invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..name@domain.com",
            "user@domain",
            "user name@domain.com",
            "user@domain..com"
        ]
        
        self.valid_passwords = [
            "Password123!",
            "SecurePass456@",
            "MyPassword789#",
            "TestPass2024$"
        ]
        
        self.invalid_passwords = [
            "",  # Empty
            "123",  # Too short
            "password",  # No numbers/special chars
            "PASSWORD",  # No lowercase
            "Password",  # No numbers/special chars
            "a" * 1000,  # Too long
            "pass word",  # Contains space
            "pass\tword",  # Contains tab
            "pass\nword"  # Contains newline
        ]
        
        self.edge_case_data = {
            "sql_injection": [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "admin'--",
                "' UNION SELECT * FROM users --"
            ],
            "xss_attempts": [
                "<script>alert('XSS')</script>",
                "javascript:alert('XSS')",
                "<img src=x onerror=alert('XSS')>",
                "';alert('XSS');//"
            ],
            "special_characters": [
                "!@#$%^&*()_+-=[]{}|;':\",./<>?",
                "测试用户",
                "مستخدم_اختبار",
                "тестовый_пользователь"
            ],
            "boundary_values": [
                "a" * 1,  # Minimum length
                "a" * 255,  # Maximum typical length
                "a" * 1000,  # Very long
                " " * 10,  # Only spaces
                "\t\n\r" * 5  # Control characters
            ]
        }

    async def discover_form_fields(self) -> List[FormField]:
        """Intelligently discover and analyze form fields on the page."""
        logger.info("🔍 Starting intelligent form field discovery...")
        
        form_fields = []
        
        # Find all input fields
        inputs = await self.page.locator("input").all()
        
        for input_elem in inputs:
            try:
                field_type = await input_elem.get_attribute("type") or "text"
                name = await input_elem.get_attribute("name") or ""
                placeholder = await input_elem.get_attribute("placeholder") or ""
                required = await input_elem.get_attribute("required") is not None
                
                # Get validation attributes
                pattern = await input_elem.get_attribute("pattern")
                min_length = await input_elem.get_attribute("minlength")
                max_length = await input_elem.get_attribute("maxlength")
                
                # Convert to appropriate types
                min_length = int(min_length) if min_length else None
                max_length = int(max_length) if max_length else None
                
                # Get select options if it's a select field
                options = []
                if field_type == "select-one" or field_type == "select-multiple":
                    option_elements = await input_elem.locator("option").all()
                    for opt in option_elements:
                        value = await opt.get_attribute("value")
                        text = await opt.text_content()
                        if value:
                            options.append(value)
                        elif text:
                            options.append(text.strip())
                
                field = FormField(
                    element=input_elem,
                    field_type=field_type,
                    name=name,
                    placeholder=placeholder,
                    required=required,
                    validation_pattern=pattern,
                    min_length=min_length,
                    max_length=max_length,
                    options=options if options else None
                )
                
                form_fields.append(field)
                logger.info(f"📝 Discovered field: {field_type} - {name} ({placeholder})")
                
            except Exception as e:
                # Use advanced error handler for detailed error information
                detailed_error = await self.error_handler.handle_action_error(
                    error=e,
                    action="discover_form_field",
                    element_index=len(form_fields),
                    element_selector="input",
                    input_value=None
                )
                logger.warning(f"⚠️ Error analyzing input field: {detailed_error.suggested_fix}")
                continue
        
        # Find textarea fields
        textareas = await self.page.locator("textarea").all()
        for textarea in textareas:
            try:
                name = await textarea.get_attribute("name") or ""
                placeholder = await textarea.get_attribute("placeholder") or ""
                required = await textarea.get_attribute("required") is not None
                
                field = FormField(
                    element=textarea,
                    field_type="textarea",
                    name=name,
                    placeholder=placeholder,
                    required=required
                )
                
                form_fields.append(field)
                logger.info(f"📝 Discovered textarea: {name} ({placeholder})")
                
            except Exception as e:
                logger.warning(f"⚠️ Error analyzing textarea: {e}")
                continue

        # Find select fields
        selects = await self.page.locator("select").all()
        for select in selects:
            try:
                name = await select.get_attribute("name") or ""
                placeholder = await select.get_attribute("aria-label") or ""
                required = await select.get_attribute("required") is not None

                options: List[str] = []
                try:
                    option_elements = await select.locator("option").all()
                    for opt in option_elements:
                        value = await opt.get_attribute("value")
                        text = await opt.text_content()
                        if value:
                            options.append(value)
                        elif text:
                            options.append(text.strip())
                except Exception as e:
                    logger.debug(f"Failed to read select options: {e}")

                field = FormField(
                    element=select,
                    field_type="select",
                    name=name,
                    placeholder=placeholder,
                    required=required,
                    options=options if options else None
                )

                form_fields.append(field)
                logger.info(f"📝 Discovered select: {name} (options={len(options)})")

            except Exception as e:
                logger.warning(f"⚠️ Error analyzing select: {e}")
                continue
        
        self.form_fields = form_fields
        logger.info(f"✅ Form discovery complete: {len(form_fields)} fields found")
        return form_fields

    async def generate_test_scenarios(self) -> List[TestScenario]:
        """Generate comprehensive test scenarios based on discovered fields."""
        logger.info("🧠 Generating intelligent test scenarios...")
        
        scenarios = []
        
        for field in self.form_fields:
            field_scenarios = await self._generate_field_scenarios(field)
            scenarios.extend(field_scenarios)
        
        # Add cross-field validation scenarios
        cross_field_scenarios = await self._generate_cross_field_scenarios()
        scenarios.extend(cross_field_scenarios)
        
        # Add security testing scenarios
        security_scenarios = await self._generate_security_scenarios()
        scenarios.extend(security_scenarios)
        
        logger.info(f"✅ Generated {len(scenarios)} test scenarios")
        return scenarios

    async def _generate_field_scenarios(self, field: FormField) -> List[TestScenario]:
        """Generate test scenarios for a specific field."""
        scenarios = []
        
        # Determine appropriate test data based on field type
        if field.field_type in ["email", "text"] and "email" in field.name.lower():
            # Email field scenarios
            scenarios.extend([
                TestScenario(
                    name=f"Valid Email - {field.name}",
                    data={field.name: random.choice(self.valid_emails)},
                    expected_result="success",
                    description="Test with valid email format",
                    priority=1
                ),
                TestScenario(
                    name=f"Invalid Email - {field.name}",
                    data={field.name: random.choice(self.invalid_emails)},
                    expected_result="validation_error",
                    description="Test with invalid email format",
                    priority=1
                ),
                TestScenario(
                    name=f"Empty Email - {field.name}",
                    data={field.name: ""},
                    expected_result="required_error" if field.required else "success",
                    description="Test with empty email field",
                    priority=1
                )
            ])
            
        elif field.field_type == "password":
            # Password field scenarios
            scenarios.extend([
                TestScenario(
                    name=f"Valid Password - {field.name}",
                    data={field.name: random.choice(self.valid_passwords)},
                    expected_result="success",
                    description="Test with valid password",
                    priority=1
                ),
                TestScenario(
                    name=f"Invalid Password - {field.name}",
                    data={field.name: random.choice(self.invalid_passwords)},
                    expected_result="validation_error",
                    description="Test with invalid password",
                    priority=1
                ),
                TestScenario(
                    name=f"Empty Password - {field.name}",
                    data={field.name: ""},
                    expected_result="required_error" if field.required else "success",
                    description="Test with empty password field",
                    priority=1
                )
            ])
            
        elif field.field_type in ["text", "textarea"]:
            # General text field scenarios
            scenarios.extend([
                TestScenario(
                    name=f"Valid Text - {field.name}",
                    data={field.name: "Valid Test Data"},
                    expected_result="success",
                    description="Test with valid text input",
                    priority=2
                ),
                TestScenario(
                    name=f"Empty Text - {field.name}",
                    data={field.name: ""},
                    expected_result="required_error" if field.required else "success",
                    description="Test with empty text field",
                    priority=1
                ),
                TestScenario(
                    name=f"Special Characters - {field.name}",
                    data={field.name: random.choice(self.edge_case_data["special_characters"])},
                    expected_result="validation_error",
                    description="Test with special characters",
                    priority=2
                )
            ])

            # i18n, emoji, RTL, whitespace
            scenarios.extend([
                TestScenario(
                    name=f"Unicode i18n - {field.name}",
                    data={field.name: "测试 – تجربة – тест – परीक्षण"},
                    expected_result="success",
                    description="International characters input",
                    priority=2
                ),
                TestScenario(
                    name=f"Emoji Input - {field.name}",
                    data={field.name: "😀🔥✨🚀"},
                    expected_result="success",
                    description="Emoji characters",
                    priority=3
                ),
                TestScenario(
                    name=f"RTL Text - {field.name}",
                    data={field.name: "مرحبا بالعالم"},
                    expected_result="success",
                    description="Right-to-left language",
                    priority=3
                ),
                TestScenario(
                    name=f"Whitespace Only - {field.name}",
                    data={field.name: "     "},
                    expected_result="validation_error" if field.required else "success",
                    description="Spaces only",
                    priority=2
                )
            ])

        elif field.field_type in ["number"]:
            scenarios.extend([
                TestScenario(
                    name=f"Valid Number - {field.name}",
                    data={field.name: "123"},
                    expected_result="success",
                    description="Valid numeric input",
                    priority=2
                ),
                TestScenario(
                    name=f"Negative Number - {field.name}",
                    data={field.name: "-5"},
                    expected_result="validation_error",
                    description="Negative value",
                    priority=2
                ),
                TestScenario(
                    name=f"Non-numeric - {field.name}",
                    data={field.name: "abc"},
                    expected_result="validation_error",
                    description="Alphabetic in number field",
                    priority=1
                )
            ])

        elif field.field_type in ["url"]:
            scenarios.extend([
                TestScenario(
                    name=f"Valid URL - {field.name}",
                    data={field.name: "https://example.com"},
                    expected_result="success",
                    description="Valid URL",
                    priority=2
                ),
                TestScenario(
                    name=f"Invalid URL - {field.name}",
                    data={field.name: "htp:/bad"},
                    expected_result="validation_error",
                    description="Malformed URL",
                    priority=1
                )
            ])

        elif field.field_type in ["tel"]:
            scenarios.extend([
                TestScenario(
                    name=f"Valid Tel - {field.name}",
                    data={field.name: "+1-202-555-0188"},
                    expected_result="success",
                    description="Valid phone",
                    priority=3
                ),
                TestScenario(
                    name=f"Invalid Tel - {field.name}",
                    data={field.name: "abcd-123"},
                    expected_result="validation_error",
                    description="Invalid phone",
                    priority=2
                )
            ])

        elif field.field_type in ["date", "time", "datetime-local", "month", "week"]:
            scenarios.extend([
                TestScenario(
                    name=f"Valid {field.field_type} - {field.name}",
                    data={field.name: "2025-01-15" if field.field_type=="date" else ("12:34" if field.field_type=="time" else "2025-01-15T12:34")},
                    expected_result="success",
                    description="Valid date/time",
                    priority=3
                ),
                TestScenario(
                    name=f"Invalid {field.field_type} - {field.name}",
                    data={field.name: "invalid"},
                    expected_result="validation_error",
                    description="Invalid date/time format",
                    priority=2
                )
            ])

        elif field.field_type in ["checkbox"]:
            scenarios.extend([
                TestScenario(
                    name=f"Check Checkbox - {field.name}",
                    data={field.name: True},
                    expected_result="success",
                    description="Toggle on",
                    priority=3
                ),
                TestScenario(
                    name=f"Uncheck Checkbox - {field.name}",
                    data={field.name: False},
                    expected_result="success",
                    description="Toggle off",
                    priority=3
                )
            ])

        elif field.field_type in ["radio"]:
            scenarios.append(TestScenario(
                name=f"Select Radio - {field.name}",
                data={field.name: True},
                expected_result="success",
                description="Select radio option",
                priority=3
            ))

        elif field.field_type in ["file"]:
            scenarios.extend([
                TestScenario(
                    name=f"Upload Small File - {field.name}",
                    data={field.name: "./tmp/test-small.txt"},
                    expected_result="success",
                    description="Upload small text file",
                    priority=2
                ),
                TestScenario(
                    name=f"Upload Large File - {field.name}",
                    data={field.name: "./tmp/test-large.bin"},
                    expected_result="validation_error",
                    description="Upload large file beyond limit (if enforced)",
                    priority=2
                )
            ])
        
        # Add boundary testing
        if field.min_length or field.max_length:
            scenarios.extend(await self._generate_boundary_scenarios(field))
        
        return scenarios

    async def _generate_boundary_scenarios(self, field: FormField) -> List[TestScenario]:
        """Generate boundary value test scenarios."""
        scenarios = []
        
        if field.min_length:
            scenarios.append(TestScenario(
                name=f"Min Length - {field.name}",
                data={field.name: "a" * (field.min_length - 1)},
                expected_result="validation_error",
                description=f"Test with length below minimum ({field.min_length - 1})",
                priority=1
            ))
            
            scenarios.append(TestScenario(
                name=f"Exact Min Length - {field.name}",
                data={field.name: "a" * field.min_length},
                expected_result="success",
                description=f"Test with exact minimum length ({field.min_length})",
                priority=1
            ))
        
        if field.max_length:
            scenarios.append(TestScenario(
                name=f"Exact Max Length - {field.name}",
                data={field.name: "a" * field.max_length},
                expected_result="success",
                description=f"Test with exact maximum length ({field.max_length})",
                priority=1
            ))
            
            scenarios.append(TestScenario(
                name=f"Exceed Max Length - {field.name}",
                data={field.name: "a" * (field.max_length + 1)},
                expected_result="validation_error",
                description=f"Test with length exceeding maximum ({field.max_length + 1})",
                priority=1
            ))
        
        return scenarios

    async def _generate_cross_field_scenarios(self) -> List[TestScenario]:
        """Generate scenarios that test cross-field validation."""
        scenarios = []
        
        # Find email and password fields
        email_fields = [f for f in self.form_fields if "email" in f.name.lower() and f.field_type in ["email", "text"]]
        password_fields = [f for f in self.form_fields if f.field_type == "password"]
        
        if email_fields and password_fields:
            # Test with matching valid credentials
            scenarios.append(TestScenario(
                name="Valid Login Credentials",
                data={
                    email_fields[0].name: random.choice(self.valid_emails),
                    password_fields[0].name: random.choice(self.valid_passwords)
                },
                expected_result="success",
                description="Test with valid email and password combination",
                priority=1
            ))
            
            # Test with mismatched credentials
            scenarios.append(TestScenario(
                name="Invalid Login Credentials",
                data={
                    email_fields[0].name: random.choice(self.valid_emails),
                    password_fields[0].name: "WrongPassword123!"
                },
                expected_result="authentication_error",
                description="Test with valid email but wrong password",
                priority=1
            ))
        
        return scenarios

    async def _generate_security_scenarios(self) -> List[TestScenario]:
        """Generate security testing scenarios."""
        scenarios = []
        
        for field in self.form_fields:
            if field.field_type in ["text", "email", "password", "textarea"]:
                # SQL Injection tests
                for sql_payload in self.edge_case_data["sql_injection"]:
                    scenarios.append(TestScenario(
                        name=f"SQL Injection - {field.name}",
                        data={field.name: sql_payload},
                        expected_result="security_error",
                        description=f"Test SQL injection protection for {field.name}",
                        priority=1
                    ))
                
                # XSS tests
                for xss_payload in self.edge_case_data["xss_attempts"]:
                    scenarios.append(TestScenario(
                        name=f"XSS Attempt - {field.name}",
                        data={field.name: xss_payload},
                        expected_result="security_error",
                        description=f"Test XSS protection for {field.name}",
                        priority=1
                    ))
        
        return scenarios

    async def execute_test_scenarios(self, scenarios: List[TestScenario]) -> List[TestResult]:
        """Execute all test scenarios and collect results."""
        logger.info(f"🚀 Executing {len(scenarios)} test scenarios...")
        
        results = []
        self.testing_stats["total_tests"] = len(scenarios)
        
        for i, scenario in enumerate(scenarios, 1):
            logger.info(f"📋 Running scenario {i}/{len(scenarios)}: {scenario.name}")
            
            try:
                result = await self._execute_single_scenario(scenario)
                results.append(result)
                
                # Update statistics
                if result.success:
                    self.testing_stats["passed_tests"] += 1
                elif result.error_message:
                    self.testing_stats["error_tests"] += 1
                else:
                    self.testing_stats["failed_tests"] += 1
                
                # Add delay between tests to avoid overwhelming the server
                await asyncio.sleep(1)
                
            except Exception as e:
                # Use advanced error handler for detailed error information
                detailed_error = await self.error_handler.handle_action_error(
                    error=e,
                    action="execute_test_scenario",
                    element_index=None,
                    element_selector=None,
                    input_value=scenario.name
                )
                
                logger.error(f"❌ Error executing scenario {scenario.name}: {detailed_error.suggested_fix}")
                
                # Attempt error recovery
                recovery_success = await self.error_handler.attempt_error_recovery(detailed_error)
                if recovery_success:
                    logger.info(f"🔄 Recovery successful for scenario: {scenario.name}")
                    try:
                        result = await self._execute_single_scenario(scenario)
                        results.append(result)
                        self.testing_stats["passed_tests"] += 1
                        continue
                    except:
                        pass
                
                results.append(TestResult(
                    scenario=scenario,
                    success=False,
                    actual_result="error",
                    error_message=f"{str(e)}\n\nSuggested Fix:\n{detailed_error.suggested_fix}",
                    timestamp=datetime.now()
                ))
                self.testing_stats["error_tests"] += 1
        
        self.test_results = results
        logger.info(f"✅ Test execution complete: {len(results)} results collected")
        logger.info(f"📊 Test Statistics: {self.testing_stats}")
        return results

    async def _execute_single_scenario(self, scenario: TestScenario) -> TestResult:
        """Execute a single test scenario with enhanced error handling."""
        try:
            # Clear all form fields first
            await self._clear_all_fields()
            
            # Fill form with test data
            for field_name, value in scenario.data.items():
                field = next((f for f in self.form_fields if f.name == field_name), None)
                if field:
                    try:
                        await self._set_field_value(field, value)
                        await asyncio.sleep(0.5)  # Small delay for validation
                    except Exception as e:
                        # Handle field filling errors with detailed context
                        detailed_error = await self.error_handler.handle_action_error(
                            error=e,
                            action="fill_field",
                            element_index=None,
                            element_selector=f"[name='{field_name}']",
                            input_value=str(value)
                        )
                        logger.warning(f"⚠️ Error setting field '{field_name}': {detailed_error.suggested_fix}")
                        # Try alternative typing fallback for text-like fields
                        try:
                            await field.element.click()
                            await field.element.type(str(value))
                        except:
                            logger.error(f"❌ Fallback typing failed for '{field_name}'")
            
            # Take screenshot before submission
            screenshot_path = f"./screenshots/test_{scenario.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            try:
                await self.page.screenshot(path=screenshot_path)
            except Exception as e:
                logger.warning(f"⚠️ Failed to take screenshot: {e}")
                screenshot_path = None
            
            # Submit form
            submit_button = await self.page.locator("button[type='submit'], input[type='submit']").first
            if await submit_button.count() > 0:
                try:
                    await submit_button.click()
                    await asyncio.sleep(2)  # Wait for response
                except Exception as e:
                    detailed_error = await self.error_handler.handle_action_error(
                        error=e,
                        action="click_submit",
                        element_index=None,
                        element_selector="button[type='submit'], input[type='submit']",
                        input_value=None
                    )
                    logger.warning(f"⚠️ Error clicking submit button: {detailed_error.suggested_fix}")
            
            # Analyze result
            actual_result = await self._analyze_form_result()
            
            # Determine if test passed
            success = self._evaluate_test_result(scenario, actual_result)
            
            return TestResult(
                scenario=scenario,
                success=success,
                actual_result=actual_result,
                screenshot_path=screenshot_path,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            # Use advanced error handler for detailed error information
            detailed_error = await self.error_handler.handle_action_error(
                error=e,
                action="execute_single_scenario",
                element_index=None,
                element_selector=None,
                input_value=scenario.name
            )
            
            return TestResult(
                scenario=scenario,
                success=False,
                actual_result="error",
                error_message=f"{str(e)}\n\nDetailed Error Information:\n{detailed_error.suggested_fix}",
                timestamp=datetime.now()
            )

    async def _set_field_value(self, field: FormField, value: Any):
        """Set a field's value based on its type, supporting selects, checkboxes, radios, and files."""
        t = (field.field_type or "").lower()
        elem = field.element
        if t in ["text", "email", "password", "url", "tel", "search", "textarea", "number", "date", "time", "datetime-local", "month", "week"]:
            await elem.fill(str(value))
        elif t in ["select", "select-one", "select-multiple"]:
            # Prefer option value; fallback to label
            try:
                await elem.select_option(str(value))
            except Exception:
                # Try by label
                await elem.select_option(label=str(value))
        elif t == "checkbox":
            should_check = bool(value)
            if should_check:
                await elem.check(force=True)
            else:
                await elem.uncheck(force=True)
        elif t == "radio":
            await elem.check(force=True)
        elif t == "file":
            try:
                await elem.set_input_files(str(value))
            except Exception as e:
                raise e
        else:
            # Fallback to typing
            await elem.fill(str(value))

    async def _clear_all_fields(self):
        """Clear all form fields."""
        for field in self.form_fields:
            try:
                await field.element.clear()
            except:
                pass

    async def _analyze_form_result(self) -> str:
        """Analyze the result after form submission."""
        try:
            # Check for success indicators
            success_indicators = [
                "success", "welcome", "dashboard", "profile", "account",
                "logged in", "signed in", "thank you", "confirmation"
            ]
            
            page_content = await self.page.content()
            page_text = page_content.lower()
            
            for indicator in success_indicators:
                if indicator in page_text:
                    return "success"
            
            # Check for error indicators
            error_indicators = [
                "error", "invalid", "incorrect", "failed", "wrong",
                "required", "missing", "not found", "denied", "blocked"
            ]
            
            for indicator in error_indicators:
                if indicator in page_text:
                    return "validation_error"
            
            # Check for security-related responses
            security_indicators = [
                "security", "blocked", "suspicious", "malicious",
                "injection", "script", "xss", "sql"
            ]
            
            for indicator in security_indicators:
                if indicator in page_text:
                    return "security_error"
            
            return "unknown"
            
        except Exception as e:
            logger.error(f"Error analyzing form result: {e}")
            return "error"

    async def run_basic_accessibility_checks(self) -> Dict[str, Any]:
        """Run fast, basic accessibility checks without external dependencies."""
        issues: List[str] = []
        try:
            # Images without alt
            img_without_alt = await self.page.locator("img:not([alt])").count()
            if img_without_alt > 0:
                issues.append(f"{img_without_alt} images missing alt text")

            # Buttons without accessible name
            btns = await self.page.locator("button").all()
            missing_name = 0
            for b in btns[:200]:
                try:
                    name = await b.get_attribute("aria-label")
                    txt = await b.text_content()
                    if not (name and name.strip()) and not (txt and txt.strip()):
                        missing_name += 1
                except Exception:
                    continue
            if missing_name:
                issues.append(f"{missing_name} buttons without accessible name")

            # Inputs missing label
            unlabeled = 0
            inputs = await self.page.locator("input, textarea, select").all()
            for i in inputs[:300]:
                try:
                    id_attr = await i.get_attribute("id")
                    aria = await i.get_attribute("aria-label")
                    if id_attr:
                        has_label = await self.page.locator(f"label[for='{id_attr}']").count() > 0
                    else:
                        has_label = False
                    if not has_label and not (aria and aria.strip()):
                        unlabeled += 1
                except Exception:
                    continue
            if unlabeled:
                issues.append(f"{unlabeled} inputs without label or aria-label")

            # Tabindex anti-patterns
            neg_tab = await self.page.locator("[tabindex='-1']").count()
            if neg_tab:
                issues.append(f"{neg_tab} elements with tabindex='-1'")

            return {
                "issues": issues,
                "passed": len(issues) == 0
            }
        except Exception as e:
            return {"error": str(e)}

    def _evaluate_test_result(self, scenario: TestScenario, actual_result: str) -> bool:
        """Evaluate whether a test scenario passed or failed."""
        if scenario.expected_result == "success":
            return actual_result == "success"
        elif scenario.expected_result == "validation_error":
            return actual_result in ["validation_error", "required_error"]
        elif scenario.expected_result == "security_error":
            return actual_result == "security_error"
        elif scenario.expected_result == "authentication_error":
            return actual_result in ["validation_error", "authentication_error"]
        else:
            return False

    async def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate a comprehensive test report."""
        logger.info("📊 Generating comprehensive test report...")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r.success)
        failed_tests = total_tests - passed_tests
        
        # Categorize results
        by_scenario_type = {}
        by_priority = {1: [], 2: [], 3: []}
        security_tests = []
        validation_tests = []
        
        for result in self.test_results:
            scenario_name = result.scenario.name
            scenario_type = scenario_name.split(" - ")[0] if " - " in scenario_name else "Other"
            
            if scenario_type not in by_scenario_type:
                by_scenario_type[scenario_type] = []
            by_scenario_type[scenario_type].append(result)
            
            by_priority[result.scenario.priority].append(result)
            
            if "SQL Injection" in scenario_name or "XSS" in scenario_name:
                security_tests.append(result)
            else:
                validation_tests.append(result)
        
        # Calculate metrics
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": round(success_rate, 2),
                "test_duration": "N/A",  # Could be calculated if we track start/end times
                "timestamp": datetime.now().isoformat()
            },
            "by_scenario_type": {
                scenario_type: {
                    "total": len(results),
                    "passed": sum(1 for r in results if r.success),
                    "failed": sum(1 for r in results if not r.success)
                }
                for scenario_type, results in by_scenario_type.items()
            },
            "by_priority": {
                f"Priority {priority}": {
                    "total": len(results),
                    "passed": sum(1 for r in results if r.success),
                    "failed": sum(1 for r in results if not r.success)
                }
                for priority, results in by_priority.items() if results
            },
            "security_tests": {
                "total": len(security_tests),
                "passed": sum(1 for r in security_tests if r.success),
                "failed": sum(1 for r in security_tests if not r.success)
            },
            "validation_tests": {
                "total": len(validation_tests),
                "passed": sum(1 for r in validation_tests if r.success),
                "failed": sum(1 for r in validation_tests if not r.success)
            },
            "detailed_results": [
                {
                    "scenario_name": result.scenario.name,
                    "description": result.scenario.description,
                    "priority": result.scenario.priority,
                    "success": result.success,
                    "expected_result": result.scenario.expected_result,
                    "actual_result": result.actual_result,
                    "error_message": result.error_message,
                    "screenshot_path": result.screenshot_path,
                    "timestamp": result.timestamp.isoformat() if result.timestamp else None
                }
                for result in self.test_results
            ],
            "recommendations": self._generate_recommendations()
        }
        
        logger.info(f"✅ Comprehensive report generated: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        return report
    
    def get_detailed_error_report(self) -> Dict[str, Any]:
        """Get detailed error report with comprehensive analysis."""
        error_summary = self.error_handler.get_error_summary()
        
        return {
            "testing_statistics": self.testing_stats,
            "error_analysis": error_summary,
            "form_field_analysis": {
                "total_fields": len(self.form_fields),
                "field_types": {
                    field.field_type: sum(1 for f in self.form_fields if f.field_type == field.field_type)
                    for field in self.form_fields
                },
                "required_fields": sum(1 for field in self.form_fields if field.required),
                "fields_with_validation": sum(1 for field in self.form_fields if field.validation_pattern)
            },
            "test_coverage": {
                "scenarios_executed": len(self.test_results),
                "success_rate": f"{(self.testing_stats['passed_tests'] / max(self.testing_stats['total_tests'], 1) * 100):.2f}%",
                "error_rate": f"{(self.testing_stats['error_tests'] / max(self.testing_stats['total_tests'], 1) * 100):.2f}%"
            },
            "recommendations": self._generate_improvement_recommendations()
        }
    
    def _generate_improvement_recommendations(self) -> List[str]:
        """Generate improvement recommendations based on test results."""
        recommendations = []
        
        if self.testing_stats["error_tests"] > 0:
            recommendations.append("🔧 Consider improving error handling and field validation")
        
        if self.testing_stats["passed_tests"] < self.testing_stats["total_tests"] * 0.8:
            recommendations.append("📈 Review form validation logic and user experience")
        
        if len(self.form_fields) == 0:
            recommendations.append("🔍 No form fields detected - verify page content and selectors")
        
        if self.testing_stats["error_tests"] > self.testing_stats["total_tests"] * 0.3:
            recommendations.append("⚠️ High error rate detected - check page stability and element selectors")
        
        return recommendations

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []
        
        failed_tests = [r for r in self.test_results if not r.success]
        
        if not failed_tests:
            recommendations.append("🎉 All tests passed! The form validation is working correctly.")
            return recommendations
        
        # Analyze failure patterns
        validation_failures = [r for r in failed_tests if "validation" in r.scenario.name.lower()]
        security_failures = [r for r in failed_tests if any(x in r.scenario.name.lower() for x in ["sql", "xss", "injection"])]
        required_failures = [r for r in failed_tests if "empty" in r.scenario.name.lower()]
        
        if validation_failures:
            recommendations.append("⚠️ Some validation tests failed. Review form validation rules and error messages.")
        
        if security_failures:
            recommendations.append("🔒 Security tests failed. Implement proper input sanitization and validation.")
        
        if required_failures:
            recommendations.append("📝 Required field validation needs improvement. Ensure proper error messages for empty required fields.")
        
        # Specific recommendations based on field types
        email_failures = [r for r in failed_tests if "email" in r.scenario.name.lower()]
        if email_failures:
            recommendations.append("📧 Email validation needs improvement. Implement proper email format validation.")
        
        password_failures = [r for r in failed_tests if "password" in r.scenario.name.lower()]
        if password_failures:
            recommendations.append("🔐 Password validation needs improvement. Implement proper password strength requirements.")
        
        return recommendations
