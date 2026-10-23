import {stringRatio,repeatedStrikeReady,toneFor} from './study-model.js';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion:reduce)'),done=new Set();
const tried={velocity:new Set(),contact:new Set(),repeat:new Set()};let activeArticle=null,animation=0,repeatRelease='none';
const currentMidi=()=>window.PianoExperience?.snapshot().last?.midi??60;
const pitch=midi=>['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][midi%12]+(Math.floor(midi/12)-1);
function context(){$('study-note').textContent=pitch(currentMidi());updateString();}
function found(key){$(key+'-finding').hidden=false;done.add(key);$('discovery-progress').textContent=`비교한 실험 ${done.size} / 4`;}
function sound(article,options){activeArticle=$(article);window.PianoExperience?.playStudy(options);}
function wave(id,{amplitude=28,decay=2.8,cycles=3}={}){
 cancelAnimationFrame(animation);document.querySelectorAll('.wave-line').forEach(p=>p.setAttribute('d','M15 80H585'));const path=$(id),start=performance.now();
 function draw(now){const t=(now-start)/1000,a=amplitude*Math.exp(-t/decay)*Math.max(0,1-t/3);let d='';for(let i=0;i<=120;i++){const u=i/120,x=15+570*u,y=80+Math.sin(Math.PI*u)*Math.sin(u*Math.PI*2*cycles+(reduced.matches?0:t*12))*a;d+=`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)} `;}path.setAttribute('d',d);if(t<3&&!document.hidden&&!reduced.matches)animation=requestAnimationFrame(draw);}
 animation=requestAnimationFrame(draw);
}
function velocity(kind){const soft=kind==='soft',midi=currentMidi();sound('velocity-study',toneFor(midi,{velocity:soft?.26:1}));wave('velocity-wave',{amplitude:soft?15:48});tried.velocity.add(kind);$('velocity-readout').textContent=`${pitch(midi)} · ${soft?'약한 타격 · 작은 음량':'강한 타격 · 큰 음량·높은 배음 강조'}`;if(tried.velocity.size===2)found('velocity');}
$('soft-strike').addEventListener('click',()=>velocity('soft'));$('hard-strike').addEventListener('click',()=>velocity('hard'));
function contact(held){const midi=currentMidi();sound('contact-study',toneFor(midi,{contact:held,velocity:.7}));wave('contact-wave',{amplitude:34,decay:held?.08:2.8});tried.contact.add(held?'held':'free');$('contact-readout').textContent=held?'접촉 유지 · 진동이 빠르게 줄어듭니다.':'타격 후 이탈 · 현의 울림이 이어집니다.';if(tried.contact.size===2)found('contact');}
$('free-hammer').addEventListener('click',()=>contact(false));$('held-hammer').addEventListener('click',()=>contact(true));
function conditions(){return {length:Number($('string-length').value)/100,tension:Number($('string-tension').value)/100,density:Number($('string-density').value)/100};}
function updateString(){const c=conditions(),ratio=stringRatio(c.length,c.tension,c.density),hz=440*2**((currentMidi()-69)/12)*ratio;for(const k of ['length','tension','density'])$(k+'-value').textContent=c[k].toFixed(2)+'×';$('string-readout').textContent=`${hz.toFixed(1)} Hz · 기준의 ${ratio.toFixed(2)}배 진동수 · ${Math.round(12*Math.log2(ratio))>=0?'+':''}${(12*Math.log2(ratio)).toFixed(1)}반음`;return c;}
for(const id of ['string-length','string-tension','string-density'])$(id).addEventListener('input',updateString);
$('string-play').addEventListener('click',()=>{const c=updateString();sound('string-study',toneFor(currentMidi(),c));wave('string-wave',{cycles:Math.max(1,Math.min(8,stringRatio(c.length,c.tension,c.density)*3))});if(c.length!==1||c.tension!==1||c.density!==1)found('string');});
$('string-reset').addEventListener('click',()=>{for(const id of ['string-length','string-tension','string-density'])$(id).value='100';updateString();window.PianoExperience?.stopStudy();});
function repeatMode(){return document.querySelector('input[name="repeat-mode"]:checked').value;}
function updateRepeat(){const ready=repeatedStrikeReady(repeatMode(),repeatRelease);$('repeat-ready').setAttribute('fill',ready?'#d9b485':'#596367');$('repeat-key').setAttribute('transform',`rotate(${repeatRelease==='full'?0:repeatRelease==='partial'?2:4} 300 107)`);return ready;}
$('repeat-partial').addEventListener('click',()=>{repeatRelease='partial';const ready=updateRepeat();$('repeat-readout').textContent=ready?'부분 복귀 · 다음 타격 준비 완료':'부분 복귀 · 더 놓아야 다시 칠 수 있습니다.';});
$('repeat-full').addEventListener('click',()=>{repeatRelease='full';updateRepeat();$('repeat-readout').textContent='완전 복귀 · 다음 타격 준비 완료';});
document.querySelectorAll('input[name="repeat-mode"]').forEach(el=>el.addEventListener('change',()=>{repeatRelease='none';updateRepeat();$('repeat-readout').textContent='중간까지 놓은 뒤 다시 쳐보세요.';}));
$('repeat-strike').addEventListener('click',()=>{const mode=repeatMode(),release=repeatRelease,ready=updateRepeat();if(ready){sound('repeat-study',toneFor(currentMidi(),{velocity:.65}));$('repeat-readout').textContent=`${release==='partial'?'부분':'완전'} 복귀 후 재타격 · 소리가 났습니다.`;repeatRelease='none';updateRepeat();}else $('repeat-readout').textContent='다시 칠 수 없습니다. 건반을 더 놓아주세요.';if(release==='partial')tried.repeat.add(mode);if(tried.repeat.size===2)found('repeat');});
const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.target===activeArticle&&!e.isIntersecting)){window.PianoExperience?.stopStudy();activeArticle=null;cancelAnimationFrame(animation);}});document.querySelectorAll('.question-study').forEach(el=>observer.observe(el));
window.addEventListener('piano:change',context);window.addEventListener('blur',()=>cancelAnimationFrame(animation));document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(animation);});
context();updateRepeat();
