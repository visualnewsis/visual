from pathlib import Path
import urllib.request,hashlib,json,subprocess,concurrent.futures
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\gramophone-release-20261103');git=r'C:\Program Files\Git\cmd\git.exe'
paths=['goodeasy/index.html','goodeasy/gramophone/index.html','goodeasy/assets/landing-gramophone.js','goodeasy/assets/landing-gramophone.css','goodeasy/gramophone/share.jpg','goodeasy/gramophone/site-thumbnail.jpg','sitemap-sections.xml']
def get(p):
 u='https://visual.newsis.com/'+p.replace('/index.html','/')+'?verify=7dd139f';resp=urllib.request.urlopen(urllib.request.Request(u,headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'}),timeout=30);b=resp.read();expected=subprocess.check_output([git,'show','7dd139f:'+p],cwd=r);d={'path':p,'status':resp.status,'matches':hashlib.sha256(b).digest()==hashlib.sha256(expected).digest()};return d
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:a=list(pool.map(get,paths))
(out/'public-verification.json').write_text(json.dumps(a,indent=2),encoding='utf-8');print(json.dumps(a,indent=2));assert all(x['matches'] for x in a)

