"""
HTML Report Generator with modern, colorful UI
"""

import os
from datetime import datetime
from typing import Optional


def _base_html(title: str, body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0f172a;
      --card: #111827;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --primary: #06b6d4;
      --primary-2: #3b82f6;
      --ok: #22c55e;
      --warn: #f59e0b;
      --crit: #ef4444;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; background: linear-gradient(180deg, #0b1022, #0f172a); color: var(--text); }}
    .container {{ max-width: 1080px; margin: 32px auto; padding: 0 16px; }}
    .header {{ background: radial-gradient(1200px 400px at 20% -10%, rgba(59,130,246,.25), transparent), radial-gradient(900px 400px at 80% 0%, rgba(6,182,212,.25), transparent); border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,.06); }}
    h1 {{ margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: .3px; }}
    .meta {{ color: var(--muted); font-size: 13px; }}
    .grid {{ display: grid; gap: 16px; grid-template-columns: repeat(12, 1fr); margin-top: 24px; }}
    .card {{ grid-column: span 12; background: linear-gradient(180deg, #0f172a, #0b1324); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: 18px; }}
    @media (min-width: 900px) {{ .span-6 {{ grid-column: span 6; }} }}
    h2 {{ margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff; }}
    h3 {{ margin: 16px 0 8px; font-size: 16px; font-weight: 700; color: #ffffff; }}
    p {{ color: var(--text); line-height: 1.6; margin: 8px 0; }}
    .status {{ display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-left: 8px; }}
    .ok {{ background: rgba(34,197,94,.12); color: var(--ok); border: 1px solid rgba(34,197,94,.3); }}
    .warn {{ background: rgba(245,158,11,.12); color: var(--warn); border: 1px solid rgba(245,158,11,.3); }}
    .crit {{ background: rgba(239,68,68,.12); color: var(--crit); border: 1px solid rgba(239,68,68,.3); }}
    ul {{ margin: 8px 0 8px 20px; color: var(--text); }}
    li {{ margin: 6px 0; }}
    .pill {{ display:inline-block; padding: 2px 10px; margin: 2px 6px 2px 0; border-radius: 999px; background: rgba(255,255,255,.06); color: var(--muted); font-size: 12px; }}
    .footer {{ margin-top: 24px; color: var(--muted); font-size: 12px; text-align: center; }}
    a {{ color: var(--primary-2); text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{title}</h1>
      <div class="meta">Generated at {datetime.now().isoformat()}</div>
    </div>
    <div class="grid">
      {body_html}
    </div>
    <div class="footer">Fagun AI Testing Agent • Modern HTML Report</div>
  </div>
</body>
</html>
"""


def generate_html_report_file(title: str, body_html: str, output_dir: str = "reports", filename: Optional[str] = None) -> str:
    os.makedirs(output_dir, exist_ok=True)
    if not filename:
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    path = os.path.join(output_dir, filename)
    html = _base_html(title, body_html)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def generate_markopolo_sample_report() -> str:
    title = "Comprehensive Testing Report for Markopolo.ai Platform"
    # Body authored as HTML blocks for fidelity
    sections = [
        (
            "Executive Summary",
            """
            <p>I have conducted a comprehensive test of the Markopolo.ai platform, focusing on the onboarding process, data connections, integrations, and core modules. The testing revealed several critical issues that prevent full platform functionality, particularly with Shopify integration and data connectivity.</p>
            """,
        ),
        (
            "Test Results by Module",
            """
            <div class="card"><h3>1. Onboarding Process <span class="status warn">Partially Successful</span></h3>
              <ul>
                <li>✅ Successfully logged into the platform</li>
                <li>✅ Initial onboarding screen accessed</li>
                <li>❌ Onboarding process appeared to be skipped or completed automatically</li>
                <li>❌ No guided onboarding flow was experienced</li>
              </ul>
            </div>

            <div class="card"><h3>2. Dataroom & Data Container <span class="status warn">Mixed Results</span></h3>
              <h4>Client-side MarkTag</h4>
              <ul>
                <li>✅ Successfully connected and active</li>
                <li>✅ Basic setup completed without issues</li>
              </ul>
              <h4>Server-side MarkTag</h4>
              <ul>
                <li>❌ <b>Critical Failure</b>: DNS verification failed repeatedly</li>
                <li>❌ Unable to verify DNS records (CNAME and TXT records)</li>
                <li>❌ System consistently showed "Records failed to verify"</li>
                <li><b>Impact</b>: Server-side tracking capabilities unavailable</li>
              </ul>
            </div>

            <div class="card"><h3>3. Integrations <span class="status warn">Mixed Results</span></h3>
              <h4>Email Services</h4>
              <ul>
                <li>✅ <b>SendGrid</b>: Successfully connected using provided API key</li>
                <li>✅ <b>Resend</b>: Already connected and functional</li>
                <li>❌ <b>Twilio</b>: Failed to validate credentials despite multiple attempts<br/>Error: "Failed to save information!"</li>
              </ul>
              <h4>WhatsApp Integration</h4>
              <ul>
                <li>❌ <b>Critical Failure</b>: Unable to connect (dependent on Twilio)</li>
              </ul>
              <h4>CRM Integrations</h4>
              <ul>
                <li>✅ <b>HubSpot</b>: Connected</li>
                <li>✅ <b>Pipedrive</b>: Connected</li>
                <li>❌ <b>Salesforce</b>: Connection failed - no credentials</li>
                <li>❌ <b>Zoho CRM</b>: Connection failed - no credentials</li>
              </ul>
            </div>

            <div class="card"><h3>4. Shopify Integration <span class="status crit">Critical Failure</span></h3>
              <ul>
                <li>✅ Accessed Shopify connection interface</li>
                <li>✅ Entered test store URL: <code>testshop.myshopify.com</code></li>
                <li>✅ Navigated to Shopify login page</li>
                <li>❌ Unauthorized Access Error upon login attempt</li>
              </ul>
              <p><b>Impact</b>: Unable to test Shopify-specific flows (campaigns, discounts, event tracking).</p>
            </div>

            <div class="card"><h3>5. Users Module <span class="status warn">Partially Tested</span></h3>
              <ul>
                <li>✅ Accessed Users interface</li>
                <li>✅ Download template works</li>
                <li>❌ Unable to upload leads: File upload requires pre-defined file paths</li>
              </ul>
            </div>

            <div class="card"><h3>6. Audience Studio <span class="status warn">Functional but Limited</span></h3>
              <ul>
                <li>✅ Interface accessible</li>
                <li>❌ AI query failure prevented audience creation</li>
              </ul>
            </div>

            <div class="card"><h3>7. Analytics Module <span class="status warn">Limited Functionality</span></h3>
              <ul>
                <li>✅ Interface accessible</li>
                <li>❌ No data available; tracking not validated</li>
              </ul>
            </div>

            <div class="card"><h3>8. Knowledge Base <span class="status warn">Not Tested</span></h3>
              <ul><li>❌ Not located during testing</li></ul>
            </div>
            """,
        ),
        (
            "Critical Issues Identified",
            """
            <ul>
              <li><b>Shopify Integration</b> – <span class="status crit">Critical</span>: Unauthorized access blocking store connection</li>
              <li><b>Server-side MarkTag DNS</b> – <span class="status warn">High</span>: DNS verification failing</li>
              <li><b>Twilio Integration</b> – <span class="status warn">High</span>: Credential validation failing</li>
              <li><b>Data Connectivity</b> – <span class="status warn">Medium</span>: Multiple integration failures</li>
            </ul>
            """,
        ),
        (
            "Recommendations",
            """
            <ol>
              <li><b>Priority 1</b>: Resolve Shopify authentication issues</li>
              <li><b>Priority 1</b>: Fix Twilio credential validation</li>
              <li><b>Priority 2</b>: Address server-side MarkTag DNS verification</li>
              <li><b>Priority 2</b>: Improve error messaging and user guidance</li>
              <li><b>Priority 3</b>: Validate file upload flow with proper file handling</li>
            </ol>
            """,
        ),
        (
            "Conclusion",
            """
            <p><b>Overall Platform Readiness</b>: <span class="status warn">Limited</span> – key flows blocked by integration failures. Retest end-to-end journey after addressing blockers, especially Shopify.</p>
            """,
        ),
    ]

    body = "".join([f'<div class="card"><h2>{h}</h2>{c}</div>' for h, c in sections])
    return generate_html_report_file(title, body, output_dir="reports", filename=f"markopolo_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")


