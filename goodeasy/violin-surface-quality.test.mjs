import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {violinFOpening,violinPlateGeometry} from './assets/models/violin-surface.js';
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function crossings(p){let n=0;for(let i=0;i<p.length;i++)for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const a=p[i],b=p[(i+1)%p.length],c=p[j],d=p[(j+1)%p.length];if(cross(a,b,c)*cross(a,b,d)<-1e-16&&cross(c,d,a)*cross(c,d,b)<-1e-16)n++;}return n;}
const outline=[[-.7,-.5],[.8,-.5],[.8,.5],[-.7,.5]].map(p=>new T.Vector2(...p));
const holes=[-1,1].map(s=>violinFOpening(T,s));
const dome=(x,z)=>.07*(1-x*x-z*z);
const geometry=violinPlateGeometry(T,outline,holes,.1,.08,dome);
test('both f openings have simple non-crossing boundaries and mirror exactly',()=>{
 for(const p of holes){assert.equal(crossings(p),0);assert.ok(Math.abs(T.ShapeUtils.area(p))>.003);}
 holes[0].forEach((p,i)=>{assert.equal(p.x,holes[1][i].x);assert.equal(p.y,-holes[1][i].y);});
});
test('skin triangulation preserves projected area without filling or overlapping the holes',()=>{
 const p=geometry.attributes.position,idx=geometry.index,N=geometry.userData.skinVertexCount,triangles=geometry.userData.skinTriangleCount;
 let area=0;for(let i=0;i<triangles*3;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);assert.ok(a<N&&b<N&&c<N);area+=Math.abs((p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a))-(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a)))/2;}
 const expected=Math.abs(T.ShapeUtils.area(outline))-holes.reduce((a,p)=>a+Math.abs(T.ShapeUtils.area(p)),0);
 assert.ok(Math.abs(area-expected)<2e-7,`${area} != ${expected}`);
});
test('cut walls have independent horizontal normals and arched skins retain smooth upward normals',()=>{
 const p=geometry.attributes.position,n=geometry.attributes.normal,N=geometry.userData.skinVertexCount;
 for(let i=0;i<N;i++){assert.ok(n.getY(i)>.9);assert.ok(n.getY(N+i)<-.9);assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-6);}
 for(let i=2*N;i<p.count;i++)assert.equal(n.getY(i),0);
});
test('the closed shell has exactly two incident triangles per geometric edge',()=>{
 const p=geometry.attributes.position,idx=geometry.index,edges=new Map();const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(7)).join(',');
 for(let i=0;i<idx.count;i+=3)for(let j=0;j<3;j++){const a=key(idx.getX(i+j)),b=key(idx.getX(i+(j+1)%3)),k=a<b?`${a}|${b}`:`${b}|${a}`;edges.set(k,(edges.get(k)||0)+1);}
 assert.ok([...edges.values()].every(n=>n===2));
});

