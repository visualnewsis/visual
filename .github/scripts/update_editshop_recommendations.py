"""Build the shared arcade recommendation bank from the editshop landing page."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "editshop" / "index.html"
OUTPUT = ROOT / "arcade" / "data" / "editshop-articles.json"
BASE = "https://visual.newsis.com/editshop/"


class StoryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.items: list[dict[str, str]] = []
        self.current: dict[str, str] | None = None
        self.capture = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        classes = set((values.get("class") or "").split())
        if tag == "a" and "story" in classes:
            self.current = {"url": urljoin(BASE, values.get("href") or "")}
        if not self.current:
            return
        if tag == "img" and "image" not in self.current:
            self.current["image"] = urljoin(BASE, values.get("src") or "")
        if tag == "div" and "category" in classes:
            self.capture = "category"
        elif tag == "h3":
            self.capture = "title"
        elif tag == "p":
            self.capture = "description"

    def handle_data(self, data: str) -> None:
        if self.current is not None and self.capture:
            self.current[self.capture] = self.current.get(self.capture, "") + " " + data.strip()

    def handle_endtag(self, tag: str) -> None:
        if tag in {"div", "h3", "p"}:
            self.capture = ""
        if tag == "a" and self.current:
            if self.current.get("title") and self.current.get("url"):
                self.items.append({key: " ".join(value.split()) for key, value in self.current.items()})
            self.current = None


def profile(item: dict[str, str]) -> str:
    text = " ".join(item.values()).lower()
    if any(word in text for word in ("money", "rate", "price", "경제", "금리", "물가")):
        return "attack"
    if any(word in text for word in ("energy", "shipping", "국제", "에너지", "경로")):
        return "edge"
    return "center"


def main() -> None:
    parser = StoryParser()
    parser.feed(SOURCE.read_text(encoding="utf-8"))
    if not parser.items:
        raise RuntimeError("No editshop story cards found; preserving previous recommendations.")
    articles = []
    for index, item in enumerate(parser.items, 1):
        articles.append({
            "id": item["url"].rstrip("/").split("/")[-1],
            "issue": f"편집#{index:03d}",
            "label": item.get("category", "INTERACTIVE NEWS").replace(" · ", " / "),
            "title": item["title"],
            "description": item.get("description", "비주얼 뉴시스의 인터랙티브 기사입니다."),
            "image": item.get("image", "https://visual.newsis.com/assets/logo2024.png"),
            "url": item["url"],
            "profile": profile(item),
        })
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "VISUAL NEWSIS editshop landing page",
        "articles": articles,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
