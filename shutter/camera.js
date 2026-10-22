/* Camera study: independent procedural geometry. No external renderer or model. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fStops = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
  const denominators = [30, 125, 250, 500, 1000, 2000, 4000, 8000];
  const C = { ink: '#27332c', mint: '#36586b', orange: '#d5804e', blue: '#7382ba', gold: '#b49855', grid: '#dce1d3' };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function surface(id, draw, options = {}) {
    const canvas = $(id), ctx = canvas.getContext('2d');
    const api = { canvas, ctx, w: 0, h: 0, visible: true, draw: () => draw(api) };
    function size() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      api.w = rect.width; api.h = rect.height;
      canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      api.draw();
    }
    new ResizeObserver(size).observe(canvas);
    new IntersectionObserver(entries => { api.visible = entries[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    if (options.click) canvas.addEventListener('click', e => options.click(e, api));
    return api;
  }
  function line(ctx, pts, color, width = 1, dash = []) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  }
  function poly(ctx, pts, fill, stroke) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .65; ctx.stroke(); }
  }
  function circle(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(.01, r), 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function text(ctx, str, x, y, color = '#68745f', size = 10, align = 'left') {
    ctx.font = `${size}px "IBM Plex Mono", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(str, x, y);
  }
  function grid(ctx, w, h, step = 35) {
    for (let x = 0; x < w; x += step) line(ctx, [[x, 0], [x, h]], '#b7a57d28');
    for (let y = 0; y < h; y += step) line(ctx, [[0, y], [w, y]], '#b7a57d28');
  }
  function bind(id, fn) { $(id).addEventListener('input', fn); }

  // Generalized camera, with depth-sorted faces projected from 3D coordinates.
  const model = { yaw: -.48, pitch: -.22, explode: .38, part: 'all', rays: false };
  const parts = {
    all: ['빛이 지나가는 순서', '렌즈는 빛을 모으고, 조리개는 빛의 통로를 조절합니다. 셔터가 시간을 나누면, 센서가 그동안 도착한 빛을 기록합니다.'],
    lens: ['관찰 부품 · 렌즈', '앞뒤의 유리 사이에서 빛이 굴절합니다. 이 모형의 유리 배열은 구조 설명용입니다. 아래 광학 실험에서는 물체와 센서의 거리를 바꿔 초점을 맞출 수 있습니다.'],
    iris: ['관찰 부품 · 조리개', '노란색 부품은 조리개입니다. 겹쳐진 날이 빛의 통로를 좁힙니다. 카메라 안에서는 작지만 빛의 양과 심도에 큰 영향을 줍니다.'],
    shutter: ['관찰 부품 · 셔터', '주황색 테두리의 장치가 센서 앞의 셔터입니다. 선막과 후막이 지나가는 시간 차이로 노출시간을 정합니다. 아래에서 막을 아주 느리게 움직여 볼 수 있습니다.'],
    sensor: ['관찰 부품 · 센서', '보라색 면이 빛을 기록하는 센서입니다. 이 모형은 36 × 24 mm를 기준으로 합니다. 앞의 광학계가 만든 상이 이 면에 맺힙니다.']
  };
  const cam = surface('camera', a => {
    const { ctx, w, h } = a; if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const E = model.explode;
    const scale = Math.min(w / (360 + 160 * E), h / 225);
    const ox = w * .52, oy = h * .53;
    const faces = [];
    function transform(p) {
      const [x, y, z] = p, cy = Math.cos(model.yaw), sy = Math.sin(model.yaw);
      const cp = Math.cos(model.pitch), sp = Math.sin(model.pitch);
      const xx = x * cy + z * sy, zz = -x * sy + z * cy;
      return [xx, y * cp - zz * sp, y * sp + zz * cp];
    }
    function project(p) { const [x, y, z] = transform(p); const d = 650 / (650 - z); return [ox + x * scale * d, oy + y * scale * d]; }
    function face(points, color, edge, part = 'body') {
      const faded = model.part !== 'all' && model.part !== part;
      faces.push({ points, color, edge: model.part !== 'all' && model.part === part ? '#2f6bff' : edge, depth: points.reduce((s, p) => s + transform(p)[2], 0) / points.length, alpha: faded ? .18 : 1 });
    }
    function box(x, y, z, sx, sy, sz, color, part = 'body', edge = '#667363') {
      const p = [[x,y,z],[x+sx,y,z],[x+sx,y+sy,z],[x,y+sy,z],[x,y,z+sz],[x+sx,y,z+sz],[x+sx,y+sy,z+sz],[x,y+sy,z+sz]];
      [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].forEach((f,i) => face(f.map(n => p[n]), i === 2 ? '#62695e' : color, edge, part));
    }
    function ring(z, outer, inner, thickness, part, fill) {
      const n = 64;
      for (let i=0; i<n; i++) {
        const t=i/n*TAU, u=(i+1)/n*TAU;
        const p=(r,t,zz)=>[-12+r*Math.cos(t),r*Math.sin(t),zz];
        const shade = Math.round(55 + 25 * (.5 + .5 * Math.cos(t - 1)));
        face([p(outer,t,z),p(outer,u,z),p(outer,u,z+thickness),p(outer,t,z+thickness)], `rgb(${shade},${shade+6},${shade+1})`, null, part);
        face([p(inner,t,z),p(inner,u,z),p(inner,u,z+thickness),p(inner,t,z+thickness)], '#172821', null, part);
        face([p(outer,t,z+thickness),p(outer,u,z+thickness),p(inner,u,z+thickness),p(inner,t,z+thickness)], fill || '#717c68', '#84907955', part);
      }
    }
    function disk(z, r, fill, part) { face(Array.from({length:64},(_,i)=>[-12+r*Math.cos(i/64*TAU),r*Math.sin(i/64*TAU),z]),fill,'#86bbaa99',part); }
    // Housing is shown as separate panels so the optical path remains visible.
    box(-76,-44,-25-30*E,143,84,6,'#3e493e');
    box(-76,35,-20,143,6,54,'#414c40');
    box(43,-43,-17,25,78,47,'#303d33');
    box(-77,-42,-17,11,76,47,'#56614e');
    box(-75,-47-25*E,-20,140,8,49,'#737c69');
    box(-30,-61-25*E,-13,48,14,35,'#57644f');
    box(47,-51-25*E,4,11,4,10,'#9ca88a');
    // Rear electronics, sensor support, and sensor grid.
    box(-38,-24,-39-94*E,52,48,3,'#486b53','sensor','#8a9c72');
    box(-32,-16,-35-94*E,40,32,2,'#c0b07e','sensor');
    box(-30,-12,-32-94*E,36,24,1,'#727caf','sensor','#adb8d8');
    for (let row=0;row<12;row++) for(let col=0;col<18;col++) {
      const x=-30+col*2, y=-12+row*2, z=-30.8-94*E;
      face([[x,y,z],[x+1.8,y,z],[x+1.8,y+1.8,z],[x,y+1.8,z]],(row+col)%2?'#717ba5':'#8c9abb',null,'sensor');
    }
    // Shutter frame: two blade packs around a partly exposed gate.
    const sz=-6-31*E;
    box(-39,-27,sz,54,5,3,'#ba815b','shutter'); box(-39,22,sz,54,5,3,'#ba815b','shutter');
    box(-39,-24,sz,5,49,3,'#aa754f','shutter'); box(10,-24,sz,5,49,3,'#aa754f','shutter');
    for(let i=0;i<5;i++) box(-33,-22+i*3,sz+4,42,2.9,1,'#4a4942','shutter','#857e6c');
    for(let i=0;i<4;i++) box(-33,12+i*2.5,sz+5,42,2.4,1,'#3d4139','shutter','#857e6c');
    ring(29,38,30,5,'lens','#a0a68e');
    ring(37+E*12,34,29,13,'lens','#4e6252');
    disk(51+E*26,28,'#6fbaad55','lens');
    ring(54+E*45,33,25,8,'lens','#688771');
    disk(64+E*59,25,'#7ca7b355','lens');
    const iz=73+E*85;
    ring(iz,32,22,3,'iris','#c1ae75');
    for(let i=0;i<9;i++) {
      const p1=i/9*TAU, p2=(i+1)/9*TAU, twist=.42;
      face([[-12+29*Math.cos(p1),29*Math.sin(p1),iz+3],[-12+29*Math.cos(p2),29*Math.sin(p2),iz+3],[-12+9*Math.cos(p2+twist),9*Math.sin(p2+twist),iz+3],[-12+9*Math.cos(p1+twist),9*Math.sin(p1+twist),iz+3]],i%2?'#9d956d':'#b8ab7d','#d1c795','iris');
    }
    ring(84+E*115,35,27,12,'lens','#4e6554');
    for(let i=0;i<7;i++) ring(85+i*1.6+E*115,35.4,34.2,.65,'lens','#89937f');
    disk(100+E*139,26,'#598b9355','lens');
    ring(101+E*140,36,27,5,'lens','#919d84');
    faces.sort((a,b)=>a.depth-b.depth);
    // Ground shadow in screen space.
    ctx.save(); ctx.translate(w*.52,h*.82); ctx.scale(1,.15);
    const sh=ctx.createRadialGradient(0,0,0,0,0,w*.3);sh.addColorStop(0,'#5b665339');sh.addColorStop(1,'#5b665300');
    circle(ctx,0,0,w*.3,sh);ctx.restore();
    faces.forEach(f=>{ctx.globalAlpha=f.alpha;poly(ctx,f.points.map(project),f.color,f.edge);});ctx.globalAlpha=1;
    if(model.rays) {
      [-10,0,10].forEach(y=>line(ctx,[[...project([-12,y,140+E*170])],[...project([-12,y*.8,55+E*40])],[...project([-12,0,-30-94*E])]],'#e9b25bc0',1.4));
    }
    // Screen-space component labels, anchored to projected geometry.
    if(E>.18) {
      const labels=[['SENSOR',[-12,12,-31-94*E],C.blue,.83,.83],['SHUTTER',[-12,-21,sz],C.orange,.81,.16],['APERTURE',[-12,20,iz],C.gold,.84,.64],['LENS',[-12,-27,105+E*140],C.mint,.18,.17]];
      labels.forEach(([name,p,col,ax,ay])=>{
        if(model.part!=='all' && !name.toLowerCase().includes(model.part==='iris'?'aperture':model.part)) return;
        const q=project(p), mobile=w<600;
        const yy=h*ay;
        const xx=clamp(w*ax,mobile?30:50,w-(mobile?30:50));
        const labelColor = model.part === 'all' ? col : '#2f6bff';
        line(ctx,[q,[q[0],yy],[xx,yy]],labelColor,.7);circle(ctx,q[0],q[1],2.2,labelColor);
        text(ctx,name,xx,yy-7,labelColor,mobile?7:9,'center');
      });
    }
  });
  bind('explode',()=>{model.explode=+$('explode').value/100;cam.draw();});
  $('light-path').onclick=()=>{model.rays=!model.rays;$('light-path').setAttribute('aria-pressed',String(model.rays));cam.draw();};
  $('reset-view').onclick=()=>{model.yaw=-.48;model.pitch=-.22;cam.draw();};
  document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{
    model.part=b.dataset.part;document.querySelectorAll('[data-part]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    $('part-number').textContent=parts[model.part][0];$('part-copy').textContent=parts[model.part][1];
    if(model.part!=='all' && model.explode<.55){model.explode=.7;$('explode').value=70;}cam.draw();
  });
  let drag=null;
  cam.canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:model.yaw,pitch:model.pitch};cam.canvas.setPointerCapture(e.pointerId);cam.canvas.classList.add('dragging');});
  cam.canvas.addEventListener('pointermove',e=>{if(!drag)return;model.yaw=drag.yaw+(e.clientX-drag.x)*.009;model.pitch=clamp(drag.pitch+(e.clientY-drag.y)*.006,-1.1,1.1);cam.draw();});
  const endDrag=()=>{drag=null;cam.canvas.classList.remove('dragging');};
  ['pointerup','pointercancel','lostpointercapture'].forEach(evt=>cam.canvas.addEventListener(evt,endDrag));
  cam.canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();model.yaw+=(e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0);model.pitch=clamp(model.pitch+(e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0),-1.1,1.1);cam.draw();});

  // Thin-lens ray diagram: mm coordinates are mapped uniformly.
  const optics=surface('lens-canvas',({ctx,w,h})=>{
    if(!w)return;ctx.clearRect(0,0,w,h);grid(ctx,w,h);
    const u=+$('object-distance').value, v=+$('sensor-distance').value, f=60, image=f*u/(u-f), objectHeight=38;
    const k=Math.min((w-75)/760,(h-80)/135), lx=35+600*k, y=h*.44, top=y-objectHeight*k;
    line(ctx,[[18,y],[w-18,y]],'#98a58d',1,[4,4]);
    // Object arrow, optical element, real sensor plane.
    const objx=lx-u*k;
    line(ctx,[[objx,y],[objx,top]],C.ink,3);poly(ctx,[[objx,top-6],[objx-4,top+3],[objx+4,top+3]],C.ink);
    ctx.beginPath();ctx.ellipse(lx,y,8*k,56*k,0,0,TAU);ctx.fillStyle='#76b7aa44';ctx.fill();ctx.strokeStyle=C.mint;ctx.lineWidth=1.2;ctx.stroke();
    const sx=lx+v*k, imageX=lx+image*k, imageY=y+objectHeight*image/u*k;
    for(const yy of [-35,0,35]) {
      const hy=y+yy*k;
      const endY=hy+(imageY-hy)*(v/image);
      line(ctx,[[objx,top],[lx,hy],[sx,endY]],yy===0?C.orange:'#008e7980',1.5);
      circle(ctx,sx,endY,2,C.orange);
    }
    line(ctx,[[sx,y-60*k],[sx,y+60*k]],C.blue,4);
    line(ctx,[[imageX,y],[imageX,imageY]],C.orange,2,[3,3]);
    circle(ctx,lx+f*k,y,2.5,C.mint);text(ctx,'F',lx+f*k,y+17,C.mint,9,'center');
    text(ctx,'물체',objx,h-31,C.ink,10,'center');text(ctx,'렌즈',lx,h-31,C.mint,10,'center');
    text(ctx,'센서',sx,h-14,C.blue,10,'center');
    const blur=Math.abs((y-35*k+(imageY-(y-35*k))*(v/image))-(y+35*k+(imageY-(y+35*k))*(v/image)));
    if(blur>1) {ctx.fillStyle='#d5804e33';ctx.fillRect(sx-6,y+objectHeight*v/u*k-blur*.5,12,blur);}
    $('object-out').textContent=`${u} mm`;$('sensor-out').textContent=`${v.toFixed(1)} mm`;
    const delta=Math.abs(v-image);
    $('focus-status').textContent=delta<.4?`초점 일치 · 상 거리 ${image.toFixed(1)} mm`:`센서와 초점면의 차이 ${delta.toFixed(1)} mm`;
  });
  ['object-distance','sensor-distance'].forEach(id=>bind(id,optics.draw));
  $('autofocus').onclick=()=>{const u=+$('object-distance').value;$('sensor-distance').value=(60*u/(u-60)).toFixed(1);optics.draw();};

  // Nine blades: aperture polygon changes continuously with the f-number.
  const iris=surface('iris-canvas',({ctx,w,h})=>{
    if(!w)return;ctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,R=Math.min(w,h)*.41;
    const f=fStops[+$('aperture-input').value],r=R*.74*1.4/f;
    const g=ctx.createRadialGradient(cx-R*.2,cy-R*.3,0,cx,cy,R);g.addColorStop(0,'#89927b');g.addColorStop(.7,'#46513f');g.addColorStop(.88,'#27372d');g.addColorStop(1,'#9ba38c');
    circle(ctx,cx,cy,R,g,'#77816a');circle(ctx,cx,cy,R*.89,'#18291f','#a3ad92');
    const twist=.3+(1-1.4/f)*.45;
    for(let i=0;i<9;i++){
      const t=i/9*TAU,u=(i+1)/9*TAU;
      const pts=[[cx+R*.87*Math.cos(t),cy+R*.87*Math.sin(t)],[cx+R*.87*Math.cos(u),cy+R*.87*Math.sin(u)],[cx+r*Math.cos(u+twist),cy+r*Math.sin(u+twist)],[cx+r*Math.cos(t+twist),cy+r*Math.sin(t+twist)]];
      const shade=ctx.createLinearGradient(pts[0][0],pts[0][1],cx,cy);shade.addColorStop(0,i%2?'#737967':'#858a75');shade.addColorStop(1,'#3b493b');poly(ctx,pts,shade,'#a6ab8c');
      circle(ctx,cx+R*.78*Math.cos(t+.2),cy+R*.78*Math.sin(t+.2),R*.018,'#bdc1a5','#303c2d');
    }
    const hole=Array.from({length:9},(_,i)=>[cx+r*Math.cos(i/9*TAU+twist),cy+r*Math.sin(i/9*TAU+twist)]);poly(ctx,hole,'#b7dec5','#9ad3b6');
    for(let i=0;i<3;i++)circle(ctx,cx+R*.94*Math.cos(i/3*TAU+.3),cy+R*.94*Math.sin(i/3*TAU+.3),R*.025,'#b8bda3','#4a5441');
    const amount=(1.4/f)**2;
    $('f-big').textContent=`f/${f}`;$('aperture-out').textContent=`f/${f}`;$('light-meter').style.width=`${amount*100}%`;
    $('light-out').textContent=`${(amount*100).toFixed(amount<.02?2:1)}%`;$('diameter-out').textContent=(50/f).toFixed(1);
  });
  bind('aperture-input',iris.draw);

  // Shutter: both edges move in the same direction at the same speed.
  // T is the exposure at each row, travel is 4 ms, y is row fraction.
  // First edge crosses row y at travel*y; second at T+travel*y.
  function shutterState() {
    const den=denominators[+$('speed-input').value], T=1000/den,travel=4,total=T+travel;
    const t=+$('phase-input').value/1000*total;
    return {den,T,travel,total,t,first:clamp(t/travel,0,1),second:clamp((t-T)/travel,0,1)};
  }
  const shutter=surface('shutter-canvas',({ctx,w,h})=>{
    if(!w)return;ctx.clearRect(0,0,w,h);
    const s=shutterState(), mobile=w<600;
    const x=w*.1,y=h*.14,sw=w*.49,sh=h*.66;
    ctx.fillStyle='#dce3d3';ctx.fillRect(x-11,y-11,sw+22,sh+22);
    ctx.fillStyle='#7f8bb8';ctx.fillRect(x,y,sw,sh);
    const rows=50;
    for(let i=0;i<rows;i++){
      const arrival=s.travel*(i+.5)/rows;
      const exposure=clamp(s.t-arrival,0,s.T)/s.T;
      ctx.fillStyle=`rgba(179,221,198,${exposure*.8})`;ctx.fillRect(x,y+i/rows*sh,sw,sh/rows+.3);
    }
    const flashTime=s.travel; // Pulse at the instant the first edge reaches bottom.
    if($('flash-input').checked && s.t>=flashTime){
      const lower=clamp((flashTime-s.T)/s.travel,0,1);
      ctx.fillStyle='#fff5b9';ctx.fillRect(x,y+lower*sh,sw,sh*(1-lower));
    }
    // Physical shutter curtains, clipped to the sensor gate.
    ctx.save();ctx.beginPath();ctx.rect(x,y,sw,sh);ctx.clip();
    const firstY=y+sh*s.first,secondY=y+sh*s.second;
    ctx.fillStyle='#3c463d';ctx.fillRect(x,firstY,sw,sh);
    for(let i=0;i<6;i++)line(ctx,[[x,firstY+i*sh/6],[x+sw,firstY+i*sh/6]],'#7b8672',1);
    ctx.fillStyle='#766c53';ctx.fillRect(x,y-sh+sh*s.second,sw,sh);
    for(let i=0;i<6;i++)line(ctx,[[x,secondY-i*sh/6],[x+sw,secondY-i*sh/6]],'#aba084',1);
    ctx.restore();
    if(s.first<1)line(ctx,[[x,firstY],[x+sw,firstY]],C.mint,2);
    if(s.second>0)line(ctx,[[x,secondY],[x+sw,secondY]],C.orange,2);
    text(ctx,'선막 ↓',x,y-18,C.mint,mobile?9:11);text(ctx,'후막 ↓',x+sw,y-18,C.orange,mobile?9:11,'right');
    text(ctx,'센서 36 × 24 mm',x+sw/2,y+sh+25,C.blue,mobile?9:10,'center');
    const bx=w*.69,by=y,bw=w*.17;
    for(let i=0;i<rows;i++){
      const exposure=clamp(s.t-s.travel*(i+.5)/rows,0,s.T)/s.T;
      ctx.fillStyle='#e0e5d7';ctx.fillRect(bx,by+i/rows*sh,bw,sh/rows+.2);
      ctx.fillStyle='#36586b';ctx.fillRect(bx,by+i/rows*sh,bw*exposure,sh/rows-.2);
    }
    text(ctx,'누적 노출',bx+bw/2,y-18,C.mint,mobile?9:11,'center');
    text(ctx,'0',bx,y+sh+25,C.mint,9,'center');text(ctx,'100%',bx+bw,y+sh+25,C.mint,9,'center');
    $('speed-out').textContent=`1/${s.den} s`;
    $('phase-out').textContent=s.t===0?'준비':`${s.t.toFixed(2)} ms`;
      const narrow=s.T<s.travel;
    $('shutter-readout').textContent=`각 지점 노출 ${s.T.toFixed(3)} ms · 막 통과시간 4 ms · ${narrow?`고속 노출: 센서 높이의 ${(s.T/s.travel*100).toFixed(1)}%인 틈이 이동합니다.`:'선막이 끝까지 내려간 뒤 후막이 출발합니다. 전체 센서가 함께 열리는 구간이 있습니다.'}${$('flash-input').checked?' 순간 발광은 선막이 아래에 도착하는 4 ms 시점으로 가정합니다. 고속에서는 일부 행에만 빛이 닿습니다.':''}`;
  });
  let shutterAnimation=0;
  function stopShutter(){cancelAnimationFrame(shutterAnimation);shutterAnimation=0;$('shutter-play').textContent='▶ 느리게 촬영하기';$('shutter-play').setAttribute('aria-pressed','false');}
  ['speed-input','phase-input','flash-input'].forEach(id=>bind(id,()=>{stopShutter();shutter.draw();}));
  $('shutter-reset').onclick=()=>{stopShutter();$('phase-input').value=0;shutter.draw();};
  $('shutter-play').onclick=()=>{
    if(shutterAnimation){stopShutter();return;}
    let start=null;const from=+$('phase-input').value>=999?0:+$('phase-input').value;
    $('shutter-play').textContent='Ⅱ 일시정지';$('shutter-play').setAttribute('aria-pressed','true');
    function tick(now){if(start===null)start=now;const val=clamp(from+(now-start)/4,0,1000);$('phase-input').value=val;shutter.draw();if(val<1000)shutterAnimation=requestAnimationFrame(tick);else stopShutter();}
    shutterAnimation=requestAnimationFrame(tick);
  };

  const rolling=surface('rolling-canvas',({ctx,w,h})=>{
    if(!w)return;ctx.clearRect(0,0,w,h);const speed=+$('motion-input').value, read=+$('readout-input').value;
    const gap=w*.07,pw=(w-gap*3)/2,ph=h*.6,top=h*.15;
    [0,1].forEach(i=>{
      const left=gap+i*(pw+gap);ctx.fillStyle='#dfe7d8';ctx.fillRect(left,top,pw,ph);
      for(let n=0;n<7;n++)line(ctx,[[left,top+n/6*ph],[left+pw,top+n/6*ph]],'#c5cfba',1);
      const dx=i?0:speed*read/40*pw*.38;
      const x=left+pw*.37,bar=pw*.07;
      poly(ctx,[[x-dx/2,top],[x+bar-dx/2,top],[x+bar+dx/2,top+ph],[x+dx/2,top+ph]],i?C.ink:C.mint);
      text(ctx,i?'GLOBAL / 동시 노출':'ROLLING / 순차 노출',left+pw/2,top+ph+29,i?C.ink:C.mint,w<600?8:10,'center');
      if(!i){text(ctx,'먼저',left+8,top+17,C.mint,8);text(ctx,'나중',left+8,top+ph-9,C.mint,8);}
    });
    $('motion-out').textContent=`${speed.toFixed(1)}×`;$('readout-out').textContent=`${read} ms`;
  });
  ['motion-input','readout-input'].forEach(id=>bind(id,rolling.draw));

  // Bayer sample and actual local interpolation (not a prepainted color image).
  const NX=36,NY=24;
  const channelAt=(x,y)=>y%2===0?(x%2===0?0:1):(x%2===0?1:2);
  const sceneColor=(x,y)=>{
    const xx=x/NX,yy=y/NY;
    if((xx-.32)**2+(yy-.48)**2<.11**2)return [233,115,65];
    if(yy>.69)return [74+Math.round(xx*60),112+Math.round(xx*40),75];
    if(xx>.57&&xx<.77&&yy>.28&&yy<.69)return [69,120,162];
    return [Math.round(175+yy*40),Math.round(199+yy*25),Math.round(171+yy*30)];
  };
  const raw=Array.from({length:NY},(_,y)=>Array.from({length:NX},(_,x)=>sceneColor(x,y)[channelAt(x,y)]));
  function develop(x,y){return [0,1,2].map(c=>{
    if(channelAt(x,y)===c)return raw[y][x];let sum=0,weight=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=NX||yy<0||yy>=NY||channelAt(xx,yy)!==c)continue;
      const k=dx&&dy?.707:1;sum+=raw[yy][xx]*k;weight+=k;
    }return weight?Math.round(sum/weight):0;
  });}
  let sensorMode='raw',selectedPixel=null,sensorRect=null;
  function selectPixel(x,y){
    selectedPixel=[x,y];
    $('pixel-reading').textContent=`화소 (${x+1}, ${y+1}) · ${['R / 빨강','G / 초록','B / 파랑'][channelAt(x,y)]} 측정 ${raw[y][x]} / 255 · 복원 RGB (${develop(x,y).join(', ')})`;
    sensor.draw();
  }
  const sensor=surface('sensor-canvas',({ctx,w,h})=>{
    if(!w)return;ctx.clearRect(0,0,w,h);const step=Math.min((w-75)/NX,(h-55)/NY),gw=NX*step,gh=NY*step,left=(w-gw)/2,top=(h-gh)/2;
    sensorRect={left,top,step};
    for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
      let rgb;
      if(sensorMode==='scene')rgb=sceneColor(x,y);
      else if(sensorMode==='develop')rgb=develop(x,y);
      else {rgb=[0,0,0];rgb[channelAt(x,y)]=raw[y][x];}
      ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fillRect(left+x*step,top+y*step,step-.6,step-.6);
    }
    if(selectedPixel){const [x,y]=selectedPixel;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(left+x*step-1,top+y*step-1,step+1,step+1);}
    text(ctx,sensorMode==='raw'?'RGGB / RAW SAMPLES':sensorMode==='scene'?'INCIDENT COLOR':'INTERPOLATED RGB',w/2,h-7,C.mint,9,'center');
  },{click:(e,a)=>{
    if(!sensorRect)return;const rect=a.canvas.getBoundingClientRect(),{left,top,step}=sensorRect;
    const x=Math.floor((e.clientX-rect.left-left)/step),y=Math.floor((e.clientY-rect.top-top)/step);if(x<0||x>=NX||y<0||y>=NY)return;
    selectPixel(x,y);
  }});
  sensor.canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const [x,y]=selectedPixel||[Math.floor(NX/2),Math.floor(NY/2)];
    selectPixel(clamp(x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0),0,NX-1),clamp(y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0),0,NY-1));
  });
  document.querySelectorAll('[data-sensor]').forEach(b=>b.onclick=()=>{
    sensorMode=b.dataset.sensor;document.querySelectorAll('[data-sensor]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    $('sensor-caption').textContent={scene:'필터에 도달하기 전의 색 장면입니다. 같은 장면을 필터별 측정 단계와 비교해 보세요.',raw:'초록 화소가 절반, 빨강·파랑이 각각 ¼입니다. 화소를 누르거나 방향키로 이동해 측정한 채널을 볼 수 있습니다.',develop:'각 화소에서 직접 측정하지 않은 채널을 주변 측정값으로 보간했습니다. 색 경계에서 원래 장면과 차이가 생깁니다.'}[sensorMode];sensor.draw();
  });

  // Exposure workbench: a procedural city scene with integrated moving subject.
  function exposureState(){
    const f=fStops[+$('exp-f').value],den=denominators[+$('exp-t').value],iso=100*2**(+$('exp-iso').value);
    return {f,den,iso,ev:Math.log2((4/f)**2*(250/den)*(iso/100))};
  }
  function city(ctx,w,h,settings){
    ctx.fillStyle='#bfcebb';ctx.fillRect(0,0,w,h);
    const blur=clamp((1/settings.f-1/16)*14,0,9);
    // Far plane: blur from aperture is conceptual, at fixed focal length/focus.
    ctx.save();ctx.filter=`blur(${blur}px)`;
    for(let i=0;i<12;i++){
      const x=i*w/10-w*.1,bw=w*.075,bh=h*(.2+.25*(Math.sin(i*3.1)*.5+.5));
      ctx.fillStyle=i%2?'#758a79':'#8e9e87';ctx.fillRect(x,h*.64-bh,bw,bh);
      for(let row=0;row<6;row++)for(let col=0;col<3;col++){
        ctx.fillStyle='#c7d0b180';ctx.fillRect(x+bw*.15+col*bw*.26,h*.64-bh+row*bh/7+8,bw*.1,bh*.05);
      }
    }
    for(let i=0;i<6;i++){const x=i*w*.23;ctx.fillStyle='#6e876f';ctx.fillRect(x,h*.38,3,h*.27);circle(ctx,x,h*.37,h*.09,'#72917c');circle(ctx,x+h*.04,h*.33,h*.065,'#7d9982');}
    ctx.restore();
    ctx.fillStyle='#aeb7a0';ctx.fillRect(0,h*.64,w,h*.36);ctx.fillStyle='#7d897c';ctx.fillRect(0,h*.76,w,h*.24);
    line(ctx,[[0,h*.7],[w,h*.7]],'#d8ddc5',3);line(ctx,[[0,h*.9],[w,h*.9]],'#d0d3b3',2,[w*.08,w*.06]);
    function cyclist(x,alpha){
      ctx.save();ctx.globalAlpha=alpha;const y=h*.76,r=h*.075;
      [x-r*1.3,x+r*1.3].forEach(xx=>{circle(ctx,xx,y,r,null,'#253c32');circle(ctx,xx,y,r*.84,null,'#bbc8ac');for(let i=0;i<8;i++){const t=i/8*TAU;line(ctx,[[xx,y],[xx+r*Math.cos(t),y+r*Math.sin(t)]],'#4d6555',.6);}});
      line(ctx,[[x-r*1.3,y],[x-r*.3,y-r*1.3],[x+r*.6,y],[x-r*1.3,y],[x-r*.3,y-r*1.3],[x+r*.8,y-r*1.3],[x+r*1.3,y],[x+r*.6,y]],'#d18451',2.5);
      line(ctx,[[x-r*.3,y-r*1.3],[x-r*.6,y-r*1.8]],'#334e3e',3);line(ctx,[[x+r*.8,y-r*1.3],[x+r*.8,y-r*1.7],[x+r*.45,y-r*1.7]],'#334e3e',2);
      line(ctx,[[x-r*.6,y-r*1.8],[x-r*.1,y-r*3.1],[x+r*.5,y-r*2.5],[x+r*.8,y-r*1.7]],'#253c32',h*.027);
      line(ctx,[[x-r*.6,y-r*1.8],[x+r*.2,y-r*.9],[x-r*.1,y]],'#253c32',h*.023);
      circle(ctx,x+r*.2,y-r*3.55,r*.38,'#d3b28b');poly(ctx,[[x-r*.2,y-r*3.7],[x+r*.4,y-r*3.95],[x+r*.68,y-r*3.55],[x-r*.2,y-r*3.5]],'#e3aa61');ctx.restore();
    }
    // Finite integration samples model the trail over the selected exposure.
    const trail=clamp(w*.7/settings.den,0,w*.3),samples=trail<3?1:Math.min(40,Math.ceil(trail*1.2));
    for(let i=0;i<samples;i++)cyclist(w*.51-trail*.5+trail*(i+.5)/samples,1/samples);
    const brightness=2**settings.ev;
    if(brightness<1){ctx.fillStyle=`rgba(8,17,13,${1-brightness})`;ctx.fillRect(0,0,w,h);}
    else {ctx.fillStyle=`rgba(255,255,239,${clamp(1-1/brightness,0,.98)})`;ctx.fillRect(0,0,w,h);}
    // Deterministic illustrative output texture, not a sensor noise simulation.
    const noise=Math.max(0,Math.log2(settings.iso/100))*.012;
    if(noise>0){for(let i=0;i<1800;i++){const x=(Math.sin(i*127.1)*43758.5453)%1,y=(Math.sin(i*311.7)*16341.321)%1;ctx.fillStyle=i%2?`rgba(10,20,14,${noise})`:`rgba(255,255,255,${noise})`;ctx.fillRect(Math.abs(x)*w,Math.abs(y)*h,1.5,1.5);}}
    text(ctx,'ILLUSTRATED SCENE / NOT A PHOTOGRAPH',16,22,'#f1f4e6',w<600?7:9);
  }
  const exposure=surface('exposure-canvas',({ctx,w,h})=>{
    if(!w)return;const s=exposureState();city(ctx,w,h,s);
    $('exp-f-out').textContent=`f/${s.f}`;$('exp-t-out').textContent=`1/${s.den} s`;$('exp-iso-out').textContent=s.iso;
    $('ev-needle').style.left=`${(clamp(s.ev,-3,3)+3)/6*100}%`;$('ev-output').textContent=`${s.ev>=0?'+':''}${s.ev.toFixed(1)} EV`;
  });
  ['exp-f','exp-t','exp-iso'].forEach(id=>bind(id,exposure.draw));
  $('match-exposure').onclick=()=>{
    const target=+ $('exp-t').value;let best=null;
    for(let f=0;f<fStops.length;f++)for(let iso=0;iso<7;iso++){
      const error=Math.abs(Math.log2((4/fStops[f])**2*(250/denominators[target])*2**iso));
      const cost=error+iso*.002;
      if(!best||cost<best.cost)best={f,iso,cost};
    }
    $('exp-f').value=best.f;$('exp-iso').value=best.iso;exposure.draw();
  };
  let shotId=0;
  $('capture').onclick=()=>{
    const s=exposureState(),c=document.createElement('canvas');c.width=600;c.height=360;city(c.getContext('2d'),600,360,s);
    const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
    img.src=c.toDataURL('image/png');img.alt=`촬영 ${++shotId}: 조리개 f/${s.f}, 셔터 1/${s.den}초, ISO ${s.iso}인 가상 장면`;
    const label=document.createElement('span');label.textContent=`FRAME ${String(shotId).padStart(2,'0')}`;
    caption.append(label,document.createTextNode(`f/${s.f} · 1/${s.den}s`),document.createElement('br'),document.createTextNode(`ISO ${s.iso} / ${s.ev>=0?'+':''}${s.ev.toFixed(1)} EV`));
    figure.append(img,caption);$('shots').append(figure);while($('shots').children.length>4)$('shots').firstElementChild.remove();
    $('empty-sheet').hidden=true;$('shot-count').textContent=`${$('shots').children.length} / 4`;
    $('capture').textContent='✓ 기록했습니다';setTimeout(()=>{$('capture').textContent='◎ 셔터 누르기';},800);
  };


  // A personal observation stays in this browser. Storage can be disabled.
  const note=$('observation-note'),noteStatus=$('note-status');
  const noteKey='visual-newsis:tangulife:camera:observation';
  try { const previous=localStorage.getItem(noteKey);if(previous){note.value=previous;noteStatus.textContent='지난번에 남긴 기록을 펼쳤습니다.';} } catch { noteStatus.textContent='이 브라우저에서는 기록 저장을 사용할 수 없습니다.'; }
  note.addEventListener('input',()=>{noteStatus.textContent='기록 남기기를 누르면 저장됩니다.';});
  $('save-note').addEventListener('click',()=>{
    try { if(note.value.trim()){localStorage.setItem(noteKey,note.value);noteStatus.textContent='나의 발견을 이 브라우저에 남겼습니다.';}else{localStorage.removeItem(noteKey);noteStatus.textContent='저장된 기록을 비웠습니다.';} }
    catch {noteStatus.textContent='저장하지 못했습니다. 작성한 글을 복사해 보관해 주세요.';}
  });

  // Reuse shared header; constrain this new page's overlay to the policy's four links.
  const nav=document.querySelector('.vnh-nav');
  if(nav){const allowed=['https://visual.newsis.com/#latest','https://visual.newsis.com/editshop/','https://visual.newsis.com/arcade/','https://visual.newsis.com/calculator/index.html'];[...nav.children].forEach(a=>{if(!allowed.includes(a.href))a.remove();});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopShutter();});
  reduced.addEventListener('change',()=>stopShutter());
})();
