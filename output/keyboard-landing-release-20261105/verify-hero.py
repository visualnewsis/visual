from pathlib import Path
from urllib.request import urlopen,Request
import json,hashlib,re
base='https://visual.newsis.com/goodeasy/'
local=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy')
result={}
for file in ['index.html','assets/landing-keyboard.js','assets/landing-keyboard.css']:
 url=base+(file if file!='index.html' else '')
 with urlopen(Request(url,headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'}),timeout=40) as response:
  data=response.read();mime=response.headers.get('Content-Type');status=response.status
 text=data.decode('utf8');expected=(local/file).read_text(encoding='utf8')
 assert text.replace('\r\n','\n')==expected.replace('\r\n','\n'),file+' public content mismatch'
 result[file]={'status':status,'contentType':mime,'matchesCommit':True,'sha256':hashlib.sha256(data).hexdigest()}
 if file=='index.html':
  assert 'class="landing-keyboard"' in text
  assert 'keyboard/#opening-quote' in text and 'id="landing-typing"' in text
  assert 'landing-gramophone.js' not in text
  assert '01 — 08' in text
  for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S):json.loads(block)
  assert text.count("gtag('config','G-6BKMWE02W5')")==1
 if file.endswith('.js'):assert 'javascript' in mime
Path(__file__).with_name('hero-public-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False,indent=2))
