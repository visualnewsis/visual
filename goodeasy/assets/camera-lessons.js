// Camera study geometry commissioned through ChatGPT; reviewed and integrated for GOODEASY.
import {
  T,
  materials as M,
  mesh,
  box,
  cyl,
  ring,
  rod,
  tube,
  part
} from './quality-kit.js?v=20261028-craft5';

import {
  curtainWindow
} from './mechanism-checks.js?v=20261026-release3';

import {
  lightRatio
} from './research-math.js?v=20261026-release3';

const TAU = Math.PI * 2;
const N = 8;
const HALF = Math.PI / N;
const BASE_F = 2.8;
const IRIS_K = 1.568;
const SENSOR_H = 1.7;
const EPS = 1e-7;

const clamp = (v, a, b) =>
  Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : a));

const fmt = n => Number(n).toFixed(2);

function mat(color, metalness = 0, roughness = 0.5) {
  return new T.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
}

const finishSteel = mat(0x89918e, 0.86, 0.33);
const satinBlack = mat(0x20282a, 0.56, 0.43);
const edgeBlack = mat(0x0c1214, 0.32, 0.33);
const bladeMat = mat(0x303b3c, 0.68, 0.48);
const bladeAlt = mat(0x263032, 0.67, 0.48);
const ceramic = mat(0x172124, 0.14, 0.72);
const ceramicEdge = mat(0x465050, 0.34, 0.55);
const graphite = mat(0x303738, 0.58, 0.51);
const ribMetal = mat(0x576061, 0.72, 0.39);
const screwDark = mat(0x374143, 0.76, 0.4);
const guideMetal = mat(0x778181, 0.84, 0.32);
const glassCore = new T.MeshPhysicalMaterial({
  color: 0x254249,
  metalness: 0.04,
  roughness: 0.08,
  transparent: true,
  opacity: 0.42,
  depthWrite: false,
  clearcoat: 0.94,
  clearcoatRoughness: 0.09,
  side: T.FrontSide
});
const glassHighlight = mat(0x647f82, 0.22, 0.24);

function circlePlate(parent, radius, height, material, y) {
  return cyl(parent, radius, height, material, 0, y, 0);
}

function concentric(parent, radii, startY, step, material) {
  radii.forEach((radius, i) => {
    ring(parent, radius, 0.008, material, 0, startY + i * step, 0);
  });
}

function screw(parent, x, y, z, radius = 0.042) {
  const head = cyl(
    parent, radius, 0.019,
    finishSteel, x, y, z
  );

  // Cylinders face Y. The slot remains legible at small scale.
  const slot = box(
    parent,
    radius * 1.25, 0.005, 0.010,
    screwDark, x, y + 0.012, z, 0.002
  );
  slot.rotation.y = Math.PI / 5;

  return head;
}

function annulus(parent, outer, inner, y, material, depth = 0.04) {
  const shape = new T.Shape();
  shape.absarc(0, 0, outer, 0, TAU, false);

  const hole = new T.Path();
  hole.absarc(0, 0, inner, 0, TAU, true);
  shape.holes.push(hole);

  const geometry = new T.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 96
  });

  geometry.rotateX(-Math.PI / 2);
  const object = mesh(parent, geometry, material, 0, y, 0);
  return object;
}

function lensElement(parent, radius, y, bulge, material) {
  // A shallow curved front element, rather than a flat disc.
  const profile = [];
  const steps = 28;

  for (let i = 0; i <= steps; i++) {
    const r = radius * i / steps;
    const q = r / radius;
    const sag = bulge * Math.sqrt(Math.max(0, 1 - q * q));
    // Mild aspheric departure from a pure spherical cap.
    const aspheric = -bulge * 0.12 * q ** 4;
    profile.push(new T.Vector2(r, sag + aspheric));
  }

  profile.push(new T.Vector2(radius, -0.035));
  profile.push(new T.Vector2(0, -0.035));

  const geometry = new T.LatheGeometry(profile, 96);
  const element = mesh(parent, geometry, material, 0, y, 0);
  element.material.side = T.FrontSide;
  return element;
}

function constructionScrews(parent, radius, height, count = 8) {
  for (let i = 0; i < count; i++) {
    const a = TAU * (i + 0.5) / count;
    screw(
      parent,
      radius * Math.cos(a),
      height,
      radius * Math.sin(a),
      0.034
    );
  }
}

