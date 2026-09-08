// Logic verification with real geometry; GPU rendering is checked separately in browser.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as Three from './vendor/three.module.min.js';
import {Mission,ROOMS,SPAWN,SEAT,CALL,onFloor} from './mission.js';
const elements=new Map(),events={};let clock=0;
const ctx=new Proxy({measureText:()=>({width:80}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
function element(id){if(!elements.has(id))elements.set(id,{hidden:false,style:{},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},addEventListener(){},focus(){},setAttribute(){},append(){},getContext:()=>ctx,clientWidth:1280,clientHeight:720});return elements.get(id);}
class Renderer{shadowMap={};setPixelRatio(){}setSize(){}render(){}}
const sandbox={T:{...Three,WebGLRenderer:Renderer},Mission,ROOMS,SPAWN,SEAT,CALL,onFloor,console,devicePixelRatio:1,matchMedia:()=>({matches:false}),performance:{now:()=>clock},requestAnimationFrame(){},addEventListener:(n,f)=>events[n]=f,document:{querySelector:element,createElement:()=>({...element('dummy'),style:{}})}};
vm.createContext(sandbox);
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
vm.runInContext(read('./scene.js').replace(/^import .*;\r?\n/gm,'').replace('export function','function'),sandbox);
vm.runInContext(read('./game.js').replace(/^import .*;\r?\n/gm,'')+'\nthis.test={reset,player,mission,free,move,frame,keys,interact,prompt,world};',sandbox);
const g=sandbox.test;g.reset();
function tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;g.frame(clock);}}
function walk(x,z){let i=0;while(Math.hypot(g.player.x-x,g.player.z-z)>.09&&i++<2000){g.player.yaw=Math.atan2(-(x-g.player.x),-(z-g.player.z));g.keys.add('KeyW');tick();}g.keys.clear();assert.ok(i<2000,`route blocked at ${g.player.x},${g.player.z} toward ${x},${z}`);}
walk(1.8,6);walk(1.8,-4.6);walk(11.5,-4.6);walk(11.5,-19);walk(22.5,-19);walk(24.5,-26.7);
g.prompt();g.interact();assert.equal(g.mission.phase,'calling');tick(130);assert.equal(g.mission.phase,'boarding');walk(22.5,-26.7);walk(22.5,-29.1);tick(5);assert.equal(g.mission.phase,'closing');tick(180);assert.equal(g.mission.phase,'director');assert.equal(g.world.boss.group.visible,true);tick(270);assert.equal(g.mission.phase,'choice');g.mission.act('shoot');tick(210);assert.equal(g.mission.phase,'escaped');assert.equal(element('#ending-title').textContent,'회사 탈출 성공');g.mission.set('choice');g.mission.act('obey');assert.equal(g.mission.phase,'return');g.reset();g.mission.door=1;g.mission.set('return');g.player.x=22.5;g.player.z=-29.1;
walk(22.5,-25);walk(22.5,-19);walk(11.5,-19);walk(11.5,-4.6);walk(1.8,-4.6);walk(1.8,6);walk(0,6);g.prompt();g.interact();tick();assert.equal(g.mission.phase,'finished');assert.equal(element('#ending').hidden,false);
g.reset();g.keys.add('KeyW');events.blur();const before=g.player.z;tick(100);assert.equal(g.player.z,before);
assert.equal(g.free(50,50),false);assert.equal(g.free(0,4.65),false);assert.equal(g.free(7,3),false);
const html=read('./index.html');for(const [,json]of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);assert.equal((html.match(/gtag\('config'/g)||[]).length,1);
const game=read('./game.js');for(const [,path]of game.matchAll(/'([^']+\.jpg)'/g))assert.ok(fs.existsSync(new URL('../'+path,import.meta.url)),path);
console.log('PASS: actual collision-aware outward and return route, elevator call/boarding/door reversal/director/ending, pause, furniture/bounds/glass collisions, JSON-LD, analytics, 12 thumbnails.');





