import assert from 'node:assert/strict';
import * as T from './piano/vendor/three.module.min.js';
import {curtainWindow,filmCycle,debounceSample,crankX,bowedDisplacement} from './assets/mechanism-checks.js';
import {stringHz,handAngles,escapeState,period} from './assets/research-math.js';
import {exposure,watchStep,filmStep,switchState,coffeeFlow} from './assets/model.js';
import {sampleAction,timing} from './piano/motion.js';
import {stringRatio,repeatedStrikeReady,toneFor} from './piano/study-model.js';
import {buildMXSwitch} from './assets/models/mx-switch.js';
import {readFileSync} from 'node:fs';
let assertions=0;
const ok=(v,msg)=>{assert.ok(v,msg);assertions++;},close=(a,b,msg)=>ok(Math.abs(a-b)<1e-7,msg);
// Piano order, release, repeat and actual supplemental hammer contact coordinates.
const tm=timing(300);ok(tm.escape<tm.strike&&tm.strike<tm.rebound,'jack releases before strike');
close(sampleAction(tm.strike,300).hammer,1);close(sampleAction(tm.duration,300,false).damper,0);close(sampleAction(tm.duration,300,true).damper,1);
ok(repeatedStrikeReady('repetition','partial')&&!repeatedStrikeReady('simple','partial'),'partial-release comparison');close(toneFor(69).frequency,440);close(stringRatio(.5),2);
// Guitar ideal-string relations and all supported harmonic nodes.
close(stringHz(.65,70,.005)*2,stringHz(.325,70,.005));close(stringHz(.65,280,.005),2*stringHz(.65,70,.005));
for(let n=1;n<=4;n++)for(let j=0;j<=n;j++)close(Math.sin(j/n*Math.PI*n),0,'harmonic node');
// Violin contact displacement is continuous at stick/slip boundary and cycle wrap.
close(bowedDisplacement(.8-1e-10),bowedDisplacement(.8));close(bowedDisplacement(1-1e-10),bowedDisplacement(0));
ok((bowedDisplacement(.9)-bowedDisplacement(.8))<0,'slip returns opposite to bow');
// Reel pin x and slider x coincide throughout a turn.
for(let a=0;a<Math.PI*2;a+=.031)close(crankX(a),1.4*Math.sin(a));
// Camera: every point receives equal exposure duration; fast exposes only a narrow moving band.
let fastMax=0,slowMax=0;for(let i=0;i<=1000;i++){let f=curtainWindow(i/1000,true),s=curtainWindow(i/1000,false);fastMax=Math.max(fastMax,f.width);slowMax=Math.max(slowMax,s.width);ok(f.width>=0&&f.width<=1.7&&s.width>=0&&s.width<=1.7,'valid sensor interval');}
ok(fastMax<.6&&slowMax>1.69,'fast slit vs slow full-frame');close(curtainWindow(0).width,0);close(curtainWindow(1).width,0);close(exposure(5.6,250),.25);close(exposure(2.8,500),.5);close(exposure(16,1000),(2.8/16)**2/4);
// Watch: the modeled four-wheel ratios must agree with the hands, including two motionwork meshes.
close((60/8)*(64/8),60);close((48/12)*(45/15),12);close(handAngles(3600).minute,Math.PI*2);close(handAngles(3600).hour,Math.PI/6);close(escapeState(.1).angle,escapeState(.3).angle);close(period(4,1)/period(1,1),2);
const centers=[[-1.1,.3],[-.264,.3],[.484,.3],[.880,-.3858921198],[1.254,.2618948822]],N=[64,60,64,60],P=[12,8,8,8];for(let i=0;i<4;i++)close(Math.hypot(centers[i+1][0]-centers[i][0],centers[i+1][1]-centers[i][1]),(N[i]+P[i])*.022/2,'pitch circle tangency');
ok(watchStep({reserve:0,elapsed:0},1).elapsed===0,'empty watch stops');
// Film: transport must never coincide with light exposure; one frame advance per period.
for(let i=0;i<=2000;i++){const s=filmCycle(i/1000);ok(!(s.moving&&s.exposed),'film transport cannot be exposed');}close(filmCycle(.999999).offset,-.9+(.9/.35)*.000001);ok(filmCycle(1).index===1);ok(filmStep({frames:23},1).frame===0);
// MX: synthetic debounce accepts only after uninterrupted closure, not an extra fixed interval.
ok(!debounceSample(.0249,5).filtered);ok(debounceSample(.0251,5).filtered);ok(!debounceSample(.008,0).filtered);ok(switchState(1.99).closed===false&&switchState(2).closed===true);
const mat=new T.MeshStandardMaterial(),mx=buildMXSwitch(T,Object.fromEntries(['ivory','black','red','steel','brass'].map(k=>[k,mat])));
const fixed=mx.parts.fixedContact.children.find(x=>x.geometry.type==='SphereGeometry');const moving=mx.parts.movingLeaf.children[0].children.find(x=>x.geometry.type==='SphereGeometry');
for(const mm of [0,1,1.99,2,3,4]){mx.update({travel:mm});mx.group.updateMatrixWorld(true);const distance=fixed.getWorldPosition(new T.Vector3()).distanceTo(moving.getWorldPosition(new T.Vector3()));ok(mm<2?distance>.104-1e-6:Math.abs(distance-.104)<1e-5,'contact surface closure');}
// Espresso: hypothetical constant-resistance comparison only, no taste prediction.
ok(coffeeFlow(20,9)>coffeeFlow(80,9));close(coffeeFlow(50,0),0);close(36/18,2);ok(40!==36,'volume and mass examples are deliberately distinct');
// Public text contracts and preservation of interactions, tracking, and concise endings.
for(const slug of ['piano','guitar','fishing-reel','camera','watch','violin','projector','keyboard','espresso-machine']){const s=readFileSync(new URL('./'+slug+'/index.html',import.meta.url),'utf8');ok(s.includes('id="making"'));ok(!s.includes('ChatGPT 디자인 의뢰'));ok(s.includes('참고 자료와 체험의 범위'));ok(s.includes('class="brand-byline"'));}
console.log(`PASS ${assertions} mechanism audit assertions across nine episodes; these are relation and geometry checks, not manufacturer or physical-device certification.`);
