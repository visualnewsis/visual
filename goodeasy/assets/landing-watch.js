import {makeStage} from './quality-kit.js?v=20261028-watchmechanism2';
import {buildWatch} from './watch-hero.js?v=20261028-watchmechanism2';
import {createWatchExperience} from './watch-experience.js';
const canvas=document.getElementById('landing-watch-canvas');
if(canvas){
 const wind=document.getElementById('landing-wind'),reset=document.getElementById('landing-reset'),status=document.getElementById('watch-status');
 let state={reserve:0,turns:0,elapsed:0,visualReserve:0,visualTurns:0,regulated:true},frame=0,last=0,visible=true,stage,model;
 const paint=()=>{model.update(state);stage.draw();canvas.dataset.ready='true';canvas.dataset.elapsed=String(state.elapsed);canvas.dataset.reserve=String(state.reserve);};
 function wake(){if(!frame&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}}
 const experience=createWatchExperience({getState:()=>state,setState:s=>{state=s;},render:()=>{},announce:t=>{status.textContent=t;},wake});
 function draw(now){frame=0;const active=experience.tick((now-last)/1000);last=now;paint();if(active&&visible&&!document.hidden)frame=requestAnimationFrame(draw);else if(!active)status.textContent='태엽이 풀려 멈췄습니다. 용두를 다시 감아보세요.';}
 try{
  stage=makeStage(canvas);model=buildWatch();stage.setModel(model,model.eye);paint();
  wind.addEventListener('click',()=>experience.wind());
  reset.addEventListener('click',()=>{if(frame)cancelAnimationFrame(frame);frame=0;experience.reset();paint();});
  new ResizeObserver(()=>paint()).observe(canvas.parentElement);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(frame)cancelAnimationFrame(frame);frame=0;visible=false;wind.disabled=true;status.textContent='3D 화면이 일시 중단됐습니다. 아래 링크에서 시계 본편을 확인할 수 있습니다.';});
  canvas.addEventListener('webglcontextrestored',()=>{visible=true;wind.disabled=false;paint();status.textContent='3D 화면을 복구했습니다. 용두를 감아보세요.';if(state.reserve>0)wake();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&state.reserve>0)wake();else if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else if(state.reserve>0)wake();});
 }catch(error){canvas.hidden=true;wind.hidden=true;reset.hidden=true;status.textContent='3D 모형을 표시하지 못했습니다. 아래 링크에서 시계 본편을 확인해 주세요.';console.error(error);}
}
