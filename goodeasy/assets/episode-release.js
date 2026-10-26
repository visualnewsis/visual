const kind=document.body.dataset.experiment;
const area=document.getElementById('turn-area');
if(area&&(kind==='watch'||kind==='fishing-reel')){
 const button=document.createElement('button');button.type='button';button.className='gesture-toggle';button.setAttribute('aria-pressed','false');button.textContent='드래그 조작 켜기';
 const setMode=active=>{area.classList.toggle('is-gesture-mode',active);button.setAttribute('aria-pressed',String(active));button.textContent=active?'드래그 조작 끄기':'드래그 조작 켜기';};
 button.addEventListener('click',()=>setMode(!area.classList.contains('is-gesture-mode')));area.parentElement.append(button);
 document.getElementById('reset')?.addEventListener('click',()=>setMode(false));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)setMode(false)});
}
