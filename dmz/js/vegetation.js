// 식생: 절차적 수목 모델(여러 수종·형태 변형) + 관목. 모두 인스턴싱.
// 공 하나짜리 나무 대신, 불규칙한 수관 덩어리·줄기·높이별 음영(가짜 AO)으로 저고도에서도 자연스럽게 보이게 한다.
import * as THREE from './three.js?v=20261001-12';
import { W, forestMask, riverZ, roadX, wallZ, rng, smooth, noise } from './terrain.js?v=20261001-12';

const V = new THREE.Vector3();

// 비색인(non-indexed) 지오메트리를 하나로 합친다 (position·normal·color)
function merge(list) {
  let n = 0;
  for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), U = new Float32Array(n * 2);
  let o = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    C.set(g.attributes.color.array, o * 3);
    if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
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
  const n = 3 + Math.floor(R() * (fine ? 4 : 2));
  parts.push(place(blob(low && !fine ? 0 : 1, seed, 0.27), 0, 1.55, 0, 1.0, 0.82, 1.0, R() * 6));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + R(), d = 0.42 + R() * 0.25, s = 0.5 + R() * 0.25;
    parts.push(place(blob(fine && !low ? 1 : 0, seed + i * 7, 0.18), Math.cos(a) * d, 1.15 + R() * 0.75, Math.sin(a) * d, s, s * 0.85, s, R() * 6));
  }
  // 근경 수관 가장자리의 작은 가지 덩어리: 둥근 덩어리의 매끈한 외곽을 끊는다.
  if (fine) for (let i = 0; i < (low ? 4 : 7); i++) {
    const a = R() * Math.PI * 2, s = 0.16 + R() * 0.16;
    parts.push(place(blob(0, seed + 71 + i, 0.32), Math.cos(a) * 0.93, 1.25 + R() * 0.7, Math.sin(a) * 0.93, s, s * 0.75, s * 1.3, a));
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
    place(g, (R() - 0.5) * 0.16, y + h / 2, (R() - 0.5) * 0.16, 0.85 + R() * 0.3, 1, 0.85 + R() * 0.3, R() * 6);
    parts.push(paint(g, '#ffffff', 0.3, 2.9, 0.48, 1.04));
  });
  return merge(parts);
}
function shrub(seed) {
  return merge([paint(place(blob(1, seed, 0.24), 0, 0.36, 0, 1, 0.8, 1), '#ffffff', 0, 0.8, 0.55, 0.95)]);
}

// 근경: 잎 사이 빈 공간이 있는 교차 카드. 구형 수관·원뿔 윤곽을 대체한다.
function foliageTexture() {
  const c = document.createElement('canvas');c.width=c.height=256;
  const g=c.getContext('2d'),R=rng(831);
  // 가는 가지를 먼저 그린 뒤 작은 잎 묶음이 겹쳐지게 한다.
  g.strokeStyle='rgba(94,91,77,.7)';g.lineWidth=1.3;
  for(let k=0;k<12;k++){const a=k*2.4,d=48+R()*45;g.beginPath();g.moveTo(128,142);g.quadraticCurveTo(128+Math.cos(a)*d*0.4,120+Math.sin(a)*d*0.3,128+Math.cos(a)*d,128+Math.sin(a)*d);g.stroke();}
  for(let i=0;i<1400;i++){
    const a=R()*Math.PI*2,r=Math.sqrt(R())*(66+16*Math.sin(a*5+0.7)+8*Math.sin(a*9));
    const x=128+Math.cos(a)*r,y=128+Math.sin(a)*r*0.88;
    const shade=Math.floor(205+R()*45-(y-80)*0.07);
    g.fillStyle=`rgba(${shade},${shade},${Math.max(80,shade-12)},${0.65+R()*0.35})`;
    g.beginPath();g.ellipse(x,y,2+R()*3.8,1.2+R()*2.2,R()*6,0,Math.PI*2);g.fill();
  }
  g.fillStyle='#ffffff';g.fillRect(0,0,16,16); // 내부 수관용 불투명 UV 영역
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;
}
function foliageCards(seed, low, con, solid) {
  const R=rng(seed),parts=[],count=low?9:14;
  for(let i=0;i<count;i++){
    const a=i*2.4+R()*0.4,level=R();
    const y=con?0.8+level*1.7:1.12+level*0.8;
    const width=con?1.35*(1-level*0.72):1.0+R()*0.9;
    const radius=con?0.17:0.3+R()*0.28;
    const p=flat(new THREE.PlaneGeometry(width,con?0.85:0.95));
    const u=p.attributes.uv;for(let j=0;j<u.count;j++)u.setXY(j,0.08+u.getX(j)*0.84,0.08+u.getY(j)*0.84);
    p.rotateX((R()-0.5)*0.4);p.rotateY(a);p.translate(Math.cos(a)*radius,y,Math.sin(a)*radius);
    parts.push(paint(p,'#ffffff',0.4,2.7,0.58,1.03));
  }
  // 잎 카드만 남으면 위에서 나뭇가지처럼 보인다. 내부는 작은 불규칙 수관으로 채운다.
  for(let i=0;solid && i<(low?3:4);i++){
    const a=i*2.4,level=i/(low?3:4);
    const core=blob(low?0:1,seed+i*11,0.3);
    if(con) place(core,Math.cos(a)*0.08,0.95+level*1.35,Math.sin(a)*0.08,0.48*(1-level*0.55),0.48,0.48*(1-level*0.55));
    else place(core,Math.cos(a)*0.35,1.4+R()*0.32,Math.sin(a)*0.35,0.62,0.48+R()*0.12,0.62);
    core.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from({length:core.attributes.position.count*2},(_,j)=>j%2?0.97:0.03),2));
    parts.push(paint(core,'#ffffff',0.4,2.7,0.58,1.03));
  }
  return merge(parts);
}

