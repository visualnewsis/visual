from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "portal" / "shelter-panels"
IMG = ROOT / "shelter" / "images"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1800, 1500
MINT = (0, 180, 201)
WHITE = (246, 249, 249)
MUTED = (180, 192, 196)
BLACK = (4, 7, 8)
RED = (235, 48, 61)
FONT = Path(r"C:\Windows\Fonts\NotoSansKR-VF.ttf")
LOGO = ROOT / "assets" / "logo2024.png"

def font(size, bold=False):
    return ImageFont.truetype(str(FONT), size=size, layout_engine=ImageFont.Layout.RAQM)

def cover(path, darkness=.48, blur=0):
    im = Image.open(path).convert("RGB")
    ratio = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
    x, y = (im.width-W)//2, (im.height-H)//2
    im = im.crop((x, y, x+W, y+H))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    shade = Image.new("RGBA", (W,H), (0,0,0,0))
    sd = ImageDraw.Draw(shade)
    for yy in range(H):
        a = int(255 * min(.92, darkness + .34 * (1-yy/H)))
        sd.line((0,yy,W,yy), fill=(0,0,0,a))
    return Image.alpha_composite(im.convert("RGBA"), shade)

def blank(color=BLACK):
    return Image.new("RGBA", (W,H), color + (255,))

def brand(im, no):
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((70,55,430,102), 4, fill=(3,8,9,190), outline=(100,120,125,110), width=1)
    d.text((90,67), f"VISUAL NEWSIS · 편집# 003 · {no:02d}", font=font(18), fill=WHITE)
    d.line((70,H-58,W-70,H-58), fill=(255,255,255,45), width=1)
    d.text((70,H-44), "대한민국, 준비됐나요?", font=font(17), fill=MUTED)
    d.text((W-70,H-44), "기획·디렉터 = 안재현 기자", font=font(17), fill=MUTED, anchor="ra")

def text(im, xy, value, size, color=WHITE, anchor="la", spacing=8, stroke=0):
    ImageDraw.Draw(im).multiline_text(xy, value, font=font(size), fill=color, anchor=anchor,
        spacing=spacing, stroke_width=stroke, stroke_fill=(0,0,0,180))

def pill(im, xy, value, color=MINT):
    d=ImageDraw.Draw(im); f=font(20); box=d.textbbox((0,0),value,font=f); tw=box[2]-box[0]
    x,y=xy; d.rounded_rectangle((x,y,x+tw+40,y+48),24,fill=color+(235,)); d.text((x+20,y+11),value,font=f,fill=BLACK)

def save(im, name):
    brand(im, int(name[:2])); im.convert("RGB").save(OUT/name, "PNG", optimize=True)

# 01 — cover
im=cover(IMG/"window-apartment.webp", .5)
pill(im,(90,180),"5분의 행동요령")
text(im,(90,340),"대한민국,\n준비됐나요?",120)
text(im,(95,660),"경보가 울린 뒤 우리에게 주어진 시간.\n그 5분을 이미지로 따라갑니다.",38,MUTED,spacing=18)
text(im,(95,905),"05:00",190,MINT)
save(im,"01-cover.png")

# 02 — alert
im=cover(IMG/"bedroom.webp", .62)
text(im,(90,230),"뉴스를 읽던 밤,",42,MUTED)
text(im,(90,320),"화면 위로\n경보가 내려옵니다.",82)
d=ImageDraw.Draw(im)
d.rounded_rectangle((960,260,1690,690),36,fill=(23,29,32,238),outline=(255,255,255,45),width=2)
d.ellipse((1010,315,1032,337),fill=RED)
text(im,(1060,305),"안전 알림 · 체험용",24,WHITE)
text(im,(1020,395),"미사일 경보",52)
text(im,(1020,500),"가상 알림입니다.\n안내에 따라 안전한 곳으로\n이동하십시오.",27,MUTED,spacing=15)
text(im,(90,1020),"전쟁은 멀리 있지 않습니다.\n이제 5분이 시작됩니다.",48,WHITE,spacing=20)
save(im,"02-alert.png")

# 03 — stairs
im=cover(IMG/"hallway.webp", .67)
text(im,(90,190),"CHAPTER 01",22,MINT)
text(im,(90,245),"집을 나설 때,\n엘리베이터가 아닌\n비상계단으로.",74)
d=ImageDraw.Draw(im)
d.rounded_rectangle((90,760,820,1080),28,fill=(80,6,12,205),outline=RED,width=3)
text(im,(140,815),"엘리베이터",42,WHITE); text(im,(735,810),"×",70,RED,anchor="ma")
text(im,(140,900),"정전과 고장으로\n멈출 수 있습니다.",27,MUTED,spacing=13)
d.rounded_rectangle((900,760,1710,1080),28,fill=(0,53,60,215),outline=MINT,width=3)
text(im,(950,815),"비상계단",42,WHITE); text(im,(1625,820),"✓",55,MINT,anchor="ma")
text(im,(950,900),"고층 건물에서는\n계단으로 대피합니다.",27,MUTED,spacing=13)
save(im,"03-stairs.png")

