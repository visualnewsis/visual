import {playGramophoneStudy,readGramophoneStudy,stopGramophoneStudy,setGramophoneStudyVolume,gramophoneStudySignal} from '../assets/gramophone-study-audio.js?v=20261028-uxaudio2';
import {attachInspectControls} from '../assets/inspect-controls.js?v=20261029-release67';
import {stabilizeStage} from '../assets/stable-stage.js?v=20261027-detail1';
import {Playback,speedFacts,clamp} from './playback.js?v=20261029-release67';
import {GramophoneAudio} from './audio.js?v=20261028-uxaudio2';
const $=id=>document.getElementById(id),clock=new Playback(),comparisonClock=new Playback(),audio=new GramophoneAudio();
let model,stage,motor,motorStage,comparison=false,comparisonEnd=0,busy=false,groovePlaying=false,diaphragmPlaying=false,previous=performance.now(),visualTime=0,lastText=0,motorRunning=false,motorAngle=0,crankDisplay=0;
const grooveOwner=Symbol('expanded-groove'),diaphragmOwner=Symbol('expanded-soundbox');let grooveRequest=0,diaphragmRequest=0,heroIntent=0;
const visible=new Set();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target)),{rootMargin:'120px'});
for(const id of ['gramophone','motor-canvas','groove-canvas','soundbox-canvas'])observer.observe($(id));
$('governor-rpm').addEventListener('input',()=>{$('governor-value').textContent=$('governor-rpm').value+' rpm';});
$('motor-run').addEventListener('click',()=>{motorRunning=!motorRunning;if(motorRunning&&Number($('governor-rpm').value)===0){$('governor-rpm').value='78';$('governor-value').textContent='78 rpm';}$('motor-run').textContent=motorRunning?'움직임 멈추기':'모터 움직임 보기';$('motor-run').setAttribute('aria-pressed',String(motorRunning));});
function status(message){$('status').textContent=message;}
function stopComparison(){if(comparison){audio.stop();comparisonClock.pause(audio.now());comparison=false;}$('compare-play').textContent='이 속도로 듣기';$('compare-play').setAttribute('aria-pressed','false');}
function pause(message,lift=false){heroIntent++;stopComparison();lift?clock.lift(audio.now()):clock.pause(audio.now());audio.stop();$('needle').textContent=clock.needleDown?'바늘 올리기':'바늘 내리기';$('needle').setAttribute('aria-pressed',String(clock.needleDown));$('brake').textContent='회전 재개';$('brake').disabled=!clock.needleDown;if(message)status(message);}
async function lower(resume=false){if(busy)return;if(clock.needleDown&&!resume){pause('바늘을 올렸습니다. 이 체험에서는 판도 함께 멈춥니다.',true);return;}const intent=++heroIntent;stopGramophoneStudy();stopGroove();busy=true;try{await audio.unlock();if(document.hidden||intent!==heroIntent)return;if(audio.context.state!=='running'){status('소리를 켜지 못했습니다. 바늘 내리기를 다시 눌러주세요.');return;}audio.context.onstatechange=()=>{if(audio.context.state!=='running'&&(clock.playing||comparison))pause('오디오가 중단되어 멈췄습니다. 회전 재개로 이어서 들을 수 있습니다.');};if(clock.position>=clock.duration)clock.reset(audio.now());if(clock.reserve<=0){status('태엽을 먼저 감아주세요.');return;}stopComparison();audio.stop();if(clock.start(audio.now())){audio.play(clock.position,clock.rpm);audio.volume(Number($('volume').value));$('needle').textContent='바늘 올리기';$('needle').setAttribute('aria-pressed','true');$('brake').textContent='회전 멈추기';$('brake').disabled=false;status('바늘이 홈을 따라갑니다. 속도를 바꿔 들어보세요.');}}catch(error){pause(error.message||'소리를 켜지 못했습니다. 바늘 내리기를 다시 눌러주세요.');}finally{busy=false;}}
$('needle').addEventListener('click',()=>lower());
$('brake').addEventListener('click',()=>clock.playing?pause('판을 멈췄습니다. 바늘은 홈에 남아 있습니다.'):lower(true));
for(const id of ['wind','motor-wind'])$(id).addEventListener('click',()=>{clock.wind(audio.now());status('태엽을 감았습니다. 태엽 잔량 '+Math.round(clock.reserve*100)+'%.');updateText();});
$('restart').addEventListener('click',()=>{pause();clock.reset(audio.now());$('brake').disabled=true;$('needle').textContent='바늘 내리기';$('needle').setAttribute('aria-pressed','false');status('바늘이 처음 위치로 돌아왔습니다. 내려서 다시 들어보세요.');updateText();});
$('rpm').addEventListener('input',e=>{clock.speed(Number(e.target.value),audio.now());if(clock.playing)audio.rate(clock.rpm);$('rpm-value').textContent=clock.rpm+' rpm';updateText();});
$('volume').addEventListener('input',e=>audio.volume(Number(e.target.value)));
$('explore').addEventListener('click',()=>{stopComparison();const s=clock.capture(audio.now());window.GoodeasyMusicRecord={...s};window.dispatchEvent(new CustomEvent('goodeasy:record',{detail:{record:{...s},step:0}}));$('record').textContent='방금 관찰한 순간 · '+s.rpm+' rpm · 기준 대비 '+s.ratio.toFixed(2)+'배 · 선율 '+s.position.toFixed(1)+'초 지점 · 바깥에서 안쪽으로 '+Math.round(s.progress*100)+'%';$('compare-rpm').value=String(s.rpm);compareFacts();$('groove-position').value=String(s.progress);syncGroove();});
function stopGroove(){grooveRequest++;groovePlaying=false;stopGramophoneStudy(grooveOwner);$('groove-play').setAttribute('aria-pressed','false');$('groove-play').textContent='소리와 함께 관찰';}
$('groove-play').addEventListener('click',async()=>{
 if(groovePlaying){stopGroove();return;}
 const ticket=++grooveRequest;groovePlaying=true;$('groove-play').setAttribute('aria-pressed','true');$('groove-play').textContent='소리 준비 중…';
 const position=Number($('groove-position').value)>=.999?0:Number($('groove-position').value)*24;if(position===0)$('groove-position').value='0';
 const result=await playGramophoneStudy(grooveOwner,{position,rate:.5,loop:false,volume:Number($('amplitude').value)*.22});
 if(ticket!==grooveRequest)return;
 if(result.state!=='running'){stopGroove();$('groove-reading').textContent='소리를 켜지 못했습니다. 다시 눌러주세요.';return;}
 $('groove-play').textContent='소리·움직임 멈추기';
});
window.addEventListener('goodeasy-gramophone-study-start',e=>{pause();if(e.detail.owner!==grooveOwner)stopGroove();if(e.detail.owner!==diaphragmOwner)stopDiaphragm();});
const grooveVisibility=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting)stopGroove();},{threshold:0});
grooveVisibility.observe($('groove-canvas'));
function stopDiaphragm(){diaphragmRequest++;diaphragmPlaying=false;stopGramophoneStudy(diaphragmOwner);$('diaphragm-play').setAttribute('aria-pressed','false');$('diaphragm-play').textContent='소리와 함께 진동판 관찰';}
$('diaphragm-play').addEventListener('click',async()=>{
 if(diaphragmPlaying){stopDiaphragm();return;}
 $('link-groove').checked=false;const ticket=++diaphragmRequest;diaphragmPlaying=true;$('diaphragm-play').setAttribute('aria-pressed','true');$('diaphragm-play').textContent='소리 준비 중…';
 const saved=readGramophoneStudy(diaphragmOwner),position=saved.position>=24?0:saved.position;
 const result=await playGramophoneStudy(diaphragmOwner,{position,rate:.5,volume:.22});
 if(ticket!==diaphragmRequest)return;
 $('soundbox-canvas').dataset.audioState=result.state;
 if(result.state!=='running'){stopDiaphragm();return;}
 $('diaphragm-play').textContent='소리·진동판 멈추기';
});
const soundboxVisibility=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting)stopDiaphragm();},{threshold:0});soundboxVisibility.observe($('soundbox-canvas'));
$('groove-position').addEventListener('input',()=>{stopGroove();syncGroove();});
$('diaphragm').addEventListener('input',()=>{$('link-groove').checked=false;stopDiaphragm();});
function compareFacts(){const rpm=Number($('compare-rpm').value),f=speedFacts(rpm);$('compare-value').textContent=rpm+' rpm';$('ratio').textContent=f.ratio.toFixed(2)+'×';$('pitch').textContent=(f.semitones>0?'+':'')+f.semitones.toFixed(2)+' 반음';$('duration').textContent=f.duration.toFixed(1)+'초';}
$('compare-rpm').addEventListener('input',()=>{stopComparison();compareFacts();});
$('compare-play').addEventListener('click',async()=>{if(busy)return;if(comparison){pause();return;}const intent=++heroIntent;stopGramophoneStudy();stopGroove();busy=true;try{await audio.unlock();if(document.hidden||intent!==heroIntent)return;if(audio.context.state!=='running'){status('소리를 켜지 못했습니다. 다시 눌러주세요.');return;}audio.context.onstatechange=()=>{if(audio.context.state!=='running'&&(clock.playing||comparison))pause('오디오가 중단되어 멈췄습니다.');};pause('같은 선율을 다른 속도로 비교합니다. 첫 체험의 기록은 유지됩니다.');const rpm=Number($('compare-rpm').value);comparisonClock.reset(audio.now());comparisonClock.reserve=1;comparisonClock.speed(rpm,audio.now());comparisonClock.start(audio.now());audio.play(0,rpm);audio.volume(Number($('volume').value));comparisonEnd=audio.now()+speedFacts(rpm).duration;comparison=true;$('compare-play').textContent='비교 멈추기';$('compare-play').setAttribute('aria-pressed','true');}catch(e){status(e.message);}finally{busy=false;}});
window.addEventListener('blur',()=>{pause('창을 벗어나 재생을 멈췄습니다.');stopGroove();stopDiaphragm();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause('화면을 벗어나 재생을 멈췄습니다. 회전 재개로 이어서 들어보세요.');stopGroove();stopDiaphragm();}});
window.addEventListener('pagehide',()=>{pause();stopGroove();stopDiaphragm();});
function updateText(){const time=clock.read(audio.now());$('elapsed').textContent='선율 위치 00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:24 · 남은 시간 '+(Math.min(clock.duration-time,clock.reserve*90)/(clock.rpm/78)).toFixed(1)+'초';$('reserve').textContent='태엽 '+Math.round(clock.reserve*100)+'%';$('motor-reading').textContent='첫 체험 태엽 '+Math.round(clock.reserve*100)+'% · 관찰 모터 '+$('governor-rpm').value+' rpm · '+(Number($('governor-rpm').value)>=78?'원심추가 벌어져 디스크가 마찰 패드에 닿습니다.':'패드와 디스크 사이가 벌어져 있습니다.');}
async function load3D(){try{const [{T,materials,makeStage},{buildGramophone}]=await Promise.all([import('../assets/quality-kit.js?v=20261028-craft7'),import('./gramophone-model.js?v=20261029-release67')]);model=buildGramophone(T,materials);stage=makeStage($('gramophone'));stage.setModel(model,[-5,4.3,7]);const fit=stage.fit.bind(stage);stage.fit=()=>{const ok=fit();if(ok){const ratio=innerWidth>=1000 ? .72 : .82;stage.camera.position.sub(stage.target).multiplyScalar(ratio).add(stage.target);stage.camera.lookAt(stage.target);stage.camera.updateMatrixWorld();}return ok;};stabilizeStage(stage);const heroInspect=attachInspectControls(stage,$('gramophone'),{label:'축음기 관찰'});const close=document.createElement('button');close.type='button';close.textContent='사운드박스 가까이';close.addEventListener('click',()=>{model.group.updateMatrixWorld(true);heroInspect.focus(model.anchors.stylusTip.getWorldPosition(new T.Vector3()),.38,{yaw:.35,pitch:-.28});});$('gramophone').parentElement.querySelector('.inspect-controls').append(close);model.update(clock.view(audio.now()));stage.draw();const ray=new T.Raycaster(),pointer=new T.Vector2();$('gramophone').addEventListener('click',e=>{if(heroInspect.consumeClick())return;const r=$('gramophone').getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,stage.camera);const hits=ray.intersectObjects([model.parts.soundbox],true);if(hits.length)lower();});const lazy=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting)||motor)return;try{motor=buildGramophone(T,materials);const assembly=new T.Group();assembly.add(motor.parts.motor);motor.group=assembly;motorStage=makeStage($('motor-canvas'));motorStage.setModel(motor,[-4,7,6]);stabilizeStage(motorStage);attachInspectControls(motorStage,$('motor-canvas'),{label:'축음기 동력부 관찰'});lazy.disconnect();}catch(error){$('motor-reading').textContent='3D 모형을 표시하지 못했습니다. 위 본문과 단면도에서 작동 원리를 볼 수 있습니다.';}},{rootMargin:'300px'});lazy.observe($('motor-canvas'));}catch(error){const p=document.createElement('p');p.className='render-error';p.textContent='3D 모형을 표시하지 못했습니다. 바늘 내리기로 소리를 듣고 아래 단면도로 원리를 살펴보세요.';document.querySelector('.hero-stage').append(p);console.warn('Gramophone WebGL fallback:',error.message);}}
function canvas2d(id){const c=$(id),r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.6);if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,r.width,r.height);return {x,w:r.width,h:r.height};}
function text(x,s,px,py,color='#9baba6',size=12){x.fillStyle=color;x.font=size+'px Arial, sans-serif';x.fillText(s,px,py);}
function syncGroove(){if(!$('link-groove').checked)return;const s=gramophoneStudySignal(Number($('groove-position').value)*24)*Number($('amplitude').value);$('diaphragm').value=String(s);}
$('amplitude').addEventListener('input',()=>{syncGroove();setGramophoneStudyVolume(grooveOwner,Number($('amplitude').value)*.22);});$('link-groove').addEventListener('change',()=>{stopDiaphragm();syncGroove();});
function groove(){
 syncGroove();const {x,w,h}=canvas2d('groove-canvas'),a=Number($('amplitude').value),position=Number($('groove-position').value),source=position*24;
 const amplitude=a*h*.1,mid=h*.57,margin=w*.09,span=w-2*margin,start=Math.floor(Math.min(23.999,source)/.75)*.75;
 const fraction=Math.max(0,Math.min(1,(source-start)/.75)),px=margin+span*fraction,py=mid+gramophoneStudySignal(source)*amplitude;
 for(const sign of [-1,1]){x.beginPath();for(let i=0;i<=300;i++){const t=i/300,X=margin+span*t,Y=mid+gramophoneStudySignal(start+t*.75)*amplitude+sign*12;i?x.lineTo(X,Y):x.moveTo(X,Y);}x.lineWidth=3;x.strokeStyle=sign<0?'#b5a077':'#5e685d';x.stroke();}
 x.strokeStyle='#e8ddbc';x.lineWidth=5;x.beginPath();x.moveTo(px-24,py-95);x.lineTo(px,py);x.stroke();x.fillStyle='#00b4c9';x.beginPath();x.arc(px,py,5,0,Math.PI*2);x.fill();
 text(x,'바늘',Math.min(w-50,px+13),py-50,'#e8ddbc');text(x,'한 음의 홈 · 진동 속도는 관찰용으로 90분의 1',margin,30,'#9baba6',w<500?10:12);
 text(x,'본편과 같은 합성 선율 · 0.5배 재생 / 음높이 한 옥타브 아래',margin,h-25,'#9baba6',w<500?9:12);
 x.strokeStyle='#ffffff25';x.setLineDash([4,6]);x.lineWidth=1;x.beginPath();x.moveTo(margin,mid);x.lineTo(w-margin,mid);x.stroke();x.setLineDash([]);
 const sound=readGramophoneStudy(grooveOwner);
 $('groove-reading').textContent='선율 '+source.toFixed(1)+' / 24초 · 굴곡 '+Math.round(a*100)+'% · '+(groovePlaying&&sound.playing?'합성 선율 재생 중 · '+Math.round(sound.frequency)+' Hz':'소리와 함께 관찰을 누르면 같은 위치에서 재생합니다.');
}
function diaphragm(){const {x,w,h}=canvas2d('soundbox-canvas'),s=Number($('diaphragm').value),scale=Math.min(w/900,(h-55)/310),ox=(w-900*scale)/2,oy=(h-310*scale)/2; x.save();x.translate(ox,oy);x.scale(scale,scale);const cy=155,P=[191,cy+25],phi=s*.16,rot=([X,Y])=>[P[0]+(X-P[0])*Math.cos(phi)-(Y-P[1])*Math.sin(phi),P[1]+(X-P[0])*Math.sin(phi)+(Y-P[1])*Math.cos(phi)],tip=rot([160,cy+69]),att=rot([260,cy]);
 x.fillStyle='#263329';x.fillRect(90,cy+70,140,22);x.strokeStyle='#d1b983';x.lineWidth=5;x.beginPath();x.moveTo(...tip);x.lineTo(...P);x.lineTo(...att);x.stroke();x.fillStyle='#00b4c9';x.beginPath();x.arc(...P,5,0,Math.PI*2);x.fill();x.strokeStyle='#d9d6c2';x.lineWidth=5;x.beginPath();x.moveTo(260,cy-72);x.quadraticCurveTo(260+2*(att[0]-260),cy,260,cy+72);x.stroke();x.strokeStyle='#807152';x.lineWidth=3;x.strokeRect(241,cy-80,40,160);x.strokeStyle='#927d50';x.lineWidth=7;x.beginPath();x.moveTo(285,cy-17);x.lineTo(490,cy-17);x.lineTo(715,cy-95);x.moveTo(285,cy+17);x.lineTo(490,cy+17);x.lineTo(715,cy+95);x.stroke();x.strokeStyle='#00b4c9';x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();const X=735+((i*28+visualTime*24)%112);x.globalAlpha=Math.min(1,Math.abs(s)*2)*(1-(X-735)/140);x.ellipse(X,cy,9+i*4,36+i*13,0,-1.2,1.2);x.stroke();}x.globalAlpha=1;x.restore();const label=(str,X,Y)=>text(x,str,ox+X*scale,oy+Y*scale,'#d3bb8c',w<500?10:12);label('바늘·레버',70,280);label('세워진 진동판',180,40);label('속이 빈 관',345,110);label('나팔',600,35);label('공기',770,280);}
