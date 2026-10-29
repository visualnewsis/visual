from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys,re
import xml.etree.ElementTree as ET
root=Path(sys.argv[1]); base=root/'goodeasy'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.refs=[];self.ld=False;self.json=[];self.blocks=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag in ['script','img','link','a','use']:
   r=a.get('src') or a.get('href')
   if r:self.refs.append(r)
  if tag=='script' and a.get('type')=='application/ld+json':self.ld=True;self.json=[]
 def handle_data(self,s):
  if self.ld:self.json.append(s)
 def handle_endtag(self,tag):
  if tag=='script' and self.ld:self.blocks.append(json.loads(''.join(self.json)));self.ld=False
pages=[base/'index.html',*base.glob('*/index.html')];errors=[]
for p in pages:
 s=p.read_text(encoding='utf8');h=Page();h.feed(s)
 if len(h.ids)!=len(set(h.ids)):errors.append(str(p)+' duplicate IDs')
 if p.parent.name!='review':
  if len(h.blocks)!=1:errors.append(str(p)+' JSON-LD count')
  if s.count("gtag('config','G-6BKMWE02W5')")!=1:errors.append(str(p)+' GA config count')
  if p==base/'index.html' or p.parent.name in {'piano','camera','guitar','fishing-reel'}:
   if 'index,follow,max-image-preview:large' not in s or 'noindex' in s:errors.append(str(p)+' published page indexing')
   published_url='https://visual.newsis.com/goodeasy/'+('' if p==base/'index.html' else p.parent.name+'/')
   if published_url not in s:errors.append(str(p)+' published page URL')
  elif 'noindex,nofollow' not in s:errors.append(str(p)+' prototype indexing')
 for r in h.refs:
  u=urlsplit(r)
  if u.path.endswith(".mjs"):errors.append(f"{p}: server does not serve .mjs with a JavaScript MIME type: {r}")
  if u.scheme or u.netloc:continue
  target=(root/u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{p}: missing {r}')
  elif u.fragment and target.suffix=='.html':
   t=Page();t.feed(target.read_text(encoding='utf8'))
   if u.fragment not in t.ids:errors.append(f'{p}: missing anchor {r}')
# Only released episodes and their collection belong in the public sitemap.
sitemap_urls={e.text for e in ET.parse(root/'sitemap-sections.xml').getroot().findall('{*}url/{*}loc')}
released={'https://visual.newsis.com/goodeasy/','https://visual.newsis.com/goodeasy/piano/','https://visual.newsis.com/goodeasy/camera/','https://visual.newsis.com/goodeasy/guitar/','https://visual.newsis.com/goodeasy/fishing-reel/'}
if {u for u in sitemap_urls if '/goodeasy/' in u}!=released:errors.append('GOODEASY published sitemap mismatch')
# This production host serves .mjs as application/octet-stream with nosniff.
# Check the transitive local module paths as well as HTML entrypoints.
for folder in [base/'assets',base/'piano']:
 for module in folder.rglob('*.js'):
  if 'vendor' in module.parts:continue
  source=module.read_text(encoding='utf8')
  for ref in re.findall(r"(?:from\s*|import\s*\()\s*['\"]([^'\"]+)['\"]",source):
   u=urlsplit(ref)
   if u.scheme or not u.path.startswith('.'):continue
   target=module.parent/unquote(u.path)
   if target.suffix=='.mjs':errors.append(f'{module}: unsupported browser module MIME: {ref}')
   if not target.is_file():errors.append(f'{module}: missing imported module {ref}')
print('\n'.join(errors) if errors else f'PASS {len(pages)} GOODEASY routes: local links/assets, IDs, JSON-LD, GA and release/prototype indexing')
sys.exit(bool(errors))
