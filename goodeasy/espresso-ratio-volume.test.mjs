import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildBrewRatio}=await import('./assets/coffee-detail.js');

// Integrate radius samples from the actual porcelain lathe, independent of
// the fill inversion helper. Small slices also check the tapered cavity.
function measuredVolume(cup,height) {
 const vessel=cup.getObjectByName('thick porcelain vessel');
 const points=vessel.children.find(o=>o.geometry?.type==='LatheGeometry').geometry.parameters.points;
 const wall=points.slice(11,16).filter(p=>p.y>=.19&&p.y<=1.03).sort((a,b)=>a.y-b.y);
 assert.equal(wall.length,5);
 const radius=y=>{const i=wall.findIndex(p=>p.y>=y);if(i<=0)return wall[0].x-.026;const a=wall[i-1],b=wall[i];return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y)-.026;};
 let v=0;const count=20000,dy=(height-.19)/count;
 for(let i=0;i<count;i++){const r=radius(.19+(i+.5)*dy);v+=Math.PI*r*r*dy;}
 return v;
}

test('ratio default is visibly filled by symbolic cavity volume, not height or millilitres',()=>{
 const m=buildBrewRatio(),cup=m.group.getObjectByName('yield cup reused from hero');
 assert.deepEqual(m.eye,[2.5,11,6]);
 const fraction=measuredVolume(cup,cup.userData.surfaceY)/measuredVolume(cup,.985);
 assert.ok(Math.abs(fraction-36/55)<1e-5,`actual cavity fraction ${fraction}`);
 assert.ok(cup.userData.surfaceY>.72&&cup.userData.surfaceY<.84,'default must have a visible elevated liquid surface');
 assert.equal(m.group.userData.cupFillIsSymbolic,true);
 assert.match(m.reading(m.defaults),/상징/);
});

test('yield cue rises monotonically, zero empties the cup and excessive yield clamps below the rim',()=>{
 const m=buildBrewRatio(),cup=m.group.getObjectByName('yield cup reused from hero');let previous=0;
 for(const amount of [0,5,18,36,48.4,55,80,10000]){
  m.update({dose:18,yield:amount});
  assert.ok(cup.userData.fill>=previous);previous=cup.userData.fill;
  if(amount===0){assert.equal(previous,0);assert.equal(cup.getObjectByName('coffee surface').visible,false);}
  else {const v=measuredVolume(cup,cup.userData.surfaceY)/measuredVolume(cup,.985);assert.ok(Math.abs(v-Math.min(amount/55,.88))<1e-5);}
 }
 assert.ok(cup.userData.surfaceY<.985);
});

test('ratio annotation endpoints stay on the actual changing coffee faces and front readout',()=>{
 const m=buildBrewRatio();
 const resolve=a=>typeof a.object==='function'?a.object():a.object;
 const point=a=>new T.Box3().setFromObject(resolve(a)).getCenter(new T.Vector3());
 const cup=m.group.getObjectByName('yield cup reused from hero'),surface=cup.getObjectByName('coffee surface');
 const face=m.group.getObjectByName('visible tamped coffee face');
 assert.equal(resolve(m.annotations[0]),face);assert.equal(resolve(m.annotations[1]),surface);
 assert.ok(resolve(m.annotations[2]).isMesh);
 for(const [dose,beverageYield] of [[10,18],[18,36],[30,48]]){
  m.update({dose,yield:beverageYield});m.group.updateMatrixWorld(true);
  const a=point(m.annotations[0]),b=point(m.annotations[1]),c=point(m.annotations[2]);
  assert.ok(Math.abs(a.y-(.346+face.position.y))<1e-7);
  assert.ok(Math.abs(b.y-(.345+surface.position.y))<1e-7);
  assert.ok(Math.abs(b.x-1.48)<1e-7&&Math.abs(b.z+.15)<1e-7);
  assert.ok(c.distanceTo(new T.Vector3(1.48,.65,.92))<1e-7);
 }
 m.update({dose:0,yield:0});
 assert.equal(resolve(m.annotations[0]),null);assert.equal(resolve(m.annotations[1]),null);
});

test('dose and yield bars use one mass scale so the default yield is twice the dose',()=>{
 const m=buildBrewRatio(),readouts=m.group.children.filter(o=>o.name==='mass indicator');
 assert.equal(readouts.length,2);
 const width=o=>new T.Box3().setFromObject(o.children[1]).getSize(new T.Vector3()).x;
 for(const [dose,yieldMass] of [[18,36],[12,24],[20,40]]){
  m.update({dose,yield:yieldMass});m.group.updateMatrixWorld(true);
  assert.ok(Math.abs(width(readouts[1])/width(readouts[0])-2)<1e-7);
 }
 m.update({dose:24,yield:24});m.group.updateMatrixWorld(true);
 assert.ok(Math.abs(width(readouts[1])-width(readouts[0]))<1e-7,'equal masses need equal bars');
});
