# 🚀 Fagun Automation Framework

**AI-powered automated testing framework using Playwright, MCP Server and Gemini AI**

An intelligent automation testing framework that automatically analyzes websites, generates comprehensive test cases using AI, and executes them with detailed reporting.

## 🎥 Demo

<video src="./Recording.mp4" controls autoplay muted loop playsinline style="width: 100%; max-width: 960px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); outline: none;">
Your browser doesn't support embedded videos. Watch the recording here: <a href="./Recording.mp4">Recording.mp4</a>
</video>

## ✨ Features

- **🤖 AI-Powered Test Generation**: Uses Google's Gemini AI to automatically generate comprehensive test cases
- **🔍 Intelligent Website Analysis**: Automatically discovers pages, forms, buttons, and interactive elements
- **🎭 Multi-Browser Support**: Works with Chromium, Firefox, and WebKit
- **📊 Comprehensive Testing**: Covers functional, UI, accessibility, performance, and security testing
- **📈 Rich Reporting**: Beautiful HTML reports with screenshots, videos, and detailed logs
- **⚡ Parallel Execution**: Runs tests in parallel for faster execution
- **🛠️ Multiple Languages**: Available in both TypeScript/JavaScript and Python

## 🎯 How It Works

1. **Website Analysis**: Crawls and analyzes the target website structure
2. **AI Test Generation**: Uses Gemini AI to generate comprehensive test cases
3. **Test Execution**: Runs all generated tests using Playwright
4. **Report Generation**: Creates detailed HTML reports with results

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (for TypeScript version)
- Python 3.8+ (for Python version)
- Google Gemini API key

### Installation

#### TypeScript/JavaScript Version

```bash
# Clone the repository
git clone https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server.git
cd Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up environment variables
cp config.env.example config.env
# Edit config.env and add your GEMINI_API_KEY (and optionally GROQ_API_KEY)

# Build the project
npm run build

# Run the Project (interactive CLI)
node dist/main.js run
```

#### Python Version

```bash
# Clone the repository
git clone https://github.com/fagun18/Fagun-AI-Powered-Playwright-Test-Generator-with-MCP-Server.git
cd fagun-automation

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install

# Set up environment variables
export GEMINI_API_KEY="your_api_key_here"
```

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and set it in your environment variables

## 🎮 Usage

### TypeScript/JavaScript Version

```bash
# Build (only needed after source changes)
npm run build

# Run interactive CLI (recommended)
node dist/main.js run

# Run comprehensive full suite
node dist/main.js comprehensive
```

### MCP Server (Model Context Protocol)

Expose the framework as an MCP tool that LLMs or MCP-compatible clients can call to analyze, generate, run, and report.

```bash
# Start the MCP server over stdio
npm run mcp

# Tool: run_all
# Input schema:
# {
#   "url": "https://example.com",
#   "deeper": false,          // optional
#   "login": {                // optional
#     "required": true,
#     "loginUrl": "https://example.com/login",
#     "username": "user@example.com",
#     "password": "secret",
#     "usernameSelector": "#email",
#     "passwordSelector": "#password",
#     "submitSelector": "button[type=submit]"
#   }
# }
# Output contains pass/fail summary, report path, counts by test type, pages analyzed, total elements, and broken links.
```

Configure your MCP client to spawn `npm run mcp` as a stdio server named `fagun-playwright-mcp`.

### Python Version

```bash
# Basic usage
python src/python/main.py --url https://example.com

# With custom options
python src/python/main.py \
  --url https://example.com \
  --browser firefox \
  --no-headless \
  --max-tests 100 \
  --api-key your_api_key_here
```

## 📋 Configuration

### Environment Variables

Create a `config.env` file with the following variables:

```env
# Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Test Configuration
DEFAULT_TIMEOUT=30000
HEADLESS_MODE=true
BROWSER_TYPE=chromium

# Output Configuration
REPORTS_DIR=./reports
SCREENSHOTS_DIR=./screenshots
VIDEOS_DIR=./videos

# Test Generation Settings
MAX_TEST_CASES=50
INCLUDE_ACCESSIBILITY_TESTS=true
INCLUDE_PERFORMANCE_TESTS=true
INCLUDE_SECURITY_TESTS=true
```

