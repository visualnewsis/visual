from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'core.js';s=p.read_text(encoding='utf-8').replace("POLICY_VERSION='domestic-local-v1'","POLICY_VERSION='domestic-local-v2'")
pos=s.index('  // Unreviewed legacy snapshots')
s=s[:pos]+'''  function validSnapshot(next,{nodes={},previousTime=-Infinity,now=Date.now()}={}){
    if(!next||next.schemaVersion!==1||next.policyVersion!==POLICY_VERSION||next.mode!=='scheduled-snapshot'||!Array.isArray(next.articles)||next.articles.length>10000)return false;
    const collected=Date.parse(next.collectedAt),excluded=next.excludedInternational;
    if(!Number.isFinite(collected)||collected<previousTime||collected>now+60000||!excluded||typeof excluded!=='object'||Array.isArray(excluded))return false;
    const idPattern=/^NISX\\d+_\\d+$/;
    if(!Object.entries(excluded).every(([id,date])=>idPattern.test(id)&&Number.isFinite(Date.parse(date))&&Date.parse(date)<=collected&&Date.parse(date)>=collected-30*86400000))return false;
    const seen=new Set(),known=places=>Array.isArray(places)&&new Set(places).size===places.length&&places.every(p=>typeof p==='string'&&Object.prototype.hasOwnProperty.call(nodes,p));
    return next.articles.every(a=>{
      if(!a||typeof a.id!=='string'||!idPattern.test(a.id)||seen.has(a.id)||Object.prototype.hasOwnProperty.call(excluded,a.id)||a.url!=='https://www.newsis.com/view/'+a.id)return false;
      seen.add(a.id);
      const published=Date.parse(a.publishedAt);
      return typeof a.title==='string'&&!!a.title.trim()&&Number.isFinite(published)&&published<=Math.min(now,collected)+60000
        &&a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'&&typeof a.newsCategory==='string'&&!!a.newsCategory&&a.newsCategory!=='국제'
        &&Array.isArray(a.feeds)&&a.feeds.every(f=>typeof f==='string'&&f!=='international')
        &&known(a.places)&&known(a.relatedPlaces)&&Array.isArray(a.localPlaces)&&a.localPlaces.length===a.places.length&&a.localPlaces.every((p,i)=>p===a.places[i])
        &&typeof a.localEligible==='boolean'&&a.localEligible===!!a.places.length&&a.places.every(p=>a.relatedPlaces.includes(p))
        &&Array.isArray(a.evidence)&&a.evidence.every(e=>typeof e==='string');
    });
  }
''' +s[pos:]
s=s.replace('const api={POLICY_VERSION,selectMode,','const api={POLICY_VERSION,validSnapshot,selectMode,')
p.write_text(s,encoding='utf-8')
p=r/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace("        }else selectPlace(g.node.id);", "        }else{selectPlace(g.node.id);if(matchMedia('(max-width:700px)').matches)sheet?.expand();}")
start=s.index('      const next=window.NEWSMAP_ARTICLES;',s.index('  function refreshData'))
end=s.index('      if(valid)payload=next;',start)
s=s[:start]+'''      if(finished){window.NEWSMAP_ARTICLES=payload;return;}
      const next=window.NEWSMAP_ARTICLES;
      const valid=rules.validSnapshot(next,{nodes,previousTime:Date.parse(payload.collectedAt),now:now()});
      changed=valid&&(next.collectedAt!==payload.collectedAt||JSON.stringify(next.articles)!==JSON.stringify(payload.articles));
'''+s[end:]
p.write_text(s,encoding='utf-8')
p=r/'index.html';s=p.read_text(encoding='utf-8').replace('20261103-direct-modes','20261103-review-v2').replace('20261103-domestic-local','20261103-review-v2')
old='<div class="map-legend"><span><i class="legend-pulse"></i>새 기사 파동 · 10분</span><span><i class="legend-count"></i>원 안 숫자는 기사 수</span><button id="motion-toggle" aria-pressed="true">파동 켜짐</button></div>'
new='<div class="map-legend"><span title="지난 방문 이후 발행된 새 기사가 포함된 지역. 첫 방문은 최근 24시간 기준입니다."><i class="legend-new-dot"></i><span class="legend-full">지난 방문 후 새 기사</span><span class="legend-short">새 기사</span></span><span title="원 안 숫자는 해당 묶음의 전체 기사 수입니다."><i class="legend-count"></i>기사 수</span><span title="새로 수집된 미열람 기사는 최대 10분 동안 파동을 표시합니다."><i class="legend-pulse"></i><span class="legend-full">새 수집 · 미열람 10분</span><span class="legend-short">미열람 10분</span></span><button id="motion-toggle" aria-pressed="true">파동 켜짐</button></div>'
assert old in s;s=s.replace(old,new)
s=s.replace('<strong>새로 들어온 기사는 파동으로 알려드려요.</strong>수집한 새 기사는 최대 10분 동안 읽기 전까지 파동을 표시합니다. 기사를 읽거나 시간이 지나면 파동이 멈춥니다. 읽음 기록은 이 브라우저에 저장합니다.','<strong>색상과 파동은 기준이 달라요.</strong>빨강은 지난 방문 이후 발행된 새 기사가 있는 지역이며, 첫 방문은 최근 24시간이 기준입니다. 초록은 그 기준의 새 기사가 없는 기사 묶음이고, 원 안 숫자는 전체 기사 수입니다. 새로 수집된 미열람 기사는 최대 10분 동안 파동을 표시합니다. 읽거나 시간이 지나면 파동이 멈춥니다. 방문·읽음 기록은 이 브라우저에 저장합니다.')
p.write_text(s,encoding='utf-8')
p=r/'style.css';s=p.read_text(encoding='utf-8');s+='''
.map-legend .legend-new-dot{width:9px;height:9px;background:var(--accent);border-radius:50%}
.map-legend .legend-pulse{background:transparent;border:1px solid var(--accent)}
.legend-short{display:none}
@media(max-width:700px){.map-legend .legend-full{display:none}.map-legend .legend-short{display:inline}.map-legend{font-size:8px;gap:8px;padding:9px 10px}.map-legend button{padding-left:8px}}
''';p.write_text(s,encoding='utf-8')
print('Frontend v2 refresh contract, first-tap mobile drawer and legend applied')
