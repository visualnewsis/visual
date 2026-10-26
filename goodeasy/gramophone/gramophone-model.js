// VISUAL NEWSIS · 굳이구지 / Gramophone mechanical model
// Pure Three.js geometry factory. Animation/audio/rendering are owned by the caller.
export function buildGramophone(T, M) {
  const group = new T.Group(); group.name = 'Gramophone';
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const P = V(1.72, 1.5, -0.62), C = V(0, 1.23, 0);
  const outerRadius = 1.24, innerRadius = 0.43, armLength = 1.7;
  const mat = (name, color, metalness = 0, roughness = .6) => {
    const m = M?.[name]?.clone() || new T.MeshStandardMaterial({color, metalness, roughness});
    return m;
  };
  const wood = mat('wood', 0x57351f), darkWood = mat('darkWood', 0x2c1a13);
  const brass = mat('brass', 0xb38a49, .83, .3), steel = mat('steel', 0x888b8d, .77, .35);
  const black = mat('black', 0x171716, .15, .65), felt = mat('felt', 0x232c26);
  const ivory = mat('ivory', 0xe4d3a5), red = mat('red', 0x71332b);
  wood.color.setHex(0x91613f); darkWood.color.setHex(0x3c2419);
  wood.clearcoat=.08;wood.roughness=.65;darkWood.clearcoat=.05;darkWood.roughness=.7;
  black.metalness=.04; black.roughness=.72; black.clearcoat=0;
  const innerBrass = brass.clone(); innerBrass.color.multiplyScalar(.58); innerBrass.side=T.DoubleSide;
  const grooveMat = new T.LineBasicMaterial({color:0x77736b, transparent:true, opacity:.33});
  const make = (geometry, material, parent, name) => {
    const mesh = new T.Mesh(geometry, material); mesh.name = name || ''; parent.add(mesh); return mesh;
  };
  const box = (w,h,d,material,parent,x,y,z,name) => {
    const m = make(new T.BoxGeometry(w,h,d),material,parent,name); m.position.set(x,y,z); return m;
  };
  const cyl = (rt,rb,h,material,parent,x,y,z,name,n=32) => {
    const m = make(new T.CylinderGeometry(rt,rb,h,n),material,parent,name);
    m.position.set(x,y,z); return m;
  };
  const ball = (r,material,parent,x,y,z,name) => {
    const o=make(new T.SphereGeometry(r,12,8),material,parent,name); o.position.set(x,y,z); return o;
  };
  const rod = (a,b,r,material,parent,name,segments=10) => {
    const dir=b.clone().sub(a), o=make(new T.CylinderGeometry(r,r,dir.length(),segments),material,parent,name);
    o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize()); return o;
  };
  const tube = (points,r,material,parent,name,segments=42) =>
    make(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,10,false),material,parent,name);
  const ring = (major,tubeRadius,material,parent,x,y,z,name) => {
    const o=make(new T.TorusGeometry(major,tubeRadius,8,56),material,parent,name);
    o.position.set(x,y,z); o.rotation.x=Math.PI/2; return o;
  };
  // Wood cabinet: top plate and the motor compartment remain physically adjacent.
  const cabinet = new T.Group(); cabinet.name='Cabinet'; group.add(cabinet);
  // Four real panels, not a solid box hiding the inspection motor.
  box(3.8,.91,.12,wood,cabinet,0,.58,-1.64,'rear wood panel');
  box(3.8,.91,.12,wood,cabinet,0,.58,1.64,'front wood panel');
  for(const x of [-1.84,1.84]) box(.12,.91,3.16,wood,cabinet,x,.58,0,'side wood panel');
  box(3.8,.11,3.4,darkWood,cabinet,0,.08,0,'bottom board');
  const top = new T.Group(); top.name='Cabinet lid / inspection layer'; cabinet.add(top);
  box(3.84,.17,3.44,darkWood,top,0,1.065,0,'top lid');
  for(const y of [.22,.3,.99]) {
    box(3.91,.035,.055,brass,cabinet,0,y,1.73);
    box(3.91,.035,.055,brass,cabinet,0,y,-1.73);
    for(const x of [-1.94,1.94]) box(.055,.035,3.44,brass,cabinet,x,y,0);
  }
  for(const x of [-1.64,1.64]) for(const z of [-1.42,1.42]) {
    const leg=box(.23,.37,.23,darkWood,cabinet,x,-.07,z,'cabinet foot');
    box(.28,.055,.28,brass,cabinet,x,-.23,z,'foot ferrule');
    box(.13,.16,.13,wood,cabinet,x,-.31,z,'foot heel');
  }
  for(const x of [-1.71,1.71]) for(const z of [-1.49,1.49]) {
    const screw=cyl(.037,.037,.013,brass,top,x,1.157,z,'lid screw',12);
    box(.048,.006,.009,darkWood,screw,0,.008,0,'screw slot');
  }
  // Turntable assembly. The record's upper playable plane is y=1.23.
  const platterLayer=new T.Group(); group.add(platterLayer);
  const record=new T.Group(); record.name='Record and rotating platter'; platterLayer.add(record);
  cyl(1.42,1.42,.055,steel,record,0,1.168,0,'platter');
  cyl(1.39,1.39,.018,felt,record,0,1.204,0,'platter felt');
  cyl(1.38,1.38,.033,black,record,0,1.2135,0,'shellac disc');
  ring(1.365,.008,black,record,0,1.233,0,'record bevel');
  cyl(.355,.355,.003,red,record,0,1.232,0,'original center label');
  ring(.339,.006,ivory,record,0,1.235,0,'label pinstripe');
  ring(.278,.002,ivory,record,0,1.235,0,'label inner border');
  cyl(.045,.045,.07,steel,record,0,1.253,0,'spindle');
  cyl(.015,.015,.075,brass,record,0,1.278,0,'spindle cap',12);
  // One draw call for many groove segments; no DOM/Canvas dependency.
  const gpts=[], turns=31.2, samples=2600;
  for(let i=0;i<samples;i++) {
    const t=i/(samples-1), radius=outerRadius-(outerRadius-innerRadius)*t;
    const tip=needlePoint(t);
    const a=Math.atan2(tip.z,tip.x)-turns*Math.PI*2*t;
    gpts.push(radius*Math.cos(a),1.2315,radius*Math.sin(a));
  }
  const grooveGeo=new T.BufferGeometry(); grooveGeo.setAttribute('position',new T.Float32BufferAttribute(gpts,3));
  record.add(new T.Line(grooveGeo,grooveMat));
  // Cabinet-side crank; it winds a separate ratchet, not the platter directly.
  const crank=new T.Group(); crank.name='Winding crank'; crank.position.set(1.96,.7,.82); group.add(crank);
  cyl(.13,.13,.055,brass,crank,0,0,0,'crank socket').rotation.z=Math.PI/2;
  const crankRotor=new T.Group(); crank.add(crankRotor); crankRotor.rotation.z=0;
  rod(V(0,0,0),V(.24,.45,0),.038,steel,crankRotor,'offset crank');
  rod(V(.24,.45,0),V(.24,.45,.19),.034,brass,crankRotor,'grip shaft');
  rod(V(.24,.45,.09),V(.24,.45,.3),.075,darkWood,crankRotor,'wood grip');
  ball(.055,brass,crankRotor,.24,.45,.3);
  // Stationary horn: collar at rear pivot, climbing toward a left/front-facing bell.
  const horn=new T.Group(); horn.name='Fixed external horn'; group.add(horn);
  const throat=V(1.72,1.7,-.62), mouth=V(-.85,3.15,.65);
  const path=new T.CatmullRomCurve3([
    throat,V(1.7,1.91,-.75),V(1.43,2.39,-.92),V(.72,2.96,-.58),mouth
  ]);
  // Surface of revolution swept along a curved axis. Exterior/interior surfaces and lip.
  const sides=64, steps=44, verts=[], uv=[], indices=[];
  function frame(t) {
    const center=path.getPoint(t), tangent=path.getTangent(t).normalize();
    let u=V(0,1,0).cross(tangent).normalize();
    if(u.lengthSq()<.01)u=V(1,0,0);
    const v=tangent.clone().cross(u).normalize(); return {center,u,v};
  }
  const radial=(t,a)=>.065+(.88-.065)*Math.pow(t,1.72)*(1+.016*Math.cos(8*a)*Math.pow(t,5));
  for(let skin=0;skin<2;skin++)for(let j=0;j<=steps;j++) {
    const t=j/steps,{center,u,v}=frame(t);
    for(let k=0;k<=sides;k++) {
      const a=2*Math.PI*k/sides,r=Math.max(.012,radial(t,a)-(skin?.022:0));
      const pos=center.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r);
      verts.push(pos.x,pos.y,pos.z); uv.push(k/sides,t);
    }
  }
  const offset=(steps+1)*(sides+1);
  for(let skin=0;skin<2;skin++)for(let j=0;j<steps;j++)for(let k=0;k<sides;k++) {
    const a=skin*offset+j*(sides+1)+k,b=a+sides+1;
    if(skin===0)indices.push(a,b,a+1,b,b+1,a+1);
    else indices.push(a,a+1,b,b,a+1,b+1);
  }
  for(let k=0;k<sides;k++) {
    const a=steps*(sides+1)+k,b=offset+a;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const hornGeo=new T.BufferGeometry(); hornGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
  hornGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); hornGeo.setIndex(indices);
  const skinIndices=steps*sides*6, lipIndices=sides*6;
  hornGeo.addGroup(0,skinIndices,0); hornGeo.addGroup(skinIndices,skinIndices,1);
  hornGeo.addGroup(2*skinIndices,lipIndices,0); hornGeo.computeVertexNormals();
  make(hornGeo,[brass,innerBrass],horn,'hollow eight-lobed brass flare');
  const f=frame(1), lipPoints=[];
  for(let k=0;k<=128;k++) {const a=k*2*Math.PI/128,r=radial(1,a);
    lipPoints.push(f.center.clone().addScaledVector(f.u,r*Math.cos(a)).addScaledVector(f.v,r*Math.sin(a)));
  }
  tube(lipPoints,.026,brass,horn,'rolled bell rim',128);
  rod(throat.clone().add(V(0,-.1,0)),throat.clone().add(V(0,.07,0)),.09,brass,horn,'horn throat collar');
  tube([V(1.8,1.15,-1.06),V(1.8,1.65,-1.06),V(1.62,2.15,-.82)],.034,steel,horn,'fixed horn support');
  ball(.085,brass,horn,1.8,1.15,-1.06,'support mounting foot');
  // Lower swivel: stationary horn -> rotating hollow tapered arm.
  cyl(.145,.145,.17,brass,group,P.x,1.53,P.z,'acoustic pivot bearing');
  ring(.14,.018,steel,group,P.x,1.65,P.z,'upper bearing ring');
  const armPivot=new T.Group(); armPivot.name='Horizontal tonearm pivot'; armPivot.position.copy(P); group.add(armPivot);
  // Geometry of the fixed-length arm in XZ. Select intersection with positive/front Z.
  function needlePoint(progress=0) {
    const q=T.MathUtils.clamp(Number.isFinite(progress)?progress:0,0,1);
    const r=outerRadius+(innerRadius-outerRadius)*q;
    const d=Math.hypot(P.x,P.z), a=(r*r-armLength*armLength+d*d)/(2*d);
    const h=Math.sqrt(Math.max(0,r*r-a*a));
    const ex=P.x/d,ez=P.z/d;
    const c1=V(a*ex-h*ez,1.23,a*ez+h*ex);
    const c2=V(a*ex+h*ez,1.23,a*ez-h*ex);
    return c1.z>=c2.z?c1:c2;
  }
  const N0=needlePoint(0), armAngle=Math.atan2(N0.z-P.z,N0.x-P.x);
  armPivot.rotation.y=-armAngle;
  // Within the pivot, local +X is the forward direction toward the needle.
  const armSwing=new T.Group(); armPivot.add(armSwing);
  const armShaft=new T.Group(); armSwing.add(armShaft);
  const tapered = (a,b,r0,r1,name) => {
    const delta=b.clone().sub(a),o=make(new T.CylinderGeometry(r1,r0,delta.length(),28,1,true),brass,armShaft,name);
    o.position.copy(a).add(b).multiplyScalar(.5);
    o.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize()); return o;
  };
  // Tube's hollow ends are visible; gooseneck hinge raises ONLY the terminal assembly.
  tapered(V(0,-.015,0),V(1.46,-.06,0),.116,.075,'hollow tapered tonearm');
  ring(.113,.012,steel,armShaft,.05,-.015,0,'tonearm swivel detail');
  const hinge=new T.Group(); hinge.name='Gooseneck lift hinge'; hinge.position.set(1.46,-.06,0); armShaft.add(hinge);
  cyl(.096,.096,.13,steel,hinge,0,0,0,'hinge knuckle').rotation.x=Math.PI/2;
  for(const z of [-.085,.085]) cyl(.043,.043,.023,brass,hinge,0,0,z,'hinge nut',10).rotation.x=Math.PI/2;
  // Baseline stylus tip: x=1.70, y=1.23 when lowered; soundbox above it.
  tube([V(0,0,0),V(.105,-.05,0),V(.13,.085,0),V(.155,.105,0)],.065,brass,hinge,'hollow terminal gooseneck',24);
  const soundbox=new T.Group(); soundbox.name='Vertical diaphragm soundbox'; soundbox.position.set(.155,.105,0); hinge.add(soundbox);
  // Diaphragm face is vertical, in YZ plane, with longitudinal (X) displacement.
  const orientX=o=>{o.rotation.z=Math.PI/2;return o;};
  orientX(cyl(.205,.205,.082,brass,soundbox,0,0,0,'soundbox rim'));
  orientX(cyl(.165,.165,.009,ivory,soundbox,.048,0,0,'vertical diaphragm'));
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4,y=.181*Math.sin(a),z=.181*Math.cos(a);
    orientX(cyl(.015,.015,.02,steel,soundbox,.049,y,z,'rim screw',10));
  }
  orientX(cyl(.063,.063,.018,black,soundbox,.056,0,0,'diaphragm center pad'));
  // Needle lever: lateral input along tangential groove motion converted to X motion.
  const lever=new T.Group(); lever.name='Soundbox needle lever'; soundbox.add(lever);
  rod(V(.055,0,0),V(.085,-.16,0),.018,steel,lever,'needle lever');
  ball(.033,brass,lever,.085,-.16,0,'lever bearing');
  rod(V(.085,-.16,0),V(.085,-.215,0),.018,steel,lever,'needle clamp');
  cyl(.028,.03,.04,brass,lever,.085,-.215,0,'needle screw',12).rotation.z=Math.PI/2;
  const stylus=rod(V(.085,-.215,0),V(.085,-.315,0),.008,steel,lever,'steel stylus');
  const stylusTip=new T.Object3D(); stylusTip.name='Stylus contact anchor'; stylusTip.position.set(.085,-.315,0); lever.add(stylusTip);
  // Positioning needs an exact local tip offset, enforced at runtime (not visual guesswork).
  const swivelAnchor=new T.Object3D(); swivelAnchor.position.set(0,0,0); armPivot.add(swivelAnchor);
  const motor=new T.Group(); motor.name='Cabinet motor inspection'; group.add(motor);
  const bedMaterial=steel.clone();bedMaterial.color.setHex(0x293436);bedMaterial.metalness=.22;bedMaterial.roughness=.7;
  box(2.66,.055,2.38,bedMaterial,motor,0,.44,0,'motor bedplate');
  const barrel=new T.Group(); barrel.name='Mainspring barrel'; barrel.position.set(-.63,.63,.12); motor.add(barrel);
  const barrelWall=make(new T.CylinderGeometry(.43,.43,.25,64,1,true),brass,barrel,'open spring barrel');barrelWall.position.y=0;
  cyl(.43,.43,.018,brass,barrel,0,-.125,0,'barrel bottom');
  const springPoints=[];for(let i=0;i<600;i++){const t=i/599,a=t*Math.PI*2*9,r=.085+.3*t;springPoints.push(r*Math.cos(a),.11,r*Math.sin(a));}
  const springGeometry=new T.BufferGeometry();springGeometry.setAttribute('position',new T.Float32BufferAttribute(springPoints,3));barrel.add(new T.Line(springGeometry,new T.LineBasicMaterial({color:0xd3d5cb})));
  ring(.38,.019,steel,barrel,0,.135,0,'barrel lid seam');
  cyl(.075,.075,.36,steel,barrel,0,0,0,'spring arbor');
  const gearA=new T.Group();gearA.name="Motor gear 20 teeth";gearA.position.set(.12,.65,.47);motor.add(gearA);
  const gearB=new T.Group();gearB.name="Motor pinion 12 teeth";gearB.position.set(.65,.65,.47);motor.add(gearB);
  function gear(parent,r,teeth) {
    cyl(r,r,.054,brass,parent,0,0,0,'gear disc');
    for(let i=0;i<teeth;i++) {
      const a=i*2*Math.PI/teeth;
      box(.075,.055,.066,brass,parent,(r+.024)*Math.cos(a),0,(r+.024)*Math.sin(a),'gear tooth').rotation.y=-a;
    }
    cyl(.065,.065,.12,steel,parent,0,0,0,'gear hub');
  }
  gear(gearA,.29,20);gear(gearB,.155,12);
  rod(V(.12,.5,.47),V(.12,.89,.47),.034,steel,motor,'gear arbor 1');
  rod(V(.65,.5,.47),V(.65,.91,.47),.031,steel,motor,'gear arbor 2');
  const spindle=rod(V(0,.5,0),V(0,1.17,0),.044,steel,motor,'platter spindle');
  const governor=new T.Group(); governor.name='Centrifugal flyweight governor'; governor.position.set(.79,.66,-.55);motor.add(governor);
  const governorSpin=new T.Group();governor.add(governorSpin);const weights=[],leaves=[];
  rod(V(0,-.28,0),V(0,.32,0),.025,steel,governorSpin,'governor spindle');
  for(let i=0;i<3;i++) {
    const a=i*2*Math.PI/3,u=Math.cos(a),v=Math.sin(a);
    const leaf=rod(V(.055*u,-.2,.055*v),V(.18*u,.12,.18*v),.014,brass,governorSpin,'leaf spring');leaves.push({leaf,u,v});
    const weight=ball(.09,steel,governorSpin,.18*u,.13,.18*v,'governor flyweight');weights.push({weight,u,v});
  }
  cyl(.2,.2,.028,steel,governorSpin,0,.31,0,'governor friction disc');
  box(.28,.035,.12,steel,motor,1.02,.99,-.55,'friction felt shoe support');
  box(.13,.028,.11,felt,motor,.91,.968,-.55,'friction pad');
  // All moving parts use a single caller-provided state, no internal clock.
  function update(state={}) {
    const angle=Number.isFinite(state.angle)?state.angle:0;
    const progress=T.MathUtils.clamp(Number.isFinite(state.progress)?state.progress:0,0,1);
    const lift=T.MathUtils.clamp(Number.isFinite(state.needleLift)?state.needleLift:1,0,1);
    const crankAngle=Number.isFinite(state.crank)?state.crank:0;
    const signal=T.MathUtils.clamp(Number.isFinite(state.signal)?state.signal:0,-1,1);
    const explode=T.MathUtils.clamp(Number.isFinite(state.explode)?state.explode:0,0,1);
    record.rotation.y=-angle;
    const target=needlePoint(progress);
    // Invariant exact in world space: swing around P and gooseneck only for lift.
    const theta=Math.atan2(target.z-P.z,target.x-P.x);
    armPivot.rotation.y=-theta;
    hinge.rotation.z=lift*.34;
    soundbox.position.set(.155,.105,0);
    // Exaggerated vibration belongs to the lever/diaphragm, not tracking radius.
    lever.rotation.y=signal*.018;
    // Down position (lift=0, signal=0) is EXACTLY the circle intersection.
    crankRotor.rotation.x=crankAngle;
    gearA.rotation.y=angle*.31;gearB.rotation.y=-gearA.rotation.y*20/12;
    governorSpin.rotation.y=angle*2.9;
    const spread=Number.isFinite(state.governorRpm)?T.MathUtils.clamp(state.governorRpm/120,0,1):.65;const wr=.08+.14*spread;
    weights.forEach(({weight,u,v})=>weight.position.set(wr*u,.13,wr*v));
    leaves.forEach(({leaf,u,v})=>{const A=V(.055*u,-.2,.055*v),B=V(wr*u,.13,wr*v),d=B.clone().sub(A);leaf.position.copy(A.add(B).multiplyScalar(.5));leaf.scale.y=d.length()/Math.hypot(.125,.32);leaf.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());});
    platterLayer.position.y=explode*.48;
    top.position.y=explode*.18;
    motor.position.y=-explode*1.3;
  }
  update();
  const anchors={stylusTip,swivel:swivelAnchor,recordCenter:C.clone(),tonearmPivot:P.clone(),hornThroat:throat.clone()};
  const spec={discCenter:[0,1.23,0],pivot:[P.x,P.y,P.z],outerRadius,innerRadius,armLength};
  return {group,eye:[5,4,7],parts:{record,tonearm:armPivot,soundbox,horn,crank,cabinet,motor},
    anchors,update,spec,needlePoint};
}
