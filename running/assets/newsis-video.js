(function(){
 'use strict';
 const $=id=>document.getElementById(id),trigger=$('newsisSafetyVideo'),dialog=$('newsisVideoDialog'),host=$('newsisVideoHost'),close=$('newsisVideoClose'),external=$('newsisVideoExternal');
 const marker='newsis-marathon-video';
 let frame=null,background=[],returnUrl='',returnState=null;
 function ownEntry(){return window.history?.state?.newsisVideo===marker;}
 function teardown(restoreFocus=true){
  if(frame){frame.setAttribute('src','about:blank');frame.remove();frame=null;}
  dialog.hidden=true;dialog.inert=true;document.documentElement.classList.remove('newsis-video-open');
  for(const [node,wasInert]of background)node.inert=wasInert;
  background=[];if(restoreFocus)trigger.focus?.({preventScroll:true});
 }
 function closePlayer(){
  teardown();
  if(ownEntry())window.history.back();
 }
 function openPlayer(){
  if(frame)return;
  window.chapterRest?.release();
  returnUrl=window.location.href;returnState=window.history?.state??null;
  const url=new URL(returnUrl);url.hash='newsis-video';
  try{window.history.pushState({...returnState,newsisVideo:marker},'',url.href);}catch{}
  frame=document.createElement('iframe');
  frame.setAttribute('title','뉴시스TV 5분 정독 · 세계 마라톤은 러너를 이렇게 지킨다');
  frame.setAttribute('allow',"autoplay; encrypted-media; fullscreen; picture-in-picture 'none'");
  frame.setAttribute('allowfullscreen','');
  frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  frame.setAttribute('src','https://www.youtube-nocookie.com/embed/LxVIx0BFzzg?autoplay=1&playsinline=1&rel=0');
  host.append(frame);
  background=Array.from(document.body.children).filter(node=>node!==dialog&&!['SCRIPT','STYLE','LINK'].includes(node.tagName)).map(node=>[node,node.inert]);
  for(const [node]of background)node.inert=true;
  dialog.hidden=false;dialog.inert=false;document.documentElement.classList.add('newsis-video-open');close.focus?.({preventScroll:true});
 }
 trigger.addEventListener('click',e=>{
  if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(e.button!==undefined&&e.button!==0))return;
  e.preventDefault();openPlayer();
 });
 close.addEventListener('click',closePlayer);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closePlayer();});
 external.addEventListener('click',()=>{teardown(false);if(ownEntry())window.history.replaceState(returnState,'',returnUrl);});
 document.addEventListener('keydown',e=>{
  if(dialog.hidden)return;
  if(e.key==='Escape'){e.preventDefault();closePlayer();return;}
  if(e.key!=='Tab')return;
  const active=document.activeElement;
  if(e.shiftKey&&active===close){e.preventDefault();external.focus?.({preventScroll:true});}
  else if(!e.shiftKey&&active===external){e.preventDefault();close.focus?.({preventScroll:true});}
 });
 window.addEventListener('popstate',()=>{if(!dialog.hidden)teardown();});
 window.addEventListener('pagehide',()=>teardown(false));
 window.addEventListener('pageshow',()=>{if(ownEntry()&&!frame)window.history.replaceState(returnState,'',returnUrl||window.location.pathname);});
 window.newsisVideoController={open:openPlayer,close:closePlayer,snapshot:()=>({open:!dialog.hidden,hasFrame:!!frame})};
}());