/* -----------------------------------------------------------
 * 01 — EIGHT-BLADE IRIS
 *
 * Coordinates:
 * X/Z: aperture plane
 * Y: optical axis and vertical
 *
 * The apparent polygonal opening has exact designed area:
 *
 * A = PI * (1.568 / f)^2
 *
 * For a regular octagon of apothem a:
 * A = 8 * a^2 * tan(PI/8)
 *
 * Thus:
 * a = (1.568/f) * sqrt(PI/(8*tan(PI/8)))
 *
 * The visual octagon is not falsely treated as a circle.
 * ----------------------------------------------------------- */

function irisApothem(f) {
  const equivalentRadius = IRIS_K / f;
  return equivalentRadius *
    Math.sqrt(Math.PI / (N * Math.tan(HALF)));
}

function irisBladeGeometry(index) {
  // Dynamic, preallocated six-vertex fan.
  // One inner edge belongs to one side of the regular octagon.
  // The outer extension supplies a readable overlapping vane.
  const geometry = new T.BufferGeometry();

  const positions = new Float32Array(6 * 3);
  const normals = new Float32Array(6 * 3);

  for (let i = 0; i < 6; i++) {
    normals[i * 3 + 1] = 1;
  }

  geometry.setAttribute(
    'position',
    new T.BufferAttribute(positions, 3)
      .setUsage(T.DynamicDrawUsage)
  );
  geometry.setAttribute(
    'normal',
    new T.BufferAttribute(normals, 3)
  );

  // Three triangles form the vane and its short overlap tail.
  geometry.setIndex([
    0, 1, 2,
    0, 2, 3,
    3, 2, 4,
    3, 4, 5
  ]);

  geometry.userData.bladeIndex = index;
  return geometry;
}

function putV(array, index, x, y, z) {
  const p = index * 3;
  array[p] = x;
  array[p + 1] = y;
  array[p + 2] = z;
}

