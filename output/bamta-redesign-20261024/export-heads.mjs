import fs from 'node:fs';
import * as T from '../../arcade/bamta/vendor/three.module.min.js';
import {createFictionalHead} from '../../arcade/bamta/faces.js';
const out=[];
for(const options of [{female:true},{},{boss:true}]){
 const head=new T.Group();createFictionalHead(head,options);head.updateMatrixWorld(true);const meshes=[];
 head.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry,p=geo.attributes.position,n=geo.attributes.normal,c=geo.attributes.color,positions=[],normals=[],colors=[],normalMatrix=new T.Matrix3().getNormalMatrix(m.matrixWorld);
 for(let i=0;i<p.count;i++){positions.push(...new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray());normals.push(...new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize().toArray());const color=c?new T.Color(c.getX(i),c.getY(i),c.getZ(i)):m.material.color;colors.push(color.r,color.g,color.b);}
 meshes.push({positions,normals,colors,indices:geo.index?Array.from(geo.index.array):Array.from({length:p.count},(_,i)=>i),name:m.name});});out.push(meshes);
}
fs.writeFileSync(new URL('head-geometry.json',import.meta.url),JSON.stringify(out));
