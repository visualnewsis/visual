import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {buildGuitar,GUITAR_LAYOUT as P} from './assets/models/guitar.js';
import {buildLengthStudy,buildHarmonicStudy,buildBodyStudy} from './assets/guitar-lessons.js';
const model=buildGuitar(T),box=o=>new T.Box3().setFromObject(o),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' != '+b);
test('soundboard and back are closed consistently oriented solids, including the soundhole',()=>{
 for(const o of [model.parts.top,model.parts.back]){const g=o.geometry,a=g.index.array,edges=new Map();for(let i=0;i<a.length;i+=3)for(let j=0;j<3;j++){const u=a[i+j],v=a[i+(j+1)%3],key=u<v?u+':'+v:v+':'+u,e=edges.get(key)||{count:0,sign:0};e.count++;e.sign+=u<v?1:-1;edges.set(key,e);}assert.ok([...edges.values()].every(e=>e.count===2&&e.sign===0),o.name+' has a crack or flipped wall');}
 assert.equal(model.group.getObjectByName('dark interior below soundhole'),undefined);
});
test('all strings fit the taper and meet the actual nut and saddle surfaces',()=>{
 near(box(model.parts.nut).max.y,P.nutSeat);near(box(model.parts.saddle).max.y,P.saddleSeat);assert.equal(model.parts.frets.children.length,19);
 for(const s of model.strings){near(s.from[1]-s.radius,P.nutSeat);near(s.to[1]-s.radius,P.saddleSeat);for(const n of [0,1,7,12,19]){const t=1-2**(-n/12),x=P.nutX+(P.saddleX-P.nutX)*t,z=s.from[2]+(s.to[2]-s.from[2])*t,w=.205+.085*(x-P.nutX)/(P.boardEnd-P.nutX);assert.ok(Math.abs(z)+s.radius<w/2-.012,'string leaves the usable fingerboard');}for(const fret of model.parts.frets.children){assert.ok(s.from[1]+(s.to[1]-s.from[1])*(fret.position.x-P.nutX)/(P.saddleX-P.nutX)-s.radius>box(fret).max.y,'resting string crosses fret crown');}}
 near(model.parts.frets.children[11].position.x,(P.nutX+P.saddleX)/2);
});
test('bracing clears the soundhole and binding moves with its own plate',()=>{
 model.group.updateMatrixWorld(true);model.parts.bracing.traverse(o=>{if(!o.geometry||!o.name.includes('X'))return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Math.hypot(p.getX(i)+.1,p.getZ(i))>.218,'brace crosses the soundhole');});
 const edge=model.group.getObjectByName('top edge binding'),initial=edge.getWorldPosition(new T.Vector3());model.parts.top.position.y=.5;model.group.updateMatrixWorld(true);near(edge.getWorldPosition(new T.Vector3()).y-initial.y,.5);model.parts.top.position.y=0;model.group.updateMatrixWorld(true);
 const plate=box(model.group.getObjectByName('maple bridge plate with six pin holes'));for(let i=1;i<=6;i++)near(box(model.group.getObjectByName('string ball end '+i)).max.y,plate.min.y);
});
test('length and tension alter the same calculated note; opened body keeps bridge attached to soundboard',()=>{
 const m=buildLengthStudy(),s={...m.defaults,time:.2,midi:40,referenceHz:82.406889};m.update(s);const f=s.hz;s.length=50;m.update(s);near(s.hz/f,2);s.tension=100;m.update(s);near(s.hz/f,2*Math.sqrt(100/70));
 const h=buildHarmonicStudy();h.update({...h.defaults,mode:3,time:0});const wave=h.group.getObjectByName('observed speaking string').geometry.attributes.position,rest=wave.array.slice();h.update({...h.defaults,mode:3,time:2*Math.PI/21});assert.ok(wave.array.every((value,i)=>Math.abs(value-rest[i])<1e-7),'third harmonic returns after one third of the fundamental visual period');h.update({...h.defaults,mode:3,time:.2});assert.equal(h.group.children.filter(o=>o.name.startsWith('stationary node')&&o.visible).length,2);
 const b=buildBodyStudy(),p=b.parts;for(const explode of [0,.3,1,0]){b.update({explode,coupled:1,time:.8});b.group.updateMatrixWorld(true);const a=p.top.localToWorld(new T.Vector3(.63,.132,0)),c=p.bridge.localToWorld(new T.Vector3(.63,.132,0));assert.ok(a.distanceTo(c)<1e-8,'bridge separates from soundboard');}
});
