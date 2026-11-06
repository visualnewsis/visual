// Run: node arcade/cta/verify.mjs. Logic checks use real Three.js geometry,
// a simulated DOM and a renderer stub; this does not measure GPU performance.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.min.js';
import { WORLD } from './world.js';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);
assert.equal((html.match(/gtag\('config'/g)||[]).length,1);
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{hidden:['dialog','interact'].includes(id),style:{},dataset:{},classList:{add(){},remove(){}},firstElementChild:{style:{}},addEventListener(){},focus(){},setAttribute(){},clientWidth:1280,clientHeight:720,textContent:''});return elements.get(id);}
const events={};let clock=0;
class Renderer{shadowMap={};info={render:{calls:0}};setPixelRatio(){}setClearColor(){}setSize(){}render(){}}
class CubeCamera extends THREE.Object3D{update(){}}
class PMREMGenerator{fromCubemap(){return {texture:new THREE.Texture()};}dispose(){}}
const sandbox={THREE:{...THREE,WebGLRenderer:Renderer,CubeCamera,PMREMGenerator},WORLD,console,devicePixelRatio:1,performance:{now:()=>clock},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},window:{addEventListener:(name,fn)=>events[name]=fn},document:{hidden:false,getElementById:element,addEventListener(){},createElement:()=>({getContext:()=>({fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createLinearGradient(){return {addColorStop(){}};}})})}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('./architecture.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function'),sandbox);
const source=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
vm.runInContext(source+'\nthis.test={camera,blocked,move,reveals,frame,get progress(){return progress},get active(){return active}};',sandbox);
const game=sandbox.test;
element('start').onclick();assert.equal(game.active,true);
function tick(n){for(let i=0;i<n;i++){clock+=1000/60;game.frame(clock);}}
function key(code,down){events[down?'keydown':'keyup']({code,preventDefault(){}});}
key('KeyW',true);tick(95);key('KeyW',false);
assert.equal(game.progress,2,'walking forward reveals first alley');
tick(200);assert.equal(game.progress,2,'standing still must not duplicate progress');
// Follow connected street corridors, using the same collision-aware move as input.
function walkTo(x,z){for(let i=0;i<1500&&Math.hypot(game.camera.position.x-x,game.camera.position.z-z)>.08;i++){
  const dx=x-game.camera.position.x,dz=z-game.camera.position.z,len=Math.hypot(dx,dz);game.move(dx/len*.05,dz/len*.05);tick(1);
}assert.ok(Math.hypot(game.camera.position.x-x,game.camera.position.z-z)<.1,`reachable point ${x},${z}`);}
walkTo(0,1);assert.equal(game.progress,5);
walkTo(0,-6);assert.equal(game.progress,7);
assert.equal(element('interact').hidden,false);element('interact').onclick();assert.equal(game.active,false);assert.ok(element('dialog-text').textContent.includes('시험용'));
element('close-dialog').onclick();assert.equal(game.active,true);
assert.equal(game.blocked(0,-16),true,'gate closed before discovery');
walkTo(0,-13);assert.equal(game.progress,10);walkTo(0,-18);assert.equal(game.blocked(0,-16),false);
walkTo(0,-35);assert.equal(game.progress,10,'Namsan Square forecourt is reachable after gate opens');
assert.equal(game.blocked(6,9),true,'buildings collide');assert.equal(game.blocked(36,0),true,'map has bounds');
walkTo(0,16);assert.equal(game.progress,10,'free roam preserves completion');
key('KeyW',true);events.blur();const before=game.camera.position.z;tick(50);assert.equal(game.camera.position.z,before,'blur pauses movement');
console.log('PASS: JSON-LD, one analytics config, keyboard movement, reachable 0→10 route, no duplicate discovery, dialogue, gate opening, collision, free roam, blur pause.');
