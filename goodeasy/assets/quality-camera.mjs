export function cameraResult(host){
 const frame=document.createElement('aside');frame.className='camera-result';
 const caption=document.createElement('small'),canvas=document.createElement('canvas'),note=document.createElement('small');
 canvas.width=960;canvas.height=600;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','AI 가상 강변 장면 · 촬영 설정에 따른 밝기와 움직임 비교');
 note.className='camera-scene-note';note.textContent='AI 가상 장면 · 밝기와 잔상은 비교용 표현';frame.append(caption,canvas,note);host.append(frame);
 const c=canvas.getContext('2d'),background=new Image(),walker=new Image();let latest=null;
 const paint=state=>{
  latest=state;const photo=state.photo,t=photo?.t??performance.now()/1000,a=photo?.a??state.aperture,d=photo?.d??state.shutter;
  const brightness=Math.max(.18,Math.min(1.7,(2.8/a)**2*250/d)),x=((t*54)%514)-65,trail=360/d;
  c.setTransform(2.5,0,0,2.5,0,0);c.globalAlpha=1;c.clearRect(0,0,384,240);
  if(background.complete&&background.naturalWidth)c.drawImage(background,0,0,384,240);
  else{const sky=c.createLinearGradient(0,0,0,240);sky.addColorStop(0,'#91aab4');sky.addColorStop(1,'#eacfa6');c.fillStyle=sky;c.fillRect(0,0,384,240);c.fillStyle='#68796e';c.fillRect(0,155,384,35);c.fillStyle='#bfb6a0';c.fillRect(0,190,384,50);}
  if(walker.complete&&walker.naturalWidth){
   const h=108,w=h*walker.naturalWidth/walker.naturalHeight;
   c.fillStyle='#1d282c';c.globalAlpha=.14;c.beginPath();c.ellipse(x+w*.42,234,w*.55,2.7,0,0,Math.PI*2);c.fill();
   // Exposure trails are intentionally magnified for comparing shutter settings.
   const samples=d<125?12:1;
   for(let i=samples-1;i>=0;i--){c.globalAlpha=1/samples;c.drawImage(walker,x-trail*i/Math.max(1,samples-1),234-h,w,h);}
  }
  c.globalAlpha=1;
  if(brightness<1){c.fillStyle=`rgba(0,0,0,${1-brightness})`;c.fillRect(0,0,384,240);}else{c.fillStyle=`rgba(255,255,232,${(brightness-1)*.6})`;c.fillRect(0,0,384,240);}
  c.strokeStyle='#ffffff80';c.lineWidth=.45;const cx=192,cy=132,k=12,g=6;
  c.beginPath();for(const sx of [-1,1])for(const sy of [-1,1]){c.moveTo(cx+sx*k,cy+sy*(k-g));c.lineTo(cx+sx*k,cy+sy*k);c.lineTo(cx+sx*(k-g),cy+sy*k);}c.stroke();
  caption.textContent=`${photo?'촬영 결과':'가상 뷰파인더'} · f/${a} · 1/${d}초`;frame.dataset.captured=String(!!photo);
 };
 background.onload=walker.onload=()=>{if(latest)paint(latest);};
 background.src=new URL('../camera/images/viewfinder-riverside.webp',import.meta.url).href;
 walker.src=new URL('../camera/images/viewfinder-walker.webp',import.meta.url).href;
 return paint;
}
