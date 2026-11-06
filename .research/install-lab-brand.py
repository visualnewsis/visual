from pathlib import Path
import subprocess,re,shutil
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
src=Path(r'C:\Users\user\Documents\editshop\.research\brand-flask.svg')
asset=root/'assets/menu-icon-goodeasy.svg';shutil.copyfile(src,asset)
def label(prefix):return f'<small class="brand-lab"><img src="{prefix}assets/menu-icon-goodeasy.svg" width="16" height="20" alt="">연구소</small>'
p=root/'goodeasy/index.html';s=p.read_text(encoding='utf8')
s=s.replace('<span>굳이구지 <i>究知</i></span></a>','<span>굳이구지 <i>究知</i></span>'+label('../')+'</a>')
s=s.replace('<a href="./">굳이구지 <i>究知</i></a>','<a href="./">굳이구지 <i>究知</i>'+label('../')+'</a>')
s=s.replace('landing.css?v=20261025-2','landing.css?v=20261026-lab1')
s=s.replace('data-section="굳이구지"','data-current="goodeasy" data-section="굳이구지"')
p.write_text(s,encoding='utf8')
p=root/'goodeasy/assets/landing.css';s=p.read_text(encoding='utf8');s+='''
.signature .brand-lab,.footer .brand-lab{display:flex;align-items:center;gap:5px;width:max-content;margin:3px 0 0;color:#b8c4bb;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:.16em}.brand-lab img{display:block;width:16px;height:20px;flex:none;object-fit:contain}.footer .brand-lab{margin-top:8px;font-size:11px}.footer .brand-lab img{width:19px;height:24px}
@media(max-width:650px){.signature .brand-lab{font-size:9px;gap:4px}.signature .brand-lab img{width:14px;height:18px}.hero-copy>.eyebrow{margin-top:22px}}
''';p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/index.html';s=p.read_text(encoding='utf8')
s=s.replace('굳이구지<span>究知</span></a>','굳이구지<span>究知</span>'+label('../../')+'</a>')
s=s.replace('굳이? 싶은걸 연구합니다','굳이? 싶을 정도로 파고듭니다.')
s=s.replace('안재현의 굳이구지 · PIANO','안재현의 굳이구지 연구소 · PIANO')
s=s.replace('piano.css?v=20261026-quote1','piano.css?v=20261026-lab1')
s=s.replace('data-section="굳이구지" data-header-theme','data-current="goodeasy" data-section="굳이구지" data-section-href="../" data-header-theme')
p.write_text(s,encoding='utf8')
p=root/'goodeasy/piano/piano.css';s=p.read_text(encoding='utf8');s+='''
.wordmark .brand-lab{display:flex;align-items:center;gap:5px;font:400 10px/1.4 Arial,"Malgun Gothic",sans-serif;letter-spacing:.15em;color:#b8c4bb;margin:7px 0 0}.wordmark .brand-lab img{display:block;width:16px;height:20px;object-fit:contain}
''';p.write_text(s,encoding='utf8')
p=root/'assets/visual-header.js';s=p.read_text(encoding='utf8')
s=s.replace('arcade:"충무로딩",calculator:', 'arcade:"충무로딩",goodeasy:"굳이구지",calculator:')
s=s.replace('arcade:"https://visual.newsis.com/arcade/",calculator:', 'arcade:"https://visual.newsis.com/arcade/",goodeasy:"https://visual.newsis.com/goodeasy/",calculator:')
s=s.replace('const icons={onepoint:', 'const icons={goodeasy:new URL("menu-icon-goodeasy.svg",script.src).href,onepoint:')
s=s.replace('class="vnh-icon" src=', 'class="vnh-icon${current===\'goodeasy\'?\' vnh-lab-icon\':\'\'}" src=')
s=s.replace("key==='onepoint'?' vnh-character-icon':''", "key==='onepoint'?' vnh-character-icon':key==='goodeasy'?' vnh-lab-icon':''")
p.write_text(s,encoding='utf8')
p=root/'assets/visual-header.css';s=p.read_text(encoding='utf8');s+='\n.vnh-nav-icon.vnh-lab-icon,.vnh-icon.vnh-lab-icon{height:20px;width:16px;object-fit:contain}\n';p.write_text(s,encoding='utf8')
p=root/'arcade/assets/arcade-header.js';s=p.read_text(encoding='utf8')
needle=' function close()'
insert=''' if(!nav.querySelector('a[href="/goodeasy/"]')){const entry=document.createElement('a');entry.href='/goodeasy/';entry.className='cgh-lab-entry';entry.innerHTML='<img src="/assets/menu-icon-goodeasy.svg" alt="">굳이구지';const arcade=nav.querySelector('a[href="/arcade/"]');arcade?arcade.after(entry):nav.append(entry);}
'''
assert s.count(needle)==1;s=s.replace(needle,insert+needle);p.write_text(s,encoding='utf8')
p=root/'arcade/assets/arcade-header.css';s=p.read_text(encoding='utf8');s+='\n.cgh-shell .cgh-nav .cgh-lab-entry img{height:20px!important;width:16px!important;object-fit:contain}\n';p.write_text(s,encoding='utf8')
# Only version query strings in tracked HTML are changed; preserve original bytes/newlines.
git=r'C:\Program Files\Git\cmd\git.exe'
files=subprocess.check_output([git,'ls-files','-z','--','*.html'],cwd=root).decode().split('\0');updated=[]
for rel in filter(None,files):
 p=root/rel;s=p.read_bytes().decode('utf-8');new=re.sub(r'((?:visual-header|arcade-header)\.(?:css|js)\?v=)[^"\s>]+',r'\g<1>20261026-goodeasy-lab1',s)
 if new!=s:p.write_bytes(new.encode('utf-8'));updated.append(rel)
print('Brand mark, small lab labels and common/arcade menu entries added. Cache queries updated in',len(updated),'tracked HTML files.')
print('\n'.join(updated))
