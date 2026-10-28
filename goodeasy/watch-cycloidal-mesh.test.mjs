import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx,style:{}})};
const {watchAssembly}=await import('./assets/anatomy-watch.js');
const TAU=Math.PI*2;
// Intersect actual triangles with a plane through the working tooth height.
// This deliberately does not trust pitch-radius metadata or source shape curves.
function section(geometry,y=.02){
 const p=geometry.attributes.position,out=[];
 for(let i=0;i<p.count;i+=3){const a=[0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k)]),h=[];
  for(let j=0;j<3;j++){const u=a[j],v=a[(j+1)%3],dy=u[1]-y;if(dy*(v[1]-y)<0){const t=-dy/(v[1]-u[1]);h.push([u[0]+(v[0]-u[0])*t,u[2]+(v[2]-u[2])*t]);}}
  if(h.length===2)out.push(h);
 }
 return out;
}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const pointDistance=(p,a,b)=>{const x=b[0]-a[0],z=b[1]-a[1],l=x*x+z*z,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/l)):0;return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);};
function contact(a,b){let gap=.002,interference=false;
 for(const e of a)for(const f of b){if(Math.min(e[0][0],e[1][0])-Math.max(f[0][0],f[1][0])>gap||Math.min(f[0][0],f[1][0])-Math.max(e[0][0],e[1][0])>gap||Math.min(e[0][1],e[1][1])-Math.max(f[0][1],f[1][1])>gap||Math.min(f[0][1],f[1][1])-Math.max(e[0][1],e[1][1])>gap)continue;
  if(cross(...e,f[0])*cross(...e,f[1])<-1e-20&&cross(...f,e[0])*cross(...f,e[1])<-1e-20){interference=true;gap=0;break;}
  gap=Math.min(gap,pointDistance(e[0],...f),pointDistance(e[1],...f),pointDistance(f[0],...e),pointDistance(f[1],...e));
 }
 return {gap,interference};
}
function worldSection(segments,mesh,center){const m=mesh.matrixWorld.elements;
 return segments.map(e=>e.map(([x,z])=>[m[0]*x+m[8]*z+m[12],m[2]*x+m[10]*z+m[14]])).filter(e=>Math.min(e[0][0],e[1][0])<center[0]+.18&&Math.max(e[0][0],e[1][0])>center[0]-.18&&Math.min(e[0][1],e[1][1])<center[1]+.18&&Math.max(e[0][1],e[1][1])>center[1]-.18);
}
const meshBounds=o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);};
const wheelGroups=m=>m.components.filter(c=>/^wheel-/.test(c.id)).map(c=>c.object);
const big=(g,i)=>g.children.find(o=>o.userData.teeth===[64,60,64,80,15][i]);
const pin=(g,i)=>g.children.find(o=>o.userData.teeth===[0,12,8,8,8][i]);

for(let pair=0;pair<4;pair++)test(`actual cycloidal pair ${pair+1}: 361 poses have no penetration and retain small working clearance`,()=>{
 const m=watchAssembly();assert.equal(m.group.scale.y,1);m.update({phase:0,charge:50,turns:0});const g=wheelGroups(m),a=big(g[pair],pair),b=pin(g[pair+1],pair+1),sa=section(a.geometry),sb=section(b.geometry),A=g[pair].position,B=g[pair+1].position,phi=Math.atan2(B.z-A.z,B.x-A.x),pitchPoint=[A.x+a.userData.pitchRadius*Math.cos(phi),A.z+a.userData.pitchRadius*Math.sin(phi)];
 assert.equal(a.userData.profile,'paired-cycloidal');assert.equal(b.userData.profile,'paired-cycloidal');assert.ok(sa.length>100&&sb.length>100);
 const ba=meshBounds(a),bb=meshBounds(b);assert.ok(Math.min(ba.max.y,bb.max.y)-Math.max(ba.min.y,bb.min.y) >=Math.min(a.userData.depth,b.userData.depth)*.98,'working tooth widths must overlap');
 for(let i=0;i<=360;i++){g[pair].rotation.y=i/360*TAU/a.userData.teeth;g[pair+1].rotation.y=-g[pair].rotation.y*a.userData.teeth/b.userData.teeth;m.group.updateMatrixWorld(true);const result=contact(worldSection(sa,a,pitchPoint),worldSection(sb,b,pitchPoint));assert.equal(result.interference,false,`pair ${pair} pose ${i} has intersecting tooth flanks`);assert.ok(result.gap<a.userData.backlash*.62,`pair ${pair} pose ${i} has excessive gap ${result.gap}`);}
 for(const o of [a,b]){const p=o.geometry.attributes.position;let radius=0;for(let i=0;i<p.count;i++)radius=Math.max(radius,Math.hypot(p.getX(i),p.getZ(i)));assert.ok(Math.abs(radius-o.userData.pitchRadius-o.userData.module)<1e-6,'real addendum must not be reduced to hide contact errors');}
});

