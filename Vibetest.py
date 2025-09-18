import asyncio
import os
from argparse import ArgumentParser
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from typing import List
from browser_use import Agent
try:
    # MCP server primitives
    from mcp.server.fastmcp import FastMCP, Tool
except Exception:
    FastMCP = None  # type: ignore
    Tool = None  # type: ignore


def _load_all_envs() -> None:
    try:
        load_dotenv(dotenv_path=Path(".env"), override=False)
    except Exception:
        pass
    try:
        if Path("config.env").exists():
            load_dotenv(dotenv_path=Path("config.env"), override=False)
    except Exception:
        pass


# Try to reuse helpers from Fagun
try:
    from Fagun import (
        generate_html_report,
        generate_combined_html_report,
        build_llm,
        ensure_google_key,
    )
except Exception:
    generate_html_report = None  # type: ignore
    generate_combined_html_report = None  # type: ignore
    build_llm = None  # type: ignore
    ensure_google_key = None  # type: ignore


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


async def run_single_agent(agent_id: int, url: str, provider_key: str, max_steps: int = 40) -> Dict[str, Any]:
	# First agent can be visible; others headless to avoid contention
	try:
		if agent_id == 1:
			os.environ["BROWSER_USE_HEADLESS"] = "0"
		else:
			os.environ["BROWSER_USE_HEADLESS"] = "1"
	except Exception:
		pass

	# Build LLM using Fagun's adapter to ensure provider/model attributes exist
	if build_llm is not None:
		llm = build_llm(provider_key)
		core_llm = getattr(llm, "_core", llm)
	else:
		# Fallback: minimal Google model via env
		from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
		llm = ChatGoogleGenerativeAI(
			model="gemini-2.0-flash",
			temperature=0.0,
			google_api_key=(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""),
		)
		core_llm = llm

	task = build_task(url)

	# Instantiate Agent with compatibility fallbacks
	try:
		agent = Agent(
			task=task,
			llm=llm,
			use_vision=(agent_id == 1),
			max_failures=5,
			llm_timeout=120,
			step_timeout=180,
			page_extraction_llm=core_llm,
		)
	except TypeError:
		try:
			agent = Agent(
				task=task,
				llm=llm,
				use_vision=(agent_id == 1),
				page_extraction_llm=core_llm,
			)
		except TypeError:
			agent = Agent(
				task=task,
				llm=llm,
				use_vision=(agent_id == 1),
			)

	history = await agent.run(max_steps=max_steps)

	report_file: Optional[str] = None
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

	return {"agent_id": agent_id, "history": history, "report": report_file}


async def main():
    parser = ArgumentParser(description="Run multiple BrowserUse agents in parallel (Vibetest)")
	parser.add_argument("--url", required=True, help="Target website to test, e.g., https://example.com")
	parser.add_argument("--agents", type=int, default=3, help="Number of agents to run in parallel (default: 3)")
	parser.add_argument("--max-steps", type=int, default=40, help="Max steps per agent run (default: 40)")
    parser.add_argument("--provider", help="LLM provider key to use (e.g., google, openai, anthropic, groq, ...)")
	args = parser.parse_args()

    _load_all_envs()
	# Provider selection from env; default to google
    provider_key = (args.provider or os.getenv("FAGUN_PROVIDER") or "google").lower()

	# Ensure Google key if provider is google
	if provider_key == "google" and ensure_google_key is not None:
		api_key = ensure_google_key()
		if not api_key:
			print("❌ GOOGLE_API_KEY missing. Add it to .env and retry.")
			return

	print(f"🚀 Starting vibetest with {args.agents} agents on {args.url}")

	tasks = [
		run_single_agent(i + 1, args.url, provider_key, max_steps=args.max_steps)
		for i in range(args.agents)
	]

	results = await asyncio.gather(*tasks, return_exceptions=True)

	# Summaries and optional combined report
	ok = 0
	reports = []
	histories = []
	for r in results:
		if isinstance(r, Exception):
			print(f"❌ Agent error: {str(r)}")
			continue
		hist = r["history"]
		try:
			success = getattr(hist, "is_successful", lambda: None)()
		except Exception:
			success = None
		ok += 1 if success else 0
		histories.append(hist)
		if r.get("report"):
			reports.append(r["report"])

	combined_report_path = None
	if generate_combined_html_report is not None and histories:
		try:
			combined_report_path = generate_combined_html_report(
				histories,
				meta={
					"agents": len(histories),
					"target_url": args.url,
					"task": "Vibetest crawl",
					"roles": [f"Vibetest Agent #{i+1}" for i in range(len(histories))],
					"headless": True,
					"broken_limit": 100,
					"max_pages": 0,
					"max_depth": 0,
				},
			)
		except Exception:
			combined_report_path = None

	print(f"\n✅ Completed. Successful agents: {ok}/{len([x for x in results if not isinstance(x, Exception)])}")
	if reports:
		print("📁 Individual reports:")
		for p in reports:
			print(f" - {p}")
	if combined_report_path:
		print(f"📄 Combined report: {combined_report_path}")


if __name__ == "__main__":
    # If launched as MCP server via env MCP=1, start server instead of CLI app
    if os.getenv("MCP", "0") == "1" and FastMCP is not None:
        app = FastMCP("vibetest")

        @app.tool()
        async def vibetest_run(url: str, agents: int = 3, max_steps: int = 40, provider: str = "google") -> dict:
            """Run multi-agent Browser-Use test and return report path(s).
            - url: Target site (https/http or localhost:port)
            - agents: Number of agents (default 3)
            - max_steps: Max steps per agent (default 40)
            - provider: LLM provider key (default "google")
            """
            _load_all_envs()
            results = await asyncio.gather(
                *[
                    run_single_agent(i + 1, url, provider, max_steps=max_steps)
                    for i in range(max(1, int(agents)))
                ]
            )
            reports: List[str] = []
            histories: List[Any] = []
            for r in results:
                if isinstance(r, Exception):
                    continue
                histories.append(r.get("history"))
                if r.get("report"):
                    reports.append(r["report"])
            combined = None
            if generate_combined_html_report is not None and histories:
                combined = generate_combined_html_report(
                    histories,
                    meta={
                        "agents": len(histories),
                        "target_url": url,
                        "task": "Vibetest MCP run",
                        "roles": [f"Agent #{i+1}" for i in range(len(histories))],
                        "headless": True,
                        "broken_limit": 100,
                        "max_pages": 0,
                        "max_depth": 0,
                    },
                )
            return {"reports": reports, "combined": combined}

        app.run()
    else:
        asyncio.run(main())