function skinBoundary(g){
 const p=g.attributes.position,idx=g.index,edges=new Map();
 for(let i=0;i<g.userData.skinTriangleCount*3;i+=3)for(let j=0;j<3;j++){
  const a=idx.getX(i+j),b=idx.getX(i+(j+1)%3),key=a<b?`${a}:${b}`:`${b}:${a}`,e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1});
 }
 return [...edges.values()].filter(e=>e.count===1).map(e=>[new T.Vector2(p.getX(e.a),p.getZ(e.a)),new T.Vector2(p.getX(e.b),p.getZ(e.b))]);
}
function verifyBoundary(g,loops){
 const originals=loops.flatMap(loop=>loop.map((a,i)=>({a,b:loop[(i+1)%loop.length],count:0,length:0}))),boundary=skinBoundary(g);
 for(const [a,b]of boundary){
  const e=originals.find(e=>{
   const d=e.b.clone().sub(e.a),length=d.length(),on=p=>{const q=p.clone().sub(e.a),t=q.dot(d)/(length*length);return t>=-1e-7/length&&t<=1+1e-7/length&&Math.abs(q.x*d.y-q.y*d.x)/length<1e-7;};return on(a)&&on(b);
  });
  assert.ok(e,'unexpected boundary: '+JSON.stringify([a,b]));e.count++;e.length+=a.distanceTo(b);
 }
 for(const e of originals){assert.equal(e.count,8,'each original boundary segment must survive exactly three subdivisions');assert.ok(Math.abs(e.length-e.a.distanceTo(e.b))<1e-6);}
}
function projectedArea(g){const p=g.attributes.position,idx=g.index;let area=0;for(let i=0;i<g.userData.skinTriangleCount*3;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);area+=Math.abs((p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a))-(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a)))/2;}return area;}
test('explicitly closed outer and hole loops cannot shift Earcut vertex offsets',()=>{
 const closed=p=>[...p.map(v=>v.clone()),p[0].clone()];
 const g=violinPlateGeometry(T,closed(outline),holes.map(closed),.1,.08,dome);
 assert.equal(g.userData.skinVertexCount,geometry.userData.skinVertexCount);
 assert.ok(Math.abs(projectedArea(g)-projectedArea(geometry))<1e-10);
 verifyBoundary(g,[outline,...holes]);
 // The helper clones its inputs: normalization must not mutate callers.
 const original=closed(outline),before=original.length;violinPlateGeometry(T,original,holes.map(closed),.1,.08,dome);assert.equal(original.length,before);
});
test('actual violin contour preserves every outer and f-opening boundary and projected polygon area',async()=>{
 const {readFileSync}=await import('node:fs');const {smoothOutline}=await import('./assets/models/surface-utils.js');
 const source=readFileSync(new URL('./assets/models/violin.js',import.meta.url),'utf8');
 const block=source.match(/const contour=smoothOutline\(THREE,(\[[\s\S]*?\]),320\)/)[1];
 const numbers=[...block.matchAll(/-?(?:\d*\.\d+|\d+)/g)].map(m=>Number(m[0])),controls=[];for(let i=0;i<numbers.length;i+=2)controls.push([numbers[i],numbers[i+1]]);
 const actual=smoothOutline(T,controls,320);assert.equal(actual.length,320);assert.ok(!actual[0].equals(actual.at(-1)));
 for(const hole of holes)assert.ok(!hole[0].equals(hole.at(-1)));
 // The opening must remain separated from the C-bout edge, not become a tear.
 const distance=(p,a,b)=>{const d=b.clone().sub(a),t=Math.max(0,Math.min(1,p.clone().sub(a).dot(d)/d.lengthSq()));return p.distanceTo(a.clone().addScaledVector(d,t));};
 for(const hole of holes)for(const p of hole){let clearance=Infinity;for(let i=0;i<actual.length;i++)clearance=Math.min(clearance,distance(p,actual[i],actual[(i+1)%actual.length]));assert.ok(clearance>.003,'f opening must leave a continuous wooden margin');}
 const g=violinPlateGeometry(T,actual,holes,.106,.092,dome);
 verifyBoundary(g,[actual,...holes]);
 const expected=Math.abs(T.ShapeUtils.area(actual))-holes.reduce((sum,h)=>sum+Math.abs(T.ShapeUtils.area(h)),0);
 assert.ok(Math.abs(projectedArea(g)-expected)<2e-7);
});

test('outer varnish, cavity wood and cut walls use three disjoint material ranges',()=>{
 const n=geometry.userData.skinTriangleCount*3;assert.deepEqual(geometry.groups,[{start:0,count:n,materialIndex:0},{start:n,count:n,materialIndex:1},{start:n*2,count:geometry.index.count-n*2,materialIndex:2}]);
 assert.ok(geometry.groups[2].count>0);
});

test('approved f proportions retain tangent-continuous eyes and positive bank separation',()=>{
 for(const p of holes){
  const xs=p.map(v=>v.x);assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-.43)<1e-12);
  // Both end caps turn smoothly instead of reversing over their own banks.
  for(const i of [0,128]){const incoming=p[i].clone().sub(p[(i+p.length-1)%p.length]).normalize(),outgoing=p[(i+1)%p.length].clone().sub(p[i]).normalize();assert.ok(incoming.dot(outgoing)>0,'eye cap creates a cusp/reversal');}
  const upper=p.slice(0,129),lower=[p[0],...p.slice(129).reverse(),p[128]];
  for(let i=1;i<128;i++){assert.equal(upper[i].x,lower[i].x);assert.ok(Math.abs(upper[i].y-lower[i].y)>.005);}
  const width=i=>Math.abs(upper[i].y-lower[i].y)/2;
  assert.ok(Math.abs(width(64)-.010)<1e-10);
  assert.ok(width(10)>.023&&width(10)<.0241);
 }
});
