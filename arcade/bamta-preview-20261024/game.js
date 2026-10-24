import * as T from './vendor/three.module.min.js';
import {buildScene} from './scene.js?v=20261024-art3';
import {Mission,ROOMS,SPAWN,SEAT,CALL,onFloor} from './mission.js';
import {OfficeAudio} from './sound.js?v=20261024';
import {Dispatch,drawRoute} from './dispatch.js?v=20261024';
import {art} from './art.js?v=20261024-art3';
import {nextCoworkerLine} from './dialogue.js?v=20261024-art3';
const $=s=>document.querySelector(s),canvas=$('#game');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#112c2c');scene.fog=new T.Fog('#19332e',19,58);
scene.add(new T.HemisphereLight('#dce6e4','#5d625f',1.05));const sun=new T.DirectionalLight('#f2eee5',2.1);sun.position.set(-5,2.9,3);sun.target.position.set(1,0,-2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:13,bottom:-13,near:.1,far:30});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
const world=buildScene(scene,art);world.colliders.push({x:7,z:4.5,w:.12,d:11});
const colleagues=[world.woman,world.coworker,...world.workers];
const camera=new T.PerspectiveCamera(70,1,.045,80);camera.rotation.order='YXZ';scene.add(camera);
const mission=new Mission(),keys=new Set(),player={...SPAWN,pitch:0},dispatch=new Dispatch($),soundscape=new OfficeAudio();let running=false,paused=false,elapsed=0,swingTime=0,toastUntil=0,action='',sound=false,effects=!matchMedia('(prefers-reduced-motion: reduce)').matches,headBob=0,lastStep=0;
const stick={x:0,y:0,id:null},look={id:null,x:0,y:0};let womanStep=0,talkTarget=null,talkUntil=0;
const paper=new T.Group();camera.add(paper);paper.position.set(.34,-.34,-.55);paper.rotation.z=-.35;paper.scale.setScalar(.78);
const pc=document.createElement('canvas');pc.width=256;pc.height=512;const px=pc.getContext('2d');px.fillStyle='#d8d3bd';px.fillRect(0,0,256,512);px.fillStyle='#555950';px.font='bold 28px serif';px.fillText('NEWSIS',12,55);for(let y=75;y<500;y+=12){px.fillRect(10,y,100,2);px.fillRect(125,y,110,2);}const pt=new T.CanvasTexture(pc);pt.colorSpace=T.SRGBColorSpace;
const roll=new T.Mesh(new T.CylinderGeometry(.048,.055,.64,20),new T.MeshStandardMaterial({map:pt,roughness:.9}));roll.position.y=.2;paper.add(roll);
for(const [y,r,h,color] of [[-.12,.07,.18,'#d0a78c'],[-.3,.085,.25,'#e5e7de']]){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,14),new T.MeshStandardMaterial({color}));m.position.y=y;paper.add(m);}
paper.traverse(o=>{if(o.isMesh){o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=20;}});
const pellet=new T.Mesh(new T.IcosahedronGeometry(.065,1),new T.MeshStandardMaterial({color:'#ede6d1',flatShading:true}));pellet.visible=false;scene.add(pellet);
$('#shoot').onclick=()=>{pause(false);mission.act('shoot');$('#choice').hidden=true;drama('PAPER SHOT','신문 한 방. 퇴근 한 판.','국장이 종이를 펼치는 사이…');soundscape.fx('paper');};$('#obey').onclick=()=>{pause(false);mission.act('obey');$('#choice').hidden=true;canvas.focus();};
const red=new T.PointLight('#ff170b',0,10);red.position.set(22.5,2.6,-27.6);scene.add(red);
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();paper.scale.setScalar(camera.aspect<.9?.42:.62);}addEventListener('resize',resize);resize();
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=elapsed+3;}
function tone(freq=500,duration=.2){soundscape.tone(freq,duration);}
function drama(k,t,b){$('#drama-kicker').textContent=k;$('#drama-title').textContent=t;$('#drama-body').textContent=b;$('#drama').classList.toggle('show',!!t);}
function reset(){mission.reset();dispatch.reset();headBob=0;lastStep=0;talkTarget=null;talkUntil=0;colleagues.forEach(n=>n.talkIndex=0);Object.assign(player,SPAWN,{pitch:0});keys.clear();stick.x=stick.y=0;womanStep=0;world.woman.group.position.set(10.4,0,-4);world.boss.group.visible=false;world.boss.group.rotation.x=0;world.boss.group.position.set(22.5,0,-26.7);$('#ending').hidden=true;$('#choice').hidden=true;pellet.visible=false;$('#cover').hidden=true;$('#hud').hidden=false;running=true;pause(false);drama('','','');toast('19:48. 신문 챙겼다. 오른쪽 통로로 자리를 빠져나가자.');}
function pause(value){if(value&&!$('#choice').hidden)return;paused=value;keys.clear();stick.x=stick.y=0;soundscape.setActive(!value);$('#pause-panel').hidden=!value;if(value){document.exitPointerLock?.();$('#journal-line').textContent=`발견한 이야기 ${dispatch.memo.size} / 3 · 책상, 복사기, 화이트보드를 살펴보세요.`;$('#resume').focus();}else canvas.focus();}
$('#start').disabled=false;$('#start').textContent='퇴근하러 가기 ↗';$('#start').onclick=reset;$('#restart').onclick=reset;$('#again').onclick=reset;$('#pause').onclick=()=>pause(true);$('#resume').onclick=()=>pause(false);$('#pause').setAttribute('aria-label','일시정지');
new ResizeObserver(resize).observe(canvas);
// The shared header expands in normal flow: shrink the stage instead of clipping controls.
const headerShell=document.querySelector('.cgh-shell');
if(headerShell)new ResizeObserver(entries=>{$('#stage').style.height=`calc(100dvh - ${entries[0].contentRect.height}px)`;}).observe(headerShell);
$('#sound').onclick=()=>{sound=!sound;if(!soundscape.toggle(sound)){sound=false;toast('이 브라우저에서는 소리를 켤 수 없습니다.');}if(sound)tone(650,.15);$('#sound').textContent=`소리 ${sound?'ON':'OFF'}`;$('#sound').setAttribute('aria-pressed',sound);};
function setEffects(){$('#effects').textContent=`화면 효과 ${effects?'ON':'OFF'}`;$('#effects').setAttribute('aria-pressed',effects);$('#stage').setAttribute('data-effects',String(effects));}setEffects();$('#effects').onclick=()=>{effects=!effects;setEffects();};
function swing(){if(!running||paused||swingTime>0||['choice','escape','director','closing'].includes(mission.phase))return;swingTime=.48;soundscape.fx('paper');const near=[...colleagues,world.boss].find(n=>n.group.visible&&Math.hypot(n.group.position.x-player.x,n.group.position.z-player.z)<2);if(near){near.flinch=.5;toast(near===world.boss?'국장: 신문은 읽으라고 있는 겁니다.':'앗, 놀랐잖아. 신문 좀 내려 봐.');}}
function nearestCoworker(){return colleagues.filter(n=>n.group.visible).map(n=>({person:n,distance:Math.hypot(n.group.position.x-player.x,n.group.position.z-player.z)})).sort((a,b)=>a.distance-b.distance).find(n=>n.distance<1.8)?.person;}
function interact(){if(!running||paused)return;if(action==='call'){mission.act('call');soundscape.fx('button');toast('엘리베이터를 불렀다.');}else if(action==='desk')mission.act('desk');else if(action==='board')toast('문 안쪽으로 들어가세요.');else if(action==='boardnote'){dispatch.remember('board');toast('만든사람 안재현 · 떠든사람 최승훈, 성주현');}else if(action==='note'){dispatch.remember('desk');toast('“오늘은 정시 퇴근.” 모니터 옆에 붙여 둔 메모다.');}else if(action==='printer'){dispatch.remember('printer');soundscape.noiseHit(740,.4,.18);toast('인쇄 대기 문서 3건. A4 용지함은 아직 넉넉하다.');}else if(action==='talk'){const person=nearestCoworker();if(person){talkTarget=person;talkUntil=elapsed+4;toast('동료: '+nextCoworkerLine(person));}}}
$('#interact').onclick=interact;$('#swing').onclick=swing;
addEventListener('keydown',e=>{if(!running)return;if(e.code==='Escape'&&$('#choice').hidden){pause(!paused);return;}if(e.target.closest('button,a'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='KeyE')interact();if(!e.repeat&&e.code==='Space')swing();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(running)pause(true);});
canvas.addEventListener('pointerdown',e=>{if(!running||paused)return;canvas.focus();if(e.pointerType==='mouse'){if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.()?.catch?.(()=>{});return;}look.id=e.pointerId;look.x=e.clientX;look.y=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||look.id!==e.pointerId)return;player.yaw-=(e.clientX-look.x)*.004;player.pitch=T.MathUtils.clamp(player.pitch-(e.clientY-look.y)*.003,-1.15,1.15);look.x=e.clientX;look.y=e.clientY;});for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{if(e.pointerType!=='mouse')look.id=null;});canvas.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||!running||paused)return;player.yaw-=e.movementX*.004;player.pitch=T.MathUtils.clamp(player.pitch-e.movementY*.003,-1.15,1.15);});
const pad=$('#stick');function moveStick(e){const r=pad.getBoundingClientRect();stick.x=T.MathUtils.clamp((e.clientX-r.left-r.width/2)/35,-1,1);stick.y=T.MathUtils.clamp((e.clientY-r.top-r.height/2)/35,-1,1);pad.firstElementChild.style.transform=`translate(${stick.x*25}px,${stick.y*25}px)`;}pad.onpointerdown=e=>{stick.id=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);};pad.onpointermove=e=>{if(e.pointerId===stick.id)moveStick(e);};for(const type of ['pointerup','pointercancel'])pad.addEventListener(type,()=>{stick.id=null;stick.x=stick.y=0;pad.firstElementChild.style.transform='';});
function free(x,z){if(!onFloor(x,z))return false;for(const o of world.colliders)if(Math.abs(x-o.x)<o.w/2+.23&&Math.abs(z-o.z)<o.d/2+.23)return false;if(mission.door<.8&&x>20.8&&x<24.2&&Math.abs(z+28)<.3)return false;return true;}
function move(dt){player.yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.8;player.pitch=T.MathUtils.clamp(player.pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt,-1.15,1.15);let x=stick.x+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=stick.y+(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}const speed=(keys.has('ShiftLeft')?4:2.5)*dt;const dx=(x*Math.cos(player.yaw)+z*Math.sin(player.yaw))*speed,dz=(-x*Math.sin(player.yaw)+z*Math.cos(player.yaw))*speed;if(free(player.x+dx,player.z))player.x+=dx;if(free(player.x,player.z+dz))player.z+=dz;return len>.1;}
function idleActors(t){
  for(const npc of [...colleagues,world.boss]){
    npc.body.position.y=npc.seatedY+(effects?Math.sin(t*1.7+npc.base.x)*.004:0);
    npc.head.rotation.x=npc.seated?.10:0;
    npc.head.rotation.y=effects?Math.sin(t*.65+npc.base.x)*.022:0;
    if(npc.seated)for(let i=0;i<2;i++){
      npc.hands[i].rotation.x=effects?Math.sin(t*10+i*2+npc.base.x)*.045:0;
      npc.forearms[i].rotation.x=-.57+(effects?Math.sin(t*7+i*2)*.015:0);
    }
  }
}
function updateNPC(dt){
  idleActors(elapsed);
  const n=world.woman,path=[[7.7,-4.6],[3,-4.6],[2,-2.5]],talking=elapsed<talkUntil;
  if(womanStep<path.length&&!(talking&&talkTarget===n)){
    const [x,z]=path[womanStep],dx=x-n.group.position.x,dz=z-n.group.position.z,d=Math.hypot(dx,dz);
    if(d<.08)womanStep++;
    else{n.group.position.x+=dx/d*dt*.62;n.group.position.z+=dz/d*dt*.62;n.group.rotation.y=Math.atan2(dx,dz);n.legs.forEach((l,i)=>l.rotation.x=Math.sin(elapsed*5+i*Math.PI)*.24);n.arms.forEach((l,i)=>l.rotation.x=-Math.sin(elapsed*5+i*Math.PI)*.15);}
  }else{n.legs.forEach(l=>l.rotation.x=T.MathUtils.damp(l.rotation.x,0,8,dt));n.arms.forEach(l=>l.rotation.x=T.MathUtils.damp(l.rotation.x,0,8,dt));}
  for(const npc of [...colleagues,world.boss]){
    npc.flinch=Math.max(0,npc.flinch-dt);npc.group.rotation.z=Math.sin(npc.flinch*20)*npc.flinch*.10;
    if(talking&&talkTarget===npc){
      const yaw=Math.atan2(player.x-npc.group.position.x,player.z-npc.group.position.z),delta=Math.atan2(Math.sin(yaw-npc.group.rotation.y),Math.cos(yaw-npc.group.rotation.y));
      if(!npc.seated)npc.group.rotation.y+=delta*Math.min(1,dt*3);
      npc.head.rotation.y=T.MathUtils.clamp(delta,-.6,.6);npc.head.rotation.x=0;
    }
  }
  if(mission.phase==='return')world.boss.group.position.x=T.MathUtils.damp(world.boss.group.position.x,25,3,dt);
}
function prompt(){const distance=p=>Math.hypot(player.x-p.x,player.z-p.z);action='';let label='';if(mission.phase==='outbound'&&distance(CALL)<2){action='call';label='엘리베이터 호출';}else if(mission.phase==='return'&&distance(SEAT)<1.6){action='desk';label='내 자리에 앉기';}else if(mission.phase==='boarding'&&player.z<-25){action='board';label='엘리베이터 안으로';}else if(distance({x:1.5,z:-5})<2){action='boardnote';label='화이트보드 읽기';}else if(distance({x:0,z:5.3})<1.4){action='note';label='내 책상의 메모 읽기';}else if(distance({x:5.75,z:-3.3})<1.65){action='printer';label='복사기 살펴보기';}else if(nearestCoworker()){action='talk';label='동료와 한마디';}$('#interact').hidden=!action;$('#interact').textContent=`E · ${label}`;}
function map(){drawRoute($('#map').getContext('2d'),player,mission,ROOMS,effects?elapsed:0);}
const games=[['puzzle','조각 사진관','assets/thumbnails/puzzle-safe-v2-360x240.jpg'],['chagok','차곡차곡','chagok/assets/thumbnail-360x240-v2.jpg'],['omok','뉴스 오목','assets/thumbnails/news-omok-safe-v2-360x240.jpg'],['mole','이슈 훔친 두더지','mole/assets/thumbnail-360x240.jpg'],['brickrunch','벽크크','brickrunch/assets/thumbnail-yodel-v2-360x240.jpg'],['minesweeper','가짜뉴스 지뢰찾기','minesweeper/assets/thumbnail-360x240.jpg'],['freecell','카드 프리셀','freecell/assets/thumbnail-card-v2-360x240.jpg'],['words','낱말수선소','assets/thumbnails/words-safe-v2-360x240.jpg'],['dododok','넌 내 도도독','dododok/assets/thumbnail-360x240.jpg'],['chungmuman','충무맨','assets/thumbnails/chungmuman-safe-v2-360x240.jpg'],['output','제목있음','assets/thumbnails/headline-safe-v2-360x240.jpg'],['tarot','충무로 타로#','assets/thumbnails/tarot-safe-v2-360x240.jpg']];
for(const [path,name,img]of games){const a=document.createElement('a');a.href=`../${path}/`;const image=document.createElement('img');image.src=`../${img}`;image.alt='';image.loading='lazy';const b=document.createElement('b');b.textContent=name;a.append(image,b);$('#games').append(a);}
let last=performance.now(),lastBeep=0;
const timeLabel=total=>`${String(Math.floor(total/60)).padStart(2,'0')}:${String(Math.floor(total%60)).padStart(2,'0')}`;
function finish(phase){
  const escaped=phase==='escaped',stats=dispatch.stats(mission.total);
  $('#ending-title').textContent=escaped?'회사 탈출 성공':'탈출은 실패';
  $('#ending-title').style.color=escaped?'#c6ef8c':'';
  $('#ending-kicker').textContent=escaped?'MISSION PASSED / OFF THE CLOCK':'MISSION FAILED / BACK TO DESK';
  $('#ending-body').textContent=escaped?'종이는 국장님께. 퇴근은 나에게. 내일 일은 내일 생각하자.':'몸은 회사에 있어도, 잠깐 놀 수는 있으니까.';
  $('#stat-time').textContent=timeLabel(stats.seconds);$('#stat-steps').textContent=String(Math.round(stats.distance/.68));$('#stat-memos').textContent=`${stats.memos} / 3`;
  $('#ending').setAttribute('data-result',escaped?'escaped':'returned');$('#ending').hidden=false;$('#hud').hidden=true;running=false;
  document.exitPointerLock?.();$('#ending').focus();soundscape.fx(escaped?'escape':'back');
}
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(running&&!paused){
    elapsed+=dt;
    const cinematic=['closing','director','choice','escape'].includes(mission.phase);
    const beforeX=player.x,beforeZ=player.z;
    const walking=cinematic?false:move(dt);
    const moved=Math.hypot(player.x-beforeX,player.z-beforeZ)>.0001;
    if(cinematic){
      const delta=Math.atan2(Math.sin(Math.PI-player.yaw),Math.cos(Math.PI-player.yaw));player.yaw+=delta*Math.min(1,dt*3);player.pitch*=Math.max(0,1-dt*4);
    }
    mission.tick(dt);
    if(mission.phase==='boarding'&&player.z<-29&&player.x>21.3&&player.x<23.7)mission.act('board');
    for(const phase of mission.drain()){
      if(phase==='boarding'){toast('엘리베이터가 도착했다. 퇴근까지, 이제 한 걸음.');soundscape.fx('ding');}
      if(phase==='closing')drama('ALMOST FREE','회사 탈출 성공…?','문이 닫힙니다.');
      if(phase==='director'){world.boss.group.visible=true;drama('EMERGENCY','국장이 나타났다!','“어디 가세요? 사무실로 돌아가세요.”');soundscape.fx('alarm');}
      if(phase==='choice'){drama('','','');document.exitPointerLock?.();$('#choice').hidden=false;$('#shoot').focus();}
      if(phase==='return'){drama('','','');toast('국장: 어디 가세요? 자리로 돌아갑시다.');}
      if(phase==='finished'||phase==='escaped')finish(phase);
    }
    $('#stage').setAttribute('data-phase',mission.phase);
    world.leftDoor.position.x=-.72-mission.door*1.45;world.rightDoor.position.x=.72+mission.door*1.45;
    world.callPanel.setCalled(['calling','boarding'].includes(mission.phase));
    updateNPC(dt);
    if(world.boss.group.visible)world.boss.arms[0].rotation.x=T.MathUtils.damp(world.boss.arms[0].rotation.x,mission.phase==='director'?-.65:0,4,dt);
    pellet.visible=mission.phase==='escape'&&mission.time<.65;
    if(pellet.visible){pellet.position.set(22.5,1.4,-29+Math.min(1,mission.time/.65)*2.3);pellet.rotation.x+=dt*14;}
    if(mission.phase==='escape')world.boss.group.rotation.x=Math.sin(Math.min(1,mission.time)*Math.PI)*.16;
    const alarm=mission.phase==='director';$('#alarm').className=alarm?(effects?'on':'steady'):'';
    red.intensity=alarm?(effects?5+4*Math.sin(elapsed*4):3):0;
    if(alarm&&elapsed-lastBeep>.9){soundscape.fx('alarm');lastBeep=elapsed;}
    const room=[...ROOMS].reverse().find(r=>player.x>=r.x0&&player.x<=r.x1&&player.z>=r.z0&&player.z<=r.z1)||ROOMS[0];
    soundscape.setZone(room.id);
    if(walking&&moved&&elapsed-lastStep>(keys.has('ShiftLeft')?.32:.46)){soundscape.fx('step');lastStep=elapsed;}
    $('#objective').textContent=mission.phase==='return'?'사무실로 돌아가라':'회사에서 탈출하라';
    $('#location').textContent=room.name+' · 12F';$('#clock').textContent=timeLabel(mission.total);
    dispatch.update(player,mission,room.id,toast);prompt();map();
    swingTime=Math.max(0,swingTime-dt);const sw=Math.sin(swingTime/.48*Math.PI);
    paper.rotation.z=-.35+sw*1.4;paper.position.x=.34*Math.min(1,camera.aspect/1.25)-sw*.4;paper.position.y=-.34+(walking&&effects?Math.sin(elapsed*9)*.015:0)+sw*.13;
    headBob=T.MathUtils.damp(headBob,walking&&moved&&effects?Math.sin(elapsed*9)*.018:0,12,dt);
    const targetFov=cinematic&&effects?59:70;camera.fov=T.MathUtils.damp(camera.fov,targetFov,3,dt);camera.updateProjectionMatrix();
    if(elapsed>toastUntil)$('#toast').classList.remove('show');
  }
  if(!running&&!$('#cover').hidden){
    idleActors(now*.001);
    const drift=effects?Math.sin(now*.00008)*.075:0;camera.position.set(6.2,camera.aspect<.9?1.85:2.05,8.8);camera.rotation.set(camera.aspect<.9?-.24:-.12,.62+drift,0);paper.visible=false;
  }else{
    const portraitEncounter=camera.aspect<.9&&['director','choice'].includes(mission.phase);
    camera.position.set(player.x,1.67+headBob,player.z);camera.rotation.set(player.pitch+(portraitEncounter?-.12:0),player.yaw,effects?headBob*.13:0);paper.visible=true;
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);


