"""
🤖 Fagun Browser Automation Testing Agent - Site Audit
======================================================

Site-wide intelligent audit: crawl pages, detect broken links, collect console/network errors,
run form tests where applicable, and generate an aggregated report.
"""

import asyncio
import logging
from typing import Any, Dict, List, Set, Tuple
from urllib.parse import urljoin, urlparse

from playwright.async_api import Page

from src.utils.intelligent_form_testing import IntelligentFormTester

logger = logging.getLogger(__name__)


class SiteAuditor:
    def __init__(self, page: Page, form_tester_factory):
        """page: a Playwright Page bound to a BrowserContext
        form_tester_factory: callable that returns IntelligentFormTester for a given page
        """
        self.page = page
        self.form_tester_factory = form_tester_factory

    async def audit(self, start_url: str, max_pages: int = 10, max_depth: int = 2) -> Dict[str, Any]:
        visited: Set[str] = set()
        queue: List[Tuple[str, int]] = [(start_url, 0)]

        origin = self._origin(start_url)

        pages_summary: List[Dict[str, Any]] = []
        broken_links: List[Dict[str, str]] = []

        while queue and len(visited) < max_pages:
            url, depth = queue.pop(0)
            if url in visited or depth > max_depth:
                continue
            visited.add(url)

            try:
                await self.page.goto(url, wait_until='domcontentloaded')
                await asyncio.sleep(0.5)

                page_result: Dict[str, Any] = {
                    "url": url,
                    "title": await self.page.title(),
                    "console_errors": await self._collect_console_errors(),
                    "network_issues": [],
                }

                # Basic broken link scan on current page (HEAD requests)
                links = await self._extract_links()
                same_origin_links = [l for l in links if self._origin(l) == origin]

                # Check a subset to keep runtime in bounds
                for link in same_origin_links[:50]:
                    status = await self._head_status(link)
                    if status >= 400:
                        broken = {"href": link, "status": str(status), "on_page": url}
                        broken_links.append(broken)

                # Run intelligent form testing if forms exist
                has_form = (await self.page.locator("form").count()) > 0
                if has_form:
                    tester: IntelligentFormTester = self.form_tester_factory(self.page)
                    try:
                        await tester.discover_form_fields()
                        scenarios = await tester.generate_test_scenarios()
                        await tester.execute_test_scenarios(scenarios)
                        form_report = await tester.generate_comprehensive_report()

                        # Add basic accessibility checks for the page
                        a11y = await tester.run_basic_accessibility_checks()

                        page_result["form_testing"] = form_report
                        page_result["accessibility"] = a11y
                    except Exception as e:
                        page_result["form_testing_error"] = str(e)

                pages_summary.append(page_result)

                # Enqueue next links
                for link in same_origin_links:
                    if link not in visited:
                        queue.append((link, depth + 1))

            except Exception as e:
                logger.warning(f"Audit navigation error at {url}: {e}")
                pages_summary.append({"url": url, "error": str(e)})

        return {
            "start_url": start_url,
            "total_pages_visited": len(visited),
            "pages": pages_summary,
            "broken_links": broken_links,
        }

    async def _extract_links(self) -> List[str]:
        anchors = await self.page.locator("a[href]").all()
        urls: List[str] = []
        base = self.page.url
        for a in anchors[:200]:
            try:
                href = await a.get_attribute("href")
                if href:
                    urls.append(urljoin(base, href))
            except Exception:
                continue
        return urls

    async def _head_status(self, url: str) -> int:
        try:
            # Use context.request for lightweight request
            resp = await self.page.context.request.get(url, max_redirects=2)
            return resp.status
        except Exception:
            return 599

    async def _collect_console_errors(self) -> List[str]:
        # Snapshot console errors present in DOM if any common containers exist
        errors: List[str] = []
        try:
            # Heuristic: look for aria role alert or typical error classes
            loc = self.page.locator(".error, .alert-danger, [role='alert']").all()
            for l in await loc:
                try:
                    txt = await l.text_content()
                    if txt:
                        errors.append(txt.strip())
                except Exception:
                    continue
        except Exception:
            pass
        return errors

    def _origin(self, url: str) -> str:
        u = urlparse(url)
        return f"{u.scheme}://{u.netloc}"


