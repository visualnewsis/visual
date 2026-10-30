import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {buildProjector}=await import('./assets/projector-hero.js');
const ray=new T.Raycaster(),direction=new T.Vector3(.137,.271,.953).normalize();
function inside(mesh,p){
 const old=mesh.material.side;mesh.material.side=T.DoubleSide;ray.set(p,direction);ray.far=50;
 const distances=ray.intersectObject(mesh,false).map(h=>h.distance).filter(d=>d>1e-7).sort((a,b)=>a-b);mesh.material.side=old;
 return distances.filter((d,i)=>i===0||Math.abs(d-distances[i-1])>1e-6).length%2===1;
}
test('actual film stock points stay outside base feet case gate lens and rotating shutter solids',()=>{
 const h=buildProjector(),solids=[];for(const root of [h.parts.body,h.parts.gate,h.parts.lens,h.parts.lamp,h.parts.shutter,h.parts.idler])root.traverse(o=>{if(o.isMesh&&o.geometry?.type!=='PlaneGeometry'&&o.material.opacity!==0)solids.push(o);});
 for(const phase of Array.from({length:129},(_,i)=>i/128)){
  h.update({frames:phase-.35},true);h.group.updateMatrixWorld(true);const bounds=solids.map(o=>new T.Box3().setFromObject(o,true)),a=h.parts.film.geometry.attributes.position,unique=new Set();
  for(let i=0;i<h.parts.film.geometry.drawRange.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(h.parts.film.matrixWorld),key=p.toArray().map(v=>v.toFixed(6)).join('/');if(unique.has(key))continue;unique.add(key);for(let k=0;k<solids.length;k++)if(bounds[k].containsPoint(p))assert.equal(inside(solids[k],p),false,`film inside ${solids[k].name||solids[k].parent.name} phase${phase} point${p.toArray()}`);}
  const edges=new Set();for(let i=0;i<h.parts.film.geometry.drawRange.count;i+=3)for(const [j,k]of [[0,1],[1,2],[2,0]]){
   const A=new T.Vector3().fromBufferAttribute(a,i+j).applyMatrix4(h.parts.film.matrixWorld),B=new T.Vector3().fromBufferAttribute(a,i+k).applyMatrix4(h.parts.film.matrixWorld),key=[A.toArray().join('/'),B.toArray().join('/')].sort().join('|');if(edges.has(key))continue;edges.add(key);const delta=B.clone().sub(A),length=delta.length();if(length<1e-7)continue;const edgeBox=new T.Box3().setFromPoints([A,B]);
   for(let n=0;n<solids.length;n++)if(bounds[n].intersectsBox(edgeBox)){const old=solids[n].material.side;solids[n].material.side=T.DoubleSide;ray.set(A,delta.clone().normalize());ray.near=1e-6;ray.far=length-1e-6;const hits=ray.intersectObject(solids[n],false);solids[n].material.side=old;ray.near=0;assert.equal(hits.length,0,`film edge through ${solids[n].name||solids[n].parent.name} phase${phase} at${A.toArray()}→${B.toArray()}`);}
  }
 }
});
test('removing the intermittent mechanism hides driver and Geneva while output transport is continuous',()=>{
 const h=buildProjector();h.update({frames:0,continuousFilm:true},true);assert.equal(h.parts.mechanismMount.visible,false);const before=h.parts.sprocket.rotation.z;h.update({frames:.1,continuousFilm:true},true);assert.ok(Math.abs(h.parts.sprocket.rotation.z-before-.1*Math.PI/2)<1e-12);h.update({frames:.1},true);assert.equal(h.parts.mechanismMount.visible,true);
});
test('upper entry guide has exact top and right tangencies with the shutter envelope below it',()=>{
 const h=buildProjector(),arc=h.parts.film.userData.slack.curve.curves[1];assert.deepEqual(arc.getPoint(0).toArray(),[-.15,3,.2]);assert.ok(arc.getPoint(1).distanceTo(new T.Vector3(0,2.85,.2))<1e-12);assert.ok(arc.getTangent(0).dot(new T.Vector3(1,0,0))>.99999);assert.ok(arc.getTangent(1).dot(new T.Vector3(0,-1,0))>.99999);assert.ok(2.85-(1.48+1.25)>.11999);
 const stay=h.group.getObjectByName('Gate rear stay joined to chassis');h.group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(stay);assert.ok(b.max.z<-.315);const base=h.group.getObjectByName('Base plate clear behind stock'),baseBounds=new T.Box3().setFromObject(base);assert.ok(baseBounds.max.z<-.315);for(const foot of h.parts.body.children[0].children.filter(o=>o.name==='Support foot behind stock'))assert.ok(new T.Box3().setFromObject(foot).intersectsBox(baseBounds));
});
test('rotating shutter triangles clear the complete idler solids, and old radius reproduces collision',()=>{
 const h=buildProjector(),sector=h.parts.shutter.children.find(o=>o.isMesh),idlers=h.parts.idler.children.filter(o=>o.isMesh),a=sector.geometry.attributes.position;
 function collision(){const shapeBox=new T.Box3().setFromObject(sector),boxes=idlers.map(o=>new T.Box3().setFromObject(o));for(let i=0;i<a.count;i+=3)for(const [j,k]of [[0,1],[1,2],[2,0]]){const A=new T.Vector3().fromBufferAttribute(a,i+j).applyMatrix4(sector.matrixWorld),B=new T.Vector3().fromBufferAttribute(a,i+k).applyMatrix4(sector.matrixWorld),d=B.clone().sub(A),length=d.length();if(length<1e-8)continue;const edgeBox=new T.Box3().setFromPoints([A,B]);for(let n=0;n<idlers.length;n++)if(shapeBox.intersectsBox(boxes[n])&&edgeBox.intersectsBox(boxes[n])){const old=idlers[n].material.side;idlers[n].material.side=T.DoubleSide;ray.set(A,d.normalize());ray.near=1e-7;ray.far=length-1e-7;const hits=ray.intersectObject(idlers[n],false);idlers[n].material.side=old;ray.near=0;if(hits.length)return true;}}return false;}
 for(let i=0;i<=128;i++){h.update({frames:i/128-.35},true);h.group.updateMatrixWorld(true);assert.equal(collision(),false,'shutter/idler phase '+i/128);}
 sector.scale.set(1.25/1.22,1.25/1.22,1);let reproduced=false;for(let i=0;i<=128&&!reproduced;i++){h.update({frames:i/128-.35},true);h.group.updateMatrixWorld(true);reproduced=collision();}assert.equal(reproduced,true,'old radius should reproduce the physical flange collision');
});
