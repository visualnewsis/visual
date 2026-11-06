from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/keyboard/index.html';s=p.read_text(encoding='utf-8');reference=(r/'goodeasy/violin/index.html').read_text(encoding='utf-8');a=reference.index('<div class="audio-notice"');b=reference.index('</div>',a)+6;notice=reference[a:b]
if 'audio-notice' not in s:
 s=s.replace('</h1>','</h1>'+notice,1);s=s.replace('</head>','<link rel="stylesheet" href="../assets/audio-notice.css?v=20261027-audio1"></head>')
p.write_text(s,encoding='utf-8')
# New cache stamp through the complete dependency graph, including HTML entrypoints.
p=Path(r'C:\Users\user\Documents\editshop\output\five-final-review-20261102\cache_graph.py');s=p.read_text(encoding='utf-8').replace("version='20261102-rescue1'","version='20261102-rescue2'");p.write_text(s,encoding='utf-8')
