// 식생: 절차적 수목 모델(여러 수종·형태 변형) + 관목. 모두 인스턴싱.
// 공 하나짜리 나무 대신, 불규칙한 수관 덩어리·줄기·높이별 음영(가짜 AO)으로 저고도에서도 자연스럽게 보이게 한다.
import * as THREE from './three.js?v=20261001-9';
import { W, forestMask, riverZ, roadX, wallZ, rng, smooth, noise } from './terrain.js?v=20261001-9';

const V = new THREE.Vector3();

// 비색인(non-indexed) 지오메트리를 하나로 합친다 (position·normal·color)
function merge(list) {
  let n = 0;
  for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
  let o = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    C.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.computeBoundingSphere();
  return g;
}
const flat = g => (g.index ? g.toNonIndexed() : g);

// 칠하기: 높이에 따라 아래는 어둡게(수관 속 그늘), 위는 밝게
function paint(g, base, y0, y1, lo = 0.5, hi = 1.06) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(base);
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0)));
    const k = lo + (hi - lo) * t * t * (3 - 2 * t);
    c[i * 3] = col.r * k; c[i * 3 + 1] = col.g * k; c[i * 3 + 2] = col.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

// 울퉁불퉁한 수관 덩어리. 같은 위치의 정점은 같은 변위를 받아 틈이 생기지 않는다.
function blob(detail, seed, amp = 0.2) {
  const g = flat(new THREE.IcosahedronGeometry(1, detail));
  const p = g.attributes.position, nrm = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i).normalize();
    const d = noise(V.x * 2.1 + seed, V.y * 2.1 - seed) * 0.6 + noise(V.z * 2.7 - seed * 2, V.x * 2.7 + V.y) * 0.4;
    const r = 1 + amp * d;
    p.setXYZ(i, V.x * r, V.y * r, V.z * r);
    nrm[i * 3] = V.x; nrm[i * 3 + 1] = V.y; nrm[i * 3 + 2] = V.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}
function place(g, x, y, z, sx, sy, sz, ry = 0) {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz)));
  return g;
}
const trunk = (h, r, segs) => paint(place(flat(new THREE.CylinderGeometry(r * 0.7, r, h, segs, 1, true)), 0, h / 2, 0, 1, 1, 1), '#6b5a46', 0, h, 0.55, 0.8);

// 활엽수: 줄기 + 3~5개의 수관 덩어리
function broadleaf(seed, low, fine = false) {
  const R = rng(seed), parts = [trunk(1.1, 0.11, low ? 4 : 5)];
  const n = 3 + Math.floor(R() * 2);
  parts.push(place(blob(low ? 0 : 1, seed, 0.22), 0, 1.55, 0, 1.0, 0.82, 1.0, R() * 6));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + R(), d = 0.42 + R() * 0.25, s = 0.5 + R() * 0.25;
    parts.push(place(blob(fine ? 1 : 0, seed + i * 7, 0.18), Math.cos(a) * d, 1.15 + R() * 0.75, Math.sin(a) * d, s, s * 0.85, s, R() * 6));
  }
  parts.slice(1).forEach(g => paint(g, '#ffffff', 0.7, 2.35, 0.52, 1.08));
  return merge(parts);
}
// 침엽수: 줄기 + 층층이 쌓인 원뿔
function conifer(seed, low) {
  const R = rng(seed), segs = low ? 6 : 8, parts = [trunk(0.9, 0.08, 4)];
  const tiers = [[0.78, 1.35, 0.35], [0.6, 1.15, 1.0], [0.42, 1.0, 1.6], [0.24, 0.8, 2.1]];
  tiers.forEach(([r, h, y], i) => {
    const g = flat(new THREE.ConeGeometry(r * (0.92 + R() * 0.16), h, segs, 1, true));
    place(g, (R() - 0.5) * 0.05, y + h / 2, (R() - 0.5) * 0.05, 1, 1, 1, R() * 6);
    parts.push(paint(g, '#ffffff', 0.3, 2.9, 0.48, 1.04));
  });
  return merge(parts);
}
function shrub(seed) {
  return merge([paint(place(blob(1, seed, 0.24), 0, 0.36, 0, 1, 0.8, 1), '#ffffff', 0, 0.8, 0.55, 0.95)]);
}

