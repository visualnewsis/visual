from pathlib import Path
p=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy\assets\models\violin.js');s=p.read_text(encoding='utf-8').replace("[contactX+.035,hairY+.047,-.67],[.012,.010,.012],ivory,'frog pearl eye'", "[contactX+.070,hairY+.037,-.67],[.003,.012,.012],ivory,'frog pearl eye'")
s=s.replace(" orientedBox(THREE,[.063,.052,.006]", " orientedBox(THREE,[.064,.014,.018],[contactX+.010,hairY+.006,-.610],steel,'frog front silver ferrule',bow,.003);\n orientedBox(THREE,[.060,.004,.098],[contactX+.035,hairY+.007,-.670],steel,'frog polished underslide',bow,.001);\n orientedBox(THREE,[.063,.052,.006]")
p.write_text(s,encoding='utf-8')
