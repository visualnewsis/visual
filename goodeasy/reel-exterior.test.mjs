import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {buildReelExterior} from './assets/reel-exterior.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildReel}=await import('./assets/reel-hero.js');

test('sculpted housing and rotor arms expose outward-facing finite surfaces',()=>{
 const skin=buildReelExterior(T),casing=skin.parts.casing,p=casing.geometry.attributes.position,n=casing.geometry.attributes.normal;
 let outward=0;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i),normal=new T.Vector3().fromBufferAttribute(n,i);
  assert.ok([...v,...normal].every(Number.isFinite));
  if(v.clone().sub(new T.Vector3(-.55,1.77,0)).dot(normal)>0)outward++;
 }
 assert.ok(outward/p.count>.99,'the cast housing has no inverted skin');
 for(const arm of skin.parts.arms){const pos=arm.geometry.attributes.position,norm=arm.geometry.attributes.normal;for(let row=1;row<48;row++){const center=new T.Vector3();for(let col=0;col<16;col++)center.add(new T.Vector3().fromBufferAttribute(pos,row*17+col));center.multiplyScalar(1/16);for(let col=0;col<16;col++){const i=row*17+col,radial=new T.Vector3().fromBufferAttribute(pos,i).sub(center),normal=new T.Vector3().fromBufferAttribute(norm,i);assert.ok(radial.dot(normal)>0,'rotor arm has outward surface');}}}
});

test('incoming and tangent line segments clear the actual sculpted spool exterior',()=>{
 const m=buildReel(),skin=m.parts.spool.getObjectByName('Sculpted reel spool exterior');
 skin.traverse(o=>{if(o.material)o.material.side=T.DoubleSide;});
 function clear(a,b,label){const delta=b.clone().sub(a),length=delta.length(),ray=new T.Raycaster(a,delta.normalize(),.0001,length-.0001);assert.equal(ray.intersectObject(skin,true).length,0,label);}
 for(const radius of [15,22,26])for(let i=0;i<=100;i++){
  m.update({turns:i/25,ratio:5.2,radius});m.group.updateMatrixWorld(true);
  for(const [line,label] of [[m.parts.line,'incoming line'],[m.parts.windingLine,'tangent lead']]){const p=line.geometry.attributes.position;clear(new T.Vector3().fromBufferAttribute(p,0),new T.Vector3().fromBufferAttribute(p,1),label+' at '+i+' radius '+radius);}
 }
});

test('new exterior follows its mechanical groups and leaves the front drag cap fixed',()=>{
 const m=buildReel();
 for(const [group,name] of [[m.parts.body,'body'],[m.parts.rotor,'rotor'],[m.parts.spool,'spool'],[m.parts.handle,'handle'],[m.parts.dragCap,'drag']])assert.ok(group.getObjectByName('Sculpted reel '+name+' exterior'));
 for(const payout of [0,.15,.7]){m.update({turns:.3,payout});m.group.updateMatrixWorld(true);const q=m.parts.dragCap.getWorldQuaternion(new T.Quaternion());assert.ok(q.angleTo(new T.Quaternion())<1e-6);}
});