### Command Line Options (Python)

```bash
python src/python/main.py --help

Options:
  -u, --url TEXT           Target website URL to test [required]
  -k, --api-key TEXT       Gemini API key (or set GEMINI_API_KEY env var)
  -b, --browser [chromium|firefox|webkit]  Browser type [default: chromium]
  --headless / --no-headless  Run in headless mode [default: True]
  -m, --max-tests INTEGER  Maximum number of test cases to generate [default: 50]
  --help                   Show this message and exit.
```

## 🧪 Comprehensive Test Types Generated

The framework automatically generates tests across **17 different test categories**:

### 🔧 Functional Testing
- Form submissions and validations
- Button clicks and interactions
- Navigation and routing
- User workflows and business processes
- Input field validations
- Dropdown selections and interactions

### 🎨 UI Testing
- Element visibility and accessibility
- Responsive design validation
- User interface interactions
- Visual consistency checks
- Layout and positioning validation
- Interactive element behavior

### ♿ Accessibility Testing
- ARIA labels and attributes
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- WCAG compliance checks
- Focus management

### ⚡ Performance Testing
- Page load times
- Resource optimization
- Core Web Vitals monitoring
- Network performance
- Speed metrics validation
- Performance regression detection

### 🔒 Security Testing
- XSS prevention
- Input validation
- CSRF protection
- Security headers validation
- Authentication testing
- Authorization checks
- SQL injection prevention
- Path traversal protection

### 🔌 API Testing
- REST endpoint validation
- GraphQL query testing
- Authentication mechanisms
- Rate limiting verification
- Error handling validation
- Response format checking
- API integration testing

### 🌐 Cross-Browser Testing
- Chrome compatibility
- Firefox compatibility
- Safari compatibility
- Edge compatibility
- WebKit compatibility
- Browser-specific feature testing

### 👁️ Visual Regression Testing
- UI consistency validation
- Layout change detection
- Design regression prevention
- Screenshot comparison
- Visual element validation
- Cross-device visual testing

### 🔄 End-to-End Workflow Testing
- Complete user journeys
- Business process validation
- Critical path testing
- Multi-step workflows
- User scenario simulation
- Integration flow testing

### 🎯 Edge Case Testing
- Boundary condition testing
- Error scenario handling
- Stress condition validation
- Unusual input testing
- Network failure simulation
- Resource exhaustion testing

### 📱 Mobile Testing
- Responsive design validation
- Touch interaction testing
- Device-specific features
- Mobile navigation testing
- Touch-friendly element validation
- Mobile performance testing

### 📊 Data-Driven Testing
- Multiple data set validation
- Parameterized test execution
- Form validation scenarios
- User credential testing
- Product data validation
- Payment processing testing

### 💪 Stress Testing
- High load simulation
- Concurrent user testing
- Resource exhaustion testing
- System stability validation
- Performance under stress
- Memory leak detection

### ⚡ Load Testing
- Normal load performance
- Peak load handling
- Scalability validation
- Response time monitoring
- Throughput measurement
- System capacity testing

### 👥 Usability Testing
- User experience validation
- Navigation flow testing
- Content accessibility
- User interface intuitiveness
- Task completion validation
- User satisfaction metrics

### 🔧 Compatibility Testing
- Browser version compatibility
- Operating system compatibility
- Device type compatibility
- JavaScript compatibility
- CSS compatibility
- Feature support validation

## 🆕 New Advanced Features

### 📋 Test Templates
Pre-built test templates for common scenarios:
- **Login Flow**: Complete authentication testing
- **Form Validation**: Data validation testing
- **API Endpoint**: REST/GraphQL testing
- **Mobile Responsive**: Device compatibility testing
- **Visual Regression**: UI consistency testing
- **Performance Audit**: Speed and metrics testing
- **Accessibility Audit**: WCAG compliance testing
- **Security Scan**: Vulnerability testing
- **Cross-Browser**: Browser compatibility testing
- **Edge Case**: Boundary condition testing

