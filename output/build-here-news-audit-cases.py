import json
from pathlib import Path
p=Path(r'C:/Users/user/Documents/editshop/output/here-news-audit-20261103-current.js')
d=json.loads(p.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
ids={'NISX20261103_0003852541','NISX20261103_0003852381','NISX20261102_0003850094','NISX20261103_0003852303','NISX20261102_0003850501','NISX20261102_0003850362','NISX20261022_0003836257','NISX20261103_0003852196'}
rows=[a for a in d['articles'] if a['id'] in ids]
Path(r'C:/Users/user/Documents/editshop/output/here-news-actual-audit-cases-v1.json').write_text(json.dumps({'source':'published snapshot, not synthetic examples','collectedAt':d['collectedAt'],'articles':rows},ensure_ascii=False,indent=2),encoding='utf-8')
print(len(rows),'actual cases exported')
