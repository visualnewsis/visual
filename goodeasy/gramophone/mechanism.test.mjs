import test from 'node:test';
import assert from 'node:assert/strict';
import {Playback,speedFacts,needlePoint} from './playback.js';
import * as T from '../piano/vendor/three.module.min.js';
import {buildGramophone} from './gramophone-model.js';
test('changing speed integrates each interval and preserves stop position',()=>{const p=new Playback();p.start(0);assert.equal(p.read(2),2);p.speed(96,2);assert.equal(p.read(4),2+2*96/78);p.pause(4);assert.equal(p.read(100),p.position);p.start(100);assert.equal(p.read(101),p.position+96/78);});
test('snapshot stays unchanged while live controls move',()=>{const p=new Playback();p.start(0);const s=p.capture(2);p.speed(60,3);p.wind();assert.equal(s.position,2);assert.equal(s.rpm,78);assert.equal(Object.isFrozen(s),true);});
test('twice the speed means octave up and half duration',()=>{const f=speedFacts(156);assert.equal(f.semitones,12);assert.equal(f.duration,12);});
test('exhausted spring cannot start and winding caps reserve',()=>{const p=new Playback();p.reserve=0;assert.equal(p.start(0),false);for(let i=0;i<20;i++)p.wind();assert.equal(p.reserve,1);assert.equal(p.start(0),true);});
test('stylus physically meets selected groove and fixed length arc',()=>{const m=buildGramophone(T,{});for(let i=0;i<=100;i++){const q=i/100;m.update({progress:q,needleLift:0,signal:0});m.group.updateMatrixWorld(true);const actual=m.anchors.stylusTip.getWorldPosition(new T.Vector3()),wanted=needlePoint(q);assert.ok(actual.distanceTo(new T.Vector3(...wanted))<1e-6);assert.ok(Math.abs(Math.hypot(actual.x-1.72,actual.z+.62)-1.7)<1e-6);assert.ok(Math.abs(Math.hypot(actual.x,actual.z)-(1.24-.81*q))<1e-6);}const before=m.parts.horn.matrixWorld.clone();m.update({angle:12,progress:1,needleLift:1,explode:1});m.group.updateMatrixWorld(true);assert.deepEqual(m.parts.horn.matrixWorld.elements,before.elements);assert.ok(m.anchors.stylusTip.getWorldPosition(new T.Vector3()).y>1.23);m.group.traverse(o=>{const v=o.geometry?.attributes.position;if(v)for(const n of v.array)assert.ok(Number.isFinite(n));});});

import {GramophoneAudio} from './audio.js';
test('original PCM melody is nonempty and finite before user input',()=>{const audio=new GramophoneAudio();assert.equal(audio.samples.length,576000);assert.ok(audio.samples.some(v=>Math.abs(v)>.1));assert.ok(audio.samples.every(v=>Number.isFinite(v)&&Math.abs(v)<1));});
test('brake keeps needle in groove while lifting removes contact',()=>{const p=new Playback();p.start(0);p.pause(2);assert.equal(p.view(2).needleLift,0);assert.equal(p.view(3).position,2);p.lift(3);assert.equal(p.view(3).needleLift,1);});

test('the drawn spiral stays under the stylus throughout clockwise rotation',()=>{const m=buildGramophone(T,{});const line=m.parts.record.children.find(o=>o.isLine),positions=line.geometry.attributes.position;for(const i of [0,520,1300,2079,2599]){const q=i/(positions.count-1);m.update({angle:q*24*78/60*Math.PI*2,progress:q,needleLift:0});m.group.updateMatrixWorld(true);const point=new T.Vector3().fromBufferAttribute(positions,i);point.y=1.23;m.parts.record.localToWorld(point);const tip=m.anchors.stylusTip.getWorldPosition(new T.Vector3());assert.ok(point.distanceTo(tip)<1e-5);}});

test('repeated start and winding during playback never rewind the source clock',()=>{const p=new Playback(100);p.start(10);p.start(12);assert.equal(p.read(14),4);p.wind(14);assert.equal(p.position,4);assert.equal(p.read(16),6);});
test('exhausting reserve or reaching record end commits a stable stopped clock',()=>{for(const end of ['spring','record']){const p=new Playback(end==='record'?2:100);p.reserve=end==='spring'?1/90:1;p.start(0);p.commit(3);assert.equal(p.playing,false);const stop=p.position;assert.equal(p.read(100),stop);assert.equal(p.start(100),false);}});
