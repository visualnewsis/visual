from pathlib import Path
import subprocess,re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');git=r'C:\Program Files\Git\cmd\git.exe';version='20261102-rescue2'
files=[*(r/'goodeasy').rglob('*.html'),*(r/'goodeasy').rglob('*.js'),*list((r/'output/coffee-violin-hold-20261102').glob('*.html')),*list((r/'output/five-final-review-20261102').glob('*.html'))]
for turn in range(12):
 names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines();mods={Path(x).name for x in names if x.endswith('.js')};changed=0
 for p in files:
  if 'design' in p.parts:continue
  s=p.read_text(encoding='utf-8');old=s
  for m in mods:s=re.sub(re.escape(m)+r'\?v=[^\x27\x22\s]+',m+'?v='+version,s)
  if old!=s:p.write_text(s,encoding='utf-8');changed+=1
 if not changed:break
print('Dependency graph cache updated in',turn+1,'passes;',len(mods),'changed modules')
