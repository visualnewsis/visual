from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'goodeasy/assets/coffee-detail.js';s=p.read_text(encoding='utf-8');s=s.replace("const color=coffeeMaterialTexture('crema');", "const color=coffeeMaterialTexture('crema').clone();color.repeat.set(2.3,2.3);color.needsUpdate=true;")
s=s.replace("material.name='continuous thin crema microfoam';return material;", """material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
#ifdef USE_MAP
// Compress the generated microfoam's large colour swings into a continuous liquid film.
vec3 foamMean=vec3(0.48,0.265,0.112);
diffuseColor.rgb=mix(foamMean,diffuseColor.rgb,0.48);
#endif`);};material.customProgramCacheKey=()=> 'crema-microfoam-low-contrast-v2';
 material.name='continuous thin crema microfoam';return material;""")
p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/models/violin-fittings.js';s=p.read_text(encoding='utf-8').replace('topShapeY(x,z)+.007','topShapeY(x,z)+.010').replace('const edge=1.205','const edge=1.19').replace('50,.0065,10','50,.0048,10');p.write_text(s,encoding='utf-8')
print('Applied GPT blockers: visible thin cork, slimmer clamps, finer low-contrast crema')
