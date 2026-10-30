// Layout, sculpt, legend and input regression for the dedicated 08 hero keyboard model.
// Geometry/relationship checks of a visualization model, not a product drawing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../piano/vendor/three.module.min.js';
import {KEY_PITCH,KEY_GAP,dishY,cavitySection,insideRoundRect} from '../assets/models/mx-keycap.js';
const {buildKeyboardHero,keyLayout,keyForChar,legendFor,rowProfile,KEYBOARD_ROWS,ROW_PROFILES,HERO}=await import('../assets/models/keyboard-hero.js');
// Canvas stub that records the legend draw calls, so the atlas layout can be checked without a browser.
const calls=[];let font='';
const ctx=new Proxy({fillText:(t,x,y)=>calls.push({t,x,y,font}),measureText:()=>({width:40})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{if(k==='font')font=v;o[k]=v;return true;}});
function withDom(fn){const old=globalThis.document;globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}})};try{return fn();}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}}
const build=()=>withDom(()=>buildKeyboardHero(T,{}));
const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;

test('ANSI 60% rows: 15u each, real stagger and a 6.25u space bar',()=>{
 for(const row of KEYBOARD_ROWS)assert.ok(near(row.reduce((s,[,w])=>s+w,0),15),'row is 15u');
 const L=keyLayout(),at=id=>L.find(k=>k.id===id);
 assert.equal(at('Q').startU,1.5);assert.equal(at('A').startU,1.75);assert.equal(at('Z').startU,2.25);
 assert.ok(near(at('A').x-at('Q').x,.25*KEY_PITCH)&&near(at('Z').x-at('A').x,.5*KEY_PITCH),'0.25u then 0.5u row offsets');
 assert.ok(near(at('W').x-at('Q').x,KEY_PITCH)&&near(at('Q').z-at('1').z,KEY_PITCH),'19.05 mm pitch in both directions');
 const space=at(' ');assert.equal(space.units,6.25);assert.equal(space.startU,3.75);
 assert.ok(at('B').x>space.x-space.units*KEY_PITCH/2&&at('B').x<space.x+space.units*KEY_PITCH/2,'space bar sits under B');
 assert.equal(L.length,61);
});
test('every keycap is an 18 mm-class shell sized from its width, with 1.05 mm gaps and no overlaps',()=>{
 const m=build(),L=keyLayout();
 for(const k of L){const g=m.keys.get(k.id),cap=g.children.find(o=>o.name==='keycap'),b=new T.Box3().setFromBufferAttribute(cap.geometry.attributes.position);
  assert.ok(near(b.max.x-b.min.x,k.units*KEY_PITCH-KEY_GAP,1e-4),k.id+' width');assert.ok(near(b.max.z-b.min.z,KEY_PITCH-KEY_GAP,1e-4),k.id+' depth');
  const p=g.userData.profile;assert.ok(b.max.y-p.bottom>=.90&&b.max.y-p.bottom<=1.20,k.id+' standard height 9-12 mm');}
 for(let r=0;r<5;r++){const row=L.filter(k=>k.row===r);for(let i=1;i<row.length;i++){const a=row[i-1],b=row[i],gap=(b.x-b.units*KEY_PITCH/2+KEY_GAP/2)-(a.x+a.units*KEY_PITCH/2-KEY_GAP/2);assert.ok(near(gap,KEY_GAP),'gap '+a.id+'|'+b.id);}}
 assert.ok(near(KEY_PITCH-KEY_GAP,1.80),'row-to-row gap equals the side gap');
});
// Concavity is measured against the tilt: front and back edges average it out on x-axis dishes.
test('rows are sculpted and every top is a concave dish',()=>{
 const h=ROW_PROFILES.map(r=>r.height);assert.ok(h[0]===Math.max(...h),'number row is tallest');assert.ok(ROW_PROFILES[0].tilt>0&&ROW_PROFILES[3].tilt<0,'back rows lean toward the typist, front rows away');
 for(let r=0;r<5;r++)for(const u of [1,1.25,1.5,1.75,2,2.25,2.75,6.25]){const p=rowProfile(r,u),c=dishY(p,0,0),edge=p.dishAxis==='z'?dishY(p,p.tx,0):(dishY(p,0,p.tz)+dishY(p,0,-p.tz))/2;assert.ok(edge-c>=.04-1e-9&&edge-c<=.10,'dish 0.4-1.0 mm '+r+'/'+u);
  // Rim = where the dish meets the edge fillet (its high sides), checked at the front and back corners.
  for(const z of [-p.tz,p.tz])for(const x of p.dishAxis==='z'?[-p.tx,p.tx]:[-p.tx,0,p.tx]){const h=dishY(p,x,z)-p.bottom;assert.ok(h>=.90-1e-9&&h<=1.20,'rim 9-12 mm '+r+'/'+u+' got '+h);}}
 const space=rowProfile(4,6.25);assert.equal(space.dishAxis,'x','space bar dishes front-to-back');
});
test('R key prints R left, ㄲ upper right, ㄱ lower right; legends lie on the dish',()=>{
 calls.length=0;const m=build(),r=m.keys.get('R'),decal=r.children.find(o=>o.name==='legend'),cell=decal.userData.cell,x0=cell%8*128,y0=Math.floor(cell/8)*128;
 const mine=calls.filter(c=>c.x>=x0&&c.x<x0+128&&c.y>=y0&&c.y<y0+128).map(c=>({...c,x:c.x-x0,y:c.y-y0}));
 assert.deepEqual(mine.map(c=>c.t).sort(),['R','ㄱ','ㄲ'].sort());
 const g=t=>mine.find(c=>c.t===t);assert.ok(g('R').x<64,'R left');assert.ok(g('ㄲ').x>64&&g('ㄲ').y<64,'ㄲ upper right');assert.ok(g('ㄱ').x>64&&g('ㄱ').y>64,'ㄱ lower right');
 assert.deepEqual(legendFor('R'),{main:'R',base:'ㄱ',shift:'ㄲ'});
 for(const [id,g] of m.keys){const d=g.children.find(o=>o.name==='legend');if(!d){assert.equal(id,' ','only the space bar is blank');continue;}
  const p=g.userData.profile,a=d.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),lift=a.getY(i)-dishY(p,x,z);assert.ok(lift>0&&lift<=.006,id+' legend on dish');assert.ok(Math.abs(x)<=p.tx+1e-9&&Math.abs(z)<=p.tz+1e-9,id+' legend inside top face');}}
});
test('typing moves exactly the matching key 4 mm and releases it; Hangul resolves to 2-set keys',()=>{
 const m=build(),y=()=>Object.fromEntries([...m.keys].map(([k,g])=>[k,g.position.y]));
 const housing=m.group.getObjectByName('Fixed switch housing'),hy=housing.position.y;
 for(const [ch,id] of [['R','R'],['r','R'],['ㄱ','R'],['ㄲ','R'],['각','R'],['가','K'],['와','K'],['닭','R'],['않','G'],['!','1'],['?','/'],['\n','Enter'],[' ',' '],['7','7'],['BACKSPACE','Backspace'],['ENTER','Enter'],['Tab','Tab']]){
  assert.equal(keyForChar(ch),id,ch);m.update({key:ch,travel:4});const p=y();
  for(const [k,v] of Object.entries(p))assert.ok(near(v,k===id?-.4:0),ch+' moves only '+id);
  assert.equal(housing.position.y,hy,'switch housings stay fixed');m.update({key:ch,travel:0});assert.ok(Object.values(y()).every(v=>v===0),'released');}
 for(const ch of ['€','DELETE','SHIFT','F1']){m.update({key:ch,travel:4});assert.ok(Object.values(y()).every(v=>v===0),ch+' presses nothing (old hero did the same)');}
 assert.equal(keyForChar(''),null);assert.equal(keyForChar(undefined),null);
});
test('pressed caps clear the plate and their own switch housing',()=>{
 for(let r=0;r<5;r++){const p=rowProfile(r,1),bottom=p.bottom-4*HERO.travelScale;assert.ok(bottom>.05,'skirt stays above the plate at 4 mm');
  for(const t of [0,2,4]){const capY=-t*HERO.travelScale,yIn=HERO.housingTop-capY;if(yIn<p.bottom)continue;const s=cavitySection(p,yIn),h=HERO.housingTopHalf;assert.ok(insideRoundRect(h,h,s.x-.01,s.z-.01,s.r),'housing top inside the cap at '+t+' mm');}}
 const m=build(),cs=new T.Box3().setFromObject(m.group.getObjectByName('keyboard case')),L=keyLayout(),outer=Math.max(...L.map(k=>Math.abs(k.x)+k.units*KEY_PITCH/2));
 assert.ok(outer+HERO.caseClearance<=cs.max.x-HERO.bezel+1e-6,'case wall clears the outermost caps');
});
test('only keys with an on-screen button forward clicks; all keep the hero API',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8'),buttons=[...html.matchAll(/data-key="([^"]*)"/g)].map(x=>x[1]),m=build();
 assert.equal(buttons.length,27);for(const k of buttons){const g=m.keys.get(k);assert.ok(g,'hero key for button '+k);g.traverse(o=>{if(o.isMesh)assert.equal(o.userData.action,'key:'+k);});}
 for(const id of ['1','Tab','Enter','ShiftLeft','HangulMode'])m.keys.get(id).traverse(o=>{if(o.isMesh)assert.equal(o.userData.action,undefined,id+' is decorative');});
 assert.ok(Array.isArray(m.eye)&&m.eye.length===3);for(const k of ['body','key','cap','spring'])assert.ok(m.parts[k],k);
 m.update({},true);assert.equal(m.parts.spring.visible,true);m.update({},false);assert.equal(m.parts.spring.visible,false);
 const bare=buildKeyboardHero(T,{});assert.equal(bare.keys.size,61,'builds without a DOM (no printed legends)');bare.update({key:'A',travel:4});assert.ok(near(bare.keys.get('A').position.y,-.4));
});
