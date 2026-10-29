import test from 'node:test';
import assert from 'node:assert/strict';
import {createWatchExperience} from './assets/watch-experience.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {buildWatch}=await import('./assets/watch-hero.js');
test('small seconds stays still uncharged, starts when wound, stops empty and resets',()=>{
 const model=buildWatch();let state={turns:0,reserve:0,elapsed:0};
 const controller=createWatchExperience({getState:()=>state,setState:s=>state=s,render:()=>model.update(state)});
 model.update(state);const initial=model.parts.seconds.rotation.y;
 for(let i=0;i<20;i++)controller.tick(.1);
 assert.equal(model.parts.seconds.rotation.y,initial);
 controller.wind(1);for(let i=0;i<20;i++)controller.tick(.1);
 assert.notEqual(model.parts.seconds.rotation.y,initial);
 assert.ok(Math.abs(Math.abs(model.parts.seconds.rotation.y-initial)-Math.PI*2*2/60)<1e-7);
 for(let i=0;i<180;i++)controller.tick(.1);
 assert.equal(state.reserve,0);const empty=model.parts.seconds.rotation.y;
 for(let i=0;i<10;i++)controller.tick(.1);assert.equal(model.parts.seconds.rotation.y,empty);
 controller.reset();assert.equal(model.parts.seconds.rotation.y,initial);
});

