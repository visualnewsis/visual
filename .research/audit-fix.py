from pathlib import Path
import sys,re
r=Path(sys.argv[1])/'goodeasy'
def change(f,a,b):
 p=r/f;s=p.read_text(encoding='utf8');assert a in s,(f,a[:70]);p.write_text(s.replace(a,b),encoding='utf8')
def replace_function(f,name,new):
 p=r/f;s=p.read_text(encoding='utf8');a=s.index('export function '+name+'(');b=s.find('\nexport ',a+1);b=len(s) if b<0 else b;p.write_text(s[:a]+new+'\n'+s[b:],encoding='utf8')
(r/'assets/mechanism-checks.mjs').write_text('''// Educational invariants. No measured product calibration.
export function curtainWindow(cycle,fast=false){const t=Math.max(0,Math.min(1,cycle)),travel=.42,delay=fast?.12:.52,unit=x=>Math.max(0,Math.min(1,x));const first=1.8*unit(t/travel),second=-1.8+1.8*unit((t-delay)/travel);const low=Math.max(-.85,second+.9),high=Math.min(.85,first-.9);return {first,second,low,high,width:Math.max(0,high-low)};}
export function filmCycle(cycle){const index=Math.floor(Math.max(0,cycle)),phase=Math.max(0,cycle)-index,moving=phase>.65;return {index,phase,moving,exposed:phase>.12&&phase<.56,offset:moving?-(phase-.65)/.35*.9:0};}
const edges=[[.003,true],[.007,false],[.011,true],[.016,false],[.020,true]];
export function debounceSample(time,delayMs){let raw=false,since=0;for(const [t,on] of edges){if(time<t)break;raw=on;since=t;}return {raw,filtered:raw&&time-since>=delayMs/1000,since};}
export const crankX=angle=>Math.sin(angle)*1.4;
export const bowedDisplacement=phase=>{phase=((phase%1)+1)%1;return phase<.8?-.5+phase/.8: .5-(phase-.8)/.2;};
''',encoding='utf8')
f='assets/research-other.mjs'
p=r/f;s=p.read_text(encoding='utf8');s="import {curtainWindow,filmCycle,debounceSample,crankX,bowedDisplacement} from './mechanism-checks.mjs';\n"+s;p.write_text(s,encoding='utf8')
change(f,'Math.sin(t*6));','Math.sin(t*6*mode));')
replace_function(f,'buildBowContact', '''export function buildBowContact(){const group=new T.Group(),geo=new T.BufferGeometry(),positions=new Float32Array(129*3);geo.setAttribute('position',new T.BufferAttribute(positions,3));const line=new T.Line(geo,new T.LineBasicMaterial({color:0xddc28e}));group.add(line);const bow=part(group,'bow');rod(bow,[0,.65,-1.3],[0,.65,1.3],.025,M.ivory);tube(bow,[[.1,.8,-1.5],[.15,1,0],[.1,.8,1.5]],.04,M.darkWood);for(const x of [-2,2])box(group,.1,.6,.4,M.black,x,.3,0);return finish(group,s=>{const phase=((s.cycle??0)%1+1)%1,d=bowedDisplacement(phase)*.44;bow.position.z=(phase-.5)*.12;for(let i=0;i<=128;i++){const x=i/128;positions[i*3]=-2+4*x;positions[i*3+1]=.65;positions[i*3+2]=Math.sin(x*Math.PI)*d;}geo.attributes.position.needsUpdate=true;geo.computeBoundingSphere();geo.computeBoundingBox();s.caption=phase<.8?'붙음 · 현의 접촉점이 활 방향으로 끌립니다.':'미끄러짐 · 현의 접촉점이 빠르게 되돌아갑니다.';},{defaults:{cycle:0},advance(s,dt){s.cycle+=dt*.3;},reading:s=>s.caption});}''')
# Bridge rocks about a longitudinal axis near the treble foot; bassbar runs along X.
change(f,'const bass=box(group,.12,.3,1,M.darkWood,.18*scale,-.05,-.145*scale);','const bass=box(group,1.6,.13,.10,M.darkWood,.18*scale,.195,-.145*scale);')
change(f,'bridge.rotation.x=a;plate.rotation.x=a*.45;post.scale.y=1+a*.3;','bridge.rotation.x=a;bridge.position.y=Math.sin(a)*.145*scale;plate.rotation.x=a*.45;')
change(f,'top.position.y=ty+e*.65;back.position.y=by-e*.4;','top.position.y=ty+e*.65;back.position.y=by-e*.4;post.scale.y=1;')
# Replace decorative helix with an actual pin-in-slot crank linkage. It is labelled an example, not a product worm drive.
replace_function(f,'buildOscillation','''export function buildOscillation(){const group=new T.Group(),crank=part(group,'crank'),follower=part(group,'slotted follower');crank.position.set(0,.6,0);ring(crank,1.4,.03,M.steel,0,0,0,'z');rod(crank,[0,0,0],[0,1.4,0],.06,M.brass);const pin=cyl(crank,.11,.35,M.red,0,1.4,.17);pin.rotation.x=Math.PI/2;for(const x of [-.18,.18])box(follower,.10,3.2,.15,M.black,x,.6,.38);for(const y of [-1,2.2])box(follower,.46,.1,.15,M.black,0,y,.38);rod(group,[-2,-1.25,.38],[2,-1.25,.38],.07,M.steel);rod(follower,[0,-1.1,.38],[0,-1.1,1.5],.065,M.steel);const spool=cyl(follower,.5,.65,M.steel,0,-1.1,1.5);spool.rotation.z=Math.PI/2;return finish(group,s=>{crank.rotation.z=-(s.angle||0);follower.position.x=crankX(s.angle||0);},{defaults:{angle:0},eye:[3,3,8],advance(s,dt){s.angle+=dt;},reading:()=>`크랭크 핀 → 세로 슬롯 → 왕복 이동 · 회전 변환의 예시, 특정 릴의 내부 구조 아님`});}''')
# Alternate keyed plates do not all rotate as one block during drag slip.
change(f,'stack.rotation.y=slipping?s.time||0:0;','stack.children.forEach((o,i)=>o.rotation.y=slipping&&Math.floor(i/2)%2?(s.time||0):0);')
replace_function(f,'buildShutter','''export function buildShutter(){const group=new T.Group(),sensor=box(group,2.5,.06,1.7,blue,0,0,0),first=box(group,2.55,.05,1.8,M.black,0,.08,0),second=box(group,2.55,.05,1.8,M.black,0,.15,-1.8),ray=box(group,2.3,.02,1,signal,0,.045,0);return finish(group,s=>{const w=curtainWindow(s.cycle||0,!!s.fast);first.position.z=w.first;second.position.z=w.second;ray.visible=w.width>0;ray.scale.z=w.width;ray.position.z=(w.low+w.high)/2;s.openWidth=w.width;},{defaults:{cycle:0,fast:0},eye:[3,7,4],advance(s,dt){s.cycle=(s.cycle+dt*.25)%1;},reading:s=>`${s.fast?'狭い'.replace('狭い','좁은 틈이 이동하는 고속 노출'):'첫 막 개방 → 전체 노출 → 뒤 막 닫힘'} · 표시된 노출 폭 ${(s.openWidth/1.7*100).toFixed(0)}% · 시간 확대`});}''')
# Remove decorative off-axis disk from the teaching gate; show the actual covered window.
change(f,"const disk=mesh(shutter,new T.CylinderGeometry(.7,.7,.07,64,1,false,0,Math.PI*1.3),M.black);", "const disk=mesh(shutter,new T.CylinderGeometry(.7,.7,.07,64,1,false,0,Math.PI*1.3),M.black);shutter.visible=false;const cover=box(group,1.05,.04,.88,M.black,0,.25,0);const light=box(group,1.02,.02,.85,signal,0,.20,0);")
change(f,"const t=(s.cycle||0)%1;film.position.z=t>.65?-(t-.65)/.35*.9:0;shutter.rotation.y=t*TAU;const open=t>.12&&t<.56;", "const cycle=filmCycle(s.cycle||0),t=cycle.phase;film.position.z=cycle.offset;film.children.slice(1).forEach((o,i)=>o.material=(i-3+cycle.index)%2?ink:M.ivory);cover.visible=!cycle.exposed;light.visible=cycle.exposed;const open=cycle.exposed;")
change(f,'s.cycle=(s.cycle+dt*.3)%1;','s.cycle+=dt*.3;')
change(f,"wire=rod(group,[-.7,.1,0],[.7,.1,0],.025,M.brass)","wire=rod(group,[-.7,.1,0],[.7,.1,0],.025,M.brass)")
change(f,"const t=s.time||0,rawOn=t>.025?true:t>.003&&t<.007||t>.011&&t<.016||t>.020;const stable=t>(.025+s.debounce/1000);", "const t=s.time||0,signalState=debounceSample(t,s.debounce);const rawOn=signalState.raw,stable=signalState.filtered;")
change(f,'spring.scale.y=1-d*.5;cap.position.y=2-d*.85;','spring.scale.y=1-d*.5;spring.position.y=.2*(1-spring.scale.y);cap.position.y=2-d*.85;')
# At the displayed strike angle the felt surface must reach the string.
change(f,'rod(group,[1.5,1.8,-1],[1.5,1.8,1],.012,M.brass);','rod(group,[.3+1.2*Math.cos(1.1),.45+1.2*Math.sin(1.1)+.22,-1],[.3+1.2*Math.cos(1.1),.45+1.2*Math.sin(1.1)+.22,1],.012,M.brass);')
# MX reading must agree with its deliberately separated physical contact surfaces.
change('assets/quality-replacements.mjs',"(s.travel>=2?'접점 닫힘':'접점 열림')", "((s.explode||0)>.01?'분해 상태 · 접점 분리':s.travel>=2?'접점 닫힘':'접점 열림')")
# Motionwork's wheel and its pinion are rigid on the same shaft.
change('assets/research-watch.mjs','toothWheel(motion,15,.025,.75,.1,0,silver,false);','const intermediatePinion=toothWheel(motion,15,.025,.75,.1,0,silver,false);')
change('assets/research-watch.mjs','intermediate.rotation.y=a.minute/4;','intermediate.rotation.y=a.minute/4;intermediatePinion.rotation.y=intermediate.rotation.y;')
# Hairspring outer stud stays on the plate. Deformation is explicitly illustrative.
change('assets/research-watch.mjs','return {root,hair};','root.remove(hair);parent.add(hair);hair.position.copy(root.position);const rest=hair.geometry.attributes.position.array.slice();return {root,hair,update(angle){root.rotation.y=angle;const a=hair.geometry.attributes.position;for(let i=0;i<a.count;i++){const xx=rest[i*3],yy=rest[i*3+1],zz=rest[i*3+2],R=Math.hypot(xx,zz),v=angle*(1-clamp((R-.05)/.37));a.setXYZ(i,xx*Math.cos(v)-zz*Math.sin(v),yy,xx*Math.sin(v)+zz*Math.cos(v));}a.needsUpdate=true;hair.geometry.computeBoundingSphere();hair.geometry.computeBoundingBox();}};')
change('assets/research-watch.mjs','tr.b.root.rotation.y=esc.balance;','tr.b.update(esc.balance);')
change('assets/research-watch.mjs','b.root.rotation.y=p.balance;','b.update(p.balance);')
change('assets/research-watch.mjs','b.root.rotation.y=Math.cos(t*TAU/(period(I,k)/4))*.9*damping;b.hair.scale.setScalar(1+.04*Math.sin(t*4));','b.update(Math.cos(t*TAU/(period(I,k)/4))*.9*damping);')
# Physical exposure ratio stays exact; only the display clamps brightness.
change('assets/model.mjs','return clamp((2.8/aperture)**2*250/shutter,.15,3);','return (2.8/aperture)**2*250/shutter;')
change('assets/quality-camera.mjs','brightness=exposure(a,d)','brightness=Math.min(3,Math.max(.15,exposure(a,d)))')
# A normal rotary take-up and feed reel are not a counter-rotating pair in this illustrative path.
change('assets/quality-machines.mjs',"'GOODEASY / 16'","'GOODEASY'")
change('assets/quality-machines.mjs',"*(i?-1:1)","*1")
# Pedal state in the score preview may not animate unplayed hammer assemblies.
change('piano/scene.js','a.update(s?liveAction(s,time,snapshot.pedal):m,0,time);','a.update(s?liveAction(s,time,snapshot.pedal):{key:0,hammer:0,jack:0,damper:snapshot.pedal?1:0,vibration:0},0,time);')
print('Applied mechanism audit corrections')
