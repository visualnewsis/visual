
(()=>{const root=document.getElementById('cm-play'),games=[...root.querySelectorAll('.cm-game')],buttons=[...root.querySelectorAll('[data-filter]')],result=root.querySelector('.cm-result');function filter(value){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===value)));let count=0;games.forEach(g=>{g.hidden=value!=='전체'&&g.dataset.type!==value;if(!g.hidden)count++});root.querySelector('.cm-count').textContent=count}buttons.forEach(b=>b.addEventListener('click',()=>{filter(b.dataset.filter);result.hidden=true}));root.querySelector('.cm-random').addEventListener('click',()=>{chooseFeature()});const featured=root.querySelector('.cm-feature');
function chooseFeature(){
let previous=featured.dataset.game||'';
if(!previous){try{previous=sessionStorage.getItem('cm-last-feature')||''}catch{}}
const candidates=games.filter(game=>game.getAttribute('href')!==previous);
const chosen=candidates[Math.floor(Math.random()*candidates.length)];
if(chosen){
 const thumb=chosen.querySelector('img'),name=thumb.alt;
 featured.href=chosen.href;
 featured.querySelector('img').src=thumb.src;
 featured.querySelector('img').alt=name+' 게임';
 featured.querySelector('h2').textContent=name;
 const latest=chosen===games[0];
 featured.querySelector('small').textContent=(latest?'NEW GAME':'이번엔 이 게임')+' · '+chosen.dataset.type+' · '+chosen.querySelector('.cm-meta span:last-child').textContent;
 featured.dataset.game=chosen.getAttribute('href');
 const description=featured.querySelector('.cm-feature-description')||document.createElement('p');
 description.className='cm-feature-description';
 description.textContent=chosen.querySelector('p').textContent;
 featured.querySelector('.cm-feature-copy>div').append(description);
 result.textContent=name+' 추천';
 try{sessionStorage.setItem('cm-last-feature',chosen.getAttribute('href'))}catch{}
}
}
chooseFeature();
})();
