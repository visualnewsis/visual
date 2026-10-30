// Shape and contact regression for the 08 keycap / MX-style switch study.
// These are relation and geometry checks of a visualization model, not manufacturer CAD certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../piano/vendor/three.module.min.js';
import {buildMXSwitch,STEM,HOUSING,SPRING,KEYCAP,SOCKET,CAP_PIVOT,springCentreY} from '../assets/models/mx-switch.js';
import {CROSS,SOCKET_CLEARANCE,insideCross,dishY,ceilingY,cavitySection,insideRoundRect,LEGEND_LIFT} from '../assets/models/mx-keycap.js';
const steps=Array.from({length:81},(_,i)=>i/20),EPS=1e-6;
const two=()=>new T.MeshBasicMaterial({side:T.DoubleSide});
const build=()=>buildMXSwitch(T,Object.fromEntries(['ivory','black','red','steel','brass','legend'].map(k=>[k,two()])));
const all=(m,name)=>{const a=[];m.group.traverse(o=>{if(o.name===name)a.push(o);});return a;};
const one=(m,name)=>{const a=all(m,name);assert.equal(a.length,1,name);return a[0];};
const bounds=o=>{o.updateWorldMatrix(true,true);return new T.Box3().setFromObject(o);};
const set=(m,s)=>{m.update(s);m.group.updateMatrixWorld(true);};
function local(mesh){const p=mesh.geometry.attributes.position,out=[];for(let i=0;i<p.count;i++)out.push(new T.Vector3().fromBufferAttribute(p,i));return out;}
function world(mesh){mesh.updateWorldMatrix(true,false);return local(mesh).map(v=>v.applyMatrix4(mesh.matrixWorld));}
function faces(mesh){const p=mesh.geometry.attributes.position,ix=mesh.geometry.index.array,out=[];for(let i=0;i<ix.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ix[i]),b=new T.Vector3().fromBufferAttribute(p,ix[i+1]),c=new T.Vector3().fromBufferAttribute(p,ix[i+2]);const n=b.clone().sub(a).cross(c.clone().sub(a));if(n.lengthSq()<1e-14)continue;out.push({n:n.normalize(),c:a.add(b).add(c).multiplyScalar(1/3)});}return out;}
const boxSphere=(b,c)=>Math.hypot(Math.max(b.min.x-c.x,0,c.x-b.max.x),Math.max(b.min.y-c.y,0,c.y-b.max.y),Math.max(b.min.z-c.z,0,c.z-b.max.z));
// Ring aperture as built: centre square plus the +x notch for the cam leg.
const R=HOUSING.ring,inAperture=(x,z,m=0)=>(Math.abs(x)<=R.hole-m&&Math.abs(z)<=R.hole-m)||(x>=R.hole-m&&x<=R.notchX-m&&Math.abs(z)<=R.notchZ-m);

