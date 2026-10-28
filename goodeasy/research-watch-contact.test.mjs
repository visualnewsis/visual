import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx,style:{}})};
const {buildGears,buildPower,buildEscapement,buildBalance,buildAssembly}=await import('./assets/research-watch.js');
const TAU=Math.PI*2;
function section(o,y){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,out=[];for(let i=0;i<p.count;i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,i+k).applyMatrix4(o.matrixWorld)),h=[];for(let j=0;j<3;j++){const a=v[j],b=v[(j+1)%3];if((a.y-y)*(b.y-y)<0){const t=(y-a.y)/(b.y-a.y);h.push([a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]);}}if(h.length===2)out.push(h);}if(g!==o.geometry)g.dispose();return out;}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function pd(p,a,b){const x=b[0]-a[0],z=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/(x*x+z*z)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);}
function contact(a,b){let gap=1;for(const e of a)for(const f of b){if(Math.min(e[0][0],e[1][0])-Math.max(f[0][0],f[1][0])>gap||Math.min(f[0][0],f[1][0])-Math.max(e[0][0],e[1][0])>gap||Math.min(e[0][1],e[1][1])-Math.max(f[0][1],f[1][1])>gap||Math.min(f[0][1],f[1][1])-Math.max(e[0][1],e[1][1])>gap)continue;assert.ok(!(cross(...e,f[0])*cross(...e,f[1])<-1e-20&&cross(...f,e[0])*cross(...f,e[1])<-1e-20),'actual gear flanks do not cross');gap=Math.min(gap,pd(e[0],...f),pd(e[1],...f),pd(f[0],...e),pd(f[1],...e));}return gap;}
const bounds=o=>new T.Box3().setFromObject(o);

test('lesson 48:12 gears use actual conjugate mesh with staff attachment for a complete tooth cycle',()=>{
 const m=buildGears();for(let i=0;i<=180;i++){m.update({angle:i/180*TAU/48});m.group.updateMatrixWorld(true);const clip=a=>a.filter(e=>e.every(([x,z])=>Math.abs(x-.36)<.1&&Math.abs(z)<.2));assert.ok(contact(clip(section(m.parts.wheel,.02)),clip(section(m.parts.pinion,.02)))<.00065);}
 assert.equal(m.parts.wheel.userData.profile,'paired-cycloidal');assert.equal(m.parts.pinion.userData.profile,'paired-cycloidal');assert.ok(Math.abs(m.parts.driven.rotation.y/m.parts.driver.rotation.y+4)<1e-12);
 for(const p of [m.parts.driver,m.parts.driven])assert.ok(p.children.some(o=>o.name==='Press fitted demonstration gear staff'));
});

test('power lesson keeps spring ends on real hooks, ratchet on square arbor, click in mesh contact',()=>{
 const m=buildPower();for(let i=0;i<=72;i++){const s={time:i/72,charge:i/72*100,open:.8};m.update(s);m.group.updateMatrixWorld(true);const inner=new T.Vector3(...m.parts.spring.userData.inner),outer=new T.Vector3(...m.parts.spring.userData.outer);assert.ok(inner.distanceTo(new T.Vector3(.10,.18,0).applyMatrix4(m.parts.arbor.matrixWorld))<1e-6);assert.ok(outer.distanceTo(new T.Vector3(.82,.18,0).applyMatrix4(m.parts.barrel.matrixWorld))<1e-6);const center=m.parts.clickTip.getWorldPosition(new T.Vector3()),edges=section(m.parts.ratchet,.5225);assert.ok(Math.abs(Math.min(...edges.map(e=>pd([center.x,center.z],...e)))-.0122)<2e-6);}
 const held=m.parts.arbor.rotation.y;m.update({time:2,charge:60});assert.equal(m.parts.arbor.rotation.y,held);assert.notEqual(m.parts.barrel.rotation.y,0);assert.equal(m.parts.ratchet.parent,m.parts.arbor);const key=m.group.getObjectByName('Power ratchet square arbor key');assert.ok(bounds(key).intersectsBox(bounds(m.parts.arborStaff)));assert.ok(bounds(key).min.y<.50&&bounds(key).max.y>.545);
});

