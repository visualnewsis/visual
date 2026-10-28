import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {buildMXSwitch} from '../assets/models/mx-switch.js';
// Texture-only canvas stub: no browser rendering or visual-quality claim.
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildMXStudy}=await import('../assets/quality-replacements.js');
test('actual keyboard study preserves canonical housing, notch and mounting height',()=>{
 const canonical=buildMXSwitch(T,{}),study=buildMXStudy(T,{});
 const ring=canonical.parts.upperHousing.children.find(o=>o.geometry.type==='ExtrudeGeometry');
 const actual=study.parts.upperHousing.children.find(o=>o.isMesh);
 assert.equal(actual.geometry.type,'ExtrudeGeometry','the active study must not replace the notched housing with its old square shell');
 assert.deepEqual([...actual.geometry.attributes.position.array],[...ring.geometry.attributes.position.array]);
 assert.equal(actual.position.y,ring.position.y);
 assert.ok(actual.material.transparent);assert.equal(actual.material.opacity,.68);
});
test('active keyboard study routes every moving stem part through the housing opening over four millimetres',()=>{
 const study=buildMXStudy(T,{}),upper=study.parts.upperHousing.children.find(o=>o.isMesh),ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
 const floor=study.parts.lowerHousing.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.geometry.parameters.height===.12);
 for(let step=0;step<=80;step++){
  study.update({travel:step/20,explode:0});study.group.updateMatrixWorld(true);
  const ringBounds=new T.Box3().setFromObject(upper),floorBounds=new T.Box3().setFromObject(floor);
  assert.ok(new T.Box3().setFromObject(study.parts.stem).min.y>floorBounds.max.y+.015);
  for(const mesh of study.parts.stem.children){
   const b=new T.Box3().setFromObject(mesh);if(b.max.y<ringBounds.min.y||b.min.y>ringBounds.max.y)continue;
   for(let x=1;x<10;x++)for(let z=1;z<10;z++){
    ray.set(new T.Vector3(T.MathUtils.lerp(b.min.x,b.max.x,x/10),ringBounds.max.y+.1,T.MathUtils.lerp(b.min.z,b.max.z,z/10)),down);
    assert.equal(ray.intersectObject(upper).length,0,mesh.name+' at '+step/20+'mm must occupy aperture, not housing plastic');
   }
  }
 }
});
