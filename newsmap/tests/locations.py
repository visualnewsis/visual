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
print('PASS: no empty matcher, foreign news, 경기 ambiguity, same-name dong, 광주 ambiguity, district-only scope, intermediate city hierarchy.')
