(()=>{
 'use strict';
 const head=document.querySelector('.vn-archive-head'),actor=document.querySelector('#tg-wanderer');if(!head||!actor)return;
 const dialog=document.querySelector('#tg-dialog'),launch=document.querySelector('.tg-launch'),tools=document.querySelector('.tg-motion-tools'),toggle=document.querySelector('#tg-roam-toggle'),note=document.querySelector('#tg-motion-note'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const key='tongi-roam-hidden-v1';let muted=false;try{muted=sessionStorage.getItem(key)==='1';}catch{}
 const curtainAsset=new Image();
 let shown=0,lastShown=-Infinity,scrollAt=performance.now(),timer,hideTimer,seenScroll=false,hasFocus=false,manual=false,modeIndex=0,curtain=null,previewTicket=0;
 const modes=['up','paper','peek'];
 function updateToggle(){toggle.setAttribute('aria-pressed',String(muted));toggle.textContent=muted?'자동 등장 켜기':'자동 등장 끄기';}
 function conceal(){clearTimeout(hideTimer);if(actor.contains(document.activeElement)||curtain?.close===document.activeElement){document.querySelector('.tg-launch-wrap').style.visibility='';launch.focus();}actor.hidden=true;if(curtain){const {frame,img,close,cleanup}=curtain;cleanup?.();img.classList.remove('tg-lift-photo');frame.replaceWith(img);close.remove();curtain=null;}delete document.querySelector('.tg-launch-wrap').dataset.roaming;hasFocus=false;}
 function setMuted(value){muted=value;try{sessionStorage.setItem(key,value?'1':'0');}catch{}updateToggle();if(value){previewTicket++;clearTimeout(timer);conceal();}}
 updateToggle();toggle.addEventListener('click',()=>{setMuted(!muted);note.textContent=muted?'이 탭에서는 다시 나타나지 않아요.':'스크롤을 멈추면 빈 공간에서 가끔 나타나요.';if(!muted)schedule();});
 document.querySelector('#tg-wander-dismiss').addEventListener('click',()=>setMuted(true));
 function blocked(){return document.hidden||dialog.open||!!document.querySelector('[aria-label="전체 메뉴 닫기"]')||document.body.style.overflow==='hidden';}
 function overlap(a,b,pad=5){return a.x<b.right+pad&&a.x+a.w>b.left-pad&&a.y<b.bottom+pad&&a.y+a.h>b.top-pad;}
 function protectedRects(){const nodes=[...document.querySelectorAll('.vn-lead img,.vn-lead h1,.vn-lead p,.vn-action,.vn-story,.vn-archive-head h2,.vn-archive-head p,.vn-filters,.vn-game,.vn-word,.landing-discover,header,.tg-launch-wrap,.tg-motion-tools')];return nodes.filter(e=>!e.closest('[hidden]')&&e.getClientRects().length).map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.bottom>0&&r.top<innerHeight);}
 function placement(mode){
  const small=innerWidth<=760,w=small?108:236,h=small?78:100,r=head.getBoundingClientRect(),rects=protectedRects(),list=[];
  const cards=[...document.querySelectorAll('.vn-story:not([hidden])')].filter(e=>e.getClientRects().length);
  if(mode==='peek')for(const card of cards){const c=card.getBoundingClientRect();list.push({x:c.right+6,y:c.top+20,w,h});}
  if(mode==='paper')for(const card of cards){const c=card.getBoundingClientRect();list.push({x:c.right-w,y:c.bottom+8,w,h});}
  // The divider's quiet middle is a fallback; never force a sprite over a card.
  for(const y of [r.top-(small?60:75),r.top+5,r.bottom+8])for(const x of [r.right-w-24,r.left+(r.width-w)/2,r.left+8])list.push({x,y,w,h});
  return list.find(p=>p.x>=12&&p.x+p.w<=innerWidth-18&&p.y>=84&&p.y+p.h<=innerHeight-20&&!rects.some(rect=>overlap(p,rect)));
 }
 function show(mode,fromDemo=false){
  if(mode==='paper')return showCurtain(fromDemo);
  if(blocked())return false;const p=placement(mode);if(!p)return false;
  conceal();clearTimeout(timer);manual=fromDemo;actor.dataset.motion=mode;actor.style.left=p.x+'px';actor.style.top=p.y+'px';actor.hidden=false;document.querySelector('.tg-launch-wrap').dataset.roaming='true';
  actor.querySelector('#tg-wander-open').textContent=mode==='paper'?'내 생활에 도움될 이야기?':mode==='peek'?'이야기 같이 골라볼까요?':'뭐 볼지 고민 중이에요?';
  const old=actor.querySelector('.tg-wander-mask img');old.replaceWith(old.cloneNode(true));
  actor.querySelectorAll('.tg-grip-hand').forEach(hand=>hand.replaceWith(hand.cloneNode(true)));
  if(!fromDemo){shown++;actor.dataset.autoShows=String(shown);lastShown=performance.now();}hideTimer=setTimeout(()=>{if(!hasFocus&&!actor.matches(':hover'))conceal();},fromDemo?20000:5200);return true;
 }
 function curtainCard(inView=false){const visible=e=>{if(!e||!e.getClientRects().length||e.hidden)return false;const r=e.querySelector('img')?.getBoundingClientRect();return !inView||(r&&r.top>=84&&r.bottom<=innerHeight-40);};return ['buy-live','quit','battery','son7','nuri5'].map(id=>document.querySelector('.vn-story[href="https://visual.newsis.com/'+id+'/"]')).find(visible);}
 function showCurtain(fromDemo){
  if(blocked())return false;if(!curtainAsset.src)curtainAsset.src='./tongi-curtain-lift-v1.png';
  if(!curtainAsset.complete||!curtainAsset.naturalWidth){if(!fromDemo){const at=scrollAt,ticket=previewTicket;curtainAsset.decode().then(()=>{if(at!==scrollAt||ticket!==previewTicket||muted||motion.matches||shown>=2||blocked()||performance.now()-lastShown<90000)return;showCurtain(false);}).catch(()=>{});}return false;}
  conceal();const card=curtainCard(!fromDemo),img=card?.querySelector('img');if(!img||!img.complete||!img.naturalWidth)return false;
  const r=img.getBoundingClientRect();if(r.top<84||r.bottom>innerHeight-40||r.width<120)return false;
  clearTimeout(timer);manual=fromDemo;const frame=document.createElement('div');frame.className='tg-curtain-frame';frame.style.height=r.height+'px';frame.style.setProperty('--tg-curtain-lift',Math.min(96,r.height*.82)+'px');frame.style.setProperty('--tg-curtain-robot-size',Math.min(118,r.height*.95)+'px');
  const robot=document.createElement('img');robot.src='./tongi-curtain-lift-v1.png';robot.alt='';robot.className='tg-curtain-robot';robot.setAttribute('aria-hidden','true');robot.draggable=false;
  const hands=robot.cloneNode();hands.className='tg-curtain-robot tg-curtain-hands';const caption=document.createElement('span');caption.className='tg-curtain-caption';caption.textContent='이 이야기도 한번 볼까요?';caption.setAttribute('aria-hidden','true');
  img.before(frame);frame.append(robot,caption,img,hands);img.classList.add('tg-lift-photo');
  const close=document.createElement('button');close.type='button';close.className='tg-curtain-dismiss';close.textContent='×';close.setAttribute('aria-label','기사 커튼 닫기');close.addEventListener('click',()=>setMuted(true));document.body.append(close);
  function placeClose(){const box=frame.getBoundingClientRect();close.style.left=(box.right-40)+'px';close.style.top=(box.bottom-40)+'px';}placeClose();
  function queueHide(ms=1500){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(curtain?.frame!==frame)return;if(!card.contains(document.activeElement)&&document.activeElement!==close&&!frame.matches(':hover')&&!close.matches(':hover'))conceal();},ms);}
  const hold=()=>clearTimeout(hideTimer),resume=()=>queueHide();frame.addEventListener('mouseenter',hold);frame.addEventListener('mouseleave',resume);close.addEventListener('mouseenter',hold);close.addEventListener('mouseleave',resume);close.addEventListener('focus',hold);close.addEventListener('blur',resume);card.addEventListener('focusin',hold);card.addEventListener('focusout',resume);
  const observer=new ResizeObserver(placeClose);observer.observe(document.querySelector('main'));curtain={frame,img,close,cleanup(){observer.disconnect();card.removeEventListener('focusin',hold);card.removeEventListener('focusout',resume);}};document.fonts?.ready.then(()=>{if(curtain?.frame===frame)placeClose();});
  document.querySelector('.tg-launch-wrap').dataset.roaming='true';actor.dataset.motion='paper';if(!fromDemo){shown++;actor.dataset.autoShows=String(shown);lastShown=performance.now();}
  queueHide(fromDemo?20000:5200);return true;
 }
 function schedule(){clearTimeout(timer);if(muted||motion.matches||shown>=2||blocked()||!seenScroll)return;timer=setTimeout(()=>{if(muted||motion.matches||shown>=2||blocked())return;if(performance.now()-scrollAt<1450)return schedule();if(performance.now()-lastShown<90000)return;show(modes[modeIndex++%3]);},1550);}
 window.addEventListener('scroll',()=>{seenScroll=true;scrollAt=performance.now();conceal();schedule();},{passive:true});
 window.addEventListener('resize',()=>{previewTicket++;conceal();schedule();},{passive:true});
 document.addEventListener('visibilitychange',()=>{previewTicket++;conceal();if(!document.hidden)schedule();});
 motion.addEventListener('change',()=>{conceal();schedule();});
 launch.addEventListener('click',()=>{previewTicket++;conceal();setMuted(true);});
 actor.addEventListener('focusin',()=>{hasFocus=true;clearTimeout(hideTimer);});actor.addEventListener('focusout',()=>{setTimeout(()=>{hasFocus=actor.contains(document.activeElement);if(!hasFocus)hideTimer=setTimeout(conceal,1500);},0);});
 actor.addEventListener('mouseenter',()=>clearTimeout(hideTimer));actor.addEventListener('mouseleave',()=>{if(!hasFocus)hideTimer=setTimeout(conceal,1500);});
 function open(){const selected=actor.dataset.motion;launch.click();if(selected==='paper'){document.querySelector('#tongi-query').value='내 생활에 도움되는 것';document.querySelector('.tongi-form').requestSubmit();}}actor.querySelector('#tg-wander-open').addEventListener('click',open);actor.querySelector('.tg-wander-character').addEventListener('click',open);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!actor.hidden||curtain)){if(actor.contains(document.activeElement)||curtain?.close===document.activeElement)setMuted(true);else conceal();}});
 // A header menu may open without scrolling. Hide before it can compete for input.
 document.addEventListener('click',e=>{if(e.target.closest('header')||e.target.closest('.vn-filters')){previewTicket++;conceal();}});
 tools.querySelectorAll('[data-tg-motion]').forEach(button=>button.addEventListener('click',async()=>{
  if(dialog.open)dialog.close();conceal();tools.querySelector('details').open=false;const mode=button.dataset.tgMotion;
  const cards=[...document.querySelectorAll('.vn-story:not([hidden])')].filter(e=>e.getClientRects().length);
  const anchor=mode==='paper'?(curtainCard()||head):mode==='peek'&&innerWidth>1000?cards.at(-1):head;anchor.scrollIntoView({block:'center',behavior:'instant'});
  const ticket=++previewTicket;
  if(mode==='paper'){if(!curtainAsset.src)curtainAsset.src='./tongi-curtain-lift-v1.png';await new Promise(resolve=>requestAnimationFrame(resolve));const position=scrollY;await Promise.all([anchor.querySelector('img')?.decode().catch(()=>{}),curtainAsset.decode().catch(()=>{})]);if(ticket!==previewTicket||position!==scrollY||blocked())return;}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ticket!==previewTicket||blocked())return;if(show(mode,true)){note.textContent=mode==='paper'?'실제 기사 사진을 들어 올린 시안이에요. 제목을 누르면 기사를 읽어요.':'동작 시안이에요. 클릭하면 콘텐츠를 함께 골라요.';}else{if(mode==='paper'){note.textContent='지금은 기사 사진이 준비되지 않았거나 화면 밖에 있어요.';tools.querySelector('details').open=true;return;}head.scrollIntoView({block:'center',behavior:'instant'});requestAnimationFrame(()=>{const ok=show(mode,true);note.textContent=ok?'카드 옆 여백이 좁아 구분선의 빈 곳에서 보여드려요.':'지금 화면에는 충분한 빈 공간이 없어 등장을 생략했어요.';if(!ok)tools.querySelector('details').open=true;});}}));
 }));
 // Expose observed state only, useful for sample verification without driving motion.
 actor.dataset.scope='landing-only';
})();
