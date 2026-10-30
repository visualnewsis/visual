// Educational 35 mm / four-perforation transport. Geometry and projection share this clock.
// A four-slot external Geneva has 75% dwell and 25% pull-down at uniform input speed.
export const PROJECTOR_PITCH=.56;
export const PROJECTOR_PERF_PITCH=PROJECTOR_PITCH/4;
// Fixed representative winding radius; changing roll diameter is not simulated.
export const PROJECTOR_WINDING_RADIUS=1.05;
export function projectorOpenFraction(phase){
 const angle=Math.PI*2*(phase-.84)+Math.PI;let clear=0;
 for(const x of [-.325,0,.325])for(const y of [-.236,0,.236]){
  const dx=x-.75,a=Math.atan2(Math.sin(Math.atan2(y,dx)-angle),Math.cos(Math.atan2(y,dx)-angle));
  if(Math.hypot(dx,y)>1.22||Math.abs(a)>Math.PI*.56)clear++;
 }
 return clear/9;
}
export function projectorHeroClock(frames=0){
 const cycle=Math.max(0,Number(frames)||0),index=Math.floor(cycle),phase=cycle-index;
 const engaged=phase>=.75;
 const theta=engaged?-Math.PI/4+(phase-.75)/.25*Math.PI/2:-Math.PI*7/4+phase/.75*Math.PI*1.5;
 const beta=engaged?Math.atan2(Math.SQRT1_2*Math.sin(theta),1-Math.SQRT1_2*Math.cos(theta)):-Math.PI/4;
 const progress=engaged?Math.max(0,Math.min(1,(beta+Math.PI/4)/(Math.PI/2))):0;
 // A full-sector shutter has a short safety margin at both edges of pull-down.
 const openFraction=projectorOpenFraction(phase),exposed=openFraction===1;
 return {cycle,index,phase,engaged,theta,beta,progress,exposed,openFraction,travel:(index+progress)*PROJECTOR_PITCH,
  sprocketAngle:(index+progress)*Math.PI/2,reelAngle:cycle*PROJECTOR_PITCH/PROJECTOR_WINDING_RADIUS,
  buffer:phase-progress};
}
