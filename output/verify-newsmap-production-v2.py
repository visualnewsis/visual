import urllib.request,json,time,re,sys,hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode=True
root=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop')
sys.path.insert(0,str(root/'newsmap/tools'))
import collect_news as C
import validate_snapshot as V
base='https://visual.newsis.com/newsmap/'
out=Path(r'C:/Users/user/Documents/editshop/output')
stamp=str(time.time_ns())
def fetch(path):
    req=urllib.request.Request(base+path+('&' if '?' in path else '?')+'verify='+stamp,headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=25) as response:return path,response.status,response.read()
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch,['','core.js','app.js','style.css','data/articles.js']))
files={path:content for path,status,content in results if status==200}
assert len(files)==5,'Not all production assets returned 200'
html=files[''].decode('utf-8')
assert re.findall(r'data-category="([^"]*)"',html)==['','all'],'Mode mismatch'
assert 'id="news-modes"' in html and 'id="category-panel"' not in html and 'id="category-toggle"' not in html
assert 'data/articles.js?v=20261103-review-v2' in html
for path in ['core.js','app.js','style.css']:
    assert files[path].decode('utf-8').replace('\r\n','\n')==(root/'newsmap'/path).read_text(encoding='utf-8'),path+' differs from reviewed source'
actual=out/'here-news-production-v2-verified.js'
actual.write_bytes(files['data/articles.js'])
V.validate(actual)
p=C.decode_snapshot(files['data/articles.js'])
assert len(re.findall(r"gtag\('config','G-6BKMWE02W5'\)",html))==1
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',html,re.S):json.loads(block)
assert '크리에이티브 디렉터' in html and '안재현' in html
report={'status':'PASS','url':base,'verifiedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'policy':p['policyVersion'],'method':C.LOCATION_METHOD,'articles':len(p['articles']),'local':sum(a['localEligible'] for a in p['articles']),'metadataInternational':0,'excludedIds':len(p['excludedInternational']),'collectedAt':p['collectedAt'],'dataSha256':hashlib.sha256(files['data/articles.js']).hexdigest(),'sourceAssetsMatch':True}
(out/'newsmap-production-v2-verification-20261103.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