### 📊 Test Data Management
Comprehensive test data sets:
- **User Credentials**: Various user roles and permissions
- **Form Validation Data**: Input validation scenarios
- **Product Data**: E-commerce testing data
- **Order Data**: Transaction testing data
- **Payment Data**: Payment processing scenarios
- **API Test Data**: Endpoint testing configurations
- **Mobile Device Data**: Device specifications
- **Browser Data**: Browser configurations
- **Performance Data**: Performance thresholds
- **Security Payloads**: Security test vectors

### 🎯 Advanced Test Actions
Extended action library:
- **API Calls**: REST/GraphQL requests
- **Screenshots**: Visual capture and comparison
- **Drag & Drop**: Interactive element testing
- **File Operations**: Upload/download testing
- **Network Simulation**: Throttling and offline testing
- **Device Emulation**: Mobile device simulation
- **Storage Testing**: Local/session storage validation
- **Geolocation**: Location-based testing
- **Permissions**: Browser permission testing
- **Notifications**: Push notification testing

### 🔧 Enhanced Configuration
Advanced configuration options:
- **Multi-Browser Support**: Chrome, Firefox, Safari, Edge
- **Device Emulation**: iPhone, Android, iPad, Desktop
- **Network Conditions**: 3G, 4G, WiFi, Offline
- **Performance Monitoring**: Core Web Vitals tracking
- **Security Scanning**: Automated vulnerability detection
- **Accessibility Auditing**: WCAG compliance checking

## 📊 Reports

The framework generates comprehensive reports including:

- **HTML Report**: Interactive report with detailed test results
- **Screenshots**: Automatic screenshots for failed tests
- **Videos**: Recorded test execution videos
- **JSON Report**: Machine-readable test results
- **CSV Report**: Spreadsheet-compatible results

### Report Features

- 📈 Test summary with pass/fail rates
- 🔍 Detailed test case information
- 📸 Screenshots for failed tests
- 🎥 Video recordings of test execution
- 📝 Console logs and error messages
- 🎯 Interactive test result exploration

## 🏗️ Architecture

```
src/
├── analyzer/          # Website analysis components
├── ai/               # Gemini AI integration
├── config/           # Configuration management
├── generator/        # Test case generation
├── python/           # Python implementation
├── reporter/         # Report generation
├── runner/           # Playwright test execution
├── types/            # TypeScript type definitions
└── main.ts           # Main application entry point
```

## 🔧 Advanced Usage

### Custom Test Generation

You can customize the AI prompt for test generation by modifying the `GeminiService` class:

```typescript
// Customize the test generation prompt
private buildTestGenerationPrompt(analysis: WebsiteAnalysis): string {
  // Add your custom logic here
  return customPrompt;
}
```

### Adding Custom Test Types

Extend the `TestGenerator` class to add new test types:

```typescript
private generateCustomTests(analysis: WebsiteAnalysis): TestCase[] {
  // Implement your custom test generation logic
  return customTestCases;
}
```

### Custom Report Templates

Modify the `TestReporter` class to customize report generation:

```typescript
private generateHTMLReport(testSuite: TestSuite): string {
  // Customize your HTML report template
  return customHTMLTemplate;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: GEMINI_API_KEY is required
   ```
   Solution: Set your Gemini API key in environment variables or config file

2. **Browser Installation Issues**
   ```
   Error: Browser not found
   ```
   Solution: Run `npx playwright install` or `playwright install`

3. **Timeout Errors**
   ```
   Error: Timeout waiting for element
   ```
   Solution: Increase timeout values in configuration

4. **Memory Issues**
   ```
   Error: Out of memory
   ```
   Solution: Reduce `max_test_cases` or enable headless mode

### Debug Mode

Enable debug mode for detailed logging:

```bash
# TypeScript version
DEBUG=true npm run start

# Python version
python src/python/main.py --url https://example.com --debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) for browser automation
- [Google Gemini AI](https://ai.google.dev/) for intelligent test generation
- [Rich](https://rich.readthedocs.io/) for beautiful console output
- [Commander.js](https://github.com/tj/commander.js) for CLI interface

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting section

---

**Made with ❤️ for the automation testing community**
