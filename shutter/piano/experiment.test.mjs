import assert from 'node:assert/strict';
import {createExperiment} from './experiment.js';
let now=0;const events=[];const audio=Object.fromEntries(['prepareObservation','strikeObservation','releaseObservation','stopObservation'].map(k=>[k,(...args)=>events.push([k,...args])]));
const record=Object.freeze({midi:69,duration:120,pedal:false}),lab=createExperiment(audio,()=>now);
lab.enter(record);lab.pluck();assert(events.some(e=>e[0]==='strikeObservation'&&e[1]===69));assert.equal(events.at(-1)[0],'releaseObservation');
lab.toggleDamper();assert.equal(lab.frame().damper,1);lab.pluck();assert.equal(events.at(-1)[0],'strikeObservation');now=100;assert(lab.frame().vibration>0);lab.toggleDamper();now=700;assert(lab.frame().vibration<.001);
lab.strike();let count=events.filter(e=>e[0]==='strikeObservation').length;now=1300;lab.frame();assert.equal(events.filter(e=>e[0]==='strikeObservation').length,count);now=1320;const m=lab.frame();assert.equal(events.filter(e=>e[0]==='strikeObservation').length,count+1);lab.frame();assert.equal(events.filter(e=>e[0]==='strikeObservation').length,count+1);assert.equal(m.key,0);assert.equal(m.jack,0);
lab.stop();assert.equal(lab.frame().active,false);assert.deepEqual(record,{midi:69,duration:120,pedal:false});
console.log('PASS pluck, damper mute, single hammer strike, isolated performance and stop');