function setIrisBlade(geometry, index, apothem) {
  const array = geometry.attributes.position.array;
  const angle = index * TAU / N;
  const radius = apothem / Math.cos(HALF);

  const a0 = angle - HALF;
  const a1 = angle + HALF;

  // Exact endpoints of a regular octagon.
  const p0x = Math.cos(a0) * radius;
  const p0z = Math.sin(a0) * radius;
  const p1x = Math.cos(a1) * radius;
  const p1z = Math.sin(a1) * radius;

  const outer = 1.265;

  // Exterior tail stays outside the aperture.
  // A layered overlap makes the eight vanes visible.
  const a2 = a1 + 0.065;
  const a3 = a0 - 0.045;

  const yy = 0.383 + index * 0.0015;

  putV(array, 0, p0x, yy, p0z);
  putV(array, 1, p1x, yy, p1z);
  putV(
    array, 2,
    Math.cos(a2) * outer, yy,
    Math.sin(a2) * outer
  );
  putV(
    array, 3,
    Math.cos(a3) * outer, yy,
    Math.sin(a3) * outer
  );

  // Two outer points define the short overlay wing.
  putV(
    array, 4,
    Math.cos(a2 + 0.07) * outer, yy,
    Math.sin(a2 + 0.07) * outer
  );
  putV(
    array, 5,
    Math.cos(a3 - 0.07) * outer, yy,
    Math.sin(a3 - 0.07) * outer
  );

  geometry.attributes.position.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export function buildIris() {
  const group = new T.Group();
  group.name = 'Camera — optical iris';

  const barrel = part(group, 'machined lens barrel');
  const optics = part(group, 'front and rear glass');
  const mechanism = part(group, 'eight diaphragm leaves');
  const hardware = part(group, 'retaining hardware');

  // Rear mounting shoulder and several axial barrel steps.
  annulus(barrel, 1.37, 1.21, -0.595, satinBlack, 0.09);
  annulus(barrel, 1.31, 1.21, -0.51, edgeBlack, 0.22);
  annulus(barrel, 1.38, 1.21, -0.31, satinBlack, 0.16);

  annulus(barrel, 1.44, 1.21, -0.08, graphite, 0.16);
  annulus(barrel, 1.47, 1.22, 0.14, satinBlack, 0.16);
  annulus(barrel, 1.45, 1.235, 0.31, graphite, 0.14);

  // Fine retaining and focus rings.
  for (let i = 0; i < 5; i++) {
    ring(
      barrel, 1.414, 0.012, finishSteel,
      0, -0.12 + i * 0.043, 0
    );
  }

  ring(barrel, 1.45, 0.026, M.steel, 0, 0.48, 0);
  ring(barrel, 1.385, 0.014, satinBlack, 0, 0.52, 0);

  // Grooves around the cylindrical focus collar.
  for (let i = 0; i < 72; i++) {
    const a = i * TAU / 72;
    const x = 1.395 * Math.cos(a);
    const z = 1.395 * Math.sin(a);

    const groove = box(
      barrel, 0.018, 0.14, 0.025,
      i % 3 ? graphite : finishSteel,
      x, -0.34, z, 0.004
    );
    groove.rotation.y = -a;
  }

  // Deep dark optical well, with two curved elements.
  annulus(optics, 1.235, 1.19, -0.0725, edgeBlack, 0.035);

  lensElement(optics, 1.13, 0.016, 0.135, glassCore);
  lensElement(optics, 0.97, 0.145, 0.075, glassCore);

  // A restrained reflected arc, not a neon glow.
  const glint = new T.Group();
  optics.add(glint);
  const arcPoints = [];

  for (let i = 0; i <= 40; i++) {
    const a = 0.20 + (Math.PI * 0.36) * i / 40;
    arcPoints.push([
      0.97 * Math.cos(a),
      0.231,
      0.97 * Math.sin(a)
    ]);
  }

  tube(glint, arcPoints, 0.009, glassHighlight);

  // The iris is forward of the visible glass elements.
  const blades = [];

  for (let i = 0; i < N; i++) {
    const geometry = irisBladeGeometry(i);
    const b = mesh(
      mechanism,
      geometry,
      i % 2 ? bladeAlt : bladeMat
    );
    b.name = `diaphragm leaf ${i + 1}`;
    b.material.side = T.DoubleSide;
    blades.push(b);
  }

  // Small visible blade pivots lie outside the opening.
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) * TAU / N;
    const x = 1.285 * Math.cos(a);
    const z = 1.285 * Math.sin(a);

    cyl(hardware, 0.038, 0.019, M.brass, x, 0.406, z);
    cyl(hardware, 0.018, 0.025, screwDark, x, 0.423, z);
  }

  // The upper retaining ring frames the moving leaves.
  annulus(hardware, 1.47, 1.245, 0.447, satinBlack, 0.055);
  ring(hardware, 1.252, 0.010, finishSteel, 0, 0.502, 0);
  ring(hardware, 1.478, 0.016, graphite, 0, 0.505, 0);

  constructionScrews(hardware, 1.373, 0.512, N);

  // A radial aperture index, engraved by geometry.
  for (let i = 0; i < 32; i++) {
    const a = TAU * i / 32;
    const r = i % 4 === 0 ? 1.53 : 1.51;
    rod(
      hardware,
      [r * Math.cos(a), 0.46, r * Math.sin(a)],
      [(r + (i % 4 === 0 ? 0.052 : 0.024)) * Math.cos(a),
        0.46,
        (r + (i % 4 === 0 ? 0.052 : 0.024)) * Math.sin(a)],
      0.006,
      finishSteel,
      6
    );
  }

  let last = NaN;
  const defaults = { fstop: 2.8 };

  function update(state = defaults) {
    const f = clamp(state.fstop ?? BASE_F, 1.4, 22);
    const changed=f!==last;

    last = f;
    const a = irisApothem(f);

    for (let i = 0; changed && i < blades.length; i++) {
      setIrisBlade(blades[i].geometry, i, a);
    }

    // Observational metadata. The ratio is independent
    // of polygon/circle approximation.
    state.apertureArea = Math.PI * (IRIS_K / f) ** 2;
    state.apertureRatio = (BASE_F / f) ** 2;
  }

  function reading(state = defaults) {
    const f = clamp(state.fstop ?? BASE_F, 1.4, 22);
    const ratio = (BASE_F / f) ** 2;
    return (
      `f/${f} · 기준 f/2.8 대비 개구 면적 ` +
      `${fmt(ratio)}배 · ISO와 셔터 시간 고정`
    );
  }

  update(defaults);

  return {
    group,
    eye: [3.8, 6.5, 5.2],
    allowZoom:true,
    parts:{barrel,optics,mechanism,hardware,blades},
    defaults,
    update,
    reading,
    annotations: [
      { text: '8장 조리개 날개', point: [0.91, 0.42, 0.59] },
      { text: '광학 유리 요소', point: [0, 0.20, 0] },
      { text: '조리개 구동 핀', point: [-1.18, 0.43, 0.48] },
      { text: '렌즈 경통', point: [1.36, -0.32, 0.1] }
    ]
  };
}

