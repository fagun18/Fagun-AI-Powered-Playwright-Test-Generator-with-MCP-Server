import asyncio
import os
import sys
import logging
# Suppress telemetry/info logs
os.environ["ANONYMIZED_TELEMETRY"] = "false"
logging.basicConfig(level=logging.WARNING, force=True)
logging.getLogger().setLevel(logging.WARNING)
logging.getLogger("browser_use").setLevel(logging.WARNING)
logging.getLogger("langchain_google_genai").setLevel(logging.ERROR)
logging.getLogger("browser_use.agent.service").setLevel(logging.ERROR)

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from colorama import init as colorama_init, Fore, Style
from datetime import datetime
from pathlib import Path
import json
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from argparse import ArgumentParser
import subprocess
import requests

try:
	import language_tool_python
	GRAMMAR_TOOL = language_tool_python.LanguageTool('en-US')
except Exception:
	GRAMMAR_TOOL = None

# Import after logging is configured
from browser_use import Agent


def _read_env_file_lines(env_path: Path) -> List[str]:
    try:
        return env_path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []
    except Exception:
        return []

def _write_env_key(env_path: Path, key: str, value: str) -> None:
    lines = _read_env_file_lines(env_path)
    key_prefix = f"{key}="
    updated = False
    new_lines: List[str] = []
    for line in lines:
        if line.strip().startswith(f"#"):
            new_lines.append(line)
            continue
        if line.startswith(key_prefix):
            new_lines.append(f"{key}={value}")
            updated = True
        else:
            new_lines.append(line)
    if not updated:
        new_lines.append(f"{key}={value}")
    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

def _prompt_for_api_key() -> Optional[str]:
    print("❌ Gemini API key not found.")
    print("Get one from: https://aistudio.google.com/")
    try:
        entered = input("➤ Enter your GEMINI_API_KEY (leave empty to cancel): ").strip()
    except EOFError:
        entered = ""
    except KeyboardInterrupt:
        print("\n")
        entered = ""
    return entered or None

def _looks_like_gemini_key(value: str) -> bool:
    # Most Google API keys start with AIza; allow others but prefer this
    return len(value) >= 20 and (value.startswith("AIza") or value.startswith("AI"))

def _validate_api_key_quick(api_key: str) -> bool:
    try:
        llm_test = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.0,
            google_api_key=api_key,
        )
        # Minimal no-op ping
        _ = llm_test.invoke("ping")
        return True
    except Exception as ex:
        msg = str(ex)
        if "API key not valid" in msg or "API_KEY_INVALID" in msg:
            return False
        # For network or transient errors, don't block startup here
        return True

def ensure_gemini_api_key() -> str:
    """Ensure GEMINI_API_KEY exists; prompt and persist to .env if missing or invalid."""
    load_dotenv()
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()

    if not api_key or api_key.lower() in {"your_api_key_here", "changeme"}:
        entered = _prompt_for_api_key()
        if not entered:
            print("❌ No API key provided. Exiting.")
            sys.exit(1)
        api_key = entered
        # Persist
        env_path = Path(".env")
        _write_env_key(env_path, "GEMINI_API_KEY", api_key)
        os.environ["GEMINI_API_KEY"] = api_key
        print("✅ API key saved to .env")

    # Quick sanity check; if clearly invalid, allow user to re-enter once
    if not _validate_api_key_quick(api_key):
        print("❌ The provided API key appears invalid (API_KEY_INVALID).")
        entered = _prompt_for_api_key()
        if not entered:
            print("❌ No new API key provided. Exiting.")
            sys.exit(1)
        api_key = entered.strip()
        env_path = Path(".env")
        _write_env_key(env_path, "GEMINI_API_KEY", api_key)
        os.environ["GEMINI_API_KEY"] = api_key
        print("✅ Updated API key saved to .env")

    if not _looks_like_gemini_key(api_key):
        print("⚠️ The API key format looks unusual. Proceeding anyway.")

    return api_key

