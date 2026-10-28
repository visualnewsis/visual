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
 for(const [x,z] of [[-1.2,-1.0],[-.9,1.9]]){const hit=new T.Raycaster(new T.Vector3(x,2,z),new T.Vector3(0,-1,0)).intersectObject(base,true).find(h=>h.object.isMesh);assert.ok(hit);assert.equal(hit.object.name,'Blind machined recess floor');assert.ok(hit.point.y<.03*.30);}
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
