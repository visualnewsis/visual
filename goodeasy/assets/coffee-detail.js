// coffee-detail.js?v=20261028-release3
// VISUAL NEWSIS · 굳이구지 · Espresso Detail
// Three.js ES module · Y-up
// No DOM, canvas, external textures or additional packages.
// Pore-route buffers update only when the particle layout changes.
// Flow and fill are educational visualizations, not fluid-dynamics simulations.

import {
  T,
  materials as M,
  mesh,
  box,
  cyl,
  ring,
  rod,
  tube,
  part,
  lathe
} from './quality-kit.js?v=20261028-release3';

import {
  coffeeFlow
} from './model.js?v=20261026-release3';

const PI = Math.PI;
const TAU = PI * 2;

const clamp = (v, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));

const lerp = (a, b, t) => a + (b - a) * t;

const finite = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mat = (color, roughness = 0.5, metalness = 0) =>
  new T.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });

const P = {
  porcelain: new T.MeshPhysicalMaterial({
    color: 0xf0eadb,
    roughness: 0.23,
    metalness: 0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.16,
    side: T.DoubleSide
  }),

  porcelainShadow: mat(0xd5cfbf, 0.34),

  darkMetal: new T.MeshStandardMaterial({
    color: 0x303a37,
    metalness: 0.86,
    roughness: 0.31,
    side: T.DoubleSide
  }),

  brushedSteel: new T.MeshStandardMaterial({
    color: 0xa8b3aa,
    metalness: 0.94,
    roughness: 0.29,
    side: T.DoubleSide
  }),

  edgeSteel: new T.MeshStandardMaterial({
    color: 0xd0d0ba,
    metalness: 0.88,
    roughness: 0.25,
    side: T.DoubleSide
  }),

  gold: new T.MeshStandardMaterial({
    color: 0xb79a61,
    metalness: 0.91,
    roughness: 0.3
  }),

  goldHighlight: new T.MeshStandardMaterial({
    color: 0xd1b780,
    metalness: 0.85,
    roughness: 0.25
  }),

  green: mat(0x41665a, 0.49, 0.24),

  darkGreen: mat(0x253d35, 0.54, 0.26),

  ground: mat(0x64412c, 0.94),

  groundDark: mat(0x39251b, 0.98),

  groundLight: mat(0x8b6040, 0.93),

  hole: mat(0x151b18, 0.86),

  coffee: new T.MeshPhysicalMaterial({
    color: 0x482412,
    roughness: 0.24,
    clearcoat: 0.56,
    clearcoatRoughness: 0.19
  }),

  coffeeSurface: new T.MeshPhysicalMaterial({
    color: 0x6c3517,
    roughness: 0.22,
    clearcoat: 0.72,
    clearcoatRoughness: 0.17,
    side: T.DoubleSide
  }),

  crema: new T.MeshPhysicalMaterial({
    color: 0xb77838,
    roughness: 0.49,
    clearcoat: 0.16,
    transparent: true,
    opacity: 0.81,
    depthWrite: false,
    side: T.DoubleSide
  }),

  cremaLight: new T.MeshStandardMaterial({
    color: 0xd8a260,
    roughness: 0.64,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: T.DoubleSide
  }),

  cremaDark: new T.MeshStandardMaterial({
    color: 0x69361e,
    roughness: 0.48,
    transparent: true,
    opacity: 0.71,
    depthWrite: false,
    side: T.DoubleSide
  }),

  wetChannel: new T.MeshPhysicalMaterial({
    color: 0x9b6942,
    roughness: 0.26,
    clearcoat: 0.53,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  }),

  channelHighlight: new T.MeshStandardMaterial({
    color: 0xc49a64,
    roughness: 0.36,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  }),

  rubber: mat(0x202825, 0.83),

  scaleFace: mat(0x242e2a, 0.4, 0.28),

  display: mat(0x35483d, 0.45, 0.1),

  displayGlass: new T.MeshPhysicalMaterial({
    color: 0x344b40,
    metalness: 0.12,
    roughness: 0.17,
    clearcoat: 0.62
  })
};

function hash(n) {
  const v = Math.sin(n * 127.1 + 78.233) * 43758.5453123;
  return v - Math.floor(v);
}

function smooth(a, b, x) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function applyMeshSettings(o, shadow = true) {
  o.castShadow = shadow;
  o.receiveShadow = true;
  return o;
}

function makeMesh(parent, geometry, material, name = '') {
  const o = new T.Mesh(geometry, material);
  o.name = name;
  applyMeshSettings(o);
  parent.add(o);
  return o;
}

function cylinderBetween(parent, a, b, radius, material, sides = 10) {
  return rod(parent, a, b, radius, material, sides);
}

function torusXY(parent, radius, thickness, material, x, y, z) {
  return ring(parent, radius, thickness, material, x, y, z, 'z');
}

function torusHorizontal(parent, radius, thickness, material, x, y, z) {
  return ring(parent, radius, thickness, material, x, y, z, 'y');
}

function horizontalDisc(parent, radius, material, x, y, z) {
  const o = makeMesh(
    parent,
    new T.CircleGeometry(radius, 64),
    material
  );
  o.rotation.x = -PI / 2;
  o.position.set(x, y, z);
  return o;
}

function makeScrew(parent, x, y, z, radius = 0.035) {
  cyl(parent, radius, 0.012, P.edgeSteel, x, y, z);
  const slot = box(
    parent,
    radius * 1.1,
    0.006,
    0.009,
    P.darkMetal,
    x,
    y + 0.009,
    z,
    0.002
  );
  slot.rotation.y = PI / 4;
}

function roundedLabelPlate(parent, w, h, x, y, z) {
  return box(
    parent,
    w,
    h,
    0.024,
    P.darkGreen,
    x,
    y,
    z,
    0.015
  );
}

// -----------------------------------------------------------------------------
// 1. REUSABLE PORCELAIN ESPRESSO CUP
//
// Cup unit:
//   baseline = 0
//   highest porcelain rim = 1.10
//
// Coffee stays within the physical cavity.
// A shared component is returned for hero/comparison/ratio scenes.
// -----------------------------------------------------------------------------

