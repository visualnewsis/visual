// 기존 HERO hold 안에서만 사진 → 재해석 → 3D. 장면 길이와 카메라 경로를 바꾸지 않는다.
import { smooth } from './terrain.js?v=20261001-12';
export function createHeroIntro(root, { reduceMotion, disabled, onReady }) {
  const photo = root.querySelector('.intro-photo'), graphic = root.querySelector('.intro-graphic');
  let ready = false, settled = false, last = -1;
  const load = img => img.decode().catch(() => null).then(() => img.naturalWidth > 0);
  Promise.all([load(photo), load(graphic)]).then(ok => { settled = true; ready = ok.every(Boolean) && !disabled; onReady(); });
  return {
    update(s, vh) {
      const p = Math.max(0, Math.min(1, s / Math.max(1, vh * 0.2)));
      if (disabled || (settled && !ready) || p >= 1) { root.style.visibility = 'hidden'; last = -1; return 0; }
      if (!ready) { root.style.visibility = 'visible'; return 1; }
      if (p === last) return 1 - smooth(0.52, 1, p);
      last = p;
      root.style.visibility = 'visible';
      const cg = smooth(0.03, 0.42, p), exit = smooth(0.52, 1, p);
      root.style.opacity = (1 - exit).toFixed(3);
      photo.style.opacity = (1 - cg).toFixed(3);
      graphic.style.opacity = (1 - smooth(0.52, 0.84, p)).toFixed(3);
      // 두 이미지에 같은 변환을 적용해 겹치는 윤곽을 억제한다.
      root.style.setProperty('--intro-scale', (reduceMotion ? 1 : 1 + p * 0.035).toFixed(4));
      return 1 - exit;
    },
  };
}