def print_banner():
	colorama_init(autoreset=True)
	ascii_banner = (
		"    ______                           ___         __                        __           __   ______          __  _                ___                    __ \n"
		"   / ____/___ _____ ___  ______     /   | __  __/ /_____  ____ ___  ____ _/ /____  ____/ /  /_  __/__  _____/ /_(_)___  ____ _   /   | ____ ____  ____  / /_\n"
		"  / /_  / __ `/ __ `/ / / / __ \\   / /| |/ / / / __/ __ \\/ __ `__ \\/ __ `/ __/ _ \\/ __  /    / / / _ \\/ ___/ __/ / __ \\/ __ `/  / /| |/ __ `/ _ \\/ __ \\/ __/\n"
		" / __/ / /_/ / /_/ / /_/ / / / /  / ___ / /_/ / /_/ /_/ / / / / / / /_/ / /_/  __/ /_/ /    / / /  __(__  ) /_/ / / / / /_/ /  / ___ / /_/ /  __/ / / / /_  \n"
		"/_/    \\__,_/\\__, /\\__,_/_/ /_/  /_/  |_\\__,_/\\__/\\____/_/ /_/ /_/\\__,_/\\__/\\___/\\__,_/    /_/  \\___/____/\\__/_/_/ /_/\\__, /  /_/  |_\\__, /\\___/_/ /_/\\__/  \n"
		"            /____/                                                                                                   /____/         /____/                  \n"
	)
	print(Fore.CYAN + ascii_banner + Style.RESET_ALL)
	title = f"{Fore.CYAN}{Style.BRIGHT}Fagun Automated Testing Agent{Style.RESET_ALL}"
	subtitle = f"{Fore.MAGENTA}Build by Mejbaur Bahar Fagun(@https://www.linkedin.com/in/mejbaur/)\nSoftware Engineer in Test{Style.RESET_ALL}"
	bar = f"{Fore.BLUE}{'=' * 60}{Style.RESET_ALL}"
	robot = f"{Fore.YELLOW}🤖{Style.RESET_ALL}"
	print(bar)
	print(f"{robot}  {title}")
	print(f"   {subtitle}")
	print(bar)

def safe_get(attr_getter, default=None):
    try:
        return attr_getter()
    except Exception:
        return default

