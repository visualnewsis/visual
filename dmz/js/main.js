// DMZ 편집# — 스크롤텔링 통합.
// 장면 상태는 모두 (보간된) 스크롤 위치의 함수다. 따라서 어느 방향으로 스크롤해도 같은 화면이 나온다.
// 예외: 사고 장면의 진동은 한 번 재생되는 시간 기반 이벤트.
import * as THREE from './three.js?v=20261001-12';
import { W, smooth, riverZ } from './terrain.js?v=20261005-3';
import { createWorld, SPOTS } from './scene3d.js?v=20261005-3';
import { createXray } from './xray.js?v=20261005-3';
import { CameraRig, KEYS } from './camera.js?v=20261005-3';
import { Scroller } from './scroll.js?v=20261001-12';
import { createMorph, sm } from './typography.js?v=20261001-12';
import { Labels, Track, Timeline } from './ui.js?v=20261005-3';
import { createHeroIntro, sequenceAt } from './hero.js?v=20261005-3';

const T0 = performance.now();
const params = new URLSearchParams(location.search);
const OG = params.has('og');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const low = params.has('low') || coarse || innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
const DPR_MAX = params.has('low') ? 1 : low ? 1.5 : 1.75;

const $ = s => document.querySelector(s);
const canvas = $('#gl');
const stageEl = $('#stage');
const veil = $('#veil');
// (엔딩 안개 레이어는 사용하지 않음)

// 잎 텍스처는 초기화 전에 한 번 읽어 스크롤 도중 수관이 바뀌지 않게 한다.
const foliageImage = await new Promise(resolve => {
  const img = new Image();let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>finish(null),4000);
  img.onload=()=>finish(img);img.onerror=()=>finish(null);
  img.src=new URL('../images/web/foliage-cluster-v1.webp',import.meta.url).href;
});
const world = createWorld(canvas, { low, foliageImage });
const xray = createXray(world);
const rig = new CameraRig(world.terrain);
const scroller = new Scroller($('#story'));
const labels = new Labels($('#labels'));
const track = new Track($('#track'));
const timeline = new Timeline($('#timeline'));
const heroIntro = createHeroIntro($('#hero-intro'), { reduceMotion, disabled: OG, renderer:world.renderer, low, onReady: () => { dirty = true; } });
const morphA = createMorph($('#morphA'));

// 단계 순서 검증 (DOM data-key ↔ 카메라 키프레임)
{
  const camNames = KEYS.filter(k => k.name).map(k => k.name);
  if (camNames.join() !== scroller.keys.join()) console.warn('[dmz] 단계 순서 불일치', camNames, scroller.keys);
}

