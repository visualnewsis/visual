// DOM 레이어: 3D 좌표에 붙는 라벨, 4km 진행바, 시간 변화 도식.
import * as THREE from './three.js?v=20261001-9';
import { W } from './terrain.js?v=20261001-9';

export class Labels {
  constructor(root) { this.root = root; this.items = []; this.v = new THREE.Vector3(); }
  add(id, html, pos, cls = '') {
    const el = document.createElement('div');
    el.className = `lbl ${cls}`;
    el.innerHTML = `<div class="lbl-in">${html}</div>`;
    this.root.appendChild(el);
    this.items.push({ id, el, pos, shown: false, lastO: -1 });
  }
  update(camera, w, h, vis) {
    for (const it of this.items) {
      const o = vis[it.id] || 0;
      if (o < 0.01) { if (it.shown) { it.el.style.visibility = 'hidden'; it.shown = false; } continue; }
      this.v.copy(it.pos).project(camera);
      if (this.v.z > 1 || this.v.z < -1) { if (it.shown) { it.el.style.visibility = 'hidden'; it.shown = false; } continue; }
      const x = (this.v.x * 0.5 + 0.5) * w, y = (-this.v.y * 0.5 + 0.5) * h;
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      // 글자가 화면 밖으로 나가지 않도록 글자만 안쪽으로 민다 (지시선은 지점에 고정)
      if (!it.tw) it.tw = it.el.firstChild.offsetWidth || 80;
      const half = it.tw / 2, m = 10;
      let dx = 0;
      if (x - half < m) dx = m - (x - half);
      else if (x + half > w - m) dx = w - m - (x + half);
      if (dx !== it.dx) { it.dx = dx; it.el.firstChild.style.transform = `translateX(calc(-50% + ${dx.toFixed(1)}px))`; }
      if (Math.abs(o - it.lastO) > 0.005) { it.el.style.opacity = o.toFixed(3); it.lastO = o; }
      if (!it.shown) { it.el.style.visibility = 'visible'; it.shown = true; }
    }
  }
}

export class Track {
  constructor(el) {
    this.el = el;
    this.dot = el.querySelector('.tr-dot');
    this.read = el.querySelector('.tr-read');
    this.last = -1; this.lastO = -1;
  }
  // camZ: 카메라의 실제 z 좌표. 남방한계선(200) → 0, 북방한계선(-200) → 1
  update(camZ, o) {
    if (Math.abs(o - this.lastO) > 0.004) { this.el.style.opacity = o.toFixed(3); this.el.style.visibility = o > 0.01 ? 'visible' : 'hidden'; this.lastO = o; }
    if (o < 0.01) return;
    const p = Math.min(1, Math.max(0, (W.SLL - camZ) / (W.SLL - W.NLL)));
    if (Math.abs(p - this.last) < 0.0005) return;
    this.last = p;
    this.dot.style.left = (p * 100).toFixed(2) + '%';
    const km = Math.abs(camZ) / 100;
    const r = km < 0.06 ? '0 km' : `${camZ > 0 ? '남' : '북'} ${km.toFixed(1)}km`;
    if (this.read.textContent !== r) this.read.textContent = r;
  }
}

// 같은 공간의 상태 변화: 1953 → 2018 → 2024 → 2026.9.21 (3D 상태는 main.js가 같은 진행값으로 바꾼다)
export class Timeline {
  constructor(root) {
    this.years = [...root.querySelectorAll('.tl-year')];
    this.states = [...root.querySelectorAll('.tl-state')];
    this.last = -1;
  }
  static phase(p) { return Math.min(3, Math.floor(p * 4 + 1e-4)); }
  update(p) {
    const st = Timeline.phase(p);
    if (st === this.last) return;
    this.last = st;
    this.years.forEach((y, i) => { y.classList.toggle('on', i === st); y.classList.toggle('past', i < st); });
    this.states.forEach((n, i) => n.classList.toggle('on', i === st));
  }
}