function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!document.hidden){visualTime+=dt;crankDisplay+=clamp(clock.crank*Math.PI*2-crankDisplay,-dt*12,dt*12);if(clock.playing){clock.commit(audio.now());if(clock.position>=clock.duration){pause('선율이 끝났습니다. 처음부터 듣기를 눌러 다시 들어보세요.');}else if(clock.reserve<=0){pause('태엽이 다 풀렸습니다. 다시 감아주세요.');}}
 if(!comparison&&audio.source&&clock.needleDown&&(clock.reserve<=0||clock.position>=clock.duration))pause(clock.reserve<=0?'태엽이 다 풀렸습니다. 다시 감아주세요.':'선율이 끝났습니다. 처음부터 들어보세요.');
 if(comparison&&audio.now()>=comparisonEnd)stopComparison();
 if(now-lastText>250){updateText();lastText=now;}
 if(stage&&visible.has($('gramophone'))){const active=comparison?comparisonClock:clock,view=active.view(audio.now());model.update({...view,signal:active.playing?audio.visualSignal(active.read(audio.now())):0,crank:crankDisplay});stage.draw();}
 if(motorStage&&visible.has($('motor-canvas'))){if(motorRunning)motorAngle+=dt*Number($('governor-rpm').value)/78*.7;motor.update({angle:motorAngle,crank:crankDisplay,governorRpm:Number($('governor-rpm').value),explode:0});motorStage.draw();}
 if(visible.has($('groove-canvas'))){if(groovePlaying){const sound=readGramophoneStudy(grooveOwner);if(sound.playing)$('groove-position').value=String(sound.progress);else if($('groove-play').textContent!=='소리 준비 중…'){if(sound.position>=24)$('groove-position').value='1';stopGroove();}}groove();}
 if(visible.has($('soundbox-canvas'))){syncGroove();if(diaphragmPlaying){const sound=readGramophoneStudy(diaphragmOwner);if(sound.playing)$('diaphragm').value=String(sound.signal);else if($('diaphragm-play').textContent!=='소리 준비 중…')stopDiaphragm();}diaphragm();}
 }requestAnimationFrame(frame);}
$('groove-play').textContent='소리와 함께 관찰';$('diaphragm-play').textContent='소리와 함께 진동판 관찰';compareFacts();updateText();load3D();requestAnimationFrame(frame);
