const assert=require('node:assert/strict'),R=require('../world-core.js');
const now=Date.parse('2026-11-10T02:00:00Z');
const a=(id,locations,publishedAt='2026-11-10T01:00:00Z')=>({id:'NISX20261110_'+id,url:'https://www.newsis.com/view/NISX20261110_'+id,title:'국제 뉴스 '+id,publishedAt,locations});
const l=(country,role='related')=>({country,role,evidence:['기사에서 확인한 국가']});
const articles=[a('1',[l('US'),l('CN')]),a('2',[]),a('3',[l('CN','place')],'2026-11-08T01:00:00Z')];
const world={schemaVersion:1,policyVersion:R.VERSION,collectedAt:'2026-11-10T02:00:00Z',articles};
assert(R.valid(world,{now}));
assert(!R.valid({...world,articles:[...articles,articles[0]]},{now}));
assert(!R.valid({...world,collectedAt:'2026-11-11T02:00:00Z'},{now}));
assert(!R.valid(world,{now,previousTime:now+1}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[l('US'),l('US')]}]},{now}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[null]}]},{now}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[{}]}]},{now}));
assert.equal(R.filter(articles,{now}).length,3);
assert.equal(R.filter(articles,{country:'CN',now}).length,2);
assert.equal(R.filter(articles,{country:'unlocated',now}).length,1);
assert.equal(R.filter(articles,{period:'24',now}).length,2);
assert.equal(R.filter(articles,{onlyNew:true,cutoff:now-3600001,now}).length,2);
assert.equal(R.filter([...articles,articles[0]],{now}).length,3);
assert.deepEqual(R.groups(articles).map(g=>[g.country,g.count,g.placeCount]),[['US',1,0],['CN',2,1]]);
console.log('PASS: world schema/chronology/ID validation, period, location-unknown, country filtering, multi-country non-additive counts, unique overall article count.');

const points=[{country:'SG',x:100,y:100},{country:'MY',x:120,y:100}];
assert.equal(R.nearestCountry(points,[102,104],14),'SG');
assert.equal(R.nearestCountry(points,[119,100],14),'MY');
assert.equal(R.nearestCountry(points,[140,130],14),null);
console.log('PASS: rendered country dots win over polygon containment; nearest adjacent country selected; distant point ignored.');

const unknownCountry=JSON.parse(JSON.stringify(world));
if(unknownCountry.articles.length){unknownCountry.articles[0].locations=[{country:'ZZ',role:'related',evidence:['unknown']}];assert.equal(R.valid(unknownCountry,{now}),false);}


const eightHoursAgo=now-8*3600000;
const visitArticles=[a('10',[l('US')],new Date(now-9*3600000).toISOString()),a('11',[l('CN')],new Date(now-2*3600000).toISOString())];
const entrySignals=R.signals(visitArticles,{cutoff:eightHoursAgo,entry:0});
assert.equal(entrySignals.find(g=>g.country==='US').pulsePriority,0);
assert.equal(entrySignals.find(g=>g.country==='CN').pulsePriority,1,'Eight-hour revisit prioritizes articles published during the absence.');
assert.equal(R.signals(visitArticles.slice().reverse(),{entry:0})[1].pulseKey,entrySignals[0].pulseKey,'Order-only changes must not replay a country.');
assert.notEqual(R.signals(visitArticles,{entry:1})[0].pulseKey,entrySignals[0].pulseKey,'A fresh world entry gets an introduction.');
assert.notEqual(R.signals([...visitArticles,a('12',[l('US')])],{entry:0})[0].pulseKey,entrySignals[0].pulseKey,'A new article changes its country key.');
assert.deepEqual(R.signals([a('13',[])],{entry:0}),[],'Never invent a country for unlocated articles.');
console.log('PASS: eight-hour return, first-entry guidance, content-stable keys and unlocated-data behavior.');

