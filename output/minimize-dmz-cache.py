from pathlib import Path
p=Path('dmz/js/canopy.js');s=p.read_text(encoding='utf-8');p.write_text(s.replace('20261027-forest3','20261027-world2'),encoding='utf-8',newline='')
p=Path('dmz/index.html');s=p.read_text(encoding='utf-8');p.write_text(s.replace('css/dmz.css?v=20261027-forest3','css/dmz.css?v=20261027-world2'),encoding='utf-8',newline='')
