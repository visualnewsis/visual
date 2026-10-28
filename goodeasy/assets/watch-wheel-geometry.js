import * as T from '../piano/vendor/three.module.min.js';

const TAU=Math.PI*2;
// A mating epicycloid and hypocycloid share the same rolling circle.
// Reference: tec-science, Construction and design of cycloidal gears.
// These are generated curves, not circular-arc approximations of tooth flanks.
function cycloid(R,r,t,outer){
 const a=outer?R+r:R-r,k=a/r;
 return outer?new T.Vector2(a*Math.cos(t)-r*Math.cos(k*t),a*Math.sin(t)-r*Math.sin(k*t)):
  new T.Vector2(a*Math.cos(t)+r*Math.cos(k*t),a*Math.sin(t)-r*Math.sin(k*t));
}
function flankLimit(R,r,target,outer){
 let low=0,high=Math.PI*r/R;
 for(let i=0;i<60;i++){const mid=(low+high)/2,length=cycloid(R,r,mid,outer).length();if(outer?length<target:length>target)low=mid;else high=mid;}
 return (low+high)/2;
}
export function cycloidalPairSpec(wheelTeeth,pinionTeeth,module=.022){
 const wheelRadius=wheelTeeth*module/2,pinionRadius=pinionTeeth*module/2,rollingRadius=pinionRadius/2;
 // Small explicit running clearance, shared equally by the two tooth widths.
 const backlash=module*.025;
 const spec=teeth=>({teeth,module,pitchRadius:teeth*module/2,rollingRadius,backlash,addendum:module,dedendum:module*1.25});
 return {wheel:spec(wheelTeeth),pinion:spec(pinionTeeth),centerDistance:wheelRadius+pinionRadius,rollingRadius,backlash};
}
export function cycloidalOutline(spec,samples=20){
 const {teeth:N,pitchRadius:R,rollingRadius:r,backlash,addendum,dedendum}=spec,tip=R+addendum,root=R-dedendum;
 const half=Math.PI/(2*N)-backlash/(4*R),ep=flankLimit(R,r,tip,true),hy=flankLimit(R,r,root,false),points=[];
 const rotate=(v,a)=>new T.Vector2(v.x*Math.cos(a)-v.y*Math.sin(a),v.x*Math.sin(a)+v.y*Math.cos(a));
 const upper=Array.from({length:samples+1},(_,i)=>cycloid(R,r,ep*i/samples,true));
 const lower=Array.from({length:samples+1},(_,i)=>cycloid(R,r,hy*i/samples,false));
 for(let j=0;j<N;j++){
  const a=j*TAU/N;
  // Counterclockwise: left root -> left pitch -> left tip -> right tip -> root.
  for(let i=samples;i>=0;i--)points.push(rotate(new T.Vector2(lower[i].x,-lower[i].y),a-half));
  for(let i=1;i<=samples;i++)points.push(rotate(upper[i],a-half));
  const tipAngle=Math.atan2(upper[samples].y,upper[samples].x),left=a-half+tipAngle,right=a+half-tipAngle;
  if(right<=left)throw new Error('Cycloidal tooth tip collapses; use a compatible addendum or tooth count');
  for(let i=1;i<=4;i++){const t=left+(right-left)*i/4;points.push(new T.Vector2(tip*Math.cos(t),tip*Math.sin(t)));}
  for(let i=samples-1;i>=0;i--)points.push(rotate(new T.Vector2(upper[i].x,-upper[i].y),a+half));
  for(let i=1;i<=samples;i++)points.push(rotate(lower[i],a+half));
  const rootAngle=Math.atan2(lower[samples].y,lower[samples].x),from=a+half+rootAngle,to=a+TAU/N-half-rootAngle;
  if(to<=from)throw new Error('Cycloidal root space collapses');
  for(let i=1;i<=4;i++){const t=from+(to-from)*i/4;points.push(new T.Vector2(root*Math.cos(t),root*Math.sin(t)));}
 }
 return points;
}
export function pinionPhase(wheelTeeth,pinionTeeth,lineAngle,wheelPhase=0){
 const pitch=TAU/pinionTeeth,angle=(-(wheelTeeth+pinionTeeth)*lineAngle-wheelTeeth*wheelPhase-Math.PI*pinionTeeth-Math.PI)/pinionTeeth;
 return ((angle%pitch)+pitch)%pitch;
}
export function watchGearGeometry(spec,{depth=.035,spokes=true,boreRadius=.019}={}){
 const shape=new T.Shape(cycloidalOutline(spec)),R=spec.pitchRadius;
 if(spokes&&R>.2){const inner=Math.max(.115,R*.19),outer=R-spec.dedendum-.035;
  for(let i=0;i<5;i++){const a=i/5*TAU+.10,b=(i+1)/5*TAU-.10,h=new T.Path();h.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);h.lineTo(Math.cos(a+.035)*outer,Math.sin(a+.035)*outer);h.absarc(0,0,outer,a+.035,b-.035,false);h.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);h.absarc(0,0,inner,b,a,true);h.closePath();shape.holes.push(h);}
 }
 const bore=new T.Path();bore.absarc(0,0,boreRadius,0,TAU,true);shape.holes.push(bore);
 // Unbevelled working flanks preserve their conjugate section at every height.
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);return g;
}
export function makeWatchGear(parent,spec,{y=0,depth=.035,material,hubMaterial=material,spokes=true,phase=0,hubRadius=.045,boreRadius=.019,hubBoreRadius=0}={}){
 const wheel=new T.Mesh(watchGearGeometry(spec,{depth,spokes,boreRadius}),material);wheel.position.y=y;wheel.rotation.y=phase;wheel.castShadow=wheel.receiveShadow=true;wheel.name=spec.teeth>24?'Cycloidal brass wheel':'Long cycloidal pinion';wheel.userData={...spec,depth,phase,profile:'paired-cycloidal'};parent.add(wheel);
 // The .019 bore presses onto the .020 staff, and the shoulder overlaps both.
 let shoulderGeometry;
 if(hubBoreRadius){const s=new T.Shape();s.absarc(0,0,hubRadius,0,TAU,false);const bore=new T.Path();bore.absarc(0,0,hubBoreRadius,0,TAU,true);s.holes.push(bore);shoulderGeometry=new T.ExtrudeGeometry(s,{depth:depth+.025,bevelEnabled:false,curveSegments:32});shoulderGeometry.rotateX(-Math.PI/2);shoulderGeometry.translate(0,-(depth+.025)/2,0);}else shoulderGeometry=new T.CylinderGeometry(hubRadius,hubRadius,depth+.025,48);
 const shoulder=new T.Mesh(shoulderGeometry,hubMaterial);shoulder.position.y=depth/2;shoulder.name=hubBoreRadius?'Independent barrel bearing sleeve':'Pressed wheel and pinion shoulder';wheel.add(shoulder);return wheel;
}