// ---------- 라벨 ----------
const T = world.terrain;
const gp = (x, z, h = 0) => new THREE.Vector3(x, T.heightAt(x, z) + h, z);
const mapLandmarks = cam => [null,null,null,null,null,null,
  ...[-310,-160,0,165,300].map(x=>[x,riverZ(x)]),[-230,W.SLL],[380,W.SLL],[-50,W.NLL],[310,W.NLL]
].map(p=>{if(!p)return null;const v=gp(p[0],p[1],.9).project(cam);return [(v.x+1)/2,(1-v.y)/2];});
labels.add('h-s', '남방 <b>2km</b>', gp(0, W.SLL, 2), 'big range');
labels.add('h-0', '군사분계선 <b>0km</b>', gp(0, W.MDL, 2), 'big mint range');
labels.add('h-n', '북방 <b>2km</b>', gp(0, W.NLL, 2), 'big range');
labels.add('s-sll', '남방한계선', gp(-40, W.SLL, 1.5));
labels.add('s-mdl', '<b>군사분계선 MDL</b> · 0 km', gp(-40, W.MDL, 1.5), 'mint structure-mdl');
labels.add('s-nll', '북방한계선', gp(-40, W.NLL, 1.5));
labels.add('s-2a', '남방 <b>2km</b>', gp(40, 100, 1), 'big range');
labels.add('s-2b', '북방 <b>2km</b>', gp(40, -100, 1), 'big range');
const I = SPOTS.incident;
labels.add('i-blast', '폭발 지점', gp(I.x, I.z, 0.8), 'blast');
labels.add('i-ring', '인근 조사 구간', gp(I.x - 8.5, I.z - 8.5, 0.8), 'mint');
labels.add('i-found', '활성 북한제 대인지뢰 추가 확인', gp(...world.marks.foundPts[0], 0.8), 'found');
labels.add('st-sll', '<b>남방한계선</b> · 남 2km', gp(-2, W.SLL, 2.2));
labels.add('t-clear', '<b>지뢰 제거 작업 구간(상징)</b><small>다음: 2018년 공개 자료 사진</small>', gp(world.clear.pt[0], world.clear.pt[1], 1.2), 'target');
labels.add('t-work', '<b>북측 경계 작업 구간(상징)</b><small>다음: 2024년 공개 자료 사진</small>', gp(world.north.zones[0].x, world.north.zones[0].z, 1.5), 'target');
labels.add('t-blast', '<b>2026. 9. 21 폭발 지점</b><small>가상 위치 · 실제 좌표와 다릅니다</small>', gp(I.x, I.z, 0.8), 'blast target');
const xp = xray.labelPts;
labels.add('x-mine', '지뢰', new THREE.Vector3(xp.mine.x, xp.mine.y + 0.3, xp.mine.z), 'x');
labels.add('x-uxo', '미확인 폭발물', new THREE.Vector3(xp.uxo.x, xp.uxo.y + 0.3, xp.uxo.z), 'x');
labels.add('x-rem', '전사자 유해', new THREE.Vector3(xp.remains.x, xp.remains.y + 0.3, xp.remains.z), 'x');
labels.add('m-mdl', '<b>군사분계선(MDL)</b>', gp(-4, W.MDL, 2.6), 'mint');
const np = world.north.labelPts;
labels.add('n-wall', '장벽', gp(np.wall[0], np.wall[1], 2.2));
labels.add('n-wire', '철조망', gp(np.wire[0], np.wire[1], 1.4));
labels.add('n-road', '연결도로', gp(np.road[0], np.road[1], 1.2));
labels.add('n-zone', '지뢰 매설 작업 구역(상징)', gp(np.zone[0], np.zone[1], 1), 'zone');
labels.add('n-str', '군 구조물', gp(np.structure[0], np.structure[1], 2.4));
labels.add('n-post', '감시초소', gp(np.post[0], np.post[1], 6.5));
labels.add('e-nll', '<b>북방한계선</b> · 북 2km', gp(-6, W.NLL, 2));

// ---------- 크기 ----------
let vw = 0, vh = 0, dpr = Math.min(devicePixelRatio || 1, DPR_MAX), dirty = true, viewDirty = true, mapValid = false;
function resize(force) {
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  if (!w || !h) return;   // 숨겨진 탭·패널 등 크기 0일 때는 다음 resize를 기다린다
  // iOS 주소창 변화(높이 소폭 변동)는 무시해 캔버스 재할당을 줄인다
  if (!force && w === vw && Math.abs(h - vh) < 140) { scroller.measure(); dirty = true; return; }
  vw = w; vh = h;
  mapValid = false;
  world.setSize(vw, vh, dpr);
  viewDirty = true;
  rig.build(vw / vh);
  scroller.measure();
  dirty = true;
}
resize(true);
addEventListener('resize', () => resize(false));
if (document.fonts) document.fonts.ready.then(() => { scroller.measure(); dirty = true; });
new ResizeObserver(() => { scroller.measure(); dirty = true; }).observe($('#story'));
new ResizeObserver(() => resize(false)).observe(stageEl);

const ats = [...document.querySelectorAll('[data-at]')].map(el => ({ el, key: el.closest('[data-key]').dataset.key, at: +el.dataset.at, until: el.dataset.until ? +el.dataset.until : 2, on: false }));

