import * as THREE from '../dmz/js/lib/three.module.min.js';

const {Vector3, Group, Mesh, Shape, MeshStandardMaterial, MeshPhysicalMaterial, BoxGeometry, CylinderGeometry, ExtrudeGeometry, Object3D, InstancedMesh, CatmullRomCurve3, TubeGeometry} = THREE;
const axisZ = new Vector3(0, 0, 1);
const axisY = new Vector3(0, 1, 0);
const v = (x, y, z = 0) => new Vector3(x, y, z);
const surface = (color, roughness = .7, metalness = .12) => new MeshStandardMaterial({color, roughness, metalness});

function add(parent, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(parent, material, x, y, z, w, h, d) {
  return add(parent, new BoxGeometry(w, h, d), material, x, y, z);
}

function cylinder(parent, material, radius, length, x, y, z, segments = 14) {
  return add(parent, new CylinderGeometry(radius, radius, length, segments), material, x, y, z);
}

function axial(parent, material, radius, length, x, y, z, segments) {
  const mesh = cylinder(parent, material, radius, length, x, y, z, segments);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function extruded(parent, material, points, depth, bevel = .025) {
  const shape = new Shape();
  shape.moveTo(...points[0]);
  for (const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, steps: 1, curveSegments: 12,
  });
  geometry.translate(0, 0, -depth / 2);
  return add(parent, geometry, material);
}

function hose(parent, material, points, radius = .025) {
  return add(parent, new TubeGeometry(new CatmullRomCurve3(points), 16, radius, 6, false), material);
}

function toolStroke(parent, paint, steel, dark, bore, volume) {
  const assembly = new Group();
  cylinder(assembly, paint, bore, volume, 0, volume / 2, 0);
  cylinder(assembly, dark, bore * 1.07, .075, 0, volume - .04, 0);
  const rod = cylinder(assembly, steel, bore * .55, 1, 0, 1, 0, 10);
  axial(assembly, dark, bore * .88, bore * 2.3, 0, 0, 0, 12);
  parent.add(assembly);
  return (from, to) => {
    const direction = to.clone().sub(from);
    const extension = direction.length() - volume;
    assembly.position.copy(from);
    assembly.quaternion.setFromUnitVectors(axisY, direction.normalize());
    rod.position.y = volume + extension / 2;
    rod.scale.y = extension;
  };
}

function beamBetween(mesh, from, to) {
  const delta = to.clone().sub(from);
  mesh.position.copy(from).lerp(to, .5);
  mesh.quaternion.setFromUnitVectors(axisY, delta.clone().normalize());
  mesh.scale.y = delta.length();
}

function drawTracks(root, colors) {
  const {armor, dark, tread, scars, steel} = colors;
  for (const z of [-1.075, 1.075]) {
    const frame = new Group();
    frame.position.set(0, .57, z);
    root.add(frame);
    const trackShape = new Shape();
    trackShape.moveTo(-1.56, -.44);
    trackShape.lineTo(1.58, -.44);
    trackShape.absarc(1.58, 0, .44, -Math.PI / 2, Math.PI / 2, false);
    trackShape.lineTo(-1.56, .44);
    trackShape.absarc(-1.56, 0, .44, Math.PI / 2, Math.PI * 1.5, false);
    const band = new ExtrudeGeometry(trackShape, {depth:.58, bevelEnabled:false, curveSegments:12});
    band.translate(0,0,-.29);
    add(frame, band, dark);
    box(frame, armor, 0, -.055, 0, 3.24, .44, .67);
    for (const [index, x] of [-1.56, -1.17, -.78, -.39, 0, .39, .78, 1.17, 1.58].entries()) {
      const end = index === 0 || index === 8;
      const radius = end ? .35 : .234;
      axial(frame, armor, radius, .66, x, end ? 0 : -.16, 0);
      for (const side of [-1,1]) {
        axial(frame, steel, radius * .61, .053, x, end ? 0 : -.16, side * .355, 12);
        if (!end) continue;
        for (let lug = 0; lug < 6; lug++) {
          const angle = lug * Math.PI / 3;
          axial(frame, scars, .028, .025,
            x + Math.cos(angle) * radius * .44, Math.sin(angle) * radius * .44,
            side * .388, 6);
        }
      }
    }
    const divisions = 46;
    const pads = new InstancedMesh(new BoxGeometry(.166,.094,.72), tread, divisions);
    const cleats = new InstancedMesh(new BoxGeometry(.023,.027,.64), scars, divisions * 3);
    const guide = new Object3D();
    const track = trackShape.getSpacedPoints(divisions);
    for (let index = 0; index < divisions; index++) {
      const point = track[index];
      const next = track[index + 1];
      const angle = Math.atan2(next.y - point.y, next.x - point.x);
      guide.position.set(point.x, point.y, 0);
      guide.rotation.set(0,0,angle);
      guide.updateMatrix();
      pads.setMatrixAt(index, guide.matrix);
      for (let rib = 0; rib < 3; rib++) {
        const offset = (rib - 1) * .045;
        guide.position.set(point.x + Math.cos(angle) * offset + Math.sin(angle) * .051,
          point.y + Math.sin(angle) * offset - Math.cos(angle) * .051, 0);
        guide.updateMatrix();
        cleats.setMatrixAt(index * 3 + rib, guide.matrix);
      }
    }
    pads.castShadow = cleats.castShadow = true;
    pads.receiveShadow = cleats.receiveShadow = true;
    frame.add(pads,cleats);
  }
  box(root, colors.armor, 0, .61, 0, 2.65, .37, 1.85);
  cylinder(root, colors.dark, .74, .25, 0, .98, 0);
  cylinder(root, colors.steel, .77, .085, 0, 1.10, 0, 32);
}

function drawUpper(turret, c) {
  const {paint, edge, armor, dark, glass, seals, steel, scars} = c;
  const ballast = extruded(turret, paint, [[-2.17,.24],[-2.2,.8],[-2.01,1.13],[-1.73,1.26],
    [-.35,1.26],[.12,.96],[.14,.27]], 2.28, .08);
  ballast.position.y = .01;
  box(turret, armor, -.55, .20, 0, 3.47,.27,2.43);
  box(turret, edge, -.73,.94,-.75,1.42,.51,.59);
  box(turret, paint, -.45,1.29,-.71,1.08,.12,.67);
  box(turret, steel, -.53,1.22,-.40,.19,.09,.12);
  cylinder(turret, dark, .073,.43,-1.48,1.41,-.62);
  cylinder(turret, armor, .098,.055,-1.48,1.65,-.62);
  for (const side of [-1,1]) {
    box(turret, armor,-1.43,.73,side*1.155,1.03,.35,.042);
    for (let slot = 0; slot < 13; slot++) {
      box(turret, scars,-1.88 + slot*.072,.73,side*1.18,.024,.25,.019);
    }
    box(turret, seals,-.79,.79,side*1.145,.023,.58,.027);
    box(turret, steel,-.67,.77,side*1.164,.11,.035,.03);
  }
  const cabX = .46;
  const cabZ = .747;
  box(turret, armor,cabX,.33,cabZ,1.50,.20,1.05);
  box(turret, paint,cabX + .055,2.02,cabZ,1.40,.12,1.04);
  box(turret, dark,cabX-.18,.72,cabZ-.03,.46,.17,.49);
  box(turret, dark,cabX-.36,1.02,cabZ-.03,.15,.54,.48);
  box(turret, armor,cabX+.46,.76,cabZ,.34,.33,.75);
  for (const [x,z] of [[-.67,-.44],[.69,-.44],[-.67,.44],[.69,.44]]) {
    box(turret, seals,cabX+x,1.23,cabZ+z,.082,1.52,.082);
  }
  const front = box(turret, glass,cabX+.70,1.30,cabZ,.024,1.23,.82);
  front.rotation.z = -.052;
  box(turret, glass,cabX-.68,1.27,cabZ,.023,1.19,.82);
  box(turret, glass,cabX,1.30,cabZ-.444,1.27,1.19,.027);
  box(turret, glass,cabX,1.30,cabZ+.446,1.27,1.19,.027);
  box(turret, seals,cabX-.22,1.28,cabZ+.474,.055,1.31,.044);
  box(turret, seals,cabX, .72,cabZ+.478,1.35,.06,.049);
  box(turret, seals,cabX,1.87,cabZ+.478,1.35,.05,.048);
  box(turret, steel,cabX+.12,.98,cabZ+.5,.17,.048,.04);
  const wiper = box(turret, seals,cabX+.735,1.12,cabZ+.21,.022,.47,.026);
  wiper.rotation.x = -.52;
  for (const x of [-.28,.23]) box(turret, edge,cabX+x,1.95,cabZ+.49,.15,.11,.13);
  box(turret, armor,cabX-.18,.38,1.439,.62,.075,.42);
  box(turret, steel,cabX-.18,.6,1.356,.62,.055,.23);
  hose(turret, steel, [v(.03,.64,1.24),v(.03,1.24,1.25),v(.18,1.34,1.25),v(.28,.74,1.25)],.033);
  hose(turret, seals, [v(1.15,1.74,1.02),v(1.34,1.86,1.19),v(1.40,1.78,1.33)],.025);
  box(turret, seals,1.4,1.73,1.34,.09,.29,.18);
}

function linkagePoint(a, b, l1, l2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx,dy);
  const axis = (l1*l1 - l2*l2 + dist*dist) / (2*dist);
  const height = Math.sqrt(Math.max(0, l1*l1 - axis*axis));
  return v(a.x + (dx*axis - dy*height)/dist, a.y + (dy*axis + dx*height)/dist, a.z);
}

