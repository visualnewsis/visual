import test from 'node:test';import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
function context(){return new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}}),fillText(t){if(/^\d\d \/ 24$/.test(String(t)))this.drawnFrame=Number(String(t).slice(0,2))-1;}},{get:(o,k)=>o[k]??(()=>{})});}
globalThis.document={createElement:()=>{const ctx=context();return {width:1,height:1,getContext:()=>ctx,style:{}};}};
const {buildProjector}=await import('./assets/projector-hero.js');
const {projectorHeroClock}=await import('./assets/projector-hero-clock.js');
test('all film clears both full-width incoming illumination and outgoing projection frusta except at the gate',()=>{
 const h=buildProjector(),films=[h.parts.film,...h.frames.map(f=>f.object)];h.parts.reels.traverse(o=>{if(o.name==='Film winding pack between open flanges')films.push(o);});const ray=new T.Raycaster();
 const segments=[[-.221,.010,.22,.22,.325,.236],[.065,.93,.325,.236,.23,.17],[.93,3.73,.23,.17,1.15,.865]];
 for(const phase of [0,.15,.35,.60,.74,.75,.80,.90,.99]){h.update({frames:phase-.35},true);h.group.updateMatrixWorld(true);for(const [z0,z1,w0,h0,w1,h1]of segments)for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const x=i/6-1,y=j/6-1,A=h.parts.optics.localToWorld(new T.Vector3(x*w0,y*h0,z0)),B=h.parts.optics.localToWorld(new T.Vector3(x*w1,y*h1,z1)),d=B.clone().sub(A);ray.set(A,d.clone().normalize());ray.far=d.length();assert.equal(ray.intersectObjects(films,false).filter(hit=>hit.object.visible).length,0,`film blocks beam phase${phase} at ${i},${j} segment${z0}`);}}
 // Restore the rejected optical orientation: the actual return stock must
 // now fail this same ray test, rather than a test merely echoing constants.
 h.parts.optics.rotation.y=Math.PI/2;h.update({frames:0},true);h.group.updateMatrixWorld(true);ray.set(h.parts.optics.localToWorld(new T.Vector3(0,0,.93)),new T.Vector3(0,0,1).transformDirection(h.parts.optics.matrixWorld));ray.far=2.8;assert.ok(ray.intersectObjects(films,false).length>0);
});
test('actual upper and lower loop arc lengths exchange equal material while gate perforations dwell',()=>{
 const h=buildProjector();let before;
 const gateMarks=()=>{const a=h.parts.film.geometry.attributes.position,marks=[];for(let i=0;i<h.parts.film.geometry.drawRange.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);if(Math.abs(x)<1e-5&&y>1.31&&y<1.65&&Math.abs(z-.6)<.002)marks.push(y);}return [...new Set(marks.map(v=>v.toFixed(3)))].sort();};
 for(const phase of [.25,.35,.45,.60,.74,.85,.99]){h.update({frames:phase-.35},true);const q=h.parts.film.userData.slack,c=projectorHeroClock(phase);assert.ok(Math.abs(q.upperLength-q.upperRestLength-c.buffer*.56)<.0002);assert.ok(Math.abs(q.lowerLength-q.lowerRestLength+c.buffer*.56)<.0002);assert.ok(Math.abs(h.parts.film.userData.offset-(q.upperLength-q.upperRestLength)-c.travel)<.0002);if(phase===.35)before=gateMarks();if(phase===.45)assert.deepEqual(gateMarks(),before);}
});
test('drawn upper frame becomes the next center frame without changing its drawing at index wrap',()=>{
 const h=buildProjector(),upper=h.frames.find(f=>f.index===1),middle=h.frames.find(f=>f.index===0);h.update({frames:.99999-.35});const drawing=upper.ctx.drawnFrame;assert.ok(Math.abs(upper.object.position.y-1.48)<.001);h.update({frames:1-.35});assert.equal(middle.ctx.drawnFrame,drawing);assert.equal(drawing,1);
});
test('screen radiance follows actual rendered sector clearance through the complete cycle',()=>{
 const h=buildProjector(),shutter=[];h.parts.shutter.traverse(o=>{if(o.isMesh)shutter.push(o);});const ray=new T.Raycaster();
 for(let i=0;i<160;i++){const phase=i/160;h.update({frames:phase-.35},true);h.group.updateMatrixWorld(true);let clear=0;for(const x of [-.325,0,.325])for(const y of [-.236,0,.236]){ray.set(h.parts.optics.localToWorld(new T.Vector3(x,y,-.03)),new T.Vector3(0,0,1).transformDirection(h.parts.optics.matrixWorld));ray.far=2;if(!ray.intersectObjects(shutter,false).length)clear++;}assert.equal(h.group.userData.transport.openFraction,clear/9,'actual aperture/clock at '+phase);assert.ok(Math.abs(h.parts.projected.material.color.r-(.045+.955*clear/9))<1e-9);if(phase>=.75)assert.equal(clear,0);}
});
test('continuous feed roller tooth pitch matches actual perforation spacing and its own tangent direction',()=>{
 const h=buildProjector(),r=.56/(Math.PI/2);for(const roller of h.parts.rollers){const teeth=roller.children.filter(o=>o.geometry?.type==='ExtrudeGeometry'&&Math.abs(o.position.z+.445)<1e-8);assert.equal(teeth.length,16);const a=teeth[0].position,b=teeth[1].position;assert.ok(Math.abs(Math.hypot(a.x,a.y)-r)<1e-12);const angle=Math.acos((a.x*b.x+a.y*b.y)/(r*r));assert.ok(Math.abs(angle*r-.14)<1e-12);}
 h.update({frames:0});const a=h.parts.rollers.map(o=>o.rotation.z);h.update({frames:.1});assert.ok(h.parts.rollers[0].rotation.z<a[0]);assert.ok(h.parts.rollers[1].rotation.z>a[1]);
});
test('light hits the actual projected image before its black backing across the screen',()=>{
 const h=buildProjector();h.update({frames:0},true);h.group.updateMatrixWorld(true);const ray=new T.Raycaster(),origin=h.parts.optics.localToWorld(new T.Vector3(0,0,.93));
 for(const x of [-1.05,-.5,0,.5,1.05])for(const y of [-.78,-.35,0,.35,.78]){const target=h.parts.projected.localToWorld(new T.Vector3(x,y,0)),direction=target.clone().sub(origin).normalize();ray.set(origin,direction);ray.far=8;const hits=ray.intersectObject(h.parts.screen,true);assert.ok(hits.length>0);assert.equal(hits[0].object,h.parts.projected,'black backing occludes projected image');assert.ok(direction.clone().negate().dot(h.parts.projected.getWorldDirection(new T.Vector3()))>.8);assert.ok(h.parts.projected.material.color.r>.99);}
 // The previous wrapper flip puts the image behind the solid backing.
 h.parts.screen.rotation.y=Math.PI;h.group.updateMatrixWorld(true);ray.set(origin,h.parts.projected.getWorldPosition(new T.Vector3()).sub(origin).normalize());const rejected=ray.intersectObject(h.parts.screen,true);assert.notEqual(rejected[0].object,h.parts.projected);
});
