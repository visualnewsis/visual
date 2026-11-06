(()=>{
  'use strict';
  const script=document.currentScript;
  if(!script||document.querySelector('[data-here-news-banner]'))return;
  const base=new URL('.',script.src),theme=script.dataset.theme==='navy'?'navy':'night-map';
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('banner.css',base).href;document.head.append(style);
  const root=document.createElement('aside');root.className='hrn-banner';root.dataset.hereNewsBanner='';root.dataset.theme=theme;root.setAttribute('aria-label','여기뉴스 안내');
  const pin='<svg class="hrn-pin" viewBox="0 0 48 64" aria-hidden="true"><path d="M24 0C10.7 0 0 10.7 0 24c0 17 24 40 24 40s24-23 24-40C48 10.7 37.3 0 24 0zm0 34a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>';
  root.innerHTML='<div class="hrn-card"><a class="hrn-link"><span class="hrn-pin-zone">'+pin+'</span><span class="hrn-copy"><strong>여기 무슨 일 있어?</strong><span class="hrn-subtitle">지도에서 뉴스로 확인</span><span class="hrn-wordmark" role="img" aria-label="여기뉴스"></span></span><span class="hrn-arrow" aria-hidden="true">→</span></a><button class="hrn-close" type="button" aria-label="배너 접기">×</button></div><a class="hrn-small" aria-label="여기뉴스 열기">'+pin+'<span>여기뉴스</span></a>';
  let href='https://visual.newsis.com/newsmap/';try{const custom=new URL(script.dataset.href||href);if(custom.protocol==='https:'||custom.protocol==='http:')href=custom.href;}catch{}
  const card=root.querySelector('.hrn-card'),small=root.querySelector('.hrn-small');
  root.querySelectorAll('a').forEach(a=>{a.href=href;a.target='_blank';a.rel='noopener';});
  let manual=false,hover=false,queued=false;
  const threshold=160;
  function render(){
    queued=false;const scrolled=scrollY>threshold,compact=(scrolled||manual)&&!hover;
    root.dataset.scrolled=String(scrolled||manual);root.dataset.compact=String(compact);
    card.inert=compact;card.setAttribute('aria-hidden',String(compact));small.tabIndex=compact?0:-1;small.setAttribute('aria-hidden',String(!compact));
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  root.querySelector('.hrn-close').onclick=()=>{manual=true;hover=false;render();small.focus({preventScroll:true});};
  root.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches){hover=true;render();}});
  root.addEventListener('mouseleave',()=>{hover=false;if(!root.contains(document.activeElement))render();});
  root.addEventListener('focusin',e=>{if(e.target===small)return;hover=true;render();});
  root.addEventListener('focusout',()=>{setTimeout(()=>{if(!root.contains(document.activeElement)){hover=false;render();}},0);});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){manual=true;hover=false;render();small.focus({preventScroll:true});}});
  window.addEventListener('scroll',schedule,{passive:true});document.body.append(root);render();
})();