test('1u keycap is a thick standard-height shell, not a thin plate',()=>{
 const m=build(),ext=one(m,'keycap exterior'),cav=one(m,'keycap cavity'),b=new T.Box3().setFromBufferAttribute(ext.geometry.attributes.position),c=new T.Box3().setFromBufferAttribute(cav.geometry.attributes.position);
 assert.ok(Math.abs(b.max.x-b.min.x-1.80)<1e-3&&Math.abs(b.max.z-b.min.z-1.80)<1e-3,'18.0 mm skirt on a 19.05 mm pitch');
 const height=b.max.y-b.min.y;assert.ok(height>=.90&&height<=1.20,'total height 9-12 mm, got '+height);
 assert.ok(2*KEYCAP.tx>=1.20&&2*KEYCAP.tx<=1.50,'top face 12-15 mm');
 const wall=(b.max.x-c.max.x);assert.ok(wall>=.10&&wall<=.15,'side wall 1.0-1.5 mm at the skirt, got '+wall);
 for(const r of [KEYCAP.cornerBottom,KEYCAP.cornerTop,KEYCAP.fillet])assert.ok(r>=.08&&r<=.18,'corner/edge radius R0.8-1.8 mm');
 // Dish depth from the real vertices: rim at x=±tx, lowest point at the centre.
 const pts=local(ext),centre=pts.filter(v=>Math.hypot(v.x,v.z)<1e-6)[0].y,rim=Math.max(...pts.filter(v=>Math.abs(Math.abs(v.x)-KEYCAP.tx)<1e-6&&Math.abs(v.z)<.2).map(v=>v.y));
 const depth=rim-centre;assert.ok(depth>=.04&&depth<=.10,'dish 0.4-1.0 mm, got '+depth);
 // Thick top: ceiling sits topThickness below the dish everywhere.
 assert.ok(Math.abs(dishY(KEYCAP,0,0)-ceilingY(KEYCAP,0,0)-KEYCAP.topThickness)<EPS&&KEYCAP.topThickness>=.10);
});
test('top is one cylindrical concave dish: lower in the middle, straight along the finger axis',()=>{
 const m=build(),pts=local(one(m,'keycap exterior')).filter(v=>insideRoundRect(v.x,v.z,KEYCAP.tx+1e-6,KEYCAP.tz+1e-6,KEYCAP.cornerTop)&&v.y>KEYCAP.bottom+.5);
 assert.ok(pts.length>200);for(const v of pts)assert.ok(Math.abs(v.y-dishY(KEYCAP,v.x,v.z))<1e-5,'top vertex on dish');
 for(let x=0;x<KEYCAP.tx;x+=.05){assert.ok(dishY(KEYCAP,x+.05,0)>dishY(KEYCAP,x,0));assert.equal(dishY(KEYCAP,x,-.5),dishY(KEYCAP,x,.5));}
});
test('shell surfaces face outward, cavity faces inward, rim faces down',()=>{
 const m=build();
 for(const f of faces(one(m,'keycap exterior'))){if(Math.abs(f.n.y)<.6)assert.ok(f.n.x*f.c.x+f.n.z*f.c.z>0,'exterior wall outward');else if(f.c.y>KEYCAP.bottom+.5)assert.ok(f.n.y>0,'top faces up');}
 for(const f of faces(one(m,'keycap cavity'))){if(Math.abs(f.n.y)<.6)assert.ok(f.n.x*f.c.x+f.n.z*f.c.z<0,'cavity wall inward');else assert.ok(f.n.y<0,'ceiling faces down');}
 for(const f of faces(one(m,'keycap skirt rim')))assert.ok(f.n.y<-.99,'skirt rim faces down');
});
test('socket is a real cross bore that clears the stem and never pokes through the top',()=>{
 const m=build(),socket=one(m,'cross socket'),sb=new T.Box3().setFromBufferAttribute(socket.geometry.attributes.position);
 // Old regression: the socket top reached above the dish centre and showed as a cross on the cap.
 assert.ok(sb.max.y<dishY(KEYCAP,0,0)-.05,'socket stays inside the cap');assert.ok(sb.max.y>=ceilingY(KEYCAP,0,0),'socket is joined to the ceiling');
 assert.ok(Math.abs(sb.min.y-SOCKET.bottom)<EPS&&SOCKET.bottom-STEM.headTop>=.01,'socket bottom rides above the stem shoulder');
 assert.ok(STEM.crossTop-SOCKET.bottom>=.30,'cross engages at least 3 mm');assert.ok(sb.max.y-STEM.crossTop>=.02,'cross tip clears the bore end');
 // Cast from the axis at mid-engagement: every first wall hit lies on the clearance outline of the cross.
 const ray=new T.Raycaster(),y=(SOCKET.bottom+STEM.crossTop)/2;
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2,d=new T.Vector3(Math.cos(a),0,Math.sin(a));ray.set(new T.Vector3(0,y,0),d);const hit=ray.intersectObject(socket)[0];assert.ok(hit,'wall hit');
  const p=hit.point;assert.ok(insideCross(p.x,p.z,SOCKET_CLEARANCE+1e-4)&&!insideCross(p.x,p.z,SOCKET_CLEARANCE-1e-4),'bore wall at '+a.toFixed(2));}
 assert.ok(SOCKET_CLEARANCE>0&&SOCKET_CLEARANCE<=.02);
 const cross=one(m,'MX cross stem'),cb=new T.Box3().setFromBufferAttribute(cross.geometry.attributes.position);
 assert.ok(Math.abs(cb.max.x-cb.min.x-CROSS.span)<1e-6&&Math.abs(cb.max.z-cb.min.z-CROSS.span)<1e-6,'4.0 mm cross span');
 for(const v of local(cross))if(v.y>SOCKET.bottom)assert.ok(insideCross(v.x,v.z,1e-6),'cross inside the bore');
 assert.equal(all(m,'socket rib').length,4,'four reinforcing ribs');
 for(const rib of all(m,'socket rib')){const rb=new T.Box3().setFromBufferAttribute(rib.geometry.attributes.position);assert.ok(rb.min.y>STEM.crossTop+.1,'ribs hang from the ceiling, clear of the cross');}
});
test('legends: R on the left, ㄲ upper right, ㄱ lower right, printed on the dish',()=>{
 const m=build(),found=[];m.group.traverse(o=>{if(o.name.startsWith('legend '))found.push(o);});
 assert.deepEqual(found.map(o=>o.name).sort(),['legend R','legend ㄱ','legend ㄲ'].sort(),'exactly the three requested legends');
 const centre=n=>new T.Box3().setFromBufferAttribute(one(m,n).geometry.attributes.position).getCenter(new T.Vector3());
 const r=centre('legend R'),kk=centre('legend ㄲ'),k=centre('legend ㄱ');
 assert.ok(r.x<-.15&&Math.abs(r.z)<.05,'R left');assert.ok(kk.x>.1&&kk.z<-.1,'ㄲ upper right (toward the back edge)');assert.ok(k.x>.1&&k.z>.1,'ㄱ lower right');
 assert.ok(Math.abs(kk.x-k.x)<.02,'jamo share one column');
 for(const o of found){for(const v of local(o)){const lift=v.y-dishY(KEYCAP,v.x,v.z);assert.ok(lift>0&&lift<=.006,'printed on the dish');assert.ok(Math.abs(v.x)<KEYCAP.tx-.03&&Math.abs(v.z)<KEYCAP.tz-.03,'inside the top face');}
  for(const f of faces(o))assert.ok(f.n.y>.9,'legend faces up');}
 assert.equal(LEGEND_LIFT,.003);
});
test('stem is built from cross, shoulder head, bored slider, guide wings, spring pole and cam leg',()=>{
 const m=build();
 for(const n of ['MX cross stem','stem head','stem head crown','stem slider body','spring centre pole','contact release cam','cam riser','cam outer support','cam slider web'])one(m,n);
 assert.equal(all(m,'stem guide wing').length,2);assert.equal(all(m,'stem guide channel').length,4);
 const body=one(m,'stem slider body').geometry.parameters.shapes,hole=body.holes[0].getPoints(64);
 for(const p of hole)assert.ok(Math.abs(Math.hypot(p.x,p.y)-STEM.bore)<1e-6,'round spring bore');
 assert.ok(STEM.bore>SPRING.radius+SPRING.wire&&STEM.pole.radius<HOUSING.sleeve.inner&&HOUSING.sleeve.outer<SPRING.radius-SPRING.wire,'pole · sleeve · spring · bore nest coaxially');
 assert.ok(STEM.head.z<STEM.z&&STEM.head.xMin>STEM.xMin,'head narrower than the slider: visible shoulder');
 // Retention: the wings sit under the top plate, outside its aperture.
 assert.ok(STEM.wing.top<R.bottom&&STEM.wing.zOut>R.hole,'slider is captured by the upper housing');
});
test('assembled sweep 0-4 mm: no part passes through another',()=>{
 const m=build(),wings=all(m,'stem guide wing'),channels=all(m,'stem guide channel'),pads=all(m,'bottom-out pad');
 const fixedButton=m.parts.fixedContact.children.find(o=>o.geometry.type==='SphereGeometry'),movingButton=m.parts.movingLeaf.children[0].children.find(o=>o.geometry.type==='SphereGeometry');
 const ring=m.parts.upperHousing.children[0],sleeve=one(m,'spring centre sleeve'),coil=one(m,'return spring coil'),walls=m.parts.lowerHousing.children.filter(o=>o.geometry.type==='BoxGeometry'&&Math.abs(o.geometry.parameters.height-.52)<1e-9);
 const tongues=m.parts.upperHousing.children.filter(o=>o.geometry.type==='BoxGeometry'&&Math.abs(o.geometry.parameters.height-.26)<1e-9);
 const plateOutline=ring.geometry.parameters.shapes.getPoints(24);assert.equal(tongues.length,4);assert.equal(walls.length,4);
 for(const travel of steps){set(m,{travel});const dy=-.1*travel;
  for(const w of wings){const wb=bounds(w);for(const c of channels)assert.equal(wb.intersectsBox(bounds(c)),false,'wing rides between guide channels at '+travel);
   for(const t of tongues)assert.equal(wb.intersectsBox(bounds(t)),false);
   const pad=pads.map(bounds).find(p=>p.min.z*wb.min.z>0);if(travel<4)assert.ok(wb.min.y>pad.max.y+EPS);else assert.ok(Math.abs(wb.min.y-pad.max.y)<1e-6,'bottom-out pad meets the wing at 4 mm (float32 geometry)');}
  // Slider/head vs the moving and fixed contacts (rotated leaf: its AABB is conservative).
  const leafB=bounds(m.parts.movingLeaf),fixedB=bounds(m.parts.fixedContact);
  for(const n of ['stem slider body','stem head','stem head crown','spring centre pole']){const b=bounds(one(m,n));assert.ok(b.max.x<leafB.min.x||b.min.y>leafB.max.y,n+' clears the leaf at '+travel);assert.ok(b.max.x<fixedB.min.x,n+' clears the fixed contact');}
  // Cam leg supports never touch either electrical button (old bridge hit the fixed button past 3.8 mm).
  for(const n of ['cam riser','cam outer support','cam slider web','contact release cam']){const b=bounds(one(m,n));for(const s of [fixedButton,movingButton])assert.ok(boxSphere(b,s.getWorldPosition(new T.Vector3()))>.052+1e-4,n+' clears a contact button at '+travel);}
  // Stem through the top plate: every stem mesh inside the plate band lies within the aperture.
  const rb=bounds(ring);for(const o of m.parts.stem.children){const b=bounds(o);if(b.max.y<rb.min.y||b.min.y>rb.max.y)continue;for(const [x,z] of [[b.min.x,b.min.z],[b.min.x,b.max.z],[b.max.x,b.min.z],[b.max.x,b.max.z]])assert.ok(inAperture(x,z,-1e-9),o.name+' inside aperture at '+travel);}
  // Spring: ends seated, wire round and between sleeve and bore, coils never solid.
  const sb=bounds(coil),length=SPRING.rest+dy,boreY=m.parts.stem.position.y+STEM.boreTop;
  assert.ok(Math.abs(sb.min.y-HOUSING.floorTop)<2e-4,'spring sits on the floor');assert.ok(Math.abs(sb.max.y-boreY)<2e-4,'spring top seats in the stem bore at '+travel);
  for(const v of world(coil)){const r=Math.hypot(v.x,v.z);assert.ok(r>HOUSING.sleeve.outer+.01&&r<STEM.bore-.005,'coil between sleeve and bore');}
  for(let u=0;u<=SPRING.turns-1;u+=.05)assert.ok(springCentreY(u+1,length)-springCentreY(u,length)>=2*SPRING.wire,'coil pitch ≥ wire diameter');
  assert.ok(boreY>HOUSING.sleeve.top+.02,'bore ceiling stays above the centre sleeve');
  // Keycap around the housing: socket enters the aperture, skirt clears plate, tongues and walls.
  const capY=m.parts.keycap.position.y,ringTop=rb.max.y,ringBottom=rb.min.y;
  if(capY+SOCKET.bottom<ringTop)for(let i=0;i<64;i++){const a=i/64*Math.PI*2;assert.ok(inAperture(SOCKET.radius*Math.cos(a),SOCKET.radius*Math.sin(a),.005),'socket fits the aperture at '+travel);}
  for(let y=Math.max(ringBottom,capY+KEYCAP.bottom);y<=ringTop+1e-9;y+=.01){const s=cavitySection(KEYCAP,y-capY);for(const p of plateOutline)assert.ok(insideRoundRect(p.x,p.y,s.x-.01,s.z-.01,s.r),'skirt clears the top plate at '+travel);}
  assert.ok(capY+KEYCAP.bottom>Math.max(...walls.map(w=>bounds(w).max.y)),'skirt stays above the lower housing walls');
  for(const t of tongues){const tb=bounds(t);if(capY+KEYCAP.bottom>tb.max.y)continue;const s=cavitySection(KEYCAP,tb.max.y-capY);assert.ok(insideRoundRect(Math.max(Math.abs(tb.min.x),Math.abs(tb.max.x)),Math.max(Math.abs(tb.min.z),Math.abs(tb.max.z)),s.x-.01,s.z-.01,s.r),'clip tongue inside the skirt');}
  for(const rib of all(m,'socket rib'))assert.ok(bounds(rib).min.y>ringTop,'ribs stay above the housing');
 }
});
test('2 mm actuation, 4 mm bottom-out and spring return keep their order',()=>{
 const m=build(),wing=all(m,'stem guide wing')[0],pad=all(m,'bottom-out pad').find(p=>p.position.z*wing.position.z>0);
 const gap=t=>{set(m,{travel:t});return bounds(wing).min.y-bounds(pad).max.y;};
 for(const t of steps){set(m,{travel:t});assert.equal(m.parts.movingLeaf.userData.closed,t>=2,'contact closes at 2 mm, not before: '+t);}
 assert.ok(gap(1.99)>.2&&gap(2)>.19,'actuation happens well before the floor');assert.ok(gap(3.95)>0);assert.ok(Math.abs(gap(4))<1e-6,'4 mm = bottom-out');
 set(m,{travel:4});const compressed=m.parts.spring.userData.length;set(m,{travel:0});
 assert.equal(m.parts.movingLeaf.userData.closed,false,'release reopens the contact');assert.ok(Math.abs(m.parts.spring.userData.length-SPRING.rest)<EPS&&compressed<SPRING.rest-.39,'spring recovers its preload length');
 assert.equal(m.parts.stem.position.y,0);assert.equal(m.parts.keycap.position.y,0);assert.equal(m.parts.spring.position.y,SPRING.base);
 for(const v of world(one(m,'return spring coil')))assert.ok(Number.isFinite(v.x+v.y+v.z));
});
test('explode and reassemble round-trip; lifted cap shows its socket to the study camera',()=>{
 const m=build(),snap=()=>Object.fromEntries(Object.entries(m.parts).map(([n,p])=>[n,p.position.toArray().concat(p.rotation.toArray().slice(0,3))]));
 set(m,{travel:0,explode:0});const before=snap(),pivot=one(m,'keycap pivot');
 set(m,{travel:2.5,explode:1});assert.equal(m.parts.movingLeaf.userData.closed,false,'exploded contacts are apart');
 const capB=bounds(m.parts.keycap),upperB=bounds(m.parts.upperHousing),stemB=bounds(m.parts.stem);
 assert.ok(capB.min.y>upperB.max.y+.05&&upperB.min.y>stemB.max.y,'keycap, upper housing and stem separate');
 const down=new T.Vector3(0,-1,0).transformDirection(pivot.matrixWorld),eye=new T.Vector3(5,3.5,7).normalize();assert.ok(down.dot(eye)>.2,'underside turns toward the viewer');
 set(m,{travel:0,explode:0});assert.deepEqual(snap(),before,'assemble restores every part');assert.equal(pivot.rotation.x,-0);
 set(m,{explode:1,capTilt:0});assert.equal(pivot.rotation.x,-0,'callers can keep the cap level');
 assert.equal(pivot.position.y,CAP_PIVOT);
});
test('canonical API stays available to the study, anatomy and lesson builders',()=>{
 const m=build();assert.deepEqual(Object.keys(m.parts).sort(),['fixedContact','keycap','lowerHousing','movingLeaf','spring','stem','upperHousing']);
 assert.equal(typeof m.update,'function');m.update();m.update({travel:'2'});assert.equal(m.group.userData.travelMm,2);assert.equal(m.group.userData.explode,0);
 assert.equal(m.parts.upperHousing.children.find(o=>o.isMesh).geometry.type,'ExtrudeGeometry','notched plate is still the first housing mesh');
 assert.ok(m.parts.lowerHousing.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.geometry.parameters.height===.12),'floor slab kept');
 assert.ok(m.group.getObjectByName('contact release cam').userData.profile.length===81);
 const plain=buildMXSwitch(T,{});plain.update({travel:4});assert.equal(plain.parts.movingLeaf.userData.closed,true,'builds with default materials');
 // Observation state is opt-in: only the two walls facing the study camera open, and closing restores the exterior.
 const wall=n=>one(m,'lower housing wall '+n);m.update({travel:2,cutaway:1});assert.deepEqual(['+x','+z','-x','-z'].map(n=>wall(n).visible),[false,false,true,true]);m.update({travel:2});assert.ok(['+x','+z','-x','-z'].every(n=>wall(n).visible),'default exterior is closed');
});
test('partial explode with any press depth: cross, socket, plate, cam and leaf never interpenetrate',()=>{
 const m=build(),cross=one(m,'MX cross stem'),socket=one(m,'cross socket'),ring=m.parts.upperHousing.children[0],cam=one(m,'contact release cam'),profile=cam.userData.profile;
 const tab=[];m.parts.movingLeaf.traverse(o=>{if(o.geometry?.type==='BoxGeometry')tab.push(o);});
 const capMeshes=[];m.parts.keycap.traverse(o=>{if(o.isMesh)capMeshes.push(o);});
 const sb=socket.geometry.userData,faceX=y=>{for(let i=1;i<profile.length;i++)if(y<=profile[i][1]){const a=profile[i-1],b=profile[i];return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);}return profile.at(-1)[0];};
 const inPlate=v=>v.y>R.bottom+1e-6&&v.y<R.bottom+R.depth-1e-6&&insideRoundRect(v.x,v.z,R.outer-1e-6,R.outer-1e-6,R.corner)&&!inAperture(v.x,v.z,-1e-6);
 const boxPoints=o=>{const p=o.geometry.parameters,out=[];for(const x of [-.5,0,.5])for(const y of [-.5,0,.5])for(const z of [-.5,0,.5])out.push(new T.Vector3(x*p.width,y*p.height,z*p.depth).applyMatrix4(o.matrixWorld));return out;};
 for(let t=0;t<=4;t+=.5)for(let e=0;e<=1+1e-9;e+=.02){set(m,{travel:t,explode:e});
  // Cross samples in the socket's own frame: inside the boss radius they must sit in the bore.
  const toSocket=socket.matrixWorld.clone().invert();for(const v of world(cross)){const p=v.applyMatrix4(toSocket);if(p.y<sb.bottom||p.y>sb.top||Math.hypot(p.x,p.z)>=sb.radius)continue;assert.ok(insideCross(p.x,p.z,sb.clearance+1e-6),'cross clears the socket wall at '+t+' mm / explode '+e.toFixed(2));}
  // Keycap shell, socket, ribs and legends vs the solid part of the notched plate.
  const toRing=ring.matrixWorld.clone().invert();for(const o of capMeshes)for(const v of world(o)){const p=v.applyMatrix4(toRing).add(new T.Vector3(0,R.bottom,0));assert.ok(!inPlate(p),o.name+' outside the plate at '+t+' mm / explode '+e.toFixed(2));}
  // Leaf boxes in the stem frame stay left of the cam face wherever they share its height and depth band.
  const toStem=m.parts.stem.matrixWorld.clone().invert();for(const o of tab)for(const v of boxPoints(o)){const p=v.applyMatrix4(toStem);if(p.z<.11||p.z>.155||p.y<-.2675||p.y>profile.at(-1)[1])continue;assert.ok(p.x<=faceX(p.y)+2e-5||p.x>=.53,'leaf stays out of the cam at '+t+' mm / explode '+e.toFixed(2));}
  const closed=m.parts.movingLeaf.userData.closed,fb=m.parts.fixedContact.children.find(o=>o.geometry.type==='SphereGeometry'),mb=m.parts.movingLeaf.children[0].children.find(o=>o.geometry.type==='SphereGeometry');
  const gap=fb.getWorldPosition(new T.Vector3()).distanceTo(mb.getWorldPosition(new T.Vector3()))-.104;assert.ok(closed?Math.abs(gap)<1e-5:gap>-1e-6,'closed flag matches touching buttons at '+t+' / '+e.toFixed(2));
 }
});
