from pathlib import Path
import subprocess,re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');git=r'C:\Program Files\Git\cmd\git.exe'
names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines()+subprocess.check_output([git,'ls-files','--others','--exclude-standard'],cwd=r,text=True).splitlines()
mods={Path(x).name for x in names if x.startswith('goodeasy/assets/') and x.endswith('.js')}
for p in [*(r/'goodeasy').rglob('*.html'),*(r/'goodeasy/assets').rglob('*.js'),r/'output/coffee-violin-hold-20261102/qa.html']:
 if 'design' in p.parts:continue
 s=p.read_text(encoding='utf-8');old=s
 for m in mods:s=re.sub(re.escape(m)+r'\?v=[^\x27\x22\s]+',m+'?v=20261102-final2',s)
 if s!=old:p.write_text(s,encoding='utf-8')
print('Final cache references',len(mods))
