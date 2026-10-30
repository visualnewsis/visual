import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {createCoffeeCup}=await import('./assets/coffee-detail.js');

test('crema is one connected liquid surface, with no floating pieces or torus arcs',()=>{
 const m=createCoffeeCup(),surface=m.group.getObjectByName('coffee surface');
 assert.ok(surface?.isMesh);assert.equal(surface.userData.continuousLiquid,true);
 const forbidden=[];m.group.traverse(o=>{if(/crema fleck|crema irregular arc|coffee meniscus/.test(o.name))forbidden.push(o);});assert.equal(forbidden.length,0);
 const p=surface.geometry.attributes.position,index=surface.geometry.index,used=new Set(index.array);
 assert.equal(used.size,p.count);for(let i=0;i<index.count;i+=3)assert.ok([index.getX(i),index.getX(i+1),index.getX(i+2)].includes(0));
});
test('every fill stays finite, below the cup rim, inside its cavity, and changes continuously',()=>{
 const m=createCoffeeCup(),surface=m.group.getObjectByName('coffee surface'),volume=m.group.getObjectByName('coffee volume');let previous=null;
 const porcelain=m.group.getObjectByName('thick porcelain vessel').children.find(o=>o.geometry?.type==='LatheGeometry');
 const wall=porcelain.geometry.parameters.points.slice(11,16).sort((a,b)=>a.y-b.y);
 const cavityAt=y=>{const i=wall.findIndex(p=>p.y>=y);if(i<=0)return wall[0].x;const a=wall[i-1],b=wall[i];return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);};
 for(let n=1;n<=200;n++){
  const fill=n/200;m.setFill(fill,0,false);m.group.updateMatrixWorld(true);
  assert.equal(surface.visible,true);assert.equal(volume.visible,true);
  const expected=.19+.795*fill;assert.ok(Math.abs(surface.position.y-expected)<1e-10);
  if(previous){assert.ok(Math.abs(surface.position.y-previous.y)<.0041);assert.ok(Math.abs(surface.scale.x-previous.r)<.0011);}
  assert.ok(Math.abs(surface.scale.x-(cavityAt(expected)-.026))<1e-10,'surface radius must follow actual porcelain profile with .026 clearance');
  previous={y:surface.position.y,r:surface.scale.x};
  for(const pouring of [false,true])for(const time of [0,.3,1,7]){
   m.setFill(fill,time,pouring);m.group.updateMatrixWorld(true);
   const positions=surface.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){
    const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(surface.matrixWorld);
    assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.y<1.1&&p.y>.168);
    const cavity=cavityAt(p.y);
    assert.ok(Math.hypot(p.x,p.z)<cavity-.020,'surface crosses porcelain wall');
   }
   assert.ok(Math.abs(surface.position.y-expected)<=.00121,'motion exceeds restrained liquid height');
   assert.ok(Math.abs(volume.position.y + .795 * volume.scale.y - surface.position.y)<1e-10,'volume must meet the sole surface');
  }
 }
});
test('empty or invalid fills hide actual liquid and cannot leave crema suspended',()=>{
 const m=createCoffeeCup(),surface=m.group.getObjectByName('coffee surface'),volume=m.group.getObjectByName('coffee volume');
 for(const fill of [0,-1,NaN,Infinity]){m.setFill(.8);m.setFill(fill,Infinity,true);assert.equal(surface.visible,false);assert.equal(volume.visible,false);assert.equal(m.group.userData.fill,0);}
});
test('continuous pigment field has subtle brown microfoam and physically restrained roughness',()=>{
 const {group}=createCoffeeCup(),material=group.getObjectByName('coffee surface').material,map=material.map,rough=material.roughnessMap;
 assert.ok(map?.isDataTexture);assert.ok(rough?.isDataTexture);assert.equal(map.image.width,512);assert.equal(map.colorSpace,T.SRGBColorSpace);
 const colors=new Set();for(let i=0;i<map.image.data.length;i+=4){const d=map.image.data;assert.equal(d[i+3],255);assert.ok(d[i]>d[i+1]&&d[i+1]>d[i+2]);colors.add(`${d[i]},${d[i+1]},${d[i+2]}`);const r=rough.image.data[i+1]/255;assert.ok(r>=.249&&r<=.381);}
 assert.ok(colors.size>1000,'pigment must be a continuous tonal field');
});
