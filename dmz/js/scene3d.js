// 3D 디오라마: 렌더러, 조명, 지형, 수목, 경계선, 철책, 북측 요새화 요소, 사고 지점 표식, 먼지.
import * as THREE from './three.js?v=20261001-12';
import {
  W, Terrain, rawHeight, noise, riverZ, roadX, wallZ, fenceZ, forestMask, rng, smooth, lerp,
  drapeStrip, geomFrom, linePts, circlePts,
} from './terrain.js?v=20261001-12';
import { buildFence } from './fence.js?v=20261002-5';
import { buildVegetation } from './vegetation.js?v=20261002-5';

export const COLORS = {
  sky: new THREE.Color('#dfe3dd'),
  mint: '#00b4c9',
  line: '#ffffff',
  blast: '#e0533a',
  found: '#f0a23a',
};
// 사고 지점과 X-ray 구간은 가상 위치다.
export const SPOTS = {
  incident: { x: -4, z: 94 },
  xray: { x: -2, z: 46, hx: 30, hz: 19 },
};

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

export function createWorld(canvas, { low, foliageImage }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.localClippingEnabled = true;
  renderer.setClearColor(COLORS.sky, 1);

  const scene = new THREE.Scene();
  scene.background = COLORS.sky.clone();
  scene.fog = new THREE.Fog(COLORS.sky.clone(), 300, 1400);

  const camera = new THREE.PerspectiveCamera(40, 1, 1, 5000);

  const hemi = new THREE.HemisphereLight('#eef2ec', '#5f5843', 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.9);
  sun.position.set(-150, 260, 360);
  sun.intensity=2.6;
  scene.add(sun);

  // X-ray에서 지표를 잘라내는 평면 (구간 내부를 잘라냄)
  const cutPlanes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
  ];
  const setCut = (cx, cz, hx, hz) => {
    cutPlanes[0].constant = cx - hx; cutPlanes[1].constant = -(cx + hx);
    cutPlanes[2].constant = cz - hz; cutPlanes[3].constant = -(cz + hz);
  };
  setCut(0, 0, -1, -1);

  // ---------- 지형 ----------
  const terrain = low ? new Terrain(170, 138) : new Terrain(240, 194);
  const groundTexture = (() => {
    const c=document.createElement('canvas');c.width=c.height=256;
    const ctx=c.getContext('2d'),R=rng(844),pixels=ctx.createImageData(256,256);
    for(let i=0;i<256*256;i++){const v=Math.floor(230+R()*24);pixels.data.set([v,v,v-3,255],i*4);}
    ctx.putImageData(pixels,0,0);
    for(let i=0;i<1600;i++){const x=R()*256,y=R()*256;ctx.strokeStyle=R()>.5?'rgba(62,65,48,.13)':'rgba(251,246,226,.13)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+R()*2-1,y-1-R()*3);ctx.stroke();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;
  })();
  const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true, map:groundTexture, clippingPlanes: cutPlanes, clipIntersection: true });
  const groundGeo=terrain.buildMesh(),uv=new Float32Array(groundGeo.attributes.position.count*2);
  const groundColors=groundGeo.attributes.color;
  for(let i=0;i<groundGeo.attributes.position.count;i++){
    const p=groundGeo.attributes.position;uv[i*2]=p.getX(i)/18;uv[i*2+1]=p.getZ(i)/18;
    // 초지의 노란 기운을 낮춰 젖은 흙과 숲의 색을 가깝게 한다.
    const x=p.getX(i),z=p.getZ(i),wood=forestMask(x,z);
    const patch=noise(x*.023,z*.023)*.09+noise(x*.079,z*.079)*.035;
    let occlusion=0;
    for(const distance of [18,48,100]) {
      const sx=Math.max(W.xMin,Math.min(W.xMax,x-distance*.385)),sz=Math.max(W.zMin,Math.min(W.zMax,z+distance*.923));
      occlusion=Math.max(occlusion,(terrain.heightAt(sx,sz)-p.getY(i))/distance);
    }
    const damp=(1-.17*wood+patch)*(1-.16*smooth(.025,.24,occlusion));
    groundColors.setXYZ(i,groundColors.getX(i)*.88*damp,groundColors.getY(i)*.94*damp,groundColors.getZ(i)*1.02*damp);
  }
  groundGeo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const ground = new THREE.Mesh(groundGeo, groundMat);
  scene.add(ground);

  const skirt = new THREE.Mesh(terrain.buildSkirt(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  scene.add(skirt);
  const plinthGeo = new THREE.BoxGeometry(W.xMax - W.xMin + 10, 5, W.zMax - W.zMin + 10);
  const plinth = new THREE.Mesh(plinthGeo, new THREE.MeshLambertMaterial({ color: '#2b2f2c' }));
  plinth.position.set(0, W.base - 2.5, 0);
  scene.add(plinth);

  // ---------- 하천 ----------
  {
    const pts = [];
    for (let x = W.xMin + 0.5; x <= W.xMax - 0.5; x += 3) pts.push([x, riverZ(x), terrain.heightAt(x, riverZ(x))]);
    const ys = pts.map(p => p[2]);
    for (let i = 0; i < pts.length; i++) {
      let s = 0, n = 0;
      for (let k = -3; k <= 3; k++) { const v = ys[i + k]; if (v !== undefined) { s += v; n++; } }
      pts[i][2] = Math.min(s / n, ys[i]) + 0.9;
    }
    const water = new THREE.Mesh(geomFrom(drapeStrip(terrain, pts, 15, 0)),
      new THREE.MeshPhongMaterial({ color: '#7f9ea1', specular: '#cfdcd9', shininess: 70, clippingPlanes: cutPlanes, clipIntersection: true }));
    scene.add(water);
  }
  const waterY = x => terrain.heightAt(x, riverZ(x)) + 0.9;

  // ---------- 도로 (연결도로, 일반화) ----------
  const road = {};
  {
    const mk = (z0, z1) => {
      const pts = [];
      for (let z = z0; z >= z1; z -= 2) {
        const x = roadX(z);
        const nearRiver = smooth(14, 5, Math.abs(z - riverZ(x)));
        const g = terrain.heightAt(x, z);
        pts.push([x, z, nearRiver > 0 ? Math.max(g, lerp(g, waterY(x) + 1.2, nearRiver)) : undefined]);
      }
      return geomFrom(drapeStrip(terrain, pts, 4.4, 0.25));
    };
    const mat = new THREE.MeshLambertMaterial({ color: '#7a7972', polygonOffset: true, polygonOffsetFactor: -1 });
    road.south = new THREE.Mesh(mk(W.zMax - 1, -30), mat);
    road.gap = new THREE.Mesh(mk(-30, -58), mat.clone());
    road.north = new THREE.Mesh(mk(-58, W.zMin + 1), mat);
    scene.add(road.south, road.gap, road.north);
  }

  // ---------- 수목 (인스턴싱) ----------
  const trees = buildVegetation(terrain, { low, cutPlanes, foliageImage });
  trees.forEach(m => scene.add(m));

  // ---------- 경계선 (남방한계선·군사분계선·북방한계선) ----------
  const lineMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const mkLine = (z, w, color) => {
    const m = new THREE.Mesh(geomFrom(drapeStrip(terrain, linePts(W.xMin + 1, z, W.xMax - 1, z, 3), w, 0.6)), lineMat(color));
    m.renderOrder = 2; scene.add(m);
    // 저고도용 1px 선: 가까이서 굵은 띠처럼 보이지 않게 한다
    const P = [];
    const pts = linePts(W.xMin + 1, z, W.xMax - 1, z, 2);
    for (let i = 1; i < pts.length; i++) P.push(pts[i - 1][0], terrain.heightAt(pts[i - 1][0], z) + 0.35, z, pts[i][0], terrain.heightAt(pts[i][0], z) + 0.35, z);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    m.thin = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
    m.thin.renderOrder = 2; scene.add(m.thin);
    return m;
  };
  const lines = { sll: mkLine(W.SLL, 0.9, COLORS.line), mdl: mkLine(W.MDL, 0.75, COLORS.mint), nll: mkLine(W.NLL, 0.9, COLORS.line) };
  // 비무장지대 면 (구조 장면에서만)
  const band = new THREE.Mesh(
    (() => {
      const P = [], I = [], UV = [];
      for (let z = W.SLL; z >= W.NLL; z -= 8) drapeStrip(terrain, linePts(W.xMin + 1, z, W.xMax - 1, z, 8).map(p => p), 8, 0.4, { P, I, UV });
      return geomFrom({ P, I, UV });
    })(),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  band.renderOrder = 1;
  scene.add(band);

  // ---------- 철책 (남·북방한계선, 단순화) ----------
  const fences = [buildFence(terrain, W.SLL, 1, low), buildFence(terrain, W.NLL, -1, low)];
  fences.forEach(f => f.forEach(o => scene.add(o)));

  // ---------- 군사분계선 표지 (일반화) ----------
  {
    const xs = [];
    for (let x = W.xMin + 14; x < W.xMax - 10; x += 24) xs.push(x + (hash(x) - 0.5) * 6);
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.09, 2.0, 5).translate(0, 1.0, 0), new THREE.MeshLambertMaterial({ color: '#9a9a92' }), xs.length);   // 콘크리트 기둥
    const plate = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1.0, 0.08), new THREE.MeshLambertMaterial({ color: '#c58f3a' }), xs.length);   // 녹슨 황색 판 (수풀 속 표지판 사진 참고)
    const m = new THREE.Matrix4();
    xs.forEach((x, i) => {
      const y = terrain.heightAt(x, 0);
      post.setMatrixAt(i, m.makeRotationZ((hash(x,3)-0.5)*0.05).setPosition(x,y-0.08,0));
      plate.setMatrixAt(i, m.makeRotationFromEuler(new THREE.Euler(0,(hash(x,2)-0.5)*1.6,(hash(x,3)-0.5)*0.06)).setPosition(x,y+1.88,0.1));
      const faded = new THREE.Color('#ffffff').lerp(new THREE.Color('#806b48'),hash(x,4)*0.3);
      plate.setColorAt(i,faded);post.setColorAt(i,new THREE.Color('#ffffff').lerp(new THREE.Color('#777a63'),hash(x,5)*0.3));
    });
    scene.add(post, plate);
  }

  // ---------- 북측 요새화 요소 (일반화·가상 배치) ----------
  const north = buildNorth(terrain, scene);

  // ---------- 사고·조사 표식 ----------
  const marks = {};
  {
    const { x, z } = SPOTS.incident;
    const basic = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6 });
    const disc = { P: [], I: [], UV: [] };
    drapeStrip(terrain, circlePts(x,z,1.55,0,Math.PI*2,0.16),0.15,0.55,disc);
    drapeStrip(terrain,linePts(x-0.4,z,x+0.4,z,0.12),0.1,0.57,disc);
    drapeStrip(terrain,linePts(x,z-0.4,x,z+0.4,0.12),0.1,0.57,disc);
    marks.blast = new THREE.Mesh(geomFrom(disc), basic(COLORS.blast));
    const dash = { P: [], I: [], UV: [] };
    const R = 12, nD = 52;
    for (let k = 0; k < nD; k++) {
      const a0 = k / nD * Math.PI * 2, a1 = a0 + Math.PI * 2 / nD * 0.48;
      drapeStrip(terrain, circlePts(x, z, R, a0, a1, 0.2), 0.11, 0.55, dash);
    }
    marks.ring = new THREE.Mesh(geomFrom(dash), basic(COLORS.mint));
    const found = { P: [], I: [], UV: [] };
    marks.foundPts = [[x + 6.5, z - 4.5], [x - 7.5, z + 2.5], [x + 1.5, z + 8]];
    marks.foundPts.forEach(([fx, fz]) => drapeStrip(terrain, circlePts(fx, fz, 1.1,0,Math.PI*2,0.14), 0.12, 0.57, found));
    marks.found = new THREE.Mesh(geomFrom(found), basic(COLORS.found));
    [marks.blast, marks.ring, marks.found].forEach(m => { m.renderOrder = 3; scene.add(m); });
  }

  // ---------- 2018 지뢰 제거 작업 구간 (상징, 가상 위치): 흙 작업로 + 흰 표시 테이프 ----------
  const clear = {};
  {
    const cx = 40, cz = 114, lanes = 6, len = 44;
    const soilG = { P: [], I: [], UV: [] }, tapeG = { P: [], I: [], UV: [] };
    for (let k = 0; k < lanes; k++) {
      const x = cx + (k - (lanes - 1) / 2) * 5.2;
      drapeStrip(terrain, linePts(x, cz + len / 2, x, cz - len / 2, 1.5), 3.4, 0.35, soilG);
      for (const ex of [-1.85, 1.85]) drapeStrip(terrain, linePts(x + ex, cz + len / 2, x + ex, cz - len / 2, 1.5), 0.32, 0.45, tapeG);
    }
    const mk = (g, color, order) => {
      const m = new THREE.Mesh(geomFrom(g), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5 }));
      m.renderOrder = order; scene.add(m); return m;
    };
    clear.soil = mk(soilG, '#b29a73', 2);
    clear.tape = mk(tapeG, '#ffffff', 3);
    clear.pt = [cx, cz];
    clear.set = o => { clear.soil.material.opacity = 0.85 * o; clear.tape.material.opacity = o; clear.soil.visible = clear.tape.visible = o > 0.01; };
    clear.set(0);
  }

  // ---------- 먼지 ----------
  const dust = buildDust(terrain);
  scene.add(dust.points);

  const api = {
    renderer, scene, camera, terrain, cutPlanes, setCut, lines, band, north, marks, dust, road, hemi, sun, waterY, clear,
    setSize(w, h, dpr) { renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    setFog(camHeight) {
      const far = Math.min(3000, Math.max(320, 300 + camHeight * 3.4));
      scene.fog.far = far; scene.fog.near = far * 0.22;
    },
    render() { fences.forEach(f => f.update(camera)); renderer.render(scene, camera); },
  };
  return api;
}


