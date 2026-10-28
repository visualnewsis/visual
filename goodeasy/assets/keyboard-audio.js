// Original synthetic linear-switch sound: friction, housing impacts, damped resonances.
// No recording, click jacket, sampled switch brand, or musical confirmation tone.
let context,bus,enabled=true,sequence=0,variant=0;
const owners=new Map(),voices=new Set(),buffers={down:[],up:[]};
export function synthesizeKeyboardStroke(sampleRate,type='down',seed=17){
 const sr=Math.max(8000,Number(sampleRate)||48000),up=type==='up',duration=up?.075:.12,out=new Float32Array(Math.ceil(sr*duration));
 let randomSeed=seed>>>0,low=0,high=0;
 const random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/2147483648-1;};
 const specs=up?[[630,.012,.22],[1740,.009,.14],[3300,.005,.08]]:[[205,.027,.35],[480,.019,.22],[1380,.009,.10]];
 const resonators=specs.map(([f,decay,level])=>{const r=Math.exp(-1/(sr*decay));return {r,c:2*r*Math.cos(2*Math.PI*f/sr),a:0,b:0,level};});
 const lowA=1-Math.exp(-2*Math.PI*(up?1100:650)/sr),highA=1-Math.exp(-2*Math.PI*(up?6500:4900)/sr),impact=up?0:.009;
 for(let i=0;i<out.length;i++){
  const t=i/sr,n=random();low+=lowA*(n-low);high+=highA*(n-high);const tau=t-impact,hit=tau>=0?Math.exp(-tau/(up?.0045:.007)):0;
  let value=(high-low)*hit*(up?.30:.40)+(n-low)*Math.exp(-t/.005)*(up?.025:.055);
  for(const r of resonators){const v=r.c*r.a-r.r*r.r*r.b+(tau>=0?n*Math.exp(-tau/.0018):0)*.07;r.b=r.a;r.a=v;value+=v*r.level;}
  out[i]=value*Math.min(1,(duration-t)/.006)*Math.min(1,t/.0002);
 }
 let peak=0;for(const v of out)peak=Math.max(peak,Math.abs(v));if(peak)for(let i=0;i<out.length;i++)out[i]*=(up?.50:.72)/peak;
 return out;
}
function ownerState(owner){if(!owners.has(owner))owners.set(owner,{epoch:0,pressed:new Map(),sessions:new Set()});return owners.get(owner);}
async function ready(){
 if(!context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;context=new Audio({latencyHint:'interactive'});bus=context.createGain();bus.gain.value=.58;const limit=context.createDynamicsCompressor();limit.threshold.value=-13;limit.knee.value=8;limit.ratio.value=5;bus.connect(limit).connect(context.destination);
  for(const type of ['down','up'])for(let i=0;i<4;i++){const data=synthesizeKeyboardStroke(context.sampleRate,type,179+i*127),buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);buffers[type].push(buffer);}
 }
 if(context.state!=='running')await context.resume();return context.state==='running';
}
function strike(owner,type,strength=1,when=context.currentTime){
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[type][variant++%4];source.playbackRate.value=.985+(variant%3)*.015;gain.gain.value=Math.max(.1,Math.min(1,Number(strength)||1));source.connect(gain).connect(bus);const voice={owner,source,gain};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};source.start(when);return when;
}
function finishRelease(owner,state,session){
 if(session.upScheduled||!session.sounded)return;session.upScheduled=true;
 strike(owner,'up',session.strength*.80,Math.max(context.currentTime,session.started+.045));state.sessions.delete(session);
}
export async function pressKeyboard(owner,key='key',strength=1){
 if(!enabled)return {state:'muted'};const state=ownerState(owner);if(state.pressed.has(key))return {state:'held'};
 const session={id:++sequence,epoch:state.epoch,strength,released:false,sounded:false,upScheduled:false};state.pressed.set(key,session);state.sessions.add(session);
 try{const available=await ready();if(!enabled||session.epoch!==state.epoch||!state.sessions.has(session))return {state:'cancelled'};if(!available){if(state.pressed.get(key)===session)state.pressed.delete(key);state.sessions.delete(session);return {state:'unavailable'};}
  session.started=strike(owner,'down',strength);session.sounded=true;if(session.released)finishRelease(owner,state,session);return {state:'running',kind:'linear-synthetic'};
 }catch{if(state.pressed.get(key)===session)state.pressed.delete(key);state.sessions.delete(session);return {state:'unavailable'};}
}
export function releaseKeyboard(owner,key='key'){
 const state=owners.get(owner),session=state?.pressed.get(key);if(!session)return {state:'idle'};state.pressed.delete(key);session.released=true;if(session.epoch===state.epoch&&enabled)finishRelease(owner,state,session);return {state:'released'};
}
export function stopKeyboard(owner){
 for(const [id,state]of owners){if(owner!==undefined&&owner!==id)continue;state.epoch++;state.pressed.clear();state.sessions.clear();}
 if(context)for(const voice of [...voices]){if(owner!==undefined&&owner!==voice.owner)continue;try{voice.gain.gain.cancelScheduledValues(context.currentTime);voice.gain.gain.setValueAtTime(0,context.currentTime);voice.source.stop(context.currentTime);}catch{}}
}
export function setKeyboardAudioEnabled(value){enabled=!!value;if(!enabled)stopKeyboard();return enabled;}
export const keyboardAudioEnabled=()=>enabled;
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)stopKeyboard();});
if(typeof window!=='undefined')window.addEventListener('blur',()=>stopKeyboard());

// A complete press/release may cross bottom-out between rendered frames.
export function keyboardTravelCue(previousPhase,phase,held=false){
 const before=Math.max(0,Math.min(1,Number(previousPhase)||0)),now=Math.max(0,Math.min(1,Number(phase)||0)),travel=Math.sin(now*Math.PI)*4;
 const crossed=(before<.5&&now>=.5)||(before>.5&&now<=.5),down=!held&&(travel>=3.9||crossed),up=(held||down)&&travel<=.1;
 return {down,up,held:(held||down)&&!up};
}
