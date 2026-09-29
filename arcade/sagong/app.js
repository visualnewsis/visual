(()=>{
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
const COLS=6,ROWS=13; // row 0 = 숨은 줄
const PAL=[{f:'#ff5a5f',d:'#b8323a'},{f:'#ffc93c',d:'#c98f07'},{f:'#39c98a',d:'#1c8a5a'},{f:'#4a8dff',d:'#2a5cc0'}];
const OFF=[[-1,0],[0,1],[1,0],[0,-1]];
const CHAIN_POW=[0,8,16,32,64,96,128,160,192,224,256,288,320,352,384,416,448,480,512];
const GROUP_B=n=>n<=4?0:n>=11?10:[0,0,0,0,0,2,3,4,5,6,7][n];
const COLOR_B=[0,0,3,6,12];
const DISP='"Jua","Apple SD Gothic Neo","Malgun Gothic",sans-serif';

const POP_MS=380, POP_HOLD=110;           // 제거 직전 강조 → 팝
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

let W=0,H=0,cell=30,fx=0,fy=0,fw=0,fh=0;
let grid,piece,nextQ,phase='idle',score=0,best=0,chain=0,maxChain=0,pieces=0,dropT=0,lockT=0,soft=false,popT=0,popping=[],texts=[],parts=[],rings=[];
let boatH=0,boatTarget=0,lastTarget=0,time=0,paused=false;
try{best=+localStorage.getItem('sagong-best')||0}catch(e){}

const $=id=>document.getElementById(id);
function hud(){ $('sc').textContent=score.toLocaleString(); $('mc').textContent=maxChain; $('bs').textContent=best.toLocaleString(); }

/* ---------- 그림 자산 (없으면 도형으로 대체) ---------- */
const IMG={};
const SPR=['red','yellow','green','blue'];
function loadImg(k,src){const im=new Image();im.onload=()=>{IMG[k]=im;};im.src=src;}
SPR.forEach(k=>loadImg(k,`./assets/${k}.png`));
loadImg('boat','./assets/boat.png');loadImg('sparkle','./assets/sparkle.png');
loadImg('bg','./assets/mountain-path-background.jpg');

/* 배경(1024×1536) 좌표계의 산길. 강 → 오른쪽 산길 → 정상 깃발 */
const BG_W=1024,BG_H=1536;
const PATH_IMG=[[800,1345],[850,1230],[905,1090],[960,955],[930,820],[985,690],[950,560],[985,440],[955,292]];
let bgS=1,bgX=0,bgY=0,path=[],pathLen=[],pathTotal=1;

function resize(){
  const r=stage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  // 판 터치 크기 우선: 가로 70%까지 판에 쓰고 오른쪽을 산길로 남긴다
  cell=Math.floor(Math.min((W*0.70)/COLS,(H-16)/12.6));
  fw=cell*COLS;fh=cell*12;fx=Math.max(8,Math.round(W*0.03));fy=Math.round(H-fh-8);
  // 배경: 오른쪽·아래 기준 cover (정상 깃발과 강이 잘리지 않게)
  bgS=Math.max(W/BG_W,H/BG_H);bgX=W-BG_W*bgS;bgY=Math.max(H-BG_H*bgS,-170*bgS);
  const bw=cell*1.9,minX=fx+fw+bw*0.3,maxX=W-bw*0.42;
  path=PATH_IMG.map(([x,y])=>[Math.min(maxX,Math.max(minX,bgX+x*bgS)),bgY+y*bgS]);
  pathLen=[0];for(let i=1;i<path.length;i++)pathLen.push(pathLen[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
  pathTotal=pathLen[pathLen.length-1]||1;
  const wn=$("warn");wn.style.left=fx+"px";wn.style.maxWidth=Math.round(cell*2.1)+"px";wn.style.top=Math.max(4,Math.round(fy-48))+"px";
}
window.addEventListener('resize',resize);

const rnd=()=>Math.floor(Math.random()*4);
const newPair=()=>({a:rnd(),b:rnd()});
function cellsOf(p){return [[p.r,p.c,p.a],[p.r+OFF[p.rot][0],p.c+OFF[p.rot][1],p.b]];}
function free(r,c){ if(c<0||c>=COLS||r>=ROWS)return false; if(r<0)return true; return !grid[r][c]; }
function fits(p){return cellsOf(p).every(([r,c])=>free(r,c));}

function reset(){
  grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  nextQ=[newPair(),newPair()];score=0;chain=0;maxChain=0;pieces=0;texts=[];parts=[];rings=[];
  boatH=0;boatTarget=0;lastTarget=0;soft=false;spawn();hud();
}
function interval(){return Math.max(140,760-Math.floor(pieces/10)*45);}

function spawn(){
  for(let c=0;c<COLS;c++) if(grid[1][c]) return gameOver();
  const p=nextQ.shift();nextQ.push(newPair());
  piece={r:1,c:2,rot:0,a:p.a,b:p.b,vr:-0.6,vc:2};
  if(!fits(piece)) return gameOver();
  chain=0;dropT=0;lockT=0;phase='play';pieces++;
}

function tryMove(dc){ if(phase!=='play')return; const n={...piece,c:piece.c+dc}; if(fits(n)){piece.c=n.c;lockT=Math.min(lockT,200);} }
function rotate(dir){
  if(phase!=='play')return;
  const n={...piece,rot:(piece.rot+dir+4)%4};
  if(fits(n)){Object.assign(piece,n);return;}
  const [dr,dc]=OFF[n.rot],k={...n,r:n.r-dr,c:n.c-dc};
  if(fits(k)){Object.assign(piece,k);return;}
  const q={...piece,rot:(piece.rot+2)%4};           // 양옆이 막히면 반바퀴
  if(fits(q)){Object.assign(piece,q);return;}
  const q2={...q,r:q.r-OFF[q.rot][0],c:q.c-OFF[q.rot][1]};
  if(fits(q2)) Object.assign(piece,q2);
}
function hardDrop(){
  if(phase!=='play')return;
  let n=0; while(fits({...piece,r:piece.r+1})){piece.r++;n++;}
  score+=n*2; lock(); hud();
}
function lock(){
  const lag=Math.max(0,piece.r-piece.vr);
  for(const [r,c,col] of cellsOf(piece)) if(r>=0) grid[r][c]={c:col,oy:lag,pop:0};
  piece=null; gravity(); phase='settle';
}
function gravity(){
  for(let c=0;c<COLS;c++){
    let w=ROWS-1;
    for(let r=ROWS-1;r>=0;r--){
      const x=grid[r][c]; if(!x)continue;
      if(r!==w){grid[w][c]=x;grid[r][c]=null;x.oy+=w-r;}
      w--;
    }
  }
  measure();
}
function measure(){
  let m=0;
  for(let c=0;c<COLS;c++) for(let r=1;r<ROWS;r++) if(grid[r][c]){m=Math.max(m,ROWS-r);break;}
  boatTarget=m/12;
  if(boatTarget<lastTarget-0.08) splash(lastTarget-boatTarget);
  lastTarget=boatTarget;
}
function check(){
  const seen=Array.from({length:ROWS},()=>Array(COLS).fill(false)),groups=[];
  for(let r=1;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!grid[r][c]||seen[r][c])continue;
    const col=grid[r][c].c,st=[[r,c]],g=[];seen[r][c]=true;
    while(st.length){
      const [y,x]=st.pop();g.push([y,x]);
      for(const [dy,dx] of OFF){const ny=y+dy,nx=x+dx;
        if(ny<1||ny>=ROWS||nx<0||nx>=COLS||seen[ny][nx])continue;
        const o=grid[ny][nx]; if(o&&o.c===col){seen[ny][nx]=true;st.push([ny,nx]);}}
    }
    if(g.length>=4)groups.push(g);
  }
  if(!groups.length){ spawn(); return; }
  chain++;maxChain=Math.max(maxChain,chain);
  let n=0,gb=0;const colors=new Set();
  for(const g of groups){n+=g.length;gb+=GROUP_B(g.length);colors.add(grid[g[0][0]][g[0][1]].c);}
  const mult=Math.max(1,Math.min(999,CHAIN_POW[Math.min(chain-1,CHAIN_POW.length-1)]+COLOR_B[colors.size]+gb));
  score+=10*n*mult;
  popping=groups.flat(); let sx=0,sy=0;
  for(const [r,c] of popping){grid[r][c].pop=1;sx+=c;sy+=r;}
  sx/=popping.length;sy/=popping.length;
  const label=chain>1?`${chain}연쇄!`:`${n}공 팡!`;
  const sub=chain>=5?'선장님 대노':chain>=3?'사공 줄하선':'';
  for(const t of texts)t.t=Math.max(t.t,800); // 이전 자막은 빨리 퇴장
  texts.push({s:label,sub,x:fx+(sx+0.5)*cell,y:fy+(sy-0.5)*cell,t:0,k:chain});
  phase='pop';popT=0;hud();
}
function gameOver(){
  phase='over';boatTarget=1;
  if(score>best){best=score;try{localStorage.setItem('sagong-best',best)}catch(e){}}
  hud();
  $('ovScore').textContent=score.toLocaleString()+'점';
  $('ovInfo').textContent=`최고 ${maxChain}연쇄 · 사공 ${pieces*2}명 출항`;
  renderNews();
  window.gtag?.('event','sagong_game_over',{score,max_chain:maxChain,pairs:pieces});
  setTimeout(()=>{if(phase==='over')$('ovOver').hidden=false},900);
}

/* ---------- 오늘의 기사 (차곡차곡과 같은 공개 데이터) ---------- */
const FALLBACK_NEWS=[{title:'뉴시스 최신 기사 보러 가기',url:'https://www.newsis.com/'}];
let todayNews=[];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
async function loadNews(){
  try{
    const sources=await Promise.allSettled([
      fetch('../puzzle/data/puzzles.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
      fetch('../words/data/crossword.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
    ]);
    const list=[];
    sources.forEach(s=>{if(s.status!=='fulfilled')return;
      (s.value.puzzles||[]).forEach(p=>{if(p.title&&p.url)list.push({title:p.title,url:p.url});
        (p.words||[]).forEach(w=>{if(w.title&&w.url)list.push({title:w.title,url:w.url});});});});
    todayNews=[...new Map(list.filter(n=>/^https:\/\/(www\.)?newsis\.com\//.test(n.url)).map(n=>[n.url,n])).values()];
  }catch(e){console.warn('오늘의 기사를 불러오지 못했습니다.',e);}
}
function renderNews(){
  const box=$('ovNews');box.textContent='';
  for(const n of (todayNews.length?shuffle(todayNews).slice(0,3):FALLBACK_NEWS)){
    const a=document.createElement('a');a.href=n.url;a.target='_blank';a.rel='noopener';a.textContent=n.title;
    a.addEventListener('click',()=>window.gtag?.('event','sagong_article_click',{article_url:n.url}));
    box.appendChild(a);
  }
}

/* ---------- 효과 ---------- */
function boatPos(h){
  const e=h<0?0:h>1?1:h,d=e*pathTotal;
  let i=1;while(i<path.length-1&&pathLen[i]<d)i++;
  const a=path[i-1],b=path[i],seg=(pathLen[i]-pathLen[i-1])||1,t=Math.min(1,Math.max(0,(d-pathLen[i-1])/seg));
  return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,ang:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
function splash(amount){
  const p=boatPos(boatH);
  rings.push({x:p.x,y:p.y,t:0,k:Math.min(1.6,0.6+amount*3)});
  if(REDUCED)return;
  const n=Math.min(26,8+amount*40);
  for(let i=0;i<n;i++)parts.push({x:p.x+(Math.random()-.5)*cell*1.4,y:p.y,vx:(Math.random()-.5)*0.22,vy:-Math.random()*0.3-0.08,t:0,life:650,col:'#dff7ff',r:1.5+Math.random()*2.5});
}
function burst(r,c,col){
  if(REDUCED)return;
  const x=fx+(c+.5)*cell,y=fy+(r-.5)*cell;
  for(let i=0;i<4;i++){const a=Math.random()*Math.PI*2,s=0.06+Math.random()*0.12;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.08,t:0,life:420,col:PAL[col].f,r:2+Math.random()*2});}
}

/* ---------- 업데이트 ---------- */
function update(dt){
  time+=dt;
  if(phase==='play'){
    if(fits({...piece,r:piece.r+1})){
      lockT=0;dropT+=dt;
      if(dropT>=(soft?32:interval())){dropT=0;piece.r++;if(soft)score+=1;}
    }else{ lockT+=dt; if(lockT>(soft?90:420)) lock(); }
    if(piece){piece.vr+=(piece.r-piece.vr)*Math.min(1,dt*0.022);piece.vc+=(piece.c-piece.vc)*Math.min(1,dt*0.03);}
  }else if(phase==='settle'){
    let moving=false;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const x=grid[r][c];if(x&&x.oy>0){x.oy=Math.max(0,x.oy-dt*0.026);moving=true;}}
    if(!moving)check();
  }else if(phase==='pop'){
    popT+=dt;
    if(popT>POP_MS){
      for(const [r,c] of popping){burst(r,c,grid[r][c].c);grid[r][c]=null;}
      popping=[];gravity();phase='settle';hud();
    }
  }
  // 상승은 빠르게(약 0.4s), 제거 후 하강은 조금 느긋하게(약 0.6s)
  boatH+=(boatTarget-boatH)*Math.min(1,dt*(boatTarget<boatH?0.0048:0.0072));
  for(const g of rings)g.t+=dt;rings=rings.filter(g=>g.t<900);
  for(const p of parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.0009*dt;}
  parts=parts.filter(p=>p.t<p.life);
  for(const t of texts)t.t+=dt;
  texts=texts.filter(t=>t.t<1100);
}

/* ---------- 그리기 ---------- */
function ball(x,y,r,col,a=1){ // 그림이 없을 때의 대체 표현
  ctx.globalAlpha=a;
  const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.15,x,y,r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.28,PAL[col].f);g.addColorStop(1,PAL[col].d);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
}
// 사공 한 명: 네 색 모두 같은 목적지 상자(cell 기준)에 비율 유지로 맞춘다
function sagong(x,y,size,col,a=1){
  const im=IMG[SPR[col]];
  if(!im){ball(x,y,size*0.42,col,a);return;}
  const box=size*1.06,k=Math.min(box/im.width,box/im.height),w=im.width*k,h=im.height*k;
  ctx.globalAlpha=a;ctx.drawImage(im,x-w/2,y-h/2+size*0.02,w,h);ctx.globalAlpha=1;
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function drawScene(){
  if(IMG.bg)ctx.drawImage(IMG.bg,bgX,bgY,BG_W*bgS,BG_H*bgS);
  else{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2b5f9a');g.addColorStop(.8,'#2f6fa3');g.addColorStop(1,'#29a6c4');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  const danger=Math.max(0,(boatH-0.62)/0.38);
  if(danger>0){ // 정상 근처 경고색
    const p=path[path.length-1]||[W*0.9,H*0.2];
    const g=ctx.createRadialGradient(p[0],p[1],4,p[0],p[1],W*0.55);
    g.addColorStop(0,`rgba(255,110,80,${0.42*danger})`);g.addColorStop(1,'rgba(255,110,80,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
}
function drawBoard(){
  roundRect(fx-4,fy-4,fw+8,fh+8,12);
  ctx.fillStyle='rgba(5,34,46,.74)';ctx.fill();
  ctx.strokeStyle='rgba(170,235,235,.28)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
  for(let c=1;c<COLS;c++){ctx.beginPath();ctx.moveTo(fx+c*cell+.5,fy);ctx.lineTo(fx+c*cell+.5,fy+fh);ctx.stroke();}
  for(let r=1;r<12;r++){ctx.beginPath();ctx.moveTo(fx,fy+r*cell+.5);ctx.lineTo(fx+fw,fy+r*cell+.5);ctx.stroke();}
}
function drawBoat(){
  if(!path.length)return;
  const p=boatPos(boatH),bw=cell*1.9,danger=Math.max(0,(boatH-0.62)/0.38);
  const bob=REDUCED?0:Math.sin(time/380)*2*(1-boatH);
  const wob=REDUCED?0:Math.sin(time/85)*0.07*danger;
  const tilt=Math.max(-0.35,Math.min(0.1,(p.ang+Math.PI/2)*0.25))*Math.min(1,boatH*3)+wob;
  // 파문(연쇄로 배가 내려올 때)
  for(const g of rings){const k=g.t/900;ctx.strokeStyle=`rgba(225,250,255,${(1-k)*0.8})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(g.x,g.y+2,bw*(0.4+k*0.9)*g.k,bw*(0.1+k*0.22)*g.k,0,0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.translate(p.x,p.y+bob);ctx.rotate(tilt);
  const im=IMG.boat,bh=im?bw*im.height/im.width:bw*0.45;
  // 배에서 기다리는 다음 사공 두 명
  if(nextQ&&nextQ[0]){
    const s=cell*0.72,hop=REDUCED?0:Math.abs(Math.sin(time/(danger>0?120:420)))*(2+danger*4);
    sagong(-bw*0.16,-bh*0.62-hop,s,nextQ[0].a);
    sagong(bw*0.12,-bh*0.62-(REDUCED?0:Math.abs(Math.sin(time/(danger>0?120:420)+1.3))*(2+danger*4)),s,nextQ[0].b);
  }
  if(im)ctx.drawImage(im,-bw/2,-bh*0.92,bw,bh);
  else{ctx.fillStyle='#9a5f2c';ctx.beginPath();ctx.moveTo(-bw*0.5,-bh*0.6);ctx.lineTo(bw*0.5,-bh*0.6);ctx.lineTo(bw*0.36,0);ctx.lineTo(-bw*0.38,0);ctx.closePath();ctx.fill();}
  ctx.restore();
}
function drawField(){
  if(!grid)return;
  const R=cell*0.42;
  // 같은 색끼리 붙은 곳은 옅은 띠로 이어 그룹을 읽기 쉽게
  ctx.globalAlpha=0.38;
  for(let r=1;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const x=grid[r][c];if(!x||x.oy>0.02||x.pop)continue;
    const cx=fx+(c+.5)*cell,cy=fy+(r-.5)*cell;ctx.fillStyle=PAL[x.c].f;
    const rt=c+1<COLS&&grid[r][c+1];if(rt&&rt.c===x.c&&rt.oy<=0.02&&!rt.pop)ctx.fillRect(cx,cy-R*.5,cell,R);
    const dn=r+1<ROWS&&grid[r+1][c];if(dn&&dn.c===x.c&&dn.oy<=0.02&&!dn.pop)ctx.fillRect(cx-R*.5,cy,R,cell);
  }
  ctx.globalAlpha=1;
  const sparks=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const x=grid[r][c];if(!x)continue;
    const cx=fx+(c+.5)*cell,cy=fy+(r-.5-x.oy)*cell;
    if(!x.pop){sagong(cx,cy,cell,x.c);continue;}
    if(popT<POP_HOLD){ // 강조
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(cx,cy,R*1.12,0,Math.PI*2);ctx.fill();
      sagong(cx,cy,cell,x.c);
    }else{
      const t=(popT-POP_HOLD)/(POP_MS-POP_HOLD),k=REDUCED?1:(t<0.4?1+t/0.4*0.18:1.18*(1-(t-0.4)/0.6));
      sagong(cx,cy,cell*Math.max(0,k),x.c,Math.max(0,1-Math.max(0,(t-0.55)/0.45)));
      sparks.push([cx,cy,t]);
    }
  }
  // 반짝임은 모든 사공 위에 한 번에
  if(IMG.sparkle)for(const [cx,cy,t] of sparks){const s=cell*(0.55+t*0.75);
    ctx.save();ctx.translate(cx,cy);if(!REDUCED)ctx.rotate(t*1.2);
    ctx.globalAlpha=Math.max(0,1-t*t);ctx.drawImage(IMG.sparkle,-s/2,-s/2,s,s);ctx.restore();}
  ctx.globalAlpha=1;
}
function drawPiece(){
  if(phase!=='play'||!piece)return;
  const R=cell*0.42;
  // 떨어질 자리 미리보기
  const cs=cellsOf(piece),land={};
  const order=cs.slice().sort((a,b)=>b[0]-a[0]);
  for(const [r,c,col] of order){
    let y=ROWS-1;while(y>=0&&grid[y][c])y--;
    if(land[c]!==undefined)y=land[c]-1;land[c]=y;
    if(y>=1){ctx.strokeStyle=PAL[col].f;ctx.lineWidth=2;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(fx+(c+.5)*cell,fy+(y-.5)*cell,R*.82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  }
  const px=fx+(piece.vc+.5)*cell,py=fy+(piece.vr-.5)*cell,[dr,dc]=OFF[piece.rot];
  // 회전 축 표시
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(px,py,R*1.05,0,Math.PI*2);ctx.fill();
  sagong(px+dc*cell,py+dr*cell,cell,piece.b);
  sagong(px,py,cell,piece.a);
}
function drawFx(){
  for(const p of parts){ctx.globalAlpha=1-p.t/p.life;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='middle';
  for(const t of texts){
    const a=t.t<800?1:1-(t.t-800)/300,y=t.y-(REDUCED?0:t.t*0.04),sz=cell*(0.75+Math.min(0.5,t.k*0.08));
    ctx.globalAlpha=a;ctx.font=`${sz}px ${DISP}`;ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeStyle='#10222e';ctx.fillStyle='#fff';
    const x=Math.min(fx+fw-fw*0.28,Math.max(fx+fw*0.28,t.x));
    ctx.strokeText(t.s,x,y);ctx.fillText(t.s,x,y);
    if(t.sub){ctx.font=`${sz*0.5}px ${DISP}`;ctx.fillStyle='#ffc93c';ctx.strokeText(t.sub,x,y+sz*0.8);ctx.fillText(t.sub,x,y+sz*0.8);}
  }
  ctx.globalAlpha=1;
}
let warnShown=false;
function draw(){
  ctx.clearRect(0,0,W,H);
  drawScene();drawBoard();drawBoat();drawField();drawPiece();drawFx();
  const warn=boatH>0.72&&phase!=='over'&&phase!=='idle';
  if(warn!==warnShown){warnShown=warn;$('warn').hidden=!warn;}
}

let last=performance.now();
function loop(now){
  const dt=Math.min(50,now-last);last=now;
  if(!paused&&phase!=='idle')update(dt);else time+=dt;
  draw();requestAnimationFrame(loop);
}

/* ---------- 입력 ---------- */
window.addEventListener('keydown',e=>{
  if(phase!=='play')return;
  const k=e.key;
  if(k==='ArrowLeft')tryMove(-1);else if(k==='ArrowRight')tryMove(1);
  else if(k==='ArrowUp'||k==='x'||k==='X')rotate(1);else if(k==='z'||k==='Z')rotate(-1);
  else if(k==='ArrowDown')soft=true;else if(k===' ')hardDrop();else return;
  e.preventDefault();
});
window.addEventListener('keyup',e=>{if(e.key==='ArrowDown')soft=false;});

let tp=null;
cv.addEventListener('pointerdown',e=>{tp={sx:e.clientX,sy:e.clientY,lx:e.clientX,t:performance.now(),moved:false};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{
  if(!tp)return;const step=cell*0.85;
  while(e.clientX-tp.lx>step){tryMove(1);tp.lx+=step;tp.moved=true;}
  while(tp.lx-e.clientX>step){tryMove(-1);tp.lx-=step;tp.moved=true;}
  const dy=e.clientY-tp.sy;
  if(dy>cell*1.1&&Math.abs(e.clientX-tp.sx)<cell){soft=true;tp.moved=true;}
});
cv.addEventListener('pointerup',e=>{
  if(!tp)return;const dt=performance.now()-tp.t,dy=e.clientY-tp.sy,dx=e.clientX-tp.sx;
  if(dy>cell*2.2&&dt<260&&Math.abs(dx)<cell*1.2)hardDrop();
  else if(!tp.moved&&Math.hypot(dx,dy)<12&&dt<350)rotate(1);
  soft=false;tp=null;
});
cv.addEventListener('pointercancel',()=>{soft=false;tp=null;});

function holdBtn(id,fn){
  const b=$(id);let t1,t2;
  const stop=()=>{clearTimeout(t1);clearInterval(t2);};
  b.addEventListener('pointerdown',e=>{e.preventDefault();fn();t1=setTimeout(()=>{t2=setInterval(fn,85);},200);});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop));
}
holdBtn('bL',()=>tryMove(-1));holdBtn('bRt',()=>tryMove(1));
$('bR').addEventListener('pointerdown',e=>{e.preventDefault();rotate(1);});
$('bD').addEventListener('pointerdown',e=>{e.preventDefault();hardDrop();});

function start(replay){
  $('ovStart').hidden=true;$('ovOver').hidden=true;$('ovPause').hidden=true;paused=false;reset();
  window.gtag?.('event',replay?'sagong_restart':'sagong_start');
}
$('btnStart').addEventListener('click',()=>start(false));
$('btnRetry').addEventListener('click',()=>start(true));
$('btnResume').addEventListener('click',()=>{paused=false;$('ovPause').hidden=true;window.gtag?.('event','sagong_resume',{score});});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&(phase==='play'||phase==='settle'||phase==='pop')&&!paused){
    paused=true;$('ovPause').hidden=false;window.gtag?.('event','sagong_pause',{score});
  }
});

$('howto').innerHTML=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)
  ?'탭 회전 · 좌우로 끌기 이동 · 아래로 휙 바로 내리기'
  :'← → 이동 · ↑/X 회전 · Z 반대 회전<br>↓ 천천히 · Space 바로 내리기';
new ResizeObserver(resize).observe(stage);
resize();hud();loadNews();requestAnimationFrame(loop);
})();
