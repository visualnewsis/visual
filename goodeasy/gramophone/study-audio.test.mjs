import test from 'node:test';
import assert from 'node:assert/strict';
import {GramophoneStudyTransport,STUDY_DURATION,gramophoneVisualSignal} from '../assets/gramophone-study-audio.js';
class FakeAudio{
 constructor({defer=false}={}){this.duration=24;this.time=0;this.calls=[];this.waiters=[];this.defer=defer;this.context={state:'running',addEventListener:(name,fn)=>this.stateChange=fn};}
 unlock(){return this.defer?new Promise(resolve=>this.waiters.push(resolve)):Promise.resolve();}
 now(){return this.time;}play(...args){this.calls.push(['play',...args]);}stop(){this.calls.push(['stop']);}
 rate(v){this.calls.push(['rate',v]);}volume(v){this.calls.push(['volume',v]);}visualSignal(p){return gramophoneVisualSignal(p);}
}
test('study import provides pure duration and vibration without creating web audio',()=>{assert.equal(STUDY_DURATION,24);assert.equal(gramophoneVisualSignal(0),0);assert.ok(Number.isFinite(gramophoneVisualSignal(.4)));});
test('study sound and drawn state share source time, speed, pitch and independent owner snapshots',async()=>{
 const audio=new FakeAudio(),p=new GramophoneStudyTransport({audio});await p.play('groove',{position:3,rate:.5,volume:.2});
 assert.equal(audio.calls.find(c=>c[0]==='play')[2],39);audio.time=2;
 const v=p.read('groove');assert.equal(v.position,4);assert.equal(v.progress,4/24);assert.equal(v.signal,audio.visualSignal(4));
 const pitch=v.frequency;p.rate('groove',1);assert.equal(p.read('groove').position,4);assert.equal(p.read('groove').frequency,pitch*2);
 p.stop('other');assert.equal(p.read('groove').playing,true);p.stop('groove');audio.time=8;
 assert.equal(p.read('groove').position,4);assert.equal(p.read('groove').playing,false);
 await p.play('groove');assert.equal(p.read('groove').position,4);
});
test('repeated start from same owner does not create a second voice',async()=>{
 const audio=new FakeAudio(),p=new GramophoneStudyTransport({audio});await p.play('a');await p.play('a');
 assert.equal(audio.calls.filter(c=>c[0]==='play').length,1);
});
test('stop cancels delayed audio permission and cannot create a late unwanted voice',async()=>{
 const audio=new FakeAudio({defer:true}),p=new GramophoneStudyTransport({audio});
 const pending=p.play('a');p.stop('a');audio.waiters[0]();assert.equal((await pending).state,'cancelled');
 assert.equal(audio.calls.filter(c=>c[0]==='play').length,0);
});
test('late resume from a superseded owner cannot replace the current voice',async()=>{
 const audio=new FakeAudio({defer:true}),p=new GramophoneStudyTransport({audio});
 const a=p.play('a'),b=p.play('b',{position:8});audio.waiters[1]();assert.equal((await b).state,'running');
 audio.waiters[0]();assert.equal((await a).state,'cancelled');assert.equal(p.read('b').playing,true);
 p.stop('a');assert.equal(p.read('b').playing,true);
});
test('visibility loss during resume cancels sound and context suspension pauses at its saved position',async()=>{
 let hidden=false;const audio=new FakeAudio({defer:true}),p=new GramophoneStudyTransport({audio,isHidden:()=>hidden});
 const pending=p.play('a');hidden=true;audio.waiters[0]();assert.equal((await pending).state,'cancelled');
 hidden=false;audio.defer=false;await p.play('a',{position:5});audio.time=3;audio.context.state='suspended';audio.stateChange();
 assert.equal(p.read('a').playing,false);assert.equal(p.read('a').position,8);
});
test('record end stops once while explicit looping uses the same PCM loop and source modulo',async()=>{
 const audio=new FakeAudio(),p=new GramophoneStudyTransport({audio});await p.play('a',{position:23});audio.time=2;
 assert.equal(p.read('a').position,24);assert.equal(p.read('a').playing,false);
 await p.play('b',{position:20,rate:1,loop:true});audio.time=9;assert.equal(p.read('b').position,3);
 assert.equal(audio.calls.filter(c=>c[0]==='play').at(-1)[3].loop,true);
});