/* -----------------------------------------------------------
 * 02 — FOCAL-PLANE SHUTTER
 *
 * Z = vertical travel coordinate in the shutter plane.
 * The existing curtainWindow() is the timing authority.
 *
 * The two opaque curtains occupy the space directly
 * above the imaging sensor, not beside it.
 * ----------------------------------------------------------- */

function shutterRib(parent, z, xWidth = 2.45) {
  const g = part(parent, 'curtain cross rib');

  box(
    g, xWidth, 0.017, 0.035,
    ribMetal, 0, 0, z, 0.005
  );

  box(
    g, xWidth - 0.08, 0.008, 0.009,
    satinBlack, 0, 0.015, z - 0.01, 0.002
  );

  return g;
}

function shutterCurtain(parent,name,y){
 const g=part(parent,name);g.position.y=y;g.userData.leaves=[];
 for(let i=0;i<8;i++){
  const leaf=box(g,2.56,.024,.228,i%2?satinBlack:bladeMat,0,i*.006,-.9+(i+.5)*.225,.002);leaf.name='Overlapping shutter blade '+(i+1);
  box(leaf,2.48,.006,.009,ribMetal,0,.016,-.108,.001);g.userData.leaves.push(leaf);
 }
 return g;
}

function sensorMicrostructure(parent) {
  const core = part(parent, 'ceramic sensor and microstructure');

  // The blue-green silicon is deliberately dark.
  const silicon = mat(0x263e43, 0.22, 0.45);
  const pixel = mat(0x496369, 0.29, 0.55);

  box(core, 2.46, 0.055, 1.66, ceramic, 0, 0.007, 0);
  box(core, 2.33, 0.009, 1.53, silicon, 0, 0.041, 0, 0.006);

  // Fixed geometric micro-lines instead of a CanvasTexture.
  for (let i = 0; i < 31; i++) {
    const x = -1.11 + i * (2.22 / 30);
    box(
      core, 0.004, 0.002, 1.48,
      i % 5 === 0 ? pixel : silicon,
      x, 0.048, 0, 0.001
    );
  }

  for (let i = 0; i < 20; i++) {
    const z = -0.72 + i * (1.44 / 19);
    box(
      core, 2.27, 0.002, 0.004,
      i % 4 === 0 ? pixel : silicon,
      0, 0.049, z, 0.001
    );
  }

  return core;
}

