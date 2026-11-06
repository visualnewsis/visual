import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {buildGuitar} from './assets/models/guitar.js';
import {buildViolin} from './assets/models/violin.js';
const material=new T.MeshStandardMaterial(),materials=Object.fromEntries(['wood','darkWood','ivory','steel','brass','black','felt'].map(k=>[k,material]));
const guitar=buildGuitar(T,materials),violin=buildViolin(T,materials);
assert.deepEqual(guitar.strings.map(s=>s.midi),[40,45,50,55,59,64]);
assert.deepEqual(violin.strings.map(s=>s.midi),[55,62,69,76]);
for(const model of [guitar,violin]){model.group.updateMatrixWorld(true);model.group.traverse(o=>{if(!o.isMesh)return;const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++)assert.ok(Number.isFinite(positions.getX(i))&&Number.isFinite(positions.getY(i))&&Number.isFinite(positions.getZ(i)),o.name+' nonfinite geometry');});for(const s of model.strings){assert.ok(s.to[0]>s.from[0]);assert.ok(Math.abs(s.to[2])<.25);}}
assert.equal(guitar.group.userData.scaleLength,guitar.strings[0].to[0]-guitar.strings[0].from[0]);
assert.equal(guitar.group.userData.fretCount,guitar.parts.frets.children.length);
for(const s of violin.strings){assert.equal(s.to[0],.18);assert.ok(s.to[1]>.25);assert.deepEqual(s.afterlengthMesh?true:false,true);}
const top=violin.parts.top.geometry.attributes.normal;let positive=0;for(let i=0;i<top.count;i++)if(top.getY(i)>0)positive++;assert.ok(positive/top.count>.99,'arched plate normals face up');
const holeRay=new T.Raycaster(new T.Vector3(.46,1,.23),new T.Vector3(0,-1,0));assert.equal(holeRay.intersectObject(violin.parts.top).length,0,'f-hole is an opening, not paint on a solid soundboard');assert.ok(violin.parts.top.geometry.attributes.uv,'soundboard has texture coordinates');
const contact=violin.bow.userData.contactLocal;assert.ok(Math.abs(violin.bow.userData.hairCenterlineY-contact[1])<.006,'bow hair meets selected string');
for(const model of [guitar,violin]){const rib=new T.Box3().setFromObject(model.parts.ribs);assert.ok(rib.max.y>0&&rib.min.y<-.1,'ribs connect upper and lower plates');}
console.log('PASS instrument geometry: 10 tuned strings, finite meshes, fret scale, upright bridge endpoints, upward arch normals, bow contact and connected ribs');
