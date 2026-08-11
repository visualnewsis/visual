#!/usr/bin/env python3
"""Build 낱말수선소 crosswords from current NEWSIS headlines and leads."""

from __future__ import annotations

import html
import json
import random
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "arcade" / "words" / "data" / "crossword.json"
FEEDS = {
    "정치": "https://www.newsis.com/RSS/politics.xml",
    "경제": "https://www.newsis.com/RSS/economy.xml",
    "사회": "https://www.newsis.com/RSS/society.xml",
    "국제": "https://www.newsis.com/RSS/international.xml",
    "문화": "https://www.newsis.com/RSS/culture.xml",
}
USER_AGENT = "VisualNewsis-Crossword/1.0"
WORD_RE = re.compile(r"(?<![가-힣])[가-힣]{2,6}(?![가-힣])")
SPACE_RE = re.compile(r"\s+")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+|\n+")
STOP = {
    "기자", "뉴시스", "사진", "제공", "관련", "대한", "통해", "위해", "대해", "있는", "없는", "이번", "지난",
    "오는", "오전", "오후", "밝혔다", "말했다", "전했다", "따르면", "가운데", "정부", "당국", "우리", "최근",
    "서울", "이날", "현재", "정도", "이후", "앞서", "경우", "때문", "문제", "진행", "예정", "계획", "가능",
    "기준", "내용", "대상", "상황", "시작", "사실", "분야", "모두", "크게", "다시", "계속", "가장",
    "최대한", "사회", "경제", "정치", "국제", "문화", "통신사", "기자단", "재판매", "금지", "등록",
}
PARTICLES = ("으로부터", "에서는", "에게서", "이라고", "이라며", "에서도", "까지는", "부터는", "으로", "에서", "에게", "보다", "처럼", "까지", "부터", "라고", "이며", "에는", "으로", "로", "서", "의", "을", "를", "이", "가", "은", "는", "에", "와", "과", "도", "만")
BAD_ENDINGS = ("한다", "했다", "된다", "됐다", "하고", "하며", "하고는", "이라고", "라고", "이라며", "하면서", "된다면", "해진다", "이었다", "입니다", "있다", "없다")


def clean(value: str | None) -> str:
    return SPACE_RE.sub(" ", html.unescape(re.sub(r"<[^>]+>", " ", value or ""))).strip()


class BodyParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.depth = 0
        self.capture = False
        self.skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if not self.capture and values.get("itemprop") == "articleBody":
            self.capture, self.depth = True, 1
            return
        if self.capture:
            self.depth += 1
            if tag in {"script", "style", "figure", "button"}:
                self.skip += 1
            if tag in {"p", "br", "div"} and not self.skip:
                self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if not self.capture:
            return
        if tag in {"script", "style", "figure", "button"} and self.skip:
            self.skip -= 1
        self.depth -= 1
        if self.depth <= 0:
            self.capture = False

    def handle_data(self, data: str) -> None:
        if self.capture and not self.skip:
            self.parts.append(data)

    @property
    def text(self) -> str:
        text = html.unescape(" ".join(self.parts))
        text = re.sub(r"[ \t\r\f\v]+", " ", text)
        return re.sub(r"\n{2,}", "\n", text).strip()


def request_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def feed_articles() -> list[dict[str, str]]:
    articles: list[dict[str, str]] = []
    seen: set[str] = set()
    for category, url in FEEDS.items():
        root = ET.fromstring(request_text(url))
        for item in root.findall(".//item"):
            title = clean(item.findtext("title"))
            link = clean(item.findtext("link"))
            if not link.startswith("https://www.newsis.com/") or link in seen:
                continue
            if title.startswith("[") or "소식]" in title:
                continue
            seen.add(link)
            articles.append({"category": category, "title": title, "url": link})
            if sum(1 for article in articles if article["category"] == category) >= 5:
                break
    return articles


def normalize_word(raw: str) -> str:
    word = raw
    for particle in PARTICLES:
        if word.endswith(particle) and len(word) - len(particle) >= 2:
            word = word[:-len(particle)]
            break
    return word


def article_words(article: dict[str, str]) -> list[dict[str, object]]:
    parser = BodyParser()
    parser.feed(request_text(article["url"]))
    body = parser.text[:9000]
    title = article["title"]
    title_words = [normalize_word(word) for word in WORD_RE.findall(title)]
    tokens = [normalize_word(word) for word in WORD_RE.findall(body)]
    counts = Counter(word for word in tokens if 2 <= len(word) <= 6 and word not in STOP)
    output: list[dict[str, object]] = []
    seen: set[str] = set()
    for word in title_words:
        count = counts[word]
        if word in seen:
            continue
        seen.add(word)
        if word in STOP or len(set(word)) == 1 or word.endswith(BAD_ENDINGS):
            continue
        if not 2 <= len(word) <= 6:
            continue
        clue = title.replace(word, "○" * len(word))
        score = 20 + count + min(len(word), 4)
        output.append({"answer": word, "clue": clue, "score": score, **article})
    return output[:10]