// Execute the production renderer against real D3 projections with a controlled
// clock. Pulses must cover dots even when their HTML labels are collision-hidden.
{
  const vm=require('node:vm'),fs=require('node:fs');
  let clock=0,nextFrame=0,arcs=[],reduced=false,mobile=false,compact=false,peek=150,clipCircle;
  let bounds={left:0,top:0,width:1000,height:700},circles=[],reservedBoxes=[];
  const frames=new Map();
  class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.attrs={};this.hidden=false;this.listeners={};this.classes=new Set();this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)};}
    append(...children){this.children.push(...children);}
    querySelector(tag){return this.children.find(c=>c.tag===tag);}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,fn){this.listeners[k]=fn;}
    remove(){}
    getBoundingClientRect(){return bounds;}
  }
  const context2d=new Proxy({arc:(x,y,r)=>{arcs.push(r);circles.push({x,y,r});},clip:()=>{clipCircle=circles.at(-1);},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const canvas=new Element('canvas');canvas.getContext=()=>context2d;
  const pins=new Element(),spin=new Element();spin.append(new Element('span'));
  const nodes={'#world-canvas':canvas,'#world-canvas-wrap':new Element(),'#world-pins':pins,'#world-spin':spin,'#world-map-notice':new Element()};
  const root={querySelector:s=>nodes[s],querySelectorAll:()=>reservedBoxes.map(box=>({getBoundingClientRect:()=>box}))};
  const sandbox={console,Map,Set,Math,performance:{now:()=>clock},document:{createElement:tag=>new Element(tag)},matchMedia:query=>({get matches(){return query.includes('reduced-motion')?reduced:query.includes('max-width')?mobile:query.includes('max-height')?compact:false;},addEventListener(){}}),ResizeObserver:class {observe(){}},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)};
  sandbox.getComputedStyle=()=>({height:peek+'px'});
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  for(const file of ['vendor/d3-array.min.js','vendor/d3-geo.min.js','world-globe.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),sandbox);
  const renderer=sandbox.NewsmapGlobe(root,{features:[]},()=>{});
  const group=(key,pulse=true)=>({country:'US',name:'미국',count:1,placeCount:1,center:[-100,30],pulse,pulseKey:key});
  function drawAt(time){clock=time;arcs=[];circles=[];const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));return arcs.filter(r=>r>5&&r<=22).length;}
  renderer.update([group('batch1'),{...group('batch1'),country:'CA',name:'캐나다'}],'',true);
  drawAt(0);assert(drawAt(500)>0,'Entry rings must start on first visible paint.');
  assert(pins.children.some(el=>el.hidden),'Fixture must include a collision-hidden label.');
  assert(arcs.filter(r=>r>5&&r<=22).length>=2,'Hidden label country must still have a Canvas pulse.');
  drawAt(6500);assert.equal(frames.size,0,'Finite pulses must stop scheduling frames.');
  renderer.update([group('batch1')],'',true);assert.equal(drawAt(6600),0,'Same key must not replay.');
  renderer.update([group('batch2')],'',true);drawAt(6600);assert(drawAt(7100)>0,'A new article key must replay the country.');
  renderer.update([group('batch2',false)],'',true);assert.equal(drawAt(7200),0,'Motion-off must stop rings.');assert.equal(frames.size,0);
  renderer.update([group('batch3')],'',true);renderer.setActive(false);assert.equal(frames.size,0,'Hidden world view must cancel animation.');
  clock=14000;renderer.setActive(true);drawAt(clock);assert(drawAt(14500)>0,'A hidden page must not consume its first visible pulse.');drawAt(21000);assert.equal(frames.size,0);
  renderer.update([{...group('batch4'),center:[115,18]}],'',false);drawAt(21000);assert(drawAt(21500)>0,'Globe entry must retain rings.');
  drawAt(28000);assert.equal(frames.size,0);
  reduced=true;renderer.update([{...group('batch5'),center:[115,18]}],'',false);assert.equal(drawAt(28500),0,'Renderer must independently respect device reduced motion.');assert.equal(frames.size,0);
  reduced=false;renderer.update([{...group('batch5'),center:[115,18]}],'',false);drawAt(29000);assert(drawAt(29500)>0);drawAt(36000);
  renderer.update([{...group('behind'),center:[-100,30]}],'',false);assert.equal(drawAt(36000),0,'Backside country must wait.');assert.equal(frames.size,0);
  renderer.focus([-100,30]);drawAt(37000);assert(drawAt(37500)>0,'Backside country starts only when turned into view.');drawAt(44000);
  renderer.update(['US','CA','MX','BR'].map(country=>({...group('limit'),country})),'',true);drawAt(44000);
  assert.equal(drawAt(45000),3,'Only three visible countries start an entry sequence.');drawAt(51000);assert.equal(frames.size,0,'Do not automatically queue every country.');
  renderer.zoom(1);drawAt(52000);assert.equal(drawAt(52500),0,'Panning or zooming must not exceed three targets in one entry.');drawAt(59000);
  renderer.home();
  reduced=false;mobile=true;compact=true;bounds={left:0,top:0,width:320,height:428};
  for(const [height,drawerPeek] of [[428,150],[428,52],[314,52]]){
    bounds.height=height;peek=drawerPeek;renderer.resize();renderer.update([{...group('compact',false),center:[115,18]}],'',false);drawAt(60000);
    assert(clipCircle.y-clipCircle.r>=100-.01,'Short-phone globe must clear the heading.');
    assert(clipCircle.y+clipCircle.r<=bounds.height-peek-56+.01,'Short-phone globe must clear the controls by 8px.');
    assert(clipCircle.r>=40,'Short-phone globe must remain visible.');
  }
  renderer.home();renderer.update(['CN','JP','RU'].map(country=>({...group('spin'),country,center:[115,18]})).concat({...group('spin'),center:[-100,30],pulsePriority:1}),'',false);renderer.spin();
  drawAt(70000);drawAt(71000);drawAt(77000);drawAt(130000);assert(drawAt(130500)>0,'Auto-rotation must start a previously hidden country when its reserved priority target becomes visible.');renderer.stop();assert.equal(frames.size,0);
  mobile=false;compact=false;bounds={left:0,top:0,width:1000,height:700};renderer.resize();
  const live=(country,ids,center=[115,18])=>({...group(ids.join(',')),country,center,pulseIds:ids});
  clock=140000;renderer.update([live('CN',['A']),live('JP',['B']),live('RU',['C'])],'',true,{entry:10,ids:['A','B','C']});
  drawAt(clock);drawAt(clock+110);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,1,'First target alone at 110ms.');
  drawAt(clock+220); // Clock advances above: absolute assertions below.
  drawAt(140330);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,2,'Second target starts after 220ms.');
  drawAt(140550);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,3,'Third target starts after 440ms.');
  drawAt(145939);assert.equal(frames.size,1,'Last staggered target lasts until 5.5 seconds after its start.');
  drawAt(145940);assert.equal(frames.size,0,'Every target stops at exactly 5.5 seconds.');
  renderer.update([live('CN',[]),live('JP',['B']),live('RU',['C'])],'',true,{entry:10,ids:['B','C']});
  assert.equal(drawAt(146000),0,'Removal-only snapshot must never restart a batch.');
  renderer.update([live('CN',['A']),live('JP',['B']),live('RU',['C'])],'',true,{entry:10,ids:['A','B','C']});
  assert.equal(drawAt(146100),0,'A removed and re-added ID is already seen during this entry.');
  renderer.update([live('CN',['A']),live('JP',['B']),live('RU',['C']),live('BR',['D'])],'',true,{entry:10,ids:['A','B','C','D']});
  drawAt(146200);drawAt(146700);assert.equal(arcs.filter(r=>r>5&&r<=22).length,1,'Live batch must pulse only the country with an added article.');drawAt(152000);
  renderer.home();renderer.update([live('US',['A'],[-100,30])],'',false,{entry:11,ids:['A']});drawAt(153000);assert(drawAt(153500)>0,'All-backside initial entry camera must reveal a real target.');drawAt(160000);
  renderer.home();renderer.update([live('US',['A'],[-100,30])],'CN',false,{entry:12,ids:['A']});assert.equal(drawAt(161000),0,'Selected country must prevent automatic camera correction.');
  renderer.update([{...live('US',['A'],[115,18]),pulse:false}],'',true,{entry:13,ids:['A']});drawAt(162000);
  renderer.update([live('US',['A'],[115,18])],'',true,{entry:13,ids:['A']});drawAt(163000);assert(drawAt(163500)>0,'Enabling guidance after explicit off must work without inventing a data revision.');drawAt(170000);
  renderer.home();reservedBoxes=[{left:0,top:100,width:1000,height:150}];renderer.update([live('CN',['A'],[115,65])],'',false,{entry:14,ids:['A']});drawAt(171000);assert(drawAt(171500)>0,'A front-facing target covered by UI must trigger initial camera correction.');drawAt(178000);reservedBoxes=[];
  renderer.home();renderer.update([live('US',['A'],[-100,30]),live('CN',['B'])],'',false,{entry:20,ids:['A','B']});drawAt(180000);drawAt(187000);
  renderer.update([live('US',['A'],[-100,30]),live('CN',['B']),live('BR',['C'],[-50,-10])],'',false,{entry:20,ids:['A','B','C']});drawAt(188000);drawAt(195000);
  renderer.focus([-100,30]);drawAt(196000);assert(drawAt(196500)>0,'A reserved backside introduction survives an unrelated live article batch.');drawAt(203000);
  renderer.update([live('CN',['B'])],'CN',true,{entry:20,ids:['A','B','C','D']});drawAt(204000);
  renderer.update([live('CN',['B']),live('US',['A','D'])],'',true,{entry:20,ids:['A','B','C','D']});drawAt(205000);assert(drawAt(205500)>0,'A new article arriving behind a country filter must pulse after clearing the filter.');drawAt(212000);
  console.log('PASS: production entry/ID metadata, removal/re-add stability, added-country-only live batch, exact stagger/end, initial camera/selected camera and explicit motion re-enable.');
  console.log('PASS: short-phone globe fits between heading and controls in peek and enlarged-map states.');
  console.log('PASS: actual renderer flat/globe pulses, hidden labels, finite frames, same/new keys, first-visible timing, three-country entry budget and device motion.');
}

