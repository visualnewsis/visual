from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys
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
pages=list(base.glob('*/index.html'));errors=[]
for p in pages:
 s=p.read_text(encoding='utf8');h=Page();h.feed(s)
 if len(h.ids)!=len(set(h.ids)):errors.append(str(p)+' duplicate IDs')
 if p.parent.name!='review':
  if len(h.blocks)!=1:errors.append(str(p)+' JSON-LD count')
  if s.count("gtag('config','G-6BKMWE02W5')")!=1:errors.append(str(p)+' GA config count')
  if 'noindex,nofollow' not in s:errors.append(str(p)+' prototype indexing')
 for r in h.refs:
  u=urlsplit(r)
  if u.scheme or u.netloc:continue
  target=(root/u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{p}: missing {r}')
  elif u.fragment and target.suffix=='.html':
   t=Page();t.feed(target.read_text(encoding='utf8'))
   if u.fragment not in t.ids:errors.append(f'{p}: missing anchor {r}')
print('\n'.join(errors) if errors else f'PASS {len(pages)} GOODEASY routes: local links/assets, IDs, JSON-LD, GA and noindex')
sys.exit(bool(errors))
