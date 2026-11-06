
export function buildSewingMachine(T, M = {}) {
  const group = new T.Group();
  group.name = "VISUAL NEWSIS / Sewing Machine";
  const MM = 0.045;
  const PI2 = Math.PI * 2;
  const N = new T.Vector3(-0.85, 0, 0);
  const H = new T.Vector3(-0.85, 0.66, -0.42);
  const mint = new T.MeshStandardMaterial({
    color: 0x00b4c9, roughness: 0.52
  });
  const gold = new T.MeshStandardMaterial({
    color: 0xd8af58, metalness: 0.28, roughness: 0.45
  });
  const ivory = M.ivory?.clone() || new T.MeshStandardMaterial({
    color: 0xe9e3d6, metalness: 0.16, roughness: 0.36
  });
  const steel = M.steel?.clone() || new T.MeshStandardMaterial({
    color: 0xb8c2c2, metalness: 0.86, roughness: 0.27
  });
  const brass = M.brass?.clone() || new T.MeshStandardMaterial({
    color: 0xb79a60, metalness: 0.78, roughness: 0.32
  });
  const wood = M.wood?.clone() || new T.MeshStandardMaterial({
    color: 0x403025, roughness: 0.74
  });
  const black = M.black?.clone() || new T.MeshStandardMaterial({
    color: 0x202a2b, metalness: 0.3, roughness: 0.55
  });
  const felt = M.felt?.clone() || new T.MeshStandardMaterial({
    color: 0x344f4d, roughness: 0.94, side: T.DoubleSide
  });
  const red = M.red?.clone() || new T.MeshStandardMaterial({
    color: 0x88433b, roughness: 0.55
  });
  const glass = steel.clone();
  glass.transparent = true;
  glass.opacity = 0.25;

  const parts = {};
  const anchors = {};
  const covers = new T.Group();
  const mechanism = new T.Group();
  const needle = new T.Group();
  const presser = new T.Group();
  const feed = new T.Group();
  const hook = new T.Group();
  const bobbinCase = new T.Group();
  const bobbin = new T.Group();
  const fabric = new T.Group();
  const takeup = new T.Group();
  const threads = new T.Group();

  function mesh(parent, geometry, material, name, x=0, y=0, z=0) {
    const o = new T.Mesh(geometry, material);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function cylinder(parent, rt, rb, h, material, name, x, y, z, n=24) {
    return mesh(parent, new T.CylinderGeometry(rt, rb, h, n),
      material, name, x, y, z);
  }
  function sphere(parent, r, material, name, x, y, z) {
    return mesh(parent, new T.SphereGeometry(r, 12, 8),
      material, name, x, y, z);
  }
  function rod(parent, a, b, r, material, name) {
    const A = new T.Vector3(...a), B = new T.Vector3(...b);
    const d = new T.Vector3().subVectors(B, A);
    const o = cylinder(parent, r, r, d.length(), material, name,
      (A.x+B.x)/2, (A.y+B.y)/2, (A.z+B.z)/2, 12);
    o.quaternion.setFromUnitVectors(
      new T.Vector3(0,1,0), d.normalize()
    );
    return o;
  }
  function tube(parent, points, radius, material, name, closed=false) {
    const curve = new T.CatmullRomCurve3(
      points.map(v => new T.Vector3(...v)), closed, "centripetal"
    );
    return mesh(parent, new T.TubeGeometry(
      curve, Math.max(12, points.length*6), radius, 6, closed
    ), material, name);
  }
  function rounded(parent, w, h, d, radius, material, name, x, y, z) {
    const s = new T.Shape(), a=-w/2, b=-h/2;
    const r=Math.min(radius,w/2,h/2);
    s.moveTo(a+r,b);
    s.lineTo(a+w-r,b); s.quadraticCurveTo(a+w,b,a+w,b+r);
    s.lineTo(a+w,b+h-r); s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);
    s.lineTo(a+r,b+h); s.quadraticCurveTo(a,b+h,a,b+h-r);
    s.lineTo(a,b+r); s.quadraticCurveTo(a,b,a+r,b);
    const g = new T.ExtrudeGeometry(s, {
      depth:d, bevelEnabled:true, bevelSegments:3,
      steps:1, bevelSize:0.025, bevelThickness:0.025,
      curveSegments:8
    });
    return mesh(parent,g,material,name,x,y,z-d/2);
  }
  function torus(parent, radius, thickness, material, name, x,y,z) {
    const o=mesh(parent,new T.TorusGeometry(
      radius,thickness,8,48
    ),material,name,x,y,z);
    o.rotation.x=Math.PI/2;
    return o;
  }
  function screw(parent,x,y,z) {
    const s=cylinder(parent,.038,.038,.012,steel,"Slotted screw",x,y,z,12);
    const slot=mesh(parent,new T.BoxGeometry(.055,.006,.009),
      black,"Screw slot",x,y+.009,z);
    return {s,slot};
  }
  function smooth(a,b,x) {
    const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  function pathLine(parent,material,name,radius=.009) {
    const obj=mesh(parent,new T.BufferGeometry(),material,name);
    obj.userData.radius=radius;
    return obj;
  }
  function setPath(obj,points) {
    if (points.length<2) return;
    const vec=points.map(p=>new T.Vector3(...p));
    const curve=new T.CatmullRomCurve3(vec,false,"centripetal");
    const geometry=new T.TubeGeometry(
      curve,Math.max(12,(vec.length-1)*6),
      obj.userData.radius,5,false
    );
    obj.geometry.dispose();
    obj.geometry=geometry;
  }

  // One continuous cast C-shaped arm/head/pillar shell.
  const bodyShape=new T.Shape();
  bodyShape.moveTo(-1.43,1.98);
  bodyShape.bezierCurveTo(-1.53,2.02,-1.55,2.30,-1.51,2.59);
  bodyShape.bezierCurveTo(-1.48,2.96,-1.21,3.17,-.88,3.20);
  bodyShape.lineTo(1.78,3.20);
  bodyShape.bezierCurveTo(2.07,3.19,2.23,3.02,2.23,2.72);
  bodyShape.lineTo(2.23,1.16);
  bodyShape.quadraticCurveTo(2.23,.98,2.04,.98);
  bodyShape.lineTo(1.43,.98);
  bodyShape.quadraticCurveTo(1.29,.98,1.29,1.15);
  bodyShape.lineTo(1.29,2.17);
  bodyShape.quadraticCurveTo(1.29,2.32,1.12,2.32);
  bodyShape.lineTo(-.89,2.32);
  bodyShape.quadraticCurveTo(-1.12,2.32,-1.16,2.10);
  bodyShape.quadraticCurveTo(-1.19,1.96,-1.43,1.98);
  const body=mesh(covers,new T.ExtrudeGeometry(bodyShape,{
    depth:.82,bevelEnabled:true,bevelSize:.075,
    bevelThickness:.07,bevelSegments:5,curveSegments:16
  }),ivory,"Continuous C-shaped cast body",0,0,-.42);
  rounded(covers,1.04,.43,.86,.15,ivory,
    "Needle head cover",-1.13,2.19,.02);
  rounded(covers,.83,1.35,.94,.16,ivory,
    "Right column casing",1.80,1.79,0);
  rounded(group,4.5,.31,2.6,.24,wood,
    "Wood plinth",.1,.13,0);
  rounded(group,4.32,.19,2.42,.18,ivory,
    "Machine bed",.1,.93,0);
  rounded(group,1.92,.035,1.12,.095,steel,
    "Throat plate",-1.0,1.035,0);
  rounded(group,3.98,.045,2.18,.13,black,
    "Bed inset",.1,.815,0);

  // Plate: real openings cut from geometry, not painted markings.
  const plateShape=new T.Shape();
  plateShape.moveTo(-1.82,-.52);
  plateShape.lineTo(-.15,-.52);
  plateShape.quadraticCurveTo(-.10,-.52,-.10,-.47);
  plateShape.lineTo(-.10,.47);
  plateShape.quadraticCurveTo(-.10,.52,-.15,.52);
  plateShape.lineTo(-1.82,.52);
  plateShape.quadraticCurveTo(-1.88,.52,-1.88,.46);
  plateShape.lineTo(-1.88,-.46);
  plateShape.quadraticCurveTo(-1.88,-.52,-1.82,-.52);
  function hole(x,z,w,d) {
    const h=new T.Path();
    h.moveTo(x-w/2,z-d/2);
    h.lineTo(x+w/2,z-d/2);
    h.lineTo(x+w/2,z+d/2);
    h.lineTo(x-w/2,z+d/2);
    h.closePath();
    plateShape.holes.push(h);
  }
  hole(-.85,0,.095,.13);
  for (const x of [-1.05,-.65]) {
    hole(x,-.24,.075,.31);
    hole(x,.24,.075,.31);
  }
  const plateGeometry=new T.ExtrudeGeometry(plateShape,{
    depth:.028,bevelEnabled:false,curveSegments:12
  });
  plateGeometry.rotateX(Math.PI/2);
  // After rotateX(+90), extrusion extends toward -Y.
  mesh(group,plateGeometry,steel,"Perforated needle plate",
    0,1.05,0);
  for (const x of [-1.72,-.22]) {
    for (const z of [-.42,.42]) screw(group,x,1.056,z);
  }

  // Needle: eye is local origin; all movement is applied to this group.
  needle.position.set(N.x,1.65,N.z);
  cylinder(needle,.026,.026,.81,steel,
    "Needle shank",0,.49,0,16);
  cylinder(needle,.012,.012,.38,steel,
    "Needle blade",0,.02,0,12);
  const eyeRing=torus(needle,.025,.009,steel,
    "Actual needle eye rim",0,0,0);
  eyeRing.rotation.set(0,0,Math.PI/2);
  rod(needle,[0,-.16,0],[0,-.038,0],
    .011,steel,"Needle point");
  // Scarf is behind the needle (-Z); thread enters from +Z.
  const scarf=mesh(needle,new T.SphereGeometry(
    .017,12,8,0,PI2,0,Math.PI
  ),black,"Rear needle scarf",0,.073,-.012);
  scarf.scale.set(.75,2.8,.4);
  needle.userData.eyeLocal=new T.Vector3(0,0,0);
  needle.userData.tipLocal=new T.Vector3(0,-.16,0);
  group.add(needle);
  rod(mechanism,[-.85,2.48,0],[-.85,1.93,0],
    .082,steel,"Needle bar upper guide");

  // Presser-foot shank, fork, sole and lifted toe.
  rod(presser,[-.61,2.35,.12],[-.61,1.19,.12],
    .054,steel,"Presser bar");
  rod(presser,[-.61,1.25,.12],[-.77,1.16,.12],
    .065,steel,"Presser bracket");
  const sole=rounded(presser,.48,.035,.57,.065,
    steel,"Presser foot sole",-.85,1.135,.08);
  sole.rotation.x=-Math.PI/2;
  for (const x of [-1.04,-.66]) {
    rod(presser,[x,1.13,-.19],[x,1.13,.19],
      .045,steel,"Split presser sole");
  }
  rod(presser,[-1.05,1.14,.19],[-1.04,1.22,.36],
    .04,steel,"Presser foot raised toe");
  sphere(presser,.074,brass,"Presser screw",-.61,1.28,.26);
  group.add(presser);

  // Four-motion feed dogs; slots remain stationary in the plate.
  for (const x of [-1.05,-.65]) {
    for (const z0 of [-.24,.24]) {
      const dog=rounded(feed,.066,.27,.055,.012,
        steel,"Feed dog tooth bar",x,0,z0);
      dog.rotation.x=-Math.PI/2;
      for(let k=0;k<5;k++) {
        const z=z0-.115+k*.057;
        rod(feed,[x-.03,.036,z],[x+.03,.036,z],
          .011,steel,"Feed tooth ridge");
      }
    }
  }
  feed.position.set(0,.995,0);
  group.add(feed);

  // Horizontal-axis-y rotary hook: body below Y=.82.
  hook.position.copy(H);
  torus(hook,.267,.052,steel,"Rotary hook race",0,.075,0);
  torus(hook,.337,.018,brass,"Rotary outer race",0,.064,0);
  const crescent=[];
  for(let i=0;i<=14;i++) {
    const a=-.45+i/14*1.25;
    crescent.push([.34*Math.sin(a),.073,.34*Math.cos(a)]);
  }
  tube(hook,crescent,.032,steel,"Rotary hook crescent");
  tube(hook,[
    [-.065,.09,.285],[-.038,.13,.325],
    [-.01,.18,.367],[0,.21,.38]
  ],.008,steel,"Hook beak",false);
  sphere(hook,.008,steel,"Hook actual tip",0,.21,.38);
  group.add(hook);

  // Stationary bobbin case, centred at Y=.66.
  bobbinCase.position.copy(H);
  cylinder(bobbinCase,.205,.205,.155,black,
    "Fixed bobbin case",0,0,0,48);
  cylinder(bobbinCase,.181,.181,.012,steel,
    "Bobbin case upper rim",0,.084,0,48);
  torus(bobbinCase,.218,.013,steel,
    "Case retaining race",0,.078,0);
  // Stop finger and the deliberately open thread passage.
  rod(bobbinCase,[.20,.10,-.10],[.29,.10,-.10],
    .017,steel,"Case rotation stop finger");
  rod(mechanism,[-.56,.76,-.52],[-.60,.76,-.52],
    .025,steel,"Stationary stop bracket");
  rod(bobbinCase,[.08,.11,.17],[.14,.13,.205],
    .013,brass,"Case tension spring");
  sphere(bobbinCase,.028,brass,
    "Case tension screw",.13,.132,.19);
  group.add(bobbinCase);

  bobbin.position.copy(H);
  cylinder(bobbin,.132,.132,.08,brass,
    "Bobbin wound thread core",0,.017,0,32);
  cylinder(bobbin,.165,.165,.012,steel,
    "Upper bobbin flange",0,.062,0,40);
  cylinder(bobbin,.165,.165,.012,steel,
    "Lower bobbin flange",0,-.033,0,40);
  for(let i=0;i<9;i++) {
    torus(bobbin,.14+i*.002,.0028,gold,
      "Gold thread winding",0,-.018+i*.009,0);
  }
  group.add(bobbin);

  // Handwheel, shaft, flywheel rim, hub and handle.
  const fly=new T.Group();
  fly.position.set(2.24,2.65,0);
  fly.rotation.z=Math.PI/2;
  torus(fly,.33,.047,black,"Handwheel rim",0,0,0);
  cylinder(fly,.095,.095,.13,brass,
    "Handwheel centre hub",0,0,0,32);
  for(let i=0;i<6;i++) {
    const a=i*PI2/6;
    rod(fly,[0,0,0],[Math.cos(a)*.31,0,Math.sin(a)*.31],
      .024,steel,"Handwheel spoke");
  }
  rod(fly,[.24,.025,0],[.24,.19,0],
    .035,wood,"Handwheel grip");
  mechanism.add(fly);

  // Spool spindle and wound upper thread.
  rod(mechanism,[.88,3.18,.04],[.88,3.67,.04],
    .027,brass,"Spool spindle");
  cylinder(mechanism,.17,.17,.35,black,
    "Thread spool",.88,3.44,.04,32);
  for(let i=0;i<18;i++) {
    torus(mechanism,.174,.004,mint,
      "Mint spool winding",.88,3.27+i*.019,.04);
  }
  cylinder(mechanism,.185,.185,.025,brass,
    "Spool upper flange",.88,3.64,.04);
  rod(mechanism,[.88,3.71,.04],[.88,3.73,.04],
    .065,brass,"Spool retaining cap");

  // Upper thread guides, twin tension discs and check spring.
  const guidePositions=[
    [.63,3.05,.45],[-1.08,2.97,.49],
    [-1.39,2.57,.53],[-1.14,2.18,.51],
    [-.85,1.84,.30]
  ];
  for(let i=0;i<guidePositions.length;i++) {
    const [x,y,z]=guidePositions[i];
    const g=torus(mechanism,.045,.012,steel,
      "Upper thread guide "+i,x,y,z);
    g.rotation.set(0,0,Math.PI/2);
  }
  for(const z of [.59,.635]) {
    const disc=cylinder(mechanism,.115,.115,.018,steel,
      "Tension disc",-1.39,2.55,z,36);
    disc.rotation.x=Math.PI/2;
  }
  sphere(mechanism,.082,brass,"Tension knob",
    -1.39,2.55,.71);
  tube(mechanism,[
    [-1.39,2.46,.61],[-1.49,2.38,.65],
    [-1.41,2.32,.64],[-1.34,2.38,.62]
  ],.011,steel,"Check spring");
  screw(mechanism,-1.33,2.35,.62);

  // Take-up lever: its eye moves at the externally provided Y.
  rod(takeup,[-1.13,-.20,.53],[-1.31,0,.57],
    .038,steel,"Take-up lever");
  torus(takeup,.042,.012,steel,
    "Moving take-up eye",-1.31,0,.57);
  takeup.position.y=2.8;
  mechanism.add(takeup);

  // Stitching scrap: two distinct fabric layers.
  fabric.position.set(-.85,1.08,.8);
  const clothTop=felt.clone();
  const clothBottom=felt.clone();
  clothBottom.color.multiplyScalar(.73);
  clothTop.transparent=true;
  clothBottom.transparent=true;
  const topSheet=rounded(fabric,1.3,.018,4.4,.045,
    clothTop,"Upper fabric layer",0,.021,0);
  const bottomSheet=rounded(fabric,1.3,.018,4.4,.045,
    clothBottom,"Lower fabric layer",0,-.03,0);
  topSheet.rotation.x=-Math.PI/2;
  bottomSheet.rotation.x=-Math.PI/2;
  // Local needle entry is z=-.8; the moving cloth translates below it.
  const seamTop=new T.Group(), seamBottom=new T.Group();
  fabric.add(seamTop,seamBottom);
  group.add(fabric);

  const upper=pathLine(threads,mint,"Continuous upper thread",.008);
  const upperLoopA=pathLine(threads,mint,"Upper loop upper race",.009);
  const upperLoopB=pathLine(threads,mint,"Upper loop lower race",.009);
  const lower=pathLine(threads,gold,"Continuous bobbin thread",.008);
  group.add(threads,mechanism,covers);

  const eyePos=new T.Vector3();
  const tipPos=new T.Vector3();
  const hookPos=new T.Vector3();
  const localTip=new T.Vector3(0,.21,.38);
  anchors.needleEye=eyePos;
  anchors.needleTip=tipPos;
  anchors.hookTip=hookPos;

  // Fixed maximum of twelve stitches, with reusable line buffers.
  const seamSegments=[];
  function seamGeometry(parent,material,name) {
    const geometry=new T.BufferGeometry();
    const arr=new Float32Array(6);
    geometry.setAttribute("position",
      new T.BufferAttribute(arr,3));
    const line=new T.Line(geometry,new T.LineBasicMaterial({
      color:material.color,linewidth:1
    }));
    line.name=name;
    parent.add(line);
    return line;
  }
  for(let i=0;i<12;i++) {
    seamSegments.push({
      top:seamGeometry(seamTop,mint,"Top lockstitch "+i),
      bottom:seamGeometry(seamBottom,gold,"Bottom lockstitch "+i)
    });
  }
  function segment(line,a,b,visible) {
    line.visible=visible;
    if(!visible)return;
    const p=line.geometry.attributes.position;
    p.setXYZ(0,...a); p.setXYZ(1,...b);
    p.needsUpdate=true;
    line.geometry.computeBoundingSphere();
  }
  function updateSeam(stitches) {
    let distance=0;
    for(let i=0;i<12;i++) {
      const length=Number(stitches[i]);
      const exists=Number.isFinite(length)&&length>0;
      const s=seamSegments[i];
      if(exists) {
        const a=-.8+distance*MM;
        distance+=length;
        const b=-.8+distance*MM;
        segment(s.top,[0,.041,a],[0,.041,b],true);
        segment(s.bottom,[0,-.051,a],[0,-.051,b],true);
      } else {
        segment(s.top,[0,0,0],[0,0,0],false);
        segment(s.bottom,[0,0,0],[0,0,0],false);
      }
    }
  }

  function update(state={}) {
    const p=((Number(state.phase)||0)%1+1)%1;
    const length=Math.max(2,Math.min(5,Number(state.length)||2.5));
    const travel=Math.max(0,Number(state.travel)||0);
    const progress=smooth(.84,.96,p);
    const eyeY=Number.isFinite(state.eyeY)
      ? state.eyeY : 1.20+.45*Math.cos(PI2*p);
    const tipY=Number.isFinite(state.tipY)
      ? state.tipY : eyeY-.16;

    needle.position.set(N.x,eyeY,N.z);
    needle.updateWorldMatrix(true,false);
    needle.localToWorld(eyePos.copy(needle.userData.eyeLocal));
    needle.localToWorld(tipPos.copy(needle.userData.tipLocal));
    // Contract requires tipY=eyeY-.16; anchor follows the physical mesh.
    if(Math.abs(tipY-(eyeY-.16))>1e-5) {
      needle.userData.tipYConflict=tipY;
    } else {
      delete needle.userData.tipYConflict;
    }

    const angle=Number.isFinite(state.hookAngle)
      ? state.hookAngle : 4*Math.PI*(p-.58);
    hook.rotation.y=angle;
    hook.updateWorldMatrix(true,false);
    hook.localToWorld(hookPos.copy(localTip));

    takeup.position.y=Number.isFinite(state.takeupY)
      ? state.takeupY : 2.64+.28*Math.cos(PI2*(p-.88));
    feed.position.y=Number.isFinite(state.feedY)
      ? state.feedY : .995+(.065*smooth(.81,.85,p)
        *(1-smooth(.96,1,p)));
    feed.position.z=Number.isFinite(state.feedZ)
      ? state.feedZ : progress*length*MM;

    fabric.position.set(-.85,1.08,
      .8-(travel+length*progress)*MM);
    updateSeam(Array.isArray(state.stitches)?state.stitches:[]);

    // Finished case stays fixed; wound bobbin turns only on recovery.
    bobbin.rotation.y=smooth(.83,.94,p)*.12;
    fly.rotation.y=angle/2;

    const cut=Math.max(0,Math.min(1,Number(state.cutaway)||0));
    covers.visible=cut<.95;
    covers.traverse(o=>{
      if(o.isMesh) {
        o.material.transparent=cut>0;
        o.material.opacity=cut>0?1-cut:1;
        o.material.depthWrite=cut<.5;
      }
    });
    clothTop.opacity=1-cut*.53;
    clothBottom.opacity=1-cut*.65;

    // Spool -> guides -> tension discs -> check spring ->
    // take-up eye -> needle guide -> eye. Every joint is continuous.
    const takeupEye=[-1.31,takeup.position.y,.57];
    const eye=[eyePos.x,eyePos.y,eyePos.z];
    const fixedUpper=[
      [.88,3.47,.22],[.88,3.74,.04],
      [.63,3.05,.45],[-1.08,2.97,.49],
      [-1.39,2.57,.59],[-1.39,2.55,.613],
      [-1.41,2.35,.64],[-1.14,2.18,.51],
      takeupEye,[-.85,1.84,.30],
      [-.85,eyeY+.12,.10],[-.85,eyeY,.025],
      eye
    ];

    const loopAmount=Math.max(0,Math.min(1,
      Number.isFinite(state.loop)?state.loop:
      smooth(.50,.58,p)*(1-smooth(.80,.94,p))
    ));
    const carry=Math.max(0,Math.min(1,
      Number.isFinite(state.carry)?state.carry:
      smooth(.58,.82,p)
    ));
    const recover=Math.max(0,Math.min(1,
      Number.isFinite(state.recover)?state.recover:
      smooth(.83,.94,p)
    ));

    const hookX=hookPos.x, hookZ=hookPos.z;
    const rear=[N.x,eyeY,-.045];
    const entry=[N.x,Math.min(eyeY-.07,.88),-.065];
    const loopPeak=Math.min(.88,eyeY+.08);

    // The upper-thread loop has two spatial branches.
    // One passes over the stationary case; the other travels below
    // the case through the race clearance and stop-finger gap.
    const upperRace=[
      entry,
      [N.x-.07,.87,-.13],
      [hookX-.12,.875,hookZ+.16],
      [hookX-.20,.865,hookZ-.08],
      [hookX-.12,.86,hookZ-.29],
      [hookX,.86,hookZ-.35],
      [hookX+.20,.85,hookZ-.25]
    ];
    const lowerRace=[
      entry,
      [N.x+.04,.82,-.10],
      [hookX+.20,.79,hookZ+.13],
      [hookX+.28,.77,hookZ-.10],
      [hookX+.22,.745,hookZ-.29],
      [hookX+.05,.745,hookZ-.36],
      [hookX-.13,.745,hookZ-.26],
      [hookX-.23,.765,hookZ-.08],
      [hookX-.22,.83,hookZ+.14]
    ];

    const conceptLoop=loopAmount*(1-recover);
    const upperPath=fixedUpper.slice();
    if(conceptLoop>.001) {
      upperPath.push(
        rear,
        [N.x,loopPeak,-.05-conceptLoop*.07],
        [N.x-.04,.83,-.10-conceptLoop*.13],
        [hookX, .85, hookZ+.38]
      );
    } else {
      upperPath.push(
        [N.x,Math.min(eyeY-.10,1.05),0],
        [N.x,1.09,0]
      );
    }
    setPath(upper,upperPath);

    const branchVisibility=conceptLoop*smooth(.56,.65,p);
    upperLoopA.visible=branchVisibility>.005;
    upperLoopB.visible=branchVisibility>.005;

    if(branchVisibility>.005) {
      const endA=Math.max(1,Math.round(carry*(upperRace.length-1)));
      const endB=Math.max(1,Math.round(carry*(lowerRace.length-1)));
      const A=upperRace.slice(0,endA+1);
      const B=lowerRace.slice(0,endB+1);
      A[0]=[N.x,.83,-.06];
      B[0]=[N.x,.83,-.06];
      setPath(upperLoopA,A);
      setPath(upperLoopB,B);
    }

    // Bobbin -> tension spring -> underside of two-layer cloth.
    const exit=[
      [H.x,.72,H.z],[H.x+.14,.79,H.z+.18],
      [H.x+.18,.80,H.z+.25],
      [-.85,.94,-.11],[-.85,1.024,0],
      [-.85,1.05,0]
    ];
    setPath(lower,exit);

    upperLoopA.material.opacity=branchVisibility;
    upperLoopB.material.opacity=branchVisibility;
    upperLoopA.material.transparent=true;
    upperLoopB.material.transparent=true;
    upperLoopA.material.depthWrite=false;
    upperLoopB.material.depthWrite=false;

    // A single model state drives all transforms and thread paths.
    group.userData.phase=p;
    group.userData.feedProgress=progress;
    group.userData.travel=travel;
    group.userData.stitchLength=length;
    group.userData.loop=loopAmount;
    group.userData.cutaway=cut;
    return group;
  }

  parts.needle=needle;
  parts.presser=presser;
  parts.feed=feed;
  parts.hook=hook;
  parts.bobbinCase=bobbinCase;
  parts.bobbin=bobbin;
  parts.fabric=fabric;
  parts.takeup=takeup;
  parts.covers=covers;
  parts.mechanism=mechanism;
  parts.threads=threads;

  update({
    phase:0,eyeY:1.65,tipY:1.49,
    hookAngle:4*Math.PI*(0-.58),
    takeupY:2.8,feedZ:0,feedY:.995,
    loop:0,carry:0,recover:0,
    length:2.5,travel:0,stitches:[],cutaway:0
  });

  return {
    group,
    eye:[5,3.7,7],
    parts,
    anchors,
    update
  };
}
