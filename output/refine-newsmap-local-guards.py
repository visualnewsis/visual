from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'tools/collect_news.py';s=p.read_text(encoding='utf-8')
s=s.replace("r'화재|불이\\s*나|정전|침수|홍수|산불|붕괴|폭발|충돌|추돌|사망|부상|실종|구조|", "r'화재|불이\\s*나|정전|침수|홍수|산불|붕괴|폭발(?!적)|충돌|추돌|사망|부상|실종|구조(?!조정|적)|")
s=s.replace("LOCAL_IMPACT = re.compile(r'화재|정전|침수|붕괴|폭발|", "LOCAL_IMPACT = re.compile(r'화재|정전|침수|붕괴|폭발(?!적)|")
needle="    title = raw['title']\n    physical_impact = bool(LOCAL_IMPACT.search(title))"
s=s.replace(needle,"""    title = raw['title']
    if re.search(r'오늘의\\s*주요\\s*일정|오늘의\\s*일정|[\\[【](?:인사|부고)[\\]】]', title):
        return [], {}
    physical_impact = bool(LOCAL_IMPACT.search(title))
    if not physical_impact and re.search(r'울산\\s*HD|부산\\s*KCC|주전\\s*공격수|구단|전지훈련', title):
        return [], {}""")
p.write_text(s,encoding='utf-8')
p=r/'tests/domestic-policy.py';s=p.read_text(encoding='utf-8')
s += """
assert not build('부산 KCC 구조조정설 부인','',('society',))['localEligible']
assert not build('울산 HD 주전 공격수 부상 이탈','',('society',))['localEligible']
assert not build('[오늘의 주요 일정] 서울 주민 지원사업 발표','서울 성동구는 주민 지원을 확대한다.')['localEligible']
assert build('서울 뮤지컬 폭발적 인기','서울 종로구에서 뮤지컬이 열린다.',('culture',)) is None
print('PASS: aggregate schedules, team-name collisions and metaphorical action words excluded from local news')
"""
p.write_text(s,encoding='utf-8')
