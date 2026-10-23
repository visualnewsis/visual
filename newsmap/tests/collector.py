"""Offline regression tests for collection history, malformed feeds and precise locations."""
import importlib.util
import json
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('collector',Path(__file__).resolve().parents[1]/'tools/collect_news.py')
C=importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
now=datetime(2026,10,23,12,tzinfo=timezone.utc)
def article(identifier,days=0,title='서울 성동구 지원',text='서울 성동구는 지원을 확대한다고 밝혔다.'):
    return {'id':identifier,'title':title,'text':text,'url':'https://www.newsis.com/view/'+identifier,
        'publishedAt':(now-timedelta(days=days)).isoformat(),'image':''}
old=article('NISX20261022_0000000001',1)
fresh=article('NISX20261023_0000000002')
corrected={**old,'title':'수정 제목'}
merged=C.merge_articles([old,article('expired',31),article('future',-1)],[corrected,fresh],now)
assert [a['id'] for a in merged]==[fresh['id'],old['id']]
assert merged[1]['title']=='수정 제목'
xml=b'<rss><channel><item><title>bad item</title><link>invalid</link></item><item><title>Seoul</title><link>https://www.newsis.com/view/NISX20261023_0000000002</link><pubDate>Fri, 23 Oct 2026 18:00:00 +0900</pubDate><description>text</description></item></channel></rss>'
parsed,_=C.parse_feed(xml,'society',now)
assert len(parsed)==1,'One invalid item must not discard an entire feed'
try:C.parse_feed(b'<html>upstream error</html>','whol',now)
except ValueError:pass
else:raise AssertionError('A successful HTTP response is not necessarily a feed')
lead=C.ArticleLead()
lead.feed('<header>Seoul</header><div id="textBody"><table><tr><td>Photo location</td></tr></table>Busan incident<div>Actual lead</div></div><footer>Unrelated place</footer>')
assert 'Photo location' not in ''.join(lead.parts)
assert 'Unrelated' not in ''.join(lead.parts)
assert 'Actual lead' in ''.join(lead.parts)
lead=C.ArticleLead()
lead.feed('<div id="textBody"><div class="article_photo"><table><tbody><tr><td>서울 도심 자료사진</td></tr></tbody></table></div></div></div><br />[부산=뉴시스] 기자 = 부산 부산진구 전포동에서 정전이 발생했다.<br />소방당국이 현장을 확인 중이다.<br />◎공감언론 뉴시스 reporter@newsis.com<footer>다른 기사</footer>')
actual=C.article_text(''.join(lead.parts))
assert '자료사진' not in actual and '다른 기사' not in actual
assert '부산진구 전포동' in actual,'Malformed photo divs must not truncate the real article lead.'
assert '\n' in actual,'Preserve paragraph boundaries for location context.'
matchers=C.compile_matchers(C.load_nodes())
assert C.locate('주교회의 의장 선출','그는 과거 논산 부창동 주임신부를 거쳐 의장이 됐다.',matchers)[0]==[]
assert C.locate('고성군 사고','고성군에서 사고가 났다.',matchers)[0]==[]
assert C.locate('부산 부산진구 지원','부산 부산진구는 지원을 확대했다.',matchers)[0]==['부산광역시/부산진구']
snapshot={'schemaVersion':1,'collectedAt':now.isoformat(),'articles':[old]}
with tempfile.TemporaryDirectory() as directory:
    path=Path(directory)/'articles.js'
    C.write_snapshot(path,snapshot)
    assert C.decode_snapshot(path.read_bytes())==snapshot
    assert not path.with_suffix('.js.tmp').exists()
def broken(url):raise OSError('source unavailable')
try:C.collect(snapshot,now,fetch=broken,enrich_limit=0)
except RuntimeError:pass
else:raise AssertionError('All-source failure must stop publication')
items=''.join('<item><title>서울 성동구 지원 '+str(i)+'</title><link>https://www.newsis.com/view/NISX20261023_'+str(i).zfill(10)+'</link><pubDate>Fri, 23 Oct 2026 18:00:00 +0900</pubDate><description>서울 성동구는 지원을 확대했다.</description></item>' for i in range(20))
good=('<rss><channel>'+items+'</channel></rss>').encode()
payload,changed,report=C.collect(snapshot,now,fetch=lambda url:good,enrich_limit=0)
assert changed and len(payload['articles'])==21
again,changed,_=C.collect(payload,now+timedelta(minutes=10),fetch=lambda url:good,enrich_limit=0)
assert not changed,'No content change must not cause another deployment'
assert len(again['articles'])==21,'Articles absent from a rotated feed must survive'
legacy={**payload,'articles':[{**a,'locationMethod':'conservative-place-name-v2','places':['강원특별자치도/홍천군/내면']} for a in payload['articles']]}
rechecked,changed,_=C.collect(legacy,now,fetch=lambda url:good,enrich_limit=0)
assert changed
assert all('강원특별자치도/홍천군/내면' not in a['places'] for a in rechecked['articles']), 'Matching fingerprints must not preserve a classification from an older algorithm.'
print('PASS: rotation retention, ID deduplication, corrections, expiry, invalid feeds/items, article-only lead, biography/ambiguous-place exclusion, atomic writes, all-feed failure and unchanged-content detection.')
