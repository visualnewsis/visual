from pathlib import Path
import subprocess,re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');git=r'C:\Program Files\Git\cmd\git.exe';names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines();mods={Path(x).name for x in names if x.endswith('.js')}
for p in [*(r/'goodeasy').rglob('*.html'),*(r/'goodeasy').rglob('*.js'),*list((r/'output/coffee-violin-hold-20261102').glob('*.html')),*list((r/'output/five-final-review-20261102').glob('*.html'))]:
 if 'design' in p.parts:continue
 s=p.read_text(encoding='utf-8');old=s
 for m in mods:s=re.sub(re.escape(m)+r'\?v=[^\x27\x22\s]+',m+'?v=20261102-deep2',s)
 if old!=s:p.write_text(s,encoding='utf-8')
p=r/'goodeasy/violin-surface-quality.test.mjs';s=p.read_text(encoding='utf-8');a=s.index("test('outer varnish, cavity wood and cut walls use three disjoint material ranges'");b=s.index('\n});',a)+4
s=s[:a]+'''test('outer plate edge retains varnish while the inside and f holes expose cavity wood',()=>{
 const n=geometry.userData.skinTriangleCount*3,O=geometry.userData.outerWallIndexCount,H=geometry.userData.holeWallIndexCount;
 assert.deepEqual(geometry.groups,[{start:0,count:n,materialIndex:0},{start:n,count:n,materialIndex:1},{start:n*2,count:O,materialIndex:0},{start:n*2+O,count:H,materialIndex:2}]);assert.ok(O>0&&H>0);assert.equal(geometry.index.count,2*n+O+H);
});''' +s[b:];p.write_text(s,encoding='utf-8')
print('Bust actual changed module references:',len(mods))
