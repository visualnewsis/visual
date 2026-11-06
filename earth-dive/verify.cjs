const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {species,model,position}=require('./science-data.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert.equal(model.diameterKm,model.radiusKm*2);
const expected=[[0,'바다'],[3.999,'바다'],[4.001,'해양 지각'],[8.999,'해양 지각'],[9,'맨틀'],[2889.9,'맨틀'],[2890,'외핵'],[5149.9,'외핵'],[5150,'내핵'],[6371,'내핵']];
for(const [distance,layer] of expected){
  assert.equal(position(distance).layer,layer,`layer at ${distance}`);
  assert.equal(position(model.diameterKm-distance).layer,layer,`symmetric layer at ${distance}`);
}
assert.equal(position(6371).returning,false);
assert.equal(position(6371.001).returning,true);
assert.equal(position(12742).waterDepthM,0);
assert.equal(position(12741.8).waterDepthM.toFixed(3),'200.000');
assert.equal(species.length,7);
assert.equal(new Set(species.map(s=>s.id)).size,7);
for(const animal of species){
  assert.ok(animal.at>=animal.depth[0]&&animal.at<=animal.depth[1],animal.id+' outside source range');
  assert.match(animal.source,/^https:\/\/www\.mbari\.org\/animal\//);
  assert.ok(html.includes(`<h2>${animal.name}</h2>`));
  assert.ok(html.includes(animal.scientific)&&html.includes(animal.source));
  assert.ok(html.includes(`aria-labelledby="art-${animal.id}"`));
  assert.ok(html.includes(`id="${animal.id}"`));
}
assert.equal(species.find(s=>s.id==='sea-pig').at,model.seafloorKm*1000);
assert.match(species.find(s=>s.id==='sea-pig').habitat,/해저/);
assert.ok(!/바다의 끝|끝인 줄|더 내려갈 곳|아래는 위가 됩니다|스크롤은 아직/.test(html));
assert.ok(html.includes('편집#019'));
assert.ok(!/<header[^>]*>[\s\S]*?편집#019[\s\S]*?<\/header>/.test(html));
for(const block of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(block[1]);
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^https?:|^#/.test(ref))continue;
  assert.ok(fs.existsSync(path.resolve(__dirname,ref)),`missing ${ref}`);
}
const silent=html.match(/<section class="beat quiet[^>]*>[\s\S]*?<\/section>/g)||[];
assert.ok(silent.length>=10);
assert.ok(silent.every(section=>!/<h[12]|class="copy"/.test(section)));
console.log('PASS: 20 layer boundary/symmetry checks, center/ascent math, 7 sourced identifications, seafloor placement, silent transit, local paths.');
