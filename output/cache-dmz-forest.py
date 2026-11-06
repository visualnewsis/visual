from pathlib import Path
for p in Path('dmz/js').glob('*.js'):
 if p.name=='three.js':continue
 s=p.read_text(encoding='utf-8');n=s.replace('20261027-world2','20261027-forest3')
 if s!=n:p.write_text(n,encoding='utf-8',newline='')
p=Path('dmz/index.html');s=p.read_text(encoding='utf-8');p.write_text(s.replace('20261027-world2','20261027-forest3'),encoding='utf-8',newline='')
