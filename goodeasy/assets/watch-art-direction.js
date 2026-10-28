// Adapted from the requested ChatGPT watch redesign. All pivots remain owned by
// anatomy-watch; these meshes describe machining and support, never new dynamics.
const TAU=Math.PI*2;
function facedMetal(T,geometry,face,edge){
 const cap=geometry.groups.find(g=>g.materialIndex===0),side=geometry.groups.find(g=>g.materialIndex===1),wallGeometry=geometry.clone();
 geometry.clearGroups();geometry.setDrawRange(cap.start,cap.count);wallGeometry.clearGroups();wallGeometry.setDrawRange(side.start,side.count);
 const mesh=new T.Mesh(geometry,face),wall=new T.Mesh(wallGeometry,edge);wall.name='Polished machined sidewall';wall.castShadow=wall.receiveShadow=true;mesh.add(wall);return mesh;
}
export function buildMachinedMainplate(T,{center,radius,bores}={}){
 const group=new T.Group(),top=new T.MeshStandardMaterial({color:0x9ca49c,metalness:.86,roughness:.38}),edge=new T.MeshStandardMaterial({color:0xd2d5ca,metalness:.94,roughness:.22});
 const outline=new T.Shape();outline.absarc(0,0,radius,0,TAU,false);
 for(const [x,z,r] of bores){const p=new T.Path();p.absarc(x,-z,r,0,TAU,true);outline.holes.push(p);}
 const g=new T.ExtrudeGeometry(outline,{depth:.065,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:96});g.rotateX(-Math.PI/2);const mainplate=facedMetal(T,g,top,edge);mainplate.name='Concentric movement mainplate';mainplate.userData.radius=radius;mainplate.position.set(center[0],0,center[1]);mainplate.castShadow=mainplate.receiveShadow=true;group.add(mainplate);
 return {group,mainplate};
}
export function buildMovementFinishing(T,{centers,anchors,steel,gold,bridgeY=.82}={}){
 const group=new T.Group();group.name='Sculpted pierced train bridge';
 const face=new T.MeshStandardMaterial({color:0xb3b8af,metalness:.9,roughness:.32});
 const bevel=new T.MeshStandardMaterial({color:0xd2d8d2,metalness:.96,roughness:.17});
 const blue=new T.MeshStandardMaterial({color:0x263b4f,metalness:.9,roughness:.28});
 const jewel=new T.MeshPhysicalMaterial({color:0x591329,metalness:.12,roughness:.18,clearcoat:1});
 function add(g,m,name,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function bore(s,x,z,r){const h=new T.Path();h.absarc(x,-z,r,0,TAU,true);s.holes.push(h);}
 function surface(s,name){const g=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:40});g.rotateX(-Math.PI/2);const o=facedMetal(T,g,face,bevel);o.name=name;o.position.y=bridgeY;o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function annulus(x,z,outer,inner,y,depth,mat,name){const s=new T.Shape();s.absarc(0,0,outer,0,TAU,false);bore(s,0,0,inner);const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);return add(g,mat,name,x,y,z);}
 // Two physical plates: a two-screw barrel bridge and a three-screw train
 // bridge. Windows are through cuts in one connected piece, not separate arms.
 const contour=points=>{const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');return curve.getPoints(points.length*8).map(p=>new T.Vector2(p.x,-p.z));};
 const barrel=new T.Shape(contour([[-1.78,1.03],[-1.82,.73],[-1.91,.49],[-2.23,.46],[-2.30,.30],[-2.22,.14],[-1.97,.14],[-1.70,.40],[-1.51,.44],[-1.30,.38],[-1.25,.20],[-1.06,.14],[-.91,.25],[-.88,.65],[-.65,.80],[-.52,.95],[-.65,1.12],[-1.12,1.04],[-1.59,1.14]]));
 bore(barrel,...centers[0],.056);bore(barrel,-2.06,.3,.050);for(const i of [0,1])bore(barrel,...anchors[i],.036);const barrelPlate=surface(barrel,'Two-post barrel bridge');barrelPlate.userData.mountCenters=anchors.slice(0,2);barrelPlate.userData.bearingCenters=[centers[0]];
 annulus(-2.06,.3,.055,.0261,bridgeY+.054,.020,steel,'Crown wheel upper journal');
 const train=new T.Shape(contour([[-.43,.22],[-.35,.10],[-.12,.13],[.30,.15],[.58,.12],[.70,-.30],[.73,-.48],[.68,-1.00],[.68,-1.22],[.98,-1.55],[1.12,-1.63],[1.25,-1.52],[1.18,-1.38],[1.0,-1.22],[.94,-1.13],[.99,-.83],[1.32,-.72],[1.68,-.49],[1.88,-.44],[1.98,-.25],[1.87,-.08],[1.4,.12],[.89,.66],[.65,1.31],[.17,1.47],[-.04,1.40],[-.11,1.22],[-.05,.91],[-.25,.65],[-.39,.43]]));
 const windows=[
  [[-.14,.50],[.04,.43],[.30,.47],[.37,.70],[.31,1.06],[.08,1.12],[.01,.88]],
  [[.69,.48],[.92,.35],[1.13,.15],[1.52,-.10],[1.63,-.27],[1.48,-.39],[1.18,-.58],[1.02,-.56],[.995,-.386],[1.01,-.19],[.99,-.05],[.82,.13],[.62,.22]]
 ];
 for(const points of windows){const h=new T.Path(contour(points));h.closePath();train.holes.push(h);}for(let i=1;i<5;i++)bore(train,...centers[i],.056);for(const i of [2,3,4])bore(train,...anchors[i],.036);
 const trainPlate=surface(train,'Three-post pierced train bridge');trainPlate.userData.mountCenters=anchors.slice(2);trainPlate.userData.bearingCenters=centers.slice(1);
 for(let i=0;i<centers.length;i++){
  const A=centers[i],B=anchors[i];
  annulus(...A,.076,.052,bridgeY+.065,.009,gold,'Recessed jewel setting '+i);
  annulus(...A,.050,.0105,bridgeY+.054,.014,jewel,'Upper pierced jewel bearing');
  annulus(...A,.056,.050,bridgeY+.050,.008,blue,'Jewel counterbore shadow '+i);
  add(new T.CylinderGeometry(.055,.055,.018,32),blue,'Heat blued bridge screw '+i,B[0],bridgeY+.078,B[1]);
  const slot=add(new T.BoxGeometry(.075,.003,.011),steel,'Bridge screw slot '+i,B[0],bridgeY+.089,B[1]);slot.rotation.y=i*.61;
 }
 return {group,materials:{face,bevel,blue,jewel}};
}

