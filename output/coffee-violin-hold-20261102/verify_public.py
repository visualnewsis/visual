from pathlib import Path
import urllib.request,hashlib,json,subprocess
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\coffee-violin-hold-20261102')
paths=['goodeasy/violin/index.html','goodeasy/espresso-machine/index.html','goodeasy/assets/coffee-detail.js','goodeasy/assets/coffee-material-textures.js','goodeasy/assets/models/violin.js','goodeasy/assets/models/violin-fittings.js','goodeasy/assets/models/violin-ribs.js','goodeasy/assets/models/violin-surface.js','goodeasy/review/index.html']
checks=[]
for p in paths:
 url='https://visual.newsis.com/'+p.replace('/index.html','/')+'?verify=89ab481';q=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'});resp=urllib.request.urlopen(q,timeout=30);b=resp.read();checks.append({'path':p,'status':resp.status,'matches':hashlib.sha256(b).digest()==hashlib.sha256(subprocess.check_output([r'C:\Program Files\Git\cmd\git.exe','show','HEAD:'+p],cwd=r)).digest(),'bytes':len(b)})
landing=urllib.request.urlopen('https://visual.newsis.com/goodeasy/?verify=89ab481',timeout=30).read().decode('utf-8')
checks.append({'path':'goodeasy/index.html','unchanged':hashlib.sha256(landing.encode()).digest()==hashlib.sha256(subprocess.check_output([r'C:\Program Files\Git\cmd\git.exe','show','HEAD:goodeasy/index.html'],cwd=r)).digest()})
(out/'public-verification.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(checks,ensure_ascii=False,indent=2));assert all(x.get('matches',x.get('unchanged',False)) for x in checks)
