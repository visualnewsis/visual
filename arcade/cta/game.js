import * as THREE from './vendor/three.module.min.js';
import { WORLD } from './world.js';
import { buildArchitecture } from './architecture.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setClearColor('#9fbdce');
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background=new THREE.Color('#9fbdce');
scene.fog = new THREE.Fog('#b9c9cc',28,100);
const camera = new THREE.PerspectiveCamera(65,1,.1,110);
camera.rotation.order='YXZ';
camera.position.set(WORLD.spawn.x,1.7,WORLD.spawn.z);
scene.add(new THREE.HemisphereLight('#cee5f6','#6a6658',1.75));
const sun = new THREE.DirectionalLight('#ffd7a3',2.7);sun.position.set(-12,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:75});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;scene.add(sun);
const materials = new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);}
const boxGeometry=new THREE.BoxGeometry(1,1,1);
function box(x,y,z,w,h,d,color,parent=scene){const mesh=new THREE.Mesh(boxGeometry,material(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
const {colliders:solids}=buildArchitecture(scene);
function sign(text,x,y,z,rotation=0){
  const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');
  ctx.fillStyle='#d6e8ab';ctx.fillRect(0,0,512,160);ctx.fillStyle='#263a30';ctx.font='bold 48px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,100);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4,1.25),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;return mesh;
}
const gate=box(0,1.3,-16,5,2.6,.3,'#666e60');
const gateCollider={x:0,z:-16,w:5,d:.3};solids.push(gateCollider);
const reveals=WORLD.discoveries.map(d=>{
  const group=new THREE.Group();group.position.set(d.x,0,d.z);scene.add(group);group.visible=false;
  if(d.kind==='sign')group.add(sign(d.sign,-2.05,2.95,0,Math.PI/2));
  box(0,.02,0,.35,.025,.35,'#949f73',group);
  if(d.kind==='person'){
    box(0,.8,0,.55,1.25,.4,'#c6bb91',group);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.21,8,6),material('#a7876b'));head.position.set(0,1.65,0);group.add(head);
    box(-.17,.24,0,.18,.5,.24,'#39453d',group);box(.17,.24,0,.18,.5,.24,'#39453d',group);
  }else if(d.kind==='gate'){
    box(1.7,.48,.6,.5,.08,1.2,'#8f7956',group);
    box(1.93,.78,.6,.06,.55,1.2,'#8f7956',group);
    for(const z of [.16,1.04])box(1.7,.23,z,.4,.46,.06,'#414a42',group);
    const lamp=new THREE.PointLight('#ffe3a0',3,5,2);lamp.position.set(1.7,2.5,.6);group.add(lamp);
  }
  return {data:d,group,amount:0,found:false};
});
// Capture the actual surrounding facade colors once for glass and metal reflection.
const reflectionTarget=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});
const reflectionCamera=new THREE.CubeCamera(.1,100,reflectionTarget);
reflectionCamera.position.set(0,2,8);reflectionCamera.update(renderer,scene);
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromCubemap(reflectionTarget.texture).texture;
scene.environmentIntensity=.65;reflectionTarget.dispose();pmrem.dispose();
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
let active=false, yaw=0,pitch=0,progress=0,near=null,last=performance.now(),toastTimer;
const keys=new Set();const stick={x:0,y:0};
let audioContext,master,oscillator,soundOn=false;
function setupAudio(){
  if(audioContext)return;
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audioContext=new Audio();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);
  oscillator=audioContext.createOscillator();oscillator.type='triangle';oscillator.frequency.value=65;oscillator.connect(master);oscillator.start();
}
function updateAudio(time){if(!master)return;const d=WORLD.discoveries.find(d=>d.kind==='sound');const distance=Math.hypot(camera.position.x-d.x,camera.position.z-d.z);const found=reveals.some(r=>r.found&&r.data.kind==='sound');master.gain.setTargetAtTime(active&&soundOn&&found?Math.max(0,1-distance/18)*(.025+.012*Math.sin(time*12)):0,audioContext.currentTime,.1);}
function clearInput(){keys.clear();stick.x=stick.y=0;$('stick').firstElementChild.style.transform='';}
function pause(){active=false;clearInput();$('intro').hidden=false;$('start').textContent='다시 걷기 ↗';$('start').focus();}
$('start').onclick=()=>{active=true;$('intro').hidden=true;last=performance.now();canvas.focus();if(audioContext&&soundOn)audioContext.resume().catch(()=>{});};
$('pause').onclick=pause;
$('sound').onclick=()=>{try{setupAudio();if(!audioContext)throw new Error('Audio unavailable');soundOn=!soundOn;audioContext.resume().catch(()=>{});$('sound').textContent=soundOn?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(soundOn));}catch{$('sound').textContent='소리 지원 안 됨';}};
function talk(){if(!active||!near)return;$('dialog-text').textContent=near.dialogue;active=false;clearInput();$('dialog').hidden=false;$('close-dialog').focus();}
$('interact').onclick=talk;
$('close-dialog').onclick=()=>{$('dialog').hidden=true;active=true;canvas.focus();};
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'){if(!$('dialog').hidden){$('close-dialog').click();}else if(active)pause();return;}
  if(!active)return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight','KeyE'].includes(e.code)){e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)talk();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{if(active)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
