// Educational invariants. No measured product calibration.
export function curtainWindow(cycle,fast=false){const t=Math.max(0,Math.min(1,cycle)),travel=.42,delay=fast?.12:.52,unit=x=>Math.max(0,Math.min(1,x));const first=1.8*unit(t/travel),second=-1.8+1.8*unit((t-delay)/travel);const low=Math.max(-.85,second+.9),high=Math.min(.85,first-.9);return {first,second,low,high,width:Math.max(0,high-low)};}
export function filmCycle(cycle){const index=Math.floor(Math.max(0,cycle)),phase=Math.max(0,cycle)-index,moving=phase>.65;return {index,phase,moving,exposed:phase>.12&&phase<.56,offset:moving?-(phase-.65)/.35*.9:0};}
const edges=[[.003,true],[.007,false],[.011,true],[.016,false],[.020,true]];
export function debounceSample(time,delayMs){let raw=false,since=0;for(const [t,on] of edges){if(time<t)break;raw=on;since=t;}return {raw,filtered:raw&&time-since>=delayMs/1000,since};}
export const crankX=angle=>Math.sin(angle)*1.4;
export const bowedDisplacement=phase=>{phase=((phase%1)+1)%1;return phase<.8?-.5+phase/.8: .5-(phase-.8)/.2;};
