export function cameraResult(host){
 const frame=document.createElement('aside');frame.className='camera-result';const caption=document.createElement('small'),canvas=document.createElement('canvas');canvas.width=384;canvas.height=240;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','가상 장면 · 촬영 설정에 따른 밝기와 움직임 비교');frame.append(caption,canvas);host.append(frame);const c=canvas.getContext('2d');
 return state=>{const photo=state.photo,t=photo?.t??performance.now()/1000,a=photo?.a??state.aperture,d=photo?.d??state.shutter;
 const brightness=Math.max(.18,Math.min(1.7,(2.8/a)**2*250/d)),x=190+Math.sin(t*.7)*120,blur=Math.min(75,1800/d);
 c.clearRect(0,0,384,240);const sky=c.createLinearGradient(0,0,0,240);sky.addColorStop(0,'#8babb2');sky.addColorStop(1,'#f3d8a5');c.fillStyle=sky;c.fillRect(0,0,384,240);c.fillStyle='#526f6a';c.beginPath();c.moveTo(0,150);c.lineTo(85,70);c.lineTo(160,150);c.lineTo(260,95);c.lineTo(384,160);c.lineTo(384,240);c.lineTo(0,240);c.fill();c.fillStyle='#b3ad87';c.fillRect(0,175,384,65);c.fillStyle='#e3d6af';c.fillRect(0,202,384,3);
 const person=(px,alpha)=>{c.globalAlpha=alpha;c.fillStyle='#292e2b';c.beginPath();c.arc(px,143,8,0,Math.PI*2);c.fill();c.fillRect(px-7,153,14,26);c.strokeStyle='#292e2b';c.lineWidth=5;c.beginPath();c.moveTo(px-5,178);c.lineTo(px-14,199);c.moveTo(px+5,178);c.lineTo(px+14,199);c.stroke();};
 for(let i=8;i>=0;i--)person(x-i*blur/8,i? .055:1);c.globalAlpha=1;
 if(brightness<1){c.fillStyle=`rgba(0,0,0,${1-brightness})`;c.fillRect(0,0,384,240);}else{c.fillStyle=`rgba(255,255,232,${(brightness-1)*.6})`;c.fillRect(0,0,384,240);}
 caption.textContent=`${photo?'촬영 결과':'가상 뷰파인더'} · f/${a} · 1/${d}`;frame.dataset.captured=String(!!photo);
 };
}
