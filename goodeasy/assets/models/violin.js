import {buildViolinRibs,violinInnerOutline} from './violin-ribs.js?v=20261102-final3';
import {buildChinrest} from './violin-fittings.js?v=20261102-rescue2';
import {violinPlateGeometry as plateGeometry,violinFOpening as fHole} from './violin-surface.js?v=20261102-rescue2';
import {violinFinish,finishViolinTop} from './violin-finish.js?v=20261102-final3';
import {neckGeometry,guitarWood,woodUV,edgeDistance} from './guitar-craft.js?v=20261027-craft5';
import {smoothOutline,shapeFromPoints,insetOutline,archedPlate,violinTopY} from './surface-utils.js?v=20261024-editorial1';
import {mat,mesh,curveTube,cylinderBetween,ellipsoid,horizontalExtrude,outlineShape,assemblyGroup,orientedBox,addWoodGrain} from './model-utils.js?v=20261024-editorial1';
/** Violin: X scroll (-) to tail (+), Y soundboard normal (+), Z string spread.
 * The bow is a separately transformable group; animation is the caller's responsibility.
 * MIDI G3 D4 A4 E5 = [55,62,69,76]. Dimensions are visual assumptions, not CAD.
 */
const violinGeometry=new Map(),plateFits=new Map();
let archContour=[];
const archWidths=new Map();
function sectionWidth(x){
 const key=x.toFixed(8);if(archWidths.has(key))return archWidths.get(key);let w=0;
 for(let i=0;i<archContour.length;i++){const a=archContour[i],b=archContour[(i+1)%archContour.length];if((a.x<=x&&b.x>=x)||(b.x<=x&&a.x>=x)){const dx=b.x-a.x;if(Math.abs(dx)>1e-12)w=Math.max(w,Math.abs(a.y+(b.y-a.y)*(x-a.x)/dx));}}
 archWidths.set(key,w);return w;
}
// A smooth transverse arch, not a nearest-edge distance field with medial ridges.
export const violinDome=(x,z)=>{const w=sectionWidth(x);if(w<1e-8)return 0;const q=Math.max(0,1-(z/w)**2),u=Math.max(0,Math.min(1,(x+.78)/1.95));return .078*Math.sin(Math.PI*u)**1.1*q*q*(3-2*q);};
export const violinTopInsideY=(x,z)=>.092+violinDome(x,z);
export const violinBackInsideY=(x,z)=>-.105-violinDome(x,z)*.7;
const boardWidth=x=>.218+(Math.max(-1.59,Math.min(-.535,x))+1.59)/1.055*.105;
export const violinBoardY=(x,z)=>.226+(x+1.59)/1.055*.021-.010*(2*z/.218)**2;
function fingerboardGeometry(T) {
  const rows = 32, cols = 16, X0 = -1.59, LEN = 1.055;
  const bottomY = x => .196 + (x - X0) / LEN * .021;
  const dBottom = .021 / LEN, dTop = .021 / LEN, dWidth = .105 / LEN; // board lies inside boardWidth clamp
  const pos = [], nor = [], idx = [];
  const norm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  const v = (x, y, z, n) => { pos.push(x, y, z); nor.push(n[0], n[1], n[2]); return pos.length / 3 - 1; };
  const tri = (a, b, c, n) => {
    const P = k => [pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]], A = P(a), B = P(b), C = P(c);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) ? idx.push(a, c, b) : idx.push(a, b, c);
  };
  const quad = (a, b, c, d, n) => { tri(a, b, c, n); tri(a, c, d, n); };
  const xAt = i => X0 + i / rows * LEN;
  const zAt = (x, j) => (j / cols - .5) * boardWidth(x);
  const topN = (x, z) => norm(-dTop, 1, .08 * z / (.218 * .218)); // y = violinBoardY(x,z)

  // Top (fretless playing surface) and bottom (glue face) grids.
  const grid = (yOf, nOf, ref) => {
    const id = [];
    for (let i = 0; i <= rows; i++) { const x = xAt(i); id.push([]); for (let j = 0; j <= cols; j++) { const z = zAt(x, j); id[i].push(v(x, yOf(x, z), z, nOf(x, z))); } }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) quad(id[i][j], id[i + 1][j], id[i + 1][j + 1], id[i][j + 1], ref);
  };
  grid(violinBoardY, topN, [0, 1, 0]);
  grid(x => bottomY(x), () => norm(dBottom, -1, 0), [0, -1, 0]);

  // Long sides (+z / -z), tapered: outward normal (-w'/2, 0, +-1).
  for (const s of [-1, 1]) {
    const n = norm(-dWidth / 2, 0, s), col = [];
    for (let i = 0; i <= rows; i++) { const x = xAt(i), z = s * boardWidth(x) / 2; col.push([v(x, violinBoardY(x, z), z, n), v(x, bottomY(x), z, n)]); }
    for (let i = 0; i < rows; i++) quad(col[i][0], col[i + 1][0], col[i + 1][1], col[i][1], n);
  }
  // Nut end (-x) and body end (+x).
  for (const [i, n] of [[0, [-1, 0, 0]], [rows, [1, 0, 0]]]) {
    const x = xAt(i), row = [];
    for (let j = 0; j <= cols; j++) { const z = zAt(x, j); row.push([v(x, violinBoardY(x, z), z, n), v(x, bottomY(x), z, n)]); }
    for (let j = 0; j < cols; j++) quad(row[j][0], row[j + 1][0], row[j + 1][1], row[j][1], n);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setIndex(idx); woodUV(g);
  g.userData.normalsAreAuthored = true;
  return g;
}

