from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');src=Path(r'C:\Users\user\Documents\editshop\output\five-final-review-20261102\claude-local-fixes.js').read_text(encoding='utf-8')
p=r/'goodeasy/assets/models/violin.js';s=p.read_text(encoding='utf-8');a=s.index('function fingerboardGeometry(T) {') if 'function fingerboardGeometry(T) {' in s else s.index('function fingerboardGeometry(T){');b=s.index('\nexport function buildViolin',a);fn=src[src.index('function fingerboardGeometry(T) {'):src.index('// ============================================================================',src.index('function fingerboardGeometry(T) {'))].strip();s=s[:a]+fn+'\n'+s[b:]
s=s.replace("const inner=violinInnerOutline(THREE,contour,.008);\n const ribs=buildViolinRibs(THREE,contour,inner,.106,-.105", "const ribOuter=violinInnerOutline(THREE,contour,.012),inner=violinInnerOutline(THREE,ribOuter,.008);\n const ribs=buildViolinRibs(THREE,ribOuter,inner,.099,-.113")
s=s.replace("backY:(x,z)=>plateY(back,x,z),black,steel", "backY:(x,z)=>plateY(back,x,z),edgeX:z=>{let x=-Infinity;for(let i=0;i<ribOuter.length;i++){const a=ribOuter[i],b=ribOuter[(i+1)%ribOuter.length];if((a.y<=z&&b.y>=z)||(b.y<=z&&a.y>=z)){if(Math.abs(b.y-a.y)>1e-8)x=Math.max(x,a.x+(b.x-a.x)*(z-a.y)/(b.y-a.y));}}return x;},black,steel")
s=s.replace("[.018,.012,.018],brass,'frog eye'", "[.012,.010,.012],ivory,'frog pearl eye'")
s=s.replace(" orientedBox(THREE,[.060,.012,.050]", " orientedBox(THREE,[.063,.052,.006],[contactX+.035,hairY+.035,-.73],steel,'frog silver heel plate',bow,.002);\n orientedBox(THREE,[.060,.012,.050]")
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/models/violin-fittings.js';s=p.read_text(encoding='utf-8').replace('backY,black,steel','backY,edgeX=()=>1.178,black,steel').replace('const edge=1.19,footX=1.04','const edge=edgeX(z)+.012,footX=Math.min(1.04,edge-.025)')
s=s.replace("clamp.castShadow=true;group.add(clamp);", """clamp.castShadow=true;group.add(clamp);
  const barrel=new T.Mesh(new T.CylinderGeometry(.012,.012,.085,24),steel);barrel.name='chinrest threaded barrel '+i;barrel.position.set(edge,(armY+shoeTop)/2,z);group.add(barrel);
  for(let k=0;k<6;k++){const collar=new T.Mesh(new T.TorusGeometry(.0122,.001,6,24),steel);collar.rotation.x=Math.PI/2;collar.position.set(edge,barrel.position.y-.030+k*.012,z);collar.name='chinrest adjustment grip '+i+':'+k;group.add(collar);}""")
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/gramophone/gramophone-model.js';s=p.read_text(encoding='utf-8');old="soundbox.position.set(.155,.105,0);";assert old in s;s=s.replace(old,"soundbox.rotation.y=-Math.PI/2;soundbox.position.set(.24,.105,-.085);")
p.write_text(s,encoding='utf-8')
# The private review must always load the latest source, independently of production caches.
for p in (r/'output').rglob('*.html'):
 if p.name not in ['qa.html','violin-diagnostic.html']:continue
 s=p.read_text(encoding='utf-8').replace('20261102-final3','20261102-deep1');p.write_text(s,encoding='utf-8')
print('Applied actual Claude fingerboard/rib/soundbox fixes plus threaded chinrest clamps')
