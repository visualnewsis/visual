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
assert not build('대구 경기 종료','대구 체육관에서 농구 경기가 열렸다.',('sports',))['localEligible']
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
assert not build('고성군 사고','고성군에서 사고가 났다.')['places']
assert not build('주요 정책 발표','[서울=뉴시스] 기자 = 소비자 정책을 발표했다.')['places']
assert not build('전국 지진 대비 전망','서울과 부산 지역의 기온을 비교했다.')['places']
assert build('서울 종로구 인도 돌진 보행자 사망','서울 종로구에서 차량이 인도로 돌진해 사고가 발생했다.')
assert build('영동 공장 외국인 근로자 사망','충북 영동군 황간면 공장에서 인도네시아 국적의 근로자가 기계에 끼이는 사고가 발생했다.',('country',))
assert build('경기 화성시 공장 화재 중국인 사망','경기도 화성시에서 화재가 발생해 중국인 노동자가 사망했다.')
assert build('서울 종로구 영화관 화재','서울 종로구 영화관에서 화재가 발생했다.')
assert not build('지원 확대','서울 종로구 연구가 이론에 따르면 지원이 필요하다.')['localEligible']
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
