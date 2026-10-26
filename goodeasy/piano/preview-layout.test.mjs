import assert from 'node:assert/strict';
import * as T from './vendor/three.module.min.js';
import {PREVIEW_SCALE_X,previewOffsetX} from './preview-layout.js';
for(const width of [390,1040,1920]){
 const mobile=width<700,camera=new T.PerspectiveCamera(mobile?42:34,width/220,.1,150);
 camera.position.set(0,7.2,mobile?-12.8:-13);camera.lookAt(0,1.8,1);camera.updateMatrixWorld();
 let slot=-1;const keys=[];
 for(let midi=60;midi<=(mobile?72:84);midi++){
  const black=[1,3,6,8,10].includes(midi%12);if(!black)slot++;
  const x=(slot+(black?.5:0)-7)*.44*PREVIEW_SCALE_X+previewOffsetX(width);
  const key=new T.Vector3(x,0,-2.7).project(camera).x,hammer=new T.Vector3(x,2,-.5).project(camera).x;
  keys.push({midi,key,hammer});
 }
 for(let i=1;i<keys.length;i++){
  assert(keys[i].key>keys[i-1].key,`${width}px keys ascend left to right`);
  assert(keys[i].hammer>keys[i-1].hammer,`${width}px hammers ascend left to right`);
 }
 assert(keys[0].key<0&&keys[0].hammer<0,'low C stays on the left');
 assert(keys.at(-1).key>0&&keys.at(-1).hammer>0,'top C stays on the right');
}
console.log('PASS piano key/hammer projected order at mobile, desktop and wide viewports');
