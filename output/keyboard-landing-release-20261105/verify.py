from pathlib import Path
from urllib.request import urlopen, Request
from html.parser import HTMLParser
import json,hashlib
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.blocks=[];self.ld=False;self.buf=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='a' and a.get('class','').find('chapter-card')>=0:self.links.append(a.get('href'))
  if t=='script' and a.get('type')=='application/ld+json':self.ld=True;self.buf=[]
 def handle_data(self,s):
  if self.ld:self.buf.append(s)
 def handle_endtag(self,t):
  if t=='script' and self.ld:self.blocks.append(json.loads(''.join(self.buf)));self.ld=False
base='https://visual.newsis.com/goodeasy/'
req=lambda u:Request(u,headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'})
out={}
for path in ['', 'keyboard/', 'assets/landing-keyboard.jpg']:
 with urlopen(req(base+path),timeout=40) as res:data=res.read();out[path or 'landing']={'status':res.status,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if not path:
  s=data.decode('utf8');p=Page();p.feed(s)
  expected=['piano/','camera/','guitar/','fishing-reel/','watch/','sewing-machine/','gramophone/','keyboard/']
  assert p.links==expected,p.links
  assert '공개한 이야기 여덟 편' in s and '01 — 08' in s
  assert len(p.blocks)==1 and s.count("gtag('config','G-6BKMWE02W5')")==1
  out['landing']['cards']=p.links
 if path=='keyboard/':
  s=data.decode('utf8');assert 'index,follow,max-image-preview:large' in s and '2026-11-05T10:00:00+09:00' in s
  out[path]['published']=True
Path(__file__).with_name('public-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(out,ensure_ascii=False,indent=2))
