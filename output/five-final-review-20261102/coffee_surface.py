from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/assets/coffee-detail.js';s=p.read_text(encoding='utf-8');a=s.index('function createCoffeeSurfaceMaterial() {');b=s.index('\nexport function createCoffeeCup()',a)
s=s[:a]+'''function createCoffeeSurfaceMaterial() {
 const microfoam=coffeeMaterialTexture('crema').clone();microfoam.repeat.set(2.3,2.3);microfoam.needsUpdate=true;
 // Coffee remains opaque and dark. Crema is pigmentation on this same liquid skin,
 // rather than a second yellow disc or a transparent water material.
 const material=new T.MeshPhysicalMaterial({color:0x3a1b10,map:microfoam,roughness:.31,metalness:0,clearcoat:.28,clearcoatRoughness:.26,side:T.DoubleSide});
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
#ifdef USE_MAP
vec2 liquidUv=vMapUv/2.3;
vec2 radial=(liquidUv-0.5)*2.0;
float radius=length(radial);
float angle=atan(radial.y,radial.x);
float irregular=0.10*sin(angle*3.0+0.8)+0.065*sin(angle*7.0-1.2);
float pigment=smoothstep(0.58+irregular,0.78+irregular,radius);
// The generated fine foam texture contributes only subtle microbubbles.
vec3 fineFoam=texture2D(map,vMapUv).rgb;
float fineGrain=clamp((fineFoam.r-fineFoam.g)*1.5,0.0,1.0);
float coverage=clamp(pigment*(0.60+fineGrain*.20),0.0,0.80);
vec3 darkCoffee=vec3(0.042,0.010,0.0045);
vec3 thinCrema=vec3(0.28,0.115,0.038)*(0.94+fineGrain*.12);
diffuseColor.rgb=mix(darkCoffee,thinCrema,coverage);
// A narrow, continuous dark wetting line at the wall; no floating ring geometry.
diffuseColor.rgb*=1.0-0.28*smoothstep(0.965,1.0,radius);
#endif`);};
 material.customProgramCacheKey=()=> 'opaque-espresso-partial-microfoam-v3';
 material.userData={liquid:'espresso',opaqueLiquid:true,crema:'partial surface pigmentation',meniscus:'continuous 1.75% radial band'};
 material.name='continuous dark espresso with thin partial crema';return material;
}
''' +s[b:];p.write_text(s,encoding='utf-8');print('Dark opaque coffee, partial foam and continuous edge applied')
