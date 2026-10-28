import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {projectorAssembly}=await import('./assets/anatomy-optics.js');
const {buildProjectorGateStudy,buildProjectorFramesStudy,projectorTransport}=await import('./assets/projector-lessons.js');
const {espressoAssembly}=await import('./assets/anatomy-espresso.js');
const {espressoSequence}=await import('./assets/espresso-sequence.js');
const {buildEspresso}=await import('./assets/models/espresso.js');
test('actual sector occludes the complete landscape gate throughout film transport',()=>{
 const m=projectorAssembly(),sh=m.components.find(c=>c.id==='shutter').object,meshes=[];sh.traverse(o=>{if(o.isMesh)meshes.push(o)});
 const ray=new T.Raycaster();for(let i=0;i<=70;i++){const p=.65+i/70*.34999;m.update({phase:p,explode:0});m.group.updateMatrixWorld(true);for(const x of [-.47,0,.47])for(const y of [-.35,0,.35]){ray.set(new T.Vector3(x,.4+y,-.60),new T.Vector3(0,0,1));assert.ok(ray.intersectObjects(meshes).length,'uncovered gate at '+p);}}
 for(const p of [.25,.35,.45]){m.update({phase:p});m.group.updateMatrixWorld(true);ray.set(new T.Vector3(0,.4,-.60),new T.Vector3(0,0,1));assert.equal(ray.intersectObjects(meshes).length,0);}
});
test('16 sprocket teeth advance four holes per quarter turn with a common Geneva shaft',()=>{
 const m=projectorAssembly(),sp=m.group.getObjectByName('intermittent sprocket'),star=m.group.getObjectByName('four slot Geneva wheel');
 for(const p of [.65,.72,.82,.95,.99999]){m.update({phase:p});m.group.updateMatrixWorld(true);const travel=-m.group.getObjectByName('continuous perforated strip').position.y;assert.ok(Math.abs(travel-sp.rotation.x*(.75/(Math.PI/2)))<1e-9);assert.ok(Math.abs(sp.rotation.x-(star.rotation.z+Math.PI/4))<1e-9);const axis=new T.Vector3(0,0,1).transformDirection(star.parent.matrixWorld);assert.ok(axis.distanceTo(new T.Vector3(1,0,0))<1e-8);}
 assert.ok(Math.abs((.75/(Math.PI/2))*2*Math.PI/16-.1875)<1e-10);
});
test('projector comparison removes physical shutter and continuous mode really moves during exposure',()=>{
 const m=buildProjectorGateStudy(),s={...m.defaults,cycle:.35};m.update(s);const y=m.parts.film.position.y;assert.ok(Math.abs(y)<1e-12);assert.equal(s.openFraction,1);s.mode=1;m.update(s);assert.equal(m.parts.shutter.visible,false);s.mode=2;m.update(s);assert.equal(m.parts.shutter.visible,true);assert.ok(m.parts.film.position.y<0);assert.ok(Math.abs(projectorTransport(.82).progress-(-projectorAssemblyPosition(.82)/.75))<1e-8);
 function projectorAssemblyPosition(p){const a=projectorAssembly();a.update({phase:p});return a.group.getObjectByName('continuous perforated strip').position.y;}
 const f=buildProjectorFramesStudy(),fs={...f.defaults,frame:23};f.update(fs);f.advance(fs,1/12);f.update(fs);assert.equal(fs.frameIndex,0);
});
test('espresso reaches the coffee outlet before stream and cup, then fill increases monotonically',()=>{
 const m=espressoAssembly();let prev=0;for(let i=0;i<=100;i++){const p=i/100,q=espressoSequence(p);m.update({phase:p,explode:0});assert.ok(q.fill>=prev);prev=q.fill;if(p<=.8){assert.equal(q.pouring,false);assert.equal(q.fill,0);}if(p<=.84)assert.ok(q.fill<1e-12);assert.deepEqual(m.group.userData.flowSequence,q);}
 m.update({phase:.95,explode:1});const drops=[];m.group.traverse(o=>{if(o.geometry?.type==='SphereGeometry'&&o.geometry.parameters.radius===.045)drops.push(o)});assert.ok(drops.every(o=>!o.visible));
});
test('actual hero gauge needle aligns with its indexed ticks at every pressure',()=>{
 const mats={};for(const n of ['steel','black','ivory','red','brass','glass','coffee','wood','darkWood','felt','leather'])mats[n]=new T.MeshStandardMaterial();const m=buildEspresso(T,mats),pivot=m.parts.gauge.children.find(o=>o.isGroup);assert.ok(pivot);for(const p of [0,3,6,9,12]){m.update({pressure:p,volume:0});const actual=new T.Vector2(-Math.sin(pivot.rotation.z),Math.cos(pivot.rotation.z)),angle=(-.75+p/12*1.5)*Math.PI;assert.ok(actual.distanceTo(new T.Vector2(Math.sin(angle),Math.cos(angle)))<1e-10);}
});

