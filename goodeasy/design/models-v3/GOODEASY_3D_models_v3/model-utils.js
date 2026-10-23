// GOODEASY procedural geometry helpers. Units are visualization units, not millimetres.
export function mat(THREE, given, fallback, roughness=.65, metalness=0) {
  return given || new THREE.MeshStandardMaterial({color:fallback,roughness,metalness,side:THREE.DoubleSide});
}
export function mesh(THREE, geometry, material, name, parent) {
  const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent?.add(m);return m;
}
export function curveTube(THREE, points, radius, material, name, parent, tubular=80, radial=9) {
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(THREE,new THREE.TubeGeometry(c,tubular,radius,radial,false),material,name,parent);
}
export function cylinderBetween(THREE,a,b,r,material,name,parent,radial=12) {
  const v0=new THREE.Vector3(...a),v1=new THREE.Vector3(...b),d=v1.clone().sub(v0);
  const o=mesh(THREE,new THREE.CylinderGeometry(r,r,d.length(),radial),material,name,parent);
  o.position.copy(v0).add(v1).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;
}
export function ellipsoid(THREE, center, scale, material,name,parent,seg=32) {
  const o=mesh(THREE,new THREE.SphereGeometry(1,seg,Math.floor(seg*.7)),material,name,parent);
  o.position.set(...center);o.scale.set(...scale);return o;
}
export function outlineShape(THREE, outline, holes=[]) {
  const s=new THREE.Shape();outline.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();
  for(const hole of holes){const h=new THREE.Path();h.absellipse(hole[0],hole[1],hole[2],hole[3],0,Math.PI*2,true);s.holes.push(h)}
  return s;
}
// Shape XY is remapped into model XZ; extrude depth is along +Y (top normal).
export function horizontalExtrude(THREE, shape, depth, bevel, material,name,parent,steps=1) {
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps,curveSegments:64,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.75,bevelSegments:4});
  g.rotateX(Math.PI/2); // source y => +z; source extrusion +z => -y
  const o=mesh(THREE,g,material,name,parent);return o;
}
export function ellipseRing(THREE,cx,cy,rx,ry,thickness,material,name,parent) {
  const s=new THREE.Shape();s.absellipse(cx,cy,rx,ry,0,Math.PI*2,false);
  const h=new THREE.Path();h.absellipse(cx,cy,rx-thickness,ry-thickness,0,Math.PI*2,true);s.holes.push(h);
  return horizontalExtrude(THREE,s,.008,.002,material,name,parent);
}
export function addWoodGrain(THREE, color='#98603b',lines=170){
  if(typeof document==='undefined')return new THREE.MeshStandardMaterial({color,roughness:.65,side:THREE.DoubleSide});
  const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
  let seed=417;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<lines;i++){
    const x=rand()*512;ctx.strokeStyle=`rgba(${rand()>.5?'36,19,11':'247,203,150'},${.025+rand()*.13})`;
    ctx.lineWidth=.25+rand()*1.8;ctx.beginPath();ctx.moveTo(x,0);
    ctx.bezierCurveTo(x+(rand()-.5)*17,150,x+(rand()-.5)*20,340,x+(rand()-.5)*15,512);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  return new THREE.MeshStandardMaterial({map:tex,color:'#ffffff',roughness:.64,side:THREE.DoubleSide});
}
export function assemblyGroup(THREE,name,parent){const g=new THREE.Group();g.name=name;parent.add(g);return g}
export function orientedBox(THREE, size, pos, material,name,parent,bevel=.018){
  const s=new THREE.Shape();const [x,z]=[size[0]/2,size[2]/2],r=Math.min(bevel,x/2,z/2);
  s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.quadraticCurveTo(x,-z,x,-z+r);s.lineTo(x,z-r);s.quadraticCurveTo(x,z,x-r,z);s.lineTo(-x+r,z);s.quadraticCurveTo(-x,z,-x,z-r);s.lineTo(-x,-z+r);s.quadraticCurveTo(-x,-z,-x+r,-z);
  const o=horizontalExtrude(THREE,s,size[1],Math.min(bevel,.009),material,name,parent);o.position.set(pos[0],pos[1]+size[1]/2,pos[2]);return o;
}