// X-ray의 기존 단면을 좌우로 옮긴다. 세로 터치는 브라우저 스크롤에 맡긴다.
const exploreSurface = $('[data-key="xray"] .xr');
const exploreHint = exploreSurface.querySelector('.xr-hint');
let exploreOn = false, exploreMix = 0, exploreTarget = 0.5, exploreX = 0.5, exploreStart = null;
const canExplore = () => !OG && scroller.progress('xray', scrollY) >= 0.42 && scrollY <= scroller.span('xray').b;
const pointExplore = e => {
  exploreOn = true;
  const r = exploreSurface.getBoundingClientRect();
  exploreTarget = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  dirty = true;
};
exploreSurface.addEventListener('pointerdown', e => {
  if (!canExplore() || e.target.closest('.xr-card')) return;
  if (e.pointerType === 'mouse') exploreHint.classList.add('dismissed');
  exploreStart = {x:e.clientX, y:e.clientY};
});
exploreSurface.addEventListener('pointermove', e => {
  if (!canExplore() || e.target.closest('.xr-card')) return;
  if (e.pointerType === 'mouse') { pointExplore(e); return; }
  if (!exploreStart) return;
  const dx = Math.abs(e.clientX - exploreStart.x), dy = Math.abs(e.clientY - exploreStart.y);
  if (dx > 8 && dx > dy * 1.2) { exploreHint.classList.add('dismissed'); pointExplore(e); }
});
exploreSurface.addEventListener('pointerup', e => {
  if (canExplore() && exploreStart && Math.hypot(e.clientX - exploreStart.x, e.clientY - exploreStart.y) < 8) exploreHint.classList.add('dismissed');
  exploreStart = null;
});
exploreSurface.addEventListener('pointercancel', () => { exploreStart = null; });
exploreSurface.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { exploreOn = false; dirty = true; } });

// 한자 섹션 앞의 자료 120vh는 유지하고, 추가 50vh는 非→悲에만 배분한다.
function chapterProgress(key, s) {
  const p = scroller.progress(key, s);
  if (key !== 'hanja') return p;
  const span = scroller.span(key), split = 1.2 * scroller.vh / (span.b - span.a);
  return p < split ? 0.5 * p / split : 0.5 + 0.5 * (p - split) / (1 - split);
}

// 엔딩에서 거리를 선택하고 놓으면 기존 카메라 경로의 가까운 지점으로 돌아간다.
const revisitDistance = $('#revisit-distance'), revisitRead = $('#revisit-read');
revisitDistance.addEventListener('input', () => {
  const metres = +revisitDistance.value;
  revisitRead.textContent = metres === 0 ? '0 km' : `${metres < 0 ? '남' : '북'} ${(Math.abs(metres) / 1000).toFixed(1)}km`;
});
const revisitGo = () => {
  if (scroller.presence('finale', scrollY, 0.4) < 0.5) return;
  const z = -Number(revisitDistance.value) / 10;
  const from = scroller.span('start').a, to = scroller.span('end4km').b;
  const p = new THREE.Vector3(), target = new THREE.Vector3();
  let best = from, error = Infinity;
  for (let i = 0; i <= 900; i++) {
    const s = from + (to - from) * i / 900;
    if (s >= scroller.span('timeline').a && s <= scroller.span('timeline').b) continue;
    const loc = scroller.locate(s);
    rig.sample(rig.paramAt(loc.seg, loc.f), p, target);
    if (p.y - T.heightAt(Math.max(W.xMin, Math.min(W.xMax, p.x)), Math.max(W.zMin, Math.min(W.zMax, p.z))) > 70) continue;
    const d = Math.abs(p.z - z);
    if (d < error) { error = d; best = s; }
  }
  scrollTo({top:best, behavior:'instant'});
  sSm = scrollY; dirty = true;
  revisitDistance.blur();
};
revisitDistance.addEventListener('change', revisitGo);
revisitDistance.addEventListener('pointerup', revisitGo);
revisitDistance.addEventListener('keydown', e => { if (e.key === 'Enter') revisitGo(); });

// ---------- 사고 이벤트 ----------
let blastAt = null, blastArmed = true;

// ---------- 루프 ----------
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), shake = new THREE.Vector3();
const sky = new THREE.Color('#dfe3dd'), skyX = new THREE.Color('#c9cdc6');
let sSm = scrollY, lastT = performance.now(), lastRendered = -1;
let perfAcc = 0, perfN = 0, lastOy = 0;
const bench = params.has('bench') ? [] : null;

