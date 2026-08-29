const $=selector=>document.querySelector(selector);
const canvas=$('#canvas'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;

const ROWS=6,COLS=8,BRICK_W=54,BRICK_H=24,BRICK_GAP=4;
const GRID_LEFT=(W-(COLS*BRICK_W+(COLS-1)*BRICK_GAP))/2,GRID_TOP=70;
const ROW_COLORS=['#e6292f','#f07852','#f5b942','#00b4c9','#3d6cf0','#8a5cf0'];
const CLICKBAIT=['충격','단독','경악','발칵','소름','헉','실화냐','대박','레전드','미쳤다','이럴수가','역대급','충격주의','단독입수','특종','헐'];

let bricks=[],ball,paddle,score=0,lives=3,running=false,animId=null;
let todayNews=[],prizeTitle='오늘의 뉴스는 벽돌 뒤에 숨어있습니다';

const FALLBACK_NEWS=[
  {title:'오늘의 뉴스는 제목에서 시작됩니다',url:'https://www.newsis.com/'},
  {title:'읽는 속도와 쓰는 속도 사이',url:'https://www.newsis.com/'},
  {title:'진짜 뉴스는 늘 여기에 있습니다',url:'https://www.newsis.com/'}
];

function shuffle(items){return [...items].sort(()=>Math.random()-.5)}

function wrapLines(text,maxWidth,font){
  ctx.font=font;
  const words=String(text).split(' '),lines=[];
  let line='';
  words.forEach(word=>{
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}
    else{line=test}
  });
  if(line)lines.push(line);
  return lines;
}

function buildBricks(){
  bricks=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    bricks.push({
      x:GRID_LEFT+c*(BRICK_W+BRICK_GAP),y:GRID_TOP+r*(BRICK_H+BRICK_GAP),
      w:BRICK_W,h:BRICK_H,alive:true,color:ROW_COLORS[r],
      label:CLICKBAIT[(r*COLS+c)%CLICKBAIT.length]
    });
  }
}

function resetBallAndPaddle(){
  paddle={w:90,h:12,x:(W-90)/2,y:H-34,speed:9};
  ball={x:W/2,y:paddle.y-8,r:7,dx:0,dy:0,launched:false,speed:5.2};
}

function launchBall(){
  if(ball.launched)return;
  ball.launched=true;
  const angle=(-70-Math.random()*40)*Math.PI/180;
  ball.dx=ball.speed*Math.cos(angle);
  ball.dy=ball.speed*Math.sin(angle);
}

function updateHud(){
  $('#score').textContent=score;
  $('#lives').textContent='●'.repeat(Math.max(0,lives))+'○'.repeat(Math.max(0,3-lives));
}

function drawBackground(){
  ctx.fillStyle='#0a1016';
  ctx.fillRect(0,0,W,H);
}

function drawPrizeText(){
  const maxWidth=COLS*BRICK_W+(COLS-1)*BRICK_GAP-8;
  const font='700 22px "Noto Serif KR",serif';
  const lines=wrapLines(prizeTitle,maxWidth,font);
  const lineHeight=26;
  const blockHeight=lines.length*lineHeight;
  const gridHeight=ROWS*BRICK_H+(ROWS-1)*BRICK_GAP;
  let y=GRID_TOP+(gridHeight-blockHeight)/2+lineHeight*0.75;
  ctx.font=font;ctx.fillStyle='#f5f0e5';ctx.textAlign='center';
  lines.forEach(line=>{ctx.fillText(line,W/2,y);y+=lineHeight});
  ctx.textAlign='left';
}

function drawBricks(){
  bricks.forEach(b=>{
    if(!b.alive)return;
    ctx.fillStyle=b.color;
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='rgba(0,0,0,.55)';
    ctx.font='700 10px "Noto Sans KR",sans-serif';
    ctx.textAlign='center';
    ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+3);
    ctx.textAlign='left';
  });
}

function drawPaddle(){
  ctx.fillStyle='#00b4c9';
  ctx.beginPath();
  ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6);
  ctx.fill();
}

function drawBall(){
  ctx.fillStyle='#f5f0e5';
  ctx.beginPath();
  ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);
  ctx.fill();
}

function movePaddleTo(x){
  paddle.x=Math.max(0,Math.min(W-paddle.w,x-paddle.w/2));
  if(!ball.launched)ball.x=paddle.x+paddle.w/2;
}