export function createExcavator() {
  const root = new Group();
  const turret = new Group();
  turret.position.y = 1.11;
  root.add(turret);
  const c = {
    paint:surface(0xd79d2b,.49,.12), edge:surface(0xb98c42,.75,.24),
    armor:surface(0x424744,.67,.28), dark:surface(0x262d2e,.7,.19),
    tread:surface(0x655e50,.79,.33), scars:surface(0x8f8168,.7,.39),
    steel:surface(0xa5aba5,.32,.67), chrome:surface(0xd6ddd8,.14,.75),
    seals:surface(0x262b28,.84,.04), bucket:surface(0x625a4d,.72,.42),
    glass:new MeshPhysicalMaterial({color:0x688b91, metalness:.24, roughness:.22, transparent:true, opacity:.40, depthWrite:false, side:THREE.DoubleSide}),
  };
  drawTracks(root,c);
  drawUpper(turret,c);

  const pivot = v(.70,.64,0);
  const boomRamBase = v(.42,-.31);
  const boomLength = 4.85;
  const armLength = 2.49;
  const boom = new Group();
  const arm = new Group();
  const bucket = new Group();
  boom.position.copy(pivot);
  turret.add(boom,arm,bucket);
  extruded(boom,c.paint,[[0,-.29],[.58,-.36],[1.47,-.14],[2.64,.15],[4.05,.15],[boomLength,-.15],
    [boomLength,.17],[4.16,.57],[2.51,.74],[1.35,.49],[.48,.34],[0,.23]],.48,.07);
  extruded(arm,c.paint,[[0,-.23],[.63,-.35],[1.96,-.22],[armLength,-.12],[armLength,.15],[1.72,.32],[.55,.42],[0,.22]],.42,.05);
  for (const [node,x,y,r] of [[boom,0,0,.215],[boom,boomLength,0,.164],[arm,.44,-.15,.122],[arm,armLength,0,.118]]) {
    axial(node,c.armor,r,.64,x,y,0);
    for (const side of [-1,1]) {
      axial(node,c.steel,r*.65,.047,x,y,side*.34,12);
      axial(node,c.scars,r*.28,.013,x,y,side*.371,6);
    }
  }
  for (const side of [-1,1]) {
    hose(boom,c.seals,[v(.13,.29,side*.32),v(.94,.43,side*.31),
      v(2.39,.77,side*.31),v(3.92,.61,side*.28),v(4.64,.39,side*.24)]);
    hose(arm,c.seals,[v(.13,.30,side*.26),v(.72,.48,side*.26),v(1.49,.36,side*.246),v(2.12,.22,side*.22)]);
  }

  const shell = [[-.34,-.28],[-.56,-.53],[-.49,-.86],[-.29,-1.09],[.14,-1.16],[.66,-.99],[.78,-.87],[.62,-.87],
    [.12,-1.00],[-.22,-.94],[-.39,-.75],[-.40,-.52],[-.26,-.32]];
  extruded(bucket,c.bucket,shell,.91,.016);
  const cheek = [[-.32,.17],[-.57,-.26],[-.54,-.56],[-.42,-.91],[-.25,-1.05],[.13,-1.10],[.71,-.92],
    [.55,-.83],[.06,-.60],[-.02,-.19],[.18,.13]];
  for (const side of [-1,1]) {
    const plate = extruded(bucket,c.armor,cheek,.055,.016);
    plate.position.z = side*.467;
    axial(bucket,c.steel,.13,.06,-.012,0,side*.51,10);
  }
  for (let tooth = 0; tooth < 5; tooth++) {
    const point = extruded(bucket,c.steel,[[.53,-.98],[.67,-1.015],[.92,-.91],[.90,-.84],[.69,-.864]],.102,.012);
    point.position.z = (tooth - 2)*.181;
  }
  box(bucket,c.armor,-.16,-.14,0,.25,.41,.81);
  axial(bucket,c.dark,.095,.75,-.23,.25,0,10);

  const boomStroke = [-1,1].map(() => toolStroke(turret,c.edge,c.chrome,c.armor,.104,1.75));
  const armStroke = toolStroke(turret,c.paint,c.chrome,c.armor,.092,2.06);
  const bucketStroke = toolStroke(turret,c.edge,c.chrome,c.armor,.071,.87);
  const straps = [-1,1].map(() => [
    box(turret,c.armor,0,0,0,.068,1,.05),
    box(turret,c.edge,0,0,0,.070,1,.05),
  ]);

  function setPose(time, digging = 0, pitFacing = 0) {
    const cycle = time / 540;
    const mix = THREE.MathUtils.lerp;
    const boomAngle = mix(.74 + .145*Math.cos(cycle), .30, digging);
    const armAngle = mix(-.96 + .29*Math.sin(cycle + .35), -1.38, digging);
    const bucketAngle = mix(-.63 + .39*Math.sin(cycle - .8), -1.05, digging);
    turret.rotation.y = mix(-.29 + .21*Math.sin(time / 1100), .96 + .14*digging, pitFacing);
    const boomPoint = (x,y,z = 0) => v(x,y,z).applyAxisAngle(axisZ,boomAngle).add(pivot);
    const elbow = boomPoint(boomLength,0);
    const armPoint = (x,y,z = 0) => v(x,y,z).applyAxisAngle(axisZ,armAngle).add(elbow);
    const wrist = armPoint(armLength,0);
    const bucketPoint = (x,y,z = 0) => v(x,y,z).applyAxisAngle(axisZ,bucketAngle).add(wrist);

    boom.rotation.z = boomAngle;
    arm.position.copy(elbow);
    arm.rotation.z = armAngle;
    bucket.position.copy(wrist);
    bucket.rotation.z = bucketAngle;

    for (const [index, side] of [-1,1].entries()) {
      boomStroke[index](boomRamBase.clone().setZ(side*.348),boomPoint(1.91,-.24,side*.348));
    }
    armStroke(boomPoint(2.12,.64),armPoint(.61,.34));
    const fixed = armPoint(1.99,.25,.03);
    const lug = bucketPoint(-.23,.25,.03);
    const joint = linkagePoint(fixed,lug,.45,.40);
    bucketStroke(armPoint(.92,.30,.03),joint);
    for (const [index, side] of [-1,1].entries()) {
      const shift = v(0,0,side*.23);
      const midpoint = joint.clone().add(shift);
      beamBetween(straps[index][0],fixed.clone().add(shift),midpoint);
      beamBetween(straps[index][1],midpoint,lug.clone().add(shift));
    }
  }

  setPose(0);
  return {root,setPose};
}
