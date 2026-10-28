// Original short melody, generated locally; no recording or external music.
const notes=[60,64,67,72,71,67,64,62,65,69,72,74,72,69,65,62,60,64,67,76,74,72,67,64,65,69,72,77,76,72,69,65];
function samples(duration){const data=new Float32Array(Math.ceil(duration*24000));for(let i=0;i<data.length;i++){const t=i/24000,beat=Math.floor(t/.75),local=t% .75,f=440*2**((notes[beat%notes.length]-69)/12),env=Math.min(1,local/.015)*Math.exp(-local*4)*Math.min(1,(.75-local)/.035)*Math.min(1,(duration-t)/.15);data[i]=env*(Math.sin(2*Math.PI*f*t)+.25*Math.sin(4*Math.PI*f*t)+.12*Math.sin(6*Math.PI*f*t))*.4;}return data;}
export class GramophoneAudio {
 constructor(duration=24){this.duration=duration;this.context=null;this.source=null;this.buffer=null;this.samples=samples(duration);this.voice=null;}
 unlock(){
  if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('이 브라우저는 웹 오디오를 지원하지 않습니다.');this.context=new Audio();this.gain=this.context.createGain();this.gain.gain.value=.3;this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=3000;this.filter.Q.value=.45;this.filter.connect(this.gain);this.gain.connect(this.context.destination);this.buffer=this.context.createBuffer(1,this.samples.length,24000);this.buffer.copyToChannel(this.samples,0);}
  return this.context.resume();
 }
 // A slowed display signal follows the same note, envelope and record position as the PCM.
 // The carrier is divided by 90 so a screen can show the displacement; it is not an audio-rate measurement.
 visualSignal(position){
  const t=Math.max(0,Math.min(this.duration,Number(position)||0)),local=t%.75;
  const f=440*2**((notes[Math.floor(t/.75)%notes.length]-69)/12);
  const env=Math.min(1,local/.015)*Math.exp(-local*4)*Math.min(1,(.75-local)/.035)*Math.min(1,(this.duration-t)/.15);
  return env>0?env*Math.sin(2*Math.PI*f*t/90):0;
 }
 now(){return this.context?.currentTime||0;}
 play(offset,rpm){this.stop();if(offset>=this.duration)return;const source=this.context.createBufferSource();source.buffer=this.buffer;source.playbackRate.value=rpm/78;const voice=this.context.createGain();voice.gain.setValueAtTime(0,this.now());voice.gain.linearRampToValueAtTime(1,this.now()+.012);source.connect(voice);voice.connect(this.filter);this.voice=voice;source.start(0,Math.max(0,offset));this.source=source;}
 rate(rpm){if(this.source)this.source.playbackRate.setValueAtTime(rpm/78,this.now());}
 stop(){if(this.source){const old=this.source,voice=this.voice,now=this.now();voice.gain.cancelScheduledValues(now);voice.gain.setTargetAtTime(0,now,.004);old.onended=()=>{old.disconnect();voice.disconnect();};try{old.stop(now+.025);}catch{old.disconnect();voice.disconnect();}this.source=null;this.voice=null;}}
 volume(value){if(this.gain)this.gain.gain.setTargetAtTime(value,this.now(),.03);}
}
