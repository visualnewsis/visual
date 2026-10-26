import test from 'node:test';import assert from 'node:assert/strict';import {cycleAt,SewingState,PLATE_Y,CATCH_PHASE,MAX_STITCHES} from './motion.js';
test('fabric advances only with the needle clear and feed teeth raised',()=>{for(let i=1;i<10000;i++){const a=cycleAt((i-1)/10000),b=cycleAt(i/10000);if(b.feed-a.feed>1e-10){assert.ok(b.tipY>PLATE_Y);assert.ok(b.feedY>PLATE_Y);}}});
test('a single gesture completes exactly one stitch without skipping when dt is large',()=>{const s=new SewingState();s.start(true);const e=s.advance(10);assert.equal(s.stitches.length,1);assert.equal(s.phase,0);assert.equal(s.running,false);assert.equal(e.filter(v=>v==='stitch').length,1);});
test('pedal release pauses without inventing a completed stitch',()=>{const s=new SewingState();s.start();s.advance(.9);s.stop();const phase=s.phase;s.advance(10);assert.equal(s.phase,phase);assert.equal(s.stitches.length,0);s.start(true);s.advance(10);assert.equal(s.stitches.length,1);});
test('changed length applies to the next stitch and snapshot stays independent',()=>{const s=new SewingState();s.start();s.advance(.7);s.setLength(5);const snapshot=s.capture();s.advance(1);assert.equal(s.stitches[0],3);assert.equal(s.length,5);s.advance(1.6);assert.equal(s.stitches[1],5);assert.equal(snapshot.stitches.length,0);assert.equal(snapshot.length,3);assert.ok(Object.isFrozen(snapshot.stitches));});
test('hook takes two full revolutions per needle cycle and captures after bottom',()=>{const a=cycleAt(.01),b=cycleAt(.99);assert.ok(Math.abs((b.hookAngle-a.hookAngle)/(4*Math.PI)-.98)<1e-9);assert.ok(cycleAt(CATCH_PHASE).eyeY>cycleAt(.5).eyeY);assert.ok(cycleAt(CATCH_PHASE).tipY<PLATE_Y);});
test('feed and needle positions remain continuous at cycle seam',()=>{const a=cycleAt(1-1e-8),b=cycleAt(0);assert.ok(Math.abs(a.feedZ-b.feedZ)<1e-7);assert.ok(Math.abs(a.eyeY-b.eyeY)<1e-7);});
test('finite fabric strip stops the machine at its end',()=>{const s=new SewingState();s.start();s.advance(1000);assert.equal(s.stitches.length,MAX_STITCHES);assert.equal(s.full,true);assert.equal(s.running,false);assert.equal(s.start(),false);});

import * as T from '../piano/vendor/three.module.min.js';import {buildSewingMachine} from './sewing-model.js';import {threadPath} from './thread-path.js';
test('release completes the current stitch then stops at needle-up',()=>{const s=new SewingState();s.start();s.advance(.6);s.release();assert.ok(s.running);s.advance(10);assert.equal(s.stitches.length,1);assert.equal(s.phase,0);assert.equal(s.running,false);});
test('physical needle anchors agree with the same cycle clock and hook has clearance',()=>{const m=buildSewingMachine(T,{});for(let i=0;i<100;i++){const state=cycleAt(i/100);m.update({...state,travel:0,stitches:[]});m.group.updateMatrixWorld(true);const eye=m.anchors.needleEye.getWorldPosition(new T.Vector3()),tip=m.anchors.needleTip.getWorldPosition(new T.Vector3());assert.ok(Math.abs(eye.y-state.eyeY)<1e-8);assert.ok(Math.abs(tip.y-state.tipY)<1e-8);assert.equal(m.parts.bobbinCase.rotation.y,0);}m.update({...cycleAt(CATCH_PHASE),travel:0,stitches:[]});m.group.updateMatrixWorld(true);const hook=m.anchors.hookTip.getWorldPosition(new T.Vector3());assert.ok(Math.abs(hook.z+.04)<1e-8);assert.ok(hook.y>cycleAt(CATCH_PHASE).eyeY&&hook.y<PLATE_Y);const box=new T.Box3().setFromObject(m.parts.fabric);assert.ok(box.max.y-box.min.y<.15);});
test('upper thread route stays outside the case during wrap and recovery',()=>{for(let i=0;i<1000;i++){const state=cycleAt(i/1000),path=threadPath(state),curve=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p)),false,'centripetal');for(let j=0;j<=250;j++){const v=curve.getPoint(j/250);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));if(v.y>.5825&&v.y<.75)assert.ok(Math.hypot(v.x+.85,v.z+.42)>.23);}}});
test('thread route uses local coordinates even after scene transform',()=>{const m=buildSewingMachine(T,{});m.group.scale.setScalar(2);m.group.position.set(3,4,5);const state=cycleAt(.7);m.update({...state,travel:0,stitches:[]});m.group.updateMatrixWorld(true);const eye=m.anchors.needleEye.getWorldPosition(new T.Vector3());assert.ok(Math.abs(eye.y-(4+state.eyeY*2))<1e-8);const line=m.parts.threads.children.find(o=>o.name==='Continuous upper thread');assert.ok(line.geometry.boundingSphere===null||Number.isFinite(line.geometry.boundingSphere.radius));});

test('a short pedal tap still finishes one stitch and cancelled presses cannot resume',()=>{const s=new SewingState();s.start();s.release();assert.ok(s.running);s.advance(5);assert.equal(s.stitches.length,1);s.start();s.advance(.3);s.stop();s.release();assert.equal(s.running,false);});
test('a one-stitch action cannot replace an active pedal session',()=>{const s=new SewingState();s.start(false);s.start(true);assert.equal(s.holding,true);});


test('handwheel spins in a fixed vertical plane, once per stitch, toward the operator',()=>{
 const model=buildSewingMachine(T,{}), wheel=model.parts.handwheel;
 const localTop=new T.Vector3(.31,0,0), axle=new T.Vector3(0,1,0);
 for(const phase of [0,.125,.25,.5,.75,.99]){
  model.update({...cycleAt(phase),travel:0,stitches:[]});
  model.group.updateMatrixWorld(true);
  const normal=axle.clone().transformDirection(wheel.matrixWorld);
  assert.ok(Math.abs(Math.abs(normal.x)-1)<1e-10);
  assert.ok(Math.abs(normal.y)<1e-10&&Math.abs(normal.z)<1e-10);
  const point=wheel.localToWorld(localTop.clone());
  assert.ok(Math.abs(point.x-2.47)<1e-10);
  assert.ok(Math.abs(wheel.rotation.y+2*Math.PI*phase)<1e-10);
  if(phase===.125)assert.ok(point.z>0,'top of wheel must move toward operator');
 }
});
