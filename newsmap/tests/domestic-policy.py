"""Offline regression cases for strict domestic/local editorial eligibility."""
import importlib.util
import sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('collector_policy', Path(__file__).resolve().parents[1]/'tools/collect_news.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
nodes = {n['id']:n for n in C.load_nodes()}
matchers = C.compile_matchers(list(nodes.values()))

def build(title, text='', feeds=('society',), **extra):
    return C.build_article({'title':title, 'text':text, 'feeds':list(feeds), **extra},matchers,nodes)

for title,text,feeds in [
    ('스페인 홍수 피해 확대','서울 종로구 대사관 관계자는 피해를 설명했다.',('society',)),
    ('태국 학교 화재로 피해','서울에서 관계자가 밝혔다.',('sokbo',)),
    ('브라질 버스 사고 발생','서울 관계자가 발표했다.',('society',)),
    ('도심 큰불 발생','[캄팔라=뉴시스] 특파원 = 도심에서 큰불이 났다.',('sokbo',)),
    ('도심 큰불로 주민 대피','[파리=뉴시스] 특파원 = 도심에서 큰불이 났다.',('sokbo',)),
    ('미국 중간선거 판세 급변','서울 종로구 미국대사관 관계자는 미국 중간선거 판세를 설명했다.',('international',)),
    ('미국 중간선거 전망','서울 여의도 국회에서 미국 중간선거 결과를 분석하는 간담회가 열렸다.',('politics',)),
    ('미국 중간선거가 국내 증시에 미칠 영향','한국 증시는 미국 중간선거를 앞두고 변동성이 커졌다.',('economy',)),
    ('정치권 반응','서울 종로구에서 관계자는 미국 대통령 선거 결과를 분석했다.',('politics','international')),
    ('뉴욕 증시 급등','[서울=뉴시스] 기자 = 뉴욕 증시가 상승했다.',('economy',)),
    ('[신간] 미술관을 걷는 시간','서울 종로구 미술관에서 열린 전시를 관람한 책이다.',('culture',)),
    ('베니스비엔날레 한국관 전시 개막','서울 종로구 미술관 관계자는 전시회가 열린다고 밝혔다.',('culture',)),
    ('작가 신작 소설 출간','서울 종로구 출판사에서 신작 소설 출간을 알렸다.',('culture',)),
    ('인기 배우 드라마 공개','서울 강남구에서 드라마 제작발표회가 열렸다.',('society',)),
    ('프랑스 미술관 특별전 개최','프랑스에서 특별전이 개최된다. 서울 종로구 관계자가 설명했다.',('culture',)),
]:
    assert build(title,text,feeds) is None, title

assert not build('경남은행 소상공인 지원 확대','경남은행이 자영업자 지원을 확대했다.',('bank',))['localEligible']
assert not (build('대구 경기 종료','대구 체육관에서 농구 경기가 열렸다.',('sports',)) or {}).get('localEligible')
hq=build('반도체 수출 전망 하향','서울 서초구 삼성전자 본사에서 관계자는 국내 반도체 수출 전망을 설명했다.',('industry',))
assert hq and not hq['localEligible'] and hq['places']==[]
assert '서울특별시/서초구' in hq['relatedPlaces']
assert build('서울 서초구 서울중앙지법 주변 교통 통제','서울 서초구 법원 주변에서 집회로 교통 통제가 진행된다.')['localEligible']
assert build('서울 영등포구 국회 앞 도로 교통 통제','서울 영등포구 국회 주변 도로에서 교통 통제가 진행된다.')['localEligible']
court=build('오세훈 무죄 선고','서울 서초구 서울고법은 정치자금법 사건 항소심에서 무죄를 선고했다.')
assert court and not court['places'] and '서울특별시/서초구' in court['relatedPlaces']
local=build('서울 성동구 주민 지원','서울 성동구는 주민 지원을 확대한다.')
assert local['places']==['서울특별시/성동구'] and local['localEligible']
assert local['localPlaces']==local['places'] and local['policyVersion']==C.POLICY_VERSION
assert local['domesticPolicy']=='accepted' and local['localReasons']
incident=build('전포동 정전','부산 부산진구 전포동에서 정전이 발생했다.')
assert incident['places']==['부산광역시/부산진구/전포동']
assert build('서울 성동구 주민 지원')['localEligible'], 'Actual local subject in a title can suffice without a lead.'
assert not build('서울 성동구 주민 지원','서울 성동구는 주민 지원을 확대한다.',legacyLeadMissing=True)['localEligible']
assert not (build('고성군 사고','고성군에서 사고가 났다.') or {}).get('places')
assert not (build('주요 정책 발표','[서울=뉴시스] 기자 = 소비자 정책을 발표했다.') or {}).get('places')
assert not build('전국 지진 대비 전망','서울과 부산 지역의 기온을 비교했다.')['places']
assert build('서울 종로구 인도 돌진 보행자 사망','서울 종로구에서 차량이 인도로 돌진해 사고가 발생했다.')
assert build('영동 공장 외국인 근로자 사망','충북 영동군 황간면 공장에서 인도네시아 국적의 근로자가 기계에 끼이는 사고가 발생했다.',('country',))
assert build('경기 화성시 공장 화재 중국인 사망','경기도 화성시에서 화재가 발생해 중국인 노동자가 사망했다.')
assert build('서울 종로구 영화관 화재','서울 종로구 영화관에서 화재가 발생했다.')
assert not (build('지원 확대','서울 종로구 연구가 이론에 따르면 지원이 필요하다.') or {}).get('localEligible')
exhibit=build('서울 종로구 미술관 특별전 개막','서울 종로구 미술관에서 미국 작가의 특별전이 열린다.',('culture',))
assert exhibit and exhibit['relatedPlaces'] and exhibit['localEligible'], 'Foreign artist is not a foreign event.'
assert build('서울 종로구 전시회 개막','서울 종로구 갤러리에서 전시회가 열린다.',('society',))
assert C.news_category({'title':'국내 정치 반응','feeds':['politics','international']})=='국제'
print('PASS: domestic/local policy regressions, foreign election venue leaks, mixed-feed veto, HQ/courts, real local incidents, domestic exhibition, no-lead legacy failclosed.')

assert not build('부산 KCC 구조조정설 부인','',('society',))['localEligible']
assert not build('울산 HD 주전 공격수 부상 이탈','',('society',))['localEligible']
assert not build('[오늘의 주요 일정] 서울 주민 지원사업 발표','서울 성동구는 주민 지원을 확대한다.')['localEligible']
assert build('서울 뮤지컬 폭발적 인기','서울 종로구에서 뮤지컬이 열린다.',('culture',)) is None
print('PASS: aggregate schedules, team-name collisions and metaphorical action words excluded from local news')

assert not build('한 총리, 서울 주거지원 속도 주문','서울 강서구에서 한 총리가 주택 지원 정책을 설명했다.')['localEligible']
assert not build('해수부 과학기술주간 개최','서울에서 해양 기술 전시가 열린다.')['localEligible']
assert build('평택 가을 민요 대잔치','경기도 평택시에서 민요 공연이 열린다.',('met',)) is None
assert build('부산 단관극장 공동기획전 개막','부산 국립극장에서 영화 기획전이 열린다.',('culture',)) is None
assert build('서울 성동구 배우자 돌봄 지원','서울 성동구는 주민 지원을 확대한다.')['localEligible']
print('PASS: national ministry visits, non-exhibition cultural programmes, and actor/spouse word boundary')

# Actual published false positives from the 2026-11-03 public snapshot.
actual_international = [
 ('NISX20261103_0003852541','10월 美 ISM 제조업 PMI 55.5·1.0P↑…AI·데이터센터 수요 견인','미국 체감경기를 반영하는 2026년 10월 제조업 구매관리자 지수(PMI)는 전월 대비 상승했다고 마켓워치가 보도했다. 미국 공급자관리협회가 관련 통계를 발표했다.',('economy','sokbo')),
 ('NISX20261103_0003852381',"mRNA 다음은 이것?…美 DNA 의약품 첫 승인",'DNA를 활용한 의약품이 미국 식품의약국(FDA)의 문턱을 처음으로 넘었다. 로이터통신 등 외신에 따르면 FDA는 현지시간 미국 바이오기업의 치료제를 승인했다.',('health',)),
 ('NISX20261102_0003850094','제55회 뉴욕 마라톤 대회서 스웨덴 선수 우승','세계 140여국에서 6만명이 참가한 뉴욕시티 마라톤 대회가 현지시간 열렸다. 스웨덴 선수가 우승했다.',('sports',)),
 ('NISX20261103_0003852303','AT마드리드 이강인 vs 뮌헨 김민재…코리안더비','한국 축구 이강인과 김민재가 코리안더비를 치른다. 스페인 마드리드에서 UEFA 챔피언스리그 경기를 치른다.',('sports',)),
]
for identifier,title,text,feeds in actual_international:
    assert build(title,text,feeds,id=identifier) is None,identifier
assert build('기업 관련 발표','국내 기업의 발표다.',sourceSection='국제') is None
assert build('선수 경기 결과','한국 선수가 출전했다.',('sports',),sourceSection2='해외축구') is None
museum_title="한국은행, 유네스코와 기념주화에 새겨진 세계유산 기획전"
museum_text="한국은행은 유네스코한국위원회와 공동주관으로 화폐기획전을 개최한다고 밝혔다.\n이번 전시회는 한국은행 화폐박물관 2층 기획전시실에서 열린다.\n올해는 48차 유네스코 세계유산위원회가 처음 한국(부산)에서 개최된 해다."
related,_=C.related_locations(museum_title,museum_text,matchers,nodes)
assert '부산광역시' not in related,'A different background event must not locate the current exhibition.'
assert build(museum_title,museum_text,('bank',)) is None,'No confirmed location remains for the exhibition; never guess Seoul from the byline.'
kisti=build("슈퍼컴 6호기 한강, 내달14일 공식서비스…세계10위권 진입 전망", "국가 슈퍼컴퓨터 6호기 한강이 다음달 공식서비스를 시작한다. 기존보다 연산성능을 높여 세계10위권에 진입할 전망이다. 정부는 국가전략 연구와 기업 기술개발을 지원한다.\n과학기술정보통신부와 KISTI는 대전 KISTI 본원에서 가동식을 개최했다.",('health',))
assert kisti and not kisti['localEligible'] and '대전광역시' in kisti['relatedPlaces']
icmra=build('의약품 규제 미래 논의…ICMRA 서울에 모였다','식품의약품안전처가 서울에서 ICMRA 정상회의를 개최한다.\n식약처는 서울 영등포구 콘래드 서울에서 세계 규제기관 정상회의를 개최한다고 밝혔다.',('health',))
assert icmra and not icmra['localEligible']
assert build('다시 인간의 시대…서울문화재단 국제예술포럼','서울에서 예술의 역할을 논의하는 장이 열린다.\n서울문화재단은 DDP에서 예술포럼을 개최한다고 밝혔다.',('',),newsCategory='사회') is None
assert build('예당 울린 북유럽 선율…파보 예르비가 빚은 에스토니아 객석에서','서울 서초구 예술의전당에서 오케스트라가 열렸다.',('',),newsCategory='사회') is None
focused=C.focus_lead('첫 번째 소식을 알렸다. 두 번째 이야기를 전했다.\n세 번째 발표가 있었다.')
assert len(C.sentences(focused))==3, 'Sentence/paragraph boundaries must survive focusing.'
assert len(focused.splitlines())==3
legacy=build('관련 기관 발표','대전 본원에서 전국 연구 지원 가동식이 개최됐다.',('health',),legacyRecheck=True,locationMethod='conservative-v4-domestic-local-v1')
assert legacy is None or not legacy['localEligible']
legacy_local=build('서울 성동구 주민 지원','서울 성동구는 지원을 확대한다.',('society',),legacyRecheck=True,locationMethod='conservative-v4-domestic-local-v1')
assert legacy_local and legacy_local['localEligible'], 'An explicit local subject title remains usable without trusting flattened legacy lead sentences.'
print('PASS: actual public foreign-topic, background-museum, national-agency venue, cultural-forum regressions; preserved sentence boundaries and v1 legacy failclosed.')

assert not C.LOCAL_IMPACT.search('서울문화재단 국제예술포럼')
assert C.LOCAL_IMPACT.search('문화재 창고 화재 발생')
assert not build('기관 행사 개최','서울 성동구에서 주민 지원 설명회가 개최됐다.')['localEligible']
assert build('시흥 주민 마음건강 지원','경기 시흥시가 주민 건강 지원을 확대한다.')['localEligible']
assert not build('인천·한국공항공사 통합 유보','국토교통부는 인천 공항공사 통합을 유보했다.',('',),legacyRecheck=True,locationMethod='conservative-v4-domestic-local-v1')['localEligible']
print('PASS: explicit confirmed local subject title required; culture-foundation is not a fire and an airport corporation is not construction.')

request_before=C.request
request_calls=[]
def metadata_source(url,**options):
    request_calls.append((url,options))
    return '<html><head><meta property="article:section" content="국제"><meta property="article:section2" content="국제일반"></head><body><div id="textBody">[서울=뉴시스] 기자 = 관련 기관이 통계를 발표했다.</div></body></html>'.encode()
try:
    C.request=metadata_source
    enriched=C.enrich({'title':'기관 통계 발표','url':'https://www.newsis.com/view/NISX20261103_0003852541'})
finally:
    C.request=request_before
assert len(request_calls)==1 and request_calls[0][1]=={'timeout':6,'attempts':1}
assert enriched['sourceSection']=='국제' and enriched['sourceSection2']=='국제일반'
assert enriched['leadBoundariesVerified']
assert C.build_article(enriched,matchers,nodes) is None
print('PASS: source section metadata uses the same single limited article request and vetoes international classification.')

assert build('한국체조대표팀, 독일서 세계선수권 메달','[서울=뉴시스] 기자 = 대한체육회는 독일에서 열린 세계선수권에서 한국 체조대표팀이 메달을 획득했다고 밝혔다. 서울 대한체육회 관계자가 결과를 발표했다.',('sports',)) is None
assert build('한국 태권도, 튀르키예 국제대회서 메달 획득','대한체육회는 튀르키예 국제대회 경기에서 한국 선수가 메달을 땄다고 밝혔다.',('sports',)) is None
assert build('서울 세계선수권에 독일 선수단 방문','서울에서 세계선수권 경기가 열린다. 독일 선수들이 한국을 방문했다.',('sports',)) is not None
assert build('인천 공항 독일 선수 넘어져 부상','인천 공항에서 독일 선수가 넘어져 다쳤다. 공항 의료진이 현장에서 치료했다.',('sports',)) is not None
legacy_first=build('서울 성동구 주민 지원','서울 성동구는 지원을 확대한다.',('society',),legacyRecheck=True,locationMethod='conservative-v4-domestic-local-v1',policyVersion='domestic-local-v1')
assert legacy_first and legacy_first['leadBoundariesVerified'] is False
legacy_second=C.build_article({**legacy_first,'text':legacy_first['locationLead']},matchers,nodes)
assert legacy_second and legacy_second['leadBoundariesVerified'] is False
assert legacy_second['places']==legacy_first['places'] and legacy_second['relatedPlaces']==legacy_first['relatedPlaces']
synthetic_v2={**legacy_first,'title':'기관 발표','text':'서울 성동구에서 지원 사업을 발표했다.'}
assert C.build_article(synthetic_v2,matchers,nodes) is None, 'A v2 method must never make a false boundary-trust flag true.'
print('PASS: overseas minority-sport competition veto, real Korean-hosted competition/airport incident controls, and persistent false boundary trust on repeat migration.')

assert build('메시·호날두·케인 등 FIFPRO 월드11 후보26명 포함','국제축구선수협회는 3일 한국 시간 월드11 후보를 공개했다. 한국 선수는 포함되지 않았다.',('sports',),id='NISX20261103_0003852325') is None
assert build('중국, 비만약 분야서도 아태 선두주자…한국은?','글로벌 비만치료제 시장의 무게중심이 아시아태평양으로 옮겨가고 있다. 중국이 선두주자로 나타났으며 한국도 추격하고 있다.',('health',),id='NISX20261102_0003850714') is None
assert build('중국 전기차, 한국 시장 진출','중국 전기차 업체가 한국 시장에 진출해 국내 소비자를 대상으로 판매한다.',('industry',))
assert build('서울 종로구 미국 작가 특별전 개막','서울 종로구 미술관에서 미국 작가의 특별전이 열린다.',('culture',))
assert build('부산 경기서 KBO 팀 승리','부산 사직야구장에서 KBO 리그 경기가 열렸다.',('sports',))
print('PASS: Korean timezone is not a domestic subject, foreign-led comparisons and unverified sports are excluded, genuine Korean market/exhibition/league controls survive.')

for title,text in [
 ('한국은행 세계유산 기념주화 기획전','한국은행은 유네스코한국위원회와 화폐기획전을 개최한다고 밝혔다.\n올해 부산에서 개최된 세계유산위원회를 계기로 한국은행 화폐박물관에서 기획전이 열린다.'),
 ('부산 세계유산위 기념주화 기획전 개막…한은 화폐박물관','한국은행 화폐박물관에서 기획전이 열린다.\n부산에서 개최된 세계유산위원회를 기념하는 전시다.'),
]:
    candidate=build(title,text,('bank',))
    assert candidate is None or '부산광역시' not in candidate['relatedPlaces']
    assert candidate is None or not candidate['localEligible']
for title in ['대전 삼성화재, 현대캐피탈 꺾고 홈 개막전 승리','부산 KCC 허웅 3점포 폭발…홈 3연승']:
    candidate=build(title,'KOVO V리그 또는 KBL 국내 리그 경기가 열렸다.',('sports',))
    assert candidate is None or not candidate['localEligible'],title
assert build('경기 파주시 정전협정 기념 평화음악회','경기 파주시에서 평화 음악회 공연이 열린다.',('culture',)) is None
assert C.category('대전 삼성화재 홈 경기 승리')!='사건·안전'
assert C.category('경기 파주시 정전협정 평화음악회')!='사건·안전'
assert C.physical_text('수비 붕괴 3점포 폭발 정전협정 삼성화재').strip()==''
assert len(C.sentences('첫 소식이다.\n다음 소식이다.'))==2
original_digest=C.policy_digest()
assert original_digest==C.policy_digest() and C.LOCATION_METHOD.endswith(original_digest)
C.FACILITIES.append(('test-only','서울특별시','test'))
try:assert C.policy_digest()!=original_digest
finally:C.FACILITIES.pop()
print('PASS: same-sentence and title background exhibition traps, insurance/treaty/sport metaphors, policy-input cache invalidation.')

fresh_recheck=build('서울 성동구 주민 지원','서울 성동구는 주민 지원을 확대한다고 밝혔다.',('society',),policyVersion=C.POLICY_VERSION,locationMethod='old-rule-digest',leadBoundariesVerified=True,sourceSection='사회',sourceSection2='지역')
assert fresh_recheck and fresh_recheck['leadBoundariesVerified'] is True
assert fresh_recheck['sourceSection']=='사회' and fresh_recheck['sourceSection2']=='지역'
assert fresh_recheck['locationMethod']==C.LOCATION_METHOD
assert build('한국 사격대표팀, 이집트 세계선수권 메달','[서울=뉴시스] 기자 = 한국 사격대표팀은 이집트에서 열린 세계선수권에서 메달을 획득했다.',('sports',)) is None
assert build('임성재, 미국프로골프 투어 선전','임성재는 미국프로골프 투어 경기에 출전해 한국 시간 선전을 펼쳤다.',('sports',)) is None
print('PASS: fresh verified source metadata survives rule-digest changes; shooting and compact foreign golf names excluded.')

relocation=build('인천시민단체 29곳, 재외동포청 세종이전 철회 의견서','인천경제정의실천시민연합 등 인천지역 29개 시민·주민단체가 행정안전부에 재외동포청 세종 이전 계획 철회 의견서를 제출했다.\n재외동포청은 인천 송도에서 출범했다.',('country','met','sokbo'),id='NISX20261103_0003852637')
assert relocation and not relocation['localEligible'] and '세종특별자치시' not in relocation['places']
assert '세종특별자치시' in relocation['relatedPlaces'],'A broader related destination may remain in all-news mode.'
assert '세종특별자치시' not in build('인천 주민, 세종이전 지원 반대','인천 주민들이 세종 이전에 반대하는 의견을 냈다.',('met',))['places']
training=build('교내 금융교육 지원…투교협, 하반기 서울·경기 교원 직무연수 모집','전국투자자교육협의회는 서울·경기 지역 초·중·고교 교원을 대상으로 직무연수 참가자를 모집한다.',('bank',),policyVersion=C.POLICY_VERSION,locationMethod=C.LOCATION_METHOD,leadBoundariesVerified=False)
assert training and training['places']==['서울특별시'],'The explicit Seoul teacher-beneficiary title is not a headquarters address.'
print('PASS: relocation destination does not borrow another region\'s resident evidence; explicit regional training beneficiaries remain geographically valid.')

for feed in ['sokbo','society']:
    assert build('임성재, 한국 선수 최초 미국프로골프 투어 3연속 톱10','',(feed,)) is None
background_selection=build('사격 대표팀, 세계선수권 금메달','지난달 서울에서 열린 선발전을 통과한 한국 사격 대표팀이 2일 카타르 도하에서 열린 세계선수권대회 결선에서 금메달을 땄다.',('sports',))
assert background_selection is None,'A Korean background qualifier cannot locate the foreign final.'
assert build('국립현대미술관 기획전, 부산 순회 개막','서울 종로구 국립현대미술관에서 열린 기획전이 부산으로 옮겨 3일 개막한다.',('culture',)) is None
relocation2=build('부산 시민단체, 산업은행 서울 잔류 규탄','부산 시민단체가 산업은행의 서울 잔류를 규탄하는 의견을 제출했다.',('met',))
assert relocation2 is None or '서울특별시' not in relocation2['places']
print('PASS: sports semantics across general feeds, foreign final versus Korean background qualifier, touring exhibition past venue, and unrelated relocation-object pins.')

assert build('한국 쇼트트랙, 몬트리올 월드투어 금메달 3개','서울 태릉에서 열린 대표선발전 1위 최민정이 2일 몬트리올 월드투어 1500m에서 금메달을 땄다.',('sports',)) is None
assert build('한국 쇼트트랙, 서울 월드투어 금메달 3개','서울에서 열린 월드투어에서 한국 선수가 금메달을 땄다.',('sports',))
assert build('한국 쇼트트랙, 월드투어 메달','서울 태릉에서 훈련을 마친 한국 선수가 외국 월드투어에서 메달을 땄다.',('sports',)) is None
print('PASS: a Korean background qualifier/training cannot locate unknown-city overseas sport; nonleague sport requires explicit Korean title place plus current-event lead evidence.')

assert build('서울 연고 최민정, 몬트리올 월드투어 금메달','서울 연고 실업팀 최민정이 2일 몬트리올에서 열린 월드투어에서 금메달을 땄다.',('sports',)) is None
assert build('울산 HD, 요코하마 원정서 ACLE 2연승','K리그1 울산 HD가 2일 요코하마에서 열린 ACLE 리그 스테이지 경기에서 승리했다.',('sports',)) is None
assert build('부산 KBO 홈경기 승리','부산사직야구장에서 KBO 홈 경기가 열렸다.',('sports',))
assert build('울산 K리그 홈경기 승리','울산문수경기장에서 K리그 홈 경기가 열렸다.',('sports',))
assert build('서울 월드투어 메달','서울에서 응원하던 팬들은 몬트리올에서 열린 월드투어 결과를 봤다.',('sports',)) is None
print('PASS: a Korean affiliation never bridges to an unknown foreign event city; all leagues need a definite current Korean venue and away games cannot bypass it.')

assert build('경남 최민정, 몬트리올 월드투어 금메달','경남 서부권 실업팀 최민정이 2일 몬트리올에서 열린 월드투어에서 금메달을 땄다.',('sports',)) is None
assert build('충남 대표팀, 해외 월드투어 금메달','충남 서해안 실업팀 선수가 몬트리올에서 열린 월드투어에서 금메달을 땄다.',('sports',)) is None
assert build('서울 월드투어 금메달','서울에서열린 월드투어에서 금메달을 땄다.',('sports',)) is None
print('PASS: the sports place particle must be standalone 에서; 서부권/서해안 and unspaced shortcuts cannot act as event locations.')
