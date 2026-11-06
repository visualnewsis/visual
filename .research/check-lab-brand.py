from pathlib import Path
import json,re,subprocess,xml.etree.ElementTree as ET
from PIL import Image
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
git=r'C:\Program Files\Git\cmd\git.exe'
paths=subprocess.check_output([git,'diff','--name-only'],cwd=root).decode().splitlines()
count=0
for rel in paths:
 if not rel.endswith('.html'):continue
 data=(root/rel).read_text(encoding='utf8')
 for raw in re.findall(r'<script\b[^>]*type=[\x22\x27]application/ld\+json[\x22\x27][^>]*>(.*?)</script>',data,re.S):json.loads(raw);count+=1
 if rel not in ['goodeasy/index.html','goodeasy/piano/index.html']:
  old=subprocess.check_output([git,'show','HEAD:'+rel],cwd=root).decode('utf8')
  normalize=lambda s:re.sub(r'((?:visual-header|arcade-header)\.(?:css|js)\?v=)[^"\s>]+',r'\g<1>VERSION',s).replace('\r\n','\n')
  assert normalize(old)==normalize(data),rel+' changed beyond cache version'
for p in (root/'goodeasy/assets/brand').glob('*.svg'):ET.parse(p)
ET.parse(root/'assets/menu-icon-goodeasy.svg')
for variant in ('color','mono-dark','mono-light'):
 for size in (16,24,32,48,64,96,128,256,512):
  p=root/f'goodeasy/assets/brand/goodeasy-flask-{variant}-{size}.png';im=Image.open(p)
  assert im.size==(size,size) and im.mode=='RGBA',str(p)
  assert im.getpixel((0,0))[3]==0,str(p)+' not transparent'
for rel in ('goodeasy/index.html','goodeasy/piano/index.html'):
 s=(root/rel).read_text(encoding='utf8');assert 'class="brand-lab"' in s;assert 'menu-icon-goodeasy.svg' in s
print('PASS',count,'JSON-LD blocks; other page edits limited to cache versions; 3 SVG variants; 27 RGBA size exports; research-lab labels.')
