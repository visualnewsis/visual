// Visual motion is deliberately magnified and slowed; audio pitch is unchanged.
export const VIBRATION_DURATION=2200;
export function stringDisplacement(t,elapsed,midi){
 if(t<=0||t>=1||elapsed<0||elapsed>=VIBRATION_DURATION)return {normal:0,lateral:0};
 const tail=Math.min(1,(VIBRATION_DURATION-elapsed)/300),envelope=Math.exp(-elapsed/650)*tail,phase=elapsed/1000*Math.PI*2*(7.5+(midi-40)*.06);
 return {normal:Math.sin(Math.PI*t)*Math.cos(phase)*envelope*.0035,lateral:Math.sin(Math.PI*t)*Math.sin(phase)*envelope*.0075};
}
export function attachGuitarVibration(T,model){
 const active=new Map(),previous=model.update;
 const reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pitchNames=new Map([[40,'E2'],[45,'A2'],[50,'D3'],[55,'G3'],[59,'B3'],[64,'E4']]);
 const tracks=model.strings.map(string=>{
  const winding=model.group.getObjectByName('winding '+pitchNames.get(string.midi));
  return {string,deformed:false,meshes:[string.mesh,winding].filter(Boolean).map(mesh=>{
   const g=mesh.geometry,p=g.parameters;
   mesh.geometry=g.type==='CylinderGeometry'?new T.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,p.radialSegments,48,p.openEnded,p.thetaStart,p.thetaLength):g.clone();mesh.updateMatrix();
   const position=mesh.geometry.attributes.position,base=position.array.slice(),inverse=mesh.matrix.clone().invert();
   const normal=new T.Vector3(0,1,0).transformDirection(inverse),lateral=new T.Vector3(0,0,1).transformDirection(inverse),along=new Float32Array(position.count),point=new T.Vector3();
   for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrix);along[i]=Math.max(0,Math.min(1,(point.x-string.from[0])/(string.to[0]-string.from[0])));}
   const radialScale=1;
   return {position,base,along,normal,lateral,radialScale};
  })};
 });
 model.vibrationDuration=VIBRATION_DURATION;
 model.resetPlucks=()=>active.clear();
 model.pluck=(midi,now)=>{if(model.strings.some(s=>s.midi===midi))active.set(midi,now);};
 model.isVibrating=(midi,now)=>active.has(midi)&&now-active.get(midi)<VIBRATION_DURATION;
 model.update=(state,detail,now)=>{
  previous?.(state,detail,now);
  for(const track of tracks){
   const start=active.get(track.string.midi),elapsed=start===undefined?VIBRATION_DURATION:Math.max(0,now-start),playing=elapsed>=0&&elapsed<VIBRATION_DURATION;
   if(!playing){active.delete(track.string.midi);if(track.deformed)for(const mesh of track.meshes){mesh.position.array.set(mesh.base);mesh.position.needsUpdate=true;}track.deformed=false;continue;}
   if(reducedMotion)continue;
   for(const mesh of track.meshes){for(let i=0;i<mesh.position.count;i++){
    const d=stringDisplacement(mesh.along[i],elapsed,track.string.midi),scale=Math.max(1,Math.min(2.5,model.vibrationScale||1));d.normal*=scale;d.lateral*=scale;const j=i*3,thickness=1+(mesh.radialScale-1)*Math.sin(Math.PI*mesh.along[i]);
    mesh.position.array[j]=mesh.base[j]*thickness+mesh.normal.x*d.normal+mesh.lateral.x*d.lateral;
    mesh.position.array[j+1]=mesh.base[j+1]+mesh.normal.y*d.normal+mesh.lateral.y*d.lateral;
    mesh.position.array[j+2]=mesh.base[j+2]*thickness+mesh.normal.z*d.normal+mesh.lateral.z*d.lateral;
   }mesh.position.needsUpdate=true;}track.deformed=true;
  }
 };
 return model;
}