function state(s, now) {
  const P = (k, r) => scroller.presence(k, s, r);
  const G = k => chapterProgress(k, s);
  const sp = k => scroller.span(k);
  const vhh = scroller.vh;

  const travel = smooth(sp('start').a - 0.9 * vhh, sp('start').a, s) * (1 - smooth(sp('end4km').b, sp('end4km').b + 0.6 * vhh, s));
  const heroish = Math.max(P('hero', 0.8), P('finale', 0.6));
  const heroL = Math.max(P('hero', 0.8), P('rise', 0.7), P('finale', 0.6) * (1 - smooth(0.16, 0.3, G('finale'))));
  const structure = P('structure', 0.7);
  const hanja = P('hanja', 0.4);
  const tl = P('timeline', 0.5);
  const tp = G('timeline');
  const tph = Math.min(3, Math.floor(tp * 4 + 1e-4));

  // X-ray: 스캔 → 단면 열림 → 매설물, resume 구간에서 닫힘
  const gx = G('xray');
  const close = smooth(sp('xray').b, sp('resume').b, s);
  const open = smooth(0.14, 0.42, gx) * (1 - close);
  const scanT = (gx - 0.02) / 0.14;
  const reveal = smooth(0.36, 0.72, gx);

  // 북측 요소의 진행 전선
  let front;
  if (s < sp('mdl').b) front = 999;
  else if (s > sp('end4km').a) front = -999;
  else front = null;   // 카메라 z로 채움
  // 시간 변화: 같은 공간을 1953 상태로 되돌린 뒤 2024 구간에서 요새화가 다시 들어선다
  if (tl > 0.5) front = tp < 0.5 ? 999 : tp < 0.64 ? 60 - 320 * smooth(0.5, 0.64, tp) : -999;

  // 사고 이벤트 트리거
  const gi = G('incident');
  if (s < sp('incident').a - 0.25 * vhh) blastArmed = true;
  if (blastArmed && gi >= 0.12 && s < sp('incident').b) { blastArmed = false; blastAt = now; }
  const bt = blastAt === null ? null : (now - blastAt) / 1000;
  // 전조 0..0.12 → 폭발/잔상 0.12..0.48. 입력을 막지 않고 기존 먼지를 스크롤에 연결.
  const dustT = gi < 0.12 || gi >= 0.56 ? null : 5.2 * (gi - 0.12) / 0.44;

  const inv = P('investigation', 0.5), gInv = G('investigation');
  const ftl = G('finale');
  return {
    travel, heroish, structure, hanja, tl, open, scanT, reveal, front, bt, dustT, inv,
    lines: {
      sll: Math.max(0.35 * heroish, structure, 0.45 * travel, tl * (tph === 0 ? 1 : 0.5)),
      mdl: Math.max(0.45 * heroish, structure, 0.4 * travel, 0.8 * P('mdl', 0.6), tl * (tph === 0 ? 1 : 0.55)),
      nll: Math.max(0.35 * heroish, structure, 0.45 * travel, tl * (tph === 0 ? 1 : 0.5)),
    },
    band: Math.max(0.24 * structure, tl * 0.2 * (1 - smooth(0.2, 0.25, tp))),
    clear: tl * smooth(0.25, 0.3, tp) * (1 - smooth(0.5, 0.56, tp) * 0.6),
    marks: {
      blast: Math.max(P('incident', 0.4) * smooth(0.28, 0.48, gi), inv, hanja * 0.6, tl * smooth(0.75, 0.79, tp)) * (1 - open),
      ring: Math.max(inv * smooth(0.12, 0.3, gInv), tl * smooth(0.77, 0.82, tp)),
      found: inv * smooth(0.3, 0.42, gInv),
    },
    veil: Math.max(hanja * 0.9, tl * 0.26),
    blur: hanja > 0.35,
    lbl: {
      'h-s': heroL, 'h-0': heroL, 'h-n': heroL,
      's-sll': structure, 's-mdl': structure, 's-nll': structure, 's-2a': structure, 's-2b': structure,
      'i-blast': Math.max(P('incident', 0.4) * smooth(0.44, 0.58, gi), inv) * (1 - hanja),
      'i-ring': inv * smooth(0.15, 0.3, gInv) * (1 - hanja),
      'i-found': inv * smooth(0.32, 0.42, gInv) * (1 - hanja),
      'st-sll': P('start', 0.45),
      't-clear': tl * smooth(0.25, 0.27, tp) * (1 - smooth(0.35, 0.36, tp)),
      't-work': tl * smooth(0.5, 0.52, tp) * (1 - smooth(0.62, 0.63, tp)),
      't-blast': tl * smooth(0.78, 0.83, tp),
      'x-mine': open * smooth(0.48, 0.68, gx), 'x-uxo': open * smooth(0.61, 0.81, gx), 'x-rem': open * smooth(0.74, 0.94, gx),
      'm-mdl': P('mdl', 0.4),
      'n-wall': P('north', 0.5), 'n-wire': P('north', 0.5) * smooth(0.12, 0.24, G('north')),
      'n-road': P('north', 0.5) * smooth(0.05, 0.16, G('north')),
      'n-zone': P('north', 0.5) * smooth(0.3, 0.42, G('north')), 'n-str': P('north', 0.5) * smooth(0.2, 0.32, G('north')),
      'n-post': P('north', 0.5) * smooth(0.36, 0.46, G('north')),
      'e-nll': P('end4km', 0.4),
    },
    hanjaP: G('hanja'),
    tlP: G('timeline'),
    finale: ftl,
  };
}

