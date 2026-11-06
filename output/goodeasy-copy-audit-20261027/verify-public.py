from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
import hashlib,json

root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
episodes=['camera','guitar','fishing-reel','watch','violin','projector','keyboard','espresso-machine','gramophone','sewing-machine']
files=['goodeasy/'+e+'/index.html' for e in episodes]+['goodeasy/assets/lab.js','goodeasy/assets/research.js','goodeasy/gramophone/app.js','goodeasy/sewing-machine/app.js','goodeasy/sewing-machine/sewing-model.js']
def verify(path):
 url='https://visual.newsis.com/'+(path[:-10] if path.endswith('index.html') else path)+'?v=b4abda1'
 try:
  with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=45) as response:
   body=response.read();status=response.status
  local=(root/path).read_bytes()
  # Git's Windows checkout uses CRLF; the deployment artifact uses LF.
  same=hashlib.sha256(body.replace(b'\r\n',b'\n')).digest()==hashlib.sha256(local.replace(b'\r\n',b'\n')).digest()
  return dict(path=path,status=status,bytes=len(body),matches_local=same,url=url)
 except Exception as error:return dict(path=path,error=str(error),matches_local=False)
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(verify,files))
Path(__file__).with_name('public-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
for item in results:print(('PASS' if item['matches_local'] else 'FAIL'),item['path'],item.get('status'),item.get('error',''))
raise SystemExit(0 if all(r['matches_local'] for r in results) else 1)
