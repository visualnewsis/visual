from pathlib import Path
p=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy\second-review-clearance.test.mjs');p.write_text('''import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';import {buildViolin} from './assets/models/violin.js';import {buildGramophone} from './gramophone/gramophone-model.js';
test('chinrest clamps clear the actual top and back plate solids',()=>{
 const m=buildViolin(T);m.group.updateMatrixWorld(true);let checked=0;const cache=new Map();
 for(const plate of[m.parts.top,m.parts.back]){
  for(const clamp of [m.group.getObjectByName('continuous external chinrest clamp 0'),m.group.getObjectByName('continuous external chinrest clamp 1')]){
   const p=clamp.geometry.attributes.position;
   for(let i=0;i<p.count;i++){const q=m.group.worldToLocal(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(clamp.matrixWorld));if(plate===m.parts.top?(q.y<.085||q.y>.22):(q.y<-.20||q.y>-.098))continue;
    const key=plate.name+':'+q.x.toFixed(6)+':'+q.z.toFixed(6);let ys=cache.get(key);if(!ys){const origin=m.group.localToWorld(new T.Vector3(q.x,2,q.z));ys=new T.Raycaster(origin,new T.Vector3(0,-1,0)).intersectObject(plate,false).map(h=>m.group.worldToLocal(h.point.clone()).y);cache.set(key,ys);}if(ys.length){const lo=Math.min(...ys),hi=Math.max(...ys);assert.ok(q.y<lo-.00005||q.y>hi+.00005,'clamp passes through '+plate.name+' at '+q.toArray());}checked++;
   }
  }
 }
 assert.ok(checked>100);
});
test('rear acoustic gooseneck never pierces the actual moving diaphragm, including lifted positions',()=>{
 const m=buildGramophone(T,{}),membrane=m.group.getObjectByName('vertical diaphragm'),tube=m.group.getObjectByName('hollow terminal gooseneck to soundbox back'),neck=m.group.getObjectByName('soundbox back neck');assert.ok(tube&&neck);membrane.material.side=T.DoubleSide;
 for(const needleLift of[0,1])for(const signal of[-1,0,1]){m.update({progress:.5,needleLift,signal});m.group.updateMatrixWorld(true);
  for(const mesh of[tube,neck]){const g=mesh.geometry,p=g.attributes.position,ids=g.index,edges=new Set();for(let k=0;k<(ids?.count??p.count);k+=3)for(let j=0;j<3;j++){const a=ids?ids.getX(k+j):k+j,b=ids?ids.getX(k+(j+1)%3):k+(j+1)%3,key=a<b?a+':'+b:b+':'+a;if(edges.has(key))continue;edges.add(key);const A=new T.Vector3().fromBufferAttribute(p,a).applyMatrix4(mesh.matrixWorld),B=new T.Vector3().fromBufferAttribute(p,b).applyMatrix4(mesh.matrixWorld),d=B.sub(A),len=d.length();if(len<1e-8)continue;const ray=new T.Raycaster(A,d.divideScalar(len),.00001,len-.00001);assert.equal(ray.intersectObject(membrane,false).length,0,'acoustic tube penetrates diaphragm');}}
 }
});
''',encoding='utf-8')
