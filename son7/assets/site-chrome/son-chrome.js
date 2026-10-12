/* Reserve the measured common header in every pinned scene. */
(() => {
  const root=document.documentElement;
  window.sonReadingTop=()=>Math.ceil(document.querySelector('.vnh-header')?.getBoundingClientRect().height||64);
  function measure(){
    const height=window.sonReadingTop(),top=height;
    if(root.style.getPropertyValue('--reader-top')===`${top}px`)return;
    root.style.setProperty('--site-header-height',`${height}px`);
    root.style.setProperty('--reader-top',`${top}px`);
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  measure();
  function observeHeader(){
    const header=document.querySelector('.vnh-header');
    if(window.ResizeObserver&&header)new ResizeObserver(measure).observe(header);
    measure();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeHeader,{once:true});else observeHeader();
  window.addEventListener('resize',measure,{passive:true});
})();
