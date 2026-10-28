import {paintFilmFrame} from './projector-frames.js?v=20261028-release3';
const kind=document.body.dataset.experiment;
if(kind==='espresso-machine'){
 const lock=document.getElementById('lock'),brew=document.getElementById('action');
 const update=()=>{const ready=lock?.getAttribute('aria-pressed')==='true';lock?.classList.toggle('primary',!ready);brew?.classList.toggle('primary',ready);};update();
 if(lock)new MutationObserver(update).observe(lock,{attributes:true,attributeFilter:['aria-pressed']});
}
if(kind==='projector'){
 const host=document.querySelector('#play .stage'),figure=document.createElement('figure');figure.className='projector-result';
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','지금 넘긴 필름의 그림 확대');
 const caption=document.createElement('figcaption');figure.append(canvas,caption);host?.append(figure);
 const draw=s=>{paintFilmFrame(canvas.getContext('2d'),s.frame||0,320,240);caption.textContent=`투사 화면 확대 · ${(s.frame||0)+1} / 24`;};draw(window.GoodeasyRenderState||{});window.addEventListener('goodeasy:state',e=>draw(e.detail));
 const action=document.getElementById('action'),link=document.createElement('a');link.href='#research-film-gate';link.className='first-comparison';link.textContent='셔터를 빼면 어떻게 될까요? → 비교 실험';action?.parentElement.append(link);
}

// Deferred 3D panels add height above deep links. Align once after their initial layout.
function alignInitialAnchor(){if(!location.hash)return;let target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(location.hash==='#research-assembly'&&document.body.dataset.experiment==='watch')target=document.getElementById('anatomy');requestAnimationFrame(()=>requestAnimationFrame(()=>target?.scrollIntoView({block:'start',behavior:'instant'})));}
if(document.readyState==='complete')alignInitialAnchor();else window.addEventListener('load',alignInitialAnchor,{once:true});
