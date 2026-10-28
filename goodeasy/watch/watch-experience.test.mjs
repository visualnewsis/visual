import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {createWatchExperience} from '../assets/watch-experience.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {buildWatch}=await import('../assets/watch-hero.js');
const {watchAssembly}=await import('../assets/anatomy-watch.js');
const {buildAssembly,buildPower}=await import('../assets/research-watch.js');
const close=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,a+' != '+b);
test('winding visibly tightens the same mainspring in hero and assembly, not an unrelated decoration',()=>{
 const h=buildWatch(),a=watchAssembly(),spring=h.group.getObjectByName('Visible winding mainspring');h.update({reserve:0,turns:0,elapsed:0});
 const loose=spring.geometry.attributes.position.array.slice();h.update({reserve:80,turns:10,elapsed:0,winding:true});
 assert.ok(spring.geometry.attributes.position.array.some((v,i)=>Math.abs(v-loose[i])>.02));
 a.update({charge:80,turns:10,phase:0});const other=a.group.getObjectByName('Visible winding mainspring');
 assert.deepEqual([...spring.geometry.attributes.position.array],[...other.geometry.attributes.position.array]);
 for(const group of [h.parts.movement.group,a.group]){close(group.scale.x,group.scale.y);close(group.scale.y,group.scale.z);}
});
test('movement spring ends stay fixed to their own independently rotating arbor and barrel',()=>{
 const m=watchAssembly(),barrel=m.components.find(c=>c.id==='wheel-0').object;
 for(const [turns,charge,phase] of [[0,0,0],[4,32,.2],[8,64,.7],[8,50,1.1]]){
  m.update({turns,charge,phase});m.group.updateMatrixWorld(true);
  const spring=m.group.getObjectByName('Visible winding mainspring'),inner=new T.Vector3(...spring.userData.inner).applyMatrix4(spring.matrixWorld),outer=new T.Vector3(...spring.userData.outer).applyMatrix4(spring.matrixWorld);
  const arbor=barrel.children.find(o=>o.geometry?.type==='LatheGeometry'),expectedInner=new T.Vector3(.075,.23,0).applyMatrix4(arbor.matrixWorld),expectedOuter=new T.Vector3(.58,.23,0).applyMatrix4(barrel.matrixWorld);
  assert.ok(inner.distanceTo(expectedInner)<1e-6);assert.ok(outer.distanceTo(expectedOuter)<1e-6);
 }
});
test('all train bearing centres are supported by the sculpted bridge and retain contact with their posts',()=>{
 const m=watchAssembly();m.update({phase:0,explode:0});m.group.updateMatrixWorld(true);const bridge=m.group.getObjectByName('Sculpted pierced train bridge'),ray=new T.Raycaster();
 for(const c of m.components.filter(c=>/^wheel-/.test(c.id))){
  const point=c.object.getWorldPosition(new T.Vector3());let metalHits=0;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ray.set(new T.Vector3(point.x+Math.cos(a)*.10,2,point.z+Math.sin(a)*.10),new T.Vector3(0,-1,0));if(ray.intersectObject(bridge,true).some(h=>h.object.isMesh))metalHits++;}
  assert.equal(metalHits,8,'bearing collar has continuous bridge metal, not a floating jewel');
 }
 const posts=[];m.group.traverse(o=>{if(o.name.startsWith('Train bridge support'))posts.push(o);});
 for(const p of posts){const b=new T.Box3().setFromObject(p),q=p.getWorldPosition(new T.Vector3());ray.set(new T.Vector3(q.x+.055,.1,q.z),new T.Vector3(0,1,0));const hits=ray.intersectObject(bridge,true).filter(h=>h.object.isMesh);assert.ok(hits.length);const y=Math.min(...hits.map(h=>h.point.y));close(y,b.max.y,1e-5);}
});
test('research assembly reuses the hero movement with reversible layers',()=>{
 const a=buildAssembly();a.update({time:1,charge:50,explode:0});assert.ok(a.group.getObjectByName('Sculpted pierced train bridge'));const rest=a.components.map(c=>c.object.position.clone());a.update({time:1,charge:50,explode:1});assert.ok(a.components.some((c,i)=>c.object.position.distanceTo(rest[i])>1));a.update({time:1,charge:50,explode:0});a.components.forEach((c,i)=>assert.ok(c.object.position.distanceTo(rest[i])<1e-9));
});
test('free spring drains quickly while regulated output preserves regular supply and winding remains animated',()=>{
 const run=regulated=>{let state={turns:0,reserve:0,elapsed:0,regulated};const c=createWatchExperience({getState:()=>state,setState:s=>state=s});c.wind(5);const start=state;for(let i=0;i<40;i++)c.tick(.1);return {state,start,c,read:()=>state};};
 const normal=run(true),free=run(false);assert.equal(normal.start.visualTurns,0);assert.ok(normal.state.visualTurns>4.9);assert.equal(free.state.reserve,0);assert.ok(normal.state.reserve>37);assert.ok(free.state.elapsed>normal.state.elapsed);
 const before=normal.state.elapsed;normal.c.pause();normal.c.tick(.1);assert.equal(normal.read().elapsed,before);normal.c.reset();assert.equal(normal.read().reserve,0);
});
test('power comparison releases only at escapement impulses when regulation is selected',()=>{
 const p=buildPower(),s={...p.defaults,regulated:1,charge:80,running:true,time:0};p.advance(s,.1);close(s.charge,80);p.advance(s,.6);assert.ok(s.charge<80);
 const free={...p.defaults,regulated:0,charge:80,running:true,time:0};p.advance(free,.7);assert.ok(free.charge<s.charge);
});

