#!/usr/bin/env python3
"""
Test script for the APIManager class
This script tests the dual API key functionality without running the full browser automation
"""

import os
import sys
from dotenv import load_dotenv

# Add the current directory to the path so we can import from Fagun.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from Fagun import APIManager

def test_api_manager():
    """Test the APIManager functionality"""
    print("🧪 Testing APIManager...")
    
    # Load environment variables
    load_dotenv()
    
    # Initialize API manager
    api_manager = APIManager()
    
    print(f"📋 Available API keys:")
    print(f"   Gemini: {'✅ Available' if api_manager.gemini_key else '❌ Not found'}")
    print(f"   Grok: {'✅ Available' if api_manager.grok_key else '❌ Not found'}")
    print(f"   Current provider: {api_manager.current_provider}")
    
    if not api_manager.gemini_key and not api_manager.grok_key:
        print("❌ No API keys found. Please check your .env file.")
        return False
    
    try:
        # Test getting current LLM
        print(f"\n🤖 Testing LLM initialization with {api_manager.current_provider}...")
        llm = api_manager.get_current_llm()
        print(f"✅ Successfully initialized {api_manager.current_provider} LLM")
        
        # Test API switching if both keys are available
        if api_manager.gemini_key and api_manager.grok_key:
            print(f"\n🔄 Testing API switching...")
            original_provider = api_manager.current_provider
            
            # Switch to the other provider
            if api_manager.current_provider == "gemini":
                api_manager.switch_to_grok()
            else:
                api_manager.switch_to_gemini()
            
            print(f"✅ Switched from {original_provider} to {api_manager.current_provider}")
            
            # Test LLM with new provider
            llm2 = api_manager.get_current_llm()
            print(f"✅ Successfully initialized {api_manager.current_provider} LLM")
            
            # Switch back
            if api_manager.current_provider == "gemini":
                api_manager.switch_to_grok()
            else:
                api_manager.switch_to_gemini()
            print(f"✅ Switched back to {api_manager.current_provider}")
        
        print(f"\n✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_api_manager()
    sys.exit(0 if success else 1)
