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

test('section cut cannot fade the needle, rotary hook, presser or bobbin along with the covers',()=>{const m=buildSewingMachine(T,{}),coverMaterials=new Set();m.parts.covers.traverse(o=>{if(o.isMesh)coverMaterials.add(o.material);});for(let i=0;i<=100;i++){m.update({...cycleAt(i/101),travel:0,stitches:[],cutaway:1});for(const part of ['needle','hook','presser','bobbinCase','bobbin','feed'])m.parts[part].traverse(o=>{if(o.isMesh){assert.ok(!coverMaterials.has(o.material),part+' shares fading cover material');assert.ok(o.material.opacity>=.99,part+' disappeared during section cut');}});}assert.equal(m.group.getObjectByName('Upper fabric layer').visible,false);assert.equal(m.group.getObjectByName('Sectioned upper fabric').visible,true);m.update({...cycleAt(0),cutaway:0});assert.equal(m.group.getObjectByName('Upper fabric layer').visible,true);assert.equal(m.group.getObjectByName('Sectioned upper fabric').visible,false);});

test('two cloth layers touch, bottom meets needle plate and upper face agrees with pierce timing',()=>{const m=buildSewingMachine(T,{});m.update({...cycleAt(0),travel:0,stitches:[],cutaway:0});m.group.updateMatrixWorld(true);const top=new T.Box3().setFromObject(m.group.getObjectByName('Upper fabric layer')),bottom=new T.Box3().setFromObject(m.group.getObjectByName('Lower fabric layer'));assert.ok(Math.abs(top.min.y-bottom.max.y)<1e-7);assert.ok(Math.abs(top.max.y-1.11)<1e-7);assert.ok(Math.abs(bottom.min.y-1.05)<1e-7);});

test('hook beak is a solid tapered blade following the race, not a wire standing over it',()=>{const m=buildSewingMachine(T,{}),beak=m.parts.hook.getObjectByName('Hook beak');assert.equal(beak.geometry.type,'BufferGeometry');const p=beak.geometry.attributes.position;assert.ok(p.count>200);let tip=false;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));if(Math.hypot(p.getX(i),p.getY(i)-.21,p.getZ(i)-.38)<1e-6)tip=true;}assert.ok(tip);});
