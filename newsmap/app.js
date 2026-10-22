(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const rules=window.NewsmapRules;
  const geo=window.NEWSMAP_GEOGRAPHY;
  let payload=window.NEWSMAP_ARTICLES;
  if(!geo||!payload||!rules){$('article-list').textContent='데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';return;}
  const nodes=Object.fromEntries(geo.nodes.map(n=>[n.id,n]));
  const params=new URLSearchParams(location.search);
  const now=()=>Date.now();
  const store={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,String(value));}catch{/* Private browsing: session-only behavior. */}}};
  const saved=Number(store.get('newsmap:lastVisit:v1'));
  const cutoff=saved>0&&saved<=now()?saved:now()-86400000;
  const sessionStarted=now();
  // Record the visit only after the data has loaded successfully.
  store.set('newsmap:lastVisit:v1',sessionStarted);
  const state={region:nodes[params.get('place')]?params.get('place'):'',period:['24','168','720','all'].includes(params.get('period'))?params.get('period'):'24',onlyNew:params.get('new')==='1',viewport:false,motion:store.get('newsmap:motion')!=='off'};
  let map,markers,boundary,locationLayer,shown=[],searchMatches=[];
  const formatter=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Seoul'});
  const stamp=value=>formatter.format(new Date(value));
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shortName=n=>n.level==='province'?n.name.replace(/특별자치도|특별자치시|특별시|광역시/g,'').replace('전남광주통합','전남광주'):n.name;
  const isNew=a=>Date.parse(a.publishedAt)>cutoff&&Date.parse(a.publishedAt)<=now();
  const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'&&(/(^|\.)newsis\.com$/.test(u.hostname))?u.href:'';}catch{return '';}};
  function updateUrl(){
    const p=new URLSearchParams();
    if(state.region)p.set('place',state.region);
    if(state.period!=='24')p.set('period',state.period);
    if(state.onlyNew)p.set('new','1');
    try{history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash);}catch{/* Local file preview may restrict history. */}
  }
  function descendants(parent,level){return geo.nodes.filter(n=>n.level===level&&n.id.startsWith(parent+'/'));}
  function fillSelect(id,list,value,placeholder){
    const select=$(id);
    select.replaceChildren(new Option(placeholder,''));
    list.sort((a,b)=>a.id.localeCompare(b.id,'ko')).forEach(n=>select.add(new Option(n.path.slice(id==='province'?0:1).join(' '),n.id)));
    select.value=value||'';
    select.disabled=list.length===0;
  }
  function syncControls(){
    const n=nodes[state.region];
    const path=n?.path||[];
    const province=path[0]||'';
    fillSelect('province',geo.nodes.filter(n=>n.level==='province'),province,'전국');
    const districtList=province?descendants(province,'district'):[];
    const district=n?.level==='district'?n.id:(n?.level==='dong'?n.parent:'');
    fillSelect('district',districtList,district,'시·군·구 전체');
    const dongList=district?descendants(district,'dong'):[];
    fillSelect('dong',dongList,n?.level==='dong'?n.id:'','읍·면·동 전체');
    document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===state.period)));
    $('all-tab').setAttribute('aria-pressed',String(!state.onlyNew));
    $('new-tab').setAttribute('aria-pressed',String(state.onlyNew));
    $('viewport-toggle').setAttribute('aria-pressed',String(state.viewport));
    $('motion-toggle').setAttribute('aria-pressed',String(state.motion));
    $('motion-toggle').textContent=state.motion?'파동 켜짐':'파동 꺼짐';
    document.body.classList.toggle('motion-off',!state.motion);
  }
  function mapBox(){if(!map)return null;const b=map.getBounds();return [b.getSouth(),b.getWest(),b.getNorth(),b.getEast()];}
  function selectedArticles(onlyNew=state.onlyNew){return rules.filter(payload.articles,{region:state.region,period:state.period,onlyNew,cutoff,now:now(),bounds:state.viewport?mapBox():null,nodes});}
  function articleCard(a){
    const n=nodes[a.places.find(p=>rules.belongs(p,state.region))||a.places[0]];
    const url=safeUrl(a.url);
    const image=safeUrl(a.image);
    const level=n.level==='dong'?'동네 확인':n.level==='district'?'시·군·구 단위':'시·도 단위';
    return `<article class="article-card" data-article="${esc(a.id)}"><div class="card-top">${isNew(a)?'<span class="new">NEW</span>':''}<span>${esc(a.category)}</span><span>·</span><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></div><div class="card-body"><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>${image?`<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true">`:''}</div><div class="card-bottom"><button class="place-link" data-place="${esc(n.id)}" title="${esc(a.evidence?.join(' / ')||n.path.join(' '))}">⌖ ${esc(n.path.map((name,i)=>i===0?shortName(nodes[name]):name).join(' '))} <span class="precision">${level}</span></button><a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">뉴시스 ↗</a></div></article>`;
  }
  function renderList(){
    shown=selectedArticles();
    const n=nodes[state.region];
    const region=n?shortName(n):'전국';
    $('breadcrumb').textContent=n?n.path.join(' / '):'대한민국';
    $('region-title').textContent=region+'의 소식';
    $('article-count').textContent=shown.length;
    $('new-count').textContent=selectedArticles(false).filter(isNew).length;
    $('map-heading').textContent=n?region+'에서 전해온 이야기':'전국에서 전해온 이야기';
    $('map-subheading').textContent=n?.level==='dong'?'이 동네가 확인된 기사만 모았습니다.':'빛나는 원을 눌러 그곳의 뉴스를 만나보세요.';
    $('article-list').innerHTML=shown.length?shown.map(articleCard).join(''):`<div class="empty"><span class="empty-mark" aria-hidden="true">⌖</span><h3>아직 모인 기사가 없어요.</h3><p>${state.onlyNew?'마지막 방문 이후 새로 발행된 기사가 없습니다.':n?.level==='dong'?'이 동네까지 위치가 확인된 기사가 없습니다. 구·시 단위 기사를 이 동네로 추정해 넣지 않습니다.':'선택한 기간·지역에 수집된 기사가 없습니다.'}<br>기간을 넓히거나 상위 지역의 소식을 살펴보세요.</p><button id="empty-reset">${state.onlyNew?'전체 기사 보기':state.period!=='all'?'전체 기간으로 보기':n?'상위 지역 보기':'전국 기사 다시 보기'}</button></div>`;
    $('snapshot-time').textContent=stamp(payload.collectedAt)+' 수집 · 일부 기사 · 자동 갱신 미연결';
    syncControls();
    updateUrl();
  }
  function renderMarkers(){
    if(!map)return;
    markers.clearLayers();
    let groups=rules.group(shown,nodes,map.getZoom(),state.region);
    if(map.getZoom()<8){
      const clusters=[];
      for(const g of groups){
        const point=map.latLngToContainerPoint(g.node.center);
        const near=clusters.find(c=>map.latLngToContainerPoint(c.node.center).distanceTo(point)<48);
        if(near){
          near.members.push(g.node);
          for(const a of g.articles)if(!near.articles.some(x=>x.id===a.id))near.articles.push(a);
        }else clusters.push({...g,articles:[...g.articles],members:[g.node]});
      }
      groups=clusters;
    }
    groups.forEach((g,i)=>{
      const count=g.articles.length;
      const fresh=g.articles.filter(isNew).length;
      const size=Math.min(47,25+Math.sqrt(count)*3);
      const clustered=g.members?.length>1;
      const label=shortName(g.node)+(clustered?' 외 '+(g.members.length-1)+'곳':'');
      const icon=L.divIcon({className:'news-marker'+(fresh?' has-new':''),iconSize:[size,size],iconAnchor:[size/2,size/2],html:`<span class="dot">${count}</span><span class="marker-label">${esc(label)}</span>`});
      const marker=L.marker(g.node.center,{icon,keyboard:true,title:label+': '+count+'개 기사'+(fresh?', 새 기사 '+fresh+'개':''),alt:label+' 기사 보기',riseOnHover:true});
      marker.on('add',()=>{const el=marker.getElement();el.style.setProperty('--size',size+'px');el.style.setProperty('--delay',-(i%8)*.37+'s');el.setAttribute('role','button');});
      marker.bindTooltip(esc(g.node.path.join(' '))+' · '+count+'건'+(fresh?' / 새 기사 '+fresh+'건':''),{direction:'top',offset:[0,-12]});
      marker.on('click',()=>{
        if(clustered){map.setView(g.node.center,Math.max(8,map.getZoom()+1),{animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});return;}
        if(state.region===g.node.id){
          $('results').focus({preventScroll:true});
          if(matchMedia('(max-width:700px)').matches)$('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
        }else selectPlace(g.node.id);
      });
      marker.addTo(markers);
    });
    const showEmpty=shown.length===0;
    $('map-message').hidden=!showEmpty;
    if(showEmpty)$('map-message').textContent='이 조건에 수집된 기사가 없습니다. 기간을 넓히거나 상위 지역을 선택해보세요.';
  }
  function render(){renderList();renderMarkers();}
  function fitNational(){
    const mobile=matchMedia('(max-width:700px)').matches;
    map.fitBounds([[33.05,124.9],[38.65,130.0]],{paddingTopLeft:[mobile?15:35,mobile?75:90],paddingBottomRight:[mobile?15:35,mobile?85:45],animate:false});
  }
  function drawBoundary(){
    if(!map)return;
    boundary.clearLayers();
    const n=nodes[state.region];
    if(!n||n.level==='province')return;
    const shapes=n.geometry?[n]:descendants(n.id,'dong').filter(x=>x.kind!=='locality');
    for(const shape of shapes)L.geoJSON(shape.geometry,{interactive:false,style:{color:'#647e53',weight:1.2,opacity:.6,fillColor:'#809b65',fillOpacity:.055}}).addTo(boundary);
  }
  function selectPlace(id,{fit=true}={}){
    state.region=nodes[id]?id:'';
    $('place-search').value='';
    closeSearch();
    state.viewport=false;
    render();
    drawBoundary();
    if(fit&&map){
      const n=nodes[state.region];
      if(n)map.fitBounds([[n.bbox[0],n.bbox[1]],[n.bbox[2],n.bbox[3]]],{paddingTopLeft:[35,110],paddingBottomRight:[45,65],maxZoom:15,animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});
      else fitNational();
    }
    $('article-list').scrollTop=0;
  }
  function closeSearch(){$('search-results').hidden=true;$('place-search').setAttribute('aria-expanded','false');}
  function search(){
    const q=$('place-search').value.trim().replace(/\s+/g,'');
    if(!q){closeSearch();return;}
    searchMatches=geo.nodes.filter(n=>n.path.join('').includes(q)).sort((a,b)=>{
      const aExact=a.name===q?1:0,bExact=b.name===q?1:0;
      if(aExact!==bExact)return bExact-aExact;
      const ac=payload.articles.filter(x=>rules.matches(x,a.id)).length,bc=payload.articles.filter(x=>rules.matches(x,b.id)).length;
      return bc-ac||a.path.length-b.path.length||a.id.localeCompare(b.id,'ko');
    }).slice(0,12);
    $('search-results').innerHTML=searchMatches.length?searchMatches.map(n=>`<button type="button" data-place="${esc(n.id)}"><strong>${esc(n.name)}</strong>${esc(n.path.join(' '))}</button>`).join(''):'<p>해당 이름의 지역을 찾지 못했습니다.<br>행정구역 이름으로 검색해 주세요.</p>';
    $('search-results').hidden=false;
    $('place-search').setAttribute('aria-expanded','true');
  }
  $('place-search').addEventListener('input',search);
  $('place-search').addEventListener('keydown',event=>{
    if(event.key==='Escape')closeSearch();
    if(event.key==='Enter'&&searchMatches.length&&!$('search-results').hidden){event.preventDefault();selectPlace(searchMatches[0].id);}
    if(event.key==='ArrowDown'&&!$('search-results').hidden){event.preventDefault();$('search-results').querySelector('button')?.focus();}
  });
  $('search-results').addEventListener('keydown',event=>{
    const buttons=[...$('search-results').querySelectorAll('button')];
    const i=buttons.indexOf(document.activeElement);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}
    if(event.key==='Escape'){closeSearch();$('place-search').focus();}
  });
  document.addEventListener('click',event=>{const b=event.target.closest('[data-place]');if(b)selectPlace(b.dataset.place);else if(!event.target.closest('.finder'))closeSearch();});
  $('province').addEventListener('change',()=>selectPlace($('province').value));
  $('district').addEventListener('change',()=>selectPlace($('district').value||$('province').value));
  $('dong').addEventListener('change',()=>selectPlace($('dong').value||$('district').value));
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{state.period=button.dataset.period;render();}));
  $('all-tab').addEventListener('click',()=>{state.onlyNew=false;render();});
  $('new-tab').addEventListener('click',()=>{state.onlyNew=true;render();});
  $('viewport-toggle').addEventListener('click',()=>{state.viewport=!state.viewport;render();});
  $('motion-toggle').addEventListener('click',()=>{state.motion=!state.motion;store.set('newsmap:motion',state.motion?'on':'off');syncControls();});
  $('article-list').addEventListener('click',event=>{if(event.target.id!=='empty-reset')return;if(state.onlyNew){state.onlyNew=false;render();}else if(state.period!=='all'){state.period='all';render();}else selectPlace(nodes[state.region]?.parent||'');});
  $('reset-map').addEventListener('click',()=>selectPlace(''));
  $('zoom-in').addEventListener('click',()=>map?.zoomIn());
  $('zoom-out').addEventListener('click',()=>map?.zoomOut());
  $('locate-me').addEventListener('click',async()=>{
    const button=$('locate-me'),status=$('location-status');
    status.hidden=false;
    if(!map){status.textContent='지도를 불러온 뒤 다시 시도해 주세요.';return;}
    button.disabled=true;button.setAttribute('aria-busy','true');
    status.textContent='현재 위치를 확인하고 있습니다. 브라우저의 위치 권한을 허용해 주세요.';
    try{
      const position=await rules.requestPosition(navigator.geolocation);
      const {latitude,longitude,accuracy}=position.coords;
      if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw {code:2};
      const region=rules.findRegion(geo.nodes,[latitude,longitude]);
      state.onlyNew=false;
      selectPlace(region?.id||'',{fit:false});
      if(!region)state.viewport=true;
      if(locationLayer)locationLayer.clearLayers();else locationLayer=L.layerGroup().addTo(map);
      const radius=Number.isFinite(accuracy)?Math.max(accuracy,1):0;
      if(radius)L.circle([latitude,longitude],{radius,weight:1,color:'#2675d8',fillColor:'#2675d8',fillOpacity:.10,interactive:false}).addTo(locationLayer);
      L.circleMarker([latitude,longitude],{radius:7,weight:3,color:'#fff',fillColor:'#2675d8',fillOpacity:1}).bindTooltip('내 위치'+(radius?' · 정확도 약 '+Math.round(radius).toLocaleString('ko-KR')+'m':''),{direction:'top'}).addTo(locationLayer);
      map.setView([latitude,longitude],radius>5000?10:14,{animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});
      render();
      status.textContent=region?'내 위치 · '+region.path.join(' ')+' · 정확도 약 '+Math.round(radius).toLocaleString('ko-KR')+'m':'현재 위치를 표시했습니다. 해당 위치의 국내 행정구역은 확인되지 않았습니다.';
    }catch(error){
      status.textContent=error.code===1?'위치 권한이 꺼져 있습니다. 브라우저의 사이트 설정에서 위치를 허용한 뒤 다시 눌러주세요.':error.code===3?'위치 확인 시간이 초과됐습니다. 잠시 후 다시 눌러주세요.':error.code===0?'이 환경에서는 위치 기능을 지원하지 않습니다. HTTPS 또는 localhost에서 이용해 주세요.':'현재 위치를 확인하지 못했습니다. 기기의 위치 설정을 확인하고 다시 시도해 주세요.';
    }finally{button.disabled=false;button.removeAttribute('aria-busy');}
  });
  const openAbout=()=>{$('about').showModal();};
  $('about-button').addEventListener('click',openAbout);
  $('credits-button').addEventListener('click',()=>{openAbout();$('credits').scrollIntoView({block:'end'});});
  $('about').querySelector('.dialog-close').addEventListener('click',()=>$('about').close());
  $('about').addEventListener('click',event=>{if(event.target===$('about')){const rect=$('about').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('about').close();}});
  $('refresh').addEventListener('click',()=>{
    const button=$('refresh');button.disabled=true;
    const script=document.createElement('script');script.src='data/articles.js?v='+now();
    script.onload=()=>{if(Array.isArray(window.NEWSMAP_ARTICLES?.articles)){payload=window.NEWSMAP_ARTICLES;render();}button.disabled=false;script.remove();};
    script.onerror=()=>{$('snapshot-time').textContent='재확인 실패 · 기존 기사 데이터를 유지합니다.';button.disabled=false;script.remove();};
    document.head.append(script);
  });
  if(window.L){
    map=L.map('map',{zoomControl:false,minZoom:4,maxZoom:18,scrollWheelZoom:true,preferCanvas:true,zoomSnap:.25});
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',detectRetina:false});
    const nativeBase=window.NewsmapBasemap?.(map,geo);
    const useNative=()=>{map.removeLayer(tiles);nativeBase?.enable();if(shown.length)$('map-message').hidden=true;};
    let errors=0,loaded=0;
    tiles.on('tileload',()=>{loaded++;nativeBase?.disable();if(loaded>3&&errors>2&&shown.length)$('map-message').hidden=true;});
    tiles.on('tileerror',()=>{errors++;if(errors>2&&loaded===0)useNative();});
    const loadBackground=async()=>{
      try{
        const response=await fetch(location.href,{method:'HEAD',cache:'no-store'});
        const policy=response.headers.get('Content-Security-Policy')||'';
        const imageRule=policy.match(/(?:^|;)\s*img-src\s+([^;]+)/)?.[1]||policy.match(/(?:^|;)\s*default-src\s+([^;]+)/)?.[1];
        const allowed=!imageRule||imageRule.split(/\s+/).some(source=>source==='*'||source==='https:'||/^https:\/\/(?:\*\.)?(?:tile\.)?openstreetmap\.org\/?$/.test(source));
        if(!allowed){useNative();return;}
      }catch{/* A failed policy check still has the tile-error fallback. */}
      tiles.addTo(map);
    };
    markers=L.layerGroup().addTo(map);boundary=L.layerGroup().addTo(map);
    map.on('moveend',()=>{if(state.viewport)renderList();renderMarkers();});
    fitNational();
    new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
    selectPlace(state.region);
    loadBackground();
  }else{
    renderList();$('map-message').hidden=false;$('map-message').textContent='지도 라이브러리를 불러오지 못했습니다. 지역 선택과 기사 목록을 이용해 주세요.';
  }
  window.NewsmapApp={state,nodes,get articles(){return payload.articles;},get shown(){return shown;},selectPlace,render,get map(){return map;},cutoff};
})();
