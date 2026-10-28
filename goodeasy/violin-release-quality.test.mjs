import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildViolin:raw,violinBoardY}=await import('./assets/models/violin.js');const {buildViolin}=await import('./assets/quality-instruments.js');const {materials:M}=await import('./assets/quality-kit.js');const {buildBowStudy,buildBridgeStudy,buildViolinBodyStudy}=await import('./assets/violin-lessons.js');
const m=raw(T);m.group.updateMatrixWorld(true);
function heights(model,mesh,x,z){const o=new T.Vector3(x,2,z).applyMatrix4(model.group.matrixWorld),d=new T.Vector3(0,-1,0).transformDirection(model.group.matrixWorld);return new T.Raycaster(o,d).intersectObject(mesh,false).map(h=>model.group.worldToLocal(h.point.clone()).y);}
test('arched plate boundaries close against the rib heights, with real bilateral f openings',()=>{
 for(const [part,y] of [[m.parts.top,.106],[m.parts.back,-.121]]){const p=part.geometry.attributes.position;for(let i=0;i<320;i++)assert.ok(Math.abs(p.getY(i)-y)<1e-7);}
 for(const z of [-.195,.195])assert.equal(heights(m,m.parts.top,.18,z).length,0);assert.ok(heights(m,m.parts.top,.18,0).length>0);
});
test('four open strings clear the actual tapered fingerboard and sit on the curved nut',()=>{
 for(const st of m.strings)for(let j=0;j<=80;j++){const x=-1.59+j/80*1.055,t=(x-st.from[0])/(st.to[0]-st.from[0]),z=st.from[2]+t*(st.to[2]-st.from[2]),y=st.from[1]+t*(st.to[1]-st.from[1])-st.radius;assert.ok(y-violinBoardY(x,z)>.0018);}
 for(const st of m.strings){const [x,y,z]=st.from,h=heights(m,m.parts.nut,x,z);assert.ok(Math.abs(Math.max(...h)-(y-st.radius))<.00008);}
});
test('soundpost end caps and both carved bridge feet fit actual triangulated plates',()=>{
 const post=m.parts.post.children[0],p=post.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(post.matrixWorld);m.group.worldToLocal(v);const top=v.y>0,ys=heights(m,top?m.parts.top:m.parts.back,v.x,v.z),expected=top?Math.min(...ys):Math.max(...ys);assert.ok(Math.abs(v.y-expected)<1e-6);}
 for(const foot of m.parts.bridge.children.filter(o=>o.name.startsWith('bridge foot'))){const positions=foot.geometry.attributes.position,unique=new Map();for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),key=x+':'+z;unique.set(key,{x,z,y:Math.min(unique.get(key)?.y??Infinity,positions.getY(i))});}for(const v of unique.values())assert.ok(Math.abs(v.y-Math.max(...heights(m,m.parts.top,v.x,v.z)))<1e-7);}
});
test('bassbar upper edge fits the actual underside along its entire length',()=>{
 const p=m.parts.bassbar.geometry.attributes.position,groups=new Map();for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),key=x.toFixed(6)+':'+z.toFixed(6),y=p.getY(i);groups.set(key,{x,z,y:Math.max(groups.get(key)?.y??-Infinity,y)});}let fitted=0;for(const q of groups.values()){const ys=heights(m,m.parts.top,q.x,q.z);if(ys.length&&Math.abs(q.y-Math.min(...ys))<1e-6)fitted++;}assert.ok(fitted>=90);
});
test('bow hair contact tracks every selected string through transverse travel',()=>{
 const v=buildViolin(T,M);for(const st of v.strings)for(const travel of [-.3,0,.3]){v.bow.position.z=travel;v.update({midi:st.midi,bowing:false},false,0);const x=.03,t=(x-st.from[0])/(st.to[0]-st.from[0]),z=st.from[2]+t*(st.to[2]-st.from[2]),y=st.from[1]+t*(st.to[1]-st.from[1]),a=v.bow.rotation.x,original=v.bow.userData.hairCenterlineY,localZ=(z-travel-original*Math.sin(a))/Math.cos(a),p=new T.Vector3(x,original,localZ).applyEuler(v.bow.rotation).add(v.bow.position);assert.ok(Math.abs(p.y-(y+st.radius+.0014))<1e-10);assert.ok(Math.abs(p.z-z)<1e-10);}
});
test('stick slip study is continuous at full-cycle boundaries and keeps fixed string endpoints',()=>{
 const v=buildBowStudy(),s={...v.defaults};const dot=v.group.getObjectByName('bow and string contact');for(const boundary of [1,2,3,4]){s.cycle=boundary-1e-6;v.update(s);const before=dot.position.clone();s.cycle=boundary+1e-6;v.update(s);assert.ok(dot.position.distanceTo(before)<1e-5);}
 for(const c of [.1,.5,.85,.99]){s.cycle=c;v.update(s);const line=v.group.getObjectByName('selected string stick slip').geometry.attributes.position,selected=v.strings.find(x=>x.midi===s.midi);assert.ok(new T.Vector3().fromBufferAttribute(line,0).distanceTo(new T.Vector3(...selected.from))<1e-6);assert.ok(new T.Vector3().fromBufferAttribute(line,128).distanceTo(new T.Vector3(...selected.to))<1e-6);}
});

