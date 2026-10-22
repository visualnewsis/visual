"""Render the code-drawn social card; no generated photography is used."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#fcfbf7')
d=ImageDraw.Draw(im)
regular='C:/Windows/Fonts/malgun.ttf'
bold='C:/Windows/Fonts/malgunbd.ttf'
font=lambda size,heavy=False:ImageFont.truetype(bold if heavy else regular,size)
d.text((64,53),'VISUAL NEWSIS',font=font(19,True),fill='#526b4b')
title_font=font(79,True)
title_box=d.textbbox((0,0),'뉴스맵부심',font=title_font,anchor='lt')
d.text((64-title_box[0],196),'뉴스맵부심',font=title_font,fill='#202d2b',anchor='lt')
tagline='뉴스가 빛나는 지도'
tagline_font=font(30)
title_width=title_box[2]-title_box[0]
boxes=[d.textbbox((0,0),c,font=tagline_font,anchor='lt') for c in tagline]
widths=[b[2]-b[0] for b in boxes]
gap=(title_width-sum(widths))/(len(tagline)-1)
x=64
for character,box,width in zip(tagline,boxes,widths):
    d.text((x-box[0],313),character,font=tagline_font,fill='#e85238',anchor='lt')
    x+=width+gap
d.text((64,411),'여기 무슨 일 있어?',font=font(26,True),fill='#526b4b')
d.text((69,465),'도시에서 동네까지, 뉴시스를 읽는 새로운 방법',font=font(19),fill='#78817b')
geo=json.loads((ROOT/'data/geography.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n'))
def point(lon,lat):return (int(665+(lon-125.5)*93),int(560-(lat-33)*85))
for n in geo['nodes']:
    if n['level']!='dong' or n.get('kind')=='locality':continue
    for polygon in n['geometry']['coordinates']:
        pts=[point(x,y) for x,y in polygon[0]]
        if len(pts)>2:d.polygon(pts,fill='#e2e9da')
for lon,lat in [(126.98,37.57),(129.05,35.18),(127.4,36.34),(128.6,35.9),(126.55,33.4),(127.0,35.1),(128.2,37.5)]:
    x,y=point(lon,lat)
    for radius,color in [(30,'#eed3c7'),(20,'#e6ad9a')]:d.ellipse((x-radius,y-radius,x+radius,y+radius),outline=color,width=2)
    d.ellipse((x-7,y-7,x+7,y+7),fill='#e85238')
(ROOT/'assets').mkdir(exist_ok=True)
im.save(ROOT/'assets/share.png',optimize=True)
