from pathlib import Path
import subprocess,re,json
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\coffee-violin-hold-20261102');git=r'C:\Program Files\Git\cmd\git.exe';node=r'C:\Program Files\nodejs\node.exe'
names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines()+subprocess.check_output([git,'ls-files','--others','--exclude-standard'],cwd=r,text=True).splitlines();files=[x for x in names if x.startswith('goodeasy/')]
for f in files:
 p=r/f;s=p.read_text(encoding='utf-8');s=s.replace('20261102-final2','20261102-final3')
 if f=='goodeasy/assets/coffee-detail.js':s=re.sub(r'(?m)^ +$','',s)
 p.write_text(s,encoding='utf-8')
p=r/'output/coffee-violin-hold-20261102/qa.html';p.write_text(p.read_text(encoding='utf-8').replace('20261102-final2','20261102-final3'),encoding='utf-8')
for f in files:
 if f.endswith('.js'):subprocess.run([node,'--check',f],cwd=r,check=True,capture_output=True)
tests=['violin-release-quality','violin-surface-quality','violin-final-fit','espresso-final-material','projector-espresso-quality','espresso-experience-quality','espresso-ratio-volume','espresso-crema-clearance']
res=subprocess.run([node,'--test',*[f'goodeasy/{x}.test.mjs' for x in tests]],cwd=r,capture_output=True,text=True,encoding='utf-8');(out/'final-tests.txt').write_text(res.stdout+res.stderr,encoding='utf-8');print(res.stdout[-350:]);assert res.returncode==0
subprocess.run([git,'diff','--check'],cwd=r,check=True)
(out/'changed-files.json').write_text(json.dumps(files,ensure_ascii=False,indent=2),encoding='utf-8');print('Syntax passed;',len(files),'task source/test files; no private output staged')
