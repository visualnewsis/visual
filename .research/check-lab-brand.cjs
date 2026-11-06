const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='C:/Users/user/.codex/worktrees/piano-finish/editshop';
for(const theme of ['light','dark']){
 const events={},listeners={},nodes=[];
 const toggle={setAttribute(k,v){this[k]=v},addEventListener(t,f){events[t]=f},focus(){this.focused=true}};
 const node=()=>({dataset:{},className:'',innerHTML:'',querySelector(){return toggle},addEventListener(t,f){listeners[t]=f}});
 const body={prepend(n){nodes.push(n)},classList:{add(){}}};
 const document={currentScript:{src:'https://visual.newsis.com/assets/visual-header.js',dataset:{section:'굳이구지',sectionHref:'https://visual.newsis.com/goodeasy/',current:'goodeasy',headerTheme:theme}},readyState:'complete',body,querySelector(){return null},createElement:node,addEventListener(t,f){listeners[t]=f}};
 vm.runInNewContext(fs.readFileSync(root+'/assets/visual-header.js','utf8'),{document,URL});
 const header=nodes.find(n=>n.className==='vnh-header'),overlay=nodes.find(n=>n.className==='vnh-overlay');assert(header&&overlay);assert.equal(header.dataset.theme,theme);
 const nav=overlay.innerHTML;assert(nav.includes('menu-icon-goodeasy.svg'));assert(nav.includes('aria-current="page">'));assert(nav.includes('https://visual.newsis.com/goodeasy/'));
 const links=[...nav.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);assert.equal(links.length,9);assert(links.indexOf('https://visual.newsis.com/arcade/')<links.indexOf('https://visual.newsis.com/goodeasy/'));
 for(const slug of ['/editshop/','/arcade/','/calculator/index.html','/newsmap/'])assert(links.some(l=>l.endsWith(slug)));
 events.click();assert.equal(header.dataset.open,'true');assert.equal(toggle['aria-expanded'],'true');listeners.keydown({key:'Escape'});assert.equal(header.dataset.open,'false');assert(toggle.focused);
}
console.log('PASS common menu light/dark: nine destinations, existing links retained, flask beside Goodeasy, current state, toggle and Escape close.');