// Run the production event wiring in two separate closures sharing one window.
{
  const fs=require('node:fs'),vm=require('node:vm'),listeners=new Map(),saved=new Map();
  const sharedWindow={addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);}};
  function wire(file,start,end){
    const source=fs.readFileSync(require.resolve('../'+file),'utf8'),buttons=new Map();
    const store={get:k=>saved.get(k),set:(k,v)=>saved.set(k,v)};
    const context={window:sharedWindow,CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail;}},state:{motion:true},store,storage:store,seenSignals:new Set(),syncControls(){},renderMarkers(){},render(){},$:id=>({addEventListener(type,fn){buttons.set(id,fn);}})};
    vm.createContext(context);vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end)),context);return {context,buttons};
  }
  const domestic=wire('app.js',"  $('motion-toggle').addEventListener",'  function markArticleRead');
  const world=wire('world.js',"  $('world-motion').addEventListener","motion.addEventListener('change'");
  domestic.buttons.get('motion-toggle')();
  assert.equal(domestic.context.state.motion,false);assert.equal(world.context.state.motion,false);assert.equal(saved.get('newsmap:motion'),'off');
  world.buttons.get('world-motion')();
  assert.equal(domestic.context.state.motion,true);assert.equal(world.context.state.motion,true);assert.equal(saved.get('newsmap:motion'),'on');
  console.log('PASS: production domestic/world motion event handlers synchronize both directions without reload.');
}


