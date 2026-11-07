'use strict';
const $=id=>document.getElementById(id);
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
const frame=$('piano'), guide=$('guide'), launcher=$('launcher'), actor=$('actor');
const hiddenKey='tongi-piano-sample-hidden-v2', introKey='tongi-piano-sample-intro-v2';
let doc,win,ready=false,active=null,cycle=0,completionTimer=null,introTimer=null,scrollTimer=null;
let highlighted=null,openedScroll=0,openedSection=null,suppressed=false,pendingCall=false;
const memory={};
function read(key){try{return localStorage.getItem(key)||memory[key];}catch{return memory[key];}}
function save(key,value){memory[key]=value;try{localStorage.setItem(key,value);}catch{}}
function rect(el){return el?.getBoundingClientRect();}
function visible(el){const r=rect(el);return !!r&&el.getClientRects().length>0&&r.width>0&&r.height>0&&r.bottom>75&&r.top<win.innerHeight-15;}
function clearHighlight(){highlighted?.classList.remove('tongi-piano-target');highlighted=null;}
function closeGuide({focus=false}={}){
 const hadFocus=guide.contains(document.activeElement);
 clearTimeout(completionTimer);clearHighlight();guide.hidden=true;active=null;
 document.body.classList.remove('help-sheet-open');
 launcher.hidden=read(hiddenKey)==='yes';launcher.setAttribute('aria-expanded','false');
 $('restore').hidden=!launcher.hidden;
 if(doc)doc.documentElement.dataset.tongiHidden=String(launcher.hidden);
 launcher.classList.remove('returned');void launcher.offsetWidth;launcher.classList.add('returned');
 if((focus||hadFocus)&&!launcher.hidden&&!document.hidden)launcher.focus();
}
function intro(){
 if(!ready||suppressed||read(hiddenKey)==='yes'||read(introKey)==='yes'||!guide.hidden)return;
 if(!visible(doc.querySelector('#keyboard')))return;
 save(introKey,'yes');$('idle-hint').hidden=false;
 clearTimeout(introTimer);introTimer=setTimeout(()=>$('idle-hint').hidden=true,6500);
}
function pool(){
 return cues.filter(c=>{if(['rhythm','high','peek'].includes(c.id))return false;const el=doc.querySelector(c.selector);return visible(el)&&!el.disabled;});
}
function currentCue(){
 if(!ready)return null;
 const choices=pool();
 if(visible(doc.querySelector('#keyboard'))){
  if(!win.PianoExperience?.snapshot()?.last)return cues[0];
  if(visible(doc.querySelector('#explore-link')))return cues.find(c=>c.id==='inside');
  return visible(doc.querySelector('#sustain'))?cues.find(c=>c.id==='pedal'):cues[0];
 }
 // Prefer the control closest to the centre of the current visible section.
 return choices.sort((a,b)=>Math.abs(rect(doc.querySelector(a.selector)).top-win.innerHeight*.5)-Math.abs(rect(doc.querySelector(b.selector)).top-win.innerHeight*.5))[0]||null;
}
function message(c,target){
 const on=target?.getAttribute('aria-pressed')==='true';
 const status={
  keys:matchMedia('(pointer:fine)').matches?'건반을 눌러보세요. 키보드 A로도 칠 수 있어요.':'건반을 손가락으로 눌러보세요. 여러 음을 함께 칠 수도 있어요.',
  pedal:on?'페달이 켜져 있어요. 다시 누르면 울림을 멈추는 차이를 비교할 수 있어요.':'페달을 켜고 건반을 눌러봐요. 손을 떼어도 울림이 이어져요.',
  explode:on?'지금은 분해한 모습이에요. 조립하기를 누르면 다시 모여요.':c.text,
  labels:on?'부품 이름이 켜져 있어요. 이름과 실제 위치를 함께 살펴봐요.':c.text,
  view:on?'지금은 측면이에요. 같은 버튼으로 사선 보기로 돌아갈 수 있어요.':c.text,
  lab:on?'직접 만지기가 열려 있어요. 아래의 댐퍼와 현 조작으로 비교해봐요.':c.text
 };
 return status[c.id]||c.text;
}
function obstacles(){
 const out=[...doc.querySelectorAll('button,input,select,canvas,img,svg,summary')].filter(visible).map(rect);
 const walker=doc.createTreeWalker(doc.body,win.NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const n=walker.currentNode;if(!n.textContent.trim()||/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName))continue;
  if(!visible(n.parentElement))continue;
  const range=doc.createRange();range.selectNodeContents(n);
  for(const r of range.getClientRects())if(r.width&&r.height&&r.bottom>70&&r.top<win.innerHeight)out.push(r);
 }
 return out;
}
function position(target){
 const f=rect(frame),w=guide.offsetWidth,h=guide.offsetHeight,t=rect(target);
 function sheet(){
  guide.dataset.placement='sheet';
  document.body.style.setProperty('--help-height',`${h+12}px`);
  document.body.classList.add('help-sheet-open');
  guide.style.left=`${Math.max(10,innerWidth-w-12)}px`;
  guide.style.top=`${innerHeight-h-6}px`;
  if(active?.done||!target)return;
  const now=rect(target),full=now.top>=70&&now.bottom<=win.innerHeight-8;
  clearHighlight();active.target=full?target:null;
  if(full){highlighted=target;target.classList.add('tongi-piano-target');$('talk').textContent=message(active.cue,target);}
  else $('talk').textContent=now.top<70?'조작부가 화면 위에 있어요. 피아노 화면을 조금 올려서 찾아보세요.':'조작부가 화면 아래에 있어요. 피아노 화면을 조금 내려서 찾아보세요.';
 }
 // Hold the fallback layout until closed; scrolling must not resize the piano.
 if(document.body.classList.contains('help-sheet-open')){sheet();return;}
 const x0=Math.max(10,f.width-w-18);
 let points=[];
 if(t&&visible(target))points=[[t.right+16,t.top-h*.5],[t.left-w-16,t.top-h*.5],[t.left,t.top-h-16],[t.left,t.bottom+16]];
 const busy=obstacles();
 const spot=points.find(([x,y])=>x>=10&&y>=75&&x+w<=f.width-10&&y+h<=f.height-10&&!busy.some(r=>x<r.right+10&&x+w>r.left-10&&y<r.bottom+10&&y+h>r.top-10));
 let x,y;
 if(spot){[x,y]=spot;guide.dataset.placement='context';}
 else{
  // No empty space: reserve a temporary strip rather than cover the piano.
  sheet();return;
 }
 guide.style.left=`${Math.max(10,Math.min(innerWidth-w-10,f.left+x))}px`;
 guide.style.top=`${Math.max(f.top+8,Math.min(innerHeight-h-10,f.top+y))}px`;
}
function show(c,{preview=false,focus=true}={}){
 if(!ready){pendingCall=true;$('live').textContent='피아노를 준비하고 있어요. 준비되면 안내할게요.';return;}
 clearTimeout(completionTimer);clearHighlight();$('idle-hint').hidden=true;
 $('live').textContent='';
 if(doc.querySelector('dialog[open]')||doc.fullscreenElement){
  $('live').textContent='부품 사전이나 전체 화면을 닫은 뒤 통이를 불러주세요.';return;
 }
 let target=c?doc.querySelector(c.selector):null;
 if(preview&&target){target.scrollIntoView({block:'center',behavior:'instant'});}
 let text=c?message(c,target):'이 구간은 자유롭게 읽어보세요. 조작 화면에서 부르면 가까운 버튼을 알려드릴게요.';
 if(target?.disabled){text='먼저 위에서 건반을 한 번 눌러주세요. 그러면 방금 움직임을 다시 볼 수 있어요.';target=null;}
 if(target&&!visible(target)){text='이 조작은 지금 화면 밖에 있어요. 해당 구간으로 이동한 뒤 다시 불러주세요.';target=null;}
 active={cue:c,target,anchor:target,lastNoteStart:win.PianoExperience?.snapshot()?.last?.start,done:false};openedScroll=win.scrollY;openedSection=target?.closest('section')||null;
 guide.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');
 $('restore').hidden=true;doc.documentElement.dataset.tongiHidden='false';
 $('talk').textContent=text;$('guide-title').textContent=c?c.label:'통이가 도와줄게요';
 actor.dataset.pose=c?.pose||'normal';actor.dataset.motion=c?.motion||'pop';
 actor.classList.remove('show');guide.classList.remove('appear');void actor.offsetWidth;actor.classList.add('show');guide.classList.add('appear');
 if(target){highlighted=target;target.classList.add('tongi-piano-target');}
 position(target);if(focus)$('guide-title').focus({preventScroll:true});
}
function finish(){
 if(!active||active.done)return;active.done=true;clearHighlight();
 $('talk').textContent='좋아요! 직접 해보셨네요. 필요하면 다시 불러주세요.';
 actor.dataset.pose='happy';actor.dataset.motion='bounce';actor.classList.remove('show');void actor.offsetWidth;actor.classList.add('show');
 // Keep the original control's focus. Never force it back after a piano action.
 completionTimer=setTimeout(()=>closeGuide(),1800);
}
function bind(){
 closeGuide();ready=false;
 try{doc=frame.contentDocument;win=frame.contentWindow;if(!doc.querySelector('#keyboard'))return;}catch{return;}
 ready=true;
 doc.documentElement.dataset.tongiHidden=String(read(hiddenKey)==='yes');
 const css=doc.createElement('link');css.rel='stylesheet';css.href='frame.css?v=9';
 css.addEventListener('load',()=>{if(active)position(active.anchor);intro();});doc.head.append(css);
 // Restore help remains discoverable even after the floating button was hidden.
 const restore=doc.createElement('button');restore.type='button';restore.textContent='통이 도움';restore.className='tongi-inline-help';
 restore.addEventListener('click',()=>{save(hiddenKey,'no');suppressed=false;show(currentCue());});
 doc.querySelector('.audio-status')?.after(restore);
 const foot=restore.cloneNode(true);foot.addEventListener('click',()=>{save(hiddenKey,'no');suppressed=false;show(currentCue());});doc.querySelector('footer')?.prepend(foot);
 doc.addEventListener('click',e=>{
  if(doc.querySelector('dialog[open]')){closeGuide();return;}
  if(active?.anchor&&(active.anchor===e.target||active.anchor.contains(e.target)))finish();
 });
 doc.addEventListener('input',e=>{if(active?.anchor===e.target)finish();});
 win.addEventListener('piano:change',()=>{
  const last=win.PianoExperience?.snapshot()?.last;
  if(active?.anchor?.id==='keyboard'&&last&&last.start!==active.lastNoteStart)finish();
 });
 win.addEventListener('scroll',()=>{
  clearTimeout(scrollTimer);
  scrollTimer=setTimeout(()=>{
   if(active){
    if(Math.abs(win.scrollY-openedScroll)>Math.min(320,win.innerHeight*.65))closeGuide();
    else position(active.anchor);
   }
   intro();
  },100);
 },{passive:true});
 win.addEventListener('resize',()=>{if(active)position(active.anchor);});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!guide.hidden)closeGuide({focus:true});});
 doc.addEventListener('fullscreenchange',()=>{if(doc.fullscreenElement)closeGuide();});
 if(pendingCall){pendingCall=false;show(currentCue());}else{intro();setTimeout(intro,1000);}
}
for(const c of cues)$('scene').add(new Option(c.label,c.id));
launcher.addEventListener('click',()=>show(currentCue()));
$('close').addEventListener('click',()=>{suppressed=true;closeGuide({focus:true});});
$('next').addEventListener('click',()=>{const choices=pool();show(choices.length?choices[++cycle%choices.length]:null);});
$('hide').addEventListener('click',()=>{save(hiddenKey,'yes');suppressed=true;$('idle-hint').hidden=true;closeGuide();$('restore').focus();$('live').textContent='통이 버튼을 숨겼어요. 통이 도움을 누르면 다시 부를 수 있어요.';});
$('restore').addEventListener('click',()=>{save(hiddenKey,'no');suppressed=false;show(currentCue());});
$('preview').addEventListener('click',()=>show(cues.find(c=>c.id===$('scene').value),{preview:true}));
$('dismiss-intro').addEventListener('click',()=>{$('idle-hint').hidden=true;suppressed=true;launcher.focus();});
$('reset').addEventListener('click',()=>{save(hiddenKey,'no');save(introKey,'no');suppressed=false;closeGuide();frame.src='piano.html';});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!guide.hidden)closeGuide({focus:true});});
window.addEventListener('resize',()=>{if(active)position(active.anchor);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)closeGuide();});
frame.addEventListener('load',bind);launcher.hidden=read(hiddenKey)==='yes';$('restore').hidden=!launcher.hidden;
if(frame.contentDocument?.readyState==='complete'&&frame.contentDocument.URL.endsWith('/piano.html'))bind();
