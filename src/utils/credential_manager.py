"""
🤖 Fagun Browser Automation Testing Agent - Credential Manager
==============================================================

Secure credential management and testing system.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import logging
import json
import hashlib
import base64
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import random
import string

from playwright.async_api import Page, Locator

logger = logging.getLogger(__name__)

@dataclass
class CredentialSet:
    """Represents a set of credentials for testing."""
    name: str
    email: str
    password: str
    description: str
    is_valid: bool
    category: str  # valid, invalid, edge_case, security_test
    created_at: datetime

@dataclass
class CredentialTestResult:
    """Result of testing with specific credentials."""
    credential_set: CredentialSet
    success: bool
    response_type: str  # success, validation_error, security_error, etc.
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None
    timestamp: datetime = None

class CredentialManager:
    """Advanced credential management and testing system."""
    
    def __init__(self, page: Page):
        self.page = page
        self.credential_sets: List[CredentialSet] = []
        self.test_results: List[CredentialTestResult] = []
        self.encryption_key = self._generate_encryption_key()
        
        # Initialize with default credential sets
        self._initialize_default_credentials()
    
    def _generate_encryption_key(self) -> str:
        """Generate a simple encryption key for credential storage."""
        return hashlib.sha256(f"fagun_credential_key_{datetime.now().isoformat()}".encode()).hexdigest()[:32]
    
    def _initialize_default_credentials(self):
        """Initialize with default credential sets for testing."""
        default_credentials = [
            # Valid credentials
            CredentialSet(
                name="Valid User 1",
                email="testuser1@example.com",
                password="ValidPass123!",
                description="Standard valid credentials",
                is_valid=True,
                category="valid",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="Valid User 2",
                email="admin@testdomain.org",
                password="AdminPass456@",
                description="Admin valid credentials",
                is_valid=True,
                category="valid",
                created_at=datetime.now()
            ),
            
            # Invalid credentials
            CredentialSet(
                name="Invalid Email",
                email="invalid-email-format",
                password="ValidPass123!",
                description="Invalid email format",
                is_valid=False,
                category="invalid",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="Invalid Password",
                email="test@example.com",
                password="weak",
                description="Weak password",
                is_valid=False,
                category="invalid",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="Empty Credentials",
                email="",
                password="",
                description="Empty email and password",
                is_valid=False,
                category="invalid",
                created_at=datetime.now()
            ),
            
            # Edge case credentials
            CredentialSet(
                name="Special Characters",
                email="test+special@example.com",
                password="Pass@123!@#$%",
                description="Credentials with special characters",
                is_valid=True,
                category="edge_case",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="Long Email",
                email="very.long.email.address.for.testing.purposes@verylongdomainname.com",
                password="ValidPass123!",
                description="Very long email address",
                is_valid=True,
                category="edge_case",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="Unicode Email",
                email="测试@example.com",
                password="ValidPass123!",
                description="Email with Unicode characters",
                is_valid=True,
                category="edge_case",
                created_at=datetime.now()
            ),
            
            # Security test credentials
            CredentialSet(
                name="SQL Injection Email",
                email="admin'; DROP TABLE users; --",
                password="ValidPass123!",
                description="SQL injection attempt in email",
                is_valid=False,
                category="security_test",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="XSS Email",
                email="<script>alert('XSS')</script>@example.com",
                password="ValidPass123!",
                description="XSS attempt in email",
                is_valid=False,
                category="security_test",
                created_at=datetime.now()
            ),
            CredentialSet(
                name="SQL Injection Password",
                email="test@example.com",
                password="'; DROP TABLE users; --",
                description="SQL injection attempt in password",
                is_valid=False,
                category="security_test",
                created_at=datetime.now()
            )
        ]
        
        self.credential_sets.extend(default_credentials)
        logger.info(f"✅ Initialized {len(default_credentials)} default credential sets")

    def add_credential_set(self, name: str, email: str, password: str, 
                          description: str = "", category: str = "custom") -> bool:
        """Add a new credential set."""
        try:
            credential_set = CredentialSet(
                name=name,
                email=email,
                password=password,
                description=description,
                is_valid=self._validate_credentials(email, password),
                category=category,
                created_at=datetime.now()
            )
            
            self.credential_sets.append(credential_set)
            logger.info(f"✅ Added credential set: {name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error adding credential set: {e}")
            return False

    def _validate_credentials(self, email: str, password: str) -> bool:
        """Validate if credentials are in correct format."""
        # Basic email validation
        email_valid = "@" in email and "." in email.split("@")[-1]
        
        # Basic password validation (at least 8 characters)
        password_valid = len(password) >= 8
        
        return email_valid and password_valid

    def get_credentials_by_category(self, category: str) -> List[CredentialSet]:
        """Get credentials by category."""
        return [cred for cred in self.credential_sets if cred.category == category]

    def get_credentials_by_validity(self, is_valid: bool) -> List[CredentialSet]:
        """Get credentials by validity."""
        return [cred for cred in self.credential_sets if cred.is_valid == is_valid]

    async def discover_credential_fields(self) -> Dict[str, Locator]:
        """Discover email and password fields on the page."""
        logger.info("🔍 Discovering credential fields...")
        
        fields = {}
        
        try:
            # Find email fields
            email_selectors = [
                "input[type='email']",
                "input[name*='email']",
                "input[placeholder*='email' i]",
                "input[id*='email']",
                "input[class*='email']"
            ]
            
            for selector in email_selectors:
                elements = await self.page.locator(selector).all()
                if elements:
                    fields["email"] = elements[0]
                    logger.info(f"📧 Found email field: {selector}")
                    break
            
            # Find password fields
            password_selectors = [
                "input[type='password']",
                "input[name*='password']",
                "input[placeholder*='password' i]",
                "input[id*='password']",
                "input[class*='password']"
            ]
            
            for selector in password_selectors:
                elements = await self.page.locator(selector).all()
                if elements:
                    fields["password"] = elements[0]
                    logger.info(f"🔐 Found password field: {selector}")
                    break
            
            # Find username fields (alternative to email)
            if "email" not in fields:
                username_selectors = [
                    "input[name*='username']",
                    "input[name*='user']",
                    "input[placeholder*='username' i]",
                    "input[placeholder*='user' i]",
                    "input[id*='username']",
                    "input[id*='user']"
                ]
                
                for selector in username_selectors:
                    elements = await self.page.locator(selector).all()
                    if elements:
                        fields["username"] = elements[0]
                        logger.info(f"👤 Found username field: {selector}")
                        break
            
            logger.info(f"✅ Field discovery complete: {list(fields.keys())}")
            return fields
            
        except Exception as e:
            logger.error(f"❌ Error discovering credential fields: {e}")
            return {}

    async def test_credentials(self, credential_set: CredentialSet, 
                             fields: Dict[str, Locator]) -> CredentialTestResult:
        """Test a specific credential set."""
        logger.info(f"🧪 Testing credentials: {credential_set.name}")
        
        try:
            # Clear existing fields
            await self._clear_credential_fields(fields)
            
            # Fill email/username field
            if "email" in fields:
                await fields["email"].fill(credential_set.email)
            elif "username" in fields:
                await fields["username"].fill(credential_set.email)  # Use email as username
            
            # Fill password field
            if "password" in fields:
                await fields["password"].fill(credential_set.password)
            
            # Take screenshot before submission
            screenshot_path = f"./screenshots/credential_test_{credential_set.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            await self.page.screenshot(path=screenshot_path)
            
            # Submit form
            await self._submit_form()
            
            # Wait for response
            await asyncio.sleep(2)
            
            # Analyze result
            response_type = await self._analyze_credential_response()
            
            # Determine success
            success = self._evaluate_credential_result(credential_set, response_type)
            
            result = CredentialTestResult(
                credential_set=credential_set,
                success=success,
                response_type=response_type,
                screenshot_path=screenshot_path,
                timestamp=datetime.now()
            )
            
            self.test_results.append(result)
            logger.info(f"✅ Credential test complete: {credential_set.name} - {response_type}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error testing credentials {credential_set.name}: {e}")
            return CredentialTestResult(
                credential_set=credential_set,
                success=False,
                response_type="error",
                error_message=str(e),
                timestamp=datetime.now()
            )

    async def _clear_credential_fields(self, fields: Dict[str, Locator]):
        """Clear all credential fields."""
        for field_name, field in fields.items():
            try:
                await field.clear()
            except:
                pass

    async def _submit_form(self):
        """Submit the form."""
        try:
            # Try different submit button selectors
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button:has-text('Login')",
                "button:has-text('Sign In')",
                "button:has-text('Submit')",
                "form button",
                "form input[type='submit']"
            ]
            
            for selector in submit_selectors:
                submit_btn = await self.page.locator(selector).first
                if await submit_btn.count() > 0:
                    await submit_btn.click()
                    logger.info(f"📤 Form submitted using: {selector}")
                    return
            
            # If no submit button found, try pressing Enter
            await self.page.keyboard.press("Enter")
            logger.info("📤 Form submitted using Enter key")
            
        except Exception as e:
            logger.error(f"❌ Error submitting form: {e}")

    async def _analyze_credential_response(self) -> str:
        """Analyze the response after credential submission."""
        try:
            page_content = await self.page.content()
            page_text = page_content.lower()
            
            # Check for success indicators
            success_indicators = [
                "welcome", "dashboard", "profile", "account", "logged in",
                "signed in", "success", "thank you", "confirmation"
            ]
            
            for indicator in success_indicators:
                if indicator in page_text:
                    return "success"
            
            # Check for validation errors
            validation_indicators = [
                "invalid", "incorrect", "wrong", "error", "failed",
                "required", "missing", "format", "invalid email",
                "invalid password", "password too short"
            ]
            
            for indicator in validation_indicators:
                if indicator in page_text:
                    return "validation_error"
            
            # Check for security-related responses
            security_indicators = [
                "security", "blocked", "suspicious", "malicious",
                "injection", "script", "xss", "sql", "forbidden"
            ]
            
            for indicator in security_indicators:
                if indicator in page_text:
                    return "security_error"
            
            # Check for authentication errors
            auth_indicators = [
                "not found", "user not found", "account not found",
                "login failed", "authentication failed", "access denied"
            ]
            
            for indicator in auth_indicators:
                if indicator in page_text:
                    return "authentication_error"
            
            return "unknown"
            
        except Exception as e:
            logger.error(f"❌ Error analyzing credential response: {e}")
            return "error"

    def _evaluate_credential_result(self, credential_set: CredentialSet, response_type: str) -> bool:
        """Evaluate if the credential test result is as expected."""
        if credential_set.is_valid:
            # Valid credentials should succeed
            return response_type == "success"
        else:
            # Invalid credentials should fail with appropriate error
            return response_type in ["validation_error", "authentication_error", "security_error"]

    async def run_comprehensive_credential_testing(self) -> Dict[str, Any]:
        """Run comprehensive credential testing with all credential sets."""
        logger.info("🚀 Starting comprehensive credential testing...")
        
        # Discover credential fields
        fields = await self.discover_credential_fields()
        
        if not fields:
            logger.warning("⚠️ No credential fields found on the page")
            return {"error": "No credential fields found"}
        
        # Test all credential sets
        for credential_set in self.credential_sets:
            await self.test_credentials(credential_set, fields)
            await asyncio.sleep(1)  # Delay between tests
        
        # Generate comprehensive report
        report = self._generate_credential_report()
        
        logger.info(f"✅ Comprehensive credential testing complete: {len(self.test_results)} tests executed")
        return report

    def _generate_credential_report(self) -> Dict[str, Any]:
        """Generate a comprehensive credential testing report."""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r.success)
        failed_tests = total_tests - passed_tests
        
        # Categorize results
        by_category = {}
        by_validity = {"valid": [], "invalid": []}
        by_response_type = {}
        
        for result in self.test_results:
            category = result.credential_set.category
            validity = "valid" if result.credential_set.is_valid else "invalid"
            response_type = result.response_type
            
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(result)
            
            by_validity[validity].append(result)
            
            if response_type not in by_response_type:
                by_response_type[response_type] = []
            by_response_type[response_type].append(result)
        
        # Calculate success rates
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": round(success_rate, 2),
                "timestamp": datetime.now().isoformat()
            },
            "by_category": {
                category: {
                    "total": len(results),
                    "passed": sum(1 for r in results if r.success),
                    "failed": sum(1 for r in results if not r.success)
                }
                for category, results in by_category.items()
            },
            "by_validity": {
                validity: {
                    "total": len(results),
                    "passed": sum(1 for r in results if r.success),
                    "failed": sum(1 for r in results if not r.success)
                }
                for validity, results in by_validity.items()
            },
            "by_response_type": {
                response_type: {
                    "total": len(results),
                    "passed": sum(1 for r in results if r.success),
                    "failed": sum(1 for r in results if not r.success)
                }
                for response_type, results in by_response_type.items()
            },
            "detailed_results": [
                {
                    "credential_name": result.credential_set.name,
                    "email": result.credential_set.email,
                    "category": result.credential_set.category,
                    "is_valid": result.credential_set.is_valid,
                    "success": result.success,
                    "response_type": result.response_type,
                    "error_message": result.error_message,
                    "screenshot_path": result.screenshot_path,
                    "timestamp": result.timestamp.isoformat() if result.timestamp else None
                }
                for result in self.test_results
            ],
            "recommendations": self._generate_credential_recommendations()
        }
        
        return report

    def _generate_credential_recommendations(self) -> List[str]:
        """Generate recommendations based on credential test results."""
        recommendations = []
        
        if not self.test_results:
            return ["No test results available for recommendations"]
        
        # Analyze results
        valid_creds = [r for r in self.test_results if r.credential_set.is_valid]
        invalid_creds = [r for r in self.test_results if not r.credential_set.is_valid]
        
        # Check if valid credentials are working
        valid_success_rate = sum(1 for r in valid_creds if r.success) / len(valid_creds) if valid_creds else 0
        if valid_success_rate < 0.5:
            recommendations.append("⚠️ Valid credentials are not working properly. Check authentication system.")
        
        # Check if invalid credentials are properly rejected
        invalid_rejection_rate = sum(1 for r in invalid_creds if not r.success) / len(invalid_creds) if invalid_creds else 0
        if invalid_rejection_rate < 0.8:
            recommendations.append("🔒 Invalid credentials are not being properly rejected. Improve validation.")
        
        # Check for security issues
        security_tests = [r for r in self.test_results if r.credential_set.category == "security_test"]
        if security_tests:
            security_success_rate = sum(1 for r in security_tests if r.success) / len(security_tests)
            if security_success_rate > 0.3:
                recommendations.append("🚨 Security tests are passing when they should fail. Implement proper input sanitization.")
        
        # Check response types
        response_types = [r.response_type for r in self.test_results]
        if "unknown" in response_types:
            recommendations.append("❓ Some tests returned unknown responses. Improve error handling and user feedback.")
        
        if not recommendations:
            recommendations.append("✅ All credential tests are working as expected!")
        
        return recommendations

    def export_credentials(self, file_path: str) -> bool:
        """Export credentials to a file (encrypted)."""
        try:
            # Simple encryption (in production, use proper encryption)
            encrypted_data = base64.b64encode(
                json.dumps([{
                    "name": cred.name,
                    "email": cred.email,
                    "password": cred.password,
                    "description": cred.description,
                    "category": cred.category,
                    "created_at": cred.created_at.isoformat()
                } for cred in self.credential_sets]).encode()
            ).decode()
            
            with open(file_path, 'w') as f:
                f.write(encrypted_data)
            
            logger.info(f"✅ Credentials exported to: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error exporting credentials: {e}")
            return False

    def import_credentials(self, file_path: str) -> bool:
        """Import credentials from a file."""
        try:
            with open(file_path, 'r') as f:
                encrypted_data = f.read()
            
            # Simple decryption
            decrypted_data = json.loads(base64.b64decode(encrypted_data).decode())
            
            for cred_data in decrypted_data:
                credential_set = CredentialSet(
                    name=cred_data["name"],
                    email=cred_data["email"],
                    password=cred_data["password"],
                    description=cred_data["description"],
                    is_valid=self._validate_credentials(cred_data["email"], cred_data["password"]),
                    category=cred_data["category"],
                    created_at=datetime.fromisoformat(cred_data["created_at"])
                )
                self.credential_sets.append(credential_set)
            
            logger.info(f"✅ Credentials imported from: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error importing credentials: {e}")
            return False
