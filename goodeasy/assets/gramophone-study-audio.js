import {GramophoneAudio,gramophoneNoteAt} from '../gramophone/audio.js?v=20261028-uxaudio1';
export {GRAMOPHONE_DURATION as STUDY_DURATION,gramophoneVisualSignal} from '../gramophone/audio.js?v=20261028-uxaudio1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The study replays the hero's original PCM at the same source position.
// Slower record playback lowers the pitch too. Only the drawn carrier is divided by 90.
export class GramophoneStudyTransport{
 constructor({audio=new GramophoneAudio(),isHidden=()=>!!globalThis.document?.hidden,onStart=()=>{}}={}){
  this.audio=audio;this.isHidden=isHidden;this.onStart=onStart;this.serial=0;this.pending=null;this.active=null;this.saved=new Map();
 }
 position(record=this.active){if(!record)return 0;const p=record.position+Math.max(0,this.audio.now()-record.started)*record.rate;return record.loop?p%this.audio.duration:Math.min(this.audio.duration,p);}
 pauseCurrent(){if(!this.active)return;const r=this.active;this.saved.set(r.owner,{position:this.position(r),rate:r.rate,loop:r.loop});this.active=null;this.audio.stop();}
 async play(owner,options={}){
  if(!owner||this.isHidden())return {state:'cancelled'};
  if(this.active?.owner===owner&&options.position==null){
   if(options.rate!=null)this.rate(owner,options.rate);if(options.volume!=null)this.volume(owner,options.volume);
   return {state:'running',...this.read(owner)};
  }
  const ticket=++this.serial;this.pending=owner;this.pauseCurrent();
  try{
   await this.audio.unlock();
   if(ticket!==this.serial||this.pending!==owner||this.isHidden()){if(ticket===this.serial)this.pending=null;return {state:'cancelled'};}
   if(this.audio.context?.state!=='running'){this.pending=null;return {state:'unavailable'};}
   const saved=this.saved.get(owner),rate=clamp(Number(options.rate??saved?.rate??1)||1,.125,2);
   const loop=!!(options.loop??saved?.loop),requested=Number(options.position??saved?.position??0)||0;
   const position=loop?Math.max(0,requested)%this.audio.duration:clamp(requested,0,this.audio.duration);
   if(position>=this.audio.duration){this.pending=null;return {state:'ended'};}
   this.pending=null;this.audio.play(position,78*rate,{loop});this.audio.volume(clamp(Number(options.volume??.22),0,.6));
   this.active={owner,position,rate,loop,started:this.audio.now()};
   if(this.audio.context.addEventListener&&!this.watched){this.watched=true;this.audio.context.addEventListener('statechange',()=>{if(this.audio.context.state!=='running')this.stop();});}
   this.onStart(owner);return {state:'running',...this.read(owner)};
  }catch{if(ticket===this.serial)this.pending=null;return {state:'unavailable'};}
 }
 read(owner){
  if(this.active?.owner===owner){const r=this.active,position=this.position(r);
   if(!r.loop&&position>=this.audio.duration){this.pauseCurrent();return this.read(owner);}
   const note=gramophoneNoteAt(position);
   return {playing:true,position,progress:position/this.audio.duration,angle:position*78/60*Math.PI*2,signal:this.audio.visualSignal(position),rate:r.rate,frequency:note.frequency*r.rate};
  }
  const saved=this.saved.get(owner),position=saved?.position||0,rate=saved?.rate||1;
  return {playing:false,position,progress:position/this.audio.duration,angle:position*78/60*Math.PI*2,signal:0,rate,frequency:gramophoneNoteAt(position).frequency*rate};
 }
 stop(owner){if(!owner||this.pending===owner){this.serial++;this.pending=null;}if(!owner||this.active?.owner===owner)this.pauseCurrent();}
 rate(owner,value){if(this.active?.owner!==owner)return;const r=this.active;r.position=this.position(r);r.started=this.audio.now();r.rate=clamp(Number(value)||1,.125,2);this.audio.rate(78*r.rate);}
 volume(owner,value){if(this.active?.owner===owner)this.audio.volume(clamp(Number(value)||0,0,.6));}
 signal(position){return this.audio.visualSignal(position);}
}
const transport=new GramophoneStudyTransport({onStart:owner=>{if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('goodeasy-gramophone-study-start',{detail:{owner}}));}});
export const playGramophoneStudy=(owner,options)=>transport.play(owner,options);
export const readGramophoneStudy=owner=>transport.read(owner);
export const stopGramophoneStudy=owner=>transport.stop(owner);
export const setGramophoneStudyRate=(owner,value)=>transport.rate(owner,value);
export const setGramophoneStudyVolume=(owner,value)=>transport.volume(owner,value);
export const gramophoneStudySignal=position=>transport.signal(position);
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)transport.stop();});
if(typeof window!=='undefined'){window.addEventListener('blur',()=>transport.stop());window.addEventListener('pagehide',()=>transport.stop());}
