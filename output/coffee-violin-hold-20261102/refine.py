from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(__file__).parent
p=r/'goodeasy/assets/models/violin-fittings.js';p.write_text((out/'violin-fittings.js').read_text(encoding='utf-8'),encoding='utf-8')
p=r/'goodeasy/assets/models/violin-ribs.js';s=p.read_text(encoding='utf-8')
s+='''
// Inward offset follows the local boundary normal rather than a centroid ray.
// A centroid-ray inset can cross a concave C-bout and reverse the rim triangles.
export function violinInnerOutline(T,outer,thickness=.008){
 const sign=T.ShapeUtils.area(outer)>0?1:-1,n=outer.length;
 const inside=p=>{let hit=false;for(let i=0,j=n-1;i<n;j=i++){const a=outer[i],b=outer[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
 return outer.map((p,i)=>{const a=outer[(i+n-1)%n],b=outer[(i+1)%n],e0=p.clone().sub(a).normalize(),e1=b.clone().sub(p).normalize(),N0=new T.Vector2(-e0.y,e0.x).multiplyScalar(sign),N1=new T.Vector2(-e1.y,e1.x).multiplyScalar(sign),bis=N0.clone().add(N1).normalize(),distance=Math.min(thickness*2,thickness/Math.max(.5,bis.dot(N1)));let q;
  for(let step=1;step>.001;step*=.75){q=p.clone().addScaledVector(bis,distance*step);if(inside(q))return q;}
  throw Error('Violin inward rib offset is not inside its outer contour');
 });
}
'''
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/models/violin.js';s=p.read_text(encoding='utf-8').replace('{buildViolinRibs}', '{buildViolinRibs,violinInnerOutline}').replace('const inner=insetOutline(THREE,contour,.025);','const inner=violinInnerOutline(THREE,contour,.008);').replace('topY:(x,z)=>plateY(top,x,z),backY:', 'topY:(x,z)=>plateY(top,x,z),topShapeY:(x,z)=>.106+violinDome(x,z),backY:');p.write_text(s,encoding='utf-8')
print('Corrected the concave rib offset and removed repeated full-plate raycasts from chinrest base fitting')
