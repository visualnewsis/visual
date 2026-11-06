from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace("  if(hasValidSnapshot)store.set('newsmap:lastVisit:v1',sessionStarted);", "  function recordObservedVisit(){if(hasValidSnapshot)store.set('newsmap:lastVisit:v1',Math.min(now(),Date.parse(payload.collectedAt)));}\n  recordObservedVisit();")
s=s.replace("if(valid){payload=next;if(!hasValidSnapshot)store.set('newsmap:lastVisit:v1',sessionStarted);hasValidSnapshot=true;}", "if(valid){payload=next;hasValidSnapshot=true;recordObservedVisit();}")
start=s.index("    const unlocated=shown.filter(a=>!a.places.length).length;",s.index('  function renderList'))
end=s.index('    syncControls();',start)
s=s[:start]+'    updateDataStatus();\n'+s[end:]
pos=s.index('  function renderList(){')
s=s[:pos]+'''  function updateDataStatus(){
    const delayed=hasValidSnapshot&&now()-Date.parse(payload.collectedAt)>30*60000;
    const unlocated=shown.filter(a=>!a.places.length).length;
    $('view-status').textContent=!hasValidSnapshot?(refreshStatus.includes('실패')?'기사 데이터 로드 실패':'기사 데이터 확인 중'):(state.category==='all'?'전체뉴스 · ':'동네뉴스 · ')+(state.viewport?'현재 지도 안 · ':'선택 지역 전체 · ')+shown.length+'건'+(unlocated?' · 위치 미지정 '+unlocated+'건':'')+(delayed?' · 수집 지연':'');
    $('snapshot-time').textContent=!hasValidSnapshot?(refreshStatus||'검증된 기사 데이터를 불러오는 중입니다.'):stamp(payload.collectedAt)+' 수집 · 일부 기사 · '+(payload.mode==='scheduled-snapshot'?'10분 주기 수집':'자동 갱신 미연결')+(delayed?' · 수집 지연 · 마지막 확인 자료':'')+(refreshStatus?' · '+refreshStatus:'');
  }
'''+s[pos:]
s=s.replace("if(!silent||changed||!hasValidSnapshot)render('replace');", "if(!silent||changed||!hasValidSnapshot)render('replace');else updateDataStatus();")
p.write_text(s,encoding='utf-8')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8');s+='''
const agedTime=Date.now()-2*3600000,previousVisit=String(agedTime-3600000),watermarkStorage=new Map([['newsmap:lastVisit:v1',previousVisit]]);
const agedSnapshot=makeSnapshot([makeArticle({publishedAt:new Date(agedTime-60000).toISOString()})],{collectedAt:new Date(agedTime).toISOString()});
const aged=boot({snapshot:agedSnapshot,storage:watermarkStorage});
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),String(agedTime),'A successful visit only observes the collected data time');
assert.equal(aged.ctx.window.NewsmapApp.cutoff,Number(previousVisit),'Session newness must retain the previous visit cutoff');
assert.match(aged.ids['snapshot-time'].textContent,/수집 지연 · 마지막 확인 자료/);
assert.match(aged.ids['view-status'].textContent,/수집 지연/,'Compact mobile status must also expose delayed collection');
assert.equal(aged.ctx.window.NewsmapApp.articles.length,1,'Delayed valid data must remain usable');
const beforeFailureWatermark=watermarkStorage.get('newsmap:lastVisit:v1');
aged.ids.refresh.events.click();aged.pending.onerror();
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),beforeFailureWatermark,'A failed refresh must not advance the visit watermark');
const observedLater=agedTime+30*60000;
aged.ids.refresh.events.click();aged.ctx.window.NEWSMAP_ARTICLES=makeSnapshot(agedSnapshot.articles,{collectedAt:new Date(observedLater).toISOString()});aged.pending.onload();
assert.equal(watermarkStorage.get('newsmap:lastVisit:v1'),String(observedLater),'Refresh advances the watermark only to the received collection time');
assert.equal(aged.ctx.window.NewsmapApp.cutoff,Number(previousVisit));
const almostStale=Date.now()-29*60000;
const unchangedSnapshot=makeSnapshot([makeArticle({publishedAt:new Date(almostStale-60000).toISOString()})],{collectedAt:new Date(almostStale).toISOString()});
const aging=boot({withMap:true,snapshot:unchangedSnapshot}),beforeAgeMarkers=aging.markerBuilds,beforeAgeHtml=aging.ids['article-list'].innerHTML;
assert.doesNotMatch(aging.ids['snapshot-time'].textContent,/수집 지연/);
aging.ctx.Date=class extends Date{static now(){return almostStale+31*60000;}};
aging.events.poll();aging.ctx.window.NEWSMAP_ARTICLES=unchangedSnapshot;aging.pending.onload();
assert.match(aging.ids['snapshot-time'].textContent,/수집 지연 · 마지막 확인 자료/,'Unchanged silent refresh still updates the age warning');
assert.equal(aging.markerBuilds,beforeAgeMarkers,'Age warning updates must not rebuild map markers');
assert.equal(aging.ids['article-list'].innerHTML,beforeAgeHtml,'Age warning updates must not replace article cards');
assert.equal(aging.storage.get('newsmap:lastVisit:v1'),String(almostStale),'Unchanged old data must not advance the watermark to browser time');
console.log('PASS: observed-data visit watermark, fixed session cutoff, delayed-data warning and status-only silent refresh');
''';p.write_text(s,encoding='utf-8')
