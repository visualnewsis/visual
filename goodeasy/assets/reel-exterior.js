// Exterior surfaces only. All motion anchors remain owned by reel-hero.js.
export function buildReelExterior(T) {
 const materials={
  graphite:new T.MeshStandardMaterial({color:0x23282d,metalness:.30,roughness:.52}),
  dark:new T.MeshStandardMaterial({color:0x151b20,metalness:.24,roughness:.57}),
  aluminium:new T.MeshStandardMaterial({color:0xc6cdd0,metalness:.88,roughness:.28}),
  gunmetal:new T.MeshStandardMaterial({color:0x68757c,metalness:.82,roughness:.36}),
  gold:new T.MeshStandardMaterial({color:0x9d7a2f,metalness:.92,roughness:.30}),
  rubber:new T.MeshStandardMaterial({color:0x15191b,metalness:.05,roughness:.88})
 };
 const M=materials,body=new T.Group(),spool=new T.Group(),rotor=new T.Group(),handle=new T.Group(),drag=new T.Group();
 for(const [name,g] of Object.entries({body,spool,rotor,handle,drag}))g.name='Sculpted reel '+name+' exterior';
 function add(p,g,m,name,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 // Every profile pair is [radius, axial X], never [X, radius].
 function turned(p,profile,m,name,x=0,y=0,z=0){const g=new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),96);g.rotateZ(-Math.PI/2);return add(p,g,m,name,x,y,z);}
 function torus(p,r,t,m,name,x,y=0,z=0,axis='x'){const g=new T.TorusGeometry(r,t,12,96);if(axis==='x')g.rotateY(Math.PI/2);if(axis==='y')g.rotateX(Math.PI/2);return add(p,g,m,name,x,y,z);}
 function casting(p,shape,depth,bevel,m,name,z=0){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:5,curveSegments:40});g.translate(0,0,-depth/2);return add(p,g,m,name,0,0,z);}
 function curve(p,points,r,m,name){return add(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),64,r,10,false),m,name);}
 // A closed, rounded casting: the silhouette shrinks toward each domed side,
 // instead of extruding a large flat circular plate toward the camera.
 function domed(p,shape,cx,cy,depth,m,name,z=0){
  const edge=shape.getSpacedPoints(96).slice(0,-1),n=edge.length,rows=24,positions=[],indices=[];
  for(let j=0;j<=rows;j++){const a=-Math.PI/2+j/rows*Math.PI,s=Math.max(.0001,Math.cos(a));for(const v of edge)positions.push(cx+(v.x-cx)*s,cy+(v.y-cy)*s,z+Math.sin(a)*depth);}
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,c,b,b,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return add(p,g,m,name);
 }
 const shellShape=new T.Shape();shellShape.moveTo(-1.38,1.32);shellShape.bezierCurveTo(-1.47,1.75,-1.25,2.23,-.86,2.39);shellShape.bezierCurveTo(-.52,2.58,-.15,2.40,.13,2.13);shellShape.bezierCurveTo(.32,1.98,.50,1.96,.51,1.80);shellShape.bezierCurveTo(.49,1.58,.15,1.55,-.02,1.32);shellShape.bezierCurveTo(-.39,.84,-1.22,.91,-1.38,1.32);shellShape.closePath();
 const casing=domed(body,shellShape,-.55,1.77,.48,M.graphite,'Contoured cast gear housing');
 // The service plate is a small curved inset, not a second full-size disc.
 const coverShape=new T.Shape();coverShape.moveTo(-1.18,1.45);coverShape.bezierCurveTo(-1.28,1.87,-.97,2.23,-.63,2.25);coverShape.bezierCurveTo(-.25,2.27,.02,1.95,-.02,1.65);coverShape.bezierCurveTo(-.03,1.30,-.80,1.08,-1.18,1.45);coverShape.closePath();
 domed(body,coverShape,-.61,1.76,.095,M.dark,'Domed removable side plate',.421);
 const sideBearing=turned(body,[[.04,0],[.17,0],[.20,.025],[.20,.06],[.17,.09],[.04,.09]],M.gunmetal,'Handle bearing boss');sideBearing.rotation.y=-Math.PI/2;sideBearing.position.set(-.4,1.8,.46);
 torus(body,.17,.009,M.gold,'Handle bearing seal',-.4,1.8,.554,'z');
 for(const [x,y,z] of [[-1.00,1.54,.47],[-.67,2.12,.48],[-.15,1.68,.48]]){const screw=add(body,new T.CylinderGeometry(.031,.031,.012,16),M.aluminium,'Recessed service screw',x,y,z);screw.rotation.x=Math.PI/2;const slot=add(body,new T.BoxGeometry(.033,.006,.004),M.dark,'Service screw slot',x,y,z+.008);slot.rotation.z=.4;}
 const stemShape=new T.Shape();stemShape.moveTo(-.84,2.29);stemShape.bezierCurveTo(-.74,2.60,-.69,2.95,-.44,3.23);stemShape.bezierCurveTo(-.35,3.34,-.16,3.42,.07,3.45);stemShape.lineTo(.31,3.35);stemShape.bezierCurveTo(-.04,3.28,-.22,3.14,-.31,2.88);stemShape.bezierCurveTo(-.39,2.64,-.34,2.43,-.29,2.31);stemShape.closePath();
 casting(body,stemShape,.19,.045,M.graphite,'S curved cast stem');
 curve(body,[[-.66,2.51,.141],[-.57,2.86,.141],[-.38,3.15,.141],[-.16,3.30,.141]],.012,M.gunmetal,'Stem bevel highlight');
 const footShape=new T.Shape();footShape.moveTo(-.77,3.41);footShape.bezierCurveTo(-.65,3.36,-.28,3.34,.07,3.35);footShape.bezierCurveTo(.45,3.35,.85,3.40,1.03,3.46);footShape.bezierCurveTo(.67,3.54,-.28,3.54,-.76,3.48);footShape.quadraticCurveTo(-.82,3.45,-.77,3.41);footShape.closePath();
 const foot=casting(body,footShape,.26,.028,M.graphite,'Tapered reel seat foot');
 // Smooth machined transitions and narrow annular edges preserve the line bay.
 const rearLip=turned(spool,[[.39,-.60],[.52,-.60],[.63,-.56],[.73,-.48],[.78,-.40],[.815,-.362],[.83,-.35],[.816,-.33],[.77,-.315],[.39,-.315],[.39,-.60]],M.gunmetal,'Contoured spool skirt and rear shoulder');
 // Only the rolled edge is bright metal. The recessed conical cup has its own
 // normals and finish, so the spool cannot read as one flat silver disc.
 turned(spool,[[.72,.315],[.79,.324],[.823,.342],[.83,.35],[.825,.365],[.79,.382],[.755,.414],[.733,.414],[.72,.395],[.72,.315]],M.aluminium,'Machined rolled front spool lip');
 const cupMaterial=new T.MeshStandardMaterial({color:0x58656d,metalness:.78,roughness:.38});
 const frontCup=turned(spool,[[.275,.315],[.72,.315],[.738,.395],[.735,.411],[.705,.402],[.64,.381],[.56,.353],[.46,.328],[.37,.326],[.29,.342],[.275,.342],[.275,.315]],cupMaterial,'Recessed conical spool front cup');
 turned(spool,[[.275,.334],[.32,.334],[.365,.343],[.38,.361],[.367,.377],[.312,.382],[.275,.382],[.275,.334]],M.dark,'Recessed drag seat');
 torus(spool,.735,.004,M.gunmetal,'Inner lip machining edge',.413);
 for(const [r,x] of [[.411,.329],[.445,.330],[.482,.337],[.520,.346]])torus(spool,r,.0014,M.gunmetal,'Fine concentric tool mark',x);
 // Shallow milled pockets follow the conical face; they are not decorative
 // bolts or holes cut through the line bed behind the front flange.
 for(let i=0;i<6;i++){
  const positions=[],indices=[],steps=20;
  for(let j=0;j<=steps;j++)for(const side of [-1,1]){const t=j/steps,a=i*Math.PI/3+(t-.5)*.43,r=.605+side*.017*Math.sin(Math.PI*t),x=.353+(r-.56)*(.028/.08)+.0017;positions.push(x,Math.sin(a)*r,Math.cos(a)*r);}
  for(let j=0;j<steps;j++){const k=j*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();add(spool,g,M.dark,'Recessed conical machining pocket');
 }
 torus(spool,.814,.009,M.gold,'Fine gold spool lip inlay',.367);
 for(const [x,r] of [[-.53,.667],[-.50,.706],[-.47,.741]])torus(spool,r,.005,M.aluminium,'Turned skirt machining line',x);
 torus(spool,.777,.012,M.gold,'Rear skirt inlay',-.402);
 // Recesses are on the skirt, away from the moving line and front lip.
 for(let i=0;i<10;i++){const a=i*Math.PI/5;const o=add(spool,new T.SphereGeometry(1,20,12),M.dark,'Shallow skirt relief',-.48,Math.sin(a)*.726,Math.cos(a)*.726);o.scale.set(.055,.026,.065);o.rotation.x=-a;}
 const cap=turned(drag,[[0,.395],[.21,.395],[.267,.409],[.281,.433],[.279,.462],[.258,.487],[.20,.503],[0,.503]],M.graphite,'Front drag adjustment knob');
 torus(drag,.261,.009,M.gunmetal,'Drag knob rim',.486);
 const grip=add(drag,new T.CapsuleGeometry(.038,.27,6,16),M.gunmetal,'Drag knob finger ridge',.506,0,0);grip.rotation.x=Math.PI/2;
 for(let i=0;i<18;i++){const a=i*Math.PI/9;curve(drag,[[.421,Math.sin(a)*.28,Math.cos(a)*.28],[.456,Math.sin(a)*.28,Math.cos(a)*.28]],.007,M.dark,'Fine drag grip flute');}
 turned(rotor,[[.13,-.05],[.40,-.05],[.48,.025],[.54,.18],[.55,.24],[.51,.29],[.43,.27],[.33,.10],[.13,.10],[.13,-.05]],M.graphite,'Contoured rotor hub');
 // Elliptical sections taper continuously toward the existing bail hinges.
 function sweptArm(sign){
  const path=new T.CatmullRomCurve3([[.10,-.03,sign*.42],[.39,-.08,sign*.69],[.82,-.06,sign*.99],[1.13,.06,sign*1.04],[1.25,.15,sign*1.02]].map(v=>new T.Vector3(...v))),steps=48,sides=16,pos=[],idx=[];
  for(let i=0;i<=steps;i++){const t=i/steps,p=path.getPoint(t),v=path.getTangent(t),u=new T.Vector3(0,1,0).addScaledVector(v,-v.y).normalize(),w=new T.Vector3().crossVectors(v,u),width=(sign<0?.14:.11)*(1-.48*t)+.045*Math.sin(Math.PI*t),thick=.075-.032*t;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,q=p.clone().addScaledVector(u,Math.cos(a)*width).addScaledVector(w,Math.sin(a)*thick);pos.push(q.x,q.y,q.z);}}
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return add(rotor,g,sign<0?M.graphite:M.gunmetal,sign<0?'Sculpted line roller rotor arm':'Slim opposing bail rotor arm');
 }
 const arms=[sweptArm(-1),sweptArm(1)];
 for(const sign of [-1,1]){const pivot=add(rotor,new T.CylinderGeometry(.114,.105,.088,40),M.graphite,'Bail hinge housing',1.25,.15,sign*1.02);pivot.rotation.x=Math.PI/2;torus(rotor,.075,.012,M.gunmetal,'Bail hinge bearing bezel',1.25,.15,sign*1.073,'z');}
 // A forged taper connects the existing handle spindle to the knob spindle.
 const armShape=new T.Shape();armShape.moveTo(.10,.04);armShape.bezierCurveTo(-.14,-.08,-.42,-.42,-.87,-.54);armShape.quadraticCurveTo(-1.00,-.61,-.88,-.73);armShape.bezierCurveTo(-.40,-.69,-.12,-.30,.08,-.10);armShape.quadraticCurveTo(.14,-.03,.10,.04);armShape.closePath();
 casting(handle,armShape,.095,.026,M.aluminium,'Forged tapered crank arm',.33);
 for(const [x,y,z,r,length] of [[0,0,.20,.11,.28],[-.85,-.65,.57,.079,.43]]){const spindle=add(handle,new T.CylinderGeometry(r,r,length,48),M.gunmetal,'Handle spindle shoulder',x,y,z);spindle.rotation.x=Math.PI/2;}
 torus(handle,.105,.012,M.gold,'Handle hub seal',0,0,.34,'z');
 const knob=add(handle,new T.SphereGeometry(1,48,32),M.rubber,'Oval rubber paddle grip',-.85,-.65,.88);knob.scale.set(.32,.145,.165);knob.rotation.z=.55;
 const endCap=add(handle,new T.SphereGeometry(1,32,20),M.dark,'Inset grip end cap',-.85,-.65,1.032);endCap.scale.set(.15,.078,.018);endCap.rotation.z=.55;
 return {body,spool,rotor,handle,drag,materials,parts:{casing,foot,rearLip,frontCup,cap,knob,arms}};
}
