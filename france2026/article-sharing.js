'use strict';
(()=>{
 const button=document.getElementById('shareButton'),dialog=document.getElementById('shareDialog'),input=document.getElementById('shareUrl'),status=document.getElementById('shareStatus');
 const url=document.querySelector('link[rel="canonical"]').href,title='불만의 문제일까?';
 input.value=url;
 button.onclick=async()=>{
  status.textContent='';
  if(typeof navigator.share==='function'){
   try{await navigator.share({title,url});return}catch(error){if(error.name==='AbortError')return}
  }
  dialog.showModal();
 };
 document.getElementById('closeShare').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 document.getElementById('copyArticleLink').onclick=async()=>{
  try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(url);status.textContent='링크 복사 완료'}
  catch{input.focus();input.select();status.textContent='기사 주소를 선택했다. 복사해 공유할 수 있다.'}
 };
})();