const CUP_BOTTOM = 0.19;
const CUP_MAX_SURFACE = 0.985;
const CUP_LIQUID_DEPTH = CUP_MAX_SURFACE - CUP_BOTTOM;

function innerCupRadius(y) {
  const t = clamp((y - CUP_BOTTOM) / CUP_LIQUID_DEPTH);
  return lerp(0.342, 0.465, t);
}

export function createCoffeeCup() {
  const group = new T.Group();
  group.name = 'Reusable porcelain espresso cup';
  group.userData.part = 'espresso cup';
  group.userData.unitCupHeight = 1.1;

  const cup = part(group, 'thick porcelain vessel');

  // A solid-looking double-wall lathe profile.
  // The profile returns down the inner wall and closes near the floor.
  // The lower interior is deliberately elevated above the saucer.
  const cupProfile = [
    [0.000, 0.115],
    [0.250, 0.115],
    [0.365, 0.130],
    [0.440, 0.180],
    [0.505, 0.360],
    [0.566, 0.720],
    [0.585, 1.020],
    [0.576, 1.078],
    [0.555, 1.100],
    [0.515, 1.100],
    [0.496, 1.082],
    [0.480, 1.030],
    [0.468, 0.920],
    [0.425, 0.620],
    [0.378, 0.330],
    [0.342, 0.190],
    [0.250, 0.168],
    [0.000, 0.168]
  ];

  lathe(cup, cupProfile, P.porcelain);

  // Visible glazed rim and underside foot.
  torusHorizontal(cup, 0.535, 0.021, P.porcelain, 0, 1.086, 0);
  torusHorizontal(cup, 0.344, 0.018, P.porcelainShadow, 0, 0.132, 0);

  const foot = cyl(
    cup,
    0.315,
    0.100,
    P.porcelain,
    0,
    0.086,
    0
  );
  foot.castShadow = true;

  // Upright ear-shaped handle lying in the XY plane.
  // It is not a horizontal ring attached to the front.
  const handle = part(cup, 'vertical ceramic handle');

  const handleGeometry = new T.TorusGeometry(
    0.352,
    0.105,
    14,
    56
  );

  const handleLoop = makeMesh(
    handle,
    handleGeometry,
    P.porcelain,
    'upright oval handle'
  );

  handleLoop.position.set(0.815, 0.610, 0);
  handleLoop.scale.set(0.79, 1.11, 0.82);

  // Fused ceramic handle roots, with no apparent floating joint.
  const upperRoot = cylinderBetween(
    handle,
    [0.515, 0.875, 0],
    [0.698, 0.850, 0],
    0.108,
    P.porcelain,
    20
  );

  const lowerRoot = cylinderBetween(
    handle,
    [0.476, 0.390, 0],
    [0.695, 0.370, 0],
    0.103,
    P.porcelain,
    20
  );

  upperRoot.castShadow = true;
  lowerRoot.castShadow = true;

  // Saucer is a concave porcelain lathe, not a paper-thin disc.
  const saucer = part(group, 'concave porcelain saucer');

  const saucerProfile = [
    [0.000, 0.032],
    [0.400, 0.032],
    [0.565, 0.045],
    [0.730, 0.088],
    [0.865, 0.120],
    [0.895, 0.119],
    [0.918, 0.100],
    [0.925, 0.070],
    [0.899, 0.049],
    [0.760, 0.032],
    [0.565, 0.012],
    [0.430, 0.000],
    [0.000, 0.000]
  ];

  lathe(saucer, saucerProfile, P.porcelain);

  torusHorizontal(
    saucer,
    0.900,
    0.014,
    P.porcelain,
    0,
    0.096,
    0
  );

  torusHorizontal(
    saucer,
    0.480,
    0.008,
    P.porcelainShadow,
    0,
    0.041,
    0
  );

  // The liquid has visible depth rather than a surface-only brown plate.
  // It is a tapered volume, while the separate top surface carries crema.
  const liquid = part(group, 'coffee volume');

  const liquidProfile = [
    [0.000, 0.000],
    [0.315, 0.000],
    [0.335, 0.030],
    [0.355, 0.190],
    [0.410, 0.510],
    [0.455, CUP_LIQUID_DEPTH],
    [0.000, CUP_LIQUID_DEPTH]
  ];

  const liquidBody = lathe(
    liquid,
    liquidProfile,
    P.coffee
  );

  liquidBody.name = 'coffee body with physical depth';

  // Front lip / surface plane.
  const surface = horizontalDisc(
    group,
    1,
    P.coffeeSurface,
    0,
    CUP_BOTTOM,
    0
  );
  surface.name = 'coffee surface';

  // Meniscus is separate from the cup rim.
  const meniscus = torusHorizontal(
    group,
    1,
    0.009,
    P.cremaLight,
    0,
    CUP_BOTTOM,
    0
  );
  meniscus.name = 'coffee meniscus';

  const cremaGroup = part(group, 'irregular micro crema');

  // A deterministic, sparse set of organic flecks.
  // These are flattened irregular ovals, not bubbles or beads.
  const flecks = [];

  const fleckGeometry = new T.SphereGeometry(
    1,
    10,
    6
  );

  for (let i = 0; i < 42; i++) {
    const angle = hash(i * 5 + 11) * TAU;
    const radial = Math.sqrt(hash(i * 7 + 19)) * 0.88;

    const material =
      i % 7 === 0
        ? P.cremaDark
        : i % 3 === 0
          ? P.cremaLight
          : P.crema;

    const f = makeMesh(
      cremaGroup,
      fleckGeometry,
      material,
      `crema fleck ${i}`
    );

    f.castShadow = false;
    f.receiveShadow = false;

    const sx = lerp(0.014, 0.066, hash(i * 13 + 3));
    const sz = lerp(0.006, 0.022, hash(i * 17 + 7));

    f.scale.set(sx, 0.0015, sz);
    f.rotation.y = hash(i * 23 + 5) * TAU;

    flecks.push({
      object: f,
      angle,
      radial,
      phase: hash(i * 29 + 9) * TAU,
      originalX: sx,
      originalZ: sz
    });
  }

  // Three faint discontinuous arcs add crema structure.
  const cremaArcs = [];

  for (let i = 0; i < 3; i++) {
    const arc = makeMesh(
      cremaGroup,
      new T.TorusGeometry(
        1,
        0.006 + i * 0.0015,
        5,
        36,
        PI * (0.52 + i * 0.14)
      ),
      i === 1 ? P.cremaDark : P.cremaLight,
      `crema irregular arc ${i}`
    );

    arc.rotation.x = PI / 2;
    arc.rotation.z = i * 1.91;

    arc.castShadow = false;
    cremaArcs.push(arc);
  }

  let previousFraction = -1;
  let previousTime = NaN;
  let previousPouring = null;

  function setFill(fraction, time = 0, pouring = false) {
    const f = clamp(finite(fraction, 0));
    const t = finite(time, 0);
    const isPouring = !!pouring;

    if (
      f === previousFraction &&
      t === previousTime &&
      isPouring === previousPouring
    ) {
      return;
    }

    previousFraction = f;
    previousTime = t;
    previousPouring = isPouring;

    const visible = f > 0.001;

    liquid.visible = visible;
    surface.visible = visible;
    meniscus.visible = visible;
    cremaGroup.visible = visible;

    if (!visible) {
      liquid.scale.y = 0.0001;
      group.userData.fill = 0;
      return;
    }

    // The liquid starts above the inner porcelain floor.
    const surfaceY = CUP_BOTTOM + CUP_LIQUID_DEPTH * f;

    // Radial restraint keeps the liquid within the sloping inner wall.
    const availableRadius = innerCupRadius(surfaceY);
    const topRadius = Math.max(
      0.31,
      availableRadius - 0.026
    );

    liquid.position.y = CUP_BOTTOM;
    liquid.scale.y = f;
    liquid.scale.x = topRadius / 0.455;
    liquid.scale.z = topRadius / 0.455;

    const wobble = isPouring
      ? Math.sin(t * 8.2) * 0.0027
      : 0;

    surface.position.y = surfaceY + wobble;
    surface.scale.set(topRadius, topRadius, 1);

    // CircleGeometry is horizontal. Scale X/Y in its local XY plane.
    meniscus.position.y = surfaceY + 0.001;
    meniscus.scale.set(
      topRadius * 1.015,
      topRadius * 1.015,
      topRadius * 1.015
    );

    const cremaY = surfaceY + 0.0035 + wobble;

    for (let i = 0; i < flecks.length; i++) {
      const d = flecks[i];
      const o = d.object;

      const drift = isPouring
        ? Math.sin(t * 1.6 + d.phase) * 0.035
        : Math.sin(t * 0.11 + d.phase) * 0.004;

      const r = topRadius * clamp(
        d.radial + drift,
        0.04,
        0.90
      );

      o.position.set(
        Math.cos(d.angle) * r,
        cremaY + i * 0.000015,
        Math.sin(d.angle) * r
      );

      const movement = isPouring
        ? 1 + Math.sin(t * 3 + d.phase) * 0.13
        : 1;

      o.scale.x = d.originalX * movement;
      o.scale.z = d.originalZ * movement;
    }

    cremaArcs.forEach((o, i) => {
      const r = topRadius * (0.34 + i * 0.22);

      o.position.y = cremaY + 0.001 + i * 0.0002;

      o.scale.set(r, r, 1);

      o.rotation.z =
        i * 1.91 + t * (isPouring ? 0.11 : 0.008);
    });

    group.userData.fill = f;
    group.userData.surfaceY = surfaceY;
    group.userData.pouring = isPouring;
  }

  setFill(0);

  return {
    group,
    setFill
  };
}

