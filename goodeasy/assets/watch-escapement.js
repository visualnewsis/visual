// Geometric Swiss-lever study. Construction: H. R. Playtner (1910), equidistant club-tooth lever.
// Primary construction: https://www.gutenberg.org/files/21978/21978-h/21978-h.htm (equidistant club-tooth construction).
// Input balance motion is prescribed. This is a configuration/contact model, not a force or rate simulator.
// It omits the safety dart/double-roller shock lock, oil film, inertia, elasticity and manufacturing tolerances.
// Corrected stone seating and curved horns give this representative geometry its measured contacts; it is not a production calibre.
const PI=Math.PI,TAU=PI*2,DEG=PI/180;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0],length=a=>Math.hypot(...a);
const rot=(p,a)=>[Math.cos(a)*p[0]-Math.sin(a)*p[1],Math.sin(a)*p[0]+Math.cos(a)*p[1]],polar=(r,a)=>[r*Math.cos(a),r*Math.sin(a)],clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
function signedSeparation(A,B){let sep=-Infinity;for(const P of [A,B])for(let i=0;i<P.length;i++){const e=sub(P[(i+1)%P.length],P[i]),L=length(e),n=[-e[1]/L,e[0]/L];let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(const p of A){const x=dot(p,n);amin=Math.min(amin,x);amax=Math.max(amax,x);}for(const p of B){const x=dot(p,n);bmin=Math.min(bmin,x);bmax=Math.max(bmax,x);}sep=Math.max(sep,bmin-amax,amin-bmax);}return sep;}
function pointPolygon(p,P){let inside=false,d=Infinity;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],e=sub(b,a),t=clamp(dot(sub(p,a),e)/dot(e,e),0,1);d=Math.min(d,length(sub(p,add(a,[e[0]*t,e[1]*t]))));if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside?-d:d;}
function bisection(f,a,b,iterations=48){let fa=f(a);for(let i=0;i<iterations;i++){const m=(a+b)/2,fm=f(m);if((fm>=0)===(fa>=0)){a=m;fa=fm;}else b=m;}return(a+b)/2;}
export function createSwissLeverGeometry(){
 const pitch=TAU/15,bank=5.125*DEG,unlock=3.375*DEG,D=1/Math.cos(30*DEG),F=[0,D];
 const about=(p,a)=>add(F,rot(sub(p,F),a)),C0=polar(1,120*DEG),C1=polar(1,60*DEG),M=about(C0,-unlock),N=about(C1,unlock);
 const v=sub(C0,F),w=rot(v,-3*DEG),realRadius=cross(F,w)/cross(C0,w),rO=length(sub(polar(1,114*DEG),F)),rP=length(sub(polar(1,54*DEG),F));
 const O=add(F,polar(rO,-148.125*DEG)),z=(realRadius**2+D**2-rP**2)/(2*D),x=Math.sqrt(realRadius**2-z*z),P=add(F,polar(rP,Math.atan2(z-D,x)-bank+.25*DEG));
 const jewel=(corner,end,drawAngle,bankAngle)=>{const q=rot(polar(.14,drawAngle),-bankAngle);return[corner,end,add(end,q),add(corner,q)];};
 const jewels=[jewel(M,O,108*DEG,bank),jewel(N,P,48*DEG,-bank)];
 const rootDirection=polar(1,156*DEG),t=-rootDirection[0]-Math.sqrt(rootDirection[0]**2-(1-.8**2)),root=add([1,0],[rootDirection[0]*t,rootDirection[1]*t]);
 const tooth=[root,[1,0],polar(realRadius,4.5*DEG),polar(.8,13*DEG)];
 const wheelPolygons=angle=>Array.from({length:15},(_,i)=>tooth.map(p=>rot(p,-angle+i*pitch)));
 const rubyPolygons=angle=>jewels.map(P=>P.map(p=>about(p,angle)));
 function gap(side,angle,forkAngle){const S=rubyPolygons(forkAngle)[side];let best=Infinity;for(const W of wheelPolygons(angle))best=Math.min(best,signedSeparation(W,S));return best;}
 function allGaps(angle,forkAngle){return[gap(0,angle,forkAngle),gap(1,angle,forkAngle)];}
 // Exact vertex-edge rotational contact candidates; no angular grid is used to manufacture contact.
 function wheelLimit(side,forkAngle,lo,hi,{checkOther=true}={}){
  const stone=rubyPolygons(forkAngle)[side],candidates=[];
  function roots(C,S,d,accept){const R=Math.hypot(C,S);if(!R||Math.abs(d)>R+1e-10)return;const phi=Math.atan2(S,C),q=Math.acos(clamp(d/R,-1,1));for(const raw of [phi-q,phi+q])for(let k=Math.ceil((lo-raw)/TAU);raw+k*TAU<=hi+1e-10;k++){const a=raw+k*TAU;if(a>=lo-1e-10&&accept(a))candidates.push(a);}}
  for(let k=0;k<15;k++){const T=tooth.map(p=>rot(p,k*pitch));for(const v of T)for(let j=0;j<stone.length;j++){const a=stone[j],e=sub(stone[(j+1)%stone.length],a),n=[-e[1],e[0]],d=dot(n,a);roots(dot(n,v),n[0]*v[1]-n[1]*v[0],d,angle=>{const p=rot(v,-angle),u=dot(sub(p,a),e)/dot(e,e);return u>=-1e-8&&u<=1+1e-8;});}
   for(const p of stone)for(let j=0;j<T.length;j++){const a=T[j],e=sub(T[(j+1)%T.length],a),n=[-e[1],e[0]],d=dot(n,a);roots(dot(n,p),-n[0]*p[1]+n[1]*p[0],d,angle=>{const v=rot(p,angle),u=dot(sub(v,a),e)/dot(e,e);return u>=-1e-8&&u<=1+1e-8;});}}
  candidates.sort((a,b)=>a-b);
  for(const a of candidates){const g=gap(side,a,forkAngle);if(Math.abs(g)>2e-7)continue;if(checkOther&&gap(1-side,a,forkAngle)<-1e-7)continue;
   // A discharge corner has a vanishingly short blocking interval near release. Probe down to roundoff rather than stepping over that interval.
   for(const epsilon of [2e-6,2e-8,2e-10,2e-12]){const before=gap(side,a-epsilon,forkAngle),after=gap(side,a+epsilon,forkAngle);if(before>=-1e-12&&after<-1e-14&&Math.abs(g)<1e-9)return a;}}
  return null;
 }
 const initialLock=wheelLimit(0,bank,-2*DEG,2*DEG,{checkOther:false});
 let oppositeLock=wheelLimit(1,-bank,10*DEG,14*DEG,{checkOther:false});
 if(initialLock===null||oppositeLock===null)throw Error('Swiss lever locking geometry has no solution');
 // Set the second pallet stone in its seat so actual locking contacts span exactly half a tooth.
 const correction=oppositeLock-(initialLock+pitch/2);
 jewels[1]=jewels[1].map(p=>about(rot(about(p,-bank),correction),bank));
 oppositeLock=wheelLimit(1,-bank,10*DEG,14*DEG,{checkOther:false});
 const actingLength=D,pinRadius=actingLength*Math.sin(4.875*DEG/2),slotHalf=actingLength*Math.sin(5.125*DEG/2),rollerRadius=actingLength*10.25/28,balanceDistance=rollerRadius*Math.cos(14*DEG)+rollerRadius*Math.sin(14*DEG)/Math.tan(bank),B=[0,D+balanceDistance],guardRadius=rollerRadius+pinRadius+.001;
 const bx=-balanceDistance*Math.sin(bank),bz=balanceDistance*Math.cos(bank),horns=[];
 for(const sign of [-1,1]){const P=[[sign*slotHalf,1.02]];for(let i=0;i<=64;i++){const x=mix(slotHalf,.24,i/64),z=bz-Math.sqrt(guardRadius**2-(x-bx)**2);P.push([sign*x,z]);}P.push([sign*.24,1.02]);horns.push(P);}
 const pinPosition=beta=>add(B,rot([0,-rollerRadius],beta));
 function pinGap(beta,forkAngle){const p=rot(sub(pinPosition(beta),F),-forkAngle);return Math.min(...horns.map(h=>pointPolygon(p,h)-pinRadius));}
 function forkLimit(beta,side){const edge=side>0?bank:-bank;if(pinGap(beta,edge)>=-1e-10)return edge;const step=2*bank/128;for(let i=1;i<=128;i++){const a=edge-side*i*step;if(pinGap(beta,a)>=0)return bisection(x=>pinGap(beta,x),a, a+side*step);}throw Error('Impulse pin has no legal fork configuration at beta '+beta);}
 const betaUnlock=bisection(beta=>forkLimit(beta,1)-unlock,-.2,-.1);
 function radialClear(side,a){const P=rubyPolygons(a)[side];return pointPolygon([0,0],P)-realRadius;}
 const release=[bisection(a=>radialClear(0,a),-bank,-4.5*DEG),bisection(a=>radialClear(1,a),4.5*DEG,bank)];
 const betaDrop=[bisection(beta=>forkLimit(beta,-1)-release[0],.15,.3),bisection(beta=>forkLimit(-beta,1)-release[1],.15,.3)];
 const amplitude=.85,pauseUnlock=.016,pauseDrop=.022,moveFraction=1-pauseUnlock-pauseDrop,uUnlock=Math.acos(-betaUnlock/amplitude)/PI,uDrop=betaDrop.map(b=>Math.acos(-b/amplitude)/PI);
 const unlockAt=moveFraction*uUnlock,unlockEnd=unlockAt+pauseUnlock,dropAt=uDrop.map(u=>moveFraction*u+pauseUnlock),dropEnd=dropAt.map(t=>t+pauseDrop);
 function releaseAngle(side,alpha){const end=rubyPolygons(alpha)[side][1],angle=Math.atan2(end[1],end[0]);let theta=4.5*DEG-angle;const target=side===0?10.5*DEG:22.5*DEG;theta+=Math.round((target-theta)/pitch)*pitch;return theta;}
 function contactAt(side,theta,alpha){
  const ruby=rubyPolygons(alpha)[side],teeth=wheelPolygons(theta);let best=null,distance=Infinity;
  for(const [toothIndex,tooth]of teeth.entries())for(const [source,target,isWheelVertex]of [[tooth,ruby,true],[ruby,tooth,false]])for(let vi=0;vi<source.length;vi++)for(let ei=0;ei<target.length;ei++){
   const p=source[vi],a=target[ei],edge=sub(target[(ei+1)%target.length],a),t=clamp(dot(sub(p,a),edge)/dot(edge,edge),0,1),q=add(a,[edge[0]*t,edge[1]*t]),d=length(sub(p,q));if(d<distance){distance=d;const normal=isWheelVertex?[-edge[1]/length(edge),edge[0]/length(edge)]:[edge[1]/length(edge),-edge[0]/length(edge)];best={toothIndex,rubyEdge:isWheelVertex?ei:null,rubyVertex:isWheelVertex?null:vi,wheelEdge:isWheelVertex?null:ei,point:[(p[0]+q[0])/2,(p[1]+q[1])/2],normal,distance:d};}
  }return best;
 }
 function sample(beat=0){
  const n=Math.floor(Math.max(0,beat)),f=Math.max(0,beat)-n,side=n%2,dir=side===0?1:-1;
  const tu=unlockAt,te=unlockEnd,td=dropAt[side],tf=dropEnd[side];
  let u=f<tu?f/moveFraction:f<te?uUnlock:f<td?(f-pauseUnlock)/moveFraction:f<tf?uDrop[side]:(f-pauseUnlock-pauseDrop)/moveFraction;
  let beta=(-amplitude*Math.cos(PI*u))*dir,alpha,stage,pinContact=false;
  if(f<tu){alpha=forkLimit(beta,dir);stage=Math.abs(alpha-dir*bank)<1e-8?'잠김':'해제';pinContact=stage==='해제';}
  else if(f<te){const a=forkLimit(beta,dir),b=forkLimit(beta,-dir);alpha=mix(a,b,smooth((f-tu)/(te-tu)));stage='유격 이동';}
  else if(f<td){alpha=forkLimit(beta,-dir);stage='충격 전달';pinContact=true;}
  else if(f<tf){alpha=release[side];stage='드롭';pinContact=true;}
  else {alpha=forkLimit(beta,-dir);stage=Math.abs(alpha+dir*bank)<1e-8?'잠김':'재잠김';pinContact=Math.abs(alpha+dir*bank)>1e-8;}
  const cycle=Math.floor(n/2)*pitch,active=side;
  let theta;
  if(f<td){theta=wheelLimit(active,alpha,side===0?-2*DEG:10*DEG,side===0?11.7*DEG:25.5*DEG);}
  else if(f<tf){const start=releaseAngle(side,alpha),end=wheelLimit(1-side,alpha,side===0?10*DEG:22*DEG,side===0?14*DEG:26*DEG);theta=mix(start,end,smooth((f-td)/(tf-td)));}
  else theta=wheelLimit(1-side,alpha,side===0?10*DEG:22*DEG,side===0?14*DEG:26*DEG);
  if(theta===null&&Math.abs(alpha-release[side])<1e-7)theta=releaseAngle(side,release[side]);
  if(theta===null||!Number.isFinite(theta))throw Error('No wheel contact: beat '+beat+' fork '+alpha+' phase '+stage);
  theta+=cycle;
  const gaps=allGaps(theta,alpha),pg=pinGap(beta,alpha),expectedSide=f<td?side:1-side,contact=stage==='드롭'?null:contactAt(expectedSide,theta,alpha);
  return {beat,wheelAngle:theta,wheelAdvance:theta-initialLock,forkAngle:alpha,balanceAngle:beta,stage,contactSide:stage==='드롭'?null:expectedSide,contactPoint:contact?.point,contactNormal:contact?.normal,contactFeature:contact,contactFace:contact?.rubyEdge===3?'locking':contact?.rubyEdge===0?'pallet-impulse':contact?.rubyVertex===1&&contact?.wheelEdge===1?'tooth-impulse':contact?.rubyVertex===0?'locking-corner':contact?.rubyVertex===1?'discharge-corner':'edge',wheelGaps:gaps,pinGap:pg,pinContact:pinContact&&stage!=='유격 이동',banked:Math.abs(Math.abs(alpha)-bank)<1e-8};
 }
 return {tooth,jewels,horns,centers:{wheel:[0,0],pallet:F,balance:B},constants:{pitch,bank,unlock,D,realRadius,pinRadius,slotHalf,rollerRadius,balanceDistance,initialLock,oppositeLock,correction,release,betaUnlock,betaDrop,unlockAt,unlockEnd,dropAt,dropEnd,amplitude},wheelPolygons,rubyPolygons,contactAt,wheelLimit,pinPosition,pinGap,forkLimit,allGaps,sample};
}

