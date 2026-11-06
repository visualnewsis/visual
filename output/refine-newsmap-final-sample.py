from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'tools/collect_news.py';s=p.read_text(encoding='utf-8')
s=s.replace("NATIONAL_SUBJECT = re.compile(r'정부|", "NATIONAL_SUBJECT = re.compile(r'한\\s*총리|韓총리|해수부|국토부|기재부|교육부|중기부|과기정통부|행안부|보건복지부|식약처|원안위|정부|")
s=s.replace("|가수|배우|아이돌|콘서트|음악회|문화제|축제|페스티벌')", "|가수|배우(?!자)|아이돌|콘서트|음악회|문화제|축제|페스티벌|민요|명창|연주회|상영|극장|영화제|무용|국악')")
s=s.replace('|문화회관|문화센터|시립|도립|국립\')','|문화회관|문화센터\')')
s=s.replace("    physical_impact = bool(LOCAL_IMPACT.search(title))", "    physical_impact = bool(LOCAL_IMPACT.search(title)) and not re.search(r'난다면|가정한|시나리오|모의|훈련', title)")
s=s.replace("    if NATIONAL_SUBJECT.search(title) and not physical_impact:", "    if (NATIONAL_SUBJECT.search(title) or re.search(r'[2-9]\\d*개\\s*(?:지역|시도|시·도)', title)) and not physical_impact:")
s=s.replace("(?:는|가|이|에서|의)\\b', primary[match.end():]", "(?:은|는|가|이)\\b', primary[match.end():]")
p.write_text(s,encoding='utf-8')
p=r/'tests/domestic-policy.py';s=p.read_text(encoding='utf-8')
s += """
assert not build('한 총리, 서울 주거지원 속도 주문','서울 강서구에서 한 총리가 주택 지원 정책을 설명했다.')['localEligible']
assert not build('해수부 과학기술주간 개최','서울에서 해양 기술 전시가 열린다.')['localEligible']
assert build('평택 가을 민요 대잔치','경기도 평택시에서 민요 공연이 열린다.',('met',)) is None
assert build('부산 단관극장 공동기획전 개막','부산 국립극장에서 영화 기획전이 열린다.',('culture',)) is None
assert build('서울 성동구 배우자 돌봄 지원','서울 성동구는 주민 지원을 확대한다.')['localEligible']
print('PASS: national ministry visits, non-exhibition cultural programmes, and actor/spouse word boundary')
"""
p.write_text(s,encoding='utf-8')
