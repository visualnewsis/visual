/* Exercise the real app with a small DOM double; no network or browser required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
class Element{
  constructor(){this.events={};this.attrs={};this.value='';this.dataset={};this.classList={toggle(){}};}
  addEventListener(name,fn){this.events[name]=fn;}
  setAttribute(name,value){this.attrs[name]=value;}
  removeAttribute(name){delete this.attrs[name];}
  replaceChildren(){}
  add(){}
  focus(){}
  querySelector(){return new Element();}
  remove(){}
}
function makeArticle(overrides={}){
  const a={id:'NISX20261103_0000000001',title:'지역 소식',newsCategory:'사회',category:'사회',policyVersion:require('../core.js').POLICY_VERSION,domesticPolicy:'accepted',feeds:['society'],evidence:[],url:'https://www.newsis.com/view/NISX20261103_0000000001',publishedAt:new Date().toISOString(),places:['서울특별시/성동구'],...overrides};
  a.localPlaces=[...a.places];a.relatedPlaces=overrides.relatedPlaces||[...a.places];a.localEligible=!!a.places.length;return a;
}
const makeSnapshot=(articles,overrides={})=>({schemaVersion:1,policyVersion:require('../core.js').POLICY_VERSION,mode:'scheduled-snapshot',retentionDays:30,excludedInternational:{},collectedAt:new Date().toISOString(),articles,...overrides});
function boot({missing=false,search='',withMap=false,mobile=false,storage=new Map(),snapshot=null}={}){
  const ids=Object.fromEntries([...read('index.html').matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const periods=['24','168','720','all'].map(period=>Object.assign(new Element(),{dataset:{period}}));
  const modeButtons=['','all'].map(category=>Object.assign(new Element(),{dataset:{category}}));
  const events={},location={pathname:'/newsmap/',search,hash:''},calls=[];
  let pending,expanded=false,markerBuilds=0;const capturedMarkers=[];
  const ctx={URL,URLSearchParams,Intl,Date,Option:class{},matchMedia:q=>({matches:mobile&&q.includes('max-width:700px'),addEventListener(){}}),location,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},history:{},
    document:{getElementById:id=>ids[id],querySelector:()=>new Element(),querySelectorAll:selector=>selector==='[data-category]'?modeButtons:periods,
      addEventListener(){},body:{classList:{toggle(){}}},createElement:()=>new Element(),head:{append:script=>pending=script}},
    window:{setTimeout:()=>1,clearTimeout(){},setInterval:(fn)=>events.poll=fn,addEventListener:(name,fn)=>events[name]=fn,NewsmapSheet:()=>({update(){},collapse(){},expand(){expanded=true;}})}};
  for(const mode of ['pushState','replaceState'])ctx.history[mode]=(_,__,url)=>{
    calls.push({mode,url});const parsed=new URL(url,'https://example.test');location.search=parsed.search;
  };
  const mapEvents={};
  const fakeMap={zoom:6,center:{lat:37.5665,lng:126.978},bounds:[33,124,39,132],attributionControl:{setPrefix(){}},
    on(name,fn){mapEvents[name]=fn;return this;},getZoom(){return this.zoom;},getCenter(){return this.center;},
    getBounds(){const b=this.bounds;return {getSouth:()=>b[0],getWest:()=>b[1],getNorth:()=>b[2],getEast:()=>b[3],getNorthEast:()=>({lat:b[2],lng:b[3]})};},
    fitBounds(bounds,options){this.lastFit={bounds,options};return this;},setView(center,zoom){this.center={lat:center[0],lng:center[1]};this.zoom=zoom;return this;},
    latLngToContainerPoint(){return {distanceTo:()=>1000};},distance:()=>10000,removeLayer(){},invalidateSize(){},
    zoomIn(){this.zoom++;},zoomOut(){this.zoom--;}};
  if(withMap){
    const layer=()=>({addTo(){return this;},clearLayers(){},removeLayer(){},on(){return this;},bindTooltip(){return this;}});
    ctx.L=ctx.window.L={map:()=>fakeMap,tileLayer:layer,layerGroup:layer,geoJSON:layer,marker:(center,options)=>{markerBuilds++;const entry=layer(),handlers={};entry.on=(name,fn)=>{handlers[name]=fn;return entry;};capturedMarkers.push({center,options,handlers});return entry;},divIcon:x=>x};
    ctx.ResizeObserver=class{observe(){}};
  }
  vm.createContext(ctx);
  for(const file of ['core.js','data/geography.js','data/articles.js'])vm.runInContext(read(file),ctx);
  if(snapshot)ctx.window.NEWSMAP_ARTICLES=snapshot;
  if(missing)delete ctx.window.NEWSMAP_ARTICLES;
  vm.runInContext(read('app.js'),ctx);
  return {ctx,ids,periods,modeButtons,events,capturedMarkers,storage,calls,mapEvents,fakeMap,get pending(){return pending;},get expanded(){return expanded;},get markerBuilds(){return markerBuilds;}};
}
const app=boot(),api=app.ctx.window.NewsmapApp;
assert.equal(api.state.motion,true,'Waves must default to on.');
assert.match(app.pending.src,/^data\/articles\.js\?v=/,'Opening the page must immediately bypass the cached snapshot.');
app.periods[3].events.click();
assert.equal(api.state.period,'all');
assert.equal(app.calls.at(-1).mode,'pushState');
api.selectPlace('서울특별시');
assert.equal(api.state.region,'서울특별시');
assert(app.ctx.location.search.includes('place='));
app.ids['viewport-toggle'].events.click();
assert(app.ctx.location.search.includes('view=map'));
app.ctx.location.search='?period=168';app.events.popstate();
assert.equal(api.state.region,'');assert.equal(api.state.period,'168');assert.equal(api.state.viewport,false);
const historyCount=app.calls.length;app.events.popstate();assert.equal(app.calls.length,historyCount,'Restoring history must not add entries.');
const previous=api.articles;
app.ids.refresh.events.click();
assert.equal(app.ids.refresh.attrs['aria-busy'],'true');
assert.match(app.ids['snapshot-time'].textContent,/확인 중/);
app.ctx.window.NEWSMAP_ARTICLES={articles:[{}],collectedAt:'invalid'};app.pending.onload();
assert.equal(api.articles,previous,'Malformed refresh must preserve the previous articles.');
assert.match(app.ids['snapshot-time'].textContent,/(재확인|로드) 실패/);
assert.equal(app.ids.refresh.disabled,false);
app.ids.refresh.events.click();app.pending.onerror();
assert.equal(api.articles,previous,'Network failure must preserve articles.');
app.ids.refresh.events.click();app.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([]);app.pending.onload();
assert.equal(api.articles.length,0,'A valid empty snapshot is not a load failure.');
assert.match(app.ids['snapshot-time'].textContent,/확인 완료/);
assert.match(app.ids['article-list'].innerHTML,/아직 모인/);
const broken=boot({missing:true});
assert(broken.expanded,'A mobile load error must be reachable inside the sheet.');
assert.match(broken.ids['snapshot-time'].textContent,/검증된 기사/);
assert.match(broken.ids['article-list'].innerHTML,/불러오는 중/);
broken.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);broken.pending.onload();
assert.equal(broken.ctx.window.NewsmapApp.articles.length,1,'Missing initial snapshot must recover without reloading the whole page');
const invalid=boot({search:'?place=missing&period=bad&view=map&lat=NaN&lng=999&zoom=100'});
assert.equal(invalid.ctx.window.NewsmapApp.state.region,'');
assert.equal(invalid.ctx.window.NewsmapApp.state.period,'24');
assert.equal(invalid.ctx.window.NewsmapApp.state.camera,null);
const camera=boot({withMap:true}),cameraApi=camera.ctx.window.NewsmapApp;
cameraApi.selectPlace('서울특별시/중구/필동',{fit:false});
camera.mapEvents.moveend();
assert.equal(cameraApi.state.region,'서울특별시/중구/필동','Programmatic fitting must preserve explicit region selection.');
camera.fakeMap.zoom=10;camera.ids.map.events.wheel();camera.mapEvents.moveend();
assert.equal(cameraApi.state.region,'','Manual zoom must release the stale dong filter.');
assert.equal(cameraApi.state.viewport,true);
assert.match(camera.ids['map-heading'].textContent,/서울 주변/);
assert.match(camera.ids['map-subheading'].textContent,/10km/);
camera.fakeMap.bounds=[37.4,126.8,37.7,127.2];
camera.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({title:'두 지역 소식',places:['부산광역시','서울특별시/성동구']})]);
camera.pending.onload();
assert.match(camera.ids['article-list'].innerHTML,/⌖ 서울/,'A multi-place article must label its visible location.');
assert.doesNotMatch(camera.ids['article-list'].innerHTML,/⌖ 부산/,'Offscreen locations must not become the card location.');
camera.fakeMap.center={lat:35.1796,lng:129.0756};camera.fakeMap.zoom=12;
camera.mapEvents.dragstart();camera.mapEvents.moveend();
assert.match(camera.ids.breadcrumb.textContent,/부산광역시/,'Dragging must follow the visible city.');
camera.fakeMap.zoom=8;camera.ids['zoom-out'].events.click();camera.mapEvents.moveend();
assert.equal(cameraApi.state.viewport,false);
assert.equal(camera.ids['map-heading'].textContent,'전국에서 전해온 이야기');
assert.equal(cameraApi.state.region,'');
const beforeMarkers=camera.markerBuilds;
cameraApi.render();cameraApi.render();
assert.equal(camera.markerBuilds,beforeMarkers,'An unchanged view must preserve existing markers and their pulse animations.');
console.log('PASS: URL filters, history restoration, refresh loading/success/error, malformed data retention, empty data and initial load failure.');

cameraApi.selectPlace('서울특별시/성동구',{fit:false});
camera.ids['news-modes'].events.click({target:{closest:()=>({dataset:{category:'all'}})}});
assert.equal(cameraApi.state.category,'all');
assert.equal(camera.modeButtons[0].attrs['aria-pressed'],'false');
assert.equal(camera.modeButtons[1].attrs['aria-pressed'],'true');
assert.equal(cameraApi.state.region,'서울특별시/성동구','Switching news modes must preserve the selected region');
camera.ids['news-modes'].events.click({target:{closest:()=>({dataset:{category:'국제'}})}});
assert.equal(cameraApi.state.category,'all','Removed category controls cannot activate an international mode');
const legacyRow={id:'legacy-foreign',title:'미국 중간선거',newsCategory:'국제',url:'https://www.newsis.com/view/NISX20261023_0000000001',publishedAt:new Date().toISOString(),places:['서울특별시/성동구']};
cameraApi.state.period='all';
const cleanBeforeLegacy=cameraApi.articles;
camera.ids.refresh.events.click();
camera.ctx.window.NEWSMAP_ARTICLES={collectedAt:new Date().toISOString(),articles:[legacyRow]};
camera.pending.onload();cameraApi.render();
assert.equal(cameraApi.articles,cleanBeforeLegacy,'Legacy refresh must preserve the last clean articles');
assert.doesNotMatch(camera.ids['article-list'].innerHTML,/미국 중간선거/,'Legacy data must never reappear after a refresh');
console.log('PASS: mode switch preserves region, removed category rejection, legacy refresh stays hidden');

const guarded=boot(),guardApi=guarded.ctx.window.NewsmapApp;
guarded.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({title:'검증된 정상 기사'})]);guarded.pending.onload();
const cleanGuard=guardApi.articles;
guarded.ids.refresh.events.click();guarded.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([],{collectedAt:'2000-01-01T00:00:00Z'});guarded.pending.onload();
assert.equal(guardApi.articles,cleanGuard,'Older responses must never replace clean data');
assert.match(guarded.ids['snapshot-time'].textContent,/(재확인|로드) 실패/);
const corrected=makeSnapshot([makeArticle({title:'동일 시각 정정 기사'})],{collectedAt:guarded.ctx.window.NEWSMAP_ARTICLES.collectedAt});
guarded.events.poll();guarded.ctx.window.NEWSMAP_ARTICLES=corrected;guarded.pending.onload();
assert.match(guarded.ids['article-list'].innerHTML,/동일 시각 정정 기사/,'A silent same-time content correction must render immediately');
assert.equal(guardApi.shown.length,guardApi.articles.length);
const mobileFirst=boot({withMap:true,mobile:true,snapshot:makeSnapshot([makeArticle()])});
mobileFirst.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);mobileFirst.pending.onload();
const mobileMarker=mobileFirst.capturedMarkers.find(m=>!m.options.title.includes(' 외 '));
assert(mobileMarker,'A valid local article must create a mobile marker');
assert.equal(mobileFirst.expanded,false);mobileMarker.handlers.click();
assert.equal(mobileFirst.expanded,true,'A non-cluster marker must open the mobile article sheet on the first tap');
const mobileCluster=boot({withMap:true,mobile:true,snapshot:makeSnapshot([makeArticle()])});
mobileCluster.fakeMap.latLngToContainerPoint=()=>({distanceTo:()=>0});
mobileCluster.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({places:['서울특별시/성동구','부산광역시/부산진구']})]);mobileCluster.pending.onload();
const clusterMarker=mobileCluster.capturedMarkers.find(m=>m.options.title.includes(' 외 '));
assert(clusterMarker);clusterMarker.handlers.click();
assert.equal(mobileCluster.expanded,false,'A cluster first tap must still zoom instead of opening an ambiguous sheet');
assert.equal(mobileCluster.fakeMap.zoom,8);
console.log('PASS: invalid/older refresh preserves clean data, same-time silent corrections render, first mobile tap opens articles, cluster tap still zooms');

const savedVisit=String(Date.now()-3600000),savedBatch=JSON.stringify({collectedAt:'2026-11-03T00:00:00Z',known:['preserved'],active:['preserved']});
const preservedStorage=new Map([['newsmap:lastVisit:v1',savedVisit],['newsmap:pulse-batch:v1',savedBatch]]);
const initialInvalid=boot({missing:true,storage:preservedStorage});
assert.equal(preservedStorage.get('newsmap:lastVisit:v1'),savedVisit,'An invalid initial payload must not record a successful visit');
assert.equal(preservedStorage.get('newsmap:pulse-batch:v1'),savedBatch,'An invalid initial payload must not reset pulse history');
initialInvalid.pending.onerror();assert.match(initialInvalid.ids['article-list'].innerHTML,/불러오지 못했습니다/);
initialInvalid.ids.refresh.events.click();initialInvalid.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);initialInvalid.pending.onload();
assert.equal(initialInvalid.ctx.window.NewsmapApp.shown.length,1);
assert.notEqual(preservedStorage.get('newsmap:lastVisit:v1'),savedVisit);
console.log('PASS: invalid initial snapshot shows recovery UI, preserves visit/pulse history and recovers to a verified snapshot');

const sourceConflict=makeSnapshot([makeArticle({sourceSection:'국제'})]);
const initialSourceConflict=boot({snapshot:sourceConflict});
assert.equal(initialSourceConflict.ctx.window.NewsmapApp.articles.length,0,'An international source section must fail initial validation');
const cleanBeforeSection=guardApi.articles;
guarded.ids.refresh.events.click();guarded.ctx.window.NEWSMAP_ARTICLES=sourceConflict;guarded.pending.onload();
assert.equal(guardApi.articles,cleanBeforeSection,'An international source section in refresh must preserve the last clean data');
console.log('PASS: source-section veto applies to both initial load and refresh');

const agedTime=Date.now()-2*3600000,previousVisit=String(agedTime-3600000),watermarkStorage=new Map([['newsmap:lastVisit:v1',previousVisit]]);
const agedSnapshot=makeSnapshot([makeArticle({publishedAt:new Date(agedTime-60000).toISOString()})],{collectedAt:new Date(agedTime).toISOString()});
const aged=boot({snapshot:agedSnapshot,storage:watermarkStorage});
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),String(agedTime),'A successful visit only observes the collected data time');
assert.equal(aged.ctx.window.NewsmapApp.cutoff,Number(previousVisit),'Session newness must retain the previous visit cutoff');
assert.match(aged.ids['snapshot-time'].textContent,/수집 지연 · 마지막 확인 자료/);
assert.match(aged.ids['view-status'].textContent,/수집 지연/,'Compact mobile status must also expose delayed collection');
assert.equal(aged.ctx.window.NewsmapApp.articles.length,1,'Delayed valid data must remain usable');
const beforeFailureWatermark=watermarkStorage.get('newsmap:lastVisit:v1');
aged.ids.refresh.events.click();aged.pending.onerror();
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),beforeFailureWatermark,'A failed refresh must not advance the visit watermark');
const observedLater=agedTime+30*60000;
aged.ids.refresh.events.click();aged.ctx.window.NEWSMAP_ARTICLES=makeSnapshot(agedSnapshot.articles,{collectedAt:new Date(observedLater).toISOString()});aged.pending.onload();
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),String(observedLater),'Refresh advances the watermark only to the received collection time');
assert.equal(aged.ctx.window.NewsmapApp.cutoff,Number(previousVisit));
const almostStale=Date.now()-29*60000;
const unchangedSnapshot=makeSnapshot([makeArticle({publishedAt:new Date(almostStale-60000).toISOString()})],{collectedAt:new Date(almostStale).toISOString()});
const aging=boot({withMap:true,snapshot:unchangedSnapshot}),beforeAgeMarkers=aging.markerBuilds,beforeAgeHtml=aging.ids['article-list'].innerHTML;
assert.doesNotMatch(aging.ids['snapshot-time'].textContent,/수집 지연/);
aging.ctx.Date=class extends Date{static now(){return almostStale+31*60000;}};
aging.events.poll();aging.ctx.window.NEWSMAP_ARTICLES=unchangedSnapshot;aging.pending.onload();
assert.match(aging.ids['snapshot-time'].textContent,/수집 지연 · 마지막 확인 자료/,'Unchanged silent refresh still updates the age warning');
assert.equal(aging.markerBuilds,beforeAgeMarkers,'Age warning updates must not rebuild map markers');
assert.equal(aging.ids['article-list'].innerHTML,beforeAgeHtml,'Age warning updates must not replace article cards');
assert.equal(aging.storage.get('newsmap:lastVisit:v1'),String(almostStale),'Unchanged old data must not advance the watermark to browser time');
console.log('PASS: observed-data visit watermark, fixed session cutoff, delayed-data warning and status-only silent refresh');

const nationalDesktop=boot({withMap:true,snapshot:makeSnapshot([makeArticle()])});
assert.equal(nationalDesktop.fakeMap.lastFit.options.paddingBottomRight[1],105,'Desktop national fit must reserve the bottom legend and marker labels');
const nationalMobile=boot({withMap:true,mobile:true,snapshot:makeSnapshot([makeArticle()])});
assert.equal(nationalMobile.fakeMap.lastFit.options.paddingBottomRight[1],132,'Mobile national fit must preserve the existing drawer reserve');
console.log('PASS: national view reserves marker labels above the desktop legend and keeps mobile padding');