export function buildShutter() {
  const group = new T.Group();
  group.name = 'Camera — focal plane shutter';
  group.rotation.x = Math.PI/2;

  const base = part(group, 'shutter chassis');
  const sensor = part(group, 'imaging sensor');
  const track = part(group, 'shutter travel rails');
  const assembly = part(group, 'moving shutter curtains');

  box(base, 3.12, 0.14, 2.40, edgeBlack, 0, -0.17, 0);
  box(base, 2.92, 0.045, 2.16, satinBlack, 0, -0.075, 0);

  sensorMicrostructure(sensor);

  // Ceramic sensor mount and metallic shoulder.
  for (const x of [-1.27, 1.27]) {
    box(
      base, 0.12, 0.075, 1.96,
      ceramicEdge, x, 0.055, 0
    );
  }

  for (const z of [-0.94, 0.94]) {
    box(
      base, 2.7, 0.075, 0.13,
      ceramicEdge, 0, 0.055, z
    );
  }

  const mountingPoints = [
    [-1.37, -1.07],
    [1.37, -1.07],
    [-1.37, 1.07],
    [1.37, 1.07]
  ];

  mountingPoints.forEach(([x, z]) => {
    screw(base, x, 0.10, z, 0.053);
  });

  // Two separate planes prevent z-fighting.
  // Both are in front of the silicon when viewed from +Y.
  const first = shutterCurtain(
    assembly, 'first opening curtain', 0.195
  );
  const second = shutterCurtain(
    assembly, 'second closing curtain', 0.274
  );

  // The travel path runs along Z.
  for (const x of [-1.38, 1.38]) {
    box(
      track, 0.105, 0.115, 2.28,
      graphite, x, 0.242, 0, 0.012
    );

    box(
      track, 0.022, 0.038, 2.22,
      guideMetal, x, 0.319, 0, 0.005
    );
  }

  for (const z of [-1.14, 1.14]) {
    box(
      track, 2.92, 0.065, 0.08,
      satinBlack, 0, 0.24, z
    );
  }

  // Bright sensor strip, BELOW both moving curtains.
  // It cannot shine through the opaque closed shutter.
  const exposed = part(sensor, 'currently exposed sensor area');
  const exposureMat = mat(0x637f81, 0.14, 0.48);

  const exposureStrip = box(
    exposed,
    2.25, 0.006, SENSOR_H,
    exposureMat,
    0, 0.057, 0, 0.003
  );

  exposureStrip.visible = false;

  const defaults = {
    cycle: 0,
    fast: 0,
    explode: 0
  };

  function update(state = defaults) {
    const cycle = ((Number(state.cycle) || 0) % 1 + 1) % 1;
    const fast = !!state.fast;
    const separation=clamp(state.explode??0,0,1);sensor.position.y=-separation*.25;first.position.y=.195+separation*.48;second.position.y=.274+separation*.96;
    const w = curtainWindow(cycle, fast);

    // The checked mechanism supplies displacement values.
    // Slats gather into banks beside the frame instead of travelling out as full plates.
    first.userData.leaves.forEach((leaf,i)=>{leaf.position.z=Math.min(-.9+(i+.5)*.225+w.first,1.02+i*.012);});
    second.userData.leaves.forEach((leaf,i)=>{leaf.position.z=Math.max(-.9+(i+.5)*.225+w.second,-1.02-i*.012);});

    const low = Number(w.low) || 0;
    const high = Number(w.high) || 0;
    const requestedWidth = Math.max(0, Number(w.width) || 0);

    // The visible illuminated region is clipped to
    // the physically available sensor interval.
    const lo = Math.max(-SENSOR_H / 2, Math.min(low, high));
    const hi = Math.min(SENSOR_H / 2, Math.max(low, high));
    const visibleWidth = Math.max(0, hi - lo);

    exposureStrip.visible =
      requestedWidth > EPS && visibleWidth > EPS;

    if (exposureStrip.visible) {
      exposureStrip.scale.z = visibleWidth / SENSOR_H;
      exposureStrip.position.z = (lo + hi) / 2;
    } else {
      exposureStrip.scale.z = 0;
    }

    state.openWidth = requestedWidth;
    state.visibleOpenWidth = visibleWidth;
    state.exposureFraction = visibleWidth / SENSOR_H;
  }

  function advance(state, dt) {
    const delta = Math.max(0, Number(dt) || 0);
    state.cycle =
      (((Number(state.cycle) || 0) + delta * 0.25) % 1 + 1) % 1;
    update(state);
  }

  function reading(state = defaults) {
    const fast = !!state.fast;
    const w = curtainWindow(
      ((Number(state.cycle) || 0) % 1 + 1) % 1,
      fast
    );

    const width = Math.max(0, Number(w.width) || 0);
    const percentage = width / SENSOR_H * 100;

    const descriptor = fast
      ? '고속 · 일정한 좁은 슬릿이 센서를 주사'
      : '저속 · 첫 막 개방 → 전체 노출 → 뒤 막 폐쇄';

    return (
      `${descriptor} · 순간 개방 폭 ` +
      `${percentage.toFixed(0)}% · 시간 확대 모형`
    );
  }

  update(defaults);

  return {
    group,
    eye: [3, 2.5, 7],
    allowZoom:true,
    parts:{base,sensor,track,first,second,exposureStrip},
    defaults,
    update,
    advance,
    reading,
    annotations: [
      { text: '선막 · 센서를 드러냅니다', object:first },
      { text: '후막 · 선막을 뒤따라 가립니다', object:second },
      { text: '커튼 양쪽 가이드레일', object:track },
      { text: '두 커튼 뒤의 이미지 센서', object:sensor }
    ]
  };
}