function step(){
  if(!running)return;
  if(ball.launched){
    ball.x+=ball.dx;ball.y+=ball.dy;
    if(ball.x-ball.r<0){ball.x=ball.r;ball.dx*=-1}
    if(ball.x+ball.r>W){ball.x=W-ball.r;ball.dx*=-1}
    if(ball.y-ball.r<0){ball.y=ball.r;ball.dy*=-1}
    if(ball.y-ball.r>H){loseLife();}
    if(ball.y+ball.r>=paddle.y&&ball.y-ball.r<=paddle.y+paddle.h&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w&&ball.dy>0){
      const hitPos=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2);
      const angle=hitPos*60*Math.PI/180-Math.PI/2;
      ball.dx=ball.speed*Math.cos(angle);
      ball.dy=ball.speed*Math.sin(angle);
      ball.y=paddle.y-ball.r-.5;
    }
    for(const b of bricks){
      if(!b.alive)continue;
      if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
        b.alive=false;score+=10;updateHud();
        const overlapLeft=ball.x+ball.r-b.x,overlapRight=b.x+b.w-(ball.x-ball.r);
        const overlapTop=ball.y+ball.r-b.y,overlapBottom=b.y+b.h-(ball.y-ball.r);
        const minOverlap=Math.min(overlapLeft,overlapRight,overlapTop,overlapBottom);
        if(minOverlap===overlapTop||minOverlap===overlapBottom)ball.dy*=-1;else ball.dx*=-1;
        checkWin();
        break;
      }
    }
  }
  drawBackground();drawPrizeText();drawBricks();drawPaddle();drawBall();
  animId=requestAnimationFrame(step);
}

function loseLife(){
  lives--;updateHud();
  if(lives<=0){endGame(false);return}
  resetBallAndPaddle();
}

function checkWin(){
  if(bricks.every(b=>!b.alive))endGame(true);
}

function endGame(won){
  running=false;
  cancelAnimationFrame(animId);
  $('#overlay').hidden=false;
  $('#overlay').querySelector('.ak-overlay-title').textContent=won?'승리! 벽돌을 다 깼어요':'게임 오버';
  $('#overlay').querySelector('.ak-overlay-sub').innerHTML=won?'낚시성 벽돌 뒤에 숨어있던<br>오늘의 진짜 헤드라인을 확인하세요':'그래도 뉴스만큼은<br>진짜만 보여드릴게요';
  showNews(won?'승리! 벽돌을 모두 깼어요':'게임 오버',won?'낚시성 벽돌 뒤에 숨어있던 오늘의 진짜 헤드라인입니다':'낚시성 벽돌엔 졌지만 뉴스만큼은 진짜만 보여드릴게요');
  window.gtag?.('event',won?'brickrunch_win':'brickrunch_lose',{score});
}

function showNews(title,subtitle){
  $('#newsTitle').textContent=title;
  $('#newsSubtitle').textContent=subtitle;
  const list=$('#newsList');
  list.innerHTML='';
  todayNews.forEach(n=>{
    const a=document.createElement('a');
    a.href=n.url;a.textContent=n.title;a.target='_blank';a.rel='noopener';
    a.addEventListener('click',()=>window.gtag?.('event','brickrunch_article_click',{article_url:n.url}));
    list.appendChild(a);
  });
  $('#newsPanel').hidden=false;
  $('#newsPanel').setAttribute('data-show','');
}

function startGame(){
  score=0;lives=3;updateHud();
  buildBricks();resetBallAndPaddle();
  $('#overlay').hidden=true;
  $('#newsPanel').hidden=true;
  $('#newsPanel').removeAttribute('data-show');
  running=true;
  window.gtag?.('event','brickrunch_start');
  cancelAnimationFrame(animId);
  animId=requestAnimationFrame(step);
}

canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  movePaddleTo((e.clientX-rect.left)*(W/rect.width));
});
canvas.addEventListener('click',()=>{if(running)launchBall()});
canvas.addEventListener('touchstart',e=>{
  const rect=canvas.getBoundingClientRect();
  const t=e.touches[0];
  movePaddleTo((t.clientX-rect.left)*(W/rect.width));
  if(running)launchBall();
},{passive:true});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const t=e.touches[0];
  movePaddleTo((t.clientX-rect.left)*(W/rect.width));
},{passive:false});
document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowLeft')movePaddleTo(paddle.x+paddle.w/2-paddle.speed*3);
  if(e.key==='ArrowRight')movePaddleTo(paddle.x+paddle.w/2+paddle.speed*3);
  if(e.key===' '){e.preventDefault();launchBall()}
});

$('#startBtn').addEventListener('click',startGame);
$('#overlayStart').addEventListener('click',startGame);

async function loadNews(){
  try{
    const res=await fetch('../puzzle/data/puzzles.json',{cache:'no-store'});
    if(!res.ok)throw new Error(res.status);
    const data=await res.json();
    const items=(data.puzzles||[]).filter(p=>p.title&&p.url);
    todayNews=shuffle(items).slice(0,3);
    if(todayNews.length)prizeTitle=todayNews[0].title;
  }catch(e){
    console.warn('오늘의 뉴스를 불러오지 못해 기본 문장을 사용합니다.',e);
  }
  if(!todayNews.length)todayNews=FALLBACK_NEWS;
  buildBricks();
  drawBackground();drawPrizeText();drawBricks();
}

resetBallAndPaddle();
loadNews();
