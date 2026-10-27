import * as T from '../piano/vendor/three.module.min.js';
import {buildGuitar,GUITAR_LAYOUT as P} from './models/guitar.js?v=20261027-premium3';
const clamp=x=>Math.max(0,Math.min(1,x)),frequency=m=>440*2**((m-69)/12);
function wire(parent,color,radius=.0025){
 const rings=128,sides=7,positions=new Float32Array((rings+1)*sides*3),indices=[];
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;indices.push(a,b,a+sides,b,b+sides,a+sides);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setIndex(indices);const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,metalness:.55,roughness:.35,emissive:color,emissiveIntensity:.12}));mesh.name='observed speaking string';parent.add(mesh);
 return {mesh,update(a,b,time,mode=1,amplitude=.016){for(let i=0;i<=rings;i++){const t=i/rings,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t+Math.sin(Math.PI*t*mode)*Math.sin(time*7*mode)*amplitude,z=a[2]+(b[2]-a[2])*t;for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2,k=(i*sides+j)*3;positions[k]=x;positions[k+1]=y+Math.cos(angle)*radius;positions[k+2]=z+Math.sin(angle)*radius;}}geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();}};
}
function context(){
 const model=buildGuitar(T),group=model.group;model.parts.headstock.visible=true;
 for(const s of model.strings)s.mesh.visible=false;group.traverse(o=>{if(o.name.startsWith('winding '))o.visible=false;});
 const active=wire(group,0xe9c577),rest=wire(group,0x677470,.0015),finger=new T.Mesh(new T.CapsuleGeometry(.030,.065,5,16),new T.MeshStandardMaterial({color:0xbe8d63,roughness:.65}));finger.name='finger pressing the fretboard';group.add(finger);
 return {model,group,active,rest,finger};
}
export function buildLengthStudy(){
 const {model,group,active,rest,finger}=context();let current,currentEnd;
 const result={group,allowZoom:true,portrait:true,eye:[.15,5.2,3],defaults:{length:100,tension:70,midi:64,referenceHz:frequency(64)},advance(s,dt){s.time=(s.time||0)+dt;},
 update(s){const selected=model.strings.find(n=>n.midi===(s.midi||64))||model.strings[5],L=Math.max(.35,Math.min(1,(s.length||100)/100)),a=selected.from,b=selected.to,x=b[0]-(b[0]-a[0])*L,u=(x-a[0])/(b[0]-a[0]),z=a[2]+(b[2]-a[2])*u,y=L>.995?a[1]:.1626+selected.radius,point=[x,y,z];current=point;currentEnd=b;finger.visible=L<.995;finger.position.set(x,y+.0625,z);active.update(point,b,(s.time||0)*Math.sqrt((s.tension||70)/70)/L,1,.012);rest.mesh.visible=L<.995;rest.update(a,point,0,1,0);s.hz=(s.referenceHz||frequency(s.midi||64))*Math.sqrt((s.tension||70)/70)/L;},
 reading:s=>'진동 길이 '+(.65*(s.length||100)/100).toFixed(3)+'m · 장력 '+s.tension+'N · '+s.hz.toFixed(1)+'Hz',
 annotations:[{text:'새들 · 고정된 끝',point:()=>[P.saddleX,.21,currentEnd?.[2]||0]},{text:s=>(s.length||100)<99.5?'짚은 프렛 쪽 · 새 고정 끝':'너트 · 개방현의 고정 끝',point:()=>current||[P.nutX,.18,0]},{text:'진동하는 현',object:active.mesh}]};result.update({...result.defaults,time:0});return result;
}
export function buildHarmonicStudy(){
 const {model,group,active,rest,finger}=context();rest.mesh.visible=false;finger.visible=false;const nodes=[];for(let i=0;i<3;i++){const m=new T.Mesh(new T.SphereGeometry(.012,12,8),new T.MeshStandardMaterial({color:0x00b4c9,emissive:0x005960,roughness:.45}));m.name='stationary node '+i;group.add(m);nodes.push(m);}
 const result={group,allowZoom:true,portrait:true,eye:[.15,5.2,3],defaults:{mode:1,midi:64},advance(s,dt){s.time=(s.time||0)+dt;},update(s){const n=s.mode||1,selected=model.strings.find(x=>x.midi===(s.midi||64))||model.strings[5],a=selected.from,b=selected.to;active.update(a,b,s.time||0,n,.024);nodes.forEach((o,i)=>{const t=(i+1)/n;o.visible=i<n-1;o.position.set(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);});},reading:s=>s.mode+'차 모드 · 움직이지 않는 내부 마디 '+(s.mode-1)+'개 · 진동수는 기본음의 '+s.mode+'배',annotations:[{text:'하나씩 떼어 본 진동 모드',object:active.mesh},{text:'새들 · 고정된 끝',point:[P.saddleX,.21,.125]}]};result.update({...result.defaults,time:0});return result;
}
export function buildBodyStudy(){
 const model=buildGuitar(T),group=model.group,p=model.parts;p.neck.visible=false;for(const s of model.strings)s.mesh.visible=false;group.traverse(o=>{if(o.name.startsWith('winding '))o.visible=false;});
 const lifted=new T.Group();lifted.name='connected soundboard and bridge';lifted.position.set(0,P.topOuter,-.65);group.add(lifted);group.updateMatrixWorld(true);lifted.attach(p.top);lifted.attach(p.bridge);
 const result={group,allowZoom:true,eye:[.8,2.8,4],parts:p,defaults:{explode:0,coupled:1},advance(s,dt){s.time=(s.time||0)+dt;},update(s){const e=clamp(s.explode||0),motion=Math.sin((s.time||0)*7)*.0018*(s.coupled??1);lifted.position.y=P.topOuter+e*.55;lifted.rotation.x=-e*1.35;lifted.rotation.z=motion;p.back.position.y=-e*.30;p.ribs.position.z=e*.16;},reading:s=>(s.explode||0)>.02?'상판 안쪽 X 브레이싱 · 새들과 핀 아래 브리지판 · 관찰을 위해 판을 들어 올렸습니다':s.coupled?'새들 → 브리지 → 상판 · 미세 움직임은 느리게 확대 표시':'상판 움직임 표시 끔 · 실제 음량 계산 아님',annotations:[{text:s=>(s.explode||0)>.2?'브리지판(안쪽) · 핀 구멍':'새들·브리지(바깥)',object:s=>(s.explode||0)>.2?group.getObjectByName('maple bridge plate with six pin holes'):p.bridge},{text:s=>(s.explode||0)>.2?'상판 안쪽 X 브레이싱':'브리지가 붙어 있는 상판',object:s=>(s.explode||0)>.2?p.bracing:p.top},{text:s=>(s.explode||0)>.2?'측판과 라이닝':'측판과 몸통',object:p.ribs}]};result.update({...result.defaults,time:0});return result;
}
