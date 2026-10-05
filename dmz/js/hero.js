// 진입과 귀환은 같은 좌표계의 역방향. 시간 기반 재생·CSS transition 없음.
import { smooth } from './terrain.js?v=20261005-3';
const clamp = p => Math.max(0, Math.min(1, p));
// 오프닝 전용 스크롤 → 진행도 배분. 사진→단순화(p 0~0.31)를 압축하고 MAP→3D(p 0.78~1)는 스크롤 여유 유지.
// 꺾이는 지점은 단계 경계(전환 속도 0)에 둔다. 클로징은 별도 경로라 영향 없음.
const OPEN = [[0,0],[0.2,0.31],[0.667,0.78],[1,1]];
const openingP = u => {
  let i = 0; while (i < OPEN.length-2 && u > OPEN[i+1][0]) i++;
  const [u0,p0] = OPEN[i], [u1,p1] = OPEN[i+1];
  return p0 + (p1-p0) * clamp((u-u0)/(u1-u0));
};
export function sequenceAt(s, scroller) {
  const hero = scroller.span('hero'), finale = scroller.span('finale');
  const returning = s >= scroller.span('rise').b;
  // sticky가 풀리기 전에 문장 노출을 마친다. 섹션 높이 전체가 아닌 실제 sticky 이동 거리.
  const endProgress = clamp((s - finale.T) / Math.max(1, finale.H - scroller.vh));
  const p = returning ? 1 - clamp((endProgress - 0.14) / 0.54) : openingP(clamp(s / hero.b));
  const bridge = smooth(0.78, 1, p);
  return { p, bridge, returning, active: (returning && s < finale.T + finale.H) || s <= hero.b,
    dolly: 1 + 0.12 * (1 - bridge),
    title: returning ? smooth(0.82, 0.94, endProgress) : 0 };
}
export function createHeroIntro(root, { reduceMotion, disabled, onReady, renderer, low }) {
  const layers = [...root.querySelectorAll('picture img')];
  const knots = [0,0.10,0.21,0.31,0.42,0.52,0.62,0.69,0.78];
  const map = root.querySelector('.intro-map'), source = root.querySelector('.intro-source');
  // 변형 보간(GPU) 미사용: 기존 CSS 이미지 레이어 합성·확대·이동으로 전환한다.
  let ready = false, settled = false, last = '';
  Promise.all(layers.map(img => img.decode().catch(() => null).then(() => img.naturalWidth > 0))).then(ok => {
    settled = true; ready = ok.every(Boolean);
    onReady();
  });
  return {
    map,
    get gpu(){return false;},
    mapChanged(){},
    mapTargetChanged(){},
    render(){},
    update(seq, s, vh, width, height) {
      const { p, bridge, active, returning } = seq;
      document.querySelector('.hero').style.setProperty('--intro-title-y', `${Math.min(s, vh).toFixed(1)}px`);
      if (disabled || !active || (settled && !ready)) { root.style.visibility = 'hidden'; last = ''; return 0; }
      root.style.visibility = 'visible';
      if (!ready) { root.style.opacity = '1'; return 1; }
      const key = `${p}:${returning}:${width}:${height}`;
      const opacity = 1 - smooth(0.86, 1, p);
      if (key === last) return opacity;
      last = key;
      root.style.opacity = opacity.toFixed(5);
      // 불투명한 사진 위에 다음 단계를 겹쳐 전환 중 배경이 비치는 틈을 막는다.
      // 항상 인접한 두 장만 합성. 중간 그림을 직접 보여주고 여러 윤곽의 잔상을 제한한다.
      const frames = [...layers,map];
      let index = 0;
      while (index < knots.length-1 && p >= knots[index+1]) index++;
      const mix = index < knots.length-1 ? smooth(knots[index],knots[index+1],p) : 0;
      frames.forEach((img,i) => { img.style.opacity = (i === index ? 1 : i === index+1 ? mix : 0).toFixed(5); });
      const depth = Math.min(p / 0.78, 1);
      layers.forEach((img, i) => {
        const fraction = i / (layers.length-1);
        const scale = reduceMotion ? 1 : 1 + depth * (0.16 - fraction * 0.075);
        const y = reduceMotion ? 0 : -depth * (1.8 - fraction * 1.05);
        img.style.transform = `translate3d(0,${y.toFixed(4)}%,0) scale(${scale.toFixed(5)})`;
      });
      // MAP 정지 프레임과 실제 카메라가 동일한 dolly 투영 확대율을 사용한다.
      map.style.transform = `scale(${((reduceMotion ? 1 : 1.12) / seq.dolly).toFixed(6)})`;
      source.style.opacity = (1 - smooth(0.12, 0.32, p)).toFixed(4);
      root.style.setProperty('--intro-shade', (1 - bridge).toFixed(4));
      return opacity;
    },
  };
}
