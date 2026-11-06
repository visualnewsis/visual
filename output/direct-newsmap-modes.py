from pathlib import Path
import re
r=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap')
p=r/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('<button id="category-toggle" class="map-button" aria-expanded="false" aria-controls="category-panel">동네뉴스</button>','<div id="news-modes" class="news-modes" role="group" aria-label="뉴스 보기 방식"><button type="button" data-category="" aria-pressed="true" title="지역의 생활과 현장 소식">동네뉴스</button><button type="button" data-category="all" aria-pressed="false" title="국내 뉴스를 관련 장소에서">전체뉴스</button></div>')
s=re.sub(r'^        <div id="category-panel"[^\n]+\n','',s,flags=re.M)
s=s.replace('style.css?v=20261024-mobile-articles','style.css?v=20261103-direct-modes').replace('app.js?v=20261103-domestic-local','app.js?v=20261103-direct-modes')
p.write_text(s,encoding='utf-8')
p=r/'app.js';s=p.read_text(encoding='utf-8');s=s.replace("    $('category-toggle').textContent=state.category==='all'?'전체뉴스':'동네뉴스';\n",'')
start=s.index('  function closeCategories()');end=s.index("  $('motion-toggle').addEventListener",start)
s=s[:start]+"  $('news-modes').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button||!categories.includes(button.dataset.category)||button.dataset.category===state.category)return;state.category=button.dataset.category;render();});\n"+s[end:]
p.write_text(s,encoding='utf-8')
p=r/'style.css';s=p.read_text(encoding='utf-8');s=re.sub(r'^\.map-actions>#category-toggle[^\n]*\n','',s,flags=re.M);s=re.sub(r'^\.category-panel[^\n]*\n?','',s,flags=re.M)
s+='''
.news-modes{display:flex;width:100%;border:1px solid var(--line);border-radius:4px;background:var(--paper);box-shadow:0 2px 9px #233d2915;pointer-events:auto}
.news-modes button{flex:1;min-width:0;min-height:38px;padding:8px 4px;font-size:11px;font-weight:650;line-height:1.4;white-space:nowrap;color:var(--ink);border-radius:3px}
.news-modes button[aria-pressed="true"]{background:var(--green);color:white}
.news-modes button:focus-visible{outline:2px solid var(--green);outline-offset:2px}
@media(max-width:700px){.news-modes button{min-height:44px;font-size:10px}}
'''
p.write_text(s,encoding='utf-8')
p=r/'tests/navigation.cjs';s=p.read_text(encoding='utf-8').replace("camera.ids['category-panel']","camera.ids['news-modes']")
s=s.replace("  const events={},location=", "  const modeButtons=['','all'].map(category=>Object.assign(new Element(),{dataset:{category}}));\n  const events={},location=")
s=s.replace('querySelectorAll:()=>periods,',"querySelectorAll:selector=>selector==='[data-category]'?modeButtons:periods,")
s=s.replace('return {ctx,ids,periods,events,', 'return {ctx,ids,periods,modeButtons,events,')
s=s.replace("assert.equal(cameraApi.state.category,'all');", "assert.equal(cameraApi.state.category,'all');\nassert.equal(camera.modeButtons[0].attrs['aria-pressed'],'false');\nassert.equal(camera.modeButtons[1].attrs['aria-pressed'],'true');")
p.write_text(s,encoding='utf-8')
p=r/'tests/modes.cjs';s=p.read_text(encoding='utf-8');s += "\nassert.doesNotMatch(html,/id=\"category-(?:panel|toggle)\"/);\nassert.match(html,/<div id=\"news-modes\"[^>]*role=\"group\"[^>]*>/);\nassert.doesNotMatch(html,/<div id=\"news-modes\"[^>]*hidden/);\n";p.write_text(s,encoding='utf-8')
print('Direct two-button news modes applied')
