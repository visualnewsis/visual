'use strict';
// Credits follow the article URL, including dynamically replaced record links.
(()=>{
 function annotate(link){
  const id=link.href.match(/newsis\.com\/view\/(NISX\d+_\d+)/)?.[1];
  const credit=!link.closest('#atlasDialog,#cityTimeline,#recordDialog')&&id&&window.articleBylines[id];
  let badge=link.querySelector(':scope > .article-byline');
  if(!credit){badge?.remove();return}
  if(!badge){badge=document.createElement('small');badge.className='article-byline';link.append(badge)}
  if(badge.textContent!==credit)badge.textContent=credit;
 }
 function scan(root){if(root.nodeType!==1)return;if(root.matches('a[href]'))annotate(root);root.querySelectorAll('a[href]').forEach(annotate)}
 scan(document.documentElement);
 new MutationObserver(records=>{
  const links=new Set();
  for(const r of records){
   if(r.type==='attributes'){links.add(r.target);continue}
   const parent=r.target.nodeType===1?r.target:r.target.parentElement;
   const a=parent?.closest('a[href]');if(a)links.add(a);
   r.addedNodes.forEach(node=>{if(node.nodeType===1&&!node.classList.contains('article-byline'))scan(node)});
  }
  links.forEach(annotate);
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
})();
