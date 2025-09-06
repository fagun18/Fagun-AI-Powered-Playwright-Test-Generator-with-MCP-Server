#!/bin/bash

# Fagun Automation Framework Installation Script

set -e

echo "🚀 Installing Fagun Automation Framework..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    echo "Visit: https://python.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Python version: $(python3 --version)"

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Playwright browsers
echo ""
echo "🌐 Installing Playwright browsers..."
npx playwright install
playwright install

# Create necessary directories
echo ""
echo "📁 Creating output directories..."
mkdir -p reports screenshots videos logs

# Copy environment file if it doesn't exist
if [ ! -f "config.env" ]; then
    echo ""
    echo "📝 Creating configuration file..."
    cp config.env.example config.env
    echo "✅ Created config.env file"
    echo "⚠️  Please edit config.env and add your GEMINI_API_KEY"
fi

# Make scripts executable
chmod +x src/python/main.py
chmod +x examples/basic-usage.py
chmod +x examples/basic-usage.js

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit config.env and add your GEMINI_API_KEY"
echo "3. Run the framework:"
echo "   - TypeScript: npm run start"
echo "   - Python: python src/python/main.py --url https://example.com"
echo ""
echo "For more information, see README.md"

