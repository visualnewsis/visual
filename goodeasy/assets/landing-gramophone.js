import {T,materials,makeStage} from './quality-kit.js?v=20261028-craft7';
import {buildGramophone} from '../gramophone/gramophone-model.js?v=20261102-rescue2';
import {Playback} from '../gramophone/playback.js?v=20261029-release67';
import {GramophoneAudio} from '../gramophone/audio.js?v=20261028-uxaudio2';
const canvas=document.getElementById('landing-gramophone-canvas');
if(canvas){
 const one=document.getElementById('landing-needle'),reset=document.getElementById('landing-reset'),status=document.getElementById('gramophone-status');
 const clock=new Playback(),audio=new GramophoneAudio();
 let stage,model,frame=0,visible=true,lost=false,intent=0,busy=false;
 one.disabled=reset.disabled=true;
 const paint=()=>{const view=clock.view(audio.now());model.update({...view,signal:clock.playing?audio.visualSignal(view.position):0});stage.draw();canvas.dataset.ready='true';canvas.dataset.playing=String(clock.playing);canvas.dataset.position=view.position.toFixed(3);};
 function cancel(){if(frame)cancelAnimationFrame(frame);frame=0;}
 function pause(message){intent++;clock.lift(audio.now());audio.stop();cancel();busy=false;one.disabled=lost;one.textContent='바늘 내리기';one.setAttribute('aria-pressed','false');if(model&&!lost)paint();if(message)status.textContent=message;}
 function tick(){frame=0;if(document.hidden||!visible||lost){pause('재생을 멈췄습니다. 바늘을 내려 이어서 들어보세요.');return;}clock.commit(audio.now());if(!clock.playing){pause('선율이 끝났습니다. 처음부터 듣기로 다시 들을 수 있습니다.');return;}paint();status.textContent='레코드 재생 중 · '+clock.position.toFixed(0)+' / 24초';frame=requestAnimationFrame(tick);}
 async function lower(){if(busy||lost)return;if(clock.needleDown){pause('바늘을 올렸습니다.');return;}busy=true;one.disabled=true;const ticket=++intent;try{await audio.unlock();if(ticket!==intent||document.hidden||!visible||lost)return;if(audio.context.state!=='running')throw Error('audio suspended');audio.context.onstatechange=()=>{if(audio.context.state!=='running'&&clock.playing)pause('오디오가 중단됐습니다. 바늘을 다시 내려주세요.');};if(clock.position>=clock.duration||clock.reserve<=0){clock.reset(audio.now());clock.reserve=.65;}if(clock.start(audio.now())){audio.play(clock.position,clock.rpm);one.textContent='바늘 올리기';one.setAttribute('aria-pressed','true');paint();frame=requestAnimationFrame(tick);}}catch(error){pause('소리를 켜지 못했습니다. 바늘 내리기를 다시 눌러주세요.');}finally{if(ticket===intent){busy=false;one.disabled=lost;}}}
 try{
  stage=makeStage(canvas);model=buildGramophone(T,materials);stage.setModel(model,[-5,4.3,7]);paint();one.disabled=reset.disabled=false;
  one.addEventListener('click',lower);
  reset.addEventListener('click',()=>{pause();clock.reset(audio.now());clock.reserve=.65;paint();lower();});
  new ResizeObserver(()=>{if(!lost)paint();}).observe(canvas.parentElement);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&(clock.playing||busy))pause('재생을 멈췄습니다. 바늘을 내려 이어서 들어보세요.');}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(clock.playing||busy))pause('재생을 멈췄습니다. 바늘을 내려 이어서 들어보세요.');});
  window.addEventListener('pagehide',()=>pause());
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;pause('3D 화면이 중단됐습니다. 축음기 본편을 확인해 주세요.');reset.disabled=true;});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;one.disabled=reset.disabled=false;paint();status.textContent='화면을 복구했습니다. 바늘을 내려보세요.';});
 }catch(error){canvas.hidden=true;one.hidden=reset.hidden=true;status.textContent='3D 모형을 표시하지 못했습니다. 아래 링크에서 축음기 본편을 확인해 주세요.';console.error(error);}
}
