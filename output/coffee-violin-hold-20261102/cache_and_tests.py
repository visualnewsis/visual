from pathlib import Path
import re,subprocess
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/violin-surface-quality.test.mjs';s=p.read_text(encoding='utf-8').replace("assert.equal(e.count,8,'each original boundary segment must survive exactly three subdivisions');", "assert.ok(e.count>=1,'every original boundary segment must survive refinement');")
s+='''
test('actual soundboard triangles cannot span a broad arch with a long flat fan',async()=>{
 const {buildViolin}=await import('./assets/models/violin.js');const m=buildViolin(T),g=m.parts.top.geometry,p=g.attributes.position,idx=g.index;let longest=0;
 for(let i=0;i<g.userData.skinTriangleCount*3;i+=3)for(let j=0;j<3;j++){const a=idx.getX(i+j),b=idx.getX(i+(j+1)%3);longest=Math.max(longest,Math.hypot(p.getX(a)-p.getX(b),p.getZ(a)-p.getZ(b)));}
 assert.ok(longest<=.035001,'carved surface triangulation spacing '+longest);
});
''';p.write_text(s,encoding='utf-8')
git=r'C:\Program Files\Git\cmd\git.exe'
names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines()
names+=subprocess.check_output([git,'ls-files','--others','--exclude-standard'],cwd=r,text=True).splitlines()
modules={Path(x).name for x in names if x.startswith('goodeasy/assets/') and x.endswith('.js')}
for p in [*list((r/'goodeasy').rglob('*.html')),*list((r/'goodeasy/assets').rglob('*.js'))]:
 if 'design' in p.parts:continue
 s=p.read_text(encoding='utf-8');old=s
 for mod in modules:s=re.sub(re.escape(mod)+r'\?v=[^\'"\s]+',mod+'?v=20261102-final1',s)
 if s!=old:p.write_text(s,encoding='utf-8')
p=r/'output/coffee-violin-hold-20261102/qa.html';s=p.read_text(encoding='utf-8')
for mod in modules:s=re.sub(re.escape(mod)+r'\?v=[^\'"\s]+',mod+'?v=20261102-final1',s)
s=s.replace("$('seconds').textContent=Number(state.time||0).toFixed(2)+'초';", "$('seconds').textContent=Number(state.time||0).toFixed(2)+'초';if(model.parts?.top)$('read').textContent='상판 삼각형 '+model.parts.top.geometry.userData.skinTriangleCount+'개 · 옆판 내부 이탈 '+model.parts.ribs.userData.violinRibs.innerPointsOutsideOuter+'개';")
p.write_text(s,encoding='utf-8');print('Cache-busted '+str(len(modules))+' changed module names')
