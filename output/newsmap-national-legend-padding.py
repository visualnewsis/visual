from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/app.js')
s=p.read_text(encoding='utf-8')
old='paddingBottomRight:[mobile?10:35,mobile?132:45]'
new='paddingBottomRight:[mobile?10:35,mobile?132:105]'
assert old in s
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/tests/navigation.cjs')
s=p.read_text(encoding='utf-8').replace('fitBounds(){return this;},setView', 'fitBounds(bounds,options){this.lastFit={bounds,options};return this;},setView')
s += """
const nationalDesktop=boot({withMap:true,snapshot:makeSnapshot([makeArticle()])});
assert.equal(nationalDesktop.fakeMap.lastFit.options.paddingBottomRight[1],105,'Desktop national fit must reserve the bottom legend and marker labels');
const nationalMobile=boot({withMap:true,mobile:true,snapshot:makeSnapshot([makeArticle()])});
assert.equal(nationalMobile.fakeMap.lastFit.options.paddingBottomRight[1],132,'Mobile national fit must preserve the existing drawer reserve');
console.log('PASS: national view reserves marker labels above the desktop legend and keeps mobile padding');
"""
p.write_text(s,encoding='utf-8')
