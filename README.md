🤖 **Fagun Automated Testing Agent** powered by BrowserUse and Google Gemini LLM.

This project provides comprehensive automated testing capabilities for web applications, including functional testing, security testing, and UI interaction verification with an interactive user interface.

## ✨ Features

### 🎯 **Interactive Testing Interface**
- **API Key Validation**: Automatic detection and validation of Gemini API key
- **User-Friendly Prompts**: Interactive menu system for test configuration
- **Multiple Test Types**: Default scenario or your Custom prompt
- **Dynamic URL Targeting**: Test any website with custom URL input

### 🧪 **Comprehensive Test Coverage**
- **Positive/Negative Functional Tests** (via your prompt)
- **Security Hints**: Basic broken links, page states, error summaries
- **Post-Login UI Interactions**: Navigation, form interactions, content extraction
- **Automated Screenshots**: Visual evidence capture for key states

### 🚀 **Advanced Capabilities**
- **6 Parallel Agents** (Navigator, Auth & Session, Content Extractor, Link Checker, Accessibility, Screenshots & Reporting)
- **Combined Report**: Single HTML with aggregated results for all agents
- **Friendly Steps**: Human-readable action names and descriptions
- **Element Labeling**: Click steps show labels like `Click 'Home' (index: 3)` when available
- **Deep Broken URL Check**: Crawls internal links and checks status codes
- **Grammar Findings**: Optional quick scan on extracted text
- **Secrets Detection**: Highlights likely secrets in extracted content

## 📋 Requirements

- **Python 3.12+**
- **pip** (Python package manager)
- **Google Gemini API key** with access to gemini-2.0-flash
- **Internet connection**
- **Modern web browser** (automatically managed by Playwright)

## 🛠️ Setup

Add your Gemini API key in a `.env` or `config.env` file as `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).

Get a key from: [Google AI Studio](https://aistudio.google.com/)

## 🚀 Usage

Run and follow the on-screen prompts:
```bash
python Fagun.py
```

The run produces a combined HTML report under `reports/` named like `reports/<host>_report_YYYY-MM-DD_HH-MM-SS.html`.

What to look at in the report:
- “Plain-English Summary” at the top explains what we tested and what OK/ERR mean
- “Steps & Actions” shows a timeline of clicks/typing with a Status column
- “Screenshots” shows key states; “Visited URLs” lists pages covered
- “Broken URLs” flags pages that fail quick checks

Agents and responsibilities:
- 1) Navigator: stable navigation, cookie consent, load verification
- 2) Auth & Session: detect login forms (if present), session sanity
- 3) Content Extractor: extract titles, headings, key text blocks
- 4) Link Checker: gather internal links, open a subset, detect 404/500
- 5) Accessibility: quick a11y heuristics (alt text, contrast cues, keyboard traps)
- 6) Screenshots & Reporting: capture meaningful screenshots, summary

<!-- Intentionally simplified: only the basic run command is shown. -->

## 📊 Report Output

Top of report:
- Title: `🧪 Fagun Automation Test Report`
- Summary cards: Total Steps, Total Duration, Unique URLs, Errors
- Task: multi-line block with your exact instructions

Sections:
- **Steps & Actions** (first N rows):
  - Columns: `# | Action | Params | Description | Status`
  - Friendly actions: `Click element`, `Open URL`, `Wait`, `Type into field`, `Extract data`, `Send keys`
  - Element labeling: `Click 'Home' (index: 3)` where available
- **Screenshots**: gallery of key states
- **Visited URLs**: list of unique URLs
- **Broken URLs (deep check)**: internal links status (4xx/5xx highlighted)
- **Grammar Findings**: optional issues in extracted text
- **Errors**: collapsible table with suggestions (timeouts, 404/500, rate limits, not clickable)

Legend in the report:
- `OK` = worked as expected
- `ERR` = step failed (can be a timing/layout shift or a real bug). See Errors section.
- `WARN` = minor/temporary irregularity

Non-technical interpretation:
- If you see many `ERR` on typing/clicking with no user-facing error messages, it’s often due to moving elements or short timeouts
- If `ERR` correspond to server failures (404/500) or form validation messages, treat them as product bugs

## 🔧 Configuration

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional (for advanced configuration)
BROWSER_USE_HEADLESS=true
BROWSER_USE_LOG_LEVEL=WARNING
# Choose alternate providers if configured in code (.env variables for keys)
FAGUN_PROVIDER=google
```

## 🐛 Troubleshooting

### Common Issues
- **Rate limits (429)**: reduce concurrency, stagger runs, or upgrade quota
- **Browser launch failures**: ensure Playwright browsers installed (`playwright install chromium`)
- **Missing dependencies**: re-run `pip install -r requirements.txt`
- **No report generated**: check console output for errors and fix API key/permissions

### OS-specific Notes
- **Windows**: Use PowerShell; if venv activation fails, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- **macOS**: If prompted, install Xcode CLT `xcode-select --install`
- **Linux**: Ensure `python3-venv`; for headless, use `playwright install --with-deps chromium`

## 🧩 Vibetest (Optional)
`Vibetest.py` is included for advanced scenarios, but the primary entrypoint is `Fagun.py`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