export function buildSwissLever({T,scale=1,orientation=0,origin=[0,0],level=0,materials={}}={}){
 if(!T)throw Error('buildSwissLever requires Three.js');
 const geometry=createSwissLeverGeometry(),c=geometry.constants,group=new T.Group();group.name='Contact-solved Swiss lever';group.position.set(origin[0],level,origin[1]);group.rotation.y=-orientation;group.scale.setScalar(scale);
 const steel=materials.steel||new T.MeshStandardMaterial({color:0x8c9b9f,metalness:.85,roughness:.29}),ruby=materials.ruby||new T.MeshPhysicalMaterial({color:0x691a35,roughness:.22,metalness:.15,clearcoat:1}),gold=materials.gold||new T.MeshStandardMaterial({color:0xaf955d,metalness:.82,roughness:.32});
 function part(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
 function mesh(parent,g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function polygon(parent,P,h,mat,name){const s=new T.Shape();P.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(PI/2);g.translate(0,h/2,0);return mesh(parent,g,mat,name);}
 function cylinder(parent,r,h,mat,name,x=0,y=0,z=0,segments=96){const o=mesh(parent,new T.CylinderGeometry(r,r,h,segments),mat,name);o.position.set(x,y,z);return o;}
 function annulus(parent,r,inner,h,mat,name,y=0){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);const p=new T.Path();p.absarc(0,0,inner,0,TAU,true);s.holes.push(p);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:96});g.rotateX(PI/2);g.translate(0,h/2+y,0);return mesh(parent,g,mat,name);}
 function rod(parent,a,b,r,mat,name){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),o=mesh(parent,new T.CylinderGeometry(r,r,d.length(),192),mat,name);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function bentArm(parent,points,r,mat,name){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(parent,new T.TubeGeometry(curve,40,r,10,false),mat,name);}
 const wheel=part(group,'Swiss escape wheel'),teeth=[];
 for(let i=0;i<15;i++){const o=polygon(wheel,geometry.tooth.map(p=>rot(p,i*c.pitch)),.08,steel.clone(),'Club escape tooth '+i);o.userData.tooth=i;teeth.push(o);}
 annulus(wheel,.81,.70,.08,steel,'Escape wheel rim');annulus(wheel,.12,.035,.08,steel,'Escape wheel pierced hub');
 for(let i=0;i<5;i++){const a=i/5*TAU;rod(wheel,[Math.cos(a)*.10,0,Math.sin(a)*.10],[Math.cos(a)*.73,0,Math.sin(a)*.73],.020,steel,'Escape wheel spoke '+i);}
 const F=geometry.centers.pallet,B=geometry.centers.balance,pallet=part(group,'Pallet fork',F[0],0,F[1]),rubies=[];
 for(let i=0;i<2;i++){const P=geometry.jewels[i].map(p=>sub(p,F)),o=polygon(pallet,P,.12,ruby.clone(),i?'Exit pallet jewel':'Entry pallet jewel');o.userData.pallet=i;rubies.push(o);
  const attach=[(P[2][0]+P[3][0])/2,0,(P[2][1]+P[3][1])/2],sign=i?1:-1;
  bentArm(pallet,[[0,0,0],[sign*.26,0,.06],[attach[0]*.85,0,attach[2]+.07],attach],.025,steel,'Rigid pallet arm '+i);
 }
 annulus(pallet,.075,.032,.10,steel,'Pallet staff seat');const tail=rod(pallet,[0,0,0],[0,0,1.035],.026,steel,'Fork tail and banking surface');
 const horns=geometry.horns.map((P,i)=>polygon(pallet,P,.08,steel,i?'Right curved horn':'Left curved horn'));
 // Banking pins are tangent to the physical tail at the two bank angles.
 const banking=part(group,'Fixed banking pins'),pins=[],rStop=.035,rTail=.026;
 for(const sign of [-1,1]){const a=sign*c.bank,p=add(F,rot([-sign*(rStop+rTail),.60],a));pins.push(cylinder(banking,rStop,.18,steel,'Banking pin '+sign,p[0],0,p[1]));}
 const balance=part(group,'Balance and impulse roller',B[0],0,B[1]),rim=annulus(balance,1.74,1.68,.07,gold,'Balance rim',.55);
 for(let i=0;i<3;i++){const a=i/3*TAU;rod(balance,[0,.55,0],[Math.cos(a)*1.69,.55,Math.sin(a)*1.69],.027,gold,'Balance spoke '+i);}
 cylinder(balance,.030,1.0,steel,'Balance staff',0,.20,0);
 const roller=cylinder(balance,c.rollerRadius+.035,.08,steel,'Impulse roller above fork',0,.29,0),impulsePin=cylinder(balance,c.pinRadius,.38,ruby,'Impulse ruby pin',0,.08,-c.rollerRadius,512);
 const contactMarker=mesh(group,new T.SphereGeometry(.014,14,10),new T.MeshBasicMaterial({color:0xf1c784}),'Actual tooth pallet contact');contactMarker.visible=false;contactMarker.userData.noFit=true;
 const mapPoint=p=>add(origin,rot([p[0]*scale,p[1]*scale],orientation)),centers=Object.fromEntries(Object.entries(geometry.centers).map(([key,p])=>[key,mapPoint(p)]));
 let lastRegulated=null,freePhase=null,freeWheelOffset=0;
 const model={group,geometry,centers,parts:{escapeWheel:wheel,teeth,pallet,rubies,horns,tail,banking,bankingPins:pins,balance,roller,impulsePin,balanceRim:rim,contactMarker},eye:[3,8,5],sample:geometry.sample,
 update(state={}){const beat=Number(state.beat)||0,regulated=state.regulated!==false&&state.regulated!==0;let s;
  if(regulated){s=geometry.sample(beat);lastRegulated=s;freePhase=null;}
  else {
   const release=lastRegulated||geometry.sample(0);
   if(freePhase===null){
    // Preserve the last engaged angle and travel direction. Free balance time must not inherit the rapidly unwinding train clock.
    const beta=release.balanceAngle,derivative=geometry.sample(release.beat+1e-5).balanceAngle-geometry.sample(Math.max(0,release.beat-1e-5)).balanceAngle;
    const forward=Math.abs(derivative)>1e-10?derivative>0:Math.floor(release.beat)%2===0,principal=Math.asin(clamp(beta/c.amplitude,-1,1));
    freePhase=forward?principal:PI-principal;freeWheelOffset=release.wheelAngle-beat*c.pitch/2;
   }
   const age=Math.max(0,Number(state.freeAge)||0),angle=c.amplitude*Math.sin(freePhase+5*PI*age)*Math.exp(-.5*age),wheelAngle=freeWheelOffset+beat*c.pitch/2;
   s={...release,beat,wheelAngle,wheelAdvance:wheelAngle-c.initialLock,balanceAngle:angle,contactSide:null,contactPoint:null,stage:'팔렛 분리',pinContact:false};
  }
  wheel.rotation.y=s.wheelAngle;pallet.rotation.y=-s.forkAngle;pallet.visible=regulated;balance.rotation.y=-s.balanceAngle;contactMarker.visible=regulated&&!!s.contactPoint&&state.showContact!==false;
  if(s.contactPoint)contactMarker.position.set(s.contactPoint[0],.075,s.contactPoint[1]);
  rubies.forEach((o,i)=>o.material.emissive?.setHex(regulated&&i===s.contactSide?0x33101a:0x000000));teeth.forEach((o,i)=>o.material.emissive?.setHex(regulated&&i===s.contactFeature?.toothIndex?0x20180a:0x000000));
  model.state=s;return s;
 }};
 model.update();return model;
}