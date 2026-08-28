#!/usr/bin/env python3
"""Stable, dependency-free checks for VISUAL NEWSIS service entry points."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES = {
    "index.html": ("최신 기사", True),
    "editshop/index.html": ("편집#", True),
    "oil/index.html": ("편집#", True),
    "thief/index.html": ("편집#", True),
    "shelter/index.html": ("편집#", True),
    "temperature/index.html": ("편집#", True),
    "kangin/index.html": ("편집#", True),
    "children/index.html": ("편집#", True),
    "buy-live/index.html": ("편집#", True),
    "heat-rain/index.html": ("최종판", False),
    "calculator/index.html": ("계산대로", True),
}
EDITSHOP_STORIES = {"oil", "thief", "shelter", "temperature", "kangin", "children", "buy-live"}
VISUAL_STORIES_CAROUSEL_PAGES = {"heat-rain"}
JSON_LD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
    carousel_js = (ROOT / "assets" / "editshop-carousel.js").read_text(encoding="utf-8")
    carousel_css = (ROOT / "assets" / "editshop-carousel.css").read_text(encoding="utf-8")
    if 'node.textContent.includes("편집#이 끌어올립니다")' not in carousel_js or "banner.before(section)" not in carousel_js:
        fail(errors, "editshop carousel must be placed immediately before the common bottom banner")
    if '<span>다른</span> <em>편집#</em>' not in carousel_js or "#00a9ba" not in carousel_css:
        fail(errors, "editshop carousel heading color treatment is missing")
    visual_carousel_js = (ROOT / "assets" / "visual-stories-carousel.js").read_text(encoding="utf-8")
    visual_carousel_css = (ROOT / "assets" / "visual-stories-carousel.css").read_text(encoding="utf-8")
    archive_html = (ROOT / "index.html").read_text(encoding="utf-8")
    archive_slugs = set(re.findall(r'class="archive-card[^\"]*" href="\./([^/\"]+)', archive_html))
    carousel_slugs = set(re.findall(r'\{slug:"([^"]+)"', visual_carousel_js))
    if archive_slugs != carousel_slugs:
        fail(errors, "VISUAL NEWSIS carousel stories must match the main ALL STORIES archive")
    if "비주얼 뉴시스" not in visual_carousel_js or "#00a9ba" not in visual_carousel_css:
        fail(errors, "VISUAL NEWSIS more-stories heading treatment is missing")
    shared_css = ROOT / "assets" / "visual-header.css"
    shared_js = ROOT / "assets" / "visual-header.js"
    for required in (ROOT / "AGENTS.md", ROOT / "CLAUDE.md", shared_css, shared_js, ROOT / "assets" / "logo2024.png"):
        if not required.is_file():
            fail(errors, f"missing required file: {required.relative_to(ROOT)}")

    for relative, (section, linked) in PAGES.items():
        path = ROOT / relative
        if not path.is_file():
            fail(errors, f"missing service page: {relative}")
            continue
        html = path.read_text(encoding="utf-8")
        if "visual-header.css" not in html or "visual-header.js" not in html:
            fail(errors, f"global header assets missing: {relative}")
        match = re.search(r'<script[^>]+visual-header\.js[^>]+data-section="([^"]+)"([^>]*)>', html)
        if not match or match.group(1) != section:
            fail(errors, f"wrong header section in {relative}: expected {section}")
        elif linked != ("data-section-href=" in match.group(2)):
            fail(errors, f"wrong section link state in {relative}")
        for block_number, block in enumerate(JSON_LD_RE.findall(html), start=1):
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                fail(errors, f"invalid JSON-LD in {relative} block {block_number}: {exc}")
        slug = Path(relative).parts[0] if "/" in relative else ""
        if slug in EDITSHOP_STORIES:
            if "editshop-carousel.css" not in html or "editshop-carousel.js" not in html:
                fail(errors, f"editshop carousel assets missing: {relative}")
            if f'data-current="{slug}"' not in html:
                fail(errors, f"wrong editshop carousel current story: {relative}")
        if slug in VISUAL_STORIES_CAROUSEL_PAGES:
            if "visual-stories-carousel.css" not in html or "visual-stories-carousel.js" not in html:
                fail(errors, f"VISUAL NEWSIS carousel assets missing: {relative}")
            if f'data-current="{slug}"' not in html:
                fail(errors, f"wrong VISUAL NEWSIS carousel current story: {relative}")

    arcade = ROOT / "arcade" / "index.html"
    if not arcade.is_file():
        fail(errors, "missing Chungmuroading landing: arcade/index.html")
    elif "visual-header.js" in arcade.read_text(encoding="utf-8"):
        fail(errors, "Chungmuroading exception violated: global header loaded in arcade/index.html")

    if shared_js.is_file():
        script = shared_js.read_text(encoding="utf-8")
        expected = [
            'latest:"최신 기사"', 'editshop:"편집#"', 'finalcut:"최종판"',
            'mapguide:"알아볼지도"', 'arcade:"충무로딩"', 'calculator:"계산대로"',
        ]
        if any(item not in script for item in expected):
            fail(errors, "global header menu must contain exactly the six approved labels")
        links_match = re.search(r'const links=\{([^}]*)\}', script)
        links_body = links_match.group(1) if links_match else ""
        if 'finalcut:"https://visual.newsis.com/finalcut/"' not in links_body:
            fail(errors, "최종판 global menu link is missing or incorrect")
        if "mapguide:" in links_body:
            fail(errors, "알아볼지도 must stay link-disabled in the global menu until its own landing exists")

    if errors:
        print("VISUAL NEWSIS checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"VISUAL NEWSIS checks passed: {len(PAGES)} service pages and Chungmuroading exception")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
