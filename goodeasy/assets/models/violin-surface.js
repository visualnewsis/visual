import {woodUV} from './guitar-craft.js?v=20261027-craft5';

/** A simple, closed f opening. Both banks follow the same monotone longitudinal
 * coordinate; unlike crossing Bezier loops, this remains a valid Earcut hole. */
export function violinFOpening(T,side){
 const upper=[],lower=[],samples=128;
 for(let i=0;i<=samples;i++){
  const t=i/samples,x=.18+(t-.5)*.43;
  const center=.195+.025*Math.sin(2*Math.PI*t);
  const eye=.014*Math.exp(-(((t-.08)/.065)**2))+.014*Math.exp(-(((t-.92)/.065)**2));
  const width=(.010+eye)*Math.sqrt(Math.max(0,Math.min(1,t/.025,(1-t)/.025)));
  upper.push(new T.Vector2(x,side*(center+width)));
  lower.push(new T.Vector2(x,side*(center-width)));
 }
 return [...upper,...lower.slice(1,-1).reverse()];
}

/** Closed arched shell with independent skin and cut-wall normals. Keep the
 * original contour first for fitted bridge/post contacts and edge sampling. */
export function violinPlateGeometry(T,outline,holes,outerY,innerY,dome){
 const contour=outline.map(p=>p.clone()),cutouts=holes.map(h=>h.map(p=>p.clone()));
 // ShapeUtils removes duplicated closing endpoints in-place. Build the flattened
 // coordinate array only after it has normalized every loop, so hole offsets agree.
 let triangles=T.ShapeUtils.triangulateShape(contour,cutouts);
 let vertices=[...contour,...cutouts.flat()].map(p=>[p.x,p.y]);
 for(let pass=0;pass<3;pass++){
  const edges=new Map(),next=[];
  const mid=(a,b)=>{const key=a<b?`${a}:${b}`:`${b}:${a}`;if(edges.has(key))return edges.get(key);const p=vertices[a],q=vertices[b],i=vertices.length;vertices.push([(p[0]+q[0])/2,(p[1]+q[1])/2]);edges.set(key,i);return i;};
  for(const [a,b,c]of triangles){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}triangles=next;
 }
 // Canonical upward winding, including hole boundary edges.
 triangles=triangles.map(([a,b,c])=>{const A=vertices[a],B=vertices[b],C=vertices[c];return (B[1]-A[1])*(C[0]-A[0])-(B[0]-A[0])*(C[1]-A[1])<0?[a,c,b]:[a,b,c];});
 const positions=[],normals=[],indices=[],N=vertices.length,sign=Math.sign(outerY-innerY),h=1e-5;
 // Evaluate the immutable arch and its derivative once per shared XZ vertex.
 // Both skins and the cut-wall copies reuse exactly the same sampled values.
 const samples=vertices.map(([x,z])=>{
  const height=dome(x,z),dx=(dome(x+h,z)-dome(x-h,z))/(2*h),dz=(dome(x,z+h)-dome(x,z-h))/(2*h),length=Math.hypot(dx,1,dz);
  return {height,nx:-dx/length,ny:1/length,nz:-dz/length};
 });
 for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++){
  const [x,z]=vertices[i],sample=samples[i],s=sign*(layer?-1:1);
  positions.push(x,(layer?innerY:outerY)+sample.height,z);
  normals.push(sample.nx*s,sample.ny*s,sample.nz*s);
 }
 for(const [a,b,c]of triangles)sign>0?indices.push(a,b,c):indices.push(a,c,b);
 for(const [a,b,c]of triangles)sign>0?indices.push(N+a,N+c,N+b):indices.push(N+a,N+b,N+c);
 const boundary=new Map();
 for(const tri of triangles)for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`,edge=boundary.get(key);if(edge)edge.count++;else boundary.set(key,{a,b,count:1});}
 for(const {a,b,count}of boundary.values())if(count===1){
  const A=vertices[a],B=vertices[b],dx=B[0]-A[0],dz=B[1]-A[1],len=Math.hypot(dx,dz),base=positions.length/3;
  for(const [index,y]of [[a,outerY],[b,outerY],[a,innerY],[b,innerY]]){const p=vertices[index];positions.push(p[0],y+samples[index].height,p[1]);normals.push(-dz/len,0,dx/len);}
  sign>0?indices.push(base,base+2,base+1,base+1,base+2,base+3):indices.push(base,base+1,base+2,base+1,base+3,base+2);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);woodUV(geometry);
 // Three draw calls only: varnished outside, unvarnished cavity, cut wood walls.
 const skinIndices=triangles.length*3;geometry.addGroup(0,skinIndices,0);geometry.addGroup(skinIndices,skinIndices,1);geometry.addGroup(skinIndices*2,indices.length-skinIndices*2,2);
 geometry.userData.skinVertexCount=N;geometry.userData.skinTriangleCount=triangles.length;
 return geometry;
}
