
(()=>{const root=document.getElementById('cm-play'),games=[...root.querySelectorAll('.cm-game')],buttons=[...root.querySelectorAll('[data-filter]')],result=root.querySelector('.cm-result');function filter(value){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===value)));let count=0;games.forEach(g=>{g.hidden=value!=='전체'&&g.dataset.type!==value;if(!g.hidden)count++});root.querySelector('.cm-count').textContent=count}buttons.forEach(b=>b.addEventListener('click',()=>{filter(b.dataset.filter);result.hidden=true}));root.querySelector('.cm-random').addEventListener('click',()=>{filter('전체');games.forEach(g=>g.classList.remove('cm-picked'));const pick=games[Math.floor(Math.random()*games.length)];pick.classList.add('cm-picked');result.hidden=false;result.textContent='이번 한 판은 '+pick.querySelector('h3').textContent+'! 아래 게임을 눌러 시작하세요.';pick.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});const menu=root.querySelector('.cm-menu'),nav=root.querySelector('.cm-nav');root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!nav.hidden){menu.click();menu.focus()}});menu.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden));menu.setAttribute('aria-label',nav.hidden?'전체 메뉴 열기':'전체 메뉴 닫기')});const featured=root.querySelector('.cm-feature');
let previous='';
try{previous=sessionStorage.getItem('cm-last-feature')||''}catch{}
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
 const description=document.createElement('p');
 description.className='cm-feature-description';
 description.textContent=chosen.querySelector('p').textContent;
 featured.querySelector('.cm-feature-copy>div').append(description);
 try{sessionStorage.setItem('cm-last-feature',chosen.getAttribute('href'))}catch{}
}
})();
