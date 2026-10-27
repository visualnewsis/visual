import {smoothOutline,shapeFromPoints,insetOutline,hollowRibs} from './surface-utils.js?v=20261024-editorial1';
import {mesh,curveTube,cylinderBetween,ellipsoid,outlineShape,horizontalExtrude as bevelExtrude,ellipseRing,assemblyGroup} from './model-utils.js?v=20261024-editorial1';
import {guitarWood,woodUV,edgeDistance,plateGeometry,neckGeometry} from './guitar-craft.js?v=20261027-craft3';
// A connected six-string steel acoustic guitar. Dimensions are illustrative, not a product survey.
function horizontalExtrude(T,shape,depth,bevel,material,name,parent){if(bevel>0)return bevelExtrude(T,shape,depth,bevel,material,name,parent);const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:32,bevelEnabled:false});g.rotateX(Math.PI/2);return mesh(T,g,material,name,parent);}
const sharedGeometry=new Map();
export const GUITAR_LAYOUT={nutX:-2.34,saddleX:.63,boardEnd:-.345,topOuter:.126,topInner:.110,backInner:-.270,backOuter:-.285,nutSeat:.1645,saddleSeat:.183};
export function buildGuitar(T,materials={}){
 const buildStart=performance.now(),group=new T.Group();group.name='GOODEASY / acoustic guitar';const P=GUITAR_LAYOUT,parts={},strings=[];
 const spruce=guitarWood(T,'spruce'),rosewood=guitarWood(T,'rosewood'),mahogany=guitarWood(T,'mahogany'),ebony=guitarWood(T,'ebony'),braceWood=guitarWood(T,'brace');
 const bone=new T.MeshPhysicalMaterial({color:0xe6dbc1,roughness:.55,clearcoat:.12}),steel=new T.MeshStandardMaterial({color:0xbec5c7,metalness:.92,roughness:.25}),bronze=new T.MeshStandardMaterial({color:0xae8250,metalness:.88,roughness:.36}),binding=new T.MeshPhysicalMaterial({color:0xd3ba8b,roughness:.42}),black=new T.MeshPhysicalMaterial({color:0x201b17,roughness:.37,clearcoat:.25});
 const controls=[[-.92,0],[-.86,.285],[-.69,.438],[-.46,.485],[-.24,.455],[-.075,.365],[.085,.363],[.24,.455],[.43,.575],[.65,.632],[.86,.582],[1.02,.408],[1.085,.20],[1.095,0],[1.085,-.20],[1.02,-.408],[.86,-.582],[.65,-.632],[.43,-.575],[.24,-.455],[.085,-.363],[-.075,-.365],[-.24,-.455],[-.46,-.485],[-.69,-.438],[-.86,-.285]].map(([x,z])=>[-.92+(x+.92)*1.12,z*1.25]);
 const outline=smoothOutline(T,controls,224),inner=insetOutline(T,outline,.023),circle=Array.from({length:64},(_,i)=>{const a=-i/64*Math.PI*2;return new T.Vector2(-.1+Math.cos(a)*.205,Math.sin(a)*.205);});
 const dome=(x,z)=>{const t=Math.min(1,edgeDistance(x,z,outline)/.32);return .006*t*t*(3-2*t);},backArch=(x,z)=>-dome(x,z)*1.5;
 const plate=(name,outer,inside,holes,material,arch,parent)=>{if(!sharedGeometry.has(name))sharedGeometry.set(name,plateGeometry(T,outline,holes,outer,inside,arch));return mesh(T,sharedGeometry.get(name),material,name,parent);};
 parts.body=assemblyGroup(T,'guitar body (top / side / back)',group);
 parts.ribs=hollowRibs(T,outline,inner,P.topInner,P.backInner,rosewood,parts.body,'connected hollow side / ribs');
 const sideUV=[];let length=0;for(let i=0;i<outline.length;i++){if(i)length+=outline[i].distanceTo(outline[i-1]);sideUV.push(length/5,1,length/5,0,length/5,1,length/5,0);}parts.ribs.geometry.setAttribute('uv',new T.Float32BufferAttribute(sideUV,2));
 parts.top=plate('spruce soundboard with cutout',P.topOuter,P.topInner,[circle],spruce,dome,parts.body);
 parts.back=plate('back plate',P.backOuter,P.backInner,[],rosewood,backArch,parts.body);
 const follow=(name,y,r,parent)=>curveTube(T,outline.map(p=>[p.x,y,p.y]),r,binding,name,parent,224,6);
 follow('top edge binding',P.topOuter-.001,.005,parts.top);follow('back edge binding',P.backOuter+.001,.005,parts.back);
 // Kerfed linings stay with the ribs and form the plate glue ledges.
 const lining=assemblyGroup(T,'kerfed lining and end blocks',parts.ribs);
 const kerfs=new T.InstancedMesh(new T.BoxGeometry(.018,.027,.026),braceWood,Math.ceil(inner.length/3)*2);kerfs.name='kerfed lining blocks';kerfs.castShadow=kerfs.receiveShadow=true;lining.add(kerfs);let kerfIndex=0;const kerfTransform=new T.Object3D();for(const y of [P.topInner-.012,P.backInner+.012]){
  const pts=inner.map(p=>[p.x,y,p.y]);curveTube(T,pts,.012,braceWood,'continuous lining glue ledge',lining,224,5);
  for(let i=0;i<inner.length;i+=3){const a=inner[i],b=inner[(i+1)%inner.length];kerfTransform.position.set(a.x,y,a.y);kerfTransform.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);kerfTransform.updateMatrix();kerfs.setMatrixAt(kerfIndex++,kerfTransform.matrix);}
 }kerfs.instanceMatrix.needsUpdate=true;kerfs.computeBoundingBox();kerfs.computeBoundingSphere();
 for(const [x,w,d] of [[-.85,.12,.23],[1.28,.10,.18]]){const o=mesh(T,new T.BoxGeometry(w,P.topInner-P.backInner,d),mahogany,x<0?'neck block':'tail block',lining);o.position.set(x,(P.topInner+P.backInner)/2,0);woodUV(o.geometry);}
 parts.rosette=assemblyGroup(T,'three concentric rosette inlays',parts.top);
 for(const [r,t,m]of [[.220,.004,ebony],[.232,.004,binding],[.246,.003,ebony]]){const shape=new T.Shape();shape.absellipse(-.1,0,r,r,0,Math.PI*2,false);const hole=new T.Path();hole.absellipse(-.1,0,r-t,r-t,0,Math.PI*2,true);shape.holes.push(hole);const o=horizontalExtrude(T,shape,.0008,0,m,'soundhole rosette',parts.rosette),pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)+dome(pos.getX(i),pos.getZ(i)));o.position.y=P.topOuter+.0008;o.geometry.computeVertexNormals();}
 // A top-attached bracing assembly is shared by the hero, anatomy and body experiment.
 parts.bracing=assemblyGroup(T,'X bracing and bridge plate',parts.top);
 function beam(name,a,b,width,height,parent=parts.bracing,notch=0){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*width/2,nz=dx/len*width/2,pos=[],ids=[];
  for(let i=0;i<=18;i++){const u=i/18,x=a[0]+dx*u,z=a[1]+dz*u,h=height*(.52+.48*Math.sin(Math.PI*(name.includes('X')?(x+.4)/1.43:u))),back=parent===parts.backBraces,y=back?P.backInner+backArch(x,z):P.topInner+dome(x,z),hi=back?y+h:y-(notch===1?height/2:0),lo=back?y:notch===2?y-height/2:y-h;pos.push(x+nx,hi,z+nz,x-nx,hi,z-nz,x+nx,lo,z+nz,x-nx,lo,z-nz);}
  for(let i=0;i<18;i++){const a=i*4,b=a+4;ids.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}ids.push(0,1,2,1,3,2,72,74,73,73,74,75);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ids);const uv=[];for(let i=0;i<pos.length;i+=3){const x=pos[i]-a[0],z=pos[i+2]-a[1];uv.push((x*dx+z*dz)/(len*len),(-x*dz+z*dx)/(len*width)+.5);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return mesh(T,g,braceWood,name,parent);
 }
 for(const sign of [-1,1]){const z=x=>sign*.85*(x-.29),cross=.29,lo=cross-.025,hi=cross+.025;beam('scalloped X brace',[-.40,z(-.40)],[lo,z(lo)],.027,.052);beam('half lap X joint',[lo,z(lo)],[hi,z(hi)],.027,.052,parts.bracing,sign<0?1:2);beam('scalloped X brace',[hi,z(hi)],[1.03,z(1.03)],.027,.052);}
 beam('upper transverse brace',[-.56,-.42],[-.56,.42],.034,.037);beam('lower tone bar', [.99,-.43],[1.09,.40],.025,.028);
 const pinZ=Array.from({length:6},(_,i)=>(i-2.5)*.05),bridgePlate=outlineShape(T,[[.585,-.205],[.86,-.205],[.86,.205],[.585,.205]],pinZ.map(z=>[.754,z,.012,.012]));
 const bp=horizontalExtrude(T,bridgePlate,.015,0,braceWood,'maple bridge plate with six pin holes',parts.bracing);bp.position.y=P.topInner+dome(.72,0);woodUV(bp.geometry,'z');
 parts.backBraces=assemblyGroup(T,'back braces',parts.back);for(const x of [-.43,.3,.97]){const span=x<0?.46:x<.5?.48:.59;beam('back transverse brace',[x,-span],[x,span],.026,.035,parts.backBraces);}
 // D-section shaft, a broad heel, and tapered 19-fret ebony fingerboard.
 const widthAt=x=>.205+(.29-.205)*Math.max(0,Math.min(1,(x-P.nutX)/(P.boardEnd-P.nutX)));
 parts.neck=assemblyGroup(T,'neck, heel and tapered fingerboard',group);
 mesh(T,neckGeometry(T,P.nutX,-.84,widthAt,.126,t=>.092+.015*t),mahogany,'carved D-section neck',parts.neck);
 const heel=outlineShape(T,[[-1.04,-.123],[-.82,-.14],[-.82,.14],[-1.04,.123]]),h=horizontalExtrude(T,heel,.31,.006,mahogany,'neck heel',parts.neck);h.position.y=.126;woodUV(h.geometry);
 const boardPositions=[],boardIndices=[],boardRows=48;for(let i=0;i<=boardRows;i++){const x=P.nutX+(P.boardEnd-P.nutX)*i/boardRows,w=widthAt(x)/2;for(const z of [-w,w])boardPositions.push(x,.153,z);for(const z of [-w,w])boardPositions.push(x,.126+(x>-.92?dome(x,z):0),z);}for(let i=0;i<boardRows;i++){const a=i*4,b=a+4;boardIndices.push(a,a+1,b,a+1,b+1,b,a+2,b+2,a+3,a+3,b+2,b+3,a,b,a+2,a+2,b,b+2,a+1,a+3,b+1,a+3,b+3,b+1);}boardIndices.push(0,2,1,1,2,3,192,193,194,193,195,194);const boardGeo=new T.BufferGeometry();boardGeo.setAttribute('position',new T.Float32BufferAttribute(boardPositions,3));boardGeo.setIndex(boardIndices);woodUV(boardGeo);boardGeo.computeVertexNormals();mesh(T,boardGeo,ebony,'tapered ebony fretboard',parts.neck);
 parts.frets=assemblyGroup(T,'frets',parts.neck);const scale=P.saddleX-P.nutX;
 for(let n=1;n<=19;n++){const x=P.nutX+scale*(1-2**(-n/12)),w=widthAt(x)-.006;cylinderBetween(T,[x,.1578,-w/2],[x,.1578,w/2],.0048,steel,'fret '+n,parts.frets,10);}
 for(const n of [3,5,7,9,12,15,17]){const x=P.nutX+scale*(1-2**(-n/12))-.032;for(const z of n===12?[-.033,.033]:[0])ellipsoid(T,[x,.1539,z],[.008,.0009,.008],bone,'position dot '+n,parts.neck,12);}
 parts.nut=mesh(T,new T.BoxGeometry(.031,.027,.205),bone,'nut',parts.neck);parts.nut.position.set(P.nutX,.151,0);
 // Tilted headstock and six continuous post / gear / button assemblies.
 parts.headstock=assemblyGroup(T,'headstock and six tuners',parts.neck);const headTop=x=>.126+(x+2.34)*.20;
 const headShape=outlineShape(T,[[-2.335,-.103],[-2.57,-.143],[-2.92,-.171],[-3.04,-.13],[-3.04,.13],[-2.92,.171],[-2.57,.143],[-2.335,.103]]),head=horizontalExtrude(T,headShape,.063,.004,mahogany,'headstock paddle',parts.headstock);
 const hp=head.geometry.attributes.position;for(let i=0;i<hp.count;i++)hp.setY(i,hp.getY(i)+headTop(hp.getX(i)));head.geometry.computeVertexNormals();woodUV(head.geometry);
 ellipsoid(T,[-2.34,.074,0],[.056,.052,.102],mahogany,'neck to headstock volute',parts.headstock,24);
 for(const side of [-1,1])for(let j=0;j<3;j++){const x=-2.55-j*.155,z=side*.115,y=headTop(x);cylinderBetween(T,[x,y-.053,z],[x,y+.045,z],.010,steel,'tuner shaft '+side+'/'+j,parts.headstock);const gear=mesh(T,new T.CylinderGeometry(.028,.028,.013,20),bronze,'tuner gear housing',parts.headstock);gear.position.set(x,y-.055,z);cylinderBetween(T,[x,y-.039,z],[x,y-.039,side*.212],.008,steel,'tuner stem '+side+'/'+j,parts.headstock);ellipsoid(T,[x,y-.039,side*.223],[.029,.014,.041],bone,'tuner button '+side+'/'+j,parts.headstock,18);}
 parts.bridge=assemblyGroup(T,'bridge, saddle and six bridge pins',group);
 const bridgeShape=outlineShape(T,[[.53,-.20],[.57,-.24],[.81,-.24],[.86,-.17],[.86,.17],[.81,.24],[.57,.24],[.53,.20]],pinZ.map(z=>[.754,z,.011,.011]));
 const bridge=horizontalExtrude(T,bridgeShape,.033,0,ebony,'ebony bridge',parts.bridge);bridge.position.y=.159;const bpos=bridge.geometry.attributes.position;for(let i=0;i<bpos.count;i++)bpos.setY(i,bpos.getY(i)+dome(bpos.getX(i),bpos.getZ(i)));bridge.geometry.computeVertexNormals();woodUV(bridge.geometry,'z');
 parts.saddle=mesh(T,new T.BoxGeometry(.014,.031,.31),bone,'bone saddle seated in bridge',parts.bridge);parts.saddle.position.set(P.saddleX,P.saddleSeat-.0155,0);
 parts.pins=assemblyGroup(T,'bridge pins x6',parts.bridge);const midi=[40,45,50,55,59,64],names=['E2','A2','D3','G3','B3','E4'],radii=[.003,.0025,.0021,.0016,.0012,.0009];
 for(let i=0;i<6;i++){
  const z=pinZ[i],r=radii[i],a=[P.nutX,P.nutSeat+r,(i-2.5)*.032],b=[P.saddleX,P.saddleSeat+r,z],pin=mesh(T,new T.CylinderGeometry(.007,.010,.089,14),bone,'bridge pin shaft '+(i+1),parts.pins);pin.position.set(.754,.1185,z);ellipsoid(T,[.754,.169,z],[.013,.011,.013],black,'bridge pin '+(i+1),parts.pins,16);ellipsoid(T,[.754,.179,z],[.003,.001,.003],bone,'pin dot',parts.pins,10);
  const wire=cylinderBetween(T,a,b,r,i<3?bronze:steel,'string '+names[i]+' MIDI '+midi[i],group,10);strings.push({midi:midi[i],from:a,to:b,mesh:wire,radius:r});
  cylinderBetween(T,b,[.747,.158,z],r,bronze,'string break over saddle '+(i+1),parts.bridge,8);const ballY=P.topInner+dome(.72,0)-.021;ellipsoid(T,[.762,ballY,z],[.009,.006,.007],bronze,'string ball end '+(i+1),parts.pins,12);curveTube(T,[[.747,.158,z],[.747,ballY+.007,z],[.762,ballY,z]],r,bronze,'string through pin hole '+(i+1),parts.pins,24,6);
  const side=i<3?-1:1,j=i<3?i:5-i,tx=-2.55-j*.155,ty=headTop(tx)+.038,tz=side*.115;cylinderBetween(T,a,[tx,ty,tz],r*.75,steel,'headstock string '+(i+1),parts.headstock,8);
  const winding=[];for(let k=0;k<=64;k++){const t=k/64,theta=t*4*Math.PI;winding.push([tx+Math.cos(theta)*.011,ty-.012+t*.012,tz+Math.sin(theta)*.011]);}curveTube(T,winding,r*.6,bronze,'post winding '+(i+1),parts.headstock,64,5);
  if(i<3){const key='winding '+names[i];if(!sharedGeometry.has(key)){const points=[];for(let k=0;k<=720;k++){const t=k/720,theta=t*160*Math.PI*2,rr=r*.95;points.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+Math.cos(theta)*rr,a[2]+(b[2]-a[2])*t+Math.sin(theta)*rr]);}sharedGeometry.set(key,curveTube(T,points,.0006,bronze,key,null,720,4).geometry);}mesh(T,sharedGeometry.get(key),bronze,key,group);}
 }
 parts.pickguard=assemblyGroup(T,'pickguard',parts.top);const pg=new T.Shape(),start=[-.1+Math.cos(2.1)*.254,Math.sin(2.1)*.254];pg.moveTo(...start);pg.absarc(-.1,0,.254,2.1,.25,true);pg.bezierCurveTo(.40,.12,.59,.34,.46,.43);pg.bezierCurveTo(.20,.49,-.18,.43,...start);pg.closePath();const guardMaterial=new T.MeshPhysicalMaterial({color:0x583b2b,roughness:.32,clearcoat:.55,clearcoatRoughness:.2}),pick=horizontalExtrude(T,pg,.002,0,guardMaterial,'thin treble side pickguard',parts.pickguard);const pp=pick.geometry.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,pp.getY(i)+dome(pp.getX(i),pp.getZ(i)));pick.geometry.computeVertexNormals();pick.position.y=P.topOuter+.002;
 parts.endpin=ellipsoid(T,[1.35,-.072,0],[.031,.018,.021],steel,'strap endpin',group,18);
 group.userData={instrument:'guitar',coordinateSystem:'X nut to tail, Y top normal, Z string spread',dimensions:'illustrative 12-fret steel-string acoustic; not CAD',scaleLength:scale,fretCount:19,bodyShell:'connected spruce / rosewood shell; open soundhole',layout:{...P},nutStringSpan:.16,saddleStringSpan:.25};
 group.userData.buildMs=performance.now()-buildStart;return {group,strings,parts};
}
