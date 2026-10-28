import {T,materials as M,mesh,box,cyl,ring,rod,tube,sphere,part,tag} from './quality-kit.js?v=20261028-craft5';
import {watchAssembly} from './anatomy-watch.js?v=20261028-craft5';
import {escapeState,handAngles} from './research-math.js?v=20261026-release3';
import {buildWatchExterior} from './watch-art-direction.js?v=20261028-craft5';
const TAU=Math.PI*2;
function annulus(p,r,h,height,mat,x=0,y=0,z=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const hole=new T.Path();hole.absarc(0,0,h,0,TAU,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);return mesh(p,g,mat,x,y,z);}
export function buildWatch(){
 const group=new T.Group(),body=part(group,'case'),movement=watchAssembly();
 const polished=M.steel.clone();polished.roughness=.22;polished.metalness=.87;
 const satin=M.steel.clone();satin.roughness=.42;satin.metalness=.68;group.add(movement.group);movement.group.position.set(.264,.30,-.3);movement.group.scale.y=.45;
 const component=id=>movement.components.find(c=>c.id===id).object;
 component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;
 const caseProfile=[[2.54,.29],[2.59,.30],[2.64,.35],[2.665,.43],[2.63,.48],[2.63,.78],[2.67,.88],[2.665,.96],[2.61,1.035],[2.55,1.08],[2.54,1.08],[2.54,.29]].map(p=>new T.Vector2(...p));
 const caseShell=mesh(body,new T.LatheGeometry(caseProfile,128),polished);caseShell.name='Curved polished case flank';
 const seat=annulus(body,2.54,2.33,.035,satin,0,.2789,0);seat.name='Movement mounting seat';
 cyl(body,2.56,.035,M.black,0,.245,0);ring(body,2.575,.023,polished,0,1.07,0);ring(body,2.65,.012,satin,0,.42,0);
 const front=part(body,'Skeleton chapter ring');annulus(front,2.53,2.16,.045,M.ivory,0,1.09,0);
 for(let i=0;i<60;i++){const a=i/60*TAU,o=box(front,i%5?.022:.055,.024,i%5?.08:.17,M.black,Math.sin(a)*2.35,1.13,Math.cos(a)*2.35,.004);o.rotation.y=a;}
 for(let i=0;i<12;i++){const a=i/12*TAU,index=box(front,.065,.035,.14,polished,Math.sin(a)*2.39,1.153,Math.cos(a)*2.39,.009);index.rotation.y=a;}
 const crystal=M.glass.clone();crystal.opacity=.035;crystal.transparent=true;crystal.depthWrite=false;const glass=cyl(body,2.51,.018,crystal,0,1.31,0);glass.name='Sapphire crystal above hands';
 const band=part(body,'Strap and lugs');
 const hide=M.leather.clone();hide.color.setHex(0x392b23);hide.bumpScale=.009;hide.roughness=.64;
 const edge=hide.clone();edge.color.setHex(0x211a15);edge.roughness=.8;
 const thread=new T.MeshStandardMaterial({color:0x8a7760,roughness:1});
 for(const sign of [-1,1]){
  // A padded leather strip bends down from the spring bar; thickness is independent of its padding.
  const N=56,W=20,positions=[],uvs=[],ids=[];
  function point(t,u,under=false){const width=.94-.15*t-.11*t*t,z=2.64+2.30*t,y=.58-.36*t*t+.065*(1-u*u)*Math.sin(Math.PI*t*.85);return [width*u,y-(under?.078:0),sign*z];}
  for(const under of [false,true])for(let i=0;i<=N;i++)for(let j=0;j<=W;j++){positions.push(...point(i/N,j/W*2-1,under));uvs.push(j/W,i/N);}
  const count=(N+1)*(W+1);
  for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++)for(let j=0;j<W;j++){const a=layer*count+i*(W+1)+j,b=a+W+1;if(layer)ids.push(a,b,a+1,b,b+1,a+1);else ids.push(a,a+1,b,b,a+1,b+1);}
  for(let i=0;i<N;i++)for(const j of [0,W]){const a=i*(W+1)+j,b=a+W+1;ids.push(a,b,a+count,b,b+count,a+count);}
  for(const i of [0,N])for(let j=0;j<W;j++){const a=i*(W+1)+j;ids.push(a,a+count,a+1,a+1,a+count,a+count+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(ids);g.computeVertexNormals();
  const strap=mesh(band,g,hide);strap.name='Tapered stitched leather strap';strap.material.side=T.DoubleSide;
  for(const side of [-1,1]){
   const line=[];for(let i=0;i<=56;i++){const v=point(i/56,side*.88);v[1]+=.003;line.push(new T.Vector3(...v));}
   const seam=mesh(band,new T.TubeGeometry(new T.CatmullRomCurve3(line),56,.004,5,false),edge);seam.name='Recessed leather stitch channel';
   for(let i=2;i<54;i+=2){const a=point(i/56,side*.88),b=point((i+.85)/56,side*.88);a[1]+=.007;b[1]+=.007;rod(band,a,b,.005,thread,5);}
  }
  const bar=rod(band,[-1.05,.57,sign*2.69],[1.05,.57,sign*2.69],.027,polished);bar.name='Strap spring bar between case lugs';
  for(const x of [-1.05,1.05]){
   const lugShape=new T.Shape();lugShape.moveTo(-.14,0);lugShape.quadraticCurveTo(-.16,.20,-.10,.40);lugShape.lineTo(.10,.40);lugShape.quadraticCurveTo(.16,.20,.14,0);lugShape.closePath();
   const lg=new T.ExtrudeGeometry(lugShape,{depth:.15,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,curveSegments:16});lg.rotateX(Math.PI/2);const lug=mesh(band,lg,polished,x,.68,sign*2.43);lug.scale.z=sign;lug.name='Curved lug holding spring bar';
  }
 }
 band.add(buildWatchExterior(T,{leather:hide,polished}).group);
 const hands=part(group,'hands'),hour=part(hands,'Hour hand'),minute=part(hands,'Minute hand'),seconds=part(hands,'Small seconds');hour.position.y=1.2;minute.position.y=1.24;seconds.position.set(1.144,1.2,-.6858921198);
 box(hour,.105,.035,1.03,polished,0,0,-.43,.012);box(hour,.040,.039,.76,M.black,0,0,-.43,.008);box(minute,.070,.03,1.75,polished,0,0,-.75,.01);box(minute,.023,.034,1.40,M.black,0,0,-.75,.006);box(seconds,.022,.025,.36,M.red,0,0,-.14,.004);ring(hands,.39,.012,M.brass,1.144,1.17,-.6858921198);
 rod(hands,[0,.67,0],[0,1.28,0],.032,M.steel);rod(hands,[1.144,.75,-.6858921198],[1.144,1.23,-.6858921198],.02,M.steel);cyl(hands,.09,.05,M.brass,0,1.28,0);
 const crown=part(group,'crown');crown.position.set(2.84,.65,0);crown.rotation.y=Math.PI/2;const spin=part(crown,'Crown spindle');const c=cyl(spin,.24,.4,M.steel);c.rotation.x=Math.PI/2;for(let i=0;i<32;i++){const a=i/32*TAU;rod(spin,[Math.cos(a)*.24,Math.sin(a)*.24,-.17],[Math.cos(a)*.24,Math.sin(a)*.24,.17],.012,M.steel);}rod(crown,[0,0,-.28],[0,0,.12],.07,M.steel);
 tag(crown,'crown','action');tag(body,'case');tag(movement.group,'gears');tag(hands,'hands');
 const result={group,eye:[4,8,5],parts:{case:body,crown,gears:movement.group,barrel:component('wheel-0'),escapement:component('pallet'),balance:component('balance'),hands,movement},
 update(s,detail=false){const elapsed=s.elapsed||0;movement.update({phase:elapsed*3.75/8,explode:0,reserve:s.visualReserve??s.reserve??50,turns:s.visualTurns??s.turns??0,winding:!!s.winding,regulated:s.regulated!==false,freeAge:s.freeAge||0});component('dial').visible=false;component('motion').visible=false;component('barrel-lid').visible=false;const e=escapeState(elapsed*3.75);if(s.regulated===false)e.angle=elapsed*3.75*Math.PI/15;const a=handAngles(e.angle*8/60*60/TAU);hour.rotation.y=-a.hour-(10+10/60)/12*TAU;minute.rotation.y=-a.minute-10/60*TAU;seconds.rotation.y=-a.second;spin.rotation.z=(s.visualTurns??s.turns??0)*TAU;group.userData.reserve=s.visualReserve??s.reserve??0;group.userData.regulated=s.regulated!==false;front.visible=!detail;hands.visible=!detail;}};
 result.update({});return result;
}
