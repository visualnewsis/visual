import urllib.request,hashlib,json,re
from pathlib import Path
from html.parser import HTMLParser
base='https://visual.newsis.com'
root=Path(r'C:/Users/user/.codex/worktrees/piano-finish/editshop')
out=Path(r'C:/Users/user/Documents/editshop/output/goodeasy-defect-review-20261030')
def get(path):
 req=urllib.request.Request(base+path,headers={'User-Agent':'GOODEASY release verification','Accept-Encoding':'identity'})
 with urllib.request.urlopen(req,timeout=35) as r:return r.status,r.read().decode('utf-8-sig')
def normalized(s):return s.replace('\r\n','\n')
result={'pages':{},'assets':{},'all_passed':False}
for slug,num in [('violin','09'),('projector','10'),('espresso-machine','11')]:
 status,s=get('/goodeasy/'+slug+'/?v=0e3bcec')
 assert status==200 and '20261030-reviewed12' in s and '20261030-reviewed11' in s,slug
 assert re.search(r'\b'+num+r' · ',s),slug+' episode'
 assert 'noindex,nofollow' in s,slug+' visibility'
 blocks=re.findall(r'<script[^>]+type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>',s,re.S)
 for block in blocks:json.loads(block)
 assert s.count("gtag('config','G-6BKMWE02W5')")==1,slug+' analytics'
 assert 'https://visual.newsis.com/goodeasy/'+slug+'/' in s
 result['pages'][slug]={'status':status,'jsonld_blocks':len(blocks),'prototype_indexing':True,'episode':num,'cache':'reviewed12'}
assets=['assets/models/violin.js','assets/models/violin-surface.js','assets/models/violin-finish.js','assets/coffee-detail.js','assets/projector-hero.js','assets/projector-hero-clock.js','assets/projector-film-route.js','assets/anatomy-optics.js','assets/anatomy-viewer.js','assets/anatomy.css','assets/quality-stage.js']
for p in assets:
 version='20261030-reviewed12' if p in ['assets/anatomy-viewer.js','assets/anatomy.css'] else '20261030-reviewed11'
 status,s=get('/goodeasy/'+p+'?v='+version)
 expected=(root/'goodeasy'/p).read_text(encoding='utf-8-sig')
 assert normalized(s)==normalized(expected),p+' source mismatch'
 result['assets'][p]={'status':status,'matches_local':True,'sha256':hashlib.sha256(normalized(s).encode()).hexdigest()}
for route in ['goodeasy/','goodeasy/review/']:
 status,s=get('/'+route+'?v=0e3bcec')
 expected=(root/route/'index.html').read_text(encoding='utf-8-sig')
 assert normalized(s)==normalized(expected),route+' changed lineup'
 result['pages'][route]={'status':status,'matches_approved_local':True}
result['all_passed']=True
(out/'public-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'all_passed':True,'pages':len(result['pages']),'matching_assets':len(result['assets'])}))