def generate_html_report(history, meta):
    """Generate a colorful, modern HTML report with summary, steps, and screenshots."""
    # Prepare directories
    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = reports_dir / f"report_{timestamp}.html"

    # Collect data safely from history
    total_steps = safe_get(lambda: history.number_of_steps(), 0)
    duration = safe_get(lambda: history.total_duration_seconds(), 0.0)
    urls = safe_get(lambda: history.urls(), []) or []
    errors = safe_get(lambda: history.errors(), []) or []
    extracted = safe_get(lambda: history.extracted_content(), []) or []
    final_result = safe_get(lambda: history.final_result(), "") or ""
    thoughts = safe_get(lambda: history.model_thoughts(), []) or []
    actions = safe_get(lambda: history.model_actions(), []) or []
    action_results = safe_get(lambda: history.action_results(), []) or []
    action_history = safe_get(lambda: history.action_history(), []) or []

    # Screenshots (paths or base64 list)
    screenshots = safe_get(lambda: history.screenshot_paths(), None)
    if screenshots is None:
        screenshots = safe_get(lambda: history.screenshots(), []) or []
        is_base64 = True
    else:
        is_base64 = False

    # Build HTML
    css = """
    :root { --bg:#0f172a; --panel:#111827; --text:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; --ok:#22c55e; --warn:#f59e0b; --err:#ef4444; }
    *{box-sizing:border-box} body{margin:0;background:linear-gradient(135deg,#0f172a,#111827);font-family:Inter,Segoe UI,Roboto,Arial;color:var(--text)}
    .wrap{max-width:1100px;margin:32px auto;padding:0 20px}
    .hero{background:linear-gradient(90deg,#22d3ee33,#a855f733);border:1px solid #334155;border-radius:16px;padding:24px 28px;backdrop-filter:blur(6px)}
    .hero h1{margin:0 0 4px 0;font-size:28px}
    .hero p{margin:0;color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
    .card{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:14px}
    .card h3{margin:0 0 8px 0;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
    .big{font-size:22px;font-weight:700}
    .ok{color:var(--ok)} .warn{color:var(--warn)} .err{color:var(--err)} .acc{color:var(--accent)}
    .section{margin:26px 0}
    .section h2{margin:0 0 10px 0;font-size:18px;border-left:4px solid var(--accent);padding-left:10px}
    table{width:100%;border-collapse:separate;border-spacing:0;background:#0b1220;border:1px solid #334155;border-radius:12px;overflow:hidden}
    th,td{padding:10px 12px;border-bottom:1px solid #1f2937;font-size:14px}
    th{background:#0f172a;color:#cbd5e1;text-align:left}
    tr:last-child td{border-bottom:none}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid #334155;color:#cbd5e1}
    .shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .shot{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:8px}
    .shot img{width:100%;border-radius:8px;display:block}
    .footer{margin:30px 0;color:#64748b;font-size:13px;text-align:center}
    code{background:#0b1220;border:1px solid #334155;border-radius:6px;padding:2px 6px}
    .clickable{cursor:pointer}
    details{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:10px 14px}
    summary{cursor:pointer;color:#e2e8f0}
    """

    # Steps table rows (user-friendly labeling)
    step_rows = []
    for i in range(max(len(action_history), len(actions))):
        ah = action_history[i] if i < len(action_history) else {}
        act = actions[i] if i < len(actions) else {}
        err = errors[i] if i < len(errors) else None
        goal = ah.get('goal') if isinstance(ah, dict) else ""
        name = ""
        params = ""
        if isinstance(act, dict) and act:
            # act like {"action_name": {params}}
            try:
                name = list(act.keys())[0]
                params = json.dumps(act.get(name), ensure_ascii=False)
            except Exception:
                name = str(act)
                params = ""
        status = "OK" if err in (None, "", False) else "ERR"
        # Friendly names for common actions
        friendly = {
            "click_element": "Click element",
            "click_element_by_index": "Click element",
            "input_text": "Type into field",
            "go_to_url": "Open URL",
            "wait": "Wait",
            "extract_structured_data": "Extract data",
            "send_keys": "Send keys",
        }
        display_name = friendly.get(name, name)
        step_rows.append(f"<tr><td>{i+1}</td><td>{goal or ''}</td><td><span class='pill'>{display_name}</span></td><td><code>{params}</code></td><td class='{"ok" if status=='OK' else 'err'}'>{status}</td></tr>")

    # Screenshots gallery
    shot_items = []
    for s in (screenshots or [])[:9]:
        if is_base64:
            shot_items.append(f"<div class='shot'><img src='data:image/png;base64,{s}' alt='screenshot'/></div>")
        else:
            # Ensure relative path string
            spath = str(s)
            shot_items.append(f"<div class='shot'><img src='{spath}' alt='screenshot'/></div>")

    # Errors list with suggestions
    error_rows = []
    for idx, e in enumerate(errors or []):
        if e:
            msg = str(e)
            suggestion = ""
            if "timeout" in msg.lower():
                suggestion = "Try increasing wait times, ensure network stability, or add an explicit wait."
            elif "404" in msg:
                suggestion = "Broken link detected. Verify the URL or remove/update the reference."
            elif "500" in msg:
                suggestion = "Server error. Check server logs or retry later; report to the backend team."
            elif "rate limit" in msg.lower() or "429" in msg:
                suggestion = "Reduce concurrency, stagger requests, or upgrade quota/plan."
            elif "not clickable" in msg.lower():
                suggestion = "Wait for element to be interactable, scroll into view, or use keyboard navigation."
            error_rows.append(f"<tr><td>{idx+1}</td><td class='err'>{msg}<br/><span class='pill'>Suggestion:</span> {suggestion}</td></tr>")

    html = f"""
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Fagun Automated Testing Agent</title>
      <style>{css}</style>
    </head>
    <body>
      <div class="wrap">
        <div class="hero">
          <h1>🧪 Automated Test Report</h1>
          <p>Task: <code>{meta.get('task','')}</code></p>
          <p>Run at: {timestamp} · Target: <code>{meta.get('target_url','')}</code></p>
        </div>

        <div class="grid">
          <div class="card"><h3>Total Steps</h3><div class="big acc">{total_steps}</div></div>
          <div class="card"><h3>Duration</h3><div class="big">{duration:.2f}s</div></div>
          <div class="card"><h3>URLs Visited</h3><div class="big">{len(urls)}</div></div>
          <div class="card"><h3>Errors</h3><div class="big {'err' if any(errors) else 'ok'}">{len([e for e in errors if e])}</div></div>
        </div>

        <div class="section">
          <h2>Final Result</h2>
          <div class="card">{final_result or 'No final result returned.'}</div>
        </div>

        <div class="section">
          <h2>Steps & Actions</h2>
          <table>
            <thead><tr><th>#</th><th>Goal</th><th>Action</th><th>Params</th><th>Status</th></tr></thead>
            <tbody>
              {''.join(step_rows) if step_rows else '<tr><td colspan="5">No step history available.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Screenshots</h2>
          <div class="shots">{''.join(shot_items) if shot_items else '<div class="card">No screenshots available.</div>'}</div>
        </div>

        <div class="section">
          <details open>
            <summary><h2 class="clickable" style="display:inline">Errors</h2></summary>
            <table>
              <thead><tr><th>#</th><th>Message</th></tr></thead>
              <tbody>
                {''.join(error_rows) if error_rows else '<tr><td colspan="2">No errors recorded.</td></tr>'}
              </tbody>
            </table>
          </details>
        </div>

        <div class="section">
          <h2>Visited URLs</h2>
          <div class="card">
            {''.join(f'<div>• <a href="{u}" style="color:var(--accent)">{u}</a></div>' for u in urls) if urls else 'None'}
          </div>
        </div>

        <div class="footer">Generated by BrowserUse Agent · {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
      </div>
    </body>
    </html>
    """

    report_path.write_text(html, encoding="utf-8")
    return str(report_path)

