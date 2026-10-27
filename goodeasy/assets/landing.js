/* Landing keyboard: input only. No autoplay and no 3D dependency. */
(() => {
  'use strict';
  const artwork=document.querySelectorAll('[data-art]');
  const reveal=el=>{el.style.backgroundImage='url("'+el.dataset.art+'")';};
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}}),{rootMargin:'160px'});artwork.forEach(el=>observer.observe(el));}else artwork.forEach(reveal);
  const bed=document.getElementById('landing-keys'),status=document.getElementById('sound-status');
  if(!bed)return;
  const pitches=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const codes=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon'];
  const letters=['A','W','S','E','D','F','T','G','Y','H','U','J','K','O','L','P',';'];
  const keys=new Map(),inputs=new Map(),voices=new Map(),pointers=new Set();
  let context,master,muted=false,last=null,slot=-1;
  const name=midi=>pitches[midi%12]+(Math.floor(midi/12)-1);
  for(let midi=60;midi<=76;midi++){
    const black=[1,3,6,8,10].includes(midi%12);if(!black)slot++;
    const key=document.createElement('button');key.type='button';key.className='key '+(black?'black':'white');
    key.style.setProperty('--slot',slot);key.dataset.midi=midi;key.setAttribute('aria-label',name(midi)+' · '+letters[midi-60]);key.setAttribute('aria-pressed','false');
    const hint=document.createElement('kbd');hint.textContent=letters[midi-60];key.append(hint);bed.append(key);keys.set(midi,key);
    key.addEventListener('click',e=>{if(e.detail===0){const id='assistive:'+midi;down(midi,id);setTimeout(()=>up(id),220);}});
  }
  function audio(){
    try{
      if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unsupported');context=new Audio({latencyHint:'interactive'});master=context.createGain();master.gain.value=muted?0:.32;const compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;master.connect(compressor).connect(context.destination);}
      if(context.state!=='running')context.resume().then(()=>{status.textContent=context.state==='running'?'직접 연주 중 · 합성음':'소리가 일시 정지됐습니다. 건반을 다시 눌러주세요.';}).catch(()=>{status.textContent='소리를 켜지 못했습니다. 브라우저의 사이트 소리 권한을 확인해 주세요.';});
      if(context.state==='running')status.textContent=muted?'소리가 꺼져 있습니다.':'직접 연주 중 · 합성음';
      return context;
    }catch(_){status.textContent='이 브라우저에서는 소리를 사용할 수 없습니다. 피아노 본편도 확인해 보세요.';return null;}
  }
  function end(midi){const v=voices.get(midi);if(!v||!context)return;voices.delete(midi);const now=context.currentTime;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.level,now);v.gain.gain.exponentialRampToValueAtTime(.00001,now+.16);v.nodes.forEach(n=>{try{n.stop(now+.2);}catch(_){}});}
  function strike(midi){const ctx=audio();if(!ctx)return;end(midi);const now=ctx.currentTime+.008,base=440*2**((midi-69)/12),env=ctx.createGain(),nodes=[];const level=.16;env.gain.value=level;env.connect(master);const voice={gain:env,nodes,level};voices.set(midi,voice);let ended=0;
    [1,.44,.27,.15,.09,.055,.025].forEach((volume,i)=>{const partial=i+1,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=base*partial*Math.sqrt(1+.00012*partial*partial);gain.gain.setValueAtTime(.00001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.00001,now+4/Math.sqrt(partial));osc.connect(gain).connect(env);osc.start(now);osc.stop(now+4.1);nodes.push(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();if(++ended===nodes.length){env.disconnect();if(voices.get(midi)===voice)voices.delete(midi);}};});
  }
  function down(midi,id){if(inputs.has(id))return;const held=[...inputs.values()].some(v=>v.midi===midi),start=performance.now();inputs.set(id,{midi,start});if(held)return;keys.get(midi).classList.add('is-down');keys.get(midi).setAttribute('aria-pressed','true');last={midi,start,duration:250};document.getElementById('landing-note').textContent=name(midi);document.getElementById('next-caption').textContent='방금 누른 '+name(midi)+', 안에서는?';document.getElementById('piano-next').href='piano/?landing-note='+midi+'&duration=250#inside';strike(midi);}
  function up(id){const item=inputs.get(id);if(!item)return;inputs.delete(id);if([...inputs.values()].some(v=>v.midi===item.midi))return;if(last&&last.midi===item.midi){last.duration=Math.max(100,Math.min(1800,performance.now()-last.start));document.getElementById('piano-next').href='piano/?landing-note='+last.midi+'&duration='+Math.round(last.duration)+'#inside';}keys.get(item.midi).classList.remove('is-down');keys.get(item.midi).setAttribute('aria-pressed','false');end(item.midi);}
  bed.addEventListener('pointerdown',e=>{const key=e.target.closest('.key');if(!key||e.button!==0)return;e.preventDefault();key.focus({preventScroll:true});bed.setPointerCapture(e.pointerId);pointers.add(e.pointerId);down(Number(key.dataset.midi),'pointer:'+e.pointerId);});
  bed.addEventListener('pointermove',e=>{const id='pointer:'+e.pointerId;if(!pointers.has(e.pointerId))return;const key=document.elementFromPoint(e.clientX,e.clientY)?.closest('.key');const midi=key&&bed.contains(key)?Number(key.dataset.midi):null;if(midi===inputs.get(id)?.midi)return;up(id);if(midi!==null)down(midi,id);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>bed.addEventListener(event,e=>{pointers.delete(e.pointerId);up('pointer:'+e.pointerId);}));
  document.addEventListener('keydown',e=>{const i=codes.indexOf(e.code);if(i<0||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('a,input,select,textarea,button:not(.key),summary,[contenteditable=true]')||document.querySelector('.vnh-header[data-open="true"]'))return;if(!bed.getBoundingClientRect().height||bed.getBoundingClientRect().bottom<0)return;e.preventDefault();down(i+60,'key:'+e.code);});
  document.addEventListener('keyup',e=>up('key:'+e.code));
  function releaseAll(){pointers.clear();[...inputs.keys()].forEach(up);[...voices.keys()].forEach(end);}
  window.addEventListener('blur',releaseAll);window.addEventListener('pagehide',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
  document.getElementById('mute').addEventListener('click',e=>{muted=!muted;e.currentTarget.setAttribute('aria-pressed',String(muted));e.currentTarget.textContent=muted?'소리 OFF':'소리 ON';if(master)master.gain.setTargetAtTime(muted?0:.32,context.currentTime,.015);status.textContent=muted?'소리가 꺼져 있습니다.':'건반을 누르면 소리가 납니다 · 합성음';});
})();
