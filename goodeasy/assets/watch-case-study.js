import {T,makeStage} from './quality-kit.js?v=20261028-watchmechanism2';
import {attachInspectControls} from './inspect-controls.js?v=20261028-uxaudio2';
import {buildWatchCase} from './watch-case.js?v=20261028-watchmechanism2';
const host=document.getElementById('watch-case-study');
if(host){
 let started=false;
 const boot=()=>{if(started)return;started=true;
  const canvas=host.querySelector('canvas'),stage=makeStage(canvas),shell=buildWatchCase(T),selected=[...shell.parts.lugs.filter(o=>o.name.includes('north')),...shell.parts.springBars.filter(o=>o.userData.direction===1)],bounds=()=>{shell.group.updateMatrixWorld(true);const b=new T.Box3();for(const o of selected)b.union(new T.Box3().setFromObject(o));return b;};
  for(const o of shell.group.children)if(o!==shell.parts.case.middle&&!selected.includes(o))o.visible=false;
  shell.parts.case.middle.geometry.dispose();shell.parts.case.middle.geometry=new T.LatheGeometry(shell.parts.case.middle.userData.profile.map(p=>new T.Vector2(...p)),64,Math.PI*2-.84,1.68);
  shell.updateRelease(0);const envelope=new T.Box3(new T.Vector3(-2.08,.25,1.90),new T.Vector3(2.08,1.1,3.34));
  const model={group:shell.group,getVisualBounds:()=>envelope.clone().applyMatrix4(shell.group.matrixWorld)};stage.setModel(model,[5,3.5,7]);
  attachInspectControls(stage,canvas,{label:'러그와 스프링바의 실제 체결부'});
  const slider=host.querySelector('input[type="range"]'),reading=host.querySelector('[data-case-reading]'),springButton=host.querySelector('[data-show-spring]');
  slider.addEventListener('input',()=>{const v=Number(slider.value);shell.updateRelease(v);reading.textContent=v===0?'고정 핀이 양쪽 러그의 구멍 안에 걸려 있습니다.':v<.60?'양끝을 누르면 내부 스프링이 압축되고 고정 핀이 안으로 들어갑니다.':'고정 핀이 구멍을 벗어난 뒤 스프링바가 빠집니다.';canvas.dataset.release=String(v);stage.draw();});
  host.querySelector('[data-case-reset]').addEventListener('click',()=>{slider.value='0';slider.dispatchEvent(new Event('input'));});
  springButton.addEventListener('click',()=>{const show=springButton.getAttribute('aria-pressed')!=='true';springButton.setAttribute('aria-pressed',String(show));shell.showSprings(show);stage.draw();});
  new ResizeObserver(()=>stage.draw()).observe(canvas.parentElement);stage.draw();canvas.dataset.caseReady='true';
 };
 const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();try{boot();}catch(e){host.querySelector('[data-case-reading]').textContent='체결부 모형을 불러오지 못했습니다. 페이지를 새로고침해 주세요.';console.error(e);}}},{rootMargin:'400px'});io.observe(host);
}