let looking=null;
canvas.addEventListener('pointerdown',e=>{if(!active)return;looking={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!active||looking?.id!==e.pointerId)return;yaw-=(e.clientX-looking.x)*.004;pitch=Math.max(-1.15,Math.min(1.15,pitch-(e.clientY-looking.y)*.004));looking.x=e.clientX;looking.y=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{looking=null;});
let stickPointer=null;
function moveStick(e){const r=$('stick').getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/35,y=(e.clientY-r.top-r.height/2)/35;const length=Math.max(1,Math.hypot(x,y));stick.x=x/length;stick.y=y/length;$('stick').firstElementChild.style.transform=`translate(${stick.x*28}px,${stick.y*28}px)`;}
$('stick').addEventListener('pointerdown',e=>{if(!active)return;stickPointer=e.pointerId;$('stick').setPointerCapture(e.pointerId);moveStick(e);});
$('stick').addEventListener('pointermove',e=>{if(active&&e.pointerId===stickPointer)moveStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(event,()=>{stickPointer=null;stick.x=stick.y=0;$('stick').firstElementChild.style.transform='';});
function blocked(x,z){const area=WORLD.walkArea;return z<area.minZ||z>area.maxZ||Math.abs(x)>(z<area.plazaStart?area.plazaHalfWidth:area.alleyHalfWidth)||solids.some(b=>Math.abs(x-b.x)<b.w/2+.32&&Math.abs(z-b.z)<b.d/2+.32);}
function move(dx,dz){if(!blocked(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(!blocked(camera.position.x,camera.position.z+dz))camera.position.z+=dz;}
function discover(r){
  r.found=true;r.group.visible=true;progress+=r.data.weight;$('progress').textContent=progress;$('fill').style.width=`${progress}%`;
  $('phase').textContent=progress===10?WORLD.copy.limit:r.data.label;
  $('toast').textContent=`CHUNGMU-LOADING ${progress}% — ${r.data.text}${progress===10?' '+WORLD.copy.complete:''}`;
  $('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),6500);
  if(r.data.kind==='gate'){solids.splice(solids.indexOf(gateCollider),1);solids.push({x:r.data.x+1.7,z:r.data.z+.6,w:.5,d:1.2});}
}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error').textContent='그래픽 연결이 중단되었습니다. 페이지를 새로고침해 주세요.';$('start').disabled=true;});
let fpsTime=0,frames=0;
function frame(now){
  requestAnimationFrame(frame);const elapsed=(now-last)/1000;const dt=Math.min(elapsed,.05);last=now;
  if(document.hidden)return;
  if(active){
    yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.7;
    pitch=Math.max(-1.15,Math.min(1.15,pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt));
    let forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-stick.y;
    let side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+stick.x;
    const length=Math.max(1,Math.hypot(forward,side));forward/=length;side/=length;
    const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?6:3.3)*dt;
    move((-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed);
    for(const r of reveals)if(!r.found&&Math.hypot(camera.position.x-r.data.x,camera.position.z-r.data.z)<r.data.radius)discover(r);
    near=reveals.find(r=>r.found&&r.data.dialogue&&Math.hypot(camera.position.x-r.data.x,camera.position.z-r.data.z)<3.8)?.data;
    $('interact').hidden=!near;
    $('position').textContent=`${camera.position.x.toFixed(1)} · ${camera.position.z.toFixed(1)}`;
  }
  for(const r of reveals)if(r.found){r.amount=Math.min(1,r.amount+dt*1.5);r.group.scale.y=Math.max(.001,r.amount);}
  if(!solids.includes(gateCollider)){gate.position.y=Math.max(-1.5,gate.position.y-dt*2);}
  updateAudio(now/1000);camera.rotation.set(pitch,yaw,0);renderer.render(scene,camera);
  frames++;fpsTime+=elapsed;if(fpsTime>2){canvas.dataset.fps=String(Math.round(frames/fpsTime));canvas.dataset.drawCalls=String(renderer.info.render.calls);frames=0;fpsTime=0;}
}
requestAnimationFrame(frame);
