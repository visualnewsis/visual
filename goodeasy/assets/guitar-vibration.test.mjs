import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {attachGuitarVibration,stringDisplacement,VIBRATION_DURATION} from './guitar-vibration.js';
for(const end of [0,1])assert.deepEqual(stringDisplacement(end,150,40),{normal:0,lateral:0});
const group=new T.Group();
const strings=[40,64].map((midi,i)=>{const mesh=new T.Mesh(new T.CylinderGeometry(.002,.002,2,8),new T.MeshStandardMaterial());mesh.rotation.z=-Math.PI/2;mesh.position.z=i*.066;group.add(mesh);return {midi,from:[-1,0,i*.066],to:[1,0,i*.066],mesh};});
const model=attachGuitarVibration(T,{group,strings});
const bases=strings.map(s=>s.mesh.geometry.attributes.position.array.slice());
model.pluck(40,100);model.update({},false,98);
assert(model.isVibrating(40,101),'a RAF frame timestamp before the input must not discard the new pluck');
model.update({},false,100);
const positions=strings[0].mesh.geometry.attributes.position;
assert(positions.count>100,'a cylinder needs interior vertices to actually bend');
let peak=0;
for(let i=0;i<positions.count;i++){
 const delta=Math.abs(positions.array[i*3]-bases[0][i*3]);peak=Math.max(peak,delta);
 if(Math.abs(Math.abs(bases[0][i*3+1])-1)<1e-6)assert(delta<1e-6,'both ends remain fixed');
}
assert(peak>.002&&peak<.005,'the selected string bends subtly within the fret clearance');
assert.deepEqual(strings[1].mesh.geometry.attributes.position.array,bases[1],'unplayed strings remain still');
model.pluck(64,250);model.update({},false,300);
assert(model.isVibrating(40,300)&&model.isVibrating(64,300),'strummed notes animate independently');
model.update({},false,250+VIBRATION_DURATION+1);
for(let i=0;i<2;i++)assert.deepEqual(strings[i].mesh.geometry.attributes.position.array,bases[i],'strings return exactly to their rest geometry');
console.log('PASS fixed ends, visible curvature, per-string overlap and exact decay reset');

const sweeps=Array.from({length:40},(_,i)=>stringDisplacement(.5,i*25,40).lateral);
assert(Math.max(...sweeps)>.004&&Math.min(...sweeps)<-.004,"string moves to both sides without crossing the neighbouring string");
assert(Math.max(...sweeps.map(Math.abs))<=.0076,"hero displacement stays below one fifth of the new centre string spacing");
assert(Math.hypot(...Object.values(stringDisplacement(.5,1050,40)))<.002,"the first movement settles naturally rather than flapping for seconds");
console.log("PASS restrained sweep, neighbour clearance and natural settling");
