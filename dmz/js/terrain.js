// 가상 합성 지형. 실제 DMZ 특정 구간을 복제하지 않는다.
// 좌표계: 1 unit = 10 m, +z = 남쪽, -z = 북쪽, 군사분계선 z = 0.
import * as THREE from './three.js?v=20261001-12';

export const W = {
  xMin: -420, xMax: 420, zMin: -340, zMax: 340,
  base: -34,          // 디오라마 받침 바닥
  SLL: 200,           // 남방한계선 (남 2km)
  MDL: 0,             // 군사분계선
  NLL: -200,          // 북방한계선 (북 2km)
};

// ---------- 결정적 난수·노이즈 ----------
const SEED = 1953;
function hash2(ix, iz) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(SEED, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
export function fbm(x, z, oct = 4) {
  let s = 0, a = 1, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise(x * f, z * f); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}
function ridge(x, z, oct = 5) {
  let s = 0, a = 0.5, f = 1, w = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    let v = 1 - Math.abs(noise(x * f, z * f));
    v *= v; v *= w; w = Math.min(1, v * 1.6);
    s += v * a; n += a; a *= 0.5; f *= 2.07;
  }
  return s / n;
}
export function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 지형 요소의 기준선 ----------
export function riverZ(x) { return 128 + 22 * Math.sin(x * 0.0105 + 0.6) + 9 * Math.sin(x * 0.027 + 2.1); }
export function roadX(z) { return 96 + 14 * Math.sin(z * 0.0075 + 0.4); }
// 남·북방한계선 철책선: 경계선 바깥쪽에서 지형을 따라 굽이치는 일반화한 선 (side: +1 남측, -1 북측)
export function fenceZ(x, z0, side) { return z0 + side * (3.6 + 2.5 * Math.sin(x * 0.012 + z0) + 1.6 * Math.sin(x * 0.041 + z0 * 0.5) + 1) ; }
// 북측 장벽선 (일반화한 형태)
export function wallZ(x) { return -62 + 7 * Math.sin(x * 0.019 + 1.3) + 3 * Math.sin(x * 0.051); }

export function rawHeight(x, z) {
  const s = 0.0058;
  let h = 50 * Math.pow(ridge(x * s + 11.3, z * s * 1.15 - 4.7), 1.35) + 11 * fbm(x * s * 2.4 + 3, z * s * 2.4 - 8, 4) + 6;
  h += Math.max(0, -z - 60) * 0.035;                 // 북쪽으로 갈수록 산지가 조금 높아짐
  const dz = z - riverZ(x);
  const valley = Math.exp(-(dz * dz) / (2 * 42 * 42));
  h = h * (1 - 0.78 * valley) + 2 * valley;           // 하천 골짜기
  h -= 4.4 * Math.exp(-(dz * dz) / (2 * 7.5 * 7.5));  // 하도
  return h;
}

// 숲 분포 (0..1). 하천·도로·철책 주변은 비운다.
export function forestMask(x, z) {
  let m = smooth(-0.28, 0.22, fbm(x * 0.012 + 40, z * 0.012 - 17, 3));
  const dz = Math.abs(z - riverZ(x));
  m *= smooth(9, 16, dz);
  m *= smooth(5, 9, Math.abs(x - roadX(z)));
  m *= smooth(5, 11, Math.abs(z - fenceZ(x, W.SLL, 1)) - 2);      // 철책·순찰로 주변 개활지
  m *= smooth(5, 11, Math.abs(z - fenceZ(x, W.NLL, -1)) - 2);
  m *= smooth(6, 12, Math.abs(z - wallZ(x)));
  m *= (0.3 + 0.7 * smooth(3, 12, Math.abs(z))) * smooth(1.2, 3.5, Math.abs(z));   // 군사분계선 부근은 성기게 (표지판은 수풀 속에 남김)
  m *= smooth(9, 17, Math.hypot(x + 4, z - 94));                 // 사고 지점(가상) 주변 개활지
  m *= smooth(26, 38, Math.hypot(x - 40, z - 114));              // 2018 지뢰 제거 작업 구간(상징) 주변
  return m;
}

// ---------- 높이 격자 ----------
export class Terrain {
  constructor(nx, nz) {
    this.nx = nx; this.nz = nz;
    this.dx = (W.xMax - W.xMin) / nx;
    this.dz = (W.zMax - W.zMin) / nz;
    const n = (nx + 1) * (nz + 1);
    this.h = new Float32Array(n);
    for (let j = 0; j <= nz; j++) {
      const z = W.zMin + j * this.dz;
      for (let i = 0; i <= nx; i++) this.h[j * (nx + 1) + i] = rawHeight(W.xMin + i * this.dx, z);
    }
  }
  // 메시 삼각분할과 정확히 같은 보간
  heightAt(x, z) {
    const gx = Math.min(this.nx - 1e-4, Math.max(0, (x - W.xMin) / this.dx));
    const gz = Math.min(this.nz - 1e-4, Math.max(0, (z - W.zMin) / this.dz));
    const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
    const r = this.nx + 1, H = this.h;
    const h00 = H[j * r + i], h10 = H[j * r + i + 1], h01 = H[(j + 1) * r + i], h11 = H[(j + 1) * r + i + 1];
    if (fx + fz <= 1) return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
    return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  }

