from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess
class Audit(HTMLParser):
 def __init__(self): super().__init__(); self.skip=0; self.text=[]; self.images=[]; self.meta=[]; self.links=[]; self.json=[]; self.injson=False; self.buf=''
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ['script','style']: self.skip+=1
  if t=='script' and d.get('type')=='application/ld+json': self.injson=True; self.buf=''
  if t=='img': self.images.append((d.get('src'),d.get('alt')))
  if t=='meta': self.meta.append(a)
  if t=='a': self.links.append(d.get('href'))
 def handle_data(self,s):
  if self.injson: self.buf+=s
  if not self.skip: self.text.append(s)
 def handle_endtag(self,t):
  if t=='script' and self.injson: self.json.append(json.loads(self.buf)); self.injson=False
  if t in ['script','style']: self.skip=max(0,self.skip-1)
base=Audit();base.feed(Path('output/dmz-aerial-before/dmz/index.html').read_text(encoding='utf-8'))
new=Audit();new.feed(Path('dmz/index.html').read_text(encoding='utf-8'))
for k in ['text','images','meta','links','json']: assert getattr(base,k)==getattr(new,k),k
s=Path('dmz/index.html').read_text(encoding='utf-8');assert s.count('gtag/js?id=G-6BKMWE02W5')==1
for p in Path('dmz/js').glob('*.js'):
 if p.name=='three.js': continue
 subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
 for ref in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)",p.read_text(encoding='utf-8')):
  if ref.startswith('.'): assert (p.parent/ref.split('?')[0]).exists(),(p,ref)
for ref in re.findall(r'(?:src|href|srcset)="([^" ]+)"',s):
 if not ref.startswith(('http','data:','#','/')): assert (Path('dmz')/ref.split('?')[0]).exists(),ref
print('PASS: unchanged article text, photographs, links, SEO and JSON-LD; single analytics loader; module syntax and local asset paths')