export function buildViolin(THREE,materials={}){
 const group=new THREE.Group();group.name='GOODEASY / violin';group.scale.z=-1;
 const wood=violinFinish(THREE,'maple'),dark=violinFinish(THREE,'maple');
 const ivory=mat(THREE,materials.ivory,'#e8d9b4'),steel=mat(THREE,materials.steel,'#c3c8ca',.32,.53);
 const brass=mat(THREE,materials.brass,'#b69b5b',.35,.55),black=mat(THREE,materials.black,'#14100d');
 const felt=mat(THREE,materials.felt,'#6b5641');const varnish=violinFinish(THREE,'spruce');const ebony=guitarWood(THREE,'ebony');ebony.roughness=.68;ebony.clearcoat=.06;ebony.clearcoatRoughness=.60;const braceWood=guitarWood(THREE,'brace');
 const cavityWood=new THREE.MeshStandardMaterial({color:'#45200f',roughness:.65,metalness:0,side:THREE.DoubleSide});
 cavityWood.name='unvarnished cavity and f-opening cut wood';
 const parts={};
 // The violin outline has upper/lower bouts, concave C-bouts and projecting corners.
 // Violin-specific upper bouts, inward C-bouts, four corner tips and larger lower bouts.
 // Smooth closed outline: arch triangulation uses its exact boundary, never grid-cell clipping.
 const contour=smoothOutline(THREE,[
  [-.78,0],[-.74,.21],[-.59,.354],[-.40,.385],[-.235,.349],[-.13,.340],
  [-.085,.276],[-.042,.250],[.062,.240],[.155,.245],[.262,.268],[.325,.340],
  [.40,.348],[.50,.389],[.70,.444],[.91,.423],[1.08,.312],[1.16,.15],[1.17,0],
  [1.16,-.15],[1.08,-.312],[.91,-.423],[.70,-.444],[.50,-.389],[.40,-.348],
  [.325,-.340],[.262,-.268],[.155,-.245],[.062,-.240],[-.042,-.250],[-.085,-.276],
  [-.13,-.340],[-.235,-.349],[-.40,-.385],[-.59,-.354],[-.74,-.21]
 ],320);
 archContour=contour;
 const outline=shapeFromPoints(THREE,contour);
 parts.body=assemblyGroup(THREE,'violin body (smooth arched top / hollow ribs / back)',group);
 // Continuous wall from top edge to back. The old y=-.10 downward extrusion left a gap.
 const ribOuter=violinInnerOutline(THREE,contour,.012),inner=violinInnerOutline(THREE,ribOuter,.008);
 const ribs=buildViolinRibs(THREE,ribOuter,inner,.099,-.113,dark,parts.body,'connected hollow violin ribs');
 parts.ribs=ribs;
 if(!violinGeometry.has('back'))violinGeometry.set('back',plateGeometry(THREE,contour,[],-.121,-.105,(x,z)=>-violinDome(x,z)*.7));
 const back=mesh(THREE,violinGeometry.get('back'),[wood,cavityWood,cavityWood],'closed arched maple back',parts.body);
 parts.back=back;
 if(!violinGeometry.has('top'))violinGeometry.set('top',plateGeometry(THREE,contour,[-1,1].map(side=>fHole(THREE,side)),.106,.092,violinDome));
 finishViolinTop(THREE,violinGeometry.get('top'),contour,edgeDistance);
 const top=mesh(THREE,violinGeometry.get('top'),[varnish,cavityWood,cavityWood],'closed arched spruce soundboard with real f openings',parts.body);
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
 const postX=.25,postZ=.130,postBottom=plateY(back,postX,postZ,true),postTop=plateY(top,postX,postZ,true);parts.post=assemblyGroup(THREE,'fitted soundpost',group);cylinderBetween(THREE,[postX,postBottom,postZ],[postX,postTop,postZ],.019,braceWood,'soundpost touching both inner plates',parts.post);
 const postMesh=parts.post.children[0],pp=postMesh.geometry.attributes.position;for(let i=0;i<pp.count;i++){const x=postX+pp.getX(i),z=postZ+pp.getZ(i),target=plateY(pp.getY(i)>0?top:back,x,z,true);pp.setY(i,target-postMesh.position.y);}pp.needsUpdate=true;postMesh.geometry.computeVertexNormals();
 parts.post.userData.ends=[[postX,postBottom,postZ],[postX,postTop,postZ]];
 parts.chinrest=buildChinrest(THREE,{parent:group,topY:(x,z)=>plateY(top,x,z),topShapeY:(x,z)=>.106+violinDome(x,z),backY:(x,z)=>plateY(back,x,z),edgeX:z=>{let x=-Infinity;for(let i=0;i<contour.length;i++){const a=contour[i],b=contour[(i+1)%contour.length];if((a.y<=z&&b.y>=z)||(b.y<=z&&a.y>=z)){if(Math.abs(b.y-a.y)>1e-8)x=Math.max(x,a.x+(b.x-a.x)*(z-a.y)/(b.y-a.y));}}return x;},black,steel});
 // Neck, ebony fingerboard, nut, scroll and four side-mounted pegs.
 parts.neck=assemblyGroup(THREE,'neck and fingerboard',group);
 if(!violinGeometry.has('neck')){const g=neckGeometry(THREE,-1.66,-.65,x=>boardWidth(x)+.014,.196,t=>.085+t*.028),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i);a.setY(i,a.getY(i)+Math.max(0,(x+1.59)/1.055)*.021);}g.computeVertexNormals();violinGeometry.set('neck',g);}
 mesh(THREE,violinGeometry.get('neck'),wood,'fitted D profile maple neck',parts.neck);
 if(!violinGeometry.has('board'))violinGeometry.set('board',fingerboardGeometry(THREE));
 const finger=mesh(THREE,violinGeometry.get('board'),ebony,'arched tapered fretless fingerboard',parts.neck);parts.fingerboard=finger;
 const nutTop=z=>violinBoardY(-1.59,z)+.003;
 const nutProfile=new THREE.Shape();nutProfile.moveTo(-.111,.193);nutProfile.lineTo(-.111,nutTop(.111));for(let i=1;i<=32;i++){const z=-.111+.222*i/32;nutProfile.lineTo(z,nutTop(-z));}nutProfile.lineTo(.111,.193);nutProfile.closePath();const nutGeometry=new THREE.ExtrudeGeometry(nutProfile,{depth:.027,bevelEnabled:false});nutGeometry.rotateY(Math.PI/2);nutGeometry.translate(-1.59-.0135,0,0);parts.nut=mesh(THREE,nutGeometry,ivory,'arched nut supporting four strings',parts.neck);
 parts.scroll=assemblyGroup(THREE,'pegbox and carved scroll',group);
 orientedBox(THREE,[.42,.020,.137],[-1.80,.080,0],dark,'pegbox bottom beneath open channel',parts.scroll,.006);
 for(const side of [-1,1])orientedBox(THREE,[.42,.106,.022],[-1.80,.127,side*.057],wood,'pegbox carved cheek '+side,parts.scroll,.008);
 orientedBox(THREE,[.13,.065,.10],[-2.055,.12,0],wood,'scroll throat joined to pegbox',parts.scroll,.012);
 const pegXs=[-1.67,-1.87,-1.77,-1.97];
 for(let i=0;i<4;i++){
   const side=i<2?-1:1,x=pegXs[i];
   cylinderBetween(THREE,[x,.145,-side*.072],[x,.145,side*.13],.018,dark,'tuning peg shaft '+i,parts.scroll);
   ellipsoid(THREE,[x,.145,side*.175],[.042,.020,.020],black,'peg grip '+i,parts.scroll,16);
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
 const bridgeX=.18, topAtBridge=plateY(top,.18,.145), bridgeLift=(topAtBridge-.106)*(1-.032/.078), bridgeFootY=topAtBridge-bridgeLift;
 const bridgeWood=new THREE.MeshStandardMaterial({color:0xc99a62,roughness:.65,side:THREE.DoubleSide});
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
 bridgeGeo.translate(bridgeX-.0085,bridgeLift,0);
 const bridge=mesh(THREE,bridgeGeo,bridgeWood,'vertical carved bridge YZ profile',parts.bridge);
 parts.bridgePlate=bridge;
 for(const side of [-1,1]){
   const foot=mesh(THREE,new THREE.BoxGeometry(.048,.010,.044),bridgeWood,`bridge foot ${side}`,parts.bridge),fp=foot.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=bridgeX+fp.getX(i),z=side*.145+fp.getZ(i),lower=plateY(top,x,z);fp.setXYZ(i,x,lower+(fp.getY(i)>0?.009:0),z);}foot.geometry.computeVertexNormals();
 }
 // The crest contact heights are individually arched, rather than a single flat saddle.
 const bridgeZ=[-.1095,-.0365,.0365,.1095];
 const bridgeY=[.256,.273,.273,.256].map(y=>y+bridgeLift);
 parts.bridgeCrest=curveTube(THREE,bridgeZ.map((z,i)=>[bridgeX,bridgeY[i],z]),.003,bridgeWood,'arched string-bearing bridge crown',parts.bridge,60,8);
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
   curveTube(THREE,[nut,[-1.69,.216,z*.85],[pegXs[i],.145,side*.025]],rad*.75,steel,`pegbox wire ${i+1}`,group,32,7);
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
 curveTube(THREE,[[contactX+.035,hairY+.065,-.78],[contactX+.04,hairY+.048,-.4],[contactX+.046,hairY+.035,0],[contactX+.04,hairY+.046,.42],[contactX+.035,hairY+.065,.78]],.015,dark,'cambered bow stick',bow,100,12);
 orientedBox(THREE,[.068,.062,.115],[contactX+.035,hairY+.037,-.67],black,'frog',bow,.012);
 ellipsoid(THREE,[contactX+.070,hairY+.037,-.67],[.003,.012,.012],ivory,'frog pearl eye',bow,14);
 cylinderBetween(THREE,[contactX+.035,hairY+.045,-.82],[contactX+.035,hairY+.045,-.74],.012,brass,'bow adjuster',bow);
 orientedBox(THREE,[.064,.014,.018],[contactX+.010,hairY+.006,-.610],steel,'frog front silver ferrule',bow,.003);
 orientedBox(THREE,[.060,.004,.098],[contactX+.035,hairY+.007,-.670],steel,'frog polished underslide',bow,.001);
 orientedBox(THREE,[.063,.052,.006],[contactX+.035,hairY+.035,-.73],steel,'frog silver heel plate',bow,.002);
 orientedBox(THREE,[.060,.012,.050],[contactX,hairY+.004,-.665],steel,'frog ferrule anchoring hair',bow,.003);
 const headShape=new THREE.Shape();headShape.moveTo(.78,hairY+.065);headShape.lineTo(.73,hairY+.073);headShape.lineTo(.64,hairY+.015);headShape.lineTo(.64,hairY-.012);headShape.lineTo(.69,hairY-.012);headShape.lineTo(.70,hairY+.022);headShape.lineTo(.78,hairY+.045);headShape.closePath();
 const headGeo=new THREE.ExtrudeGeometry(headShape,{depth:.040,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2});headGeo.rotateY(-Math.PI/2);headGeo.translate(contactX+.020,0,0);
 mesh(THREE,headGeo,wood,'carved bow head anchoring hair tip',bow);
 orientedBox(THREE,[.044,.006,.050],[contactX,hairY-.008,.665],ivory,'bow head protective ivory tip',bow,.002);

 bow.userData={selectedStringIndex,contactLocal:[contactX,contactY,contactZ],movementAxis:'Z',
   // Moving in Z changes which portion of hair contacts the string. Audio gating is external.
   hairCenterlineY:hairY,contactTolerance:.006};
 group.userData={instrument:'violin',coordinateSystem:'X along scroll-to-tail, Y top normal, Z string spread',dimensions:'visualization assumptions; NOT CAD',bowMovementAxis:'Z',bowDefaultPosition:[0,0,0],fHoles:'cut-through top openings; silhouette approximation, NOT CAD',arch:'earcut outline triangulation + adaptive subdivision; not physical plate scan',handedness:'right handed',bridgeOrientation:'upright YZ',speakingLength:'nut to bridge crown'};
 return {group,strings,bow,parts};
}
