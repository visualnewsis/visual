// Original, synthesized office ambience. No audio downloads or autoplay.
export class OfficeAudio{
  constructor(){this.ctx=null;this.enabled=false;this.active=true;this.zone='office';}
  toggle(enabled){
    this.enabled=enabled;
    try{
      if(enabled&&!this.ctx){
        this.ctx=new AudioContext();const c=this.ctx;
        this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
        const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),data=buffer.getChannelData(0);let previous=0;
        for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.035)/1.035;data[i]=previous*3;}
        this.noise=buffer;
        const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
        const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=320;
        this.air=c.createGain();this.air.gain.value=.12;source.connect(filter).connect(this.air).connect(this.master);source.start();
        const hum=c.createOscillator();hum.type='sine';hum.frequency.value=52;const gain=c.createGain();gain.gain.value=.014;hum.connect(gain).connect(this.master);hum.start();
      }
      if(enabled)this.ctx.resume().catch(()=>{});this.mix();return true;
    }catch{this.enabled=false;return false;}
  }
  mix(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled&&this.active?.48:0,this.ctx.currentTime,.12);}
  setActive(value){this.active=value;this.mix();}
  setZone(zone){if(zone===this.zone)return;this.zone=zone;if(this.ctx)this.air.gain.setTargetAtTime(zone==='lift'?.045:zone==='office'?.12:.08,this.ctx.currentTime,.6);}
  tone(freq,duration=.2,delay=0,volume=.07,type='sine'){
    if(!this.enabled||!this.active||!this.ctx)return;
    const c=this.ctx,start=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    o.connect(g).connect(this.master);o.start(start);o.stop(start+duration+.02);
  }
  noiseHit(frequency,duration,volume=.2){
    if(!this.enabled||!this.active||!this.ctx)return;
    const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;
    filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;
    gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
    source.connect(filter).connect(gain).connect(this.master);source.start();source.stop(c.currentTime+duration);
  }
  fx(name){
    if(name==='step'){this.noiseHit(this.zone==='office'?620:390,.1,.27);this.tone(90,.065,0,.045);}
    if(name==='paper'){this.noiseHit(1600,.25,.65);}
    if(name==='ding'){this.tone(830,.65,0,.11);this.tone(622,.8,.16,.09);}
    if(name==='button'){this.tone(740,.1,0,.04);}
    if(name==='alarm'){this.tone(196,.38,0,.1,'triangle');this.tone(147,.4,.18,.06,'triangle');}
    if(name==='escape'){[392,494,587,784].forEach((f,i)=>this.tone(f,.8,i*.11,.08));}
    if(name==='back'){[330,294,220].forEach((f,i)=>this.tone(f,.6,i*.2,.07));}
  }
}
