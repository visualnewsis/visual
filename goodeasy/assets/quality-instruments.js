import {attachViolinVibration} from './violin-vibration.js?v=20261027-detail1';
import {attachGuitarVibration} from './guitar-vibration.js?v=20261027-audio1';
import {buildGuitar as guitar} from './models/guitar.js?v=20261024-editorial1';
import {buildViolin as violin} from './models/violin.js?v=20261024-editorial1';
function prepare(model,eye){model.eye=eye;for(const s of model.strings)s.mesh.material=s.mesh.material.clone();
 model.update=(state,detail,now)=>{const selected=model.strings.find(s=>s.midi===state.midi);if(model.bow&&selected){const x=.03,t=(x-selected.from[0])/(selected.to[0]-selected.from[0]);const y=selected.from[1]+t*(selected.to[1]-selected.from[1]);const original=model.bow.userData.hairCenterlineY-.0014,z=selected.from[2]+t*(selected.to[2]-selected.from[2]),i=model.strings.indexOf(selected),neighbors=model.strings.slice(Math.max(0,Math.min(model.strings.length-3,i-1)),Math.max(0,Math.min(model.strings.length-3,i-1))+3).map(s=>{const u=(x-s.from[0])/(s.to[0]-s.from[0]);return {z:s.from[2]+u*(s.to[2]-s.from[2]),y:s.from[1]+u*(s.to[1]-s.from[1])};});let slope=0;for(let k=0;k<3;k++){const a=neighbors[k],b=neighbors[(k+1)%3],c=neighbors[(k+2)%3];slope+=a.y*(2*z-b.z-c.z)/((a.z-b.z)*(a.z-c.z));}const angle=-Math.atan(slope),ca=Math.cos(angle),sa=Math.sin(angle),localZ=(z-model.bow.position.z-original*sa)/ca;model.bow.rotation.x=angle;model.bow.position.y=y-(original*ca-localZ*sa);}
 if(detail&&selected){selected.mesh.material.emissive.setHex(0x5a3915);}
 };return model;}
export const buildGuitar=(T,M)=>attachGuitarVibration(T,prepare(guitar(T,{...M,wood:M.wood.clone()}),[.6,6,4]));
export const buildViolin=(T,M)=>attachViolinVibration(T,prepare(violin(T,{...M,wood:new T.MeshPhysicalMaterial({color:0x9f7554,map:M.wood.map,roughness:.34,clearcoat:.7,clearcoatRoughness:.23})}),[1.2,7,5]));
