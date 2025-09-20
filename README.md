# 🤖 Fagun Automated Testing Agent

A powerful, intelligent browser automation tool that performs comprehensive website testing with beautiful HTML reports. Built with BrowserUse and Google Gemini LLM for advanced AI-driven testing capabilities.

## ✨ Features

### 🎯 **Advanced Testing Capabilities**
- **Comprehensive Website Testing** - Test entire websites with intelligent navigation
- **Functional Testing** - Automated testing of forms, buttons, links, and user interactions
- **Security Testing** - Basic security checks and vulnerability assessments
- **Performance Testing** - Page load times and responsiveness testing
- **Accessibility Testing** - Basic accessibility compliance checks

### 📊 **Beautiful HTML Reports**
- **Modern Design** - Colorful, responsive HTML reports with gradient backgrounds
- **Detailed Test Results** - Step-by-step test execution with pass/fail status
- **Visual Indicators** - Color-coded status cards and progress indicators
- **Screenshot Support** - Automatic screenshot capture for test evidence
- **Mobile Responsive** - Reports work perfectly on all devices

### 🤖 **AI-Powered Intelligence**
- **Dual AI Support** - Automatic switching between Gemini and Grok APIs
- **Smart Fallback** - Seamlessly switches when quota limits are reached
- **Natural Language Prompts** - Describe your testing needs in plain English
- **Adaptive Testing** - AI adapts to different website structures and layouts
- **Smart Error Handling** - Intelligent error detection and recovery

### 🛠️ **Developer-Friendly**
- **Command Line Interface** - Easy to use from terminal
- **Interactive Mode** - User-friendly prompts and guidance
- **Extensible Architecture** - Easy to add new testing capabilities
- **Comprehensive Logging** - Detailed logs for debugging and analysis

## 📋 Requirements

- **Python 3.12+**
- **pip** (Python package manager)
- **At least one API key** (Gemini or Grok recommended)
- **Internet connection**
- **Modern web browser** (for viewing reports)

## 🚀 Complete Setup Guide

### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server

# Navigate to the project directory
cd Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server
```

### Step 2: Create Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (Command Prompt)
.venv\Scripts\activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt
```

### Step 4: Set Up API Keys
```bash
# Create .env file with both API keys
# Windows (Command Prompt)
echo GEMINI_API_KEY=your_gemini_api_key_here > .env
echo GROK_API_KEY=your_grok_api_key_here >> .env

# Windows (PowerShell)
New-Item -Path .env -ItemType File
Add-Content -Path .env -Value "GEMINI_API_KEY=your_gemini_api_key_here"
Add-Content -Path .env -Value "GROK_API_KEY=your_grok_api_key_here"

# macOS / Linux
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
echo "GROK_API_KEY=your_grok_api_key_here" >> .env
```

**Important:** 
- Replace `your_gemini_api_key_here` with your actual Google Gemini API key
- Replace `your_grok_api_key_here` with your actual Grok API key
- You need at least one API key, but having both provides automatic fallback

### Step 5: Verify Installation
```bash
# Check if all dependencies are installed
pip list

# Test the API manager
python test_api_manager.py

# Test the installation
python Fagun.py --help
```

## 🔄 Dual API System

The system now supports automatic switching between Gemini and Grok APIs:

### How It Works
1. **Starts with Gemini** (if available)
2. **Monitors for quota errors** automatically
3. **Switches to Grok** when Gemini quota is exceeded
4. **Provides seamless fallback** without interrupting tests

