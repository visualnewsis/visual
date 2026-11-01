import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';import {buildViolin} from './assets/models/violin.js';
const m=buildViolin(T);m.group.updateMatrixWorld(true);
function heights(mesh,x,z){const o=new T.Vector3(x,2,z).applyMatrix4(m.group.matrixWorld),d=new T.Vector3(0,-1,0).transformDirection(m.group.matrixWorld);return new T.Raycaster(o,d).intersectObject(mesh,false).map(h=>m.group.worldToLocal(h.point.clone()).y);}
test('ebony gluing face meets the actual maple neck across every tested neck station',()=>{
 const neck=m.group.getObjectByName('fitted D profile maple neck');
 for(const x of[-1.5,-1.3,-1.1,-.9,-.7])for(const z of[-.06,0,.06]){
  const board=heights(m.parts.fingerboard,x,z),wood=heights(neck,x,z);assert.ok(board.length&&wood.length);assert.ok(Math.abs(Math.min(...board)-Math.max(...wood))<1e-6,'neck/ebony separation '+x+','+z);
 }
});
test('rib wall vertices have horizontal normals, vertical edges and no exterior inner rim',()=>{
 const ribs=m.parts.ribs,p=ribs.geometry.attributes.position,n=ribs.geometry.attributes.normal;
 assert.equal(ribs.userData.violinRibs.innerPointsOutsideOuter,0);let side=0,lips=0;
 for(let i=0;i<p.count;i++){
  assert.ok([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite));
  if(Math.abs(n.getY(i))<1e-7){side++;assert.ok(Math.abs(Math.hypot(n.getX(i),n.getZ(i))-1)<1e-6);assert.ok(Math.min(Math.abs(p.getY(i)-.106),Math.abs(p.getY(i)+.105))<1e-7);}
  else {lips++;assert.ok(Math.abs(Math.abs(n.getY(i))-1)<1e-6);}
 }
 assert.ok(side>100&&lips>100);
});
test('two cork seats physically connect the chinrest bowl to the actual arched plate',()=>{
 const bowl=m.group.getObjectByName('carved ebony chinrest bowl');
 for(let seat=0;seat<2;seat++){
  const pad=m.group.getObjectByName('fitted cork chinrest seat '+seat),p=pad.geometry.attributes.position,columns=new Map();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),k=x+':'+z,v=columns.get(k)||{x,z,min:Infinity,max:-Infinity};v.min=Math.min(v.min,p.getY(i));v.max=Math.max(v.max,p.getY(i));columns.set(k,v);}
  for(const v of columns.values()){const top=heights(m.parts.top,v.x,v.z),rest=heights(bowl,v.x,v.z);assert.ok(top.length&&rest.length,'support outside body/bowl');assert.ok(Math.abs(v.min-Math.max(...top))<1e-6);assert.ok(Math.abs(v.max-Math.min(...rest))<.0002);assert.ok(v.max>v.min);}
 }
});

test('chinrest edge uses dedicated outward wall normals and clears the ebony tailpiece',()=>{
 const bowl=m.group.getObjectByName('carved ebony chinrest bowl'),tail=m.group.getObjectByName('tapered ebony tailpiece'),p=bowl.geometry.attributes.position,n=bowl.geometry.attributes.normal;let walls=0;
 for(let i=0;i<p.count;i++)if(Math.abs(n.getY(i))<1e-8){walls++;assert.ok(Math.abs(Math.hypot(n.getX(i),n.getZ(i))-1)<1e-6);assert.ok((p.getX(i)-.94)*n.getX(i)+(p.getZ(i)+.26)*n.getZ(i)>0);}
 assert.equal(walls,146);
 for(let x=.70;x<1.18;x+=.012)for(let z=-.38;z<-.08;z+=.008){const a=heights(bowl,x,z),b=heights(tail,x,z);if(a.length&&b.length){const loA=Math.min(...a),hiA=Math.max(...a),loB=Math.min(...b),hiB=Math.max(...b);assert.ok(hiA<=loB||hiB<=loA,'tailpiece intersects chinrest '+x+','+z);}}
});