// 북측 요소: 장벽, 철조망, 도로 단절, 지뢰 작업 구역(상징), 군 구조물.
// 실제 시설의 위치·형태를 재현하지 않은 일반화 표현이다.
function buildNorth(terrain, scene) {
  const groups = [];
  const dummy = new THREE.Object3D();
  const add = (geo, mat, items) => {
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    groups.push({ mesh, items });
    return mesh;
  };

  // 장벽 구간
  const walls = [];
  for (let x = -330; x < 330; x += 6.4) {
    if (hash(x, 3) < 0.13) continue;
    const z = wallZ(x + 3.2), dz = wallZ(x + 3.3) - wallZ(x + 3.1);
    walls.push({ x: x + 3.2, z, y: terrain.heightAt(x + 3.2, z) - 0.08, ry: -Math.atan2(dz, 0.2), rz: (hash(x, 11) - 0.5) * 0.02, s: [1, 0.88 + hash(x, 12) * 0.23, 1], d: hash(x, 9) });
  }
  const concrete = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); g.fillStyle = '#b5b2a5'; g.fillRect(0,0,128,128);
    for (let i = 0; i < 650; i++) {
      const x = hash(i,1)*128, y = hash(i,2)*128;
      g.fillStyle = i%3 ? 'rgba(77,75,57,.08)' : 'rgba(233,230,210,.14)';
      g.fillRect(x,y,1+hash(i,3)*13,2+hash(i,4)*20);
    }
    const shade=g.createLinearGradient(0,0,0,128); shade.addColorStop(0,'rgba(50,53,37,0)');shade.addColorStop(1,'rgba(50,53,37,.35)');g.fillStyle=shade;g.fillRect(0,0,128,128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const wallMesh = add(new THREE.BoxGeometry(6.1, 1.5, 0.7).translate(0, 0.75, 0), new THREE.MeshLambertMaterial({ color: '#dedbd0', map: concrete }), walls);
  const wallColor = new THREE.Color();
  walls.forEach((it,i)=>wallMesh.setColorAt(i,wallColor.set('#ffffff').lerp(new THREE.Color('#918c76'),hash(i,33)*0.35)));

  // 철조망 (윤형)
  const coils = [];
  for (let x = -330; x < 330; x += 0.95) {
    const z = wallZ(x) + 2.4;
    coils.push({ x, z, y: terrain.heightAt(x, z) + 0.45, ry: Math.PI / 2, rz: (hash(x, 4) - 0.5) * 0.5, s: [1, 1, 1], d: hash(x, 7) });
  }
  add(new THREE.TorusGeometry(0.5, 0.045, 3, 10), new THREE.MeshLambertMaterial({ color: '#4c4e4a' }), coils);

  // 군 구조물 (단순 상자)
  const st = [[-74, -9], [46, -10], [162, -8], [-196, -11], [-120, -150], [110, -168]].map(([x, o], i) => {
    const z = (o > -100 ? wallZ(x) + o : o);
    return { x, z, y: terrain.heightAt(x, z) - 0.2, ry: hash(i, 2) * 0.6 - 0.3, s: [1, 1, 1], d: 0.5 };
  });
  add(new THREE.BoxGeometry(5.5, 1.7, 4.2).translate(0, 0.85, 0), new THREE.MeshLambertMaterial({ color: '#a7a398' }), st);

  // 도로 단절 지점의 토사
  const mounds = [];
  for (let i = 0; i < 6; i++) {
    const z = -36 - i * 4.2, x = roadX(z) + (hash(i, 5) - 0.5) * 4;
    const r = 1.6 + hash(i, 6) * 1.6;
    mounds.push({ x, z, y: terrain.heightAt(x, z) - 0.2, ry: hash(i, 8) * 3, s: [r, 0.55 * r, r * 1.2], d: 0.3 + i * 0.08 });
  }
  add(new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#8d7758' }), mounds);

  // 작업 구역 (상징): 흙·평행 바퀴 흔적. 배치와 라벨은 유지한다.
  const hatch = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#a28e6d';g.fillRect(0,0,128,128);
    for(let i=0;i<700;i++){g.fillStyle=i%2?'rgba(66,60,45,.15)':'rgba(211,190,151,.18)';g.fillRect(hash(i,41)*128,hash(i,42)*128,1+hash(i,43)*9,1+hash(i,44)*6);}
    for(const y of [29,45,93,109]){g.strokeStyle='rgba(76,67,49,.32)';g.lineWidth=3;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(42,y+3,86,y-2,128,y);g.stroke();}
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const zones = [
    { x: -118, z: -94, w: 64, d: 24, a: 0.12 },
    { x: 34, z: -126, w: 58, d: 22, a: -0.16 },
    { x: -36, z: -164, w: 76, d: 20, a: 0.06 },
  ].map(Z => {
    const res = 18, P = [], UV = [], I = [];
    const ca = Math.cos(Z.a), sa = Math.sin(Z.a);
    for (let j = 0; j <= res; j++) for (let i = 0; i <= res; i++) {
      const u = (i / res - 0.5) * Z.w, v = (j / res - 0.5) * Z.d;
      const x = Z.x + u * ca - v * sa, z = Z.z + u * sa + v * ca;
      P.push(x, terrain.heightAt(x, z) + 0.45, z);
      UV.push(u / 19, v / 14);
    }
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const a = j * (res + 1) + i; I.push(a, a + res + 1, a + 1, a + 1, a + res + 1, a + res + 2);
    }
    const m = new THREE.Mesh(geomFrom({ P, I, UV }), new THREE.MeshLambertMaterial({ color: '#e1d4b7', map: hatch, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.renderOrder = 2;
    scene.add(m);
    return { mesh: m, ...Z };
  });

  const spoil = [];
  zones.forEach((Z,j)=>{for(let i=0;i<5;i++){const x=Z.x+(i-2)*Z.w/5,z=Z.z-Z.d/2-1.6;spoil.push({x,z,y:terrain.heightAt(x,z)-0.25,ry:hash(i,j)*3,s:[2.4+hash(i,53)*2,0.45+hash(i,54)*0.65,1.4],d:0.4});}});
  add(new THREE.SphereGeometry(1,7,4,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:'#8c795a'}),spoil);

  // 감시초소: 실제 사진(4460·4471)의 형태·재질·비례만 참고한 일반형. 위치는 가상.
  {
    const camo = ['#cfc8b8', '#bfb39e', '#b08c76', '#c9bda5', '#a59f8b', '#b79a86'].map(h => new THREE.Color(h));
    const parts = [];
    const box = (w, h, d, x, y, z, color, seg = 1, jitter = false) => {
      const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg).toNonIndexed();
      g.translate(x, y, z);
      const n = g.attributes.position.count, c = new Float32Array(n * 3), base = new THREE.Color(color);
      for (let t = 0; t < n; t += 6) {
        const k = jitter ? camo[Math.floor(hash(t, x + y * 3 + z) * camo.length)] : base;
        const s = 0.92 + hash(t, 11) * 0.1;
        for (let v = t; v < t + 6 && v < n; v++) { c[v * 3] = k.r * s; c[v * 3 + 1] = k.g * s; c[v * 3 + 2] = k.b * s; }
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      parts.push(g);
    };
    box(2.5, 3.2, 2.5, 0, 1.6, 0, '#c4bca9', 4, true);          // 하부 탑
    box(2.9, 1.25, 2.9, 0, 3.85, 0, '#c9c0ad', 4, true);        // 상부 관측실
    for (const [x, z, w, d] of [[0, 1.46, 1.3, 0.06], [0, -1.46, 1.3, 0.06], [1.46, 0, 0.06, 1.3], [-1.46, 0, 0.06, 1.3]])
      box(w, 0.42, d, x, 3.95, z, '#262a29');                   // 창 띠
    box(0.06, 0.3, 0.5, 1.26, 2.2, 0.5, '#2c302f');             // 하부 작은 창
    box(1.05, 0.9, 1.7, 1.95, 3.55, 0.2, '#c2b7a2', 2, true);   // 측면 발코니
    box(1.1, 0.12, 1.8, 1.95, 3.1, 0.2, '#a9a291');
    box(3.6, 0.22, 3.6, 0, 4.6, 0, '#b3ab99', 3, true);         // 처마형 평지붕
    box(1.3, 0.35, 1.3, 0, 4.88, 0, '#b8b09e');                 // 옥상 구조
    box(0.12, 0.7, 0.12, 0, 5.4, 0, '#9a9a94');                 // 카메라 마스트
    box(0.45, 0.25, 0.3, 0, 5.85, 0, '#e3e1da');
    box(0.035, 2.1, 0.035, 0.8, 5.6, -0.8, '#777970');
    box(0.6, 0.035, 0.035, 0.8, 6.2, -0.8, '#777970');
    box(0.035, 3.8, 0.025, 1.22, 2.3, -0.9, '#5b5e52'); // 외벽 배선
    box(0.06, 5.8, 0.06, -1.9, 2.9, -1.2, '#c7c7c2');           // 깃대
    let n = 0; parts.forEach(g => (n += g.attributes.position.count));
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
    let o = 0;
    parts.forEach(g => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    // 능선 위 가상 지점 (주변에서 가장 높은 곳)
    const posts = [[-120, -104], [28, -112], [176, -100]].map(([x0, z0], i) => {
      let best = [x0, z0, -1e9];
      for (let a = 0; a < 40; a++) {
        const x = x0 + (hash(a, i) - 0.5) * 50, z = z0 + (hash(i, a) - 0.5) * 36, h = terrain.heightAt(x, z);
        if (h > best[2]) best = [x, z, h];
      }
      return { x: best[0], z: best[1], y: best[2] - 0.2, ry: hash(i, 4) * 1.2, s: [1, 1, 1], d: 3.5 };   // 장벽보다 먼저 보이도록
    });
    add(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), posts);
    groups.postPts = posts;
  }

  // 장벽선을 따라 흙이 드러난 작업 구간 (2024년 북측 작업 현장 사진 참고)
  const soilPts = [];
  for (let x = -330; x <= 330; x += 3) soilPts.push([x, wallZ(x) - 3.5]);
  const soil = new THREE.Mesh(geomFrom(drapeStrip(terrain, soilPts, 15, 0.22)),
    new THREE.MeshLambertMaterial({ color: '#a88f6a', transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  soil.renderOrder = 1;
  scene.add(soil);

  let lastFront = NaN;
  const q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), mtx = new THREE.Matrix4();
  return {
    zones,
    labelPts: {
      wall: [-14, wallZ(-14)], wire: [64, wallZ(64) + 2.4], road: [roadX(-44), -44], zone: [zones[0].x, zones[0].z], structure: [46, wallZ(46) - 10], post: [groups.postPts[1].x, groups.postPts[1].z],
    },
    // front: 건설이 진행된 최북단 z (카메라 위치에 연동). 값이 작을수록 더 많이 나타난다.
    update(front, road) {
      if (Math.abs(front - lastFront) < 0.05) return;
      lastFront = front;
      const appear = (z, d) => smooth(z + 76 + d * 22, z + 34 + d * 22, front);
      for (const g of groups) {
        g.items.forEach((it, i) => {
          const k = appear(it.z, it.d);
          const ease = k * k * (3 - 2 * k);
          e.set(0, it.ry || 0, it.rz || 0);
          q.setFromEuler(e);
          pos.set(it.x, it.y - (1 - ease) * 1.6, it.z);
          scl.set(it.s[0] * (0.3 + 0.7 * ease), it.s[1] * ease + 1e-3, it.s[2] * (0.3 + 0.7 * ease));
          g.mesh.setMatrixAt(i, mtx.compose(pos, q, scl));
        });
        g.mesh.instanceMatrix.needsUpdate = true;
      }
      zones.forEach(Z => { Z.mesh.material.opacity = 0.88 * appear(Z.z, 0.4); });
      soil.material.opacity = 0.85 * appear(-62, -0.3);
      const cut = appear(-44, 0.1);
      road.gap.visible = cut < 0.5;
    },
  };
}

function buildDust(terrain) {
  const N = 170;
  const { x, z } = SPOTS.incident;
  const y0 = terrain.heightAt(x, z);
  const pos = new Float32Array(N * 3);
  const seeds = [];
  const R = rng(921);
  for (let i = 0; i < N; i++) {
    const a = R() * Math.PI * 2, sp = 2 + R() * 9, up = 1.5 + R() * 7;
    seeds.push([Math.cos(a) * sp, up, Math.sin(a) * sp, 0.6 + R() * 0.8]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const mat = new THREE.PointsMaterial({ color: '#b9ad97', size: 3.4, map: tex, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.visible = false;
  return {
    points,
    // t: 폭발 후 경과 시간(초). null이면 숨김.
    update(t) {
      if (t === null || t > 4.2) { points.visible = false; return; }
      points.visible = true;
      for (let i = 0; i < N; i++) {
        const s = seeds[i], k = 1 - Math.exp(-t * 2.4 * s[3]);
        pos[i * 3] = x + s[0] * k;
        pos[i * 3 + 1] = y0 + 0.5 + s[1] * k - Math.max(0, t - 1.2) * 0.5;
        pos[i * 3 + 2] = z + s[2] * k;
      }
      g.attributes.position.needsUpdate = true;
      mat.opacity = 0.75 * smooth(0, 0.08, t) * (1 - smooth(1.0, 4.2, t));
      mat.size = 2.6 + t * 1.6;
    },
  };
}
