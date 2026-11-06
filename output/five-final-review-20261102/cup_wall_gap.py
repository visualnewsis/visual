from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/assets/coffee-detail.js';s=p.read_text(encoding='utf-8').replace('ra-.026','ra-.006').replace('(top-ya)/(yb-ya))-.026','(top-ya)/(yb-ya))-.006').replace('availableRadius - 0.026','availableRadius - 0.006');p.write_text(s,encoding='utf-8')
p=r/'goodeasy/espresso-ratio-volume.test.mjs';s=p.read_text(encoding='utf-8').replace('-.026','-.006');p.write_text(s,encoding='utf-8')
p=r/'goodeasy/espresso-crema-clearance.test.mjs';s=p.read_text(encoding='utf-8').replace("assert.ok(Math.abs(surface.scale.x-(cavityAt(expected)-.026))<1e-10,'surface radius must follow actual porcelain profile with .026 clearance');", "const gap=cavityAt(expected)-surface.scale.x;assert.ok(gap>=.004&&gap<=.008,'liquid must approach the real inner wall without crossing it');").replace("<cavity-.020,'surface crosses porcelain wall'", "<cavity-.003,'surface crosses porcelain wall'");p.write_text(s,encoding='utf-8')
