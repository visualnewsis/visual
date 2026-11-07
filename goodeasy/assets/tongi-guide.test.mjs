import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./tongi-guide-core.js',import.meta.url),'utf8');
const {createGuideState,findGuidePosition,intersects}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('two model-case attempts in six seconds offer one hint; background is ignored',()=>{
 const s=createGuideState();s.attempt('background',100);s.attempt('case',200);assert.equal(s.eligible(300),false);
 s.attempt('case',800);assert.equal(s.eligible(900),true);s.shown();s.attempt('case',1000);s.attempt('case',1100);assert.equal(s.eligible(1200),false);
});
test('success between misses and widely separated attempts never imply confusion',()=>{
 const s=createGuideState();s.attempt('case',100);s.attempt('key',200);s.attempt('case',300);assert.equal(s.eligible(400),false);
 s.attempt('case',7000);assert.equal(s.eligible(7100),false);s.experience(true);s.attempt('case',7200);s.attempt('case',7300);assert.equal(s.eligible(7400),false);
});
test('closing, completed navigation, reduced motion, busy state and expiry suppress automatic help',()=>{
 for(const end of ['dismiss','finish']){const s=createGuideState();s.attempt('case',100);s.attempt('case',200);s[end]();assert.equal(s.eligible(300),false);}
 const s=createGuideState();s.attempt('case',100);s.attempt('case',200);assert.equal(s.eligible(300,{reduced:true}),false);assert.equal(s.eligible(300,{blocked:true}),false);assert.equal(s.eligible(10201),false);
});
test('experience is monotonic after clear and browser restoration; storage contains only four booleans',()=>{
 const s=createGuideState();s.experience(true);s.experience(false);assert.equal(s.stage,'next');
 assert.deepEqual(s.export(),{experienced:true,muted:false,autoShown:false,done:false});
 const restored=createGuideState({...s.export(),muted:true,autoShown:true});restored.attempt('case',100);restored.attempt('case',200);assert.equal(restored.eligible(300),false);assert.equal(restored.stage,'next');
});
test('context changes invalidate stale attempts and pending suggestions',()=>{
 const s=createGuideState();s.attempt('case',100);s.attempt('case',200);s.clearAttempts();assert.equal(s.pendingUntil,0);assert.equal(s.eligible(400),false);s.attempt('case',500);assert.equal(s.eligible(600),false);
});
test('placement uses a genuinely empty gap and never covers the target or viewport edges',()=>{
 const target={left:57,top:534,right:467,bottom:622,width:410,height:88};
 const obstacles=[target,{left:57,top:86,right:383,bottom:445},{left:57,top:508,right:200,bottom:524},{left:493,top:109,right:1240,bottom:619}];
 const v={width:1265,top:64,bottom:720};const p=findGuidePosition(target,obstacles,v,{labelTop:508});
 assert.ok(p);assert.equal(p.pose,'down');assert.ok(!obstacles.some(o=>intersects(p,o,2)));assert.ok(p.bottom<=v.bottom);
 const filled=[{left:0,top:0,right:1265,bottom:720}];assert.equal(findGuidePosition(target,filled,v),null);
});
