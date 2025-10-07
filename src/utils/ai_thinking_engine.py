"""
🤖 Fagun Browser Automation Testing Agent - AI Thinking Engine
==============================================================

Advanced AI-powered decision making and adaptive testing intelligence.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import random

from playwright.async_api import Page, Locator
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

@dataclass
class ThinkingStep:
    """Represents a step in the AI thinking process."""
    step_number: int
    thought: str
    action: str
    reasoning: str
    confidence: float
    timestamp: datetime

@dataclass
class TestStrategy:
    """Represents a testing strategy determined by AI."""
    approach: str
    priority_order: List[str]
    focus_areas: List[str]
    risk_assessment: Dict[str, float]
    estimated_duration: int  # minutes
    reasoning: str

class AIThinkingEngine:
    """Advanced AI thinking engine for intelligent testing decisions."""
    
    def __init__(self, llm: BaseChatModel, page: Page):
        self.llm = llm
        self.page = page
        self.thinking_history: List[ThinkingStep] = []
        self.context_memory: Dict[str, Any] = {}
        self.learning_patterns: Dict[str, List[Any]] = {}
        
    async def analyze_page_intelligence(self) -> Dict[str, Any]:
        """Perform intelligent analysis of the current page."""
        logger.info("🧠 Starting intelligent page analysis...")
        
        analysis = {
            "page_type": await self._determine_page_type(),
            "form_complexity": await self._assess_form_complexity(),
            "security_indicators": await self._detect_security_indicators(),
            "user_flow_analysis": await self._analyze_user_flow(),
            "potential_issues": await self._identify_potential_issues(),
            "testing_opportunities": await self._identify_testing_opportunities()
        }
        
        logger.info(f"✅ Page analysis complete: {analysis['page_type']} page with {analysis['form_complexity']} complexity")
        return analysis

    async def _determine_page_type(self) -> str:
        """Determine the type of page (login, registration, checkout, etc.)."""
        try:
            page_content = await self.page.content()
            page_text = page_content.lower()
            
            # Check for specific page indicators
            if any(keyword in page_text for keyword in ["login", "sign in", "log in", "authenticate"]):
                return "login"
            elif any(keyword in page_text for keyword in ["register", "sign up", "create account", "join"]):
                return "registration"
            elif any(keyword in page_text for keyword in ["checkout", "payment", "billing", "purchase"]):
                return "checkout"
            elif any(keyword in page_text for keyword in ["contact", "message", "inquiry", "support"]):
                return "contact"
            elif any(keyword in page_text for keyword in ["search", "find", "look for"]):
                return "search"
            elif any(keyword in page_text for keyword in ["profile", "account", "settings", "preferences"]):
                return "profile"
            else:
                return "general"
                
        except Exception as e:
            logger.error(f"Error determining page type: {e}")
            return "unknown"

    async def _assess_form_complexity(self) -> str:
        """Assess the complexity of forms on the page."""
        try:
            form_count = await self.page.locator("form").count()
            input_count = await self.page.locator("input").count()
            textarea_count = await self.page.locator("textarea").count()
            select_count = await self.page.locator("select").count()
            
            total_fields = input_count + textarea_count + select_count
            
            if total_fields == 0:
                return "none"
            elif total_fields <= 3:
                return "simple"
            elif total_fields <= 7:
                return "moderate"
            elif total_fields <= 15:
                return "complex"
            else:
                return "very_complex"
                
        except Exception as e:
            logger.error(f"Error assessing form complexity: {e}")
            return "unknown"

    async def _detect_security_indicators(self) -> List[str]:
        """Detect security-related indicators on the page."""
        security_indicators = []
        
        try:
            page_content = await self.page.content()
            
            # Check for security-related attributes
            if 'data-security' in page_content:
                security_indicators.append("custom_security_attributes")
            
            if 'csrf' in page_content.lower():
                security_indicators.append("csrf_protection")
            
            if 'captcha' in page_content.lower():
                security_indicators.append("captcha_protection")
            
            if 'recaptcha' in page_content.lower():
                security_indicators.append("recaptcha_protection")
            
            # Check for HTTPS
            if self.page.url.startswith('https://'):
                security_indicators.append("https_enabled")
            
            # Check for security headers (would need to check response headers)
            security_indicators.append("basic_web_security")
            
        except Exception as e:
            logger.error(f"Error detecting security indicators: {e}")
        
        return security_indicators

    async def _analyze_user_flow(self) -> Dict[str, Any]:
        """Analyze the user flow and navigation patterns."""
        try:
            # Find navigation elements
            nav_links = await self.page.locator("nav a, .navigation a, .menu a").count()
            buttons = await self.page.locator("button").count()
            forms = await self.page.locator("form").count()
            
            # Analyze form submission patterns
            submit_buttons = await self.page.locator("input[type='submit'], button[type='submit']").count()
            
            return {
                "navigation_links": nav_links,
                "interactive_buttons": buttons,
                "forms": forms,
                "submit_buttons": submit_buttons,
                "user_journey_complexity": "high" if nav_links > 10 or forms > 3 else "medium" if nav_links > 5 or forms > 1 else "low"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user flow: {e}")
            return {"error": str(e)}

    async def _identify_potential_issues(self) -> List[str]:
        """Identify potential issues or vulnerabilities."""
        issues = []
        
        try:
            page_content = await self.page.content()
            
            # Check for common issues
            if 'password' in page_content.lower() and 'type="password"' not in page_content:
                issues.append("password_field_not_secured")
            
            if 'email' in page_content.lower() and 'type="email"' not in page_content:
                issues.append("email_field_not_typed")
            
            if 'required' not in page_content and 'form' in page_content.lower():
                issues.append("missing_required_validation")
            
            if 'onclick' in page_content.lower():
                issues.append("inline_javascript_detected")
            
            if 'http://' in page_content and 'https://' in page_content:
                issues.append("mixed_content_detected")
                
        except Exception as e:
            logger.error(f"Error identifying potential issues: {e}")
        
        return issues

    async def _identify_testing_opportunities(self) -> List[str]:
        """Identify specific testing opportunities."""
        opportunities = []
        
        try:
            # Check for different types of inputs
            input_types = await self.page.locator("input[type]").all()
            type_set = set()
            
            for input_elem in input_types:
                input_type = await input_elem.get_attribute("type")
                if input_type:
                    type_set.add(input_type)
            
            if "email" in type_set:
                opportunities.append("email_validation_testing")
            
            if "password" in type_set:
                opportunities.append("password_security_testing")
            
            if "number" in type_set:
                opportunities.append("numeric_input_testing")
            
            if "date" in type_set:
                opportunities.append("date_validation_testing")
            
            if "file" in type_set:
                opportunities.append("file_upload_testing")
            
            # Check for forms
            if await self.page.locator("form").count() > 0:
                opportunities.append("form_submission_testing")
                opportunities.append("cross_field_validation_testing")
            
            # Check for dynamic content
            if await self.page.locator("[data-*]").count() > 0:
                opportunities.append("dynamic_content_testing")
            
        except Exception as e:
            logger.error(f"Error identifying testing opportunities: {e}")
        
        return opportunities

    async def generate_testing_strategy(self, page_analysis: Dict[str, Any]) -> TestStrategy:
        """Generate an intelligent testing strategy based on page analysis."""
        logger.info("🎯 Generating intelligent testing strategy...")
        
        # Use AI to determine the best testing approach
        strategy_prompt = f"""
        Based on the following page analysis, generate a comprehensive testing strategy:
        
        Page Type: {page_analysis.get('page_type', 'unknown')}
        Form Complexity: {page_analysis.get('form_complexity', 'unknown')}
        Security Indicators: {page_analysis.get('security_indicators', [])}
        Potential Issues: {page_analysis.get('potential_issues', [])}
        Testing Opportunities: {page_analysis.get('testing_opportunities', [])}
        
        Please provide a JSON response with:
        1. approach: The overall testing approach (comprehensive, focused, security-focused, etc.)
        2. priority_order: List of testing priorities in order
        3. focus_areas: Specific areas to focus testing on
        4. risk_assessment: Risk levels for different areas (high, medium, low)
        5. estimated_duration: Estimated testing duration in minutes
        6. reasoning: Explanation of the strategy
        
        Focus on:
        - Form validation testing (valid, invalid, edge cases)
        - Security testing (SQL injection, XSS, CSRF)
        - User experience testing
        - Cross-browser compatibility
        - Performance testing
        """
        
        try:
            messages = [
                SystemMessage(content="You are an expert QA engineer specializing in web application testing. Provide detailed, actionable testing strategies."),
                HumanMessage(content=strategy_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            strategy_data = json.loads(response.content)
            
            strategy = TestStrategy(
                approach=strategy_data.get("approach", "comprehensive"),
                priority_order=strategy_data.get("priority_order", []),
                focus_areas=strategy_data.get("focus_areas", []),
                risk_assessment=strategy_data.get("risk_assessment", {}),
                estimated_duration=strategy_data.get("estimated_duration", 30),
                reasoning=strategy_data.get("reasoning", "AI-generated strategy")
            )
            
            logger.info(f"✅ Testing strategy generated: {strategy.approach} approach")
            return strategy
            
        except Exception as e:
            logger.error(f"Error generating testing strategy: {e}")
            # Fallback strategy
            return TestStrategy(
                approach="comprehensive",
                priority_order=["form_validation", "security_testing", "user_experience"],
                focus_areas=["input_validation", "authentication", "data_integrity"],
                risk_assessment={"security": 0.8, "validation": 0.6, "ux": 0.4},
                estimated_duration=30,
                reasoning="Fallback strategy due to AI error"
            )

    async def think_through_scenario(self, scenario: str, context: Dict[str, Any]) -> List[ThinkingStep]:
        """Think through a specific testing scenario step by step."""
        logger.info(f"🤔 Thinking through scenario: {scenario}")
        
        thinking_prompt = f"""
        As an expert QA engineer, think through this testing scenario step by step:
        
        Scenario: {scenario}
        Context: {json.dumps(context, indent=2)}
        
        Provide your thinking process as a JSON array of steps, where each step has:
        - step_number: Sequential number
        - thought: What you're thinking about
        - action: What action you would take
        - reasoning: Why you would take this action
        - confidence: Confidence level (0.0 to 1.0)
        
        Consider:
        1. What could go wrong?
        2. What edge cases should be tested?
        3. What security implications exist?
        4. How can we ensure comprehensive coverage?
        5. What are the user experience implications?
        """
        
        try:
            messages = [
                SystemMessage(content="You are an expert QA engineer. Think through testing scenarios systematically and provide detailed reasoning."),
                HumanMessage(content=thinking_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            thinking_data = json.loads(response.content)
            
            thinking_steps = []
            for i, step_data in enumerate(thinking_data, 1):
                step = ThinkingStep(
                    step_number=i,
                    thought=step_data.get("thought", ""),
                    action=step_data.get("action", ""),
                    reasoning=step_data.get("reasoning", ""),
                    confidence=step_data.get("confidence", 0.5),
                    timestamp=datetime.now()
                )
                thinking_steps.append(step)
            
            self.thinking_history.extend(thinking_steps)
            logger.info(f"✅ Generated {len(thinking_steps)} thinking steps")
            return thinking_steps
            
        except Exception as e:
            logger.error(f"Error thinking through scenario: {e}")
            return []

    async def adapt_testing_approach(self, previous_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Adapt the testing approach based on previous results."""
        logger.info("🔄 Adapting testing approach based on previous results...")
        
        if not previous_results:
            return {"adaptation": "no_previous_data", "recommendations": []}
        
        # Analyze failure patterns
        failures = [r for r in previous_results if not r.get("success", True)]
        success_rate = (len(previous_results) - len(failures)) / len(previous_results)
        
        adaptations = {
            "success_rate": success_rate,
            "adaptations": [],
            "recommendations": []
        }
        
        if success_rate < 0.5:
            adaptations["adaptations"].append("increase_test_coverage")
            adaptations["recommendations"].append("Focus on high-priority test cases first")
        
        # Analyze specific failure types
        validation_failures = [r for r in failures if "validation" in r.get("scenario_name", "").lower()]
        if validation_failures:
            adaptations["adaptations"].append("enhance_validation_testing")
            adaptations["recommendations"].append("Implement more robust validation testing")
        
        security_failures = [r for r in failures if any(x in r.get("scenario_name", "").lower() for x in ["sql", "xss", "injection"])]
        if security_failures:
            adaptations["adaptations"].append("strengthen_security_testing")
            adaptations["recommendations"].append("Focus on security vulnerability testing")
        
        logger.info(f"✅ Testing approach adapted: {len(adaptations['adaptations'])} adaptations")
        return adaptations

    async def learn_from_results(self, test_results: List[Dict[str, Any]]) -> None:
        """Learn from test results to improve future testing."""
        logger.info("📚 Learning from test results...")
        
        for result in test_results:
            scenario_type = result.get("scenario_name", "").split(" - ")[0]
            
            if scenario_type not in self.learning_patterns:
                self.learning_patterns[scenario_type] = []
            
            self.learning_patterns[scenario_type].append({
                "success": result.get("success", False),
                "actual_result": result.get("actual_result", ""),
                "timestamp": datetime.now().isoformat()
            })
        
        # Update context memory with learned patterns
        self.context_memory["learning_patterns"] = self.learning_patterns
        self.context_memory["last_learning_update"] = datetime.now().isoformat()
        
        logger.info(f"✅ Learned from {len(test_results)} test results")

    def get_thinking_summary(self) -> Dict[str, Any]:
        """Get a summary of the AI thinking process."""
        if not self.thinking_history:
            return {"message": "No thinking history available"}
        
        total_steps = len(self.thinking_history)
        avg_confidence = sum(step.confidence for step in self.thinking_history) / total_steps
        
        return {
            "total_thinking_steps": total_steps,
            "average_confidence": round(avg_confidence, 2),
            "thinking_areas": list(set(step.action.split()[0] for step in self.thinking_history if step.action)),
            "learning_patterns": len(self.learning_patterns),
            "context_memory_size": len(self.context_memory)
        }
