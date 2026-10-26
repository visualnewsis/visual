// Expanded conceptual route, in machine-local coordinates. The release
// corridor moves around the outside of the case, never through its centre.
export function threadPath(state){
 const p=state.phase||0,eyeY=state.eyeY??1.65,takeupY=state.takeupY??2.17;
 const clamp=x=>Math.max(0,Math.min(1,x));const smooth=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q);};
 const mix=(a,b,t)=>a+(b-a)*t,NX=-.85,HZ=-.42;
 const path=[[.88,3.47,.22],[.88,3.74,.04],[.63,3.05,.45],[-1.08,2.97,.49],[-1.39,2.57,.59],[-1.39,2.55,.613],[-1.41,2.35,.64],[-1.31,takeupY,.57],[-.85,1.84,.30],[-.85,eyeY+.12,.10],[-.85,eyeY,.025],[NX,eyeY,0]];
 const previous=state.stitches?.at(-1)||state.length||3;
 const holeZ=p<.25&&state.stitches?.length ? -previous*.045 : -(state.length||3)*smooth(.84,.96,p)*.045;
 const hole=[NX,1.11,holeZ];
 if(p<.5||p>=.94){if(p>=.94||p<.25){path.push([NX-.025,1.11,holeZ],[NX-.025,1.072,holeZ],[NX,1.058,holeZ],[NX+.025,1.072,holeZ],[NX+.025,1.11,holeZ],[NX,1.12,holeZ-.03]);}else path.push(hole);return path;}
 const grow=smooth(.50,.58,p),spread=smooth(.58,.64,p),recover=smooth(.83,.94,p),clear=smooth(.90,.94,p);
 const endPhi=p<=.82?Math.max(0,4*Math.PI*(p-.58)):mix(4*Math.PI*.24,2*Math.PI,smooth(.82,.94,p));
 const startPhi=2*Math.PI*smooth(.84,.94,p);
 const radius=mix(.42,.38,grow)+.04*clear;
 const upperY=mix(mix(eyeY+.09*grow,.865,spread),1.11,clear);
 const lowerY=mix(mix(eyeY-.01*grow,.505,spread),1.11,clear);
 const polar=(a,y)=>[NX+radius*Math.sin(a),y,HZ+radius*Math.cos(a)];
 for(let i=0;i<=20;i++)path.push(polar(mix(startPhi,endPhi,i/20),upperY));
 path.push(polar(endPhi,mix(.87,1.11,clear)));
 const lowerEnd=mix(endPhi,2*Math.PI,smooth(.66,.82,p));
 for(let i=0;i<=20;i++)path.push(polar(mix(endPhi,lowerEnd,i/20),lowerY));
 path.push(polar(2*Math.PI,lowerY),polar(2*Math.PI,mix(lowerY,1.11,.5)),hole);
 return path.filter((point,i,all)=>i===0||Math.hypot(...point.map((v,j)=>v-all[i-1][j]))>1e-5);
}
