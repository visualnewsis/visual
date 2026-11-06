from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/app.js')
s=p.read_text(encoding='utf-8').replace("if(!silent||changed)render('replace');", "if(!silent||changed||!hasValidSnapshot)render('replace');")
p.write_text(s,encoding='utf-8')
