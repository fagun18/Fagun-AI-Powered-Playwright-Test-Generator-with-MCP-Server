"""
🤖 Fagun Browser Automation Testing Agent
==========================================

A powerful, intelligent browser automation tool that performs comprehensive website testing.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/

This tool provides AI-powered browser automation capabilities for comprehensive website testing.
"""

import os
import logging

# Disable telemetry before importing browser-use
os.environ["BROWSER_USE_TELEMETRY"] = "false"
os.environ["BROWSER_USE_DISABLE_TELEMETRY"] = "true"
os.environ["BROWSER_USE_NO_TELEMETRY"] = "true"
os.environ["DISABLE_TELEMETRY"] = "true"
os.environ["NO_TELEMETRY"] = "true"

# Configure logging to suppress telemetry messages
logging.getLogger("browser_use").setLevel(logging.WARNING)
logging.getLogger("posthog").setLevel(logging.WARNING)

from dotenv import load_dotenv
load_dotenv()
import argparse
from src.webui.interface import theme_map, create_ui


def main():
    parser = argparse.ArgumentParser(description="Gradio WebUI for Browser Agent")
    parser.add_argument("--ip", type=str, default="127.0.0.1", help="IP address to bind to")
    parser.add_argument("--port", type=int, default=7788, help="Port to listen on")
    parser.add_argument("--theme", type=str, default="Ocean", choices=theme_map.keys(), help="Theme to use for the UI")
    args = parser.parse_args()

    demo = create_ui(theme_name=args.theme)
    demo.queue().launch(server_name=args.ip, server_port=args.port)


if __name__ == '__main__':
    main()
