// A deliberately slow, schematic single-needle rotary-hook lockstitch cycle.
export const PLATE_Y=1.05,NEEDLE_X=-.85,NEEDLE_Z=0,CATCH_PHASE=.58,MM=.045,MAX_STITCHES=12;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function smooth(a,b,x){const q=clamp((x-a)/(b-a));return q*q*(3-2*q);}
export function cycleAt(phase,length=3){const p=((phase%1)+1)%1,eyeY=1.20+.45*Math.cos(2*Math.PI*p),tipY=eyeY-.16,feed=smooth(.84,.96,p),dogLift=smooth(.79,.83,p)*(1-smooth(.96,.99,p)),dogZ=p<.2?-.5+smooth(0,.2,p):.5-feed,loopGrow=smooth(.50,.58,p),carry=smooth(.58,.81,p),recover=smooth(.83,.94,p),takeupY=1.55+.62*(1-smooth(.03,.48,p)+smooth(.83,.98,p));
 const stage=p<.5?0:p<.58?1:p<.83?2:p<.94?3:4;
 return {phase:p,eyeY,tipY,needleX:NEEDLE_X,needleZ:NEEDLE_Z,hookAngle:4*Math.PI*(p-CATCH_PHASE),takeupY,feed,feedZ:dogZ*length*MM,feedY:1.005+.06*dogLift,loop:loopGrow*(1-recover),carry,recover,length,stage};}
export const STAGES=[['바늘이 내려갑니다','바늘 눈에 꿴 윗실이 천 아래로 들어갑니다.'],['고리가 생깁니다','최저점을 지난 바늘이 조금 올라오며 스카프 쪽에 윗실 고리가 생깁니다.'],['훅이 고리를 운반합니다','회전 훅이 윗실 고리를 잡아 보빈 케이스의 위아래로 통과시킵니다.'],['실을 회수하며 천을 옮깁니다','실채기가 윗실을 회수하고, 바늘이 빠진 사이 이송톱니가 다음 땀으로 천을 보냅니다.'],['천이 옮겨집니다','바늘이 천에서 빠져나온 동안 이송톱니가 다음 땀 간격만큼 천을 옮깁니다.']];
export class SewingState {
 constructor(){this.phase=0;this.length=3;this.nextLength=3;this.stitches=[];this.travel=0;this.holding=false;this.single=false;this.speed=1;this.snapshot=null;this.pressStart=0;}
 setLength(value){this.nextLength=clamp(Number(value),2,5);if(this.phase===0&&!this.running)this.length=this.nextLength;}
 get running(){return this.holding||this.single;}
 get full(){return this.stitches.length>=MAX_STITCHES;}
 start(single=false){if(this.full)return false;if(single&&this.running)return true;if(!single&&!this.holding)this.pressStart=this.stitches.length;if(this.phase===0)this.length=this.nextLength;this.single=single;this.holding=!single;return true;}
 release(){if(!this.holding)return;this.holding=false;this.single=!this.full&&(this.phase>0||this.stitches.length===this.pressStart);}
 stop(){this.single=false;this.holding=false;}
 reset(){this.stop();this.phase=0;this.stitches=[];this.travel=0;this.length=this.nextLength;}
 advance(seconds){const events=[];if(!this.running)return events;let remaining=Math.max(0,seconds)*this.speed/1.6;
 while(remaining>1e-9&&this.running){const available=1-this.phase,take=Math.min(remaining,available),before=this.phase;this.phase+=take;remaining-=take;if(before<.25&&this.phase>=.25)events.push('pierce');if(before<CATCH_PHASE&&this.phase>=CATCH_PHASE)events.push('catch');if(this.phase>=1-1e-9){this.stitches.push(this.length);this.travel+=this.length;this.phase=0;this.length=this.nextLength;events.push('stitch');if(this.single||this.full)this.stop();}}
 return events;}
 capture(){this.snapshot=Object.freeze({phase:this.phase,length:this.length,travel:this.travel,stitches:Object.freeze([...this.stitches])});return this.snapshot;}
 view(){return {...cycleAt(this.phase,this.length),travel:this.travel,stitches:[...this.stitches]};}
}
