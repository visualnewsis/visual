"""International country roles and static-delivery integration regressions."""
import copy
import json
import sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import collect_news as C
import collect_world as W

def roles(title,lead=''):
    return {x['country']:x['role'] for x in W.classify(title,lead)}
assert roles('프랑스 파리에서 화재 발생')['FR']=='place'
assert roles('미국과 중국 관세 협상')=={'US':'related','CN':'related'}
assert roles('베이징, 관세 철회 촉구')=={}
assert roles('중국 베이징, 관세 철회 촉구')=={'CN':'related'}
assert 'KR' not in roles('미국서 발표','[서울=뉴시스] 기자 = 미국이 밝혔다')
assert 'US' not in roles('지원 확대',C.focus_lead('[워싱턴=뉴시스] 기자 = 주요 정책을 발표했다.'))
assert 'IN' not in roles('서울 인도로 돌진한 차량')
assert 'IN' not in roles('인도·태평양 협력 강화')
assert 'GE' not in roles('미국 조지아주 선거')
assert roles('조지아 트빌리시에서 시위 발생')['GE']=='place'
assert not roles('과학 기술의 미래')
assert roles('방콕 중인 배우의 일상')=={}
assert roles('파리 잡는 장치 개발')=={}
assert roles('파리에서 화재 발생')['FR']=='place'
assert roles('파리 생제르맹 승리')=={}
assert roles('오사카 선수 우승')=={}
assert roles('런던 출신 배우 신작')=={}
assert roles('과거 파리에서 화재 발생')=={}
assert roles('일본 경제 전망','일본 정부가 전망을 냈다.\n프랑스 언론의 반응도 전했다.')=={'JP':'related'}
assert roles('일본 정부 경제 전망','미국 CNBC는 일본 정부의 발표를 보도했다.')=={'JP':'related'}
assert roles('파리에서 미국 지진을 논평했다')=={'US':'related'}
assert roles('해외 소식','과거 파리에서 화재가 났다.')=={}
assert 'GE' not in roles('현대차 조지아 공장 투자')
assert 'QA' not in roles('군 도하 훈련 실시')
assert 'QA' not in roles('군 도하를 실시했다')
assert roles('인도에서 열차 충돌','뉴델리 당국이 사고를 확인했다.')['IN']=='place'
assert 'IN' not in roles('뉴욕 인도에서 차량 충돌 발생')
assert 'IN' not in roles('인도와 차도 정비')
assert 'QA' not in roles('군 도하 훈련 실시')
assert 'QA' not in roles('군 도하를 실시했다')
assert 'IR' not in roles("'관세 폭탄'이란 표현")
assert 'PS' not in roles('함께 가자')
assert 'IR' not in roles('인공지능(AI)이란')
assert 'IR' not in roles('《책 제목》이란')
assert roles('가자 북부 주민 구호')=={'PS':'related'}
assert 'OM' not in roles('오만을 버려야 한다')
assert 'ML' not in roles('분쟁을 말리는 중재자')
assert 'GH' not in roles('어디를 가나 환영')
assert roles('오만 정부 회담 개최')=={'OM':'related'}
assert roles('이란 정부 협상 재개')=={'IR':'related'}
assert roles('미국에서 일본에 관세 부과 발표. 프랑스에서 화재 발생')['US']=='related'
assert roles('싱가포르 정부가 발표')=={'SG':'related'}
assert roles('중국 국적 근로자 사고')=={}
now=datetime.now(timezone.utc)
xml=f'''<rss><channel><item><title>미국과 중국 관세 협상</title><link>https://www.newsis.com/view/NISX20261110_0000000001</link><pubDate>{now.strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate><description>미국과 중국이 협상한다.</description></item></channel></rss>'''.encode()
w=W.collect(now=now,source=xml)
assert W.valid(w,now)
legacy=copy.deepcopy(w);legacy['policyVersion']='world-country-v2'
old_article=copy.deepcopy(legacy['articles'][0]);old_article.update(id='NISX20261110_0000000099',url='https://www.newsis.com/view/NISX20261110_0000000099',title='베이징, 관세 철회 촉구')
legacy['articles'].append(old_article)
migrated=W.collect(legacy,now,source=xml)
assert next(a for a in migrated['articles'] if a['id']==old_article['id'])['locations']==[], 'Keep the article, remove unsupported old place inference'
assert len(w['articles'])==1 and len(w['articles'][0]['locations'])==2
invalid_previous=copy.deepcopy(w);invalid_previous['collectedAt']='not-a-date'
assert W.valid(W.collect(invalid_previous,now,source=xml),now)
prior=copy.deepcopy(w)
w2=W.collect(prior,now+timedelta(minutes=10),source=xml)
assert len(w2['articles'])==1
assert w2['articles']==w['articles']
assert w2==prior, 'Unchanged world content must not force a new deployment every run'
try: W.collect(w,now,source=b'<rss><channel/></rss>')
except ValueError: pass
else: raise AssertionError('An empty feed must not erase history')
for mutate in [lambda x:x['articles'].append(copy.deepcopy(x['articles'][0])),lambda x:x['articles'][0]['locations'][0].update(country='unknown'),lambda x:x['articles'][0].update(url='https://example.com')]:
    invalid=copy.deepcopy(w);mutate(invalid)
    try:W.valid(invalid,now)
    except AssertionError:pass
    else:raise AssertionError('Invalid snapshot accepted')