test('skeleton bridge leaves more than half of every wheel inspection area open from above',()=>{
 const m=watchAssembly();m.update({phase:0,charge:50,explode:0});m.group.updateMatrixWorld(true);const bridge=m.group.getObjectByName('Sculpted pierced train bridge'),ray=new T.Raycaster();
 // Hairline finish marks are not metal occluders. Raycaster's default Line
 // threshold is one model unit, hundreds of times wider than these marks.
 const opaqueBridge=[];bridge.traverse(o=>{if(o.isMesh&&(!o.material.transparent||o.material.opacity>=.95))opaqueBridge.push(o);});assert.ok(opaqueBridge.length);
 for(const c of m.components.filter(c=>/^wheel-/.test(c.id))){
  const center=c.object.getWorldPosition(new T.Vector3()),wheel=c.object.children.filter(o=>o.userData.teeth).sort((a,b)=>b.userData.pitchRadius-a.userData.pitchRadius)[0],radius=wheel.userData.pitchRadius;
  let open=0,total=0;
  for(const r of [.45,.65,.85])for(let i=0;i<32;i++){const a=i/32*Math.PI*2;ray.set(new T.Vector3(center.x+Math.cos(a)*radius*r,2,center.z+Math.sin(a)*radius*r),new T.Vector3(0,-1,0));total++;if(!ray.intersectObjects(opaqueBridge,false).length)open++;}
  assert.ok(open/total>.5,c.id+' visible fraction '+open/total);
 }
});

test('normal watch cadence is independent of available spring reserve',()=>{
 const run=reserve=>{let state={reserve,elapsed:0,turns:2,regulated:true};const c=createWatchExperience({getState:()=>state,setState:s=>state=s});for(let i=0;i<10;i++)c.tick(.1);return state;};
 close(run(5).elapsed,run(90).elapsed);close(run(5).elapsed,1);
});

test('head-only case has curved metal, bored lugs and seated spring bars',()=>{
 const h=buildWatch(),shell=h.group.getObjectByName('contoured-case-middle');assert.equal(shell.geometry.type,'LatheGeometry');const radii=shell.geometry.parameters.points.map(p=>p.x);assert.ok(Math.max(...radii)-Math.min(...radii)>.12);
 assert.equal(h.group.getObjectByName('Tapered stitched leather strap'),undefined);assert.equal(h.parts.exterior.parts.lugs.length,4);assert.equal(h.parts.exterior.inspect.verifyBoresWithRaycaster().passed,true);assert.equal(h.parts.exterior.inspect.verifySpringBarFit().passed,true);
});


test('winding accepts only remaining capacity and rejects extra turns at full reserve',()=>{
 let state={turns:12,reserve:96,visualTurns:11.75,visualReserve:94,elapsed:0,winding:true,regulated:true};const announcements=[];let commits=0;const c=createWatchExperience({getState:()=>state,setState:s=>{state=s;commits++;},announce:s=>announcements.push(s)});c.wind(2);close(state.turns,12.5);close(state.reserve,100);close(state.visualTurns,11.75);const full=state;c.wind(3);assert.equal(state,full,'full winding does not change the accumulated arbor target');assert.equal(commits,1);assert.ok(announcements.at(-1).includes('가득'));assert.equal(state.winding,true,'pending visual winding is preserved');c.tick(.1);assert.ok(state.visualTurns>11.75&&state.visualTurns<12.5);close(state.turns,12.5);c.tick(.1);close(state.visualTurns,12.5);assert.equal(state.winding,false);
});

test('after power is spent, winding adds exactly the newly available capacity',()=>{
 let state={turns:12.5,reserve:100,visualTurns:12.5,visualReserve:100,elapsed:0,regulated:true};const c=createWatchExperience({getState:()=>state,setState:s=>state=s});c.wind(1);close(state.turns,12.5);c.tick(.1);close(state.reserve,99.95);c.wind(1);close(state.reserve,100);close(state.turns,12.5+.05/8);
});
