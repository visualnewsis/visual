(() => {
 'use strict';
 const dialog=document.querySelector('#tg-dialog'),wrap=document.querySelector('.tg-launch-wrap'),launch=document.querySelector('.tg-launch');
 if(!dialog||!launch)return;
 let lastFocus,oldOverflow;
 dialog.dataset.service='find';
 function fit(){dialog.style.setProperty('--tg-screen-width',window.innerWidth+'px');}
 fit();window.addEventListener('resize',fit,{passive:true});window.visualViewport?.addEventListener('resize',fit,{passive:true});
 function close(){dialog.close();}
 launch.addEventListener('click',()=>{lastFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();wrap.style.visibility='hidden';launch.setAttribute('aria-expanded','true');document.querySelector('#tg-dialog-title').focus();});
 document.querySelector('.tg-hide').addEventListener('click',()=>wrap.classList.add('is-small'));
 dialog.querySelectorAll('.tg-close,.tg-close-text').forEach(b=>b.addEventListener('click',close));
 dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow||'';wrap.style.visibility='';launch.setAttribute('aria-expanded','false');lastFocus?.focus();});
 function outside(e){const r=dialog.getBoundingClientRect();return e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);}
 let backdropDown=false;
 dialog.addEventListener('pointerdown',e=>{backdropDown=outside(e);});
 dialog.addEventListener('pointercancel',()=>{backdropDown=false;});
 dialog.addEventListener('click',e=>{if(backdropDown&&outside(e))close();backdropDown=false;});
 dialog.querySelectorAll('.tg-services button').forEach(b=>b.addEventListener('click',()=>{if(dialog.dataset.service===b.dataset.service)return;dialog.dataset.service=b.dataset.service;dialog.querySelectorAll('.tg-services button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));dialog.querySelectorAll('[data-view]').forEach(x=>x.hidden=x.dataset.view!==b.dataset.service);dialog.querySelector('#tongi-reset').click();}));
 const interestButtons=[...dialog.querySelectorAll('.tg-interests button')],status=dialog.querySelector('#tg-saved');
 try{const saved=JSON.parse(localStorage.getItem('tongi-demo-interests')||'[]');interestButtons.forEach(b=>b.setAttribute('aria-pressed',String(Array.isArray(saved)&&saved.includes(b.textContent))));}catch{}
 interestButtons.forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));status.textContent='';}));
 dialog.querySelector('#tg-save').addEventListener('click',()=>{const selected=interestButtons.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent);try{localStorage.setItem('tongi-demo-interests',JSON.stringify(selected));status.textContent=selected.length?selected.join(' · ')+' 저장했어요. 브리핑은 기사 데이터 연결 후 제공됩니다.':'저장한 관심사를 지웠어요.';}catch{status.textContent='브라우저 저장이 제한되어 이번 화면에서만 선택됩니다.';}});
 function result(target,title,description,url,linkText){target.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=description;const a=document.createElement('a');a.href=url;a.textContent=linkText+' ↗';target.append(strong,p,a);target.hidden=false;}
 dialog.querySelectorAll('[data-fill]').forEach(b=>b.addEventListener('click',()=>{dialog.querySelector('#tg-calc-query').value=b.dataset.fill;dialog.querySelector('#tg-calc-query').focus();}));
 dialog.querySelector('#tg-calc-form').addEventListener('submit',e=>{e.preventDefault();const q=dialog.querySelector('#tg-calc-query').value.trim();if(!q)return;result(dialog.querySelector('#tg-calc-result'),'먼저, 내 조건을 알아볼게요.','“'+q+'” → 월 지출·보유 자금·기간 등 필요한 조건을 대화로 확인하는 시안입니다. 현재 질문 해석과 계산기 자동 입력은 연결 전입니다. 기존 계산대로에서 계산기를 골라 직접 입력해 주세요.','https://visual.newsis.com/calculator/index.html','계산대로 열기');});
 dialog.querySelector('#tg-here-form').addEventListener('submit',e=>{e.preventDefault();const q=dialog.querySelector('#tg-location').value.trim();if(!q)return;result(dialog.querySelector('#tg-here-result'),'“'+q+'” 주변 소식이 궁금하군요.','지역 질문을 확인했어요. 현재 지역 인식과 기사 검색은 연결 전입니다. 여기뉴스 지도를 열어 해당 지역을 찾아보세요. 입력한 지역이 자동으로 전달되지는 않습니다.','https://visual.newsis.com/newsmap/','여기뉴스 지도 열기');});
 dialog.querySelectorAll('[name=placement]').forEach(input=>input.addEventListener('change',()=>{wrap.dataset.placement=input.value;dialog.dataset.placement=input.value;}));
 dialog.querySelectorAll('.tg-extra input,.tg-extra textarea').forEach(input=>{input.addEventListener('focus',()=>document.querySelector('#tongi').dispatchEvent(new CustomEvent('tongi:react',{detail:'listening'})));input.addEventListener('input',()=>document.querySelector('#tongi').dispatchEvent(new CustomEvent('tongi:react',{detail:'typing'})));});
})();
