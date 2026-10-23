// Mesh construction helpers for instrument surfaces. Local coordinates X longitudinal, Y normal, Z transverse.
export function smoothOutline(THREE, controls, samples=360) {
  const curve=new THREE.CatmullRomCurve3(controls.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal',.35);
  return Array.from({length:samples},(_,i)=>{const p=curve.getPoint(i/samples);return new THREE.Vector2(p.x,p.z)});
}
export function shapeFromPoints(THREE,points){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p.x,p.y):s.moveTo(p.x,p.y));s.closePath();return s}
export function insetOutline(THREE,points,thickness=.028){
  // Radial inset about each point's local polygon centroid. Not a mathematically constant offset.
  const cx=points.reduce((a,p)=>a+p.x,0)/points.length,cz=points.reduce((a,p)=>a+p.y,0)/points.length;
  return points.map(p=>{const dx=p.x-cx,dz=p.y-cz,l=Math.hypot(dx,dz)||1;return new THREE.Vector2(p.x-thickness*dx/l,p.y-thickness*dz/l)});
}
export function hollowRibs(THREE,outer,inner,yTop,yBottom,material,parent,name='hollow ribs'){
  const n=outer.length,verts=[],idx=[];
  for(let i=0;i<n;i++){const a=outer[i],b=inner[i];verts.push(a.x,yTop,a.y,a.x,yBottom,a.y,b.x,yTop,b.y,b.x,yBottom,b.y)}
  const add=(a,b,c)=>{const ax=verts[3*a],ay=verts[3*a+1],az=verts[3*a+2],bx=verts[3*b],by=verts[3*b+1],bz=verts[3*b+2],cx=verts[3*c],cy=verts[3*c+1],cz=verts[3*c+2];const nx=(by-ay)*(cz-az)-(bz-az)*(cy-ay),ny=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);idx.push(a,b,c)};
  for(let i=0;i<n;i++){const j=(i+1)%n,a=4*i,b=4*j;
    add(a,a+1,b);add(b,a+1,b+1); // outer wall
    add(a+2,b+2,a+3);add(b+2,b+3,a+3); // inner wall
    add(a,b,a+2);add(b,b+2,a+2); // upper lip
    add(a+1,a+3,b+1);add(b+1,a+3,b+3); // lower lip
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();
  const o=new THREE.Mesh(geo,material);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function distanceToEdges(x,z,polygon){let d=Infinity;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],vx=b.x-a.x,vz=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.y)*vz)/(vx*vx+vz*vz||1)));d=Math.min(d,Math.hypot(x-(a.x+t*vx),z-(a.y+t*vz)))}return d}
export function archedPlate(THREE,outline,yEdge,archHeight,material,parent,name='arched plate',maxEdge=.055,holes=[]){
  // Earcut triangulation of the exact smooth outline, followed by uniform 1-to-4 subdivision.
  // No cell-centroid inclusion clipping: every boundary vertex belongs to the outline.
  const contour=outline.map(p=>p.clone());const faces=THREE.ShapeUtils.triangulateShape(contour,holes);
  const verts=[...contour,...holes.flat()].map(p=>[p.x,p.y]);let tris=faces.map(f=>f.slice());
  // Three conforming 1-to-4 subdivision passes. Uniform refinement avoids T-junction cracks.
  for(let pass=0;pass<3;pass++){
    const edges=new Map(),next=[];
    function mid(a,b){const k=a<b?`${a}:${b}`:`${b}:${a}`;if(edges.has(k))return edges.get(k);const p=verts[a],q=verts[b],id=verts.length;verts.push([(p[0]+q[0])/2,(p[1]+q[1])/2]);edges.set(k,id);return id}
    for(const [a,b,c] of tris){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca])}tris=next;
  }
  const positions=[];for(const [x,z] of verts){const edgeDist=distanceToEdges(x,z,outline);const fade=1-Math.exp(-Math.pow(edgeDist/.19,1.45));const longitudinal=Math.max(.15,1-.20*Math.pow((x-.17)/1.1,2));positions.push(x,yEdge+archHeight*fade*longitudinal,z)}
  const indices=[];for(const tri of tris){let [a,b,c]=tri;const ax=positions[a*3],az=positions[a*3+2],bx=positions[b*3],bz=positions[b*3+2],cx=positions[c*3],cz=positions[c*3+2];const normalY=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);if(normalY<0)[b,c]=[c,b];indices.push(a,b,c)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.setAttribute('uv',new THREE.Float32BufferAttribute(verts.flatMap(([x,z])=>[(x+.79)/1.97,(z+.48)/.96]),2));geo.computeVertexNormals();const o=new THREE.Mesh(geo,material);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
export function violinTopY(outline,x,z){
 const edgeDist=distanceToEdges(x,z,outline);const fade=1-Math.exp(-Math.pow(edgeDist/.19,1.45));
 return .106+.032*fade*Math.max(.15,1-.20*Math.pow((x-.17)/1.1,2));
}
