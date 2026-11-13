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

// Execute the production renderer against real D3 projections with a controlled
// clock. Pulses must cover dots even when their HTML labels are collision-hidden.
{
  const vm=require('node:vm'),fs=require('node:fs');
  let clock=0,nextFrame=0,arcs=[],reduced=false;
  const frames=new Map();
  class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.attrs={};this.hidden=false;this.listeners={};this.classes=new Set();this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)};}
    append(...children){this.children.push(...children);}
    querySelector(tag){return this.children.find(c=>c.tag===tag);}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,fn){this.listeners[k]=fn;}
    remove(){}
    getBoundingClientRect(){return {left:0,top:0,width:1000,height:700};}
  }
  const context2d=new Proxy({arc:(x,y,r)=>arcs.push(r),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const canvas=new Element('canvas');canvas.getContext=()=>context2d;
  const pins=new Element(),spin=new Element();spin.append(new Element('span'));
  const nodes={'#world-canvas':canvas,'#world-canvas-wrap':new Element(),'#world-pins':pins,'#world-spin':spin,'#world-map-notice':new Element()};
  const root={querySelector:s=>nodes[s],querySelectorAll:()=>[]};
  const sandbox={console,Map,Set,Math,performance:{now:()=>clock},document:{createElement:tag=>new Element(tag)},matchMedia:query=>({get matches(){return query.includes('reduced-motion')&&reduced;},addEventListener(){}}),ResizeObserver:class {observe(){}},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)};
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  for(const file of ['vendor/d3-array.min.js','vendor/d3-geo.min.js','world-globe.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),sandbox);
  const renderer=sandbox.NewsmapGlobe(root,{features:[]},()=>{});
  const group=(key,pulse=true)=>({country:'US',name:'미국',count:1,placeCount:1,center:[-100,30],pulse,pulseKey:key});
  function drawAt(time){clock=time;arcs=[];const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));return arcs.filter(r=>r>5&&r<=22).length;}
  renderer.update([group('batch1'),{...group('batch1'),country:'CA',name:'캐나다'}],'',true);
  assert(drawAt(500)>0,'Flat map must render new-article rings.');
  assert(pins.children.some(el=>el.hidden),'Fixture must include a collision-hidden label.');
  assert(arcs.filter(r=>r>5&&r<=22).length>=2,'Hidden label country must still have a Canvas pulse.');
  drawAt(6000);assert.equal(frames.size,0,'Finite pulses must stop scheduling frames.');
  renderer.update([group('batch1')],'',true);assert.equal(drawAt(6100),0,'Same batch must not replay.');
  renderer.update([group('batch2')],'',true);assert(drawAt(6600)>0,'A later batch in the same country must replay.');
  renderer.update([group('batch2',false)],'',true);assert.equal(drawAt(6700),0,'Read/motion-off groups must stop their rings.');assert.equal(frames.size,0);
  renderer.update([group('batch3')],'',true);renderer.setActive(false);assert.equal(frames.size,0,'Hidden world view must cancel animation.');
  clock=13000;renderer.setActive(true);assert.equal(drawAt(clock),0,'Returning after expiry must not replay old rings.');
  renderer.update([{...group('batch4'),center:[115,18]}],'',false);assert(drawAt(13500)>0,'Globe must retain new-article rings.');
  drawAt(19000);assert.equal(frames.size,0);
  reduced=true;renderer.update([{...group('batch5'),center:[115,18]}],'',false);assert.equal(drawAt(19500),0,'Renderer must independently respect device reduced motion.');assert.equal(frames.size,0);
  console.log('PASS: actual renderer flat/globe pulses, hidden labels, finite frames, same/new batch, motion/read stop and hidden-view expiry.');
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
