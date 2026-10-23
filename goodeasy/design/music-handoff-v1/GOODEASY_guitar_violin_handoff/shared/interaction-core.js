/* GOODEASY interaction contract reference; pure JS, no dependencies.
 * Wire onGuitarPluck/onViolinStart/onViolinMove/onViolinStop to Web Audio.
 * Audio synthesis is intentionally NOT implemented in this contract.
 */
export const TUNINGS = Object.freeze({
 guitar: Object.freeze([{id:'E2',hz:82.4069},{id:'A2',hz:110},{id:'D3',hz:146.8324},{id:'G3',hz:195.9977},{id:'B3',hz:246.9417},{id:'E4',hz:329.6276}]),
 violin: Object.freeze([{id:'G3',hz:195.9977},{id:'D4',hz:293.6648},{id:'A4',hz:440},{id:'E5',hz:659.2551}])
});
export function createLog(instrument) {
 if (!TUNINGS[instrument]) throw new Error('unsupported instrument');
 return {version:1,instrument,tuning:TUNINGS[instrument].map(x=>({...x})),events:[],capturedAtEpochMs:Date.now(),sustain:null};
}
export function observationSnapshot(log) {return structuredClone(log);}
export function attachGuitar(svg, log, {onGuitarPluck=()=>{}}={}) {
 let pointer=null, visited=new Set();
 const getString=target=>target?.closest?.('[data-string]')?.getAttribute('data-string');
 function pluck(id,source){const note=TUNINGS.guitar.find(n=>n.id===id);if(!note||visited.has(id))return;
  visited.add(id);const event={type:'plucked',stringId:id,pitch:id,frequencyHz:note.hz,atMs:performance.now(),velocityNorm:.55,source};log.events.push(event);onGuitarPluck(event);}
 function down(e){const id=getString(e.target);if(!id)return;pointer=e.pointerId;visited.clear();svg.setPointerCapture?.(e.pointerId);pluck(id,e.pointerType||'pointer');}
 function move(e){if(pointer!==e.pointerId)return;const hit=document.elementFromPoint(e.clientX,e.clientY);const id=getString(hit);if(id)pluck(id,e.pointerType||'pointer');}
 function stop(){pointer=null;visited.clear();}
 svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);
 for(const k of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(k,stop);
 window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 return {pluckFromButton(id){visited.clear();pluck(id,'keyboard-button');},stop};
}
export function attachViolin(bowZone,log,{onViolinStart=()=>{},onViolinMove=()=>{},onViolinStop=()=>{}}={}) {
 let active=null, lastX=0,lastT=0,lastMotion=0,current=null,sounding=false;
 const STOP_MS=80,THRESHOLD_PX_PER_SEC=12;
 function stop(reason='stop'){
  if(current){current.endedAtMs=performance.now();current.reason=reason;current=null;}
  if(sounding)onViolinStop(reason);sounding=false;active=null;
 }
 function down(e){if(active!==null)return;active=e.pointerId;lastX=e.clientX;lastT=performance.now();lastMotion=lastT;
  bowZone.setPointerCapture?.(e.pointerId);current={type:'bow',stringId:'A4',pitch:'A4',startedAtMs:lastT,endedAtMs:null,movementSamples:[],reason:null};log.events.push(current);}
 function move(e){if(active!==e.pointerId)return;const now=performance.now();const dt=Math.max(1,now-lastT),speed=Math.abs(e.clientX-lastX)*1000/dt;
  if(speed>THRESHOLD_PX_PER_SEC){lastMotion=now;if(!sounding){sounding=true;onViolinStart(current);}const sample={tMs:now,xNorm:Math.max(0,Math.min(1,e.offsetX/bowZone.getBoundingClientRect().width)),speedNorm:Math.min(1,speed/1000)};current?.movementSamples.push(sample);onViolinMove(sample);}
  lastX=e.clientX;lastT=now;}
 function tick(now){if(active!==null&&sounding&&now-lastMotion>=STOP_MS){sounding=false;onViolinStop('stationary');}requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
 bowZone.addEventListener('pointerdown',down);bowZone.addEventListener('pointermove',move);
 for(const k of ['pointerup','pointercancel','lostpointercapture'])bowZone.addEventListener(k,e=>{if(active===e.pointerId)stop(k);});
 window.addEventListener('blur',()=>stop('blur'));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('hidden');});
 window.addEventListener('pagehide',()=>stop('pagehide'));
 return {stop,beginKeyboard(){if(active===null){down({pointerId:'keyboard',clientX:0});}},keyboardMove(delta){if(active==='keyboard')move({pointerId:'keyboard',clientX:lastX+delta,offsetX:0});},endKeyboard(){stop('keyup');}};
}
