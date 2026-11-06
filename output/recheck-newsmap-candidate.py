import sys, json
from pathlib import Path
from datetime import datetime, timezone
sys.dont_write_bytecode=True
root=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
sys.path.insert(0,str(root/'tools'))
import collect_news as C
source=Path(r'C:/Users/user/Documents/editshop/output/here-news-policy-reviewed.js')
payload=C.decode_snapshot(source.read_bytes())
nodes={n['id']:n for n in C.load_nodes()}
matchers=C.compile_matchers(list(nodes.values()))
approved=[]
removed=[]
for old in payload['articles']:
    raw={**old,'text':old.get('locationLead',''),'legacyLeadMissing':not bool(old.get('locationLead'))}
    new=C.build_article(raw,matchers,nodes)
    if new:
        approved.append({**old,**new})
    else:
        removed.append(old['title'])
        _,reason=C.domestic_policy(raw,C.focus_lead(raw['text']),old.get('relatedPlaces',[]))
        if reason.startswith(('international','foreign')):
            payload.setdefault('excludedInternational',{})[old['id']]=old['publishedAt']
payload['articles']=approved
payload['unassignedCount']=sum(not a['relatedPlaces'] for a in approved)
payload['collection']['policyRecheckedAt']=datetime.now(timezone.utc).isoformat(timespec='seconds')
destination=root/'data/articles.js'
C.write_snapshot(destination,payload)
print(json.dumps({'total':len(approved),'local':sum(a['localEligible'] for a in approved),'mapAll':sum(bool(a['relatedPlaces']) for a in approved),'blockedInternational':len(payload.get('excludedInternational',{})),'removed':removed},ensure_ascii=False))
