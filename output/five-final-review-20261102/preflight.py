from pathlib import Path
import subprocess,re,json
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(r'C:\Users\user\Documents\editshop\output\five-final-review-20261102');git=r'C:\Program Files\Git\cmd\git.exe';node=r'C:\Program Files\nodejs\node.exe';py=r'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
p=r/'goodeasy/review/index.html';s=p.read_text(encoding='utf-8').replace('바이올린 · 출고 보류','바이올린 · 최종 검수본').replace('수정본 검토 대기','활을 그어볼까요?').replace('굳이? 싶은걸 연구합니다','굳이? 싶을 정도로 파고듭니다.');p.write_text(s,encoding='utf-8')
subprocess.run([git,'fetch','origin'],cwd=r,check=True)
if int(subprocess.check_output([git,'rev-list','--count','HEAD..origin/main'],cwd=r,text=True)):subprocess.run([git,'merge','--ff-only','origin/main'],cwd=r,check=True)
names=subprocess.check_output([git,'diff','--name-only'],cwd=r,text=True).splitlines()+subprocess.check_output([git,'ls-files','--others','--exclude-standard'],cwd=r,text=True).splitlines();files=[x for x in names if x.startswith('goodeasy/')]
for f in files:
 if f.endswith('.js'):
  p=r/f;s=p.read_text(encoding='utf-8');p.write_text(re.sub(r'(?m)^ +$','',s),encoding='utf-8');subprocess.run([node,'--check',f],cwd=r,check=True,capture_output=True)
for args in [[py,'goodeasy/check.py','.'],[py,'.github/scripts/check_visual_site.py'],[git,'diff','--check']]:subprocess.run(args,cwd=r,check=True)
(out/'changed-files.json').write_text(json.dumps(files,ensure_ascii=False,indent=2),encoding='utf-8');print('Final syntax, paths, metadata, release states passed. Task files:',len(files))
