from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'core.js';s=p.read_text(encoding='utf-8').replace("next.mode!=='scheduled-snapshot'||!Array.isArray", "next.mode!=='scheduled-snapshot'||next.retentionDays!==30||!Array.isArray")
s=s.replace("published<=Math.min(now,collected)+60000", "published<=Math.min(now,collected)+60000&&published>=collected-30*86400000")
p.write_text(s,encoding='utf-8')
p=r/'app.js';s=p.read_text(encoding='utf-8').replace("if(!geo||!Array.isArray(payload?.articles)||!rules)","if(!geo||!rules)")
needle="  const nodes=Object.fromEntries(geo.nodes.map(n=>[n.id,n]));"
s=s.replace(needle,needle+"\n  let hasValidSnapshot=rules.validSnapshot(payload,{nodes,now:Date.now()});\n  if(!hasValidSnapshot){payload={schemaVersion:1,policyVersion:rules.POLICY_VERSION,mode:'scheduled-snapshot',retentionDays:30,excludedInternational:{},collectedAt:new Date(0).toISOString(),articles:[]};sheet?.expand();}")
s=s.replace("  store.set('newsmap:lastVisit:v1',sessionStarted);", "  if(hasValidSnapshot)store.set('newsmap:lastVisit:v1',sessionStarted);")
s=s.replace('  function syncPulseBatch(){\n', '  function syncPulseBatch(){\n    if(!hasValidSnapshot)return;\n')
s=s.replace('    sheet?.update(shown.length,region);', "    sheet?.update(shown.length,region);\n    if(!hasValidSnapshot)$('sheet-summary').textContent=refreshStatus.includes('실패')?'기사 데이터 로드 실패':'기사 데이터 확인 중';")
s=s.replace('    const listHtml=shown.length?', '''    const listHtml=!hasValidSnapshot?'<div class="empty"><span class="empty-mark" aria-hidden="true">⌖</span><h3>'+(refreshStatus.includes('실패')?'검증된 데이터를 불러오지 못했습니다.':'검증된 기사 데이터를 불러오는 중입니다.')+'</h3><p>확인이 끝난 기사만 지도와 목록에 표시합니다.</p><button id="retry-data">다시 확인</button></div>':shown.length?''')
s=s.replace("    $('view-status').textContent=(state.category", "    $('view-status').textContent=!hasValidSnapshot?(refreshStatus.includes('실패')?'기사 데이터 로드 실패':'기사 데이터 확인 중'):(state.category")
s=s.replace("    $('snapshot-time').textContent=stamp(payload.collectedAt)", "    $('snapshot-time').textContent=!hasValidSnapshot?(refreshStatus||'검증된 기사 데이터를 불러오는 중입니다.'):stamp(payload.collectedAt)")
s=s.replace("if(showEmpty)$('map-message').textContent=state.viewport?", "if(showEmpty)$('map-message').textContent=!hasValidSnapshot?(refreshStatus.includes('실패')?'검증된 기사 데이터를 불러오지 못했습니다. 다시 확인해 주세요.':'검증된 기사 데이터를 불러오는 중입니다.'):state.viewport?")
s=s.replace("$('article-list').addEventListener('click',event=>{if(event.target.id==='load-more')", "$('article-list').addEventListener('click',event=>{if(event.target.id==='retry-data'){if(!$('refresh').disabled)refreshData();return;}if(event.target.id==='load-more')")
s=s.replace("refreshStatus=ok?'배포된 데이터 확인 완료':'재확인 실패 · 기존 기사 유지';", "refreshStatus=ok?'배포된 데이터 확인 완료':hasValidSnapshot?'재확인 실패 · 기존 기사 유지':'데이터 로드 실패 · 다시 확인해 주세요.';")
s=s.replace('      if(valid)payload=next;', "      if(valid){payload=next;if(!hasValidSnapshot)store.set('newsmap:lastVisit:v1',sessionStarted);hasValidSnapshot=true;}")
p.write_text(s,encoding='utf-8')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8')
s=s.replace("mode:'scheduled-snapshot',excludedInternational", "mode:'scheduled-snapshot',retentionDays:30,excludedInternational")
s=s.replace("withMap=false,mobile=false}={}", "withMap=false,mobile=false,storage=new Map()}={}")
s=s.replace("localStorage:{getItem:()=>null,setItem(){}}", "localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))}")
s=s.replace('return {ctx,ids,periods,modeButtons,events,capturedMarkers,', 'return {ctx,ids,periods,modeButtons,events,capturedMarkers,storage,')
s=s.replace("assert.match(broken.ids['snapshot-time'].textContent,/로드 실패/);", "assert.match(broken.ids['snapshot-time'].textContent,/검증된 기사/);\nassert.match(broken.ids['article-list'].innerHTML,/불러오는 중/);\nbroken.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);broken.pending.onload();\nassert.equal(broken.ctx.window.NewsmapApp.articles.length,1,'Missing initial snapshot must recover without reloading the whole page');")
s += """
const savedVisit=String(Date.now()-3600000),savedBatch=JSON.stringify({collectedAt:'2026-11-03T00:00:00Z',known:['preserved'],active:['preserved']});
const preservedStorage=new Map([['newsmap:lastVisit:v1',savedVisit],['newsmap:pulse-batch:v1',savedBatch]]);
const initialInvalid=boot({missing:true,storage:preservedStorage});
assert.equal(preservedStorage.get('newsmap:lastVisit:v1'),savedVisit,'An invalid initial payload must not record a successful visit');
assert.equal(preservedStorage.get('newsmap:pulse-batch:v1'),savedBatch,'An invalid initial payload must not reset pulse history');
initialInvalid.pending.onerror();assert.match(initialInvalid.ids['article-list'].innerHTML,/불러오지 못했습니다/);
initialInvalid.ids.refresh.events.click();initialInvalid.ctx.window.NEWSMAP_ARTICLES=makeSnapshot([makeArticle()]);initialInvalid.pending.onload();
assert.equal(initialInvalid.ctx.window.NewsmapApp.shown.length,1);
assert.notEqual(preservedStorage.get('newsmap:lastVisit:v1'),savedVisit);
console.log('PASS: invalid initial snapshot shows recovery UI, preserves visit/pulse history and recovers to a verified snapshot');
"""
p.write_text(s,encoding='utf-8')
p=r/'tests/pulse.cjs';s=p.read_text(encoding='utf-8').replace('const ctx={Date,Set,JSON,payload,', 'const ctx={Date,Set,JSON,payload,hasValidSnapshot:true,');p.write_text(s,encoding='utf-8')
p=r/'tests/snapshot.cjs';s=p.read_text(encoding='utf-8').replace("mode:'scheduled-snapshot',collectedAt", "mode:'scheduled-snapshot',retentionDays:30,collectedAt")
s=s.replace("assert(!valid({...snapshot,schemaVersion:2}));", "assert(!valid({...snapshot,schemaVersion:2}));assert(!valid({...snapshot,retentionDays:7}));")
s=s.replace("{publishedAt:new Date(now+120000).toISOString()}", "{publishedAt:new Date(now+120000).toISOString()},{publishedAt:new Date(now-31*86400000).toISOString()}")
p.write_text(s,encoding='utf-8')
print('Initial payload contract and recovery state applied')
