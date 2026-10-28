import {T,materials as M,mesh,box,cyl,ring,rod,tube,sphere,part,tag} from './quality-kit.js?v=20261028-release3';
import {watchAssembly} from './anatomy-watch.js?v=20261028-watchfit1';
import {escapeState,handAngles} from './research-math.js?v=20261026-release3';
const TAU=Math.PI*2;
export function snapReelRatio(value){const ratio=Number.isFinite(Number(value))?Number(value):5.2;return [4.8,5.2,6.2].reduce((a,b)=>Math.abs(b-ratio)<Math.abs(a-ratio)?b:a);}
function annulus(p,r,h,height,mat,x=0,y=0,z=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,h,0,TAU,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);return mesh(p,g,mat,x,y,z);}
export function buildWatch(){
 const group=new T.Group(),body=part(group,'case'),movement=watchAssembly();group.add(movement.group);movement.group.position.set(.264,.30,-.3);movement.group.scale.y=.45;
 const component=id=>movement.components.find(c=>c.id===id).object;
 component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;
 annulus(body,2.65,2.54,1.0,M.steel,0,.58,0);const seat=annulus(body,2.54,2.33,.035,M.steel,0,.2789,0);seat.name='Movement mounting seat';cyl(body,2.56,.08,M.black,0,.1,0);ring(body,2.58,.055,M.brass,0,1.08,0);
 const front=part(body,'Skeleton chapter ring');annulus(front,2.53,2.16,.045,M.ivory,0,1.09,0);
 for(let i=0;i<60;i++){const a=i/60*TAU,o=box(front,i%5?.022:.055,.024,i%5?.08:.17,M.black,Math.sin(a)*2.35,1.13,Math.cos(a)*2.35,.004);o.rotation.y=a;}
 const band=part(body,'Strap and lugs');for(const sign of [-1,1]){box(band,1.9,.16,2.4,M.leather,0,.54,sign*3.7,.12);for(const x of [-1.1,1.1]){box(band,.22,.25,.6,M.steel,x,.6,sign*2.6,.06);for(let z=2.9;z<4.8;z+=.18)rod(band,[x*.7,.63,sign*z],[x*.7,.63,sign*(z+.075)],.009,M.ivory);}}
 const hands=part(group,'hands'),hour=part(hands,'Hour hand'),minute=part(hands,'Minute hand'),seconds=part(hands,'Small seconds');hour.position.y=1.2;minute.position.y=1.24;seconds.position.set(1.144,1.2,-.6858921198);
 box(hour,.075,.035,1.03,M.black,0,0,-.43,.012);box(minute,.045,.03,1.75,M.black,0,0,-.75,.01);box(seconds,.022,.025,.36,M.red,0,0,-.14,.004);ring(hands,.39,.012,M.brass,1.144,1.17,-.6858921198);
 rod(hands,[0,.67,0],[0,1.28,0],.032,M.steel);rod(hands,[1.144,.75,-.6858921198],[1.144,1.23,-.6858921198],.02,M.steel);cyl(hands,.09,.05,M.brass,0,1.28,0);
 const crown=part(group,'crown');crown.position.set(2.84,.65,0);crown.rotation.y=Math.PI/2;const spin=part(crown,'Crown spindle');const c=cyl(spin,.24,.4,M.steel);c.rotation.x=Math.PI/2;for(let i=0;i<32;i++){const a=i/32*TAU;rod(spin,[Math.cos(a)*.24,Math.sin(a)*.24,-.17],[Math.cos(a)*.24,Math.sin(a)*.24,.17],.012,M.steel);}rod(crown,[0,0,-.28],[0,0,.12],.07,M.steel);
 tag(crown,'crown','action');tag(body,'case');tag(movement.group,'gears');tag(hands,'hands');
 const result={group,eye:[4,8,5],parts:{case:body,crown,gears:movement.group,barrel:component('wheel-0'),escapement:component('pallet'),balance:component('balance'),hands,movement},
 update(s,detail=false){const elapsed=s.elapsed||0;movement.update({phase:elapsed*3.75/8,explode:0});component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;const e=escapeState(elapsed*3.75),a=handAngles(e.angle*8/60*60/TAU);hour.rotation.y=-a.hour;minute.rotation.y=-a.minute;seconds.rotation.y=-a.second;spin.rotation.z=(s.turns||0)*TAU;front.visible=!detail;hands.visible=!detail;}};
 result.update({});return result;
}
// The visible face gear is an axis/ratio model, not a manufacturer-specific helical tooth profile.
export function buildReel(){
 const group=new T.Group(),body=part(group,'body');sphere(body,1,M.black,-.4,1.45,0,[.95,1.05,.55]);sphere(body,.8,M.steel,-.3,1.4,.42,[1,.85,.13]);sphere(body,.75,M.black,-.3,1.4,.53,[1,.85,.1]);for(const [x,y] of [[-.75,1.1],[.15,1.8],[-.65,1.94]]){const screw=cyl(body,.055,.04,M.steel,x,y,.61);screw.rotation.x=Math.PI/2;}tube(body,[[-.7,1.9,0],[-.55,2.6,0],[-.1,3.2,0],[.45,3.3,0]],.13,M.black);box(body,1.45,.13,.3,M.steel,.1,3.32,0,.07);
 // Legacy object name retained for saved selection links; this group now reciprocates with the spool.
 const shaft=part(group,'Fixed spool shaft');shaft.userData.stationary=false;const shaftMesh=rod(shaft,[.02,1.8,0],[2.1,1.8,0],.045,M.steel);shaftMesh.name='Reciprocating main shaft';
 const spool=part(group,'spool');spool.position.set(1.75,1.8,0);const core=cyl(spool,.39,.65,M.steel);core.rotation.z=Math.PI/2;core.name='Spool core below minimum line radius';for(const x of [-.35,.35])ring(spool,.83,.05,M.steel,x,0,0,'x');const coils=[];for(let i=0;i<48;i++)coils.push(ring(spool,.79,.009,i%3?M.ivory:M.brass,-.3+i*.013,0,0,'x'));const cap=cyl(spool,.31,.13,M.black,.42,0,0);cap.rotation.z=Math.PI/2;ring(spool,.29,.015,M.brass,.5,0,0,'x');tag(cap,'spool','drag');
 const rotor=part(group,'rotor');rotor.position.set(.6,1.8,0);for(const sign of [-1,1])tube(rotor,[[0,0,sign*.52],[.2,-.1,sign*.9],[.85,0,sign*.99],[1.05,.1,sign*.85]],.075,M.black);tube(rotor,[[1.05,.1,-.85],[1.4,.62,-.65],[1.5,.95,0],[1.4,.62,.65],[1.05,.1,.85]],.035,M.steel);sphere(rotor,.105,M.brass,1.05,.1,-.85);ring(rotor,.09,.02,M.black,1.05,.1,-.85,'z');
 const handle=part(group,'handle');handle.position.set(-.4,1.8,.7);rod(handle,[0,0,-1.1],[0,0,.25],.055,M.steel);tube(handle,[[0,0,.25],[-.38,-.4,.34],[-.85,-.65,.35]],.085,M.steel);rod(handle,[-.85,-.65,.35],[-.85,-.65,.8],.09,M.steel);sphere(handle,.24,M.black,-.85,-.65,.88,[1.55,.9,.9]);
 const gears=part(group,'gears'),drive=part(gears,'Main drive gear'),pinionMount=part(gears,'Pinion bearing'),pinion=part(pinionMount,'Rotor pinion');drive.position.set(-.4,1.8,0);drive.rotation.x=Math.PI/2;pinionMount.position.set(.22,1.8,0);pinionMount.rotation.z=-Math.PI/2;
 const sleeve=annulus(gears,.07,.05,.50,M.steel,.42,1.8,0);sleeve.rotation.z=Math.PI/2;const bearing=annulus(gears,.115,.072,.08,M.brass,.57,1.8,0);bearing.rotation.z=Math.PI/2;
 let oldRatio=0;
 function setRatio(ratio){if(oldRatio===ratio)return;oldRatio=ratio;for(const root of [drive,pinion]){for(const child of [...root.children]){root.remove(child);child.geometry?.dispose();}}
  const N=Math.round(ratio*10),module=1.24/N,rp=.62/ratio;drive.position.z=-rp;drive.userData={teeth:N,pitchRadius:.62,contact:[.22,1.8,-rp]};pinion.userData={teeth:10,pitchRadius:rp,contact:[.22,1.8,-rp]};
  annulus(drive,.59,.075,.07,M.brass,0,-.055,0);for(let i=0;i<N;i++){const a=i/N*TAU,o=box(drive,.115,module*1.4,module*1.5,M.brass,Math.cos(a)*.62,0,Math.sin(a)*.62,.001);o.rotation.y=-a;}
  const s=new T.Shape();for(let i=0;i<40;i++){const a=i/40*TAU,r=i%4===0||i%4===3?rp-module*.55:rp+module*.65;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();const hole=new T.Path();hole.absarc(0,0,.05,0,TAU,true);s.holes.push(hole);const geo=new T.ExtrudeGeometry(s,{depth:.27,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,-.135,0);mesh(pinion,geo,M.steel);
 }
 const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),line=new T.Line(geo,new T.LineBasicMaterial({color:0xdad6bf}));line.name='Line connected to roller';line.userData.noFit=true;group.add(line);const rollerLocal=new T.Vector3(1.05,.1,-.85);
 tag(handle,'handle','action');tag(rotor,'rotor');tag(spool,'spool');tag(body,'body');tag(gears,'gears');
 const result={group,eye:[5,3,8],parts:{body,handle,rotor,spool,gears,shaft,core,drive,pinion,coils},
 update(s,detail=false){const turns=s.turns||0,ratio=s.ratio??((turns&&Number.isFinite(s.rotor))?s.rotor/turns:5.2),supported=snapReelRatio(ratio),revs=turns*supported;setRatio(supported);rotor.rotation.x=-revs*TAU;handle.rotation.z=-turns*TAU;const dx=Math.sin(turns*2)*.18;spool.position.x=1.75+dx;shaft.position.x=dx;spool.rotation.x=-(s.payout||0)*TAU;coils.forEach(o=>o.scale.set(1,(s.radius??22)/26,(s.radius??22)/26));drive.rotation.y=-turns*TAU;pinion.rotation.y=-revs*TAU;gears.visible=detail;body.visible=!detail;const v=rollerLocal.clone().applyAxisAngle(new T.Vector3(1,0,0),rotor.rotation.x).add(rotor.position),a=line.geometry.attributes.position;a.setXYZ(0,v.x,v.y,v.z);a.setXYZ(1,3.2,1.8,0);a.needsUpdate=true;line.geometry.computeBoundingSphere();}};
 result.update({});return result;
}