test('compound pinion teeth reach their own wheel and press onto a real staff',()=>{
 const m=watchAssembly();assert.equal(m.group.scale.y,1);m.update({phase:0,charge:50});const groups=wheelGroups(m);
 for(let i=1;i<5;i++){const wheel=big(groups[i],i),pinion=pin(groups[i],i),shaft=groups[i].children.find(o=>o.geometry?.type==='LatheGeometry'),p=pinion.geometry.attributes.position;let bore=Infinity;for(let j=0;j<p.count;j++)bore=Math.min(bore,Math.hypot(p.getX(j),p.getZ(j)));assert.ok(bore<.020&&bore>.018,'toothed pinion presses onto .020 staff');assert.ok(pinion.position.y+pinion.userData.depth>wheel.position.y+.015,'pinion tooth body must physically enter its wheel hub');assert.ok(shaft.geometry.parameters.points.some(p=>Math.abs(p.x-.020)<1e-9));}
});
test('center wheel clears the complete closed barrel and adjacent train staffs clear tooth tips',()=>{
 const m=watchAssembly();assert.equal(m.group.scale.y,1);m.update({phase:0,charge:50});const g=wheelGroups(m),center=big(g[1],1),lid=m.components.find(c=>c.id==='barrel-lid').object,barrelTop=new T.Box3().setFromObject(lid).max.y;assert.ok(meshBounds(center).min.y-barrelTop>.04,'center wheel must sit above barrel lid, wall and spring');
 for(let i=1;i<4;i++){const wheel=big(g[i],i),p=wheel.geometry.attributes.position;let tip=0;for(let j=0;j<p.count;j++)tip=Math.max(tip,Math.hypot(p.getX(j),p.getZ(j)));for(let k=1;k<5;k++){if(i===k)continue;const d=Math.hypot(g[i].position.x-g[k].position.x,g[i].position.z-g[k].position.z);assert.ok(d-tip-.020>.001,'wheel tooth tip must clear the neighboring solid staff');}}
});
test('mainspring core and inner hook rotate with winding arbor; outer hook remains on barrel',()=>{
 const m=watchAssembly(),g=wheelGroups(m),shaft=g[0].children.find(o=>o.geometry?.type==='LatheGeometry'),core=m.group.getObjectByName('Mainspring core fixed to winding arbor'),innerHook=m.group.getObjectByName('Movement inner spring hook'),outerHook=m.group.getObjectByName('Movement outer spring hook');assert.equal(core.parent,shaft);assert.equal(innerHook.parent,shaft);assert.equal(outerHook.parent,g[0]);
 for(const [turns,charge,phase] of [[0,0,0],[5,40,.3],[10,80,.7]]){m.update({turns,charge,phase});m.group.updateMatrixWorld(true);const spring=m.group.getObjectByName('Visible winding mainspring'),inner=new T.Vector3(...spring.userData.inner).applyMatrix4(spring.matrixWorld),outer=new T.Vector3(...spring.userData.outer).applyMatrix4(spring.matrixWorld);assert.ok(inner.distanceTo(new T.Vector3(.075,.23,0).applyMatrix4(shaft.matrixWorld))<1e-6);assert.ok(outer.distanceTo(new T.Vector3(.58,.23,0).applyMatrix4(g[0].matrixWorld))<1e-6);}
});
test('balance spring has a rotating inner collet and an outer support joined to the cock',()=>{
 const m=watchAssembly();assert.equal(m.group.scale.y,1);m.update({phase:0,charge:50});const collet=m.group.getObjectByName('Hairspring inner collet fixed to balance staff'),post=m.group.getObjectByName('Hairspring outer stud support'),arm=m.group.getObjectByName('Balance cock arm supporting outer stud');assert.ok(collet&&post&&arm);assert.equal(collet.parent,m.escapementRig.parts.balance);assert.ok(meshBounds(post).intersectsBox(meshBounds(arm)));const staff=meshBounds(m.group.getObjectByName('Balance staff'));assert.ok(staff.min.y<=.035&&staff.max.y>=meshBounds(m.group.getObjectByName('Upper balance jewel bearing')).max.y,'balance staff enters both jewel bearings');
});

