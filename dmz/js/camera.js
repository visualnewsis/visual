// 고정 경로 카메라. 키프레임(위치·시선)을 Catmull-Rom 곡선으로 잇고,
// 기사 단계(anchor) 사이 구간마다 호 길이 기준으로 이징해 이동한다.
// 독자가 카메라를 직접 돌리지 않는다.
import * as THREE from './three.js?v=20261001-11';
import { W } from './terrain.js?v=20261001-11';

const D2R = Math.PI / 180;

// aerial: target + 방위각/고도각 + 가로 커버 폭(가로 반폭, unit)으로 거리 산출
// ground: [x, z, 지면 위 높이]
const HERO = { aerial: { target: [-150, 0, 6], az: 13, el: 35, cover: 375, fov: 30 }, m: { el: 50, fov: 46, cover: 300 } };
export const KEYS = [
  { name: 'hero', ...HERO },
  { name: 'descend', aerial: { target: [6, 0, 34], az: 20, el: 27, cover: 175, fov: 34 }, m: { el: 38, fov: 50, cover: 150 } },
  { name: 'structure', aerial: { target: [-40, 0, 0], az: 6, el: 62, cover: 335, fov: 32 }, m: { el: 66, fov: 48, cover: 300 } },
  { pos: [70, 300, 88], target: [12, 196, 0], fov: 44 },
  { name: 'start', pos: [6, 226, 15], target: [0, 182, 2], fov: 50 },   // 남방한계선 철책 바깥에서 철책 너머를 본다
  { name: 'forest', pos: [-6, 180, 15], target: [-14, 138, 1], fov: 50 },
  { pos: [-4, 150, 14], target: [-2, 112, 1.5], fov: 50 },
  { name: 'incident', pos: [6, 121, 12], target: [-4, 94, 0], fov: 50 },
  { name: 'investigation', pos: [28, 130, 50], target: [-4, 92, 0], fov: 44 },
  { name: 'hanja', pos: [24, 128, 54], target: [-4, 90, 0], fov: 44 },
  { name: 'xray', pos: [32, 87, 44], target: [-2, 45, -7], fov: 46 },
  { name: 'resume', pos: [0, 40, 15], target: [0, 8, 3], fov: 50 },
  { name: 'mdl', pos: [46, 0.5, 13], target: [-70, -0.5, 1], fov: 46 },   // 군사분계선 위에서 선을 따라 서쪽을 본다
  { name: 'north', pos: [8, -22, 19], target: [-2, -72, 0], fov: 52 },
  { pos: [-6, -108, 21], target: [-8, -166, 2], fov: 52 },
  { name: 'timeline', aerial: { target: [-30, 0, -20], az: 12, el: 40, cover: 245, fov: 34 }, m: { el: 52, fov: 50, cover: 240 } },
  { name: 'end4km', pos: [0, -178, 18], target: [0, -232, 2], fov: 52 },
  { pos: [190, -110, 210], target: [0, -30, 0], fov: 40 },
  { name: 'rise', ...HERO },
  { name: 'finale', ...HERO },
];

export class CameraRig {
  constructor(terrain) {
    this.terrain = terrain;
    this.anchors = KEYS.map((k, i) => (k.name ? i : -1)).filter(i => i >= 0);
  }
  _ground(p) { return new THREE.Vector3(p[0], this.terrain.heightAt(p[0], p[1]) + p[2], p[1]); }

  build(aspect) {
    const portrait = aspect < 1;
    const blend = Math.min(1, Math.max(0, (1.25 - aspect) / 0.6));   // 1.25 이하에서 모바일 구도로 점진 전환
    this.pos = []; this.tgt = []; this.fov = [];
    for (const k of KEYS) {
      if (k.aerial) {
        const a = k.aerial, m = k.m || {};
        const el = (a.el + ((m.el ?? a.el) - a.el) * blend) * D2R;
        const fov = a.fov + ((m.fov ?? a.fov) - a.fov) * blend;
        const cover = a.cover + ((m.cover ?? a.cover) - a.cover) * blend;
        const dist = cover / (Math.tan(fov * D2R / 2) * aspect);
        const t = new THREE.Vector3(a.target[0], a.target[1], a.target[2]);
        const az = a.az * D2R;
        this.tgt.push(t);
        this.pos.push(new THREE.Vector3(t.x + dist * Math.cos(el) * Math.cos(az), t.y + dist * Math.sin(el), t.z + dist * Math.cos(el) * Math.sin(az)));
        this.fov.push(fov);
      } else {
        this.pos.push(this._ground(k.pos));
        this.tgt.push(this._ground(k.target));
        this.fov.push(Math.min(74, k.fov * (portrait ? 1.42 : 1 + 0.42 * blend)));
      }
    }
    this.posCurve = new THREE.CatmullRomCurve3(this.pos, false, 'centripetal');
    this.tgtCurve = new THREE.CatmullRomCurve3(this.tgt, false, 'centripetal');
    // 호 길이 표
    const N = 3000;
    this.arcT = new Float32Array(N + 1); this.arcL = new Float32Array(N + 1);
    let prev = this.posCurve.getPoint(0), L = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = this.posCurve.getPoint(t);
      L += p.distanceTo(prev); prev = p;
      this.arcT[i] = t; this.arcL[i] = L;
    }
    this.N = N;
  }
  _lenAt(t) { const f = t * this.N, i = Math.min(this.N - 1, Math.floor(f)); return this.arcL[i] + (this.arcL[i + 1] - this.arcL[i]) * (f - i); }
  _tAtLen(l) {
    let lo = 0, hi = this.N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.arcL[m] < l) lo = m; else hi = m; }
    const span = this.arcL[hi] - this.arcL[lo];
    const f = span > 1e-9 ? (l - this.arcL[lo]) / span : 0;
    return (lo + f) / this.N;
  }
  // seg: anchor 구간 번호, f: 구간 내 진행(0..1, 이미 이징됨)
  paramAt(seg, f) {
    const n = KEYS.length - 1;
    const ia = this.anchors[seg], ib = this.anchors[Math.min(seg + 1, this.anchors.length - 1)];
    const ta = ia / n, tb = ib / n;
    const la = this._lenAt(ta), lb = this._lenAt(tb);
    if (lb - la < 1e-3) return ta + (tb - ta) * f;
    return this._tAtLen(la + (lb - la) * f);
  }
  sample(t, outPos, outTgt) {
    this.posCurve.getPoint(t, outPos);
    this.tgtCurve.getPoint(t, outTgt);
    const n = KEYS.length - 1, s = Math.min(n - 1e-6, t * n), i = Math.floor(s), f = s - i;
    const fov = this.fov[i] + (this.fov[i + 1] - this.fov[i]) * (f * f * (3 - 2 * f));
    // 지면 아래로 파고들지 않도록 부드러운 하한
    const g = this.terrain.heightAt(Math.max(W.xMin, Math.min(W.xMax, outPos.x)), Math.max(W.zMin, Math.min(W.zMax, outPos.z))) + 7.5;
    const a = outPos.y, k = 4;
    outPos.y = (a + g + Math.sqrt((a - g) * (a - g) + k * k)) / 2;
    return fov;
  }
}