// 원경도 잎으로 읽히되, 수관당 네 장만 사용해 전체 숲의 삼각형 수를 줄인다.
function distantCrown(seed, con) {
  const R=rng(seed),parts=[];
  for(let i=0;i<3;i++) {
    const w=con?1.3:1.8,h=con?2.1:1.45;
    const g=flat(new THREE.PlaneGeometry(w,h));g.rotateY(i*Math.PI/3+R()*.2);g.translate((R()-.5)*.2,con?1.7:1.6,(R()-.5)*.2);
    parts.push(paint(g,'#ffffff',.5,2.7,.58,1.02));
  }
  const top=flat(new THREE.PlaneGeometry(con?1:1.9,con?1:1.9));top.rotateX(-Math.PI/2);top.rotateY(R()*6);top.translate(0,con?2:1.9,0);parts.push(paint(top,'#ffffff',.5,2.7,.58,1.02));return merge(parts);
}

export function buildVegetation(terrain, { low, cutPlanes, foliageImage }) {
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
    if (R() > m * (0.3 + 0.7 * center) * (0.35 + 0.65 * smooth(-0.5, 0.6, noise(x * 0.028, z * 0.028)))) continue;
    const y = terrain.heightAt(x, z);
    const isCon = R() < 0.2 + smooth(14, 32, y) * 0.5;
    items.push({ x, y, z, con: isCon, a: R(), b: R(), c: R() });
  }
  // 관목: 숲 가장자리·초지에 낮게
  const shrubs = [];
  const sTarget = low ? 70 : 220;
  tries = 0;
  while (shrubs.length < sTarget && tries < sTarget * 20) {
    tries++;
    const x = -50 + R() * 100;
    const z = -210 + R() * 430;
    const m = forestMask(x, z);
    const edge = 1 - Math.abs(m - 0.35) * 2.2;
    if (Math.abs(z - riverZ(x)) < 8 || Math.abs(x - roadX(z)) < 4 || Math.abs(z - wallZ(x)) < 5) continue;
    const center = Math.exp(-(x * x) / (2 * 150 * 150));
    if (m < 0.12 || m > 0.75 || R() > edge * (0.25 + 0.75 * center)) continue;   // 숲 가장자리에만
    shrubs.push({ x, y: terrain.heightAt(x, z), z, a: R(), b: R(), c: R() });
  }

  const nB = low ? 2 : 3, nC = 2;
  const geoB = Array.from({ length: nB }, (_, i) => broadleaf(101 + i * 31, low));
  // 카메라 경로 주변만 잎 카드로 바꾸고 원거리 모델은 유지한다.
  const near = t => Math.abs(t.x) < (low ? 70 : 115) && t.z > -230 && t.z < 245;
  const geoC = Array.from({ length: nC }, (_, i) => conifer(203 + i * 17, low));
  // 납작하고 갈라진 하층 식생. 기존 구형 관목 대신 잎 묶음을 하나의 모델로 합친다.
  const under = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4;
    under.push(paint(place(flat(new THREE.ConeGeometry(0.13, 0.65, 3, 1, true)), Math.cos(a) * 0.3, 0.24, Math.sin(a) * 0.3, 1, 0.7 + (i % 3) * 0.15, 1, a), '#ffffff', 0, 0.65, 0.55, 1));
  }
  const geoS = merge(under);
  const broadCols = ['#5a7741', '#64793f', '#4f6b3c', '#6f7f46', '#58723f', '#617448', '#7c8247', '#4c6639'].map(h => new THREE.Color(h));
  const conCols = ['#3c5739', '#43603d', '#375036', '#4a5f3f'].map(h => new THREE.Color(h));
  const shrubCols = ['#566b3a', '#5f723d', '#4e6236', '#677440'].map(h => new THREE.Color(h));

  const meshes = [];
  const leafMap = foliageImage ? new THREE.Texture(foliageImage) : foliageTexture();
  leafMap.colorSpace=THREE.SRGBColorSpace;leafMap.anisotropy=2;leafMap.needsUpdate=true;
  const leafMat = new THREE.MeshBasicMaterial({map:leafMap,vertexColors:true,side:THREE.DoubleSide,alphaTest:0.35,clippingPlanes:cutPlanes,clipIntersection:true});
  const leafColors=['#ffffff','#eee8d5','#d2dcc9','#e5e8dd'].map(c=>new THREE.Color(c));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
  const make = (geo, list, colors, scaleFn, material) => {
    if (!list.length) return;
    const mat = material || new THREE.MeshLambertMaterial({ vertexColors: true, clippingPlanes: cutPlanes, clipIntersection: true });
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
    const bs = (t, s) => { const k = (0.9 + t.b * 1.25) * (1.25 + 0.35 * noise(t.x*.021,t.z*.021)); s.set(k * (0.78 + t.c * 0.36), k * (0.8 + t.a * 0.55), k * (0.8 + t.a * 0.35)); };
    const mine = items.filter(t => !t.con && Math.floor(t.a * 997) % nB === v);
    make(distantCrown(701+v*23,false), mine.filter(t => !near(t)), leafColors, bs, leafMat);
    make(foliageCards(401+v*19,low,false,!foliageImage),mine.filter(near),foliageImage?leafColors:broadCols,bs,leafMat);
    make(trunk(1.3,0.07,4),mine.filter(near),[new THREE.Color('#b4a089')],bs);
  }
  for (let v = 0; v < nC; v++) {
    const mine=items.filter(t=>t.con&&Math.floor(t.a*991)%nC===v);
    const scale=(t,s)=>{const k=(1.0+t.b*0.9)*(1.1+0.25*noise(t.x*.021,t.z*.021));s.set(k,k*(1.0+t.c*0.6),k);};
    make(distantCrown(811+v*23,true),mine.filter(t=>!near(t)),leafColors,scale,leafMat);
    make(foliageCards(501+v*17,low,true,!foliageImage),mine.filter(near),foliageImage?leafColors:conCols,scale,leafMat);
    make(trunk(1.2,0.06,4),mine.filter(near),[new THREE.Color('#a7947c')],scale);
  }
  make(geoS, shrubs, shrubCols, (t, s) => { const k = 0.6 + t.b * 0.6; s.set(k * (1 + t.c * 0.4), k * (0.9 + t.a * 0.5), k); });
  // 근경에만 수관 아래의 부드러운 접지 음영. 실시간 shadow map 없이 1개 draw call.
  const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
  const grad=ctx.createRadialGradient(32,32,3,32,32,30);grad.addColorStop(0,'rgba(32,39,27,.24)');grad.addColorStop(.5,'rgba(32,39,27,.12)');grad.addColorStop(1,'rgba(32,39,27,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(c),shadowItems=items.filter(near);
  const contact=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,clippingPlanes:cutPlanes,clipIntersection:true}),shadowItems.length);
  const normal=new THREE.Vector3(),axis=new THREE.Vector3(0,0,1);
  shadowItems.forEach((t,i)=>{
    const r=2.3+t.b*2.1,x=t.x+.25*r,z=t.z-.3*r;
    normal.set(-(terrain.heightAt(x+.5,z)-terrain.heightAt(x-.5,z)),1,-(terrain.heightAt(x,z+.5)-terrain.heightAt(x,z-.5))).normalize();
    pos.set(x,terrain.heightAt(x,z)+.08,z);q.setFromUnitVectors(axis,normal);scl.set(r*1.2,r*1.7,1);contact.setMatrixAt(i,m4.compose(pos,q,scl));
  });
  contact.frustumCulled=false;meshes.push(contact);
  return meshes;
}
