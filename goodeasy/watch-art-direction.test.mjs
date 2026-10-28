import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {watchAssembly}=await import('./assets/anatomy-watch.js');
const {buildWatch}=await import('./assets/watch-hero.js');
test('moving train windows are real openings, with teeth and spoke metal left intact',()=>{
 const m=watchAssembly();m.update({phase:0,explode:0});m.group.updateMatrixWorld(true);
 for(let i=1;i<5;i++){
  const p=m.components.find(c=>c.id==='wheel-'+i).object,w=p.children.find(o=>o.userData.teeth===[64,60,64,60,15][i]),r=w.userData.pitchRadius;
  const target=new T.Vector3(Math.cos(Math.PI/5)*r*.53,.3,-Math.sin(Math.PI/5)*r*.53).applyMatrix4(w.matrixWorld),ray=new T.Raycaster(target,new T.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(w,false).length,0,'window must pass through wheel');
  const solid=new T.Vector3(r*.6,.3,0).applyMatrix4(w.matrixWorld);assert.ok(new T.Raycaster(solid,new T.Vector3(0,-1,0)).intersectObject(w,false).length>0,'spoke must remain solid');
 }
});
test('machined recesses have lower floors and do not become through holes',()=>{
 const m=watchAssembly();m.group.updateMatrixWorld(true);const base=m.components.find(c=>c.id==='mainplate').object;
 for(const [x,z] of [[-1.2,-1.0],[-.9,1.9]]){const hit=new T.Raycaster(new T.Vector3(x,2,z),new T.Vector3(0,-1,0)).intersectObject(base,true).find(h=>h.object.isMesh);assert.ok(hit);assert.equal(hit.object.name,'Blind machined recess floor');const depth=.073-hit.point.y/.30;assert.ok(depth>=.025&&depth<=.055,'recess is shallow and retains a solid floor');}
 assert.equal(m.group.getObjectByName('Overlapping circular polishing marks'),undefined);
});
test('bridge jewels sit inside their bore rather than on tall colored posts',()=>{
 const m=watchAssembly();m.group.updateMatrixWorld(true);const stones=[];m.group.traverse(o=>{if(o.name==='Upper pierced jewel bearing')stones.push(o);if(o.isMesh)assert.ok(!Array.isArray(o.material),'selection highlighting requires one material per mesh');});
 assert.equal(stones.length,5);for(const o of stones){const b=new T.Box3().setFromObject(o);assert.ok(b.max.y<=1.37*.30+.000001);assert.ok(b.getSize(new T.Vector3()).x<.105);}
});
test('hero has separate leather lining and open buckle while crown keeps its own action',()=>{
 const m=buildWatch();assert.ok(m.group.getObjectByName('Leather strap lining'));assert.ok(m.group.getObjectByName('Steel strap buckle'));assert.ok(m.group.getObjectByName('Buckle pin'));m.parts.crown.traverse(o=>{if(o.isMesh)assert.equal(o.userData.action,'action');});
});
test('all four lugs extend outward and clear the movement opening',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);const lugs=[];m.group.traverse(o=>{if(o.name==='Curved lug holding spring bar')lugs.push(o);});assert.equal(lugs.length,4);
 for(const lug of lugs){let min=Infinity,max=0;const p=new T.Vector3(),v=lug.geometry.attributes.position;for(let i=0;i<v.count;i++){p.fromBufferAttribute(v,i).applyMatrix4(lug.matrixWorld);const r=Math.hypot(p.x,p.z);min=Math.min(min,r);max=Math.max(max,r);}assert.ok(min>2.54,'lug must not enter the case opening');assert.ok(max>2.85,'lug must extend outward to the spring bar');}
});
test('narrow chapter ring contains every index while the case still clears the movement',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);const chapter=m.group.getObjectByName('Skeleton chapter ring'),v=new T.Vector3();
 chapter.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const r=Math.hypot(v.x,v.z);assert.ok(r>=2.2799&&r<=2.5301,'index must stay on the chapter ring');}});
 m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(Math.hypot(v.x,v.z)<2.51,'movement must clear the smallest inner case radius');}});
});
test('raised movement retains hand and crystal clearance and closes the supporting seat stack',()=>{
 const m=buildWatch();m.group.updateMatrixWorld(true);let top=-Infinity;const v=new T.Vector3();m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);top=Math.max(top,v.y);}});
 for(const name of ['Hour hand','Minute hand','Small seconds']){const b=new T.Box3().setFromObject(m.group.getObjectByName(name));assert.ok(b.min.y-top>.03,'raised movement must clear every hand');}
 const crystal=new T.Box3().setFromObject(m.group.getObjectByName('Sapphire crystal above hands')),hands=new T.Box3().setFromObject(m.parts.hands);assert.ok(crystal.min.y-hands.max.y>.012,'crystal must clear hand stack including its center cap');
 const seat=new T.Box3().setFromObject(m.group.getObjectByName('Movement mounting seat')),back=new T.Box3().setFromObject(m.group.getObjectByName('Caseback supporting mounting seat'));assert.ok(Math.abs(seat.min.y-back.max.y)<.002,'raised mounting seat still rests on the caseback');
 const chapter=m.group.getObjectByName('Narrow ivory chapter ring'),rim=new T.Box3().setFromObject(chapter);m.parts.movement.group.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(Math.hypot(v.x,v.z)>=2.28)assert.ok(v.y<rim.min.y||v.y>rim.max.y,'raised movement must not penetrate the chapter ring');}});
});
