import {T,mesh,rod,ring,part} from './quality-kit.js?v=20261028-watchmechanism2';
const TAU=Math.PI*2;
export const PROJECTOR_GENEVA_DISTANCE=.44;

// A representative transmission, not a reconstruction of a historic make.
// The existing teaching ratio is retained: crank : frame shaft = 1 : 24.
function spur(parent,radius,teeth,material){
 const pitch=TAU/teeth,module=2*radius/teeth,base=radius*Math.cos(Math.PI/9),tip=radius+module,root=radius-1.25*module;
 const involute=r=>{const a=Math.acos(Math.min(1,base/r));return Math.tan(a)-a;};
 const half=r=>Math.PI/(2*teeth)+involute(radius)-involute(Math.max(base,r));
 const shape=new T.Shape();let first=true;
 const point=(r,a)=>{const x=r*Math.cos(a),y=r*Math.sin(a);if(first){shape.moveTo(x,y);first=false;}else shape.lineTo(x,y);};
 for(let tooth=0;tooth<teeth;tooth++){
  const a=tooth*pitch,low=Math.max(base,root);
  point(root,a-half(low));
  for(let k=0;k<=7;k++){const r=low+(tip-low)*k/7;point(r,a-half(r));}
  for(let k=1;k<=4;k++)point(tip,a-half(tip)+2*half(tip)*k/4);
  for(let k=7;k>=0;k--){const r=low+(tip-low)*k/7;point(r,a+half(r));}
  point(root,a+half(low));
  for(let k=1;k<=4;k++)point(root,a+half(low)+(pitch-2*half(low))*k/4);
 }
 shape.closePath();const bore=new T.Path();bore.absarc(0,0,.043,0,TAU,true);shape.holes.push(bore);
 const geo=new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false});geo.translate(0,0,-.0275);
 const gear=part(parent,'Involute spur '+teeth+' teeth');mesh(gear,geo,material);
 gear.userData.pitchRadius=radius;gear.userData.teeth=teeth;
 return gear;
}
function pulley(parent,center,radius,material){
 const p=part(parent,'Cord pulley');p.position.set(...center);
 ring(p,radius,.017,material,0,0,0,'z');ring(p,radius+.025,.009,material,0,0,-.025,'z');ring(p,radius+.025,.009,material,0,0,.025,'z');
 rod(p,[0,0,-.06],[0,0,.06],.042,material);rod(p,[-radius,0,0],[radius,0,0],.014,material);
 p.userData.pitchRadius=radius;return p;
}
class Arc extends T.Curve{
 constructor(x,y,z,r,a,b){super();Object.assign(this,{x,y,z,r,a,b});}
 getPoint(t,target=new T.Vector3()){const a=this.a+(this.b-this.a)*t;return target.set(this.x+this.r*Math.cos(a),this.y+this.r*Math.sin(a),this.z);}
}
function cord(parent,A,B,rA,rB,z,material){
 const dx=B[0]-A[0],dy=B[1]-A[1],d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),q=Math.acos((rA-rB)/d),up=angle+q,down=angle-q;
 const at=(C,r,a)=>new T.Vector3(C[0]+r*Math.cos(a),C[1]+r*Math.sin(a),z);
 const path=new T.CurvePath();path.add(new T.LineCurve3(at(A,rA,up),at(B,rB,up)));path.add(new Arc(...B,z,rB,up,down));path.add(new T.LineCurve3(at(B,rB,down),at(A,rA,down)));path.add(new Arc(...A,z,rA,down,up-TAU));
 const belt=mesh(parent,new T.TubeGeometry(path,160,.012,6,true),material);belt.name='Continuous open drive cord';return belt;
}
function miter(parent,apex,axis,material){
 // Representative straight bevel teeth on a 45° pitch cone, with shared end radii and a cylindrical bore.
 const root=spur(parent,1,24,material);root.name='1 to 1 bevel gear';
 const geometry=root.children[0].geometry,positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),r=Math.hypot(x,y),depth=.07+(positions.getZ(i)+.0275)/.055*.14;
  const scale=r<.044?.031/r:depth*.98;positions.setXYZ(i,x*scale,y*scale,-Math.sqrt(2*depth*depth-r*r*scale*scale));
 }
 positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 root.userData.pitchRadius=.21;root.userData.representative=true;
 root.position.set(...apex);root.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...axis));
 return root;
}
export function buildProjectorDrive({parent,handle,framePitch,feedRadius,windingRadius,outputX,steel,brass,dark}){
 const group=part(parent,'Crank shafts gears and drive cords'),shafts=[],pairs=[],pulleys=[],gears=new Map();
 // Separate gear planes leave the compound gears and all four shaft journals visible.
 const C=[1.20,2.40],D=[outputX+PROJECTOR_GENEVA_DISTANCE,.91];
 const nodes=[[-1.03,.93],[-.38,1.43],[.45,1.75],C,D,[1.00,1.48],... [1/3,2/3].map(t=>C.map((v,i)=>v+(D[i]-v)*t))];
 const speeds=[-TAU/24,TAU/8,-TAU/2,TAU,-TAU,TAU,-TAU,TAU];
 const ratios=[[0,1,72,24,-2.00],[1,2,96,24,-2.20],[2,3,48,24,-2.40],[3,6,48,48,-2.60],[6,7,48,48,-2.60],[7,4,48,48,-2.60],[4,5,48,48,-1.75]];
 for(const [a,b,na,nb,z] of ratios){
  const A=nodes[a],B=nodes[b],d=Math.hypot(B[0]-A[0],B[1]-A[1]),rA=d*na/(na+nb),rB=d-rA,angle=Math.atan2(B[1]-A[1],B[0]-A[0]);
  const getGear=(node,radius,teeth,phase)=>{
   const key=[node,z,teeth].join('/');if(gears.has(key))return gears.get(key);
   const gear=spur(group,radius,teeth,brass);gear.position.set(...nodes[node],z);gear.userData.axisIndex=node;gear.userData.phase=phase;gears.set(key,gear);return gear;
  };
  const ga=getGear(a,rA,na,0),offset=(na*angle+nb*(angle+Math.PI)-Math.PI-na*ga.userData.phase)/nb,gb=getGear(b,rB,nb,offset);
  pairs.push({a,b,ga,gb,offset,ratio:na/nb,centers:[A,B],radii:[rA,rB]});
 }
 // Open support frame, with journals on the same axes as the gears.
 for(const y of [.23,2.48])rod(group,[-1.80,y,-2.70],[2.22,y,-2.70],.038,steel);
 for(const [x,anchorX] of [[-1.80,-1.35],[2.22,1.0]]){
  rod(group,[x,.23,-2.70],[x,2.48,-2.70],.038,steel);
  for(const [y,anchorY] of [[.23,.50],[2.48,2.05]])rod(group,[x,y,-2.70],[anchorX,anchorY,-1.43],.035,steel);
 }
 nodes.forEach(([x,y],i)=>{
  const zFront=i===4?1.01:i===5?.88:i>=6?-2.54:i===3?-.65:-.48;
  shafts.push(rod(group,[x,y,i===5?-1.83:-2.80],[x,y,zFront],.025,steel));
  const journal=i===5?-1.83:-2.70;ring(group,.060,.018,steel,x,y,journal,'z');rod(group,[x,y+.08,journal],[x<-.5?-1.80:2.22,y+.08,journal],.022,steel);
  if(i===5)rod(group,[2.22,y+.08,journal],[2.22,y+.08,-2.70],.022,steel);
 });
 // The Z shaft and the shutter's X shaft meet at a pair of 45 degree bevel gears.
 const apex=[nodes[5][0],1.48,.95];
 const bevelZ=miter(group,apex,[0,0,1],brass),bevelX=miter(group,apex,[1,0,0],brass);
 const shutterShaft=rod(group,[-.08,1.48,.95],[apex[0]-.065,1.48,.95],.025,steel);
 for(const x of [.30,apex[0]-.38]){ring(group,.055,.016,steel,x,1.48,.95,'x');rod(group,[x,1.535,.95],[x,2.05,.95],.02,steel);rod(group,[x,2.05,.95],[x,2.05,-.70],.02,steel);}
 const feed=[[ -1.05,2.80],[.90,.40]],reels=[[-2.05,4.20],[2.05,4.20]];
 const beltSpecs=[{a:nodes[4],b:feed[0],ra:.10,rb:.40,z:-2.88,sa:-TAU,sb:-TAU/4},{a:nodes[3],b:feed[1],ra:.10,rb:.40,z:-3.06,sa:TAU,sb:TAU/4},...reels.map((b,i)=>({a:feed[1],b,ra:.10,rb:.10*windingRadius/feedRadius,z:-3.24-i*.18,sa:TAU/4,sb:framePitch/windingRadius}))];
 for(const s of beltSpecs){
  const a=pulley(group,[...s.a,s.z],s.ra,dark),b=pulley(group,[...s.b,s.z],s.rb,dark);cord(group,s.a,s.b,s.ra,s.rb,s.z,dark);
  pulleys.push({...s,a,b});rod(group,[...s.a,s.z-.06],[...s.a,-.60],.022,steel);rod(group,[...s.b,s.z-.06],[...s.b,.20],.022,steel);
 }
 group.add(handle);
 group.userData.transmission={crankToFrame:24,spurPairs:pairs.map(p=>({ratio:p.ratio,centers:p.centers,radii:p.radii})),bevelRatio:1,beltRatios:beltSpecs.map(s=>s.ra/s.rb),representative:true};
 function update(clock){
  const cycle=clock.cycle;handle.rotation.z=speeds[0]*cycle;
  for(const gear of gears.values())gear.rotation.z=speeds[gear.userData.axisIndex]*cycle+gear.userData.phase;
  bevelZ.rotation.z=TAU*cycle;bevelX.rotation.x=-TAU*cycle+Math.PI/24;
  for(const p of pulleys){p.a.rotation.z=p.sa*cycle;p.b.rotation.z=p.sb*cycle;}
 }
 return {group,shafts,shutterShaft,pairs,pulleys,update};
}
