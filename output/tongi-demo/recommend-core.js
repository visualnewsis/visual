(function(root){
 'use strict';
 const search=typeof module!=='undefined'&&module.exports?require('./search-core.js'):root.TongiSearch;
 const rules=[
  {id:'quit',words:['퇴사','퇴직','생활비','잔고','통장','그만두'],reason:'퇴사 후 생활비와 통장 잔고를 직접 넣어 살펴보는 콘텐츠예요.'},
  {id:'aijob',words:['일자리','노동시장','해고','실직','직업','ai','인공지능'],reason:'AI가 노동시장과 일자리에 미치는 변화를 다룬 비주얼 기사예요.'},
  {id:'spai',words:['직원감시','직원 감시','감시','근무 기록','딴짓','스파이'],reason:'회사가 AI로 직원의 근무를 기록하고 감시하는 문제를 다뤄요.'},
  {id:'buy-live',words:['주택','대출','내집','내 집','집값','아파트','집 살','집을 사','전세'],reason:'주택·대출·생활비를 함께 살펴보는 인터랙티브 기사예요.'},
  {id:'pension',words:['연금','국민연금','노후','은퇴'],reason:'국민연금과 노후를 주제로 구성한 비주얼 기사예요.'},
  {id:'senior',words:['고령','환갑','나이','노인'],reason:'고령화와 나이 기준을 살펴보는 콘텐츠예요.'},
  {id:'braille-100',words:['점자','손끝','훈맹정음','시각장애'],reason:'한글 점자의 역사와 오늘을 손끝의 문자로 만나요.'},
  {id:'children',words:['아이','자녀','육아','생활권'],reason:'아이가 자라는 동안 달라지는 생활권을 살펴보는 기사예요.'},
  {id:'running',words:['달리기','러닝','마라톤'],reason:'러닝 안전과 응급 대응을 살펴보는 콘텐츠예요.'},
  {id:'battery',words:['배터리','리튬','충전'],reason:'리튬이온 배터리의 구조를 살펴보는 지도 인터랙티브예요.'},
  {id:'thief',words:['금리','이자','가계경제'],reason:'금리와 가계경제를 다룬 인터랙티브 기사예요.'},
  {id:'son7',words:['손흥민','축구','국가대표'],reason:'축구와 A매치를 다룬 비주얼 기사예요. 최신 경기 소식은 제공하지 않아요.'},
  {id:'calculator',words:['연봉','월급','예금','적금','할인','계산기','실수령'],reason:'계산대로에서 연봉·대출·예적금·할인율 등을 내 숫자로 계산해 볼 수 있어요.'}
 ];
 const categories={life:['quit','buy-live','thief'],learn:['braille-100','battery','aijob'],play:['arcade']};
 const categoryWords={life:'내 생활에 도움되는 것',learn:'새롭게 알게 되는 것',play:'잠깐 즐길 것'};
 function idOf(url){try{const u=new URL(url);if(u.hostname!=='visual.newsis.com')return '';return u.pathname.split('/').filter(Boolean)[0]||'';}catch{return '';}}
 function recommend(question,items){
  const q=String(question).normalize('NFKC').trim().toLowerCase();
  const catalog=new Map(items.map(item=>[idOf(item.url),item]).filter(([id])=>id));
  function result(ids){return ids.filter(id=>catalog.has(id)).slice(0,3).map(id=>({...catalog.get(id),reason:rules.find(r=>r.id===id)?.reason||(id==='arcade'?'충무로딩에서 뉴스와 연결된 게임을 골라 즐길 수 있어요.':'입력한 말과 제목·주제 표기가 겹치는 콘텐츠예요. '+catalog.get(id).description)}));}
  if(!q)return {kind:'clarify',message:'궁금한 주제나 지금 상황을 적어주세요.',items:[]};
  if(/(?:말고|제외|빼고|원하지|싫|않|아니(?:야|에요|예요|고|라|면|다|\s|$)|생각\s*없|(?:^|\s|퇴사)안\s*(?:하|할|해|보고|볼|읽|궁금))/.test(q))return {kind:'clarify',message:'빼고 싶은 내용이 있군요. 이번에 보고 싶은 주제 하나만 골라 알려주세요.',items:[]};
  if(/(?:부모님|어머니|아버지|엄마|아빠|가족.*같이)/.test(q)&&!rules.some(rule=>rule.words.some(word=>q.includes(word))))return {kind:'clarify',message:'가족용으로 선별한 목록은 아직 없어요. 연금·주거·점자처럼 함께 궁금한 주제를 알려주세요.',items:[]};
  if(/(?:\d+\s*분(?!기)|짧은|빨리.*볼|금방.*끝)/.test(q))return {kind:'clarify',message:'소요 시간을 측정하지 않아 몇 분 안에 끝난다고 약속하긴 어려워요. 보고 싶은 주제를 골라주세요.',items:[]};
  const contains=w=>w==='ai'?/(?:^|[^a-z])ai(?:[^a-z]|$)/.test(q):w==='아이'?/아이(?:가|는|를|의|와|랑|\s|$)/.test(q):w==='전세'?/전세(?:가|는|를|의|도|에|와|랑|금|대출|사기|\s|$|[?.,])/.test(q):w==='나이'?/나이(?:가|는|를|의|도|에|와|랑|기준|\s|$|[?.,])/.test(q):q.includes(w);
  const hits=rules.map(rule=>({id:rule.id,score:rule.words.reduce((n,w)=>n+(contains(w)?w.length:0),0)})).filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score);
  const filtered=hits.some(hit=>hit.id==='spai')&&!/(?:일자리|해고|대체|실직|직업)/.test(q)?hits.filter(hit=>hit.id!=='aijob'):hits;
  let ids=filtered.map(hit=>hit.id);
  if(!ids.length){
   const generic=new Set(['인터랙티브','이야기','데이터','콘텐츠','추천','기사','뉴스','체험','보고','보고싶어','보고싶어요','준비','대비','방법','전망','정보','안내','걱정','궁금','새로운','최근']);
   const terms=search.extract(q).toLowerCase().split(/\s+/).filter(w=>w.length>=2&&!generic.has(w));
   ids=[...catalog.values()].map(item=>({item,score:terms.reduce((score,term)=>score+(item.description.toLowerCase().includes(term)?4:0)+(item.title.toLowerCase().includes(term)?2:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(({item})=>idOf(item.url));
  }
  if(ids.length&&/게임/.test(q))return {kind:'clarify',message:'그 주제의 게임이 있는지는 아직 확인하지 못했어요. ‘잠깐 즐기기’로 게임 목록을 보거나, 주제만 적어 기사를 골라보세요.',items:[]};
  // Specific topics always win over a broad discovery category.
  for(const [key,label] of Object.entries(categoryWords)){if(!ids.length&&q===label.toLowerCase())ids=categories[key];}
  if(!ids.length&&/(?:생활.*도움|도움.*생활)/.test(q))ids=categories.life;
  if(!ids.length&&/(?:새롭게|새로.*알|새로운.*알|배울)/.test(q))ids=categories.learn;
  if(!ids.length&&/(?:머리\s*식|게임|심심|놀고|놀까|즐길|기분\s*전환)/.test(q))ids=['arcade'];
  const found=result(ids);
  return {kind:found.length?'matches':'empty',message:found.length?'이런 이야기는 어때요?':'맞는 콘텐츠를 아직 찾지 못했어요. 다른 주제로 골라볼까요?',items:found};
 }
 const api={recommend,idOf};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TongiRecommend=api;
})(typeof window==='undefined'?globalThis:window);