test('escapement lesson is the shared Swiss lever, with real contact and separated free mode',()=>{
 const m=buildEscapement();assert.equal(m.parts.wheel,m.lever.parts.escapeWheel);assert.equal(m.parts.fork,m.lever.parts.pallet);for(let i=0;i<=80;i++){const state={phase:i/40,regulated:1};m.update(state);const s=m.lever.state;assert.ok(Math.min(...s.wheelGaps)>-1e-7);assert.ok(s.pinGap>-1e-7);if(s.stage!=='드롭')assert.ok(s.contactFeature.distance<1e-6);}
 m.update({phase:2,regulated:0});assert.equal(m.parts.fork.visible,false);const a=m.parts.wheel.rotation.y;m.update({phase:2.5,regulated:0});assert.ok(m.parts.wheel.rotation.y-a>Math.PI/15);m.update({phase:2.5,regulated:1});assert.equal(m.parts.fork.visible,true);
});

test('balance lesson spring inner end follows its rotor while outer end and pierced bearings are fixed',()=>{
 const m=buildBalance(),hair=m.parts.hairspring,attr=hair.geometry.attributes.position,ringCenter=start=>{const p=new T.Vector3();for(let k=0;k<8;k++)p.add(new T.Vector3().fromBufferAttribute(attr,start+k));return p.multiplyScalar(1/8);};
 for(const time of [0,.05,.1,.2,.3]){m.update({time,inertia:100,stiffness:100,driven:1});m.group.updateMatrixWorld(true);const expected=new T.Vector3(.05,.09,0).applyMatrix4(m.parts.balance.matrixWorld);assert.ok(ringCenter(0).distanceTo(expected)<.001);assert.ok(ringCenter(attr.count-9).distanceTo(new T.Vector3(.42,.09,0))<.002);}
 const bearings=[];m.group.traverse(o=>{if(o.name==='Lesson pierced balance bearing')bearings.push(o);});assert.equal(bearings.length,2);const staff=bounds(m.parts.staff);assert.ok(staff.min.y<-.28&&staff.max.y>=.25);for(const b of bearings){assert.ok(staff.max.y>=bounds(b).min.y&&staff.min.y<=bounds(b).max.y);const p=b.geometry.attributes.position;let bore=Infinity;for(let i=0;i<p.count;i++)bore=Math.min(bore,Math.hypot(p.getX(i),p.getZ(i)));assert.ok(bore>.025&&bore<.026);}
});

test('assembly lesson passes reserve and uses five beats per second',()=>{
 const m=buildAssembly();m.update({time:0,reserve:70,turns:3});const spring=m.group.getObjectByName('Visible winding mainspring');assert.ok(Math.abs(spring.userData.charge-.7)<1e-9);const escape=m.components.find(c=>c.id==='wheel-4').object,initial=escape.rotation.y;m.update({time:1,reserve:70,turns:3});assert.ok(Math.abs(escape.rotation.y-initial-5*Math.PI/15)<1e-8,'five half-tooth advances in one second');assert.equal(m.group.scale.y,1);
});


test('assembly fallback holds the winding arbor as reserve falls and permits explicit scrubbing',()=>{
 const m=buildAssembly(),ratchet=m.group.getObjectByName('40 tooth winding wheel keyed to barrel arbor'),rotation=()=>{m.group.updateMatrixWorld(true);const q=ratchet.getWorldQuaternion(new T.Quaternion());return q;};m.update({time:0,reserve:80});const held=rotation();for(const [time,reserve] of [[1,50],[2,10],[3,0]]){m.update({time,reserve});assert.ok(rotation().angleTo(held)<1e-7,'reserve decay cannot unwind arbor');}m.update({time:0,reserve:80,turns:1});assert.ok(rotation().angleTo(held)>.1,'explicit turns still scrub the winding state');
});
