// GOODEASY 08 — procedural MX-compatible keycap shell, model units = 10 mm.
// Standard-height cylindrical-dish visualization geometry, not a manufacturer profile or CAD.
export const KEY_PITCH=1.905,KEY_GAP=.105;
// Cross stem: 4.0 mm span, 1.17 mm vertical bar, 1.31 mm horizontal bar.
export const CROSS={span:.40,barX:.117,barZ:.131};
export const SOCKET_CLEARANCE=.008;
export function crossOutline(grow=0,c=CROSS){const s=c.span/2+grow,x=c.barX/2+grow,z=c.barZ/2+grow;return [[s,-z],[s,z],[x,z],[x,s],[-x,s],[-x,z],[-s,z],[-s,-z],[-x,-z],[-x,-s],[x,-s],[x,-z]];}
export function insideCross(px,pz,grow=0,c=CROSS){const s=c.span/2+grow,x=c.barX/2+grow,z=c.barZ/2+grow;return (Math.abs(px)<=s&&Math.abs(pz)<=z)||(Math.abs(px)<=x&&Math.abs(pz)<=s);}
// bx/bz: skirt half-size at the bottom; tx/tz: half-size where the dish meets the edge fillet.
export function keycapProfile(o={}){
 const units=o.units??1,depthUnits=o.depthUnits??1,bx=(units*KEY_PITCH-KEY_GAP)/2,bz=(depthUnits*KEY_PITCH-KEY_GAP)/2;
 return {units,depthUnits,bx,bz,tx:bx-(o.draftX??.265),tz:bz-(o.draftZ??.20),bottom:o.bottom??0,height:o.height??.95,tilt:o.tilt??0,dish:o.dish??.07,dishAxis:o.dishAxis||'z',
  cornerBottom:o.cornerBottom??.16,cornerTop:o.cornerTop??.12,fillet:o.fillet??.09,wall:o.wall??.125,topThickness:o.topThickness??.13};
}
// Cylindrical dish: concave across x when dishAxis='z' (finger rests along the cylinder axis).
// Tilt > 0 raises the back (-z) edge, as on the upper sculpted rows.
export function dishY(p,x,z){
 const rim=p.bottom+p.height-Math.tan(p.tilt)*z;if(p.dish<=0)return rim;
 const half=p.dishAxis==='z'?p.tx:p.tz,c=Math.min(Math.abs(p.dishAxis==='z'?x:z),half),R=(half*half+p.dish*p.dish)/(2*p.dish);
 return rim-p.dish+(R-Math.sqrt(R*R-c*c));
}
export const ceilingY=(p,x,z)=>dishY(p,x,z)-p.topThickness;
// Rounded rectangle with a fixed point count, so rings of different sizes loft vertex-to-vertex.
export function roundRect(a,b,r,nC=8,nS=8){
 r=Math.max(1e-4,Math.min(r,a-1e-4,b-1e-4));const pts=[],C=[[a-r,b-r],[-(a-r),b-r],[-(a-r),-(b-r)],[a-r,-(b-r)]];
 for(let c=0;c<4;c++){const a0=c*Math.PI/2,a1=a0+Math.PI/2,[cx,cz]=C[c],[nx,nz]=C[(c+1)%4];
  for(let i=0;i<nC;i++){const t=a0+i/nC*Math.PI/2;pts.push([cx+r*Math.cos(t),cz+r*Math.sin(t)]);}
  const e=[cx+r*Math.cos(a1),cz+r*Math.sin(a1)],s=[nx+r*Math.cos(a1),nz+r*Math.sin(a1)];
  for(let i=0;i<nS;i++){const t=i/nS;pts.push([e[0]+(s[0]-e[0])*t,e[1]+(s[1]-e[1])*t]);}
 }
 return pts;
}
// Rings run bottom→top or outside→in; flip reverses faces for the cavity and the underside.
function loft(rings,center,flip){
 const P=rings[0].length,pos=[],idx=[];for(const r of rings)for(const v of r)pos.push(v[0],v[1],v[2]);
 const ci=center?pos.push(...center)/3-1:-1;
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<P;k++){const a=j*P+k,b=(j+1)*P+k,c=j*P+(k+1)%P,d=(j+1)*P+(k+1)%P;if(flip)idx.push(a,c,b,c,d,b);else idx.push(a,b,c,c,b,d);}
 if(center){const j=rings.length-1;for(let k=0;k<P;k++){const a=j*P+k,c=j*P+(k+1)%P;if(flip)idx.push(a,c,ci);else idx.push(a,ci,c);}}
 return {pos,idx};
}
function geometry(T,...parts){
 const pos=[],idx=[];for(const p of parts){const o=pos.length/3;pos.push(...p.pos);for(const i of p.idx)idx.push(i+o);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
// Exterior: drafted skirt → rounded edge fillet → dished top, one continuous surface.
export function keycapExterior(p,o={}){
 const nC=o.cornerSegments??8,nS=o.sideSegments??8,W=o.wallRings??6,F=o.filletRings??6,N=o.topRings??10;
 const top=roundRect(p.tx,p.tz,p.cornerTop,nC,nS),topY=top.map(([x,z])=>dishY(p,x,z)),grow=e=>roundRect(p.tx+e,p.tz+e,p.cornerTop+e,nC,nS);
 const bottom=roundRect(p.bx,p.bz,p.cornerBottom,nC,nS),shoulder=grow(p.fillet),rings=[];
 for(let j=0;j<=W;j++){const s=j/W;rings.push(bottom.map(([x,z],k)=>[x+(shoulder[k][0]-x)*s,p.bottom+(topY[k]-p.fillet-p.bottom)*s,z+(shoulder[k][1]-z)*s]));}
 for(let f=1;f<=F;f++){const a=f/F*Math.PI/2;rings.push(grow(p.fillet*Math.cos(a)).map(([x,z],k)=>[x,topY[k]-p.fillet+p.fillet*Math.sin(a),z]));}
 for(let m=1;m<N;m++){const k=1-m/N;rings.push(roundRect(p.tx*k,p.tz*k,p.cornerTop*k,nC,nS).map(([x,z])=>[x,dishY(p,x,z),z]));}
 return {rings,center:[0,dishY(p,0,0),0],surface:loft(rings,[0,dishY(p,0,0),0],false)};
}
// Cavity: wall-thickness offset of the skirt with a ceiling that follows the dish at topThickness.
export function keycapInterior(p,o={}){
 const nC=o.cornerSegments??8,nS=o.sideSegments??8,W=o.wallRings??6,N=o.topRings??10;
 const bottom=roundRect(p.bx-p.wall,p.bz-p.wall,Math.max(.04,p.cornerBottom-p.wall*.6),nC,nS);
 const ex=p.tx+p.fillet-p.wall,ez=p.tz+p.fillet-p.wall,er=Math.max(.03,p.cornerTop+p.fillet-p.wall),edge=roundRect(ex,ez,er,nC,nS),rings=[];
 for(let j=0;j<=W;j++){const s=j/W;rings.push(bottom.map(([x,z],k)=>{const [cx,cz]=edge[k];return [x+(cx-x)*s,p.bottom+(ceilingY(p,cx,cz)-p.bottom)*s,z+(cz-z)*s];}));}
 for(let m=1;m<N;m++){const k=1-m/N;rings.push(roundRect(ex*k,ez*k,er*k,nC,nS).map(([x,z])=>[x,ceilingY(p,x,z),z]));}
 return {rings,center:[0,ceilingY(p,0,0),0],surface:loft(rings,[0,ceilingY(p,0,0),0],true),edge:{x:ex,z:ez,r:er}};
}
// Half-width of the cavity along one axis at local height y (linear drafted inner wall).
export function cavityHalfWidth(p,axis,y){
 const b=(axis==='x'?p.bx:p.bz)-p.wall,e=(axis==='x'?p.tx:p.tz)+p.fillet-p.wall,top=axis==='x'?ceilingY(p,e,0):ceilingY(p,0,e);
 return b+(e-b)*Math.min(1,Math.max(0,(y-p.bottom)/(top-p.bottom)));
}
// Conservative horizontal cavity section at height y: half-widths plus the larger corner radius.
export function cavitySection(p,y){return {x:cavityHalfWidth(p,'x',y),z:cavityHalfWidth(p,'z',y),r:Math.max(.04,p.cornerBottom-p.wall*.6,p.cornerTop+p.fillet-p.wall)};}
export function insideRoundRect(px,pz,a,b,r){const dx=Math.abs(px)-(a-r),dz=Math.abs(pz)-(b-r);if(dx<=0||dz<=0)return Math.abs(px)<=a&&Math.abs(pz)<=b;return Math.hypot(dx,dz)<=r;}
export function buildKeycapShell(T,p,o={}){
 const ext=keycapExterior(p,o);
 if(!o.interior){const ring=ext.rings[0],cap=loft([ring],[0,p.bottom,0],true);return {exterior:geometry(T,ext.surface,cap)};}
 const int=keycapInterior(p,o),rim=loft([ext.rings[0],int.rings[0]],null,true);
 // merged: one draw call per key for the hero; surfaces keep separate vertices, so edges stay crisp.
 if(o.merged)return {exterior:geometry(T,ext.surface,int.surface,rim),cavity:int.edge};
 return {exterior:geometry(T,ext.surface),interior:geometry(T,int.surface),rim:geometry(T,rim),cavity:int.edge};
}
// Socket boss: round tube with a cross-shaped bore, hung from the ceiling down to `bottom`.
export function buildSocketGeometry(T,p,{radius=.275,bottom=p.bottom+.02,clearance=SOCKET_CLEARANCE}={}){
 const outer=new T.Shape();outer.absarc(0,0,radius,0,Math.PI*2,false);const hole=new T.Path();crossOutline(clearance).forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();outer.holes.push(hole);
 const top=ceilingY(p,0,0)+.01,g=new T.ExtrudeGeometry(outer,{depth:top-bottom,bevelEnabled:false,curveSegments:40});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);
 g.userData={bottom,top,radius,clearance};return g;
}
// Four ribs tie the socket to the inner skirt just under the ceiling.
export function buildRibGeometries(T,p,{socketRadius=.275,thickness=.05,depth=.10}={}){
 const list=[];
 for(const [axis,sign] of [['x',1],['x',-1],['z',1],['z',-1]]){
  const at=c=>axis==='x'?ceilingY(p,c*sign,0):ceilingY(p,0,c*sign),r0=socketRadius-.015;
  const lo=at(r0)-depth,r1=cavityHalfWidth(p,axis,lo)+.01,r2=cavityHalfWidth(p,axis,at(r1))+.01,s=new T.Shape();
  s.moveTo(r0,lo);s.lineTo(r1,at(r1)-depth);for(let i=0;i<=6;i++){const c=r2+(r0-r2)*i/6;s.lineTo(c,at(c)+.004);}s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:false});g.translate(0,0,-thickness/2);
  if(axis==='x'){if(sign<0)g.rotateY(Math.PI);}else g.rotateY(sign>0?-Math.PI/2:Math.PI/2);
  g.userData={axis,sign};list.push(g);
 }
 return list;
}
// DOM-free legend glyphs in a unit box (origin bottom-left, v up). Used for the study keycap.
const ARC=Math.PI/2;
export const GLYPHS={
 R:T=>{const s=new T.Shape();s.moveTo(0,0);s.lineTo(0,1);s.lineTo(.40,1);s.absarc(.40,.735,.265,ARC,-ARC,true);s.lineTo(.14,.47);s.lineTo(.14,0);s.closePath();
  const h=new T.Path();h.moveTo(.14,.61);h.lineTo(.40,.61);h.absarc(.40,.735,.125,-ARC,ARC,false);h.lineTo(.14,.86);h.closePath();s.holes.push(h);
  const leg=new T.Shape();leg.moveTo(.29,.52);leg.lineTo(.45,.52);leg.lineTo(.72,0);leg.lineTo(.555,0);leg.closePath();return {shapes:[s,leg],width:.72,height:1};},
 // Giyeok: top bar, then a stem that leans slightly left as it falls, as in gothic jamo.
 'ㄱ':T=>({shapes:[giyeok(T,0,.76,.13)],width:.76,height:.80}),
 'ㄲ':T=>({shapes:[giyeok(T,0,.40,.125),giyeok(T,.46,.40,.125)],width:.86,height:.80})
};
function giyeok(T,x,w,t){return poly(T,[[x,.80],[x+w,.80],[x+w-.05,0],[x+w-.05-t,0],[x+w-t,.80-t],[x,.80-t]]);}
function poly(T,pts){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;}
// R left, ㄲ upper right, ㄱ lower right. u→+x, v (legend up) → -z, away from the typist.
export const STUDY_LEGENDS=[{glyph:'R',role:'main',left:-.38,v:0,size:.30},{glyph:'ㄲ',role:'shift',left:.14,v:.19,size:.22},{glyph:'ㄱ',role:'base',left:.14,v:-.19,size:.22}];
export const LEGEND_LIFT=.003;
export function buildLegendGeometry(T,p,item){
 const glyph=GLYPHS[item.glyph](T),scale=item.size/glyph.height,g=new T.ShapeGeometry(glyph.shapes,12),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=item.left+a.getX(i)*scale,z=-(item.v+(a.getY(i)-glyph.height/2)*scale);a.setXYZ(i,x,dishY(p,x,z)+LEGEND_LIFT,z);}
 // (u,v,w)->(x,y,-z) is a proper rotation, so the shape's front faces end up facing +y.
 a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.userData={...item,width:glyph.width*scale,height:item.size};return g;
}
