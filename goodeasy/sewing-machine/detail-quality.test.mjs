import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {buildSewingMachine} from './sewing-model.js';
import {cycleAt} from './motion.js';
test('completed upper and lower locks have real thread thickness, stay at old hole and move with cloth',()=>{
 const m=buildSewingMachine(T,{});
 for(const phase of [0,.3,.6,.9]){
  m.update({...cycleAt(phase,3),travel:5,stitches:[2,3],cutaway:1});m.group.updateMatrixWorld(true);
  for(const name of ['Upper stitch loop 1','Lower stitch lock 1']){
   const line=m.group.getObjectByName(name),tube=line.children[0];
   assert.ok(tube.geometry.type==='TubeGeometry');assert.equal(tube.geometry.parameters.radius,.0035);
   assert.equal(tube.parent.parent.parent,m.parts.fabric);
   const p=new T.Vector3().fromBufferAttribute(line.geometry.attributes.position,0),center=new T.Vector3(0,p.y,p.z).applyMatrix4(line.matrixWorld);
   assert.ok(Number.isFinite(center.z));assert.equal(line.visible,true);
   assert.equal(Math.fround(tube.position.z),p.z);
  }
 }
});
