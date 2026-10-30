import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};
const {projectorAssembly}=await import('./assets/anatomy-optics.js');
const source=(await readFile(new URL('./assets/anatomy-viewer.js',import.meta.url),'utf8')).replace(/^import .*;\r?$/gm,'');
const scope=vm.createContext({document:{body:{dataset:{}},getElementById:()=>null},window:{addEventListener(){}},location:{pathname:'/none/'},anatomyBuilders:{}});vm.runInContext(source,scope);

test('anatomy reading follows the actual clock engagement and partial optical opening, including rewinding',()=>{
 const m=projectorAssembly(),seen=new Set();
 for(const phase of [...Array.from({length:101},(_,i)=>i/100),.81,.21,1,0]){
  const state={phase,explode:0};m.update(state);const c=m.group.userData.transport,text=m.anatomyReading(state);
  if(c.engaged){assert.match(text,/빛 차단.*한 칸/);assert.equal(c.openFraction,0);seen.add('transport');}
  else if(c.openFraction===1){assert.match(text,/정지.*셔터 열림/);seen.add('exposure');}
  else if(c.openFraction>0){assert.match(text,/정지.*일부만/);seen.add('partial');}
  else {assert.match(text,/정지.*빛을 가립니다/);seen.add('closed dwell');}
  if(c.index>0&&!c.engaged)assert.match(text,/다음 프레임 정지/);
 }
 assert.deepEqual([...seen].sort(),['closed dwell','exposure','partial','transport']);
 m.update({phase:0,explode:0});assert.match(m.anatomyReading(),/^필름 정지/);
});

test('viewer note updates once per changed reading and leaves unrelated model notes intact',()=>{
 const m=projectorAssembly();let value='',writes=0;
 const note={get textContent(){return value;},set textContent(v){value=v;writes++;}};
 for(let i=0;i<3;i++){m.update({phase:0});scope.updateAnatomyReading(m,{phase:0},note);}
 assert.equal(writes,1);
 m.update({phase:.85});scope.updateAnatomyReading(m,{phase:.85},note);assert.equal(writes,2);assert.match(value,/한 칸/);
 scope.updateAnatomyReading({}, {},note);assert.equal(writes,2);
});
