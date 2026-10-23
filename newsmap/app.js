(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const rules=window.NewsmapRules;
  const geo=window.NEWSMAP_GEOGRAPHY;
  let payload=window.NEWSMAP_ARTICLES;
  const sheet=window.NewsmapSheet?.();
  if(!geo||!Array.isArray(payload?.articles)||!rules){$('article-list').textContent='데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';$('snapshot-time').textContent='데이터 로드 실패 · 페이지 새로고침이 필요합니다.';$('refresh').onclick=()=>location.reload();sheet?.expand();return;}
  const nodes=Object.fromEntries(geo.nodes.map(n=>[n.id,n]));
  const provinces=geo.nodes.filter(n=>n.level==='province'),descendantLists=new Map();
  let projectedPayload,relatedArticles;
  const categories=['','all','정치','경제','산업','사회','IT·바이오','문화','스포츠','연예','국제'];
  function readUrl(){
    const params=new URLSearchParams(location.search);
    const camera=['lat','lng','zoom'].map(key=>params.has(key)?Number(params.get(key)):NaN);
    const valid=camera.every(Number.isFinite)&&Math.abs(camera[0])<=90&&Math.abs(camera[1])<=180&&camera[2]>=4&&camera[2]<=18;
    return {region:nodes[params.get('place')]?params.get('place'):'',period:['24','168','720','all'].includes(params.get('period'))?params.get('period'):'24',category:categories.includes(params.get('category'))?params.get('category'):'',onlyNew:params.get('new')==='1',viewport:params.get('view')==='map',camera:valid?camera:null};
  }
  const now=()=>Date.now();
  const store={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,String(value));}catch{/* Private browsing: session-only behavior. */}}};
  const saved=Number(store.get('newsmap:lastVisit:v1'));
  const cutoff=saved>0&&saved<=now()?saved:now()-86400000;
  const sessionStarted=now();
  // Record the visit only after the data has loaded successfully.
  store.set('newsmap:lastVisit:v1',sessionStarted);
  const state={...readUrl(),motion:store.get('newsmap:motion')!=='off'};
  let restoring=false,refreshStatus='',userMapInteraction=false;
  const seenSignals=new Set();
  function savedJSON(key,fallback){try{return JSON.parse(store.get(key))||fallback;}catch{return fallback;}}
  const savedReads=savedJSON('newsmap:read:v1',[]);
  const readArticles=new Set(Array.isArray(savedReads)?savedReads:[]);
  let pulseBatch=savedJSON('newsmap:pulse-batch:v1',{}),pulseExpiry;
  function syncPulseBatch(){
    const collected=Date.parse(payload.collectedAt);
    if(pulseBatch.collectedAt!==payload.collectedAt){
      const known=new Set(Array.isArray(pulseBatch.known)?pulseBatch.known:[]);
      pulseBatch={collectedAt:payload.collectedAt,known:payload.articles.map(a=>a.id),
        active:payload.articles.filter(a=>known.size?!known.has(a.id):Date.parse(a.publishedAt)>collected-600000&&Date.parse(a.publishedAt)<=collected).map(a=>a.id)};
      store.set('newsmap:pulse-batch:v1',JSON.stringify(pulseBatch));
      window.clearTimeout(pulseExpiry);pulseExpiry=null;
    }
    const remaining=collected+600000-now();
    if(!pulseExpiry&&remaining>0)pulseExpiry=window.setTimeout(()=>renderMarkers(),remaining+20);
  }
  const hasUnreadPulse=a=>Date.parse(payload.collectedAt)+600000>now()&&(pulseBatch.active||[]).includes(a.id)&&!readArticles.has(a.id);
  const PAGE_SIZE=30;
  let map,markers,boundary,locationLayer,shown=[],searchMatches=[],visibleLimit=PAGE_SIZE;
  const markerLayers=new Map();
  let lastListHtml='';
  const desktopPreview=matchMedia('(min-width:1100px) and (pointer:fine)');
  let mapPreview;
  function closeMapPreview(){if(mapPreview)mapPreview.hidden=true;}
  desktopPreview.addEventListener('change',closeMapPreview);
  document.querySelector('.skip').addEventListener('click',event=>{if(matchMedia('(max-width:700px)').matches){event.preventDefault();sheet?.expand();$('results').focus({preventScroll:true});}});
  const formatter=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Seoul'});
  const stamp=value=>formatter.format(new Date(value));
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shortName=n=>n.level==='province'?n.name.replace(/특별자치도|특별자치시|특별시|광역시/g,'').replace('전남광주통합','전남광주'):n.name;
  const isNew=a=>Date.parse(a.publishedAt)>cutoff&&Date.parse(a.publishedAt)<=now();
  const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'&&(/(^|\.)newsis\.com$/.test(u.hostname))?u.href:'';}catch{return '';}};
  function updateUrl(mode='push'){
    if(restoring||mode==='none')return;
    const p=new URLSearchParams();
    if(state.region)p.set('place',state.region);
    if(state.period!=='24')p.set('period',state.period);
    if(state.onlyNew)p.set('new','1');
    if(state.category)p.set('category',state.category);
    if(state.viewport){
      p.set('view','map');
      // Never copy a browser-provided current position into a shareable URL.
      if(map&&!locationLayer){const center=map.getCenter();p.set('lat',center.lat.toFixed(5));p.set('lng',center.lng.toFixed(5));p.set('zoom',String(map.getZoom()));}
    }
    const url=location.pathname+(p.size?'?'+p.toString():'')+location.hash;
    if(url===location.pathname+location.search+location.hash)return;
    try{history[mode==='replace'?'replaceState':'pushState'](null,'',url);}catch{/* Local file preview may restrict history. */}
  }
  function descendants(parent,level){const key=parent+'|'+level;if(!descendantLists.has(key))descendantLists.set(key,geo.nodes.filter(n=>n.level===level&&n.id.startsWith(parent+'/')));return descendantLists.get(key);}
  function fillSelect(id,list,value,placeholder){
    const select=$(id);
    const key=list.map(n=>n.id).join('|');
    if(select.dataset.optionsKey!==key){
      select.replaceChildren(new Option(placeholder,''));
      [...list].sort((a,b)=>a.id.localeCompare(b.id,'ko')).forEach(n=>select.add(new Option(n.path.slice(id==='province'?0:1).join(' '),n.id)));
      select.dataset.optionsKey=key;
    }
    select.value=value||'';
    select.disabled=list.length===0;
  }
  function syncControls(){
    const n=nodes[state.region];
    const path=n?.path||[];
    const province=path[0]||'';
    fillSelect('province',provinces,province,'전국');
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
    $('category-toggle').textContent=state.category?(state.category==='all'?'전체 분야':state.category):'카테고리';
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
    document.body.classList.toggle('motion-off',!state.motion);
  }
  function mapBox(){if(!map)return null;const b=map.getBounds();return [b.getSouth(),b.getWest(),b.getNorth(),b.getEast()];}
  function selectedArticles(onlyNew=state.onlyNew){
    if(projectedPayload!==payload){projectedPayload=payload;relatedArticles=payload.articles.map(a=>({...a,places:a.relatedPlaces||a.places}));}
    const articles=state.category?relatedArticles:payload.articles;
    return rules.filter(articles,{region:state.region,period:state.period,onlyNew,cutoff,now:now(),category:state.category==='all'?'':state.category,includeUnlocated:!!state.category,bounds:state.viewport?mapBox():null,nodes});
  }
  function visiblePlaces(article,box=state.viewport?mapBox():null){return article.places.filter(p=>rules.belongs(p,state.region)&&(!box||rules.inBox(nodes[p].center,box)));}
  function articleCard(a){
    const n=nodes[visiblePlaces(a)[0]||a.places[0]];
    const url=safeUrl(a.url);
    const image=safeUrl(a.image);
    if(!n)return `<article class="article-card" data-article="${esc(a.id)}"><div class="card-top"><span>${esc(a.newsCategory||a.category)}</span><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></div><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3><div class="card-bottom"><span class="precision">지도 위치 미지정</span><a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">뉴시스 ↗</a></div></article>`;
    const level=state.category?(a.placeReasons?.[n.id]||'기사 관련 지역'):n.level==='dong'?'동네 확인':n.level==='district'?'시·군·구 단위':'시·도 단위';
    return `<article class="article-card" data-article="${esc(a.id)}"><div class="card-top">${isNew(a)?'<span class="new">NEW</span>':''}<span>${esc(state.category?(a.newsCategory||a.category):a.category)}</span><span>·</span><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></div><div class="card-body"><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>${image?`<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true">`:''}</div><div class="card-bottom"><button class="place-link" data-place="${esc(n.id)}" title="${esc(a.evidence?.join(' / ')||n.path.join(' '))}">⌖ ${esc(n.path.map((name,i)=>i===0?shortName(nodes[name]):name).join(' '))} <span class="precision">${level}</span></button><a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">뉴시스 ↗</a></div></article>`;
  }
  function renderList(){
    closeMapPreview();
    syncPulseBatch();
    const allShown=selectedArticles(false);
    shown=state.onlyNew?allShown.filter(isNew):allShown;
    const n=nodes[state.region];
    const center=map?.getCenter();
    const camera=map&&state.viewport&&!state.region&&map.getZoom()>=8?rules.cameraContext(geo.nodes,[center.lat,center.lng],map.getZoom()):null;
    const cameraName=camera?.node?shortName(camera.node):'현재 지도';
    const region=camera?(camera.node?cameraName+' 주변':cameraName):n?shortName(n):'전국';
    $('breadcrumb').textContent=camera?(camera.node?camera.node.path.join(' / ')+' · 지도 범위':'현재 지도 범위'):n?n.path.join(' / '):'대한민국';
    $('region-title').textContent=region+'의 소식';
    $('article-count').textContent=shown.length;
    sheet?.update(shown.length,region);
    $('new-count').textContent=allShown.filter(isNew).length;
    $('map-heading').textContent=camera?(camera.node?cameraName+' 주변에서 전해온 이야기':'현재 지도에서 전해온 이야기'):n?region+'에서 전해온 이야기':'전국에서 전해온 이야기';
    const meters=camera?map.distance(center,map.getBounds().getNorthEast()):0;
    const range=meters<1000?Math.max(100,Math.round(meters/100)*100)+'m':(meters<10000?(meters/1000).toFixed(1):Math.round(meters/1000))+'km';
    $('map-subheading').textContent=camera?'지도 중심에서 약 '+range+' 범위 · 현재 지도 안의 기사':n?.level==='dong'?'이 동네가 확인된 기사만 모았습니다.':'빛나는 원을 눌러 그곳의 뉴스를 만나보세요.';
    const listHtml=shown.length?shown.slice(0,visibleLimit).map(articleCard).join('')+(shown.length>visibleLimit?'<button class="load-more" id="load-more">기사 더 보기 ('+Math.min(PAGE_SIZE,shown.length-visibleLimit)+'건)</button>':''):`<div class="empty"><span class="empty-mark" aria-hidden="true">⌖</span><h3>아직 모인 기사가 없어요.</h3><p>${state.onlyNew?'현재 기간·지역에 새 기사 기준을 충족하는 기사가 없습니다.':state.viewport?'현재 지도 안에 수집된 기사가 없습니다. 지도를 이동하거나 지도 안만을 해제해 보세요.':n?.level==='dong'?'이 동네까지 위치가 확인된 기사가 없습니다. 구·시 단위 기사를 이 동네로 추정해 넣지 않습니다.':'선택한 기간·지역에 수집된 기사가 없습니다.'}<br>기간을 넓히거나 상위 지역의 소식을 살펴보세요.</p><button id="empty-reset">${state.onlyNew?'전체 기사 보기':state.period!=='all'?'전체 기간으로 보기':n?'상위 지역 보기':'전국 기사 다시 보기'}</button></div>`;
    if(listHtml!==lastListHtml){$('article-list').innerHTML=listHtml;lastListHtml=listHtml;}
    $('new-basis').textContent=(saved>0&&saved<=sessionStarted?'이 브라우저의 지난 방문 이후':'첫 방문 · 최근 24시간')+' 발행 기사 기준';
    const unlocated=shown.filter(a=>!a.places.length).length;
    $('view-status').textContent=(state.category?(state.category==='all'?'전체 분야':state.category)+' · ':'')+(state.viewport?'현재 지도 안 · ':'선택 지역 전체 · ')+shown.length+'건'+(unlocated?' · 위치 미지정 '+unlocated+'건':'');
    $('snapshot-time').textContent=stamp(payload.collectedAt)+' 수집 · 일부 기사 · '+(payload.mode==='scheduled-snapshot'?'10분 주기 수집':'자동 갱신 미연결')+(refreshStatus?' · '+refreshStatus:'');
    syncControls();
  }
  function renderMarkers(){
    if(!map)return;
    const box=state.viewport?mapBox():null;
    let groups=rules.group(shown.map(a=>({...a,places:visiblePlaces(a,box)})),nodes,map.getZoom(),state.region);
    if(map.getZoom()<8){
      const clusters=[];
      for(const g of groups){
        const point=map.latLngToContainerPoint(g.node.center);
        const near=clusters.find(c=>map.latLngToContainerPoint(c.node.center).distanceTo(point)<48);
        if(near){
          near.members.push(g.node);
          for(const a of g.articles)if(!near.ids.has(a.id)){near.ids.add(a.id);near.articles.push(a);}
        }else clusters.push({...g,articles:[...g.articles],ids:new Set(g.articles.map(a=>a.id)),members:[g.node]});
      }
      groups=clusters;
    }
    const wanted=new Set(groups.map(g=>g.node.id));
    for(const [id,entry] of markerLayers)if(!wanted.has(id)){markers.removeLayer(entry.marker);markerLayers.delete(id);}
    groups.forEach((g,i)=>{
      const count=g.articles.length;
      const fresh=g.articles.filter(isNew).length;
      const size=Math.min(47,25+Math.sqrt(count)*3);
      const clustered=g.members?.length>1;
      const label=shortName(g.node)+(clustered?' 외 '+(g.members.length-1)+'곳':'');
      const unread=g.articles.some(hasUnreadPulse);
      const signature=JSON.stringify([payload.collectedAt,g.articles.map(a=>a.id),fresh,unread,state.motion,label]);
      const existing=markerLayers.get(g.node.id);
      if(existing?.signature===signature)return;
      if(existing)markers.removeLayer(existing.marker);
      const signalKey=g.node.id;
      const animate=state.motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&(now()<sessionStarted+5500||!seenSignals.has(signalKey));
      if(animate)seenSignals.add(signalKey);
      const icon=L.divIcon({className:'news-marker'+(fresh?' has-new':'')+(animate?' animate-new':'')+(unread?' pulse-unread':''),iconSize:[size,size],iconAnchor:[size/2,size/2],html:`<span class="dot">${count}</span><span class="marker-label">${esc(label)}</span>`});
      const marker=L.marker(g.node.center,{icon,keyboard:true,title:label+': '+count+'개 기사'+(fresh?', 새 기사 '+fresh+'개':''),alt:label+' 기사 보기',riseOnHover:true});
      marker.on('add',()=>{const el=marker.getElement();el.style.setProperty('--size',size+'px');el.style.setProperty('--delay',(i%4)*.12+'s');el.setAttribute('role','button');});
      marker.bindTooltip(esc(g.node.path.join(' '))+' · '+count+'건'+(fresh?' / 새 기사 '+fresh+'건':''),{direction:'top',offset:[0,-12]});
      marker.on('click',()=>{
        if(desktopPreview.matches){
          if(!clustered)selectPlace(g.node.id,{fit:false});
          openMapPreview(g,clustered);
          return;
        }
        if(clustered){map.setView(g.node.center,Math.max(8,map.getZoom()+1),{animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});return;}
        if(state.region===g.node.id){
          $('results').focus({preventScroll:true});
          if(matchMedia('(max-width:700px)').matches)sheet?.expand();
        }else selectPlace(g.node.id);
      });
      marker.addTo(markers);
      markerLayers.set(g.node.id,{marker,signature});
    });
    const showEmpty=shown.length===0;
    $('map-message').hidden=!showEmpty;
    if(showEmpty)$('map-message').textContent=state.viewport?'현재 지도 안에 모인 기사가 없습니다. 지도를 더 멀리 보거나 기간을 넓혀보세요.':'이 조건에 수집된 기사가 없습니다. 기간을 넓히거나 상위 지역을 선택해보세요.';
  }
  function render(mode='push'){if(mode==='push')visibleLimit=PAGE_SIZE;renderList();renderMarkers();updateUrl(mode);}
  function openMapPreview(group,clustered){
    if(!mapPreview){
      mapPreview=document.createElement('section');
      mapPreview.className='map-preview';mapPreview.setAttribute('aria-label','지도 기사 미리보기');
      document.querySelector('.map-stage').append(mapPreview);
      L.DomEvent.disableClickPropagation(mapPreview);
      L.DomEvent.disableScrollPropagation(mapPreview);
      mapPreview.addEventListener('click',markArticleRead);
      mapPreview.addEventListener('auxclick',markArticleRead);
      mapPreview.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMapPreview();$('map').focus({preventScroll:true});}});
    }
    const articles=[...group.articles].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
    const label=shortName(group.node)+(clustered?' 외 '+(group.members.length-1)+'곳':'');
    mapPreview.innerHTML=`<div class="map-preview-head"><strong>${esc(label)} <span>${articles.length}건</span></strong><button type="button" class="map-preview-close" aria-label="기사 미리보기 닫기">×</button></div><ol>${articles.slice(0,5).map(a=>`<li data-article="${esc(a.id)}"><a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a><time datetime="${esc(a.publishedAt)}">${esc(stamp(a.publishedAt))}</time></li>`).join('')}</ol><button type="button" class="map-preview-all">${clustered?'지역 확대해 전체 '+articles.length+'건 보기':'왼쪽 목록에서 전체 '+articles.length+'건 보기'} ↗</button>`;
    mapPreview.querySelector('.map-preview-close').onclick=closeMapPreview;
    mapPreview.querySelector('.map-preview-all').onclick=()=>{
      closeMapPreview();
      if(clustered){map.setView(group.node.center,Math.max(8,map.getZoom()+1),{animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});return;}
      selectPlace(group.node.id,{fit:false});$('results').focus({preventScroll:true});
    };
    mapPreview.hidden=false;
    const point=map.latLngToContainerPoint(group.node.center),size=map.getSize();
    const width=mapPreview.offsetWidth,height=mapPreview.offsetHeight;
    const left=point.x+34+width<=size.x-12?point.x+34:point.x-width-34;
    mapPreview.style.left=Math.max(12,Math.min(size.x-width-12,left))+'px';
    mapPreview.style.top=Math.max(12,Math.min(size.y-height-12,point.y-44))+'px';
    mapPreview.querySelector('.map-preview-close').focus({preventScroll:true});
  }
  function fitNational(){
    const mobile=matchMedia('(max-width:700px)').matches;
    const bounds=mobile?[[33.05,125.7],[38.65,129.65]]:[[33.05,124.9],[38.65,130.0]];
    map.fitBounds(bounds,{paddingTopLeft:[mobile?10:35,mobile?62:90],paddingBottomRight:[mobile?10:35,mobile?132:45],animate:false});
  }
  function drawBoundary(){
    if(!map)return;
    boundary.clearLayers();
    const n=nodes[state.region];
    if(!n||n.level==='province')return;
    const shapes=n.geometry?[n]:descendants(n.id,'dong').filter(x=>x.kind!=='locality');
    for(const shape of shapes)L.geoJSON(shape.geometry,{interactive:false,style:{color:'#647e53',weight:1.2,opacity:.6,fillColor:'#809b65',fillOpacity:.055}}).addTo(boundary);
  }
  function selectPlace(id,{fit=true,historyMode='push'}={}){
    userMapInteraction=false;
    state.region=nodes[id]?id:'';
    $('place-search').value='';
    closeSearch();
    state.viewport=false;
    if(!restoring)render(historyMode);
    drawBoundary();
    if(fit&&map){
      const n=nodes[state.region];
      if(n)map.fitBounds([[n.bbox[0],n.bbox[1]],[n.bbox[2],n.bbox[3]]],{paddingTopLeft:[35,110],paddingBottomRight:[45,65],maxZoom:15,animate:!restoring&&!matchMedia('(prefers-reduced-motion:reduce)').matches});
      else fitNational();
    }
    $('article-list').scrollTop=0;
  }
  function restoreUrl(){
    const next=readUrl();
    restoring=true;
    try{
      state.period=next.period;state.onlyNew=next.onlyNew;state.category=next.category;
      selectPlace(next.region,{historyMode:'none'});
      state.viewport=next.viewport;
      if(map&&next.viewport&&next.camera)map.setView(next.camera.slice(0,2),next.camera[2],{animate:false});
      render('none');
    }finally{restoring=false;}
  }
  window.addEventListener('popstate',restoreUrl);
  function closeSearch(){$('search-results').hidden=true;$('place-search').setAttribute('aria-expanded','false');}
  function search(){
    const q=$('place-search').value.trim().replace(/\s+/g,'');
    if(!q){closeSearch();return;}
    const counts=new Map();
    for(const article of payload.articles){const regions=new Set();for(const place of article.places){const parts=place.split('/');for(let i=1;i<=parts.length;i++)regions.add(parts.slice(0,i).join('/'));}for(const region of regions)counts.set(region,(counts.get(region)||0)+1);}
    searchMatches=geo.nodes.filter(n=>n.path.join('').includes(q)).sort((a,b)=>{
      const aExact=a.name===q?1:0,bExact=b.name===q?1:0;
      if(aExact!==bExact)return bExact-aExact;
      const ac=counts.get(a.id)||0,bc=counts.get(b.id)||0;
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
  document.addEventListener('click',event=>{const b=event.target.closest('[data-place]');if(b){const fromSearch=!!b.closest('#search-results');selectPlace(b.dataset.place);if(fromSearch||b.classList.contains('place-link'))sheet?.collapse();}else if(!event.target.closest('.finder'))closeSearch();});
  $('province').addEventListener('change',()=>selectPlace($('province').value));
  $('district').addEventListener('change',()=>selectPlace($('district').value||$('province').value));
  $('dong').addEventListener('change',()=>selectPlace($('dong').value||$('district').value));
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{state.period=button.dataset.period;render();}));
  $('all-tab').addEventListener('click',()=>{state.onlyNew=false;render();});
  $('new-tab').addEventListener('click',()=>{state.onlyNew=true;render();});
  $('viewport-toggle').addEventListener('click',()=>{state.viewport=!state.viewport;render();});
  function closeCategories(){$('category-panel').hidden=true;$('category-toggle').setAttribute('aria-expanded','false');}
  $('category-toggle').addEventListener('click',()=>{const open=$('category-panel').hidden;$('category-panel').hidden=!open;$('category-toggle').setAttribute('aria-expanded',String(open));});
  $('category-panel').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;closeCategories();selectPlace('');});
  $('category-panel').addEventListener('keydown',event=>{if(event.key==='Escape'){closeCategories();$('category-toggle').focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('#category-panel,#category-toggle'))closeCategories();});
  $('motion-toggle').addEventListener('click',()=>{state.motion=!state.motion;store.set('newsmap:motion',state.motion?'on':'off');if(state.motion)seenSignals.clear();syncControls();renderMarkers();});
  function markArticleRead(event){
    if(event.type==='auxclick'&&event.button!==1)return;
    const link=event.target.closest('a'),card=link?.closest('[data-article]');
    if(!card||!safeUrl(link.href))return;
    readArticles.add(card.dataset.article);
    store.set('newsmap:read:v1',JSON.stringify([...readArticles].slice(-10000)));
    renderMarkers();
  }
  $('article-list').addEventListener('click',markArticleRead);
  $('article-list').addEventListener('auxclick',markArticleRead);
  $('article-list').addEventListener('click',event=>{if(event.target.id==='load-more'){visibleLimit+=PAGE_SIZE;renderList();return;}if(event.target.id!=='empty-reset')return;if(state.onlyNew){state.onlyNew=false;render();}else if(state.period!=='all'){state.period='all';render();}else selectPlace(nodes[state.region]?.parent||'');});
  $('reset-map').addEventListener('click',()=>selectPlace(''));
  $('zoom-in').addEventListener('click',()=>{userMapInteraction=true;map?.zoomIn();});
  $('zoom-out').addEventListener('click',()=>{userMapInteraction=true;map?.zoomOut();});
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
  function refreshData(silent=false){
    const button=$('refresh');button.disabled=true;button.setAttribute('aria-busy','true');
    if(!silent){refreshStatus='데이터 다시 확인 중…';renderList();}
    const script=document.createElement('script');script.src='data/articles.js?v='+now();
    let finished=false,changed=false;
    const timeout=window.setTimeout(()=>finish(false),15000);
    const finish=ok=>{
      if(finished)return;finished=true;window.clearTimeout(timeout);
      refreshStatus=ok?'배포된 데이터 확인 완료':'재확인 실패 · 기존 기사 유지';
      button.disabled=false;button.removeAttribute('aria-busy');script.remove();
      if(!ok)window.NEWSMAP_ARTICLES=payload;
      if(!silent||changed)render('replace');
    };
    script.onload=()=>{
      const next=window.NEWSMAP_ARTICLES;
      const valid=Array.isArray(next?.articles)&&Number.isFinite(Date.parse(next?.collectedAt))&&next.articles.every(a=>a&&typeof a.id==='string'&&typeof a.title==='string'&&Number.isFinite(Date.parse(a.publishedAt))&&Array.isArray(a.places)&&(a.places.length||a.newsCategory)&&a.places.every(p=>nodes[p])&&(!a.relatedPlaces||(Array.isArray(a.relatedPlaces)&&a.relatedPlaces.every(p=>nodes[p])))&&safeUrl(a.url));
      changed=valid&&next.collectedAt!==payload.collectedAt;
      if(valid)payload=next;
      finish(valid);
    };
    script.onerror=()=>finish(false);
    document.head.append(script);
  }
  $('refresh').addEventListener('click',()=>refreshData());
  window.setInterval(()=>{if(!document.hidden&&!$('refresh').disabled)refreshData(true);},60000);
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
    map.on('movestart zoomstart resize click',closeMapPreview);
    const manualMove=()=>{userMapInteraction=true;};
    map.on('dragstart',manualMove);
    $('map').addEventListener('wheel',manualMove,{passive:true,capture:true});
    $('map').addEventListener('dblclick',manualMove,{capture:true});
    $('map').addEventListener('touchstart',event=>{if(event.touches.length>1)manualMove();},{passive:true});
    $('map').addEventListener('keydown',event=>{if(['+','-','=','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))manualMove();},{capture:true});
    map.on('moveend',()=>{
      if(restoring)return;
      if(userMapInteraction){
        userMapInteraction=false;state.region='';state.viewport=map.getZoom()>=8;visibleLimit=PAGE_SIZE;
        drawBoundary();renderList();updateUrl('replace');
      }else if(state.viewport){renderList();updateUrl('replace');}
      renderMarkers();
    });
    // The initial national fit must not overwrite a shared viewport URL.
    restoring=true;
    fitNational();
    new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
    restoreUrl();
    loadBackground();
  }else{
    restoreUrl();$('map-message').hidden=false;$('map-message').textContent='지도 라이브러리를 불러오지 못했습니다. 지역 선택과 기사 목록을 이용해 주세요.';
  }
  // Static script URLs may be cached across releases; verify current data immediately.
  refreshData(true);
  window.NewsmapApp={state,nodes,get articles(){return payload.articles;},get shown(){return shown;},selectPlace,render,get map(){return map;},cutoff};
})();
