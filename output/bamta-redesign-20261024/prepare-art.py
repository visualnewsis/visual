from pathlib import Path
from PIL import Image
import shutil,json

root=Path(r'C:\Users\user\Documents\editshop')
generated=Path(r'C:\Users\user\.codex\generated_images\01a16d14-c27d-70e0-b7c1-4301d41673ec')
dest=root/'arcade/bamta/assets/art-v2'
originals=root/'output/bamta-redesign-20261024/art-sources'
dest.mkdir(parents=True,exist_ok=True);originals.mkdir(parents=True,exist_ok=True)
assets=[
 ('foliage','exec-e410caf3-8e09-4481-94c0-8fce5d87dd78.png',768),
 ('materials','exec-818de78f-cc46-4d73-ac96-b348c3a7a72b.png',1024),
 ('newsroom-screen','exec-65200c5c-447c-4c6b-a13c-0b3fbe9dd45d.png',1280),
]
report=[]
for name,filename,edge in assets:
    source=generated/filename;shutil.copy2(source,originals/(name+'.png'))
    im=Image.open(source);im.thumbnail((edge,edge),Image.Resampling.LANCZOS)
    target=dest/(name+'.webp');im.save(target,'WEBP',quality=91,method=6)
    report.append(dict(asset=name,size=list(im.size),bytes=target.stat().st_size,alpha=im.getextrema()[-1] if im.mode=='RGBA' else None))
(originals/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False));print('Runtime texture total:',sum(x['bytes'] for x in report),'bytes')