for(const [driverTeeth,drivenTeeth] of [[12,48],[15,45]])test(`actual motion work ${driverTeeth}:${drivenTeeth} keeps conjugate contact through 361 poses`,()=>{
 const m=watchAssembly();m.update({phase:0,turns:0});const motion=m.components.find(c=>c.id==='motion').object,a=motion.children.find(o=>o.userData.teeth===driverTeeth),b=motion.children.find(o=>o.userData.teeth===drivenTeeth),sa=section(a.geometry),sb=section(b.geometry),A=a.getWorldPosition(new T.Vector3()),B=b.getWorldPosition(new T.Vector3()),phi=Math.atan2(B.z-A.z,B.x-A.x),point=[A.x+a.userData.pitchRadius*Math.cos(phi),A.z+a.userData.pitchRadius*Math.sin(phi)],ra=a.rotation.y,rb=b.rotation.y;
 const ba=meshBounds(a),bb=meshBounds(b);assert.ok(Math.min(ba.max.y,bb.max.y)-Math.max(ba.min.y,bb.min.y)>.03);
 for(let i=0;i<=360;i++){const angle=i/360*TAU/driverTeeth;a.rotation.y=ra+angle;b.rotation.y=rb-angle*driverTeeth/drivenTeeth;m.group.updateMatrixWorld(true);const c=contact(worldSection(sa,a,point),worldSection(sb,b,point));assert.equal(c.interference,false,`pose ${i}`);assert.ok(c.gap<a.userData.backlash*.62,`pose ${i} gap ${c.gap}`);}
});

test('fixed bridge posts clear every rotating train tooth envelope',()=>{
 const m=watchAssembly();m.update({phase:0,turns:0});const groups=wheelGroups(m),posts=[];m.group.traverse(o=>{if(o.name.startsWith('Train bridge support '))posts.push(o);});
 for(const post of posts){const center=post.getWorldPosition(new T.Vector3()),r=post.geometry.parameters.radiusTop;for(let i=0;i<5;i++){const wheel=big(groups[i],i),wc=wheel.getWorldPosition(new T.Vector3());let tip=0;wheel.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let j=0;j<p.count;j++){const v=new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld);tip=Math.max(tip,Math.hypot(v.x-wc.x,v.z-wc.z));}});assert.ok(Math.hypot(center.x-wc.x,center.z-wc.z)>tip+r+.005,`${post.name} intersects wheel ${i}`);}}
});

test('motion work uses independent concentric sleeves and a supported compound staff',()=>{
 const m=watchAssembly();m.update({phase:0,turns:0});const motion=m.components.find(c=>c.id==='motion').object,hour=motion.children.find(o=>o.userData.teeth===45),cannon=motion.children.find(o=>o.userData.teeth===12),inter=motion.children.find(o=>o.userData.teeth===48),pinion=motion.children.find(o=>o.userData.teeth===15),sleeve=m.group.getObjectByName('Cannon sleeve inside independent hour wheel'),shaft=m.group.getObjectByName('Compound minute wheel staff'),journal=m.group.getObjectByName('Minute wheel underside journal fixed to mainplate');
 const radialRange=mesh=>{const p=mesh.geometry.attributes.position;let min=Infinity,max=0;for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i));min=Math.min(min,r);max=Math.max(max,r);}return {min,max};};
 assert.ok(radialRange(hour).min-radialRange(sleeve).max>.0008,'hour wheel runs independently around cannon sleeve');assert.equal(sleeve.parent,cannon);assert.ok(meshBounds(pinion).intersectsBox(meshBounds(inter)),'compound pinion reaches the minute wheel web');
 const sb=meshBounds(shaft),jb=meshBounds(journal),plate=m.group.getObjectByName('Concentric movement mainplate');assert.ok(sb.max.y>jb.min.y&&sb.min.y<jb.max.y,'staff enters underside journal');assert.ok(Math.abs(jb.max.y-meshBounds(plate).min.y)<1e-6,'journal seats on mainplate underside');
 const c=shaft.getWorldPosition(new T.Vector3());for(const g of wheelGroups(m)){const q=g.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(c.x-q.x,c.z-q.z)>.12,'motion staff must not be superimposed on an unrelated train pivot');}
});