def generate_combined_html_report(histories: List[Any], meta: Dict[str, Any]) -> str:
	"""Generate one consolidated HTML report across multiple agents."""
	reports_dir = Path("reports")
	reports_dir.mkdir(parents=True, exist_ok=True)
	timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
	# Use target host in filename
	target = meta.get('target_url', '') or ''
	try:
		from urllib.parse import urlparse as _urlparse
		host = (_urlparse(target).netloc or 'target').replace(':', '_').replace('/', '_')
	except Exception:
		host = 'target'
	report_path = reports_dir / f"{host}_report_{timestamp}.html"

	# Aggregate metrics
	total_steps = 0
	duration = 0.0
	all_urls: List[str] = []
	all_errors: List[Any] = []
	all_extracted: List[Any] = []
	all_actions: List[Any] = []
	all_action_history: List[Any] = []
	screenshots_any: List[Any] = []
	is_base64 = False

	# Optional: load generated test cases if present
	test_cases_path = reports_dir / "test_cases.json"
	test_cases: List[Dict[str, Any]] = []
	try:
		if test_cases_path.exists():
			data = test_cases_path.read_text(encoding="utf-8")
			parsed = json.loads(data)
			if isinstance(parsed, list):
				test_cases = parsed
	except Exception:
		pass

	for h in histories:
		# Safe getters
		total_steps += safe_get(lambda: h.number_of_steps(), 0) or 0
		d = safe_get(lambda: h.total_duration_seconds(), 0.0) or 0.0
		duration += d
		urls = safe_get(lambda: h.urls(), []) or []
		all_urls.extend(urls)
		errors = safe_get(lambda: h.errors(), []) or []
		all_errors.extend(errors)
		extracted = safe_get(lambda: h.extracted_content(), []) or []
		all_extracted.extend(extracted)
		acts = safe_get(lambda: h.model_actions(), []) or []
		all_actions.extend(acts)
		ah = safe_get(lambda: h.action_history(), []) or []
		all_action_history.extend(ah)
		shots = safe_get(lambda: h.screenshot_paths(), None)
		if shots is None:
			shots = safe_get(lambda: h.screenshots(), []) or []
			is_base64 = True
		screenshots_any.extend(shots)

	# Deduplicate urls
	seen = set()
	dedup_urls = []
	for u in all_urls:
		if u not in seen:
			seen.add(u)
			dedup_urls.append(u)

	# Build element labels map before rows
	labels_map = _collect_element_labels(all_action_history, all_actions, all_action_history)

	css = """
	:root { --bg:#0f172a; --panel:#111827; --text:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; --ok:#22c55e; --warn:#f59e0b; --err:#ef4444; }
	*{box-sizing:border-box} body{margin:0;background:linear-gradient(135deg,#0f172a,#111827);font-family:Inter,Segoe UI,Roboto,Arial;color:var(--text)}
	.wrap{max-width:1100px;margin:32px auto;padding:0 20px}
	.hero{background:linear-gradient(90deg,#22d3ee33,#a855f733);border:1px solid #334155;border-radius:16px;padding:24px 28px;backdrop-filter:blur(6px)}
	.hero h1{margin:0 0 4px 0;font-size:28px}
	.hero p{margin:0;color:var(--muted)}
	.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
	.card{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:14px}
	.card h3{margin:0 0 8px 0;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
	.big{font-size:22px;font-weight:700}
	.ok{color:var(--ok)} .warn{color:var(--warn)} .err{color:var(--err)} .acc{color:var(--accent)}
	.section{margin:26px 0}
	.section h2{margin:0 0 10px 0;font-size:18px;border-left:4px solid var(--accent);padding-left:10px}
	table{width:100%;border-collapse:separate;border-spacing:0;background:#0b1220;border:1px solid #334155;border-radius:12px;overflow:hidden}
	th,td{padding:10px 12px;border-bottom:1px solid #1f2937;font-size:14px}
	th{background:#0f172a;color:#cbd5e1;text-align:left}
	tr:last-child td{border-bottom:none}
	.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid #334155;color:#cbd5e1}
	.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
	.shot{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:8px}
	.shot img{width:100%;border-radius:8px;display:block}
	.footer{margin:30px 0;color:#64748b;font-size:13px;text-align:center}
	code{background:#0b1220;border:1px solid #334155;border-radius:6px;padding:2px 6px}
	pre{background:#0b1220;border:1px solid #334155;border-radius:8px;padding:12px;white-space:pre-wrap}
	.clickable{cursor:pointer}
	"""

	# Build limited steps table (first 50 rows for readability)
	rows = []
	max_rows = min(50, max(len(all_action_history), len(all_actions)))
	for i in range(max_rows):
		ah = all_action_history[i] if i < len(all_action_history) else {}
		act = all_actions[i] if i < len(all_actions) else {}
		err = all_errors[i] if i < len(all_errors) else None
		goal = ah.get('goal') if isinstance(ah, dict) else ""
		name = ""
		params = ""
		if isinstance(act, dict) and act:
			try:
				name = list(act.keys())[0]
				params = json.dumps(act.get(name), ensure_ascii=False)
			except Exception:
				name = str(act)
				params = ""
		status = "OK" if err in (None, "", False) else "ERR"
		friendly = {
			"click_element": "Click element",
			"click_element_by_index": "Click element",
			"input_text": "Type into field",
			"go_to_url": "Open URL",
			"wait": "Wait",
			"extract_structured_data": "Extract data",
			"send_keys": "Send keys",
		}
		display_name = friendly.get(name, name)
		# Build a simple human description
		desc = ""
		try:
			pp = json.loads(params) if params else {}
		except Exception:
			pp = {}
		if name in ("click_element", "click_element_by_index"):
			idx = pp.get("index")
			label = labels_map.get(int(idx)) if isinstance(idx, int) or (isinstance(idx, str) and idx.isdigit()) else None
			desc = f"Click '{label}' (index: {idx})" if label else (f"Click UI element #{idx}" if idx is not None else "Click element")
		elif name == "go_to_url":
			url = pp.get("url")
			desc = f"Open {url}" if url else "Open URL"
		elif name == "wait":
			sec = pp.get("seconds")
			desc = f"Wait {sec} seconds" if sec is not None else "Wait"
		elif name == "input_text":
			txt = pp.get("text")
			desc = f"Type '{str(txt)[:30]}...'" if txt else "Type into field"
		elif name == "extract_structured_data":
			q = pp.get("query") if isinstance(pp, dict) else None
			desc = f"Extract data ({q})" if q else "Extract data"
		# Append goal hint
		if goal:
			desc = f"{desc} – {goal}" if desc else goal

		rows.append(f"<tr><td>{i+1}</td><td><span class='pill'>{display_name}</span></td><td><code>{params}</code></td><td>{desc}</td><td class='{"ok" if status=='OK' else 'err'}'>{status}</td></tr>")

	# Screenshots (limit 12)
	shot_items = []
	for s in (screenshots_any or [])[:12]:
		if is_base64:
			shot_items.append(f"<div class='shot'><img src='data:image/png;base64,{s}' alt='screenshot'/></div>")
		else:
			shot_items.append(f"<div class='shot'><img src='{str(s)}' alt='screenshot'/></div>")

	# Basic broken URL check (limit configurable)
	broken_rows = []
	broken_limit = int(meta.get('broken_limit', 100) or 100)
	for u in dedup_urls[:broken_limit]:
		try:
			r = requests.head(u, timeout=6, allow_redirects=True)
			if r.status_code >= 400:
				broken_rows.append(f"<tr><td>{u}</td><td class='err'>{r.status_code}</td></tr>")
		except Exception as ex:
			broken_rows.append(f"<tr><td>{u}</td><td class='err'>ERR: {str(ex)[:80]}</td></tr>")

	# Grammar quick pass on last extracted content
	grammar_items = []
	if GRAMMAR_TOOL and all_extracted:
		sample_text = "\n".join([str(x) for x in all_extracted[-3:]])[:2000]
		try:
			matches = GRAMMAR_TOOL.check(sample_text)
			for m in matches[:20]:
				grammar_items.append(f"<tr><td>{m.context[:80]}</td><td>{m.ruleId}</td><td class='warn'>{m.message}</td></tr>")
		except Exception:
			pass

	pretty_task = meta.get('task', '') or ''

	# Summaries for test cases
	case_count = len(test_cases)
	by_field: Dict[str, int] = {}
	by_category: Dict[str, int] = {}
	if test_cases:
		for c in test_cases:
			field = str(c.get('field', 'unknown')).strip().lower() or 'unknown'
			cat = str(c.get('category', 'misc')).strip().lower() or 'misc'
			by_field[field] = by_field.get(field, 0) + 1
			by_category[cat] = by_category.get(cat, 0) + 1

	def _kv_table(d: Dict[str, int]) -> str:
		if not d:
			return '<div class="card">No data.</div>'
		rows = ''.join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in sorted(d.items()))
		return f"<table><thead><tr><th>Key</th><th>Count</th></tr></thead><tbody>{rows}</tbody></table>"

	html = f"""
	<!doctype html>
	<html lang=\"en\">
	<head>
	  <meta charset=\"utf-8\"/>
	  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>
	  <title>Fagun Automated Testing Agent</title>
	  <style>{css}</style>
	</head>
	<body>
	  <div class=\"wrap\">
		<div class=\"hero\">
		  <h1>🧪 Fagun Automation Test Report</h1>
		  <p>Agents: {meta.get('agents', 1)} · Target: <code>{meta.get('target_url','')}</code> · Run at: {timestamp}</p>
		  <p>Task:</p>
		  <pre>{pretty_task}</pre>
		</div>

		<div class=\"grid\">
		  <a href=\"#steps\" style=\"text-decoration:none\"><div class=\"card\"><h3>Total Steps</h3><div class=\"big acc\">{total_steps}</div></div></a>
		  <a href=\"#steps\" style=\"text-decoration:none\"><div class=\"card\"><h3>Total Duration</h3><div class=\"big\">{duration:.2f}s</div></div></a>
		  <a href=\"#urls\" style=\"text-decoration:none\"><div class=\"card\"><h3>Unique URLs</h3><div class=\"big\">{len(dedup_urls)}</div></div></a>
		  <a href=\"#errors\" style=\"text-decoration:none\"><div class=\"card\"><h3>Errors</h3><div class=\"big {'err' if any(all_errors) else 'ok'}\">{len([e for e in all_errors if e])}</div></div></a>
		</div>

		<div class=\"section\" id=\"steps\">
		  <h2>Steps & Actions (first {max_rows})</h2>
		  <table>
			<thead><tr><th>#</th><th>Action</th><th>Params</th><th>Description</th><th>Status</th></tr></thead>
			<tbody>
			  {''.join(rows) if rows else '<tr><td colspan="5">No step history available.</td></tr>'}
			</tbody>
		  </table>
		</div>

		<div class=\"section\">
		  <h2>Screenshots</h2>
		  <div class=\"shots\">{''.join(shot_items) if shot_items else '<div class=\"card\">No screenshots available.</div>'}</div>
		</div>

		<div class=\"section\" id=\"urls\">
		  <h2>Visited URLs</h2>
		  <div class=\"card\">
			{''.join(f'<div>• <a href=\"{u}\" style=\"color:var(--accent)\">{u}</a></div>' for u in dedup_urls) if dedup_urls else 'None'}
		  </div>
		</div>

		<div class=\"section\" id=\"broken\">
		  <details open>
			<summary><h2 class=\"clickable\" style=\"display:inline\">Broken URLs (quick check)</h2></summary>
			<table>
			  <thead><tr><th>URL</th><th>Status</th></tr></thead>
			  <tbody>
				{''.join(broken_rows) if broken_rows else '<tr><td colspan=\"2\">None detected (limited check)</td></tr>'}
			  </tbody>
			</table>
		  </details>
		</div>

		<div class=\"section\" id=\"grammar\">
		  <details>
			<summary><h2 class=\"clickable\" style=\"display:inline\">Grammar Findings</h2></summary>
			<table>
			  <thead><tr><th>Context</th><th>Rule</th><th>Message</th></tr></thead>
			  <tbody>
				{''.join(grammar_items) if grammar_items else '<tr><td colspan=\"3\">No grammar issues or grammar tool unavailable.</td></tr>'}
			  </tbody>
			</table>
		  </details>
		</div>

		<div class=\"section\" id=\"cases\">
		  <details open>
			<summary><h2 class=\"clickable\" style=\"display:inline\">Test Case Summary ({case_count})</h2></summary>
			<div class=\"grid\">
			  <div class=\"card\"><h3>Total Cases</h3><div class=\"big acc\">{case_count}</div></div>
			  <div class=\"card\"><h3>Fields Covered</h3><div class=\"big\">{len(by_field)}</div></div>
			  <div class=\"card\"><h3>Categories</h3><div class=\"big\">{len(by_category)}</div></div>
			  <div class=\"card\"><h3>Cases File</h3><div>reports/test_cases.json</div></div>
			</div>
			<h3>By Field</h3>
			{_kv_table(by_field)}
			<h3>By Category</h3>
			{_kv_table(by_category)}
			{('<div class=\"card\">No test cases found.</div>' if case_count == 0 else '')}
		  </details>
		</div>

		<div class=\"footer\">Generated by Fagun Agent · {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
	  </div>
	</body>
	</html>
	"""

	report_path.write_text(html, encoding="utf-8")
	return str(report_path)

