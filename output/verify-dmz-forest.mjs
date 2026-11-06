import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import path from 'node:path';
const root=process.cwd(),modulePath=path.join(root,'dmz/js/vegetation.js');
const context=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
let source=fs.readFileSync(modulePath,'utf8').replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(path.resolve(path.dirname(modulePath),p.split('?')[0])).href}'`);
source+='\nexport {foliageCards};';const {foliageCards,buildVegetation}=await import('data:text/javascript,'+encodeURIComponent(source));
const {Terrain}=await import(pathToFileURL(path.join(root,'dmz/js/terrain.js')).href);
for(const low of [true,false]){
 for(const con of [false,true]){
  const full=foliageCards(401,low,con,false),base=foliageCards(401,low,con,false,true),n=low?9:14;
  const cards=[0,Math.floor((n-1)*.25),Math.floor((n-1)*.5),Math.floor((n-1)*.75),n-1];
  for(const key of ['position','corner','uv','color']){const a=full.attributes[key],b=base.attributes[key];cards.forEach((index,j)=>{for(let v=0;v<6;v++)for(let c=0;c<a.itemSize;c++)assert.equal(b.array[(j*6+v)*a.itemSize+c],a.array[(index*6+v)*a.itemSize+c]);});}
 }
 const meshes=buildVegetation(new Terrain(low?200:320,low?164:260),{low,cutPlanes:[],foliageImage:{width:512,height:512}});
 let triangles=0,instances=0;for(const m of meshes){triangles+=(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3*(m.count||1);instances+=m.count||0;assert([...m.geometry.attributes.position.array].every(Number.isFinite));if(m.instanceMatrix)assert([...m.instanceMatrix.array].every(Number.isFinite));assert(!m.userData.canopyReplaced);assert(m.visible);}
 assert(triangles<(low?350000:1000000),'forest triangle budget');
 console.log(`PASS ${low?'mobile':'desktop'}: exact shared base cards, no replacement flags; ${triangles} forest triangles, ${meshes.length} draw calls`);
}
