#!/usr/bin/env python3
"""Build the 뉴스 조각맞춤 bank from NEWSIS RSS and staff photographs."""

from __future__ import annotations

import html
import io
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[2]
GAME_ROOT = ROOT / "arcade" / "puzzle"
OUTPUT = GAME_ROOT / "data" / "puzzles.json"
IMAGE_DIR = GAME_ROOT / "assets" / "photos"
MAX_PUZZLES = 12
USER_AGENT = "VisualNewsis-PhotoPuzzle/1.0"
BLOCKED_TITLE_FRAGMENTS = ("소식]",)

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
ARTICLE_ID_RE = re.compile(r"(NISX\d+_\d+)")

# The location and reporter names vary. The NEWSIS staff-photo structure does not.
STAFF_CREDIT_RE = re.compile(
    r"\[[^\]\r\n=]{1,30}=뉴시스\]\s*"
    r"[가-힣A-Za-z·\s]{2,60}\s+기자\s*="
)
BLOCKED_CREDIT_RE = re.compile(
    r"(?:AP|AFP|EPA|로이터|신화|교도|게티이미지|UPI|XINHUA)\s*(?:/|·)\s*뉴시스"
    r"|(?:사진|자료|이미지)\s*=\s*[^<\n]{0,80}제공"
    r"|제공사진|공동취재사진|재판매\s*및\s*DB\s*금지",
    re.IGNORECASE,
)


class MetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "meta":
            return
        values = {key.lower(): value or "" for key, value in attrs}
        key = values.get("property") or values.get("name")
        content = values.get("content")
        if key and content:
            self.meta[key.lower()] = html.unescape(content.strip())


def clean(value: str | None) -> str:
    text = html.unescape(TAG_RE.sub(" ", value or ""))
    return SPACE_RE.sub(" ", text).strip()


def excerpt(value: str, limit: int = 170) -> str:
    text = clean(value)
    if len(text) <= limit:
        return text
    shortened = text[:limit]
    boundary = max(shortened.rfind("."), shortened.rfind("?"), shortened.rfind("!"))
    if boundary >= 70:
        return shortened[:boundary + 1]
    return shortened.rstrip() + "…"


def request_bytes(url: str, timeout: int = 25) -> tuple[bytes, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers.get_content_type()


def feed_items(category: str, url: str) -> list[dict[str, str]]:
    payload, _ = request_bytes(url)
    root = ET.fromstring(payload)
    items: list[dict[str, str]] = []
    for item in root.findall(".//item"):
        title = clean(item.findtext("title"))
        link = clean(item.findtext("link"))
        summary = clean(item.findtext("description"))
        if (
            12 <= len(title) <= 100
            and link.startswith("https://www.newsis.com/")
            and not any(fragment in title for fragment in BLOCKED_TITLE_FRAGMENTS)
        ):
            items.append({"category": category, "title": title, "summary": summary, "url": link})
        if len(items) >= 24:
            break
    return items


def image_credit_context(source: str, image_url: str) -> str:
    decoded = html.unescape(source)
    candidates = [image_url, urllib.parse.urlparse(image_url).path.rsplit("/", 1)[-1]]
    positions: set[int] = set()
    for candidate in candidates:
        if not candidate:
            continue
        positions.update(match.start() for match in re.finditer(re.escape(candidate), decoded))
    if not positions:
        return ""
    contexts = [clean(decoded[max(0, position - 5000):position + 9000]) for position in sorted(positions)]
    return " ".join(contexts)


def article_photo(article: dict[str, str]) -> dict[str, str] | None:
    payload, content_type = request_bytes(article["url"])
    if content_type not in {"text/html", "application/xhtml+xml"}:
        return None
    source = payload.decode("utf-8", errors="ignore")
    parser = MetaParser()
    parser.feed(source)
    image_url = parser.meta.get("og:image", "")
    if not image_url.startswith(("https://", "http://")):
        return None

    context = image_credit_context(source, image_url)
    blocked = BLOCKED_CREDIT_RE.search(context) if context else None
    staff = STAFF_CREDIT_RE.search(context) if context else None
    if not context or blocked or not staff:
        return None

    description = parser.meta.get("og:description") or article["summary"]
    credit_match = staff
    return {
        **article,
        "imageUrl": image_url,
        "description": excerpt(description),
        "credit": SPACE_RE.sub(" ", credit_match.group(0)).strip() if credit_match else "",
    }


def save_photo(photo: dict[str, str], slot: int) -> str:
    payload, content_type = request_bytes(photo["imageUrl"], timeout=30)
    if not content_type.startswith("image/") or len(payload) > 18_000_000:
        raise ValueError(f"unsupported image response: {content_type}, {len(payload)} bytes")
    with Image.open(io.BytesIO(payload)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        if image.width < 720 or image.height < 480:
            raise ValueError(f"image is too small: {image.width}x{image.height}")
        fitted = ImageOps.fit(image, (960, 640), method=Image.Resampling.LANCZOS)
        filename = f"puzzle-{slot:02d}.jpg"
        destination = IMAGE_DIR / filename
        fitted.save(destination, "JPEG", quality=76, optimize=True, progressive=True)
    return f"./assets/photos/{filename}"


def main() -> None:
    candidates: list[dict[str, str]] = []
    seen: set[str] = set()
    errors: list[str] = []
    for category, feed_url in FEEDS.items():
        try:
            for item in feed_items(category, feed_url):
                if item["url"] not in seen:
                    seen.add(item["url"])
                    candidates.append(item)
        except Exception as exc:
            errors.append(f"{category} RSS: {exc}")

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    selected: list[dict[str, str]] = []
    seen_images: set[str] = set()
    for candidate in candidates:
        if len(selected) >= MAX_PUZZLES:
            break
        try:
            photo = article_photo(candidate)
            if not photo:
                continue
            if photo["imageUrl"] in seen_images:
                continue
            seen_images.add(photo["imageUrl"])
            article_id_match = ARTICLE_ID_RE.search(photo["url"])
            article_id = article_id_match.group(1) if article_id_match else f"news-{len(selected) + 1}"
            local_image = save_photo(photo, len(selected) + 1)
            selected.append({
                "id": article_id,
                "category": photo["category"],
                "title": photo["title"],
                "description": photo["description"],
                "url": photo["url"],
                "image": local_image,
                "credit": photo["credit"],
            })
        except Exception as exc:
            errors.append(f"{candidate['url']}: {exc}")

    if len(selected) < 6:
        raise RuntimeError(
            f"Only {len(selected)} eligible staff photographs collected; preserving previous data. "
            + " | ".join(errors[-8:])
        )

    for path in IMAGE_DIR.glob("puzzle-*.jpg"):
        try:
            slot = int(path.stem.rsplit("-", 1)[-1])
        except ValueError:
            continue
        if slot > len(selected):
            path.unlink()

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NEWSIS official RSS and staff photographs",
        "count": len(selected),
        "puzzles": selected,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(selected)} photo puzzles to {OUTPUT}")


if __name__ == "__main__":
    main()
