from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/style.css')
s=p.read_text(encoding='utf-8').replace('\n.legend-short{display:none}', '\n.map-legend .legend-short{display:none}')
p.write_text(s,encoding='utf-8')
