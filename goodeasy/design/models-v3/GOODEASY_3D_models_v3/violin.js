import {mat,mesh,curveTube,cylinderBetween,ellipsoid,horizontalExtrude,outlineShape,assemblyGroup,orientedBox,addWoodGrain} from './model-utils.js';
/** Violin: X scroll (-) to tail (+), Y soundboard normal (+), Z string spread.
 * The bow is a separately transformable group; animation is the caller's responsibility.
 * MIDI G3 D4 A4 E5 = [55,62,69,76]. Dimensions are visual assumptions, not CAD.
 */
export function buildViolin(THREE,materials={}){
 const group=new THREE.Group();group.name='GOODEASY / 06 / violin';
 const wood=mat(THREE,materials.wood,'#b45d29'),dark=mat(THREE,materials.darkWood,'#49251b');
 const ivory=mat(THREE,materials.ivory,'#e8d9b4'),steel=mat(THREE,materials.steel,'#c3c8ca',.32,.53);
 const brass=mat(THREE,materials.brass,'#b69b5b',.35,.55),black=mat(THREE,materials.black,'#14100d');
 const felt=mat(THREE,materials.felt,'#6b5641');const varnish=materials.wood?wood:addWoodGrain(THREE,'#a65b30',225);
 const parts={};
 // The violin outline has upper/lower bouts, concave C-bouts and projecting corners.
 const outline=new THREE.Shape();outline.moveTo(-.78,0);
 outline.bezierCurveTo(-.79,.20,-.61,.39,-.40,.405);
 outline.bezierCurveTo(-.22,.42,-.16,.34,-.16,.265);
 outline.lineTo(-.10,.32); // upper corner
 outline.bezierCurveTo(.02,.27,-.02,.17,.12,.17);
 outline.bezierCurveTo(.22,.17,.27,.26,.32,.32);
 outline.lineTo(.38,.27); // lower corner
 outline.bezierCurveTo(.47,.41,.66,.47,.84,.45);
 outline.bezierCurveTo(1.12,.42,1.19,.19,1.17,0);
 outline.bezierCurveTo(1.19,-.19,1.12,-.42,.84,-.45);
 outline.bezierCurveTo(.66,-.47,.47,-.41,.38,-.27);
 outline.lineTo(.32,-.32);
 outline.bezierCurveTo(.27,-.26,.22,-.17,.12,-.17);
 outline.bezierCurveTo(-.02,-.17,.02,-.27,-.10,-.32);
 outline.lineTo(-.16,-.265);
 outline.bezierCurveTo(-.16,-.34,-.22,-.42,-.40,-.405);
 outline.bezierCurveTo(-.61,-.39,-.79,-.20,-.78,0);outline.closePath();
 parts.body=assemblyGroup(THREE,'violin body (arched top / ribs / back)',group);
 const ribs=horizontalExtrude(THREE,outline,.125,.014,dark,'shaped ribs',parts.body);ribs.position.y=-.10;
 const back=horizontalExtrude(THREE,outline,.025,.012,wood,'arched back approximation',parts.body);back.position.y=-.105;
 const top=horizontalExtrude(THREE,outline,.024,.016,varnish,'arched top base',parts.body);top.position.y=.072;
 // A low-relief crown gives a visible longitudinal arch without making a spherical/oval body.
 // Parametric patch clipped to outline using ray casting against THREE.ShapeUtils polygon.
 const polygon=outline.getPoints(240);const verts=[],indices=[],nx=76,nz=44;
 function inside(x,z){let c=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const a=polygon[i],b=polygon[j];if(((a.y>z)!==(b.y>z))&&(x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x))c=!c;
 }return c}
 for(let ix=0;ix<=nx;ix++)for(let iz=0;iz<=nz;iz++){
   const x=-.79+1.97*ix/nx,z=-.48+.96*iz/nz;
   const arch=.032*Math.max(0,1-Math.pow((x-.19)/1.15,2))*Math.max(0,1-Math.pow(z/.48,2));
   verts.push(x,.106+arch,z);
 }
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
   const cx=-.79+1.97*(ix+.5)/nx,cz=-.48+.96*(iz+.5)/nz;
   if(!inside(cx,cz))continue;
   const a=ix*(nz+1)+iz,b=(ix+1)*(nz+1)+iz;
   indices.push(a,a+1,b,b,a+1,b+1); // +Y facing winding in XZ parameterization
 }
 const archGeo=new THREE.BufferGeometry();archGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));archGeo.setIndex(indices);archGeo.computeVertexNormals();
 mesh(THREE,archGeo,varnish,'arched soundboard surface',parts.body);
 // Purfling follows violin's actual C-bout contour, not a simple oval.
 const edge=outline.getPoints(220).map(p=>[p.x,.126,p.y]);curveTube(THREE,edge,.0045,black,'purfling edge',parts.body,260,6);
 // IMPORTANT: f-holes below are BLACK SURFACE GRAPHICS, not cut-through openings.
 // Separate mirrored f-hole shapes with upper/lower eyes and long S-curved narrow slits.
 parts.fHoles=assemblyGroup(THREE,'paired f-holes',parts.body);
 for(const side of [-1,1]){
   const z=side*.238;
   const hole=curveTube(THREE,[[-.20,.140,z-.018*side],[-.10,.143,z+.014*side],[.02,.146,z-.030*side],[.18,.148,z+.020*side],[.32,.143,z-.014*side]],.0105,black,`f-hole ${side}`,parts.fHoles,72,9);
   ellipsoid(THREE,[-.20,.143,z-.018*side],[.020,.002,.020],black,'upper eye',parts.fHoles,16);
   ellipsoid(THREE,[.32,.145,z-.014*side],[.021,.002,.023],black,'lower eye',parts.fHoles,16);
   // F-hole wing notches.
   curveTube(THREE,[[.07,.151,z-.028*side],[.09,.151,z-.055*side]],.006,black,'f-hole notch',parts.fHoles,12,6);
 }
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
 const bridgeX=.18, topAtBridge=.138, bridgeFootY=.136;
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
 group.userData={instrument:'violin',coordinateSystem:'X along scroll-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',bowMovementAxis:'Z',bowDefaultPosition:[0,0,0],fHoles:'surface graphic approximation, NOT perforations',bridgeOrientation:'upright YZ',speakingLength:'nut to bridge crown'};
 return {group,strings,bow,parts};
}