def _collect_element_labels(all_action_history: List[Any], all_actions: List[Any], all_action_results: List[Any]) -> Dict[int, str]:
	"""Best-effort map from element index to a human-friendly label using any available page state snapshots."""
	labels: Dict[int, str] = {}
	candidates = []
	for container in (all_action_history or []):
		if isinstance(container, dict):
			for key, val in container.items():
				if isinstance(val, list):
					candidates.append(val)
	for container in (all_action_results or []):
		if isinstance(container, dict):
			for key, val in container.items():
				if isinstance(val, list):
					candidates.append(val)
	# Also scan actions themselves in case they carry element snapshots
	for container in (all_actions or []):
		if isinstance(container, dict):
			for key, val in container.items():
				if isinstance(val, list):
					candidates.append(val)

	def _label_from_item(item: Any) -> Optional[tuple[int, str]]:
		if not isinstance(item, dict):
			return None
		idx = item.get('index')
		if idx is None:
			return None
		text = (item.get('text') or item.get('innerText') or item.get('title') or item.get('aria_label') or '').strip()
		role = (item.get('role') or item.get('tag') or '').lower().strip()
		if text:
			label = text
		elif role:
			label = role
		else:
			label = f"element #{idx}"
		try:
			idx_int = int(idx)
		except Exception:
			return None
		return (idx_int, label)

	for lst in candidates:
		for it in lst:
			pair = _label_from_item(it)
			if pair:
				idx, label = pair
				labels.setdefault(idx, label)
	return labels