root=Path(__file__).resolve().parents[1]
payload=C.decode_snapshot((root/'data/articles.js').read_bytes())
if 'world' in payload:
    assert W.valid(payload['world'])
    assert all(a['id'] not in {x['id'] for x in payload['world']['articles']} for a in payload['articles'])
# Regression fixtures must also work when the production candidate has no world.
payload.setdefault('world',copy.deepcopy(w))
print('PASS: physical places vs related countries, dateline/nationality/ambiguity, Singapore, retention, duplicate IDs, malformed data, empty feed preservation, domestic/world isolation.')

# Exercise the production main entry without live network: domestic schema/data
# stay intact, world generation reuses the exact cached exclusion-feed bytes.
from tempfile import TemporaryDirectory
from unittest.mock import patch
from contextlib import redirect_stdout
from io import StringIO
with TemporaryDirectory() as directory:
    out=Path(directory)/'articles.js'
    before=copy.deepcopy(payload)
    def domestic(previous,at,fetch,enrich_limit):
        fetch('https://www.newsis.com/RSS/international.xml')
        return {k:v for k,v in before.items() if k!='world'},False,{}
    with patch.object(C,'decode_snapshot',return_value=before),patch.object(C,'request',return_value=xml),patch.object(C,'collect',side_effect=domestic),patch.object(sys,'argv',['collect_news.py','--output',str(out)]),redirect_stdout(StringIO()):
        C.main()
    result=C.decode_snapshot(out.read_bytes())
    assert {k:v for k,v in result.items() if k!='world'}=={k:v for k,v in before.items() if k!='world'}
    assert W.valid(result['world'])
    with patch.object(C,'decode_snapshot',return_value=before),patch.object(C,'request',return_value=b'<rss><channel/></rss>'),patch.object(C,'collect',side_effect=domestic),patch.object(sys,'argv',['collect_news.py','--output',str(out)]),redirect_stdout(StringIO()):
        C.main()
    failed=C.decode_snapshot(out.read_bytes())
    assert failed['world']==before['world']
print('PASS: production entry caches international feed, isolates world failure, preserves all domestic fields and previous world data.')

for title in ['中東 긴장 고조','中企 지원 확대','北極 탐사','佛敎 문화','單獨 보도','獨島 방문']:
    assert roles(title)=={}, title
assert roles('美·中 무역 협상')=={'US':'related','CN':'related'}

for title in ['中·장기 전략 발표','中·소형 아파트','中·고교생','中·대형 위성','中·단기 과제','中·저소득층 지원','中·후반 레이스']:
    assert roles(title)=={}, title
assert W.preserve(legacy,now)['policyVersion']==W.VERSION
assert len(W.preserve(legacy,now)['articles'])==len(legacy['articles'])

with TemporaryDirectory() as directory:
    out=Path(directory)/'articles.js'
    prior=copy.deepcopy(payload);prior['world']['policyVersion']='world-country-v4'
    capture=StringIO()
    with patch.object(C,'decode_snapshot',return_value=prior),patch.object(C,'request',return_value=b'<rss><channel/></rss>'),patch.object(C,'collect',side_effect=domestic),patch.object(sys,'argv',['collect_news.py','--output',str(out)]),redirect_stdout(capture):
        C.main()
    migrated=C.decode_snapshot(out.read_bytes())
    assert migrated['world']['policyVersion']==W.VERSION
    assert len(migrated['world']['articles'])==len(prior['world']['articles'])
    assert migrated['world']['collectedAt']==prior['world']['collectedAt']
    assert json.loads(capture.getvalue())['changed'] is True
print('PASS: real main preserves every prior-version article and original timestamp during empty-feed policy migration.')

assert roles('파푸아 뉴기니에서 규모 5.9 강진 발생','파푸아 뉴기니에서 규모 5.9 지진이 발생했다고 독일 지구과학연구센터가 발표했다.')=={'PG':'place'}

assert roles('美·이란 협상')=={'US':'related','IR':'related'}
assert roles('美·호주 국방장관')=={'US':'related','AU':'related'}
assert roles('美·中과 협상')=={'US':'related','CN':'related'}
for source in ['미국 지질조사국(USGS)','일본 교도통신','중국 신화통신','러시아 타스통신','미국 월스트리트저널','영국 파이낸셜타임스']:
    assert roles('인도네시아에서 규모 6.0 지진 발생','인도네시아에서 규모 6.0 지진이 발생했다고 '+source+'이 밝혔다.')=={'ID':'place'}, source

assert roles('13日 새벽 지진 발생')=={}

# Actual first-release RSS regressions: ordinary Korean noun and publisher origin.
assert 'SD' not in roles('美전문가들 "전작권 전환, 트럼프엔 주한미군 철수 수단"')
assert roles('수단 정부, 내전 중재안 수용')=={'SD':'related'}
assert 'US' not in roles('북러, 정기 버스 노선 운영 준비','북한과 러시아가 정기 버스 노선을 준비하고 있다고 미국의 북한 전문 매체 NK 뉴스(NK NEWS)가 보도했다.')
assert roles('미국에서 화재 발생','미국에서 화재가 발생했다고 미국의 북한 전문 매체 NK 뉴스가 보도했다.')=={'US':'place'}

assert 'SD' not in roles('남수단 정부, 협상 수단 검토')
