/* Keep the five finishing photographs decoded before readers select a view. */
(() => {
 const $=id=>document.getElementById(id);
 const buttons=[...document.querySelectorAll('[data-finish]')];
 const photo=$('finish-photo'),mobilePhoto=$('finish-photo-mobile'),stage=$('finish-detail');
 const mobile=matchMedia('(max-width:800px)'),cache=new Map();
 const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');stage.append(status);
 let selected=buttons.find(button=>button.getAttribute('aria-pressed')==='true'),request=0;
 const mobileSource=d=>d.photo.replace(/\.webp$/,'-mobile.webp');
 const source=d=>mobile.matches?mobileSource(d):d.photo;
 function prepare(d,urgent=false){
  const src=source(d);
  if(cache.has(src)){const entry=cache.get(src);if(urgent)entry.image.fetchPriority='high';return entry;}
  const image=new Image();image.decoding='async';image.fetchPriority=urgent?'high':'low';
  const entry={image,decoded:false,ready:null};
  entry.ready=new Promise(resolve=>{
   image.onload=async()=>{try{if(image.decode)await image.decode();entry.decoded=true;resolve(true);}catch{cache.delete(src);resolve(false);}};
   image.onerror=()=>{cache.delete(src);resolve(false);};
  });
  cache.set(src,entry);image.src=src;return entry;
 }
 function commit(button,d){
  buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===button)));selected=button;
  mobilePhoto.srcset=mobileSource(d);photo.src=d.photo;photo.alt=d.alt;
  $('finish-count').textContent=d.count;
  document.querySelector('.finish-stat span').firstChild.textContent=d.unit+' ';
  document.querySelector('.finish-stat small').textContent=d.detail;
  $('finish-credit').textContent=d.credit;$('finish-marker').textContent=d.marker;
  $('finish-heading').textContent=d.heading;$('finish-description').textContent=d.description;
  $('finish-link').href=d.link;stage.setAttribute('aria-busy','false');status.textContent='';
  document.dispatchEvent(new CustomEvent('finish:change'));
 }
 function select(button){
  const token=++request;
  if(button===selected){stage.setAttribute('aria-busy','false');status.textContent='';return;}
  const d=finishes[button.dataset.finish],entry=prepare(d,true);
  if(entry.decoded){commit(button,d);return;}
  stage.setAttribute('aria-busy','true');
  entry.ready.then(ok=>{if(token!==request)return;if(ok)commit(button,d);else{stage.setAttribute('aria-busy','false');status.textContent='사진을 불러오지 못했습니다. 다시 선택해 주세요.';}});
 }
 function warmAll(){Object.values(finishes).forEach(d=>prepare(d));}
 buttons.forEach(button=>{
  button.addEventListener('pointerenter',()=>prepare(finishes[button.dataset.finish],true));
  button.addEventListener('pointerdown',()=>prepare(finishes[button.dataset.finish],true),{passive:true});
  button.addEventListener('focus',()=>select(button));button.addEventListener('click',()=>select(button));
 });
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){warmAll();observer.disconnect();}},{rootMargin:'1200px 0px'});
  observer.observe($('journey'));
 }else if('requestIdleCallback' in window){requestIdleCallback(warmAll,{timeout:1500});}else{setTimeout(warmAll,0);}
 mobile.addEventListener('change',warmAll);
})();
