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
function boot({missing=false,search='',withMap=false}={}){
  const ids=Object.fromEntries([...read('index.html').matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const periods=['24','168','720','all'].map(period=>Object.assign(new Element(),{dataset:{period}}));
  const events={},location={pathname:'/newsmap/',search,hash:''},calls=[];
  let pending,expanded=false;
  const ctx={URL,URLSearchParams,Intl,Date,Option:class{},matchMedia:()=>({matches:false}),location,
    localStorage:{getItem:()=>null,setItem(){}},history:{},
    document:{getElementById:id=>ids[id],querySelector:()=>new Element(),querySelectorAll:()=>periods,
      addEventListener(){},body:{classList:{toggle(){}}},createElement:()=>new Element(),head:{append:script=>pending=script}},
    window:{setTimeout:()=>1,clearTimeout(){},setInterval:(fn)=>events.poll=fn,addEventListener:(name,fn)=>events[name]=fn,NewsmapSheet:()=>({update(){},collapse(){},expand(){expanded=true;}})}};
  for(const mode of ['pushState','replaceState'])ctx.history[mode]=(_,__,url)=>{
    calls.push({mode,url});const parsed=new URL(url,'https://example.test');location.search=parsed.search;
  };
  const mapEvents={};
  const fakeMap={zoom:6,center:{lat:37.5665,lng:126.978},bounds:[33,124,39,132],attributionControl:{setPrefix(){}},
    on(name,fn){mapEvents[name]=fn;return this;},getZoom(){return this.zoom;},getCenter(){return this.center;},
    getBounds(){const b=this.bounds;return {getSouth:()=>b[0],getWest:()=>b[1],getNorth:()=>b[2],getEast:()=>b[3],getNorthEast:()=>({lat:b[2],lng:b[3]})};},
    fitBounds(){return this;},setView(center,zoom){this.center={lat:center[0],lng:center[1]};this.zoom=zoom;return this;},
    latLngToContainerPoint(){return {distanceTo:()=>1000};},distance:()=>10000,removeLayer(){},invalidateSize(){},
    zoomIn(){this.zoom++;},zoomOut(){this.zoom--;}};
  if(withMap){
    const layer=()=>({addTo(){return this;},clearLayers(){},on(){return this;},bindTooltip(){return this;}});
    ctx.L=ctx.window.L={map:()=>fakeMap,tileLayer:layer,layerGroup:layer,geoJSON:layer,marker:layer,divIcon:x=>x};
    ctx.ResizeObserver=class{observe(){}};
  }
  vm.createContext(ctx);
  for(const file of ['core.js','data/geography.js','data/articles.js'])vm.runInContext(read(file),ctx);
  if(missing)delete ctx.window.NEWSMAP_ARTICLES;
  vm.runInContext(read('app.js'),ctx);
  return {ctx,ids,periods,events,calls,mapEvents,fakeMap,get pending(){return pending;},get expanded(){return expanded;}};
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
assert.match(app.ids['snapshot-time'].textContent,/재확인 실패/);
assert.equal(app.ids.refresh.disabled,false);
app.ids.refresh.events.click();app.pending.onerror();
assert.equal(api.articles,previous,'Network failure must preserve articles.');
app.ids.refresh.events.click();app.ctx.window.NEWSMAP_ARTICLES={articles:[],collectedAt:new Date().toISOString()};app.pending.onload();
assert.equal(api.articles.length,0,'A valid empty snapshot is not a load failure.');
assert.match(app.ids['snapshot-time'].textContent,/확인 완료/);
assert.match(app.ids['article-list'].innerHTML,/아직 모인/);
const broken=boot({missing:true});
assert(broken.expanded,'A mobile load error must be reachable inside the sheet.');
assert.match(broken.ids['snapshot-time'].textContent,/로드 실패/);
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
camera.ctx.window.NEWSMAP_ARTICLES={collectedAt:new Date().toISOString(),articles:[{id:'multi',title:'두 지역 소식',category:'사회',url:'https://www.newsis.com/view/NISX20261023_0000000001',publishedAt:new Date().toISOString(),places:['부산광역시','서울특별시/성동구']}]};
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
console.log('PASS: URL filters, history restoration, refresh loading/success/error, malformed data retention, empty data and initial load failure.');
