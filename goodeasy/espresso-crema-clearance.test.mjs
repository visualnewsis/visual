import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {createCoffeeCup}=await import('./assets/coffee-detail.js');
test('wider crema stays entirely inside the rising liquid at every fill and pouring wobble',()=>{
 const m=createCoffeeCup(),surface=m.group.getObjectByName('coffee surface'),foam=m.group.getObjectByName('irregular micro crema');
 for(const fill of [.01,.05,.2,.4,.6,.8,1])for(const pouring of [false,true])for(const time of [0,.3,1,7]){
  m.setFill(fill,time,pouring);m.group.updateMatrixWorld(true);
  for(const o of foam.children.filter(o=>o.name.startsWith('crema fleck'))){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);assert.ok(Math.hypot(p.x,p.z)<surface.scale.x,'crema leaves liquid');assert.ok(p.y<1.1,'crema crosses porcelain rim');}}
 }
});
