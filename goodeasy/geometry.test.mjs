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
// The soundboard and back are closed plates: the outer and inner surfaces
// deliberately have opposite normals. A one-sided plane assertion is invalid.
for(const [part,outward] of [[violin.parts.top,1],[violin.parts.back,-1]]){
 const geometry=part.geometry,n=geometry.attributes.normal,N=n.count/2,position=geometry.attributes.position,index=geometry.index.array;
 assert.ok(Number.isInteger(N));
 for(let i=0;i<N;i++){assert.ok(n.getY(i)*outward>0,'outer plate normals face outside');assert.ok(n.getY(i+N)*outward<0,'inner plate normals face the cavity');}
 for(let i=0;i<index.length;i+=3){const ids=[index[i],index[i+1],index[i+2]],outer=ids.every(i=>i<N),inner=ids.every(i=>i>=N);if(!outer&&!inner)continue;const a=new T.Vector3().fromBufferAttribute(position,ids[0]),b=new T.Vector3().fromBufferAttribute(position,ids[1]),c=new T.Vector3().fromBufferAttribute(position,ids[2]),y=b.sub(a).cross(c.sub(a)).y;assert.ok(y*outward*(outer?1:-1)>0,'actual plate triangle winding faces outside the solid');}
}
for(const z of [-.195,.195]){const origin=new T.Vector3(.18,1,z).applyMatrix4(violin.group.matrixWorld),direction=new T.Vector3(0,-1,0).transformDirection(violin.group.matrixWorld),holeRay=new T.Raycaster(origin,direction);assert.equal(holeRay.intersectObject(violin.parts.top).length,0,'f-hole is an opening through the current curved plate');}
const solidRay=new T.Raycaster(new T.Vector3(.18,1,0).applyMatrix4(violin.group.matrixWorld),new T.Vector3(0,-1,0).transformDirection(violin.group.matrixWorld));assert.ok(solidRay.intersectObject(violin.parts.top).length>0,'central soundboard remains solid');assert.ok(violin.parts.top.geometry.attributes.uv,'soundboard has texture coordinates');
const contact=violin.bow.userData.contactLocal;assert.ok(Math.abs(violin.bow.userData.hairCenterlineY-contact[1])<.006,'bow hair meets selected string');
for(const model of [guitar,violin]){const rib=new T.Box3().setFromObject(model.parts.ribs);assert.ok(rib.max.y>0&&rib.min.y<-.1,'ribs connect upper and lower plates');}
console.log('PASS instrument geometry: 10 tuned strings, finite meshes, fret scale, upright bridge endpoints, closed plate outward and cavity normals, bow contact and connected ribs');
