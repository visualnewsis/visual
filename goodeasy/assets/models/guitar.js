import {smoothOutline,shapeFromPoints,insetOutline,hollowRibs} from './surface-utils.js?v=20261024-r7';
import {mat,mesh,curveTube,cylinderBetween,ellipsoid,outlineShape,horizontalExtrude,ellipseRing,addWoodGrain,assemblyGroup,orientedBox} from './model-utils.js?v=20261024-r7';
/**
 * Six-string steel acoustic guitar, model X axis nut -> tail; Y is top normal; Z string spread.
 * Returns model-local string endpoints (world endpoints only if group has identity transform).
 * MIDI low to high: E2 A2 D3 G3 B3 E4 = [40,45,50,55,59,64].
 */
export function buildGuitar(THREE,materials={}){
 const group=new THREE.Group();group.name='GOODEASY / 02 / acoustic guitar';
 const wood=mat(THREE,materials.wood,'#ad6835'),dark=mat(THREE,materials.darkWood,'#3a2118');
 const ivory=mat(THREE,materials.ivory,'#f1dec0'),steel=mat(THREE,materials.steel,'#bbc2c5',.3,.55);
 const brass=mat(THREE,materials.brass,'#ba8b46',.3,.62),black=mat(THREE,materials.black,'#141211');
 const felt=mat(THREE,materials.felt,'#704b37');
 const grain=materials.wood?wood:addWoodGrain(THREE,'#ae764a',65);
 const parts={};
 // Upper bout, pinched waist, generous lower bout. Shape XY maps to XZ.
 // Body: neck joint x=-.88, tail x=1.04. Outline sampled from cubic Bezier segments.
 // Smooth, asymmetrically proportioned dreadnought-inspired body, not a circular/oval proxy.
 // Half widths are independently controlled: lower bout 0.63, waist 0.365, upper bout 0.48.
 const controls=[[-.92,0],[-.86,.285],[-.69,.438],[-.46,.485],[-.24,.455],[-.075,.365],[.085,.363],[.24,.455],[.43,.575],[.65,.632],[.86,.582],[1.02,.408],[1.085,.20],[1.095,0],[1.085,-.20],[1.02,-.408],[.86,-.582],[.65,-.632],[.43,-.575],[.24,-.455],[.085,-.363],[-.075,-.365],[-.24,-.455],[-.46,-.485],[-.69,-.438],[-.86,-.285]];
 const outline=smoothOutline(THREE,controls,320);
 const s=shapeFromPoints(THREE,outline);
 // Real through soundhole in soundboard, NOT black disc on opaque top.
 const soundhole=new THREE.Path();soundhole.absellipse(-.10,0,.205,.205,0,Math.PI*2,true);
 const topShape=s.clone();topShape.holes.push(soundhole);
 parts.body=assemblyGroup(THREE,'guitar body (top / side / back)',group);
 // Closed hollow shell: the rib is an OUTER MINUS INNER outline ring.
 // horizontalExtrude maps positive depth toward -Y. Top underside=.085, back upper=-.115.
 // Inset contour is a visualization-only radial offset, not an acoustic plate thickness survey.
 const innerPts=insetOutline(THREE,outline,.033);
 const side=hollowRibs(THREE,outline,innerPts,.085,-.115,dark,parts.body,'connected hollow side / ribs');
 const back=horizontalExtrude(THREE,s,.015,0,wood,'back plate',parts.body);back.position.y=-.115;
 const top=horizontalExtrude(THREE,topShape,.016,0,grain,'spruce soundboard with cutout',parts.body);top.position.y=.101;
 parts.ribs=side;parts.top=top;parts.back=back;
 // Rim spans y=.085 to -.115, top spans .101 to .085, back spans -.115 to -.130.
 const interior=mesh(THREE,new THREE.CircleGeometry(.215,64),black,'dark interior below soundhole',parts.body);
 interior.rotation.x=-Math.PI/2;interior.position.set(-.10,-.041,0);
 const binding=mat(THREE,null,'#e6c89b');
 // Perimeter edge binding as sampled spline around top (not a single oval).
 const pts=outline.map(p=>[p.x,.108,p.y]);curveTube(THREE,pts,.009,binding,'top edge binding',parts.body,260,8);
 const pts2=outline.map(p=>[p.x,-.13,p.y]);curveTube(THREE,pts2,.008,binding,'back edge binding',parts.body,260,8);
 parts.rosette=assemblyGroup(THREE,'three concentric rosette inlays',parts.body);
 for(const [r,t,m] of [[.236,.010,dark],[.255,.007,brass],[.272,.008,dark]]){
   const ring=ellipseRing(THREE,-.10,0,r,r,t,m,'soundhole rosette',parts.rosette);ring.position.y=.118;
 }
 // Neck spans -0.88 to -2.33; headstock beyond. Fingerboard is separated.
 parts.neck=assemblyGroup(THREE,'neck',group);
 curveTube(THREE,[[-.82,-.01,0],[-1.10,-.015,0],[-1.75,-.04,0],[-2.31,-.04,0]],.094,dark,'rounded neck core',parts.neck,100,16);
 const board=orientedBox(THREE,[1.56,.038,.192],[-1.56,.119,0],dark,'fretboard',parts.neck,.02);
 board.scale.z=1.03;
 parts.frets=assemblyGroup(THREE,'frets',parts.neck);
 const nutX=-2.34;const saddleX=.63;const scale=saddleX-nutX; // 2.97 model units, nut-to-saddle
 for(let i=1;i<=19;i++){
   const x=nutX+scale*(1-Math.pow(2,-i/12));if(x>-.79)break;
   cylinderBetween(THREE,[x,.151,-.097],[x,.151,.097],.0048,steel,`fret ${i}`,parts.frets,10);
 }
 for(const i of [3,5,7,9,12]){
   const x=nutX+scale*(1-Math.pow(2,-i/12))-.024;
   ellipsoid(THREE,[x,.153,0],[.015,.002,.012],ivory,`position dot ${i}`,parts.neck,12);
 }
 parts.nut=orientedBox(THREE,[.031,.039,.218],[nutX,.165,0],ivory,'nut',group,.004);
 // Tapered paddle headstock with six distinct machine heads.
 parts.headstock=assemblyGroup(THREE,'headstock and six tuners',group);
 const headShape=outlineShape(THREE,[[-2.36,-.112],[-2.57,-.135],[-2.87,-.17],[-3.01,-.125],[-3.01,.125],[-2.87,.17],[-2.57,.135],[-2.36,.112]]);
 const head=horizontalExtrude(THREE,headShape,.065,.015,dark,'headstock paddle',parts.headstock);head.position.y=.06;
 const tunerEnds=[];
 for(let side of [-1,1])for(let j=0;j<3;j++){
   const x=-2.55-j*.155,z=side*.115;
   cylinderBetween(THREE,[x,.14,z],[x,.20,z],.012,steel,`tuner shaft ${side}/${j}`,parts.headstock);
   ellipsoid(THREE,[x,.19,side*.215],[.033,.016,.055],ivory,`tuner button ${side}/${j}`,parts.headstock,18);
   cylinderBetween(THREE,[x,.16,z],[x,.19,side*.215],.010,brass,`tuner stem ${side}/${j}`,parts.headstock);
   tunerEnds.push([x,.205,z]);
 }
 // Bridge is separate for mechanism observation. Six pins and compensated saddle.
 parts.bridge=assemblyGroup(THREE,'bridge, saddle and six bridge pins',group);
 const bridgeShape=outlineShape(THREE,[[.54,-.20],[.57,-.24],[.79,-.24],[.86,-.16],[.86,.16],[.79,.24],[.57,.24],[.54,.20]]);
 const bridge=horizontalExtrude(THREE,bridgeShape,.038,.008,dark,'ebony bridge',parts.bridge);bridge.position.y=.137;
 parts.saddle=curveTube(THREE,[[.624,.188,-.185],[.630,.189,-.09],[.625,.190,0],[.633,.191,.09],[.629,.190,.185]],.008,ivory,'compensated saddle',parts.bridge,50,9);
 parts.pins=assemblyGroup(THREE,'bridge pins x6',parts.bridge);
 const midi=[40,45,50,55,59,64],strings=[];
 const pitchNames=['E2','A2','D3','G3','B3','E4'];
 for(let i=0;i<6;i++){
   const z=(i-2.5)*.066;
   const pin=ellipsoid(THREE,[.744,.189,z],[.020,.018,.020],black,`bridge pin ${i+1}`,parts.pins,18);
   ellipsoid(THREE,[.744,.205,z],[.006,.004,.006],ivory,'pin dot',parts.pins,12);
   const a=[nutX,.190,z*.88],b=[saddleX,.206,z];
   const radius=[.0047,.0041,.0035,.0026,.0019,.0016][i];
   const wire=cylinderBetween(THREE,a,b,radius,steel,`string ${pitchNames[i]} MIDI ${midi[i]}`,group,12);
   strings.push({midi:midi[i],from:a,to:b,mesh:wire});
   // Fine wire continuation to a physically visible tuning post.
   const side=i<3?-1:1;const j=i%3;const tx=-2.55-j*.155,tz=side*.115;
   curveTube(THREE,[a,[-2.40,.195,z*.87],[tx,.205,tz]],radius*.65,steel,`headstock string ${i+1}`,group,28,7);
   // Wound bass string texture: helix around main speaking length for first 3 strings.
   if(i<3){const points=[];const turns=190;for(let k=0;k<=turns*5;k++){
     const t=k/(turns*5),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
     const theta=t*turns*Math.PI*2,rr=radius*.95;
     points.push([x,y+Math.cos(theta)*rr,z+Math.sin(theta)*rr]);
   }curveTube(THREE,points,.00085,brass,`winding ${pitchNames[i]}`,group,700,4)}
 }
 // End pin and pickguard are not part of vibrating mechanism.
 parts.endpin=ellipsoid(THREE,[1.105,-.012,0],[.038,.025,.027],brass,'strap endpin',group,18);
 parts.pickguard=assemblyGroup(THREE,'pickguard',parts.body);
 const pg=new THREE.Shape();pg.moveTo(.08,-.25);pg.bezierCurveTo(.25,-.23,.34,-.36,.30,-.46);pg.bezierCurveTo(.10,-.44,-.04,-.37,-.10,-.28);pg.closePath();
 const pick=horizontalExtrude(THREE,pg,.004,.002,black,'pickguard',parts.pickguard);pick.position.y=.124;
 group.userData={instrument:'guitar',coordinateSystem:'X along neck-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',scaleLength:scale,fretCount:parts.frets.children.length,bodyShell:'connected hollow ribs between y=.085 and -.115; radial inset approximation'};
 return {group,strings,parts};
}
