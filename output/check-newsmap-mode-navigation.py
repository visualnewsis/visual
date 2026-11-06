from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/tests/navigation.cjs')
s=p.read_text(encoding='utf-8')
s += """
cameraApi.selectPlace('서울특별시/성동구',{fit:false});
camera.ids['category-panel'].events.click({target:{closest:()=>({dataset:{category:'all'}})}});
assert.equal(cameraApi.state.category,'all');
assert.equal(cameraApi.state.region,'서울특별시/성동구','Switching news modes must preserve the selected region');
camera.ids['category-panel'].events.click({target:{closest:()=>({dataset:{category:'국제'}})}});
assert.equal(cameraApi.state.category,'all','Removed category controls cannot activate an international mode');
const legacyRow={id:'legacy-foreign',title:'미국 중간선거',newsCategory:'국제',url:'https://www.newsis.com/view/NISX20261023_0000000001',publishedAt:new Date().toISOString(),places:['서울특별시/성동구']};
cameraApi.state.period='all';
camera.ids.refresh.events.click();
camera.ctx.window.NEWSMAP_ARTICLES={collectedAt:new Date().toISOString(),articles:[legacyRow]};
camera.pending.onload();cameraApi.render();
assert.doesNotMatch(camera.ids['article-list'].innerHTML,/미국 중간선거/,'Legacy data must never reappear after a refresh');
console.log('PASS: mode switch preserves region, removed category rejection, legacy refresh stays hidden');
"""
p.write_text(s,encoding='utf-8')
