#!/usr/bin/env python3
"""
Installation script for Fagun Automated Testing Agent
This script helps users set up the environment and dependencies
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def create_virtual_environment():
    """Create virtual environment"""
    if os.path.exists(".venv"):
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv .venv", "Creating virtual environment")

def activate_and_install():
    """Activate virtual environment and install dependencies"""
    system = platform.system().lower()
    
    if system == "windows":
        activate_cmd = ".venv\\Scripts\\activate"
        pip_cmd = ".venv\\Scripts\\pip"
    else:
        activate_cmd = "source .venv/bin/activate"
        pip_cmd = ".venv/bin/pip"
    
    # Upgrade pip
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install requirements
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True

def create_env_file():
    """Create .env file template"""
    if os.path.exists(".env"):
        print("✅ .env file already exists")
        return True
    
    env_content = """# API Keys Configuration
# Get your API keys from the respective providers

# Google Gemini API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Grok API Key (X.AI)
# Get your API key from: https://console.x.ai/
GROK_API_KEY=your_grok_api_key_here

# Instructions:
# 1. Replace 'your_gemini_api_key_here' with your actual Google Gemini API key
# 2. Replace 'your_grok_api_key_here' with your actual Grok API key
# 3. You need at least one API key, but having both provides automatic fallback
# 4. Never commit the .env file with real API keys to version control
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ Created .env file template")
        print("📝 Please edit .env file and add your API keys")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def test_installation():
    """Test the installation"""
    print("\n🧪 Testing installation...")
    
    # Test API manager
    if run_command("python test_api_manager.py", "Testing API manager"):
        print("✅ API manager test passed")
    else:
        print("⚠️ API manager test failed (this is normal if no API keys are configured)")
    
    # Test main script
    if run_command("python Fagun.py --help", "Testing main script"):
        print("✅ Main script test passed")
        return True
    else:
        print("❌ Main script test failed")
        return False

def main():
    """Main installation function"""
    print("🚀 Fagun Automated Testing Agent - Installation Script")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_environment():
        print("❌ Failed to create virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not activate_and_install():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        print("❌ Failed to create .env file")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("❌ Installation test failed")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 Installation completed successfully!")
    print("\n📋 Next steps:")
    print("1. Edit .env file and add your API keys")
    print("2. Run: python Fagun.py")
    print("3. Or test with: python Fagun.py 'visit https://example.com and take a screenshot'")
    print("\n📚 For more information, see README.md")
    print("=" * 60)

if __name__ == "__main__":
    main()
