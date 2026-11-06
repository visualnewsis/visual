from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

def remove_magenta(image):
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            dominance = min(r - g, b - g)
            if r > 135 and b > 105 and g < 155 and dominance > 32 and (r + b) > (2 * g + 90):
                pixels[x, y] = (0, 0, 0, 0)
    bounds = image.getbbox()
    return image.crop(bounds) if bounds else image

sheet = Image.open(ASSETS / "chungmuman-sprites-magenta.png")
crops = {
    "run": (35, 155, 365, 730),
    "jump": (385, 145, 715, 690),
    "double": (730, 140, 1030, 675),
    "slide": (1010, 370, 1415, 790),
    "pushed": (1425, 190, 1765, 755),
}
for name, box in crops.items():
    sprite = remove_magenta(sheet.crop(box))
    if name == "jump":
        mask = Image.new("L", sprite.size, 0)
        ImageDraw.Draw(mask).polygon([(168, 238), (198, 221), (208, 231), (177, 263)], fill=255)
        transparent = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
        sprite = Image.composite(transparent, sprite, mask)
    sprite.save(ASSETS / f"chungmuman-{name}.png", optimize=True)

tired = Image.open(ASSETS / "chungmuman-tired-magenta.png")
remove_magenta(tired).save(ASSETS / "chungmuman-tired.png", optimize=True)

slide = Image.open(ASSETS / "chungmuman-slide-magenta.png")
remove_magenta(slide).save(ASSETS / "chungmuman-slide.png", optimize=True)
