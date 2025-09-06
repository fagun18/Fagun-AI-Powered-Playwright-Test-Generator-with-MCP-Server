#!/usr/bin/env python3
"""
Basic Usage Example for Fagun Automation Framework (Python)

This example demonstrates how to use the framework programmatically
instead of using the CLI interface.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src' / 'python'))

from main import FagunAutomation, Config

async def run_basic_example():
    """Run a basic automation example"""
    print("🚀 Fagun Automation Framework - Basic Usage Example (Python)\n")
    
    try:
        # Check for API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("❌ GEMINI_API_KEY environment variable not set!")
            print("Please set your Gemini API key:")
            print("export GEMINI_API_KEY='your_api_key_here'")
            return
        
        # Create configuration
        config = Config(
            gemini_api_key=api_key,
            browser_type='chromium',
            headless=True,
            max_test_cases=10,  # Limit for example
            include_accessibility=True,
            include_performance=False,  # Disable for faster execution
            include_security=False      # Disable for faster execution
        )
        
        # Initialize automation framework
        automation = FagunAutomation(config)
        
        # Target website
        target_url = 'https://example.com'
        
        print(f"📊 Testing website: {target_url}")
        print("This will:")
        print("1. Analyze the website structure")
        print("2. Generate test cases using AI")
        print("3. Execute the tests")
        print("4. Generate a detailed report")
        print()
        
        # Run automation
        await automation.run_automation(target_url)
        
        print("\n🎉 Example completed successfully!")
        print("Check the reports/ directory for detailed results.")
        
    except Exception as error:
        print(f"❌ Error: {error}")
        sys.exit(1)

def main():
    """Main function"""
    asyncio.run(run_basic_example())

if __name__ == "__main__":
    main()

