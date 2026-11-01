// Violin-only hollow ribs: straight vertical walls between yBottom and yTop, plus top/bottom lips.
// outer / inner: closed loops of T.Vector2 where v.x -> world X and v.y -> world Z.
// - Outer wall normals: horizontal, away from the body.
// - Inner wall normals: horizontal, into the cavity.
// - Lips: independent vertices with vertical normals (+Y top, -Y bottom). No sharing with walls.
// - Sharp outline corners (e.g. C-bout corners) split into two vertices; smooth runs are averaged.
// - The loop seam reuses the same averaged normal at both ends; only u differs (0 vs perimeter).
// - UV: walls u = cumulative perimeter length, v = height (world units); lips u,v = X,Z.
// Never call computeVertexNormals() on the result: it would re-average walls and lips together.
// Render and collision with plates/blocks are NOT verified.
export function buildViolinRibs(T, outer, inner, yTop, yBottom, material, parent, name = 'connected hollow violin ribs') {
  const EPS2 = 1e-12;
  const CORNER_COS = Math.cos(35 * Math.PI / 180); // turn > 35 deg => hard corner

  if (yTop < yBottom) [yTop, yBottom] = [yBottom, yTop];
  const H = yTop - yBottom;
  if (!(H > 0)) throw new Error(`${name}: rib height must be > 0`);

  // Clean copies only; caller arrays are never mutated.
  const prep = (loop, label) => {
    const clean = [];
    for (const p of loop) {
      const q = new T.Vector2(p.x, p.y);
      if (!clean.length || clean[clean.length - 1].distanceToSquared(q) > EPS2) clean.push(q);
    }
    while (clean.length > 2 && clean[0].distanceToSquared(clean[clean.length - 1]) <= EPS2) clean.pop();
    if (clean.length < 3) throw new Error(`${name}: ${label} loop needs at least 3 distinct points`);
    if (T.ShapeUtils.isClockWise(clean)) clean.reverse(); // normalise both loops to CCW (area > 0)
    return clean;
  };
  const O = prep(outer, 'outer');
  const I = prep(inner, 'inner');

  const inside = (p, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  const innerOutside = I.filter(p => !inside(p, O)).length;
  if (innerOutside) console.warn(`${name}: ${innerOutside} inner points lie outside the outer loop`);

  const positions = [], normals = [], uvs = [], indices = [];
  const addV = (x, y, z, nx, ny, nz, u, v) => {
    positions.push(x, y, z); normals.push(nx, ny, nz); uvs.push(u, v);
    return positions.length / 3 - 1;
  };
  // Winding is enforced per triangle against the intended face normal,
  // so it does not depend on handedness of the X/Z mapping.
  const tri = (a, b, c, n) => {
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const ux = positions[b * 3] - ax, uy = positions[b * 3 + 1] - ay, uz = positions[b * 3 + 2] - az;
    const vx = positions[c * 3] - ax, vy = positions[c * 3 + 1] - ay, vz = positions[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) indices.push(a, c, b); else indices.push(a, b, c);
  };

  let cornerSplits = 0;
  // sign +1: normal away from the loop interior (outer wall). sign -1: toward it (inner wall, cavity side).
  function wall(loop, sign) {
    const n = loop.length, edgeN = [], edgeLen = [];
    for (let i = 0; i < n; i++) {
      const a = loop[i], b = loop[(i + 1) % n], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
      edgeLen.push(l);
      edgeN.push(new T.Vector2(dy / l * sign, -dx / l * sign)); // CCW loop: (dy,-dx) is outward
    }
    const cols = [];
    let u = 0;
    for (let k = 0; k <= n; k++) {
      const i = k % n, p = loop[i], nIn = edgeN[(i - 1 + n) % n], nOut = edgeN[i];
      const make = nv => [addV(p.x, yBottom, p.y, nv.x, 0, nv.y, u, 0), addV(p.x, yTop, p.y, nv.x, 0, nv.y, u, H)];
      if (nIn.dot(nOut) >= CORNER_COS) {
        const col = make(nIn.clone().add(nOut).normalize()); // same normal at k=0 and k=n (seam)
        cols.push({ left: col, right: col });
      } else {
        if (k < n) cornerSplits++;
        cols.push({ left: k > 0 ? make(nIn) : null, right: k < n ? make(nOut) : null });
      }
      if (k < n) u += edgeLen[i];
    }
    for (let k = 0; k < n; k++) {
      const a = cols[k].right, b = cols[k + 1].left, f = [edgeN[k].x, 0, edgeN[k].y];
      tri(a[0], b[0], b[1], f);
      tri(a[0], b[1], a[1], f);
    }
    return u;
  }
  const outerLength = wall(O, +1);
  const innerLength = wall(I, -1);

  // Lips: annulus between loops. Vertex list is built from the same arrays Earcut indexes.
  const oc = O.map(p => p.clone()), ic = I.map(p => p.clone());
  const faces = T.ShapeUtils.triangulateShape(oc, [ic]);
  const flat = [...oc, ...ic];
  for (const [y, ny] of [[yTop, 1], [yBottom, -1]]) {
    const base = positions.length / 3;
    for (const p of flat) addV(p.x, y, p.y, 0, ny, 0, p.x, p.y);
    for (const [a, b, c] of faces) tri(base + a, base + b, base + c, [0, ny, 0]);
  }

  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.violinRibs = {
    yTop, yBottom, height: H, outerLength, innerLength, cornerSplits,
    innerPointsOutsideOuter: innerOutside, lipTriangles: faces.length,
    normalsAreAuthored: true // do not computeVertexNormals()
  };
  if (parent) parent.add(mesh);
  return mesh;
}

// Inward offset follows the local boundary normal rather than a centroid ray.
// A centroid-ray inset can cross a concave C-bout and reverse the rim triangles.
export function violinInnerOutline(T,outer,thickness=.008){
 const sign=T.ShapeUtils.area(outer)>0?1:-1,n=outer.length;
 const inside=p=>{let hit=false;for(let i=0,j=n-1;i<n;j=i++){const a=outer[i],b=outer[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
 return outer.map((p,i)=>{const a=outer[(i+n-1)%n],b=outer[(i+1)%n],e0=p.clone().sub(a).normalize(),e1=b.clone().sub(p).normalize(),N0=new T.Vector2(-e0.y,e0.x).multiplyScalar(sign),N1=new T.Vector2(-e1.y,e1.x).multiplyScalar(sign),bis=N0.clone().add(N1).normalize(),distance=Math.min(thickness*2,thickness/Math.max(.5,bis.dot(N1)));let q;
  for(let step=1;step>.001;step*=.75){q=p.clone().addScaledVector(bis,distance*step);if(inside(q))return q;}
  throw Error('Violin inward rib offset is not inside its outer contour');
 });
}