def get_user_input():
    """Get test configuration from user"""
    print_banner()
    
    # Get target URL
    try:
        target_url = input(f"{Fore.GREEN}➤ Enter the target URL to test{Style.RESET_ALL} {Fore.BLACK}{Style.DIM}(press Enter for default){Style.RESET_ALL}: ").strip()
    except EOFError:
        target_url = ""
    if not target_url:
        target_url = "https://fagun.sqatesting.com/"
    
    # Get test type with validation (only 2 options now)
    while True:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}Select test type:{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}1{Style.RESET_ALL}. Default")
        print(f"{Fore.YELLOW}2{Style.RESET_ALL}. Custom")
        try:
            test_choice = input(f"{Fore.GREEN}➤ Enter your choice (1-2){Style.RESET_ALL} {Fore.BLACK}{Style.DIM}(default=1){Style.RESET_ALL}: ").strip()
        except EOFError:
            test_choice = "1"
        except KeyboardInterrupt:
            print("\n")
            test_choice = "1"
        
        # Handle empty input or default
        if not test_choice:
            test_choice = "1"
            break
        
        # Validate input
        if test_choice in ["1", "2"]:
            break
        else:
            print(f"{Fore.RED}❌ Invalid choice. Please enter 1 or 2.{Style.RESET_ALL}")
    
    # Get custom prompt if needed
    custom_prompt = ""
    if test_choice == "2":
        print(f"\n{Fore.CYAN}{Style.BRIGHT}Enter your custom test prompt{Style.RESET_ALL} {Fore.BLACK}{Style.DIM}(press Enter to submit){Style.RESET_ALL}:")
        print(f"{Fore.MAGENTA}(Tip: You can still paste multi-line text; we'll take the first line.){Style.RESET_ALL}")
        try:
            first_line = input("> ")
        except EOFError:
            first_line = ""
        except KeyboardInterrupt:
            print("\n")
            first_line = ""
        if not first_line.strip() and not sys.stdin.isatty():
            first_line = "Visit the target URL and perform a quick end-to-end sanity test."
        custom_prompt = first_line.strip()
    
    return target_url, test_choice, custom_prompt

