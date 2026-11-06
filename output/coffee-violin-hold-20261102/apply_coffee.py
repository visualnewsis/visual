from pathlib import Path
from PIL import Image
import base64,re,shutil
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(__file__).parent
atlas=Image.open(r'C:\Users\user\.codex\generated_images\01a16619-0fc3-7723-9a18-398e99f9eef7\exec-2a0ffeb5-873a-4d16-9040-f839c4eb8b62.png').convert('RGB')
w,h=atlas.size
tiles={key:atlas.crop(box).resize((256,256),Image.Resampling.LANCZOS) for key,box in [('grounds',(0,0,w//2,h)),('crema',(w//2,0,w,h))]}
lines=["// GPT-generated material atlas, decoded synchronously in browsers and geometry tests.","import {T} from './quality-kit.js?v=20261028-craft7';",'const pixels={']
for key,im in tiles.items():
 im.save(out/f'{key}-material.png')
 lines.append(key+':'+repr(base64.b64encode(im.tobytes()).decode())+',')
lines+=['};','const cache=new Map();',"export function coffeeMaterialTexture(kind){if(cache.has(kind))return cache.get(kind);if(!pixels[kind])throw Error('Unknown coffee material');const raw=atob(pixels[kind]),data=new Uint8Array(256*256*4);for(let i=0,j=0;i<raw.length;i+=3,j+=4){data[j]=raw.charCodeAt(i);data[j+1]=raw.charCodeAt(i+1);data[j+2]=raw.charCodeAt(i+2);data[j+3]=255;}const map=new T.DataTexture(data,256,256,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;map.name='GPT '+kind+' microtexture';cache.set(kind,map);return map;}"]
(r/'goodeasy/assets/coffee-material-textures.js').write_text('\n'.join(lines),encoding='utf-8')
p=r/'goodeasy/assets/coffee-detail.js';s=p.read_text(encoding='utf-8');s="import {coffeeMaterialTexture} from './coffee-material-textures.js?v=20261102-material1';\n"+s
start=s.index('let coffeeSurfaceMaps;');end=s.index('export function createCoffeeCup()',start)
s=s[:start]+'''function createCoffeeSurfaceMaterial() {
 const color=coffeeMaterialTexture('crema');
 const material=new T.MeshPhysicalMaterial({color:0xffffff,map:color,roughness:.65,clearcoat:.06,clearcoatRoughness:.6,side:T.DoubleSide});
 material.name='continuous thin crema microfoam';return material;
}

'''+s[end:]
start=s.index('function createFlowSystem(');end=s.index('function createSectionAssembly(',start)
flow=(out/'claude-createFlowSystem.js').read_text(encoding='utf-8').replace('\u00a0',' ')
# Own a texture clone: changing repeat/wrap for a sectional field must not change the dose map.
flow=flow.replace("? coffeeMaterialTexture('grounds') : null","? coffeeMaterialTexture('grounds').clone() : null")
flow=flow.replace("const BED_W = 1.84, BED_H = 0.72, BED_CY = 0.235, BED_Z = 0.19;","const BED_W = 1.84, BED_H = 0.72, BED_CY = 0.235, BED_Z = 0.19;")
s=s[:start]+flow+'\n\n'+s[end:]
# Cup is updated before the flow endpoint, so the single falling strand touches the moving surface.
start=s.index('      bed.flow.update(');end=s.index('      // The cup is a time-dependent',start)
s=s[:start]+s[end:]
anchor='''      bed.cup.setFill(
        illustrativeFill,
        time,
        pressure > 0 && time > (1.25 + sideGrind / 100 * .25) && time < 16
      );'''
assert anchor in s
s=s.replace(anchor,anchor+'''
      bed.flow.update(sideGrind,pressure,sideChannel,time,ratio,
        bed.cup.group.position.y + bed.cup.group.scale.y * bed.cup.group.userData.surfaceY);
''')
# Replace nut-sized exposed chunks with a continuous, densely textured tamped surface.
start=s.index('  // Irregular exposed granules on the upper face.');end=s.index('  function setDose(dose)',start)
s=s[:start]+'''  topSurface.material=new T.MeshStandardMaterial({color:0xffffff,map:coffeeMaterialTexture('grounds'),roughness:.96,metalness:0});
  topSurface.material.name='fine tamped coffee powder';
'''+s[end:]
start=s.index('    const dummy = new T.Object3D();',s.index('  function setDose(dose)'));end=s.index('    puck.visible = d > 0;',start)
s=s[:start]+s[end:];s=s.replace('    granules.visible = d > 0;\n','')
p.write_text(s,encoding='utf-8')
# Bust the full relevant module chain, preserving previously repaired instrument code.
for name in ['anatomy-espresso.js','espresso-lessons.js','quality-replacements.js','research-other.js']:
 p=r/'goodeasy/assets'/name;t=p.read_text(encoding='utf-8');t=t.replace("coffee-detail.js?v=20261030-reviewed11","coffee-detail.js?v=20261102-material1");p.write_text(t,encoding='utf-8')
for name in ['anatomy-models.js','quality-stage.js','research.js']:
 p=r/'goodeasy/assets'/name;t=p.read_text(encoding='utf-8')
 for module in ['anatomy-espresso','espresso-lessons','quality-replacements','research-other']:
  t=re.sub(module+r'\.js\?v=[^\'"\s]+',module+'.js?v=20261102-material1',t)
 p.write_text(t,encoding='utf-8')
for name in ['anatomy-viewer.js','quality-stage.js','research.js']:
 p=r/'goodeasy/assets'/name;t=p.read_text(encoding='utf-8')
 for module in ['anatomy-models','espresso-lessons','quality-replacements','research-other']:
  t=re.sub(module+r'\.js\?v=[^\'"\s]+',module+'.js?v=20261102-material1',t)
 p.write_text(t,encoding='utf-8')
p=r/'goodeasy/espresso-machine/index.html';t=p.read_text(encoding='utf-8')
for module in ['anatomy-viewer','quality-stage','research']:
 t=re.sub(module+r'\.js\?v=[^\'"\s]+',module+'.js?v=20261102-material1',t)
t=t.replace('입자 사이 흐름과 채널링','젖는 순서와 큰 틈').replace('입자와 통로의 크기는 차이를 보이기 위해 과장했습니다.','커피층이 위에서 아래로 젖는 순서를 그렸습니다. 실제 물분자의 경로를 재현한 화면은 아닙니다.')
p.write_text(t,encoding='utf-8')
print('Applied GPT material atlas, Claude saturation front and continuous surface-connected flow; removed exposed chunky granules')
