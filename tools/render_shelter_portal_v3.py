from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import zipfile

ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/'shelter'/'images'; OUT=ROOT/'portal'/'shelter-portal-v3'; JPG=ROOT/'portal'/'shelter-portal-v3-jpg'
OUT.mkdir(parents=True,exist_ok=True); JPG.mkdir(parents=True,exist_ok=True)
W=1800; INK=(12,16,17); PAPER=(244,245,244); WHITE=(248,249,249); MINT=(0,156,174); MUTED=(156,166,169)
REG=r'C:\Windows\Fonts\NotoSansKR-VF.ttf'
def F(s,b=False):
 f=ImageFont.truetype(REG,s)
 f.set_variation_by_axes([800 if b else 400])
 return f
def photo(name,w,h,pos=.5,shade=.18):
 im=Image.open(SRC/name).convert('RGB'); q=max(w/im.width,h/im.height); im=im.resize((int(im.width*q),int(im.height*q)),Image.Resampling.LANCZOS); x=(im.width-w)//2; y=int((im.height-h)*pos); im=im.crop((x,y,x+w,y+h)); im=ImageEnhance.Color(im).enhance(.72); im=ImageEnhance.Contrast(im).enhance(1.04)
 if shade:
  ov=Image.new('RGBA',(w,h)); d=ImageDraw.Draw(ov)
  for yy in range(h): d.line((0,yy,w,yy),fill=(0,0,0,int(255*(shade+.34*(yy/h)**2))))
  im=Image.alpha_composite(im.convert('RGBA'),ov).convert('RGB')
 return im
def T(d,xy,s,size,c=WHITE,b=True,anchor='la',spacing=10): d.multiline_text(xy,s,font=F(size,b),fill=c,anchor=anchor,spacing=spacing)
def mast(d,h,dark=True):
 c=WHITE if dark else INK; muted=MUTED if dark else (95,104,106)
 T(d,(72,58),'VISUAL NEWSIS',17,c,True); d.line((72,93,210,93),fill=MINT,width=3); T(d,(235,58),'편집# 003',16,muted,False)
 T(d,(72,h-48),'대한민국, 준비됐나요?',15,muted,False); T(d,(W-72,h-48),'기획·디렉터 = 안재현 기자',15,muted,False,'ra')
def save(im,name,dark=True):
 mast(ImageDraw.Draw(im),im.height,dark); im.save(OUT/name,'PNG',optimize=True); im.save(JPG/(Path(name).stem+'.jpg'),'JPEG',quality=92,optimize=True,progressive=True)

# 01 — one photographic cover, no campaign graphics
H=1900; im=photo('window-apartment.webp',W,H,.2,.14); d=ImageDraw.Draw(im)
d.rectangle((0,1120,W,H),fill=(5,8,9,214)); T(d,(82,1250),'대한민국,',105); T(d,(82,1390),'준비됐나요?',126)
d.line((84,1565,185,1565),fill=MINT,width=5); T(d,(220,1533),'경보 이후, 우리가 알아야 할 행동요령',31,(207,213,214),False)
T(d,(84,1665),'가까운 지하로 이동하고, 창문에서 떨어지고,\n정부의 공식 안내를 확인해야 합니다.',30,MUTED,False,spacing=14); save(im,'01-cover.png')

# 02 — three documentary frames with restrained captions
H=2700; im=Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(im); mast(d,H,True)
sections=[('hallway.webp','엘리베이터 대신 비상계단을 이용합니다.','정전이나 건물 손상으로 운행이 중단될 수 있습니다.'),('window-apartment.webp','굉음이 들려도 창문으로 다가가지 않습니다.','유리창이 없는 건물 안쪽에서 몸을 보호합니다.'),('tunnel.webp','자동차보다 가까운 지하시설을 우선합니다.','운전 중이라면 오른쪽에 정차한 뒤 대피합니다.')]
for i,(name,head,body) in enumerate(sections):
 y=145+i*820; ph=photo(name,W-144,610,.45,.08); im.paste(ph,(72,y)); d=ImageDraw.Draw(im); d.rectangle((72,y+440,W-72,y+610),fill=(5,8,9,198)); T(d,(105,y+480),f'0{i+1}',20,MINT,True); T(d,(170,y+465),head,38,WHITE,True); T(d,(170,y+525),body,23,(190,199,201),False)
save(im,'02-actions.png')

# 03 — editorial closing page
H=2100; im=Image.new('RGB',(W,H),PAPER); d=ImageDraw.Draw(im); mast(d,H,False)
T(d,(80,230),'경보가 울린 뒤\n준비를 시작하면 늦습니다.',83,INK,True,spacing=14); d.line((82,475,190,475),fill=MINT,width=5)
T(d,(80,555),'평소 확인해야 할 세 가지',27,(70,79,81),False)
items=[('재난문자 알림','긴급 알림을 받을 수 있도록 휴대전화 설정을 확인합니다.'),('위치 기반 재난정보','현재 위치에 맞는 재난정보를 받을 수 있는지 점검합니다.'),('가까운 민방위 대피소','집과 직장 주변 대피시설의 위치와 이동 경로를 알아둡니다.')]
for i,(head,body) in enumerate(items):
 y=705+i*255; T(d,(82,y),f'{i+1:02d}',22,MINT,True); T(d,(175,y-12),head,42,INK,True); T(d,(175,y+58),body,25,(86,96,99),False); d.line((80,y+155,W-80,y+155),fill=(208,214,215),width=2)
T(d,(80,1575),'대한민국은 준비됐습니까.',38,(105,114,116),True); T(d,(80,1660),'그리고 우리는,',48,INK,True); T(d,(80,1760),'준비됐습니까.',90,MINT,True)
save(im,'03-preparation.png',False)

# preview + archives
files=sorted(OUT.glob('[0-9][0-9]-*.png')); thumbs=[]
for p in files:
 im=Image.open(p).convert('RGB'); im.thumbnail((520,780),Image.Resampling.LANCZOS); thumbs.append((p.name,im.copy()))
sheet=Image.new('RGB',(1730,900),(224,227,227)); sd=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(thumbs): x=25+i*570; sd.text((x,20),name,font=F(18,True),fill=(30,35,36)); sheet.paste(im,(x,52))
sheet.save(OUT/'contact-sheet.jpg','JPEG',quality=90,optimize=True)
for folder,suffix in [(OUT,'png'),(JPG,'jpg')]:
 with zipfile.ZipFile(ROOT/'portal'/f'shelter-portal-v3-{suffix}.zip','w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(folder.glob(f'*.{suffix}')): z.write(p,p.name)
print('Rendered 3 restrained editorial panels')
