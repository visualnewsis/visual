// GOODEASY local fixes. Pure Three.js, static geometry/material only. NOT executed or rendered by reviewer.
// Each block replaces one named function or a few named lines; nothing else changes.
 
// ============================================================================
// 1) violin.js — replace fingerboardGeometry(T)
// Current version is inside-out in local space (signed volume -0.00703, top normal y < 0)
// and computeVertexNormals() smears top/side/bottom normals over shared vertices.
// This version: separate vertices per surface, outward winding enforced per triangle,
// analytic normals. Do NOT call computeVertexNormals() on it.
// Uses violin.js scope: boardWidth, violinBoardY, woodUV.
// ============================================================================
function fingerboardGeometry(T) {
  const rows = 32, cols = 16, X0 = -1.59, LEN = 1.055;
  const bottomY = x => .196 + (x - X0) / LEN * .021;
  const dBottom = .021 / LEN, dTop = .021 / LEN, dWidth = .105 / LEN; // board lies inside boardWidth clamp
  const pos = [], nor = [], idx = [];
  const norm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  const v = (x, y, z, n) => { pos.push(x, y, z); nor.push(n[0], n[1], n[2]); return pos.length / 3 - 1; };
  const tri = (a, b, c, n) => {
    const P = k => [pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]], A = P(a), B = P(b), C = P(c);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) ? idx.push(a, c, b) : idx.push(a, b, c);
  };
  const quad = (a, b, c, d, n) => { tri(a, b, c, n); tri(a, c, d, n); };
  const xAt = i => X0 + i / rows * LEN;
  const zAt = (x, j) => (j / cols - .5) * boardWidth(x);
  const topN = (x, z) => norm(-dTop, 1, .08 * z / (.218 * .218)); // y = violinBoardY(x,z)
 
  // Top (fretless playing surface) and bottom (glue face) grids.
  const grid = (yOf, nOf, ref) => {
    const id = [];
    for (let i = 0; i <= rows; i++) { const x = xAt(i); id.push([]); for (let j = 0; j <= cols; j++) { const z = zAt(x, j); id[i].push(v(x, yOf(x, z), z, nOf(x, z))); } }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) quad(id[i][j], id[i + 1][j], id[i + 1][j + 1], id[i][j + 1], ref);
  };
  grid(violinBoardY, topN, [0, 1, 0]);
  grid(x => bottomY(x), () => norm(dBottom, -1, 0), [0, -1, 0]);
 
  // Long sides (+z / -z), tapered: outward normal (-w'/2, 0, +-1).
  for (const s of [-1, 1]) {
    const n = norm(-dWidth / 2, 0, s), col = [];
    for (let i = 0; i <= rows; i++) { const x = xAt(i), z = s * boardWidth(x) / 2; col.push([v(x, violinBoardY(x, z), z, n), v(x, bottomY(x), z, n)]); }
    for (let i = 0; i < rows; i++) quad(col[i][0], col[i + 1][0], col[i + 1][1], col[i][1], n);
  }
  // Nut end (-x) and body end (+x).
  for (const [i, n] of [[0, [-1, 0, 0]], [rows, [1, 0, 0]]]) {
    const x = xAt(i), row = [];
    for (let j = 0; j <= cols; j++) { const z = zAt(x, j); row.push([v(x, violinBoardY(x, z), z, n), v(x, bottomY(x), z, n)]); }
    for (let j = 0; j < cols; j++) quad(row[j][0], row[j + 1][0], row[j + 1][1], row[j][1], n);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setIndex(idx); woodUV(g);
  g.userData.normalsAreAuthored = true;
  return g;
}
 
// ============================================================================
// 2) violin.js buildViolin — replace the two rib lines (inner=..., ribs=...)
// Current ribs use the SAME contour as the plates and span y .106..-.105:
// rib outer wall is coplanar with the top plate's cut edge wall over y .092..106
// (z-fighting all round the body), and the rib top lip at .106 is within ~.0004
// of the top skin near the edge. Plates now overhang; rib lips sit buried inside
// plate thickness (top skin .092..106, back -.121..-.105 at the edge).
// ============================================================================
/*
 const RIB_OVERHANG=.012, RIB_THICKNESS=.008;
 const ribOuter=violinInnerOutline(THREE,contour,RIB_OVERHANG);
 const inner=violinInnerOutline(THREE,ribOuter,RIB_THICKNESS);
 const ribs=buildViolinRibs(THREE,ribOuter,inner,.099,-.113,dark,parts.body,'connected hollow violin ribs');
*/
// Hand check: inner rib loop is ~.020 inside the edge; dome there <= ~.0055,
// so top inner skin <= .0975 < .099 < .106 and back -.121-.7d < -.113 < -.105-.7d.
 
