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
JSON_LD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
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

    arcade = ROOT / "arcade" / "index.html"
    if not arcade.is_file():
        fail(errors, "missing Chungmuroading landing: arcade/index.html")
    elif "visual-header.js" in arcade.read_text(encoding="utf-8"):
        fail(errors, "Chungmuroading exception violated: global header loaded in arcade/index.html")

    if shared_js.is_file():
        script = shared_js.read_text(encoding="utf-8")
        expected = ['latest:"최신 기사"', 'editshop:"편집#"', 'arcade:"충무로딩"', 'calculator:"계산대로"']
        if any(item not in script for item in expected):
            fail(errors, "global header menu must contain exactly the four approved labels")
        if "최종판" in script or "알아볼지도" in script:
            fail(errors, "unapproved no-landing section found in global menu source")

    if errors:
        print("VISUAL NEWSIS checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"VISUAL NEWSIS checks passed: {len(PAGES)} service pages and Chungmuroading exception")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
