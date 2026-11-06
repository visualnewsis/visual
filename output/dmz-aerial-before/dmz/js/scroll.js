// 스크롤 위치 → 기사 단계(anchor) 해석.
// 각 단계 요소가 화면을 차지하는 동안 카메라는 그 키프레임에 머문다(hold),
// 단계 사이 구간에서만 이동한다.
export const easeSine = x => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
const clamp01 = x => Math.min(1, Math.max(0, x));

export class Scroller {
  constructor(root) {
    this.els = [...root.querySelectorAll('[data-key]')];
    this.keys = this.els.map(el => el.dataset.key);
    this.map = {};
    this.vh = innerHeight;
  }
  measure() {
    const vh = this.vh = innerHeight;
    const sy = scrollY;
    this.spans = this.els.map((el, i) => {
      const r = el.getBoundingClientRect();
      const T = r.top + sy, H = r.height;
      let a = T - 0.2 * vh, b = T + H - 0.8 * vh;
      if (b < a) a = b = (a + b) / 2;
      const span = { key: this.keys[i], a, b, T, H };
      this.map[span.key] = span;
      return span;
    });
    this.maxScroll = document.documentElement.scrollHeight - vh;
  }
  // 카메라 구간 번호와 구간 내 진행(이징 적용)
  locate(s) {
    const sp = this.spans, n = sp.length;
    if (s <= sp[0].b) return { seg: 0, f: 0 };
    for (let i = 0; i < n - 1; i++) {
      if (s < sp[i + 1].a) return { seg: i, f: easeSine((s - sp[i].b) / Math.max(1, sp[i + 1].a - sp[i].b)) };
      if (s <= sp[i + 1].b) return { seg: i, f: 1 };
    }
    return { seg: n - 2, f: 1 };
  }
  // 단계 hold 안에서의 진행(0..1)
  progress(key, s) { const p = this.map[key]; return p.b > p.a ? clamp01((s - p.a) / (p.b - p.a)) : (s >= p.a ? 1 : 0); }
  // 단계의 존재감: hold 동안 1, 앞뒤 ramp 동안 서서히
  presence(key, s, ramp = 0.45) {
    const p = this.map[key], r = ramp * this.vh;
    const up = clamp01((s - (p.a - r)) / r), down = 1 - clamp01((s - p.b) / r);
    const k = Math.min(up, down);
    return k * k * (3 - 2 * k);
  }
  span(key) { return this.map[key]; }
}
