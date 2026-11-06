from pathlib import Path
import concurrent.futures,urllib.request,re,json,sys,time
root=Path(r"C:\Users\user\.codex\worktrees\piano-finish\editshop")
out=Path(__file__).parent
names=['fishing-reel','watch','sewing-machine','gramophone','keyboard','violin','projector','espresso-machine']
files=['goodeasy/'+n+'/index.html' for n in names]+['goodeasy/review/index.html','goodeasy/index.html','goodeasy/piano/index.html','goodeasy/camera/index.html','goodeasy/guitar/index.html','sitemap.xml']
files+=['goodeasy/assets/'+n for n in ['eight-release.js','eight-release.css','release-machine-models.js','reel-lessons.js','keyboard-lessons.js','violin-lessons.js','projector-lessons.js','projector-frames.js','espresso-sequence.js','research.js','research-watch.js','anatomy-watch.js','anatomy-optics.js','quality-replacements.js','inspect-controls.js']]
files += ['goodeasy/assets/'+n for n in ['reel-exterior.js','reel-experience.js','reel-presentation.js','watch-art-direction.js','watch-hero.js','watch-experience.js','camera-optics-detail.js','espresso-experience.js']]

def check(f):
 url='https://visual.newsis.com/'+f
 if url.endswith('index.html'):url=url[:-10]
 url+=('?v=20261028-craft7&' if f.endswith(('.js','.css')) else '?')+'verify='+str(time.time_ns())
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=45)
  text=r.read().decode('utf-8-sig').replace('\r\n','\n');local=(root/f).read_text(encoding='utf-8-sig').replace('\r\n','\n')
  result={'file':f,'status':r.status,'matches':text==local}
  if f in ['goodeasy/'+n+'/index.html' for n in names]:
   result.update(noindex='noindex,nofollow' in text,quote='opening-quote' in text,related='episode-related' in text or '관련 기사' in text,header='visual-header.js' in text,ga=text.count("gtag('config','G-6BKMWE02W5')")==1)
  return result
 except Exception as e:return {'file':f,'error':str(e),'matches':False}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(check,files))
(out/'public-verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results:print(json.dumps(r,ensure_ascii=False))
failed=[r for r in results if not r.get('matches') or any(r.get(k) is False for k in ['noindex','quote','related','header','ga'])]
print('RESULT',len(results)-len(failed),'/',len(results),'public checks match current local revision');sys.exit(bool(failed))
