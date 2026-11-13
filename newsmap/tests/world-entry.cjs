/* Execute the actual entry controller: initial domestic camera and history isolation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const events={},buttons=['domestic','world'].map(scope=>({dataset:{scope},events:{},setAttribute(){},addEventListener(n,f){this.events[n]=f;}}));
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,events:{},addEventListener(n,f){this.events[n]=f;},focus(){}});return elements.get(id);};
 const calls=[],location={pathname:'/newsmap/',search:'?viewport=1',hash:''},setUrl=u=>{location.search=new URL(u,'https://example.test').search;};
 const app={state:{region:'national'},render(){},restoreView(){calls.push('restore');},selectPlace(){calls.push('select');},map:{getCenter:()=>[37,127],getZoom:()=>9,invalidateSize(){calls.push('resize');},setView(c,z){calls.push(['camera',c,z]);}}};
 const ctx={URLSearchParams,location,history:{pushState(a,b,u){setUrl(u);}},requestAnimationFrame:f=>f(),document:{querySelector:s=>el(s),getElementById:el,querySelectorAll:()=>buttons,body:{classList:{toggle(){}}}},window:{NewsmapApp:app,NewsmapWorldRules:{},NewsmapWorld:()=>({restore(){},setActive(){},openList(){},refresh(){}}),addEventListener(n,f){events[n]=f;}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../world-entry.js'),'utf8'),ctx);
 assert.deepEqual(calls,[],'A domestic-only visit must never reset its restored camera.');
 buttons[1].events.click();await Promise.resolve();await Promise.resolve();
 buttons[0].events.click();assert(calls.some(c=>Array.isArray(c)&&c[0]==='camera'),'Button return restores the saved domestic camera.');
 calls.length=0;setUrl('/newsmap/?view=world');events.popstate({type:'popstate'});await Promise.resolve();
 setUrl('/newsmap/?viewport=1');events.popstate({type:'popstate'});
 assert(calls.includes('restore'),'History return restores this URL after the hidden map is resized.');
 assert(!calls.some(c=>Array.isArray(c)&&c[0]==='camera'),'History must not borrow a different entry camera.');
 assert(!calls.includes('select'),'History camera is restored by domestic URL logic.');
 console.log('PASS: domestic initial camera untouched; world button restores camera; history uses its own URL camera.');
})().catch(e=>{console.error(e);process.exitCode=1;});
