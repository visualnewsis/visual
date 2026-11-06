from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "arcade" / "assets" / "chungmuman" / "chungmuman-concept-v4-shirt.png"
DEST = Path(__file__).resolve().parents[1] / "assets"
DEST.mkdir(parents=True, exist_ok=True)

CROPS = {
    "idle": (155, 55, 430, 520),
    "run": (600, 55, 955, 525),
    "jump": (1080, 70, 1425, 535),
    "slide": (55, 560, 560, 960),
    "tired": (610, 555, 1090, 965),
}

FACE_SEEDS = {
    "idle": (135, 220),
    "run": (185, 220),
    "jump": (150, 220),
    "slide": (205, 230),
    "tired": (185, 240),
}

image = Image.open(SOURCE).convert("RGBA")
for name, box in CROPS.items():
    sprite = image.crop(box)
    original = sprite.copy()
    pixels = sprite.load()
    queue = deque()
    seen = set()
    for x in range(sprite.width):
        queue.extend(((x, 0), (x, sprite.height - 1)))
    for y in range(sprite.height):
        queue.extend(((0, y), (sprite.width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= sprite.width or y >= sprite.height:
            continue
        seen.add((x, y))
        r, g, b, _ = pixels[x, y]
        distance = abs(r - 251) + abs(g - 243) + abs(b - 233)
        if distance > 72:
            continue
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    face_queue = deque([FACE_SEEDS[name]])
    face_seen = set()
    original_pixels = original.load()
    while face_queue:
        x, y = face_queue.popleft()
        if (x, y) in face_seen or x < 0 or y < 0 or x >= sprite.width or y >= sprite.height:
            continue
        face_seen.add((x, y))
        r, g, b, a = original_pixels[x, y]
        if max(r, g, b) < 155:
            continue
        pixels[x, y] = (r, g, b, a)
        face_queue.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    face_x = [point[0] for point in face_seen]
    face_y = [point[1] for point in face_seen]
    left, right = max(0, min(face_x)-12), min(sprite.width, max(face_x)+13)
    top, bottom = max(0, min(face_y)-12), min(sprite.height, max(face_y)+13)
    for y in range(top, bottom):
        for x in range(left, right):
            if (x, y) in face_seen:
                continue
            r, g, b, a = pixels[x, y]
            if abs(r-251)+abs(g-243)+abs(b-233) < 145:
                pixels[x, y] = (r, g, b, 0)
    bounds = sprite.getbbox()
    if bounds:
        sprite = sprite.crop(bounds)
    sprite.save(DEST / f"chungmuman-{name}.png", optimize=True)
