// GOODEASY 08 — procedural MX-style cutaway, model units = 10 mm.
// Travel input in mm (0..4). Visualization model, not Cherry CAD.
export function buildMXSwitch(T,M={}) {
 const material=(k,c,metal=false)=>M[k]||new T.MeshStandardMaterial({color:c,roughness:metal?.37:.68,metalness:metal?.7:0});
 const ivory=material('ivory',0xe4dfd5),black=material('black',0x24252a),red=material('red',0xd52d26),steel=material('steel',0xa9adb2,true),brass=material('brass',0xbfa171,true);
 const group=new T.Group(),parts={};
 function part(n){const p=new T.Group();p.name=n;group.add(p);parts[n]=p;return p;}
 function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
 const box=(x,y,z)=>new T.BoxGeometry(x,y,z), cyl=(a,b,h,n=32)=>new T.CylinderGeometry(a,b,h,n);
 const lower=part('lowerHousing'),upper=part('upperHousing'),stem=part('stem'),spring=part('spring'),fixed=part('fixedContact'),leaf=part('movingLeaf'),cap=part('keycap');
 mesh(lower,box(1.46,.12,1.46),black,0,-.79,0);
 for(const s of [-1,1]){mesh(lower,box(1.46,.52,.105),black,0,-.48,s*.68);mesh(lower,box(.105,.52,1.27),black,s*.68,-.48,0);}
 mesh(lower,cyl(.24,.24,.08),black,0,-.675,0); // spring seat, top at -.635
 for(const z of [-.26,.26])mesh(lower,cyl(.043,.043,.34,12),brass,.33,-.99,z);
 // Upper housing is an actual through-aperture ring, with four clip tongues.
 const aperture=new T.Shape();aperture.moveTo(-.75,-.75);aperture.lineTo(.75,-.75);aperture.lineTo(.75,.75);aperture.lineTo(-.75,.75);aperture.closePath();
 const hole=new T.Path();hole.moveTo(-.39,-.39);hole.lineTo(-.39,.39);hole.lineTo(.39,.39);hole.lineTo(.39,.18);hole.lineTo(.56,.18);hole.lineTo(.56,-.18);hole.lineTo(.39,-.18);hole.lineTo(.39,-.39);hole.closePath();aperture.holes.push(hole);
 const ring=new T.ExtrudeGeometry(aperture,{depth:.16,bevelEnabled:false});ring.rotateX(-Math.PI/2);mesh(upper,ring,black,0,-.09,0);
 for(const x of [-.57,.57])for(const z of [-.57,.57])mesh(upper,box(.14,.26,.15),black,x,-.28,z);
 // Rest stem geometry stays above lower floor even at 4mm; central slider bottom rest -.30, full -.70.
 mesh(stem,box(.37,.35,.37),red,0,-.005,0);
 mesh(stem,box(.14,.36,.47),red,0,.35,0);mesh(stem,box(.47,.36,.14),red,0,.35,0);
 mesh(stem,box(.12,.16,.17),red,-.31,-.23,0);
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
 // A rear web and outer cross-link attach the cam below the keycap socket.
 // They route behind and around the follower, outside its full-travel envelope.
 const camPost=mesh(stem,box(.035,.06,.31),red,.5125,.10,0);camPost.name='cam outer support';
 const camWeb=mesh(stem,box(.345,.06,.045),red,.3575,.10,-.1325);camWeb.name='cam slider web';
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
 // Spring helix: fixed lower endpoint at y=-.635. Scale about that endpoint (not center).
 const springBase=-.635,restHeight=.45,turns=7,points=[];
 for(let i=0;i<=320;i++){const t=i/320,a=t*Math.PI*2*turns;points.push(new T.Vector3(.20*Math.cos(a),t*restHeight,.20*Math.sin(a)));}
 const coil=mesh(spring,new T.TubeGeometry(new T.CatmullRomCurve3(points),420,.024,8,false),steel);
 spring.position.y=springBase;
 // Keycap: one continuous rounded-square concave surface, joined to sloped trapezoid walls.
 // Mesh top uses a square grid (no separate circular dish).
 const N=28,vs=[],indices=[],bottomY=.47,topEdge=.84;
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
   const u=i/N*2-1,v=j/N*2-1;const x=.72*u,z=.72*v;
   const edge=Math.pow(Math.max(Math.abs(u),Math.abs(v)),2.6);
   const y=topEdge-.062*(1-edge);
   vs.push(x,y,z);
   if(i<N&&j<N){const q=j*(N+1)+i;indices.push(q,q+N+1,q+1,q+1,q+N+1,q+N+2);}
 }
 const topGeo=new T.BufferGeometry();topGeo.setAttribute('position',new T.Float32BufferAttribute(vs,3));topGeo.setIndex(indices);topGeo.computeVertexNormals();mesh(cap,topGeo,ivory);
 // Continuous side wall between 1.58-wide bottom and 1.44-wide top.
 const border=[];for(let i=0;i<=N;i++)border.push([i/N*2-1,-1]);for(let j=1;j<=N;j++)border.push([1,j/N*2-1]);for(let i=N-1;i>=0;i--)border.push([i/N*2-1,1]);for(let j=N-1;j>0;j--)border.push([-1,j/N*2-1]);
 const wallV=[],wallI=[];for(let k=0;k<border.length;k++){const [u,v]=border[k];wallV.push(.79*u,bottomY,.79*v,.72*u,topEdge,.72*v);const a=k*2,b=((k+1)%border.length)*2;wallI.push(a,a+1,b,b,a+1,b+1);}
 const wallG=new T.BufferGeometry();wallG.setAttribute('position',new T.Float32BufferAttribute(wallV,3));wallG.setIndex(wallI);wallG.computeVertexNormals();mesh(cap,wallG,ivory);
 // True cross-shaped cavity cut into underside: the cap is an open shell, and these walls form
 // the four inward-facing boundaries of the socket, with no solid plug across the opening.
 const socket=part('socket');cap.add(socket);group.remove(socket);delete parts.socket;
 const cross=new T.Shape();const outline=[[-.25,-.09],[-.09,-.09],[-.09,-.25],[.09,-.25],[.09,-.09],[.25,-.09],[.25,.09],[.09,.09],[.09,.25],[-.09,.25],[-.09,.09],[-.25,.09]];
 outline.forEach(([x,z],i)=>i?cross.lineTo(x,z):cross.moveTo(x,z));cross.closePath();
 const outer=new T.Shape();outer.moveTo(-.31,-.31);outer.lineTo(.31,-.31);outer.lineTo(.31,.31);outer.lineTo(-.31,.31);outer.closePath();const crossHole=new T.Path();outline.slice().reverse().forEach(([x,z],i)=>i?crossHole.lineTo(x,z):crossHole.moveTo(x,z));crossHole.closePath();outer.holes.push(crossHole);
 const socketGeo=new T.ExtrudeGeometry(outer,{depth:.62,bevelEnabled:false});socketGeo.rotateX(-Math.PI/2);mesh(socket,socketGeo,ivory,0,.17,0);
 const explodeOffset={lowerHousing:-.65,fixedContact:-.35,movingLeaf:-.35,spring:.65,stem:1.35,upperHousing:2.05,keycap:2.95};
 function update({travel=0,explode=0,bounce=0}={}){
  const mm=T.MathUtils.clamp(Number(travel)||0,0,4),e=T.MathUtils.clamp(Number(explode)||0,0,1),dy=.1*mm*(1-e);
  for(const [n,p] of Object.entries(parts))p.position.y=(explodeOffset[n]||0)*e;
  stem.position.y-=dy;cap.position.y-=dy;spring.position.y+=springBase;
  spring.scale.y=Math.max(.11,1-dy/restHeight); // bottom fixed at -.635 in assembled state
  // Rotate from lower anchor; at 2 mm the two button surfaces meet, and remain closed.
  const opening=mm>=2?T.MathUtils.clamp(Number(bounce)||0,0,1):0;
  pivot.rotation.z=-(targetAngle*Math.min(mm/2,1))*(1-e)*(1-.12*opening);
  leaf.userData.closed=mm>=2 && e<.5 && opening<.001;
  group.userData.travelMm=mm;group.userData.explode=e;
 }
 update();return {group,parts,update};
}
