// GOODEASY: illustrative MX-style mechanical switch, units mm/10 (travel 0..4 mm).
// No imports. THREE injected. Not a manufacturer CAD model.
export function buildMXSwitch(T,M={}) {
 const mat=(k,c,metal=false)=>M[k]||new T.MeshStandardMaterial({color:c,roughness:metal?.36:.7,metalness:metal? .65:0});
 const wood=mat('ivory',0xe8e4db),black=mat('black',0x25252a),red=mat('red',0xd83228),steel=mat('steel',0xaab0b5,true),brass=mat('brass',0xc6a66a,true),felt=mat('felt',0x55575a);
 const group=new T.Group(),parts={};
 function part(n){let g=new T.Group();g.name=n;group.add(g);parts[n]=g;return g}
 function mesh(p,g,m,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o}
 const box=(w,h,d)=>new T.BoxGeometry(w,h,d);
 function ring(p,outer,inner,y,h,m){let s=new T.Shape();s.moveTo(-outer,-outer);s.lineTo(outer,-outer);s.lineTo(outer,outer);s.lineTo(-outer,outer);s.closePath();let hole=new T.Path();hole.moveTo(-inner,-inner);hole.lineTo(-inner,inner);hole.lineTo(inner,inner);hole.lineTo(inner,-inner);hole.closePath();s.holes.push(hole);let geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:3,curveSegments:12});geo.rotateX(-Math.PI/2);mesh(p,geo,m,0,y,0)}
 const bottom=part('lowerHousing'),top=part('upperHousing'),stem=part('stem'),spring=part('spring'),fixed=part('fixedContact'),leaf=part('movingLeaf'),cap=part('keycap');
 // Lower cavity: four walls + bottom, with spring socket and through-hole pins.
 mesh(bottom,box(1.42,.13,1.42),black,0,-.74,0);
 for(let s of [-1,1]){mesh(bottom,box(1.42,.48,.11),black,0,-.44,s*.66);mesh(bottom,box(.11,.48,1.2),black,s*.66,-.44,0)}
 mesh(bottom,new T.CylinderGeometry(.25,.25,.10,32),felt,0,-.62,0);
 for(let z of [-.32,.32])mesh(bottom,new T.CylinderGeometry(.043,.043,.40,12),brass,.22,-.96,z);
 // Open top housing and four distinct retention clips.
 ring(top,.74,.43,-.12,.19,black);
 for(let x of [-.57,.57])for(let z of [-.57,.57])mesh(top,box(.13,.25,.18),black,x,-.28,z);
 // Stem red central slider + four arms, cross mounting shaft with actual open cross socket in cap.
 mesh(stem,box(.39,.59,.39),red,0,-.21,0);
 mesh(stem,box(.17,.24,.55),red,0,.19,0);mesh(stem,box(.55,.24,.17),red,0,.19,0);
 mesh(stem,box(.25,.28,.17),red,.28,-.34,0);mesh(stem,box(.25,.28,.17),red,-.28,-.34,0);
 // Coiled spring as a helix, with visible ends.
 const pts=[];for(let i=0;i<=360;i++){let t=i/360, a=t*Math.PI*2*7;pts.push(new T.Vector3(.225*Math.cos(a),-.57+t*.51,.225*Math.sin(a)))}
 mesh(spring,new T.TubeGeometry(new T.CatmullRomCurve3(pts),420,.027,8,false),steel);
 mesh(fixed,box(.065,.47,.12),brass,.48,-.43,-.22);
 mesh(fixed,box(.20,.06,.13),brass,.41,-.21,-.22);
 // Curved moving leaf contact, its upper end pushed by stem cam.
 const leafPts=[new T.Vector3(.51,-.67,.25),new T.Vector3(.48,-.44,.25),new T.Vector3(.36,-.27,.25),new T.Vector3(.47,-.11,.25)];
 const leafCurve=new T.CatmullRomCurve3(leafPts);
 const leafMesh=mesh(leaf,new T.TubeGeometry(leafCurve,36,.035,9,false),brass);
 mesh(leaf,new T.SphereGeometry(.065,12,10),steel,.47,-.11,.25);
 // Concave trapezoidal cap: sloped walls + inset sculpted shallow concavity.
 const s=new T.Shape();s.moveTo(-.82,-.82);s.lineTo(.82,-.82);s.lineTo(.82,.82);s.lineTo(-.82,.82);s.closePath();
 const geo=new T.ExtrudeGeometry(s,{depth:.37,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.065,bevelThickness:.06});geo.rotateX(-Math.PI/2);
 const capShell=mesh(cap,geo,wood,0,.50,0);capShell.scale.set(.95,1,.95);
 // Top concave dish using radially sampled mesh; edge high, center low.
 const vs=[],ids=[],N=32,R=18;for(let r=0;r<=R;r++)for(let i=0;i<=N;i++){let a=2*Math.PI*i/N,rr=r/R;vs.push(.70*rr*Math.cos(a),.91+.055*rr*rr,.70*rr*Math.sin(a));if(r<R&&i<N){let q=r*(N+1)+i;ids.push(q,q+N+1,q+1,q+1,q+N+1,q+N+2)}}
 let dish=new T.BufferGeometry();dish.setAttribute('position',new T.Float32BufferAttribute(vs,3));dish.setIndex(ids);dish.computeVertexNormals();mesh(cap,dish,wood);
 // Cross socket is a real recess through underside of the keycap via open 4-segment socket walls.
 for(let x of [-.15,.15])for(let z of [-.15,.15])mesh(cap,box(.12,.19,.12),black,x,.45,z);
 const assembled={lowerHousing:0,upperHousing:0,stem:0,spring:0,fixedContact:0,movingLeaf:0,keycap:0};
 const offset={lowerHousing:-.35,upperHousing:1.1,stem:2.05,spring:1.35,fixedContact:-.7,movingLeaf:-1.0,keycap:3.1};
 function update({travel=0,explode=0}={}){travel=T.MathUtils.clamp(travel,0,4);explode=T.MathUtils.clamp(explode,0,1);for(let [n,g] of Object.entries(parts))g.position.y=assembled[n]+offset[n]*explode;
 const press=travel*.1*(1-explode);stem.position.y-=press;cap.position.y-=press;spring.scale.y=Math.max(.2,1-travel*.15*(1-explode));spring.position.y+=press*.45;
 // Contact only closes after actuation threshold, not continuously.
 leafMesh.rotation.z=(travel>=2?-.14:-.025)*(1-explode);leaf.userData.closed=travel>=2;
 group.userData.travelMm=travel;group.userData.explode=explode;}
 update();return {group,parts,update};
}
