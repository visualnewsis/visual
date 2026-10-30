import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('./assets/anatomy-viewer.js',import.meta.url),'utf8')).replace(/^import .*;\r?$/gm,'');
const css=await readFile(new URL('./assets/anatomy.css',import.meta.url),'utf8');

test('replacement layout is committed before lazy startup and fallback is restored on boot error',async()=>{
 const classes=new Set(),events=[],observers=[],scrolls=[];
 const body={dataset:{experiment:'espresso-machine'},classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n))}};
 const canvas={};
 const panel={dataset:{},setAttribute(){},querySelector:()=>canvas,addEventListener:(name,fn)=>events.push([name,fn]),scrollIntoView:()=>scrolls.push('panel')};
 const inside={querySelector:()=>anchor};
 const anchor={parentElement:inside,before(p){assert.equal(p,panel);}};
 let builds=0;
 const context={document:{body,getElementById:()=>inside,createElement:()=>panel,querySelectorAll:()=>[]},window:{addEventListener(){}},location:{pathname:'/goodeasy/espresso-machine/',hash:'#research-brew-ratio'},anatomyBuilders:{'espresso-machine':()=>{builds++;throw Error('controlled renderer failure');}},IntersectionObserver:class{constructor(cb){this.callback=cb;observers.push(this);}observe(){assert.ok(classes.has('anatomy-mounted'),'layout must be final before lazy observer starts');}disconnect(){}},console:{error(){}},URLSearchParams};
 vm.runInNewContext(source,context);
 assert.equal(builds,0,'offscreen model remains lazy');
 assert.equal(classes.has('anatomy-mounted'),true);
 assert.equal(classes.has('anatomy-ready'),false);
 assert.deepEqual(scrolls,[],'mount must not pull a research-anchor visitor back to anatomy');
 for(const selector of ['.quality-detail','.observation','#part-copy']){
  assert.ok(css.includes(`.anatomy-mounted #inside>${selector}`),'legacy visibility follows mount, not delayed ready');
  assert.equal(css.includes(`.anatomy-ready #inside>${selector}`),false);
 }
 observers[0].callback([{isIntersecting:true}]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(builds,1);
 assert.equal(classes.has('anatomy-mounted'),false);
 assert.equal(classes.has('anatomy-ready'),false);
 assert.match(panel.innerHTML,/anatomy-error/);
 assert.deepEqual(scrolls,[],'failure restores content without scheduled scrolling');
});
