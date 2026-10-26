// Locally synthesized needle/drive click, not a recording of a real machine.
export class SewingSound {
 constructor(){this.context=null;this.enabled=true;this.sources=new Set();}
 unlock(){if(!this.enabled)return Promise.resolve();if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return Promise.resolve();this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.1;this.master.connect(this.context.destination);}return this.context.resume();}
 click(){if(!this.enabled||this.context?.state!=='running')return;const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type='triangle';osc.frequency.setValueAtTime(260,now);osc.frequency.exponentialRampToValueAtTime(85,now+.04);gain.gain.setValueAtTime(.01,now);gain.gain.linearRampToValueAtTime(.7,now+.003);gain.gain.exponentialRampToValueAtTime(.001,now+.075);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(now+.085);this.sources.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.sources.delete(osc);};}
 stop(){for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();}
}
