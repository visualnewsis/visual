import {T,materials as M,tag} from './quality-kit.js?v=20261028-craft5';
import {buildMXSwitch} from './models/mx-switch.js?v=20261028-release3';
// The main cutaway and research lessons use the same stem, spring and contact geometry.
export function buildSwitch(){
 const model=buildMXSwitch(T,M),{group,parts}=model;
 for(const housing of [parts.upperHousing,parts.lowerHousing])housing.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.24;o.material.depthWrite=false;}});
 const signal=new T.Group();signal.name='input signal';group.add(signal);
 const led=new T.Mesh(new T.SphereGeometry(.065,16,10),new T.MeshStandardMaterial({color:0x233d37,emissive:0x000000}));
 led.position.set(.59,-.96,.53);signal.add(led);
 // Keep both contact parts in the model hierarchy: their lower pivots must remain fixed.
 tag(parts.keycap,'cap');tag(parts.spring,'spring');tag(parts.fixedContact,'contact');tag(parts.movingLeaf,'contact');
 return {group,eye:[3,2.5,7],parts:{body:parts.lowerHousing,cap:parts.keycap,spring:parts.spring,contact:parts.movingLeaf,signal},update(s){
  model.update(s);const on=parts.movingLeaf.userData.closed;led.material.color.setHex(on?0x00b4c9:0x233d37);led.material.emissive.setHex(on?0x004a50:0);
 }};
}
