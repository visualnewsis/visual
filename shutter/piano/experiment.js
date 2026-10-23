import {sampleAction,timing} from './motion.js';
// Independent hands-on state. Never writes into the captured performance.
export function createExperiment(audio,clock=()=>performance.now()){
 let active=false,record=null,damperUp=false,hammerStart=-Infinity,vibrationStart=-Infinity,dampedAt=-Infinity,sounded=false;
 function stop(){audio.stopObservation();active=false;hammerStart=vibrationStart=-Infinity;}
 function enter(performance){stop();record=performance;active=true;damperUp=false;}
 function pluck(){if(!active)return;audio.prepareObservation();audio.strikeObservation(record.midi);vibrationStart=clock();dampedAt=damperUp?Infinity:clock();hammerStart=-Infinity;if(!damperUp)audio.releaseObservation();}
 function toggleDamper(){if(!active)return;damperUp=!damperUp;if(!damperUp){dampedAt=clock();audio.releaseObservation();}return damperUp;}
 function strike(){if(!active)return;audio.stopObservation();audio.prepareObservation();hammerStart=clock();vibrationStart=-Infinity;sounded=false;}
 function frame(now=clock()){
  let hammer=0;const age=now-hammerStart,e=timing(200);
  if(active&&age>=0&&age<=e.duration){hammer=sampleAction(age,200,true).hammer;if(age>=e.strike&&!sounded){sounded=true;vibrationStart=now;dampedAt=damperUp?Infinity:now;audio.strikeObservation(record.midi);if(!damperUp)audio.releaseObservation();}}
  const elapsed=now-vibrationStart,muting=now-dampedAt;
  const vibration=active&&elapsed>=0?Math.exp(-elapsed/1600)*(muting>=0?Math.exp(-muting/65):1):0;
  return {key:0,hammer,jack:0,damper:damperUp?1:0,vibration,step:hammer>.5?3:4,active,damperUp,animating:active&&(age<e.duration&&age>=0||vibration>.005)};
 }
 return {enter,stop,pluck,strike,toggleDamper,frame};
}
