// A carved chinrest with real cork seats and external clamps, in instrument-local coordinates.
export function buildChinrest(T,{parent,topY,topShapeY=topY,backY,black,steel}){
 const group=new T.Group();group.name='chinrest';parent.add(group);
 const cx=.94,cz=-.23,rx=.23,rz=.14,rows=20,cols=72;
 let base=-Infinity;
 for(let i=0;i<=rows;i++)for(let j=0;j<cols;j++){
  const r=i/rows,a=j/cols*Math.PI*2,x=cx+rx*r*Math.cos(a),z=cz+rz*r*Math.sin(a);
  base=Math.max(base,topShapeY(x,z)+.005+.012-.018*r*r);
 }
 const underside=(x,z)=>base-.012+.018*(((x-cx)/rx)**2+((z-cz)/rz)**2);
 const positions=[],normals=[],index=[];
 for(let layer=0;layer<2;layer++)for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
  const r=i/rows,a=j/cols*Math.PI*2,x=cx+rx*r*Math.cos(a),z=cz+rz*r*Math.sin(a),rise=layer?.018:.020;
  const y=base+(layer?-.012:.016)+rise*r*r,n=new T.Vector3(-2*rise*(x-cx)/(rx*rx),1,-2*rise*(z-cz)/(rz*rz)).normalize().multiplyScalar(layer?-1:1);
  positions.push(x,y,z);normals.push(n.x,n.y,n.z);
 }
 const stride=cols+1,N=(rows+1)*stride;
 function tri(a,b,c,up){const A=new T.Vector3().fromArray(positions,a*3),B=new T.Vector3().fromArray(positions,b*3),C=new T.Vector3().fromArray(positions,c*3);if(new T.Vector3().crossVectors(B.sub(A),C.sub(A)).y*up<0)index.push(a,c,b);else index.push(a,b,c);}
 for(let layer=0;layer<2;layer++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const a=layer*N+i*stride+j,b=a+1,c=a+stride,d=c+1;
  if(i)tri(a,c,b,layer?-1:1);tri(b,c,d,layer?-1:1);
 }
 for(let j=0;j<cols;j++){const a=rows*stride+j,b=a+1;index.push(a,b,N+a,b,N+b,N+a);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(index);
 const bowl=new T.Mesh(geo,black);bowl.name='carved ebony chinrest bowl';bowl.castShadow=bowl.receiveShadow=true;group.add(bowl);
 const cork=new T.MeshStandardMaterial({color:0x9c7646,roughness:.95,metalness:0});
 for(const [i,z]of[-.16,-.27].entries()){
  const x=1.04,w=.100,d=.055,g=new T.BoxGeometry(w,1,d),p=g.attributes.position;
  for(let k=0;k<p.count;k++){const px=x+p.getX(k),pz=z+p.getZ(k);p.setXYZ(k,px,p.getY(k)>0?underside(px,pz):topY(px,pz),pz);}
  g.computeVertexNormals();const pad=new T.Mesh(g,cork);pad.name='fitted cork chinrest seat '+i;pad.castShadow=pad.receiveShadow=true;group.add(pad);
  // Outside U clamp: upper arm enters the bowl, lower shoe bears on the back.
  const edge=1.205,footX=1.08,shoeTop=backY(footX,z),armY=underside(1.10,z)+.004;
  const pts=[[1.10,armY,z],[edge-.015,armY-.007,z],[edge,armY-.025,z],[edge,-.13,z],[edge-.025,shoeTop-.012,z],[footX,shoeTop-.012,z]].map(p=>new T.Vector3(...p));
  const clamp=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),50,.0065,10,false),steel);clamp.name='continuous external chinrest clamp '+i;clamp.castShadow=true;group.add(clamp);
  const lowerGeo=new T.BoxGeometry(.06,.012,.04),lp=lowerGeo.attributes.position;
  for(let k=0;k<lp.count;k++){const px=footX+lp.getX(k),pz=z+lp.getZ(k),top=backY(px,pz);lp.setXYZ(k,px,top+(lp.getY(k)>0?0:-.012),pz);}lowerGeo.computeVertexNormals();
  const shoe=new T.Mesh(lowerGeo,cork);shoe.name='fitted lower clamp cork '+i;group.add(shoe);
 }
 group.userData={supports:['fitted cork chinrest seat 0','fitted cork chinrest seat 1'],bowlUnderside:underside,base};
 return group;
}
