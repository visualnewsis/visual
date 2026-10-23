// GOODEASY: E61-inspired small semi-automatic espresso machine, illustrative dimensions.
// Three.js injected; no imports, network, CSG or external models.
export function buildEspresso(T,M={}){
 const mat=(k,c,metal=false)=>M[k]||new T.MeshStandardMaterial({color:c,roughness:metal?.29:.7,metalness:metal?.78:0});
 const steel=mat('steel',0xb7bec2,true),brass=mat('brass',0xb9904f,true),black=mat('black',0x181c20),coffee=mat('coffee',0x57301c),glass=M.glass||new T.MeshPhysicalMaterial({color:0xd8e8ed,transparent:true,opacity:.27,roughness:.09,metalness:0,depthWrite:false}),ivory=mat('ivory',0xe5dfcf),red=mat('red',0xb23b30);
 const group=new T.Group(),parts={};function part(n){let g=new T.Group();g.name=n;group.add(g);parts[n]=g;return g}
 const body=part('body'),head=part('head'),filter=part('filter'),gauge=part('gauge'),pump=part('pump'),boiler=part('boiler'),cup=part('cup');
 const wand=part('steamWand'),pipes=part('pipes'),drip=part('dripTray'),heater=part('cupWarmer');
 function add(p,g,m,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o}
 function box(w,h,d){return new T.BoxGeometry(w,h,d)}
 function cyl(r1,r2,h,n=48){return new T.CylinderGeometry(r1,r2,h,n)}
 function tube(p,pts,r,m){return add(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q=>new T.Vector3(...q))),Math.max(32,pts.length*18),r,10,false),m)}
 // Body as thin shell, open from below; rounded metal sheet, not solid box.
 let shape=new T.Shape(),w=3.35,d=2.55,r=.22;shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
 const inner=new T.Path(),iw=w/2-.055,id=d/2-.055,ir=.16;inner.moveTo(-iw+ir,-id);inner.lineTo(iw-ir,-id);inner.quadraticCurveTo(iw,-id,iw,-id+ir);inner.lineTo(iw,id-ir);inner.quadraticCurveTo(iw,id,iw-ir,id);inner.lineTo(-iw+ir,id);inner.quadraticCurveTo(-iw,id,-iw,id-ir);inner.lineTo(-iw,-id+ir);inner.quadraticCurveTo(-iw,-id,-iw+ir,-id);shape.holes.push(inner);
 let shell=new T.ExtrudeGeometry(shape,{depth:3.05,bevelEnabled:false,curveSegments:20});shell.rotateX(-Math.PI/2);add(body,shell,steel,0,3.10,0);
 add(body,box(3.27,.065,2.48),steel,0,3.12,0);
 // Front panel, rounded side seams and feet.
 add(body,box(3.22,2.80,.07),steel,0,1.60,1.275);
 for(let x of [-1.35,1.35])for(let z of [-1.01,1.01])add(body,cyl(.13,.14,.22,24),black,x,-.10,z);
 for(let x of [-1.2,1.2])add(body,new T.SphereGeometry(.035,12,8),black,x,2.80,1.32);
 // Exposed group head E61-inspired layered vertical casting, mushroom and lower chamber.
 const hz=1.72,hx=-.62;
 add(head,cyl(.43,.47,.32),brass,hx,2.46,hz);
 add(head,cyl(.33,.36,.80),steel,hx,2.05,hz);
 add(head,cyl(.51,.42,.24),steel,hx,1.58,hz);
 add(head,cyl(.35,.39,.37),brass,hx,1.30,hz);
 add(head,cyl(.29,.29,.13),steel,hx,2.90,hz);
 add(head,new T.SphereGeometry(.15,24,16),brass,hx,3.01,hz);
 // Layered E61-like lower release chamber and drain nozzle.
 add(head,cyl(.13,.18,.34),brass,hx,1.05,hz);
 add(head,cyl(.055,.06,.28),steel,hx,.77,hz);
 const lever=add(head,cyl(.065,.065,.82),steel,hx+.59,2.10,hz);lever.rotation.z=-Math.PI/2;
 const leverGrip=add(head,new T.SphereGeometry(.15,24,16),black,hx+1.05,2.10,hz);leverGrip.userData.action='lever';lever.userData.action='lever';
 // Removable basket: thin open annulus with genuine aperture + perforated bottom.
 let ringShape=new T.Shape();ringShape.absarc(0,0,.38,0,Math.PI*2,false);let hole=new T.Path();hole.absarc(0,0,.325,0,Math.PI*2,true);ringShape.holes.push(hole);
 let ringGeo=new T.ExtrudeGeometry(ringShape,{depth:.21,bevelEnabled:true,bevelThickness:.016,bevelSize:.014,bevelSegments:2,curveSegments:64});ringGeo.rotateX(-Math.PI/2);
 const basket=add(filter,ringGeo,steel,hx,1.17,hz);
 add(filter,cyl(.32,.32,.025,64),steel,hx,1.05,hz);
 for(let i=0;i<36;i++){let a=i*Math.PI*2/36,rr=.23*Math.sqrt((i%9+1)/10);add(filter,cyl(.008,.008,.005,8),black,hx+rr*Math.cos(a),1.038,hz+rr*Math.sin(a))}
 add(filter,cyl(.42,.40,.08),brass,hx,1.18,hz);
 let handle=add(filter,cyl(.13,.18,1.55,24),black,hx+.90,1.04,hz+.26);handle.rotation.z=-Math.PI/2+.10;handle.rotation.x=.20;
 basket.userData.action='lock';handle.userData.action='lock';filter.userData.action='lock';
 // Gauge: radial bezel, recessed dial, 12 ticks, needle, glass overlay.
 const gx=1.03,gy=2.37,gz=1.37;
 let face=add(gauge,cyl(.36,.36,.08,64),ivory,gx,gy,gz);face.rotation.x=Math.PI/2;
 let rim=add(gauge,new T.TorusGeometry(.37,.045,12,64),brass,gx,gy,gz+.07);
 for(let i=0;i<=12;i++){let a=(-.78+i/12*1.56)*Math.PI,xx=gx+.275*Math.sin(a),yy=gy+.275*Math.cos(a);let tick=add(gauge,box(.018,.07,.012),black,xx,yy,gz+.12);tick.rotation.z=-a}
 const needle=add(gauge,box(.026,.26,.012),red,gx,gy+.10,gz+.145);needle.position.y=gy+.12;
 add(gauge,new T.CircleGeometry(.345,64),glass,gx,gy,gz+.16);
 // Steam wand: ball joint, articulated stainless tube and tip.
 add(wand,new T.SphereGeometry(.15,24,16),brass,1.40,2.28,1.39);
 tube(wand,[[1.40,2.28,1.40],[1.70,2.05,1.63],[1.88,1.46,1.85],[1.82,1.04,1.88]],.047,steel);
 add(wand,cyl(.08,.07,.16),steel,1.82,1.00,1.88);
 // Drip tray: open rectangular well + long real negative-space slots as separated slats.
 add(drip,box(3.05,.13,1.23),black,0,.17,1.68);
 for(let i=0;i<14;i++)add(drip,box(.11,.018,1.08),steel,-1.42+i*.215,.25,1.68);
 add(drip,box(3.10,.055,.06),steel,0,.26,2.29);
 // Cup warmer grid.
 for(let i=0;i<12;i++)add(heater,box(.065,.022,2.15),steel,-1.48+i*.27,3.19,0);
 // Internal separate inspectable tank/pump/boiler/copper tubes.
 add(pump,cyl(.19,.19,.60),black,1.07,.61,-.72).rotation.z=Math.PI/2;
 add(boiler,cyl(.56,.56,1.36),brass,-.35,1.42,-.55).rotation.z=Math.PI/2;
 tube(pipes,[[1.05,.67,-.75],[.72,.88,-.80],[.30,1.01,-.75],[-.10,1.22,-.55]],.037,brass);
 tube(pipes,[[-.45,1.86,-.55],[-.55,2.05,-.30],[-.60,2.20,.40],[-.62,2.34,1.55]],.038,brass);
 // Cup, liquid fill and two independent pour streams.
 const cupWall=add(cup,new T.CylinderGeometry(.39,.31,.62,48,1,true),ivory,-.62,.58,2.00);
 add(cup,cyl(.32,.32,.035),ivory,-.62,.28,2.00);
 add(cup,new T.TorusGeometry(.20,.045,10,32),ivory,-.15,.60,2.00);
 const liquid=add(cup,cyl(.32,.32,.012,48),coffee,-.62,.31,2.00);
 const streamL=add(cup,cyl(.019,.014,.37,12),coffee,-.77,.92,1.94),streamR=add(cup,cyl(.019,.014,.37,12),coffee,-.47,.92,1.94);
 function update(state={},detail=0){const s={locked:false,brewing:false,volume:0,pressure:0,grind:.5,...state};let d=T.MathUtils.clamp(Number(detail)||0,0,1);
 filter.position.y=s.locked?0:-.30;filter.position.z=s.locked?0:.24;filter.rotation.y=s.locked?0:.26;
 leverGrip.position.y=2.10+(s.brewing?-.23:0);lever.rotation.z=-Math.PI/2+(s.brewing?-.25:0);
 needle.rotation.z=T.MathUtils.lerp(-1.0,1.0,T.MathUtils.clamp(s.pressure/12,0,1));
 let v=T.MathUtils.clamp(Number(s.volume)||0,0,1);liquid.position.y=.31+.46*v;liquid.scale.setScalar(1);liquid.scale.x=1;liquid.scale.z=1;
 const flowing=!!(s.brewing&&s.locked&&s.pressure>0);streamL.visible=streamR.visible=flowing;cup.userData.fill=v;
 for(let n of ['pump','boiler','pipes'])parts[n].position.x=d*(n==='pump'?1.3:n==='boiler'?-1.15:0);
 body.visible=true;head.visible=true;gauge.visible=true;cup.visible=true;filter.visible=true;group.userData.state={...s};}
 update();return {group,eye:[5,4,9],parts,update};
}
