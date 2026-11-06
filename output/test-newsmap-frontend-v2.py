from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8')
s=s.replace("function boot({missing=false,search='',withMap=false}={}){", """function makeArticle(overrides={}){
  const a={id:'NISX20261103_0000000001',title:'지역 소식',newsCategory:'사회',category:'사회',policyVersion:require('../core.js').POLICY_VERSION,domesticPolicy:'accepted',feeds:['society'],evidence:[],url:'https://www.newsis.com/view/NISX20261103_0000000001',publishedAt:new Date().toISOString(),places:['서울특별시/성동구'],...overrides};
  a.localPlaces=[...a.places];a.relatedPlaces=overrides.relatedPlaces||[...a.places];a.localEligible=!!a.places.length;return a;
}
const makeSnapshot=(articles,overrides={})=>({schemaVersion:1,policyVersion:require('../core.js').POLICY_VERSION,mode:'scheduled-snapshot',excludedInternational:{},collectedAt:new Date().toISOString(),articles,...overrides});
function boot({missing=false,search='',withMap=false,mobile=false}={}){""")
s=s.replace('let pending,expanded=false,markerBuilds=0;', 'let pending,expanded=false,markerBuilds=0;const capturedMarkers=[];')
s=s.replace('matchMedia:()=>({matches:false,addEventListener(){}})', "matchMedia:q=>({matches:mobile&&q.includes('max-width:700px'),addEventListener(){}})")
s=s.replace('marker:()=>{markerBuilds++;return layer();}', 'marker:(center,options)=>{markerBuilds++;const entry=layer(),handlers={};entry.on=(name,fn)=>{handlers[name]=fn;return entry;};capturedMarkers.push({center,options,handlers});return entry;}')
s=s.replace('return {ctx,ids,periods,modeButtons,events,', 'return {ctx,ids,periods,modeButtons,events,capturedMarkers,')
s=s.replace("{articles:[],collectedAt:new Date().toISOString()}", 'makeSnapshot([])')
start=s.index("camera.ctx.window.NEWSMAP_ARTICLES={collectedAt:")
end=s.index('\ncamera.pending.onload();',start)
s=s[:start]+"camera.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({title:'두 지역 소식',places:['부산광역시','서울특별시/성동구']})]);"+s[end:]
s=s.replace("camera.ids.refresh.events.click();\ncamera.ctx.window.NEWSMAP_ARTICLES={collectedAt:new Date().toISOString(),articles:[legacyRow]};", "const cleanBeforeLegacy=cameraApi.articles;\ncamera.ids.refresh.events.click();\ncamera.ctx.window.NEWSMAP_ARTICLES={collectedAt:new Date().toISOString(),articles:[legacyRow]};")
s=s.replace("camera.pending.onload();cameraApi.render();", "camera.pending.onload();cameraApi.render();\nassert.equal(cameraApi.articles,cleanBeforeLegacy,'Legacy refresh must preserve the last clean articles');")
s += """
const guarded=boot(),guardApi=guarded.ctx.window.NewsmapApp;
guarded.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({title:'검증된 정상 기사'})]);guarded.pending.onload();
const cleanGuard=guardApi.articles;
guarded.ids.refresh.events.click();guarded.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([],{collectedAt:'2000-01-01T00:00:00Z'});guarded.pending.onload();
assert.equal(guardApi.articles,cleanGuard,'Older responses must never replace clean data');
assert.match(guarded.ids['snapshot-time'].textContent,/재확인 실패/);
const corrected=makeSnapshot([makeArticle({title:'동일 시각 정정 기사'})],{collectedAt:guarded.ctx.window.NEWSMAP_ARTICLES.collectedAt});
guarded.events.poll();guarded.ctx.window.NEWSMAP_ARTICLES=corrected;guarded.pending.onload();
assert.match(guarded.ids['article-list'].innerHTML,/동일 시각 정정 기사/,'A silent same-time content correction must render immediately');
assert.equal(guardApi.shown.length,guardApi.articles.length);
const mobileFirst=boot({withMap:true,mobile:true});
mobileFirst.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);mobileFirst.pending.onload();
const mobileMarker=mobileFirst.capturedMarkers.find(m=>!m.options.title.includes(' 외 '));
assert(mobileMarker,'A valid local article must create a mobile marker');
assert.equal(mobileFirst.expanded,false);mobileMarker.handlers.click();
assert.equal(mobileFirst.expanded,true,'A non-cluster marker must open the mobile article sheet on the first tap');
const mobileCluster=boot({withMap:true,mobile:true});
mobileCluster.fakeMap.latLngToContainerPoint=()=>({distanceTo:()=>0});
mobileCluster.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle({places:['서울특별시/성동구','부산광역시/부산진구']})]);mobileCluster.pending.onload();
const clusterMarker=mobileCluster.capturedMarkers.find(m=>m.options.title.includes(' 외 '));
assert(clusterMarker);clusterMarker.handlers.click();
assert.equal(mobileCluster.expanded,false,'A cluster first tap must still zoom instead of opening an ambiguous sheet');
assert.equal(mobileCluster.fakeMap.zoom,8);
console.log('PASS: invalid/older refresh preserves clean data, same-time silent corrections render, first mobile tap opens articles, cluster tap still zooms');
"""
p.write_text(s,encoding='utf-8')
p=r/'tests/snapshot.cjs';p.write_text("""const assert=require('node:assert/strict');
const R=require('../core.js');
const now=Date.parse('2026-11-03T03:00:00Z'),nodes={'서울특별시/성동구':{}};
const article={id:'NISX20261103_0000000001',title:'성동구 주민 지원',url:'https://www.newsis.com/view/NISX20261103_0000000001',publishedAt:new Date(now-60000).toISOString(),policyVersion:R.POLICY_VERSION,domesticPolicy:'accepted',newsCategory:'사회',feeds:['society'],evidence:['성동구 주민 지원'],places:['서울특별시/성동구'],localPlaces:['서울특별시/성동구'],relatedPlaces:['서울특별시/성동구'],localEligible:true};
const snapshot={schemaVersion:1,policyVersion:R.POLICY_VERSION,mode:'scheduled-snapshot',collectedAt:new Date(now).toISOString(),excludedInternational:{},articles:[article]};
const options={nodes,now,previousTime:now-60000},valid=s=>R.validSnapshot(s,options);
assert(valid(snapshot));assert(valid({...snapshot,articles:[]}),'Only a fully versioned valid empty snapshot may be accepted');
assert(!valid({...snapshot,policyVersion:'domestic-local-v1'}));
assert(!valid({...snapshot,schemaVersion:2}));assert(!valid({...snapshot,excludedInternational:[]}));
assert(!valid({...snapshot,collectedAt:new Date(now-120000).toISOString()}));
assert(!valid({...snapshot,collectedAt:new Date(now+120000).toISOString()}));
assert(!valid({...snapshot,excludedInternational:{[article.id]:article.publishedAt}}));
assert(!valid({...snapshot,excludedInternational:{NISX20261001_0000000001:new Date(now-31*86400000).toISOString()}}));
assert(!valid({...snapshot,articles:[article,article]}));
for(const patch of [{policyVersion:undefined},{domesticPolicy:undefined},{newsCategory:'국제'},{feeds:['politics','international']},{places:['unknown'],localPlaces:['unknown']},{localPlaces:[]},{relatedPlaces:[]},{localEligible:false},{url:'https://www.newsis.com/other'},{publishedAt:new Date(now+120000).toISOString()}])assert(!valid({...snapshot,articles:[{...article,...patch}]}),JSON.stringify(patch));
console.log('PASS: browser snapshot policy/schema, chronology, exclusion ledger, article contract, known geography, URL and duplicate validation');
""",encoding='utf-8')
p=r/'tests/modes.cjs';s=p.read_text(encoding='utf-8');s += "\nrequire('./snapshot.cjs');\n";p.write_text(s,encoding='utf-8')
print('Frontend v2 regression fixtures and adversarial checks added')
