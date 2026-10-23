import assert from 'node:assert/strict';
import {sampleAction,timing} from './motion.js';
for(const hold of [0,100,300,1800,10000]){
 const t=timing(hold);assert(t.escape<t.strike&&t.strike<t.rebound&&t.rebound<t.release);
 const samples=[];for(let ms=0;ms<=t.duration;ms+=5){const a=sampleAction(ms,hold);samples.push(a.step);for(const key of ['key','hammer','jack','damper','vibration'])assert(Number.isFinite(a[key])&&a[key]>=0&&a[key]<=1.001);}
 assert.deepEqual([...new Set(samples)],[0,1,2,3,4,5]);
 const off=sampleAction(t.duration,hold,false),on=sampleAction(t.duration,hold,true);
 assert.equal(off.key,0);assert.equal(off.damper,0);assert.equal(on.key,0);assert.equal(on.damper,1);assert(on.vibration>0);
 assert(sampleAction(t.escape+140,hold).jack>.9);assert(sampleAction(t.strike,hold).hammer>.99);
}
console.log('PASS action order, finite motion, release and pedal branches across hold durations');
