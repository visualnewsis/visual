from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import zipfile

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portal'/'shelter-panels-v2'
OUT=ROOT/'portal'/'shelter-portal-final'
JPG=ROOT/'portal'/'shelter-portal-final-jpg'
OUT.mkdir(parents=True,exist_ok=True); JPG.mkdir(parents=True,exist_ok=True)
pairs=[('01-cover-alarm',['01-cover.png','02-alarm.png']),('02-decisions',['03-stairs.png','04-window.png']),('03-evacuation',['05-underground.png','06-official.png']),('04-preparation',['07-zero.png','08-action.png'])]
for name,files in pairs:
    ims=[Image.open(SRC/f).convert('RGB') for f in files]
    canvas=Image.new('RGB',(1800,3000),(3,6,7)); canvas.paste(ims[0],(0,0)); canvas.paste(ims[1],(0,1500))
    canvas.save(OUT/f'{name}.png','PNG',optimize=True)
    canvas.save(JPG/f'{name}.jpg','JPEG',quality=92,optimize=True,progressive=True)
thumbs=[]
for p in sorted(OUT.glob('*.png')):
    im=Image.open(p).convert('RGB'); im.thumbnail((520,866),Image.Resampling.LANCZOS); thumbs.append((p.name,im.copy()))
sheet=Image.new('RGB',(1160,1860),(222,226,227)); d=ImageDraw.Draw(sheet); f=ImageFont.truetype(r'C:\Windows\Fonts\malgunbd.ttf',18)
for i,(name,im) in enumerate(thumbs):
    x=30+(i%2)*570; y=55+(i//2)*900; d.text((x,y-28),name,font=f,fill=(30,35,36)); sheet.paste(im,(x,y))
sheet.save(OUT/'contact-sheet.jpg','JPEG',quality=90,optimize=True)
for folder,suffix in [(OUT,'png'),(JPG,'jpg')]:
    with zipfile.ZipFile(ROOT/'portal'/f'shelter-portal-final-{suffix}.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(folder.glob(f'*.{suffix}')): z.write(p,p.name)
print('Bundled 4 final portal images')
