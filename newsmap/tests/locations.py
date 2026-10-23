"""Regression checks for ambiguous Korean place names; no network access."""
import importlib.util
import sys
from pathlib import Path
sys.dont_write_bytecode=True

path=Path(__file__).resolve().parents[1]/'tools/collect_news.py'
spec=importlib.util.spec_from_file_location('collector',path)
collector=importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
matchers=collector.compile_matchers(collector.load_nodes())
locate=lambda title,body:collector.locate(title,body,matchers)[0]
assert locate('미국 뉴욕 증시 상승','미국 뉴욕 증시가 상승했다.')==[]
assert locate('배구 경기 종료','한국 대표팀의 경기가 끝났다.')==[]
assert locate('전포동 정전','부산 부산진구 전포동에서 정전이 발생했다.')==['부산광역시/부산진구/전포동']
assert locate('김천 고물상 화재','경북 김천시 평화동 고물상에서 불이 났다.')==['경상북도/김천시']
assert locate('경기 광주 전기버스 화재','경기 광주시 경안동에서 불이 났다.')==['경기도/광주시/경안동']
assert locate('성동구 지원','서울 성동구는 지원을 확대한다고 밝혔다.')==['서울특별시/성동구']
assert locate('용인시 사고','경기도 용인시 처인구 이동읍에서 사고가 났다.')==['경기도/용인시/처인구/이동읍']
assert locate('기업 실적 전망','1800억원의 손실을 내면 적자로 전환하게 된다.')==[]
assert locate('공급 확대','인프라 확대에 속도를 내면서 참여가 늘고 있다.')==[]
assert locate('한국천주교주교회의 신임 의장 선출','그는 1968년 전남 무안에서 태어나 사제가 됐다.')==[]
assert locate('천주교 기록 디지털 공개','일제강점기 경남 함양 지역의 1918년 문서다.')==[]
assert locate('천주교 디지털 기록 공개','당시 전북 장수군과 진안군의 공소 명단을 적었다. 한국천주교주교회의가 사료 목록화 사업의 성과를 공개했다.')==[]
assert locate('전국 소비자 지침 개정','[세종=뉴시스]임하은 기자 = 앞으로 상조회사는 소비자 보호 위원회를 설치한다.')==[]
assert locate('아파트 민원 늘어','서울 도심 아파트. 2026.10.14. (사진=자료사진)')==[]
assert locate('성수동 수제버거를 편의점에서','삼립은 성수동 수제버거 브랜드 제스티살룬과 협업 상품을 전국 편의점에서 선보인다.')==[]
assert locate('완도 청산도 희귀어류 확인','전남 완도군 청산도에서 서식을 확인했다. 지난해 경남 통영시 사량도에서 채집했다.')==['전남광주통합특별시/완도군']
assert locate('[김제소식] 자원순환 축제','전북 김제시는 축제를 개최한다. ◇금산면 문화의 날\n김제시 금산면에서 공연한다.')==['전북특별자치도/김제시']
print('PASS: no empty matcher, foreign news, 경기 ambiguity, same-name dong, 광주 ambiguity, district-only scope, intermediate city hierarchy.')

nodes={n['id']:n for n in collector.load_nodes()}
places,reasons=collector.related_locations('부산 사건 피고인 선고','서울고법 형사부는 부산 부산진구에서 발생한 사건의 항소심 판결을 선고했다.',matchers,nodes)
assert '서울특별시/서초구' in places and '부산광역시/부산진구' in places,places
assert '재판' in reasons['서울특별시/서초구']
places,_=collector.related_locations('국회에서 기자회견','국회에서 대책 발표 기자회견이 열렸다.',matchers,nodes)
assert '서울특별시/영등포구' in places
places,_=collector.related_locations('국회의원 정책 제안','국회의원은 전국 정책을 제안했다.',matchers,nodes)
assert '서울특별시/영등포구' not in places,'A legislator alone is not evidence of an event at Parliament.'
print('PASS: related locations allow incident + court; institution-only mentions do not invent an event.')
