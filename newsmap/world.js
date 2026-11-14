/* World browsing: separate state, shared static snapshot delivery. */
window.NewsmapWorld=root=>{
  'use strict';
  const $=id=>document.getElementById(id),R=window.NewsmapWorldRules;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{/* Private browsing. */}}};
  let data,active=true,renderer,geometry,limit=30,refreshing=false,mapLoading=false,mapPromise;
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  let dataFailed=window.NewsmapApp?.dataCheckFailed===true;
  const state={country:'',period:'24',q:'',flat:false,motion:storage.get('newsmap:motion')!=='off'};
  let countries={};
  const date=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Seoul'});
  const stamp=s=>date.format(new Date(s));
  const mobile=()=>matchMedia('(max-width:700px)').matches;
  function drawer(value){
    const focused=document.activeElement;
    const side=root.querySelector('.world-sidebar');side.dataset.drawer=value;side.style.removeProperty('transform');side.dataset.dragging='false';
    root.dataset.mapLarge=String(value==='map');
    root.querySelector('.world-stage').inert=mobile()&&value==='open';
    $('world-drawer-toggle').setAttribute('aria-expanded',String(value==='open'));
    $('world-drawer-summary').textContent=$('world-count').textContent+' · '+(value==='open'?'지도 보기':'목록 펼치기');
    $('world-expand').setAttribute('aria-pressed',String(value==='map'));
    const hidden=mobile()&&value==='map';$('world-panel').inert=hidden;
    if(mobile()&&value==='open'&&root.querySelector('.world-stage').contains(focused))$('world-title').focus({preventScroll:true});
    if(mobile()&&value!=='open'&&((hidden&&$('world-panel').contains(focused))||root.querySelector('.world-finder').contains(focused)||root.querySelector('.world-snapshot').contains(focused)))$('world-drawer-toggle').focus({preventScroll:true});
    renderer?.resize();
  }
  const name=id=>countries[id]?.name||id;
  function fromUrl(){
    const p=new URLSearchParams(location.search);
    state.country=/^(?:[A-Z]{2,3}|unlocated)$/.test(p.get('country')||'')?p.get('country'):'';
    state.period=['24','168','720','all'].includes(p.get('wperiod'))?p.get('wperiod'):'24';
    state.q=(p.get('q')||'').slice(0,100);state.flat=p.get('globe')==='flat';
  }
  function url(replace=false){
    if(!active||new URLSearchParams(location.search).get('view')!=='world')return;
    const p=new URLSearchParams({view:'world'});
    if(state.country)p.set('country',state.country);if(state.period!=='24')p.set('wperiod',state.period);
    if(state.q)p.set('q',state.q);if(state.flat)p.set('globe','flat');
    const next=location.pathname+'?'+p.toString();if(next!==location.pathname+location.search)history[replace?'replaceState':'pushState'](null,'',next);
  }
  function adopt(next){
    if(!R.valid(next,{previousTime:data?Date.parse(data.collectedAt):-Infinity}))return false;
    data=next;
    return true;
  }
  function articles(){
    let q=state.q.trim();
    // A country query can find its articles as well as literal headline matches.
    const matches=Object.keys(countries).filter(id=>q&&(name(id).includes(q)||id.toLowerCase()===q.toLowerCase()||q.length>=3&&(countries[id].english||'').toLowerCase().includes(q.toLowerCase())));
    const base=R.filter(data?.articles||[],{...state,q:matches.length?'':q});
    return matches.length?base.filter(a=>a.locations.some(l=>matches.includes(l.country))||a.title.toLowerCase().includes(q.toLowerCase())):base;
  }
  function card(a){
    return `<article class="world-card" data-world-article="${esc(a.id)}"><div class="world-card-head"><span>국제 · 뉴시스</span><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></div><h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)} <span class="sr-only">뉴시스 원문, 새 창</span></a></h3><div class="world-card-places">${a.locations.length?a.locations.map(l=>`<button class="world-place ${l.role==='related'?'related':''}" data-world-country="${esc(l.country)}" aria-pressed="${state.country===l.country}" title="${esc(l.evidence.join(' / '))}">${esc(name(l.country))} · ${l.role==='place'?'기사 속 장소':'관련국'}</button>`).join(''):'<span class="world-unlocated">지도 위치 미지정 · 원문에서 확인해 주세요.</span>'}</div></article>`;
  }
  const cardMarkup=new WeakMap();
  function listScroller(){return getComputedStyle($('world-articles')).overflowY==='visible'?$('world-panel'):$('world-articles');}
  function captureList(preserve){
    const list=$('world-articles'),scroller=listScroller(),rect=scroller.getBoundingClientRect();
    const old=[...list.querySelectorAll('.world-card')],focused=document.activeElement;
    const focusedCard=list.contains(focused)?focused.closest('.world-card'):null;
    const focusedId=focusedCard?.dataset.worldArticle;
    const focusedCountry=focused?.dataset?.worldCountry;
    const focusedAction=list.contains(focused)?focused?.dataset?.worldAction:null;
    const moreFocused=focusedAction==='more';
    const visible=old.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>rect.top&&r.top<rect.bottom;});
    const firstVisible=visible.length?old.indexOf(visible[0]):0;
    const anchorOrder=visible.concat(old.slice(firstVisible+visible.length),old.slice(0,firstVisible).reverse());
    const anchors=preserve&&rect.height?anchorOrder.map(el=>({id:el.dataset.worldArticle,offset:el.getBoundingClientRect().top-rect.top})):[];
    return {list,scroller,old,focusedCard,focusedId,focusedCountry,focusedAction,moreFocused,visible,anchors};
  }
  function syncList(shown,preserve,view){
    const {list,scroller,old,focusedCard,focusedId,focusedCountry,focusedAction,moreFocused,visible,anchors}=view;
    if(preserve)for(const el of visible.concat(focusedCard?[focusedCard]:[])){
      const index=shown.findIndex(a=>a.id===el.dataset.worldArticle);if(index>=limit)limit=index+1;
    }
    const byId=new Map(old.map(el=>[el.dataset.worldArticle,el]));
    if(!data||!shown.length){
      const html=!data?'<div class="world-empty"><strong>세계 뉴스를 불러오고 있어요.</strong><p>잠시 후에도 보이지 않으면 다시 확인해 주세요.</p><button data-world-action="retry">다시 확인</button></div>':'<div class="world-empty"><strong>선택한 조건에 모인 기사가 없어요.</strong><p>기간을 넓히거나 다른 나라의 소식을 살펴보세요.</p><button data-world-action="clear">전체 세계 뉴스 보기</button></div>';
      if(list.innerHTML!==html)list.innerHTML=html;
    }else{
      const keep=new Set();let cursor=list.firstElementChild;
      for(const a of shown.slice(0,limit)){
        let el=byId.get(a.id);const html=card(a);
        if(!el){const template=document.createElement('template');template.innerHTML=html;el=template.content.firstElementChild;cardMarkup.set(el,html);}
        else if(cardMarkup.get(el)!==html){const template=document.createElement('template');template.innerHTML=html;el.innerHTML=template.content.firstElementChild.innerHTML;cardMarkup.set(el,html);}
        keep.add(el);if(el!==cursor)list.insertBefore(el,cursor);cursor=el.nextElementSibling;
      }
      if(shown.length>limit){
        let more=list.querySelector('.world-load-more');if(!more){more=document.createElement('button');more.className='world-load-more';more.dataset.worldAction='more';more.textContent='기사 더 보기';}
        keep.add(more);if(more!==cursor)list.insertBefore(more,cursor);
      }
      for(const el of [...list.children])if(!keep.has(el))el.remove();
    }
    if(preserve){
      const anchor=anchors.find(a=>list.querySelector(`[data-world-article="${a.id}"]`));
      if(anchor){const el=list.querySelector(`[data-world-article="${anchor.id}"]`);scroller.scrollTop+=el.getBoundingClientRect().top-scroller.getBoundingClientRect().top-anchor.offset;}
      if(focusedId||focusedAction){
        const el=focusedId&&list.querySelector(`[data-world-article="${focusedId}"]`);
        const target=el?(focusedCountry?el.querySelector(`[data-world-country="${focusedCountry}"]`):el.querySelector('a')):focusedAction?list.querySelector(`[data-world-action="${focusedAction}"]`):null;
        const focusIndex=old.indexOf(focusedCard);
        const focusOrder=focusIndex>=0?old.slice(focusIndex+1).concat(old.slice(0,focusIndex).reverse()):[];
        const fallback=focusOrder.map(card=>list.querySelector(`[data-world-article="${card.dataset.worldArticle}"] a`)).find(Boolean)||anchors.map(a=>list.querySelector(`[data-world-article="${a.id}"] a`)).find(Boolean);
        const next=target||el?.querySelector('a')||fallback||(!focusedId&&list.querySelector('.world-card a'))||$('world-title');
        if(document.activeElement!==next)next.focus({preventScroll:true});
      }
    }else scroller.scrollTop=0;
  }
  const periodText=()=>({'24':'최근 24시간 보도','168':'최근 7일 보도','720':'최근 30일 보도',all:'모아둔 전체 기사'}[state.period]);
  function render(update=true,replace=false){
    const listView=captureList(!update);
    if(state.country&&state.country!=='unlocated'&&Object.keys(countries).length&&!countries[state.country])state.country='';
    $('world-period-label').textContent=periodText();
    $('world-map-summary').textContent=data?'자료 갱신 '+stamp(data.collectedAt)+' · 일부 기사':'뉴시스 국제기사 일부';
    const shown=articles();
    const title=state.country==='unlocated'?'위치 미지정':state.country?name(state.country):'세계';
    $('world-title').textContent=title+'의 소식';$('world-count').textContent=shown.length+'건';
    $('world-drawer-label').textContent=title+' 뉴스';$('world-drawer-summary').textContent=shown.length+'건 · '+(root.querySelector('.world-sidebar').dataset.drawer==='open'?'지도 보기':'목록 펼치기');
    $('world-map-title').innerHTML=state.country?esc(title)+' 관련<br>소식':state.flat?'세계의 소식':'세계에서는<br>무슨 일이 있을까?';
    $('world-status').textContent=(dataFailed?(data?'다시 확인하지 못했어요 · 마지막으로 받은 자료입니다. ':'세계 뉴스를 확인하지 못했어요. '):refreshing?'기사를 다시 확인하고 있습니다. ':'')+(data?(state.country?'선택한 나라의 ':'')+shown.length+'개 기사 · 뉴시스 국제기사 일부 · '+periodText()+(state.country?' · 기사 속 장소·관련국 포함':' · 국가별 수에는 같은 기사가 포함될 수 있습니다.'):'세계 기사 데이터를 확인하고 있습니다.');
    syncList(shown,!update,listView);
    $('world-search').value=state.q;$('world-period').value=state.period;
    $('world-clear').hidden=!state.country&&!state.q;$('world-clear').parentElement.hidden=$('world-clear').hidden;
    $('world-flat').setAttribute('aria-pressed',String(state.flat));$('world-globe').setAttribute('aria-pressed',String(!state.flat));
    $('world-expand').setAttribute('aria-label','세계지도 크게 보기');
    root.classList.toggle('world-flat-mode',state.flat);$('world-spin').hidden=state.flat;$('world-find').hidden=!state.flat;$('world-motion').hidden=false;
    $('world-spin').disabled=!renderer||state.flat||motion.matches;
    ['world-flat','world-globe','world-zoom-in','world-zoom-out'].forEach(id=>{$(id).disabled=!renderer;});
    $('world-motion').disabled=motion.matches;
    $('world-motion').setAttribute('aria-pressed',String(state.motion&&!motion.matches));$('world-motion').textContent=motion.matches?'파동 꺼짐 · 기기 설정':state.motion?'안내 파동 켜짐':'안내 파동 꺼짐';root.classList.toggle('world-motion-off',!state.motion||motion.matches);
    $('world-snapshot-time').textContent=data?stamp(data.collectedAt)+' 자료 갱신 · 뉴시스 국제기사 일부':'';
    // Country options are based on the whole retained snapshot, not just the globe front.
    const counts=R.groups(R.filter(data?.articles||[],{period:state.period}));
    const options='<option value="">모든 나라</option>'+counts.sort((a,b)=>name(a.country).localeCompare(name(b.country),'ko')).map(g=>`<option value="${esc(g.country)}">${esc(name(g.country))}${state.q.trim()?'':` (${g.count})`}</option>`).join('')+'<option value="unlocated">위치 미지정</option>';
    if($('world-country').innerHTML!==options)$('world-country').innerHTML=options;
    if(state.country&&!counts.some(g=>g.country===state.country)&&state.country!=='unlocated')$('world-country').add(new Option(name(state.country),state.country));
    $('world-country').value=state.country;
    const groups=R.groups(shown).map(g=>({...g,name:name(g.country),center:countries[g.country]?.center,pulse:state.motion&&!motion.matches&&!dataFailed})).filter(g=>g.center);
    renderer?.update(groups,state.country,state.flat,{ready:!!data,failed:dataFailed,scope:JSON.stringify([state.country,state.period,state.q,state.flat])});
    if(update)url(replace);
  }
  function select(id,fromMap=false){
    const focusList=root.querySelector('.world-stage').contains(document.activeElement)||$('world-articles').contains(document.activeElement);
    state.country=id;limit=30;renderer?.stop();render();
    if(id&&countries[id])renderer?.focus(countries[id].center);
    $('world-articles').scrollTop=0;
    if(mobile()){drawer(state.flat&&fromMap?'peek':'open');if(focusList&&!(state.flat&&fromMap))$('world-title').focus({preventScroll:true});}else if(focusList)$('world-title').focus({preventScroll:true});
  }
  function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;const timer=setTimeout(()=>{s.remove();reject(new Error(src));},15000);s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(new Error(src));};document.head.append(s);});}
  async function loadMap(){
    if(renderer||mapLoading)return;mapLoading=true;
    try{
      if(!window.d3?.geoOrthographic){if(!window.d3?.range)await loadScript('vendor/d3-array.min.js');await loadScript('vendor/d3-geo.min.js');}
      if(!window.NEWSMAP_WORLD_GEOGRAPHY)await loadScript('data/world-geography.js?v=20261114-4');
      geometry=window.NEWSMAP_WORLD_GEOGRAPHY;countries=geometry.countries;
      if(!window.NewsmapGlobe)await loadScript('world-globe.js?v=20261114-4');
      renderer=window.NewsmapGlobe(root,geometry,id=>select(id,true));renderer.setActive(active&&!document.hidden);
      $('world-map-notice').hidden=true;$('world-retry').hidden=true;root.querySelector('.world-controls').hidden=false;root.querySelector('.world-map-legend').hidden=false;
      render(false);if(state.country&&countries[state.country])renderer.focus(countries[state.country].center);
    }catch{
      root.querySelector('.world-controls').hidden=true;root.querySelector('.world-map-legend').hidden=true;
      $('world-map-notice').hidden=false;$('world-map-notice').textContent='지도를 불러오지 못했습니다. 뉴스 목록은 계속 이용할 수 있습니다.';$('world-retry').hidden=false;
    }finally{mapLoading=false;}
  }
  // Metadata is small; its load failure never blocks headline links.
  async function countryNames(){
    try{const response=await fetch('data/world-countries.json?v=20261114-4');if(!response.ok)throw new Error();countries=await response.json();render(false);}catch{/* The globe can supply the same names when ready. */}
  }
  async function refresh(){
    if(refreshing)return;refreshing=true;$('world-refresh').disabled=true;
    render(false);
    try{
      if(window.NewsmapApp?.refreshData){
        if(!await window.NewsmapApp.refreshData(true))throw new Error();
      }else await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='data/articles.js?world='+Date.now();const timeout=setTimeout(()=>{s.remove();reject(new Error());},15000);s.onload=()=>{clearTimeout(timeout);s.remove();resolve();};s.onerror=()=>{clearTimeout(timeout);s.remove();reject(new Error());};document.head.append(s);});
      if(!adopt(window.NewsmapApp?.world||window.NEWSMAP_ARTICLES?.world))throw new Error();
      dataFailed=false;
    }catch{dataFailed=true;}
    finally{refreshing=false;$('world-refresh').disabled=false;render(false);if(!renderer)loadMap();}
  }
  $('world-country').addEventListener('change',()=>select($('world-country').value));
  $('world-period').addEventListener('change',()=>{state.period=$('world-period').value;limit=30;render();});
  let searchTimer;$('world-search').addEventListener('input',()=>{clearTimeout(searchTimer);state.q=$('world-search').value;searchTimer=setTimeout(()=>{limit=30;render(true,true);},180);});
  $('world-search').addEventListener('keydown',event=>{if(event.key==='Escape'){state.q='';render(true,true);}});
  $('world-clear').addEventListener('click',()=>{state.country='';state.q='';render();renderer?.home();$('world-search').focus({preventScroll:true});});
  $('world-articles').addEventListener('click',event=>{
    const place=event.target.closest('[data-world-country]');if(place){select(state.country===place.dataset.worldCountry?'':place.dataset.worldCountry);return;}
    const action=event.target.closest('[data-world-action]')?.dataset.worldAction;
    if(action==='more'){const prior=limit;limit+=30;render(false);if(event.detail===0)$('world-articles').querySelectorAll('.world-card a')[prior]?.focus({preventScroll:false});}if(action==='clear'){state.country='';state.q='';state.period='all';render();$('world-title').focus({preventScroll:true});}if(action==='retry')refresh();
  });
  $('world-panel').addEventListener('focusin',()=>{if(mobile()&&root.querySelector('.world-sidebar').dataset.drawer!=='open')drawer('open');});
  $('world-refresh').addEventListener('click',refresh);
  $('world-flat').addEventListener('click',()=>{state.flat=true;renderer?.stop();render();});$('world-globe').addEventListener('click',()=>{state.flat=false;render();});
  $('world-spin').addEventListener('click',()=>renderer?.spin());$('world-home').addEventListener('click',()=>{renderer?.home();});
  $('world-find').addEventListener('click',()=>{if(mobile())drawer('open');$('world-search').focus({preventScroll:true});});
  $('world-zoom-in').addEventListener('click',()=>renderer?.zoom(1.2));$('world-zoom-out').addEventListener('click',()=>renderer?.zoom(1/1.2));
  $('world-motion').addEventListener('click',()=>{state.motion=!state.motion;if(!state.motion)renderer?.cancelGuide();storage.set('newsmap:motion',state.motion?'on':'off');render(false);window.dispatchEvent(new CustomEvent('newsmap:motion',{detail:state.motion}));});
  window.addEventListener('newsmap:motion',event=>{if(state.motion===(event.detail===true))return;state.motion=event.detail===true;if(!state.motion)renderer?.cancelGuide();render(false);});motion.addEventListener('change',()=>{renderer?.cancelGuide();renderer?.stop();render(false);});
  $('world-expand').addEventListener('click',()=>drawer(root.dataset.mapLarge==='true'?'peek':'map'));
  $('world-drawer-toggle').addEventListener('click',()=>{if(Date.now()>suppressClick)drawer(root.querySelector('.world-sidebar').dataset.drawer==='open'?'peek':'open');});
  $('world-drawer-toggle').addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();drawer('open');}if(e.key==='ArrowDown'||e.key==='Escape'){e.preventDefault();drawer('peek');}});
  let drag,suppressClick=0;const toggle=$('world-drawer-toggle');
  toggle.addEventListener('pointerdown',e=>{if(!mobile()||e.button!==0)return;drag={y:e.clientY,id:e.pointerId};toggle.setPointerCapture(e.pointerId);});
  toggle.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const delta=e.clientY-drag.y;if(Math.abs(delta)>24){suppressClick=Date.now()+400;drawer(delta<0?'open':'map');}drag=null;});
  toggle.addEventListener('pointercancel',()=>{drag=null;});
  matchMedia('(max-width:700px)').addEventListener('change',()=>drawer('peek'));
  document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)render(false);renderer?.setActive(active&&!document.hidden);});
  // Domestic and world views share the existing one-minute check.
  window.addEventListener('newsmap:snapshot',event=>{dataFailed=!(event.detail?.valid&&adopt(event.detail.world));if(active)render(false);});
  adopt(window.NEWSMAP_ARTICLES?.world);fromUrl();render(false);countryNames();loadMap();if(!data)refresh();
  return {restore(){const prior=state.country,scope=JSON.stringify([state.country,state.period,state.q]);fromUrl();const changed=scope!==JSON.stringify([state.country,state.period,state.q]);if(changed)limit=30;render(false);if(changed)listScroller().scrollTop=0;if(state.country!==prior&&state.country&&countries[state.country])renderer?.focus(countries[state.country].center);},setActive(value){active=value;renderer?.setActive(value&&!document.hidden);if(value){adopt(window.NEWSMAP_ARTICLES?.world);dataFailed=window.NewsmapApp?.dataCheckFailed===true||dataFailed;render(false);}},openList(){drawer('open');},refresh,get state(){return state;},get articles(){return data?.articles||[];}};
};