// Preserve the complete original tooth contour and pitch radius. Only the web
// inside the root circle is cut into five tapered spoke windows.
export function refineWatchWheel(T,wheel,module,escape=false){
 const original=wheel.geometry.parameters.shapes,s=new T.Shape(original.getPoints());
 const r=wheel.userData.pitchRadius,inner=escape?r*.27:r*.22,outer=r-module*2.1,N=5;
 if(r>.2)for(let i=0;i<N;i++){
  const a=i/N*TAU+.11,b=(i+1)/N*TAU-.11,h=new T.Path();
  h.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);h.lineTo(Math.cos(a+.035)*outer,Math.sin(a+.035)*outer);h.absarc(0,0,outer,a+.035,b-.035,false);h.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);h.absarc(0,0,inner,b,a,true);h.closePath();s.holes.push(h);
 }
 const bore=new T.Path();bore.absarc(0,0,.019,0,TAU,true);s.holes.push(bore);
 const g=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.0015,bevelThickness:.002,bevelSegments:2,curveSegments:32});g.rotateX(-Math.PI/2);wheel.geometry.dispose();wheel.geometry=g;wheel.name=escape?'Fine steel escape wheel':'Thin brass wheel with tapered spokes';
 const rim=new T.Mesh(new T.TorusGeometry(r-module*1.8,.003,5,96),wheel.material);rim.rotation.x=Math.PI/2;rim.position.y=.037;rim.name='Turned wheel rim';wheel.add(rim);
}

export function buildWatchExterior(T,{leather,polished,lining}={}){
 const group=new T.Group();group.name='Leather underside and buckle';
 const edge=new T.MeshStandardMaterial({color:0x211a15,roughness:.8});
 const inside=lining||new T.MeshStandardMaterial({color:0x655040,roughness:.94});
 function add(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 const point=(sign,t,u)=>{const w=.94-.15*t-.11*t*t,z=2.64+2.30*t,y=.58-.36*t*t+.065*(1-u*u)*Math.sin(Math.PI*t*.85);return new T.Vector3(w*u,y,sign*z);};
 for(const sign of [-1,1]){
  const vs=[],ids=[];for(let i=0;i<=40;i++)for(const u of [-.96,.96]){const p=point(sign,i/40,u);vs.push(p.x,p.y-.079,p.z);}for(let i=0;i<40;i++){const a=i*2;ids.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(ids);g.computeVertexNormals();const back=add(g,inside,'Leather strap lining');back.material.side=T.DoubleSide;
  for(const u of [-1,1]){const pts=Array.from({length:41},(_,i)=>{const p=point(sign,i/40,u);p.y-=.039;return p;});add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.012,6,false),edge,'Burnished strap edge');}
 }
 function tube(pts,r,mat,name){return add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),40,r,10,false),mat,name);}
 tube([[-.66,.22,4.82],[-.73,.21,4.96],[-.70,.20,5.19],[0,.20,5.23],[.70,.20,5.19],[.73,.21,4.96],[.66,.22,4.82]],.041,polished,'Steel strap buckle');
 tube([[-.67,.22,4.84],[.67,.22,4.84]],.024,polished,'Buckle pivot bar');tube([[0,.22,4.84],[0,.245,5.17]],.022,polished,'Buckle pin');
 const keeper=new T.Shape();keeper.moveTo(-.76,-.07);keeper.lineTo(.76,-.07);keeper.quadraticCurveTo(.81,-.07,.81,0);keeper.lineTo(.81,.09);keeper.quadraticCurveTo(.81,.14,.75,.14);keeper.lineTo(-.75,.14);keeper.quadraticCurveTo(-.81,.14,-.81,.09);keeper.lineTo(-.81,0);keeper.quadraticCurveTo(-.81,-.07,-.76,-.07);const hole=new T.Path();hole.moveTo(-.73,-.03);hole.lineTo(-.73,.09);hole.lineTo(.73,.09);hole.lineTo(.73,-.03);hole.closePath();keeper.holes.push(hole);const kg=new T.ExtrudeGeometry(keeper,{depth:.12,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});const k=add(kg,leather,'Leather keeper loop');k.position.set(0,.26,4.45);
 return {group};
}
