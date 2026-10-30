import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {projectorHeroClock,PROJECTOR_PITCH as pitch,PROJECTOR_PERF_PITCH as perforation} from './assets/projector-hero-clock.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildProjector}=await import('./assets/projector-hero.js');
test('one clock holds the frame still through exposure and masks the complete pull-down',()=>{
 let previous=0;for(let i=0;i<1000;i++){const c=projectorHeroClock(i/1000);assert.ok(c.progress>=previous);previous=c.progress;if(c.phase<.75)assert.equal(c.progress,0);if(c.engaged)assert.equal(c.exposed,false);if(c.exposed)assert.equal(c.progress,0);assert.ok(Math.abs(c.sprocketAngle*pitch/(Math.PI/2)-c.travel)<1e-12);}
 assert.ok(projectorHeroClock(.9999999).progress>.99999);assert.equal(pitch/4,perforation);assert.ok(Math.abs(pitch/(Math.PI/2)*TAU/16-perforation)<1e-12);
});
const TAU=Math.PI*2;
test('all public hero parts and finite ribbon geometry survive repeated forward and backward scrubbing',()=>{
 const m=buildProjector();for(const key of ['body','handle','reel','lens','screen'])assert.ok(m.parts[key]);
 for(const f of [0,.3,.67,.8,.999,1,2.7,24.85,.1]){m.update({frames:f,frame:Math.floor(f)%24},true);m.group.updateMatrixWorld(true);const attr=m.parts.film.geometry.attributes.position;for(let i=0;i<m.parts.film.geometry.drawRange.count*3;i++)assert.ok(Number.isFinite(attr.array[i]));const path=m.parts.film.userData.path;assert.deepEqual(path[0],[-1.31,2.83,.2]);assert.deepEqual(path.at(-1),[1.31,2.83,.2]);assert.ok(path.some(p=>p[0]===0&&p[1]===1.48));assert.equal(m.parts.film.userData.perforationPitch,perforation);assert.equal(m.group.userData.transport.exposed,projectorHeroClock(f+.35).exposed);}
});
test('actual sector closes the complete aperture for every transporting phase',()=>{
 const m=buildProjector(),sh=m.parts.shutter,meshes=[];sh.traverse(o=>{if(o.isMesh)meshes.push(o)});const ray=new T.Raycaster();
 for(let i=0;i<70;i++){m.update({frames:.75+i/70*.24999-.35},true);m.group.updateMatrixWorld(true);for(const x of [-.154,0,.154])for(const y of [-.20,0,.20]){ray.set(new T.Vector3(x,1.48+y,.24),new T.Vector3(0,0,1));assert.ok(ray.intersectObjects(meshes).length,'open gate during transport at '+i);}}
});
test('a stopped snapshot has no independent clock and image exposure matches beam',()=>{const m=buildProjector(),beam=m.group.getObjectByName('Gate to screen light frustum');for(const f of [.35,.8,.35]){m.update({frames:f,frame:0});const before=m.parts.reel.rotation.z;m.update({frames:f,frame:0});assert.equal(m.parts.reel.rotation.z,before);assert.equal(beam.visible,projectorHeroClock(f+.35).exposed);}});
test('visible exposure passes the actual aperture and Geneva shares the sprocket axis',()=>{
 const m=buildProjector(),meshes=[];m.parts.shutter.traverse(o=>{if(o.isMesh)meshes.push(o)});const ray=new T.Raycaster();
 for(let i=0;i<=50;i++){const c=projectorHeroClock(.25+i*.18/50);m.update({frames:c.cycle-.35},true);m.group.updateMatrixWorld(true);for(const x of [-.154,0,.154])for(const y of [-.20,0,.20]){ray.set(new T.Vector3(x,1.48+y,.24),new T.Vector3(0,0,1));assert.equal(ray.intersectObjects(meshes).length,0,'beam enabled while sector still covers gate at '+c.phase);}}
 const mount=m.group.getObjectByName('Common transverse Geneva and sprocket shaft');const axis=new T.Vector3(0,0,1).transformDirection(mount.matrixWorld);assert.ok(axis.distanceTo(new T.Vector3(1,0,0))<1e-8);
});


test('integer frame buttons stop at visible exposure rather than a permanently dark screen',()=>{const m=buildProjector(),beam=m.group.getObjectByName('Gate to screen light frustum');for(let i=0;i<24;i++){m.update({frames:i,frame:i});assert.equal(beam.visible,true);assert.equal(m.group.userData.transport.index,i);assert.equal(m.group.userData.transport.progress,0);}});

 test('four-slot drive rotates uniformly and its actual pin clears slot walls through engagement',()=>{
  for(let i=1;i<999;i++){const a=projectorHeroClock(i/1000),b=projectorHeroClock((i+1)/1000);assert.ok(Math.abs((b.theta-a.theta)-Math.PI*2/1000)<1e-10);}
  const m=buildProjector(),mount=m.group.getObjectByName('Common transverse Geneva and sprocket shaft'),pin=m.group.getObjectByName('Geneva driving pin'),star=m.parts.intermittent.children.find(o=>o.isMesh),ray=new T.Raycaster();
  for(let i=0;i<=200;i++){m.update({frames:.75+i/200*.249999-.35},true);m.group.updateMatrixWorld(true);const center=mount.worldToLocal(pin.getWorldPosition(new T.Vector3()));
   for(let k=0;k<8;k++){const a=k*TAU/8,start=mount.localToWorld(new T.Vector3(center.x+Math.cos(a)*.012,center.y+Math.sin(a)*.012,-.12)),dir=new T.Vector3(0,0,1).transformDirection(mount.matrixWorld);ray.set(start,dir);assert.equal(ray.intersectObject(star).length,0,'pin clips slot wall at '+i);}
  }
 });

 test('the rendered Geneva output holds during dwell and accumulates quarter turns across cycles',()=>{
  const m=buildProjector();let last=-Infinity;
  for(let i=0;i<=3000;i++){const frames=i/1000;m.update({frames},true);const clock=projectorHeroClock(frames+.35),angle=m.parts.intermittent.rotation.z;assert.ok(angle>=last-1e-10);if(!clock.engaged&&i>0&&projectorHeroClock(frames+.349).index===clock.index)assert.ok(Math.abs(angle-last)<1e-10);last=angle;}
  m.update({frames:0},true);const a=m.parts.intermittent.rotation.z;m.update({frames:3},true);assert.ok(Math.abs(m.parts.intermittent.rotation.z-a-3*Math.PI/2)<1e-10);
 });
