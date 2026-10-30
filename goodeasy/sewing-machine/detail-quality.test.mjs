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

test('upper thread clears the actual cast body and head cover throughout a stitch',async()=>{
 const {threadPath}=await import('./thread-path.js');
 const m=buildSewingMachine(T,{});m.update({...cycleAt(0),cutaway:0});m.group.updateMatrixWorld(true);
 const shells=['Continuous C-shaped cast body','Needle head cover','Brushed needle-head service cover'].map(n=>m.group.getObjectByName(n));
 for(let phase=0;phase<1;phase+=.025){
  const lead=threadPath(cycleAt(phase)).slice(0,9),curve=new T.CatmullRomCurve3(lead.map(p=>new T.Vector3(...p)),false,'centripetal');
  for(const point of curve.getPoints(400)){
   const ray=new T.Raycaster(new T.Vector3(point.x,point.y,5),new T.Vector3(0,0,-1));
   const hits=ray.intersectObjects(shells,false);
   if(hits.length)assert.ok(point.z-hits[0].point.z>.012,'upper thread enters casing at '+point.toArray());
  }
 }
});

test('descending upper lead crosses cloth and needle plate only inside the needle slot',async()=>{
 const {threadPath}=await import('./thread-path.js');const m=buildSewingMachine(T,{});
 for(let i=0;i<=100;i++){
  const state=cycleAt(i/101),path=threadPath(state),lead=path.slice(0,path.findIndex(p=>p[0]===-.85&&p[1]===state.eyeY&&p[2]===0)+1);
  const curve=new T.CatmullRomCurve3(lead.map(p=>new T.Vector3(...p)),false,'centripetal');
  m.update({...state,cutaway:0});m.group.updateMatrixWorld(true);
  for(const v of curve.getPoints(600))if(v.y>=1.02&&v.y<=1.17){
   assert.ok(Math.abs(v.x+.85)+.011<.0475,'lead outside needle slot X');
   assert.ok(Math.abs(v.z)+.011<.065,'lead outside needle slot Z: '+v.toArray());
  }
  const tube=new T.TubeGeometry(curve,600,.011,5,false),vertices=tube.attributes.position;
  for(let j=0;j<vertices.count;j++)if(vertices.getY(j)>=1.045&&vertices.getY(j)<=1.11){
   assert.ok(Math.abs(vertices.getX(j)+.85)<.0475);
   assert.ok(Math.abs(vertices.getZ(j))<.065,'upper lead tube crosses plate outside needle slot');
  }
  tube.dispose();
 }
});

test('upper lead leaves physical clearance around the moving needle and needle-bar guide',async()=>{
 const {threadPath}=await import('./thread-path.js'),m=buildSewingMachine(T,{});
 for(let i=0;i<=100;i++){
  const state=cycleAt(i/101);m.update({...state,cutaway:0});m.group.updateMatrixWorld(true);
  const path=threadPath(state),lead=path.slice(0,path.findIndex(p=>p[0]===-.85&&p[1]===state.eyeY&&p[2]===0)+1);
  const curve=new T.CatmullRomCurve3(lead.map(p=>new T.Vector3(...p)),false,'centripetal');
  for(const p of curve.getPoints(600))for(const name of ['Needle shank','Needle blade','Needle bar upper guide']){
   const object=m.group.getObjectByName(name),local=object.worldToLocal(p.clone()),g=object.geometry.parameters;
   const radial=Math.hypot(local.x,local.z)-g.radiusTop,vertical=Math.abs(local.y)-g.height/2;
   const distance=Math.hypot(Math.max(radial,0),Math.max(vertical,0))+Math.min(Math.max(radial,vertical),0);
   assert.ok(distance>.012,name+' intersects upper thread at '+state.phase);
  }
 }
});
