import * as THREE from "./vendor/three.module.min.js";
import {
  TITLE,
  PLAYER_START,
  PLAYER_START_YAW,
  CORRIDOR_WIDTH,
  CEILING_HEIGHT,
  ZONES,
  ZONES_B,
  PATH,
  CHECKPOINTS,
  CALL_BUTTON,
  ENDING,
} from "./world.js?v=20260908-2";

const canvas = document.getElementById("scene");
const hud = {
  percent: document.getElementById("hud-percent"),
  bar: document.getElementById("hud-bar-fill"),
  toast: document.getElementById("hud-toast"),
  hint: document.getElementById("hud-hint"),
  interact: document.getElementById("hud-interact"),
  overlay: document.getElementById("hud-overlay"),
  overlayTitle: document.getElementById("hud-overlay-title"),
  overlayCopy: document.getElementById("hud-overlay-copy"),
  restart: document.getElementById("hud-restart"),
  brand: document.getElementById("hud-brand"),
  title: document.getElementById("hud-title"),
};

hud.brand.textContent = TITLE.brand;
hud.title.textContent = `${TITLE.main} — ${TITLE.sub}`;

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#111318");
scene.fog = new THREE.Fog("#111318", 16, 46);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.05,
  200
);
camera.position.set(PLAYER_START.x, PLAYER_START.y, PLAYER_START.z);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ------------------------------------------------------------------ lights
scene.add(new THREE.HemisphereLight("#ffffff", "#3a3a30", 0.55));
const sun = new THREE.DirectionalLight("#fff3e0", 0.4);
sun.position.set(10, 12, 6);
scene.add(sun);

const ceilingLights = [];
function addCeilingLight(x, z, color = "#fff8e6", intensity = 0.9) {
  const light = new THREE.PointLight(color, intensity, 7, 2);
  light.position.set(x, CEILING_HEIGHT - 0.15, z);
  scene.add(light);
  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.06, 0.35),
    new THREE.MeshStandardMaterial({
      color: "#fffef2",
      emissive: "#fff6d8",
      emissiveIntensity: 0.8,
    })
  );
  fixture.position.set(x, CEILING_HEIGHT - 0.06, z);
  scene.add(fixture);
  ceilingLights.push(light);
}

// ---------------------------------------------------------- procedural fx
// Small hand-drawn canvas textures so surfaces read as tile/carpet/fabric
// instead of flat plastic color, without pulling in any external image.
function makeTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function tileFloorTexture(base, grout, repeatW, repeatD) {
  const t = makeTexture(128, 128, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = grout;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 125, 125);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(90,80,60,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(4, 4, 40, 3);
  });
  t.repeat.set(repeatW, repeatD);
  return t;
}

function carpetTexture(repeatW, repeatD) {
  const t = makeTexture(96, 96, (ctx) => {
    ctx.fillStyle = "#c7bfae";
    ctx.fillRect(0, 0, 96, 96);
    for (let i = 0; i < 1400; i++) {
      const v = Math.random() * 0.14;
      ctx.fillStyle = `rgba(60,52,38,${v})`;
      ctx.fillRect(Math.random() * 96, Math.random() * 96, 1, 1);
    }
  });
  t.repeat.set(repeatW, repeatD);
  return t;
}

function fabricTexture(color) {
  return makeTexture(64, 64, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 2) {
      ctx.fillStyle = `rgba(0,0,0,${y % 4 === 0 ? 0.06 : 0.02})`;
      ctx.fillRect(0, y, 64, 1);
    }
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
    }
  });
}