  buildMesh() {
    const { nx, nz } = this, r = nx + 1;
    const pos = new Float32Array(r * (nz + 1) * 3);
    const col = new Float32Array(r * (nz + 1) * 3);
    const idx = new Uint32Array(nx * nz * 6);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const k = j * r + i;
      pos[k * 3] = W.xMin + i * this.dx; pos[k * 3 + 1] = this.h[k]; pos[k * 3 + 2] = W.zMin + j * this.dz;
    }
    let t = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const v00 = j * r + i, v10 = v00 + 1, v01 = v00 + r, v11 = v01 + 1;
      idx[t++] = v00; idx[t++] = v01; idx[t++] = v10;
      idx[t++] = v10; idx[t++] = v01; idx[t++] = v11;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    // 정점 색: 9월 말 초지 + 숲 바닥 + 사면 + 하천변
    const nrm = g.attributes.normal.array;
    const meadowA = new THREE.Color('#a7a77a'), meadowB = new THREE.Color('#8e9a68');
    const floor = new THREE.Color('#4a5f3d'), rock = new THREE.Color('#8f8873'), sand = new THREE.Color('#bcb39a');
    const c = new THREE.Color();
    for (let k = 0; k < r * (nz + 1); k++) {
      const x = pos[k * 3], z = pos[k * 3 + 2];
      c.copy(meadowA).lerp(meadowB, 0.5 + 0.5 * fbm(x * 0.03, z * 0.03, 2));
      c.lerp(floor, Math.min(1, 1.15 * forestMask(x, z)));
      const slope = 1 - nrm[k * 3 + 1];
      c.lerp(rock, smooth(0.12, 0.35, slope) * 0.7);
      c.lerp(sand, 0.8 * smooth(11, 6, Math.abs(z - riverZ(x))));
      const shade = 0.94 + 0.06 * fbm(x * 0.11, z * 0.11, 2);
      col[k * 3] = c.r * shade; col[k * 3 + 1] = c.g * shade; col[k * 3 + 2] = c.b * shade;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }

  // 디오라마 단면 (지층색 띠)
  buildSkirt() {
    const P = [], C = [], I = [];
    const bands = ['#5c4a36', '#7a6248', '#927a5a', '#a38f6e', '#857a63', '#5b5547'].map(s => new THREE.Color(s));
    const rows = 6;
    const edge = (x0, z0, x1, z1, n) => {
      const start = P.length / 3;
      for (let s = 0; s <= n; s++) {
        const x = x0 + (x1 - x0) * s / n, z = z0 + (z1 - z0) * s / n;
        const top = this.heightAt(x, z);
        for (let k = 0; k <= rows; k++) {
          const f = k / rows;
          const y = top + (W.base - top) * Math.pow(f, 0.8);
          P.push(x, y, z);
          const b = bands[Math.min(bands.length - 1, Math.floor(f * bands.length))];
          C.push(b.r, b.g, b.b);
        }
      }
      for (let s = 0; s < n; s++) for (let k = 0; k < rows; k++) {
        const a = start + s * (rows + 1) + k, b = a + rows + 1;
        I.push(a, a + 1, b, b, a + 1, b + 1);
      }
    };
    edge(W.xMin, W.zMax, W.xMax, W.zMax, this.nx);
    edge(W.xMax, W.zMax, W.xMax, W.zMin, this.nz);
    edge(W.xMax, W.zMin, W.xMin, W.zMin, this.nx);
    edge(W.xMin, W.zMin, W.xMin, W.zMax, this.nz);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setIndex(I);
    g.computeVertexNormals();
    return g;
  }
}

// 지형을 따라 붙는 띠 (선·도로·링)
export function drapeStrip(terrain, pts, width, lift, out) {
  const P = out ? out.P : [], I = out ? out.I : [], UV = out ? out.UV : [];
  const start = P.length / 3;
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz * width / 2, nz = tx * width / 2;
    if (i > 0) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const [x, z] = pts[i];
    const yl = (pts[i][2] ?? terrain.heightAt(x + nx, z + nz)) + lift;
    const yr = (pts[i][2] ?? terrain.heightAt(x - nx, z - nz)) + lift;
    P.push(x + nx, yl, z + nz, x - nx, yr, z - nz);
    UV.push(len, 0, len, 1);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = start + i * 2;
    I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  return { P, I, UV };
}
export function geomFrom({ P, I, UV }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  if (UV) g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
export function linePts(x0, z0, x1, z1, step) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]);
  return out;
}
export function circlePts(cx, cz, r, a0 = 0, a1 = Math.PI * 2, step = 1.2) {
  const n = Math.max(6, Math.ceil(r * Math.abs(a1 - a0) / step));
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  return out;
}
