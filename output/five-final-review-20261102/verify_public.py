from pathlib import Path
import urllib.request,hashlib,json,subprocess,concurrent.futures
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\five-final-review-20261102');git=r'C:\Program Files\Git\cmd\git.exe'
paths=['goodeasy/'+s+'/index.html' for s in ['gramophone','keyboard','projector','espresso-machine','violin','review']]+['goodeasy/assets/'+s for s in ['coffee-detail.js','models/violin.js','models/violin-fittings.js','models/violin-surface.js','projector-hero.js','eight-release.js']]+['goodeasy/gramophone/gramophone-model.js','goodeasy/index.html']
def check(p):
 url='https://visual.newsis.com/'+p.replace('/index.html','/')+'?verify=3aa3617';q=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'});resp=urllib.request.urlopen(q,timeout=30);b=resp.read();record={'path':p,'status':resp.status,'matches':hashlib.sha256(b).digest()==hashlib.sha256(subprocess.check_output([git,'show','3aa3617:'+p],cwd=r)).digest(),'bytes':len(b)}
 if p.endswith('/index.html') and any('/'+s+'/' in p for s in ['gramophone','keyboard','projector','espresso-machine','violin']):record['noindex']='noindex,nofollow' in b.decode('utf-8')
 return record
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:checks=list(pool.map(check,paths))
(out/'public-verification.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(checks,ensure_ascii=False,indent=2));assert all(x['matches'] for x in checks)
