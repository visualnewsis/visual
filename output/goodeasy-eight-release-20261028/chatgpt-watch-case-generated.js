
/**
 * VISUAL NEWSIS — 굳이구지 05
 * watch-case.js
 *
 * REAL GEOMETRY VERSION
 *
 * No CSG, no external assets, no straps, no buckle.
 *
 * X = crown / spring-bar axis
 * Y = height
 * Z = north / south lug direction
 *
 * Movement envelope:
 *   radius 2.4, Y 0..1.5
 *
 * Case:
 *   outer radius 2.65
 *   shallow, open movement cavity
 *
 * Construction:
 *   Case: LatheGeometry, Vector2(radius, height)
 *   Lugs: YZ Shape with REAL Path holes, ExtrudeGeometry along X
 *   Spring bars: hollow stepped tubes and individual plungers
 *
 * IMPORTANT:
 * Every lug bore is an actual through-hole in its solid geometry.
 * No decorative bore-mouth disks or fake recesses.
 */

export function buildWatchCase(T, materials = {}) {
  const group = new T.Group();
  group.name = "watch-case";

  const PI = Math.PI;
  const TAU = 2 * PI;

  const D = {
    movementRadius: 2.4,
    movementYMin: 0,
    movementYMax: 1.5,

    caseRadius: 2.65,
    caseBottom: -0.16,
    caseTop: 1.65,

    lugCenterX: 1.65,
    lugThicknessX: 0.36,

    lugRootZ: 1.92,
    lugTipZ: 3.16,

    lugBoreZ: 2.945,
    lugBoreY: 0.745,
    lugBoreRadius: 0.068,

    lugInnerFaceX: 1.47,
    lugOuterFaceX: 1.83,

    springTubeRadius: 0.054,
    springTubeInnerRadius: 0.030,
    springTubeLength: 2.82,

    springPlungerRadius: 0.041,
    springPlungerInnerX: 1.37,
    springPlungerOuterX: 1.66,

    crownY: 0.80
  };

  const parts = {
    lugs: [],
    lugBores: [],
    springBars: [],
    springPlungers: [],
    case: {},
    crown: {}
  };

  function mat(name, color, metalness, roughness, extra = {}) {
    return materials[name] ||
      new T.MeshPhysicalMaterial({
        color,
        metalness,
        roughness,
        ...extra
      });
  }

  const M = {
    steel: mat("steel", 0xaab4b7, 0.91, 0.30, {
      clearcoat: 0.12,
      clearcoatRoughness: 0.27
    }),

    polished: mat("polished", 0xd1d8d9, 0.94, 0.19, {
      clearcoat: 0.23,
      clearcoatRoughness: 0.15
    }),

    brushed: mat("brushed", 0x909c9f, 0.88, 0.39),

    machined: mat("machined", 0xbcc6c8, 0.91, 0.27),

    dark: mat("dark", 0x465155, 0.83, 0.44),

    spring: mat("spring", 0xb9c3c5, 0.94, 0.23),

    gasket: mat("gasket", 0x171b1c, 0.0, 0.91)
  };

  function mesh(parent, geometry, material, name, data = {}) {
    const m = new T.Mesh(geometry, material);

    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData = {
      partName: name,
      ...data
    };

    parent.add(m);
    return m;
  }

  function lathe(parent, name, profile, material, segments = 128) {
    // Vector2(radius, height). Never reverse.
    const points = profile.map(
      ([r, y]) => new T.Vector2(r, y)
    );

    return mesh(
      parent,
      new T.LatheGeometry(points, segments),
      material,
      name,
      { profile, axis: "Y" }
    );
  }

  function cylX(
    parent,
    name,
    radius,
    length,
    x,
    y,
    z,
    material,
    segments = 48
  ) {
    const m = mesh(
      parent,
      new T.CylinderGeometry(
        radius,
        radius,
        length,
        segments
      ),
      material,
      name,
      {
        axis: "X",
        radius,
        length,
        center: [x, y, z]
      }
    );

    m.rotation.z = -PI / 2;
    m.position.set(x, y, z);

    return m;
  }

  function torusY(parent, name, radius, tubeRadius, y, material) {
    const m = mesh(
      parent,
      new T.TorusGeometry(radius, tubeRadius, 12, 128),
      material,
      name,
      { radius, tubeRadius, y }
    );

    m.rotation.x = PI / 2;
    m.position.y = y;

    return m;
  }

  // ============================================================
  // 1. CASE MIDDLE — SHALLOW STRUCTURAL SHELL
  // ============================================================

  /*
   * All inner radii are >= 2.40.
   * No metal is placed inside the movement's radial envelope.
   *
   * The shell is deliberately open through its center.
   * The separate movement mainplate supplies the internal support.
   */

  const caseProfile = [
    [2.413, -0.14],
    [2.485, -0.14],

    [2.545, -0.115],
    [2.608, -0.035],

    [2.648, 0.105],
    [2.650, 0.280],

    [2.644, 0.665],
    [2.619, 1.085],

    [2.580, 1.410],
    [2.545, 1.505],

    [2.490, 1.520],
    [2.452, 1.490],

    [2.452, 1.408],
    [2.472, 1.375],

    [2.472, 1.322],
    [2.420, 1.322],

    [2.405, 1.300],
    [2.405, 0.100],

    [2.427, 0.063],
    [2.427, -0.095],

    [2.413, -0.14]
  ];

  parts.case.middle = lathe(
    group,
    "contoured-case-middle",
    caseProfile,
    M.steel
  );

  // Narrow chamfered upper bezel.
  // No wide decorative dial ring.

  parts.case.bezel = lathe(
    group,
    "machined-bezel",
    [
      [2.414, 1.468],
      [2.473, 1.468],

      [2.516, 1.484],
      [2.547, 1.532],

      [2.539, 1.564],
      [2.510, 1.592],

      [2.458, 1.597],
      [2.422, 1.577],

      [2.414, 1.556],
      [2.414, 1.468]
    ],
    M.polished
  );

  // Crystal seat with real annular clearance.

  parts.case.crystalSeat = lathe(
    group,
    "crystal-seat",
    [
      [2.405, 1.325],
      [2.468, 1.325],
      [2.481, 1.345],
      [2.481, 1.397],
      [2.454, 1.422],
      [2.425, 1.422],
      [2.405, 1.404],
      [2.405, 1.325]
    ],
    M.brushed
  );

  parts.case.crystalGasket = lathe(
    group,
    "crystal-gasket",
    [
      [2.427, 1.423],
      [2.454, 1.423],
      [2.458, 1.429],
      [2.458, 1.458],
      [2.451, 1.464],
      [2.432, 1.464],
      [2.427, 1.458],
      [2.427, 1.423]
    ],
    M.gasket
  );

  // Lower caseback seating lip.

  parts.case.casebackLip = lathe(
    group,
    "caseback-retaining-lip",
    [
      [2.405, -0.193],
      [2.449, -0.193],
      [2.497, -0.181],
      [2.526, -0.153],
      [2.531, -0.119],
      [2.511, -0.098],
      [2.458, -0.098],
      [2.425, -0.123],
      [2.405, -0.145],
      [2.405, -0.193]
    ],
    M.brushed
  );

  parts.case.casebackGasket = lathe(
    group,
    "caseback-gasket",
    [
      [2.429, -0.123],
      [2.460, -0.123],
      [2.464, -0.116],
      [2.464, -0.095],
      [2.429, -0.095],
      [2.429, -0.123]
    ],
    M.gasket
  );

  torusY(
    group,
    "upper-bezel-edge-highlight",
    2.500,
    0.008,
    1.585,
    M.machined
  );

  // ============================================================
  // 2. FOUR REAL THROUGH-BORED LUGS
  // ============================================================

  /*
   * Each lug is built from a YZ side profile.
   *
   * The Shape lies in local XY:
   *
   *   local X = -world Z
   *   local Y =  world Y
   *
   * Extrusion runs along local +Z.
   *
   * rotation.y = +PI/2 converts:
   *
   *   local extrusion Z -> world +X
   *
   * Therefore:
   *   bore axis = world X
   *   side profile = world YZ
   *
   * The hole Path is triangulated out of the ExtrudeGeometry.
   * There is NO metal inside the bore.
   */

  function createLug(side, sign) {
    const lugGroup = new T.Group();

    lugGroup.name =
      `lug-${sign > 0 ? "north" : "south"}-` +
      `${side > 0 ? "right" : "left"}`;

    group.add(lugGroup);

    const thickness = D.lugThicknessX;
    const centerX = side * D.lugCenterX;
    const xMin = centerX - thickness / 2;
    const xMax = centerX + thickness / 2;

    // Local U runs opposite world Z after rotation.
    const u = distance => -sign * distance;

    const shape = new T.Shape();

    /*
     * Organic side silhouette:
     * thicker at the case root, tapered toward the end.
     *
     * These are actual side-profile boundaries, not tubes
     * placed on top of an arbitrary rectangular bar.
     */

    shape.moveTo(u(1.91), 1.085);

    shape.bezierCurveTo(
      u(2.09), 1.145,
      u(2.28), 1.105,
      u(2.44), 1.017
    );

    shape.bezierCurveTo(
      u(2.68), 0.946,
      u(2.90), 0.918,
      u(3.092), 0.877
    );

    shape.quadraticCurveTo(
      u(3.172), 0.850,
      u(3.172), 0.769
    );

    shape.lineTo(u(3.172), 0.621);

    shape.quadraticCurveTo(
      u(3.154), 0.552,
      u(3.092), 0.537
    );

    shape.bezierCurveTo(
      u(2.89), 0.524,
      u(2.63), 0.548,
      u(2.42), 0.632
    );

    shape.bezierCurveTo(
      u(2.21), 0.705,
      u(2.066), 0.760,
      u(1.91), 0.775
    );

    shape.closePath();

    // Genuine circular through-hole.
    // Path radius must be smaller than the metal edge clearance.

    const boreU = u(D.lugBoreZ);
    const boreV = D.lugBoreY;

    const hole = new T.Path();

    hole.absarc(
      boreU,
      boreV,
      D.lugBoreRadius,
      0,
      TAU,
      true
    );

    shape.holes.push(hole);

    /*
     * No bevel in the initial topology:
     * guarantees the bore is a straight cylindrical cut
     * with a constant radius through the entire X thickness.
     *
     * Chamfering of the outer perimeter is done through
     * a narrow side-edge mesh, not by filling the hole.
     */

    const geometry = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 48
    });

    // Convert local extrusion axis to world X.
    geometry.rotateY(PI / 2);

    // Geometry's world-X range after rotation: 0..thickness.
    // Start at xMin.
    const body = mesh(
      lugGroup,
      geometry,
      M.steel,
      "lug-solid-with-true-through-bore",
      {
        side,
        sign,
        xMin,
        xMax,
        thicknessX: thickness,
        boreCenter: [
          centerX,
          D.lugBoreY,
          sign * D.lugBoreZ
        ],
        boreRadius: D.lugBoreRadius,
        boreAxis: [1, 0, 0],
        trueThroughHole: true
      }
    );

    body.position.x = xMin;

    /*
     * The root enters the case's outer surface:
     * this is the normal junction for independent meshes.
     *
     * No exposed rod, post, screw or ornamental joint
     * is added over the case-lug connection.
     *
     * The hidden overlap is limited to the structural root.
     * It does not intersect the spring-bar bore.
     */

    const bore = {
      id: lugGroup.name,
      axis: [1, 0, 0],
      radius: D.lugBoreRadius,
      xMin,
      xMax,
      y: D.lugBoreY,
      z: sign * D.lugBoreZ,
      length: thickness,
      geometry: body
    };

    lugGroup.userData = {
      partType: "lug",
      independentPart: true,
      bore,
      rootZ: sign * D.lugRootZ,
      tipZ: sign * D.lugTipZ
    };

    parts.lugs.push(lugGroup);
    parts.lugBores.push(bore);

    return lugGroup;
  }

  // Four individual lug solids.
  for (const sign of [-1, 1]) {
    for (const side of [-1, 1]) {
      createLug(side, sign);
    }
  }

  // ============================================================
  // 3. TWO HOLLOW STEPPED SPRING BARS
  // ============================================================

  /*
   * Spring-bar axis is world X.
   *
   * Both tips enter the real lug bores.
   *
   * Lug inner faces:
   *   left  = -1.47
   *   right = +1.47
   *
   * Plunger tip:
   *   left  = -1.66
   *   right = +1.66
   *
   * Thus insertion into each lug:
   *   1.66 - 1.47 = 0.19
   *
   * The bore extends to X = +/-1.83.
   * The plunger ends inside the metal thickness,
   * not beyond the exterior lug face.
   */

  function makeSpringBar(sign) {
    const barGroup = new T.Group();

    barGroup.name =
      sign > 0
        ? "springbar-north"
        : "springbar-south";

    group.add(barGroup);

    const y = D.lugBoreY;
    const z = sign * D.lugBoreZ;

    /*
     * Lathe profile uses (radius, axial coordinate).
     * Lathe axis is local Y.
     *
     * rotation.z = -PI/2 converts local Y to world +X.
     */

    const halfTube = D.springTubeLength / 2;

    const tubeProfile = [
      [D.springTubeInnerRadius, -halfTube],
      [0.047, -halfTube],
      [D.springTubeRadius, -halfTube + 0.010],

      [D.springTubeRadius, halfTube - 0.010],
      [0.047, halfTube],
      [D.springTubeInnerRadius, halfTube],

      [D.springTubeInnerRadius, -halfTube]
    ];

    const tubeGeometry = new T.LatheGeometry(
      tubeProfile.map(
        ([radius, height]) =>
          new T.Vector2(radius, height)
      ),
      64
    );

    const sleeve = mesh(
      barGroup,
      tubeGeometry,
      M.spring,
      "hollow-stepped-sleeve",
      {
        axis: "X",
        length: D.springTubeLength,
        outerRadius: D.springTubeRadius,
        innerRadius: D.springTubeInnerRadius
      }
    );

    sleeve.rotation.z = -PI / 2;
    sleeve.position.set(0, y, z);

    const plungers = [];

    for (const side of [-1, 1]) {
      /*
       * A 0.29-long plunger extends from 1.37 to 1.66.
       * The tube end is at 1.41, so a short internal portion
       * overlaps the sleeve cavity.
       */

      const inner = D.springPlungerInnerX;
      const outer = D.springPlungerOuterX;

      const center = side * (inner + outer) / 2;
      const length = outer - inner;

      const plunger = cylX(
        barGroup,
        `spring-plunger-${side}`,
        D.springPlungerRadius,
        length,
        center,
        y,
        z,
        M.polished
      );

      plunger.userData = {
        ...plunger.userData,
        boreAxis: "X",
        tipX: side * outer,
        rootX: side * inner,
        seatedDepth: outer - D.lugInnerFaceX,
        retractable: true,
        maxRetraction: 0.12
      };

      plungers.push(plunger);

      // Internal collar: wider than plunger, smaller than lug gap.
      // Never covers the lug bore opening.

      cylX(
        barGroup,
        `plunger-retaining-collar-${side}`,
        0.062,
        0.052,
        side * 1.385,
        y,
        z,
        M.brushed
      );

      // Stepped shoulder near the sleeve end.
      cylX(
        barGroup,
        `springbar-shoulder-${side}`,
        0.071,
        0.042,
        side * 1.430,
        y,
        z,
        M.machined
      );

      /*
       * The shoulder reaches X=1.451.
       * The lug inner face is X=1.470.
       *
       * Remaining clearance = 0.019.
       *
       * Only the narrow plunger enters the lug hole.
       */
    }

    barGroup.userData = {
      partType: "springBar",
      direction: sign,
      axis: [1, 0, 0],
      y,
      z,
      sleeveLength: D.springTubeLength,
      plungerRadius: D.springPlungerRadius,
      lugBoreRadius: D.lugBoreRadius,
      insertionDepth: 0.19,
      seated: true
    };

    parts.springBars.push(barGroup);
    parts.springPlungers.push(...plungers);

    return barGroup;
  }

  makeSpringBar(1);
  makeSpringBar(-1);

  // ============================================================
  // 4. CROWN — +X
  // ============================================================

  const crownGroup = new T.Group();
  crownGroup.name = "crown-assembly";

  group.add(crownGroup);

  const crownY = D.crownY;

  cylX(
    crownGroup,
    "crown-case-tube",
    0.128,
    0.20,
    2.68,
    crownY,
    0,
    M.brushed
  );

  cylX(
    crownGroup,
    "crown-neck",
    0.113,
    0.14,
    2.82,
    crownY,
    0,
    M.dark
  );

  const crownProfile = [
    [0.00, -0.19],
    [0.205, -0.19],
    [0.258, -0.160],
    [0.281, -0.105],
    [0.286, 0.085],
    [0.270, 0.145],
    [0.221, 0.19],
    [0.00, 0.19]
  ];

  const crownGeometry = new T.LatheGeometry(
    crownProfile.map(
      ([r, h]) => new T.Vector2(r, h)
    ),
    64
  );

  const crown = mesh(
    crownGroup,
    crownGeometry,
    M.brushed,
    "machined-crown",
    {
      diameter: 0.572,
      axialLength: 0.38,
      axis: "X"
    }
  );

  crown.rotation.z = -PI / 2;
  crown.position.set(3.02, crownY, 0);

  // Flutes are actual shallow raised geometry.

  for (let i = 0; i < 36; i++) {
    const a = i * TAU / 36;

    const flute = cylX(
      crownGroup,
      `crown-flute-${i}`,
      0.009,
      0.24,
      3.02,
      crownY + Math.cos(a) * 0.285,
      Math.sin(a) * 0.285,
      M.polished,
      8
    );

    flute.userData.fluteIndex = i;
  }

  parts.crown.group = crownGroup;
  parts.crown.body = crown;

  // ============================================================
  // 5. NUMERICAL BORE / BAR INSPECTION
  // ============================================================

  /*
   * All numbers are derived from the same D object used
   * to build the actual geometry.
   */

  function getGeometryReport() {
    const bores = parts.lugBores.map(b => ({
      lug: b.id,
      axis: b.axis,
      xMin: b.xMin,
      xMax: b.xMax,
      centerY: b.y,
      centerZ: b.z,
      radius: b.radius,
      thickness: b.length
    }));

    const bars = parts.springBars.map(b => ({
      name: b.name,
      axis: b.userData.axis,
      y: b.userData.y,
      z: b.userData.z,
      sleeveLength: b.userData.sleeveLength,
      plungerRadius: b.userData.plungerRadius,
      insertionDepth: b.userData.insertionDepth
    }));

    return {
      lugCount: parts.lugs.length,
      springBarCount: parts.springBars.length,
      boreCount: parts.lugBores.length,
      bores,
      bars
    };
  }

  // ============================================================
  // 6. ACTUAL RAY / TRIANGLE INTERSECTION TEST
  // ============================================================

  /*
   * A ray is fired along +X through each lug.
   *
   * Test A:
   *   bore centerline must have ZERO hits with lug body.
   *
   * Test B:
   *   a nearby solid region must produce hits.
   *
   * IMPORTANT:
   * This only tests the lug meshes, not the spring bars.
   * The spring bar is intentionally present inside the hole.
   *
   * Raycaster uses actual BufferGeometry triangles.
   * No metadata-only acceptance.
   */

  function verifyBoresWithRaycaster() {
    group.updateMatrixWorld(true);

    const results = [];

    for (const bore of parts.lugBores) {
      const lugMesh = bore.geometry;

      const originX = bore.xMin - 0.15;
      const direction = new T.Vector3(1, 0, 0);

      const rayThroughBore = new T.Raycaster(
        new T.Vector3(
          originX,
          bore.y,
          bore.z
        ),
        direction,
        0,
        bore.length + 0.30
      );

      const boreHits = rayThroughBore.intersectObject(
        lugMesh,
        false
      );

      /*
       * Solid control near the root-facing side of the bore,
       * but outside its circular aperture.
       *
       * Distance from bore center = 0.15 > 0.068.
       */

      const solidControlZ =
        bore.z + (bore.z > 0 ? -0.15 : 0.15);

      const solidRay = new T.Raycaster(
        new T.Vector3(
          originX,
          bore.y,
          solidControlZ
        ),
        direction,
        0,
        bore.length + 0.30
      );

      const solidHits = solidRay.intersectObject(
        lugMesh,
        false
      );

      results.push({
        lug: bore.id,
        boreCenterHits: boreHits.length,
        solidControlHits: solidHits.length,

        boreOpen: boreHits.length === 0,
        solidExists: solidHits.length > 0,

        passed:
          boreHits.length === 0 &&
          solidHits.length > 0
      });
    }

    return {
      results,
      passed: results.every(r => r.passed)
    };
  }

  // ============================================================
  // 7. SPRING-BAR FIT VERIFICATION
  // ============================================================

  function verifySpringBarFit() {
    const results = [];

    for (const bore of parts.lugBores) {
      const side = bore.xMin > 0 ? 1 : -1;

      const bar = parts.springBars.find(
        b => Math.abs(b.userData.z - bore.z) < 1e-8
      );

      const tipX = side * D.springPlungerOuterX;

      const insideAxially =
        tipX > bore.xMin &&
        tipX < bore.xMax;

      const radialClearance =
        bore.radius - D.springPlungerRadius;

      const centerAligned =
        Math.abs(bar.userData.y - bore.y) < 1e-8 &&
        Math.abs(bar.userData.z - bore.z) < 1e-8;

      const insideHole =
        insideAxially &&
        radialClearance > 0 &&
        centerAligned;

      results.push({
        lug: bore.id,
        tipX,
        boreX: [bore.xMin, bore.xMax],
        boreRadius: bore.radius,
        plungerRadius: D.springPlungerRadius,
        radialClearance,
        insertionDepth:
          D.springPlungerOuterX - D.lugInnerFaceX,
        centerAligned,
        insideHole
      });
    }

    return {
      results,
      passed: results.every(r => r.insideHole)
    };
  }

  // ============================================================
  // 8. ROOT / MOVEMENT CLEARANCE METADATA
  // ============================================================

  group.userData = {
    series: "VISUAL NEWSIS GOODEASY",
    chapter: "05 Mechanical Watch",

    geometryVersion: "real-through-bore",

    straps: false,
    buckle: false,

    axes: {
      movementPlane: "XZ",
      vertical: "Y",
      springBar: "X",
      crown: "+X"
    },

    movementEnvelope: {
      radius: D.movementRadius,
      yMin: D.movementYMin,
      yMax: D.movementYMax
    },

    lugCount: 4,
    springBarCount: 2,

    trueLugBores: true,

    springBarInsertionDepth: 0.19
  };

  return {
    group,
    parts,
    materials: M,
    dimensions: D,

    inspect: {
      geometryReport: getGeometryReport,
      verifyBoresWithRaycaster,
      verifySpringBarFit
    },

    camera: {
      position: [7.5, 6.7, 8.2],
      target: [0, 0.75, 0],
      fov: 32
    },

    lighting: {
      key: {
        position: [-4, 8, 6],
        intensity: 2.1,
        color: 0xfff4e4
      },

      fill: {
        position: [5, 4, 6],
        intensity: 0.95,
        color: 0xe3ebff
      },

      rim: {
        position: [-3, 6, -5],
        intensity: 1.4,
        color: 0xffffff
      }
    }
  };
}
