import urllib.request,json,time,re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
base='https://visual.newsis.com/newsmap/'
stamp=str(time.time_ns())
def fetch(path):
    req=urllib.request.Request(base+path+('&' if '?' in path else '?')+'verify='+stamp,headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=25) as response:
        return path,response.status,response.read().decode('utf-8')
with ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(fetch,['','core.js','app.js','data/articles.js']))
files={path:content for path,status,content in results if status==200}
assert len(files)==4,'Not all production assets returned 200'
assert re.findall(r'data-category="([^"]*)"',files[''])==['','all'],'Production modes not updated'
assert 'id="news-modes"' in files[''] and 'id="category-panel"' not in files[''] and 'id="category-toggle"' not in files[''],'Mode buttons are not directly visible'
assert '20261103-direct-modes' in files[''],'Direct-button cache version not updated'
assert '20261103-domestic-local' in files[''],'Browser cache version not updated'
assert "POLICY_VERSION='domestic-local-v1'" in files['core.js'],'Policy code not updated'
assert 'rules.selectMode' in files['app.js'],'App gate not updated'
p=json.loads(files['data/articles.js'].split('=',1)[1].strip().rstrip(';'))
assert p.get('policyVersion')=='domestic-local-v1','Data policy not deployed'
ids=set()
for a in p['articles']:
    assert a['id'] not in ids
    ids.add(a['id'])
    assert a.get('policyVersion')=='domestic-local-v1' and a.get('domesticPolicy')=='accepted'
    assert a.get('newsCategory')!='국제' and 'international' not in a.get('feeds',[])
    assert a['id'] not in p['excludedInternational']
    assert a['localEligible']==bool(a['places']) and a['localPlaces']==a['places']
assert len(re.findall(r"gtag\('config','G-6BKMWE02W5'\)",files['']))==1
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',files[''],re.S):json.loads(block)
report={'status':'PASS','url':base,'articles':len(p['articles']),'local':sum(a['localEligible'] for a in p['articles']),'international':0,'excludedIds':len(p['excludedInternational']),'collectedAt':p['collectedAt']}
Path(r'C:/Users/user/Documents/editshop/output/newsmap-production-verification-20261103.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