def create_default_prompt(target_url, test_type):
    """Create default test prompt using BrowserUse actions"""
    # Default scenario (requested): visit personal site, click Contact Me, open LinkedIn follow URL
    return f"""Follow these steps precisely using BrowserUse actions:

1. Use go_to_url action to navigate to https://fagun.sqatesting.com/
2. Use click_element action to click the button or link labeled "Contact Me"
3. Use wait action to wait 2 seconds to ensure any navigation/dialog completes
4. Use go_to_url action to navigate to https://www.linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=mejbaur
5. After loading, use extract_structured_data action to confirm the page title and any visible follow UI exists
6. Use write_file action to save a short summary to contact_follow_result.txt including the final URL and page title

Notes:
- If clicking "Contact Me" triggers a modal instead of navigation, still proceed to step 4 afterwards.
- If LinkedIn requires authentication, do not attempt to bypass; just record that login is required and save the finding.
"""

def build_task(base_prompt: str, target_url: str, is_custom: bool) -> str:
    """Wrap the user's prompt (or default) with structured requirements for exhaustive test data and reporting."""
    requirements = f"""

GLOBAL REQUIREMENTS:
- Always start by opening: {target_url}
- Generate exhaustive test cases and test data for typical contact forms with fields: Name, Email, Subject, Message.
- Cover valid, invalid, boundary, empty, negative, and special-character scenarios.
- Represent test cases in structured JSON with keys: field, category, description, input, expected.
- Save all generated test cases to reports/test_cases.json using write_file.
- Take meaningful screenshots for major states (initial, after fill, after submit, error states) and ensure at least 4.
- Summarize key findings.
- Prefer deterministic actions, minimal retries; respect same-origin navigation.

OUTPUT FILES (use write_file action):
1) reports/test_cases.json — JSON array of test cases as described above
2) contact_follow_result.txt or similar summary

CONSTRAINTS:
- Do not navigate to unrelated external domains.
- Do not include secrets in any files.
"""
    return (base_prompt.strip() + "\n\n" + requirements).strip()

def ensure_dependencies():
	try:
		import playwright  # type: ignore
	except Exception:
		try:
			subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=False)
		except Exception:
			pass
	# Best-effort browser install
	try:
		subprocess.run(["playwright", "install", "chromium"], check=False)
	except Exception:
		pass