// -----------------------------------------------------------------------------
// 2. GRIND COMPARISON
//
// Reference: coffeeFlow(30, 9)
// Both beds share pressure.
// Each bed uses a fixed InstancedMesh with >= 180 particles.
// No particle, flow, cup or perforation geometry is recreated by update().
// -----------------------------------------------------------------------------

const PARTICLE_COLS = 34;
const PARTICLE_ROWS = 18;
const PARTICLE_COUNT = PARTICLE_COLS * PARTICLE_ROWS; // 247 / bed

const BED_WIDTH = 1.94;
const BED_BOTTOM = -0.135;
const BED_TOP = 0.605;
const BED_HEIGHT = BED_TOP - BED_BOTTOM;

const SIDE_X = [-1.52, 1.52];

const particleGeometry = new T.IcosahedronGeometry(1, 0);
const particleDummy = new T.Object3D();

function createParticleBed(parent, seed) {
  const particles = new T.InstancedMesh(
    particleGeometry,
    P.ground,
    PARTICLE_COUNT
  );

  particles.name = 'irregular coffee particles';
  particles.castShadow = true;
  particles.receiveShadow = true;
  particles.frustumCulled = false;
  particles.instanceMatrix.setUsage(T.DynamicDrawUsage);

  parent.add(particles);

  const matrices = new Array(PARTICLE_COUNT);
  const colors = [
    new T.Color(0x553523),
    new T.Color(0x72482f),
    new T.Color(0x8c5936),
    new T.Color(0x493021)
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    matrices[i] = {
      x: hash(i * 17 + seed) - 0.5,
      y: hash(i * 19 + seed + 17) - 0.5,
      z: hash(i * 23 + seed + 29) - 0.5,
      rotation: hash(i * 31 + seed) * TAU,
      size: lerp(0.76, 1.21, hash(i * 37 + seed))
    };

    particles.setColorAt(
      i,
      colors[Math.floor(hash(i * 41 + seed) * colors.length)]
    );
  }

  if (particles.instanceColor) {
    particles.instanceColor.needsUpdate = true;
  }

  let lastGrind = NaN;
  let lastChannel = null;

  function update(grind, channel = false) {
    const g = clamp(finite(grind, 70), 0, 100);
    const c = !!channel;

    if (g === lastGrind && c === lastChannel) return;

    lastGrind = g;
    lastChannel = c;

    // Finer particles are smaller with more compact coverage.
    // This is a visual analogy, not an actual packing simulation.
    const cols = Math.round(lerp(14, 34, g / 100));
    const rows = Math.round(lerp(7, 18, g / 100));
    const spacingX = BED_WIDTH / cols, spacingY = (BED_HEIGHT - .04) / rows;
    const radius = Math.min(spacingX, spacingY) * .44;
    const packing = .96;
    particles.count = cols * rows;
    particles.userData.grainRadius = radius;

    let index = 0;
    const poreRows=[];

    for (let row = 0; row < rows; row++) {
      const rowGrains=[];
      for (let col = 0; col < cols; col++) {
        const d = matrices[index];

        const u = (col + 0.5) / cols;
        const v = (row + 0.5) / rows;

        let x =
          (u - 0.5) * BED_WIDTH * packing +
          d.x * spacingX * .45 + (row % 2 ? spacingX*.35 : 0);

        const y =
          BED_BOTTOM +
          0.042 +
          v * (BED_HEIGHT - 0.08) +
          d.y * spacingY * .4;

        const z = 0.125 + d.z * 0.064;

        // A preferential channel is a narrow, visible inter-grain void.
        // Particles move aside but are not deleted.
        if (c) {
          const dx = x - 0.48;
          const influence = Math.exp(
            -(dx * dx) / (2 * 0.105 * 0.105)
          );

          const direction = dx < 0 ? -1 : 1;
          x += direction * influence * 0.065;
        }

        const r = radius * d.size;

        particleDummy.position.set(x, y, z);
        particleDummy.rotation.set(
          d.rotation * 0.31,
          d.rotation,
          d.rotation * 0.52
        );

        particleDummy.scale.set(
          spacingX * .39 * d.size,
          spacingY * .39 * d.size,
          r * .92
        );

        particleDummy.updateMatrix();
        particles.setMatrixAt(index, particleDummy.matrix);
        rowGrains.push({x,y,z,rx:spacingX*.39*d.size,ry:spacingY*.39*d.size});

        index++;
      }
      poreRows.push(rowGrains);
    }
    particles.userData.poreRows=poreRows;

    particles.instanceMatrix.needsUpdate = true;
  }

  return {
    particles,
    update
  };
}

