// Logic verification with real geometry; GPU rendering is checked separately in browser.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as Three from './vendor/three.module.min.js';
import {Mission,ROOMS,SPAWN,SEAT,CALL,onFloor} from './mission.js';
import {createPerson} from './actors.js';
import {dressInterior} from './interior.js';
import {createOfficeProps} from './props.js';
import {nextCoworkerLine,COWORKER_LINES} from './dialogue.js';
import {OfficeAudio} from './sound.js';
import {Dispatch,drawRoute} from './dispatch.js';
const elements=new Map(),events={};let clock=0;
const ctx=new Proxy({measureText:()=>({width:80}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
function element(id){if(!elements.has(id))elements.set(id,{hidden:false,style:{},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},addEventListener(){},focus(){},setAttribute(){},append(){},getContext:()=>ctx,clientWidth:1280,clientHeight:720});return elements.get(id);}
class Renderer{shadowMap={};setPixelRatio(){}setSize(){}render(){}}
const sandbox={T:{...Three,WebGLRenderer:Renderer},createPerson,dressInterior,createOfficeProps,nextCoworkerLine,art:{},OfficeAudio,Dispatch,drawRoute,Mission,ROOMS,SPAWN,SEAT,CALL,onFloor,console,ResizeObserver:class{observe(){}},devicePixelRatio:1,matchMedia:()=>({matches:false}),performance:{now:()=>clock},requestAnimationFrame(){},addEventListener:(n,f)=>events[n]=f,document:{querySelector:element,createElement:()=>({...element('dummy'),style:{}})}};
vm.createContext(sandbox);
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
vm.runInContext(read('./scene.js').replace(/^import .*;\r?\n/gm,'').replace('export function','function'),sandbox);
vm.runInContext(read('./game.js').replace(/^import .*;\r?\n/gm,'')+'\nthis.test={reset,player,mission,free,move,frame,keys,interact,prompt,world,dispatch};',sandbox);
const g=sandbox.test;g.reset();
assert.equal(g.world.woman.female,true);assert.equal(g.world.coworker.female,false);assert.equal(g.world.boss.female,false);assert.equal(g.world.boss.boss,true);
assert.equal(g.world.workers.length,3);for(const worker of g.world.workers){assert.equal(worker.seated,true);assert.equal(worker.seatedY,-.35);assert.ok(worker.legs.every(leg=>Math.abs(leg.rotation.x+Math.PI/2)<.001));}
for(const [kind,lines]of Object.entries(COWORKER_LINES)){const person={dialogue:kind,talkIndex:0};assert.equal(new Set(Array.from({length:lines.length},()=>nextCoworkerLine(person))).size,lines.length);assert.equal(nextCoworkerLine(person),lines[0]);}
g.world.woman.talkIndex=3;g.reset();assert.equal(g.world.woman.talkIndex,0);
assert.ok(!read('./game.js').includes('나도 퇴근하고'));
for(const [,asset]of read('./art.js').matchAll(/:'([^']+\.webp)'/g))assert.ok(fs.existsSync(new URL('./assets/art-v2/'+asset,import.meta.url)),asset);
// Regression: all characters must have a real head volume and no portrait maps.
for(const actor of [g.world.woman,g.world.coworker,g.world.boss,...g.world.workers]){
  assert.equal(actor.head.userData.full3D,true);assert.equal(actor.eyes.length,2);
  const skull=actor.head.getObjectByName('closed-sculpted-skull');assert.ok(skull);skull.geometry.computeBoundingBox();const size=skull.geometry.boundingBox.getSize(new Three.Vector3());assert.ok(size.x>.15&&size.y>.23&&size.z>.18,'head has depth, width and height');
  actor.head.traverse(part=>{if(part.isMesh){assert.ok(!part.material.map,'no photographs on any head mesh');assert.notEqual(part.geometry.type,'PlaneGeometry');assert.ok(Array.from(part.geometry.attributes.position.array).every(Number.isFinite));}});
  skull.updateMatrixWorld(true);const center=new Three.Vector3();skull.getWorldPosition(center);for(let i=0;i<12;i++){const dir=new Three.Vector3(Math.sin(i*Math.PI/6),0,Math.cos(i*Math.PI/6));const ray=new Three.Raycaster(center.clone().addScaledVector(dir,.5),dir.clone().negate());assert.ok(ray.intersectObject(skull).length,'skull exists through every viewing angle');}
}
assert.ok(COWORKER_LINES.hallway.every(line=>/(요|세요|려고요)[?.]$/.test(line)));
assert.ok(!read('./art.js').includes('reference.webp'));assert.ok(!read('./actors.js').includes('portraitHead'));
function tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;g.frame(clock);}}
function walk(x,z){let i=0;while(Math.hypot(g.player.x-x,g.player.z-z)>.09&&i++<2000){g.player.yaw=Math.atan2(-(x-g.player.x),-(z-g.player.z));g.keys.add('KeyW');tick();}g.keys.clear();assert.ok(i<2000,`route blocked at ${g.player.x},${g.player.z} toward ${x},${z}`);}
walk(1.8,6);walk(1.8,-4.6);walk(11.5,-4.6);walk(11.5,-19);walk(22.5,-19);walk(24.5,-26.7);
g.prompt();g.interact();assert.equal(g.mission.phase,'calling');tick(130);assert.equal(g.mission.phase,'boarding');walk(22.5,-26.7);walk(22.5,-29.1);tick(5);assert.equal(g.mission.phase,'closing');tick(180);assert.equal(g.mission.phase,'director');assert.equal(g.world.boss.group.visible,true);tick(270);assert.equal(g.mission.phase,'choice');g.mission.act('shoot');tick(210);assert.equal(g.mission.phase,'escaped');assert.equal(element('#ending-title').textContent,'회사 탈출 성공');g.mission.set('choice');g.mission.act('obey');assert.equal(g.mission.phase,'return');g.reset();g.mission.door=1;g.mission.set('return');g.player.x=22.5;g.player.z=-29.1;
walk(22.5,-25);walk(22.5,-19);walk(11.5,-19);walk(11.5,-4.6);walk(1.8,-4.6);walk(1.8,6);walk(0,6);g.prompt();g.interact();tick();assert.equal(g.mission.phase,'finished');assert.equal(element('#ending').hidden,false);
g.reset();g.keys.add('KeyW');events.blur();const before=g.player.z;tick(100);assert.equal(g.player.z,before);
assert.equal(g.free(50,50),false);assert.equal(g.free(0,4.65),false);assert.equal(g.free(7,3),false);
// New environmental stories are optional, deduplicated, and reset between runs.
g.reset();g.prompt();g.interact();assert.equal(g.dispatch.memo.size,1);g.interact();assert.equal(g.dispatch.memo.size,1);
g.player.x=5.75;g.player.z=-2;g.prompt();g.interact();assert.equal(g.dispatch.memo.size,2);
g.player.x=1.5;g.player.z=-4.6;g.prompt();g.interact();assert.equal(g.dispatch.memo.size,3);
g.reset();assert.equal(g.dispatch.memo.size,0);
// A viewport/focus change at the director choice must not stack a pause dialog.
g.mission.set('choice');element('#choice').hidden=false;events.blur();assert.equal(element('#pause-panel').hidden,true);
element('#shoot').onclick();tick(210);assert.equal(g.mission.phase,'escaped');assert.equal(element('#ending').hidden,false);
assert.match(element('#stat-time').textContent,/^\d\d:\d\d$/);assert.equal(element('#stat-memos').textContent,'0 / 3');
// Escape resumes even while a dialog button owns keyboard focus.
g.reset();events.blur();assert.equal(element('#pause-panel').hidden,false);
events.keydown({code:'Escape',target:{closest:()=>true}});assert.equal(element('#pause-panel').hidden,true);
g.mission.set('director');element('#effects').onclick();tick();assert.equal(element('#alarm').className,'steady');
const html=read('./index.html');for(const [,json]of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);assert.equal((html.match(/gtag\('config'/g)||[]).length,1);
const rootURL=new URL('../../',import.meta.url);
for(const [,value]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(?:https?:|#|data:)/.test(value))continue;
  const clean=value.split('?')[0],url=clean.startsWith('/')?new URL('.'+clean,rootURL):new URL(clean,import.meta.url);
  assert.ok(fs.existsSync(url),`missing page asset: ${value}`);
}
for(const name of fs.readdirSync(new URL('.',import.meta.url)).filter(name=>name.endsWith('.js'))){
  for(const [,value]of read(name).matchAll(/from\s+'([^']+)'/g))assert.ok(fs.existsSync(new URL(value.split('?')[0],import.meta.url)),`missing module: ${value}`);
}
assert.ok(html.includes('https://visual.newsis.com/arcade/bamta/'));
const game=read('./game.js');for(const [,path]of game.matchAll(/'([^']+\.jpg)'/g))assert.ok(fs.existsSync(new URL('../'+path,import.meta.url)),path);
console.log('PASS: real-geometry outward/return routes, elevator and both endings, optional stories/deduplication/reset, choice vs blur, Escape focus, reduced-effects alarm, JSON-LD, one analytics config, 12 thumbnails.');





