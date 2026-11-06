import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import {Playback} from 'file:///C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/gramophone/playback.js';
let now=0,callbacks=new Map(),rid=0,plays=[];const els={};for(const id of ['landing-gramophone-canvas','landing-needle','landing-reset','gramophone-status'])els[id]={dataset:{},handlers:{},parentElement:{},addEventListener(k,f){this.handlers[k]=f},setAttribute(k,v){this[k]=v}};
const doc={hidden:false,getElementById:id=>els[id],addEventListener(){}};
class Audio {constructor(){this.context={state:'running'}}unlock(){return Promise.resolve()}now(){return now}play(p){plays.push(p)}stop(){}visualSignal(){return 0}}
const source=fs.readFileSync('C:/Users/user/.codex/worktrees/piano-finish/editshop/goodeasy/assets/landing-gramophone.js','utf8').replace(/^import .*;\r?\n/gm,'');
const ctx={T:{},materials:{},Playback,GramophoneAudio:Audio,makeStage:()=>({setModel(){},draw(){}}),buildGramophone:()=>({update(){}}),document:doc,window:{addEventListener(){}},ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},requestAnimationFrame:f=>{callbacks.set(++rid,f);return rid},cancelAnimationFrame:id=>callbacks.delete(id),console};vm.runInNewContext(source,ctx);
for(let i=0;i<4;i++){if(i===0)await els['landing-needle'].handlers.click();else {els['landing-reset'].handlers.click();await new Promise(setImmediate);}console.log(i,els['gramophone-status'].textContent,els['landing-gramophone-canvas'].dataset);assert.equal(els['landing-gramophone-canvas'].dataset.playing,'true');now+=24.01;for(const [id,f]of [...callbacks]){callbacks.delete(id);f()}assert.equal(els['landing-gramophone-canvas'].dataset.position,'24.000');assert.equal(els['landing-gramophone-canvas'].dataset.playing,'false');}
assert.equal(plays.length,4);assert.ok(plays.every(p=>p===0));console.log('PASS actual landing entrypoint: four complete 24-second replays; all start at zero; no spring truncation');



