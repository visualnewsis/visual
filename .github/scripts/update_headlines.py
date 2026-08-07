#!/usr/bin/env python3
"""Build the 제목있음 question bank from NEWSIS' official RSS feeds."""

from __future__ import annotations

import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "arcade" / "output" / "data" / "headlines.json"
FEEDS = {
    "속보": "https://www.newsis.com/RSS/sokbo.xml",
    "정치": "https://www.newsis.com/RSS/politics.xml",
    "경제": "https://www.newsis.com/RSS/economy.xml",
    "사회": "https://www.newsis.com/RSS/society.xml",
    "국제": "https://www.newsis.com/RSS/international.xml",
    "문화": "https://www.newsis.com/RSS/culture.xml",
}
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def clean(value: str | None) -> str:
    text = html.unescape(TAG_RE.sub(" ", value or ""))
    return SPACE_RE.sub(" ", text).strip()


def chunks(title: str) -> list[str]:
    words = title.split()
    if len(words) < 3:
        return []
    groups: list[list[str]] = [[], [], []]
    lengths = [0, 0, 0]
    target = len(title) / 3
    group = 0
    for word in words:
        if group < 2 and groups[group] and lengths[group] + 1 + len(word) > target:
            group += 1
        groups[group].append(word)
        lengths[group] += len(word) + (1 if lengths[group] else 0)
    result = [" ".join(group) for group in groups if group]
    return result if len(result) == 3 else []


def fetch(category: str, url: str) -> list[dict[str, object]]:
    request = urllib.request.Request(url, headers={"User-Agent": "VisualNewsis-HeadlineGame/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        root = ET.fromstring(response.read())
    items: list[dict[str, object]] = []
    for item in root.findall(".//item"):
        title = clean(item.findtext("title"))
        link = clean(item.findtext("link"))
        summary = clean(item.findtext("description"))
        if len(summary) < 25:
            summary = "뉴시스 최신 기사에서 이어지는 오늘의 이야기입니다."
        parts = chunks(title)
        if not (18 <= len(title) <= 90 and link.startswith("https://www.newsis.com/") and parts):
            continue
        items.append({
            "category": f"{category}면" if category != "속보" else "속보",
            "chunks": parts,
            "title": title,
            "summary": summary[:180],
            "url": link,
        })
        if len(items) == 6:
            break
    return items


def main() -> None:
    collected: list[dict[str, object]] = []
    seen: set[str] = set()
    errors: list[str] = []
    for category, url in FEEDS.items():
        try:
            for item in fetch(category, url):
                if item["url"] not in seen:
                    seen.add(str(item["url"]))
                    collected.append(item)
        except Exception as exc:  # keep other feeds usable if one endpoint is down
            errors.append(f"{category}: {exc}")
    if len(collected) < 12:
        raise RuntimeError(f"Only {len(collected)} valid headlines collected; preserving previous data. {errors}")
    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NEWSIS official RSS",
        "count": min(len(collected), 30),
        "jobs": collected[:30],
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {payload['count']} headlines to {OUTPUT}")


if __name__ == "__main__":
    main()
