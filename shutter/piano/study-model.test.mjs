import assert from 'node:assert/strict';
import {stringRatio,repeatedStrikeReady,toneFor} from './study-model.js';
assert.equal(stringRatio(),1);assert.equal(stringRatio(2,1,1),.5);assert.equal(stringRatio(1,4,1),2);assert.equal(stringRatio(1,1,4),.5);assert.throws(()=>stringRatio(0),RangeError);
assert(repeatedStrikeReady('repetition','partial'));assert(!repeatedStrikeReady('full-reset','partial'));assert(repeatedStrikeReady('full-reset','full'));assert(!repeatedStrikeReady('repetition','none'));
assert.equal(toneFor(69).frequency,440);assert.equal(toneFor(69,{length:2}).frequency,220);assert.equal(toneFor(69,{contact:true}).decay,.08);assert.equal(toneFor(69,{velocity:.25}).frequency,toneFor(69,{velocity:1}).frequency);
console.log('PASS ideal-string ratios, pitch-invariant velocity, contact decay and repetition readiness');
