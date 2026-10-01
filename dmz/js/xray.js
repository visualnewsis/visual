// 지표 아래 X-ray: 클리핑 평면으로 지표·수목을 잘라내고, 지층 단면 벽과 개념적 매설물을 드러낸다.
// 매설물의 위치와 수량은 실제를 나타내지 않는다.
import * as THREE from './three.js?v=20261001-11';
import { rng, smooth } from './terrain.js?v=20261001-11';
import { SPOTS } from './scene3d.js?v=20261001-11';

const DEPTH = 15;   // 단면 깊이 (과장된 수직 축척)
const SEG = 44;     // 벽 한 변의 분할 수
const ROWS = 6;

export function createXray(world) {
  const { terrain, scene } = world;
  const { x: cx, z: cz, hx: HX, hz: HZ } = SPOTS.xray;
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  // 단면 벽 (4변 × (SEG+1) × (ROWS+1))
  const nV = 4 * (SEG + 1) * (ROWS + 1);
  const wallPos = new Float32Array(nV * 3), wallCol = new Float32Array(nV * 3);
  const idx = [];
  for (let e = 0; e < 4; e++) for (let s = 0; s < SEG; s++) for (let k = 0; k < ROWS; k++) {
    const a = (e * (SEG + 1) + s) * (ROWS + 1) + k, b = a + ROWS + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const bands = ['#584631', '#755d42', '#8d7453', '#9c8561', '#80745c', '#5b5445', '#3f3b33'].map(h => new THREE.Color(h));
  for (let v = 0; v < nV; v++) {
    const k = v % (ROWS + 1);
    const c = bands[Math.min(bands.length - 1, Math.round(k / ROWS * (bands.length - 1)))];
    wallCol[v * 3] = c.r; wallCol[v * 3 + 1] = c.g; wallCol[v * 3 + 2] = c.b;
  }
  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute('position', new THREE.BufferAttribute(wallPos, 3));
  wallGeo.setAttribute('color', new THREE.BufferAttribute(wallCol, 3));
  wallGeo.setIndex(idx);
  const walls = new THREE.Mesh(wallGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  walls.frustumCulled = false;
  group.add(walls);

  // 바닥
  const FR = 14;
  const floorPos = new Float32Array((FR + 1) * (FR + 1) * 3);
  const fIdx = [];
  for (let j = 0; j < FR; j++) for (let i = 0; i < FR; i++) {
    const a = j * (FR + 1) + i; fIdx.push(a, a + FR + 1, a + 1, a + 1, a + FR + 1, a + FR + 2);
  }
  const floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute('position', new THREE.BufferAttribute(floorPos, 3));
  floorGeo.setIndex(fIdx);
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({ color: '#3a3730', side: THREE.DoubleSide }));
  floor.frustumCulled = false;
  group.add(floor);

  // 지표 윤곽 격자 (원래 지면 위치를 보여주는 고스트)
  const inside = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
  ];
  const gridP = [];
  const step = 2.5;
  for (let x = cx - HX; x <= cx + HX + 0.01; x += step) for (let z = cz - HZ; z < cz + HZ; z += 1.25)
    gridP.push(x, terrain.heightAt(x, z) + 0.15, z, x, terrain.heightAt(x, z + 1.25) + 0.15, z + 1.25);
  for (let z = cz - HZ; z <= cz + HZ + 0.01; z += step) for (let x = cx - HX; x < cx + HX; x += 1.25)
    gridP.push(x, terrain.heightAt(x, z) + 0.15, z, x + 1.25, terrain.heightAt(x + 1.25, z) + 0.15, z);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridP, 3));
  const gridMat = new THREE.LineBasicMaterial({ color: '#00b4c9', transparent: true, opacity: 0, clippingPlanes: inside, depthWrite: false });
  const grid = new THREE.LineSegments(gridGeo, gridMat);
  grid.renderOrder = 4;
  group.add(grid);

  // 스캔선
  const scanGeo = new THREE.BufferGeometry();
  const scanPos = new Float32Array((SEG + 1) * 3);
  scanGeo.setAttribute('position', new THREE.BufferAttribute(scanPos, 3));
  const scan = new THREE.Line(scanGeo, new THREE.LineBasicMaterial({ color: '#00b4c9', transparent: true, opacity: 0, depthTest: false }));
  scan.renderOrder = 5; scan.frustumCulled = false;
  scene.add(scan);

  // 개념적 매설물
  const R = rng(1950);
  const place = (n, d0, d1, inset = 3) => Array.from({ length: n }, () => {
    const x = cx - HX + inset + R() * (HX * 2 - inset * 2), z = cz - HZ + inset + R() * (HZ * 2 - inset * 2);
    const d = d0 + R() * (d1 - d0);
    return { x, z, y: terrain.heightAt(x, z) - d, d, r: R(), r2: R() };
  });
  const objs = {
    mine: place(20, 0.9, 2.6),
    uxo: place(9, 3.2, 10.5),
    remains: place(6, 2.4, 6.5, 6),
  };
  // 납작한 사각 상자형 (합참 공개 지뢰 사진의 형태 참고, 종류를 특정하지 않는 일반형)
  const mineMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.42, 1.15), new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#140f08' }), objs.mine.length);
  const uxoMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.32, 1.7, 4, 10), new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#170d06' }), objs.uxo.length);
  // 유해: 작고 흰 조각들의 묶음 (추상 표현)
  const pieces = [];
  objs.remains.forEach(o => { for (let k = 0; k < 4; k++) pieces.push({ ...o, k, ox: (R() - 0.5) * 2.2, oz: (R() - 0.5) * 1.6, rot: R() * 3.14, len: 0.5 + R() * 0.7 }); });
  const remMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.11, 1, 3, 6), new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#26241f' }), pieces.length);
  [mineMesh, uxoMesh, remMesh].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; group.add(m); });
  const tint = (mesh, list, base) => {
    const c = new THREE.Color(), b = new THREE.Color(base), dark = new THREE.Color('#2a2721');
    list.forEach((o, i) => mesh.setColorAt(i, c.copy(b).lerp(dark, smooth(0, DEPTH, o.d) * 0.55)));
    mesh.instanceColor.needsUpdate = true;
  };
  tint(mineMesh, objs.mine, '#7a5a3a'); tint(uxoMesh, objs.uxo, '#5e5850'); tint(remMesh, pieces, '#ece6d6');

  const dummy = new THREE.Object3D();
  const placeObjects = (amt) => {
    objs.mine.forEach((o, i) => {
      const k = smooth(o.r * 0.5, o.r * 0.5 + 0.5, amt);
      dummy.position.set(o.x, o.y, o.z); dummy.rotation.set((o.r2 - 0.5) * 0.5, o.r * 3, (o.r - 0.5) * 0.4);
      dummy.scale.setScalar(k + 1e-3); dummy.updateMatrix(); mineMesh.setMatrixAt(i, dummy.matrix);
    });
    objs.uxo.forEach((o, i) => {
      const k = smooth(0.1 + o.r * 0.45, 0.6 + o.r * 0.4, amt);
      dummy.position.set(o.x, o.y, o.z); dummy.rotation.set(0.3 + o.r2 * 0.9, o.r * 6, Math.PI / 2 + (o.r - 0.5));
      dummy.scale.setScalar(k + 1e-3); dummy.updateMatrix(); uxoMesh.setMatrixAt(i, dummy.matrix);
    });
    pieces.forEach((o, i) => {
      const k = smooth(0.2 + o.r * 0.4, 0.65 + o.r * 0.35, amt);
      dummy.position.set(o.x + o.ox, o.y + o.k * 0.08, o.z + o.oz); dummy.rotation.set(Math.PI / 2, 0, o.rot);
      dummy.scale.set(k + 1e-3, (k + 1e-3) * o.len, k + 1e-3); dummy.updateMatrix(); remMesh.setMatrixAt(i, dummy.matrix);
    });
    mineMesh.instanceMatrix.needsUpdate = uxoMesh.instanceMatrix.needsUpdate = remMesh.instanceMatrix.needsUpdate = true;
  };

  const writeWalls = (hx, hz) => {
    const corners = [[cx - hx, cz + hz], [cx + hx, cz + hz], [cx + hx, cz - hz], [cx - hx, cz - hz]];
    let v = 0;
    for (let e = 0; e < 4; e++) {
      const [x0, z0] = corners[e], [x1, z1] = corners[(e + 1) % 4];
      for (let s = 0; s <= SEG; s++) {
        const x = x0 + (x1 - x0) * s / SEG, z = z0 + (z1 - z0) * s / SEG;
        const top = terrain.heightAt(x, z) + 0.12;
        for (let k = 0; k <= ROWS; k++) {
          wallPos[v * 3] = x; wallPos[v * 3 + 1] = top - DEPTH * Math.pow(k / ROWS, 1.15); wallPos[v * 3 + 2] = z; v++;
        }
      }
    }
    wallGeo.attributes.position.needsUpdate = true;
    wallGeo.computeVertexNormals();
    for (let j = 0; j <= FR; j++) for (let i = 0; i <= FR; i++) {
      const x = cx - hx + 2 * hx * i / FR, z = cz - hz + 2 * hz * j / FR, a = (j * (FR + 1) + i) * 3;
      floorPos[a] = x; floorPos[a + 1] = terrain.heightAt(x, z) - DEPTH; floorPos[a + 2] = z;
    }
    floorGeo.attributes.position.needsUpdate = true;
    floorGeo.computeVertexNormals();
    inside[0].constant = -(cx - hx) + 0.05; inside[1].constant = (cx + hx) + 0.05;
    inside[2].constant = -(cz - hz) + 0.05; inside[3].constant = (cz + hz) + 0.05;
  };

  let last = -1, lastScan = -1;
  return {
    labelPts: {
      mine: objs.mine[0], uxo: objs.uxo.reduce((a, b) => (b.d > a.d ? b : a)), remains: objs.remains[0],
    },
    // scanT: 스캔선 진행(0..1), open: 단면 열림(0..1), reveal: 매설물 표시(0..1)
    update(scanT, open, reveal) {
      const sv = scanT > 0 && scanT < 1 ? 1 : 0;
      scan.visible = sv > 0;
      if (sv && Math.abs(scanT - lastScan) > 1e-4) {
        lastScan = scanT;
        const z = cz + HZ - scanT * HZ * 2;
        for (let s = 0; s <= SEG; s++) {
          const x = cx - HX + 2 * HX * s / SEG;
          scanPos[s * 3] = x; scanPos[s * 3 + 1] = terrain.heightAt(x, z) + 0.5; scanPos[s * 3 + 2] = z;
        }
        scanGeo.attributes.position.needsUpdate = true;
        scan.material.opacity = Math.sin(scanT * Math.PI) * 0.95;
      }
      const key = open * 1000 + reveal;
      if (Math.abs(key - last) < 1e-5) return;
      last = key;
      if (open <= 0.001) { group.visible = false; world.setCut(0, 0, -1, -1); return; }
      group.visible = true;
      const e = open * open * (3 - 2 * open);
      const hx = HX * (0.18 + 0.82 * e), hz = HZ * e;
      world.setCut(cx, cz, hx, hz);
      writeWalls(hx, hz);
      gridMat.opacity = 0.55 * smooth(0.3, 0.9, open);
      placeObjects(reveal * smooth(0.2, 0.7, open));
    },
  };
}
