// Guitar-only surfaces. No shared material is mutated.
const maps=new Map();
export function guitarWood(T,kind){
 if(!maps.has(kind)){
  const colors={spruce:[180,122,62],rosewood:[57,27,18],mahogany:[94,43,25],ebony:[31,22,17],brace:[169,132,84]},base=colors[kind],W=512,H=512,data=new Uint8Array(W*H*4);
  let seed=kind.length*781+31;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  let age=0,period=3+random()*8;const lines=Array.from({length:H},()=>{if(++age>period){age=0;period=3+random()*8;}return -Math.exp(-age*age/.65)*.65+(random()-.5)*.20;});
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=(y+Math.sin(x*.009)*1.2+Math.sin(x*.027+y*.01)*.4+H)%H,k=Math.floor(v),g=lines[k]*(kind==='spruce'?7:10),p=(random()-.5)*3,streak=Math.sin(y*.061+x*.001)*.7;const i=(y*W+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,base[c]+g*(c===0?1:c===1?.8:.6)+p+streak));data[i+3]=255;}
  const map=new T.DataTexture(data,W,H,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=8;map.needsUpdate=true;maps.set(kind,map);
 }
 return new T.MeshPhysicalMaterial({color:0xffffff,map:maps.get(kind),bumpMap:maps.get(kind),bumpScale:kind==='spruce'?.00045:.0007,roughness:kind==='brace'?.78:kind==='ebony'?.52:.38,clearcoat:kind==='brace'?0:.32,clearcoatRoughness:.32,side:T.DoubleSide});
}
export function woodUV(geometry,axis='x'){
 const p=geometry.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(axis==='z'?(p.getZ(i)+.9)/1.8:(p.getX(i)+3.1)/4.5,axis==='z'?(p.getX(i)+1)/2.5:(p.getZ(i)+.9)/1.8);geometry.setAttribute('uv',new p.constructor(new Float32Array(uv),2));
}
export function edgeDistance(x,z,points){let d=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.y)*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-a.x-t*dx,z-a.y-t*dz));}return d;}
export function plateGeometry(T,outline,holes,outerY,innerY,dome){
 const contour=outline.map(p=>p.clone()),cutouts=holes.map(h=>h.map(p=>p.clone()));let vertices=[...contour,...cutouts.flat()].map(p=>[p.x,p.y]),triangles=T.ShapeUtils.triangulateShape(contour,cutouts);
 for(let pass=0;pass<2;pass++){const edges=new Map(),next=[];const mid=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(edges.has(key))return edges.get(key);const p=vertices[a],q=vertices[b],i=vertices.length;vertices.push([(p[0]+q[0])/2,(p[1]+q[1])/2]);edges.set(key,i);return i;};for(const [a,b,c]of triangles){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}triangles=next;}
 const positions=[],indices=[],N=vertices.length;for(const y of [outerY,innerY])for(const [x,z]of vertices)positions.push(x,y+dome(x,z),z);
 for(let [a,b,c]of triangles){const A=vertices[a],B=vertices[b],C=vertices[c];if((B[1]-A[1])*(C[0]-A[0])-(B[0]-A[0])*(C[1]-A[1])<0)[b,c]=[c,b];if(outerY>innerY)indices.push(a,b,c,N+a,N+c,N+b);else indices.push(a,c,b,N+a,N+b,N+c);}
 const boundary=new Map();for(const tri of triangles)for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3],key=a<b?a+':'+b:b+':'+a,item=boundary.get(key);if(item)item.count++;else boundary.set(key,{a,b,count:1});}for(const {a,b,count}of boundary.values())if(count===1){if(outerY>innerY)indices.push(a,b,N+a,b,N+b,N+a);else indices.push(a,N+a,b,b,N+a,N+b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);woodUV(g);g.computeVertexNormals();return g;
}
export function neckGeometry(T,from,to,widthAt,top,depthAt){
 const positions=[],uv=[],indices=[],rows=36,sides=24,stride=sides+1;
 for(let i=0;i<=rows;i++){const t=i/rows,x=from+(to-from)*t,w=widthAt(x)/2,d=depthAt(t);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI;positions.push(x,top-d*Math.sin(a),w*Math.cos(a));uv.push(t,j/sides);}}
 for(let i=0;i<rows;i++)for(let j=0;j<=sides;j++){const a=i*stride+j,b=i*stride+(j+1)%stride,c=a+stride,d=b+stride;indices.push(a,c,b,b,c,d);}
 for(const row of [0,rows]){const base=row*stride;for(let j=1;j<sides;j++)row?indices.push(base,base+j,base+j+1):indices.push(base,base+j+1,base+j);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
