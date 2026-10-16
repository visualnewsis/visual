(()=>{
 const shell=document.querySelector('.cgh-shell');
 if(!shell)return;
 const button=shell.querySelector('.cgh-toggle'),nav=shell.querySelector('.cgh-nav');
 function close(){nav.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','전체 메뉴 열기')}
 button.addEventListener('click',()=>{const open=nav.hidden;nav.hidden=!open;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기')});
 shell.addEventListener('keydown',event=>{if(event.key==='Escape'&&!nav.hidden){close();button.focus()}});
 document.addEventListener('click',event=>{if(!nav.hidden&&!shell.contains(event.target))close()});
 function matchBackground(){
  let bg=getComputedStyle(document.body).backgroundColor;
  if(bg==='rgba(0, 0, 0, 0)'||bg==='transparent')bg=getComputedStyle(document.documentElement).backgroundColor;
  const rgb=bg.match(/[\d.]+/g);
  if(!rgb||rgb.length<3||rgb.length>3&&Number(rgb[3])===0)return;
  const light=(Number(rgb[0])*.2126+Number(rgb[1])*.7152+Number(rgb[2])*.0722)>145;
  shell.style.setProperty('--cgh-bg',bg);
  shell.style.setProperty('--cgh-fg',light?'#151719':'#f5f3e9');
  shell.style.setProperty('--cgh-line',light?'rgba(20,25,23,.22)':'rgba(255,255,255,.18)');
  shell.style.setProperty('--cgh-logo-filter',light?'none':'grayscale(1) brightness(0) invert(1)');
 }
 matchBackground();
 new MutationObserver(matchBackground).observe(document.body,{attributes:true,attributeFilter:['class','style','data-theme']});
 new MutationObserver(matchBackground).observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
})();
