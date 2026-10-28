import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {buildGramophone} from './gramophone-model.js';
import {GramophoneAudio} from './audio.js';
import {cycleAt} from '../sewing-machine/motion.js';
import {threadMechanismState} from '../sewing-machine/thread-path.js';
import {buildSewingMachine} from '../sewing-machine/sewing-model.js';
import {buildMXSwitch} from '../assets/models/mx-switch.js';
import {buildKeyboardSpringStudy,buildKeyboardDebounceStudy} from '../assets/keyboard-lessons.js';
test('gramophone pitch circles mesh from barrel through output and governor',()=>{
 const m=buildGramophone(T,{}),s=m.motorSpec;
 assert.ok(Math.abs(Math.hypot(s.barrel[0]-s.intermediate[0],s.barrel[2]-s.intermediate[2])-(s.radii[0]+s.radii[1]))<1e-10);
 assert.ok(Math.abs(Math.hypot(s.intermediate[0],s.intermediate[2])-(s.radii[1]+s.radii[2]))<1e-10);
 assert.ok(Math.abs(-s.governorZ-(.3+4/30))<1e-10);
 m.update({angle:1.7});const at=n=>m.group.getObjectByName(n).rotation.y;
 assert.ok(Math.abs(at('Motor gear 20 teeth')*20+at('Motor pinion 12 teeth')*12)<1e-10);
 assert.ok(Math.abs(at('Mainspring barrel')*30+at('Motor gear 20 teeth')*20)<1e-10);
});
test('governor collar closes a real gap at the displayed reference speed',()=>{
 const m=buildGramophone(T,{}),disc=m.group.getObjectByName('governor friction disc'),pad=m.group.getObjectByName('friction pad');
 m.update({governorRpm:0});m.group.updateMatrixWorld(true);
 assert.ok(new T.Box3().setFromObject(pad).min.y-new T.Box3().setFromObject(disc).max.y>.06);
 m.update({governorRpm:78});m.group.updateMatrixWorld(true);
 assert.ok(Math.abs(new T.Box3().setFromObject(pad).min.y-new T.Box3().setFromObject(disc).max.y)<1e-7);
 assert.equal(m.parts.motor.userData.governorContact,true);
});
test('soundbox lever displaces diaphragm centre while its rim stays fixed',()=>{
 const m=buildGramophone(T,{}),diaphragm=m.group.getObjectByName('vertical diaphragm'),lever=m.group.getObjectByName('Soundbox needle lever');
 m.update({signal:0});const before=diaphragm.geometry.attributes.position.array.slice();m.update({signal:1});
 const after=diaphragm.geometry.attributes.position;let centreMoved=false;
 for(let i=0;i<after.count;i++){const j=i*3,r=Math.hypot(before[j],before[j+2]),delta=Math.abs(after.getY(i)-before[j+1]);
  if(r>.164)assert.ok(delta<1e-7);if(r<1e-6&&delta>.001)centreMoved=true;assert.ok(Number.isFinite(after.getY(i)));}
 assert.ok(centreMoved);assert.ok(lever.rotation.z>0);m.update({signal:0});
 assert.ok(diaphragm.geometry.attributes.position.array.every((v,i)=>Math.abs(v-before[i])<1e-7));
});
test('visible gramophone signal follows note envelope and has no signal at record end',()=>{
 const a=new GramophoneAudio();assert.equal(a.visualSignal(0),0);assert.equal(a.visualSignal(24),0);
 assert.ok(Array.from({length:240},(_,i)=>a.visualSignal(i/10)).some(v=>Math.abs(v)>.4));
 for(let i=0;i<2400;i++)assert.ok(Math.abs(a.visualSignal(i/100))<=1);
});
test('sewing lower thread stays at preceding lock through hook wrap and recovers continuously',()=>{
 const state=p=>({...cycleAt(p,3),stitches:[3],travel:3});
 const z=p=>threadMechanismState(state(p)).lower[5][2];
 assert.ok(Math.abs(z(.24)-z(.26))<1e-10);
 assert.ok(Math.abs(z(.58)-z(.83))<1e-10);
 for(const p of [.25,.88,.94,.96])assert.ok(Math.abs(z(p-1e-7)-z(p+1e-7))<1e-5);
 assert.ok(Math.abs(z(1-1e-8)-z(0))<1e-8);
 const a=threadMechanismState(state(.70));assert.deepEqual(a.upper,threadMechanismState(state(.70)).upper);
});
test('completed sewing locks remain attached to moving cloth',()=>{
 const m=buildSewingMachine(T,{});m.update({...cycleAt(0),stitches:[],travel:0});
 const upper=m.group.getObjectByName('Upper stitch loop 0'),lower=m.group.getObjectByName('Lower stitch lock 0');
 assert.equal(upper.visible,false);m.update({...cycleAt(0),stitches:[3],travel:3});assert.equal(upper.visible,true);assert.equal(lower.visible,true);
 assert.equal(upper.parent.parent,m.parts.fabric);
 const top=upper.geometry.attributes.position,bottom=lower.geometry.attributes.position;
 assert.ok(Math.abs(top.getZ(0)-bottom.getZ(0))<1e-8);
 assert.ok(Math.min(...Array.from({length:top.count},(_,i)=>top.getY(i)))<0);
 assert.ok(Math.max(...Array.from({length:bottom.count},(_,i)=>bottom.getY(i)))>0);
});
test('keyboard spring and debounce lessons use the same physical contacts with distinct filtered registration',()=>{
 const m=buildKeyboardSpringStudy(),s={...m.defaults,travel:1.9};m.update(s);assert.equal(m.parts.movingLeaf.userData.closed,false);
 s.travel=2;m.update(s);assert.equal(m.parts.movingLeaf.userData.closed,true);const force=s.force;s.stiffness=80;m.update(s);assert.ok(s.force>force);
 const d=buildKeyboardDebounceStudy(),state={...d.defaults,time:.0035};d.update(state);assert.equal(state.raw,true);assert.equal(state.filtered,false);
 state.time=.026;d.update(state);assert.equal(state.filtered,true);state.time=.05;d.update(state);assert.equal(state.filtered,true);
 state.time=0;d.action('press',state);d.advance(state,10);assert.equal(state.time,.05);assert.equal(state.running,false);
});

