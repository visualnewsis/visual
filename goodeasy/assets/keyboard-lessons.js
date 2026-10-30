import * as T from '../piano/vendor/three.module.min.js';
import {buildMXSwitch} from './models/mx-switch.js?v=20261030-craft-release1';
import {debounceSample} from './mechanism-checks.js?v=20261026-release3';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function inspectSwitch(){
 const m=buildMXSwitch(T,{}),group=m.group;
 for(const part of [m.parts.upperHousing,m.parts.lowerHousing])part.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.19;o.material.depthWrite=false;}});
 const contactMaterial=new T.MeshStandardMaterial({color:0xc9ac61,metalness:.65,roughness:.38,emissive:0x000000});
 for(const part of [m.parts.fixedContact,m.parts.movingLeaf])part.traverse(o=>{if(o.isMesh)o.material=contactMaterial;});
 const led=new T.Mesh(new T.SphereGeometry(.07,16,10),new T.MeshStandardMaterial({color:0x213a36,emissive:0x000000}));
 led.position.set(.65,-.98,.54);group.add(led);
 const wire=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(.53,-1.1,0),new T.Vector3(.53,-1.1,.54),new T.Vector3(.65,-.98,.54)]),new T.LineBasicMaterial({color:0x44635b}));group.add(wire);
 const showContact=(on,registered=on)=>{contactMaterial.emissive.setHex(on?0x3d3720:0);led.material.color.setHex(registered?0x00b4c9:0x213a36);led.material.emissive.setHex(registered?0x004a50:0);wire.material.color.setHex(registered?0x00b4c9:0x44635b);};
 return {m,group,led,showContact};
}
export function buildKeyboardSpringStudy(){
 const {m,group,led,showContact}=inspectSwitch();
 const force=new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(-1.12,-.45,0),.1,0xd3b77e,.1,.055);group.add(force);
 return {group,allowZoom:true,eye:[3,2.5,7],parts:m.parts,defaults:{travel:0,stiffness:50},update(s){
  const travel=clamp(Number(s.travel)||0,0,4),stiffness=clamp(Number(s.stiffness)||50,20,90);m.update({travel});
  const f=stiffness*travel/100;force.visible=travel>0;force.setLength(Math.max(.05,f*.25),.10,.055);s.force=f;showContact(travel>=2);
 },reading:s=>Number(s.travel||0).toFixed(1)+'mm · 추가 힘 '+Number(s.force||0).toFixed(2)+' (상대값) · '+(s.travel>=4?'접점 닫힘 · 4mm 바닥 도달':s.travel>=2?'접점 닫힘 · 바닥에 닿기 전':'접점 열림'),
 annotations:[{text:'같은 스프링 · 아래 끝은 고정',object:m.parts.spring},{text:'2mm에서 접점 닫힘',object:m.parts.movingLeaf},{text:'입력 신호',object:led},{text:'스프링이 밀어 올리는 추가 힘',object:force}]};
}
export function buildKeyboardDebounceStudy(){
 const {m,group,led,showContact}=inspectSwitch();m.group.position.y=.45;
 const root=new T.Group();root.add(group);
 const board=new T.Mesh(new T.BoxGeometry(3.2,1.25,.055),new T.MeshStandardMaterial({color:0x142722,roughness:.9}));board.position.set(0,-1.23,.03);root.add(board);
 const startX=-1.40,endX=1.40,window=.05,rawY=-.82,filteredY=-1.38,high=.21;
 const raw=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xd4b582})),filtered=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0x00b4c9}));
 root.add(raw,filtered);
 for(const y of [rawY,filteredY]){const axis=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(startX,y,.08),new T.Vector3(endX,y,.08)]),new T.LineBasicMaterial({color:0x3d5149}));root.add(axis);}
 const cursor=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(startX,-1.68,.11),new T.Vector3(startX,-.51,.11)]),new T.LineBasicMaterial({color:0xe6e1cc}));root.add(cursor);
 const rawLabel=new T.Object3D(),filteredLabel=new T.Object3D(),endLabel=new T.Object3D();rawLabel.position.set(-1.4,-.57,.1);filteredLabel.position.set(-1.4,-1.13,.1);endLabel.position.set(1.37,-1.7,.1);root.add(rawLabel,filteredLabel,endLabel);
 function trace(line,key,delay,until){
  const p=[];for(let i=0;i<=200;i++){const time=i/200*window;if(time>until)break;const signal=debounceSample(time,delay)[key];p.push(new T.Vector3(startX+(endX-startX)*time/window,(key==='raw'?rawY:filteredY)+(signal?high:0),.10));}
  line.geometry.dispose();line.geometry=new T.BufferGeometry().setFromPoints(p);
 }
 let oldTraceKey='';
 const result={group:root,allowZoom:true,eye:[1.5,1.6,7],parts:m.parts,defaults:{debounce:5,time:0},advance(s,dt){s.time=Math.min(.05,(s.time||0)+dt*.012);if(s.time>=.05)s.running=false;},action(a,s){if(a==='press'){s.time=0;s.running=true;}},update(s){
  const time=clamp(Number(s.time)||0,0,.05),delay=clamp(Number(s.debounce)||5,1,15),signal=debounceSample(time,delay);
  m.update({travel:Math.min(2.2,time/.003*2.2),bounce:signal.raw?0:1});showContact(signal.raw,signal.filtered);
  cursor.position.x=(endX-startX)*time/window;const key=Math.round(time*4000)+'/'+delay;if(key!==oldTraceKey){trace(raw,'raw',delay,time);trace(filtered,'filtered',delay,time);oldTraceKey=key;}
  s.raw=signal.raw;s.filtered=signal.filtered;s.registeredAt=.020+delay/1000;
 },reading:s=>(Number(s.time||0)*1000).toFixed(1)+'ms · 접점 '+(s.raw?'닫힘':'열림')+' · '+(s.filtered?'입력 1회 등록':'안정화 대기')+' · 최종 안정 뒤 '+s.debounce+'ms 확인',
 annotations:[{text:'원시 접점 · 짧게 여러 번 바뀜',object:rawLabel},{text:'안정화한 입력 · 한 번만 켜짐',object:filteredLabel},{text:'0 → 50ms · 관찰 속도는 느리게',object:endLabel}]};
 result.update({...result.defaults});return result;
}
