// GOODEASY 08 — procedural MX-style cutaway, model units = 10 mm.
// Travel input in mm (0..4). Visualization model, not Cherry CAD.
import {CROSS,crossOutline,keycapProfile,buildKeycapShell,buildSocketGeometry,buildRibGeometries,buildLegendGeometry,STUDY_LEGENDS,ceilingY} from './mx-keycap.js?v=20261030-craft-release1';
// Stem slider footprint (x is asymmetric so the +x wall clears the moving contact button).
export const STEM={xMin:-.25,xMax:.22,z:.25,corner:.05,bore:.195,boreTop:-.04,bottom:-.30,headTop:.20,crossBottom:.19,crossTop:.56,
 head:{xMin:-.225,xMax:.20,z:.225,corner:.045,round:.02},wing:{x:.045,zIn:.24,zOut:.42,top:-.10,bottom:-.30},pole:{radius:.07,tip:.055,bottom:-.26}};
export const HOUSING={ring:{outer:.70,corner:.12,hole:.29,notchX:.56,notchZ:.18,bottom:-.09,depth:.16},guide:{xIn:.055,xOut:.115,zIn:.30,zOut:.62,bottom:-.62},
 floorTop:-.73,sleeve:{outer:.125,inner:.09,top:-.47},pad:{x:.045,zIn:.30,zOut:.42,top:-.70}};
