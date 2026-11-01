// A carved chinrest with real cork seats and external clamps, in instrument-local coordinates.
export function buildChinrest(T,{parent,topY,topShapeY=topY,backY,edgeX=()=>1.178,black,steel}){
 const group=new T.Group();group.name='chinrest';parent.add(group);
 const cx=.94,cz=-.26,rx=.23,rz=.11,rows=20,cols=72;
 let base=-Infinity;
 for(let i=0;i<=rows;i++)for(let j=0;j<cols;j++){
  const r=i/rows,a=j/cols*Math.PI*2,x=cx+rx*r*Math.cos(a),z=cz+rz*r*Math.sin(a);
  base=Math.max(base,topShapeY(x,z)+.005+.012-.018*r*r);
 }
 const underside=(x,z)=>topShapeY(x,z)+.010;
 const positions=[],normals=[],index=[];
 for(let layer=0;layer<2;layer++)for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
  const r=i/rows,a=j/cols*Math.PI*2,x=cx+rx*r*Math.cos(a),z=cz+rz*r*Math.sin(a),rise=layer?.018:.020;
  const y=layer?underside(x,z):underside(x,z)+.028+.018*r*r,h=1e-4,dx=layer?(underside(x+h,z)-underside(x-h,z))/(2*h):(underside(x+h,z)-underside(x-h,z))/(2*h)+.036*(x-cx)/(rx*rx),dz=layer?(underside(x,z+h)-underside(x,z-h))/(2*h):(underside(x,z+h)-underside(x,z-h))/(2*h)+.036*(z-cz)/(rz*rz),n=new T.Vector3(-dx,1,-dz).normalize().multiplyScalar(layer?-1:1);
  positions.push(x,y,z);normals.push(n.x,n.y,n.z);
 }
 const stride=cols+1,N=(rows+1)*stride;
 function tri(a,b,c,up){const A=new T.Vector3().fromArray(positions,a*3),B=new T.Vector3().fromArray(positions,b*3),C=new T.Vector3().fromArray(positions,c*3);if(new T.Vector3().crossVectors(B.sub(A),C.sub(A)).y*up<0)index.push(a,c,b);else index.push(a,b,c);}
 for(let layer=0;layer<2;layer++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const a=layer*N+i*stride+j,b=a+1,c=a+stride,d=c+1;
  if(i)tri(a,c,b,layer?-1:1);tri(b,c,d,layer?-1:1);
 }
 // Dedicated wall vertices keep the ebony edge's normals separate from bowl/cork faces.
 for(let j=0;j<=cols;j++){const a=j/cols*Math.PI*2,n=new T.Vector3(Math.cos(a)/rx,0,Math.sin(a)/rz).normalize();for(const source of[rows*stride+j,N+rows*stride+j]){positions.push(...positions.slice(source*3,source*3+3));normals.push(n.x,0,n.z);}}
 const wallStart=N*2;for(let j=0;j<cols;j++){const a=wallStart+j*2,b=a+2;index.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(index);
 const ebony=new T.MeshPhysicalMaterial({color:0x15110e,roughness:.42,metalness:0,clearcoat:.25,clearcoatRoughness:.35,side:T.DoubleSide});const bowl=new T.Mesh(geo,ebony);bowl.name='carved ebony chinrest bowl';bowl.castShadow=bowl.receiveShadow=true;group.add(bowl);
 const cork=new T.MeshStandardMaterial({color:0x9c7646,roughness:.95,metalness:0});
 for(const [i,z]of[-.20,-.27].entries()){
  const x=1.03,w=.085,d=.040,g=new T.BoxGeometry(w,1,d),p=g.attributes.position;
  for(let k=0;k<p.count;k++){const px=x+p.getX(k),pz=z+p.getZ(k);p.setXYZ(k,px,p.getY(k)>0?underside(px,pz):topY(px,pz),pz);}
  g.computeVertexNormals();const pad=new T.Mesh(g,cork);pad.name='fitted cork chinrest seat '+i;pad.castShadow=pad.receiveShadow=true;group.add(pad);
  // Outside U clamp: upper arm enters the bowl, lower shoe bears on the back.
  const edge=edgeX(z)+.016,footX=Math.min(1.04,edge-.025),shoeTop=backY(footX,z),armY=underside(1.10,z)+.004;
  const lowerY=shoeTop-.012;
  const pts=[[1.10,armY,z],[edge-.008,armY,z],[edge,armY-.008,z],[edge,lowerY+.008,z],[edge-.008,lowerY,z],[footX,lowerY,z]].map(p=>new T.Vector3(...p));
  const clamp=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),50,.0048,10,false),steel);clamp.name='continuous external chinrest clamp '+i;clamp.castShadow=true;group.add(clamp);
  const barrel=new T.Mesh(new T.CylinderGeometry(.012,.012,.085,24),steel);barrel.name='chinrest threaded barrel '+i;barrel.position.set(edge,(armY+shoeTop)/2,z);group.add(barrel);
  for(let k=0;k<6;k++){const collar=new T.Mesh(new T.TorusGeometry(.0122,.001,6,24),steel);collar.rotation.x=Math.PI/2;collar.position.set(edge,barrel.position.y-.030+k*.012,z);collar.name='chinrest adjustment grip '+i+':'+k;group.add(collar);}
  const lowerGeo=new T.BoxGeometry(.06,.012,.04),lp=lowerGeo.attributes.position;
  for(let k=0;k<lp.count;k++){const px=footX+lp.getX(k),pz=z+lp.getZ(k),top=backY(px,pz);lp.setXYZ(k,px,top+(lp.getY(k)>0?0:-.012),pz);}lowerGeo.computeVertexNormals();
  const shoe=new T.Mesh(lowerGeo,cork);shoe.name='fitted lower clamp cork '+i;group.add(shoe);
 }
 group.userData={supports:['fitted cork chinrest seat 0','fitted cork chinrest seat 1'],bowlUnderside:underside,base};
 return group;
}
