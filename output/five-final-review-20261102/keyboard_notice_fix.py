from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/keyboard/index.html';s=p.read_text(encoding='utf-8');v=(r/'goodeasy/violin/index.html').read_text(encoding='utf-8');a=v.index('<div class="audio-notice"');b=v.index('</div>',a)+6
if 'class="audio-notice"' not in s:s=s.replace('</h1>','</h1>'+v[a:b],1)
p.write_text(s,encoding='utf-8');print('Keyboard sound notice count',s.count('class="audio-notice"'))
