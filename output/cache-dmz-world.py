from pathlib import Path
import re
root=Path('dmz')
for p in (root/'js').glob('*.js'):
 if p.name in ('three.js','image-morph.js'): continue
 s=p.read_text(encoding='utf-8'); n=re.sub(r"(\./(?!three\.js)[\w-]+\.js)\?v=[\w-]+",r'\1?v=20261027-world2',s)
 if p.name=='canopy.js': n=n.replace('W, forestMask, rng, smooth','W, forestMask, rng')
 if n!=s: p.write_text(n,encoding='utf-8',newline='')
p=root/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('css/dmz.css?v=20261027-1','css/dmz.css?v=20261027-world2').replace('js/main.js?v=20261027-2','js/main.js?v=20261027-world2');p.write_text(s,encoding='utf-8',newline='')
