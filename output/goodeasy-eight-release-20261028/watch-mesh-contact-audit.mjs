import * as T from 'file:///C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/piano/vendor/three.module.min.js';
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>context,style:{}})};
const {watchAssembly}=await import('file:///C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/assets/anatomy-watch.js');
const model=watchAssembly();model.update({phase:0,explode:0});
const groups=[0,1,2,3,4].map(i=>model.components.find(c=>c.id==='wheel-'+i).object);
function wheel(i,pinion=false){return groups[i].children.find(o=>o.isMesh&&o.userData.teeth===(pinion?[0,12,8,8,8][i]:[64,60,64,60,15][i]));}
function section(mesh){const g=mesh.geometry,pos=g.attributes.position,index=g.index,n=index?index.count:pos.count,depth=g.parameters.options.depth,y=depth/2,segments=[];for(let i=0;i<n;i+=3){const v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,index?index.getX(i+j):i+j)),out=[];for(let j=0;j<3;j++){const a=v[j],b=v[(j+1)%3];if((a.y<y&&b.y>y)||(a.y>y&&b.y<y)){const t=(y-a.y)/(b.y-a.y);out.push([a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]);}}if(out.length===2)segments.push(out);}return {segments,y};}
function world(mesh,sec){const m=mesh.matrixWorld;return sec.segments.map(s=>s.map(p=>{const v=new T.Vector3(p[0],sec.y,p[1]).applyMatrix4(m);return [v.x,v.z];}));}
function inside(p,segments){let c=false;for(const [a,b]of segments)if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;return c;}
function boundaryDistance(p,segments){let best=Infinity;for(const [a,b]of segments){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz));}return best;}
function meshBounds(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);}
const reports=[];
for(let pair=0;pair<4;pair++){
 const A=wheel(pair),B=wheel(pair+1,true),sa=section(A),sb=section(B),Na=[64,60,64,60][pair],Nb=[12,8,8,8][pair];model.group.updateMatrixWorld(true);
 const ca=A.getWorldPosition(new T.Vector3()),cb=B.getWorldPosition(new T.Vector3()),ba=meshBounds(A),bb=meshBounds(B),dist=Math.hypot(ca.x-cb.x,ca.z-cb.z),rA=Math.max(...sa.segments.flat().map(p=>Math.hypot(...p))),rB=Math.max(...sb.segments.flat().map(p=>Math.hypot(...p)));
 let poses=0,maxDepth=0,witness=null,initial=null,minDepth=Infinity;
 for(let sample=0;sample<=360;sample++){const theta=sample/360*2*Math.PI/Na;groups[pair].rotation.y=theta;groups[pair+1].rotation.y=-theta*Na/Nb;model.group.updateMatrixWorld(true);const wa=world(A,sa),wb=world(B,sb);let deepest=0,point=null;
 for(const [source,target,targetCenter,targetR]of [[wa,wb,[cb.x,cb.z],rB],[wb,wa,[ca.x,ca.z],rA]])for(const [a,b]of source){if(Math.min(Math.hypot(a[0]-targetCenter[0],a[1]-targetCenter[1]),Math.hypot(b[0]-targetCenter[0],b[1]-targetCenter[1]))>targetR+.01)continue;for(let j=0;j<=8;j++){const t=j/8,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(inside(p,target)){const d=boundaryDistance(p,target);if(d>deepest){deepest=d;point=p;}}}}
 if(sample===0)initial=deepest;if(deepest>1e-5)poses++;minDepth=Math.min(minDepth,deepest);if(deepest>maxDepth){maxDepth=deepest;witness={sample,thetaDriver:theta,thetaPinion:Math.PI/Nb-theta*Na/Nb,point};}
 }
 reports.push({pair:pair+' -> '+(pair+1),Na,Nb,module:.022,centerDistance:dist,pitchDistance:.022*(Na+Nb)/2,meshY:[ba.min.y,ba.max.y,bb.min.y,bb.max.y],overlapY:Math.min(ba.max.y,bb.max.y)-Math.max(ba.min.y,bb.min.y),actualOuterRadii:[rA,rB],actualCrossSectionSegments:[sa.segments.length,sb.segments.length],samples:361,interferingPoses:poses,initialDepth:initial,maxWitnessDepth:maxDepth,minSampleDepth:minDepth,witness});
 groups.forEach(g=>g.rotation.y=0);
}
console.log(JSON.stringify(reports,null,2));