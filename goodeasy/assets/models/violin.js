import {plateGeometry,neckGeometry,guitarWood,woodUV,edgeDistance} from './guitar-craft.js?v=20261027-craft5';
import {smoothOutline,shapeFromPoints,insetOutline,hollowRibs,archedPlate,violinTopY} from './surface-utils.js?v=20261024-editorial1';
import {mat,mesh,curveTube,cylinderBetween,ellipsoid,horizontalExtrude,outlineShape,assemblyGroup,orientedBox,addWoodGrain} from './model-utils.js?v=20261024-editorial1';
/** Violin: X scroll (-) to tail (+), Y soundboard normal (+), Z string spread.
 * The bow is a separately transformable group; animation is the caller's responsibility.
 * MIDI G3 D4 A4 E5 = [55,62,69,76]. Dimensions are visual assumptions, not CAD.
 */
function fHole(T,side){const s=new T.Shape();s.moveTo(-.22,-.012);s.bezierCurveTo(-.24,-.055,-.17,-.045,-.175,-.014);s.bezierCurveTo(-.16,.015,-.09,.018,-.03,-.002);s.bezierCurveTo(.06,-.04,.19,-.035,.25,.015);s.bezierCurveTo(.29,.04,.35,.015,.325,-.018);s.bezierCurveTo(.30,-.045,.275,-.025,.283,-.005);s.bezierCurveTo(.19,-.055,.07,-.06,-.04,-.02);s.bezierCurveTo(-.1,.002,-.16,0,-.19,-.022);s.closePath();return s.getPoints(64).slice(0,-1).map(p=>new T.Vector2(.18+p.x*.8,side*(.210+p.y*.7)));}
const violinGeometry=new Map(),plateFits=new Map();
let archContour=[];
export const violinDome=(x,z)=>{const d=archContour.length?Math.min(1,edgeDistance(x,z,archContour)/.065):1,fade=d*d*(3-2*d);return .032*Math.max(0,1-((x-.19)/1.12)**2-(z/.44)**2)*fade;};
export const violinTopInsideY=(x,z)=>.092+violinDome(x,z);
export const violinBackInsideY=(x,z)=>-.105-violinDome(x,z)*.7;
const boardWidth=x=>.218+(Math.max(-1.59,Math.min(-.535,x))+1.59)/1.055*.105;
export const violinBoardY=(x,z)=>.226+(x+1.59)/1.055*.021-.010*(2*z/.218)**2;
function fingerboardGeometry(T){
 const pos=[],idx=[],rows=32,cols=16,stride=cols+1;
 for(let layer=0;layer<2;layer++)for(let i=0;i<=rows;i++){const x=-1.59+i/rows*1.055,w=boardWidth(x);for(let j=0;j<=cols;j++){const z=(j/cols-.5)*w;pos.push(x,violinBoardY(x,z)-layer*.030,z);}}
 const N=(rows+1)*stride;for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*stride+j,b=a+1,c=a+stride,d=c+1;idx.push(a,c,b,b,c,d,N+a,N+b,N+c,N+b,N+d,N+c);}
 for(let i=0;i<rows;i++)for(const j of [0,cols]){const a=i*stride+j,b=a+stride;j===0?idx.push(a,N+a,b,b,N+a,N+b):idx.push(a,b,N+a,b,N+b,N+a);}
 for(const row of [0,rows])for(let j=0;j<cols;j++){const a=row*stride+j,b=a+1;row===0?idx.push(a,b,N+a,b,N+b,N+a):idx.push(a,N+a,b,b,N+a,N+b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);woodUV(g);g.computeVertexNormals();return g;
}
export function buildViolin(THREE,materials={}){
 const group=new THREE.Group();group.name='GOODEASY / violin';group.scale.z=-1;
 const wood=mat(THREE,materials.wood,'#b45d29'),dark=mat(THREE,materials.darkWood,'#49251b');
 const ivory=mat(THREE,materials.ivory,'#e8d9b4'),steel=mat(THREE,materials.steel,'#c3c8ca',.32,.53);
 const brass=mat(THREE,materials.brass,'#b69b5b',.35,.55),black=mat(THREE,materials.black,'#14100d');
 const felt=mat(THREE,materials.felt,'#6b5641');const varnish=guitarWood(THREE,'spruce');varnish.color.setHex(0xffc291);const ebony=guitarWood(THREE,'ebony');const braceWood=guitarWood(THREE,'brace');
 const parts={};
 // The violin outline has upper/lower bouts, concave C-bouts and projecting corners.
 // Violin-specific upper bouts, inward C-bouts, four corner tips and larger lower bouts.
 // Smooth closed outline: arch triangulation uses its exact boundary, never grid-cell clipping.
 const contour=smoothOutline(THREE,[
  [-.78,0],[-.74,.21],[-.59,.354],[-.40,.385],[-.235,.349],[-.15,.264],
  [-.112,.313],[-.042,.242],[.062,.240],[.155,.245],[.262,.245],[.325,.316],
  [.365,.263],[.50,.389],[.70,.444],[.91,.423],[1.08,.312],[1.16,.15],[1.17,0],
  [1.16,-.15],[1.08,-.312],[.91,-.423],[.70,-.444],[.50,-.389],[.365,-.263],
  [.325,-.316],[.262,-.245],[.155,-.245],[.062,-.240],[-.042,-.242],[-.112,-.313],
  [-.15,-.264],[-.235,-.349],[-.40,-.385],[-.59,-.354],[-.74,-.21]
 ],320);
 archContour=contour;
 const outline=shapeFromPoints(THREE,contour);
 parts.body=assemblyGroup(THREE,'violin body (smooth arched top / hollow ribs / back)',group);
 // Continuous wall from top edge to back. The old y=-.10 downward extrusion left a gap.
 const inner=insetOutline(THREE,contour,.025);
 const ribs=hollowRibs(THREE,contour,inner,.106,-.105,dark,parts.body,'connected hollow violin ribs');
 parts.ribs=ribs;
 if(!violinGeometry.has('back'))violinGeometry.set('back',plateGeometry(THREE,contour,[],-.121,-.105,(x,z)=>-violinDome(x,z)*.7));
 const back=mesh(THREE,violinGeometry.get('back'),wood,'closed arched maple back',parts.body);
 parts.back=back;
 if(!violinGeometry.has('top'))violinGeometry.set('top',plateGeometry(THREE,contour,[-1,1].map(side=>fHole(THREE,side)),.106,.092,violinDome));
 const top=mesh(THREE,violinGeometry.get('top'),varnish,'closed arched spruce soundboard with real f openings',parts.body);
 parts.top=top;
 // Inlaid edge follows the actual curved plate and stays attached when opened.
 const edge=insetOutline(THREE,contour,.012).map(p=>[p.x,.107+violinDome(p.x,p.y),p.y]);
 parts.purfling=curveTube(THREE,edge,.003,black,'inlaid double purfling',top,260,6);
 parts.fHoles=assemblyGroup(THREE,'f openings are cut through soundboard',top);
 // Sample the actual triangulated plates for fitted contact surfaces.
 group.updateMatrixWorld(true);const fitRay=new THREE.Raycaster(),fitOrigin=new THREE.Vector3(),fitDirection=new THREE.Vector3(0,-1,0).transformDirection(group.matrixWorld);
 function plateY(plate,x,z,inside=false){const key=(plate===top?"top":"back")+":"+x.toFixed(7)+":"+z.toFixed(7)+":"+inside;if(plateFits.has(key))return plateFits.get(key);fitOrigin.set(x,2,z).applyMatrix4(group.matrixWorld);fitRay.set(fitOrigin,fitDirection);const hits=fitRay.intersectObject(plate,false).map(h=>group.worldToLocal(h.point.clone()).y);if(!hits.length)return plate===top?violinTopInsideY(x,z):violinBackInsideY(x,z);const value=(plate===top)===inside?Math.min(...hits):Math.max(...hits);plateFits.set(key,value);return value;}

 parts.bracing=assemblyGroup(THREE,'fitted bassbar',top);
 const barProfile=new THREE.Shape();barProfile.moveTo(-.49,0);for(let i=1;i<=48;i++)barProfile.lineTo(-.49+1.31*i/48,0);barProfile.lineTo(.82,-.021);barProfile.quadraticCurveTo(.22,-.073,-.49,-.021);barProfile.closePath();
 const barGeo=new THREE.ExtrudeGeometry(barProfile,{depth:.040,bevelEnabled:false,curveSegments:24});const bp=barGeo.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getZ(i)-.165;bp.setXYZ(i,x,plateY(top,x,z,true)+bp.getY(i),z);}barGeo.computeVertexNormals();woodUV(barGeo);
 parts.bassbar=mesh(THREE,barGeo,braceWood,'bassbar fitted to inside spruce plate',parts.bracing);
 const postX=.25,postZ=.145,postBottom=plateY(back,postX,postZ,true),postTop=plateY(top,postX,postZ,true);parts.post=assemblyGroup(THREE,'fitted soundpost',group);cylinderBetween(THREE,[postX,postBottom,postZ],[postX,postTop,postZ],.019,braceWood,'soundpost touching both inner plates',parts.post);
 const postMesh=parts.post.children[0],pp=postMesh.geometry.attributes.position;for(let i=0;i<pp.count;i++){const x=postX+pp.getX(i),z=postZ+pp.getZ(i),target=plateY(pp.getY(i)>0?top:back,x,z,true);pp.setY(i,target-postMesh.position.y);}pp.needsUpdate=true;postMesh.geometry.computeVertexNormals();
 parts.post.userData.ends=[[postX,postBottom,postZ],[postX,postTop,postZ]];
 const chinrest=assemblyGroup(THREE,'chinrest',group);parts.chinrest=chinrest;ellipsoid(THREE,[.94,.17,-.23],[.23,.033,.15],black,'chin rest',chinrest,40);for(const z of [-.15,-.29])cylinderBetween(THREE,[1.12,.12,z],[1.12,-.10,z],.009,steel,'chinrest clamp',chinrest);
 // Neck, ebony fingerboard, nut, scroll and four side-mounted pegs.
 parts.neck=assemblyGroup(THREE,'neck and fingerboard',group);
 if(!violinGeometry.has('neck')){const g=neckGeometry(THREE,-1.66,-.65,x=>boardWidth(x)+.014,.188,t=>.085+t*.028),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i);a.setY(i,a.getY(i)+Math.max(0,(x+1.59)/1.055)*.021);}g.computeVertexNormals();violinGeometry.set('neck',g);}
 mesh(THREE,violinGeometry.get('neck'),wood,'fitted D profile maple neck',parts.neck);
 if(!violinGeometry.has('board'))violinGeometry.set('board',fingerboardGeometry(THREE));
 const finger=mesh(THREE,violinGeometry.get('board'),ebony,'arched tapered fretless fingerboard',parts.neck);parts.fingerboard=finger;
 const nutTop=z=>violinBoardY(-1.59,z)+.003;
 const nutProfile=new THREE.Shape();nutProfile.moveTo(-.111,.193);nutProfile.lineTo(-.111,nutTop(.111));for(let i=1;i<=32;i++){const z=-.111+.222*i/32;nutProfile.lineTo(z,nutTop(-z));}nutProfile.lineTo(.111,.193);nutProfile.closePath();const nutGeometry=new THREE.ExtrudeGeometry(nutProfile,{depth:.027,bevelEnabled:false});nutGeometry.rotateY(Math.PI/2);nutGeometry.translate(-1.59-.0135,0,0);parts.nut=mesh(THREE,nutGeometry,ivory,'arched nut supporting four strings',parts.neck);
 parts.scroll=assemblyGroup(THREE,'pegbox and carved scroll',group);
 const pegbox=orientedBox(THREE,[.42,.094,.137],[-1.80,.115,0],dark,'pegbox',parts.scroll,.018);
 for(let side of [-1,1])for(let i=0;i<2;i++){
   const x=-1.72-i*.20,z=side*.13;
   cylinderBetween(THREE,[x,.13,0],[x,.13,z],.018,dark,`peg ${side}/${i}`,parts.scroll);
   ellipsoid(THREE,[x,.13,side*.175],[.042,.020,.020],black,'peg grip',parts.scroll,16);
 }
 // Volute scroll: coiled wooden tube (explicit geometry), positioned at the instrument tip.
 for(const side of [-1,1]){
   const coil=[];for(let i=0;i<=150;i++){
     const t=i/150,theta=t*Math.PI*3.65,r=.092*(1-t)+.014;
     coil.push([-2.13+Math.cos(theta)*r,.155+Math.sin(theta)*r,side*.044]);
   }curveTube(THREE,coil,.021,wood,`carved scroll volute ${side}`,parts.scroll,180,10);
 }
 // Upright bridge: profile is drawn in the YZ plane (shape x -> model Z,
 // shape y -> model Y); extruded thickness is along model X.
 // Soundboard near bridge x=.18: .106 + .032*(1-(.18-.19)^2/1.15^2) ~= .138.
 parts.bridge=assemblyGroup(THREE,'upright violin bridge with feet and windows',group);
 const bridgeX=.18, topAtBridge=plateY(top,.18,.145), bridgeFootY=topAtBridge;
 const bridgeShape=new THREE.Shape();
 // local u maps to -model Z; local v maps to model Y (absolute coordinates).
 bridgeShape.moveTo(-.166,bridgeFootY);
 bridgeShape.lineTo(-.166,.165);
 bridgeShape.bezierCurveTo(-.155,.217,-.125,.252,-.1095,.256);
 bridgeShape.bezierCurveTo(-.063,.271,-.027,.275,0,.276);
 bridgeShape.bezierCurveTo(.027,.275,.063,.271,.1095,.256);
 bridgeShape.bezierCurveTo(.125,.252,.155,.217,.166,.165);
 bridgeShape.lineTo(.166,bridgeFootY);
 // Two separate feet; open central arch leaves a visible gap above the top.
 bridgeShape.lineTo(.115,bridgeFootY);
 bridgeShape.quadraticCurveTo(.090,.180,.058,.184);
 bridgeShape.quadraticCurveTo(0,.195,-.058,.184);
 bridgeShape.quadraticCurveTo(-.090,.180,-.115,bridgeFootY);
 bridgeShape.closePath();
 const windowL=new THREE.Path();windowL.absellipse(-.085,.212,.018,.014,0,Math.PI*2,true);
 const windowR=new THREE.Path();windowR.absellipse(.085,.212,.018,.014,0,Math.PI*2,true);
 const heart=new THREE.Path();heart.absellipse(0,.245,.023,.014,0,Math.PI*2,true);bridgeShape.holes.push(windowL,windowR,heart);
 const bridgeGeo=new THREE.ExtrudeGeometry(bridgeShape,{depth:.017,steps:1,curveSegments:64,bevelEnabled:true,bevelThickness:.002,bevelSize:.001,bevelSegments:3});
 bridgeGeo.rotateY(Math.PI/2); // shape u -> -Z, v -> Y, extrusion -> X
 bridgeGeo.translate(bridgeX-.0085,0,0);
 const bridge=mesh(THREE,bridgeGeo,ivory,'vertical carved bridge YZ profile',parts.bridge);
 parts.bridgePlate=bridge;
 for(const side of [-1,1]){
   const foot=mesh(THREE,new THREE.BoxGeometry(.048,.010,.044),ivory,`bridge foot ${side}`,parts.bridge),fp=foot.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=bridgeX+fp.getX(i),z=side*.145+fp.getZ(i),lower=plateY(top,x,z);fp.setXYZ(i,x,lower+(fp.getY(i)>0?.009:0),z);}foot.geometry.computeVertexNormals();
 }
 // The crest contact heights are individually arched, rather than a single flat saddle.
 const bridgeZ=[-.1095,-.0365,.0365,.1095];
 const bridgeY=[.256,.273,.273,.256];
 parts.bridgeCrest=curveTube(THREE,bridgeZ.map((z,i)=>[bridgeX,bridgeY[i],z]),.003,ivory,'arched string-bearing bridge crown',parts.bridge,60,8);
 parts.tailpiece=assemblyGroup(THREE,'tailpiece and fine tuners',group);
 const tailShape=outlineShape(THREE,[[.60,-.14],[.95,-.10],[1.02,-.04],[1.02,.04],[.95,.10],[.60,.14]]);
 const tail=horizontalExtrude(THREE,tailShape,.028,.007,black,'tapered ebony tailpiece',parts.tailpiece);tail.position.y=.16;
 curveTube(THREE,[[.96,.174,0],[1.10,.10,0],[1.16,.03,0]],.013,black,'tailgut',parts.tailpiece,35,10);
 group.updateMatrixWorld(true);
 const crestSupport=bridgeZ.map((z,i)=>{fitOrigin.set(bridgeX,2,z).applyMatrix4(group.matrixWorld);fitRay.set(fitOrigin,fitDirection);const hits=fitRay.intersectObjects([bridge,parts.bridgeCrest],false);return hits.length?Math.max(...hits.map(h=>group.worldToLocal(h.point.clone()).y)):bridgeY[i]+.003;});
 const strings=[],midi=[55,62,69,76],names=['G3','D4','A4','E5'];
 parts.afterlength=assemblyGroup(THREE,'separate bridge-to-tailpiece string afterlength',group);
 for(let i=0;i<4;i++){
   const z=(i-1.5)*.073,radFor=i=>[.0035,.0029,.0021,.00155][i];
   const nut=[-1.59,nutTop(z*.88)+radFor(i),z*.88];
   const crest=[bridgeX,crestSupport[i]+radFor(i),bridgeZ[i]];
   const tail=[.77,.198,z*1.05];
   const rad=[.0035,.0029,.0021,.00155][i];
   const speaking=cylinderBetween(THREE,nut,crest,rad,steel,`speaking string ${names[i]} MIDI ${midi[i]}`,group,12);
   const after=cylinderBetween(THREE,crest,tail,rad,steel,`afterlength ${names[i]}`,parts.afterlength,12);
   strings.push({midi:midi[i],from:nut,to:crest,radius:rad,mesh:speaking,afterlengthMesh:after,tailEndpoint:tail});
   ellipsoid(THREE,[.75,.204,z*1.05],[.019,.013,.017],brass,`fine tuner ${i+1}`,parts.tailpiece,14);
   const side=i<2?-1:1,j=i%2;
   curveTube(THREE,[nut,[-1.69,.216,z*.85],[-1.72-j*.20,.145,side*.13]],rad*.75,steel,`pegbox wire ${i+1}`,group,32,7);
 }
 // Bow: independently movable. Hair contacts selected open A4 string (index 2)
 // at x=.03, z interpolated from the ACTUAL nut-to-crest segment.
 // Moving the whole bow along Z creates transverse bow travel; caller must clamp travel
 // and update contact/string selection as needed. This is a geometric interaction cue.
 const selectedStringIndex=2, selected=strings[selectedStringIndex];
 const contactX=.03, t=(contactX-selected.from[0])/(selected.to[0]-selected.from[0]);
 const contactY=selected.from[1]+t*(selected.to[1]-selected.from[1]);
 const contactZ=selected.from[2]+t*(selected.to[2]-selected.from[2]);
 const bow=assemblyGroup(THREE,'movable bow (translate along Z)',group);parts.bow=bow;
 // All hair coordinates are in bow-local coordinates. Bow starts aligned with the
 // selected string, and its central hair strand crosses its string centerline.
 const hairY=contactY+.0014;
 parts.bowHair=assemblyGroup(THREE,'separate bow hair ribbon',bow);
 for(let k=0;k<11;k++){
   const x=contactX+(k-5)*.0025;
   curveTube(THREE,[[x,hairY,-.67],[x,hairY,-.22],[x,hairY,.22],[x,hairY,.67]],.0014,ivory,`bow hair ${k+1}`,parts.bowHair,64,5);
 }
 curveTube(THREE,[[contactX+.035,hairY+.042,-.78],[contactX+.04,hairY+.068,-.4],[contactX+.046,hairY+.077,0],[contactX+.04,hairY+.064,.42],[contactX+.035,hairY+.044,.78]],.015,dark,'cambered bow stick',bow,100,12);
 orientedBox(THREE,[.068,.062,.115],[contactX+.035,hairY+.037,-.67],black,'frog',bow,.012);
 ellipsoid(THREE,[contactX+.035,hairY+.047,-.67],[.018,.012,.018],brass,'frog eye',bow,14);
 cylinderBetween(THREE,[contactX+.035,hairY+.045,-.82],[contactX+.035,hairY+.045,-.74],.012,brass,'bow adjuster',bow);
 bow.userData={selectedStringIndex,contactLocal:[contactX,contactY,contactZ],movementAxis:'Z',
   // Moving in Z changes which portion of hair contacts the string. Audio gating is external.
   hairCenterlineY:hairY,contactTolerance:.006};
 group.userData={instrument:'violin',coordinateSystem:'X along scroll-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',bowMovementAxis:'Z',bowDefaultPosition:[0,0,0],fHoles:'cut-through top openings; silhouette approximation, NOT CAD',arch:'earcut outline triangulation + adaptive subdivision; not physical plate scan',handedness:'right handed',bridgeOrientation:'upright YZ',speakingLength:'nut to bridge crown'};
 return {group,strings,bow,parts};
}
