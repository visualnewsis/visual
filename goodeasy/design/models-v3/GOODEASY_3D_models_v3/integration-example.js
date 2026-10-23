// Illustrative integration: the host supplies its existing local THREE instance.
import {buildGuitar} from './guitar.js';
import {buildViolin} from './violin.js';
export function mountInstrument(THREE, scene, camera, type='guitar', materials={}){
 const instrument=type==='violin'?buildViolin(THREE,materials):buildGuitar(THREE,materials);
 scene.add(instrument.group);
 camera.position.set(...(type==='violin'?[.75,1.45,2.05]:[1.55,1.45,2.5]));
 camera.lookAt(type==='violin'?-.02:.02,type==='violin'?.16:.10,0);
 scene.add(new THREE.AmbientLight(0xffffff,.40));
 const key=new THREE.DirectionalLight(0xffd9a8,2.2);key.position.set(.4,3,2.3);key.castShadow=true;scene.add(key);
 const rim=new THREE.DirectionalLight(0xa5bed4,.7);rim.position.set(-1.8,1.2,-1.5);scene.add(rim);
 return instrument;
}
export function getWorldStringEndpoints(THREE, instrument){
 instrument.group.updateWorldMatrix(true,true);
 return instrument.strings.map(s=>({midi:s.midi,
   from:instrument.group.localToWorld(new THREE.Vector3(...s.from)),
   to:instrument.group.localToWorld(new THREE.Vector3(...s.to))}));
}
