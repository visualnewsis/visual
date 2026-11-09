import {makeStage} from './quality-kit.js?v=20261109-loading3';
import {buildProjector} from './projector-hero.js?v=20261108-projector2';
import {paintFilmFrame} from './projector-frames.js?v=20261028-release3';
const canvas=document.getElementById('landing-projector-canvas'),picture=document.getElementById('landing-projector-picture'),button=document.getElementById('landing-projector-next'),status=document.getElementById('landing-projector-status'),link=document.getElementById('projector-next');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let stage,model,frames=0,motion=null,raf=0,last=0,lost=false,interacted=false;
function draw(){
 const frame=Math.floor(frames+.35)%24;paintFilmFrame(picture.getContext('2d'),frame,picture.width,picture.height);
 const text=(frame+1)+' / 24 프레임';if(status.textContent!==text)status.textContent=text;
 link.href=interacted?'projector/?landing-frame='+frame+'#opening-quote':'projector/#opening-quote';
 if(model&&!lost){model.update({frames});stage.draw();canvas.dataset.ready='true';canvas.dataset.frame=String(frame);document.body.classList.add('projector-ready');}
}
function tick(now){raf=0;const dt=Math.min(.08,(now-last)/1000||0);last=now;if(!motion||document.hidden)return;motion.elapsed+=dt;const t=Math.min(1,motion.elapsed/.70);frames=motion.from+t;draw();if(t<1)raf=requestAnimationFrame(tick);else{motion=null;button.disabled=false;}}
function finish(){if(motion){frames=motion.from+1;motion=null;}cancelAnimationFrame(raf);raf=0;button.disabled=false;draw();}
button.addEventListener('click',()=>{if(motion)return;interacted=true;if(reduced.matches){frames=Math.floor(frames)+1;draw();return;}motion={from:Math.floor(frames),elapsed:0};button.disabled=true;last=performance.now();raf=requestAnimationFrame(tick);});
link.addEventListener('click',()=>{if(motion)finish();});
try{stage=makeStage(canvas);model=buildProjector();stage.setModel(model,model.eye);draw();new ResizeObserver(draw).observe(canvas.parentElement);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;finish();canvas.dataset.ready='false';document.body.classList.remove('projector-ready');});canvas.addEventListener('webglcontextrestored',()=>{lost=false;draw();});}catch(error){canvas.hidden=true;draw();console.error('Projector landing',error);}
draw();window.addEventListener('pagehide',finish);document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
