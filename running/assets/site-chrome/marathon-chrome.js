(function () {
 'use strict';
 const $=id=>document.getElementById(id),header=$('siteHeader'),toggle=$('siteMenuToggle'),menu=$('vnh-menu'),share=$('articleShare'),status=$('articleShareStatus'),fallback=$('shareFallback'),urlInput=$('articleShareUrl'),closeFallback=$('shareFallbackClose');
 const menuLinks=['Latest','Editshop','Newsystem','Mapguide','Onepoint','Arcade','Calculator'].map(key=>$('menu'+key));
 let lastHeight=-1,noticeTimer=0,busy=false;
 function measure(){const height=window.articleReadingTop();if(height===lastHeight)return;lastHeight=height;document.documentElement.style.setProperty('--site-header-height',height+'px');window.dispatchEvent(new Event('resize'));}
 function setMenu(open,restore=true){header.dataset.open=String(open);menu.dataset.open=String(open);menu.hidden=!open;menu.inert=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기');if(open)menuLinks[0].focus?.({preventScroll:true});else if(restore)toggle.focus?.({preventScroll:true});}
 toggle.addEventListener('click',()=>{closeManual(false);setMenu(menu.hidden);});
 menu.addEventListener('click',e=>{if(e.target===menu||e.target.closest?.('a'))setMenu(false,e.target===menu);});
 function closeManual(restore=true){fallback.hidden=true;fallback.inert=true;if(restore)share.focus?.({preventScroll:true});}
 closeFallback.addEventListener('click',()=>closeManual());
 function notice(message){window.clearTimeout(noticeTimer);status.textContent=message;status.hidden=false;noticeTimer=window.setTimeout(()=>{status.hidden=true;},4500);}
 function manual(url){urlInput.value=url;fallback.hidden=false;fallback.inert=false;urlInput.focus?.({preventScroll:true});urlInput.select?.();}
 function shareUrl(){const canonical=document.querySelector('link[rel="canonical"]')?.href;const url=new URL(canonical||window.location.href);url.hash='';url.search='';return url.href;}
 async function shareArticle(){
  if(busy)return;busy=true;share.disabled=true;status.hidden=true;closeManual(false);setMenu(false,false);
  const url=shareUrl(),data={title:'끝까지 달릴 준비, 도중에 멈출 대비',text:'출발 전 컨디션부터 몸의 이상 신호, 응급대응과 복귀까지.',url};
  try{
   const touch=window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(max-width: 900px)').matches;
   if(touch&&navigator.share&&(!navigator.canShare||navigator.canShare(data))){
    try{await navigator.share(data);return;}catch(error){if(error?.name==='AbortError')return;}
   }
   try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(url);notice('기사 링크를 복사했습니다.');}catch{manual(url);}
  }finally{busy=false;share.disabled=false;}
 }
 share.addEventListener('click',shareArticle);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!fallback.hidden){e.preventDefault();closeManual();}else if(!menu.hidden){e.preventDefault();setMenu(false);}return;}
  if(e.key!=='Tab')return;
  const list=!fallback.hidden?[urlInput,closeFallback]:!menu.hidden?menuLinks:null;if(!list)return;
  const active=document.activeElement,first=list[0],last=list[list.length-1];
  if(e.shiftKey&&(active===first||!list.includes(active))){e.preventDefault();last.focus?.({preventScroll:true});}else if(!e.shiftKey&&(active===last||!list.includes(active))){e.preventDefault();first.focus?.({preventScroll:true});}
 });
 $('articleTop').addEventListener('click',e=>{e.preventDefault();setMenu(false,false);closeManual(false);window.chapterRest.reset();window.chapterRest.navigateTo('articleIntro');$('articleIntro').focus?.({preventScroll:true});});
 window.addEventListener('resize',measure,{passive:true});window.visualViewport?.addEventListener('resize',measure);
 if(window.ResizeObserver)new window.ResizeObserver(measure).observe(header);
 window.articleChromeController={share:shareArticle,setMenu,closeManual,measure};measure();
}());
