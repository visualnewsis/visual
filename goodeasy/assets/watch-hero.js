import {T,materials as M,mesh,box,cyl,ring,rod,tube,sphere,part,tag} from './quality-kit.js?v=20261028-watchmechanism2';
import {watchAssembly} from './anatomy-watch.js?v=20261028-watchguide2';
import {buildWatchCase} from './watch-case.js?v=20261028-watchmechanism2';
import {createCaseSection} from './watch-cutaway.js?v=20261028-watchmechanism2';
const TAU=Math.PI*2;
function annulus(p,r,h,height,mat,x=0,y=0,z=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,h,0,TAU,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);return mesh(p,g,mat,x,y,z);}
export function buildWatch(){
 const group=new T.Group(),body=part(group,'case'),movement=watchAssembly();
 const polished=M.steel.clone();polished.roughness=.22;polished.metalness=.87;
 const satin=M.steel.clone();satin.roughness=.42;satin.metalness=.68;group.add(movement.group);movement.group.position.set(-.264,0,.3);movement.group.rotation.y=Math.PI;movement.group.scale.y=1;
 const component=id=>movement.components.find(c=>c.id===id).object;
 component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;const underside=movement.group.getObjectByName('Center staff extension into cannon pinion');if(underside)underside.visible=false;
 const shell=buildWatchCase(T);body.add(shell.group);
 const crown=shell.parts.crown.group;shell.group.remove(crown);group.add(crown);
 const spin=part(crown,'Crown spindle');spin.position.set(3.02,shell.dimensions.crownY,0);
 for(const o of [...crown.children])if(o!==spin&&(o.name==='machined-crown'||o.name.startsWith('crown-flute-'))){o.position.sub(spin.position);spin.add(o);}
 const seat=annulus(body,2.435,2.28,.040,satin,0,-.0285,0);seat.name='Movement mounting seat';const back=cyl(body,2.425,.021,satin,0,-.059,0);back.name='Caseback supporting mounting seat';
 const chapterSeat=annulus(body,2.475,2.28,.02,satin,0,.980,0);chapterSeat.name='Chapter ring machined supporting ledge';const front=part(body,'Skeleton chapter ring'),chapter=annulus(front,2.40,2.28,.05,M.ivory,0,1.015,0);chapter.name='Narrow ivory chapter ring';chapter.userData.profile=[[2.28,.990],[2.40,.990],[2.40,1.040],[2.28,1.040]];
 for(let i=0;i<60;i++){const a=i/60*TAU,o=box(front,i%5?.018:.035,.014,i%5?.045:.10,M.black,Math.sin(a)*2.34,1.047,Math.cos(a)*2.34,.002);o.rotation.y=a;}
 const crystal=M.glass.clone();crystal.opacity=.025;crystal.transparent=true;crystal.depthWrite=false;const crystalProfile=[];for(let i=0;i<=64;i++){const r=2.51*i/64;crystalProfile.push([r,1.0348+.315*Math.sqrt(Math.max(0,1-(r/2.51)**2))]);}for(let i=64;i>=0;i--){const r=2.50*i/64;crystalProfile.push([r,1.0348+.303*Math.sqrt(Math.max(0,1-(r/2.50)**2))]);}const glass=mesh(body,new T.LatheGeometry(crystalProfile.map(p=>new T.Vector2(...p)),128),crystal);glass.name='Sapphire crystal above hands';glass.userData.profile=crystalProfile;
 const hands=part(group,'hands'),hour=part(hands,'Hour hand'),minute=part(hands,'Minute hand'),seconds=part(hands,'Small seconds');hour.position.y=1.15;minute.position.y=1.19;seconds.position.set(-1.144,1.15,.6858921198);
 box(hour,.105,.035,1.03,polished,0,0,-.43,.012);box(hour,.040,.039,.76,M.black,0,0,-.43,.008);box(minute,.070,.03,1.75,polished,0,0,-.75,.01);box(minute,.023,.034,1.40,M.black,0,0,-.75,.006);box(seconds,.022,.025,.36,M.red,0,0,-.14,.004);ring(hands,.39,.012,M.brass,-1.144,1.12,.6858921198);
 rod(hands,[0,.37,0],[0,1.24,0],.032,M.steel);rod(hands,[-1.144,.57,.6858921198],[-1.144,1.18,.6858921198],.02,M.steel);cyl(hands,.09,.028,M.brass,0,1.23,0);
 tag(crown,'crown','action');tag(body,'case');tag(movement.group,'gears');tag(hands,'hands');
 const setCutaway=createCaseSection(T,{shell,chapter:front,glass});setCutaway(false);
 const visibleBounds=()=>{group.updateMatrixWorld(true);const b=new T.Box3();group.traverseVisible(o=>{if(!o.isMesh)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});return b;};
 const result={group,eye:[2.5,6.5,10],getVisualBounds:visibleBounds,heroFitScale:.92,setCutaway,parts:{exterior:shell,case:body,crown,gears:movement.group,barrel:component('wheel-0'),escapement:component('pallet'),balance:component('balance'),hands,movement},
 update(s,detail=false){const elapsed=s.elapsed||0;movement.update({phase:elapsed*5/8,explode:0,reserve:s.visualReserve??s.reserve??50,turns:s.visualTurns??s.turns??0,winding:!!s.winding,regulated:s.regulated!==false,freeAge:s.freeAge||0});component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;hour.rotation.y=component('wheel-1').rotation.y/12-(10+10/60)/12*TAU;minute.rotation.y=component('wheel-1').rotation.y-10/60*TAU;seconds.rotation.y=component('wheel-3').rotation.y;spin.rotation.x=-(movement.windingRig?.parts.stem.rotation.x??-(s.visualTurns??s.turns??0)*TAU);group.userData.reserve=s.visualReserve??s.reserve??0;group.userData.regulated=s.regulated!==false;front.visible=!detail;hands.visible=!detail;}};
 result.update({});return result;
}
