from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(__file__).parent
p=r/'goodeasy/assets/models/violin-fittings.js';s=p.read_text(encoding='utf-8').replace('const x=1.04,w=.100,d=.055','const x=1.03,w=.085,d=.040').replace('footX=1.08','footX=1.04');s=s.replace('const bowl=new T.Mesh(geo,black);',"const ebony=new T.MeshPhysicalMaterial({color:0x15110e,roughness:.42,metalness:0,clearcoat:.25,clearcoatRoughness:.35,side:T.DoubleSide});const bowl=new T.Mesh(geo,ebony);");p.write_text(s,encoding='utf-8')
p=r/'goodeasy/assets/coffee-detail.js';s=p.read_text(encoding='utf-8').replace('      group.userData.fill = 0;\n      return;', '      group.userData.fill = 0;\n      surface.position.y=CUP_BOTTOM;group.userData.surfaceY=CUP_BOTTOM;group.userData.pouring=false;\n      return;').replace('group.userData.surfaceY = surfaceY;','group.userData.surfaceY = surfaceY + wobble;');p.write_text(s,encoding='utf-8')
for name in ['violin-final-fit.test.mjs','espresso-final-material.test.mjs']:(r/'goodeasy'/name).write_text((out/name).read_text(encoding='utf-8'),encoding='utf-8')
# Retire the old implementation-count assertion in favor of actual visible continuity/timing checks.
p=r/'goodeasy/projector-espresso-quality.test.mjs';s=p.read_text(encoding='utf-8');start=s.index("test('coffee routes occupy particle depth");end=s.index("test('pump is active",start);s=s[:start]+s[end:];p.write_text(s,encoding='utf-8')
p=r/'goodeasy/espresso-crema-clearance.test.mjs';s=p.read_text(encoding='utf-8');start=s.index("test('continuous pigment field");s=s[:start]+'''test('continuous crema is warm low-contrast microfoam with a matte liquid surface',()=>{
 const {group}=createCoffeeCup(),material=group.getObjectByName('coffee surface').material,map=material.map;
 assert.ok(map?.isDataTexture);assert.equal(map.colorSpace,T.SRGBColorSpace);assert.ok(material.roughness>=.55&&material.roughness<=.75);assert.equal(material.metalness,0);
 const red=[];for(let i=0;i<map.image.data.length;i+=4){const d=map.image.data;assert.equal(d[i+3],255);assert.ok(d[i]>d[i+1]&&d[i+1]>d[i+2]);red.push(d[i]);}red.sort((a,b)=>a-b);
 assert.ok(red[Math.floor(red.length*.99)]-red[Math.floor(red.length*.01)]<55,'large dark patches would dominate the surface');
});
''';p.write_text(s,encoding='utf-8')
