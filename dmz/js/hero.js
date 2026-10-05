// 진입과 귀환은 같은 좌표계의 역방향. 시간 기반 재생·CSS transition 없음.
import { smooth } from './terrain.js?v=20261005-3';
// 랜드마크 좌표 데이터만 사용(변형 보간 코드는 실행하지 않음).
import { landmarks } from './image-morph.js?v=20261005-5';
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
  // 변형 보간(GPU) 미사용: 기존 CSS 이미지 레이어 합성으로 전환한다.
  // 그림마다 고정된 위치·크기 한 벌만 적용해 같은 능선·강이 같은 자리에 오게 한다(스크롤 중 그림별 움직임 없음).
  // 사진 묶음(0~2)은 첫 사진에, 조감 묶음(3~7)은 MAP에 맞춘다. 사진→조감 한 번은 정렬 없이 교차.
  let ready = false, settled = false, last = '', mapPts = [], align = null, alignKey = '';
  const ID = {s:1,tx:0,ty:0};
  const comp = (P,Q) => ({s:P.s*Q.s, tx:P.s*Q.tx+P.tx, ty:P.s*Q.ty+P.ty});
  const natural = (i,w,h) => {
    const img = layers[i];
    if (img.naturalHeight > img.naturalWidth) return null; // 모바일 세로 그림은 좌표 체계가 달라 정렬하지 않음
    const f = Math.max(w/img.naturalWidth, h/img.naturalHeight), W = img.naturalWidth*f, H = img.naturalHeight*f, ox = w < 820 ? .42 : .5;
    return landmarks[i].map(q => q ? [(w-W)*ox + q[0]*W, (h-H)/2 + q[1]*H] : null);
  };
  // src 점을 dst 점으로 보내는 균일 배율+이동(px). 대응점 부족·잔차 큼 → 정렬 안 함.
  const link = (src,dst,w,h) => {
    if (!src || !dst) return ID;
    const A=[],B=[];
    for (let j=0;j<Math.min(src.length,dst.length);j++) {
      const a=src[j],b=dst[j]; if(!a||!b) continue;
      if ([a,b].some(t=>t[0]<-.4*w||t[0]>1.4*w||t[1]<-.4*h||t[1]>1.4*h)) continue;
      A.push(a);B.push(b);
    }
    if (A.length < 2) return ID;
    const n=A.length,m=(P,d)=>P.reduce((v,t)=>v+t[d],0)/n,ax=m(A,0),ay=m(A,1),bx=m(B,0),by=m(B,1);
    let num=0,den=0;for(let k=0;k<n;k++){const x=A[k][0]-ax,y=A[k][1]-ay;num+=x*(B[k][0]-bx)+y*(B[k][1]-by);den+=x*x+y*y;}
    const sc=Math.min(1.5,Math.max(.67,den?num/den:1)),tx=bx-sc*ax,ty=by-sc*ay;
    let err=0;for(let k=0;k<n;k++)err+=Math.hypot(sc*A[k][0]+tx-B[k][0],sc*A[k][1]+ty-B[k][1]);
    return err/n > 60 ? ID : {s:sc,tx,ty,cx:bx,cy:by};
  };
  // 묶음 전체에 같은 이동·확대 한 벌만 건다(그림마다 다르게 확대하면 교차 순간 크기가 바뀐다).
  // 화면 가장자리 빈틈을 양쪽으로 나눈 뒤 중앙 기준으로 덮는 만큼만 확대.
  const groupFix = (list,w,h) => {
    let l=0,r=0,u=0,d=0;
    for (const t of list){l=Math.max(l,t.tx);r=Math.max(r,w-(t.tx+t.s*w));u=Math.max(u,t.ty);d=Math.max(d,h-(t.ty+t.s*h));}
    const dx=(r-l)/2,dy=(d-u)/2,z=Math.max(1,1+(l+r)/w,1+(u+d)/h)+(l+r+u+d>0?.006:0);
    return {s:z,tx:w/2*(1-z)+z*dx,ty:h/2*(1-z)+z*dy};
  };
  const computeAlign = (w,h) => {
    const P = layers.map((_,i)=>natural(i,w,h)), M = mapPts.map(q=>q?[q[0]*w,q[1]*h]:null), T = [];
    T[0]=ID; T[1]=comp(T[0],link(P[1],P[0],w,h)); T[2]=comp(T[1],link(P[2],P[1],w,h));
    T[7]=link(P[7],M,w,h);
    for (let i=6;i>=3;i--) T[i]=comp(T[i+1],link(P[i],P[i+1],w,h));
    const GA=groupFix(T.slice(0,3),w,h), GB=groupFix(T.slice(3,8),w,h);
    return {T:T.map((t,i)=>comp(i<3?GA:GB,t)), GB};
  };

  Promise.all(layers.map(img => img.decode().catch(() => null).then(() => img.naturalWidth > 0))).then(ok => {
    settled = true; ready = ok.every(Boolean);
    onReady();
  });
  return {
    map,
    get gpu(){return false;},
    mapChanged(points){ mapPts = points || []; alignKey = ''; last = ''; },
    mapTargetChanged(){},
    render(){},
    get align(){return align;},
    // MAP→3D: 조감 묶음 보정(GB)에서 실제 HERO 카메라까지 한 방향 줌인. 카메라 dolly와 화면 이동을 seq에 넣는다.
    entry(seq, width, height) {
      seq.dx = 0; seq.dy = 0;
      if (reduceMotion || !align) return;
      const G = align.GB, s0 = Math.min(1.12, Math.max(1, G.s));
      const ox = G.tx - width/2*(1-G.s), oy = G.ty - height/2*(1-G.s), k = 1 - seq.bridge;
      seq.dolly = 1.12 / (s0 + (1.12 - s0) * seq.bridge);
      seq.dx = ox * k; seq.dy = oy * k;
    },
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
      const ak = `${width}:${height}:${mapPts.length}`;
      if (ak !== alignKey) {
        alignKey = ak; align = computeAlign(width, height);
        layers.forEach((img, i) => {
          const t = align.T[i];
          img.style.transformOrigin = '0 0';
          img.style.transform = `translate3d(${t.tx.toFixed(2)}px,${t.ty.toFixed(2)}px,0) scale(${t.s.toFixed(5)})`;
        });
      }
      // MAP 정지 프레임과 실제 카메라가 동일한 dolly 투영 확대율을 사용한다.
      // MAP은 조감 묶음과 같은 보정(GB)을 받다가 3D 페이드(p 0.86) 전에 실제 카메라 배율로 수렴한다.
      // MAP과 3D는 같은 배율·이동(entry)을 공유한다. 조감 묶음 보정 배율에서 출발해 커지기만 한다.
      const ds = (reduceMotion ? 1 : 1.12) / seq.dolly;
      map.style.transformOrigin = '0 0';
      map.style.transform = `translate3d(${(width*(1-ds)/2 + (seq.dx||0)).toFixed(2)}px,${(height*(1-ds)/2 + (seq.dy||0)).toFixed(2)}px,0) scale(${ds.toFixed(6)})`;
      source.style.opacity = (1 - smooth(0.12, 0.32, p)).toFixed(4);
      root.style.setProperty('--intro-shade', (1 - bridge).toFixed(4));
      return opacity;
    },
  };
}
