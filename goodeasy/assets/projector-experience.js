export function createProjectorExperience({getState,setState,render,wake,sound=()=>{},stopSound=()=>{},reduced=false}){
 let motion=null,enabled=true;
 const button=document.getElementById('action'),mute=document.getElementById('projector-sound');
 function commit(frames){const s=getState();setState({...s,frames,frame:Math.floor(frames+.35)%24});render();}
 function settle(){if(motion){commit(motion.to);motion=null;}button.disabled=false;button.removeAttribute('aria-busy');}
 mute?.addEventListener('click',()=>{enabled=!enabled;if(!enabled)stopSound();mute.setAttribute('aria-pressed',String(enabled));mute.textContent=enabled?'클릭 소리 켜짐':'클릭 소리 꺼짐';});
 function forward(){
  if(motion)return;
  const from=getState().frames,to=Math.floor(from+.35)+1;
  if(enabled)sound();
  if(reduced){commit(to);return;}
  motion={from,to,elapsed:0};button.disabled=true;button.setAttribute('aria-busy','true');wake();
 }
 function tick(dt){if(!motion)return false;motion.elapsed+=Math.max(0,dt);const t=Math.min(1,motion.elapsed/.70);commit(motion.from+(motion.to-motion.from)*t);if(t===1)settle();return !!motion;}
 function drag(delta){motion=null;button.disabled=false;button.removeAttribute('aria-busy');commit(getState().frames+Math.max(0,delta));}
 function reset(){motion=null;button.disabled=false;button.removeAttribute('aria-busy');}
 return {forward,tick,drag,settle,reset};
}