/* -----------------------------------------------------------
 * 03 — EXPOSURE EXPERIMENT
 *
 * One fixed still-life composition.
 *
 * Aperture: relative collected light.
 * Shutter: collected light and motion-trail length.
 *
 * This is an editorial demonstration, not a physically
 * traced optical rendering or simulated sensor pipeline.
 * ----------------------------------------------------------- */

function dynamicMaterial(color, roughness = 0.68) {
  return new T.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.03
  });
}

function stillLife(group, registry) {
  const set = part(group, 'miniature still life');

  const backdrop = dynamicMaterial(0xa0a39c);
  const surface = dynamicMaterial(0xaba99e);
  const vessel = dynamicMaterial(0x897f70);
  const vesselShade = dynamicMaterial(0x5b625d);
  const fruit = dynamicMaterial(0xa35b40);
  const leaves = dynamicMaterial(0x596b59);
  const stalks = dynamicMaterial(0x797c66);

  registry.push(
    [backdrop, 0xa0a39c],
    [surface, 0xaba99e],
    [vessel, 0x897f70],
    [vesselShade, 0x5b625d],
    [fruit, 0xa35b40],
    [leaves, 0x596b59],
    [stalks, 0x797c66]
  );

  // This miniature is viewed from above.
  // The arrangement is constant across all exposure values.
  box(set, 3.16, 0.035, 2.08, backdrop, 0, -0.025, 0);
  box(set, 3.08, 0.011, 0.78, surface, 0, 0.002, 0.59);

  // A small ceramic bottle: broad foot, narrow shoulder.
  const vase = part(set, 'ceramic vase');

  const profile = [
    [0, 0],
    [0.28, 0],
    [0.34, 0.07],
    [0.37, 0.31],
    [0.32, 0.58],
    [0.23, 0.77],
    [0.13, 0.92],
    [0.15, 0.99],
    [0.15, 1.02]
  ];

  const latheGeometry = new T.LatheGeometry(
    profile.map(p => new T.Vector2(...p)),
    48
  );

  // Bottle is modeled along Y, then presented diagonally
  // in the XZ plane as a readable photographic silhouette.
  const bottle = mesh(vase, latheGeometry, vessel, -0.70, 0.06, 0.20);
  bottle.rotation.z = -0.19;

  // Strong mouth and dark opening.
  cyl(vase, 0.153, 0.018, vesselShade, -0.90, 1.065, 0.20);

  // Thin stems and broad botanical accents.
  rod(
    vase,
    [-0.86, 1.00, 0.21],
    [-1.00, 1.38, -0.02],
    0.018, stalks, 9
  );
  rod(
    vase,
    [-0.86, 1.00, 0.21],
    [-0.45, 1.46, 0.00],
    0.016, stalks, 9
  );

  function leaf(x, y, z, angle, scale = 1) {
    const leafMesh = mesh(
      vase,
      new T.SphereGeometry(0.15, 20, 12),
      leaves, x, y, z
    );
    leafMesh.scale.set(0.48 * scale, 1.35 * scale, 0.14);
    leafMesh.rotation.z = angle;
  }

  leaf(-1.02, 1.35, -0.04, -0.55);
  leaf(-0.45, 1.48, 0, 0.61, 0.95);

  // Fruit and its contact shadow.
  const shadowMat = dynamicMaterial(0x61625c);
  registry.push([shadowMat, 0x61625c]);

  const shadow = mesh(
    set,
    new T.SphereGeometry(0.32, 32, 16),
    shadowMat,
    0.58, 0.018, 0.57
  );
  shadow.scale.set(1.45, 0.024, 0.85);

  const orange = mesh(
    set,
    new T.SphereGeometry(0.32, 48, 28),
    fruit,
    0.56, 0.31, 0.49
  );
  orange.scale.set(1.0, 0.95, 0.92);

  cyl(set, 0.035, 0.035, stalks, 0.56, 0.63, 0.49);

  return set;
}

