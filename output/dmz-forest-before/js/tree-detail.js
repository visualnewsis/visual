// 근경 수목용 줄기·가지 한 벌. 초기화 때 한 번 만들고 기존 수목 인스턴스에 공유한다.
import * as THREE from './three.js?v=20261001-12';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (x, y = 0) => {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function barkTexture(low) {
  const width = 128, height = low ? 256 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    // 수직의 가는 골과 끊긴 껍질 결. 모든 명암은 재질 안에서 약하게 제한한다.
    const wander = 1.1 * Math.sin(y * .026) + .6 * Math.sin(y * .071 + x * .08);
    const phase = (x + wander) * Math.PI / 7.5;
    const groove = Math.pow(.5 + .5 * Math.sin(phase), 9);
    const plates = hash(Math.floor((x + wander) / 5), Math.floor(y / 27));
    const grain = (hash(x, y) - .5) * 15;
    const v = clamp(220 - 32 * groove + (plates - .5) * 17 + grain, 166, 239);
    const i = (y * width + x) * 4;
    pixels.data[i] = v;
    pixels.data[i + 1] = v - 2;
    pixels.data[i + 2] = v - 7;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 2;
  return map;
}

export function createTreeDetail({ low = false, cutPlanes = [] } = {}) {
  const parts = [];
  const center = y => new THREE.Vector3(.032 * Math.sin(y * 2.35), y, -.017 * y);
  const stem = new THREE.CylinderGeometry(.031, .079, 1.48, low ? 4 : 5, 3, true);
  const p = stem.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + .74, c = center(y);
    // 밑동만 살짝 넓고 축은 미세하게 굽는다. 높이·인스턴스 원점은 기존 줄기와 같다.
    const foot = 1 + .13 * Math.pow(1 - y / 1.48, 3);
    p.setXYZ(i, c.x + p.getX(i) * foot, y, c.z + p.getZ(i) * foot);
  }
  stem.computeVertexNormals();
  parts.push(stem.toNonIndexed()); stem.dispose();

  const up = new THREE.Vector3(0, 1, 0);
  const addBranch = (from, to, radius, tip) => {
    const axis = new THREE.Vector3().subVectors(to, from);
    const part = new THREE.CylinderGeometry(tip, radius, axis.length(), 3, 1, true);
    part.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, axis.normalize()));
    part.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
    parts.push(part.toNonIndexed()); part.dispose();
  };
  addBranch(center(.82), new THREE.Vector3(-.28, 1.58, .12), .024, .006);
  addBranch(center(1.02), new THREE.Vector3(.31, 1.73, -.17), .021, .005);
  addBranch(center(1.19), new THREE.Vector3(-.14, 1.91, -.24), .017, .004);
  addBranch(new THREE.Vector3(-.16, 1.30, .065), new THREE.Vector3(-.38, 1.84, .20), .011, .003);

  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2), colors = new Float32Array(count * 3);
  let offset = 0;
  for (const part of parts) {
    positions.set(part.attributes.position.array, offset * 3);
    normals.set(part.attributes.normal.array, offset * 3);
    uvs.set(part.attributes.uv.array, offset * 2);
    for (let i = 0; i < part.attributes.position.count; i++) {
      const y = part.attributes.position.getY(i);
      const shade = .82 + .18 * clamp(y / 1.9, 0, 1);
      colors.set([shade, shade, shade], (offset + i) * 3);
    }
    offset += part.attributes.position.count;
    part.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();

  const map = barkTexture(low);
  const material = new THREE.MeshPhongMaterial({
    color: '#8b8067', map, bumpMap: map, bumpScale: low ? .005 : .008,
    shininess: 3, specular: '#211f18', vertexColors: true,
    clippingPlanes: cutPlanes, clipIntersection: true,
  });
  return { geometry, material };
}
