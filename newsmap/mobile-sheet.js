/* Mobile article drawer: the map remains the first screen. */
window.NewsmapSheet=()=>{
  'use strict';
  const panel=document.querySelector('.sidebar'),content=document.getElementById('sheet-content'),toggle=document.getElementById('sheet-toggle'),label=document.getElementById('sheet-label');
  const media=matchMedia('(max-width:700px)');
  let expanded=false,drag=null,suppressClickUntil=0;
  function apply(next){
    expanded=next;panel.dataset.expanded=String(next);panel.dataset.dragging='false';panel.style.removeProperty('transform');
    toggle.setAttribute('aria-expanded',String(media.matches&&next));
    toggle.setAttribute('aria-label',next?'기사 패널 접고 지도 보기':'지역 검색과 기사 목록 펼치기');
    content.inert=media.matches&&!next;content.setAttribute('aria-hidden',String(media.matches&&!next));
    label.textContent=next?'아래로 내려 지도 보기':'지역·기사 검색';
    if(media.matches&&!next&&content.contains(document.activeElement))toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>{if(performance.now()>suppressClickUntil)apply(!expanded);});
  toggle.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'){event.preventDefault();apply(true);}
    if(event.key==='ArrowDown'||event.key==='Escape'){event.preventDefault();apply(false);}
  });
  toggle.addEventListener('pointerdown',event=>{
    if(!media.matches||event.button!==0)return;
    const max=Math.max(0,panel.offsetHeight-toggle.offsetHeight);
    drag={id:event.pointerId,y:event.clientY,time:performance.now(),start:expanded?0:max,max,offset:expanded?0:max};
    toggle.setPointerCapture(event.pointerId);
  });
  toggle.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const delta=event.clientY-drag.y;if(Math.abs(delta)<5)return;
    panel.dataset.dragging='true';drag.offset=Math.max(0,Math.min(drag.max,drag.start+delta));
    panel.style.transform='translateY('+drag.offset+'px)';
  });
  toggle.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const delta=event.clientY-drag.y,velocity=delta/Math.max(1,performance.now()-drag.time);
    if(Math.abs(delta)>8){suppressClickUntil=performance.now()+400;apply(Math.abs(velocity)>.45&&Math.abs(delta)>20?velocity<0:drag.offset<drag.max/2);}
    else panel.style.removeProperty('transform');
    drag=null;if(toggle.hasPointerCapture(event.pointerId))toggle.releasePointerCapture(event.pointerId);
  });
  toggle.addEventListener('pointercancel',()=>{drag=null;apply(expanded);});
  media.addEventListener('change',()=>apply(expanded));apply(false);
  return {expand:()=>apply(true),collapse:()=>apply(false),update(count,region){document.getElementById('sheet-summary').textContent=region+' · '+count+'건';}};
};
