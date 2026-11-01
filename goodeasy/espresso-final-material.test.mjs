import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildCoffeeComparison,buildBrewRatio}=await import('./assets/coffee-detail.js');
test('wetting front advances from the top before first discharge; no zigzag strands remain',()=>{
 const m=buildCoffeeComparison(),s={...m.defaults,time:0},fronts=[],outlets=[];m.group.traverse(o=>{if(o.name==='saturation front and outlet stream')fronts.push(o);if(o.name==='single espresso outlet stream')outlets.push(o);assert.ok(!o.name.startsWith('continuous pore flow'));});
 assert.equal(fronts.length,2);assert.equal(outlets.length,2);
 for(const t of[0,.1,.3,.6,.8]){s.time=t;m.update(s);for(const f of fronts){assert.ok(f.userData.wettingFront>=0&&f.userData.wettingFront<=1);if(t<=f.userData.firstDropDelay)assert.equal(f.getObjectByName('single espresso outlet stream').visible,false);}}
 s.time=4;m.update(s);for(const f of fronts)assert.equal(f.userData.wettingFront,1);
});
test('falling espresso starts at the real outlet and reaches the actual changing liquid plane',()=>{
 const m=buildCoffeeComparison(),s={...m.defaults};
 for(const time of[.1,.85,1,1.2,2,4,8,15]){s.time=time;m.update(s);m.group.updateMatrixWorld(true);const flows=[],cups=[];m.group.traverse(o=>{if(o.name==='saturation front and outlet stream')flows.push(o);if(o.name==='reference extraction cup'||o.name==='adjusted extraction cup')cups.push(o);});
  for(let i=0;i<2;i++){const flow=flows[i],cup=cups[i],stream=flow.getObjectByName('single espresso outlet stream');if(!stream.visible)continue;const b=new T.Box3().setFromObject(stream),outlet=flow.localToWorld(new T.Vector3(0,-.423,-.045));assert.ok(Math.abs(b.max.y-outlet.y)<1e-6);if(time>=flow.userData.cupFillStart){const surface=cup.localToWorld(new T.Vector3(0,cup.userData.surfaceY,0));assert.ok(Math.abs(b.min.y-surface.y)<1e-6,'stream floats above liquid');}}
 }
});
test('powder and beverage are continuous textured surfaces with no separate nut-sized chunks',()=>{
 const m=buildBrewRatio();m.update({...m.defaults,dose:18,yield:36});const grounds=m.group.getObjectByName('visible tamped coffee face'),liquid=m.group.getObjectByName('coffee surface');assert.ok(grounds.material.map?.isDataTexture);assert.ok(liquid.material.map?.isDataTexture);assert.notEqual(grounds.material.map,liquid.material.map);assert.equal(m.group.getObjectByName('surface granules'),undefined);assert.equal(liquid.children.length,0);assert.ok(grounds.material.roughness>.9&&liquid.material.roughness>=.55);assert.equal(liquid.material.metalness,0);
});