function frame(now) { requestAnimationFrame(frame); tick(now); }
function tick(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const target = OG ? 0 : scrollY;
  const direct = target <= scroller.span('hero').b || target >= scroller.span('rise').b ||
    sSm <= scroller.span('hero').b || sSm >= scroller.span('rise').b;
  const k = reduceMotion || direct ? 1 : 1 - Math.exp(-dt * 7);
  sSm += (target - sSm) * k;
  if (Math.abs(target - sSm) < 0.3) sSm = target;

  if (!vw) { resize(true); if (!vw) return; }
  if (!canExplore()) { exploreOn = false; exploreStart = null; exploreHint.classList.remove('dismissed'); }
  const exploreGoal = exploreOn ? 1 : 0;
  const ek = reduceMotion ? 1 : 1 - Math.exp(-dt * 12);
  exploreMix += (exploreGoal - exploreMix) * ek;
  exploreX += (exploreTarget - exploreX) * ek;
  if (Math.abs(exploreGoal - exploreMix) < 0.001) exploreMix = exploreGoal;
  if (Math.abs(exploreTarget - exploreX) < 0.001) exploreX = exploreTarget;
  if (exploreMix !== exploreGoal || exploreX !== exploreTarget) dirty = true;
  const st = state(sSm, now);
  const seq = sequenceAt(sSm, scroller);
  if (reduceMotion) seq.dolly = 1;
  const introOpacity = heroIntro.update(seq, sSm, scroller.vh, vw, vh);
  const animating = st.bt !== null && st.bt < 4.5;
  // 이야기 끝 이후(출처·엔딩 배너)에서는 렌더를 멈춘다
  const past = sSm > scroller.span('finale').b + scroller.vh * 1.15;
  stageEl.style.visibility = past ? 'hidden' : 'visible';
  if (past) { lastRendered = -1; return; }
  if (!dirty && !animating && sSm === lastRendered) return;
  dirty = false; lastRendered = sSm;
  const drawStarted = bench ? performance.now() : 0;

  // 카메라
  const { seg, f } = scroller.locate(sSm);
  const t = rig.paramAt(seg, f);
  const fov = rig.sample(t, camPos, camTgt);
  if (seq.active && !OG) camPos.sub(camTgt).multiplyScalar(seq.dolly).add(camTgt);
  if (st.bt !== null && st.bt < 0.9 && !reduceMotion) {
    const a = 0.9 * Math.exp(-st.bt * 5.5), q = st.bt * 48;
    shake.set(Math.sin(q * 1.1) * a, Math.sin(q * 1.37 + 1) * a * 0.7, Math.sin(q * 0.93 + 2) * a);
    camPos.add(shake); camTgt.addScaledVector(shake, 0.4);
  }
  const cam = world.camera;
  cam.position.copy(camPos);
  cam.lookAt(camTgt);
  // 세로 화면: 하단 캡션을 피해 피사체를 화면 위쪽으로 올린다
  const oy = vw < vh ? Math.round(vh * 0.13 * st.travel) : 0;
  if (Math.abs(cam.fov - fov) > 0.01 || oy !== lastOy || viewDirty) {
    cam.fov = fov; lastOy = oy; viewDirty = false;
    if (oy) cam.setViewOffset(vw, vh, 0, oy, vw, vh); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }
  const camH = camPos.y - T.heightAt(Math.max(W.xMin, Math.min(W.xMax, camPos.x)), Math.max(W.zMin, Math.min(W.zMax, camPos.z)));
  world.setFog(camH);

  // 장면 상태 반영
  const L = world.lines;
  // 높은 고도: 지형 위 띠, 낮은 고도: 1px 선 (가까이서 굵은 띠처럼 보이지 않게)
  const aer = smooth(35, 110, camH);
  for (const [k, a] of [['sll', 0.8], ['mdl', 0.85], ['nll', 0.8]]) {
    L[k].material.opacity = a * st.lines[k] * aer;
    L[k].thin.material.opacity = 0.9 * st.lines[k] * (1 - aer * 0.8);
  }
  world.band.material.opacity = st.band;
  world.marks.blast.material.opacity = st.marks.blast;
  world.marks.ring.material.opacity = st.marks.ring;
  world.marks.found.material.opacity = st.marks.found;
  world.north.update(st.front ?? camPos.z, world.road);
  world.clear.set(st.clear);
  world.dust.update(reduceMotion ? null : st.dustT);
  xray.update(st.scanT, st.open, st.reveal, exploreMix, exploreX);
  world.hemi.intensity = 1.15 * (1 - 0.28 * st.open);
  world.scene.background.copy(sky).lerp(skyX, st.open * 0.8);
  world.scene.fog.color.copy(world.scene.background);

  // DOM 레이어
  veil.style.opacity = st.veil.toFixed(3);
  stageEl.classList.toggle('blur', st.blur);
  track.update(camPos.z, st.travel * (1 - st.hanja) * (1 - st.tl) * (1 - st.inv));
  const labelState = OG ? {} : { ...st.lbl };
  for (const k of ['h-s', 'h-0', 'h-n']) labelState[k] *= 1 - introOpacity;
  const recap = $('#range-recap'), recapOpacity = Math.max(Math.min(labelState['h-s'] || 0,labelState['h-n'] || 0),st.structure);
  recap.style.opacity = recapOpacity.toFixed(3);
  recap.style.visibility = recapOpacity > 0.01 ? 'visible' : 'hidden';
  const windowLabels = xray.labelVisibility();
  labelState['x-mine'] *= windowLabels.mine;
  labelState['x-uxo'] *= windowLabels.uxo;
  labelState['x-rem'] *= windowLabels.remains;
  cam.updateMatrixWorld();
  labels.update(cam, vw, vh, labelState);
  document.body.classList.toggle('dark-phase', st.hanja > 0.5 || st.tl > 0.5);

  // 非 → 悲 (본문)
  // 앞 48%: 정전협정 → 북측 작업 → 폭발·조사 장면(phase 요소), 뒤 50%: 非→悲
  const h = Math.max(0, (st.hanjaP - 0.5) / 0.5);
  // 非武裝地帶 → (心이 짧게) → 悲武裝地帶. 짧게 지나가고 悲에서 잠깐 멈춘다.
  morphA.update(sm(0.0, 0.1, h), sm(0.36, 0.44, h), sm(0.42, 0.54, h), sm(0.52, 0.62, h));
  document.getElementById('hanja').style.setProperty('--word', sm(0.0, 0.1, h).toFixed(3));
  // 풀이는 글자 전환과 같은 순간에 교차: 非와 함께 '아닐 비' 아웃, 悲와 함께 '슬플 비' 인
  document.getElementById('hanja').style.setProperty('--g-hi', (sm(0.06, 0.16, h) * (1 - sm(0.52, 0.62, h))).toFixed(3));
  document.getElementById('hanja').style.setProperty('--g-bi', sm(0.52, 0.62, h).toFixed(3));

  // 단계 내 순차 표시 요소
  let eviOn = false;
  for (const a of ats) {
    const pa = chapterProgress(a.key, sSm), on = pa >= a.at && pa < a.until;
    if (on !== a.on) { a.on = on; a.el.classList.toggle('on', on); }
    if (on && a.el.classList.contains('evi')) eviOn = true;
  }
  document.body.classList.toggle('evi-on', eviOn);

  // 시간 변화
  timeline.update(st.tlP);

  // sticky 이동 68%에 현실 사진 복귀 → 정지 여백 → 한글 문장. 悲는 시작에만 유지.
  $('#finale').style.setProperty('--title', seq.title.toFixed(4));

  // MAP은 별도 모델이 아니라 기존 렌더러의 HERO 구도. viewport당 한 번만 1x 캡처.
  // 중간 X-ray에서 resize해도 캡처를 미루므로 단면이 MAP에 섞이지 않는다.
  if (!mapValid && seq.active && !OG) {
    const savedPos = cam.position.clone(), savedQuat = cam.quaternion.clone();
    const savedFov = cam.fov, savedFog = [world.scene.fog.near, world.scene.fog.far];
    const mapPos = new THREE.Vector3(), mapTarget = new THREE.Vector3();
    cam.fov = rig.sample(0, mapPos, mapTarget);
    mapPos.sub(mapTarget).multiplyScalar(reduceMotion ? 1 : 1.12).add(mapTarget);
    cam.position.copy(mapPos); cam.lookAt(mapTarget); cam.clearViewOffset(); cam.updateProjectionMatrix();
    const mats = [world.band.material, ...Object.values(world.marks).filter(m => m.material).map(m => m.material),
      ...Object.values(L).flatMap(m => [m.material, m.thin.material])];
    const savedOpacity = mats.map(m => m.opacity);
    mats.forEach(m => { m.opacity = 0; });
    for (const [key, strength] of [['sll', 0.35 * 0.8], ['mdl', 0.45 * 0.85], ['nll', 0.35 * 0.8]]) {
      L[key].material.opacity = strength; L[key].thin.material.opacity = 0.9 * strength / (key === 'mdl' ? 0.85 : 0.8) * 0.2;
    }
    world.north.update(999, world.road); world.clear.set(0);
    world.setFog(mapPos.y - T.heightAt(mapPos.x, mapPos.z));
    world.render();
    heroIntro.map.width = vw; heroIntro.map.height = vh;
    heroIntro.map.getContext('2d', { alpha: false }).drawImage(canvas, 0, 0, vw, vh);
    heroIntro.mapChanged(mapLandmarks(cam));
    mats.forEach((m, i) => { m.opacity = savedOpacity[i]; });
    world.north.update(st.front ?? camPos.z, world.road); world.clear.set(st.clear);
    [world.scene.fog.near, world.scene.fog.far] = savedFog;
    cam.position.copy(savedPos); cam.quaternion.copy(savedQuat); cam.fov = savedFov;
    if (oy) cam.setViewOffset(vw, vh, 0, oy, vw, vh); else cam.clearViewOffset();
    cam.updateProjectionMatrix(); mapValid = true;
  }

  // 귀환 중 처음과 같은 지형 상태로 수렴. 사진에 덮인 후에는 렌더하지 않는다.
  if (seq.returning) world.north.update(-999 + 1998 * smooth(0, 0.18, 1 - seq.p), world.road);

  if (!(heroIntro.gpu && introOpacity >= .9999) && (!seq.returning || seq.p > 0)) world.render();
  if(seq.active && seq.p>=.69){cam.updateMatrixWorld();heroIntro.mapTargetChanged(mapLandmarks(cam));}
  heroIntro.render();
  if(bench){
    bench.push(performance.now()-drawStarted);if(bench.length>90)bench.shift();
    const sorted=[...bench].sort((a,b)=>a-b),info=world.renderer.info;
    stageEl.dataset.bench=JSON.stringify({frames:bench.length,meanMs:+(bench.reduce((a,b)=>a+b,0)/bench.length).toFixed(2),p95Ms:+sorted[Math.floor((sorted.length-1)*.95)].toFixed(2),drawCalls:info.render.calls,triangles:info.render.triangles,textures:info.memory.textures,geometries:info.memory.geometries,dpr,low});
  }

  // 적응형 해상도: 렌더가 느리면 DPR을 낮춘다
  perfAcc += dt; perfN++;
  if (perfN >= 50) {
    const avg = perfAcc / perfN;
    if (avg > 0.034 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); world.setSize(vw, vh, dpr); viewDirty = true; }
    perfAcc = 0; perfN = 0;
  }
}

window.__dmzReady = true;
window.__dmzInitMs = Math.round(performance.now() - T0);
document.body.classList.add('gl-ready');
document.body.classList.remove('no-webgl');   // 늦게 로드돼도 3D로 복구
requestAnimationFrame(frame);
if (OG) document.body.classList.add('og');
// 디버그·검수용 (숨겨진 탭에서도 즉시 해당 단계 화면을 그림)
window.__dmz = {
  scroller, world, rig,
  go(key, f = 0) { document.body.classList.add('snap'); const p = scroller.span(key); scrollTo(0, p.a + (p.b - p.a) * f); sSm = scrollY; dirty = true; tick(performance.now()); },
};
// 검수용: ?scene=키&f=0..1 로 특정 단계 화면을 바로 연다
if (params.has('scene')) {
  const go = () => window.__dmz.go(params.get('scene'), +(params.get('f') || 0.5));
  setTimeout(go, 1500); setTimeout(go, 3000);
}
