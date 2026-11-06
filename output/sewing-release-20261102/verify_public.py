from pathlib import Path
from urllib.request import Request,urlopen
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json,re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
base='https://visual.newsis.com/'
paths=['goodeasy/index.html','goodeasy/sewing-machine/index.html','goodeasy/assets/landing-sewing.js','goodeasy/assets/landing-sewing.css','goodeasy/sewing-machine/share.jpg','sitemap-sections.xml']
def fetch(p):
 url=base+(p[:-10] if p.endswith('index.html') else p)+'?v=43895db'
 with urlopen(Request(url,headers={'User-Agent':'VISUAL-NEWSIS-release-check','Cache-Control':'no-cache'}),timeout=35) as response:data=response.read();status=response.status
 local=(r/p).read_bytes()
 same=(data==local) if p.endswith('.jpg') else data.replace(b'\r\n',b'\n')==local.replace(b'\r\n',b'\n')
 return p,{'url':url,'status':status,'matches':same,'bytes':len(data)},data
results=list(ThreadPoolExecutor(max_workers=4).map(fetch,paths))
records={p:x for p,x,data in results}
for p,x,data in results:
 if p.endswith('index.html'):
  s=data.decode('utf-8');assert 'index,follow,max-image-preview:large' in s and 'noindex' not in s
  assert s.count("gtag('config','G-6BKMWE02W5')")==1
  for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(block)
  if p=='goodeasy/index.html':
   assert '재봉틀 파헤쳐보기' in s and 'sewing-machine/#opening-quote' in s
   assert len(re.findall(r'class="chapter-card is-live"',s))==6
   assert 'href="gramophone/"' not in s
  else:assert '2026-11-02T10:00:00+09:00' in s and 'Published' in s
report={'commit':'43895db040bf271c0c0d4e694ef3ab0f9e81b730','all_passed':all(x['status']==200 and x['matches'] for x in records.values()),'resources':records}
(Path(__file__).parent/'public-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report))
assert report['all_passed'],'Public files have not all reached this release'
