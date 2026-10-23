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
   indices.push(a,b,a+1,b,b+1,a+1);
 }
 const archGeo=new THREE.BufferGeometry();archGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));archGeo.setIndex(indices);archGeo.computeVertexNormals();
 mesh(THREE,archGeo,varnish,'arched soundboard surface',parts.body);
 // Purfling follows violin's actual C-bout contour, not a simple oval.
 const edge=outline.getPoints(220).map(p=>[p.x,.126,p.y]);curveTube(THREE,edge,.0045,black,'purfling edge',parts.body,260,6);
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
 // Carved bridge: feet + shaped arch + two open windows, NOT a rectangular block.
 parts.bridge=assemblyGroup(THREE,'violin bridge with cutouts',group);
 const bs=new THREE.Shape();bs.moveTo(-.040,-.166);bs.lineTo(-.040,.166);
 bs.quadraticCurveTo(-.015,.182,.018,.167);bs.quadraticCurveTo(.076,.13,.087,0);
 bs.quadraticCurveTo(.076,-.13,.018,-.167);bs.quadraticCurveTo(-.015,-.182,-.040,-.166);bs.closePath();
 const win1=new THREE.Path();win1.absellipse(.018,-.078,.027,.033,0,Math.PI*2,true);
 const win2=new THREE.Path();win2.absellipse(.018,.078,.027,.033,0,Math.PI*2,true);
 bs.holes.push(win1,win2);
 const bridge=horizontalExtrude(THREE,bs,.016,.005,ivory,'carved bridge with two open windows',parts.bridge);
 // Shape source Y is string Z; mesh sits at X=.15, its x axis spans the bridge depth.
 bridge.rotation.y=Math.PI/2;bridge.position.set(.18,.173,0);
 // Dedicated saddle crest; string contact points are on this crest.
 curveTube(THREE,[[.18,.253,-.137],[.18,.269,-.05],[.18,.274,0],[.18,.269,.05],[.18,.253,.137]],.007,ivory,'arched bridge crown',parts.bridge,50,8);
 for(const side of [-1,1])ellipsoid(THREE,[.18,.164,side*.145],[.065,.013,.032],ivory,'bridge foot',parts.bridge,16);
 parts.tailpiece=assemblyGroup(THREE,'tailpiece and fine tuners',group);
 const tailShape=outlineShape(THREE,[[.60,-.14],[.95,-.10],[1.02,-.04],[1.02,.04],[.95,.10],[.60,.14]]);
 const tail=horizontalExtrude(THREE,tailShape,.028,.007,black,'tapered ebony tailpiece',parts.tailpiece);tail.position.y=.16;
 curveTube(THREE,[[.96,.174,0],[1.10,.10,0],[1.16,.03,0]],.013,black,'tailgut',parts.tailpiece,35,10);
 const strings=[],midi=[55,62,69,76],names=['G3','D4','A4','E5'];
 for(let i=0;i<4;i++){
   const z=(i-1.5)*.073;
   const a=[-1.59,.232,z*.88],b=[.77,.198,z*1.05];
   const rad=[.0035,.0029,.0021,.00155][i];
   const string=cylinderBetween(THREE,a,b,rad,steel,`string ${names[i]} MIDI ${midi[i]}`,group,10);
   strings.push({midi:midi[i],from:a,to:b,mesh:string});
   ellipsoid(THREE,[.75,.204,z*1.05],[.019,.013,.017],brass,`fine tuner ${i+1}`,parts.tailpiece,14);
   const side=i<2?-1:1,j=i%2;
   curveTube(THREE,[a,[-1.69,.216,z*.85],[-1.72-j*.20,.145,side*.13]],rad*.75,steel,`pegbox wire ${i+1}`,group,32,7);
 }
 // Bow is independently movable and has a separate hair ribbon and frog.
 const bow=assemblyGroup(THREE,'movable bow',group);parts.bow=bow;
 // Bow lies across the strings near bridge, along Z. The user moves it along Z.
 const bowWood=dark;
 curveTube(THREE,[[.03,.35,-.83],[.045,.40,-.46],[.058,.42,0],[.045,.40,.48],[.02,.36,.83]],.018,bowWood,'arched bow stick',bow,110,12);
 // Hair ribbon: multiple parallel hair strands, separate for show/hide and friction visualization.
 parts.bowHair=assemblyGroup(THREE,'bow hair ribbon',bow);
 for(let k=0;k<11;k++){
   const x=-.015+k*.0035;
   curveTube(THREE,[[x,.316,-.73],[x,.314,-.25],[x,.315,.28],[x,.317,.74]],.0017,ivory,`bow hair strand ${k+1}`,parts.bowHair,56,5);
 }
 const frog=orientedBox(THREE,[.080,.083,.14],[.035,.353,-.71],black,'ebony frog',bow,.014);
 ellipsoid(THREE,[.035,.37,-.71],[.020,.015,.020],brass,'frog eye',bow,12);
 cylinderBetween(THREE,[.03,.356,-.85],[.03,.356,-.76],.013,brass,'bow adjuster',bow);
 // Deliberately no auto bow animation; caller drives bow.position and audio gating.
 group.userData={instrument:'violin',coordinateSystem:'X along scroll-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',bowMovementAxis:'Z',bowDefaultPosition:[0,0,0]};
 return {group,strings,bow,parts};
}
