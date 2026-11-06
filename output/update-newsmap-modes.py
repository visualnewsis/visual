from pathlib import Path
root=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=root/'core.js'
s=p.read_text(encoding='utf-8')
s=s.replace("  const belongs=", """  const POLICY_VERSION='domestic-local-v1';
  // Unreviewed legacy snapshots fail closed, including on a failed refresh.
  function selectMode(articles,mode=''){
    return articles.filter(a=>a.policyVersion===POLICY_VERSION&&a.newsCategory!=='국제'&&!(a.feeds||[]).includes('international')&&(mode==='all'||a.localEligible===true&&a.places.length>0))
      .map(a=>mode==='all'?{...a,places:a.relatedPlaces||a.places}:a);
  }
  const belongs=""")
s=s.replace('const api={belongs,','const api={POLICY_VERSION,selectMode,belongs,')
p.write_text(s,encoding='utf-8')
p=root/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace('let projectedPayload,relatedArticles;','let projectedPayload,relatedArticles,localArticles;')
s=s.replace("const categories=['','all','정치','경제','산業','사회','IT·바이오','문화','스포츠','연예','국제'];", "const categories=['','all'];")
start=s.index('  const categories=');end=s.index('\n',start)
s=s[:start]+"  const categories=['','all'];"+s[end:]
s=s.replace("$('category-toggle').textContent=state.category?(state.category==='all'?'전체 분야':state.category):'카테고리';", "$('category-toggle').textContent=state.category==='all'?'전체뉴스':'동네뉴스';")
s=s.replace("if(projectedPayload!==payload){projectedPayload=payload;relatedArticles=payload.articles.map(a=>({...a,places:a.relatedPlaces||a.places}));}", "if(projectedPayload!==payload){projectedPayload=payload;relatedArticles=rules.selectMode(payload.articles,'all');localArticles=rules.selectMode(payload.articles);}")
s=s.replace('const articles=state.category?relatedArticles:payload.articles;', 'const articles=state.category?relatedArticles:localArticles;')
s=s.replace("category:state.category==='all'?'':state.category,",'')
s=s.replace("(state.category?(state.category==='all'?'전체 분야':state.category)+' · ':'')", "(state.category==='all'?'전체뉴스 · ':'동네뉴스 · ')")
s=s.replace("state.category=button.dataset.category;closeCategories();selectPlace('');", "if(!categories.includes(button.dataset.category))return;state.category=button.dataset.category;closeCategories();render();")
s=s.replace("n?.level==='dong'?'이 동네가 확인된 기사만 모았습니다.':'빛나는 원을 눌러 그곳의 뉴스를 만나보세요.'", "state.category==='all'?'국내 뉴스를 기사와 관련된 장소에서 봅니다.':'지역의 생활·현장 소식을 모았습니다.'")
p.write_text(s,encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('core.js?v=20261023-performance','core.js?v=20261103-domestic-local').replace('app.js?v=20261023-performance','app.js?v=20261103-domestic-local')
s=s.replace('aria-controls="category-panel">카테고리</button>','aria-controls="category-panel">동네뉴스</button>')
start=s.index('        <div id="category-panel"');end=s.index('\n',start)
s=s[:start]+'''        <div id="category-panel" class="category-panel" role="group" aria-label="뉴스 보기 방식" hidden><strong>어떤 뉴스를 볼까요?</strong><div><button type="button" data-category="" aria-pressed="true">동네뉴스</button><button type="button" data-category="all" aria-pressed="false">전체뉴스</button></div><p>동네뉴스 · 지역의 생활과 현장 소식<br>전체뉴스 · 국내 뉴스를 관련 장소에서<br>국제뉴스는 표시하지 않습니다.</p></div>'''+s[end:]
p.write_text(s,encoding='utf-8')
p=root/'tests/modes.cjs'
p.write_text('''const assert=require('node:assert/strict');
const fs=require('node:fs');
const R=require('../core.js');
const base={policyVersion:R.POLICY_VERSION,id:'domestic',newsCategory:'사회',places:['서울특별시/성동구'],relatedPlaces:['서울특별시/성동구'],localEligible:true,feeds:['society'],publishedAt:'2026-11-03T00:00:00Z'};
const rows=[base,{...base,id:'court',localEligible:false,places:[],relatedPlaces:['서울특별시/서초구']},{...base,id:'legacy',policyVersion:undefined},{...base,id:'international',newsCategory:'국제'},{...base,id:'mixed',feeds:['politics','international']},{...base,id:'no-place',places:[],relatedPlaces:[],localEligible:false}];
assert.deepEqual(R.selectMode(rows).map(a=>a.id),['domestic']);
assert.deepEqual(R.selectMode(rows,'all').map(a=>a.id),['domestic','court','no-place']);
assert.equal(R.selectMode(rows,'all')[1].places[0],'서울특별시/서초구');
assert.equal(rows[1].places.length,0,'Projecting all news must not mutate local locations');
assert.equal(R.selectMode([rows[2]],'all').length,0,'A cached legacy snapshot must fail closed in both modes');
const duplicated=[base,{...base}];
assert.equal(R.filter(R.selectMode(duplicated),{period:'all',now:Date.parse('2026-11-03T01:00:00Z')}).length,1);
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
assert.deepEqual([...html.matchAll(/data-category="([^\\"]*)"/g)].map(m=>m[1]),['','all']);
console.log('PASS: only two modes, policy version gate, international mixed-feed exclusion, local/all separation, legacy fail-closed, ID deduplication');
''',encoding='utf-8')
print('Updated frontend modes and policy gate')
