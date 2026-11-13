/* World browsing: separate state, shared static snapshot delivery. */
window.NewsmapWorld=root=>{
  'use strict';
  const $=id=>document.getElementById(id),R=window.NewsmapWorldRules;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{/* Private browsing. */}}};
  let data,active=true,renderer,geometry,limit=30,refreshing=false,mapLoading=false,mapPromise;
  const initialVisit=Number(storage.get('newsmap:world:lastVisit'));
  const cutoff=initialVisit>0&&initialVisit<=Date.now()?initialVisit:Date.now()-86400000;
  const readIds=new Set((()=>{try{const value=JSON.parse(storage.get('newsmap:world:read'));return Array.isArray(value)?value.filter(id=>typeof id==='string'):[];}catch{return [];}})());
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  let pulseBatch;try{pulseBatch=JSON.parse(storage.get('newsmap:world:pulse'))||{};}catch{pulseBatch={};}
  if(!pulseBatch||typeof pulseBatch!=='object'||!Array.isArray(pulseBatch.known)||!Array.isArray(pulseBatch.active))pulseBatch={};
  let pulseTimer;
  const state={country:'',period:'all',q:'',onlyNew:false,flat:false,motion:storage.get('newsmap:motion')!=='off'};
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
    state.period=['24','168','720','all'].includes(p.get('wperiod'))?p.get('wperiod'):'all';
    state.q=(p.get('q')||'').slice(0,100);state.onlyNew=p.get('wnew')==='1';state.flat=p.get('globe')==='flat';
  }
  function url(replace=false){
    if(!active||new URLSearchParams(location.search).get('view')!=='world')return;
    const p=new URLSearchParams({view:'world'});
    if(state.country)p.set('country',state.country);if(state.period!=='all')p.set('wperiod',state.period);
    if(state.q)p.set('q',state.q);if(state.onlyNew)p.set('wnew','1');if(state.flat)p.set('globe','flat');
    const next=location.pathname+'?'+p.toString();if(next!==location.pathname+location.search)history[replace?'replaceState':'pushState'](null,'',next);
  }
  function adopt(next){
    if(!R.valid(next,{previousTime:data?Date.parse(data.collectedAt):-Infinity}))return false;
    data=next;
    if(pulseBatch.collectedAt!==data.collectedAt){
      const old=new Set(Array.isArray(pulseBatch.known)?pulseBatch.known:[]);
      pulseBatch={collectedAt:data.collectedAt,known:data.articles.map(a=>a.id),active:data.articles.filter(a=>old.size?!old.has(a.id):Date.parse(a.publishedAt)>Date.parse(data.collectedAt)-600000).map(a=>a.id)};
      storage.set('newsmap:world:pulse',JSON.stringify(pulseBatch));
    }
    storage.set('newsmap:world:lastVisit',String(Math.min(Date.now(),Date.parse(data.collectedAt))));
    clearTimeout(pulseTimer);const remaining=Date.parse(data.collectedAt)+600000-Date.now();
    if(remaining>0)pulseTimer=setTimeout(()=>render(false),remaining+50);
    return true;
  }
  function articles(onlyNew=state.onlyNew){
    let q=state.q.trim();
    // A country query can find its articles as well as literal headline matches.
    const matches=Object.keys(countries).filter(id=>q&&(name(id).includes(q)||id.toLowerCase()===q.toLowerCase()||q.length>=3&&(countries[id].english||'').toLowerCase().includes(q.toLowerCase())));
    const base=R.filter(data?.articles||[],{...state,q:matches.length?'':q,onlyNew,cutoff});
    return matches.length?base.filter(a=>a.locations.some(l=>matches.includes(l.country))||a.title.toLowerCase().includes(q.toLowerCase())):base;
  }
  function card(a){
    const fresh=Date.parse(a.publishedAt)>cutoff;
    return `<article class="world-card" data-world-article="${esc(a.id)}"><div class="world-card-head">${fresh?'<span class="world-new-badge">NEW</span>':''}<span>국제 · 뉴시스</span><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></div><h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)} <span class="sr-only">뉴시스 원문, 새 창</span></a></h3><div class="world-card-places">${a.locations.length?a.locations.map(l=>`<button class="world-place ${l.role==='related'?'related':''}" data-world-country="${esc(l.country)}" aria-pressed="${state.country===l.country}" title="${esc(l.evidence.join(' / '))}">${esc(name(l.country))} · ${l.role==='place'?'기사 속 장소':'관련국'}</button>`).join(''):'<span class="world-unlocated">지도 위치 미지정 · 원문에서 확인해 주세요.</span>'}</div></article>`;
  }
  let lastList='';
  function render(update=true,replace=false){
    if(state.country&&state.country!=='unlocated'&&Object.keys(countries).length&&!countries[state.country])state.country='';
    $('world-map-summary').textContent=state.flat?'국가를 선택하면 관련 기사를 보여줍니다.':'빛나는 나라를 눌러 소식을 만나보세요.';
    const all=articles(false),shown=state.onlyNew?all.filter(a=>Date.parse(a.publishedAt)>cutoff):all;
    const title=state.country==='unlocated'?'위치 미지정':state.country?name(state.country):'세계';
    $('world-title').textContent=title+'의 소식';$('world-count').textContent=shown.length+'건';
    $('world-drawer-label').textContent=title+' 뉴스';$('world-drawer-summary').textContent=shown.length+'건 · '+(root.querySelector('.world-sidebar').dataset.drawer==='open'?'지도 보기':'목록 펼치기');
    $('world-map-title').innerHTML=state.country?esc(title)+' 관련<br>소식':state.flat?'세계에서는 무슨 일이 있을까?':'세계에서는<br>무슨 일이 있을까?';
    const ageMinutes=data?Math.max(0,Math.floor((Date.now()-Date.parse(data.collectedAt))/60000)):0;
    const stale=data&&ageMinutes>=30;
    const ageLabel=ageMinutes>=1440?Math.floor(ageMinutes/1440)+'일':ageMinutes>=60?Math.floor(ageMinutes/60)+'시간':ageMinutes+'분';
    $('world-status').textContent=data?(state.country?'선택한 나라의 ':'')+shown.length+'개 기사 · 국제 RSS 일부'+(stale?' · 마지막 데이터 갱신 '+ageLabel+' 전 · 최신 정보가 아닐 수 있습니다':'')+(state.country?' · 기사 속 장소·관련국 포함':' · 국가별 수에는 같은 기사가 포함될 수 있습니다.'):'세계 기사 데이터를 확인하고 있습니다.';
    const html=!data?'<div class="world-empty"><strong>세계 뉴스를 불러오고 있어요.</strong><p>잠시 후에도 보이지 않으면 다시 확인해 주세요.</p><button data-world-action="retry">다시 확인</button></div>':shown.length?shown.slice(0,limit).map(card).join('')+(shown.length>limit?'<button class="world-load-more" data-world-action="more">기사 더 보기</button>':''):'<div class="world-empty"><strong>선택한 조건에 모인 뉴스가 없어요.</strong><p>기간을 넓히거나 다른 나라의 소식을 살펴보세요.</p><button data-world-action="clear">전체 세계 뉴스 보기</button></div>';
    if(html!==lastList){$('world-articles').innerHTML=html;lastList=html;}
    $('world-new').title='새 기사: '+(initialVisit>0?'이 브라우저의 지난 확인 이후 발행':'첫 방문 기준 최근 24시간 발행')+' 기사. 파동은 최근 수집된 기사 중 아직 열지 않은 기사를 표시합니다.';
    $('world-new-count').textContent=all.filter(a=>Date.parse(a.publishedAt)>cutoff).length;
    $('world-search').value=state.q;$('world-period').value=state.period;
    $('world-all').setAttribute('aria-pressed',String(!state.onlyNew));$('world-new').setAttribute('aria-pressed',String(state.onlyNew));
    $('world-clear').hidden=!state.country&&!state.q;
    $('world-flat').setAttribute('aria-pressed',String(state.flat));$('world-globe').setAttribute('aria-pressed',String(!state.flat));
    root.classList.toggle('world-flat-mode',state.flat);$('world-spin').hidden=state.flat;$('world-find').hidden=!state.flat;$('world-motion').hidden=false;
    $('world-spin').disabled=!renderer||state.flat||motion.matches;
    ['world-flat','world-globe','world-zoom-in','world-zoom-out'].forEach(id=>{$(id).disabled=!renderer;});
    $('world-motion').disabled=motion.matches;
    $('world-motion').setAttribute('aria-pressed',String(state.motion&&!motion.matches));$('world-motion').textContent=motion.matches?'파동 꺼짐 · 기기 설정':state.motion?'새 기사 파동 켜짐':'새 기사 파동 꺼짐';root.classList.toggle('world-motion-off',!state.motion||motion.matches);
    $('world-snapshot-time').textContent=data?stamp(data.collectedAt)+' 마지막 갱신 · 국제 RSS 일부 기사':'';
    // Country options are based on the whole retained snapshot, not just the globe front.
    const counts=R.groups(R.filter(data?.articles||[],{period:state.period}));
    const options='<option value="">모든 나라</option>'+counts.sort((a,b)=>name(a.country).localeCompare(name(b.country),'ko')).map(g=>`<option value="${esc(g.country)}">${esc(name(g.country))} (${g.count})</option>`).join('')+'<option value="unlocated">위치 미지정</option>';
    if($('world-country').innerHTML!==options)$('world-country').innerHTML=options;
    if(state.country&&!counts.some(g=>g.country===state.country)&&state.country!=='unlocated')$('world-country').add(new Option(name(state.country),state.country));
    $('world-country').value=state.country;
    const groups=R.groups(shown).map(g=>({...g,name:name(g.country),center:countries[g.country]?.center,
      pulseKey:(data?.collectedAt||'')+':'+g.country,
      pulse:state.motion&&!motion.matches&&data&&Date.parse(data.collectedAt)+600000>Date.now()&&shown.some(a=>(pulseBatch.active||[]).includes(a.id)&&!readIds.has(a.id)&&a.locations.some(l=>l.country===g.country))})).filter(g=>g.center);
    renderer?.update(groups,state.country,state.flat);
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
      if(!window.NEWSMAP_WORLD_GEOGRAPHY)await loadScript('data/world-geography.js?v=20261114-2');
      geometry=window.NEWSMAP_WORLD_GEOGRAPHY;countries=geometry.countries;
      if(!window.NewsmapGlobe)await loadScript('world-globe.js?v=20261114-2');
      renderer=window.NewsmapGlobe(root,geometry,id=>select(id,true));renderer.setActive(active);
      $('world-map-notice').hidden=true;$('world-retry').hidden=true;root.querySelector('.world-controls').hidden=false;root.querySelector('.world-map-legend').hidden=false;
      render(false);if(state.country&&countries[state.country])renderer.focus(countries[state.country].center);
    }catch{
      root.querySelector('.world-controls').hidden=true;root.querySelector('.world-map-legend').hidden=true;
      $('world-map-notice').hidden=false;$('world-map-notice').textContent='지도를 불러오지 못했습니다. 뉴스 목록은 계속 이용할 수 있습니다.';$('world-retry').hidden=false;
    }finally{mapLoading=false;}
  }
  // Metadata is small; its load failure never blocks headline links.
  async function countryNames(){
    try{const response=await fetch('data/world-countries.json?v=20261114-2');if(!response.ok)throw new Error();countries=await response.json();render(false);}catch{/* The globe can supply the same names when ready. */}
  }
  async function refresh(){
    if(refreshing)return;refreshing=true;$('world-refresh').disabled=true;
    $('world-status').textContent='새로 배포된 기사 데이터를 확인하고 있습니다.';
    try{
      if(window.NewsmapApp?.refreshData){
        if(!await window.NewsmapApp.refreshData(true))throw new Error();
      }else await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='data/articles.js?world='+Date.now();const timeout=setTimeout(()=>{s.remove();reject(new Error());},15000);s.onload=()=>{clearTimeout(timeout);s.remove();resolve();};s.onerror=()=>{clearTimeout(timeout);s.remove();reject(new Error());};document.head.append(s);});
      if(!adopt(window.NewsmapApp?.world||window.NEWSMAP_ARTICLES?.world))throw new Error();
      render(false);
    }catch{render(false);$('world-status').textContent=data?'다시 확인하지 못했습니다. 마지막 확인 기사는 계속 볼 수 있어요.':'세계 뉴스를 불러오지 못했습니다. 다시 확인해 주세요.';}
    finally{refreshing=false;$('world-refresh').disabled=false;if(!renderer)loadMap();}
  }
  $('world-country').addEventListener('change',()=>select($('world-country').value));
  $('world-period').addEventListener('change',()=>{state.period=$('world-period').value;limit=30;render();});
  let searchTimer;$('world-search').addEventListener('input',()=>{clearTimeout(searchTimer);state.q=$('world-search').value;searchTimer=setTimeout(()=>{limit=30;render(true,true);},180);});
  $('world-search').addEventListener('keydown',event=>{if(event.key==='Escape'){state.q='';render(true,true);}});
  $('world-all').addEventListener('click',()=>{state.onlyNew=false;render();});$('world-new').addEventListener('click',()=>{state.onlyNew=true;render();});
  $('world-clear').addEventListener('click',()=>{state.country='';state.q='';render();renderer?.home();$('world-search').focus({preventScroll:true});});
  $('world-articles').addEventListener('click',event=>{
    const place=event.target.closest('[data-world-country]');if(place){select(state.country===place.dataset.worldCountry?'':place.dataset.worldCountry);return;}
    const action=event.target.closest('[data-world-action]')?.dataset.worldAction;
    if(action==='more'){const prior=limit;limit+=30;render(false);if(event.detail===0)$('world-articles').querySelectorAll('.world-card a')[prior]?.focus({preventScroll:false});}if(action==='clear'){state.country='';state.q='';state.onlyNew=false;state.period='all';render();$('world-title').focus({preventScroll:true});}if(action==='retry')refresh();
  });
  const markRead=event=>{if(event.type==='auxclick'&&event.button!==1)return;const card=event.target.closest('a')?.closest('[data-world-article]');if(!card)return;readIds.add(card.dataset.worldArticle);storage.set('newsmap:world:read',JSON.stringify([...readIds].slice(-3000)));render(false);};
  $('world-panel').addEventListener('focusin',()=>{if(mobile()&&root.querySelector('.world-sidebar').dataset.drawer!=='open')drawer('open');});
  $('world-articles').addEventListener('click',markRead);$('world-articles').addEventListener('auxclick',markRead);
  $('world-refresh').addEventListener('click',refresh);
  $('world-flat').addEventListener('click',()=>{state.flat=true;renderer?.stop();render();});$('world-globe').addEventListener('click',()=>{state.flat=false;render();});
  $('world-spin').addEventListener('click',()=>renderer?.spin());$('world-home').addEventListener('click',()=>{renderer?.home();});
  $('world-find').addEventListener('click',()=>{if(mobile())drawer('open');$('world-search').focus({preventScroll:true});});
  $('world-zoom-in').addEventListener('click',()=>renderer?.zoom(1.2));$('world-zoom-out').addEventListener('click',()=>renderer?.zoom(1/1.2));
  $('world-motion').addEventListener('click',()=>{state.motion=!state.motion;storage.set('newsmap:motion',state.motion?'on':'off');render(false);window.dispatchEvent(new CustomEvent('newsmap:motion',{detail:state.motion}));});
  window.addEventListener('newsmap:motion',event=>{if(state.motion===(event.detail===true))return;state.motion=event.detail===true;render(false);});motion.addEventListener('change',()=>{renderer?.stop();render(false);});
  $('world-expand').addEventListener('click',()=>drawer(root.dataset.mapLarge==='true'?'peek':'map'));
  $('world-drawer-toggle').addEventListener('click',()=>{if(Date.now()>suppressClick)drawer(root.querySelector('.world-sidebar').dataset.drawer==='open'?'peek':'open');});
  $('world-drawer-toggle').addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();drawer('open');}if(e.key==='ArrowDown'||e.key==='Escape'){e.preventDefault();drawer('peek');}});
  let drag,suppressClick=0;const toggle=$('world-drawer-toggle');
  toggle.addEventListener('pointerdown',e=>{if(!mobile()||e.button!==0)return;drag={y:e.clientY,id:e.pointerId};toggle.setPointerCapture(e.pointerId);});
  toggle.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const delta=e.clientY-drag.y;if(Math.abs(delta)>24){suppressClick=Date.now()+400;drawer(delta<0?'open':'map');}drag=null;});
  toggle.addEventListener('pointercancel',()=>{drag=null;});
  matchMedia('(max-width:700px)').addEventListener('change',()=>drawer('peek'));
  document.addEventListener('visibilitychange',()=>{renderer?.setActive(active&&!document.hidden);});
  // Domestic and world views share the existing one-minute check.
  window.addEventListener('newsmap:snapshot',event=>{if(event.detail?.valid&&adopt(event.detail.world)&&active)render(false);});
  adopt(window.NEWSMAP_ARTICLES?.world);fromUrl();render(false);countryNames();loadMap();if(!data)refresh();
  return {restore(){fromUrl();render(false);if(state.country&&countries[state.country])renderer?.focus(countries[state.country].center);},setActive(value){active=value;renderer?.setActive(value&&!document.hidden);if(value){adopt(window.NEWSMAP_ARTICLES?.world);render(false);}},openList(){drawer('open');},refresh,get state(){return state;},get articles(){return data?.articles||[];}};
};
