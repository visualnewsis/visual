from pathlib import Path
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'core.js';s=p.read_text(encoding='utf-8')
s=s.replace("&&a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'", "&&a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'\n        &&(a.sourceSection===undefined||typeof a.sourceSection==='string'&&a.sourceSection!=='국제')&&(a.sourceSection2===undefined||typeof a.sourceSection2==='string'&&!a.sourceSection2.startsWith('해외'))")
p.write_text(s,encoding='utf-8')
p=r/'tests/snapshot.cjs';s=p.read_text(encoding='utf-8');s += """
for(const patch of [{sourceSection:'국제'},{sourceSection2:'해외토픽'},{sourceSection:42},{sourceSection2:{}}])assert(!valid({...snapshot,articles:[{...article,...patch}]}),'Source section veto '+JSON.stringify(patch));
assert(valid({...snapshot,articles:[{...article,sourceSection:'사회',sourceSection2:'지역'}]}));
console.log('PASS: international/overseas source sections veto an otherwise approved domestic article');
""";p.write_text(s,encoding='utf-8')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8');s += """
const sourceConflict=makeSnapshot([makeArticle({sourceSection:'국제'})]);
const initialSourceConflict=boot({snapshot:sourceConflict});
assert.equal(initialSourceConflict.ctx.window.NewsmapApp.articles.length,0,'An international source section must fail initial validation');
const cleanBeforeSection=guardApi.articles;
guarded.ids.refresh.events.click();guarded.ctx.window.NEWSMAP_ARTICLES=sourceConflict;guarded.pending.onload();
assert.equal(guardApi.articles,cleanBeforeSection,'An international source section in refresh must preserve the last clean data');
console.log('PASS: source-section veto applies to both initial load and refresh');
""";p.write_text(s,encoding='utf-8')
