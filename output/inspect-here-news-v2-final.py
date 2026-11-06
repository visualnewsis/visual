import sys,re,json
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/tools')
import collect_news as c
p=c.decode_snapshot(Path('output/here-news-audit-v2-live-final.js').read_bytes())
bad=['0003852541','0003852381','0003850094','0003852303','0003850501','0003850362','0003836257','0003852196','0003852325','0003850714']
print('TOTAL',len(p['articles']),'LOCAL',sum(a['localEligible'] for a in p['articles']),'METHOD',c.LOCATION_METHOD)
print('BAD_REMAIN',[(a['id'],a['title'],a['places']) for a in p['articles'] if any(a['id'].endswith(b) for b in bad)])
for a in p['articles']:
 if a['localEligible']:print('LOCAL',a['title'],'=>',a['places'])
print('FOREIGN SUSPECTS')
for a in p['articles']:
 if re.search('미국|중국|일본|유럽|해외|FDA|FIFA|트럼프|현지|뉴욕|런던|파리|대만|한국시간',a['title']): print(a['id'],a['title'],a['relatedPlaces'])