async def main():
    # CLI arguments to support non-interactive runs
    parser = ArgumentParser(description="Fagun Automated Testing Agent")
    parser.add_argument("--url", help="Target URL (overrides interactive prompt)")
    parser.add_argument("--type", choices=["default", "custom"], help="Test type (default/custom)")
    parser.add_argument("--prompt", help="Custom prompt text when --type custom")
    parser.add_argument("--agents", type=int, default=6, help="Number of parallel agents (default: 6)")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode (if supported)")
    parser.add_argument("--broken-limit", type=int, default=100, help="Max number of URLs to quick-check for broken links in report (default: 100)")
    args = parser.parse_args()

    # Ensure dependencies
    ensure_dependencies()

    # Ensure API key exists (prompt and persist if missing/invalid)
    api_key = ensure_gemini_api_key()
    print("✅ Gemini API key ready!")
    
    # Get user input or use CLI overrides
    if args.url or args.type:
        target_url = args.url or "https://fagun.sqatesting.com/"
        test_choice = "2" if (args.type or "default").lower() == "custom" else "1"
        custom_prompt = (args.prompt or "").strip() if test_choice == "2" else ""
    else:
        target_url, test_choice, custom_prompt = get_user_input()
    
    # Create appropriate prompt and wrap with global requirements
    if test_choice == "2" and custom_prompt:
        base = custom_prompt
        task = build_task(base, target_url, is_custom=True)
    else:
        base = create_default_prompt(target_url, test_choice)
        task = build_task(base, target_url, is_custom=False)
    
    print(f"\n🎯 Target URL: {target_url}")
    
    # Safely get test type name
    test_type_names = {"1": "Default", "2": "Custom"}
    test_type_name = test_type_names.get(test_choice, "Comprehensive")
    print(f"🧪 Test Type: {test_type_name}")
    
    print("\n🚀 Starting automated testing...")
    print("=" * 60)
    
    try:
        # Helper to run a single agent
        async def run_agent_instance(instance_idx: int):
            llm_local = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.0,
                google_api_key=api_key
            )
            agent_local = Agent(task=task, llm=llm_local, use_vision=True)
            history_local = await agent_local.run(max_steps=50)
            return history_local

        # Define 6 cooperative agent roles
        roles = [
            {"name": "Navigator", "hint": "Prioritize stable navigation, resolve timeouts, accept cookies, ensure page loaded."},
            {"name": "Auth & Session", "hint": "If login is present, locate forms, avoid sensitive leaks, verify session persistence."},
            {"name": "Content Extractor", "hint": "Extract titles, headings, key texts; summarize primary content blocks."},
            {"name": "Link Checker", "hint": "Collect internal links (<=15), open 3-5, detect 404/500 or broken routes."},
            {"name": "Accessibility", "hint": "Look for missing alt text, low contrast cues, keyboard traps; report notable issues."},
            {"name": "Screenshots & Reporting", "hint": "Capture meaningful screenshots, ensure at least one per major state; summarize findings."},
        ]

        # Inform user which agents will run
        print(f"\n🧩 Launching {len(roles)} agents with roles:")
        for idx, r in enumerate(roles, 1):
            print(f"  {idx}. {r['name']} – {r['hint']}")

        # Role-augmented agent runner
        async def run_role_agent(idx: int, role: dict):
            role_task = (
                f"[Role: {role['name']}] You are one of multiple cooperative QA agents. "
                f"Focus area: {role['hint']}\n\n"
                f"STRICT RULES:\n"
                f"- Only navigate to the target domain and same-origin links.\n"
                f"- Do NOT visit external domains (no google.com/example.com unless it's the same domain as target).\n"
                f"- Do NOT invent URLs.\n"
                f"- If you accidentally navigate away, immediately go_back and continue on the target site.\n\n"
                f"Target to open first: {target_url}\n\n"
                + task
            )
            llm_local = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.0,
                google_api_key=api_key
            )
            agent_local = Agent(
                task=role_task,
                llm=llm_local,
                use_vision=True,
                initial_actions=[{"go_to_url": {"url": target_url}}],
            )
            history_local = await agent_local.run(max_steps=80)
            # Attach role metadata for combined reporting context
            setattr(history_local, "_role_name", role['name'])
            setattr(history_local, "_role_hint", role['hint'])
            return history_local

        # Run 6 agents (one per role) in parallel
        # Stagger starts slightly to avoid burst 429s
        tasks = []
        for i in range(min(len(roles), args.agents)):
            # small delay per agent (increase to 1.0s)
            async def delayed(i=i):
                await asyncio.sleep(i * 1.0)
                return await run_role_agent(i + 1, roles[i])
            tasks.append(delayed())
        histories = await asyncio.gather(*tasks, return_exceptions=False)

        print("\n✅ All agents completed!")

        # Combined report
        combined_report = generate_combined_html_report(
            histories,
            meta={
                "agents": len(histories),
                "target_url": target_url,
                "task": task,
                "roles": [r["name"] for r in roles[:len(histories)]],
                "headless": bool(args.headless),
                "broken_limit": int(args.broken_limit),
            },
        )
        print(f"📁 Combined report saved to: {combined_report}")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        print("Please check your API key and try again.")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())