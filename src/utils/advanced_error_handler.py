"""
🤖 Fagun Browser Automation Testing Agent - Advanced Error Handler
=================================================================

Advanced error handling, debugging, and intelligent error recovery system.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import logging
import traceback
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from playwright.async_api import Page, Locator, Error as PlaywrightError

logger = logging.getLogger(__name__)

@dataclass
class DetailedError:
    """Detailed error information with context."""
    error_type: str
    error_message: str
    element_info: Dict[str, Any]
    page_context: Dict[str, Any]
    action_context: Dict[str, Any]
    suggested_fix: str
    severity: str  # low, medium, high, critical
    timestamp: datetime
    stack_trace: str

class AdvancedErrorHandler:
    """Advanced error handling and debugging system."""
    
    def __init__(self, page: Page):
        self.page = page
        self.error_history: List[DetailedError] = []
        self.recovery_attempts: Dict[str, int] = {}
        
    async def handle_action_error(self, error: Exception, action: str, 
                                element_index: Optional[int] = None, 
                                element_selector: Optional[str] = None,
                                input_value: Optional[str] = None) -> DetailedError:
        """Handle action errors with detailed context and suggestions."""
        
        # Extract element information
        element_info = await self._extract_element_info(element_index, element_selector)
        
        # Extract page context
        page_context = await self._extract_page_context()
        
        # Extract action context
        action_context = {
            "action": action,
            "element_index": element_index,
            "element_selector": element_selector,
            "input_value": input_value,
            "timestamp": datetime.now().isoformat()
        }
        
        # Analyze error and generate suggestions
        error_analysis = self._analyze_error(error, element_info, page_context, action_context)
        
        # Create detailed error
        detailed_error = DetailedError(
            error_type=type(error).__name__,
            error_message=str(error),
            element_info=element_info,
            page_context=page_context,
            action_context=action_context,
            suggested_fix=error_analysis["suggested_fix"],
            severity=error_analysis["severity"],
            timestamp=datetime.now(),
            stack_trace=traceback.format_exc()
        )
        
        self.error_history.append(detailed_error)
        
        # Log detailed error
        self._log_detailed_error(detailed_error)
        
        return detailed_error
    
    async def _extract_element_info(self, element_index: Optional[int], 
                                  element_selector: Optional[str]) -> Dict[str, Any]:
        """Extract detailed information about the element that caused the error."""
        element_info = {
            "index": element_index,
            "selector": element_selector,
            "exists": False,
            "visible": False,
            "enabled": False,
            "tag_name": None,
            "attributes": {},
            "text_content": None,
            "bounding_box": None,
            "similar_elements": []
        }
        
        try:
            if element_index is not None:
                # Get element by index
                elements = await self.page.locator("input, button, select, textarea").all()
                if 0 <= element_index < len(elements):
                    element = elements[element_index]
                    element_info.update(await self._get_element_details(element))
                    
                    # Find similar elements
                    element_info["similar_elements"] = await self._find_similar_elements(element)
            
            elif element_selector:
                # Get element by selector
                element = self.page.locator(element_selector).first
                if await element.count() > 0:
                    element_info.update(await self._get_element_details(element))
                    element_info["similar_elements"] = await self._find_similar_elements(element)
                    
        except Exception as e:
            element_info["extraction_error"] = str(e)
        
        return element_info
    
    async def _get_element_details(self, element: Locator) -> Dict[str, Any]:
        """Get detailed information about a specific element."""
        details = {}
        
        try:
            details["exists"] = await element.count() > 0
            if details["exists"]:
                details["visible"] = await element.is_visible()
                details["enabled"] = await element.is_enabled()
                details["tag_name"] = await element.evaluate("el => el.tagName")
                details["text_content"] = await element.text_content()
                
                # Get attributes
                attributes = await element.evaluate("el => { const attrs = {}; for (let attr of el.attributes) { attrs[attr.name] = attr.value; } return attrs; }")
                details["attributes"] = attributes
                
                # Get bounding box
                try:
                    bbox = await element.bounding_box()
                    details["bounding_box"] = bbox
                except:
                    details["bounding_box"] = None
                    
        except Exception as e:
            details["error"] = str(e)
        
        return details
    
    async def _find_similar_elements(self, target_element: Locator) -> List[Dict[str, Any]]:
        """Find similar elements on the page."""
        similar_elements = []
        
        try:
            # Get all interactive elements
            all_elements = await self.page.locator("input, button, select, textarea, a").all()
            
            for i, element in enumerate(all_elements):
                try:
                    element_details = await self._get_element_details(element)
                    if element_details.get("exists"):
                        similar_elements.append({
                            "index": i,
                            "tag_name": element_details.get("tag_name"),
                            "attributes": element_details.get("attributes", {}),
                            "text_content": element_details.get("text_content"),
                            "visible": element_details.get("visible", False)
                        })
                except:
                    continue
                    
        except Exception as e:
            similar_elements.append({"error": str(e)})
        
        return similar_elements[:10]  # Limit to 10 similar elements
    
    async def _extract_page_context(self) -> Dict[str, Any]:
        """Extract current page context information."""
        context = {
            "url": None,
            "title": None,
            "form_count": 0,
            "input_count": 0,
            "button_count": 0,
            "page_loaded": False,
            "viewport_size": None,
            "user_agent": None
        }
        
        try:
            context["url"] = self.page.url
            context["title"] = await self.page.title()
            context["form_count"] = await self.page.locator("form").count()
            context["input_count"] = await self.page.locator("input").count()
            context["button_count"] = await self.page.locator("button").count()
            context["page_loaded"] = True
            
            # Get viewport size
            viewport = await self.page.viewport_size()
            if viewport:
                context["viewport_size"] = f"{viewport['width']}x{viewport['height']}"
            
            # Get user agent
            context["user_agent"] = await self.page.evaluate("navigator.userAgent")
            
        except Exception as e:
            context["extraction_error"] = str(e)
        
        return context
    
    def _analyze_error(self, error: Exception, element_info: Dict[str, Any], 
                      page_context: Dict[str, Any], action_context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze error and provide intelligent suggestions."""
        
        error_message = str(error).lower()
        error_type = type(error).__name__
        
        # Determine severity
        severity = "medium"
        if "timeout" in error_message or "waiting" in error_message:
            severity = "high"
        elif "not found" in error_message or "not visible" in error_message:
            severity = "high"
        elif "permission" in error_message or "blocked" in error_message:
            severity = "critical"
        elif "network" in error_message or "connection" in error_message:
            severity = "high"
        
        # Generate suggestions based on error type
        suggested_fix = self._generate_suggestions(error_message, error_type, element_info, page_context, action_context)
        
        return {
            "severity": severity,
            "suggested_fix": suggested_fix
        }
    
    def _generate_suggestions(self, error_message: str, error_type: str, 
                            element_info: Dict[str, Any], page_context: Dict[str, Any], 
                            action_context: Dict[str, Any]) -> str:
        """Generate intelligent suggestions for fixing the error."""
        
        suggestions = []
        
        # Element not found errors
        if "not found" in error_message or "no element" in error_message:
            suggestions.append("🔍 Element not found. Try these solutions:")
            suggestions.append("  • Wait for the page to fully load")
            suggestions.append("  • Check if the element selector is correct")
            suggestions.append("  • Verify the element exists on the current page")
            
            if element_info.get("similar_elements"):
                suggestions.append("  • Similar elements found on page:")
                for elem in element_info["similar_elements"][:3]:
                    if elem.get("tag_name"):
                        suggestions.append(f"    - {elem['tag_name']}: {elem.get('text_content', 'No text')[:50]}")
        
        # Element not visible errors
        elif "not visible" in error_message or "not attached" in error_message:
            suggestions.append("👁️ Element not visible. Try these solutions:")
            suggestions.append("  • Scroll to the element first")
            suggestions.append("  • Wait for animations to complete")
            suggestions.append("  • Check if element is hidden by CSS")
            suggestions.append("  • Try clicking a parent element first")
        
        # Input text errors
        elif "input text" in error_message or "failed to input" in error_message:
            suggestions.append("⌨️ Input text failed. Try these solutions:")
            suggestions.append("  • Clear the field first")
            suggestions.append("  • Check if the field is enabled")
            suggestions.append("  • Verify the field accepts text input")
            suggestions.append("  • Try typing character by character")
            
            if action_context.get("input_value"):
                suggestions.append(f"  • Input value was: '{action_context['input_value']}'")
        
        # Click errors
        elif "click" in error_message or "failed to click" in error_message:
            suggestions.append("🖱️ Click failed. Try these solutions:")
            suggestions.append("  • Wait for element to be clickable")
            suggestions.append("  • Check if element is covered by another element")
            suggestions.append("  • Try force clicking")
            suggestions.append("  • Scroll to element before clicking")
        
        # Timeout errors
        elif "timeout" in error_message or "waiting" in error_message:
            suggestions.append("⏰ Timeout occurred. Try these solutions:")
            suggestions.append("  • Increase wait timeout")
            suggestions.append("  • Check if page is still loading")
            suggestions.append("  • Verify network connection")
            suggestions.append("  • Try refreshing the page")
        
        # Network errors
        elif "network" in error_message or "connection" in error_message:
            suggestions.append("🌐 Network error. Try these solutions:")
            suggestions.append("  • Check internet connection")
            suggestions.append("  • Verify the website is accessible")
            suggestions.append("  • Try again in a few moments")
            suggestions.append("  • Check for firewall/proxy issues")
        
        # Generic suggestions
        if not suggestions:
            suggestions.append("🔧 General troubleshooting:")
            suggestions.append("  • Refresh the page and try again")
            suggestions.append("  • Check browser console for errors")
            suggestions.append("  • Verify the website is working properly")
            suggestions.append("  • Try a different approach or element")
        
        # Add context-specific suggestions
        if element_info.get("index") is not None:
            suggestions.append(f"  • Element index: {element_info['index']}")
        
        if page_context.get("input_count", 0) > 0:
            suggestions.append(f"  • Page has {page_context['input_count']} input elements")
        
        return "\n".join(suggestions)
    
    def _log_detailed_error(self, error: DetailedError):
        """Log detailed error information."""
        logger.error(f"🚨 Detailed Error Report:")
        logger.error(f"   Type: {error.error_type}")
        logger.error(f"   Message: {error.error_message}")
        logger.error(f"   Severity: {error.severity}")
        logger.error(f"   Element Index: {error.element_info.get('index', 'N/A')}")
        logger.error(f"   Element Selector: {error.element_info.get('selector', 'N/A')}")
        logger.error(f"   Element Exists: {error.element_info.get('exists', 'N/A')}")
        logger.error(f"   Element Visible: {error.element_info.get('visible', 'N/A')}")
        logger.error(f"   Page URL: {error.page_context.get('url', 'N/A')}")
        logger.error(f"   Page Title: {error.page_context.get('title', 'N/A')}")
        logger.error(f"   Suggested Fix:\n{error.suggested_fix}")
        
        if error.severity in ["high", "critical"]:
            logger.error(f"   Stack Trace:\n{error.stack_trace}")
    
    async def attempt_error_recovery(self, error: DetailedError) -> bool:
        """Attempt to recover from an error automatically."""
        recovery_key = f"{error.error_type}_{error.action_context.get('action', 'unknown')}"
        
        # Limit recovery attempts
        if self.recovery_attempts.get(recovery_key, 0) >= 3:
            logger.warning(f"⚠️ Maximum recovery attempts reached for {recovery_key}")
            return False
        
        self.recovery_attempts[recovery_key] = self.recovery_attempts.get(recovery_key, 0) + 1
        
        try:
            # Recovery strategies based on error type
            if "not found" in error.error_message.lower():
                return await self._recover_element_not_found(error)
            elif "not visible" in error.error_message.lower():
                return await self._recover_element_not_visible(error)
            elif "input text" in error.error_message.lower():
                return await self._recover_input_text_error(error)
            elif "timeout" in error.error_message.lower():
                return await self._recover_timeout_error(error)
            
        except Exception as recovery_error:
            logger.error(f"❌ Recovery attempt failed: {recovery_error}")
        
        return False
    
    async def _recover_element_not_found(self, error: DetailedError) -> bool:
        """Recover from element not found error."""
        try:
            # Wait a bit for dynamic content
            await asyncio.sleep(2)
            
            # Try to find similar elements
            if error.element_info.get("similar_elements"):
                for elem in error.element_info["similar_elements"][:3]:
                    if elem.get("visible") and elem.get("tag_name"):
                        logger.info(f"🔄 Trying similar element: {elem['tag_name']}")
                        return True
            
            return False
        except:
            return False
    
    async def _recover_element_not_visible(self, error: DetailedError) -> bool:
        """Recover from element not visible error."""
        try:
            # Scroll to element
            if error.element_info.get("index") is not None:
                elements = await self.page.locator("input, button, select, textarea").all()
                if 0 <= error.element_info["index"] < len(elements):
                    await elements[error.element_info["index"]].scroll_into_view_if_needed()
                    await asyncio.sleep(1)
                    return True
            return False
        except:
            return False
    
    async def _recover_input_text_error(self, error: DetailedError) -> bool:
        """Recover from input text error."""
        try:
            # Clear field first
            if error.element_info.get("index") is not None:
                elements = await self.page.locator("input, textarea").all()
                if 0 <= error.element_info["index"] < len(elements):
                    await elements[error.element_info["index"]].clear()
                    await asyncio.sleep(0.5)
                    return True
            return False
        except:
            return False
    
    async def _recover_timeout_error(self, error: DetailedError) -> bool:
        """Recover from timeout error."""
        try:
            # Wait longer
            await asyncio.sleep(5)
            return True
        except:
            return False
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of all errors encountered."""
        if not self.error_history:
            return {"message": "No errors recorded"}
        
        error_counts = {}
        severity_counts = {}
        
        for error in self.error_history:
            error_type = error.error_type
            severity = error.severity
            
            error_counts[error_type] = error_counts.get(error_type, 0) + 1
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_errors": len(self.error_history),
            "error_types": error_counts,
            "severity_distribution": severity_counts,
            "recovery_attempts": self.recovery_attempts,
            "recent_errors": [
                {
                    "type": e.error_type,
                    "message": e.error_message,
                    "severity": e.severity,
                    "timestamp": e.timestamp.isoformat(),
                    "suggested_fix": e.suggested_fix
                }
                for e in self.error_history[-5:]  # Last 5 errors
            ]
        }
