from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/assets/models/violin.js';s=p.read_text(encoding='utf-8');old="export const violinDome=(x,z)=>{const d=archContour.length?Math.min(1,edgeDistance(x,z,archContour)/.16):1,fade=d*d*(3-2*d);return .078*Math.max(0,1-((x-.19)/1.12)**2-(z/.44)**2)*fade;};"
assert old in s
s=s.replace(old,'''const archWidths=new Map();
function sectionWidth(x){
 const key=x.toFixed(8);if(archWidths.has(key))return archWidths.get(key);let w=0;
 for(let i=0;i<archContour.length;i++){const a=archContour[i],b=archContour[(i+1)%archContour.length];if((a.x<=x&&b.x>=x)||(b.x<=x&&a.x>=x)){const dx=b.x-a.x;if(Math.abs(dx)>1e-12)w=Math.max(w,Math.abs(a.y+(b.y-a.y)*(x-a.x)/dx));}}
 archWidths.set(key,w);return w;
}
// A smooth transverse arch, not a nearest-edge distance field with medial ridges.
export const violinDome=(x,z)=>{const w=sectionWidth(x);if(w<1e-8)return 0;const q=Math.max(0,1-(z/w)**2),u=Math.max(0,Math.min(1,(x+.78)/1.95));return .078*Math.sin(Math.PI*u)**1.1*q*q*(3-2*q);};''')
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/models/violin-fittings.js';s=p.read_text(encoding='utf-8').replace("const underside=(x,z)=>base-.012+.018*(((x-cx)/rx)**2+((z-cz)/rz)**2);", "const underside=(x,z)=>topShapeY(x,z)+.007;")
old="const y=base+(layer?-.012:.016)+rise*r*r,n=new T.Vector3(-2*rise*(x-cx)/(rx*rx),1,-2*rise*(z-cz)/(rz*rz)).normalize().multiplyScalar(layer?-1:1);"
new="const y=layer?underside(x,z):base+.016+rise*r*r,h=1e-4,dx=layer?(underside(x+h,z)-underside(x-h,z))/(2*h):2*rise*(x-cx)/(rx*rx),dz=layer?(underside(x,z+h)-underside(x,z-h))/(2*h):2*rise*(z-cz)/(rz*rz),n=new T.Vector3(-dx,1,-dz).normalize().multiplyScalar(layer?-1:1);"
assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
print('Replaced medial-edge arch ridges with a transverse carved arch and fitted thin cork-contact underside')