### API Key Setup
- **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Grok API**: Get from [X.AI Console](https://console.x.ai/)

### Benefits
- ✅ **No Interruptions**: Tests continue even when one API hits quota limits
- ✅ **Automatic Detection**: System detects quota errors and switches automatically
- ✅ **Cost Effective**: Use both APIs efficiently
- ✅ **Reliability**: Higher uptime with dual API support

## 🎮 Usage Commands

### Interactive Mode
```bash
# Start the interactive mode
python Fagun.py

# Follow the prompts to enter your testing requirements
# Example: "visit https://example.com and test full website each and everything"
```

### Command Line Mode
```bash
# Basic website testing
python Fagun.py "visit https://example.com and take a screenshot"

# Comprehensive website testing
python Fagun.py "visit https://fagun.sqatesting.com and test full website each and everything"

# Security and performance testing
python Fagun.py "test https://example.com for performance, security, and functionality"

# Specific feature testing
python Fagun.py "test https://mysite.com login form and navigation menu"

# E-commerce testing
python Fagun.py "test https://shop.example.com product pages, cart functionality, and checkout process"

# Form testing
python Fagun.py "test https://contact.example.com contact form validation and submission"

# Mobile responsiveness testing
python Fagun.py "test https://example.com mobile responsiveness and touch interactions"

# API endpoint testing
python Fagun.py "test https://api.example.com endpoints and response validation"

# Cross-browser testing
python Fagun.py "test https://example.com across different browsers and devices"

# Accessibility testing
python Fagun.py "test https://example.com for accessibility compliance and screen reader compatibility"

# Performance testing
python Fagun.py "test https://example.com page load times, performance metrics, and optimization"

# Security testing
python Fagun.py "test https://example.com for security vulnerabilities, XSS, and SQL injection"

# User journey testing
python Fagun.py "test complete user journey on https://example.com from landing to conversion"

# Regression testing
python Fagun.py "run regression tests on https://example.com after recent updates"

# Smoke testing
python Fagun.py "run smoke tests on https://example.com critical functionality"

# Integration testing
python Fagun.py "test https://example.com integration with third-party services and APIs"
```

### Advanced Usage Examples

#### 1. **Comprehensive Website Audit**
```bash
python Fagun.py "perform comprehensive audit of https://example.com including:
- Test all navigation links and menus
- Verify form submissions and validations
- Check responsive design on different screen sizes
- Test user authentication and authorization
- Validate page load times and performance
- Check for broken links and 404 errors
- Test accessibility compliance
- Verify SEO elements and meta tags
- Test cross-browser compatibility
- Check security headers and SSL configuration"
```

#### 2. **E-commerce Testing**
```bash
python Fagun.py "test e-commerce functionality on https://shop.example.com:
- Browse product categories and search
- Add items to cart and modify quantities
- Test checkout process and payment forms
- Verify user account creation and login
- Test product reviews and ratings
- Check inventory management
- Test shipping and billing calculations
- Verify order confirmation and email notifications"
```

#### 3. **API Testing**
```bash
python Fagun.py "test API endpoints on https://api.example.com:
- Test GET, POST, PUT, DELETE operations
- Verify authentication and authorization
- Test request/response validation
- Check error handling and status codes
- Test rate limiting and throttling
- Verify data format and structure
- Test pagination and filtering
- Check CORS and security headers"
```

#### 4. **Mobile App Testing**
```bash
python Fagun.py "test mobile web app on https://m.example.com:
- Test touch interactions and gestures
- Verify mobile navigation and menus
- Test form inputs on mobile devices
- Check mobile-specific features
- Test offline functionality
- Verify push notifications
- Test mobile payment integration
- Check mobile performance optimization"
```

#### 5. **Security Testing**
```bash
python Fagun.py "perform security testing on https://example.com:
- Test for SQL injection vulnerabilities
- Check for XSS (Cross-Site Scripting) vulnerabilities
- Test CSRF protection
- Verify input validation and sanitization
- Check for sensitive data exposure
- Test authentication bypass attempts
- Verify secure cookie settings
- Check for security headers implementation"
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **API Key Not Found**
```bash
Error: No API keys found in environment variables
```
**Solution:**
- Ensure your `.env` file exists in the project root
- Check that at least one API key is correctly formatted
- Verify the file is named exactly `.env` (not `.env.txt`)
- You need either `GEMINI_API_KEY` or `GROK_API_KEY` (or both)

#### 2. **Virtual Environment Issues**
```bash
# If virtual environment is not activated
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# If virtual environment doesn't exist
python -m venv .venv
```

#### 3. **Dependencies Installation Issues**
```bash
# Update pip first
python -m pip install --upgrade pip

# Install dependencies one by one if needed
pip install browser-use
pip install langchain-google-genai
pip install python-dotenv
pip install requests
```

#### 4. **Permission Issues (Windows)**
```bash
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate virtual environment
.venv\Scripts\Activate.ps1
```

#### 5. **"ainvoke" Error (Fixed)**
```bash
"ChatGoogleGenerativeAI" object has no field "ainvoke"
```
**Solution:** This error has been fixed in the latest version. Make sure you're using the updated code and requirements.txt.

#### 6. **Model Not Found Error**
```bash
404 models/gemini-pro is not found
```
**Solution:** The tool automatically uses the correct model (`gemini-1.5-flash`). This error usually resolves itself.

#### 7. **Website Not Accessible**
```bash
Error during automation: Connection timeout
```
**Solution:**
- Check if the website is accessible in your browser
- Verify your internet connection
- Try with a different website first
- Check if the website requires authentication

### Getting Help
- Check the generated HTML report for detailed error information
- Ensure all dependencies are installed correctly
- Verify your API key has the necessary permissions
- Check the console output for specific error messages

## 📁 Project Structure

```
Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server/
├── FirstTest.py              # Main automation script
├── requirements.txt          # Python dependencies
├── README.md                # This documentation
├── .env                     # API key configuration (create this)
├── .venv/                   # Virtual environment (created during setup)
└── test_report_*.html       # Generated test reports
```

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server
cd Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server

# 2. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up API key
echo GEMINI_API_KEY=your_actual_api_key_here > .env

# 5. Run your first test
python Fagun.py "visit https://fagun.sqatesting.com and take a screenshot"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **BrowserUse** - For the powerful browser automation framework
- **Google Gemini** - For the advanced AI capabilities
- **LangChain** - For seamless LLM integration

---

**Made with ❤️ for the testing community by Fagun**

## 📊 Generated Reports

The tool automatically generates beautiful HTML reports with:

- **📈 Test Summary** - Total tests, passed, failed, and warnings
- **⏱️ Execution Time** - Detailed timing information
- **🔍 Step-by-Step Details** - Every test action with timestamps
- **📸 Screenshots** - Visual evidence of test execution
- **🎨 Modern Design** - Responsive, colorful interface
- **📱 Mobile Friendly** - Works on all devices

### Report Features
- **Color-coded status indicators**
- **Interactive hover effects**
- **Professional gradient backgrounds**
- **Responsive grid layouts**
- **Detailed test step information**

## 🛠️ Advanced Configuration

### Custom Testing Prompts
You can create custom testing scenarios by providing detailed prompts:

```bash
python Fagun.py "comprehensive testing of https://mysite.com including:
- Test all navigation links
- Verify form submissions
- Check responsive design
- Test user authentication
- Validate page load times
- Check for broken links"
```

### Report Customization
The HTML reports are fully customizable. You can modify the `TestReportGenerator` class to:
- Add custom test metrics
- Include additional visualizations
- Modify the color scheme
- Add company branding

## 🎯 Testing Types Supported

### 1. **Functional Testing**
```bash
# Basic functionality testing
python Fagun.py "test https://example.com basic functionality and user interactions"

# Form testing
python Fagun.py "test https://example.com all forms, validation, and submission"

# Navigation testing
python Fagun.py "test https://example.com navigation menu and internal links"

# User flow testing
python Fagun.py "test complete user journey on https://example.com"
```

### 2. **Performance Testing**
```bash
# Page load performance
python Fagun.py "test https://example.com page load times and performance metrics"

# Resource optimization
python Fagun.py "test https://example.com image optimization and resource loading"

# Speed testing
python Fagun.py "test https://example.com website speed and optimization"
```

### 3. **Security Testing**
```bash
# Basic security checks
python Fagun.py "test https://example.com for basic security vulnerabilities"

# Input validation testing
python Fagun.py "test https://example.com input validation and sanitization"

# Authentication testing
python Fagun.py "test https://example.com login security and session management"
```

### 4. **Accessibility Testing**
```bash
# WCAG compliance
python Fagun.py "test https://example.com for accessibility compliance"

# Screen reader compatibility
python Fagun.py "test https://example.com screen reader compatibility"

# Keyboard navigation
python Fagun.py "test https://example.com keyboard navigation and accessibility"
```

### 5. **Mobile Testing**
```bash
# Mobile responsiveness
python Fagun.py "test https://example.com mobile responsiveness and touch interactions"

# Mobile performance
python Fagun.py "test https://example.com mobile performance and optimization"

# Cross-device testing
python Fagun.py "test https://example.com across different mobile devices"
```

### 6. **API Testing**
```bash
# REST API testing
python Fagun.py "test https://api.example.com REST endpoints and responses"

# API security
python Fagun.py "test https://api.example.com API security and authentication"

# API performance
python Fagun.py "test https://api.example.com API performance and response times"
```

### 7. **E-commerce Testing**
```bash
# Shopping cart testing
python Fagun.py "test https://shop.example.com shopping cart and checkout process"

# Payment testing
python Fagun.py "test https://shop.example.com payment forms and processing"

# Product testing
python Fagun.py "test https://shop.example.com product pages and search functionality"
```

### 8. **Regression Testing**
```bash
# Full regression test
python Fagun.py "run full regression test on https://example.com after updates"

# Critical path testing
python Fagun.py "test critical user paths on https://example.com"

# Feature testing
python Fagun.py "test specific features on https://example.com after changes"
```

## 🔧 Advanced Usage

### Batch Testing
```bash
# Test multiple websites
python Fagun.py "test multiple websites: https://site1.com, https://site2.com, https://site3.com"

# Test with different configurations
python Fagun.py "test https://example.com with different user roles and permissions"
```

### Custom Test Scenarios
```bash
# User persona testing
python Fagun.py "test https://example.com as different user personas: admin, user, guest"

# Edge case testing
python Fagun.py "test https://example.com edge cases and error conditions"

# Stress testing
python Fagun.py "test https://example.com under high load and stress conditions"
```

### Integration Testing
```bash
# Third-party integration
python Fagun.py "test https://example.com integration with external services"

# Database testing
python Fagun.py "test https://example.com database operations and data integrity"

# Payment gateway testing
python Fagun.py "test https://example.com payment gateway integration and processing"
```

## 📋 Complete Installation Checklist

### ✅ Pre-Installation
- [ ] Python 3.12+ installed
- [ ] Git installed
- [ ] Internet connection available
- [ ] Google Gemini API key obtained

### ✅ Installation Steps
- [ ] Clone repository
- [ ] Navigate to project directory
- [ ] Create virtual environment
- [ ] Activate virtual environment
- [ ] Upgrade pip
- [ ] Install dependencies
- [ ] Create .env file
- [ ] Add API key to .env
- [ ] Verify installation

### ✅ Post-Installation
- [ ] Test with simple command
- [ ] Check generated report
- [ ] Verify all features working

## 🚀 Getting Started Examples

### Example 1: First Time Setup
```bash
# 1. Clone and setup
git clone https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server
cd Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server

# 2. Environment setup
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# 3. API key setup
echo GEMINI_API_KEY=your_actual_key_here > .env

# 4. First test
python Fagun.py "visit https://fagun.sqatesting.com and take a screenshot"
```

### Example 2: Comprehensive Testing
```bash
# Run comprehensive test
python Fagun.py "perform comprehensive testing of https://fagun.sqatesting.com including:
- Test all navigation links and menus
- Verify form functionality
- Check responsive design
- Test user interactions
- Validate page performance
- Check for broken elements"
```

### Example 3: Interactive Mode
```bash
# Start interactive mode
python Fagun.py

# Then follow prompts:
# Enter your testing prompt: visit https://example.com and test everything
# Press Enter to use default prompt
```

## 📊 Report Examples

After running tests, you'll get HTML reports like:
- `test_report_20250919_223528.html` - Basic screenshot test
- `test_report_20250919_223734.html` - Comprehensive website test
- `test_report_YYYYMMDD_HHMMSS.html` - Timestamped reports

## 🎯 Best Practices

### 1. **Test Planning**
- Start with simple tests before complex scenarios
- Test critical user journeys first
- Use descriptive test prompts
- Include specific validation criteria

### 2. **Report Analysis**
- Review HTML reports for detailed insights
- Check test step details for failures
- Use screenshots for visual verification
- Monitor performance metrics

### 3. **Troubleshooting**
- Check console output for errors
- Verify API key configuration
- Test with different websites
- Review generated reports for clues

## 🔍 Debugging Tips

### Enable Verbose Logging
```bash
# Run with detailed output
python Fagun.py "test https://example.com" --verbose
```

### Test API Connection
```bash
# Test API key
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key:', os.getenv('GEMINI_API_KEY')[:10] + '...' if os.getenv('GEMINI_API_KEY') else 'Not found')"
```

### Check Dependencies
```bash
# Verify all packages installed
pip list | grep -E "(browser-use|langchain|dotenv)"
```

## 📞 Support

### Common Questions
1. **Q: How do I get a Google Gemini API key?**
   A: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to create an API key.

2. **Q: Can I test localhost websites?**
   A: Yes, use `http://localhost:port` or `http://127.0.0.1:port` in your test prompts.

3. **Q: How long do tests take?**
   A: Depends on complexity. Simple tests: 30-60 seconds, comprehensive tests: 2-5 minutes.

4. **Q: Can I customize the HTML reports?**
   A: Yes, modify the `TestReportGenerator` class in `FirstTest.py`.

### Getting Help
- Check the troubleshooting section above
- Review generated HTML reports for error details
- Ensure all dependencies are correctly installed
- Verify your API key has proper permissions

---

**🎉 You're all set! Start testing with confidence using the Fagun Automated Testing Agent!**

## 🛠️ Advanced Configuration

### Custom Testing Prompts
You can create custom testing scenarios by providing detailed prompts:

```bash
python Fagun.py "comprehensive testing of https://mysite.com including:
- Test all navigation links
- Verify form submissions
- Check responsive design
- Test user authentication
- Validate page load times
- Check for broken links"
```

### Report Customization
The HTML reports are fully customizable. You can modify the `TestReportGenerator` class to:
- Add custom test metrics
- Include additional visualizations
- Modify the color scheme
- Add company branding

## 🔧 Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: GEMINI_API_KEY not found in environment variables
   ```
   **Solution**: Ensure your `.env` file contains the correct API key

2. **Model Not Found**
   ```
   404 models/gemini-pro is not found
   ```
   **Solution**: The tool automatically uses the correct model (`gemini-1.5-flash`)

3. **Website Not Accessible**
   ```
   Error during automation: Connection timeout
   ```
   **Solution**: Check if the website is accessible and your internet connection is stable

### Getting Help
- Check the generated HTML report for detailed error information
- Ensure all dependencies are installed correctly
- Verify your API key has the necessary permissions

## 📁 Project Structure

```
BrowserUse-Automated-Testing-Agent/
├── FirstTest.py              # Main automation script
├── requirements.txt          # Python dependencies
├── README.md                # This file
├── .env                     # API key configuration (create this)
└── test_report_*.html       # Generated test reports
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **BrowserUse** - For the powerful browser automation framework
- **Google Gemini** - For the advanced AI capabilities
- **LangChain** - For seamless LLM integration

---

**Made with ❤️ for the testing community**
