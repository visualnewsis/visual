import {cycloidalPairSpec,makeWatchGear,pinionPhase} from './watch-wheel-geometry.js?v=20261028-watchmechanism2';
const TAU=Math.PI*2;
// Independently generated educational winding train. The layout follows the
// crown -> sliding pinion -> winding pinion -> crown wheel -> arbor sequence
// described at https://ciechanow.ski/mechanical-watch/#keyless-works .
// Straight bevel flanks below are spherical involutes, not overlapping spurs.
export const windingDimensions=Object.freeze({barrelX:-1.1,z:.3,crownX:-2.06,stemY:.45,stemStart:-3.284,ratchetY:.94,module:.03,pinionTeeth:12,crownTeeth:24,ratchetTeeth:40,coneDistance:Math.hypot(.36,.18),faceWidth:.09});
function sphericalInvolute(base,t){const v=t*Math.sin(base);return [Math.sin(base)*Math.cos(t)*Math.cos(v)+Math.sin(t)*Math.sin(v),Math.sin(base)*Math.sin(t)*Math.cos(v)-Math.cos(t)*Math.sin(v),Math.cos(base)*Math.cos(v)];}
function involuteAt(base,polar){let lo=0,hi=3;for(let i=0;i<60;i++){const t=(lo+hi)/2,p=sphericalInvolute(base,t);if(Math.acos(Math.max(-1,Math.min(1,p[2])))<polar)lo=t;else hi=t;}const p=sphericalInvolute(base,(lo+hi)/2);return Math.atan2(p[1],p[0]);}
export function bevelProfile(teeth,coneAngle,{distance=windingDimensions.coneDistance,module=.03,pressureAngle=Math.PI/9,backlash=.0006,samples=18}={}){
 const base=Math.asin(Math.sin(coneAngle)*Math.cos(pressureAngle)),tip=coneAngle+module/distance,root=coneAngle-1.25*module/distance,atPitch=involuteAt(base,coneAngle),half=Math.PI/(2*teeth)-backlash/(4*distance*Math.sin(coneAngle)),out=[];
 const point=(theta,phi)=>[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];
 for(let j=0;j<teeth;j++){
  const c=j*TAU/teeth;
  for(let k=0;k<=samples;k++){const polar=root+(tip-root)*k/samples,inv=polar>base?involuteAt(base,polar):0;out.push(point(polar,c-half+inv-atPitch));}
  for(let k=samples;k>=0;k--){const polar=root+(tip-root)*k/samples,inv=polar>base?involuteAt(base,polar):0;out.push(point(polar,c+half-inv+atPitch));}
 }
 return out;
}
export function bevelGeometry(T,teeth,coneAngle,options={}){
 const distance=options.distance??windingDimensions.coneDistance,width=options.faceWidth??.09,p=bevelProfile(teeth,coneAngle,options),inner=distance-width,vertices=[],indices=[];
 // Both working boundaries and the radial tooth flanks are actual mesh faces.
 for(const r of [distance,inner])for(const v of p)vertices.push(...v.map(x=>x*r));
 const n=p.length,bore=options.boreRadius??.024,rootAngle=coneAngle-1.25*(options.module??.03)/distance;
 for(const r of [distance,inner])for(const v of p){const a=Math.atan2(v[2],v[0]);vertices.push(bore*Math.cos(a),r*Math.cos(rootAngle),bore*Math.sin(a));}
 for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+j,i,n+j,n+i,2*n+i,2*n+j,j,2*n+i,j,i,3*n+i,n+j,3*n+j,3*n+i,n+i,n+j,2*n+i,3*n+i,3*n+j,2*n+i,3*n+j,2*n+j);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.userData={profile:'spherical-involute-bevel',boundaryCount:n,teeth,coneAngle,distance,faceWidth:width};return g;
}
export function buildWatchWinding(T,options={}){
 const d={...windingDimensions,...options.dimensions},group=new T.Group();group.name='Connected manual winding mechanism';
 const steel=options.steel??new T.MeshStandardMaterial({color:0xaeb8b4,metalness:.88,roughness:.28}),gold=options.gold??new T.MeshStandardMaterial({color:0xbea46b,metalness:.82,roughness:.32});
 const add=(parent,g,m,name,p=[0,0,0])=>{const o=new T.Mesh(g,m);o.name=name;o.position.set(...p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const cylinder=(parent,r,a,b,name,m=steel)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),o=add(parent,new T.CylinderGeometry(r,r,A.distanceTo(B),32),m,name);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return o;};
 const washer=(parent,r,bore,y,x,z,name)=>{const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const h=new T.Path();h.absarc(0,0,bore,0,TAU,true);s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth:.04,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);return add(parent,g,steel,name,[x,y,z]);};
 const stem=new T.Group();stem.name='Square winding stem';stem.position.set(d.crownX,d.stemY,d.z);group.add(stem);
 const shaft=cylinder(stem,.034,[d.stemStart-d.crownX,0,0],[-.59,0,0],'Continuous crown stem');
 const guideShape=new T.Shape();guideShape.absarc(0,0,.07,0,TAU,false);const guideHole=new T.Path();guideHole.absarc(0,0,.035,0,TAU,true);guideShape.holes.push(guideHole);const guideGeo=new T.ExtrudeGeometry(guideShape,{depth:.03,bevelEnabled:false,curveSegments:32});guideGeo.rotateY(Math.PI/2);const stemGuide=add(group,guideGeo,steel,'Pierced inner stem guide',[d.crownX-.255,d.stemY,d.z]);cylinder(group,.045,[d.crownX-.24,.073,d.z],[d.crownX-.24,d.stemY-.065,d.z],'Stem guide support fixed to mainplate');
 const square=add(stem,new T.BoxGeometry(.1845,.056,.056),steel,'Square stem driving sliding clutch',[-.49775,0,0]);
 const innerStem=cylinder(stem,.034,[-.406,0,0],[-.19,0,0],'Round inner stem through free winding pinion');
 const pinion=new T.Group();pinion.name='Free winding pinion on round stem';pinion.position.copy(stem.position);group.add(pinion);
 const pinionBevel=add(pinion,bevelGeometry(T,d.pinionTeeth,Math.atan(.5),{boreRadius:.035}),steel,'12 tooth bevel winding pinion');pinionBevel.rotation.z=Math.PI/2;
 const crown=new T.Group();crown.name='Compound crown wheel';crown.position.set(d.crownX,0,d.z);group.add(crown);
 const crownBevel=add(crown,bevelGeometry(T,d.crownTeeth,Math.atan(2)),steel,'24 tooth bevel crown wheel',[0,d.stemY,0]);
 crownBevel.rotation.y=Math.PI/d.crownTeeth;
 const crownShaft=cylinder(crown,.025,[0,.073,0],[0,d.ratchetY+.07,0],'Crown wheel continuous vertical staff');
 washer(group,.085,.0261,.073,d.crownX,d.z,'Crown wheel lower bearing fixed to mainplate');
 const pair=cycloidalPairSpec(d.ratchetTeeth,d.crownTeeth,d.module);
 const crownSpur=makeWatchGear(crown,pair.pinion,{y:d.ratchetY,depth:.045,material:steel,spokes:false,phase:pinionPhase(d.ratchetTeeth,d.crownTeeth,Math.PI)});crownSpur.name='24 tooth crown output spur';
 const arbor=options.arbor??new T.Group();if(!options.arbor){arbor.position.set(d.barrelX,0,d.z);group.add(arbor);}const ratchet=makeWatchGear(arbor,pair.wheel,{y:d.ratchetY,depth:.045,material:gold,spokes:false,boreRadius:.019});ratchet.name='40 tooth winding wheel keyed to barrel arbor';
 const keyedShoulder=add(arbor,new T.BoxGeometry(.048,.105,.048),steel,'Square arbor key in ratchet hub',[0,d.ratchetY+.0575,0]);
 const arborScrew=cylinder(arbor,.065,[0,d.ratchetY+.10,0],[0,d.ratchetY+.13,0],'Ratchet retaining screw');
 // The sliding clutch is carried by the actual square stem. Six complementary
 // face dogs overlap axially only in alternate angular sectors.
 const clutch=new T.Group();clutch.name='Sliding face dog clutch';clutch.position.x=-.39;stem.add(clutch);
 const squareSleeve=(r,depth)=>{const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const h=new T.Path(),a=.0283;h.moveTo(-a,-a);h.lineTo(-a,a);h.lineTo(a,a);h.lineTo(a,-a);h.closePath();s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});g.rotateY(Math.PI/2);return g;};
 const sleeve=add(clutch,squareSleeve(.092,.065),steel,'Square bored sliding clutch sleeve',[-.13,0,0]);
 for(const x of [-.13,-.088])add(clutch,squareSleeve(.113,.018),steel,'Clutch collar retaining engagement yoke',[x,0,0]);
 const hubShape=new T.Shape();hubShape.absarc(0,0,.092,0,TAU,false);const hubHole=new T.Path();hubHole.absarc(0,0,.035,0,TAU,true);hubShape.holes.push(hubHole);const hubGeo=new T.ExtrudeGeometry(hubShape,{depth:.055,bevelEnabled:false,curveSegments:32});hubGeo.rotateY(Math.PI/2);const pinionHub=add(pinion,hubGeo,steel,'Winding pinion clutch hub',[-.405,0,0]);
 const dogGeometry=(phase)=>{const s=new T.Shape();s.absarc(0,0,.10,phase,phase+Math.PI/6,false);s.absarc(0,0,.045,phase+Math.PI/6,phase,true);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.05,bevelEnabled:false,curveSegments:8});g.rotateY(Math.PI/2);g.translate(-.025,0,0);return g;};
 const clutchDogs=[],pinionDogs=[];for(let i=0;i<6;i++){clutchDogs.push(add(clutch,dogGeometry(i*TAU/6),steel,'Clutch driving face dog '+i,[-.04,0,0]));pinionDogs.push(add(pinion,dogGeometry(i*TAU/6+Math.PI/6),steel,'Pinion receiving face dog '+i,[-.43,0,0]));}
 // A stationary U-shaped yoke sits around the clutch collar, and its anchored
 // leaf spring supplies the engagement force. Neither is a floating ornament.
 const yoke=new T.Group();yoke.name='Clutch engagement yoke';group.add(yoke);
 const pivot=[d.crownX-.47,d.stemY+.06,d.z+.25];cylinder(yoke,.047,[pivot[0],.073,pivot[2]],pivot,'Yoke pivot anchored to mainplate');
 const yokeFork=new T.Group();yokeFork.name='Yoke fork following clutch groove';yoke.add(yokeFork);
 let yokeArm;function followClutch(){const shift=clutch.position.x+.39;yokeFork.position.x=shift;const A=new T.Vector3(...pivot),B=new T.Vector3(d.crownX-.49+shift,d.stemY,d.z+.12),mid=A.clone().add(B).multiplyScalar(.5);let lo=0,hi=.3,curve;for(let i=0;i<18;i++){const sag=(lo+hi)/2;curve=new T.QuadraticBezierCurve3(A,mid.clone().add(new T.Vector3(0,sag,0)),B);if(curve.getLength()<.21)lo=sag;else hi=sag;}const geo=new T.TubeGeometry(curve,24,.008,6,false);if(yokeArm){yokeArm.geometry.dispose();yokeArm.geometry=geo;}else yokeArm=add(yoke,geo,steel,'Constant length flexible yoke arm');}
 for(const sign of [-1,1])cylinder(yokeFork,.010,[d.crownX-.49,d.stemY,d.z+sign*.12],[d.crownX-.49,d.stemY+sign*.108,d.z],'Yoke fork enclosing clutch groove');
 const ratchetOutline=[];for(let i=0;i<20;i++){const a=i*TAU/20;for(const [da,r] of [[0,.545],[TAU/20-.025,.59],[TAU/20-.005,.545]])ratchetOutline.push([r*Math.cos(a+da),r*Math.sin(a+da)]);}
 const clickShape=new T.Shape(ratchetOutline.map(([x,z])=>new T.Vector2(x,-z)));const keyHole=new T.Path();keyHole.moveTo(-.024,-.024);keyHole.lineTo(-.024,.024);keyHole.lineTo(.024,.024);keyHole.lineTo(.024,-.024);keyHole.closePath();clickShape.holes.push(keyHole);const clickGeo=new T.ExtrudeGeometry(clickShape,{depth:.03,bevelEnabled:false});clickGeo.rotateX(-Math.PI/2);const clickRing=add(arbor,clickGeo,gold,'20 asymmetric teeth keyed click ratchet',[0,d.ratchetY+.07,0]);
 const yokeSpringAnchor=[d.crownX-.35,d.stemY+.03,d.z+.40];cylinder(yoke,.04,[yokeSpringAnchor[0],.073,yokeSpringAnchor[2]],yokeSpringAnchor,'Yoke spring anchor fixed to mainplate');const ys=new T.CatmullRomCurve3([new T.Vector3(...yokeSpringAnchor),new T.Vector3(d.crownX-.48,d.stemY+.05,d.z+.36),new T.Vector3(...pivot)]);add(yoke,new T.TubeGeometry(ys,24,.009,6,false),steel,'Anchored yoke engagement spring');
 const clickBase=[d.barrelX,.073,d.z+.87],clickPivot=[d.barrelX,d.ratchetY+.085,d.z+.87];cylinder(group,.055,clickBase,clickPivot,'Click post fixed to mainplate');
 const click=new T.Group();click.name='Pivoted anti reverse click';click.position.set(...clickPivot);group.add(click);
 cylinder(click,.012,[0,0,0],[0,0,-.31],'Click arm');const clickTip=add(click,new T.SphereGeometry(.018,16,8),steel,'Click contact tip',[0,0,-.31]);
 cylinder(group,.07,[clickPivot[0],d.ratchetY+.10,clickPivot[2]],[clickPivot[0],d.ratchetY+.12,clickPivot[2]],'Click pivot retaining screw');
 const springAnchor=[d.barrelX+.25,d.ratchetY+.085,d.z+.99];cylinder(group,.04,[springAnchor[0],.073,springAnchor[2]],springAnchor,'Click spring fixed post');
 let springMesh;function springToClick(){const end=new T.Vector3(.015,0,-.08).applyMatrix4(click.matrix),pts=[new T.Vector3(...springAnchor),new T.Vector3(d.barrelX+.18,d.ratchetY+.085,d.z+.72),end];const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),28,.007,6,false);if(springMesh){springMesh.geometry.dispose();springMesh.geometry=geo;}else springMesh=add(group,geo,steel,'Click leaf spring between anchor and click');}
 function signedDistance(q,poly){let min=Infinity,inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const A=poly[j],B=poly[i],dx=B[0]-A[0],dz=B[1]-A[1],t=Math.max(0,Math.min(1,((q[0]-A[0])*dx+(q[1]-A[1])*dz)/(dx*dx+dz*dz)));min=Math.min(min,Math.hypot(q[0]-A[0]-t*dx,q[1]-A[1]-t*dz));if((A[1]>q[1])!==(B[1]>q[1])&&q[0]<(B[0]-A[0])*(q[1]-A[1])/(B[1]-A[1])+A[0])inside=!inside;}return inside?-min:min;}
 let lastCrown=0,arborTurns=0,disengaged=false;
 function update(state={}){
  if(Number.isFinite(state.arborTurns))arborTurns=state.arborTurns;
  else if(Number.isFinite(state.crownTurns)){const delta=state.crownTurns-lastCrown;if(delta<0)disengaged=true;else if(delta>0){let drive=delta;if(disengaged){const step=1/6,phase=lastCrown-arborTurns*d.ratchetTeeth/d.pinionTeeth,gap=Math.ceil((phase-1e-10)/step)*step-phase;drive=Math.max(0,delta-gap);if(delta>=gap-1e-10)disengaged=false;}arborTurns+=drive*d.pinionTeeth/d.ratchetTeeth;}lastCrown=state.crownTurns;}
  const a=arborTurns*TAU,c=-a*d.ratchetTeeth/d.crownTeeth,p=c*d.crownTeeth/d.pinionTeeth;
  crown.rotation.y=c;pinion.rotation.x=p;stem.rotation.x=Number.isFinite(state.crownTurns)?-state.crownTurns*TAU:p;
  if(!options.arbor)arbor.rotation.y=a;
  const reverse=Number.isFinite(state.crownTurns)&&disengaged;clutch.position.x=-.39-(reverse?.055:0);followClutch();
  // Solve the spring-loaded tip against the visible asymmetric ratchet boundary.
  const poly=ratchetOutline.map(([x,z])=>[x*Math.cos(a)+z*Math.sin(a),-x*Math.sin(a)+z*Math.cos(a)]);
  let low=0,high=.95;for(let i=0;i<34;i++){const beta=(low+high)/2,q=[.31*Math.sin(beta),.87-.31*Math.cos(beta)];if(signedDistance(q,poly)<.0182)low=beta;else high=beta;}click.rotation.y=-(low+high)/2;click.updateMatrix();springToClick();group.updateMatrixWorld(true);
  return {arborTurns,crownTurns:-p/TAU,crownWheelTurns:c/TAU,reverse};
 }
 const parts={stem,shaft,innerStem,stemGuide,square,clutch,clutchDogs,pinionDogs,pinion,pinionBevel,crown,crownBevel,crownSpur,crownShaft,arbor,ratchet,clickRing,keyedShoulder,arborScrew,click,clickTip,yoke,yokeFork};
 update();return {group,parts,dims:d,update};
}
