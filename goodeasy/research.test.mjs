import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {layerOffset,gearAngle,escapeState,handAngles,period,stringHz,lightRatio} from './assets/research-math.js';
import {buildMXSwitch} from './assets/models/mx-switch.js';
import {buildEspresso} from './assets/models/espresso.js';
for(let i=0;i<8;i++){assert.equal(layerOffset(0,i,3),0);assert.equal(layerOffset(1,i,3),3);for(let t=0;t<=1;t+=.05)assert.ok(layerOffset(t,i,3)>=0&&layerOffset(t,i,3)<=3);}
assert.equal(gearAngle(Math.PI,48,12),-Math.PI*4);
assert.equal(escapeState(.1).angle,escapeState(.3).angle);assert.equal(escapeState(.85).angle,escapeState(.95).angle);assert.ok(escapeState(.65).angle>escapeState(.5).angle);
assert.ok(Math.abs(handAngles(60).second-Math.PI*2)<1e-12);assert.ok(Math.abs(handAngles(3600).minute-Math.PI*2)<1e-12);assert.ok(Math.abs(handAngles(43200).hour-Math.PI*2)<1e-12);
assert.ok(period(1.5,1)>period(1,1));assert.ok(period(1,1.5)<period(1,1));
assert.equal(stringHz(.5,50,.005)/stringHz(1,50,.005),2);assert.equal(lightRatio(2.8,125)/lightRatio(2.8,250),2);
const mat=new T.MeshStandardMaterial(),M=Object.fromEntries(['ivory','black','red','steel','brass','glass','coffee'].map(k=>[k,mat]));const mx=buildMXSwitch(T,M);
mx.update({travel:0,explode:0});const base=mx.parts.spring.position.y;mx.update({travel:4,explode:0});assert.equal(mx.parts.spring.position.y,base,'spring lower endpoint fixed');assert.equal(mx.parts.movingLeaf.userData.closed,true);const floorMesh=mx.parts.lowerHousing.children.find(o=>o.geometry?.type==='BoxGeometry'&&Math.abs(o.geometry.parameters.height-.12)<1e-9);
assert.ok(floorMesh,'canonical lower housing has a floor slab');
let smallestClearance=Infinity;
for(let i=0;i<=80;i++){
 mx.update({travel:i/20,explode:0});mx.group.updateMatrixWorld(true);
 const floorBounds=new T.Box3().setFromObject(floorMesh),stemBounds=new T.Box3().setFromObject(mx.parts.stem);
 const clearance=stemBounds.min.y-floorBounds.max.y;smallestClearance=Math.min(smallestClearance,clearance);
 assert.ok(clearance>=0,'every stem/cam/support stays above actual housing floor at '+i/20+'mm');
}
assert.ok(smallestClearance>.015,'full-travel assembly preserves visible clearance from floor');
mx.update({travel:0,explode:0});assert.equal(mx.parts.movingLeaf.userData.closed,false);
const es=buildEspresso(T,M);es.update({locked:true,brewing:true,volume:20,pressure:9});assert.equal(es.parts.cup.userData.fill,.5);assert.equal(es.parts.filter.position.x,-.62);es.update({locked:true,volume:40});assert.equal(es.parts.cup.userData.fill,1);es.parts.filter.traverse(o=>{if(o.isMesh)assert.equal(o.userData.action,'lock');});
console.log('PASS research models: reversible assembly, locked escapement, tooth ratio, three hands, oscillator, string/exposure comparisons, MX contact/base/floor, 20mL=half cup');
