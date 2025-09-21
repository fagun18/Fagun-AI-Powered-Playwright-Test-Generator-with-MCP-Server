"""
🤖 Fagun Browser Automation Testing Agent - Screenshot Capture
==============================================================

Screenshot capture utilities for testing reports and documentation.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import os
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from playwright.async_api import Page
import logging

logger = logging.getLogger(__name__)


class ScreenshotCapture:
    """Handles screenshot capture during test execution."""
    
    def __init__(self, output_dir: str = "screenshots"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.screenshots = []
    
    async def capture_screenshot(
        self, 
        page: Page, 
        description: str = "Test Screenshot",
        full_page: bool = True
    ) -> Dict[str, Any]:
        """
        Capture a screenshot of the current page.
        
        Args:
            page: Playwright page object
            description: Description of the screenshot
            full_page: Whether to capture full page or viewport only
            
        Returns:
            Dictionary containing screenshot metadata
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"screenshot_{timestamp}.png"
            filepath = self.output_dir / filename
            
            # Capture screenshot
            if full_page:
                await page.screenshot(path=str(filepath), full_page=True)
            else:
                await page.screenshot(path=str(filepath), full_page=False)
            
            # Get page info
            url = page.url
            title = await page.title()
            
            screenshot_data = {
                "filename": filename,
                "path": str(filepath),
                "description": description,
                "timestamp": datetime.now().isoformat(),
                "url": url,
                "title": title,
                "full_page": full_page
            }
            
            self.screenshots.append(screenshot_data)
            logger.info(f"Screenshot captured: {filename}")
            
            return screenshot_data
            
        except Exception as e:
            logger.error(f"Error capturing screenshot: {str(e)}")
            return {
                "filename": None,
                "path": None,
                "description": description,
                "timestamp": datetime.now().isoformat(),
                "url": page.url if page else "Unknown",
                "title": "Error",
                "full_page": full_page,
                "error": str(e)
            }
    
    async def capture_element_screenshot(
        self,
        page: Page,
        selector: str,
        description: str = "Element Screenshot"
    ) -> Dict[str, Any]:
        """
        Capture a screenshot of a specific element.
        
        Args:
            page: Playwright page object
            selector: CSS selector for the element
            description: Description of the screenshot
            
        Returns:
            Dictionary containing screenshot metadata
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"element_{timestamp}.png"
            filepath = self.output_dir / filename
            
            # Wait for element to be visible
            element = await page.wait_for_selector(selector, timeout=5000)
            
            # Capture element screenshot
            await element.screenshot(path=str(filepath))
            
            screenshot_data = {
                "filename": filename,
                "path": str(filepath),
                "description": f"{description} - Element: {selector}",
                "timestamp": datetime.now().isoformat(),
                "url": page.url,
                "title": await page.title(),
                "selector": selector,
                "type": "element"
            }
            
            self.screenshots.append(screenshot_data)
            logger.info(f"Element screenshot captured: {filename}")
            
            return screenshot_data
            
        except Exception as e:
            logger.error(f"Error capturing element screenshot: {str(e)}")
            return {
                "filename": None,
                "path": None,
                "description": f"{description} - Element: {selector}",
                "timestamp": datetime.now().isoformat(),
                "url": page.url if page else "Unknown",
                "title": "Error",
                "selector": selector,
                "type": "element",
                "error": str(e)
            }
    
    async def capture_error_screenshot(
        self,
        page: Page,
        error_message: str,
        description: str = "Error Screenshot"
    ) -> Dict[str, Any]:
        """
        Capture a screenshot when an error occurs.
        
        Args:
            page: Playwright page object
            error_message: The error message
            description: Description of the screenshot
            
        Returns:
            Dictionary containing screenshot metadata
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"error_{timestamp}.png"
            filepath = self.output_dir / filename
            
            # Capture screenshot
            await page.screenshot(path=str(filepath), full_page=True)
            
            screenshot_data = {
                "filename": filename,
                "path": str(filepath),
                "description": f"{description} - Error: {error_message[:50]}...",
                "timestamp": datetime.now().isoformat(),
                "url": page.url,
                "title": await page.title(),
                "error_message": error_message,
                "type": "error"
            }
            
            self.screenshots.append(screenshot_data)
            logger.info(f"Error screenshot captured: {filename}")
            
            return screenshot_data
            
        except Exception as e:
            logger.error(f"Error capturing error screenshot: {str(e)}")
            return {
                "filename": None,
                "path": None,
                "description": f"{description} - Error: {error_message[:50]}...",
                "timestamp": datetime.now().isoformat(),
                "url": page.url if page else "Unknown",
                "title": "Error",
                "error_message": error_message,
                "type": "error",
                "error": str(e)
            }
    
    def get_screenshots(self) -> list:
        """Get all captured screenshots."""
        return self.screenshots
    
    def clear_screenshots(self):
        """Clear the screenshots list."""
        self.screenshots = []
    
    def get_screenshot_summary(self) -> Dict[str, Any]:
        """Get a summary of captured screenshots."""
        total_screenshots = len(self.screenshots)
        successful_screenshots = len([s for s in self.screenshots if s.get('filename')])
        error_screenshots = len([s for s in self.screenshots if s.get('type') == 'error'])
        element_screenshots = len([s for s in self.screenshots if s.get('type') == 'element'])
        
        return {
            "total_screenshots": total_screenshots,
            "successful_screenshots": successful_screenshots,
            "error_screenshots": error_screenshots,
            "element_screenshots": element_screenshots,
            "screenshots": self.screenshots
        }
    
    def save_screenshots_metadata(self, filepath: str):
        """Save screenshots metadata to a JSON file."""
        try:
            metadata = {
                "capture_time": datetime.now().isoformat(),
                "total_screenshots": len(self.screenshots),
                "screenshots": self.screenshots
            }
            
            with open(filepath, 'w') as f:
                import json
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Screenshots metadata saved to: {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving screenshots metadata: {str(e)}")


# Global screenshot capture instance
screenshot_capture = ScreenshotCapture()


async def capture_test_screenshot(
    page: Page,
    test_name: str,
    step_description: str = "Test Step"
) -> Dict[str, Any]:
    """
    Convenience function to capture a test screenshot.
    
    Args:
        page: Playwright page object
        test_name: Name of the test
        step_description: Description of the test step
        
    Returns:
        Dictionary containing screenshot metadata
    """
    description = f"{test_name} - {step_description}"
    return await screenshot_capture.capture_screenshot(page, description)


async def capture_error_screenshot(
    page: Page,
    test_name: str,
    error_message: str
) -> Dict[str, Any]:
    """
    Convenience function to capture an error screenshot.
    
    Args:
        page: Playwright page object
        test_name: Name of the test
        error_message: The error message
        
    Returns:
        Dictionary containing screenshot metadata
    """
    description = f"{test_name} - Error"
    return await screenshot_capture.capture_error_screenshot(page, error_message, description)
