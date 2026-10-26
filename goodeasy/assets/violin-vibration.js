// Deliberately slowed and magnified visual vibration; pitch remains audio driven.
export function attachViolinVibration(T,model){
 const previous=model.update,tracks=model.strings.map(s=>{
  const old=s.mesh.geometry,p=old.parameters;
  s.mesh.geometry=new T.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,p.radialSegments,48,p.openEnded,p.thetaStart,p.thetaLength);s.mesh.updateMatrix();
  const positions=s.mesh.geometry.attributes.position,base=positions.array.slice(),inverse=s.mesh.matrix.clone().invert(),normal=new T.Vector3(0,1,0).transformDirection(inverse),lateral=new T.Vector3(0,0,1).transformDirection(inverse),along=new Float32Array(positions.count),v=new T.Vector3();
  for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(s.mesh.matrix);along[i]=Math.max(0,Math.min(1,(v.x-s.from[0])/(s.to[0]-s.from[0])));}
  return {s,positions,base,normal,lateral,along,active:false};
 });
 model.update=(state,detail,now=0)=>{previous?.(state,detail,now);
  for(const t of tracks){const active=!!state.bowing&&t.s.midi===state.midi;
   if(!active){if(t.active){t.positions.array.set(t.base);t.positions.needsUpdate=true;}t.active=false;continue;}
   for(let i=0;i<t.positions.count;i++){const q=t.along[i],e=Math.sin(Math.PI*q),phase=now*.021*(1+(t.s.midi-55)*.015),a=e*Math.sin(phase)*.014,b=e*Math.cos(phase)*.022,j=i*3;
    t.positions.array[j]=t.base[j]+t.normal.x*a+t.lateral.x*b;t.positions.array[j+1]=t.base[j+1]+t.normal.y*a+t.lateral.y*b;t.positions.array[j+2]=t.base[j+2]+t.normal.z*a+t.lateral.z*b;
   }t.positions.needsUpdate=true;t.active=true;
  }
 };return model;
}