# 04 — window
im=cover(IMG/"window-apartment.webp", .43)
text(im,(90,180),"CHAPTER 02",22,MINT)
text(im,(90,245),"창문 밖에서\n굉음이 들려도,",76)
text(im,(90,470),"확인하려 다가가지 마십시오.",42,MUTED)
d=ImageDraw.Draw(im)
d.rounded_rectangle((90,865,1710,1125),24,fill=(3,8,10,220),outline=(255,255,255,45),width=2)
text(im,(140,915),"유리창에서 떨어져",38,WHITE)
text(im,(140,985),"창문이 없는 안전한 곳에서 몸을 보호합니다.",30,MINT)
save(im,"04-window.png")

# 05 — shelter route
im=cover(IMG/"tunnel.webp", .58)
text(im,(90,185),"CHAPTER 03",22,MINT)
text(im,(90,245),"자동차보다\n가까운 지하로.",82)
text(im,(95,490),"민방위 대피소 · 지하철역 · 지하 주차장",28,MUTED)
d=ImageDraw.Draw(im)
d.line((150,790,1600,790),fill=(255,255,255,80),width=3)
for x,label,c in [(170,"현재 위치",WHITE),(820,"가까운 대피시설",MINT),(1580,"먼 목적지",(110,120,124))]:
    d.ellipse((x-14,776,x+14,804),fill=c); text(im,(x,835),label,23,c,anchor="ma")
text(im,(90,1070),"운전 중이라면 도로 오른쪽에 정차한 뒤\n가까운 대피시설로 이동합니다.",34,WHITE,spacing=16)
save(im,"05-route.png")

# 06 — official info
im=cover(IMG/"shelter.webp", .66)
text(im,(90,180),"CHAPTER 04",22,MINT)
text(im,(90,245),"대피한 뒤에는\n소문보다 공식 안내를.",76)
d=ImageDraw.Draw(im)
d.rounded_rectangle((90,700,760,1080),24,fill=(48,8,14,215),outline=RED,width=2)
text(im,(140,755),"SNS 소문",38); text(im,(140,840),"확인되지 않은 영상과\n유언비어에 동요하지 않습니다.",27,MUTED,spacing=14)
d.rounded_rectangle((840,700,1710,1080),24,fill=(0,51,58,220),outline=MINT,width=3)
text(im,(890,755),"정부 공식 안내",38); text(im,(890,840),"재난방송과 국민행동요령을\n먼저 확인합니다.",27,WHITE,spacing=14)
save(im,"06-information.png")

# 07 — no restart
im=blank()
d=ImageDraw.Draw(im)
for r,a in [(520,22),(400,35),(285,55)]: d.ellipse((W//2-r,H//2-r-40,W//2+r,H//2+r-40),outline=MINT+(a,),width=3)
text(im,(W//2,340),"00:00",180,WHITE,anchor="ma")
text(im,(W//2,660),"오늘은 연습이었습니다.",58,WHITE,anchor="ma")
text(im,(W//2,805),"실제 상황에서는\n다시 시작할 수 없습니다.",66,MINT,anchor="ma",spacing=18)
text(im,(W//2,1080),"시간은 기다려주지 않습니다.",26,MUTED,anchor="ma")
save(im,"07-zero.png")

# 08 — action ending
im=blank((241,244,244)); d=ImageDraw.Draw(im)
text(im,(90,170),"지금 확인해 두십시오.",24,(0,130,146))
text(im,(90,235),"당신의 5분을\n바꾸는 세 가지.",78,(12,17,18))
items=["재난문자 알림 켜기","위치 기반 재난정보 확인","가까운 민방위 대피소 확인"]
for i,item in enumerate(items):
    y=590+i*135; d.rounded_rectangle((90,y,1160,y+95),18,fill=(255,255,255,255),outline=(215,222,224,255),width=2)
    d.rounded_rectangle((125,y+27,166,y+68),7,fill=MINT); text(im,(145,y+47),"✓",22,WHITE,anchor="mm")
    text(im,(205,y+25),item,31,(18,23,24))
text(im,(90,1080),"당신은,",46,(70,80,83))
text(im,(90,1145),"준비됐나요?",92,(0,143,161))
text(im,(1710,1110),"행동요령 · 대피소 찾기 · 관련 기사",20,(90,100,103),anchor="ra")
save(im,"08-action.png")

# Contact sheet
thumbs=[]
for p in sorted(OUT.glob("[0-9][0-9]-*.png")):
    t=Image.open(p).convert("RGB"); t.thumbnail((540,450),Image.Resampling.LANCZOS); thumbs.append((p.name,t.copy()))
sheet=Image.new("RGB",(1740,1980),(225,229,230)); sd=ImageDraw.Draw(sheet)
for i,(name,t) in enumerate(thumbs):
    x=30+(i%3)*570; y=45+(i//3)*640; sd.text((x,y-28),name,font=font(18),fill=(30,35,36)); sheet.paste(t,(x,y))
sheet.save(OUT/"contact-sheet.jpg","JPEG",quality=88,optimize=True)
print(f"Rendered {len(thumbs)} panels to {OUT}")