// Closed-end helix whose top seats in the stem bore; active coils stay open at 4 mm.
export const SPRING={radius:.165,wire:.015,base:-.73,rest:STEM.boreTop+.73,turns:7,closed:1,pitchMargin:1.02};
export const KEYCAP=keycapProfile({bottom:.20,height:.95});
export const SOCKET={bottom:.22,radius:.275};
export const CAP_PIVOT=.65,CAP_EXPLODE_TILT=.95,CAP_TILT_START=.35; // tilt waits until the socket is off the cross and above the plate
export function springCentreY(u,length,s=SPRING){
 const d=2*s.wire*s.pitchMargin,active=s.turns-2*s.closed,pa=(length-2*s.wire-2*s.closed*d)/active;
 if(u<=s.closed)return s.wire+u*d;if(u<=s.turns-s.closed)return s.wire+s.closed*d+(u-s.closed)*pa;return s.wire+s.closed*d+active*pa+(u-s.turns+s.closed)*d;
}
export function buildMXSwitch(T,M={}) {
 const material=(k,c,metal=false)=>M[k]||new T.MeshStandardMaterial({color:c,roughness:metal?.37:.68,metalness:metal?.7:0});
 const ivory=material('ivory',0xe4dfd5),black=material('black',0x24252a),red=material('red',0xd52d26),steel=material('steel',0xa9adb2,true),brass=material('brass',0xbfa171,true);
 const legendInk=M.legend||new T.MeshStandardMaterial({color:0x2f3532,roughness:.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const group=new T.Group(),parts={};
 function part(n){const p=new T.Group();p.name=n;group.add(p);parts[n]=p;return p;}
 function mesh(p,g,m,x=0,y=0,z=0,name){const o=new T.Mesh(g,m);o.position.set(x,y,z);if(name)o.name=name;p.add(o);return o;}
 const box=(x,y,z)=>new T.BoxGeometry(x,y,z), cyl=(a,b,h,n=32)=>new T.CylinderGeometry(a,b,h,n);
 // Plan-view shape extruded upward from y0 to y1 (shape y maps to -z; every outline here is z-symmetric).
 const rise=(shape,y0,y1,opts={})=>{const g=new T.ExtrudeGeometry(shape,{depth:y1-y0,bevelEnabled:false,curveSegments:8,...opts});g.rotateX(-Math.PI/2);g.translate(0,y0,0);return g;};
 const rounded=(x0,x1,z,r)=>{const s=new T.Shape();s.moveTo(x0+r,-z);s.lineTo(x1-r,-z);s.absarc(x1-r,-z+r,r,-Math.PI/2,0);s.lineTo(x1,z-r);s.absarc(x1-r,z-r,r,0,Math.PI/2);s.lineTo(x0+r,z);s.absarc(x0+r,z-r,r,Math.PI/2,Math.PI);s.lineTo(x0,-z+r);s.absarc(x0+r,-z+r,r,Math.PI,Math.PI*1.5);return s;};
 const annulus=(outer,inner)=>{const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);return s;};
 const lower=part('lowerHousing'),upper=part('upperHousing'),stem=part('stem'),spring=part('spring'),fixed=part('fixedContact'),leaf=part('movingLeaf'),cap=part('keycap');
 mesh(lower,box(1.46,.12,1.46),black,0,-.79,0); // floor slab, top at -.73
 // Walls are named so an observation view can open the two facing the study camera (+x, +z).
 const walls=[];for(const s of [-1,1]){walls.push(mesh(lower,box(1.46,.52,.105),black,0,-.48,s*.68,'lower housing wall '+(s>0?'+z':'-z')),mesh(lower,box(.105,.52,1.27),black,s*.68,-.48,0,'lower housing wall '+(s>0?'+x':'-x')));}
 for(const z of [-.26,.26])mesh(lower,cyl(.043,.043,.34,12),brass,.33,-.99,z);
 const H=HOUSING;
 // Hollow centre sleeve: the spring wraps it and the stem pole enters it after about 2.1 mm.
 mesh(lower,rise(annulus(H.sleeve.outer,H.sleeve.inner),H.floorTop,H.sleeve.top,{curveSegments:16}),black,0,0,0,'spring centre sleeve');
 // Bottom-out pads under the two guide wings; the wing faces meet them exactly at 4 mm.
 for(const s of [-1,1])mesh(lower,box(2*H.pad.x,H.pad.top-H.floorTop,H.pad.zOut-H.pad.zIn),black,0,(H.pad.top+H.floorTop)/2,s*(H.pad.zIn+H.pad.zOut)/2,'bottom-out pad');
 // Contact anchors molded into the floor, plus the centre locating post below it.
 mesh(lower,box(.08,.042,.12),black,.29,-.709,0,'moving contact anchor');
 mesh(lower,box(.10,.035,.14),black,.53,-.7125,0,'fixed contact anchor');
 mesh(lower,cyl(.20,.19,.16,32),black,0,-.93,0,'centre locating post');
 // Upper housing: a through-aperture plate sized around the stem and socket, with a notch for the cam leg.
 // Rounded outer corners keep the plate inside the keycap's rounded cavity at full travel.
 const R=H.ring,aperture=rounded(-R.outer,R.outer,R.outer,R.corner);
 const hole=new T.Path();hole.moveTo(-R.hole,-R.hole);hole.lineTo(-R.hole,R.hole);hole.lineTo(R.hole,R.hole);hole.lineTo(R.hole,R.notchZ);hole.lineTo(R.notchX,R.notchZ);hole.lineTo(R.notchX,-R.notchZ);hole.lineTo(R.hole,-R.notchZ);hole.lineTo(R.hole,-R.hole);hole.closePath();aperture.holes.push(hole);
 const ring=new T.ExtrudeGeometry(aperture,{depth:R.depth,bevelEnabled:false});ring.rotateX(-Math.PI/2);mesh(upper,ring,black,0,R.bottom,0);
 const nearTongues=[];for(const x of [-.57,.57])for(const z of [-.57,.57]){const o=mesh(upper,box(.14,.26,.15),black,x,-.28,z);if(z>0)nearTongues.push(o);}
 // Guide channels hang under the plate; each stem wing slides between one pair.
 const G=H.guide,nearChannels=[];for(const s of [-1,1])for(const xs of [-1,1])(s>0?nearChannels:[]).push(mesh(upper,box(G.xOut-G.xIn,R.bottom-G.bottom,G.zOut-G.zIn),black,xs*(G.xIn+G.xOut)/2,(R.bottom+G.bottom)/2,s*(G.zIn+G.zOut)/2,'stem guide channel'));
 // Stem: cross, solid head, bored slider body, two guide wings, spring pole and the contact cam leg.
 const S=STEM,crossShape=new T.Shape();crossOutline().forEach(([x,z],i)=>i?crossShape.lineTo(x,-z):crossShape.moveTo(x,-z));crossShape.closePath();
 const bevel=.012,crossGeo=new T.ExtrudeGeometry(crossShape,{depth:S.crossTop-S.crossBottom-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelOffset:-bevel,bevelSegments:2});
 crossGeo.rotateX(-Math.PI/2);crossGeo.translate(0,S.crossBottom+bevel,0);mesh(stem,crossGeo,red,0,0,0,'MX cross stem');
 // Head: narrower than the slider (a visible shoulder), rounded only along its top edge.
 const hd=S.head,headShape=()=>rounded(hd.xMin,hd.xMax,hd.z,hd.corner);
 mesh(stem,rise(headShape(),S.boreTop,S.headTop-hd.round*.5),red,0,0,0,'stem head');
 mesh(stem,rise(headShape(),S.headTop-3*hd.round,S.headTop,{bevelEnabled:true,bevelThickness:hd.round,bevelSize:hd.round,bevelOffset:-hd.round,bevelSegments:2}).translate(0,-hd.round,0),red,0,0,0,'stem head crown');
 const body=rounded(S.xMin,S.xMax,S.z,S.corner),bore=new T.Path();bore.absarc(0,0,S.bore,0,Math.PI*2,true);body.holes.push(bore);
 mesh(stem,rise(body,S.bottom,S.boreTop,{curveSegments:12}),red,0,0,0,'stem slider body'); // 24-gon bore still clears the spring
 for(const s of [-1,1])mesh(stem,box(2*S.wing.x,S.wing.top-S.wing.bottom,S.wing.zOut-S.wing.zIn),red,0,(S.wing.top+S.wing.bottom)/2,s*(S.wing.zIn+S.wing.zOut)/2,'stem guide wing');
 mesh(stem,cyl(S.pole.radius,S.pole.tip,S.boreTop-S.pole.bottom,24),red,0,(S.boreTop+S.pole.bottom)/2,0,'spring centre pole');
 // The cam acts on the leaf tab beside the contacts; the electrical buttons remain in Z=0.
 // At rest the cam holds the sprung leaf away from the fixed contact.
 // Its sloped left face retreats as the stem descends. After contact closes,
 // the relief continues away, allowing the stem to overtravel without bending the contacts through each other.
 const camFace=[],camAngle=Math.asin(.096/.335);
 for(let i=0;i<=80;i++){const mm=i/20,a=camAngle*Math.min(mm/2,1);
   const x=.28+.023*Math.cos(a)+.4125*Math.sin(a)+Math.max(0,mm-2)*.04;
   const y=-.68-.023*Math.sin(a)+.4125*Math.cos(a)+mm*.1;camFace.push([x,y]);}
 const profile=new T.Shape();profile.moveTo(.303,-.2675);
 camFace.forEach(([x,y])=>profile.lineTo(x,y));profile.lineTo(.53,camFace.at(-1)[1]);profile.lineTo(.53,-.2675);profile.closePath();
 const camGeometry=new T.ExtrudeGeometry(profile,{depth:.045,bevelEnabled:false});
 const stemCam=mesh(stem,camGeometry,red,0,0,.11);stemCam.name='contact release cam';
 stemCam.userData.profile=camFace;
 // A riser, an outer bridge and a rear web tie the cam leg to the stem head. The bridge crosses the
 // contact plane above the fixed button even at 4 mm, and all three stay outside the leaf's travel envelope.
 mesh(stem,box(.035,.07,.045),red,.5125,.135,.1325,'cam riser');
 mesh(stem,box(.035,.06,.31),red,.5125,.14,0,'cam outer support');
 mesh(stem,box(.345,.06,.045),red,.3575,.14,-.1325,'cam slider web');
 const fixedButton=mesh(fixed,new T.SphereGeometry(.052,16,12),steel,.48,-.359049,0);
 mesh(fixed,box(.065,.36,.10),brass,.53,-.515,0);
 // Leaf anchored at lower pivot, bends towards fixed button. Contact at exactly 2 mm.
 const pivot=new T.Group();pivot.position.set(.28,-.68,0);leaf.add(pivot);
 const leafStrip=mesh(pivot,box(.046,.335,.075),brass,0,.1675,0);
 const movingButton=mesh(pivot,new T.SphereGeometry(.052,16,12),steel,0,.335,0);mesh(pivot,box(.046,.075,.16),brass,0,.45,.085);
 mesh(pivot,box(.046,.20,.10),brass,0,.35,.05); // raised leaf follower, joined to the strip
 // Moving button center at rest x=.28, fixed x=.48; at 2 mm: moving center x=.376.
 // Button surfaces touch when center distance=.104. Geometry rotation around lower pivot.
 const targetAngle=Math.asin(.096/.335);
 // Spring: a real tube around a helix, rebuilt in place so the wire stays round when compressed.
 const springBase=SPRING.base,perTurn=40,radial=8,samples=SPRING.turns*perTurn+1,coil=new T.BufferGeometry();
 const springPos=new Float32Array((samples*(radial+1)+2)*3),springNormal=new Float32Array(springPos.length),springIndex=[];
 for(let i=0;i<samples-1;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+1,c=a+radial+1,d=c+1;springIndex.push(a,b,c,c,b,d);}
 const endA=samples*(radial+1),endB=endA+1;for(let j=0;j<radial;j++){springIndex.push(endA,j+1,j);const o=(samples-1)*(radial+1);springIndex.push(endB,o+j,o+j+1);}
 coil.setIndex(springIndex);coil.setAttribute('position',new T.BufferAttribute(springPos,3));coil.setAttribute('normal',new T.BufferAttribute(springNormal,3));
 const springMesh=mesh(spring,coil,steel,0,0,0,'return spring coil');
 function setSpringLength(length){
  const r=SPRING.radius,w=SPRING.wire,du=1e-3,t=new T.Vector3(),n=new T.Vector3(),b=new T.Vector3(),q=new T.Vector3();
  for(let i=0;i<samples;i++){const u=i/perTurn,a=u*Math.PI*2,y=springCentreY(u,length),dy=(springCentreY(Math.min(SPRING.turns,u+du),length)-springCentreY(Math.max(0,u-du),length))/((Math.min(SPRING.turns,u+du)-Math.max(0,u-du))*Math.PI*2);
   t.set(-r*Math.sin(a),dy,r*Math.cos(a)).normalize();n.set(Math.cos(a),0,Math.sin(a));n.addScaledVector(t,-n.dot(t)).normalize();b.crossVectors(t,n);
   for(let j=0;j<=radial;j++){const f=j/radial*Math.PI*2,k=(i*(radial+1)+j)*3;q.copy(n).multiplyScalar(Math.cos(f)).addScaledVector(b,Math.sin(f));
    springPos[k]=r*Math.cos(a)+w*q.x;springPos[k+1]=y+w*q.y;springPos[k+2]=r*Math.sin(a)+w*q.z;springNormal[k]=q.x;springNormal[k+1]=q.y;springNormal[k+2]=q.z;}
   if(i===0||i===samples-1){const k=(i?endB:endA)*3,s=i?1:-1;springPos[k]=r*Math.cos(a);springPos[k+1]=y;springPos[k+2]=r*Math.sin(a);springNormal[k]=t.x*s;springNormal[k+1]=t.y*s;springNormal[k+2]=t.z*s;}
  }
  coil.attributes.position.needsUpdate=true;coil.attributes.normal.needsUpdate=true;coil.boundingBox=null;coil.boundingSphere=null;
  spring.userData.length=length;
 }
 spring.position.y=springBase;
 // Keycap: thick drafted skirt, filleted top edge, cylindrical dish, hollow underside with a cross socket.
 const capPivot=new T.Group();capPivot.name='keycap pivot';capPivot.position.y=CAP_PIVOT;cap.add(capPivot);
 const capBody=new T.Group();capBody.name='keycap body';capBody.position.y=-CAP_PIVOT;capPivot.add(capBody);
 const shell=buildKeycapShell(T,KEYCAP,{interior:true});
 mesh(capBody,shell.exterior,ivory,0,0,0,'keycap exterior');mesh(capBody,shell.interior,ivory,0,0,0,'keycap cavity');mesh(capBody,shell.rim,ivory,0,0,0,'keycap skirt rim');
 const socket=new T.Group();socket.name='socket';capBody.add(socket);
 mesh(socket,buildSocketGeometry(T,KEYCAP,{radius:SOCKET.radius,bottom:SOCKET.bottom}),ivory,0,0,0,'cross socket');
 for(const g of buildRibGeometries(T,KEYCAP,{socketRadius:SOCKET.radius}))mesh(socket,g,ivory,0,0,0,'socket rib');
 for(const item of STUDY_LEGENDS){const o=mesh(capBody,buildLegendGeometry(T,KEYCAP,item),legendInk,0,0,0,'legend '+item.glyph);o.userData.legend=item;}
 cap.userData.profile=KEYCAP;cap.userData.ceilingCentre=ceilingY(KEYCAP,0,0);
 const explodeOffset={lowerHousing:-.65,fixedContact:-.35,movingLeaf:-.35,spring:.65,stem:1.35,upperHousing:2.55,keycap:3.45};
 // cutaway (opt-in): internal observation state that opens the +x/+z walls, the near guide channels and clip tongues.
 // The default exterior keeps every wall closed.
 function update({travel=0,explode=0,bounce=0,capTilt,cutaway=0}={}){
  const mm=T.MathUtils.clamp(Number(travel)||0,0,4),e=T.MathUtils.clamp(Number(explode)||0,0,1),dy=.1*mm*(1-e);
  for(const [n,p] of Object.entries(parts))p.position.y=(explodeOffset[n]||0)*e;
  stem.position.y-=dy;cap.position.y-=dy;spring.position.y+=springBase;
  const length=SPRING.rest-dy;if(length!==spring.userData.length)setSpringLength(length); // lower end on the floor, upper end in the stem bore
  // Rotate from lower anchor; at 2 mm the two button surfaces meet, and remain closed.
  const opening=mm>=2?T.MathUtils.clamp(Number(bounce)||0,0,1):0;
  // Exploding lifts the stem (and cam) away from the leaf, so the leaf follows the cam's effective travel.
  const effective=T.MathUtils.clamp(mm*(1-e)-(explodeOffset.stem-explodeOffset.movingLeaf)/.1*e,0,4);
  pivot.rotation.z=-(targetAngle*Math.min(effective/2,1))*(1-.12*opening);
  leaf.userData.closed=effective>=2 && opening<.001;leaf.userData.effectiveTravel=effective;
  // Lifting the cap off tips its underside toward the viewer so the cross socket is visible.
  const lift=T.MathUtils.smoothstep(e,CAP_TILT_START,1);capPivot.rotation.x=-(Number.isFinite(capTilt)?capTilt:CAP_EXPLODE_TILT*lift);
  const open=Number(cutaway)>=.5;for(const w of walls)w.visible=!(open&&(w.name.endsWith('+x')||w.name.endsWith('+z')));for(const c of [...nearChannels,...nearTongues])c.visible=!open;
  group.userData.travelMm=mm;group.userData.explode=e;group.userData.cutaway=open;
 }
 update();return {group,parts,update};
}
