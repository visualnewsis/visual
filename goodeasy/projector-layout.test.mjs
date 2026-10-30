import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {buildProjector}=await import('./assets/projector-hero.js');
const {projectorAssembly}=await import('./assets/anatomy-optics.js');
const {buildProjectorGateStudy}=await import('./assets/projector-lessons.js');
test('35mm stock spans the reel axle, with landscape cells inside separated flanges',()=>{
 const m=buildProjector(),stock=m.parts.film,a=stock.geometry.attributes.position.array;
 assert.deepEqual(stock.userData.widthAxis,[0,0,1]);assert.ok(Math.abs(stock.userData.stockWidth/.56-35/19)<.01);
 for(let i=0;i<stock.geometry.drawRange.count*3;i+=18){assert.ok(Math.abs(a[i]-a[i+3])<1e-7);assert.ok(Math.abs(a[i+1]-a[i+4])<1e-7);}
 for(const f of m.frames){const p=f.object.geometry.parameters;assert.ok(p.width/p.height>1.36&&p.width/p.height<1.39);}
 const flange=m.parts.reel.children.filter(o=>o.geometry?.type==='ExtrudeGeometry'&&o.name!=='Film winding pack between open flanges');assert.equal(flange.length,2);assert.ok(flange[1].position.z-flange[0].position.z>stock.userData.stockWidth);
});
test('film enters the gate along Y and light crosses it on X, with one common Z output shaft',()=>{
 const m=buildProjector();m.group.updateMatrixWorld(true);const path=m.parts.film.userData.path,at=path.findIndex(p=>p[1]===1.48),before=new T.Vector3(...path[at-1]),after=new T.Vector3(...path[at+1]),tangent=after.sub(before).normalize();
 assert.ok(tangent.distanceTo(new T.Vector3(0,-1,0))<1e-10);const optical=new T.Vector3(0,0,1).transformDirection(m.parts.optics.matrixWorld);assert.ok(optical.distanceTo(new T.Vector3(-1,0,0))<1e-10);assert.ok(Math.abs(tangent.dot(optical))<1e-10);
 const a=m.parts.mechanismMount.position,b=m.parts.sprocket.position;assert.ok(Math.abs(a.x-b.x)<1e-12&&Math.abs(a.y-b.y)<1e-12);assert.ok(Math.abs(b.x-.56/(Math.PI/2))<1e-12);
 const gate=m.parts.gate.getWorldPosition(new T.Vector3()),axisOrigin=m.parts.optics.getWorldPosition(new T.Vector3());assert.ok(Math.abs(gate.y-axisOrigin.y)<1e-12&&Math.abs(gate.z-axisOrigin.z)<1e-12);
});
test('hero anatomy and optical study share joined rest coordinates and reversible explosion',()=>{
 const h=buildProjector(),a=projectorAssembly(),study=buildProjectorGateStudy();a.update({phase:.35,explode:0});study.update({...study.defaults,cycle:.35});
 for(const key of ['gate','sprocket','mechanismMount','reels','lens','lamp']){const p=h.parts[key].getWorldPosition(new T.Vector3()),q=a.hardware.parts[key].getWorldPosition(new T.Vector3());assert.ok(p.distanceTo(q)<1e-10,key+' rest mismatch');const r=study.group.getObjectByName(h.parts[key].name).getWorldPosition(new T.Vector3());assert.ok(p.distanceTo(r)<1e-10,key+' study mismatch');}
 const rest=a.components.map(c=>c.object.position.clone());for(let i=0;i<3;i++){a.update({phase:.35,explode:1});a.update({phase:.35,explode:0});a.components.forEach((c,j)=>assert.ok(c.object.position.distanceTo(rest[j])<1e-12));}
});
test('continuous reels turn during gate dwell, while the film image and Geneva output stay still',()=>{
 const h=buildProjector();h.update({frames:0});const reel=h.parts.reel.rotation.z,gate=h.frames[2].object.position.y,star=h.parts.intermittent.rotation.z;h.update({frames:.1});assert.notEqual(h.parts.reel.rotation.z,reel);assert.equal(h.frames[2].object.position.y,gate);assert.equal(h.parts.intermittent.rotation.z,star);
});
test('thin separated reel flanges clear the gate and film leaves winding packs tangentially',()=>{
 const h=buildProjector(),reels=h.parts.reels.children,path=h.parts.film.userData.path,curve=h.parts.film.userData.slack.curve;
 const flanges=reels.map(r=>r.children.filter(o=>o.geometry?.type==='ExtrudeGeometry'&&o.name!=='Film winding pack between open flanges'));
 for(const f of flanges.flat()){assert.equal(f.geometry.parameters.options.depth,.025);f.geometry.computeBoundingBox();assert.ok(f.geometry.boundingBox.max.x>1.79&&f.geometry.boundingBox.max.x<1.81);}
 assert.ok(reels[1].position.x-reels[0].position.x-3.60>.4999);assert.ok(reels.every(r=>r.position.y-1.8>2.35));
 for(const [i,p]of [[0,path[0]],[1,path.at(-1)]]){const r=reels[i],dx=p[0]-r.position.x,dy=p[1]-r.position.y;assert.ok(Math.abs(Math.hypot(dx,dy)-1.05)<1e-10);assert.ok(Math.abs(p[2]-r.position.z)<1e-10);const tangent=curve.getTangent(i);assert.ok(tangent.dot(new T.Vector3(1,0,0))>.99999);const positiveRotationTangent=new T.Vector3(-dy,dx,0).normalize();assert.ok(tangent.dot(positiveRotationTangent)>.99999);}
 h.update({frames:.1});const a=h.parts.reel.rotation.z;h.update({frames:.2});assert.ok(Math.abs((h.parts.reel.rotation.z-a)*1.05-.1*.56)<1e-12);
 assert.ok(h.parts.film.geometry.drawRange.count/30>=Math.ceil(h.parts.film.userData.length/.14));
});
