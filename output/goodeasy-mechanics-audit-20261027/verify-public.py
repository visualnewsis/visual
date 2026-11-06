import concurrent.futures, hashlib, json, subprocess, urllib.request
from pathlib import Path
ROOT=Path(r"C:/Users/user/.codex/worktrees/piano-finish/editshop")
OUT=Path(__file__).parent
paths=subprocess.check_output(["git","diff","--name-only","b4abda1..HEAD"],cwd=ROOT,text=True).splitlines()
paths=[p for p in paths if p.endswith((".html",".js"))]
def normal(b):return b.replace(b"\r\n",b"\n")
def check(p):
 url="https://visual.newsis.com/"+p+"?verify=b1d6bfb"
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"GOODEASY-release-verification"}),timeout=45) as r:body=r.read();status=r.status
  expected=(ROOT/p).read_bytes()
  return {"path":p,"url":url,"status":status,"matches":normal(body)==normal(expected),"bytes":len(body),"sha256":hashlib.sha256(normal(body)).hexdigest()}
 except Exception as e:return {"path":p,"url":url,"matches":False,"error":str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(check,paths))
OUT.joinpath("public-verification.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"files":len(results),"matched":sum(r["matches"] for r in results),"failures":[r for r in results if not r["matches"]]},ensure_ascii=False))
raise SystemExit(0 if all(r["matches"] for r in results) else 1)
