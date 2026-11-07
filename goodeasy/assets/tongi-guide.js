import {createGuideState,findGuidePosition,intersects} from './tongi-guide-core.js?v=20261107-tongi1';

const input=document.querySelector('#landing-typing'),canvas=document.querySelector('#landing-keyboard-canvas'),next=document.querySelector('.hero-next'),call=document.querySelector('#tongi-help');
if(input&&canvas&&next&&call)mount();
function mount(){
  const storageKey='goodeasy-tongi-guide-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let saved={};try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}')||{};}catch{}
  const state=createGuideState(saved),status=document.querySelector('#landing-keyboard-status');
  const guide=document.createElement('aside');guide.className='tongi-guide';guide.hidden=true;guide.setAttribute('aria-label','통이 조작 안내');guide.id='tongi-guide';
  guide.innerHTML='<span class="tongi-guide-sprite" aria-hidden="true"></span><div class="tongi-guide-bubble"><p class="tongi-guide-message"></p><button type="button" class="tongi-guide-action"><span class="tongi-guide-action-label"></span><small class="tongi-guide-audio"></small></button><button type="button" class="tongi-guide-close" aria-label="통이 안내 닫기">×</button></div>';
  const live=document.createElement('span');live.className='tongi-guide-sr';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
  call.after(guide);document.body.append(live);call.setAttribute('aria-controls','tongi-guide');call.setAttribute('aria-expanded','false');
  const sprite=guide.querySelector('.tongi-guide-sprite'),message=guide.querySelector('.tongi-guide-message'),action=guide.querySelector('.tongi-guide-action'),actionLabel=guide.querySelector('.tongi-guide-action-label'),audioNote=guide.querySelector('.tongi-guide-audio');
  let target=null,stage='',composing=false,active=false,quietUntil=0,autoTimer=0,hideTimer=0,announceTimer=0;
  function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(state.export()));}catch{}}
  function sync(){state.experience(input.value.trim().length>0);call.textContent=state.experienced?'통이 · 다음은?':'통이 · 어디부터 하지?';save();}
  function blocked(){return document.hidden||composing||document.activeElement===input||performance.now()<quietUntil||!!document.querySelector('dialog[open],.vnh-header[data-open="true"],[aria-label="전체 메뉴 닫기"]');}
  function viewport(){const v=window.visualViewport;return {width:document.documentElement.clientWidth,top:Math.max(64,v?.offsetTop||0),bottom:(v?.offsetTop||0)+(v?.height||innerHeight)};}
  function inView(r,v){return r.width>0&&r.height>0&&r.top>=v.top&&r.bottom<=v.bottom-2;}
  function obstacles(){return [...document.querySelectorAll('.hero-copy,.keyboard-preview canvas,.keyboard-tools>label,.keyboard-actions,#landing-keyboard-status,.keyboard-scope,.hero-next,.down,.vnh-header')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());}
  function place(){
    const v=viewport(),r=target.getBoundingClientRect();if(!inView(r,v))return false;
    const label=document.querySelector('.keyboard-tools>label'),all=obstacles();
    let p=findGuidePosition(r,all,v,{labelTop:stage==='input'?label.getBoundingClientRect().top:r.top,width:360});
    let inline=false;
    if(!p){
      const s=status.getBoundingClientRect(),height=Math.max(32,s.height),top=s.top-(height-s.height)/2;
      const slot={left:s.left,right:s.right,top,bottom:top+height,width:s.width,height};
      const sameStatus=o=>Math.abs(o.top-s.top)<1&&Math.abs(o.left-s.left)<1&&Math.abs(o.width-s.width)<1;
      if(!inView(slot,v)||all.some(o=>!sameStatus(o)&&intersects(slot,o,0)))return false;
      p={...slot,pose:stage==='input'?'up':'down'};inline=true;
    }
    guide.dataset.inline=String(inline);guide.dataset.pose=p.pose;
    Object.assign(guide.style,{left:p.left+'px',top:p.top+'px',width:p.width+'px',height:p.height+'px'});
    status.classList.toggle('tongi-guide-suppressed',inline);
    return true;
  }
  function updateSprite(){const up=guide.dataset.pose==='up';sprite.style.backgroundImage='url("'+new URL(up?'./tongi-guide-up-v1.png':'./tongi-guide-poses-v2.png',import.meta.url).href+'")';}
  function hide({returnFocus=false}={}){
    clearTimeout(hideTimer);clearTimeout(announceTimer);active=false;target?.classList.remove('tongi-guide-target');target=null;
    if(returnFocus&&guide.contains(document.activeElement))call.focus({preventScroll:true});
    guide.hidden=true;status.classList.remove('tongi-guide-suppressed');call.setAttribute('aria-expanded','false');
  }
  function dismiss(){state.dismiss();save();hide({returnFocus:true});}
  function show(automatic=false){
    if(blocked())return false;
    sync();stage=state.stage;target=stage==='input'?input:next;
    if(!place()){target=null;return false;}
    updateSprite();
    message.textContent=stage==='input'?(automatic?'키캡 대신 이 칸에 써보세요.':'여기에 한 줄 써보세요.'):'키캡 아래도 살펴볼까요?';
    const sound=document.querySelector('#landing-sound').getAttribute('aria-pressed')==='true'?'소리 켜짐':'소리 꺼짐';
    actionLabel.textContent=guide.dataset.inline==='true'?(stage==='input'?(automatic?'↑ 키캡 대신 위 칸에 써보세요':'↑ 위 칸에 써보세요'):'↓ 파헤쳐보기를 눌러보세요'):(stage==='input'?'입력칸으로 이동 →':'파헤쳐보기로 이동 →');
    audioNote.textContent=sound;
    target.classList.add('tongi-guide-target');guide.dataset.enter=String(!reduced.matches);guide.hidden=false;active=true;call.setAttribute('aria-expanded','true');
    if(guide.dataset.inline==='true'&&actionLabel.scrollWidth>actionLabel.clientWidth){actionLabel.textContent=stage==='input'?'↑ 위 칸에 써보세요':'↓ 파헤쳐보기';}
    live.textContent='';announceTimer=setTimeout(()=>{if(active)live.textContent=message.textContent+(guide.dataset.inline==='true'?' '+sound:'');},100);
    // Focus/hover holds the guide; otherwise it quietly retires after 12 seconds.
    hideTimer=setTimeout(expire,12000);
    if(automatic){state.shown();save();}
    return true;
  }
  function expire(){if(!active)return;if((matchMedia('(hover:hover) and (pointer:fine)').matches&&guide.matches(':hover'))||guide.contains(document.activeElement)){hideTimer=setTimeout(expire,1500);return;}hide();}
  function tryAuto(){clearTimeout(autoTimer);if(!state.eligible(performance.now(),{reduced:reduced.matches,blocked:blocked()}))return;show(true);}
  function schedule(){clearTimeout(autoTimer);const delay=Math.max(180,quietUntil-performance.now()+20);autoTimer=setTimeout(tryAuto,delay);}
  function pause(){quietUntil=performance.now()+700;clearTimeout(autoTimer);hide({returnFocus:true});if(state.pendingUntil>0)schedule();}
  call.addEventListener('click',()=>{if(active){dismiss();return;}quietUntil=0;if(!show(false)){const feedback=state.experienced?'통이 · 아래 파헤쳐보기 ↓':'통이 · ↑ 입력칸에 써보세요';call.textContent=feedback;live.textContent=feedback;}});
  guide.querySelector('.tongi-guide-close').addEventListener('click',dismiss);
  action.addEventListener('click',()=>{const node=target;hide();node?.focus({preventScroll:true});});
  for(const type of ['input','change','compositionend'])input.addEventListener(type,()=>{if(type==='compositionend')composing=false;sync();hide();state.clearAttempts();save();});
  input.addEventListener('compositionstart',()=>{composing=true;pause();});input.addEventListener('focus',()=>hide());
  document.querySelector('#landing-clear')?.addEventListener('click',()=>{sync();hide();});
  document.querySelector('#landing-sound')?.addEventListener('click',()=>hide({returnFocus:true}));
  next.addEventListener('click',()=>{state.finish();save();hide();});
  canvas.addEventListener('goodeasy:keyboard-attempt',e=>{state.attempt(e.detail?.result,performance.now());if(e.detail?.result==='key')sync();if(state.pendingUntil>0)schedule();});
  canvas.addEventListener('pointerdown',()=>{quietUntil=performance.now()+150;hide();});
  canvas.addEventListener('webglcontextlost',()=>{state.clearAttempts();pause();});
  document.addEventListener('click',()=>{if(blocked()&&active){state.clearAttempts();pause();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();dismiss();}});
  window.addEventListener('scroll',pause,{passive:true});window.addEventListener('resize',pause,{passive:true});
  window.addEventListener('wheel',pause,{passive:true});window.addEventListener('blur',()=>{state.clearAttempts();pause();});
  window.addEventListener('pagehide',()=>{state.clearAttempts();hide();});
  window.addEventListener('pageshow',()=>{sync();hide();});
  document.addEventListener('visibilitychange',()=>{state.clearAttempts();pause();});
  window.visualViewport?.addEventListener('resize',pause);window.visualViewport?.addEventListener('scroll',pause);
  reduced.addEventListener('change',()=>{state.clearAttempts();pause();});
  const header=document.querySelector('.vnh-header');if(header)new MutationObserver(()=>{if(blocked()){state.clearAttempts();pause();}}).observe(header,{attributes:true,attributeFilter:['data-open']});
  const layout=new ResizeObserver(()=>{if(active){if(!place())hide({returnFocus:true});else updateSprite();}});layout.observe(document.querySelector('.hero'));
  sync();
}
