import {T,materials,makeStage} from './quality-kit.js?v=20261028-craft7';
import {buildSewingMachine} from '../sewing-machine/sewing-model.js?v=20261030-craft-release1';
import {SewingState} from '../sewing-machine/motion.js?v=20261029-release67';
import {SewingSound} from '../sewing-machine/sound.js?v=20261102-release1';
const canvas=document.getElementById('landing-sewing-canvas');
if(canvas){
 const one=document.getElementById('landing-stitch'),reset=document.getElementById('landing-reset'),status=document.getElementById('sewing-status');
 const engine=new SewingState(),sound=new SewingSound();
 let stage,model,frame=0,last=0,visible=true,lost=false;
 const paint=()=>{model.update(engine.view());stage.draw();canvas.dataset.ready='true';canvas.dataset.stitches=String(engine.stitches.length);canvas.dataset.phase=engine.phase.toFixed(3);};
 function cancel(){if(frame)cancelAnimationFrame(frame);frame=0;}
 function stop(){cancel();engine.stop();sound.stop();one.disabled=engine.full||lost;}
 function tick(now){frame=0;try{const events=engine.advance(Math.min(.06,(now-last)/1000));last=now;if(events.includes('pierce'))sound.click();paint();if(engine.running&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(tick);else {one.disabled=engine.full||lost;status.textContent=engine.full?'12땀을 박았습니다. 새 천으로 바꿔보세요.':engine.stitches.length+'땀 · 천 이동 '+engine.travel.toFixed(0)+' mm';}}catch(error){stop();status.textContent='모형 재생이 중단됐습니다. 아래 링크에서 재봉틀 본편을 확인해 주세요.';console.error(error);}}
 try{
  stage=makeStage(canvas);model=buildSewingMachine(T,materials);stage.setModel(model,model.eye);paint();
  one.addEventListener('click',()=>{if(lost||engine.running)return;sound.unlock().catch(()=>{});if(engine.start(true)){one.disabled=true;status.textContent='한 땀을 박고 있습니다.';last=performance.now();frame=requestAnimationFrame(tick);}});
  reset.addEventListener('click',()=>{stop();engine.reset();one.disabled=lost;paint();status.textContent='새 자투리 천을 놓았습니다. 한 땀을 박아보세요.';});
  new ResizeObserver(()=>{if(!lost)paint();}).observe(canvas.parentElement);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&engine.running){stop();status.textContent='박음질을 멈췄습니다. 한 땀 박기를 누르면 이어집니다.';}}).observe(canvas);
  const suspend=()=>{const active=engine.running;stop();if(active)status.textContent='박음질을 멈췄습니다. 한 땀 박기를 누르면 이어집니다.';};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();reset.disabled=true;status.textContent='3D 화면이 중단됐습니다. 아래 링크에서 재봉틀 본편을 확인해 주세요.';});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;one.disabled=engine.full;reset.disabled=false;paint();status.textContent='화면을 복구했습니다. 한 땀 박기를 눌러보세요.';});
 }catch(error){canvas.hidden=true;one.hidden=reset.hidden=true;status.textContent='3D 모형을 표시하지 못했습니다. 아래 링크에서 재봉틀 본편을 확인해 주세요.';console.error(error);}
}
