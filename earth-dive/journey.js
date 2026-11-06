/* Buildless scene study. One scroll coordinate drives every transition. */
(() => {
  'use strict';
  const science = globalThis.EarthDiveScience;
  const log = document.querySelector('#field-log');
  const reveal = document.querySelector('#reveal-note');
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const beats = [...document.querySelectorAll('.beat')];
  const depth = document.querySelector('#depth');
  const label = document.querySelector('#metric-label');
  const zone = document.querySelector('#zone');
  const scale = document.querySelector('#scale');
  const marker = document.querySelector('#position');
  const motion = document.querySelector('#motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches;
  let w = 0, h = 0, stops = [], frame = 0, dirty = true, last = 0, lastReading = '';
  const colors = ['#137e95','#096680','#06475f','#082939','#030c15','#010306','#000000','#000000','#000000','#000000','#000000','#000000','#000000','#00050b','#075c75','#278a9a'];
  const mix = (a,b,t) => a+(b-a)*t;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const smooth = t => t*t*(3-2*t);
  const rgb = s => [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const blend = (a,b,t) => `rgb(${rgb(a).map((n,i)=>Math.round(mix(n,rgb(b)[i],t))).join(',')})`;
  function resize() {
    w = innerWidth; h = canvas.parentElement.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1,1.6);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stops = beats.map(el => Math.max(0,el.getBoundingClientRect().top + scrollY-innerHeight*.3));
    dirty = true; request();
  }
  function state() {
    const y = scrollY;
    let i = 0;
    while (i < stops.length-1 && y >= stops[i+1]) i++;
    const t = i === stops.length-1 ? 0 : clamp((y-stops[i])/(stops[i+1]-stops[i]));
    const travel = smooth(clamp((t-.55)/.45));
    return {i,t,p:mix(Number(beats[i].dataset.phase),Number(beats[Math.min(i+1,beats.length-1)].dataset.phase),t),d:mix(Number(beats[i].dataset.distance),Number(beats[Math.min(i+1,beats.length-1)].dataset.distance),travel)};
  }
  function ellipse(x,y,rx,ry,color,rotation=0) {
    ctx.fillStyle=color; ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fill();
  }
  function surface(p,time,arrival=false) {
    const opacity = arrival ? clamp(p-14) : 1-clamp(p);
    if (!opacity) return;
    ctx.save();ctx.globalAlpha=opacity;
    const roll = reduced ? 0 : Math.sin(time*.45)*.012*opacity;
    ctx.translate(w/2,h/2);ctx.rotate(roll);ctx.translate(-w/2,-h/2);
    const horizon = h*(arrival ? mix(-.2,.5,opacity) : mix(.56,-.35,clamp(p)));
    const bob = reduced ? 0 : Math.sin(time*.8)*h*.004;
    const sky = ctx.createLinearGradient(0,0,0,Math.max(1,horizon));
    sky.addColorStop(0,arrival?'#afc6b9':'#b8d2ce');sky.addColorStop(1,'#d7ddd0');
    ctx.fillStyle=sky;ctx.fillRect(-w*.1,-h*.2,w*1.2,horizon+h*.2+bob);
    // A remote imaginary island, separate from the near water.
    ctx.fillStyle='#264c45';ctx.beginPath();ctx.moveTo(w*.43,horizon+bob);
    ctx.bezierCurveTo(w*.51,horizon-h*.08,w*.53,horizon-h*.06,w*.57,horizon-h*.045);
    ctx.bezierCurveTo(w*.64,horizon-h*.16,w*.67,horizon-h*.09,w*.74,horizon-h*.055);
    ctx.bezierCurveTo(w*.81,horizon-h*.11,w*.86,horizon-h*.035,w*.94,horizon+bob);
    ctx.closePath();ctx.fill();
    for(let j=0;j<65;j++){
      const u=j/65, y=horizon+(h-horizon)*u*u;
      ctx.beginPath();ctx.strokeStyle=`rgba(185,234,221,${.06+u*.18})`;ctx.lineWidth=1+u*2;
      for(let x=-w*.1;x<w*1.1;x+=12){const yy=y+Math.sin(x/(32+u*60)+j*1.7-time*.8)*(2+u*10);x===-w*.1?ctx.moveTo(x,yy):ctx.lineTo(x,yy)}
      ctx.stroke();
    }
    ctx.restore();
  }
  function rays(p,time,d) {
    const waterDepth = Math.min(d,12742-d);
    const a = waterDepth<.2 ? clamp(1-waterDepth/.2) : 0;
    if(a<=0)return;
    ctx.save();ctx.globalAlpha=a*.11;
    for(let j=0;j<7;j++){
      const x=w*(.4+j*.1)+Math.sin(time*.15+j)*25;
      const g=ctx.createLinearGradient(x,0,x,h);g.addColorStop(0,'#d6f4e6');g.addColorStop(1,'#d6f4e600');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+30,0);ctx.lineTo(x+120,h);ctx.lineTo(x-210,h);ctx.fill();
    }ctx.restore();
  }
  function particles(p,time) {
    const water=p<5.65||p>13.15;
    if(!water)return;
    ctx.save();
    const bubbles = clamp(1-Math.abs(p-1)*1.4);
    for(let j=0;j<70;j++){
      const x=((j*193.7+w*.1)%w)+Math.sin(time*.5+j)*5;
      const y=((j*73.9-time*(bubbles?45:6)-p*h*.25)%h+h)%h;
      const r=bubbles?(2+(j%7)*1.5):(j%3+1)*.5;
      ctx.globalAlpha=bubbles*.55+.15;ctx.strokeStyle='#dcffff';ctx.fillStyle='#c2dee4';ctx.lineWidth=.8;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);bubbles?ctx.stroke():ctx.fill();
    }ctx.restore();
  }
  function seabed(p) {
    for(const center of [5.5,12.9]){
      const alpha=clamp(1-Math.abs(p-center)*2);if(!alpha)continue;
      ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#1c2427';
      const y=h*(.8-(p-center)*.5);
      ctx.beginPath();ctx.moveTo(0,h);
      for(let x=0;x<=w+20;x+=20)ctx.lineTo(x,y+Math.sin(x*.006)*24+Math.cos(x*.021)*9);
      ctx.lineTo(w,h);ctx.fill();ctx.restore();
    }
  }
  function coreVisual(p,time,d) {
    const here=science.position(d);
    if(here.layer!=='외핵'&&here.layer!=='내핵')return;
    const a=smooth(clamp((p-8.15)/1.15))*(1-smooth(clamp((p-10.8)/1.2)));
    if(!a)return;
    ctx.save();ctx.globalAlpha=a;
    const x=w*.67,y=h*.52,r=Math.max(w*.5,h*.7);
    const glow=ctx.createRadialGradient(x,y,0,x,y,r);
    glow.addColorStop(0,here.layer==='내핵'?'#d5b780':'#b76637');
    glow.addColorStop(.2,here.layer==='내핵'?'#8b6f44':'#783b21');
    glow.addColorStop(.6,'#251910');glow.addColorStop(1,'#000000');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    // Abstract material contours; light is editorial reconstruction, not observation.
    for(let j=0;j<26;j++){
      ctx.strokeStyle=here.layer==='내핵'?'#d9b97a17':'#d1966220';ctx.lineWidth=1+j%3;
      ctx.beginPath();
      for(let step=0;step<=150;step++){
        const angle=step/150*Math.PI*2,rad=(j+1)*r/25;
        const ripple=Math.sin(angle*5+j+time*(here.layer==='외핵'?.15:0))*rad*.04;
        const xx=x+Math.cos(angle)*(rad+ripple),yy=y+Math.sin(angle)*(rad*.85+ripple);
        step?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }ctx.closePath();ctx.stroke();
    }ctx.restore();
  }
  function render(ms) {
    frame=0;
    if(document.hidden)return;
    if(!reduced&&ms-last<32){request();return}last=ms;
    const s=state(), {i,t,p,d}=s, time=reduced?0:ms/1000;
    if(!reduced||dirty){
      ctx.clearRect(0,0,w,h);
      const ci=Math.min(14,Math.floor(p)),ct=p-ci;
      const g=ctx.createLinearGradient(0,0,0,h);
      const black=p>=5.65&&p<=13.05;
      g.addColorStop(0,black?'#000000':blend(colors[ci],colors[ci+1],smooth(ct)));
      g.addColorStop(1,black?'#000000':blend(colors[ci+1],'#000000',.45));
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      surface(p,time);surface(p,time,true);rays(p,time,d);coreVisual(p,time,d);seabed(p);particles(p,time);
      // Keep text readable while leaving the discovery side open.
      const shade=ctx.createLinearGradient(0,0,w,0);shade.addColorStop(0,'#00121b88');shade.addColorStop(.65,'#00121b10');shade.addColorStop(1,'#00121b22');if(p<5.65||p>13.05){ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);}
      const here=science.position(d);
      const ocean=d<=4||d>=12738;
      const waterDepth=here.surfaceDepthKm;
      label.textContent=ocean?'해수면 아래':'출발점에서 관통한 거리';
      const reading=ocean?`${Math.round(waterDepth*1000).toLocaleString('ko-KR')} m`:`${Math.round(d).toLocaleString('ko-KR')} km`;
      if(reading!==lastReading){
        depth.replaceChildren(document.createTextNode(reading.slice(0,reading.lastIndexOf(' ')+1)));
        const unit=document.createElement('small');unit.textContent=ocean?'m':'km';depth.append(unit);lastReading=reading;
      }
      zone.textContent=Math.abs(here.surfaceDepthKm-4)<.00001?'해저면 · 모형 경계':here.layer;
      scale.textContent='가변 축척 · 구형 근사 모형';
      document.querySelector('#material').textContent=Math.abs(here.surfaceDepthKm-4)<.00001?'해수와 해저 퇴적물의 경계':here.material;
      const nearestDepth=here.surfaceDepthKm<10?here.surfaceDepthKm.toFixed(3):Math.round(here.surfaceDepthKm).toLocaleString('ko-KR');
      document.querySelector('#distance-note').textContent='가까운 해수면 아래 '+nearestDepth+' km · '+(here.returning?'중심을 지난 방향':'중심을 향하는 방향');
      for(const animal of science.species){
        const figure=document.querySelector('#'+animal.id+' .specimen');
        const inRange=d<=4&&d*1000>=animal.depth[0]&&d*1000<=animal.depth[1];
        figure.style.opacity=inRange?'1':'0';
      }
      const disclosed=p>=9.4&&p<=11.1;
      reveal.hidden=!disclosed;
      reveal.setAttribute('aria-hidden',String(!disclosed));
      if(disclosed){const text=here.layer+' · '+here.material+' / 가까운 해수면 아래 약 '+Math.round(here.surfaceDepthKm).toLocaleString('ko-KR')+' km · 재구성';if(reveal.textContent!==text)reveal.textContent=text;}
      marker.setAttribute('cy',String(11+78*clamp(d/12742)));
      const after=scrollY+innerHeight*.4>document.querySelector('.notes').offsetTop;
      document.body.dataset.after=String(after);dirty=false;
      const animated=p<5.65||p>13.15||(p>=8.15&&p<=12&&here.layer==='외핵');
      if(!reduced&&!after&&animated)request();
    }
  }
  function request(){if(!frame)frame=requestAnimationFrame(render)}
  function setReduced(value){reduced=value;document.documentElement.dataset.reduced=String(value);motion.setAttribute('aria-pressed',String(value));motion.textContent=value?'움직임 켜기':'움직임 줄이기';dirty=true;request()}
  log.addEventListener('toggle',()=>{dirty=true;request()});
  document.querySelectorAll('.species-source,.notes details').forEach(details=>details.addEventListener('toggle',resize));
  motion.addEventListener('click',()=>setReduced(!reduced));
  preference.addEventListener('change',event=>setReduced(event.matches));
  addEventListener('scroll',()=>{dirty=true;request()},{passive:true});
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){dirty=true;request()}});
  document.fonts?.ready.then(resize);
  setReduced(reduced);resize();
})();
