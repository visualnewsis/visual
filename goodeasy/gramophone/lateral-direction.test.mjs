import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../piano/vendor/three.module.min.js';import {buildGramophone} from './gramophone-model.js';
test('lateral-cut stylus vibration crosses the groove rather than running along it',()=>{
 const m=buildGramophone(T,{});
 // A finite pivoted arm has tracking error; require radial motion to dominate, within 20 degrees.
 for(const progress of[0,.25,.5,.75,1]){
  const points=[];for(const signal of[-.5,.5]){m.update({progress,angle:0,needleDown:true,signal});m.group.updateMatrixWorld(true);points.push(m.anchors.stylusTip.getWorldPosition(new T.Vector3()));}
  const motion=points[1].clone().sub(points[0]);motion.y=0;assert.ok(motion.length()>.0001);motion.normalize();const radial=points[0].clone().add(points[1]).multiplyScalar(.5).sub(new T.Vector3(...m.spec.discCenter));radial.y=0;radial.normalize();assert.ok(Math.abs(motion.dot(radial))>Math.cos(20*Math.PI/180),'lateral movement must align with local disc radius, dot '+motion.dot(radial));
 }
});
