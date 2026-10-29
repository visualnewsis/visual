// One source-position clock drives audio, disc angle and groove position.
export const REFERENCE_RPM=78;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Playback {
 constructor(duration=24){this.duration=duration;this.position=0;this.rpm=78;this.reserve=.65;this.playing=false;this.needleDown=false;this.started=0;this.origin=0;this.crank=0;this.snapshot=null;}
 read(now){return clamp(this.position+(this.playing?Math.min(Math.max(0,now-this.started)*this.rpm/78,this.reserve*90):0),0,this.duration);}
 commit(now){const next=this.read(now),advance=next-this.position;this.reserve=Math.max(0,this.reserve-advance/90);if(this.reserve<1e-9)this.reserve=0;this.position=next;this.started=now;if(this.reserve<=0||this.position>=this.duration)this.playing=false;return next;}
 start(now){if(this.playing)this.commit(now);if(this.reserve<=0||this.position>=this.duration)return false;this.started=now;this.playing=true;this.needleDown=true;return true;}
 pause(now){this.commit(now);this.playing=false;}
 speed(rpm,now){this.commit(now);this.rpm=clamp(Number(rpm),60,96);}
 wind(now=this.started){this.commit(now);this.reserve=clamp(this.reserve+.18,0,1);this.crank+=1;}
 lift(now){this.pause(now);this.needleDown=false;}
 reset(now){this.lift(now);this.position=0;this.origin=0;}
 capture(now){this.commit(now);this.snapshot=Object.freeze({position:this.position,rpm:this.rpm,reserve:this.reserve,progress:this.position/this.duration,ratio:this.rpm/78});return this.snapshot;}
 view(now){const position=this.read(now);return {position,progress:position/this.duration,angle:position*78/60*Math.PI*2,needleLift:this.needleDown?0:1,crank:this.crank,signal:0,explode:0};}
}
export function speedFacts(rpm,duration=24){const ratio=rpm/78;return {ratio,semitones:12*Math.log2(ratio),duration:duration/ratio};}
export function needlePoint(progress){const r=1.24-(1.24-.43)*clamp(progress,0,1),px=1.72,pz=-.62,d=Math.hypot(px,pz),a=(r*r-1.7**2+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-a*a));return [a*px/d-h*pz/d,1.23,a*pz/d+h*px/d];}
