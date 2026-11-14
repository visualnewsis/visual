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
assert.equal(R.filter(articles,{period:'24',now:now+24*3600000}).length,0,'A rolling period expires without any visit or collection timestamp.');
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


const recent=R.filter(articles,{period:'24',now});
assert.deepEqual(R.groups(recent).map(g=>[g.country,g.count,g.latest]),[['US',1,Date.parse(articles[0].publishedAt)],['CN',1,Date.parse(articles[0].publishedAt)]]);
assert.deepEqual(R.groups([a('13',[])]),[],'Unlocated articles must never invent a country.');
console.log('PASS: reporting period, country counts and latest-publication ranking use the same article set.');

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
  let renderer=sandbox.NewsmapGlobe(root,{features:[]},()=>{});
  const group=(key,pulse=true)=>({country:'US',name:'미국',count:1,placeCount:1,center:[-100,30],pulse,pulseKey:key});
  function drawAt(time){clock=time;arcs=[];circles=[];const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));return arcs.filter(r=>r>5&&r<=22).length;}
  function begin(next,mode=true,guide={},time=0){
    frames.clear();pins.children.length=0;clock=time;renderer=sandbox.NewsmapGlobe(root,{features:[]},()=>{});renderer.update(next,'',mode,guide);drawAt(time);
  }
  begin([group('ignored'),{...group('ignored'),country:'CA',name:'캐나다'}]);
  assert(drawAt(500)>0,'First ready visible paint must introduce real article countries.');
  assert(pins.children.some(el=>el.hidden),'Fixture includes a collision-hidden HTML label.');
  assert(arcs.filter(r=>r>5&&r<=22).length>=2,'Collision-hidden labels must not hide Canvas rings.');
  drawAt(6500);assert.equal(frames.size,0,'Finite introduction must stop scheduling frames.');
  renderer.update([group('new data')],'',true);assert.equal(drawAt(6600),0,'Even newly added article IDs must not replay an introduction.');
  renderer.setActive(false);renderer.setActive(true);assert.equal(drawAt(7000),0,'World/browser return must not replay.');
  renderer.update([group('period changed')],'',true,{scope:'7 days'});assert.equal(drawAt(7500),0,'Period changes must not replay.');
  renderer.zoom(1.2);assert.equal(drawAt(8000),0,'Zoom must not replay.');
  begin([group('loading')],true,{ready:false});assert.equal(drawAt(500),0);
  renderer.setActive(false);renderer.update([group('loaded')],'',true,{ready:true});clock=9000;renderer.setActive(true);drawAt(9000);assert(drawAt(9500)>0,'Hidden loading must preserve the first visible introduction.');
  renderer.setActive(false);clock=10000;renderer.setActive(true);assert.equal(drawAt(10000),0,'Leaving after introduction starts cancels it permanently.');
  begin([group('valid but failed')],true,{ready:true,failed:true});assert.equal(drawAt(500),0,'Known failure preserves dots but suppresses the guide.');
  renderer.update([group('retry succeeded')],'',true,{ready:true,failed:false});assert.equal(drawAt(1000),0,'A shown cached view must not queue an introduction for retry.');
  begin([group('running')]);assert(drawAt(500)>0);renderer.update([group('running')],'',true,{failed:true});assert.equal(drawAt(600),0,'An actual request failure must stop a running introduction.');
  begin([]);renderer.update([group('later article')],'',true);assert.equal(drawAt(500),0,'An initial valid empty period must not invent or later replay guide countries.');
  reduced=true;begin([group('device off')]);assert.equal(drawAt(500),0);reduced=false;renderer.update([group('device on')],'',true);assert.equal(drawAt(1000),0,'Turning device motion back on must not replay a consumed introduction.');
  begin([group('explicit off',false)]);assert.equal(drawAt(500),0);renderer.update([group('on')],'',true);assert.equal(drawAt(1000),0);
  begin(['US','CA','MX','BR'].map(country=>({...group('three'),country})));
  drawAt(110);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,1);
  drawAt(330);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,2);
  drawAt(550);assert.equal(circles.filter(c=>c.r>=4&&c.r<22).length,3,'Three countries maximum with 220ms stagger.');
  drawAt(5939);assert.equal(frames.size,1);drawAt(5940);assert.equal(frames.size,0,'Last ring ends at 5.5 seconds plus its stagger.');
  begin([{...group('backside'),center:[-100,30]}],false);assert(drawAt(500)>0,'Initial all-backside data fits one real country into view.');drawAt(6500);
  renderer.home();renderer.focus([-100,30]);assert.equal(drawAt(20000),0,'Late rotation must not start a reserved backside pulse.');
  frames.clear();clock=0;renderer=sandbox.NewsmapGlobe(root,{features:[]},()=>{});renderer.update([{...group('selected'),center:[-100,30]}],'CN',false);assert.equal(drawAt(0),0,'A selected country prevents automatic camera correction.');assert.equal(drawAt(500),0);
  reservedBoxes=[{left:0,top:100,width:1000,height:150}];begin([{...group('covered'),center:[115,65]}],false);assert(drawAt(500)>0,'UI-covered front data must use one initial correction.');reservedBoxes=[];
  begin([{...group('flat'),center:[115,18]}],false);assert(drawAt(500)>0);renderer.update([group('flat')],'',true);assert.equal(drawAt(600),0,'Mode switch cancels the current introduction.');
  reduced=false;mobile=true;compact=true;bounds={left:0,top:0,width:320,height:428};
  for(const [height,drawerPeek] of [[428,150],[428,52],[314,52]]){
    bounds.height=height;peek=drawerPeek;begin([{...group('compact',false),center:[115,18]}],false);drawAt(60000);
    assert(clipCircle.y-clipCircle.r>=100-.01,'Short-phone globe clears the heading.');
    assert(clipCircle.y+clipCircle.r<=bounds.height-peek-56+.01,'Short-phone globe clears the controls.');
    assert(clipCircle.r>=40,'Short-phone globe remains visible.');
  }
  console.log('PASS: short-phone globe fits between heading and controls in peek and enlarged-map states.');
  console.log('PASS: production renderer first visible/ready guide once, 3-country timing, updates/return/mode/period no replay, failures, empty data, device/explicit OFF and no late backside queue.');
}

// Run the production event wiring in two separate closures sharing one window.
{
  const fs=require('node:fs'),vm=require('node:vm'),listeners=new Map(),saved=new Map();
  const sharedWindow={addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);}};
  function wire(file,start,end){
    const source=fs.readFileSync(require.resolve('../'+file),'utf8'),buttons=new Map();
    const store={get:k=>saved.get(k),set:(k,v)=>saved.set(k,v)};
    const context={window:sharedWindow,CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail;}},state:{motion:true},renderer:null,store,storage:store,seenSignals:new Set(),syncControls(){},renderMarkers(){},render(){},$:id=>({addEventListener(type,fn){buttons.set(id,fn);}})};
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


// World browsing no longer reads or writes personal visit/read state.
{
  const source=require('node:fs').readFileSync(require.resolve('../world.js'),'utf8');
  assert(!source.includes('newsmap:world:last'));
  assert(!source.includes('world-new'));
  assert(!source.includes('onlyNew'));
  assert(source.includes("period:'24'"));
  console.log('PASS: world reporting period replaces personal visit/read/NEW state; domestic policy untouched.');
}
