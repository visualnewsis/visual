'use strict';
(()=>{
 const toggle=document.getElementById('siteMenuToggle'),menu=document.getElementById('visualMenu'),head=document.getElementById('siteHeader');
 function setOpen(open){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기');menu.dataset.open=head.dataset.open=String(open);menu.inert=!open;if(open)closeMenu()}
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 menu.addEventListener('click',e=>{if(e.target===menu||e.target.closest('a'))setOpen(false)});
 document.getElementById('menuButton').addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
 document.addEventListener('journey:screenchange',e=>{if(!e.detail.bookend)setOpen(false)});
 document.getElementById('articleTop').addEventListener('click',e=>{e.preventDefault();seek(0)});
})();
