'use strict';
// Move labels, never their geographic anchor. Prefer a stable side so Paris and
// Créteil remain distinguishable even when their dots are only a pixel apart.
function layoutMapLabels(items,width,height,safe={top:9,bottom:height-9},mode={}){
 const placed=[],gap=6,edge=9;
 const intersects=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 for(const p of [...items].sort((a,b)=>(b.selected?1:0)-(a.selected?1:0)||a.id.localeCompare(b.id))){
  const left=p.id==='paris'||p.id==='lens',preferred=left?[-p.w-16,-p.h-9]:[16,p.id==='creteil'?9:-p.h/2];
  // In the active journey, names retain one offset from the true dot. A name
  // that cannot fit fades out instead of sliding along the viewport edge.
  if(mode.anchored){
   const box={id:p.id,x:p.x+preferred[0],y:p.y+preferred[1],w:p.w,h:p.h};
   box.hidden=box.x<edge||box.x+box.w>width-edge||box.y<safe.top||box.y+box.h>safe.bottom||placed.some(b=>!b.hidden&&intersects(box,b))||(mode.obstacles||[]).some(b=>intersects(box,b));
   placed.push(box);continue;
  }
  const options=[preferred,[left?-p.w-16:16,-p.h/2],[left?-p.w-16:16,12],[-p.w/2,-p.h-18],[-p.w/2,18]];
  for(let row=1;row<9;row++)for(const side of [1,-1])options.push([side===1?16:-p.w-16,side*row*(p.h+gap)]);
  let box=null;
  for(const [dx,dy] of options){const candidate={id:p.id,x:Math.max(edge,Math.min(width-p.w-edge,p.x+dx)),y:Math.max(safe.top,Math.min(safe.bottom-p.h,p.y+dy)),w:p.w,h:p.h};if(!placed.some(b=>intersects(candidate,b))){box=candidate;break}}
  if(!box)box={id:p.id,x:p.x+preferred[0],y:p.y+preferred[1],w:p.w,h:p.h};
  placed.push(box);
 }
 return placed;
}

// Country labels use the same projected rings as the painted country mask.
// No viewport-clamped substitute is allowed outside the geographic shape.
function countryLabelGeometry(path){
 const rings=(path.match(/M[^Z]+Z/gi)||[]).map(part=>{
  const numbers=(part.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number),points=[];
  for(let i=0;i<numbers.length;i+=2)points.push([numbers[i],numbers[i+1]]);
  return{points,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]};
 });
 return{rings};
}
function countryContainsPoint(geometry,x,y){
 let inside=false;
 for(const {points,bounds:b}of geometry.rings){
  if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[j],c=points[i];
   if((a[1]>y)!==(c[1]>y)&&x<(c[0]-a[0])*(y-a[1])/(c[1]-a[1])+a[0])inside=!inside;
  }
 }
 return inside;
}
function countryContainsBox(geometry,box){
 const x0=box.x,y0=box.y,x1=x0+box.w,y1=y0+box.h;
 if(![[x0,y0],[x0,y1],[x1,y0],[x1,y1]].every(p=>countryContainsPoint(geometry,...p)))return false;
 // An inward coast or lake may cross a rectangle even if its corners fit.
 // Clip each possibly intersecting segment against the rectangle interior.
 const intersects=(a,b)=>{
  let lo=0,hi=1;const dx=b[0]-a[0],dy=b[1]-a[1],pairs=[[-dx,a[0]-x0],[dx,x1-a[0]],[-dy,a[1]-y0],[dy,y1-a[1]]];
  for(const [p,q]of pairs){if(Math.abs(p)<1e-12){if(q<0)return false;continue}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false}
  const t=(lo+hi)/2,x=a[0]+dx*t,y=a[1]+dy*t;return x>x0+1e-8&&x<x1-1e-8&&y>y0+1e-8&&y<y1-1e-8;
 };
 for(const {points,bounds:b}of geometry.rings){
  if(b[2]<=x0||b[0]>=x1||b[3]<=y0||b[1]>=y1)continue;
  for(let i=0,j=points.length-1;i<points.length;j=i++)if(intersects(points[j],points[i]))return false;
 }
 return true;
}
function positionMapLabels(ctx){
 const width=ctx.field.clientWidth,height=ctx.field.clientHeight,points=[];
 ctx.shown.forEach(id=>{const el=ctx.pins[id],c=places[id],[px,py]=project(c.lon,c.lat),x=(px-ctx.cam.x)/ctx.cam.k,y=(py-ctx.cam.y)/ctx.cam.k;
  placeMapLabel(el,x,y);el.style.visibility=x<-10||x>width+10||y<-10||y>height+10?'hidden':'';
  if(el.classList.contains('visited')||el.style.visibility==='hidden')return;
  const label=el.querySelector('span');let size=el._labelSize;if(!size)size=el._labelSize={w:label.offsetWidth,h:label.offsetHeight};
  points.push({id,x,y,...size,selected:el.classList.contains('selected')});
 });
 const byId=new Map(points.map(p=>[p.id,p]));
 for(const box of layoutMapLabels(points,width,height,mapReadingBounds(ctx))){const p=byId.get(box.id),el=ctx.pins[box.id],label=el.querySelector('span'),dx=box.x-p.x,dy=box.y-p.y;
  label.style.left=dx+'px';label.style.top=dy+'px';
 }
}
if(typeof module!=='undefined')module.exports={layoutMapLabels,countryLabelGeometry,countryContainsPoint,countryContainsBox};
