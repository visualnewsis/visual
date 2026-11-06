from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/style.css')
s=p.read_text(encoding='utf-8')
old='@media(max-width:700px){.news-modes button{min-height:44px;font-size:10px}}'
new='@media(max-width:700px){.map-actions{width:128px}.news-modes button{min-height:44px;font-size:12px}}'
assert old in s
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