function createPerforatedBottom(parent) {
  const bottom = part(parent, 'perforated filter floor');

  // The continuous metallic carrier remains visible around the holes.
  box(
    bottom,
    2.10,
    0.085,
    0.79,
    P.brushedSteel,
    0,
    -0.214,
    -0.045,
    0.018
  );

  // Perforation cores and chamfer-colored annuli are preallocated.
  // This is an exposed schematic of a perforated plate, not a Boolean cut.
  const holeGeometry = new T.CylinderGeometry(
    0.025,
    0.025,
    0.003,
    9
  );

  const rimGeometry = new T.TorusGeometry(
    0.0255,
    0.005,
    5,
    9
  );

  const columns = 19;
  const depths = 5;
  const n = columns * depths;

  const holes = new T.InstancedMesh(
    holeGeometry,
    P.hole,
    n
  );

  const rims = new T.InstancedMesh(
    rimGeometry,
    P.edgeSteel,
    n
  );

  bottom.add(holes, rims);

  holes.name = 'filter perforation dark apertures';
  rims.name = 'filter perforation metal lips';

  const d = new T.Object3D();

  for (let z = 0; z < depths; z++) {
    for (let x = 0; x < columns; x++) {
      const i = z * columns + x;

      const px = (x - 9) * 0.101;
      const pz = (z - 2) * 0.135 - 0.045;

      d.position.set(px, -0.1668, pz);
      d.rotation.set(0, 0, 0);
      d.scale.setScalar(1);
      d.updateMatrix();
      holes.setMatrixAt(i, d.matrix);

      // Torus XY plane rotated into XZ.
      d.position.y = -0.1635;
      d.rotation.x = -PI / 2;
      d.updateMatrix();
      rims.setMatrixAt(i, d.matrix);
    }
  }

  holes.instanceMatrix.needsUpdate = true;
  rims.instanceMatrix.needsUpdate = true;

  return bottom;
}

function createBasketHousing(parent) {
  const housing = part(parent, 'cutaway stainless steel basket');

  // Only the back portion of the cylindrical wall is drawn.
  // The front is removed so the coffee bed can actually be inspected.
  const backWall = makeMesh(
    housing,
    new T.CylinderGeometry(
      1.095,
      1.03,
      0.92,
      64,
      1,
      true,
      PI * 0.50,
      PI
    ),
    P.brushedSteel,
    'open-back sectional steel wall'
  );

  backWall.position.y = 0.285;

  const leftWall = box(
    housing,
    0.090,
    0.90,
    0.78,
    P.brushedSteel,
    -1.055,
    0.285,
    0.015,
    0.014
  );

  const rightWall = box(
    housing,
    0.090,
    0.90,
    0.78,
    P.brushedSteel,
    1.055,
    0.285,
    0.015,
    0.014
  );

  leftWall.name = 'left exposed cut wall';
  rightWall.name = 'right exposed cut wall';

  // Front cut lips identify the thickness of the shell.
  for (const x of [-1.018, 1.018]) {
    box(
      housing,
      0.018,
      0.91,
      0.04,
      P.gold,
      x,
      0.282,
      0.415,
      0.006
    );
  }

  // The upper lip is broken into rear and side elements.
  // There is no opaque full disc covering the bed.
  torusHorizontal(
    housing,
    1.062,
    0.047,
    P.edgeSteel,
    0,
    0.763,
    0
  );

  box(
    housing,
    2.13,
    0.045,
    0.080,
    P.darkMetal,
    0,
    0.764,
    -0.56,
    0.012
  );

  createPerforatedBottom(housing);

  // A narrow outlet collector immediately beneath the punched floor.
  box(
    housing,
    1.60,
    0.075,
    0.35,
    P.darkMetal,
    0,
    -0.295,
    -0.06,
    0.016
  );

  cyl(
    housing,
    0.135,
    0.11,
    P.gold,
    0,
    -0.358,
    -0.045
  );

  torusHorizontal(
    housing,
    0.14,
    0.012,
    P.goldHighlight,
    0,
    -0.415,
    -0.045
  );

  // Screws are placed along the accessible near edge.
  for (const x of [-0.87, 0.87]) {
    makeScrew(housing, x, -0.161, 0.335, 0.029);
  }

  return housing;
}

