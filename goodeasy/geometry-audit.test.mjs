import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
// Texture-only canvas stand-in for geometric checks; this does not test WebGL or audio.
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {watchBuilders}=await import('./assets/research-watch.mjs');
const {otherBuilders}=await import('./assets/research-other.mjs');
const {createAction}=await import('./piano/scene.js');
let meshes=0,models=0;
for(const [name,build] of Object.entries({...watchBuilders,...otherBuilders})){
 const m=build(),s={time:0,charge:50,explode:0,angle:0,phase:0,inertia:100,stiffness:100,seconds:0,rate:1,running:false,open:.8,...m.defaults};
 for(const t of [0,.2,.5,.65,.8,1]){Object.assign(s,{time:t,explode:t,phase:t,cycle:t,angle:t,travel:t*4,seconds:t*3600});m.update(s);m.group.updateMatrixWorld(true);m.group.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite),name+' transform');if(!o.geometry)return;const a=o.geometry.attributes.position;if(!a)return;for(let i=0;i<a.array.length;i++)assert.ok(Number.isFinite(a.array[i]),name+' finite mesh');});}
 m.group.traverse(o=>{if(o.isMesh)meshes++;});models++;
}
const assembly=watchBuilders.assembly();assembly.update({time:30,charge:50,explode:0});const drive=assembly.layers.find(l=>l.userData.id==='윤열'),motion=assembly.layers.find(l=>l.userData.id==='모션워크');
const center=drive.getObjectByName('train-1'),fourth=drive.getObjectByName('train-3');assert.ok(Math.abs(fourth.rotation.y/center.rotation.y-60)<1e-8,'actual center/fourth rotations');
const pair=motion.children.filter(o=>o.userData.teeth&&o.position.x===.75);assert.equal(pair.length,2);assert.equal(pair[0].rotation.y,pair[1].rotation.y,'actual intermediate wheel/pinion share angle');
const root=new T.Group(),action=createAction(root);action.update({key:1,hammer:1,jack:1,damper:1,vibration:0},0,0);root.updateMatrixWorld(true);const head=action.anchors.hammer.object;let maxY=-Infinity;head.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)maxY=Math.max(maxY,new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).y);});
assert.ok(Math.abs(maxY-3.66)<1e-5,'felt crown meets the string at strike without penetrating');
console.log('PIANO hammer peak at strike:',maxY.toFixed(6),'string plane:',3.66,'difference:',(maxY-3.66).toFixed(6));
console.log(`PASS ${models} builders, ${meshes} meshes through six geometry states, actual motionwork and center/fourth rotations. Texture stubs are not a visual quality test.`);

const {buildCamera,buildWatch}=await import('./assets/quality-machines.mjs');
const camera=buildCamera();camera.update({aperture:1.4});camera.group.updateMatrixWorld(true);const iris=camera.parts.aperture;
const probe=new T.Raycaster(new T.Vector3(.15,1.45,5),new T.Vector3(0,0,-1));assert.equal(probe.intersectObject(iris,true).length,0,'large aperture clears off-axis ray');camera.update({aperture:8});camera.group.updateMatrixWorld(true);assert.ok(probe.intersectObject(iris,true).length>0,'small aperture blocks the same ray');
const watch=buildWatch();watch.update({elapsed:60});const visibleWheels=watch.parts.gears.children.filter(o=>o.geometry?.type==='CylinderGeometry');console.log('PASS actual camera aperture ray occlusion at f/1.4 and f/8; watch first-view builder loaded');
