import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {watchAssembly}=await import('./assets/anatomy-watch.js');
const {buildWatch}=await import('./assets/watch-hero.js');
test('moving train windows are real openings, with teeth and spoke metal left intact',()=>{
 const m=watchAssembly();m.update({phase:0,explode:0});m.group.updateMatrixWorld(true);
 for(let i=1;i<4;i++){
  const p=m.components.find(c=>c.id==='wheel-'+i).object,w=p.children.find(o=>o.userData.teeth===[64,60,64,80,15][i]),r=w.userData.pitchRadius;
  const target=new T.Vector3(Math.cos(Math.PI/5)*r*.53,.3,-Math.sin(Math.PI/5)*r*.53).applyMatrix4(w.matrixWorld),ray=new T.Raycaster(target,new T.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(w,false).length,0,'window must pass through wheel');
  const solid=new T.Vector3(r*.6,.3,0).applyMatrix4(w.matrixWorld);assert.ok(new T.Raycaster(solid,new T.Vector3(0,-1,0)).intersectObject(w,false).length>0,'spoke must remain solid');
 }
});
test('lower bearing counterbores have recessed seats and a real pierced bearing',()=>{
 const m=watchAssembly();m.group.updateMatrixWorld(true);const base=m.components.find(c=>c.id==='mainplate').object;
 const plate=base.getObjectByName('Concentric movement mainplate'),top=new T.Box3().setFromObject(plate).max.y,seats=[];base.traverse(o=>{if(o.name==='Counterbored lower jewel seat')seats.push(o);});assert.equal(seats.length,7);
 for(const seat of seats){const center=seat.getWorldPosition(new T.Vector3()),hit=new T.Raycaster(new T.Vector3(center.x+.08,2,center.z),new T.Vector3(0,-1,0)).intersectObject(base,true).find(h=>h.object.isMesh);assert.ok(hit);assert.equal(hit.object,seat);assert.ok(top-hit.point.y>.03&&top-hit.point.y<.05,'bearing seat is recessed below plate face');const hole=new T.Raycaster(new T.Vector3(center.x,2,center.z),new T.Vector3(0,-1,0)).intersectObject(base,true);assert.equal(hole.length,0,'pivot bore must remain open');}
 assert.equal(m.group.getObjectByName('Overlapping circular polishing marks'),undefined);
});
test('bridge jewels sit inside their bore rather than on tall colored posts',()=>{
 const m=watchAssembly();m.group.updateMatrixWorld(true);const stones=[];m.group.traverse(o=>{if(o.name==='Upper pierced jewel bearing')stones.push(o);if(o.isMesh)assert.ok(!Array.isArray(o.material),'selection highlighting requires one material per mesh');});
 const bridgeBounds=new T.Box3().setFromObject(m.group.getObjectByName('Three-post pierced train bridge'));assert.equal(stones.length,5);for(const o of stones){const b=new T.Box3().setFromObject(o);assert.ok(b.min.y>bridgeBounds.min.y&&b.max.y<bridgeBounds.max.y);assert.ok(b.getSize(new T.Vector3()).x<.105);}
});
test('head-only hero preserves four real bored lugs and crown action without straps',()=>{
 const m=buildWatch();assert.equal(m.group.getObjectByName('Leather strap lining'),undefined);assert.equal(m.group.getObjectByName('Steel strap buckle'),undefined);assert.equal(m.parts.exterior.parts.lugs.length,4);assert.equal(m.parts.exterior.parts.springBars.length,2);m.parts.crown.traverse(o=>{if(o.isMesh)assert.equal(o.userData.action,'action');});
});
test('all four lugs extend outward and clear the movement opening',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);const lugs=[];m.group.traverse(o=>{if(o.name==='lug-solid-with-true-through-bore')lugs.push(o);});assert.equal(lugs.length,4);
 for(const lug of lugs){let min=Infinity,max=0;const p=new T.Vector3(),v=lug.geometry.attributes.position;for(let i=0;i<v.count;i++){p.fromBufferAttribute(v,i).applyMatrix4(lug.matrixWorld);const r=Math.hypot(p.x,p.z);min=Math.min(min,r);max=Math.max(max,r);}assert.ok(min>2.40,'lug must not enter the case opening');assert.ok(max>2.85,'lug must extend outward to the spring bar');}
});
test('narrow chapter ring contains every index while the case still clears the movement',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);const chapter=m.group.getObjectByName('Skeleton chapter ring'),v=new T.Vector3();
 chapter.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const r=Math.hypot(v.x,v.z);assert.ok(r>=2.2799&&r<=2.5301,'index must stay on the chapter ring');}});
 m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok((Math.hypot(v.x,v.z)<2.425||(v.x>0&&Math.hypot(v.y-.45,v.z)<.1101)),'movement must clear the case or occupy the real crown bore');}});
});
test('raised movement retains hand and crystal clearance and closes the supporting seat stack',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);let top=-Infinity;const v=new T.Vector3();m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);top=Math.max(top,v.y);}});
 for(const name of ['Hour hand','Minute hand','Small seconds']){const b=new T.Box3().setFromObject(m.group.getObjectByName(name));assert.ok(b.min.y-top>.03,'raised movement must clear every hand');}
 const crystal=m.group.getObjectByName('Sapphire crystal above hands');crystal.material.side=T.DoubleSide;m.parts.hands.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=3){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),ray=new T.Raycaster(v.clone().add(new T.Vector3(1e-7,0,2e-7)),new T.Vector3(0,1,0),0,2),hit=ray.intersectObject(crystal,false)[0];assert.ok(hit&&hit.distance>.012,'real domed crystal surface must clear '+o.name+' vertex '+v.toArray()+' hit '+hit?.distance);}});const rim=crystal.userData.profile.find(p=>Math.abs(p[0]-2.51)<1e-6);assert.ok(Math.abs(rim[1]-1.0348)<1e-6,'crystal rim rests on machined bezel shoulder');
 const chapterBounds=new T.Box3().setFromObject(m.group.getObjectByName('Narrow ivory chapter ring')),chapterSeat=new T.Box3().setFromObject(m.group.getObjectByName('Chapter ring machined supporting ledge'));assert.ok(Math.abs(chapterBounds.min.y-chapterSeat.max.y)<1e-6,'chapter ring rests on real shoulder inside bezel');
 const seat=new T.Box3().setFromObject(m.group.getObjectByName('Movement mounting seat')),back=new T.Box3().setFromObject(m.group.getObjectByName('Caseback supporting mounting seat'));assert.ok(Math.abs(seat.min.y-back.max.y)<.002,'raised mounting seat still rests on the caseback');
 const chapter=m.group.getObjectByName('Narrow ivory chapter ring'),ringBounds=new T.Box3().setFromObject(chapter);m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(Math.hypot(v.x,v.z)>=2.28)assert.ok(v.y<ringBounds.min.y||v.y>ringBounds.max.y,'raised movement must not penetrate the chapter ring');}});
});
