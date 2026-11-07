const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {recommend,idOf}=require('./recommend-core.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const items=[...html.matchAll(/<a class="archive-card vn-story" href="([^"]+)"[\s\S]*?<h3>([\s\S]*?)<\/h3><p>(.*?)<\/p><\/a>/g)].map(m=>({url:m[1],title:m[2].replace(/<[^>]+>/g,' '),description:m[3]}));
items.push({url:'https://visual.newsis.com/arcade/',title:'충무로딩',description:'뉴스가 있는 충무로 놀이마당'});
items.push({url:'https://visual.newsis.com/calculator/index.html',title:'계산대로',description:'연봉 · 대출 · 예적금 · 할인율'});
test('actual catalog connects situations to relevant existing content',()=>{
 for(const [q,id] of [['퇴사하고 싶은데 돈이 걱정돼','quit'],['AI 때문에 내 일자리가 걱정돼','aijob'],['회사에서 AI로 감시해','spai'],['집 살 돈 대출 걱정돼','buy-live'],['국민연금이 궁금해','pension'],['손끝으로 점자를 읽는 이야기','braille-100'],['잠깐 머리 식히고 싶어','arcade']]){
  const r=recommend(q,items);assert.equal(idOf(r.items[0]?.url),id,q);assert.ok(r.items.every(x=>items.some(i=>i.url===x.url)));assert.ok(r.items.every(x=>x.reason));
 }
 assert.ok(!recommend('회사에서 AI로 감시해',items).items.some(x=>idOf(x.url)==='aijob'));
 assert.equal(idOf(recommend('DMZ 지뢰가 궁금해',items).items[0]?.url),'dmz');
 assert.equal(idOf(recommend('새로운 DMZ 이야기 알려줘',items).items[0]?.url),'dmz');
});
test('independent-review counterexamples preserve intended topics',()=>{
 for(const [q,id] of [['3분기 금리 전망','thief'],['노후가 불안해요','pension'],['전세계 축구 이야기','son7'],['나이키 러닝화','running'],['도대체 금리 왜 올라','thief'],['인공지능이 무서워','aijob'],['아빠 국민연금 얼마 받아','pension'],['생활에 도움되는 거','quit'],['월급 실수령액 계산해보고 싶어','calculator']])assert.equal(idOf(recommend(q,items).items[0]?.url),id,q);
 assert.notEqual(recommend('편안하게 볼 이야기',items).kind,'clarify');
 for(const [q,id] of [['새로운 연금 개혁 알려줘','pension'],['새로 나온 배터리 알려줘','battery'],['대체 왜 금리가 올라','thief']])assert.equal(idOf(recommend(q,items).items[0]?.url),id,q);
 for(const q of ['응급실 대란','학교폭력 문제','피아니스트 이야기','인터랙티브 추천해줘','데이터 이야기 추천','축구 게임 하고 싶어'])assert.equal(recommend(q,items).items.length,0,q);
 assert.equal(idOf(recommend('폭염 대비',items).items[0]?.url),'heat-rain');
 assert.equal(idOf(recommend('은퇴 준비',items).items[0]?.url),'pension');
});
test('unverified audience and duration, exclusions and unsupported topics do not force results',()=>{
 for(const q of ['부모님이랑 같이 볼 만한 거 있어?','3분 정도 볼 거 추천해줘','퇴사하지 않고 버티는 방법','퇴사할 생각 없는데','AI 말고 주택 이야기','AI 안 궁금해','오늘 비트코인 가격은?','아이폰 신제품','Thailand 여행','<script>alert(1)</script>',''])assert.equal(recommend(q,items).items.length,0,q);
});
test('categories stay bounded and absent catalog URLs are never invented',()=>{
 for(const q of ['내 생활에 도움되는 것','새롭게 알게 되는 것','잠깐 즐길 것']){const r=recommend(q,items);assert.ok(r.items.length>0&&r.items.length<=3);}
 assert.equal(recommend('퇴사',[]).items.length,0);
 assert.equal(recommend('퇴사',[{url:'https://other.example/quit/',title:'외부',description:''}]).items.length,0);
});
