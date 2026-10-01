// 非 → 悲 타이포그래피.
// 설명하지 않는다: 非 아래에 心이 하나의 획처럼 아주 짧게 붙고, 곧바로 실제 悲 글리프로 바뀐다.
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export { sm };

// em 단위. 'fused' 값은 Noto Sans KR 300의 悲 글리프를 캔버스로 래스터화해 측정한 구성비(위 非 40–232, 아래 心 240–397 / 400)로 보정했다.
const POSE = {
  hiSolo: { ty: 0, sx: 1, sy: 1 },
  hiFused: { ty: -0.193, sx: 1.0, sy: 0.527 },
  simEnter: { ty: 0.4, sx: 0.88, sy: 0.38 },     // 결합 위치 바로 아래에서 납작하게 시작
  simFused: { ty: 0.274, sx: 0.968, sy: 0.444 },
};
const mix = (p, q, t) => ({ ty: lerp(p.ty, q.ty, t), sx: lerp(p.sx, q.sx, t), sy: lerp(p.sy, q.sy, t) });
const tf = p => `translate3d(0,${p.ty.toFixed(4)}em,0) scale(${p.sx.toFixed(4)},${p.sy.toFixed(4)})`;

export function createMorph(root) {
  root.innerHTML = `
    <span class="m-stage">
      <span class="m-g m-hi" lang="ko">非</span>
      <span class="m-g m-sim" lang="ko">心</span>
      <span class="m-g m-bi" lang="ko">悲</span>
    </span>`;
  const stage = root.querySelector('.m-stage');
  const hi = root.querySelector('.m-hi'), sim = root.querySelector('.m-sim'), bi = root.querySelector('.m-bi');
  let last = '';
  return {
    // hiIn: 非 표시, simIn: 心 등장, combine: 결합, final: 悲로 전환 (각 0..1)
    update(hiIn, simIn, combine, final) {
      const key = [hiIn, simIn, combine, final].map(v => v.toFixed(3)).join();
      if (key === last) return;
      last = key;
      const sIn = sm(0, 1, simIn), c = sm(0, 1, combine), f = sm(0, 1, final);
      hi.style.transform = tf(mix(POSE.hiSolo, POSE.hiFused, c));
      sim.style.transform = tf(mix(POSE.simEnter, POSE.simFused, Math.max(sIn * 0.4, c)));
      const comp = 1 - f;
      hi.style.opacity = (hiIn * comp).toFixed(3);
      sim.style.opacity = (sIn * comp).toFixed(3);
      bi.style.opacity = f.toFixed(3);
      // 결합 순간에만 아주 미세한 명도 변화
      stage.style.filter = c > 0 && f < 1 ? `brightness(${(1 + 0.18 * Math.sin(Math.PI * c)).toFixed(3)})` : 'none';
    },
  };
}
