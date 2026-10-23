import {smoothOutline,shapeFromPoints,insetOutline,hollowRibs,archedPlate,violinTopY} from './surface-utils.js?v=20261024-r7';
import {mat,mesh,curveTube,cylinderBetween,ellipsoid,horizontalExtrude,outlineShape,assemblyGroup,orientedBox,addWoodGrain} from './model-utils.js?v=20261024-r7';
/** Violin: X scroll (-) to tail (+), Y soundboard normal (+), Z string spread.
 * The bow is a separately transformable group; animation is the caller's responsibility.
 * MIDI G3 D4 A4 E5 = [55,62,69,76]. Dimensions are visual assumptions, not CAD.
 */
function fHole(T,side){const s=new T.Shape();s.moveTo(-.22,-.012);s.bezierCurveTo(-.24,-.055,-.17,-.045,-.175,-.014);s.bezierCurveTo(-.16,.015,-.09,.018,-.03,-.002);s.bezierCurveTo(.06,-.04,.19,-.035,.25,.015);s.bezierCurveTo(.29,.04,.35,.015,.325,-.018);s.bezierCurveTo(.30,-.045,.275,-.025,.283,-.005);s.bezierCurveTo(.19,-.055,.07,-.06,-.04,-.02);s.bezierCurveTo(-.1,.002,-.16,0,-.19,-.022);s.closePath();return s.getPoints(64).slice(0,-1).map(p=>new T.Vector2(.46+p.x*.8,side*(.245+p.y*.7)));}
export function buildViolin(THREE,materials={}){
 const group=new THREE.Group();group.name='GOODEASY / 06 / violin';
 const wood=mat(THREE,materials.wood,'#b45d29'),dark=mat(THREE,materials.darkWood,'#49251b');
 const ivory=mat(THREE,materials.ivory,'#e8d9b4'),steel=mat(THREE,materials.steel,'#c3c8ca',.32,.53);
 const brass=mat(THREE,materials.brass,'#b69b5b',.35,.55),black=mat(THREE,materials.black,'#14100d');
 const felt=mat(THREE,materials.felt,'#6b5641');const varnish=materials.wood?wood:addWoodGrain(THREE,'#a65b30',225);
 const parts={};
 // The violin outline has upper/lower bouts, concave C-bouts and projecting corners.
 // Violin-specific upper bouts, inward C-bouts, four corner tips and larger lower bouts.
 // Smooth closed outline: arch triangulation uses its exact boundary, never grid-cell clipping.
 const contour=smoothOutline(THREE,[
  [-.78,0],[-.74,.21],[-.59,.354],[-.40,.385],[-.235,.349],[-.15,.264],
  [-.112,.313],[-.042,.242],[.062,.169],[.155,.166],[.262,.245],[.325,.316],
  [.365,.263],[.50,.389],[.70,.444],[.91,.423],[1.08,.312],[1.16,.15],[1.17,0],
  [1.16,-.15],[1.08,-.312],[.91,-.423],[.70,-.444],[.50,-.389],[.365,-.263],
  [.325,-.316],[.262,-.245],[.155,-.166],[.062,-.169],[-.042,-.242],[-.112,-.313],
  [-.15,-.264],[-.235,-.349],[-.40,-.385],[-.59,-.354],[-.74,-.21]
 ],320);
 const outline=shapeFromPoints(THREE,contour);
 parts.body=assemblyGroup(THREE,'violin body (smooth arched top / hollow ribs / back)',group);
 // Continuous wall from top edge to back. The old y=-.10 downward extrusion left a gap.
 const inner=insetOutline(THREE,contour,.025);
 const ribs=hollowRibs(THREE,contour,inner,.106,-.105,dark,parts.body,'connected hollow violin ribs');
 parts.ribs=ribs;
 const back=horizontalExtrude(THREE,outline,.022,.003,wood,'back plate',parts.body);back.position.y=-.105;
 parts.back=back;
 const top=archedPlate(THREE,contour,.106,.032,varnish,parts.body,'continuous subdivided arched soundboard',.055,[-1,1].map(side=>fHole(THREE,side)));
 parts.top=top;
 // Purfling follows violin's actual C-bout contour, not a simple oval.
 const edge=contour.map(p=>[p.x,.108,p.y]);curveTube(THREE,edge,.0045,black,'purfling edge',parts.body,260,6);
 // IMPORTANT: f-holes below are BLACK SURFACE GRAPHICS, not cut-through openings.
 // Separate mirrored f-hole shapes with upper/lower eyes and long S-curved narrow slits.
 parts.fHoles=assemblyGroup(THREE,'paired f-holes',parts.body);
 for(const side of [-1,1]){
   const z=side*.238;
   const fh=(x,zz)=>[x,violinTopY(contour,x,zz)+.003,zz];
   const hole=curveTube(THREE,[fh(-.20,z-.018*side),fh(-.10,z+.014*side),fh(.02,z-.030*side),fh(.18,z+.020*side),fh(.32,z-.014*side)],.006,black,`f-hole ${side}`,parts.fHoles,72,9);
   ellipsoid(THREE,fh(-.20,z-.018*side),[.020,.002,.020],black,'upper eye',parts.fHoles,16);
   ellipsoid(THREE,fh(.32,z-.014*side),[.021,.002,.023],black,'lower eye',parts.fHoles,16);
   // F-hole wing notches.
   curveTube(THREE,[fh(.07,z-.028*side),fh(.09,z-.055*side)],.006,black,'f-hole notch',parts.fHoles,12,6);
 }
 const darkInside=mesh(THREE,new THREE.PlaneGeometry(1.2,.8),new THREE.MeshStandardMaterial({color:0x140c08,roughness:1,side:THREE.DoubleSide}),'interior shadow plane',parts.body);darkInside.rotation.x=-Math.PI/2;darkInside.position.set(.4,-.045,0);parts.fHoles.visible=false; // Replaced by actual openings in the soundboard.
 const chinrest=assemblyGroup(THREE,'chinrest',group);parts.chinrest=chinrest;ellipsoid(THREE,[.94,.17,-.23],[.23,.033,.15],black,'chin rest',chinrest,40);for(const z of [-.15,-.29])cylinderBetween(THREE,[1.12,.12,z],[1.12,-.10,z],.009,steel,'chinrest clamp',chinrest);
 // Neck, ebony fingerboard, nut, scroll and four side-mounted pegs.
 parts.neck=assemblyGroup(THREE,'neck and fingerboard',group);
 curveTube(THREE,[[-.67,.045,0],[-.98,.065,0],[-1.37,.085,0],[-1.66,.095,0]],.063,dark,'maple neck',parts.neck,90,16);
 const finger=orientedBox(THREE,[1.05,.037,.165],[-1.06,.181,0],black,'fretless fingerboard',parts.neck,.025);
 finger.scale.z=.88;
 parts.nut=orientedBox(THREE,[.027,.030,.160],[-1.59,.208,0],ivory,'nut',parts.neck,.004);
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
 const bridgeX=.18, topAtBridge=violinTopY(contour,.18,.145), bridgeFootY=topAtBridge-.002;
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
 bridgeShape.holes.push(windowL,windowR);
 const bridgeGeo=new THREE.ExtrudeGeometry(bridgeShape,{depth:.017,steps:1,curveSegments:64,bevelEnabled:true,bevelThickness:.002,bevelSize:.001,bevelSegments:3});
 bridgeGeo.rotateY(Math.PI/2); // shape u -> -Z, v -> Y, extrusion -> X
 bridgeGeo.translate(bridgeX-.0085,0,0);
 const bridge=mesh(THREE,bridgeGeo,ivory,'vertical carved bridge YZ profile',parts.bridge);
 parts.bridgePlate=bridge;
 for(const side of [-1,1]){
   ellipsoid(THREE,[bridgeX,topAtBridge,side*.145],[.034,.005,.028],ivory,`bridge foot ${side}`,parts.bridge,20);
 }
 // The crest contact heights are individually arched, rather than a single flat saddle.
 const bridgeZ=[-.1095,-.0365,.0365,.1095];
 const bridgeY=[.256,.273,.273,.256];
 parts.bridgeCrest=curveTube(THREE,bridgeZ.map((z,i)=>[bridgeX,bridgeY[i],z]),.003,ivory,'arched string-bearing bridge crown',parts.bridge,60,8);
 parts.tailpiece=assemblyGroup(THREE,'tailpiece and fine tuners',group);
 const tailShape=outlineShape(THREE,[[.60,-.14],[.95,-.10],[1.02,-.04],[1.02,.04],[.95,.10],[.60,.14]]);
 const tail=horizontalExtrude(THREE,tailShape,.028,.007,black,'tapered ebony tailpiece',parts.tailpiece);tail.position.y=.16;
 curveTube(THREE,[[.96,.174,0],[1.10,.10,0],[1.16,.03,0]],.013,black,'tailgut',parts.tailpiece,35,10);
 const strings=[],midi=[55,62,69,76],names=['G3','D4','A4','E5'];
 parts.afterlength=assemblyGroup(THREE,'separate bridge-to-tailpiece string afterlength',group);
 for(let i=0;i<4;i++){
   const z=(i-1.5)*.073;
   const nut=[-1.59,.232,z*.88];
   const crest=[bridgeX,bridgeY[i],bridgeZ[i]];
   const tail=[.77,.198,z*1.05];
   const rad=[.0035,.0029,.0021,.00155][i];
   const speaking=cylinderBetween(THREE,nut,crest,rad,steel,`speaking string ${names[i]} MIDI ${midi[i]}`,group,12);
   const after=cylinderBetween(THREE,crest,tail,rad,steel,`afterlength ${names[i]}`,parts.afterlength,12);
   strings.push({midi:midi[i],from:nut,to:crest,mesh:speaking,afterlengthMesh:after,tailEndpoint:tail});
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
 group.userData={instrument:'violin',coordinateSystem:'X along scroll-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',bowMovementAxis:'Z',bowDefaultPosition:[0,0,0],fHoles:'cut-through top openings; silhouette approximation, NOT CAD',arch:'earcut outline triangulation + adaptive subdivision; not physical plate scan',bridgeOrientation:'upright YZ',speakingLength:'nut to bridge crown'};
 return {group,strings,bow,parts};
}
