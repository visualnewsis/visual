/* Actual spherical orthographic projection, rendered without WebGL textures.
 * D3 clips countries at the horizon; the same data supports a flat world map.
 */
window.NewsmapGlobe=(root,geography,onSelect)=>{
  'use strict';
  const d3=window.d3,canvas=root.querySelector('#world-canvas'),ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas unavailable');
  const wrap=root.querySelector('#world-canvas-wrap'),pins=root.querySelector('#world-pins');
  const spinButton=root.querySelector('#world-spin'),notice=root.querySelector('#world-map-notice');
  const media=matchMedia('(prefers-reduced-motion:reduce)');
  let w=0,h=0,ratio=1,projection,groups=[],selected='',flat=false,scale=1,rotation=[-115,-18,0],pan=[0,0],active=true,spinning=false,frame=0,last=0,dirty=true;
  const graticule=d3.geoGraticule10(),flatGrid=d3.geoGraticule().step([30,30])(),sphere={type:'Sphere'},elements=new Map(),pointers=new Map(),pulsed=new Map();
  let gesture=null,dragged=false,drawnPoints=[],reserved=[];
  const stars=Array.from({length:115},(_,i)=>({x:((i*73.213+17)%997)/997,y:((i*137.9+53)%991)/991,r:i%19===0?1.5:i%3===0?.9:.5,a:i%7===0?.65:.25}));
  function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);}
  function stop(){spinning=false;spinButton.setAttribute('aria-pressed','false');spinButton.setAttribute('aria-label','지구본 회전 시작');spinButton.querySelector('span').textContent='회전 시작';if(frame){cancelAnimationFrame(frame);frame=0;}last=0;}
  function request(){dirty=true;if(active&&!frame)frame=requestAnimationFrame(draw);}
  function configure(){
    const mobile=matchMedia('(max-width:700px)').matches;
    const peek=mobile?parseFloat(getComputedStyle(root.querySelector('.world-stage'),'::before').height)||210:0;
    const usable=h-peek;
    const center=mobile?[w*.5,Math.max(155,usable*.55+30)]:[w*.52,h*.54];
    const radius=mobile?Math.max(80,Math.min(w*.43,(usable-120)/2)):Math.min(w*.41,(h-170)/2,310);
    if(flat){
      const compact=mobile&&matchMedia('(max-height:620px)').matches;
      const top=mobile?(compact?84:100):130;
      const bottom=mobile?Math.max(top+65,usable-148):Math.max(180,usable-80);
      projection=d3.geoEquirectangular().fitExtent([[24,top],[w-24,bottom]],sphere);
      const size=projection.scale();projection.scale(size*scale).translate([w/2+pan[0],(top+bottom)/2+pan[1]]);
    }else projection=d3.geoOrthographic().translate(center).scale(radius*scale).rotate(rotation).clipAngle(90).precision(.5);
    return {mobile,center,radius:radius*scale,usable};
  }
  function draw(time){
    frame=0;if(!active)return;
    if(spinning){if(last)rotation[0]+=(time-last)*.0028;last=time;dirty=true;}
    if(!dirty&&!spinning)return;dirty=false;
    const {mobile,center,radius,usable}=configure();
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    if(!flat)for(const s of stars){ctx.fillStyle='rgba(180,225,235,'+s.a+')';circle(s.x*w,s.y*h,s.r);ctx.fill();}
    const path=d3.geoPath(projection,ctx);
    if(!flat){
      const halo=ctx.createRadialGradient(center[0],center[1],radius*.95,center[0],center[1],radius*1.16);
      halo.addColorStop(0,'#489db43b');halo.addColorStop(.4,'#2467871c');halo.addColorStop(1,'#24678700');ctx.fillStyle=halo;circle(...center,radius*1.16);ctx.fill();
    }
    if(flat){ctx.fillStyle='#E8F1F3';ctx.fillRect(0,0,w,h);}
    else{
      ctx.beginPath();path(sphere);
      const ocean=ctx.createLinearGradient(0,center[1]-radius,w,h);ocean.addColorStop(0,'#1b475b');ocean.addColorStop(.55,'#102e44');ocean.addColorStop(1,'#081d30');ctx.fillStyle=ocean;ctx.fill();
      ctx.strokeStyle='#467c8b88';ctx.lineWidth=.8;ctx.stroke();
    }
    const mapGroups=new Map(groups.map(g=>[g.country,g]));
    for(const f of geography.features){
      ctx.beginPath();path(f);
      const g=mapGroups.get(f.id);
      ctx.fillStyle=flat?(f.id===selected?'#A3D8CF':g?'#D8EAE5':f.id==='AQ'?'#EEF3F2':'#F9F8F4'):(f.id===selected?'#4e9585':g?(g.placeCount?'#306f71':'#244d60'):'#1b3b4f');
      ctx.fill();ctx.strokeStyle=flat?(f.id===selected?'#087B79':'#B8C9CC'):(f.id===selected?'#9ff0cc':'#4b75877a');ctx.lineWidth=f.id===selected?1.15:flat?.65:.5;ctx.stroke();
    }
    ctx.beginPath();path(flat?flatGrid:graticule);ctx.lineWidth=.5;ctx.strokeStyle=flat?'#D0E0E355':'#87b4c217';ctx.stroke();
    if(!flat){
      ctx.save();circle(...center,radius);ctx.clip();
      const shade=ctx.createRadialGradient(center[0]-radius*.35,center[1]-radius*.4,radius*.1,center[0],center[1],radius*1.1);
      shade.addColorStop(0,'#9ee6df05');shade.addColorStop(.6,'#04132008');shade.addColorStop(.9,'#010b1a55');shade.addColorStop(1,'#000512a8');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);ctx.restore();
      circle(...center,radius);ctx.strokeStyle='#6aa0b77a';ctx.lineWidth=1;ctx.stroke();
    }
    drawnPoints=[];
    const placed=reserved.map(box=>[...box]);
    const centerCoords=projection.invert(flat?[w/2,h/2]:center);
    let labels=0;
    let animatingPulse=false;
    const sorted=[...groups].sort((a,b)=>(b.country===selected)-(a.country===selected)||b.count-a.count);
    for(const g of sorted){
      const el=elements.get(g.country);if(!el)continue;
      const front=flat||d3.geoDistance(g.center,centerCoords)<Math.PI/2-.025;
      const point=projection(g.center);
      if(!front||!point||point[0]<8||point[0]>w-8||point[1]<95||point[1]>usable-55){el.hidden=true;continue;}
      const [x,y]=point;
      const pulse=pulsed.get(g.country);
      if(g.pulse&&pulse&&!media.matches){
        const elapsed=performance.now()-pulse.started;
        for(const delay of [0,1100]){
          const age=elapsed-delay;
          if(age>=0&&age<4400){
            const phase=(age%2200)/2200;
            ctx.strokeStyle=flat?'rgba(8,123,121,'+(.65*(1-phase))+')':'rgba(101,224,188,'+(.7*(1-phase))+')';
            ctx.lineWidth=1.5;circle(x,y,4+phase*18);ctx.stroke();
          }
        }
        if(elapsed<5500)animatingPulse=true;
      }
      drawnPoints.push({country:g.country,x,y});
      ctx.fillStyle=flat?(g.placeCount?'#087B79':'#E8F1F3'):(g.placeCount?'#65e0bc':'#1c4650');ctx.strokeStyle=flat?'#087B79':'#7ddabe';ctx.lineWidth=1;
      if(g.placeCount&&!flat){ctx.shadowColor='#65e0bc';ctx.shadowBlur=9;}circle(x,y,g.country===selected?5:3);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      const width=Math.min(150,g.name.length*(mobile?10:11)+45),box=[Math.min(x,w-width-10),y-22,width,44];
      const overlap=placed.some(b=>box[0]<b[0]+b[2]+6&&box[0]+box[2]+6>b[0]&&box[1]<b[1]+b[3]+4&&box[1]+box[3]+4>b[1]);
      if(overlap||labels>=(flat?(mobile?(scale>=1.5?8:4):(scale>=1.5?16:10)):(mobile?7:18))){el.hidden=true;continue;}
      placed.push(box);labels++;el.hidden=false;el.style.left=(box[0]+8)+'px';el.querySelector('i').style.left=(x-box[0]-7)+'px';el.style.top=y+'px';
    }
    if(spinning||animatingPulse){dirty=true;frame=requestAnimationFrame(draw);}
  }
  function measureReserved(){
    const rect=wrap.getBoundingClientRect();
    reserved=[...root.querySelectorAll('.world-space-heading,.world-map-switch,.world-controls,.world-map-legend,.world-map-note')].map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>[r.left-rect.left,r.top-rect.top,r.width,r.height]);
  }
  function resize(){
    const rect=wrap.getBoundingClientRect();if(!rect.width||!rect.height)return;
    w=rect.width;h=rect.height;ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);measureReserved();request();
  }
  function update(next,id,mode){
    const oldFlat=flat;groups=next;selected=id;flat=mode;if(oldFlat!==flat){scale=1;pan=[0,0];stop();}
    const keep=new Set(next.map(g=>g.country));for(const [key,el] of elements)if(!keep.has(key)){el.remove();elements.delete(key);}
    for(const g of groups){
      let el=elements.get(g.country);
      if(!el){el=document.createElement('button');el.className='world-pin';el.type='button';el.hidden=true;const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');const label=document.createElement('span');el.append(dot,label);el.addEventListener('click',()=>{stop();onSelect(g.country);});pins.append(el);elements.set(g.country,el);}
      el.querySelector('span').textContent=g.name+' '+g.count;
      el.classList.toggle('related',!g.placeCount);
      el.classList.remove('new-pulse');
      const pulseKey=g.pulseKey||g.country;
      if(g.pulse&&pulsed.get(g.country)?.key!==pulseKey)pulsed.set(g.country,{key:pulseKey,started:performance.now()});
      el.setAttribute('aria-label',g.name+' 기사 '+g.count+'건'+(g.placeCount?' · 기사 속 장소 '+g.placeCount+'건':' · 관련 국가'));
      el.setAttribute('aria-pressed',String(g.country===selected));
    }
    canvas.setAttribute('aria-label',flat?'세계 뉴스 평면지도. 방향키로 이동하고 더하기 빼기로 확대합니다.':'세계 뉴스 지구본. 드래그 또는 방향키로 회전하고 더하기 빼기로 확대합니다. 나라 선택과 기사 목록으로도 탐색할 수 있습니다.');
    measureReserved();request();
  }
  function clampScale(value){return Math.max(flat?1:.8,Math.min(flat?(matchMedia('(max-width:700px)').matches?6:4):3,value));}
  function zoom(factor){stop();scale=clampScale(scale*factor);request();}
  function home(){stop();rotation=[-115,-18,0];scale=1;pan=[0,0];request();}
  function focus(coords){stop();if(flat){configure();const point=projection(coords),targetY=projection.translate()[1]-pan[1];pan=[pan[0]+w/2-point[0],pan[1]+targetY-point[1]];}else rotation=[-coords[0],-coords[1],0];request();}
  function setActive(value){active=value;if(!value)stop();else resize();}
  function spin(){if(media.matches||flat)return;if(spinning)stop();else{spinning=true;spinButton.setAttribute('aria-pressed','true');spinButton.setAttribute('aria-label','지구본 회전 정지');spinButton.querySelector('span').textContent='회전 정지';last=0;request();}}
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001));},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1/1.2:1.2);return;}
    if(e.key==='Home'){e.preventDefault();home();return;}
    const steps={ArrowLeft:[12,0],ArrowRight:[-12,0],ArrowUp:[0,-10],ArrowDown:[0,10]};
    if(!steps[e.key])return;e.preventDefault();stop();const [dx,dy]=steps[e.key];if(flat){pan[0]+=dx*3;pan[1]-=dy*3;}else{rotation[0]+=dx;rotation[1]=Math.max(-85,Math.min(85,rotation[1]+dy));}request();
  });
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;stop();pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);
    const points=[...pointers.values()];gesture={points:points.map(p=>[...p]),rotation:[...rotation],pan:[...pan],scale,start:[e.clientX,e.clientY],id:e.pointerId};if(points.length===1)dragged=false;else dragged=true;
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,[e.clientX,e.clientY]);const points=[...pointers.values()];
    if(points.length===2&&gesture.points.length===2){const distance=p=>Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);scale=clampScale(gesture.scale*distance(points)/Math.max(1,distance(gesture.points)));dragged=true;}
    else if(points.length===1&&gesture.points.length===1){const dx=e.clientX-gesture.points[0][0],dy=e.clientY-gesture.points[0][1];if(Math.hypot(dx,dy)>6)dragged=true;if(flat)pan=[gesture.pan[0]+dx,gesture.pan[1]+dy];else rotation=[gesture.rotation[0]+dx*.3,Math.max(-85,Math.min(85,gesture.rotation[1]-dy*.3)),0];}
    request();
  });
  function release(e){
    if(!pointers.has(e.pointerId))return;
    if(e.type==='pointerup'&&!dragged&&pointers.size===1&&projection){
      const rect=canvas.getBoundingClientRect(),point=[e.clientX-rect.left,e.clientY-rect.top];
      const near=window.NewsmapWorldRules.nearestCountry(drawnPoints,point,matchMedia('(max-width:700px)').matches?22:12);
      if(near)onSelect(near);
      else{
        const coords=projection.invert(point),projected=coords&&projection(coords);
        if(coords&&projected&&Math.hypot(projected[0]-point[0],projected[1]-point[1])<3){const f=geography.features.find(f=>d3.geoContains(f,coords));if(f)onSelect(f.id);}
      }
    }
    pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(pointers.size){const points=[...pointers.values()];gesture={points:points.map(p=>[...p]),rotation:[...rotation],pan:[...pan],scale};dragged=true;}else gesture=null;
  }
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',e=>pointers.delete(e.pointerId));
  media.addEventListener('change',()=>{stop();request();});
  new ResizeObserver(resize).observe(wrap);resize();
  return {update,zoom,home,focus,resize,setActive,spin,stop};
};
