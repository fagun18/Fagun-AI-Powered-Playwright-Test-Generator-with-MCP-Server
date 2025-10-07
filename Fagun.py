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
import sys
import logging

# Set UTF-8 encoding for Windows console
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Disable telemetry before importing browser-use
os.environ["BROWSER_USE_TELEMETRY"] = "false"
os.environ["BROWSER_USE_DISABLE_TELEMETRY"] = "true"
os.environ["BROWSER_USE_NO_TELEMETRY"] = "true"
os.environ["DISABLE_TELEMETRY"] = "true"
os.environ["NO_TELEMETRY"] = "true"

# Configure logging to suppress telemetry messages and handle Unicode
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logging.getLogger("browser_use").setLevel(logging.WARNING)
logging.getLogger("posthog").setLevel(logging.WARNING)

from dotenv import load_dotenv
load_dotenv()
import argparse
from src.webui.interface import theme_map, create_ui


def find_free_port(start_port=8080, max_attempts=10):
    """Find a free port starting from start_port."""
    import socket
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

def main():
    parser = argparse.ArgumentParser(description="Gradio WebUI for Browser Agent")
    parser.add_argument("--ip", type=str, default="127.0.0.1", help="IP address to bind to")
    parser.add_argument("--port", type=int, default=0, help="Port to listen on (0 for auto)")
    parser.add_argument("--theme", type=str, default="Ocean", choices=theme_map.keys(), help="Theme to use for the UI")
    args = parser.parse_args()

    # Find a free port if not specified or if 0
    if args.port == 0:
        port = find_free_port()
        if port is None:
            print("❌ Error: Could not find a free port. Please specify a port manually.")
            return
        print(f"🔍 Using port: {port}")
    else:
        port = args.port

    demo = create_ui(theme_name=args.theme)
    try:
        demo.queue().launch(server_name=args.ip, server_port=port, share=True, inbrowser=True)
    except OSError as e:
        if "Cannot find empty port" in str(e):
            print(f"❌ Port {port} is busy. Trying to find another port...")
            port = find_free_port(port + 1)
            if port:
                print(f"🔍 Using alternative port: {port}")
                demo.queue().launch(server_name=args.ip, server_port=port, share=True, inbrowser=True)
            else:
                print("❌ Error: Could not find any free port. Please try a different port manually.")
        else:
            raise e


if __name__ == '__main__':
    main()
