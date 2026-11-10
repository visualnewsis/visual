import {createEspressoExperience} from './espresso-experience.js?v=20261110-landing1';
const canvas=document.getElementById('landing-espresso-canvas'),link=document.getElementById('espresso-next'),status=document.getElementById('landing-espresso-status');
let state={grind:50},stage,model,raf=0,last=0,visible=true,lost=false,interacted=false;
function render(){
 if(stage&&model&&!lost){model.update(state,false,performance.now());stage.draw();canvas.dataset.ready='true';}
 canvas.dataset.grind=String(state.grind);canvas.dataset.elapsed=String(state.brewElapsed||0);canvas.dataset.volume=String(state.volume||0);
 link.href=interacted?'espresso-machine/?landing-grind='+state.grind+'&landing-time='+(state.brewElapsed||0).toFixed(2)+'#opening-quote':'espresso-machine/#opening-quote';
}
function wake(){if(visible&&!document.hidden&&!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
function tick(now){raf=0;if(!visible||document.hidden)return;const running=experience.tick(Math.min(.15,(now-last)/1000||0));last=now;if(running)raf=requestAnimationFrame(tick);}
const experience=createEspressoExperience({getState:()=>state,setState:s=>state=s,render,wake,announce:text=>{if(status.textContent!==text)status.textContent=text;}});
document.getElementById('action').addEventListener('click',()=>{interacted=true;experience.brew();});
document.getElementById('landing-espresso-reset').addEventListener('click',()=>experience.reset());
for(const button of document.querySelectorAll('[data-espresso-grind]'))button.addEventListener('click',()=>{interacted=true;render();});
link.addEventListener('click',()=>experience.pause());
function pause(){experience.pause();cancelAnimationFrame(raf);raf=0;}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else pause();}).observe(canvas.parentElement);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});window.addEventListener('pagehide',pause);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;pause();canvas.dataset.ready='false';window.GoodeasyLoading?.fail(canvas,new Error('WebGL context lost'));});
canvas.addEventListener('webglcontextrestored',()=>{lost=false;render();});
window.GoodeasyLoading?.watch(canvas.parentElement);
async function boot(){try{const {T,materials,makeStage}=await import('./quality-kit.js?v=20261109-loading3');const {buildEspressoStudy}=await import('./quality-replacements.js?v=20261109-espresso5');stage=makeStage(canvas);model=buildEspressoStudy(T,materials);stage.setModel(model,model.eye);render();new ResizeObserver(render).observe(canvas.parentElement);}catch(error){lost=true;window.GoodeasyLoading?.fail(canvas.parentElement,error);console.warn('Espresso landing unavailable:',error.message);}}
boot();
