from pathlib import Path
import urllib.request,hashlib,json,subprocess,concurrent.futures,re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\keyboard-release-20261105');git=r'C:\Program Files\Git\cmd\git.exe'
paths=['goodeasy/index.html','goodeasy/keyboard/index.html','goodeasy/projector/index.html','goodeasy/espresso-machine/index.html','sitemap-sections.xml']
def get(p):
 resp=urllib.request.urlopen(urllib.request.Request('https://visual.newsis.com/'+p.replace('/index.html','/')+'?verify=aecba63',headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'}),timeout=30);b=resp.read();expected=subprocess.check_output([git,'show','aecba63:'+p],cwd=r);d={'path':p,'status':resp.status,'matches':hashlib.sha256(b).digest()==hashlib.sha256(expected).digest()}
 if p=='goodeasy/index.html':d.update(keyboardAbsent='href="keyboard/' not in b.decode('utf8'),cards=len(re.findall('class="chapter-card is-live"',b.decode('utf8'))))
 if p=='goodeasy/keyboard/index.html':
  s=b.decode('utf8');d.update(indexed='index,follow,max-image-preview:large' in s,date='2026-11-05T10:00:00+09:00' in s)
 if p in ['goodeasy/projector/index.html','goodeasy/espresso-machine/index.html']:d['noindex']='noindex,nofollow' in b.decode('utf8')
 return d
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:a=list(pool.map(get,paths))
(out/'public-verification.json').write_text(json.dumps(a,indent=2),encoding='utf8');print(json.dumps(a,indent=2));assert all(x['matches'] for x in a);assert a[0]['keyboardAbsent'];assert a[1]['indexed']