// The production visit watermark advances only while the world is visible.
{
  const fs=require('node:fs'),vm=require('node:vm'),saved=new Map();
  const source=fs.readFileSync(require.resolve('../world.js'),'utf8');
  const time=Date.parse('2026-11-14T08:00:00Z');
  const context={Date:class extends Date {static now(){return time;}},Math,Number,active:false,document:{hidden:false},data:{collectedAt:new Date(time-8*3600000).toISOString()},storage:{get:k=>saved.get(k),set:(k,v)=>saved.set(k,v)},pulseEntry:0,visitRecorded:false,hasVisit:false,cutoff:0};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function beginEntry()'),source.indexOf('  function adopt(')),context);
  context.recordVisit();assert.equal(saved.size,0,'Domestic browsing must not consume world news.');
  context.active=true;context.document.hidden=true;context.recordVisit();assert.equal(saved.size,0,'Background polling must not consume world news.');
  saved.set('newsmap:world:lastVisit',String(time-6*3600000));context.beginEntry();assert.equal(context.cutoff,time-6*3600000,'Legacy visit watermark remains a migration fallback.');context.pulseEntry=0;
  saved.set('newsmap:world:lastEntry:v1',String(time-8*3600000));context.beginEntry();assert.equal(context.cutoff,time-8*3600000,'Returning to an existing tab uses the previous actual entry.');assert.equal(context.pulseEntry,1);
  context.document.hidden=false;context.recordVisit();assert.equal(Number(saved.get('newsmap:world:lastEntry:v1')),time,'Visible entry records actual visit time, not stale snapshot time.');
  saved.set('newsmap:world:lastEntry:v1',String(time-1000));context.recordVisit();assert.equal(Number(saved.get('newsmap:world:lastEntry:v1')),time-1000,'Refresh within the same entry must not advance the visit timestamp.');
  saved.set('newsmap:world:lastEntry:v1',String(time+86400000));context.beginEntry();assert.equal(context.cutoff,time-86400000,'Corrupt future visit falls back to first-visit day.');
  console.log('PASS: visible-only visit watermark, eight-hour existing-tab return and future-storage recovery.');
}
