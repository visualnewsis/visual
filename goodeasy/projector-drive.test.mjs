import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {buildProjector}=await import('./assets/projector-hero.js');
test('representative drive gears stay in mesh without tooth interpenetration over a full frame cycle',()=>{
 const m=buildProjector(),drive=m.parts.transmission,ray=new T.Raycaster();
 assert.equal(drive.group.userData.transmission.crankToFrame,24);
 for(const p of drive.pairs){
  assert.ok(Math.abs(Math.hypot(p.gb.position.x-p.ga.position.x,p.gb.position.y-p.ga.position.y)-p.radii[0]-p.radii[1])<1e-10);
  for(let k=0;k<48;k++){
   m.update({frames:k/48},true);m.group.updateMatrixWorld(true);
   const a=p.ga.children[0],b=p.gb.children[0],attr=a.geometry.attributes.position;
   for(let j=0;j<attr.count;j+=6){const v=new T.Vector3().fromBufferAttribute(attr,j);v.z=-.2;a.localToWorld(v);ray.set(v,new T.Vector3(0,0,1));assert.equal(ray.intersectObject(b).length,0,'gear teeth overlap '+p.a+'→'+p.b+' at '+k);}
  }
 }
 m.update({frames:0});const before=drive.pairs.map(p=>[p.ga.rotation.z,p.gb.rotation.z]);const crank=m.parts.handle.rotation.z,driver=m.parts.driver.rotation.z;
 m.update({frames:1});assert.ok(Math.abs((m.parts.driver.rotation.z-driver)/(m.parts.handle.rotation.z-crank)-24)<1e-8);
 drive.pairs.forEach((p,i)=>assert.ok(Math.abs((p.ga.rotation.z-before[i][0])*p.ga.userData.teeth+(p.gb.rotation.z-before[i][1])*p.gb.userData.teeth)<1e-8));
});
test('Geneva locking sector clears the output during engagement and holds between concave dwell faces',()=>{
 const m=buildProjector(),ray=new T.Raycaster(),star=m.parts.intermittent.children.find(o=>o.isMesh),lock=m.group.getObjectByName('Geneva dwell locking sector');assert.ok(lock);
 for(let t=0;t<400;t++){m.update({frames:t/400},true);m.group.updateMatrixWorld(true);const pos=lock.geometry.attributes.position;for(let i=0;i<pos.count;i+=3){const v=new T.Vector3().fromBufferAttribute(pos,i);v.z=-.15;const start=lock.localToWorld(v);ray.set(start,new T.Vector3(0,0,1));assert.equal(ray.intersectObject(star).length,0,'locking sector cuts output at '+t);}}
});