function woodTexture() {
  const t = makeTexture(64, 128, (ctx) => {
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 64;
      ctx.strokeStyle = `rgba(40,25,12,${Math.random() * 0.35})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 4, 40, x - 4, 90, x + 2, 128);
      ctx.stroke();
    }
  });
  return t;
}

function brushedMetalTexture() {
  const t = makeTexture(64, 128, (ctx) => {
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(0, 0, 64, 128);
    for (let y = 0; y < 128; y++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(0, y, 64, 1);
    }
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, 20, 64, 2);
  });
  return t;
}

function marbleTexture() {
  return makeTexture(128, 128, (ctx) => {
    ctx.fillStyle = "#cabfa9";
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(120,105,80,${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.4;
      ctx.beginPath();
      const y0 = Math.random() * 128;
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(40, y0 + (Math.random() - 0.5) * 40, 90, y0 + (Math.random() - 0.5) * 40, 128, y0 + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(90,80,60,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
  });
}
const MARBLE_TEX = marbleTexture();
MARBLE_TEX.repeat.set(2, 2);

// The office wall map, hand-signed in the corner like a real drawn map.
// Drawn once immediately with a fallback italic, then redrawn once the
// Gaegu web font (loaded in index.html) actually finishes loading.
function mapSignatureTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 366;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  function draw(fontReady) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 366);
    ctx.fillStyle = "#dfe6e0";
    ctx.fillRect(0, 0, 512, 366);
    ctx.strokeStyle = "rgba(90,100,95,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + i * 15, 30 + i * 8);
      ctx.bezierCurveTo(150, 60 + i * 20, 320, 40 + i * 15, 480 - i * 10, 90 + i * 25);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(430, 330);
    ctx.rotate(-0.05);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(40,45,42,0.8)";
    ctx.font = fontReady ? "26px \"Gaegu\", cursive" : "italic 20px Georgia, serif";
    ctx.fillText("크리에이티브 디렉터 = 안재현", 0, 0);
    ctx.restore();
  }

  draw(false);
  document.fonts.load('700 26px "Gaegu"').then(() => {
    draw(true);
    texture.needsUpdate = true;
  }).catch(() => {});

  return texture;
}


const FLOOR_TEX = {
  desk: tileFloorTexture("#cbbfa5", "#a99a76", 6, 3.4),
  "cubicle-a": tileFloorTexture("#d8d2c0", "#b7ab8c", 10, 3.4),
  "cubicle-b": tileFloorTexture("#dfdac9", "#bfb495", 10, 3.4),
  "office-corridor": tileFloorTexture("#e6e1d3", "#c3b89a", 14, 3.4),
  "building-corridor": carpetTexture(30, 6.8),
  "elevator-lobby": tileFloorTexture("#d7d2c6", "#b0a488", 8, 3.4),
};
function ceilingTexture(repeatW, repeatD) {
  const t = makeTexture(128, 128, (ctx) => {
    ctx.fillStyle = "#f4f2ec";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "rgba(150,145,130,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 126);
  });
  t.repeat.set(repeatW, repeatD);
  return t;
}
const PARTITION_TEX = fabricTexture("#93b9a6");
const WOOD_TEX = woodTexture();
const METAL_TEX = brushedMetalTexture();

// ------------------------------------------------------------- zone shells
// The route is an L: segment A runs along +X (desk -> ... -> office exit),
// then turns 90° at x=CORNER_X and segment B runs along +Z to the elevator
// lobby. Segment B's rectangle is x:[CORNER_X-halfW, CORNER_X+halfW],
// z:[-halfW, B_END] so the two rectangles overlap in a shared corner square
// and their outer/inner walls meet without gaps or z-fighting — see the
// wall-trim logic below.
const halfW = CORRIDOR_WIDTH / 2;
const CORNER_X = PATH[1].x; // 40
const B_END = PATH[2].z; // 36

function floorPanel(cx, cz, sx, sz, tex, roughness = 0.78) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sx, sz),
    new THREE.MeshStandardMaterial({ map: tex, color: "#ffffff", roughness })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, 0, cz);
  scene.add(mesh);
}
function ceilingPanel(cx, cz, sx, sz) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sx, sz),
    new THREE.MeshStandardMaterial({ map: ceilingTexture(sx, sz), color: "#ffffff", roughness: 1 })
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(cx, CEILING_HEIGHT, cz);
  scene.add(mesh);
}
// A wall running along X at fixed z, spanning x:[x0,x1]. facing = +1 (wall's
// visible face points toward +Z) or -1 (points toward -Z).
function wallAlongX(x0, x1, z, facing, color) {
  if (x1 <= x0) return;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(x1 - x0, CEILING_HEIGHT),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 })
  );
  mesh.position.set((x0 + x1) / 2, CEILING_HEIGHT / 2, z);
  mesh.rotation.y = facing === 1 ? 0 : Math.PI;
  scene.add(mesh);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(x1 - x0, 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: "#5c5548" })
  );
  base.position.set((x0 + x1) / 2, 0.04, z + facing * 0.02);
  scene.add(base);
}
// A wall running along Z at fixed x, spanning z:[z0,z1]. facing = +1 (faces
// +X) or -1 (faces -X).
function wallAlongZ(z0, z1, x, facing, color) {
  if (z1 <= z0) return;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(z1 - z0, CEILING_HEIGHT),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 })
  );
  mesh.position.set(x, CEILING_HEIGHT / 2, (z0 + z1) / 2);
  mesh.rotation.y = (facing === 1 ? 1 : -1) * Math.PI / 2;
  scene.add(mesh);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.08, z1 - z0),
    new THREE.MeshStandardMaterial({ color: "#5c5548" })
  );
  base.position.set(x + facing * 0.02, 0.04, (z0 + z1) / 2);
  scene.add(base);
}

// segment A: desk / cubicle-a / cubicle-b (generic zones, no corner trims)
for (const zone of ZONES) {
  const width = zone.x1 - zone.x0;
  const cx = (zone.x0 + zone.x1) / 2;
  floorPanel(cx, 0, width, CORRIDOR_WIDTH, FLOOR_TEX[zone.id]);
  ceilingPanel(cx, 0, width, CORRIDOR_WIDTH);
  wallAlongX(zone.x0, zone.x1, -halfW, 1, zone.wall);
  wallAlongX(zone.x0, zone.x1, halfW, -1, zone.wall);
  const lightCount = Math.max(1, Math.round(width / 6));
  for (let i = 0; i < lightCount; i++) {
    addCeilingLight(zone.x0 + (width * (i + 0.5)) / lightCount, 0);
  }
}

// office-corridor zone (26 -> past the corner) + the corner square itself.
// Its "north" wall (z=+halfW) stops short of the corner so the route can
// turn into segment B; its "south" wall (z=-halfW) runs all the way past
// the corner to meet segment B's outer wall, and the corner-square sliver
// (CORNER_X..CORNER_X+halfW) is floored/ceilinged here so segment B's own
// floor can start cleanly at z=halfW with no overlap or gap.
{
  const OC_X0 = 26, OC_INNER_STOP = CORNER_X - halfW;
  floorPanel((OC_X0 + CORNER_X + halfW) / 2, 0, CORNER_X + halfW - OC_X0, CORRIDOR_WIDTH, FLOOR_TEX["office-corridor"]);
  ceilingPanel((OC_X0 + CORNER_X + halfW) / 2, 0, CORNER_X + halfW - OC_X0, CORRIDOR_WIDTH);
  wallAlongX(OC_X0, CORNER_X + halfW, -halfW, 1, "#efece3"); // outer wall, runs past the corner
  wallAlongX(OC_X0, OC_INNER_STOP, halfW, -1, "#efece3"); // inner wall, stops at the opening
  const lightCount = 3;
  for (let i = 0; i < lightCount; i++) addCeilingLight(OC_X0 + ((CORNER_X - OC_X0) * (i + 0.5)) / lightCount, 0);
}

// segment B: building-corridor + elevator-lobby, running along +Z
for (const zone of ZONES_B) {
  const depth = zone.z1 - zone.z0;
  const cz = (zone.z0 + zone.z1) / 2;
  floorPanel(CORNER_X, cz, CORRIDOR_WIDTH, depth, FLOOR_TEX[zone.id], zone.id === "building-corridor" ? 0.98 : 0.78);
  ceilingPanel(CORNER_X, cz, CORRIDOR_WIDTH, depth);
  wallAlongZ(zone.z0, zone.z1, CORNER_X + halfW, -1, zone.wall); // outer wall, normal points back into the room (-X)
  wallAlongZ(Math.max(zone.z0, halfW), zone.z1, CORNER_X - halfW, 1, zone.wall); // inner wall (opens at the corner), normal +X
  const lightCount = Math.max(1, Math.round(depth / 6));
  for (let i = 0; i < lightCount; i++) {
    addCeilingLight(CORNER_X, zone.z0 + (depth * (i + 0.5)) / lightCount);
  }
}

// --------------------------------------------------------------- colliders
// Simple circle-vs-box push-out colliders for a handful of large props.
const colliders = [];
const elevatorDoors = [];
let callButtonMesh = null;
function addCollider(x, z, sx, sz) {
  colliders.push({
    minX: x - sx / 2,
    maxX: x + sx / 2,
    minZ: z - sz / 2,
    maxZ: z + sz / 2,
  });
}

function box(x, y, z, sx, sy, sz, color, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

const shadowMat = new THREE.MeshBasicMaterial({
  color: "#000000",
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});
function groundShadow(x, z, rx, rz = rx) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shadowMat);
  mesh.scale.set(rx, rz, 1);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.008, z);
  scene.add(mesh);
  return mesh;
}

function cylinder(x, y, z, r, h, color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  );
  mesh.position.set(x, y + h / 2, z);
  scene.add(mesh);
  return mesh;
}

// Tall mesh office chair with a rolled headrest and pivoting round armrests —
// this exact silhouette repeats in almost every cubicle photo, so getting it
// right matters more than any other single prop.
function officeChair(x, z, rotY, color) {
  const g = new THREE.Group();
  const meshMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const trimMat = new THREE.MeshStandardMaterial({ color: "#111214", roughness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color: "#3a3d42", roughness: 0.35, metalness: 0.6 });

  // backrest: three angled panels instead of one flat slab, so the chair
  // reads as curved (concave toward the sitter) from every angle, plus a
  // slim frame border like a real mesh-back chair's plastic edge.
  const backY = 0.9, backH = 0.56;
  const backCenter = new THREE.Mesh(new THREE.BoxGeometry(0.24, backH, 0.03), meshMat);
  backCenter.position.set(0, backY, -0.21);
  g.add(backCenter);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.15, backH, 0.03), meshMat);
    wing.position.set(side * 0.185, backY, -0.195);
    wing.rotation.y = side * 0.4;
    g.add(wing);
  }
  // frame border around the mesh insert
  for (const yEdge of [backY - backH / 2, backY + backH / 2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.04), trimMat);
    rail.position.set(0, yEdge, -0.2);
    rail.rotation.x = 0.05;
    g.add(rail);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, backH + 0.03, 0.04), trimMat);
    rail.position.set(side * 0.245, backY, -0.16 - Math.abs(side) * 0.02);
    rail.rotation.y = side * 0.4;
    g.add(rail);
  }

  // headrest: mounted on two visible rods with a real gap, bolster tilted
  // forward like a pillow instead of glued flat onto the backrest.
  for (const side of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), frameMat);
    rod.position.set(side * 0.09, backY + backH / 2 + 0.07, -0.24);
    g.add(rod);
  }
  const headrest = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.34, 14), meshMat);
  headrest.rotation.z = Math.PI / 2;
  headrest.rotation.x = 0.35;
  headrest.position.set(0, backY + backH / 2 + 0.17, -0.22);
  g.add(headrest);

  // seat cushion with a slightly domed profile
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.44), meshMat);
  seat.position.set(0, 0.52, 0.02);
  g.add(seat);
  const seatLip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.46, 10, 1, false, 0, Math.PI), trimMat);
  seatLip.rotation.z = Math.PI / 2;
  seatLip.position.set(0, 0.485, 0.24);
  g.add(seatLip);

  // armrests: a visible post plus a distinct dark paddle-shaped pad, angled
  // out past the seat like the reference chairs' pivoting armrests.
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.03), frameMat);
    post.position.set(side * 0.25, 0.68, -0.02);
    g.add(post);
    const pad = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), trimMat);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(side * 0.26, 0.81, 0.03);
    g.add(pad);
  }

  const gasCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.26, 10), frameMat);
  gasCyl.position.set(0, 0.35, 0.02);
  g.add(gasCyl);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.05, 10), frameMat);
  hub.position.set(0, 0.22, 0.02);
  g.add(hub);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.26), frameMat);
    leg.position.set(Math.cos(ang) * 0.15, 0.05, 0.02 + Math.sin(ang) * 0.15);
    leg.rotation.y = ang;
    g.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.022, 8), trimMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(Math.cos(ang) * 0.27, 0.028, 0.02 + Math.sin(ang) * 0.27);
    g.add(wheel);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  groundShadow(x, z, 0.32, 0.32);
  addCollider(x, z, 0.5, 0.5);
  return g;
}

// A tiny brass "credit plaque" easter egg, low on a wall corner — the kind
// of detail most players walk right past.
function creditPlaque(x, y, z, rotY) {
  const tex = makeTexture(256, 96, (ctx) => {
    ctx.fillStyle = "#2a2418";
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = "#d8b878";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("크리에이티브 디렉터 = 안재현", 128, 42);
    ctx.font = "11px monospace";
    ctx.fillStyle = "#a4926a";
    ctx.fillText("37.561827°N · 126.991076°E", 128, 66);
  });
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.1, 0.008),
    new THREE.MeshStandardMaterial({ map: tex, color: "#ffffff", roughness: 0.4, metalness: 0.3 })
  );
  plaque.position.set(x, y, z);
  plaque.rotation.y = rotY;
  scene.add(plaque);
}

function acDiffuser(x, z, size = 0.5) {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(size / 2, size / 2, 0.03, 20),
    new THREE.MeshStandardMaterial({ color: "#d8d5cc", roughness: 0.6 })
  );
  disc.position.set(x, CEILING_HEIGHT - 0.02, z);
  scene.add(disc);
}

// discoverable props: hidden/dim until their checkpoint fires
const reveals = { "stand-up": [], "cubicle-a": [], "cubicle-b": [], "exit-door": [], "building-corridor": [], "elevator-lobby": [] };
function revealable(id, obj) {
  obj.visible = false;
  reveals[id]?.push(obj);
  return obj;
}

// Zone: desk (0-6) — player's own cluttered desk against +Z wall.
// Matches the reference frame: two monitors (one dark/off, one lit with a
// news page + dark side panel), desk fan, tissue box, cable clutter, drawer
// unit, low office chair with castors.
{
  const deskZ = halfW - 0.55;
  const deskTopY = 0.74;

  groundShadow(2.3, deskZ - 0.1, 1.0, 0.55);
  groundShadow(2.3, deskZ - 1.05, 0.32, 0.3);

  // desk slab with a visible front edge (two-tone = cheap bevel fake)
  box(2.3, deskTopY, deskZ, 1.7, 0.04, 0.75, "#cdbd9a");
  box(2.3, deskTopY - 0.02, deskZ + 0.375, 1.7, 0.03, 0.02, "#b3a37f");
  // drawer unit under the desk, right side
  box(2.95, deskTopY / 2, deskZ + 0.18, 0.42, deskTopY - 0.03, 0.5, "#e9e4d6");
  box(2.95, deskTopY * 0.32, deskZ - 0.07, 0.3, 0.05, 0.02, "#8f8a78"); // drawer handle
  box(2.95, deskTopY * 0.62, deskZ - 0.07, 0.3, 0.05, 0.02, "#8f8a78");
  addCollider(2.3, deskZ, 1.8, 0.85);

  // monitor arm + dual monitors
  const armX = 1.75;
  box(armX, deskTopY + 0.02, deskZ - 0.28, 0.06, 0.35, 0.06, "#2c2c2c");
  function monitor(x, on) {
    const bezel = box(x, 1.28, deskZ - 0.32, 0.5, 0.32, 0.03, "#111214");
    if (on) {
      box(x, 1.34, deskZ - 0.305, 0.44, 0.09, 0.005, "#0f8fa8", {
        emissive: "#0f8fa8",
        emissiveIntensity: 0.7,
      }); // top nav bar (teal, like the editorial CMS)
      box(x, 1.22, deskZ - 0.305, 0.44, 0.15, 0.005, "#181c22", {
        emissive: "#1a2430",
        emissiveIntensity: 0.5,
      }); // dark content/list panel
      box(x - 0.08, 1.235, deskZ - 0.304, 0.22, 0.09, 0.003, "#e94f6b", {
        emissive: "#e94f6b",
        emissiveIntensity: 0.5,
      }); // thumbnail block, magenta like the news photos
    } else {
      box(x, 1.28, deskZ - 0.305, 0.44, 0.26, 0.005, "#050506");
    }
    box(x, 1.1, deskZ - 0.3, 0.03, 0.06, 0.06, "#111214"); // stand neck
    box(x, 1.06, deskZ - 0.28, 0.18, 0.02, 0.14, "#111214"); // stand foot
  }
  monitor(1.55, false); // left monitor: off
  monitor(2.15, true); // right monitor: on, showing the news page

  // keyboard + mouse
  box(2.0, deskTopY + 0.015, deskZ + 0.18, 0.34, 0.02, 0.13, "#1c1c1c");
  box(2.35, deskTopY + 0.012, deskZ + 0.2, 0.05, 0.015, 0.08, "#1c1c1c");

  // clutter: tissue box, coffee jar, cable spool, folders, desk fan
  box(1.35, deskTopY + 0.07, deskZ + 0.2, 0.16, 0.14, 0.12, "#e8ede2");
  box(1.35, deskTopY + 0.14, deskZ + 0.2, 0.14, 0.01, 0.02, "#c94f6b");
  cylinder(1.55, deskTopY, deskZ - 0.05, 0.045, 0.11, "#e6e0cf"); // jar
  const fanHub = cylinder(2.65, deskTopY, deskZ - 0.15, 0.03, 0.16, "#1c1c1c");
  const fanRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.012, 8, 20),
    new THREE.MeshStandardMaterial({ color: "#2f4a33" })
  );
  fanRing.position.set(2.65, deskTopY + 0.16, deskZ - 0.15);
  scene.add(fanRing);
  box(1.15, deskTopY + 0.04, deskZ - 0.1, 0.1, 0.07, 0.28, "#3a63c9"); // blue folder stack
  box(1.15, deskTopY + 0.09, deskZ - 0.1, 0.11, 0.02, 0.29, "#e6c94a");

  // low mesh office chair: seat + backrest + star base with castors
  const chairX = 2.3, chairZ = deskZ - 1.05;
  box(chairX, 0.46, chairZ, 0.42, 0.06, 0.4, "#1c1c1c");
  box(chairX, 0.75, chairZ + 0.2, 0.42, 0.5, 0.06, "#1c1c1c");
  cylinder(chairX, 0.2, chairZ, 0.035, 0.26, "#333333"); // gas cylinder
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    cylinder(chairX + Math.cos(ang) * 0.22, 0, chairZ + Math.sin(ang) * 0.22, 0.025, 0.04, "#111111");
  }
  addCollider(chairX, chairZ, 0.5, 0.5);

  // PC tower, dimly visible under the desk shadow
  box(2.95, 0.2, deskZ - 0.15, 0.18, 0.4, 0.42, "#d9d5c8");

  // low in the corner by the door out — easy to walk past without noticing
  creditPlaque(0.22, 0.14, -halfW + 0.021, 0);
}

// Zone: cubicle-a (6-16) — mint fabric partitions + water purifier/microwave
// shelf, matching the reference frame's cubicle bay.
{
  function partition(x, zSide) {
    const z = zSide * (halfW - 0.15);
    box(x, 1.05, z, 0.06, 1.05, 1.55, "#ffffff", { map: PARTITION_TEX }); // mint fabric panel
    box(x, 1.6, z, 0.07, 0.06, 1.6, "#5f7d6d"); // top frame rail
    for (const yEdge of [0.32, 1.58]) {
      box(x, yEdge, z, 0.065, 0.03, 1.6, "#6f9280");
    }
    addCollider(x, z, 0.3, 1.6);
  }
  for (const zSide of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = 7 + i * 2.6;
      partition(x, zSide);
      groundShadow(x, zSide * (halfW - 0.15), 0.7, 0.15);
    }
  }

  // desks glimpsed behind the near partitions
  box(8, 0.72, halfW - 0.6, 1.2, 0.04, 0.6, "#d8d2c0");
  box(15, 0.72, -halfW + 0.6, 1.2, 0.04, 0.6, "#d8d2c0");

  // rows of tall black mesh chairs facing their desks — the single most
  // repeated silhouette in the reference footage
  for (const zSide of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = 7.3 + i * 2.6;
      officeChair(x, zSide * (halfW - 0.85), zSide === 1 ? 0 : Math.PI, "#1c1c1c");
    }
  }

  acDiffuser(9, 0);
  acDiffuser(14, 0);

  // wall clock above the aisle, small ceiling-mounted TV playing a news feed
  cylinder(9.5, 1.9, halfW - 0.03, 0.14, 0.03, "#f2f2ec");
  box(9.5, 1.9, halfW - 0.05, 0.02, 0.09, 0.005, "#222222"); // clock hands, edge-on

  box(8.8, 2.15, -halfW + 0.05, 0.34, 0.22, 0.03, "#0c0c0c"); // small mounted monitor
  box(8.8, 2.18, -halfW + 0.07, 0.3, 0.14, 0.005, "#c92e6b", {
    emissive: "#c92e6b",
    emissiveIntensity: 0.6,
  }); // magenta news-broadcast graphic

  groundShadow(11, 0.35, 0.3, 0.3);
  groundShadow(11.5, 0.35, 0.6, 0.35);

  // two-tier water purifier (white column, LG-style)
  cylinder(11, 0, 0.35, 0.16, 0.62, "#f4f4f0");
  cylinder(11, 0.62, 0.35, 0.135, 0.5, "#e9e9e3");
  box(11, 0.86, 0.44, 0.02, 0.05, 0.05, "#2a2a2a"); // dispenser lever

  // dark wood shelf unit, three tiers, holding a microwave + parcel boxes
  const shelfX = 11.5, shelfZ = 0.35;
  box(shelfX, 0.9, shelfZ, 0.95, 0.03, 0.5, "#3d382e");
  box(shelfX, 0.55, shelfZ, 0.95, 0.03, 0.5, "#3d382e");
  box(shelfX, 0.2, shelfZ, 0.95, 0.03, 0.5, "#3d382e");
  box(shelfX - 0.44, 0.55, shelfZ, 0.05, 1.4, 0.5, "#2c2820");
  box(shelfX + 0.44, 0.55, shelfZ, 0.05, 1.4, 0.5, "#2c2820");
  box(shelfX, 1.08, shelfZ - 0.08, 0.55, 0.3, 0.35, "#151515"); // microwave body
  box(shelfX + 0.18, 1.08, shelfZ + 0.11, 0.16, 0.24, 0.02, "#3a3a3a"); // microwave door window
  box(shelfX - 0.15, 0.68, shelfZ, 0.4, 0.16, 0.35, "#c9a15a"); // parcel box
  box(shelfX + 0.15, 0.33, shelfZ - 0.05, 0.3, 0.14, 0.3, "#d3d3d3"); // parcel box
  addCollider(11, 0.35, 0.4, 0.75);
  addCollider(shelfX, shelfZ, 1, 0.55);

  // wall map with a placard above it, and a low bookshelf beside it — the
  // backdrop behind the water purifier/microwave shelf in the reference shot
  box(13.4, 1.35, -halfW + 0.03, 1.15, 0.85, 0.02, "#c98a4a"); // frame
  const mapFace = box(13.4, 1.35, -halfW + 0.045, 1.05, 0.75, 0.005, "#ffffff", {
    map: mapSignatureTexture(),
    emissive: "#c7d6cf",
    emissiveIntensity: 0.15,
  }); // pale map face, signed in the corner like a real hand-drawn map
  box(13.4, 1.85, -halfW + 0.04, 0.5, 0.14, 0.01, "#e9e6de");
  box(12.55, 0.55, -halfW + 0.15, 0.4, 1.1, 0.3, "#5c4a34"); // bookshelf carcass
  for (let i = 0; i < 3; i++) {
    box(12.55, 0.22 + i * 0.32, -halfW + 0.15, 0.36, 0.02, 0.28, "#3f3222");
  }
  addCollider(13.4, -halfW + 0.1, 1.2, 0.3);
  addCollider(12.55, -halfW + 0.15, 0.4, 0.3);

  revealable(
    "cubicle-a",
    box(8.5, 1.5, halfW - 0.8, 0.5, 0.02, 0.35, "#3a3a3a")
  ); // wall sign, dark until this zone is discovered
}

// Zone: cubicle-b (16-26) — reception + wood-tone desk row with blue mesh
// chairs and dense potted plants, behind a frosted glass wall and wood door.
function potPlant(x, z, scale = 1) {
  cylinder(x, 0, z, 0.13 * scale, 0.2 * scale, "#3a3a34");
  cylinder(x, 0.18 * scale, z, 0.02 * scale, 0.45 * scale, "#3f6b3a");
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leaf = box(
      x + Math.cos(ang) * 0.12 * scale,
      (0.5 + (i % 2) * 0.07) * scale,
      z + Math.sin(ang) * 0.12 * scale,
      0.26 * scale,
      0.03 * scale,
      0.09 * scale,
      "#4a7a45"
    );
    leaf.rotation.y = ang;
    leaf.rotation.z = 0.5;
  }
  groundShadow(x, z, 0.28 * scale, 0.28 * scale);
}

{
  // reception counter just past the mint cubicles: white desk, blue bin,
  // frosted glass wall and a dark wood door leading further in
  box(17, 0.72, halfW - 0.5, 1.3, 0.05, 0.55, "#eef0ea");
  addCollider(17, halfW - 0.5, 1.4, 0.6);
  cylinder(16.4, 0, halfW - 1.1, 0.17, 0.32, "#2f56c4");
  groundShadow(16.4, halfW - 1.1, 0.25, 0.25);
  officeChair(16.7, halfW - 1.5, Math.PI, "#141414");

  const glassWall = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.4),
    new THREE.MeshPhysicalMaterial({ color: "#eef2ef", transparent: true, opacity: 0.4, roughness: 0.25 })
  );
  glassWall.position.set(17.5, 1.3, halfW - 0.06);
  glassWall.rotation.y = Math.PI;
  scene.add(glassWall);
  box(17.5, 2.52, halfW - 0.06, 4.45, 0.06, 0.03, "#2c2c2c");
  box(19.6, 1.05, halfW - 0.06, 2.1, 2.1, 0.06, "#3a2c1c", { map: WOOD_TEX }); // door
  box(19.6, 2.13, halfW - 0.06, 2.1, 0.06, 0.08, "#2c2216");

  // wood-tone desk row with dual monitors, blue chairs and dense plants
  for (let i = 0; i < 3; i++) {
    const x = 20.5 + i * 2.5;
    box(x, 0.36, -halfW + 0.6, 1.5, 0.06, 0.7, "#c9a86a"); // wood desktop
    box(x, 0.17, -halfW + 0.35, 0.36, 0.34, 0.5, "#b6905a"); // drawer pedestal
    box(x, 0.17, -halfW + 0.85, 0.36, 0.34, 0.5, "#b6905a");
    box(x - 0.1, 0.75, -halfW + 0.45, 0.4, 0.05, 0.02, "#2a2a2a");
    box(x - 0.1, 0.9, -halfW + 0.45, 0.4, 0.24, 0.015, "#0d1116", {
      emissive: "#132330",
      emissiveIntensity: 0.35,
    });
    box(x + 0.35, 0.75, -halfW + 0.45, 0.3, 0.04, 0.02, "#2a2a2a");
    box(x + 0.35, 0.87, -halfW + 0.45, 0.3, 0.18, 0.012, "#0d1116", {
      emissive: "#132330",
      emissiveIntensity: 0.3,
    });
    potPlant(x - 0.55, -halfW + 0.9, 0.85);
    if (i === 1) box(x + 0.5, 0.42, -halfW + 0.9, 0.28, 0.03, 0.2, "#e0762f"); // orange folder stack
    officeChair(x, -halfW + 1.4, Math.PI, "#2f4f8f");
    groundShadow(x, -halfW + 0.6, 0.85, 0.45);
    addCollider(x, -halfW + 0.6, 1.6, 0.8);
  }
  potPlant(19.7, -halfW + 0.55, 1.1);

  // frosted glass meeting-room wall with a dark aluminium frame
  const meetingRoom = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.8),
    new THREE.MeshPhysicalMaterial({
      color: "#dbe6e0",
      transparent: true,
      opacity: 0.32,
      roughness: 0.2,
    })
  );
  meetingRoom.position.set(23, 1.3, -halfW + 0.05);
  scene.add(meetingRoom);
  box(23, 2.22, -halfW + 0.05, 6.05, 0.06, 0.03, "#2c2c2c");
  box(23, 0.42, -halfW + 0.05, 6.05, 0.06, 0.03, "#2c2c2c");
  for (const mx of [20.05, 22, 24, 25.95]) {
    box(mx, 1.32, -halfW + 0.05, 0.05, 1.8, 0.03, "#2c2c2c");
  }

  revealable(
    "cubicle-b",
    box(24, 1.6, -halfW + 0.4, 0.02, 0.02, 0.02, "#000000")
  ); // kept tiny/invisible-sized; reserved for a future signage reveal
}

// Zone: office-corridor (26 -> the corner) — copier bay with paper-box
// stacks, two frosted dark-green glass pod rooms, a corkboard, a wall
// clock, and the turn itself: a plant + EXIT sign at the corner opening
// instead of a dead-end door (the route bends here, it doesn't stop here).
{
  // wall clock, octagonal wood frame, near the copier
  cylinder(30.5, 1.85, halfW - 0.03, 0.14, 0.03, "#f4f0e6");
  box(30.5, 1.85, halfW - 0.05, 0.32, 0.32, 0.02, "#a9662e"); // octagon-ish frame, boxed for simplicity
  box(30.5, 1.85, halfW - 0.02, 0.02, 0.1, 0.005, "#222"); // hands, edge-on

  // copier/printer with stacked Double-A paper boxes beside it
  box(32.4, 0.55, halfW - 0.4, 0.55, 1.0, 0.6, "#17181a");
  box(32.4, 1.12, halfW - 0.55, 0.5, 0.16, 0.4, "#0e0e10"); // top scanner lid
  groundShadow(32.4, halfW - 0.4, 0.5, 0.4);
  addCollider(32.4, halfW - 0.4, 0.7, 0.7);
  for (let i = 0; i < 3; i++) {
    box(31.6, 0.14 + i * 0.28, halfW - 0.75, 0.34, 0.26, 0.34, i % 2 ? "#1c5fa8" : "#e9e6de");
  }
  groundShadow(31.6, halfW - 0.75, 0.3, 0.3);

  // two dark green frosted-glass pod rooms (phone-booth style), matching the
  // reference footage's small huddle pods
  for (let i = 0; i < 2; i++) {
    const px = 35 + i * 1.1;
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2.15, 0.9),
      new THREE.MeshPhysicalMaterial({ color: "#1f3a34", transparent: true, opacity: 0.75, roughness: 0.3 })
    );
    pod.position.set(px, 1.08, halfW - 0.5);
    scene.add(pod);
    box(px, 2.17, halfW - 0.5, 1.02, 0.03, 0.92, "#e9e6de"); // top cap
    groundShadow(px, halfW - 0.5, 0.55, 0.5);
    addCollider(px, halfW - 0.5, 1.0, 0.9);
  }

  // corkboard with pinned notices, on the inner wall approaching the corner
  box(37.6, 1.5, -halfW + 0.03, 0.7, 0.5, 0.02, "#c9974f");
  box(37.6, 1.5, -halfW + 0.045, 0.6, 0.4, 0.005, "#d9c79a");
  for (const nx of [-0.15, 0.05, 0.18]) {
    box(37.6 + nx, 1.55, -halfW + 0.05, 0.14, 0.18, 0.003, "#f5f2e8");
  }
  addCollider(37.6, -halfW + 0.03, 0.75, 0.1);

  // the turn: a plant marks the corner, EXIT sign hangs over the opening
  potPlant(CORNER_X - halfW - 0.3, halfW - 0.5, 1.15);
  box(CORNER_X - halfW - 0.1, 2.55, halfW - 0.02, 0.02, 0.2, 0.5, "#123018");
  revealable(
    "exit-door",
    box(CORNER_X - halfW - 0.08, 2.55, halfW - 0.02, 0.015, 0.16, 0.46, "#33ff66", {
      emissive: "#22cc55",
      emissiveIntensity: 1.1,
    })
  );
}

// Zone: building-corridor (segment B) — the hotel-like shared hallway:
// recessed frosted-glass doors in dark frames along the outer wall, a
// continuous LED cove above them, small wall fixtures on the inner wall,
// orange floor tape down the centerline.
{
  const doorX = CORNER_X + halfW - 0.12; // outer wall, recessed doors
  const fixtureX = CORNER_X - halfW + 0.02; // inner wall, opposite the doors
  // continuous cove light where the ceiling meets the door-side wall
  box(CORNER_X + halfW - 0.04, CEILING_HEIGHT - 0.06, 17, 0.05, 0.03, 24, "#fff6d8", {
    emissive: "#ffedb0",
    emissiveIntensity: 1.1,
  });

  for (let i = 0; i < 5; i++) {
    const z = 5 + i * 4.5;
    box(doorX, 1.05, z, 0.06, 2.15, 1.0, "#2c241a"); // frame/reveal
    const glassDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 1.95),
      new THREE.MeshPhysicalMaterial({ color: "#cfcabf", transparent: true, opacity: 0.55, roughness: 0.35 })
    );
    glassDoor.position.set(CORNER_X + halfW - 0.09, 1.05, z);
    glassDoor.rotation.y = Math.PI / 2;
    scene.add(glassDoor);
    box(doorX + 0.02, 2.18, z, 0.1, 0.05, 1.05, "#2c241a"); // header
    groundShadow(CORNER_X + halfW - 0.3, z, 0.25, 0.5);
  }

  // keypad + small signage on the inner wall, wall sconces further along
  box(fixtureX, 1.4, 12, 0.08, 0.14, 0.1, "#e9e6de");
  box(fixtureX + 0.045, 1.4, 12, 0.02, 0.02, 0.02, "#3fae55", {
    emissive: "#3fae55",
    emissiveIntensity: 0.8,
  });
  for (const sz of [8, 20]) {
    box(fixtureX, 0.75, sz, 0.1, 0.18, 0.02, "#fff3d8", {
      emissive: "#ffe6a8",
      emissiveIntensity: 0.5,
    });
  }

  for (let i = 0; i < 4; i++) {
    const z = 7 + i * 5;
    box(CORNER_X, 0.006, z, 0.4, 0.012, 0.4, "#e8942a", {
      emissive: "#c97a1a",
      emissiveIntensity: 0.25,
    }); // orange floor marker
  }

  revealable(
    "building-corridor",
    box(CORNER_X, 2.5, 16, 0.3, 0.3, 0.3, "#ffe8b0", {
      emissive: "#ffcf6b",
      emissiveIntensity: 0.7,
    })
  );
}

// Zone: elevator-lobby (segment B, far end) — four elevator doors + call
// button, laid across the far wall the corridor runs straight into.
{
  const lobbyZ = 35.9; // far wall
  // stone-look surround wall behind the doors
  box(CORNER_X, 1.4, lobbyZ, CORRIDOR_WIDTH - 0.4, 2.8, 0.04, "#ffffff", { map: MARBLE_TEX });
  box(CORNER_X, 0.02, lobbyZ - 0.05, CORRIDOR_WIDTH - 0.4, 0.04, 0.1, "#8f8570"); // steel threshold strip
  groundShadow(CORNER_X, lobbyZ, halfW - 0.2, 0.15);
  const doorMargin = 0.5;
  const doorStep = (CORRIDOR_WIDTH - doorMargin * 2) / 3;
  for (let i = 0; i < 4; i++) {
    const x = CORNER_X - halfW + doorMargin + i * doorStep;
    const frame = box(x, 1.05, lobbyZ - 0.15, 0.65, 2.2, 0.03, "#3a352c");
    const doorPanel = box(x, 1.05, lobbyZ - 0.1, 0.55, 2.1, 0.05, "#ffffff", {
      map: METAL_TEX,
    });
    box(x, 1.05, lobbyZ - 0.14, 0.01, 2.1, 0.01, "#111111"); // center seam between door leaves
    box(x, 2.28, lobbyZ - 0.15, 0.16, 0.03, 0.03, "#c9a227", {
      emissive: "#c9a227",
      emissiveIntensity: 0.4,
    }); // floor-indicator lamp above the door
    doorPanel.userData.elevatorIndex = i;
    elevatorDoors.push(doorPanel);
  }
  // small blue "S insite" QR access sign between the two middle doors
  box(0.05 + CORNER_X, 1.55, lobbyZ - 0.14, 0.22, 0.32, 0.02, "#1c5fa8");
  box(0.05 + CORNER_X, 1.5, lobbyZ - 0.15, 0.16, 0.16, 0.015, "#ffffff");
  const buttonPanel = box(
    CALL_BUTTON.x,
    CALL_BUTTON.y,
    CALL_BUTTON.z,
    0.25,
    0.5,
    0.12,
    "#1a1a1a"
  );
  groundShadow(CALL_BUTTON.x, CALL_BUTTON.z, 0.2, 0.25);
  callButtonMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16),
    new THREE.MeshStandardMaterial({
      color: "#c9a227",
      emissive: "#c9a227",
      emissiveIntensity: 0.3,
    })
  );
  callButtonMesh.rotation.x = Math.PI / 2;
  callButtonMesh.position.set(CALL_BUTTON.x, CALL_BUTTON.y + 0.1, CALL_BUTTON.z - 0.07);
  scene.add(callButtonMesh);

  revealable(
    "elevator-lobby",
    box(CORNER_X, 2.5, lobbyZ - 0.1, 0.4, 0.3, 0.02, "#7fd1ff", {
      emissive: "#4fb8ff",
      emissiveIntensity: 0.6,
    })
  );
}

// (사람 자리표시자 제거됨 — 캡슐+구 조합은 어떤 각도에서도 정밀해 보이지 않아
// 이번 패스에서는 공간 밀도로만 승부한다. 사람은 나중에 별도 방식으로.)

// ---------------------------------------------------------------- controls
const state = {
  yaw: PLAYER_START_YAW,
  pitch: 0,
  keys: Object.create(null),
  locked: false,
  percent: 0,
  visited: new Set(),
  finished: false,
  moveVec: { x: 0, z: 0 }, // touch joystick input, -1..1
  lookDelta: { x: 0, y: 0 }, // touch drag look
};

const PLAYER_RADIUS = 0.35;
const MOVE_SPEED = 3.1;

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

if (!isTouchDevice()) {
  canvas.addEventListener("click", () => {
    if (!state.finished) {
      const req = canvas.requestPointerLock();
      req?.catch?.(() => {}); // some embedded/automated contexts refuse pointer lock
    }
  });
  document.addEventListener("pointerlockchange", () => {
    state.locked = document.pointerLockElement === canvas;
    hud.hint.classList.toggle("dim", state.locked);
  });
  document.addEventListener("mousemove", (e) => {
    if (!state.locked) return;
    state.yaw -= e.movementX * 0.0022;
    state.pitch -= e.movementY * 0.0022;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
  });
  window.addEventListener("keydown", (e) => (state.keys[e.code] = true));
  window.addEventListener("keyup", (e) => (state.keys[e.code] = false));
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyE") tryInteract();
  });
} else {
  setupTouchControls();
}

function setupTouchControls() {
  const stick = document.getElementById("touch-stick");
  const stickBase = document.getElementById("touch-stick-base");
  const lookPad = document.getElementById("touch-look");
  const interactBtn = document.getElementById("touch-interact");
  document.getElementById("touch-controls").classList.remove("hidden");
  interactBtn.classList.remove("hidden");

  let stickId = null;
  let stickOrigin = { x: 0, y: 0 };
  stickBase.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    stickId = t.identifier;
    const rect = stickBase.getBoundingClientRect();
    stickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  window.addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        const dx = t.clientX - stickOrigin.x;
        const dy = t.clientY - stickOrigin.y;
        const max = 40;
        const len = Math.min(max, Math.hypot(dx, dy));
        const ang = Math.atan2(dy, dx);
        const cx = Math.cos(ang) * len;
        const cy = Math.sin(ang) * len;
        stick.style.transform = `translate(${cx}px, ${cy}px)`;
        state.moveVec.x = cx / max;
        state.moveVec.z = cy / max;
      }
    }
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        stickId = null;
        stick.style.transform = "translate(0px, 0px)";
        state.moveVec.x = 0;
        state.moveVec.z = 0;
      }
    }
  });

  let lookId = null;
  let lastLook = { x: 0, y: 0 };
  lookPad.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    lookId = t.identifier;
    lastLook = { x: t.clientX, y: t.clientY };
  });
  window.addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === lookId) {
        const dx = t.clientX - lastLook.x;
        const dy = t.clientY - lastLook.y;
        lastLook = { x: t.clientX, y: t.clientY };
        state.yaw -= dx * 0.004;
        state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - dy * 0.004));
      }
    }
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
  });

  interactBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    tryInteract();
  });
  state.locked = true; // no pointer-lock concept on touch; controls are always "active"
}

// Keeps the player within halfW of the PATH polyline instead of clamping a
// single straight rectangle — this is what lets the corridor actually turn
// a corner instead of running dead straight from desk to elevator.
function closestOnSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax, abz = bz - az;
  const len2 = abx * abx + abz * abz;
  let t = len2 > 0 ? ((px - ax) * abx + (pz - az) * abz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + abx * t, z: az + abz * t };
}
function clampToPath(x, z) {
  let best = null, bestDist = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    const cp = closestOnSegment(x, z, a.x, a.z, b.x, b.z);
    const d = Math.hypot(x - cp.x, z - cp.z);
    if (d < bestDist) {
      bestDist = d;
      best = cp;
    }
  }
  const maxD = halfW - PLAYER_RADIUS;
  if (bestDist > maxD) {
    const dx = x - best.x, dz = z - best.z;
    const scale = maxD / (bestDist || 0.0001);
    x = best.x + dx * scale;
    z = best.z + dz * scale;
  }
  // hard stops at both ends of the route (desk start, elevator back wall)
  x = Math.max(0.4, x);
  z = Math.min(35.6, z);
  return { x, z };
}

function resolveCollisions(x, z) {
  for (const c of colliders) {
    const closestX = Math.max(c.minX, Math.min(x, c.maxX));
    const closestZ = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - closestX;
    const dz = z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < PLAYER_RADIUS * PLAYER_RADIUS) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const push = PLAYER_RADIUS - dist;
      x += (dx / dist) * push;
      z += (dz / dist) * push;
    }
  }
  return { x, z };
}

function tryInteract() {
  if (state.finished) return;
  const dx = camera.position.x - CALL_BUTTON.x;
  const dz = camera.position.z - CALL_BUTTON.z;
  if (Math.hypot(dx, dz) < 1.6) {
    finish();
  }
}

function toast(text) {
  hud.toast.textContent = text;
  hud.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => hud.toast.classList.remove("show"), 2200);
}

function setPercent(p) {
  state.percent = p;
  hud.percent.textContent = `${p}%`;
  hud.bar.style.width = `${p}%`;
}

function checkCheckpoints() {
  const x = camera.position.x;
  const z = camera.position.z;
  for (const cp of CHECKPOINTS) {
    if (state.visited.has(cp.id)) continue;
    if (Math.hypot(x - cp.x, z - cp.z) <= cp.radius) {
      state.visited.add(cp.id);
      setPercent(cp.percent);
      toast(cp.label);
      for (const obj of reveals[cp.id] || []) obj.visible = true;
    }
  }
  const showInteract = Math.hypot(x - CALL_BUTTON.x, camera.position.z - CALL_BUTTON.z) < 1.6 && !state.finished;
  hud.interact.classList.toggle("show", showInteract);
}

function finish() {
  state.finished = true;
  setPercent(CALL_BUTTON.percent);
  hud.interact.classList.remove("show");
  document.exitPointerLock?.();
  for (const door of elevatorDoors) {
    door.userData.opening = true;
  }
  hud.overlayTitle.textContent = ENDING.title;
  hud.overlayCopy.textContent = ENDING.copy;
  hud.overlay.classList.add("show");
}

hud.restart.addEventListener("click", () => window.location.reload());

// -------------------------------------------------------------- animation
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  if (!state.finished) {
    let mx = 0;
    let mz = 0;
    if (state.locked && !isTouchDevice()) {
      if (state.keys.KeyW) mz -= 1;
      if (state.keys.KeyS) mz += 1;
      if (state.keys.KeyA) mx -= 1;
      if (state.keys.KeyD) mx += 1;
    } else if (isTouchDevice()) {
      mx = state.moveVec.x;
      mz = state.moveVec.z;
    }

    const len = Math.hypot(mx, mz);
    if (len > 0.001) {
      mx /= len;
      mz /= len;
      camera.rotation.order = "YXZ";
      camera.rotation.y = state.yaw;
      camera.rotation.x = state.pitch;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();
      let dx = (forward.x * -mz + right.x * mx) * MOVE_SPEED * dt;
      let dz = (forward.z * -mz + right.z * mx) * MOVE_SPEED * dt;
      let nx = camera.position.x + dx;
      let nz = camera.position.z + dz;
      const onPath = clampToPath(nx, nz);
      const resolved = resolveCollisions(onPath.x, onPath.z);
      camera.position.x = resolved.x;
      camera.position.z = resolved.z;
    }

    camera.rotation.order = "YXZ";
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;

    checkCheckpoints();
  }

  for (const door of elevatorDoors) {
    if (door.userData.opening) {
      door.position.y = Math.min(2.2, door.position.y + dt * 1.2);
    }
  }

  renderer.render(scene, camera);
}

animate();

// QA hook only — harmless in production, lets us drive the scene without a
// real pointer-lock gesture (e.g. from an automated browser).
window.__debug = {
  state,
  camera,
  renderer,
  scene,
  teleport(x, z = 0) {
    camera.position.x = x;
    camera.position.z = z;
    checkCheckpoints();
  },
  interact: tryInteract,
  finish,
};

