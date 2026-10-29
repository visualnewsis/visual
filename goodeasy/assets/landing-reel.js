const button=document.getElementById('landing-crank');
if(button){
 const handle=document.getElementById('landing-handle'),rotor=document.getElementById('landing-rotor'),note=document.getElementById('landing-note'),caption=document.getElementById('next-caption');
 let turns=0,frame=0,start=0,from=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function paint(value){handle.setAttribute('transform',`rotate(${value*360} 80 50)`);rotor.setAttribute('transform',`rotate(${value*5.2*360} 80 50)`);note.textContent=(value*5.2).toFixed(1)+' 바퀴';}
 function finish(){frame=0;paint(turns);button.disabled=false;caption.textContent='로터가 '+(turns*5.2).toFixed(1)+'바퀴 돌았습니다. 안에서는?';}
 function draw(now){const p=Math.min(1,(now-start)/1800);paint(from+p);if(p<1)frame=requestAnimationFrame(draw);else finish();}
 button.addEventListener('click',()=>{if(frame)return;from=turns;turns++;button.disabled=true;if(reduced)finish();else {start=performance.now();frame=requestAnimationFrame(draw);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);finish();}});
}
