// 일반화된 경계 시설. 결정적 변주·공유 망 텍스처·인스턴싱으로 반복과 비용을 제한한다.
import * as THREE from './three.js?v=20261001-12';
import { W, fenceZ, roadX, drapeStrip, geomFrom } from './terrain.js?v=20261001-12';
const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
let meshTexture;
function wireTexture() {
  if (meshTexture) return meshTexture;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.lineWidth = 1.6;
  for (let k = -128; k <= 256; k += 32) {
    g.strokeStyle = k % 64 ? '#6c6e61' : '#80705b';
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(k + 128, 0); g.lineTo(k, 128); g.stroke();
  }
  meshTexture = new THREE.CanvasTexture(c);
  meshTexture.wrapS = meshTexture.wrapT = THREE.RepeatWrapping;
  meshTexture.anisotropy = 4;
  return meshTexture;
}
export function buildFence(terrain, z0, side, low) {
  const out = [], pts = [], P = [], UV = [], C = [], I = [], wires = [], posts = [], braces = [], signs = [], grass = [];
  const color = new THREE.Color();
  const height = x => 1.35 + 0.09 * Math.sin(x * 0.17) + 0.07 * (hash(Math.floor(x / 3), side) - 0.5);
  const top = x => {
    const a = W.xMin + 2 + Math.floor((x - W.xMin - 2) / 3) * 3, b = a + 3, t = (x - a) / 3;
    const za = fenceZ(a, z0, side), zb = fenceZ(b, z0, side);
    return (terrain.heightAt(a, za) + height(a)) * (1 - t) + (terrain.heightAt(b, zb) + height(b)) * t - Math.sin(t * Math.PI) * (0.04 + hash(a, z0) * 0.13);
  };
  let len = 0;
  for (let x = W.xMin + 2; x <= W.xMax - 2; x += 0.75) {
    const z = fenceZ(x, z0, side), y = terrain.heightAt(x, z), i = pts.length;
    if (i) len += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    pts.push([x, z]); P.push(x, y + 0.03, z, x, top(x), z);
    UV.push(len / 1.2, 0, len / 1.2, 1);
    color.set('#b1ac94').lerp(new THREE.Color('#89755a'), hash(Math.floor(x / 9), z0) * 0.4);
    C.push(color.r * 0.7, color.g * 0.7, color.b * 0.7, color.r, color.g, color.b);
    if (i) { const a = (i - 1) * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    if (i) for (const h of [0.38, 0.9]) {
      const [px, pz] = pts[i - 1];
      wires.push(px, top(px) - h, pz, x, top(x) - h, z);
    }
    if (i % 4 === 0) posts.push({x, z, y, h:height(x), lean:(hash(x, z0) - 0.5) * 0.06});
    if (i % 44 === 0 || Math.abs(x - roadX(z)) < 0.8) braces.push({x, z, y, h:height(x)});
    if (i % 136 === 20 && Math.abs(x) < 230) signs.push({x,z,y:top(x) - 0.35});
    if (Math.abs(x) < (low ? 65 : 110) && hash(x, side) > 0.4 && Math.abs(x - roadX(z)) > 5) {
      for (let k = 0; k < 3; k++) grass.push({x:x + hash(x,k) * 0.6,z:z - side * (0.2 + hash(x,k+5) * 0.8),h:0.3 + hash(x,k+8) * 0.65});
    }
  }
  out.push(new THREE.Mesh(geomFrom(drapeStrip(terrain, pts.map(([x,z])=>[x,z+side*3.4]), 2.4, 0.18)), new THREE.MeshLambertMaterial({color:'#b2aa90',polygonOffset:true,polygonOffsetFactor:-2})));
  out.push(new THREE.Mesh(geomFrom(drapeStrip(terrain, pts, 2.8, 0.1)), new THREE.MeshLambertMaterial({color:'#949477',polygonOffset:true,polygonOffsetFactor:-1})));
  const g = geomFrom({P,I,UV}); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  out.push(new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:wireTexture(),vertexColors:true,alphaTest:0.22,side:THREE.DoubleSide})));
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position',new THREE.Float32BufferAttribute(wires,3));
  out.push(new THREE.LineSegments(wg,new THREE.LineBasicMaterial({color:'#66695a'})));
  const obj = new THREE.Object3D();
  const inst = (geo, list, mat, place) => {
    const m = new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((p,i)=>{obj.position.set(0,0,0);obj.rotation.set(0,0,0);obj.scale.set(1,1,1);place(p,i,obj);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,color.set('#ffffff').lerp(new THREE.Color('#90765b'),hash(i,z0)*0.45));});
    out.push(m); return m;
  };
  inst(new THREE.BoxGeometry(0.115,1,0.115).translate(0,0.5,0),posts,new THREE.MeshLambertMaterial({color:'#676b60'}),(p,i,o)=>{o.position.set(p.x,p.y,p.z);o.rotation.z=p.lean;o.scale.y=p.h+0.25;});
  inst(new THREE.BoxGeometry(0.075,1,0.075).translate(0,0.5,0),braces,new THREE.MeshLambertMaterial({color:'#60665b'}),(p,i,o)=>{o.position.set(p.x,p.y,p.z+side*0.8);o.rotation.x=side*0.47;o.scale.y=p.h*1.05;});
  const coils = pts.filter((_,i)=>i%(low?2:1)===0);
  inst(new THREE.TorusGeometry(0.25,0.018,3,low?7:9),coils,new THREE.MeshLambertMaterial({color:'#636658'}),([x,z],i,o)=>{o.position.set(x,top(x)+0.17,z);o.rotation.set(0,Math.PI/2-Math.atan2(fenceZ(x+0.5,z0,side)-fenceZ(x-0.5,z0,side),1),(hash(x,z0)-0.5)*0.65);const s=0.85+hash(x,side)*0.28;o.scale.set(s,0.86+hash(x,2)*0.2,s);});
  inst(new THREE.BoxGeometry(0.52,0.34,0.035),signs,new THREE.MeshLambertMaterial({color:'#a49258'}),(p,i,o)=>{o.position.set(p.x,p.y,p.z+side*0.08);o.rotation.set(0,-Math.atan2(fenceZ(p.x+0.5,z0,side)-fenceZ(p.x-0.5,z0,side),1),(hash(i,z0)-0.5)*0.1);});
  inst(new THREE.ConeGeometry(0.065,1,3).translate(0,0.5,0),grass,new THREE.MeshLambertMaterial({color:'#64704b'}),(p,i,o)=>{o.position.set(p.x,terrain.heightAt(p.x,p.z),p.z);o.rotation.set((hash(i,1)-0.5)*0.4,hash(i,2)*6,(hash(i,3)-0.5)*0.4);o.scale.set(1,p.h,1);});
  return out;
}
