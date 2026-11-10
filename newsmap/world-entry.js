/* Keep domestic state alive; load world resources only when requested. */
(()=>{
  'use strict';
  const domestic=document.querySelector('.workspace'),world=document.getElementById('world-workspace');
  const buttons=[...document.querySelectorAll('[data-scope]')];
  let domesticUrl=location.pathname,worldUrl=location.pathname+'?view=world',loading,view,domesticCamera;
  const isWorld=()=>new URLSearchParams(location.search).get('view')==='world';
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;const timer=setTimeout(()=>{s.remove();reject(new Error(src));},15000);s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(new Error(src));};document.head.append(s);});}
  async function ensure(){
    if(view)return view;
    if(!loading)loading=(async()=>{
      // List/data state is independent from geographic rendering.
      if(!window.NewsmapWorldRules)await load('world-core.js?v=20261110-2');
      if(!window.NewsmapWorld)await load('world.js?v=20261110-2');
      view=window.NewsmapWorld(world);
      view.restore();
      return view;
    })().catch(()=>{loading=null;document.getElementById('world-status').textContent='세계 뉴스를 불러오지 못했습니다. 다시 눌러 확인해 주세요.';document.getElementById('world-retry').hidden=false;});
    return loading;
  }
  function show(){
    const active=isWorld();
    domestic.hidden=active;world.hidden=!active;
    document.body.classList.toggle('world-active',active);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.scope==='world')===active)));
    if(active){ensure().then(v=>{v?.setActive(isWorld());if(isWorld())v?.restore();});}
    else{view?.setActive(false);window.NewsmapApp?.render('none');requestAnimationFrame(()=>{const m=window.NewsmapApp?.map;if(m){m.invalidateSize({pan:false});if(domesticCamera)m.setView(domesticCamera.center,domesticCamera.zoom,{animate:false});}});}
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{
    const next=b.dataset.scope==='world';if(next===isWorld())return;
    if(next){domesticUrl=location.pathname+location.search+location.hash;const m=window.NewsmapApp?.map;if(m)domesticCamera={center:m.getCenter(),zoom:m.getZoom()};}
    else worldUrl=location.pathname+location.search+location.hash;
    history.pushState(null,'',next?worldUrl:domesticUrl);show();
  }));
  window.addEventListener('popstate',show);
  document.querySelector('.skip').addEventListener('click',event=>{
    if(!isWorld())return;event.preventDefault();event.stopImmediatePropagation();view?.openList();document.getElementById('world-title').focus({preventScroll:true});
  },true);
  document.getElementById('world-retry').addEventListener('click',()=>{if(view)view.refresh();else{loading=null;ensure();}});
  show();
})();
