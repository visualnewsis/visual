import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root='C:/Users/user/.codex/worktrees/dmz-transition-refinement/editshop';
const load=file=>import(pathToFileURL(path.join(root,'dmz/js',file)).href);
const {CameraRig,KEYS}=await load('camera.js');
const {Terrain,W,riverZ}=await load('terrain.js');
const THREE=await load('three.js');
const {createHeroIntro,sequenceAt}=await load('hero.js');
const terrain=new Terrain(200,164),rig=new CameraRig(terrain),position=new THREE.Vector3(),target=new THREE.Vector3();
const style=()=>({setProperty(k,v){this[k]=v;}});
const scroller={vh:900,span(key){return key==='hero'?{a:0,b:4400,T:0,H:5000}:key==='rise'?{b:40000}:{a:39900,b:45000,T:40000,H:5600};}};
let previous=-1;
for(let s=0;s<=4400;s+=5){const seq=sequenceAt(s,scroller);assert(seq.p>=previous);previous=seq.p;}
assert.equal(previous,1);
const dimensions=[[1599,612],[1599,616],[1599,612],[1440,901],[1440,900],[1440,901],[1440,900]];
for(const [width,height] of [[1440,900],[390,844],[390,650],[320,740],[412,915],[844,390]]){
  rig.build(width/height);
  for(let i=0;i<=3000;i++){
    rig.sample(i/3000,position,target);
    assert([...position.toArray(),...target.toArray()].every(Number.isFinite));
    const ground=terrain.heightAt(Math.max(W.xMin,Math.min(W.xMax,position.x)),Math.max(W.zMin,Math.min(W.zMax,position.z)));
    assert(position.y-ground>=3.79,'camera ground clearance');
  }
  rig.sample(0,position,target);
  const camera=new THREE.PerspectiveCamera(rig.fov[0],width/height,1,5000);
  camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
  const points=[null,null,null,null,null,null,...[-310,-160,0,165,300].map(x=>[x,riverZ(x)]),[-230,W.SLL],[380,W.SLL],[-50,W.NLL],[310,W.NLL]].map(p=>{
    if(!p)return null;const v=new THREE.Vector3(p[0],terrain.heightAt(...p)+.9,p[1]).project(camera);return [(v.x+1)/2,(1-v.y)/2];
  });
  const layers=dimensions.map(([w,h],i)=>({naturalWidth:i===6&&width<820?800:w,naturalHeight:i===6&&width<820?1732:h,style:style(),decode:()=>Promise.resolve()}));
  const map={style:style()},source={style:style()},hero={style:style()},rootEl={style:style(),querySelectorAll:()=>layers,querySelector:s=>s==='.intro-map'?map:source};
  globalThis.document={querySelector:()=>hero};
  let ready=false;
  const intro=createHeroIntro(rootEl,{disabled:false,reduceMotion:false,onReady:()=>ready=true});
  intro.mapChanged(points);
  await new Promise(resolve=>setImmediate(resolve));assert(ready);
  for(const returning of [false,true])for(const p of [...Array.from({length:501},(_,i)=>i/500),...Array.from({length:501},(_,i)=>1-i/500)]){
    const seq={p,bridge:0,active:true,returning};
    intro.update(seq,4400*p,height,width,height);intro.entry(seq,width,height,1);
    const visible=[...layers,map].filter(n=>+n.style.opacity>.00001);
    assert(visible.length>=1&&visible.length<=2,'one or two neighboring frames');
    assert(visible.some(n=>+n.style.opacity===1),'opaque base prevents gaps');
    assert(Math.abs(seq.zoom-intro.align.GB.s)<1e-9,'MAP / live 3D scale match');
  }
  for(const t of intro.align.T){assert(t.tx<=.01&&t.ty<=.01&&t.tx+t.s*width>=width-.01&&t.ty+t.s*height>=height-.01,'all aligned image edges cover viewport');}
  const seq={p:.94,bridge:0,active:true,returning:false};intro.update(seq,4136,height,width,height);intro.entry(seq,width,height,1);
  const G=intro.align.GB,live=camera.clone();live.zoom=seq.zoom;live.setViewOffset(width,height,-Math.round(seq.dx),-Math.round(seq.dy),width,height);live.updateProjectionMatrix();live.updateMatrixWorld();
  for(const [x,z] of [[-310,riverZ(-310)],[0,riverZ(0)],[300,riverZ(300)],[-230,W.SLL],[310,W.NLL]]){
    const point=new THREE.Vector3(x,terrain.heightAt(x,z)+.9,z),a=point.clone().project(camera),b=point.clone().project(live);
    const sx=(a.x+1)*width/2*G.s+G.tx,sy=(1-a.y)*height/2*G.s+G.ty;
    assert(Math.hypot(sx-(b.x+1)*width/2,sy-(1-b.y)*height/2)<.72,'MAP/live projection agrees to subpixel precision at every depth');
  }
  console.log(`PASS ${width}x${height}: camera clearance, forward/reverse opacity, exact MAP scale, image coverage`);
}
console.log('PASS: deterministic opening mapping and 6 camera/transition viewports');

// 새 숲·줄기·표면 모듈의 모바일 예산과 접지 좌표를 실제 geometry로 확인한다.
const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},drawImage(){},getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<data.length;i+=4)data.set([128,128,128,255],i);return {data};}};
globalThis.document.createElement=()=>({width:0,height:0,getContext:()=>context});
const {createSurfaceDetail}=await load('surface-detail.js'),{createTreeDetail}=await load('tree-detail.js'),{createCanopy}=await load('canopy.js');
for(const low of [true,false]){
  const surface=createSurfaceDetail(terrain,{low,groundImage:{width:1024,height:1024},cutPlanes:[]});
  assert.equal(surface.stats.drawCalls,2);assert(surface.stats.triangles<(low?8000:14000));
  const trunk=createTreeDetail({low,cutPlanes:[]});assert(trunk.geometry.attributes.position.count/3<=60);
  const canopy=createCanopy(terrain,{low,canopyImage:{width:1024,height:1024},cutPlanes:[]});assert(canopy.count<=(low?2200:4000));
  for(const mesh of [...surface.meshes,canopy.mesh,canopy.shadow]){
    assert([...mesh.geometry.attributes.position.array].every(Number.isFinite));
    if(mesh.instanceMatrix)assert([...mesh.instanceMatrix.array].every(Number.isFinite));
    assert.equal(mesh.material.clipIntersection,true);
  }
  console.log(`PASS ${low?'mobile':'desktop'}: surface ${surface.stats.triangles} triangles, tree ${trunk.geometry.attributes.position.count/3}, canopy ${canopy.count}; finite coordinates and X-ray clipping`);
}
