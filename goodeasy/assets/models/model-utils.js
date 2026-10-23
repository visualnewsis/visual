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
export function addWoodGrain(THREE, color='#98603b', lines=65){
  if(typeof document==='undefined')return new THREE.MeshStandardMaterial({color,roughness:.61,side:THREE.DoubleSide});
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const ctx=c.getContext('2d');
  ctx.fillStyle=color;ctx.fillRect(0,0,1024,1024);
  let seed=97351;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  // Irregular, very low contrast long grain: varied widths, slow lateral wander, no repeating sine waves.
  for(let i=0;i<lines;i++){
    const x=rand()*1024,alpha=.008+rand()*.045;
    ctx.strokeStyle=rand()<.62?`rgba(37,20,11,${alpha})`:`rgba(250,221,173,${alpha})`;
    ctx.lineWidth=.3+rand()*3.6;ctx.beginPath();ctx.moveTo(x,-12);
    const drift=(rand()-.5)*25;ctx.bezierCurveTo(x+drift*.2,210,x+drift,670,x+drift*.75,1036);ctx.stroke();
  }
  // Subtle stochastic pores without regular vertical stripes.
  for(let i=0;i<4400;i++){
    const x=rand()*1024,y=rand()*1024,w=.25+rand()*1.1,h=1+rand()*7;
    ctx.fillStyle=rand()<.5?'rgba(35,17,8,.018)':'rgba(255,228,190,.019)';ctx.fillRect(x,y,w,h);
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;tex.anisotropy=8;
  return new THREE.MeshStandardMaterial({map:tex,color:'#ffffff',roughness:.59,metalness:0,side:THREE.DoubleSide});
}
export function assemblyGroup(THREE,name,parent){const g=new THREE.Group();g.name=name;parent.add(g);return g}
export function orientedBox(THREE, size, pos, material,name,parent,bevel=.018){
  const s=new THREE.Shape();const [x,z]=[size[0]/2,size[2]/2],r=Math.min(bevel,x/2,z/2);
  s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.quadraticCurveTo(x,-z,x,-z+r);s.lineTo(x,z-r);s.quadraticCurveTo(x,z,x-r,z);s.lineTo(-x+r,z);s.quadraticCurveTo(-x,z,-x,z-r);s.lineTo(-x,-z+r);s.quadraticCurveTo(-x,-z,-x+r,-z);
  const o=horizontalExtrude(THREE,s,size[1],Math.min(bevel,.009),material,name,parent);o.position.set(pos[0],pos[1]+size[1]/2,pos[2]);return o;
}