test('speaking strings rest above, rather than through, the arched bridge crown',()=>{
 const crown=m.parts.bridgeCrest;m.group.updateMatrixWorld(true);for(const st of m.strings){const [x,y,z]=st.to,ys=heights(m,crown,x,z);assert.ok(ys.length);const wood=heights(m,m.parts.bridgePlate,x,z);assert.ok(Math.abs(y-st.radius-Math.max(...ys,...wood))<1e-8);}
});

test('active vibration keeps the contact ring on the moving tilted bow surface',()=>{
 const v=buildViolin(T,M);for(const st of v.strings)for(const travel of [-.3,.0,.3])for(const now of [0,37,151,420]){
  v.bow.position.z=travel;v.update({midi:st.midi,bowing:true},false,now);v.group.updateMatrixWorld(true);
  const p=st.mesh.geometry.attributes.position,q=st.mesh.userData.bowContactFraction,center=new T.Vector3(),ring=[];
  for(let i=0;i<p.count;i++){const restY=(i<(48+1)*(12+1))?Math.floor(i/13):null; // cap vertices do not occur at contact
   if(restY!==null&&Math.abs(restY/48-(1-Math.round(q*48)/48))<1e-8&&i%13!==12)ring.push(i);
  }
  assert.equal(ring.length,12);for(const i of ring)center.add(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(st.mesh.matrixWorld));center.multiplyScalar(1/ring.length);v.group.worldToLocal(center);
  const original=v.bow.userData.hairCenterlineY,angle=v.bow.rotation.x,localZ=(center.z-v.bow.position.z-original*Math.sin(angle))/Math.cos(angle),hair=new T.Vector3(.03,original,localZ).applyEuler(v.bow.rotation).add(v.bow.position);
  assert.ok(Math.abs(center.x-.03)<1e-6);assert.ok(Math.abs(hair.y-center.y-st.radius-.0014)<1e-6,'active contact separation '+(hair.y-center.y));
 }
});

test('bridge study keeps the soundpost rigid while the bass foot moves about its support side',()=>{
 const v=buildBridgeStudy(),post=v.parts.post.children[0],pos=post.position.clone(),scale=post.scale.clone(),data=post.geometry.attributes.position.array.slice();
 for(const time of [0,.2,.6,1,1.5,2]){v.update({time,amount:100});assert.deepEqual(post.position.toArray(),pos.toArray());assert.deepEqual(post.scale.toArray(),scale.toArray());assert.deepEqual(post.geometry.attributes.position.array,data);}
});
test('body disassembly withdraws neck before lifting top, with no fingerboard intersection',()=>{
 const v=buildViolinBodyStudy();for(let i=0;i<=100;i++){const e=i/100;v.update({explode:e});v.group.updateMatrixWorld(true);const top=new T.Box3().setFromObject(v.parts.top),fingerboard=new T.Box3().setFromObject(v.parts.fingerboard);assert.equal(top.intersectsBox(fingerboard),false,'fingerboard intersection '+e);if(e<=.35)assert.equal(v.parts.top.position.y,0);else assert.equal(top.intersectsBox(new T.Box3().setFromObject(v.parts.neck)),false,'withdrawn neck intersects lifted top '+e);}
 v.update({explode:0});assert.equal(v.parts.neck.position.x,0);assert.equal(v.parts.scroll.position.x,0);
});
