# BrowserUse-Automated-Testing-Agent


Automated browser testing and UI verification using BrowserUse and Gemini LLM.
This project allows testing of login flows, post-login UI interactions, and other functional and security test cases.

Features:

Positive and negative functional test cases

Automatic extraction of success/failure messages

Post-login 

Integration with Google Gemini LLM for intelligent automation

Async execution with Python asyncio

Requirements

Python 3.12+

pip (Python package manager)

Google Gemini API key with access to gemini-2.0-flash

Internet connection

Installation

Clone this repository:

git clone https://github.com/somadey201/BrowserUse-Automated-Testing-Agent.git
cd browseruse-agent


Create and activate a Python virtual environment:

python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate


Install dependencies:

pip install -r requirements.txt


Create a .env file in the project root with your Gemini API key:

GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

Usage

Run the automated test script:

python FirstTest.py


The script will:

Navigate to the login page

Perform positive login tests

(Optional) Perform negative login tests