function createFlowSystem(parent, seed, grains) {
  const flow = part(parent, 'continuous inter-grain flow');

  const paths = [];
  const streamSegments = [];
  let lastLayout="";
  const trailCount = 12;

  // Preallocated, thin continuous interstitial paths.
  // All geometry is made once. Updates adjust visibility and transform.
  for (let i = 0; i < trailCount; i++) {
    const fraction = (i + 0.5) / trailCount;
    const x0 = lerp(-0.90, 0.90, fraction);

    const points = [];

    for (let j = 0; j <= 15; j++) {
      const v = j / 15;
      const wiggle =
        Math.sin(v * 12.0 + i * 1.9 + seed) * 0.023 +
        Math.sin(v * 24.0 + i * 0.79) * 0.009;

      points.push([
        x0 + wiggle,
        lerp(0.682, -0.138, v),
        0.125 + Math.cos(v * 9 + i) * 0.012
      ]);
    }

    const channel = tube(
      flow,
      points,
      i % 4 === 0 ? 0.011 : 0.007,
      i % 3 === 0
        ? P.channelHighlight
        : P.wetChannel
    );

    channel.material=new T.ShaderMaterial({uniforms:{uTime:{value:0},uPhase:{value:i*.79}},transparent:true,depthWrite:false,
     vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
     fragmentShader:`uniform float uTime;uniform float uPhase;varying vec2 vUv;void main(){float sheen=.92+.08*sin(vUv.x*55.-uTime*5.+uPhase);vec3 water=vec3(.24,.35,.31);vec3 coffee=vec3(.24,.105,.037);gl_FragColor=vec4(mix(water,coffee,smoothstep(.2,.94,vUv.x))*sheen,.85);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
    channel.name = `continuous pore flow ${i}`;
    channel.castShadow = false;
    channel.renderOrder = 2;

    // The flow remains a continuous narrow line rather than
    // a line of independent falling water beads.
    paths.push({
      object: channel,
      x0,
      side: i,
      phase: hash(i * 21 + seed)
    });
  }

  // Thin liquid stream below the filter.
  // Multiple strands converge toward the collector outlet.
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.055;

    const strand = cylinderBetween(
      flow,
      [x, -0.423, -0.045],
      [x * 0.18, -1.225, -0.045],
      i === 1 ? 0.021 : 0.011,
      i === 1 ? P.crema : P.coffeeSurface,
      10
    );

    strand.name = `espresso continuous outlet strand ${i}`;
    strand.castShadow = false;

    streamSegments.push(strand);
  }

  // A short, warm-brown ribbon at the top of the coffee bed.
  const upperWetting = [];

  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.34;

    const o = cylinderBetween(
      flow,
      [x, 0.875, 0.17],
      [x + 0.012, 0.639, 0.17],
      0.010,
      P.wetChannel,
      8
    );

    o.castShadow = false;
    upperWetting.push(o);
  }

  function routeThroughPores(grind,channel){
    const key=grind+':'+channel;if(key===lastLayout)return;lastLayout=key;
    const rows=grains.particles.userData.poreRows||[];
    for(const path of paths){
      const points=[[path.x0,.682,.125]];let previous=path.x0;
      for(const row of [...rows].reverse()){
        const gaps=[];
        for(let i=0;i<row.length-1;i++){
          const a=row[i],b=row[i+1],left=a.x+a.rx,right=b.x-b.rx;
          if(right-left>.004)gaps.push({x:(left+right)/2,y:(a.y+b.y)/2,width:right-left});
        }
        if(!gaps.length)continue;
        const preferred=channel?lerp(path.x0,.48,.72):path.x0;
        gaps.sort((a,b)=>(Math.abs(a.x-preferred)+Math.abs(a.x-previous)*.45)-(Math.abs(b.x-preferred)+Math.abs(b.x-previous)*.45));
        const g=gaps[0];points.push([g.x,g.y,.125]);previous=g.x;
      }
      points.push([previous,-.138,.125]);
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),geo=path.object.geometry,n=geo.parameters.tubularSegments,k=geo.parameters.radialSegments,frames=curve.computeFrenetFrames(n,false),positions=geo.attributes.position,normals=geo.attributes.normal,r=lerp(.005,.0025,grind/100);
      for(let i=0;i<=n;i++){
        const c=curve.getPointAt(i/n),N=frames.normals[i],B=frames.binormals[i];
        for(let j=0;j<=k;j++){
          const a=j/k*TAU,nx=-Math.cos(a)*N.x+Math.sin(a)*B.x,ny=-Math.cos(a)*N.y+Math.sin(a)*B.y,nz=-Math.cos(a)*N.z+Math.sin(a)*B.z,index=i*(k+1)+j;
          positions.setXYZ(index,c.x+r*nx,c.y+r*ny,c.z+r*nz);normals.setXYZ(index,nx,ny,nz);
        }
      }
      positions.needsUpdate=true;normals.needsUpdate=true;geo.computeBoundingSphere();path.object.userData.poreRoute=points;
    }
  }
  function update(grind, pressure, channel, time, ratio) {
    const g = clamp(grind, 0, 100);
    const p = Math.max(0, finite(pressure, 9));
    const t = finite(time, 0);
    const preferential = !!channel;
    routeThroughPores(g,preferential);

    const throughput = clamp(ratio / 1.7, 0, 1);
    const delay = 0.75 + (g / 100) * 0.25;
    const wetness = smooth(0, delay, t);

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      const x = path.x0;

      const nearChannel = Math.exp(
        -Math.pow((x - 0.48) / 0.16, 2)
      );

      const isActive = preferential
        ? nearChannel > 0.25 || i % 4 === 0
        : true;

      path.object.visible =
        isActive && p > 0 && wetness > 0.02;

      path.object.material.uniforms.uTime.value=t*(.5+throughput);
      path.object.scale.set(
        1,
        clamp(wetness * 1.2, 0.02, 1),
        1
      );

      path.object.position.y =
        0.682 *
        (1 - clamp(wetness * 1.2, 0, 1));
    }

    // Pressure and elapsed time control the brown outlet streams.
    const running =
      p > 0 && t > delay && t < 16 && ratio > 0.005;

    for (let i = 0; i < streamSegments.length; i++) {
      const o = streamSegments[i];

      o.visible = running;

      if (!running) continue;

      const pulse =
        0.88 +
        Math.sin(t * 8 + i * 1.7) * 0.09;

      const width =
        lerp(0.55, 1.22, throughput) * pulse;

      o.scale.x = width;
      o.scale.z = width;
      const extension=clamp((t-delay)/.5,0,1);
      // Grow from the fixed filter outlet, never from the middle of the stream.
      o.scale.y=extension;
      o.position.y=-.423-(.802*extension)/2;
    }

    for (let i = 0; i < upperWetting.length; i++) {
      const o = upperWetting[i];

      o.visible = p > 0 && wetness > 0.01;
      o.scale.y = clamp(wetness, 0.01, 1);
    }

    flow.userData.referenceFlowRatio = ratio;
    flow.userData.visualModel = 'schematic';
  }

  return { group: flow, update };
}

function createSectionAssembly(parent, side, seed) {
  const root = part(
    parent,
    side === 0
      ? 'reference coarse grind section'
      : 'adjustable grind section'
  );

  root.position.x = SIDE_X[side];

  const housing = createBasketHousing(root);

  const bed = part(root, 'visible coffee grounds');
  box(bed,1.86,.72,.09,P.groundDark,0,.23,-.01,.025);
  const grains = createParticleBed(bed, seed);

  const flow = createFlowSystem(root, seed, grains);

  // A grounded cup under each visible filter outlet.
  const cup = createCoffeeCup();

  cup.group.name =
    side === 0
      ? 'reference extraction cup'
      : 'adjusted extraction cup';

  cup.group.scale.setScalar(0.62);
  cup.group.position.set(0, -1.705, -0.08);
  root.add(cup.group);

  // Solid visual base below assembly.
  box(
    root,
    2.30,
    0.105,
    1.37,
    P.darkGreen,
    0,
    -1.754,
    -0.07,
    0.035
  );

  box(
    root,
    1.94,
    0.020,
    1.15,
    P.gold,
    0,
    -1.695,
    -0.07,
    0.006
  );

  // Cutaway support uprights with subdued brass hardware.
  for (const x of [-1.13, 1.13]) {
    cylinderBetween(
      root,
      [x, -1.65, -0.31],
      [x, 0.19, -0.31],
      0.029,
      P.darkMetal,
      10
    );

    cyl(
      root,
      0.060,
      0.038,
      P.gold,
      x,
      -1.655,
      -0.31
    );
  }

  // Top distributor: matte metal, with no blue bead shower.
  box(
    root,
    2.15,
    0.098,
    0.68,
    P.darkMetal,
    0,
    0.94,
    -0.035,
    0.019
  );

  box(
    root,
    1.86,
    0.026,
    0.51,
    P.brushedSteel,
    0,
    0.873,
    -0.035,
    0.008
  );

  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.185;

    cyl(
      root,
      0.020,
      0.009,
      P.hole,
      x,
      0.855,
      0.115
    );
  }

  // Identifier detail on the distributor.
  box(
    root,
    0.48,
    0.046,
    0.07,
    P.gold,
    0,
    0.989,
    0.05,
    0.008
  );

  return {
    root,
    housing,
    grains,
    flow,
    cup
  };
}

export function buildCoffeeComparison() {
  const group = new T.Group();
  group.name = 'Espresso grind comparison';

  const sections = [
    createSectionAssembly(group, 0, 17),
    createSectionAssembly(group, 1, 113)
  ];

  // Visual divider, restrained and mechanically plausible.
  box(
    group,
    0.027,
    2.96,
    0.04,
    P.gold,
    0,
    -0.33,
    -0.45,
    0.006
  );

  const defaults = {
    grind: 70,
    pressure: 9,
    channel: 0,
    time: 0
  };

  const referenceFlow = finite(coffeeFlow(30, 9), 1);

  // Protect percentages from a zero or invalid model result.
  const safeReference =
    referenceFlow > 1e-9 ? referenceFlow : 1;

  const annotations = [
    {
      text: '① 기준 분쇄도 30 · 금속 바스켓과 커피 입자 단면',
      point: [-1.52, 1.28, 0.05]
    },
    {
      text: '② 조절 분쇄도 · 입자 사이 흐름과 채널링',
      point: [1.52, 1.28, 0.05]
    }
  ];

  function update(s) {
    const grind = clamp(finite(s.grind, 70), 0, 100);
    const pressure = Math.max(
      0,
      finite(s.pressure, 9)
    );

    const time = Math.max(0, finite(s.time, 0));
    const channel = !!s.channel;

    const values = [30, grind];

    const comparison = [];

    for (let i = 0; i < sections.length; i++) {
      const bed = sections[i];
      const sideGrind = values[i];
      const sideChannel = i === 1 && channel;

      const absoluteFlow = finite(
        coffeeFlow(sideGrind, pressure),
        0
      );

      const ratio = Math.max(
        0,
        absoluteFlow / safeReference
      );

      const percent = Math.round(ratio * 100);

      comparison.push(percent);

      bed.grains.update(
        sideGrind,
        sideChannel
      );

      bed.flow.update(
        sideGrind,
        pressure,
        sideChannel,
        time,
        ratio
      );

      // The cup is a time-dependent visual accumulator.
      // This does not purport to calculate real beverage mass.
      const extractionProgress =
        clamp((time - (1.25 + sideGrind / 100 * .25)) / (16 - (1.25 + sideGrind / 100 * .25)));

      const illustrativeFill = clamp(
        extractionProgress * ratio * 0.73,
        0,
        0.88
      );

      bed.cup.setFill(
        illustrativeFill,
        time,
        pressure > 0 && time > (1.25 + sideGrind / 100 * .25) && time < 16
      );
    }

    s.comparison = comparison;

    group.userData.reading = {
      left: comparison[0],
      right: comparison[1],
      pressure,
      grind,
      channel
    };

    group.userData.reference = {
      grind: 30,
      pressure: 9,
      flow: referenceFlow
    };
  }

  function advance(s, dt) {
    const delta = Math.max(0, finite(dt, 0));
    s.time = Math.max(
      0,
      Math.min(16,finite(s.time, 0) + delta)
    );
    if(s.time>=16)s.running=false;

    update(s);
  }

  function compare(s) {
    if (
      !Array.isArray(s.comparison) ||
      s.comparison.length !== 2
    ) {
      update(s);
    }

    return {
      left: s.comparison[0],
      right: s.comparison[1],
      pressure: finite(s.pressure, 9),
      grind: finite(s.grind, 70),
      channel: !!s.channel
    };
  }

  function reading(s) {
    const result = compare(s);

    return (
      `관찰 ${(s.time||0).toFixed(1)} / 16초 · 두 바스켓 ${result.pressure}bar · ` +
      `왼쪽 분쇄도 30: ${result.left}% / ` +
      `오른쪽 분쇄도 ${result.grind}: ${result.right}% · ` +
      `분쇄도 30·9bar의 모델 흐름을 100으로 둔 상대 비교값` +
      (result.channel
        ? ' · 오른쪽 채널링 단면 표시'
        : '')
    );
  }

  update(defaults);

  return {
    group,
    eye: [0.5, 3.6, 10.8],
    defaults,
    update,
    advance,
    reading,
    compare,
    annotations
  };
}

// -----------------------------------------------------------------------------
// 3. BREW RATIO
//
// Dose and beverage yield are masses.
// Brew ratio = yield / dose.
// Cup fill is explicitly symbolic; it is not a grams-to-volume conversion.
// -----------------------------------------------------------------------------

function createScale(parent, width, depth, name) {
  const root = part(parent, name);

  // Cast-metal weighing platform.
  box(
    root,
    width,
    0.185,
    depth,
    P.darkMetal,
    0,
    0.165,
    0,
    0.055
  );

  // Raised stainless steel weighing surface.
  box(
    root,
    width * 0.89,
    0.057,
    depth * 0.77,
    P.brushedSteel,
    0,
    0.281,
    -0.075,
    0.025
  );

  box(
    root,
    width * 0.80,
    0.014,
    depth * 0.64,
    P.edgeSteel,
    0,
    0.317,
    -0.075,
    0.005
  );

  // Front recessed readout.
  const displayPlate = box(
    root,
    width * 0.58,
    0.085,
    0.024,
    P.displayGlass,
    0,
    0.188,
    depth / 2 - 0.014,
    0.012
  );

  displayPlate.name = 'scale numeric display housing';

  for (const x of [-0.32, 0.32]) {
    cyl(
      root,
      0.036,
      0.014,
      P.rubber,
      x * width / 1.9,
      0.202,
      depth / 2 + 0.004
    );
  }

  // Feet keep the scale visibly above the desk.
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      cyl(
        root,
        0.072,
        0.060,
        P.rubber,
        x * width * 0.39,
        0.040,
        z * depth * 0.35
      );
    }
  }

  return root;
}

function createDoseBasket(parent) {
  const root = part(parent, 'dose basket on left scale');

  // Solid steel bottom with a lightly recessed puck.
  // The puck's upper face is exposed.
  const profile = [
    [0.000, 0.000],
    [0.505, 0.000],
    [0.575, 0.056],
    [0.595, 0.125],
    [0.610, 0.410],
    [0.625, 0.470],
    [0.625, 0.500],
    [0.581, 0.500],
    [0.562, 0.438],
    [0.543, 0.178],
    [0.515, 0.105],
    [0.000, 0.105]
  ];

  lathe(root, profile, P.brushedSteel);

  torusHorizontal(
    root,
    0.606,
    0.024,
    P.edgeSteel,
    0,
    0.488,
    0
  );

  const puck = cyl(
    root,
    0.526,
    0.245,
    P.ground,
    0,
    0.228,
    0
  );

  puck.name = 'ground coffee puck';

  const topSurface = cyl(
    root,
    0.526,
    0.018,
    P.groundDark,
    0,
    0.355,
    0
  );

  topSurface.name = 'visible tamped coffee face';

  // Irregular exposed granules on the upper face.
  const n = 140;

  const granules = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    P.groundLight,
    n
  );

  granules.name = 'surface granules';
  granules.castShadow = true;

  root.add(granules);

  const dummy = new T.Object3D();

  const initial = [];

  for (let i = 0; i < n; i++) {
    const a = hash(i * 13 + 81) * TAU;
    const r = Math.sqrt(hash(i * 19 + 93)) * 0.49;

    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    initial.push({ x, z, a });

    dummy.position.set(
      x,
      0.369 + hash(i * 31 + 7) * 0.013,
      z
    );

    dummy.rotation.set(
      hash(i * 7) * TAU,
      hash(i * 11) * TAU,
      hash(i * 17) * TAU
    );

    const size = lerp(
      0.013,
      0.028,
      hash(i * 23 + 17)
    );

    dummy.scale.set(
      size * 1.1,
      size * 0.62,
      size
    );

    dummy.updateMatrix();
    granules.setMatrixAt(i, dummy.matrix);
  }

  granules.instanceMatrix.needsUpdate = true;

  function setDose(dose) {
    const d = clamp(finite(dose, 18), 0, 100);

    // Modest puck height change is purely illustrative.
    const h = lerp(0.115, 0.290, d / 40);

    puck.scale.y = h / 0.245;

    // Raise or lower puck keeping its base approximately fixed.
    puck.position.y = 0.110 + h / 2;

    const y = 0.110 + h + 0.009;
    topSurface.position.y = y;

    const dummy = new T.Object3D();

    for (let i = 0; i < n; i++) {
      const m = initial[i];

      dummy.position.set(
        m.x,
        y + 0.010 + hash(i * 31 + 7) * 0.008,
        m.z
      );

      dummy.rotation.set(
        hash(i * 7) * TAU,
        hash(i * 11) * TAU,
        hash(i * 17) * TAU
      );

      const size = lerp(
        0.013,
        0.028,
        hash(i * 23 + 17)
      );

      dummy.scale.set(
        size * 1.1,
        size * 0.62,
        size
      );

      dummy.updateMatrix();
      granules.setMatrixAt(i, dummy.matrix);
    }

    granules.instanceMatrix.needsUpdate = true;

    puck.visible = d > 0;
    topSurface.visible = d > 0;
    granules.visible = d > 0;

    root.userData.dose = d;
  }

  setDose(18);

  return {
    group: root,
    setDose
  };
}

function createBalanceReadout(parent, x, textWidth = 0.75) {
  // Purely geometric status bar. Actual mass text belongs to reading(s)
  // or to the page UI; no CanvasTexture / document dependency.
  const root = part(parent, 'mass indicator');

  root.position.x = x;

  box(
    root,
    textWidth,
    0.057,
    0.035,
    P.darkGreen,
    0,
    0,
    0,
    0.010
  );

  const indicator = box(
    root,
    textWidth * 0.35,
    0.026,
    0.041,
    P.gold,
    -textWidth * 0.23,
    0,
    0.003,
    0.008
  );

  function setProgress(fraction) {
    const f = clamp(fraction);

    indicator.scale.x = Math.max(
      0.003,
      f / 0.35
    );

    indicator.position.x =
      -textWidth * 0.5 +
      textWidth * f * 0.5;

    indicator.visible = f > 0;
  }

  return {
    group: root,
    setProgress
  };
}

export function buildBrewRatio() {
  const group = new T.Group();
  group.name = 'Espresso dose and yield mass ratio';

  const defaults = {
    dose: 18,
    yield: 36
  };

  // Work surface.
  box(
    group,
    5.60,
    0.150,
    2.38,
    P.darkGreen,
    0,
    -0.095,
    0,
    0.050
  );

  box(
    group,
    5.46,
    0.026,
    2.24,
    P.gold,
    0,
    -0.004,
    0,
    0.008
  );

  // Two physically separated scales.
  const leftScale = createScale(
    group,
    2.12,
    1.76,
    'dose weighing scale'
  );

  const rightScale = createScale(
    group,
    2.12,
    1.76,
    'yield weighing scale'
  );

  leftScale.position.x = -1.48;
  rightScale.position.x = 1.48;

  // Two objects, each actually standing on its own scale.
  const doseBasket = createDoseBasket(group);

  doseBasket.group.position.set(
    -1.48,
    0.346,
    -0.13
  );

  const cup = createCoffeeCup();

  cup.group.name = 'yield cup reused from hero';
  cup.group.scale.setScalar(1.0);
  cup.group.position.set(
    1.48,
    0.345,
    -0.15
  );

  group.add(cup.group);

  // Side reference marker: dose on the left, extraction on right.
  const leftReadout = createBalanceReadout(
    group,
    -1.48
  );

  const rightReadout = createBalanceReadout(
    group,
    1.48
  );

  leftReadout.group.position.set(
    -1.48,
    0.650,
    0.92
  );

  rightReadout.group.position.set(
    1.48,
    0.650,
    0.92
  );

  // Brass center separation.
  box(
    group,
    0.022,
    0.670,
    0.052,
    P.gold,
    0,
    0.310,
    -0.79,
    0.005
  );

  const annotations = [
    {
      text: '① 투입량 · 마른 분쇄 커피의 질량(g)',
      point: [-1.48, 1.67, -0.08]
    },
    {
      text: '② 추출량 · 잔에 나온 음료의 질량(g)',
      point: [1.48, 1.67, -0.08]
    },
    {
      text: '추출비는 음료 질량 ÷ 투입 커피 질량',
      point: [0, 1.94, 0]
    }
  ];

  function update(s) {
    const dose = Math.max(
      0,
      finite(s.dose, defaults.dose)
    );

    const beverageYield = Math.max(
      0,
      finite(s.yield, defaults.yield)
    );

    doseBasket.setDose(dose);

    // A graphic fill cue only. Beverage mass is not water volume.
    const symbolicCupFill = clamp(
      beverageYield / 80,
      0,
      0.88
    );

    cup.setFill(
      symbolicCupFill,
      0,
      false
    );

    leftReadout.setProgress(
      clamp(dose / 40)
    );

    rightReadout.setProgress(
      clamp(beverageYield / 80)
    );

    const ratio =
      dose > 0
        ? beverageYield / dose
        : null;

    group.userData.dose = dose;
    group.userData.yield = beverageYield;
    group.userData.ratio = ratio;
    group.userData.cupFillIsSymbolic = true;
  }

  function reading(s) {
    const dose = Math.max(
      0,
      finite(s.dose, defaults.dose)
    );

    const beverageYield = Math.max(
      0,
      finite(s.yield, defaults.yield)
    );

    if (dose === 0) {
      return (
        `투입량 0g · 추출량 ${beverageYield}g · ` +
        `투입량이 0이므로 질량비를 계산할 수 없습니다 · ` +
        `잔 높이는 상징 표현`
      );
    }

    const ratio = beverageYield / dose;

    return (
      `${dose}g 넣고 ${beverageYield}g 추출 · ` +
      `질량비 1:${ratio.toFixed(2)} · ` +
      `추출비는 음료 질량을 투입 커피 질량으로 나눈 값 · ` +
      `잔 높이는 상징 표현`
    );
  }

  update(defaults);

  return {
    group,
    eye: [2.5, 5, 8],
    defaults,
    update,
    reading,
    annotations
  };
}