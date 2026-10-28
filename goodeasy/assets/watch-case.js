export function buildWatchCase(T, materials = {}) {
  const group = new T.Group();
  group.name = "watch-case";
  const PI = Math.PI;
  const TAU = 2 * PI;
  const height = y => y > 0 ? y * .65 : y;
  const D = {
    movementRadius: 2.4,
    movementYMin: 0,
    movementYMax: 1.07,
    caseRadius: 2.65,
    caseBottom: -0.16,
    caseTop: 1.08,
    lugCenterX: 1.65,
    lugThicknessX: 0.36,
    lugRootZ: 1.92,
    lugTipZ: 3.16,
    lugBoreZ: 2.945,
    lugBoreY: height(0.745),
    lugBoreRadius: 0.068,
    lugInnerFaceX: 1.47,
    lugOuterFaceX: 1.83,
    springTubeRadius: 0.054,
    springTubeInnerRadius: 0.044,
    springTubeLength: 2.82,
    springPlungerRadius: 0.041,
    springPlungerInnerX: 1.37,
    springPlungerOuterX: 1.66,
    crownY: 0.45
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
    profile = profile.map(([r,y]) => [r,height(y)]);
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
      (/plunger-retaining-collar|springbar-shoulder|crown-case-tube|crown-neck|crown-tube-seating-flange/.test(name)
       ? new T.LatheGeometry([[name.startsWith('crown')?.060:.044,-length/2],[radius,-length/2],[radius,length/2],[name.startsWith('crown')?.060:.044,length/2],[name.startsWith('crown')?.060:.044,-length/2]].map(p=>new T.Vector2(...p)),segments)
       : new T.CylinderGeometry(radius,radius,length,segments)),
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
    m.position.y = height(y);
    return m;
  }
  const caseProfile = [
    [2.413, -0.14],
    [2.485, -0.14],
    [2.545, -0.115],
    [2.608, -0.035],
    [2.648, 0.105],
    [2.650, 0.280],
    [2.650+(2.644-2.650)*(.35-.28)/(.665-.28),.35],
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
    [2.425, 1.300],
    [2.425, 1.085],
    [2.425, 0.665],
    [2.425,.35],
    [2.425, 0.100],
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
  // Drill the crown passage through both curved shell walls, not a painted recess.
  const wall=parts.case.middle,raw=wall.geometry,idx=raw.index.array,vs=raw.attributes.position,kept=[],eps=1e-5,a=TAU*2/128,y0=height(.28),y1=height(1.085),holeY=D.crownY,holeR=.11;
  for(let k=0;k<idx.length;k+=3){let cut=true;for(let j=0;j<3;j++){const n=idx[k+j],x=vs.getX(n),y=vs.getY(n),z=vs.getZ(n);if(!(x>2&&y>=y0-eps&&y<=y1+eps&&Math.abs(Math.atan2(z,x))<=a+eps))cut=false;}if(!cut)kept.push(idx[k],idx[k+1],idx[k+2]);}
  raw.setIndex(kept);raw.computeVertexNormals();
  const outerRadius=y=>{const u=y/.65;return u<=.665?2.650+(2.644-2.650)*(u-.28)/(.665-.28):2.644+(2.619-2.644)*(u-.665)/(1.085-.665);},innerRadius=()=>2.425;
  for(const [name,radius,flip] of [['outer-crown-bore-wall',outerRadius,true],['inner-crown-bore-wall',innerRadius,false]]){
    const shape=new T.Shape();shape.moveTo(-radius(y0)*Math.sin(a),y0);shape.lineTo(radius(y0)*Math.sin(a),y0);for(const y of [height(.35),height(.665),y1])shape.lineTo(radius(y)*Math.sin(a),y);shape.lineTo(-radius(y1)*Math.sin(a),y1);for(const y of [height(.665),height(.35)])shape.lineTo(-radius(y)*Math.sin(a),y);shape.closePath();const h=new T.Path();h.absarc(0,holeY,holeR,0,TAU,true);shape.holes.push(h);
    const g=new T.ShapeGeometry(shape,64),p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getX(i),y=p.getY(i);p.setXYZ(i,Math.sqrt(radius(y)**2-z*z),y,z);}if(flip){const ii=g.index.array;for(let k=0;k<ii.length;k+=3)[ii[k+1],ii[k+2]]=[ii[k+2],ii[k+1]];}g.computeVertexNormals();mesh(group,g,M.steel,name);
  }
  const bp=[],bi=[];for(let i=0;i<=96;i++){const t=i/96*TAU,y=holeY+Math.cos(t)*holeR,z=Math.sin(t)*holeR;for(const radius of [innerRadius,outerRadius])bp.push(Math.sqrt(radius(y)**2-z*z),y,z);if(i<96){const k=i*2;bi.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setIndex(bi);bg.computeVertexNormals();const boreMaterial=M.machined.clone();boreMaterial.side=T.DoubleSide;parts.case.stemBore=mesh(group,bg,boreMaterial,'Real radial crown stem passage');

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
  parts.case.crystalSeat = lathe(
    group,
    "crystal-seat",
    [
      [2.425, 1.325],
      [2.468, 1.325],
      [2.481, 1.345],
      [2.481, 1.397],
      [2.454, 1.422],
      [2.425, 1.422],
      [2.425, 1.404],
      [2.425, 1.325]
    ],
    M.brushed
  );
  parts.case.crystalGasket = lathe(
    group,
    "crystal-gasket",
    [[2.49,1.026/.65],[2.514,1.026/.65],[2.514,1.0348/.65],[2.50,1.0348/.65],[2.49,1.026/.65]],
    M.gasket
  );
  parts.case.casebackLip = lathe(
    group,
    "caseback-retaining-lip",
    [
      [2.425, -0.193],
      [2.449, -0.193],
      [2.497, -0.181],
      [2.526, -0.153],
      [2.531, -0.119],
      [2.511, -0.098],
      [2.458, -0.098],
      [2.425, -0.123],
      [2.425, -0.145],
      [2.425, -0.193]
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
    const u = distance => -sign * distance;
    const shape = new T.Shape();
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
    for(const curve of shape.curves)for(const key of ["v0","v1","v2","v3"])if(curve[key])curve[key].y=height(curve[key].y);
    const boreU = u(D.lugBoreZ);
    const boreV = D.lugBoreY;
    const hole = new T.Path();
    hole.absarc(
      boreU,
      boreV,
      D.lugBoreRadius + .018,
      0,
      TAU,
      true
    );
    shape.holes.push(hole);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      steps: 10,
      bevelEnabled: true,
      bevelSize: .018,
      bevelThickness: .012,
      bevelSegments: 3,
      curveSegments: 48
    });
    geometry.rotateY(PI / 2);
    const pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const t=Math.max(0,Math.min(1,(Math.abs(pos.getZ(i))-1.91)/(3.172-1.91))),smooth=t*t*(3-2*t),width=.78-.46*smooth;
      let x=thickness/2+(pos.getX(i)-thickness/2)*width/thickness,wx=x+xMin,z=pos.getZ(i);
      if(Math.hypot(wx,z)<2.418)x=side*Math.sqrt(Math.max(0,2.418**2-z*z))-xMin;
      pos.setX(i,x);
      const root=Math.max(0,Math.min(1,(2.65-Math.abs(z))/.74)),blend=root*root*(3-2*root),top=Math.max(0,Math.min(1,(pos.getY(i)-height(.64))/(height(1.145)-height(.64))));
      pos.setY(i,pos.getY(i)+.27*blend*top);
    }
    pos.needsUpdate=true;geometry.computeVertexNormals();
    // Smooth shared vertices on the bent lug surfaces, keeping right-angle
    // machined edges sharp. ExtrudeGeometry otherwise leaves each bent cap
    // triangle with a separate normal even along the same continuous surface.
    const normals=geometry.attributes.normal,buckets=new Map();
    for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*1e5)).join('/');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i);}
    const old=normals.array.slice();
    for(const ids of buckets.values())for(const i of ids){const base=new T.Vector3(old[i*3],old[i*3+1],old[i*3+2]),sum=new T.Vector3();for(const j of ids){const n=new T.Vector3(old[j*3],old[j*3+1],old[j*3+2]);if(base.dot(n)>.55)sum.add(n);}if(sum.lengthSq()>1e-10){sum.normalize();normals.setXYZ(i,sum.x,sum.y,sum.z);}}
    normals.needsUpdate=true;
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
  for (const sign of [-1, 1]) {
    for (const side of [-1, 1]) {
      createLug(side, sign);
    }
  }
  function makeSpringBar(sign) {
    const barGroup = new T.Group();
    barGroup.name =
      sign > 0
        ? "springbar-north"
        : "springbar-south";
    group.add(barGroup);
    const y = D.lugBoreY;
    const z = sign * D.lugBoreZ;
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
  const crownGroup = new T.Group();
  crownGroup.name = "crown-assembly";
  group.add(crownGroup);
  const crownY = D.crownY;
  cylX(
    crownGroup,
    "crown-case-tube",
    0.110,
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
    [0.120, -0.19],
    [0.205, -0.19],
    [0.258, -0.160],
    [0.281, -0.105],
    [0.286, 0.085],
    [0.270, 0.145],
    [0.221, 0.19],
    [0.00, 0.19],
    [0.00, -.08],
    [.120, -.08],
    [.120, -.19]
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
  cylX(crownGroup,"crown-tube-seating-flange",.128,.04,2.662,crownY,0,M.polished);
  parts.crown.group = crownGroup;
  parts.crown.body = crown;
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
  const springs=[];
  for(const bar of parts.springBars){
    const coil=new T.Mesh(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(-1,0,0),new T.Vector3(1,0,0)),1,.006,8,false),M.spring);coil.name='Working spring inside the spring bar';bar.add(coil);springs.push({bar,coil});
  }
  function updateRelease(value=0,which=1){
    const amount=Math.max(0,Math.min(1,value));
    for(const {bar,coil} of springs){
      const active=bar.userData.direction===which,compression=active?Math.min(1,amount/.60):0,lift=active?Math.max(0,(amount-.60)/.40)*.52:0;
      bar.position.y=lift;
      for(const p of bar.children.filter(o=>o.name.startsWith('spring-plunger-'))){const side=p.userData.tipX>0?1:-1;p.position.x=side*((D.springPlungerInnerX+D.springPlungerOuterX)/2-.23*compression);}
      const half=D.springPlungerInnerX-.23*compression,points=Array.from({length:321},(_,i)=>{const t=i/320,a=t*20*TAU;return new T.Vector3(-half+2*half*t,D.lugBoreY+Math.cos(a)*.024,bar.userData.z+Math.sin(a)*.024);});
      const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),320,.006,8,false);coil.geometry.dispose();coil.geometry=g;
    }
    group.updateMatrixWorld(true);
  }
  function showSprings(show=false){for(const {bar} of springs)for(const o of bar.children)if(o.isMesh&&o.name!=='Working spring inside the spring bar'&&!o.name.startsWith('spring-plunger-')){if(!o.userData.inspectMaterial){o.material=o.material.clone();o.userData.inspectMaterial=true;}o.material.transparent=show;o.material.opacity=show?.17:1;o.material.depthWrite=!show;}}
  updateRelease();
  return {
    group,
    parts,
    materials: M,
    dimensions: D,
    updateRelease,showSprings,
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
