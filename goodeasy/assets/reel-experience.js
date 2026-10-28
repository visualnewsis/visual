import {reelStep,reelPull} from './model.js?v=20261026-release3';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const numericKeys=['turns','rotor','distance','payout','woundTurns','freePayout','bailProgress','reelRecovered'];
export function createReelExperience({getState,setState,render,announce=()=>{},wake=()=>{}}){
 let queue=[],active=null,idleTime=0;
 const dom=typeof document!=='undefined'&&typeof document.getElementById==='function'?document:null;
 function show(){const s=getState(),write=(id,value)=>{const el=dom?.getElementById(id);if(el)el.textContent=value;};
  write('reel-handle-count',(s.turns||0).toFixed(2));write('reel-rotor-count',(s.rotor||0).toFixed(2));
  write('reel-line-change',((s.reelRecovered||0)*100).toFixed(0)+'cm');
  const button=dom?.getElementById('reel-bail-toggle');if(button){button.setAttribute('aria-pressed',String(!!s.bailOpen));button.textContent=s.bailOpen?'베일 닫기':'베일 열기';}
  const result=dom?.getElementById('reel-result');if(result)result.textContent=s.reelMotion==='close-bail'?'손잡이가 돌기 전에 베일이 닫히고 라인롤러가 줄을 받습니다.':s.bailOpen?'베일이 열려 있습니다. 줄을 당기면 스풀은 멈춘 채 앞쪽으로 풀립니다.':s.reelMotion==='pull-locked'?'드랙이 버팁니다. 당기는 힘을 높이거나 드랙을 낮춰보세요.':s.slipping?'스풀이 돌며 줄을 내줍니다. 손잡이와 로터는 그대로입니다.':s.reelMotion==='winding'?'라인롤러가 스풀 둘레를 돌고, 스풀은 앞뒤로 움직입니다.':'한 바퀴 감아보세요. 손잡이 한 바퀴에 로터는 5.2바퀴를 돕니다.';
 }
 function paint(next){setState(next);render();show();}
 function enqueue(type,amount=1){if(queue.length<6)queue.push({type,amount});wake();}
 function begin(job){const from={...getState()},open=!!from.bailOpen;if(job.type==='turn'&&open){queue.unshift(job);job={type:'close-bail',amount:1};}const rate=Number(dom?.getElementById('reel-speed')?.value)||.5;let to={...from},duration=1.25*Math.max(.20,job.amount||1)/rate,type=job.type,message='';
  for(const k of ['turns','rotor','payout','woundTurns','freePayout','reelRecovered']){from[k]=Number(from[k])||0;to[k]=from[k];}
  from.bailProgress=Number.isFinite(from.bailProgress)?from.bailProgress:Number(open);to.bailProgress=from.bailProgress;
  if(type==='turn'){to=reelStep(from,job.amount);if(open){to.distance=from.distance;to.slipping=false;}else to.woundTurns=from.woundTurns+job.amount*5.2;to.reelRecovered=(from.reelRecovered||0)+(open?0:Math.max(0,from.distance-to.distance));message=open?'베일이 열려 로터만 돌고 줄은 감기지 않았습니다.':'손잡이 한 바퀴, 로터 5.2바퀴. 약 '+Math.round((from.distance-to.distance)*100)+'cm를 감았습니다.';}
  else if(type==='pull'){duration=1.05;if(open){const released=Math.min(Math.max(0,30-from.distance),.55);to.distance=from.distance+released;to.freePayout=from.freePayout+released/(TAU*.022);to.woundTurns=Math.max(0,from.woundTurns-released/(TAU*.022));to.slipping=false;type='free-pull';message='베일이 열려 스풀은 멈춘 채 줄이 앞쪽으로 풀립니다.';}
   else {to=reelPull(from);const released=to.distance-from.distance;to.woundTurns=Math.max(0,from.woundTurns-released/(TAU*.022));type=to.slipping?'pull-slip':'pull-locked';message=to.slipping?'당기는 힘이 드랙을 넘어 약 '+Math.round(released*100)+'cm의 줄이 풀렸습니다.':'드랙이 버텨 스풀과 줄이 움직이지 않았습니다.';}}
  else if(type==='bail'||type==='close-bail'){duration=.42;to.bailOpen=type==='close-bail'?false:!open;to.bailProgress=to.bailOpen?1:0;message=to.bailOpen?'베일을 열었습니다. 줄이 라인롤러를 벗어납니다.':'베일을 닫았습니다. 라인롤러로 줄을 받아 감습니다.';}
  active={from,to,time:0,duration,type,message};paint({...from,bailOpen:to.bailOpen,reelMotion:type==='turn'?'winding':type,slipping:!!to.slipping});
 }
 function tick(dt){if(!active&&queue.length)begin(queue.shift());if(!active){if(idleTime>0){idleTime-=dt;if(idleTime<=0)paint({...getState(),reelMotion:'idle'});return idleTime>0;}return false;}
  active.time+=clamp(Number(dt)||0,0,.1);const t=Math.min(1,active.time/active.duration),u=t*t*(3-2*t),next={...active.to,reelMotion:active.type==='turn'?'winding':active.type};
  for(const k of numericKeys){if(Number.isFinite(active.from[k])&&Number.isFinite(active.to[k]))next[k]=active.from[k]+(active.to[k]-active.from[k])*u;}
  // A setting changed while the animation runs is retained for the next action.
  const latest=getState();next.drag=latest.drag;next.pull=latest.pull;
  paint(next);
  if(t>=1){announce(active.message);active=null;if(!queue.length){paint({...getState(),reelMotion:'idle'});return false;}}
  return !!active||queue.length>0;
 }
 function drag(deltaTurns){if(active)return;const d=clamp(Number(deltaTurns)||0,0,.2);if(!d)return;const from=getState();if(from.bailOpen){enqueue('turn',d);return;}const next=reelStep(from,d);if(from.bailOpen)next.distance=from.distance;next.woundTurns=(from.woundTurns||0)+(from.bailOpen?0:d*5.2);next.reelRecovered=(from.reelRecovered||0)+Math.max(0,from.distance-next.distance);next.reelMotion='winding';paint(next);idleTime=.18;wake();}
 dom?.getElementById('reel-bail-toggle')?.addEventListener('click',()=>enqueue('bail'));
 dom?.querySelectorAll('[data-reel-pull-force]').forEach(button=>button.addEventListener('click',()=>{const force=Number(button.dataset.reelPullForce),s=getState();paint({...s,pull:force});const input=dom.getElementById('pull');if(input){input.value=String(force);input.dispatchEvent(new Event('input',{bubbles:true}));}enqueue('pull');}));
 show();
 return {turn(){enqueue('turn');},pull(){enqueue('pull');},drag,tick,reset(){queue=[];active=null;idleTime=0;show();},pause(){queue=[];active=null;idleTime=0;paint({...getState(),reelMotion:'idle'});}};
}