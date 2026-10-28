import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {buildWatchCase} from './assets/watch-case.js';
test('four lug bores are real open triangulated passages with solid metal around them',()=>{
 const m=buildWatchCase(T);m.group.updateMatrixWorld(true);assert.equal(m.parts.lugBores.length,4);
 for(const b of m.parts.lugBores){
  for(const direction of [-1,1])for(const offset of [0,.025,.048,.060])for(let j=0;j<8;j++){
   const a=j*Math.PI/4,o=new T.Vector3(direction<0?2.1:-2.1,b.y+Math.cos(a)*offset,b.z+Math.sin(a)*offset),ray=new T.Raycaster(o,new T.Vector3(direction,0,0),0,4.2);
   assert.equal(ray.intersectObject(b.geometry,false).length,0,'empty bore may not be a painted mouth');
  }
  for(const delta of [-.12,.12])assert.ok(new T.Raycaster(new T.Vector3(-2.1,b.y,b.z+delta),new T.Vector3(1,0,0),0,4.2).intersectObject(b.geometry,false).length,'solid lug must surround its hole');
 }
});
test('plunger metal fits in real lug holes while sleeve collars leave the sliding core open',()=>{
 const m=buildWatchCase(T);m.group.updateMatrixWorld(true);
 for(const p of m.parts.springPlungers){const v=p.geometry.attributes.position,q=new T.Vector3();for(let i=0;i<v.count;i++){q.fromBufferAttribute(v,i).applyMatrix4(p.matrixWorld);const b=m.parts.lugBores.find(b=>Math.abs(b.z-q.z)<.1&&(q.x>0)===(b.xMin>0));if(!b)continue;if(q.x>=b.xMin&&q.x<=b.xMax)assert.ok(Math.hypot(q.y-b.y,q.z-b.z)<.060,'tip metal must remain inside the open bore');}}
 m.group.traverse(o=>{if(!o.name.includes('retaining-collar')&&!o.name.includes('springbar-shoulder'))return;const p=o.geometry.attributes.position;let r=Infinity;for(let i=0;i<p.count;i++)r=Math.min(r,Math.hypot(p.getX(i),p.getZ(i)));assert.ok(r>=.0439,'collar may not obstruct the sliding plunger');});
});
test('lug roots flare and soften toward the case, rather than constant-width rectangular rails',()=>{
 const m=buildWatchCase(T);for(const b of m.parts.lugBores){const p=b.geometry.geometry.attributes.position;let rootMin=Infinity,rootMax=-Infinity,tipMin=Infinity,tipMax=-Infinity;for(let i=0;i<p.count;i++){const z=Math.abs(p.getZ(i)),x=p.getX(i);if(z<2.08){rootMin=Math.min(rootMin,x);rootMax=Math.max(rootMax,x);}if(z>3.05){tipMin=Math.min(tipMin,x);tipMax=Math.max(tipMax,x);}}assert.ok(rootMax-rootMin>(tipMax-tipMin)*1.4,'cast root must widen into the case');assert.ok(b.geometry.geometry.parameters.options.bevelSegments>=3);}
});
test('crown stem has a genuine radial passage through both curved case walls',()=>{
 const m=buildWatchCase(T);m.group.updateMatrixWorld(true);const walls=[];for(const o of m.group.children)if(o.name==='contoured-case-middle'||o.name==='outer-crown-bore-wall'||o.name==='inner-crown-bore-wall'||o.name==='Real radial crown stem passage')walls.push(o);
 for(const delta of [0,.02,.04,.07,.095])for(let j=0;j<8;j++){const a=j*Math.PI/4,ray=new T.Raycaster(new T.Vector3(2.2,m.dimensions.crownY+Math.cos(a)*delta,Math.sin(a)*delta),new T.Vector3(1,0,0),0,.55);assert.equal(ray.intersectObjects(walls,false).length,0,'case must leave actual room for winding stem and sliding clutch');}
 assert.ok(new T.Raycaster(new T.Vector3(2.2,m.dimensions.crownY+.22,0),new T.Vector3(1,0,0),0,.55).intersectObjects(walls,false).length,'solid metal must remain above the real passage');
});
test('both pins retract into their actual sleeve before the spring bar leaves its lug holes',()=>{
 const m=buildWatchCase(T),bar=m.parts.springBars.find(b=>b.userData.direction===1),tips=bar.children.filter(o=>o.name.startsWith('spring-plunger-'));
 for(let i=0;i<=100;i++){const t=i/100;m.updateRelease(t);m.group.updateMatrixWorld(true);if(t<=.60)assert.equal(bar.position.y,0,'may not pull seated pins sideways through lug metal');else{assert.ok(bar.position.y>0);for(const tip of tips){const b=new T.Box3().setFromObject(tip);assert.ok(b.max.x<1.47&&b.min.x>-1.47,'pins must already be free of both lug holes');}}}
 m.updateRelease(0);assert.equal(bar.position.y,0);for(const tip of tips)assert.ok(Math.abs(tip.position.x)>1.5);
});


test('compact head preserves round bores and working spring bar rather than flattening its transform',()=>{const m=buildWatchCase(T);const box=new T.Box3().setFromObject(m.parts.case.middle);assert.ok(box.max.y<1.0);assert.equal(m.dimensions.crownY,.45);m.group.traverse(o=>{assert.equal(o.scale.x,o.scale.y);assert.equal(o.scale.y,o.scale.z);});});
