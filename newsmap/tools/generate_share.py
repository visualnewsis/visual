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
d.text((64,196),'뉴스맵부심',font=font(79,True),fill='#202d2b')
d.text((69,313),'뉴스가 빛나는 지도',font=font(30),fill='#e85238')
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