function makePhotoFrame(parent) {
  const frame = part(parent, 'photographic image frame');

  const outer = dynamicMaterial(0x222929, 0.48);
  const inner = dynamicMaterial(0xd2cdc0, 0.72);

  box(frame, 3.45, 0.10, 2.40, outer, 0, -0.115, 0);
  box(frame, 3.30, 0.018, 2.22, inner, 0, -0.048, 0);

  // Machined border with no screen-space text dependence.
  for (const x of [-1.67, 1.67]) {
    box(frame, 0.014, 0.025, 2.33, M.steel, x, -0.041, 0);
  }

  for (const z of [-1.15, 1.15]) {
    box(frame, 3.35, 0.025, 0.014, M.steel, 0, -0.041, z);
  }

  return frame;
}

function makeMotionObjects(parent) {
  const motion = part(parent, 'moving subject and trail');

  const movingMat = dynamicMaterial(0x597b83);
  const trailMaterials = [];
  const ghosts = [];
  const count = 20;

  // The moving subject is placed above the still-life plate.
  const ball = mesh(
    motion,
    new T.SphereGeometry(0.13, 24, 16),
    movingMat,
    0.76, 0.22, -0.57
  );

  // Preallocated trail elements: no geometry regeneration.
  for (let i = 0; i < count; i++) {
    const m = dynamicMaterial(0x697a7b);
    const g = mesh(
      motion,
      new T.SphereGeometry(0.127, 18, 12),
      m,
      0, 0.15, -0.57
    );

    g.scale.y = 0.28;
    g.visible = false;

    ghosts.push(g);
    trailMaterials.push(m);
  }

  return {
    ball,
    movingMat,
    ghosts,
    trailMaterials
  };
}

function makeExposureIndicator(parent) {
  const g = part(parent, 'exposure meter');

  const dark = dynamicMaterial(0x303838, 0.53);
  const middle = dynamicMaterial(0x8f9894, 0.53);
  const light = dynamicMaterial(0xc1b9a7, 0.58);
  const pointer = dynamicMaterial(0xbba17d, 0.4);

  // Spatial dial outside the still-life picture.
  box(g, 3.46, 0.11, 0.48, dark, 0, -0.08, 1.53);

  for (let i = 0; i <= 24; i++) {
    const x = -1.45 + i * (2.90 / 24);
    const major = i % 4 === 0;

    box(
      g,
      major ? 0.014 : 0.008,
      0.006,
      major ? 0.17 : 0.095,
      major ? light : middle,
      x, -0.012, 1.53
    );
  }

  const needle = box(
    g, 0.034, 0.035, 0.32,
    pointer, 0, 0.027, 1.53
  );

  return { needle };
}

