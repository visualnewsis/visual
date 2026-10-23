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
function boot({missing=false,search=''}={}){
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
  vm.createContext(ctx);
  for(const file of ['core.js','data/geography.js','data/articles.js'])vm.runInContext(read(file),ctx);
  if(missing)delete ctx.window.NEWSMAP_ARTICLES;
  vm.runInContext(read('app.js'),ctx);
  return {ctx,ids,periods,events,calls,get pending(){return pending;},get expanded(){return expanded;}};
}
const app=boot(),api=app.ctx.window.NewsmapApp;
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
console.log('PASS: URL filters, history restoration, refresh loading/success/error, malformed data retention, empty data and initial load failure.');
