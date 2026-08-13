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
BAD_ENDINGS = ("한다", "했다", "된다", "됐다", "하고", "하며", "하고는", "이라고", "라고", "이라며", "하면서", "된다면", "해진다", "이었다", "였던", "했던", "입니다", "있다", "없다")
GLOSSARY = {
    "중국": "동아시아에 있는 나라로, 정식 명칭은 중화인민공화국.",
    "혁신": "낡은 제도나 방식 등을 완전히 새롭게 고치는 일.",
    "조국혁신당": "대한민국의 정당 이름.",
    "대규모": "범위나 크기, 인원 따위가 매우 큰 규모.",
    "국가대표": "국가를 대표해 국제 경기나 대회에 참가하는 사람이나 단체.",
    "가스레인지": "가스를 연료로 불을 피워 음식을 조리하는 기구.",
    "인공지능": "컴퓨터가 학습·추론·판단 등 인간의 지적 능력을 수행하게 하는 기술.",
    "공모전": "작품이나 아이디어 등을 공개적으로 모집해 우수한 것을 뽑는 대회.",
    "국가안보실": "대통령을 보좌해 국가 안보와 위기 대응 정책을 총괄하는 대통령실 조직.",
    "중동전쟁": "서아시아와 북아프리카를 아우르는 중동 지역에서 벌어진 전쟁.",
    "동해안": "한반도의 동쪽 바다와 맞닿아 있는 해안 지역.",
    "주지사": "미국 등 연방제 국가에서 한 주의 행정을 책임지는 최고 책임자.",
    "사회공헌": "기업이나 개인이 사회에 도움이 되도록 기부·봉사·지원 등을 하는 활동.",
    "회고전": "한 작가의 활동을 되돌아볼 수 있도록 주요 작품을 모아 여는 전시.",
    "후반기": "전체 기간을 둘로 나누었을 때 뒤쪽에 해당하는 기간.",
    "대기업": "자본금과 종업원 수, 매출 규모 등이 큰 기업.",
    "계열사": "한 기업 집단에 속해 서로 관계를 맺고 있는 회사.",
    "자사주": "회사가 자기 회사의 주식을 사서 보유한 주식.",
    "사망자": "목숨을 잃은 사람.",
    "미사일": "목표물을 향해 스스로 날아가도록 유도되는 무기.",
    "최대주주": "한 회사의 주식을 가장 많이 보유한 주주.",
    "기후장관": "기후·에너지·환경 정책을 맡는 정부 부처의 장관.",
    "전기본": "국가의 장기 전력 수급 방향을 정하는 ‘전력수급기본계획’의 줄임말.",
    "민주노총": "여러 산업별 노동조합이 모여 만든 전국 단위 노동조합 연합 단체.",
    "쟁의대상": "노동조합이 사용자와 다투며 단체행동을 할 수 있는 사안의 범위.",
    "리움미술관": "서울 용산구에 있는 사립 미술관의 이름.",
    "외통위": "국회의 외교통일위원회를 줄여 이르는 말.",
    "후보": "어떤 자격이나 지위를 얻기 위해 심사나 선거의 대상이 된 사람.",
    "경선": "정당 안에서 선거에 나갈 후보자를 고르는 경쟁.",
    "철탑": "송전선 등을 높이 설치하기 위해 세우는 철제 구조물.",
    "교섭": "어떤 일을 이루기 위해 상대와 조건을 주고받으며 의논하는 일.",
    "협상": "서로 다른 의견을 조정해 합의에 이르기 위해 의논하는 일.",
    "국가배상": "공무원의 위법한 직무 행위 등으로 생긴 손해를 국가가 갚는 일.",
    "재판": "법원이 사건의 사실관계와 법률관계를 판단하는 절차.",
    "예비선거": "본선거에 나갈 정당 후보를 미리 뽑는 선거.",
    "고속철도": "열차가 매우 빠른 속도로 달릴 수 있도록 만든 철도.",
    "미술관": "미술 작품을 모아 보존하고 전시하는 시설.",
    "무용수": "춤을 전문적으로 추는 사람.",
    "기본기": "어떤 일을 하는 데 바탕이 되는 기초적인 기술이나 능력.",
    "컬렉션": "일정한 기준에 따라 모은 작품이나 물건의 묶음.",
}


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


def contextual_definition(word: str, article: dict[str, str], body: str) -> str:
    special = {
        "김대식": "기사에서 국회 외교통일위원회 야당 간사로 언급된 정치인의 이름.",
        "라트만스키": "기사에서 한국 무용수의 수준을 평가한 안무가의 이름.",
    }
    if word in special:
        return special[word]
    category = article["category"]
    sentence = next((clean(line) for line in SENTENCE_RE.split(body) if word in line and 20 <= len(clean(line)) <= 110), "")
    if sentence:
        context = sentence.replace(word, "○" * len(word))
        return f"{category} 기사에서 ‘{context[:72]}’의 핵심 대상으로 언급된 {len(word)}글자 말."
    return f"오늘의 {category} 기사 제목에서 핵심 내용을 나타내는 {len(word)}글자 낱말."


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
        definition = GLOSSARY.get(word) or contextual_definition(word, article, body)
        score = 20 + count + min(len(word), 4) + (30 if word in GLOSSARY else 0)
        output.append({"answer": word, "definition": definition, "definitionSource": "사전 뜻풀이" if word in GLOSSARY else "기사 맥락", "clue": clue, "score": score, **article})
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
            continue
        # A new letter may only touch this word along its own direction.
        # Perpendicular neighbours must stay empty unless this is a crossing.
        neighbours = ((rr - 1, cc), (rr + 1, cc)) if direction == "across" else ((rr, cc - 1), (rr, cc + 1))
        for near_r, near_c in neighbours:
            if 0 <= near_r < size and 0 <= near_c < size and grid[near_r][near_c]:
                return False, 0
    return crossings > 0, crossings


def layout(candidates: list[dict[str, object]], size: int = 13) -> dict[str, object] | None:
    daily_seed = int(datetime.now(timezone.utc).strftime("%Y%m%d"))
    for attempt in range(160):
        rng = random.Random(daily_seed + attempt)
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
                            # Every clue needs its own visible start square/number.
                            if not (0 <= test_r < size and 0 <= test_c < size) or grid[test_r][test_c]:
                                continue
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
            starts = [(int(item["row"]), int(item["col"])) for item in placed]
            if len(starts) != len(set(starts)):
                continue
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
    puzzle = layout(list(deduped.values()), size=15)
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
