from pathlib import Path
import re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(__file__).parent
for src,dst in [('claude-buildViolinRibs.js','violin-ribs.js'),('violin-fittings.js','violin-fittings.js')]:
 (r/'goodeasy/assets/models'/dst).write_text((out/src).read_text(encoding='utf-8').replace('\u00a0',' '),encoding='utf-8')
p=r/'goodeasy/assets/models/violin.js';s=p.read_text(encoding='utf-8')
s="import {buildViolinRibs} from './violin-ribs.js?v=20261102-craft1';\nimport {buildChinrest} from './violin-fittings.js?v=20261102-craft1';\n"+s
s=s.replace('insetOutline,hollowRibs,archedPlate','insetOutline,archedPlate')
s=s.replace('const ribs=hollowRibs(THREE,','const ribs=buildViolinRibs(THREE,')
s=s.replace('[-.235,.349],[-.15,.264],\n  [-.112,.313],[-.042,.242],[.062,.240],[.155,.245],[.262,.245],[.325,.316],\n  [.365,.263],[.50,.389]','[-.235,.349],[-.13,.340],\n  [-.085,.276],[-.042,.250],[.062,.240],[.155,.245],[.262,.268],[.325,.340],\n  [.40,.348],[.50,.389]')
s=s.replace('[.50,-.389],[.365,-.263],\n  [.325,-.316],[.262,-.245],[.155,-.245],[.062,-.240],[-.042,-.242],[-.112,-.313],\n  [-.15,-.264],[-.235,-.349]','[.50,-.389],[.40,-.348],\n  [.325,-.340],[.262,-.268],[.155,-.245],[.062,-.240],[-.042,-.250],[-.085,-.276],\n  [-.13,-.340],[-.235,-.349]')
# Keep all string-contact top heights, but make the gluing face planar across each neck station.
s=s.replace('pos.push(x,violinBoardY(x,z)-layer*.030,z);','pos.push(x,layer?(.196+(x+1.59)/1.055*.021):violinBoardY(x,z),z);')
s=s.replace('boardWidth(x)+.014,.188,t=>','boardWidth(x)+.014,.196,t=>')
start=s.index(" const chinrest=assemblyGroup(THREE,'chinrest'");end=s.index(' // Neck, ebony fingerboard',start)
s=s[:start]+" parts.chinrest=buildChinrest(THREE,{parent:group,topY:(x,z)=>plateY(top,x,z),backY:(x,z)=>plateY(back,x,z),black,steel});\n"+s[end:]
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/models/violin-finish.js';s=p.read_text(encoding='utf-8').replace("roughness:kind==='spruce'?.32:.34","roughness:kind==='spruce'?.40:.46").replace('clearcoat:.65,clearcoatRoughness:.18','clearcoat:.38,clearcoatRoughness:.30');p.write_text(s,encoding='utf-8')
# Ensure all consumers receive the same repaired physical model.
for p in (r/'goodeasy/assets').rglob('*.js'):
 if p.name=='coffee-material-textures.js':continue
 old=p.read_text(encoding='utf-8');s=old
 for mod in ['models/violin','violin-finish','violin-ribs','violin-fittings']:
  s=re.sub(re.escape(mod)+r'\.js\?v=[^\'"\s]+',mod+'.js?v=20261102-craft1',s)
 if s!=old:p.write_text(s,encoding='utf-8')
for name in ['quality-instruments.js','quality-stage.js','violin-lessons.js','anatomy-models.js','research-other.js','research.js','anatomy-viewer.js']:
 p=r/'goodeasy/assets'/name;old=p.read_text(encoding='utf-8');s=old
 for mod in ['quality-instruments','violin-lessons','anatomy-models','research-other']:
  s=re.sub(mod+r'\.js\?v=[^\'"\s]+',mod+'.js?v=20261102-craft1',s)
 if s!=old:p.write_text(s,encoding='utf-8')
p=r/'goodeasy/violin/index.html';s=p.read_text(encoding='utf-8')
for mod in ['quality-stage','research','anatomy-viewer']:
 s=re.sub(mod+r'\.js\?v=[^\'"\s]+',mod+'.js?v=20261102-craft1',s)
p.write_text(s,encoding='utf-8')
print('Applied Claude independent wall normals, cleaned C-bout, fitted ebony/neck glue face and cork-supported carved chinrest')
