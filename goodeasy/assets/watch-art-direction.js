// Adapted from the requested ChatGPT watch redesign. All pivots remain owned by
// anatomy-watch; these meshes describe machining and support, never new dynamics.
const TAU=Math.PI*2;
function facedMetal(T,geometry,face,edge){
 const cap=geometry.groups.find(g=>g.materialIndex===0),side=geometry.groups.find(g=>g.materialIndex===1),wallGeometry=geometry.clone();
 geometry.clearGroups();geometry.setDrawRange(cap.start,cap.count);wallGeometry.clearGroups();wallGeometry.setDrawRange(side.start,side.count);
 const mesh=new T.Mesh(geometry,face),wall=new T.Mesh(wallGeometry,edge);wall.name='Polished machined sidewall';wall.castShadow=wall.receiveShadow=true;mesh.add(wall);return mesh;
}
export function buildMachinedMainplate(T,{center,radius,bores}={}){
 const group=new T.Group(),top=new T.MeshStandardMaterial({color:0x9ca49c,metalness:.86,roughness:.38}),edge=new T.MeshStandardMaterial({color:0xd2d5ca,metalness:.94,roughness:.22}),floorMat=new T.MeshStandardMaterial({color:0x596762,metalness:.77,roughness:.49});
 const outline=new T.Shape();outline.absarc(0,0,radius,0,TAU,false);
 for(const [x,z,r] of bores){const p=new T.Path();p.absarc(x,-z,r,0,TAU,true);outline.holes.push(p);}
 const contours=[
  [[-2.12,-.30],[-2.02,-.85],[-1.50,-1.45],[-.85,-1.68],[-.38,-1.30],[-.47,-.75],[-1.15,-.50]],
  [[-1.90,1.45],[-1.65,2.05],[-.85,2.40],[-.20,2.25],[.15,1.85],[-.20,1.55],[-1.10,1.35]]
 ];
 const polygons=[];
 for(const contour of contours){
  const path=new T.CatmullRomCurve3(contour.map(([x,z])=>new T.Vector3(x-center[0],0,z-center[1])),true,'centripetal'),points=path.getPoints(100).map(p=>new T.Vector2(p.x,-p.z));polygons.push(points);const hole=new T.Path(points);hole.closePath();outline.holes.push(hole);
  const f=new T.Shape(points),fg=new T.ExtrudeGeometry(f,{depth:.018,bevelEnabled:false,curveSegments:32});fg.rotateX(-Math.PI/2);const floor=new T.Mesh(fg,floorMat);floor.position.set(center[0],0,center[1]);floor.name='Blind machined recess floor';floor.receiveShadow=true;group.add(floor);
 }
 const g=new T.ExtrudeGeometry(outline,{depth:.065,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:96});g.rotateX(-Math.PI/2);const mainplate=facedMetal(T,g,top,edge);mainplate.name='Concentric movement mainplate';mainplate.userData.radius=radius;mainplate.position.set(center[0],0,center[1]);mainplate.castShadow=mainplate.receiveShadow=true;group.add(mainplate);
 const inside=(x,z,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>z)!==(b.y>z))&&(x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x))yes=!yes;}return yes;};
 const lines=[];for(let z=-radius;z<radius;z+=.17)for(let x=-radius;x<radius;x+=.17){if(Math.hypot(x,z)>radius-.22||bores.some(([bx,bz,r])=>Math.hypot(x-bx,z-bz)<r+.11))continue;const pocket=polygons.some(p=>inside(x,-z,p)),y=pocket?.019:.074;
  for(let i=0;i<24;i++){const a=i/24*TAU,b=(i+1)/24*TAU,ax=x+Math.cos(a)*.096,az=z+Math.sin(a)*.096,bx=x+Math.cos(b)*.096,bz=z+Math.sin(b)*.096;if(polygons.some(p=>inside(ax,-az,p))!==pocket||polygons.some(p=>inside(bx,-bz,p))!==pocket)continue;lines.push(ax+center[0],y,az+center[1],bx+center[0],y,bz+center[1]);}
 }
 const mark=new T.BufferGeometry();mark.setAttribute('position',new T.Float32BufferAttribute(lines,3));const finish=new T.LineSegments(mark,new T.LineBasicMaterial({color:0xcbd1bd,transparent:true,opacity:.045,depthWrite:false}));finish.name='Overlapping circular polishing marks';group.add(finish);
 return {group,mainplate};
}
export function buildMovementFinishing(T,{centers,anchors,steel,gold}={}){
 const group=new T.Group();group.name='Sculpted pierced train bridge';
 const face=new T.MeshStandardMaterial({color:0xb3b8af,metalness:.9,roughness:.32});
 const bevel=new T.MeshStandardMaterial({color:0xd2d8d2,metalness:.96,roughness:.17});
 const blue=new T.MeshStandardMaterial({color:0x263b4f,metalness:.9,roughness:.28});
 const jewel=new T.MeshPhysicalMaterial({color:0x591329,metalness:.12,roughness:.18,clearcoat:1});
 function add(g,m,name,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function bore(s,x,z,r){const h=new T.Path();h.absarc(x,-z,r,0,TAU,true);s.holes.push(h);}
 function surface(s,name){const g=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:40});g.rotateX(-Math.PI/2);const o=facedMetal(T,g,face,bevel);o.name=name;o.position.y=1.30;o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function annulus(x,z,outer,inner,y,depth,mat,name){const s=new T.Shape();s.absarc(0,0,outer,0,TAU,false);bore(s,0,0,inner);const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);return add(g,mat,name,x,y,z);}
 // Wide, asymmetric feet narrow into a bearing boss. The screw ends remain
 // exactly over the five existing posts; polished sidewalls reveal real thickness.
 for(let i=0;i<centers.length;i++){
  const A=centers[i],B=anchors[i],dx=B[0]-A[0],dz=B[1]-A[1],L=Math.hypot(dx,dz),u=[dx/L,dz/L],n=[-u[1],u[0]];
  const p=(t,w)=>new T.Vector2(A[0]+u[0]*t+n[0]*w,-A[1]-u[1]*t-n[1]*w),s=new T.Shape(),r=i===4?.11:.135;
  const move=(t,w)=>{const v=p(t,w);s.moveTo(v.x,v.y);},line=(t,w)=>{const v=p(t,w);s.lineTo(v.x,v.y);},curve=(a,b,c,d,e,f)=>{const q=p(a,b),v=p(c,d),w=p(e,f);s.bezierCurveTo(q.x,q.y,v.x,v.y,w.x,w.y);};
  move(-r,0);curve(-r,-r,.04,-r,.18,-r*.8);curve(L*.5,-.10,L*.72,-.25,L,-.23);curve(L+.25,-.23,L+.27,.20,L,.22);curve(L*.72,.23,L*.42,.21,.12,r);curve(-.03,r,-r,r,-r,0);s.closePath();bore(s,...A,.056);bore(s,...B,.036);
  const o=surface(s,'Machined train bridge '+i);o.userData.bearingCenter=[...A];o.userData.mountCenter=[...B];
  annulus(...A,.076,.052,1.365,.009,gold,'Recessed jewel setting '+i);
  annulus(...A,.050,.0105,1.354,.014,jewel,'Upper pierced jewel bearing');
  annulus(...A,.056,.050,1.350,.008,blue,'Jewel counterbore shadow '+i);
  add(new T.CylinderGeometry(.055,.055,.018,32),blue,'Heat blued bridge screw '+i,B[0],1.378,B[1]);
  const slot=add(new T.BoxGeometry(.075,.003,.011),steel,'Bridge screw slot '+i,B[0],1.389,B[1]);slot.rotation.y=Math.atan2(dx,dz);
  // Directional, short grain lies on the solid foot, not across its bores.
  const strokes=[];for(let k=-4;k<=4;k++){const w=k*.025;for(let t=L*.52;t<L+.10;t+=.018){const q=p(t,w);if(Math.hypot(q.x-B[0],-q.y-B[1])<.07)continue;strokes.push(q.x,1.378,-q.y,q.x+u[0]*.012,1.378,-q.y+u[1]*.012);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(strokes,3));const grain=new T.LineSegments(g,new T.LineBasicMaterial({color:0xe1e0ce,transparent:true,opacity:.12}));grain.name='Straight graining on bridge foot';group.add(grain);
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
 const bore=new T.Path();bore.absarc(0,0,module*1.4,0,TAU,true);s.holes.push(bore);
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
