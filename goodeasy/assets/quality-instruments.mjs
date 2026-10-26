import {attachGuitarVibration} from './guitar-vibration.mjs?v=20261026-vibration3';
import {buildGuitar as guitar} from './models/guitar.js?v=20261024-editorial1';
import {buildViolin as violin} from './models/violin.js?v=20261024-editorial1';
function prepare(model,eye){model.eye=eye;for(const s of model.strings)s.mesh.material=s.mesh.material.clone();
 model.update=(state,detail,now)=>{const selected=model.strings.find(s=>s.midi===state.midi);if(model.bow&&selected){const x=.03,t=(x-selected.from[0])/(selected.to[0]-selected.from[0]);const y=selected.from[1]+t*(selected.to[1]-selected.from[1]);const original=model.bow.userData.hairCenterlineY-.0014;model.bow.position.y=y-original;}
 if(detail&&selected){selected.mesh.material.emissive.setHex(0x5a3915);}
 };return model;}
export const buildGuitar=(T,M)=>attachGuitarVibration(T,prepare(guitar(T,{...M,wood:M.wood.clone()}),[.6,6,4]));
export const buildViolin=(T,M)=>prepare(violin(T,{...M,wood:new T.MeshPhysicalMaterial({color:0x9f7554,map:M.wood.map,roughness:.34,clearcoat:.7,clearcoatRoughness:.23})}),[1.2,7,5]);
