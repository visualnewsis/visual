const SUITS=[{key:'s',symbol:'♠',red:false,file:'S'},{key:'h',symbol:'♥',red:true,file:'H'},{key:'d',symbol:'♦',red:true,file:'D'},{key:'c',symbol:'♣',red:false,file:'C'}];
const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const FALLBACK=[
  {category:'NEWSIS',title:'오늘의 뉴스를 한 장 뽑았습니다',summary:'게임 결과와 관계없이 뉴스는 언제나 당첨됩니다. 뉴시스에서 지금 가장 새로운 소식을 확인하세요.',url:'https://www.newsis.com/'},
  {category:'충무로딩',title:'카드를 옮기듯, 복잡한 뉴스를 한 칸씩',summary:'오늘의 헤드라인을 게임으로 만나보세요.',url:'https://visual.newsis.com/arcade/'}
];

const $=selector=>document.querySelector(selector);
const state={columns:[],free:[null,null,null,null],foundations:[[],[],[],[]],selected:null,history:[],moves:0,deal:1,news:[],newsByCategory:new Map(),categories:['속보','정치','경제','종합'],newsIndex:0,rewardOpen:false,sound:false};

function seededRandom(seed){let t=seed+0x6D2B79F5;return()=>{t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function buildDeck(){return SUITS.flatMap((s,si)=>RANKS.map((rank,ri)=>({id:s.key+rank,suit:si,rank:ri+1,label:rank,red:s.red,symbol:s.symbol,file:s.file})))}
function shuffle(deck,seed){const rnd=seededRandom(seed);for(let i=deck.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
function snapshot(){return JSON.stringify({columns:state.columns,free:state.free,foundations:state.foundations,moves:state.moves,rewardOpen:state.rewardOpen})}
function restore(raw){const data=JSON.parse(raw);Object.assign(state,data,{selected:null});$('#prizeCard').classList.toggle('is-open',state.rewardOpen);$('#stuckBtn').hidden=state.rewardOpen;$('#drawAgainBtn').hidden=!state.rewardOpen;render();updateHud();}

function dailySeed(){const d=new Date(),key=Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);return key%99999||1}
function newGame(seed=Math.floor(Math.random()*99999)+1){state.deal=seed;state.moves=0;state.history=[];state.selected=null;state.rewardOpen=false;state.free=[null,null,null,null];state.foundations=[[],[],[],[]];state.columns=Array.from({length:8},()=>[]);shuffle(buildDeck(),seed).forEach((card,i)=>state.columns[i%8].push(card));$('#prizeCard').classList.remove('is-open');$('#stuckBtn').hidden=false;$('#drawAgainBtn').hidden=true;$('#status').textContent='카드를 선택하세요.';render();updateHud();}
function cardHtml(card,top=0,source='column',index=0,cardIndex=0){const topStyle=`top:${typeof top==='number'?`${top}px`:top};`;return `<button class="card${card.red?' red':''}" style="${topStyle}z-index:${cardIndex+1}" data-source="${source}" data-index="${index}" data-card-index="${cardIndex}" aria-label="${card.label} ${card.symbol}"><img src="./assets/cards/${card.label}${card.file}.png" alt="" draggable="false" width="300" height="436" decoding="sync"></button>`}
function render(){
  $('#tableau').innerHTML=state.columns.map((col,ci)=>`<div class="column" data-column="${ci}" style="height:calc(var(--card-h) + ${Math.max(0,col.length-1)} * var(--stack))">${col.map((c,i)=>cardHtml(c,`calc(${i} * var(--stack))`,'column',ci,i)).join('')}</div>`).join('');
  document.querySelectorAll('.free').forEach((el,i)=>{el.querySelector('.card')?.remove();if(state.free[i])el.insertAdjacentHTML('beforeend',cardHtml(state.free[i],0,'free',i,0))});
  document.querySelectorAll('.foundation').forEach((el,i)=>{el.querySelector('.card')?.remove();const pile=state.foundations[i];if(pile.length)el.insertAdjacentHTML('beforeend',cardHtml(pile.at(-1),0,'foundation',i,0));el.classList.toggle('is-complete',pile.length===13)});
  if(state.selected){const {source,index,cardIndex}=state.selected;document.querySelector(`.card[data-source="${source}"][data-index="${index}"][data-card-index="${cardIndex}"]`)?.classList.add('selected')}
}
function updateHud(){$('#dealLabel').textContent=`게임 #${String(state.deal).padStart(5,'0')}`;$('#moveLabel').textContent=`이동 ${state.moves}`;$('#undoBtn').disabled=!state.history.length}
function isSequence(cards){return cards.every((c,i)=>i===0||(cards[i-1].rank===c.rank+1&&cards[i-1].red!==c.red))}
function movableCount(destinationEmpty){const emptyFree=state.free.filter(x=>!x).length;const emptyCols=state.columns.filter(x=>!x.length).length-(destinationEmpty?1:0);return (emptyFree+1)*Math.pow(2,Math.max(0,emptyCols))}
function selectedCards(){if(!state.selected)return[];const s=state.selected;if(s.source==='column')return state.columns[s.index].slice(s.cardIndex);if(s.source==='free')return state.free[s.index]?[state.free[s.index]]:[];return[]}
function canPlace(card,target){return !target||target.rank===card.rank+1&&target.red!==card.red}
function select(source,index,cardIndex=0){if(source==='foundation')return;const cards=source==='column'?state.columns[index].slice(cardIndex):state.free[index]?[state.free[index]]:[];if(!cards.length||!isSequence(cards)){message('이어진 카드 묶음만 옮길 수 있습니다.');return}state.selected={source,index,cardIndex};render()}
function removeSelected(){const s=state.selected;if(s.source==='column')return state.columns[s.index].splice(s.cardIndex);const card=state.free[s.index];state.free[s.index]=null;return[card]}
function commit(move){state.history.push(snapshot());move();state.moves++;state.selected=null;if(!state.rewardOpen)openReward();render();updateHud();checkWin();tone(540);}
function moveToColumn(ci){if(!state.selected)return;const cards=selectedCards(),target=state.columns[ci].at(-1);if(!cards.length)return;if(state.selected.source==='column'&&state.selected.index===ci){state.selected=null;render();return}if(!canPlace(cards[0],target)){message('색을 번갈아 큰 수 아래에 놓으세요.');return}if(cards.length>movableCount(!target)){message('빈 프리셀과 빈 줄이 부족해 이 묶음을 옮길 수 없습니다.');return}commit(()=>state.columns[ci].push(...removeSelected()))}
function moveToFree(fi){if(!state.selected||state.free[fi]||selectedCards().length!==1){message('프리셀에는 카드 한 장만 놓을 수 있습니다.');return}commit(()=>{state.free[fi]=removeSelected()[0]})}
function foundationIndex(card){return card.suit}
function canFoundation(card){const pile=state.foundations[foundationIndex(card)];return card.rank===pile.length+1}
function moveToFoundation(fi){if(!state.selected||selectedCards().length!==1)return;const card=selectedCards()[0];if(fi!==foundationIndex(card)||!canFoundation(card)){message('같은 무늬를 A부터 차례로 쌓으세요.');return}commit(()=>state.foundations[fi].push(removeSelected()[0]));if(state.foundations[fi].length===13)drawCategoryNews(fi)}
function autoFoundation(source,index,cardIndex){select(source,index,cardIndex);const cards=selectedCards();if(cards.length===1&&canFoundation(cards[0]))moveToFoundation(foundationIndex(cards[0]))}
function message(text){$('#status').textContent=text}
function checkWin(){if(state.foundations.flat().length===52){message('축하합니다! 모든 카드를 정리했습니다.');showNewsBanner('아래에 오늘의 뉴스가 모두 열렸습니다');drawNews()}}
function hint(){const candidates=[];state.columns.forEach((col,ci)=>{const card=col.at(-1);if(card&&canFoundation(card))candidates.push({source:'column',index:ci,cardIndex:col.length-1});state.columns.forEach((target,ti)=>{if(ci!==ti&&card&&canPlace(card,target.at(-1)))candidates.push({source:'column',index:ci,cardIndex:col.length-1})})});state.free.forEach((card,i)=>{if(card&&canFoundation(card))candidates.push({source:'free',index:i,cardIndex:0})});const move=candidates[0];if(!move){message('바로 보이는 한 수가 없습니다. 빈 프리셀을 활용해보세요.');return}const el=document.querySelector(`.card[data-source="${move.source}"][data-index="${move.index}"][data-card-index="${move.cardIndex}"]`);el?.classList.add('hint');message('빛나는 카드를 먼저 살펴보세요.')}

async function loadNews(){try{const res=await fetch('../puzzle/data/puzzles.json',{cache:'no-store'});if(!res.ok)throw Error();const data=await res.json();state.news=(data.puzzles||[]).filter(x=>x.title&&x.url).map(x=>({category:x.category||'오늘의 뉴스',title:x.title,summary:x.description||'',url:x.url}));if(!state.news.length)throw Error()}catch{state.news=FALLBACK}state.news.sort(()=>Math.random()-.5);state.categories=['속보','정치','경제','종합'];state.newsByCategory=new Map(state.categories.map(cat=>[cat,cat==='종합'?state.news:state.news.filter(x=>x.category===cat)]));document.querySelectorAll('[data-category]').forEach((el,i)=>el.textContent=state.categories[i]);showNews(state.news[0])}
function showNews(item){$('#newsCategory').textContent=item.category||'TODAY\'S NEWS';$('#newsTitle').textContent=item.title;$('#newsSummary').textContent=(item.summary||'').replace(/^\[[^\]]+\]\s*/,'').slice(0,190);$('#newsLink').href=item.url}
function openReward(){state.rewardOpen=true;showNews(state.news[state.newsIndex%state.news.length]||FALLBACK[0]);$('#prizeCard').classList.add('is-open');$('#stuckBtn').hidden=true;$('#drawAgainBtn').hidden=false;message('당첨! 오늘의 뉴스 한 장이 열렸습니다.');showNewsBanner('아래에 오늘의 뉴스가 열렸습니다')}
function drawCategoryNews(fi){const category=state.categories[fi],pool=state.newsByCategory.get(category)||state.news;const item=pool[Math.floor(Math.random()*pool.length)]||FALLBACK[0];showNews(item);$('#prizeCard').classList.add('is-open');message(`${SUITS[fi].symbol} ${category} 완성! 해당 카테고리 뉴스가 열렸습니다.`);showNewsBanner(`아래에 ${category} 뉴스가 열렸습니다`);tone(820)}
let bannerTimer=null;
function showNewsBanner(text){const banner=$('#newsBanner');$('#newsBannerText').textContent=text;banner.hidden=false;requestAnimationFrame(()=>banner.classList.add('show'));clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>{banner.classList.remove('show');setTimeout(()=>{banner.hidden=true},250)},5000)}
function drawNews(){state.newsIndex=(state.newsIndex+1)%Math.max(1,state.news.length);showNews(state.news[state.newsIndex]||FALLBACK[0]);$('#prizeCard').classList.remove('is-open');requestAnimationFrame(()=>requestAnimationFrame(()=>$('#prizeCard').classList.add('is-open')));tone(720)}
function tone(freq){if(!state.sound)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=freq;gain.gain.setValueAtTime(.06,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.12)}

let justDragged=false;
document.addEventListener('click',e=>{
  if(justDragged){justDragged=false;return}
  const card=e.target.closest('.card');
  if(card){const source=card.dataset.source,index=+card.dataset.index,cardIndex=+card.dataset.cardIndex;if(state.selected){if(source==='column')moveToColumn(index);else if(source==='free')moveToFree(index)}else select(source,index,cardIndex);return}
  const col=e.target.closest('.column');if(col&&state.selected){moveToColumn(+col.dataset.column);return}
  const free=e.target.closest('.free');if(free&&state.selected){moveToFree(+free.dataset.free);return}
  const foundation=e.target.closest('.foundation');if(foundation&&state.selected)moveToFoundation(+foundation.dataset.foundation)
});

let drag=null;
const DRAG_THRESHOLD=6;
function cardEls(source,index,cardIndex){
  if(source==='column'){const col=document.querySelector(`.column[data-column="${index}"]`);return col?[...col.children].slice(cardIndex):[]}
  const el=document.querySelector(`.card[data-source="${source}"][data-index="${index}"][data-card-index="${cardIndex}"]`);
  return el?[el]:[];
}
document.addEventListener('pointerdown',e=>{
  if(e.button>0)return;
  const card=e.target.closest('.card');
  if(!card)return;
  const source=card.dataset.source,index=+card.dataset.index,cardIndex=+card.dataset.cardIndex;
  if(source==='foundation')return;
  const cards=source==='column'?state.columns[index].slice(cardIndex):(state.free[index]?[state.free[index]]:[]);
  if(!cards.length||!isSequence(cards))return;
  const els=cardEls(source,index,cardIndex);
  if(!els.length)return;
  drag={source,index,cardIndex,els,startX:e.clientX,startY:e.clientY,moved:false,pointerId:e.pointerId};
});
function dropZoneFor(source,index,cardIndex,el){
  if(!el)return null;
  const cards=source==='column'?state.columns[index].slice(cardIndex):(state.free[index]?[state.free[index]]:[]);
  if(!cards.length)return null;
  const colEl=el.closest('.column');
  if(colEl){
    const ci=+colEl.dataset.column;
    if(source==='column'&&index===ci)return null;
    const target=state.columns[ci].at(-1);
    return(canPlace(cards[0],target)&&cards.length<=movableCount(!target))?colEl:null;
  }
  const freeEl=el.closest('.free');
  if(freeEl){const fi=+freeEl.dataset.free;return(!state.free[fi]&&cards.length===1)?freeEl:null}
  const foundationEl=el.closest('.foundation');
  if(foundationEl){const fi=+foundationEl.dataset.foundation;return(cards.length===1&&fi===foundationIndex(cards[0])&&canFoundation(cards[0]))?foundationEl:null}
  return null;
}
document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
  if(!drag.moved&&Math.hypot(dx,dy)<DRAG_THRESHOLD)return;
  if(!drag.moved){
    drag.moved=true;
    drag.els.forEach((el,i)=>{el.classList.add('dragging');el.style.zIndex=1000+i;el.style.pointerEvents='none'});
    document.body.classList.add('is-dragging-card');
  }
  e.preventDefault();
  drag.els.forEach(el=>{el.style.transform=`translate(${dx}px,${dy}px)`});
  const under=document.elementFromPoint(e.clientX,e.clientY);
  const zone=dropZoneFor(drag.source,drag.index,drag.cardIndex,under);
  if(zone!==drag.hoverEl){drag.hoverEl?.classList.remove('drop-ready');zone?.classList.add('drop-ready');drag.hoverEl=zone}
},{passive:false});
function endDrag(e){
  if(!drag)return;
  const d=drag;drag=null;
  const target=d.hoverEl;
  target?.classList.remove('drop-ready');
  if(!d.moved)return;
  d.els.forEach(el=>{el.style.transform='';el.style.zIndex='';el.style.pointerEvents='';el.classList.remove('dragging')});
  document.body.classList.remove('is-dragging-card');
  state.selected={source:d.source,index:d.index,cardIndex:d.cardIndex};
  if(target){
    if(target.classList.contains('column'))moveToColumn(+target.dataset.column);
    else if(target.classList.contains('free'))moveToFree(+target.dataset.free);
    else if(target.classList.contains('foundation'))moveToFoundation(+target.dataset.foundation);
  }
  state.selected=null;render();
  justDragged=true;
}
document.addEventListener('pointerup',endDrag);
document.addEventListener('pointercancel',endDrag);
document.addEventListener('dblclick',e=>{const card=e.target.closest('.card');if(card)autoFoundation(card.dataset.source,+card.dataset.index,+card.dataset.cardIndex)});
$('#newBtn').addEventListener('click',()=>newGame());
$('#dailyBtn').addEventListener('click',()=>newGame(dailySeed()));
$('#undoBtn').addEventListener('click',()=>{if(state.history.length)restore(state.history.pop())});
$('#hintBtn').addEventListener('click',hint);
$('#drawAgainBtn').addEventListener('click',drawNews);
$('#stuckBtn').addEventListener('click',()=>{openReward();message('카드는 막혀도 뉴스는 안 막힙니다. 오늘의 뉴스를 열었습니다.')});
$('#newsBanner').addEventListener('click',()=>{$('#prize').scrollIntoView({behavior:'smooth',block:'start'})});
$('#helpBtn').addEventListener('click',()=>$('#helpDialog').showModal());
$('#closeHelp').addEventListener('click',()=>$('#helpDialog').close());
$('#soundBtn').addEventListener('click',e=>{state.sound=!state.sound;e.currentTarget.setAttribute('aria-pressed',String(state.sound));e.currentTarget.setAttribute('aria-label',state.sound?'효과음 끄기':'효과음 켜기');tone(600)});
loadNews();newGame(dailySeed());
