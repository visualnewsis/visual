/* Sample-only adapter: original piano scripts and production HTML stay unchanged. */
'use strict';
const $ = id => document.getElementById(id);
const frame = $('piano'), actor = $('actor'), home = $('home');
const cues = [
 ['keys','건반 · 인사','#keyboard','normal','pop','나도 같이 연주할래요! 건반을 눌러볼까요?'],
 ['rhythm','건반 · 리듬','#keyboard','happy','dance','여러 건반을 이어서 눌러봐요. 나는 옆에서 춤출게요!'],
 ['high','건반 · 위로','#keyboard','up','bounce','높은 음은 오른쪽에 있어요. 이번엔 이쪽도!'],
 ['peek','건반 · 빼꼼','#keyboard','normal','peek','빼꼼! 어떤 음을 고를지 궁금해요.'],
 ['pedal','페달','#sustain','down','nod','페달을 켜면 건반에서 손을 떼어도 울림이 이어져요.'],
 ['volume','소리 크기','#volume','search','scan','소리가 너무 크면 여기서 줄일 수 있어요.'],
 ['inside','원리로 이동','#explore-link','point','wave','한 음을 눌렀다면, 안에서 무슨 일이 생기는지 볼까요?'],
 ['replay','관찰 재생','#replay','search','scan','방금 누른 건반의 움직임을 다시 살펴봐요.'],
 ['explode','분해 보기','#explode','normal','peek','부품을 펼쳐 놓으면 서로의 자리가 더 잘 보여요.'],
 ['view','옆에서 보기','#view','point','wave','옆에서 보면 해머가 움직이는 길을 따라가기 좋아요.'],
 ['labels','부품 이름','#labels','search','nod','낯선 부품 이름이 궁금하면 이 표시를 켜봐요.'],
 ['parts','부품 사전','#parts-open','up','rise','이름만으로 부족하면 부품 사전도 열어봐요.'],
 ['lab','직접 만지기','#experiment-toggle','happy','bounce','이번에는 직접 조건을 바꿔볼까요?'],
 ['soft','약하게 · 세게','#soft-strike','thumbs','dance','약하게 누를 때와 세게 누를 때를 비교해봐요.'],
 ['contact','해머 비교','#free-hammer','search','scan','해머가 현에서 떨어지는 까닭을 살펴봐요.'],
 ['string','현 실험','#string-length','point','wave','현의 길이를 바꾸면 음은 어떻게 달라질까요?'],
 ['repeat','반복 타건','#repeat-strike','happy','bounce','건반을 얼마나 되돌려야 다시 누를 수 있을까요?'],
 ['hammer','해머 관찰','#research-hammer [data-do="play"]','search','scan','천천히 움직이며 해머의 경로를 관찰해봐요.'],
 ['damper','댐퍼 관찰','#research-damper [data-param="pedal"]','down','nod','페달을 밟을 때 댐퍼도 함께 살펴봐요.']
].map(([id,label,selector,pose,motion,text])=>({id,label,selector,pose,motion,text}));
let doc, win, enabled = true, count = 0, current = null, cycle = 0;
let returnTimer, noteTimer, scrollTimer, interval, loaded = false, quietUntil = 0;
let highlighted = null, suppressScroll = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
for (const c of cues) { const o = new Option(c.label,c.id); $('scene').add(o); }
function clearHighlight(){ highlighted?.classList.remove('tongi-piano-target'); highlighted=null; }
function dock(){
 const r=home.getBoundingClientRect(), size=actor.offsetWidth;
 actor.style.left=`${r.left+(r.width-size)/2}px`;
 actor.style.top=`${r.top+Math.max(0,(r.height-size)/2)}px`;
 actor.dataset.placement='home'; actor.dataset.flip='false'; $('away').hidden=true;
}
function blocked(){
 return !loaded || document.hidden || !doc || !!doc.querySelector('dialog[open]') || !!doc.fullscreenElement;
}
function visible(el){
 if(!el || el.hidden || !el.getClientRects().length) return false;
 const r=el.getBoundingClientRect();
 return r.width>0 && r.height>0 && r.top>=15 && r.bottom<=win.innerHeight-12;
}
function place(el){
 dock();
 if(reduced.matches || !visible(el)) return;
 const box=frame.getBoundingClientRect(), t=el.getBoundingClientRect(), size=actor.offsetWidth, gap=18;
 const candidates=[
  [t.right+gap,t.top-size/2], [t.left-size-gap,t.top-size/2],
  [t.left+(t.width-size)/2,t.top-size-gap], [t.left+(t.width-size)/2,t.bottom+gap]
 ];
 // Only use empty space. Never sit over copy, controls, pictures or a canvas.
 const obstacles=[...doc.querySelectorAll('button,input,select,canvas,img,svg,summary')]
  .filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect())
  .filter(r=>r.bottom>0 && r.top<win.innerHeight && r.width && r.height);
 const walker=doc.createTreeWalker(doc.body,win.NodeFilter.SHOW_TEXT);
 while(walker.nextNode()) {
  const n=walker.currentNode;if(!n.textContent.trim() || /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName))continue;
  const range=doc.createRange();range.selectNodeContents(n);
  for(const r of range.getClientRects())if(r.width && r.height && r.bottom>0 && r.top<win.innerHeight)obstacles.push(r);
 }
 const spot=candidates.find(([x,y])=>x>=12 && y>=70 && x+size<=box.width-12 && y+size<=box.height-12 &&
  !obstacles.some(r=>x<r.right+7 && x+size>r.left-7 && y<r.bottom+7 && y+size>r.top-7));
 if(!spot) return;
 actor.style.left=`${box.left+spot[0]}px`; actor.style.top=`${box.top+spot[1]}px`;
 actor.dataset.placement='article'; actor.dataset.flip=String(spot[0]>t.right);
 $('away').hidden=false;
}
function show(c,{manual=false,text=null}={}){
 if(blocked()) { dock(); clearHighlight(); return; }
 let target=doc.querySelector(c.selector), message=text||c.text;
 if(!text && target){
  const on=target.getAttribute('aria-pressed')==='true';
  const status={pedal:on?'페달이 켜져 있어요. 손을 떼어도 울림이 이어져요.':'페달을 켜면 울림이 어떻게 달라지는지 비교해봐요.',explode:on?'지금은 분해한 모습이에요. 조립하기를 누르면 다시 모여요.':c.text,labels:on?'부품 이름이 켜져 있어요. 이름과 실제 위치를 함께 살펴봐요.':c.text,view:on?'측면에서 보고 있어요. 같은 버튼으로 시점을 되돌릴 수 있어요.':c.text,lab:on?'직접 만지기가 열렸어요. 아래 실험 조작으로 조건을 바꿔봐요.':c.text};
  message=status[c.id]||message;
 }
 if(target?.disabled){
  target=doc.querySelector('.back-play');
  message='위에서 건반을 한 번 누르면, 방금 움직임을 다시 볼 수 있어요.';
 }
 if(!target) return;
 if(!manual && !visible(target)) message='나 여기 있어요! 천천히 내려가며 같이 살펴봐요.';
 clearTimeout(returnTimer); clearHighlight();
 if(manual && !visible(target)) {
  suppressScroll=true; target.scrollIntoView({block:'center',behavior:'instant'});
  setTimeout(()=>{suppressScroll=false;},150);
 }
 current=c; count++; $('counter').textContent=`등장 ${count}회`;
 $('scene').value=c.id; $('cue-name').textContent=c.label; $('talk').textContent=message;
 actor.dataset.pose=c.pose; actor.dataset.motion=c.motion; actor.dataset.scene=c.id;
 actor.classList.remove('show'); void actor.offsetWidth; actor.classList.add('show');
 if(visible(target)) {highlighted=target;target.classList.add('tongi-piano-target');place(target);} else dock();
 if(manual) $('live').textContent=message;
 returnTimer=setTimeout(()=>{dock();clearHighlight();},2600);
}
function next(manual=false){
 if(blocked() || (!manual && (Date.now()<quietUntil || !enabled))) return;
 let pool=manual?cues:cues.filter(c=>visible(doc.querySelector(c.selector)));
 if(!pool.length) {
  const hero=doc.querySelector('#play').getBoundingClientRect();
  if(hero.bottom>win.innerHeight/2 && hero.top<win.innerHeight/2) pool=cues.slice(0,4);
  else {dock();return;}
 }
 const c=pool[cycle++%pool.length]; show(c,{manual});
}
function react(id,text){
 if(!enabled || blocked()) return;
 quietUntil=Date.now()+2800;
 show(cues.find(c=>c.id===id)||cues[0],{text});
}
function bind(){
 try { doc=frame.contentDocument;win=frame.contentWindow; if(!doc?.querySelector('#keyboard'))throw Error('outside'); }
 catch {loaded=false;clearInterval(interval);dock();$('talk').textContent='피아노 샘플로 돌아오려면 위의 처음부터를 눌러주세요.';return;}
 loaded=true;clearInterval(interval);clearTimeout(returnTimer);clearTimeout(noteTimer);clearTimeout(scrollTimer);
 const css=doc.createElement('link');css.rel='stylesheet';css.href='frame.css?v=4';doc.head.append(css);
 doc.addEventListener('click',e=>{
  const b=e.target.closest('button,a,input,select');if(!b)return;
  const map={sustain:'pedal','explore-link':'inside',replay:'replay',explode:'explode',view:'view',labels:'labels','experiment-toggle':'lab','soft-strike':'soft','hard-strike':'soft','free-hammer':'contact','held-hammer':'contact','string-play':'string','repeat-strike':'repeat','parts-open':'parts'};
  setTimeout(()=>{
   if(blocked()){clearHighlight();dock();return;}
   if(map[b.id])react(map[b.id]);
  },40);
 });
 doc.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='volume')react('volume',`소리 크기를 ${e.target.value}%로 바꿨어요.`);
  else if(id.startsWith('string-'))react('string');
 });
 win.addEventListener('piano:change',()=>{
  clearTimeout(noteTimer);
  noteTimer=setTimeout(()=>{
   const state=win.PianoExperience?.snapshot();if(!state?.last)return;
   const midi=state.last.midi;
   react(midi>=72?'high':'rhythm',midi>=72?'오른쪽의 높은 음을 눌렀네요!':'건반을 눌렀네요! 이번엔 이어서 연주해봐요.');
  },220);
 });
 win.addEventListener('scroll',()=>{
  if(suppressScroll)return;
  dock();clearHighlight();quietUntil=Date.now()+800;
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>next(false),850);
 },{passive:true});
 doc.addEventListener('fullscreenchange',()=>{dock();clearHighlight();});
 doc.addEventListener('pointerdown',e=>{
  if(e.target.tagName==='CANVAS'){quietUntil=Date.now()+2500;dock();clearHighlight();}
 },{passive:true});
 cycle=0;show(cues[0]); interval=setInterval(()=>next(false),3600);
}
$('auto').addEventListener('click',()=>{
 enabled=!enabled;$('auto').setAttribute('aria-pressed',String(enabled));$('auto').textContent=enabled?'많이 등장 ON':'자동 등장 OFF';
 clearTimeout(returnTimer);dock();clearHighlight();
 if(!enabled){$('cue-name').textContent='잠깐 쉬는 중';$('talk').textContent='자동 등장은 쉬어요. 다음 동작과 장면 선택은 계속 볼 수 있어요.';}
});
$('next-cue').addEventListener('click',()=>next(true));
$('scene').addEventListener('change',()=>show(cues.find(c=>c.id===$('scene').value),{manual:true}));
$('reset').addEventListener('click',()=>{count=0;frame.src='piano.html';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(noteTimer);clearHighlight();dock();}});
window.addEventListener('resize',()=>{dock();clearHighlight();});
frame.addEventListener('load',bind); dock();
if(frame.contentDocument?.readyState==='complete' && frame.contentDocument.URL.endsWith('/piano.html')) bind();