export function buildExposure() {
  const group = new T.Group();
  group.name = 'Camera — photographic exposure';

  const stage = part(group, 'exposure demonstration stage');
  const photo = part(stage, 'fixed photograph composition');

  const registered = [];

  const frame = makePhotoFrame(photo);
  const still = stillLife(photo, registered);
  const motion = makeMotionObjects(photo);

  const indicator = makeExposureIndicator(stage);

  // Neutral base and subtle bevel-free framing.
  const pedestal = part(group, 'instrument foundation');

  box(
    pedestal,
    4.00, 0.12, 3.37,
    satinBlack,
    0, -0.31, 0.31
  );

  for (const x of [-1.87, 1.87]) {
    box(
      pedestal, 0.020, 0.025, 3.15,
      graphite, x, -0.22, 0.31
    );
  }

  // A restrained guide rail marks subject motion.
  const motionRail = dynamicMaterial(0x707875);

  box(
    photo, 1.80, 0.009, 0.013,
    motionRail, 0.65, 0.065, -0.57, 0.003
  );

  const defaults = {
    fstop: 2.8,
    shutter: 250
  };

  const baseColors = registered.map(([m, c]) => ({
    material: m,
    color: new T.Color(c)
  }));

  const darkBase = new T.Color(0x111718);
  const brightBase = new T.Color(0xe0ded5);
  const subjectBase = new T.Color(0x597b83);
  const ghostDark = new T.Color(0x343d3e);

  function update(state = defaults) {
    const f = clamp(state.fstop ?? BASE_F, 1.4, 22);
    const shutter = clamp(state.shutter ?? 250, 1, 8000);

    const raw = Number(lightRatio(f, shutter));
    const ratio = Number.isFinite(raw)
      ? Math.max(0, raw)
      : (BASE_F / f) ** 2 * 250 / shutter;

    state.light = ratio;

    // Compress a large dynamic range into a visible
    // teaching display. This is a display curve, not an
    // actual camera response function.
    const stops = Math.log2(Math.max(ratio, 0.00001));
    const display = clamp(0.52 + stops * 0.115, 0.075, 0.98);

    // Preserve the objects' hue while varying luminance.
    for (const entry of baseColors) {
      const c = entry.color.clone();

      if (display < 0.52) {
        c.lerp(darkBase, (0.52 - display) / 0.52 * 0.89);
      } else {
        c.lerp(brightBase, (display - 0.52) / 0.46 * 0.90);
      }

      entry.material.color.copy(c);
    }

    const movingColor = subjectBase.clone();

    if (display < 0.52) {
      movingColor.lerp(
        darkBase,
        (0.52 - display) / 0.52 * 0.88
      );
    } else {
      movingColor.lerp(
        brightBase,
        (display - 0.52) / 0.46 * 0.86
      );
    }

    motion.movingMat.color.copy(movingColor);

    // Motion blur responds to shutter duration, not f-stop.
    // The focal subject travels from left to right.
    const duration = 1 / shutter;
    const referenceDuration = 1 / 250;

    const trailLength = clamp(
      0.33 * (duration / referenceDuration),
      0,
      1.75
    );

    const count = motion.ghosts.length;
    const x = 0.82;
    const z = -0.57;

    motion.ball.position.set(x, 0.22, z);

    // Opaque colour-blended trail elements avoid alpha
    // sorting and remain visible in small renderers.
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      const ghost = motion.ghosts[i];
      const fade = (1 - t) ** 1.5;

      const separation = trailLength / count;
      const usable =
        trailLength >= 0.075 &&
        separation * (i + 1) > 0.018;

      ghost.visible = usable;

      if (!usable) continue;

      ghost.position.set(
        x - t * trailLength,
        0.14 + fade * 0.014,
        z
      );

      const diameter = Math.max(
        0.12,
        0.96 - 0.24 * t
      );

      ghost.scale.set(
        diameter,
        0.19,
        0.80
      );

      // Each ghost is a mixture of the subject colour
      // and a neutral plate shade, with no transparency.
      const background = ghostDark.clone();
      background.lerp(
        brightBase,
        display * 0.63
      );

      motion.trailMaterials[i].color
        .copy(background)
        .lerp(movingColor, fade * 0.72);
    }

    // Exposure indicator: logarithmic EV relative to base.
    const ev = clamp(stops, -6, 6);
    indicator.needle.position.x = ev / 6 * 1.45;

    state.motionTrail = trailLength;
    state.exposureStops = stops;
    state.displayBrightness = display;
  }

  function reading(state = defaults) {
    const f = clamp(state.fstop ?? BASE_F, 1.4, 22);
    const shutter = clamp(state.shutter ?? 250, 1, 8000);

    let ratio = Number(lightRatio(f, shutter));
    if (!Number.isFinite(ratio)) {
      ratio = (BASE_F / f) ** 2 * 250 / shutter;
    }

    const stops = Math.log2(Math.max(ratio, 0.00001));

    const blur =
      shutter >= 500 ? '움직임 짧게 포착' :
      shutter >= 125 ? '움직임의 흔적 증가' :
      '긴 잔상 표현';

    return (
      `f/${f} · 1/${shutter}초 · 기준 대비 ` +
      `광량 ${fmt(ratio)}배 ` +
      `(${stops >= 0 ? '+' : ''}${stops.toFixed(1)}스톱)` +
      ` · ${blur} · 시각화 모형`
    );
  }

  update(defaults);

  return {
    group,
    eye: [2.5, 6.8, 5.5],
    defaults,
    update,
    reading,
    annotations: [
      { text: '동일한 정물 장면', point: [-0.70, 0.80, 0.20] },
      { text: '움직이는 피사체', point: [0.82, 0.22, -0.57] },
      { text: '셔터 시간에 따른 잔상', point: [0.05, 0.15, -0.57] },
      { text: '상대 노출 지시계', point: [0, 0.04, 1.53] }
    ]
  };
}
