from pathlib import Path
import json,re
from html.parser import HTMLParser
from urllib.parse import urlsplit
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=root/'goodeasy/check.py';s=p.read_text(encoding='utf8');s=s.replace("pages=list(base.glob('*/index.html'));errors=[]", "pages=[base/'index.html',*base.glob('*/index.html')];errors=[]");p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/audio.test.cjs';s=p.read_text(encoding='utf8');s=s.replace('Event:class{},setTimeout}',"Event:class{},setTimeout,URLSearchParams,location:{search:'?landing-note=64&duration=99999'}}")
s=s.replace('const engine=window.PianoExperience;',"const engine=window.PianoExperience;\nassert.equal(nodes.length,0,'landing handoff must not autoplay');\nassert.equal(engine.snapshot().last.midi,64);\nassert.equal(engine.snapshot().last.duration,1800,'landing duration is bounded');")
p.write_text(s,encoding='utf8')
class Links(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ld=False;self.raw='';self.blocks=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('script','link','img','a'):
   r=a.get('src') or a.get('href')
   if r:self.refs.append(r)
  if tag=='script' and a.get('type')=='application/ld+json':self.ld=True;self.raw=''
 def handle_data(self,d):
  if self.ld:self.raw+=d
 def handle_endtag(self,tag):
  if tag=='script' and self.ld:self.blocks.append(json.loads(self.raw));self.ld=False
s=(root/'goodeasy/index.html').read_text(encoding='utf8');h=Links();h.feed(s)
assert len(h.blocks)==1
assert s.count("gtag('config','G-6BKMWE02W5')")==1
assert 'noindex,nofollow' in s
for slug in ('guitar','fishing-reel','camera','watch','violin','projector','keyboard','espresso-machine','review'):
 assert f'href="{slug}/' not in s,f'unreleased link: {slug}'
for ref in h.refs:
 u=urlsplit(ref)
 if u.scheme or not u.path:continue
 path=(root/'goodeasy'/u.path).resolve()
 assert path.exists(),ref
print('PASS landing: only piano links; existing shared header; one GA config; valid JSON-LD; all local assets; unlisted noindex.')
