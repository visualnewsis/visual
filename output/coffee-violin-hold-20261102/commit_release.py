from pathlib import Path
import subprocess,json
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\coffee-violin-hold-20261102');git=r'C:\Program Files\Git\cmd\git.exe'
p=r/'goodeasy/review/index.html';s=p.read_text(encoding='utf-8').replace('형상·부품 접촉 재검토 중','수정본 검토 대기');p.write_text(s,encoding='utf-8')
files=json.loads((out/'changed-files.json').read_text(encoding='utf-8'))
subprocess.run([git,'fetch','origin'],cwd=r,check=True)
assert subprocess.check_output([git,'rev-list','--left-right','--count','HEAD...origin/main'],cwd=r,text=True).strip()=='0\t0','remote changed; integrate before push'
subprocess.run([git,'add','--',*files],cwd=r,check=True)
subprocess.run([git,'diff','--cached','--check'],cwd=r,check=True)
subprocess.run([git,'commit','-m','Refine violin construction and espresso extraction materials'],cwd=r,check=True)
subprocess.run([git,'fetch','origin'],cwd=r,check=True)
assert subprocess.check_output([git,'rev-list','--count','HEAD..origin/main'],cwd=r,text=True).strip()=='0','remote advanced; integrate first'
subprocess.run([git,'push','origin','HEAD:main'],cwd=r,check=True)
print('Published commit',subprocess.check_output([git,'rev-parse','HEAD'],cwd=r,text=True).strip())