// ============================================================================
// 3) coffee-detail.js — replace createCoffeeSurfaceMaterial()
// Current shader mixes 52% toward foamMean vec3(.48,.265,.112) (linear) ~= sRGB #B88D5E,
// a light caramel over the whole disc: reads as pale liquid. This keeps one continuous
// opaque disc: dark espresso body, crema only as rim band + sparse patches from the
// existing crema texture's luminance. Colours authored in sRGB via T.Color.
// Assumes texture offset 0, center (0,0), rotation 0 (vMapUv / repeat == disc uv).
// ============================================================================
function createCoffeeSurfaceMaterial() {
  const REPEAT = 2.3;
  const mask = coffeeMaterialTexture('crema').clone(); mask.repeat.set(REPEAT, REPEAT); mask.needsUpdate = true;
  const material = new T.MeshPhysicalMaterial({ color: 0xffffff, map: mask, roughness: .2, metalness: 0, clearcoat: .55, clearcoatRoughness: .12, side: T.DoubleSide });
  const uniforms = {
    uLiquid: { value: new T.Color(0x1f0e07) },     // espresso body
    uCrema: { value: new T.Color(0x9a6232) },      // light crema
    uCremaDeep: { value: new T.Color(0x5e3317) },  // tiger-flecked crema
    uRepeat: { value: REPEAT },
    uCoverage: { value: .45 }                      // 0 = rim only, 1 = most of surface
  };
  material.userData.cremaUniforms = uniforms;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uLiquid, uCrema, uCremaDeep; uniform float uRepeat, uCoverage;
float cremaMask = 0.0;`)
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 cremaTexel = texture2D(map, vMapUv);
  float cremaLum = dot(cremaTexel.rgb, vec3(.2126, .7152, .0722));
  float rr = length(vMapUv / uRepeat - .5) * 2.0;           // 0 centre .. 1 rim
  float rim = smoothstep(.72, .96, rr);
  float patchy = smoothstep(.62 - uCoverage * .4, .80 - uCoverage * .4, cremaLum) * smoothstep(1.0, .35, rr);
  cremaMask = clamp(max(rim * .9, patchy * .75), 0.0, 1.0);
  vec3 cremaCol = mix(uCremaDeep, uCrema, smoothstep(.3, .8, cremaLum));
  diffuseColor.rgb = mix(uLiquid, cremaCol, cremaMask);
#endif`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(.16, .55, cremaMask);`);
  };
  material.customProgramCacheKey = () => 'espresso-opaque-liquid-partial-crema-v1';
  material.name = 'opaque espresso with partial crema';
  return material;
}
 
// ============================================================================
// 4) gramophone-model.js — soundbox orientation for a LATERAL-cut disc
// Arm-to-radius angle at the stylus is 75..101 deg (arm ~ groove tangent). Lateral groove
// modulation is therefore along arm-local Z. Current diaphragm normal and lever stylus
// swing are along arm-local X (tangential). Rotate the soundbox -90 deg about Y and move it
// so the stylus tip stays exactly at hinge-local (.24, -.21, 0).
// ============================================================================
/*
 // after: const soundbox=new T.Group(); ... hinge.add(soundbox);
 const SOUNDBOX_POS=new T.Vector3(.24,.105,-.085);
 soundbox.rotation.y=-Math.PI/2; soundbox.position.copy(SOUNDBOX_POS);
 // in update(): replace  soundbox.position.set(.155,.105,0);  with
 soundbox.position.copy(SOUNDBOX_POS);
*/
// Check: R_y(-pi/2)(x,y,z) = (-z, y, x); stylus local (.085,-.315,0) -> (0,-.315,.085);
// SOUNDBOX_POS + that = (.24,-.21,0) = old (.155+.085, .105-.315, 0). needlePoint() unchanged.
// Gooseneck end (.155,.105,0) r=.065 still reaches the rim (z -.126..-.044). Lever.rotation.z
// now swings the stylus across the groove (arm-local Z).
 