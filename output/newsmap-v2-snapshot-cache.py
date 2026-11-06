from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/index.html')
s=p.read_text(encoding='utf-8')
old='data/articles.js?v=20261023-final'
assert old in s
p.write_text(s.replace(old,'data/articles.js?v=20261103-review-v2'),encoding='utf-8')
