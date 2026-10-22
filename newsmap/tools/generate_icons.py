"""Draw the existing newsmap orbit symbol as local browser/home-screen icons."""
from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parents[1] / 'assets'
ASSETS.mkdir(exist_ok=True)
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<rect width="96" height="96" rx="20" fill="#fcfbf7"/>
<g fill="none" stroke="#e85238"><circle cx="48" cy="48" r="34" stroke-width="3" opacity=".45"/>
<circle cx="48" cy="48" r="23" stroke-width="3" opacity=".75"/></g>
<circle cx="48" cy="48" r="11" fill="#e85238"/>
<circle cx="73" cy="25" r="6" fill="#fcfbf7" stroke="#e85238" stroke-width="3"/>
</svg>
'''
(ASSETS / 'favicon.svg').write_text(SVG, encoding='utf-8')

def icon(size):
    scale = 4
    ratio = size * scale / 96
    im = Image.new('RGB', (size * scale, size * scale), '#fcfbf7')
    draw = ImageDraw.Draw(im)
    def circle(cx, cy, r, fill=None, outline=None, width=3):
        box = [(cx-r)*ratio, (cy-r)*ratio, (cx+r)*ratio, (cy+r)*ratio]
        draw.ellipse(box, fill=fill, outline=outline, width=max(1, round(width*ratio)))
    circle(48,48,34,outline='#f3c9bd')
    circle(48,48,23,outline='#ed8f7a')
    circle(48,48,11,fill='#e85238')
    circle(73,25,6,fill='#fcfbf7',outline='#e85238')
    return im.resize((size,size),Image.Resampling.LANCZOS)

for size,name in [(96,'favicon-96.png'),(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:
    icon(size).save(ASSETS/name, optimize=True)
icon(48).save(ASSETS/'favicon.ico', sizes=[(16,16),(32,32),(48,48)])