const {buildCoffeeComparison}=await import('./assets/coffee-detail.js');
test('coffee routes occupy particle depth, change with grind, and first liquid grows down from filter',()=>{
 const m=buildCoffeeComparison(),s={...m.defaults,time:.8,grind:70};m.update(s);let paths=[],streams=[],liquids=[];m.group.traverse(o=>{if(o.name.startsWith('continuous pore flow'))paths.push(o);if(o.name.startsWith('espresso continuous outlet strand'))streams.push(o);if(o.name==='coffee volume')liquids.push(o)});
 assert.equal(paths.length,24);const before=paths[12].userData.poreRoute.map(p=>p[0]);s.grind=90;m.update(s);assert.notDeepEqual(paths[12].userData.poreRoute.map(p=>p[0]),before);assert.ok(paths.every(o=>o.userData.poreRoute.every(p=>p[2]===.125)));
 s.time=1.1;m.update(s);for(const o of streams.filter(o=>o.visible)){o.updateMatrixWorld(true);const b=new T.Box3().setFromObject(o);assert.ok(Math.abs(b.max.y+ .423)<.03);}
 assert.ok(liquids.every(o=>!o.visible));
});

test('pump is active before every teaching-clock water motion',()=>{for(let i=1;i<1000;i++)assert.equal(espressoSequence(i/1000).pump,true);assert.equal(espressoSequence(0).pump,false);assert.equal(espressoSequence(1).pump,false);});
test('rendered hero machine pipes terminate on actual pump and boiler surfaces',()=>{
 const m=buildEspresso(T),p=m.parts.pipes;const expected={
 'tank outlet to pump inlet':[[1.02,.33,-.54],[1.13,.57,.24]],
 'pump outlet to boiler endcap':[[.47,.57,.24],[.235,1.47,-.43]],
 'boiler surface to grouphead inlet':[[-.43,2,-.43],[-.62,2.37,1.27647]]};
 for(const [name,ends]of Object.entries(expected)){const pipe=p.getObjectByName(name),curve=pipe.geometry.parameters.path;assert.ok(pipe);assert.ok(curve.getPoint(0).distanceTo(new T.Vector3(...ends[0]))<1e-10);assert.ok(curve.getPoint(1).distanceTo(new T.Vector3(...ends[1]))<1e-10);}
 const handle=m.parts.cup.getObjectByName('cup handle attached outside wall');assert.ok(Math.abs((handle.position.x-.18-.042)-(-.62+.30+(.58-.28)/.62*.08))<.03);
 for(const volume of [0,10,20,40]){m.update({locked:true,brewing:true,pressure:9,volume});m.group.updateMatrixWorld(true);const surface=.31+.45*volume/40;for(const stream of m.parts.cup.children.filter(o=>o.name==='coffee from spout to current surface')){const box=new T.Box3().setFromObject(stream);assert.ok(Math.abs(box.max.y-.96)<1e-7);assert.ok(Math.abs(box.min.y-surface)<1e-7);}}
});

test('projector moving film and shutter clear actual gate and Geneva surfaces',()=>{
 const m=projectorAssembly(),gate=m.components.find(c=>c.id==='gate').object,film=m.group.getObjectByName('continuous perforated strip'),shutter=m.components.find(c=>c.id==='shutter').object.children[0],star=m.group.getObjectByName('four slot Geneva wheel');
 for(let i=0;i<=100;i++){m.update({phase:i/100,explode:0});m.group.updateMatrixWorld(true);const filmBox=new T.Box3().setFromObject(film),shutterBox=new T.Box3().setFromObject(shutter),starBox=new T.Box3().setFromObject(star,true);for(const o of gate.children){const box=new T.Box3().setFromObject(o);assert.equal(box.intersectsBox(filmBox),false,'gate/film volume overlap at '+i);}assert.ok(shutterBox.min.z>starBox.max.z+.02,'shutter/Geneva plane separation at '+i);}
});
const {buildEspressoStudy}=await import('./assets/quality-replacements.js');const {materials:studyMaterials}=await import('./assets/quality-kit.js');
test('active replacement machine starts its visible stream below the actual spout outlet',()=>{
 const m=buildEspressoStudy(T,studyMaterials);for(const volume of [0,10,20,40]){m.update({locked:true,brewing:true,pressure:9,volume},false,1000);m.group.updateMatrixWorld(true);const spouts=m.parts.filter.children.filter(o=>o.name.startsWith('detailed filter spout')),streams=m.parts.cup.children.filter(o=>o.name==='detailed coffee stream');assert.equal(spouts.length,2);assert.equal(streams.length,2);const basketBottom=m.parts.filter.children.find(o=>o.geometry?.type==='CylinderGeometry');for(let i=0;i<2;i++){const outlet=new T.Box3().setFromObject(spouts[i]),stream=new T.Box3().setFromObject(streams[i]);assert.ok(Math.abs(stream.max.y-outlet.min.y)<.01);assert.ok(stream.max.y<1.15-.105-.009);assert.ok(stream.min.y<stream.max.y);assert.equal(streams[i].visible,true);}}
 m.update({locked:false,brewing:false,pressure:0,volume:0});assert.ok(m.parts.cup.children.filter(o=>o.name==='detailed coffee stream').every(o=>!o.visible));
});
