import asyncio
import os
from argparse import ArgumentParser

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from browser_use import Agent

# Reuse existing helpers from Fagun if available
try:
    from Fagun import generate_html_report, check_api_key  # type: ignore
except Exception:
    generate_html_report = None  # Will disable HTML reporting if not present


def build_task(url: str) -> str:
    return f"""
You are a QA agent. Thoroughly sanity-test the website.

1. Use go_to_url to open {url}
2. Extract the title and key headings using extract_structured_data
3. Scroll the page and take at least one screenshot
4. Collect all visible links on the page (limit to first 15) using extract_structured_data
5. For 3-5 links that belong to the same domain, open them in sequence and verify they load
6. If any page fails to load or shows an error pattern (404/500), record it
7. Write a brief summary using write_file to vibetest_summary.txt
8. When done, call done with a short result
"""


async def run_single_agent(agent_id: int, url: str, api_key: str, max_steps: int = 40):
    # First agent can be visible; others headless to avoid contention
    try:
        if agent_id == 1:
            os.environ["BROWSER_USE_HEADLESS"] = "0"
        else:
            os.environ["BROWSER_USE_HEADLESS"] = "1"
    except Exception:
        pass

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.0,
        google_api_key=api_key,
    )

    agent = Agent(
        task=build_task(url),
        llm=llm,
        use_vision=(agent_id == 1),  # vision only for lead agent to reduce screenshot timeouts
    )

    history = await agent.run(max_steps=max_steps)

    report_file = None
    if generate_html_report is not None:
        try:
            report_file = generate_html_report(
                history,
                meta={
                    "target_url": url,
                    "test_type": f"Vibetest Agent #{agent_id}",
                    "task": "Vibetest crawl",
                },
            )
        except Exception:
            report_file = None

    return {
        "agent_id": agent_id,
        "history": history,
        "report": report_file,
    }


async def main():
    parser = ArgumentParser(description="Run multiple BrowserUse agents in parallel (Vibetest)")
    parser.add_argument("--url", required=True, help="Target website to test, e.g., https://example.com")
    parser.add_argument("--agents", type=int, default=3, help="Number of agents to run in parallel (default: 3)")
    parser.add_argument("--max-steps", type=int, default=40, help="Max steps per agent run (default: 40)")
    args = parser.parse_args()

    load_dotenv()
    # Support new GOOGLE_API_KEY with fallback to old GEMINI_API_KEY
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        # If Fagun.check_api_key is available, use it
        try:
            from Fagun import check_api_key as ck  # type: ignore
            api_key = ck()
        except Exception:
            api_key = None

    if not api_key:
        # Try helper from Fagun to prompt/save
        try:
            from Fagun import ensure_google_key  # type: ignore
            api_key = ensure_google_key()
        except Exception:
            api_key = None
    if not api_key:
        print("❌ Google API key not found. Add GOOGLE_API_KEY to your .env and retry.")
        return

    print(f"🚀 Starting vibetest with {args.agents} agents on {args.url}")

    tasks = [
        run_single_agent(i + 1, args.url, api_key, max_steps=args.max_steps)
        for i in range(args.agents)
    ]

    # Slight stagger to reduce contention
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Simple summary
    ok = 0
    reports = []
    for r in results:
        if isinstance(r, Exception):
            msg = str(r)
            if "Page.screenshot: Timeout" in msg:
                print("❌ Agent error: Screenshot timed out. Try fewer agents or headless background.")
            else:
                print(f"❌ Agent error: {msg}")
            continue
        hist = r["history"]
        success = getattr(hist, "is_successful", lambda: None)()
        ok += 1 if success else 0
        if r.get("report"):
            reports.append(r["report"])

    print(f"\n✅ Completed. Successful agents: {ok}/{len(results)}")
    if reports:
        print("📁 Individual reports:")
        for p in reports:
            print(f" - {p}")


if __name__ == "__main__":
    asyncio.run(main())