export function buildVegetation(terrain, { low, cutPlanes }) {
  const R = rng(27);
  const target = low ? 6500 : 15000;
  const items = [];
  let tries = 0;
  while (items.length < target && tries < target * 30) {
    tries++;
    const x = W.xMin + 4 + R() * (W.xMax - W.xMin - 8);
    const z = W.zMin + 4 + R() * (W.zMax - W.zMin - 8);
    const m = forestMask(x, z);
    if (m < 0.04) continue;
    const center = Math.exp(-(x * x) / (2 * 180 * 180));
    if (R() > m * (0.3 + 0.7 * center)) continue;
    const y = terrain.heightAt(x, z);
    const isCon = R() < 0.2 + smooth(14, 32, y) * 0.5;
    items.push({ x, y, z, con: isCon, a: R(), b: R(), c: R() });
  }
  // 관목: 숲 가장자리·초지에 낮게
  const shrubs = [];
  const sTarget = 0;   // 관목은 저고도에서 바위처럼 보여 제외 (수목 밀도로 충분)
  tries = 0;
  while (shrubs.length < sTarget && tries < sTarget * 20) {
    tries++;
    const x = W.xMin + 4 + R() * (W.xMax - W.xMin - 8);
    const z = W.zMin + 4 + R() * (W.zMax - W.zMin - 8);
    const m = forestMask(x, z);
    const edge = 1 - Math.abs(m - 0.35) * 2.2;
    if (Math.abs(z - riverZ(x)) < 8 || Math.abs(x - roadX(z)) < 4 || Math.abs(z - wallZ(x)) < 5) continue;
    const center = Math.exp(-(x * x) / (2 * 150 * 150));
    if (m < 0.12 || m > 0.75 || R() > edge * (0.25 + 0.75 * center)) continue;   // 숲 가장자리에만
    shrubs.push({ x, y: terrain.heightAt(x, z), z, a: R(), b: R(), c: R() });
  }

  const nB = low ? 2 : 3, nC = 2;
  const geoB = Array.from({ length: nB }, (_, i) => broadleaf(101 + i * 31, low));
  // 카메라 경로 가까운 활엽수는 더 촘촘한 수관 모델 (데스크톱)
  const geoBF = low ? null : Array.from({ length: nB }, (_, i) => broadleaf(101 + i * 31, false, true));
  const near = t => !low && Math.abs(t.x) < 80;
  const geoC = Array.from({ length: nC }, (_, i) => conifer(203 + i * 17, low));
  const geoS = shrub(307);
  const broadCols = ['#5a7741', '#64793f', '#4f6b3c', '#6f7f46', '#58723f', '#617448', '#7c8247', '#4c6639'].map(h => new THREE.Color(h));
  const conCols = ['#3c5739', '#43603d', '#375036', '#4a5f3f'].map(h => new THREE.Color(h));
  const shrubCols = ['#566b3a', '#5f723d', '#4e6236', '#677440'].map(h => new THREE.Color(h));

  const meshes = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
  const make = (geo, list, colors, scaleFn) => {
    if (!list.length) return;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, clippingPlanes: cutPlanes, clipIntersection: true });
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => {
      scaleFn(t, scl);
      e.set((t.b - 0.5) * 0.1, t.a * 6.283, (t.c - 0.5) * 0.1);
      q.setFromEuler(e);
      pos.set(t.x, t.y - 0.12, t.z);
      mesh.setMatrixAt(i, m4.compose(pos, q, scl));
      mesh.setColorAt(i, col.copy(colors[Math.floor(t.c * colors.length) % colors.length]).multiplyScalar(0.88 + t.b * 0.24));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    meshes.push(mesh);
  };
  for (let v = 0; v < nB; v++) {
    const bs = (t, s) => { const k = 0.75 + t.b * 0.7; s.set(k * (0.9 + t.c * 0.2), k * (0.85 + t.a * 0.4), k * (0.9 + t.a * 0.2)); };
    const mine = items.filter(t => !t.con && Math.floor(t.a * 997) % nB === v);
    make(geoB[v], mine.filter(t => !near(t)), broadCols, bs);
    if (geoBF) make(geoBF[v], mine.filter(near), broadCols, bs);
  }
  for (let v = 0; v < nC; v++) {
    make(geoC[v], items.filter(t => t.con && Math.floor(t.a * 991) % nC === v), conCols,
      (t, s) => { const k = 0.7 + t.b * 0.55; s.set(k, k * (1.0 + t.c * 0.6), k); });
  }
  make(geoS, shrubs, shrubCols, (t, s) => { const k = 0.6 + t.b * 0.6; s.set(k * (1 + t.c * 0.4), k * (0.9 + t.a * 0.5), k); });
  return meshes;
}