def can_place(grid: list[list[str]], word: str, row: int, col: int, direction: str) -> tuple[bool, int]:
    size = len(grid)
    dr, dc = (0, 1) if direction == "across" else (1, 0)
    end_r, end_c = row + dr * (len(word) - 1), col + dc * (len(word) - 1)
    if min(row, col, end_r, end_c) < 0 or max(row, col, end_r, end_c) >= size:
        return False, 0
    before = (row - dr, col - dc)
    after = (end_r + dr, end_c + dc)
    for rr, cc in (before, after):
        if 0 <= rr < size and 0 <= cc < size and grid[rr][cc]:
            return False, 0
    crossings = 0
    for index, letter in enumerate(word):
        rr, cc = row + dr * index, col + dc * index
        existing = grid[rr][cc]
        if existing and existing != letter:
            return False, 0
        if existing == letter:
            crossings += 1
        # Korean newspaper crosswords commonly allow neighbouring answer cells.
        # Conflicts and word-boundary collisions are still rejected above.
    return crossings > 0, crossings


def layout(candidates: list[dict[str, object]], size: int = 13) -> dict[str, object] | None:
    for attempt in range(40):
        rng = random.Random(20260811 + attempt)
        letter_frequency = Counter("".join(str(item["answer"]) for item in candidates))
        pool = sorted(
            candidates,
            key=lambda item: (
                sum(letter_frequency[letter] for letter in set(str(item["answer"]))),
                int(item["score"]),
                len(str(item["answer"])),
            ),
            reverse=True,
        )[:52]
        rng.shuffle(pool)
        pool.sort(
            key=lambda item: (
                sum(letter_frequency[letter] for letter in set(str(item["answer"]))),
                len(str(item["answer"])),
            ),
            reverse=True,
        )
        grid = [["" for _ in range(size)] for _ in range(size)]
        placed: list[dict[str, object]] = []
        first = pool.pop(0)
        answer = str(first["answer"])
        row, col = size // 2, (size - len(answer)) // 2
        for offset, letter in enumerate(answer):
            grid[row][col + offset] = letter
        placed.append({**first, "row": row, "col": col, "direction": "across"})
        used = {answer}
        while pool and len(placed) < 10:
            best = None
            for candidate in pool:
                word = str(candidate["answer"])
                if word in used:
                    continue
                for existing in placed:
                    existing_word = str(existing["answer"])
                    new_direction = "down" if existing["direction"] == "across" else "across"
                    for new_i, letter in enumerate(word):
                        for old_i, old_letter in enumerate(existing_word):
                            if letter != old_letter:
                                continue
                            cross_r = int(existing["row"]) + (old_i if existing["direction"] == "down" else 0)
                            cross_c = int(existing["col"]) + (old_i if existing["direction"] == "across" else 0)
                            test_r = cross_r - (new_i if new_direction == "down" else 0)
                            test_c = cross_c - (new_i if new_direction == "across" else 0)
                            ok, crossings = can_place(grid, word, test_r, test_c, new_direction)
                            if ok and (best is None or crossings > best[0]):
                                best = (crossings, candidate, test_r, test_c, new_direction)
            if not best:
                break
            _, candidate, row, col, direction = best
            word = str(candidate["answer"])
            dr, dc = (0, 1) if direction == "across" else (1, 0)
            for index, letter in enumerate(word):
                grid[row + dr * index][col + dc * index] = letter
            placed.append({**candidate, "row": row, "col": col, "direction": direction})
            used.add(word)
            pool.remove(candidate)
        if len(placed) >= 7:
            rows = [int(item["row"]) + (len(str(item["answer"])) - 1 if item["direction"] == "down" else 0) for item in placed]
            cols = [int(item["col"]) + (len(str(item["answer"])) - 1 if item["direction"] == "across" else 0) for item in placed]
            min_r, max_r = min(int(item["row"]) for item in placed), max(rows)
            min_c, max_c = min(int(item["col"]) for item in placed), max(cols)
            words = []
            for number, item in enumerate(sorted(placed, key=lambda x: (int(x["row"]), int(x["col"]), x["direction"])), 1):
                words.append({key: value for key, value in item.items() if key != "score"} | {"number": number, "row": int(item["row"]) - min_r, "col": int(item["col"]) - min_c})
            return {"rows": max_r - min_r + 1, "cols": max_c - min_c + 1, "words": words}
    return None


def main() -> None:
    candidates: list[dict[str, object]] = []
    errors: list[str] = []
    for article in feed_articles()[:22]:
        try:
            candidates.extend(article_words(article))
        except Exception as exc:
            errors.append(f"{article['url']}: {exc}")
    deduped: dict[str, dict[str, object]] = {}
    for item in sorted(candidates, key=lambda entry: int(entry["score"]), reverse=True):
        deduped.setdefault(str(item["answer"]), item)
    puzzle = layout(list(deduped.values()))
    if not puzzle:
        raise RuntimeError(f"Could not build a crossword from {len(deduped)} candidates; preserving previous data. {errors[:3]}")
    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NEWSIS official RSS headlines and article leads",
        "title": "오늘의 낱말",
        **puzzle,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload['words'])} crossword words to {OUTPUT}")


if __name__ == "__main__":
    main()
