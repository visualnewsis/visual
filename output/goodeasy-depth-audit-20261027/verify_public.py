from pathlib import Path
import concurrent.futures,urllib.request,json,hashlib,subprocess,sys
ref=sys.argv[1] if len(sys.argv)>1 else "HEAD"
root=Path(r"C:/Users/user/.codex/worktrees/piano-finish/editshop")
out=Path(r"C:/Users/user/Documents/editshop/output/goodeasy-depth-audit-20261027")
files=subprocess.check_output([r"C:/Program Files/Git/cmd/git.exe","diff","--name-only","b1d6bfb.."+ref],cwd=root,text=True).splitlines()
files=[x for x in files if Path(x).suffix in ['.html','.css','.js']]
def normal(b):return b.decode('utf-8-sig').replace('\r\n','\n')
def verify(path):
 url="https://visual.newsis.com/"+path+"?verify="+ref
 try:
  req=urllib.request.Request(url,headers={"Cache-Control":"no-cache","User-Agent":"VISUAL-NEWSIS-release-check"})
  with urllib.request.urlopen(req,timeout=35) as r:data=r.read();status=r.status
  same=normal(data)==normal(subprocess.check_output([r"C:/Program Files/Git/cmd/git.exe","show",ref+":"+path],cwd=root))
  return dict(path=path,status=status,match=same,sha256=hashlib.sha256(normal(data).encode()).hexdigest())
 except Exception as e:return dict(path=path,error=str(e),match=False)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(verify,files))
(out/('public-verification-'+ref+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({"files":len(results),"matched":sum(r['match'] for r in results),"failed":[r for r in results if not r['match']]},ensure_ascii=False))
