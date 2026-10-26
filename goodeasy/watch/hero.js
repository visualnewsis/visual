const play=document.getElementById('play');
const stage=play.querySelector('.stage');
const art=document.createElement('figure');art.className='watch-hero-art';
art.innerHTML='<img src="hero-watch.jpg" alt="브론즈 색 케이스와 검은 가죽줄의 기계식 손목시계 AI 이미지" fetchpriority="high" width="1536" height="1024"><figcaption>AI 생성·가공 이미지 · 실제 시계의 구조와는 차이가 있습니다.</figcaption>';
stage.append(art);
const view=document.createElement('button');view.type='button';view.className='watch-hero-view';
function setLive(live){play.classList.toggle('watch-live',live);view.textContent=live?'시계 이미지 보기':'작동 모형 보기';view.setAttribute('aria-pressed',String(live));}
view.addEventListener('click',()=>setLive(!play.classList.contains('watch-live')));stage.append(view);setLive(false);
document.getElementById('action').addEventListener('click',()=>setLive(true));
document.getElementById('reset').addEventListener('click',()=>setLive(false));
let previous=window.GoodeasyRenderState?.reserve||0;
window.addEventListener('goodeasy:state',({detail})=>{if(detail.reserve>previous)setLive(true);previous=detail.reserve;});
