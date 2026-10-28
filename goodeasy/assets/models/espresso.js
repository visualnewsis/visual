// GOODEASY 09 — E61-inspired semi-automatic espresso machine visualization.
// No imports, no network, no CSG. Dimensions are illustrative, not manufacturer CAD.
export function buildEspresso(T,M={}){
 const mat=(k,c,metal=false)=>M[k]||new T.MeshStandardMaterial({color:c,roughness:metal?.3:.7,metalness:metal?.75:0});
 const steel=mat('steel',0xbac0c4,true),brass=mat('brass',0xb8975b,true),black=mat('black',0x191c20),ivory=mat('ivory',0xe9e3d6),red=mat('red',0xb33c2c),coffee=mat('coffee',0x4e2715),glass=M.glass||new T.MeshPhysicalMaterial({color:0xcde4ec,transparent:true,opacity:.24,roughness:.08,depthWrite:false});
 const group=new T.Group(),parts={};function part(n){const p=new T.Group();p.name=n;group.add(p);parts[n]=p;return p;}
 const chassis=part('chassis'),interior=part('flowInterior');
 const body=part('body'),rear=part('rearPanel'),head=part('head'),filter=part('filter'),gauge=part('gauge'),pump=part('pump'),boiler=part('boiler'),tank=part('tank'),cup=part('cup'),pipes=part('pipes'),wand=part('steamWand'),tray=part('dripTray'),warmer=part('cupWarmer');
 function add(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
 const box=(w,h,d)=>new T.BoxGeometry(w,h,d),cyl=(a,b,h,n=48)=>new T.CylinderGeometry(a,b,h,n);
 function tube(p,pts,r,m){return add(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q=>new T.Vector3(...q))),Math.max(40,pts.length*16),r,10,false),m);}
 function roundedRect(w,d,r){const s=new T.Shape();const x=w/2,z=d/2;s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.quadraticCurveTo(x,-z,x,-z+r);s.lineTo(x,z-r);s.quadraticCurveTo(x,z,x-r,z);s.lineTo(-x+r,z);s.quadraticCurveTo(-x,z,-x,z-r);s.lineTo(-x,-z+r);s.quadraticCurveTo(-x,-z,-x+r,-z);return s;}
 // Shell extrusion along +Y (rotateX(-pi/2) maps extrusion depth to +Y).
 // y=.05..3.10. Hollow ring walls, not solid volume. Rear sheet is a separate removable part.
 const shellShape=roundedRect(3.35,2.55,.22),inner=roundedRect(3.23,2.43,.17);const innerPath=new T.Path();inner.getPoints(96).forEach((v,i)=>i?innerPath.lineTo(v.x,v.y):innerPath.moveTo(v.x,v.y));innerPath.closePath();shellShape.holes.push(innerPath);
 const shellGeo=new T.ExtrudeGeometry(shellShape,{depth:3.05,bevelEnabled:false,curveSegments:24});shellGeo.rotateX(-Math.PI/2);
 const shell=add(body,shellGeo,steel,0,.05,0);
 add(body,box(3.29,.055,2.49),steel,0,3.13,0);
 add(body,box(3.22,2.83,.052),steel,0,1.61,1.28); // front retained in detail mode
 add(rear,box(3.22,2.83,.052),steel,0,1.61,-1.28);
 for(const x of [-1.34,1.34])for(const z of [-1.00,1.00])add(body,cyl(.14,.14,.18,24),black,x,-.06,z);
 for(let i=0;i<12;i++)add(warmer,box(.062,.016,2.18),steel,-1.47+i*.267,3.17,0);
 // E61-inspired exposed group: vertical body and mushroom; drainage chamber is behind extraction axis.
 const HX=-.62,HZ=1.72;
 add(head,cyl(.44,.47,.30),brass,HX,2.49,HZ);
 add(head,cyl(.34,.36,.79),steel,HX,2.04,HZ);
 add(head,cyl(.51,.43,.22),steel,HX,1.60,HZ);
 add(head,cyl(.36,.39,.29),brass,HX,1.34,HZ);
 add(head,cyl(.30,.30,.11),steel,HX,2.90,HZ);
 add(head,new T.SphereGeometry(.145,24,16),brass,HX,3.02,HZ);
 // Drainage route OFFSET backwards by 0.47 in Z, never through the filter basket.
 tube(head,[[HX,1.49,HZ-.19],[HX,1.29,HZ-.36],[HX,1.06,HZ-.47]],.095,brass);
 add(head,cyl(.16,.18,.29),brass,HX,1.00,HZ-.47);
 add(head,cyl(.053,.055,.23),steel,HX,.74,HZ-.47);
 const leverPivot=new T.Group();leverPivot.position.set(HX+.38,2.13,HZ);head.add(leverPivot);
 const lever=add(leverPivot,cyl(.06,.06,.78),steel,.39,0,0);lever.rotation.z=-Math.PI/2;lever.userData.action='action';
 const grip=add(leverPivot,new T.SphereGeometry(.145,24,16),black,.83,0,0);grip.userData.action='action';
 // Filter pivot at actual basket center: ALL children use local coordinates.
 const FILTER_Y=1.15;filter.position.set(HX,FILTER_Y,HZ);
 function filterMesh(g,m,x=0,y=0,z=0){const o=add(filter,g,m,x,y,z);o.userData.action='lock';return o;}
 const basketShape=new T.Shape();basketShape.absarc(0,0,.38,0,2*Math.PI,false);
 const basketHole=new T.Path();basketHole.absarc(0,0,.325,0,2*Math.PI,true);basketShape.holes.push(basketHole);
 const basketGeo=new T.ExtrudeGeometry(basketShape,{depth:.20,bevelEnabled:false,curveSegments:80});basketGeo.rotateX(-Math.PI/2);
 const basketWall=filterMesh(basketGeo,steel.clone(),0,-.09,0); // ring runs from local y=-.09 to +.11
 const bottomShape=new T.Shape();bottomShape.absarc(0,0,.32,0,Math.PI*2,false);for(let i=0;i<70;i++){const a=i*2.39996,r=.292*Math.sqrt((i+.5)/70),hole=new T.Path();hole.absarc(r*Math.cos(a),r*Math.sin(a),.007,0,Math.PI*2,true);bottomShape.holes.push(hole);}const perforated=new T.ExtrudeGeometry(bottomShape,{depth:.018,bevelEnabled:false,curveSegments:8});perforated.rotateX(-Math.PI/2);const floor=filterMesh(perforated,steel,0,-.114,0);floor.name='actual perforated basket floor';
 for(const sign of [-1,1]){const lug=filterMesh(box(.12,.045,.10),steel,sign*.39,.08,0);lug.name='bayonet locking lug';}
 // Open brass annular rim, NOT a solid disk blocking the basket.
 filterMesh(new T.TorusGeometry(.392,.027,12,72),brass,0,.117,0).rotation.x=Math.PI/2;
 const handle=filterMesh(cyl(.13,.17,1.20,24),black,.98,.02,.06);handle.rotation.z=-Math.PI/2+.10;handle.rotation.x=.18;
 filter.userData.action='lock';
 // Gauge: all needle geometry relative to actual dial center, not bar center.
 const GX=1.04,GY=2.38,GZ=1.39;
 const face=add(gauge,cyl(.35,.35,.065,64),ivory,GX,GY,GZ);face.rotation.x=Math.PI/2;
 add(gauge,new T.TorusGeometry(.365,.04,12,64),brass,GX,GY,GZ+.058);
 for(let i=0;i<=12;i++){const a=(-.75+i/12*1.5)*Math.PI;const tick=add(gauge,box(.017,.056,.01),black,GX+.275*Math.sin(a),GY+.275*Math.cos(a),GZ+.10);tick.rotation.z=-a;}
 const needlePivot=new T.Group();needlePivot.position.set(GX,GY,GZ+.14);gauge.add(needlePivot);
 add(needlePivot,box(.022,.235,.01),red,0,.1175,0);
 add(needlePivot,new T.SphereGeometry(.035,12,10),black,0,0,.01);
 const lens=add(gauge,new T.CircleGeometry(.335,64),glass,GX,GY,GZ+.17);
 // Tank, pump, boiler and visible copper lines are separately inspectable.
 const tankWall=add(tank,cyl(.48,.48,1.75,48),glass,1.02,1.26,-.54);
 add(tank,cyl(.48,.48,.06,48),black,1.02,.36,-.54);add(tank,cyl(.48,.48,.06,48),black,1.02,2.17,-.54);
 add(pump,cyl(.20,.20,.66),black,.80,.57,.24).rotation.z=Math.PI/2;
 add(boiler,cyl(.53,.53,1.33),brass,-.43,1.47,-.43).rotation.z=Math.PI/2;
 const inlet=tube(pipes,[[1.02,.33,-.54],[1.02,.23,-.2],[1.32,.3,.24],[1.13,.57,.24]],.035,brass);inlet.name='tank outlet to pump inlet';
 const delivery=tube(pipes,[[.47,.57,.24],[.28,.57,.24],[.26,1.15,-.43],[.235,1.47,-.43]],.035,brass);delivery.name='pump outlet to boiler endcap';
 const heatedPipe=tube(pipes,[[-.43,2.00,-.43],[-.56,2.12,-.25],[-.61,2.34,.62],[-.62,2.37,1.27647]],.037,brass);heatedPipe.name='boiler surface to grouphead inlet';
 // A connected load-bearing chassis remains when the outer shell is opened.
 add(chassis,box(3.05,.08,2.30),black,0,.25,0);
 for(const x of [-1.45,1.45])for(const z of [-1.06,1.06])add(chassis,box(.055,2.75,.055),steel,x,1.65,z);
 for(const y of [.42,2.96])for(const z of [-1.06,1.06])add(chassis,box(2.95,.045,.045),steel,0,y,z);
 add(chassis,box(.65,.12,.55),black,.8,.31,.24);add(chassis,box(.95,.08,.95),steel,1.02,.29,-.54);
 for(const x of [-.85,.0])add(chassis,box(.08,.69,.48),steel,x,.595,-.43);
 const reservoirWater=add(tank,cyl(.43,.43,1.40),new T.MeshPhysicalMaterial({color:0x4e9eaa,transparent:true,opacity:.34,roughness:.12,depthWrite:false}),1.02,1.1,-.54);
 const coilMaterial=brass.clone();coilMaterial.color.setHex(0xa87a50);for(let i=0;i<9;i++){const ring=add(pump,new T.TorusGeometry(.205,.009,8,32),coilMaterial,.56+i*.06,.57,.24);ring.rotation.y=Math.PI/2;}
 const piston=add(pump,cyl(.045,.045,.64),steel,.8,.57,.24);piston.rotation.z=Math.PI/2;
 const waterMaterial=new T.MeshPhysicalMaterial({color:0xc1b17b,transparent:true,opacity:.33,roughness:.18,depthWrite:false});
 const boilerWater=add(interior,cyl(.46,.46,1.20),waterMaterial,-.43,1.47,-.43);boilerWater.rotation.z=Math.PI/2;
 const heater=tube(interior,Array.from({length:101},(_,i)=>{const t=i/100,a=t*Math.PI*12;return [-.94+t*1.02,1.47+Math.cos(a)*.29,-.43+Math.sin(a)*.29];}),.018,coilMaterial);heater.name='heating element inside boiler';
 const boilerShell=boiler.children[0];boilerShell.material=boilerShell.material.clone();
 const flowChannels=[];for(const [index,outer]of [...pipes.children].entries()){
  outer.material=outer.material.clone();const channel=new T.Mesh(new T.TubeGeometry(outer.geometry.parameters.path,64,.013,8,false),new T.ShaderMaterial({uniforms:{uTime:{value:0},uColor:{value:new T.Color(index<2?0x60c8d1:0xe1c27d)}},transparent:true,depthWrite:false,vertexShader:'varying float vAlong;void main(){vAlong=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime;uniform vec3 uColor;varying float vAlong;void main(){float pulse=smoothstep(.15,.65,fract(vAlong*3.-uTime));gl_FragColor=vec4(uColor,.2+.65*pulse);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));channel.name='continuous water inside '+outer.name;interior.add(channel);flowChannels.push({outer,channel});
 }
 const headPath=new T.CatmullRomCurve3([[-.62,2.37,1.27647],[-.62,2.37,1.72],[-.62,1.31,1.72]].map(p=>new T.Vector3(...p))),headFlow=new T.Mesh(new T.TubeGeometry(headPath,64,.014,8,false),flowChannels.at(-1).channel.material.clone());headFlow.name='heated water through grouphead to shower';interior.add(headFlow);flowChannels.push({outer:null,channel:headFlow});
 // Steam wand and cup warmer / slotted tray.
 add(wand,new T.SphereGeometry(.14,24,16),brass,1.40,2.27,1.40);
 tube(wand,[[1.4,2.27,1.4],[1.70,2.05,1.62],[1.86,1.43,1.84],[1.80,1.03,1.87]],.045,steel);
 add(wand,cyl(.077,.071,.16),steel,1.80,.99,1.87);
 add(tray,box(3.05,.12,1.22),black,0,.17,1.70);
 for(let i=0;i<14;i++)add(tray,box(.10,.02,1.06),steel,-1.41+i*.217,.245,1.70);
 add(tray,box(3.1,.05,.06),steel,0,.26,2.29);
 // Cup / fill 0..40mL, two streams tied to locked+brewing+pressure.
 add(cup,new T.CylinderGeometry(.38,.30,.62,48,1,true),ivory,HX,.59,2.04);
 add(cup,cyl(.30,.30,.028),ivory,HX,.29,2.04);
 const cupHandle=add(cup,new T.TorusGeometry(.18,.042,10,32),ivory,HX+.54,.58,2.04);cupHandle.name='cup handle attached outside wall';
 const liquid=add(cup,cyl(.295,.295,.011,48),coffee,HX,.31,2.04);
 const streamA=add(cup,cyl(.017,.013,1,12),coffee,HX-.12,.94,1.99);
 const streamB=add(cup,cyl(.017,.013,1,12),coffee,HX+.12,.94,1.99);
 function update(state={},detail=0){
  const s={locked:false,brewing:false,volume:0,pressure:0,grind:.5,...state},d=T.MathUtils.clamp(Number(detail)||0,0,1);
  filter.position.set(HX,FILTER_Y-(s.locked?0:.32),HZ+(s.locked?0:.31));
  filter.rotation.y=s.locked?0:.35; // rotates around basket center
  leverPivot.rotation.z=s.brewing?-.27:0;
  needlePivot.rotation.z=-T.MathUtils.lerp(-.75*Math.PI,.75*Math.PI,T.MathUtils.clamp((Number(s.pressure)||0)/12,0,1));
  const fill=T.MathUtils.clamp((Number(s.volume)||0)/40,0,1);
  liquid.position.y=.31+.45*fill;cup.userData.fill=fill;cup.userData.volumeMl=40*fill;
  const pouring=!!(s.locked&&s.brewing&&Number(s.pressure)>0&&s.espressoPouring!==false);streamA.visible=streamB.visible=pouring;for(const stream of [streamA,streamB]){stream.name='coffee from spout to current surface';stream.scale.y=.96-liquid.position.y;stream.position.y=(.96+liquid.position.y)/2;}
  // Rear panel slides off to reveal internals; body side/front remain stable and recognizable.
  rear.position.z=-1.4*d;rear.visible=d<.98;
  pump.position.x=1.15*d;boiler.position.x=-1.12*d;tank.position.z=-.5*d;pipes.position.x=.25*d;
  const cutaway=!!s.espressoCutaway||d>0;interior.visible=cutaway;chassis.visible=cutaway;piston.position.x=.8+(s.brewing?Math.sin((s.brewElapsed||0)*30)*.025:0);
  basketWall.material.transparent=cutaway;basketWall.material.opacity=cutaway?.18:1;basketWall.material.depthWrite=!cutaway;
  boilerShell.material.transparent=cutaway;boilerShell.material.opacity=cutaway?.18:1;boilerShell.material.depthWrite=!cutaway;
  for(const {outer,channel}of flowChannels){if(outer){outer.material.transparent=cutaway;outer.material.opacity=cutaway?.24:1;outer.material.depthWrite=!cutaway;}channel.visible=!!s.brewing;channel.material.uniforms.uTime.value=(s.brewElapsed||0)*1.4;}
  group.userData.state={...s};group.userData.detail=d;
 }
 update();return {group,eye:[5,4,9],parts,update};
}
