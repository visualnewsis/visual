import * as T from '../piano/vendor/three.module.min.js';
import {PROJECTOR_PITCH as PITCH} from './projector-hero-clock.js?v=20261030-reviewed11';
export const FEED_RADIUS=PITCH*4/(Math.PI*2);
const r=FEED_RADIUS;
const curve=points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
function upperBufferPoints(depth=0){
 const p=[[-2.05,3.15,.2],[-1.75,3.15,.2],[-1.4,3.15,.2],[-1.05,2.8+r,.2]];
 for(let i=1;i<=16;i++){const a=Math.PI/2-i/16*Math.PI/2;p.push([-1.05+Math.cos(a)*r,2.8+Math.sin(a)*r,.2]);}
 p.push([-1.05+r,2.55,.2],[-.85,2.25-depth,.2],[-.55,2.10-depth,.2],[-.40,2.70,.2],[-.35,3,.2],[-.15,3,.2]);return p;
}
class IdlerArc extends T.Curve{getPoint(t,target=new T.Vector3()){const a=Math.PI/2-t*Math.PI/2;return target.set(-.15+Math.cos(a)*.15,2.85+Math.sin(a)*.15,.2);}}
function upperCurve(depth=0){const p=new T.CurvePath();p.add(curve(upperBufferPoints(depth)));p.add(new IdlerArc());p.add(new T.LineCurve3(new T.Vector3(0,2.85,.2),new T.Vector3(0,1.48,.2)));return p;}
function upperPoints(depth=0){const p=upperBufferPoints(depth);const arc=new IdlerArc();for(let i=1;i<=16;i++)p.push(arc.getPoint(i/16).toArray());p.push([0,2.4,.2],[0,1.95,.2],[0,1.72,.2],[0,1.48,.2]);return p;}
function lowerPoints(rise=0){
 const p=[[0,1.48,.2],[0,1.22,.2],[0,.91,.2]];
 for(let i=1;i<=16;i++){const a=Math.PI+i/16*Math.PI/2;p.push([r+Math.cos(a)*r,.91+Math.sin(a)*r,.2]);}
 p.push([.57,.48,.2],[.65,-.70+rise,.2],[.90,.40-r,.2]);
 for(let i=1;i<=16;i++){const a=-Math.PI/2+i/16*Math.PI/2;p.push([.90+Math.cos(a)*r,.40+Math.sin(a)*r,.2]);}
 p.push([.90+r,.80,.2],[.90+r,1.65,.2],[1.35,2.50,.2],[1.75,3.15,.2],[2.05,3.15,.2]);return p;
}
// A material strip keeps its pitch. Solve slack by physical arc length, rather
// than making every perforation stop with the gate or arbitrarily scaling loops.
const upperTable=Array.from({length:65},(_,i)=>({d:i/64,length:upperCurve(i/64).getLength()}));
const lowerTable=Array.from({length:65},(_,i)=>({d:i/64*.60,length:curve(lowerPoints(i/64*.60)).getLength()}));
function fit(table,target,increasing,make){
 let lo=0,hi=table.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if((table[m].length<target)===increasing)lo=m;else hi=m;}
 const A=table[lo],B=table[hi],slope=(B.length-A.length)/(B.d-A.d);let d=A.d+(target-A.length)/slope;
 // Correct interpolation against the actual displayed Catmull-Rom curve.
 let c=make(d);d+=(target-c.getLength())/slope;c=make(d);return {d,curve:c,length:c.getLength()};
}
export function projectorFilmRoute(buffer=0){
 // Near the end of Geneva engagement the output briefly leads mean feed;
 // retain that signed deficit instead of clamping the material balance.
 const slack=(Number(buffer)||0)*PITCH;
 const u=fit(upperTable,upperTable[0].length+slack,true,upperCurve),l=fit(lowerTable,lowerTable[0].length-slack,false,d=>curve(lowerPoints(d)));
 const path=new T.CurvePath();for(const c of u.curve.curves)path.add(c);path.add(l.curve);
 return {curve:path,points:[...upperPoints(u.d),...lowerPoints(l.d).slice(1)],upperLength:u.length,lowerLength:l.length,upperRestLength:upperTable[0].length,lowerRestLength:lowerTable[0].length,slack};
}
