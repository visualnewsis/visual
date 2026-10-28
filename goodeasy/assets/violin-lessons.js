import {T,materials as M} from './quality-kit.js?v=20261028-craft5';
import {buildViolin} from './quality-instruments.js?v=20261028-craft5';
const TAU=Math.PI*2;
function base(){const m=buildViolin(T,M);m.bow.visible=false;return m;}
function segment(s,x){const t=(x-s.from[0])/(s.to[0]-s.from[0]);return new T.Vector3(x,s.from[1]+t*(s.to[1]-s.from[1]),s.from[2]+t*(s.to[2]-s.from[2]));}
export function buildBowStudy(){
 const m=base(),g=m.group,lineData=new Float32Array(129*3),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(lineData,3));const line=new T.Line(geo,new T.LineBasicMaterial({color:0x6de2cc}));line.name='selected string stick slip';g.add(line);
 const dot=new T.Mesh(new T.SphereGeometry(.013,16,12),new T.MeshStandardMaterial({color:0x55c9bd,emissive:0x165951}));dot.name='bow and string contact';g.add(dot);m.bow.visible=true;m.bow.name="bow";
 const hairBase=m.parts.bowHair.position.z;let selected;
 return {...m,eye:[.2,5,3],allowZoom:true,defaults:{cycle:0,midi:69},annotations:[{object:dot,text:s=>s.sticking?'붙음 · 현이 활과 함께 이동':'미끄러짐 · 현이 되돌아옴'},{object:m.parts.bridge,text:'브리지 · 현의 진동하는 구간 끝'}],update(s){
 const p=((s.cycle||0)%1+1)%1,stick=p<.8;s.sticking=stick;selected=m.strings.find(x=>x.midi===s.midi)||m.strings[2];m.strings.forEach(x=>x.mesh.visible=x!==selected);const cycle=s.cycle||0,origin=Math.floor(cycle),bowAt=t=>.12*Math.sin(t*Math.PI/2),start=bowAt(origin),release=bowAt(origin+.8)-start,displacement=stick?bowAt(cycle)-start:release*(1-(p-.8)/.2);
 // Hair travels continuously. Its contact point follows the SAME motion while stuck.
 m.bow.position.z=bowAt(cycle);m.update({midi:selected.midi,bowing:false},false,0);const c=segment(selected,.03);dot.position.copy(c);dot.position.z+=displacement;const slope=-Math.tan(m.bow.rotation.x);dot.position.y+=slope*displacement;
 for(let i=0;i<=128;i++){const t=i/128,x=selected.from[0]+(selected.to[0]-selected.from[0])*t,v=segment(selected,x),fraction=(.03-selected.from[0])/(selected.to[0]-selected.from[0]);const d=displacement*(t<fraction?t/fraction:(1-t)/(1-fraction));v.z+=d;v.y+=slope*d;lineData.set(v.toArray(),i*3);}geo.attributes.position.needsUpdate=true;geo.computeBoundingSphere();s.midi=selected.midi;
 },advance(s,dt){s.cycle=(s.cycle||0)+dt*.25;},reading:s=>`${s.midi===55?'G3':s.midi===62?'D4':s.midi===76?'E5':'A4'} · ${s.sticking?'활과 함께 끌리는 구간':'현이 미끄러져 돌아오는 구간'} · 변위·시간 확대`};
}
export function buildBridgeStudy(){const m=base(),top=m.parts.top,bridge=m.parts.bridge,post=m.parts.post;for(const k of ['neck','scroll','chinrest','tailpiece','afterlength'])if(m.parts[k])m.parts[k].visible=false;for(const s of m.strings)s.mesh.visible=false;m.group.traverse(o=>{if(o.name.startsWith('pegbox wire'))o.visible=false;});m.parts.back.visible=false;m.parts.ribs.visible=false;
 const geometries=[];for(const part of [top,bridge])part.traverse(o=>{if(o.geometry){o.geometry=o.geometry.clone();geometries.push({o,rest:o.geometry.attributes.position.array.slice(),bridge:part===bridge});}});

 return {...m,eye:[1,2.7,3],allowZoom:true,defaults:{amount:50,time:0},annotations:[{object:bridge,text:'브리지의 두 발 → 상판'},{object:m.parts.bracing,text:'배스바 · 상판 안쪽'},{object:post,text:'사운드포스트 · 두 판 사이'}],update(s){const angle=Math.sin((s.time||0)*3)*(s.amount??50)/100*.025;for(const q of geometries){const a=q.o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=q.rest[i*3],y=q.rest[i*3+1],z=q.rest[i*3+2],weight=q.bridge?1:Math.exp(-(((x-.18)/.45)**2));a.setY(i,y+angle*(z-.145)*weight);}a.needsUpdate=true;q.o.geometry.computeVertexNormals();}},advance(s,dt){s.time=(s.time||0)+dt;},reading:()=> '현 → 브리지 두 발 → 상판 · 배스바와 사운드포스트의 위치를 함께 보세요. 포스트 길이는 고정하고 판의 움직임만 확대했습니다.'};
}
export function buildViolinBodyStudy(){
 const m=base(),top=m.parts.top,back=m.parts.back,bridge=m.parts.bridge,ty=top.position.y,by=back.position.y,neckX=m.parts.neck.position.x,scrollX=m.parts.scroll.position.x;
 return {...m,eye:[.2,3.5,5],allowZoom:true,defaults:{explode:0},annotations:[{object:m.parts.bracing,text:'배스바 · 상판 안쪽에 붙음'},{object:m.parts.post,text:'사운드포스트 · 두 판 사이'},{object:top,text:'f홀과 아치형 상판'}],update(s){
 const e=Math.max(0,Math.min(1,s.explode||0)),withdraw=Math.min(1,e/.35),lift=Math.max(0,(e-.35)/.65);
 m.parts.neck.position.x=neckX-withdraw*.8;m.parts.scroll.position.x=scrollX-withdraw*.8;
 top.position.y=ty+lift*.45;back.position.y=by-lift*.45;bridge.position.y=lift*.45;
 for(const key of ['afterlength','tailpiece','chinrest'])m.parts[key].position.y=lift*.45;
 m.strings.forEach(x=>x.mesh.visible=e<.001);m.group.children.filter(o=>o.name.startsWith('pegbox wire')).forEach(o=>o.visible=e<.001);
 },reading:s=>`분해 ${Math.round((s.explode||0)*100)}% · ${(s.explode||0)<=.35?'먼저 넥과 지판을 빼냅니다.':'지판을 뺀 뒤 상판과 뒤판을 엽니다.'} 배스바는 상판과 함께 움직입니다. 분해 간격은 관찰용입니다.`};
}
