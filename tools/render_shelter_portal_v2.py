from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/'shelter'/'images'; OUT=ROOT/'portal'/'shelter-panels-v2'; OUT.mkdir(parents=True,exist_ok=True)
W,H=1800,1500; M=(0,188,207); R=(255,45,62); K=(3,6,7); WHT=(248,250,250); GREY=(172,183,187)
REG=r'C:\Windows\Fonts\NotoSansKR-VF.ttf'; BOLD=r'C:\Windows\Fonts\malgunbd.ttf'
def F(s,b=False): return ImageFont.truetype(BOLD if b else REG,s)
def fit(name,pos=.5):
 im=Image.open(SRC/name).convert('RGB'); q=max(W/im.width,H/im.height); im=im.resize((int(im.width*q),int(im.height*q)),Image.Resampling.LANCZOS); x=(im.width-W)//2; y=int((im.height-H)*pos); return im.crop((x,y,x+W,y+H)).convert('RGBA')
def dark(im,left=.25,bottom=.65):
 ov=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(ov)
 for y in range(H):
  a=int(255*(left+bottom*(y/H)**1.8)); d.line((0,y,W,y),fill=(0,0,0,min(235,a)))
 return Image.alpha_composite(im,ov)
def T(im,xy,s,size,c=WHT,b=True,anchor='la',space=8): ImageDraw.Draw(im).multiline_text(xy,s,font=F(size,b),fill=c,anchor=anchor,spacing=space)
def chrome(im,n,darkmode=True):
 d=ImageDraw.Draw(im); c=WHT if darkmode else (20,25,27); mc=(175,185,188) if darkmode else (90,102,105)
 d.text((72,55),f'VISUAL NEWSIS   편집# 003   {n:02d}',font=F(17,True),fill=c); d.line((72,96,430,96),fill=M,width=4)
 d.text((72,H-48),'대한민국, 준비됐나요?',font=F(16),fill=mc); d.text((W-72,H-48),'기획·디렉터 = 안재현 기자',font=F(16),fill=mc,anchor='ra')
def save(im,n,name,darkmode=True): chrome(im,n,darkmode); im.convert('RGB').save(OUT/f'{n:02d}-{name}.png','PNG',optimize=True)
def glowline(d,p1,p2,color=M,w=5):
 for k,a in [(28,20),(16,35),(8,70)]: d.line((*p1,*p2),fill=color+(a,),width=k)
 d.line((*p1,*p2),fill=color+(255,),width=w)

# 01 — cinematic cover
im=dark(fit('window-apartment.webp'),.12,.78); d=ImageDraw.Draw(im)
d.rectangle((72,185,248,228),fill=M); T(im,(90,194),'THE FIVE MINUTES',17,K,True)
T(im,(78,330),'대한민국,',124); T(im,(78,490),'준비됐나요?',146,M)
T(im,(88,760),'경보 이후 5분.\n당신의 행동을 따라갑니다.',38,GREY,False,space=18)
T(im,(1710,1160),'05:00',205,WHT,False,'ra'); save(im,1,'cover')

# 02 — alarm as a visual rupture
im=dark(fit('bedroom.webp'),.12,.74); d=ImageDraw.Draw(im)
T(im,(80,220),'뉴스를 읽던 밤.',34,GREY,False); T(im,(75,315),'경보',190,R); T(im,(80,535),'가 화면을 덮었습니다.',62)
d.line((80,700,1720,700),fill=R,width=3); d.rectangle((80,735,1720,900),fill=(18,20,22,235))
d.ellipse((125,790,151,816),fill=R); T(im,(190,770),'미사일 경보',48); T(im,(1660,785),'지금',22,GREY,False,'ra')
T(im,(80,1045),'멀리 있던 전쟁이\n당신의 시간 안으로 들어옵니다.',48,WHT,True,space=14); save(im,2,'alarm')

