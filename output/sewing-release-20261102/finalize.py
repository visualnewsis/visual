from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/sewing-machine/index.html'
s=p.read_text(encoding='utf-8').replace('</p></div><p class="publication-date">','</p><p class="publication-date">').replace('</time></p></footer>','</time></p></div></footer>')
p.write_text(s,encoding='utf-8')
