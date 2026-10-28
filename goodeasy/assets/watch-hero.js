import {T,materials as M,mesh,box,cyl,ring,rod,tube,sphere,part,tag} from './quality-kit.js?v=20261028-release3';
import {watchAssembly} from './anatomy-watch.js?v=20261028-watchfit1';
import {escapeState,handAngles} from './research-math.js?v=20261026-release3';
const TAU=Math.PI*2;
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