# 03 — one decisive contrast
left=fit('hallway.webp'); right=fit('stairs.webp'); im=Image.new('RGBA',(W,H),K+(255,)); im.paste(left.crop((0,0,W//2,H)),(0,0)); im.paste(right.crop((W//2,0,W,H)),(W//2,0))
ov=Image.new('RGBA',(W,H)); od=ImageDraw.Draw(ov); od.rectangle((0,0,W//2,H),fill=(40,0,4,185)); od.rectangle((W//2,0,W,H),fill=(0,25,29,155)); im=Image.alpha_composite(im,ov); d=ImageDraw.Draw(im)
T(im,(80,210),'01',100,R); T(im,(80,335),'엘리베이터',58); T(im,(80,430),'정전과 고장으로\n멈출 수 있습니다.',31,GREY,False,space=12); d.line((80,640,760,640),fill=R,width=7); T(im,(80,690),'이 선택은\n재난 행동요령과 다릅니다.',49,WHT,True,space=12)
T(im,(980,210),'02',100,M); T(im,(980,335),'비상계단',58); T(im,(980,430),'고층 건물에서는\n계단으로 대피합니다.',31,WHT,False,space=12); d.line((980,640,1660,640),fill=M,width=7); T(im,(980,690),'문이 열립니다.\n아래로 이동합니다.',49,WHT,True,space=12)
save(im,3,'stairs')

# 04 — apartment window, minimal command
im=dark(fit('window-apartment.webp'),.1,.55); d=ImageDraw.Draw(im)
for x in [550,900,1250]: d.line((x,180,x+35,800),fill=(255,255,255,65),width=3)
T(im,(80,220),'콰과과광.',88,R); T(im,(80,355),'본능은 창밖을 보라고 말합니다.',36,GREY,False)
T(im,(80,945),'다가가지 마십시오.',86,WHT); T(im,(80,1070),'유리창에서 떨어져\n창문이 없는 곳에서 몸을 보호합니다.',40,M,True,space=15); save(im,4,'window')

# 05 — route, full-bleed directional typography
im=dark(fit('tunnel.webp'),.25,.62); d=ImageDraw.Draw(im)
T(im,(80,235),'차를 두고,',96,GREY); T(im,(80,365),'지하로.',150,M)
glowline(d,(110,730),(1540,730)); d.polygon([(1540,705),(1630,730),(1540,755)],fill=M)
T(im,(110,785),'현재 위치',22,WHT,False); T(im,(1630,785),'가까운 대피시설',22,M,True,'ra')
T(im,(80,1030),'운전 중이라면 도로 오른쪽에 정차한 뒤\n민방위 대피소·지하철역·지하 주차장으로 이동합니다.',36,WHT,False,space=16); save(im,5,'underground')

# 06 — information hierarchy
im=dark(fit('shelter.webp'),.18,.7); d=ImageDraw.Draw(im)
T(im,(80,220),'소문은 빠릅니다.',72,GREY); T(im,(80,330),'공식 안내는\n정확해야 합니다.',92,WHT)
T(im,(80,665),'SNS',105,R); d.line((80,800,570,800),fill=R,width=6); T(im,(80,840),'확인되지 않은 영상\n유언비어와 추측',30,GREY,False,space=12)
T(im,(900,665),'정부 안내',105,M); d.line((900,800,1660,800),fill=M,width=6); T(im,(900,840),'재난방송\n국민행동요령',30,WHT,False,space=12)
T(im,(80,1125),'대피한 뒤에는 정부의 안내에 따라 행동하십시오.',38,WHT); save(im,6,'official')

# 07 — stark ending
im=Image.new('RGBA',(W,H),K+(255,)); d=ImageDraw.Draw(im)
for r,a in [(500,28),(370,44),(245,80)]: d.ellipse((W//2-r,H//2-r-90,W//2+r,H//2+r-90),outline=M+(a,),width=3)
T(im,(W//2,310),'00:00',205,WHT,False,'ma'); T(im,(W//2,665),'경보는 기다리지 않습니다.',54,GREY,True,'ma'); T(im,(W//2,825),'준비는 경보 전에',58,WHT,True,'ma'); T(im,(W//2,945),'끝나야 합니다.',82,M,True,'ma'); save(im,7,'zero')

# 08 — clean action card, strong finish
im=Image.new('RGBA',(W,H),(240,243,243,255)); d=ImageDraw.Draw(im)
T(im,(75,170),'지금, 세 가지만.',28,(0,134,149),True); T(im,(70,255),'당신의 5분을\n미리 준비하십시오.',85,(13,18,19))
items=[('01','재난문자 알림'),('02','위치 기반 재난정보'),('03','가까운 민방위 대피소')]
for i,(num,label) in enumerate(items):
 y=650+i*132; d.line((75,y+100,1190,y+100),fill=(188,198,201),width=2); T(im,(75,y),num,25,(0,147,164),True); T(im,(180,y-11),label,42,(17,23,24))
T(im,(1715,730),'당신은,',56,(100,110,113),True,'ra'); T(im,(1715,835),'준비됐나요?',92,(0,150,167),True,'ra')
T(im,(1715,1020),'행동요령 확인  ↗\n대피소 찾기  ↗\n관련 기사  ↗',25,(65,75,78),False,'ra',space=18); save(im,8,'action',False)

# comparison contact sheet
files=sorted(OUT.glob('[0-9][0-9]-*.png')); sheet=Image.new('RGB',(1740,1980),(222,226,227)); sd=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 t=Image.open(p).convert('RGB'); t.thumbnail((540,450),Image.Resampling.LANCZOS); x=30+i%3*570; y=45+i//3*640; sd.text((x,y-28),p.name,font=F(18,True),fill=(30,35,36)); sheet.paste(t,(x,y))
sheet.save(OUT/'contact-sheet.jpg','JPEG',quality=90,optimize=True)
print(f'Rendered {len(files)} premium panels to {OUT}')
