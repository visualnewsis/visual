import {T,materials as M,mesh,box,cyl,ring,rod,tube,sphere,part,tag,lathe} from './quality-kit.js?v=20261028-craft7';
import {buildReelExterior} from './reel-exterior.js?v=20261028-craft7';
const TAU=Math.PI*2;
export function snapReelRatio(value){const ratio=Number.isFinite(Number(value))?Number(value):5.2;return [4.8,5.2,6.2].reduce((a,b)=>Math.abs(b-ratio)<Math.abs(a-ratio)?b:a);}
function annulus(p,r,h,height,mat,x=0,y=0,z=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,h,0,TAU,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);return mesh(p,g,mat,x,y,z);}
// The visible face gear is an axis/ratio model, not a manufacturer-specific helical tooth profile.
export function buildReel(){
 const group=new T.Group(),body=part(group,'body');
 const skin=buildReelExterior(T),{graphite,gunmetal,aluminium}=skin.materials;
 const lineMaterial=new T.MeshStandardMaterial({color:0xabb29d,roughness:.93}),lineHighlight=new T.LineBasicMaterial({color:0xd9d7b3});
 body.add(skin.body);
 // Legacy object name retained for saved selection links; this group now reciprocates with the spool.
 const shaft=part(group,'Fixed spool shaft');shaft.userData.stationary=false;const shaftMesh=rod(shaft,[.02,1.8,0],[2.1,1.8,0],.045,M.steel);shaftMesh.name='Reciprocating main shaft';
 const spool=part(group,'spool');spool.position.set(1.75,1.8,0);
 const core=cyl(spool,.39,.65,graphite);core.rotation.z=Math.PI/2;core.name='Spool core below minimum line radius';
 spool.add(skin.spool);
 const pack=cyl(spool,.783,.61,lineMaterial);pack.rotation.z=Math.PI/2;pack.name='Continuous wound line package';
 const coils=[];for(let i=0;i<48;i++){const o=ring(spool,.79,.006,lineMaterial,-.30+i*.01276596,0,0,'x');o.name='Packed line turn '+i;coils.push(o);}
 const capGroup=part(spool,'Fixed drag adjustment cap');capGroup.add(skin.drag);const cap=skin.parts.cap;tag(cap,'spool','drag');
 const rotor=part(group,'rotor');rotor.position.set(.6,1.8,0);rotor.add(skin.rotor);
 const bail=part(rotor,'Opening bail wire');bail.position.set(1.25,.15,0);tube(bail,[[0,0,-1.02],[.23,.67,-.76],[.31,.99,0],[.23,.67,.76],[0,0,1.02]],.026,aluminium);
 const rollerLocal=new T.Vector3(1.25,.15,-1.02),rollerMount=part(rotor,'Line roller bearing');rollerMount.position.copy(rollerLocal);
 const roller=annulus(rollerMount,.105,.042,.12,aluminium);roller.rotation.x=Math.PI/2;ring(rollerMount,.081,.014,graphite,0,0,-.064,'z');rod(rollerMount,[0,0,-.12],[0,0,.12],.035,gunmetal);
 const handle=part(group,'handle');handle.position.set(-.4,1.8,.7);rod(handle,[0,0,-1.1],[0,0,.25],.055,M.steel);handle.add(skin.handle);
 const gears=part(group,'gears'),drive=part(gears,'Main drive gear'),pinionMount=part(gears,'Pinion bearing'),pinion=part(pinionMount,'Rotor pinion');drive.position.set(-.4,1.8,0);drive.rotation.x=Math.PI/2;pinionMount.position.set(.22,1.8,0);pinionMount.rotation.z=-Math.PI/2;
 const sleeve=annulus(gears,.07,.05,.50,M.steel,.42,1.8,0);sleeve.rotation.z=Math.PI/2;const bearing=annulus(gears,.115,.072,.08,M.brass,.57,1.8,0);bearing.rotation.z=Math.PI/2;
 let oldRatio=0;
 function setRatio(ratio){if(oldRatio===ratio)return;oldRatio=ratio;for(const root of [drive,pinion]){for(const child of [...root.children]){root.remove(child);child.geometry?.dispose();}}
  const N=Math.round(ratio*10),module=1.24/N,rp=.62/ratio;drive.position.z=-rp;drive.userData={teeth:N,pitchRadius:.62,contact:[.22,1.8,-rp]};pinion.userData={teeth:10,pitchRadius:rp,contact:[.22,1.8,-rp]};
  annulus(drive,.59,.075,.07,M.brass,0,-.055,0);for(let i=0;i<N;i++){const a=i/N*TAU,o=box(drive,.115,module*1.4,module*1.5,M.brass,Math.cos(a)*.62,0,Math.sin(a)*.62,.001);o.rotation.y=-a;}
  const s=new T.Shape();for(let i=0;i<40;i++){const a=i/40*TAU,r=i%4===0||i%4===3?rp-module*.55:rp+module*.65;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();const hole=new T.Path();hole.absarc(0,0,.05,0,TAU,true);s.holes.push(hole);const geo=new T.ExtrudeGeometry(s,{depth:.27,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,-.135,0);mesh(pinion,geo,M.steel);
 }
 const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),line=new T.Line(geo,lineHighlight);line.name='Line connected to roller';line.userData.noFit=true;group.add(line);
 const windingGeometry=new T.BufferGeometry();windingGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(259*3),3));const windingLine=new T.Line(windingGeometry,new T.LineBasicMaterial({color:0x00b5c6}));windingLine.name='Line roller to spool winding path';windingLine.userData.noFit=true;group.add(windingLine);
 const freeGeometry=new T.BufferGeometry().setFromPoints(Array.from({length:5},()=>new T.Vector3())),freeLine=new T.Line(freeGeometry,lineHighlight);freeLine.name='Open bail line peeling over front lip';freeLine.userData.noFit=true;group.add(freeLine);
 tag(handle,'handle','action');tag(rotor,'rotor');tag(spool,'spool');tag(body,'body');tag(gears,'gears');
 const result={group,heroFitScale:.82,getVisualBounds(){group.updateMatrixWorld(true);const b=new T.Box3();for(const object of [body,handle,rotor,spool,shaft])b.union(new T.Box3().setFromObject(object));return b;},eye:[5.8,3.4,6],parts:{body,handle,rotor,spool,gears,shaft,core,drive,pinion,coils,pack,bail,dragCap:capGroup,roller:rollerMount,rollerLocal,line,windingLine,freeLine},
 update(s,detail=false){
 const turns=s.turns||0,ratio=s.ratio??((turns&&Number.isFinite(s.rotor))?s.rotor/turns:5.2),supported=snapReelRatio(ratio),revs=turns*supported;setRatio(supported);
 rotor.rotation.x=-revs*TAU;handle.rotation.z=-turns*TAU;const dx=Math.sin(turns*2)*.18;spool.position.x=1.75+dx;shaft.position.x=dx;spool.rotation.x=-(s.payout||0)*TAU;capGroup.rotation.x=(s.payout||0)*TAU;
 const radius=Math.max(15,Math.min(26,Number(s.radius)||22)),R=.79*radius/26;coils.forEach(o=>o.scale.set(radius/26,radius/26,1));pack.scale.set(radius/26,1,radius/26);drive.rotation.y=-turns*TAU;pinion.rotation.y=-revs*TAU;gears.visible=detail;body.visible=!detail;
 const open=(s.bailProgress??Number(!!s.bailOpen))>.5;bail.rotation.z=-(s.bailProgress??Number(open))*Math.PI*.57;
 const v=rollerLocal.clone().applyAxisAngle(new T.Vector3(1,0,0),rotor.rotation.x).add(rotor.position),a=line.geometry.attributes.position;a.setXYZ(0,v.x,v.y,v.z);a.setXYZ(1,4.8,1.8,0);a.needsUpdate=true;line.geometry.computeBoundingSphere();line.visible=!open;
 const radial=Math.hypot(v.y-1.8,v.z),theta=Math.atan2(v.y-1.8,v.z)+Math.acos(Math.min(1,R/radial)),p=windingGeometry.attributes.position;
 p.setXYZ(0,v.x,v.y,v.z);const history=Math.min(4,Math.max(0,s.woundTurns??revs)),contactX=1.70;
 for(let i=1;i<259;i++){const oldTurns=history*(i-1)/257,angle=theta+oldTurns*TAU,atTurn=turns-oldTurns/supported,localX=contactX-(1.75+Math.sin(atTurn*2)*.18);p.setXYZ(i,spool.position.x+localX,1.8+Math.sin(angle)*(R+.008),Math.cos(angle)*(R+.008));}
 p.needsUpdate=true;windingGeometry.computeBoundingSphere();windingLine.visible=!open;
 const f=freeGeometry.attributes.position,sp=spool.position.x,peel=(s.freePayout||0)*TAU*.1,yy=Math.sin(peel),zz=-Math.cos(peel);
 for(const [i,q] of [[0,[sp+.20,1.8+yy*R,zz*R]],[1,[sp+.30,1.8+yy*.78,zz*.78]],[2,[sp+.385,1.8+yy*.86,zz*.86]],[3,[sp+.70,1.8+yy*.76,zz*.76]],[4,[4.8,1.8,0]]])f.setXYZ(i,...q);
 f.needsUpdate=true;freeGeometry.computeBoundingSphere();freeLine.visible=open;
 }};
 result.update({});return result;
}