test('gramophone platter and every coaxial output wheel share direction and displacement',()=>{
 const m=buildGramophone(T,{});
 for(const angle of [-3,0,.2,2,18]){m.update({angle});
  assert.equal(m.parts.record.rotation.y,m.group.getObjectByName('Motor pinion 12 teeth').rotation.y);
  assert.equal(m.parts.record.rotation.y,m.group.getObjectByName('Platter governor wheel 18 teeth').rotation.y);}
});
test('completed sewing lock is at the previous pierced hole, never ahead beneath the needle',()=>{
 const m=buildSewingMachine(T,{});
 for(const phase of [0,.1,.19,.24,.5,.83]){const state={...cycleAt(phase,3),stitches:[2,3],travel:5};m.update(state);m.group.updateMatrixWorld(true);
  const line=m.group.getObjectByName('Upper stitch loop 1'),p=new T.Vector3().fromBufferAttribute(line.geometry.attributes.position,0).applyMatrix4(line.matrixWorld);
  const shared=threadMechanismState(state);assert.ok(Math.abs(p.z-shared.lock[2])<1e-7);assert.ok(p.z<-.1);
  if(phase<.20)assert.ok(Math.abs(shared.upper[14][2]-shared.lock[2])<1e-8);
  if(phase>=.20&&phase<.25)assert.equal(shared.upper.length,13);
 }
});
test('MX cam and rear support route through a real housing notch over the whole stroke',()=>{
 const m=buildMXSwitch(T,{}),ring=m.parts.upperHousing.children.find(o=>o.geometry.type==='ExtrudeGeometry');
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
 for(let i=0;i<=80;i++){m.update({travel:i/20});m.group.updateMatrixWorld(true);
  for(const name of ['contact release cam','cam outer support','cam slider web']){
   const b=new T.Box3().setFromObject(m.group.getObjectByName(name));if(b.max.y<-.09||b.min.y>.07)continue;
   for(let x=1;x<10;x++)for(let z=1;z<10;z++){ray.set(new T.Vector3(T.MathUtils.lerp(b.min.x,b.max.x,x/10),.20,T.MathUtils.lerp(b.min.z,b.max.z,z/10)),down);
    assert.equal(ray.intersectObject(ring).length,0,name+' occupies aperture, never the upper ring');}
  }
 }
});
test('debounce opens only the electrical leaf while the pressed key keeps a continuous downward stroke',()=>{
 const d=buildKeyboardDebounceStudy(),s={...d.defaults};let previous=0;
 for(let i=0;i<=500;i++){s.time=i/10000;d.update(s);const y=d.parts.keycap.position.y;
  assert.ok(y<=previous+1e-8);assert.ok(previous-y<=.22/.003*.0001+1e-8);previous=y;
  if(s.time>=.003){assert.equal(d.parts.movingLeaf.userData.closed,s.raw);
   d.group.updateMatrixWorld(true);let moving,fixed;
   d.parts.movingLeaf.traverse(o=>{if(o.geometry?.type==='SphereGeometry')moving=o;});d.parts.fixedContact.traverse(o=>{if(o.geometry?.type==='SphereGeometry')fixed=o;});
   const gap=moving.getWorldPosition(new T.Vector3()).distanceTo(fixed.getWorldPosition(new T.Vector3()))-.104;
   if(s.raw)assert.ok(Math.abs(gap)<1e-6);else assert.ok(gap>.005);
  }
 }
});
