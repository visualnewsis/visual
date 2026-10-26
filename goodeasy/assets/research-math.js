export const TAU=Math.PI*2;
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export const layerOffset=(t,index,distance)=>distance*smooth((clamp(t)-index*.045)/(1-7*.045));
export const gearAngle=(angle,driver,driven)=>-angle*driver/driven;
export function escapeState(t){const beat=Math.floor(Math.max(0,t)),p=Math.max(0,t)-beat,side=beat%2;let a=0,phase='잠김';if(p>=.45&&p<.58){phase='해제';a=.18*smooth((p-.45)/.13);}else if(p>=.58&&p<.78){phase='충격 전달';a=.18+.82*smooth((p-.58)/.2);}else if(p>=.78){phase='다시 잠김';a=1;}return {angle:(beat+a)*Math.PI/15,side,phase,fork:(side?1:-1)*.20*(1-2*smooth((p-.45)/.33)),balance:Math.cos(t*Math.PI)*.85};}
export const handAngles=t=>({second:t*TAU/60,minute:t*TAU/3600,hour:t*TAU/43200});
export const period=(inertia,stiffness)=>TAU*Math.sqrt(inertia/stiffness);
export const stringHz=(length,tension,density)=>1/(2*length)*Math.sqrt(tension/density);
export const lightRatio=(f,denominator)=>((2.8/f)**2)*(250/denominator);
