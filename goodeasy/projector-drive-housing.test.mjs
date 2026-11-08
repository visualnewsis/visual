import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {buildProjector}=await import('./assets/projector-hero.js');
const ray=new T.Raycaster(),direction=new T.Vector3(.137,.271,.953).normalize();
function collisions(m,steps=12){
 const solids=[],hits=new Set();for(const root of [m.parts.body,m.parts.lamp,m.parts.gate,m.parts.lens])root.traverse(o=>{if(o.isMesh&&o.geometry?.type!=='PlaneGeometry')solids.push(o)});
 for(let t=0;t<steps;t++){
  m.update({frames:t/steps},true);m.group.updateMatrixWorld(true);const bounds=solids.map(o=>new T.Box3().setFromObject(o));
  for(const [pi,p]of m.parts.transmission.pairs.entries())for(const [gi,g]of [p.ga,p.gb].entries()){
   const geo=g.children[0],a=geo.geometry.attributes.position;
   for(let i=0;i<a.count;i+=3){const point=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(geo.matrixWorld);for(let k=0;k<solids.length;k++){
    if(!bounds[k].containsPoint(point))continue;const mesh=solids[k],side=mesh.material.side;mesh.material.side=T.DoubleSide;ray.set(point,direction);ray.near=1e-7;ray.far=100;const ds=ray.intersectObject(mesh,false).map(h=>h.distance).sort((a,b)=>a-b);mesh.material.side=side;
    const n=ds.filter((d,j)=>!j||Math.abs(d-ds[j-1])>1e-6).length;if(n%2)hits.add(pi+'/'+gi+'/'+(mesh.name||mesh.parent.name));
   }}
  }
 }
 return [...hits];
}
test('both gears in every drive pair clear actual beveled housing solids over a frame cycle',()=>{
 const m=buildProjector();assert.deepEqual(collisions(m),[]);
 // The previous five buried gears must reproduce the original failure.
 for(const [i,z] of [[0,-1.7],[1,-1.9],[6,-1.55]]){const p=m.parts.transmission.pairs[i];p.ga.position.z=p.gb.position.z=z;}
 assert.equal(collisions(m,1).length,5);
});
test('each relocated gear remains on its physical shaft, including the short shutter shaft',()=>{
 const m=buildProjector();m.group.updateMatrixWorld(true);const d=m.parts.transmission;
 for(const p of d.pairs)for(const [gear,index]of [[p.ga,p.a],[p.gb,p.b]])assert.ok(new T.Box3().setFromObject(d.shafts[index]).containsPoint(gear.getWorldPosition(new T.Vector3())),'gear disconnected from shaft '+index);
});
