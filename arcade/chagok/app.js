const $=selector=>document.querySelector(selector);
const canvas=$('#canvas'),ctx=canvas.getContext('2d');
const nextCanvas=$('#nextCanvas'),nctx=nextCanvas.getContext('2d');

const CELL=37;
const DIFFICULTIES={
  beginner:{cols:9,rows:16},
  advanced:{cols:12,rows:18}
};
const DIFF_KEY='chagok_difficulty';
const HS_KEY_PREFIX='chagok_highscore_';
const LINE_SCORES=[0,100,300,500,800];

let difficulty=loadDifficulty();
let COLS=DIFFICULTIES[difficulty].cols,ROWS=DIFFICULTIES[difficulty].rows;

const SHAPES={
  I:[[1,1,1,1]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]]
};
const COLORS={I:'#f07852',O:'#3d6cf0',T:'#3ecf6b',S:'#f5c518',Z:'#8a5cf0',J:'#e6292f',L:'#00b4c9'};
const PIECE_KEYS=Object.keys(SHAPES);

let board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
let current,nextType,bag=[],score=0,lines=0,level=1,dropInterval=700,lastDrop=0;
let running=false,animId=null,hasStarted=false,highScore=0,audioCtx=null;
let todayNews=[];

const FALLBACK_NEWS=[
  {title:'오늘의 뉴스는 여기에 있습니다',url:'https://www.newsis.com/'},
  {title:'쌓인 스트레스 끝에 만나는 한 줄',url:'https://www.newsis.com/'},
  {title:'진짜 뉴스는 늘 이 자리에',url:'https://www.newsis.com/'}
];

function shuffle(items){return [...items].sort(()=>Math.random()-.5)}

function announce(message){$('#gameStatus').textContent=message}

function pulse(className){
  const cabinet=$('.cg-cabinet');
  cabinet.classList.remove(className);
  void cabinet.offsetWidth;
  cabinet.classList.add(className);
  window.setTimeout(()=>cabinet.classList.remove(className),320);
}

function tone(frequency,duration=.045,type='square'){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();
    oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.value=.035;
    oscillator.connect(gain);gain.connect(audioCtx.destination);oscillator.start();
    gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
    oscillator.stop(audioCtx.currentTime+duration);
  }catch{}
}

function loadHighScore(){
  try{return parseInt(localStorage.getItem(HS_KEY_PREFIX+difficulty)||'0',10)||0}catch{return 0}
}
function saveHighScore(value){
  try{localStorage.setItem(HS_KEY_PREFIX+difficulty,String(value))}catch{}
}
function loadDifficulty(){
  try{
    const saved=localStorage.getItem(DIFF_KEY);
    if(saved&&DIFFICULTIES[saved])return saved;
  }catch{}
  return 'beginner';
}
function saveDifficulty(value){
  try{localStorage.setItem(DIFF_KEY,value)}catch{}
}
function setDifficulty(value){
  if(!DIFFICULTIES[value]||value===difficulty&&COLS===DIFFICULTIES[value].cols)return;
  difficulty=value;
  saveDifficulty(value);
  COLS=DIFFICULTIES[value].cols;
  ROWS=DIFFICULTIES[value].rows;
  canvas.width=COLS*CELL;
  canvas.height=ROWS*CELL;
  board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  highScore=loadHighScore();
  updateHud();
  draw();
  document.querySelectorAll('.cg-diff-btn').forEach(btn=>{
    btn.classList.toggle('is-active',btn.dataset.difficulty===value);
  });
}

function drawFromBag(){
  if(bag.length===0)bag=shuffle(PIECE_KEYS.slice());
  return bag.pop();
}

function makePiece(type){
  const shape=SHAPES[type].map(row=>row.slice());
  return {type,shape,x:Math.floor((COLS-shape[0].length)/2),y:0};
}

function rotateMatrix(shape){
  const rows=shape.length,cols=shape[0].length,result=[];
  for(let c=0;c<cols;c++){
    const row=[];
    for(let r=rows-1;r>=0;r--)row.push(shape[r][c]);
    result.push(row);
  }
  return result;
}

function collides(shape,px,py){
  for(let r=0;r<shape.length;r++){
    for(let c=0;c<shape[r].length;c++){
      if(!shape[r][c])continue;
      const x=px+c,y=py+r;
      if(x<0||x>=COLS||y>=ROWS)return true;
      if(y>=0&&board[y][x])return true;
    }
  }
  return false;
}

function tryMove(dx,dy){
  if(collides(current.shape,current.x+dx,current.y+dy))return false;
  current.x+=dx;current.y+=dy;return true;
}

function tryRotate(){
  const rotated=rotateMatrix(current.shape);
  const kicks=[0,-1,1,-2,2];
  for(const k of kicks){
    if(!collides(rotated,current.x+k,current.y)){
      current.shape=rotated;current.x+=k;
      tone(520,.03,'triangle');
      return true;
    }
  }
  return false;
}

function ghostY(){
  let y=current.y;
  while(!collides(current.shape,current.x,y+1))y++;
  return y;
}

function merge(){
  current.shape.forEach((row,r)=>row.forEach((v,c)=>{
    if(!v)return;
    const y=current.y+r,x=current.x+c;
    if(y>=0)board[y][x]=current.type;
  }));
}

function clearLines(){
  let cleared=0;
  for(let r=ROWS-1;r>=0;){
    if(board[r].every(v=>v)){
      board.splice(r,1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
    }else{
      r--;
    }
  }
  return cleared;
}

function updateHud(){
  $('#score').textContent=score.toLocaleString('ko-KR');
  $('#lines').textContent=lines;
  $('#level').textContent=level;
  $('#highScore').textContent=highScore.toLocaleString('ko-KR');
}

function drawCell(context,cx,cy,color,cellSize,ghost=false){
  if(cy<0)return;
  const x=cx*cellSize,y=cy*cellSize;
  if(ghost){
    context.strokeStyle=color;context.lineWidth=2;
    context.strokeRect(x+2,y+2,cellSize-4,cellSize-4);
    return;
  }
  context.fillStyle=color;
  context.fillRect(x+1,y+1,cellSize-2,cellSize-2);
  context.fillStyle='rgba(255,255,255,.28)';
  context.fillRect(x+1,y+1,cellSize-2,4);
}

function draw(){
  ctx.fillStyle='#0a1016';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(board[r][c])drawCell(ctx,c,r,COLORS[board[r][c]],CELL);
    }
  }
  if(current){
    const gy=ghostY();
    current.shape.forEach((row,r)=>row.forEach((v,c)=>{
      if(v)drawCell(ctx,current.x+c,gy+r,COLORS[current.type],CELL,true);
    }));
    current.shape.forEach((row,r)=>row.forEach((v,c)=>{
      if(v)drawCell(ctx,current.x+c,current.y+r,COLORS[current.type],CELL);
    }));
  }
  drawNextPreview();
}

function drawNextPreview(){
  nctx.fillStyle='#f5f0e5';
  nctx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  if(!nextType)return;
  const shape=SHAPES[nextType];
  const size=10;
  const offX=(nextCanvas.width-shape[0].length*size)/2;
  const offY=(nextCanvas.height-shape.length*size)/2;
  shape.forEach((row,r)=>row.forEach((v,c)=>{
    if(!v)return;
    nctx.fillStyle=COLORS[nextType];
    nctx.fillRect(offX+c*size+1,offY+r*size+1,size-2,size-2);
  }));
}

function lockPiece(){
  merge();
  const cleared=clearLines();
  if(cleared){
    score+=LINE_SCORES[cleared]*level;
    lines+=cleared;
    const newLevel=Math.floor(lines/10)+1;
    if(newLevel!==level){
      level=newLevel;
      dropInterval=Math.max(120,700-(level-1)*60);
    }
    pulse('is-hit');
    tone(240+cleared*80,.09,'sine');
    window.gtag?.('event','chagok_lines_cleared',{cleared,total_lines:lines,level});
  }
  updateHud();
  spawnNext();
}

function spawnNext(){
  current=makePiece(nextType);
  nextType=drawFromBag();
  if(collides(current.shape,current.x,current.y)){
    endGame();
    return;
  }
}

function softDropTick(){
  if(!tryMove(0,1))lockPiece();
}

function hardDrop(){
  let distance=0;
  while(tryMove(0,1))distance++;
  score+=distance*2;
  tone(160,.05,'square');
  lockPiece();
  updateHud();
  draw();
}

function step(timestamp){
  if(!running)return;
  if(!lastDrop)lastDrop=timestamp;
  if(timestamp-lastDrop>dropInterval){
    lastDrop=timestamp;
    softDropTick();
    updateHud();
  }
  draw();
  animId=requestAnimationFrame(step);
}

function showNews(title,subtitle){
  $('#newsTitle').textContent=title;
  $('#newsSubtitle').textContent=subtitle;
  const list=$('#newsList');
  list.innerHTML='';
  todayNews.forEach(n=>{
    const a=document.createElement('a');
    a.href=n.url;a.textContent=n.title;a.target='_blank';a.rel='noopener';
    a.addEventListener('click',()=>window.gtag?.('event','chagok_article_click',{article_url:n.url}));
    list.appendChild(a);
  });
  $('#newsPanel').hidden=false;
  $('#newsPanel').setAttribute('data-show','');
}

function endGame(){
  running=false;
  cancelAnimationFrame(animId);
  if(score>highScore){highScore=score;saveHighScore(highScore);}
  updateHud();
  pulse('is-over');
  tone(90,.22,'sawtooth');
  $('#overlay').hidden=false;
  $('#overlay').querySelector('.cg-overlay-title').textContent='게임 오버';
  $('#overlay').querySelector('.cg-overlay-sub').innerHTML=`이번 점수 ${score.toLocaleString('ko-KR')}점 · 최고 기록 ${highScore.toLocaleString('ko-KR')}점`;
  showNews('게임 오버','스트레스는 다 못 치웠지만, 오늘의 뉴스만큼은 여기 있습니다');
  window.gtag?.('event','chagok_game_over',{score,lines,level});
  announce(`게임이 끝났습니다. 점수 ${score}점, 최고 기록 ${highScore}점.`);
}

function showStartScreen(){
  running=false;
  cancelAnimationFrame(animId);
  $('#overlay').hidden=false;
  $('#overlay').querySelector('.cg-overlay-title').textContent='차곡차곡';
  $('#overlay').querySelector('.cg-overlay-sub').innerHTML='블록을 움직이고 회전시켜<br>가로줄을 꽉 채우면 사라집니다';
  $('#newsPanel').hidden=true;
  $('#newsPanel').removeAttribute('data-show');
  announce('난이도를 선택하고 시작하세요.');
}

function startGame(){
  const replay=hasStarted;hasStarted=true;
  board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  score=0;lines=0;level=1;dropInterval=700;lastDrop=0;
  bag=[];nextType=drawFromBag();
  spawnNext();
  updateHud();
  $('#overlay').hidden=true;
  $('#startBtn').hidden=false;
  $('#newsPanel').hidden=true;
  $('#newsPanel').removeAttribute('data-show');
  running=true;
  window.gtag?.('event','chagok_start');
  if(replay)window.gtag?.('event','chagok_restart');
  announce('게임을 시작했습니다. 방향키로 블록을 움직이고 회전시켜 가로줄을 채워보세요.');
  canvas.focus({preventScroll:true});
  cancelAnimationFrame(animId);
  animId=requestAnimationFrame(step);
}

const HANDLED_KEYS=new Set(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ']);
document.addEventListener('keydown',e=>{
  if(!HANDLED_KEYS.has(e.key))return;
  e.preventDefault();
  if(!running)return;
  if(e.key==='ArrowLeft'){tryMove(-1,0);draw()}
  else if(e.key==='ArrowRight'){tryMove(1,0);draw()}
  else if(e.key==='ArrowDown'){if(tryMove(0,1)){score+=1;lastDrop=performance.now();updateHud()}draw()}
  else if(e.key==='ArrowUp'){tryRotate();draw()}
  else if(e.key===' '){hardDrop()}
},{passive:false});

function bindTouch(){
  $('.cg-touch').addEventListener('click',e=>{
    const button=e.target.closest('button[data-action]');
    if(!button||!running)return;
    const action=button.dataset.action;
    if(action==='left'){tryMove(-1,0);draw()}
    else if(action==='right'){tryMove(1,0);draw()}
    else if(action==='rotate'){tryRotate();draw()}
    else if(action==='down'){if(tryMove(0,1)){score+=1;lastDrop=performance.now();updateHud()}draw()}
    else if(action==='drop'){hardDrop()}
  });
}

function bindDifficulty(){
  document.querySelectorAll('.cg-diff-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(running)return;
      setDifficulty(btn.dataset.difficulty);
    });
  });
}

$('#startBtn').addEventListener('click',showStartScreen);
$('#overlayStart').addEventListener('click',startGame);
bindTouch();
bindDifficulty();

async function loadNews(){
  try{
    const sources=await Promise.allSettled([
      fetch('../puzzle/data/puzzles.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
      fetch('../words/data/crossword.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
    ]);
    const candidates=[];
    sources.forEach(result=>{
      if(result.status!=='fulfilled')return;
      const data=result.value;
      (data.puzzles||[]).forEach(p=>{
        if(p.title&&p.url)candidates.push({title:p.title,url:p.url});
        (p.words||[]).forEach(w=>{if(w.title&&w.url)candidates.push({title:w.title,url:w.url})});
      });
    });
    const unique=[...new Map(candidates.map(item=>[item.url,item])).values()];
    todayNews=shuffle(unique).slice(0,3);
  }catch(e){
    console.warn('오늘의 뉴스를 불러오지 못해 기본 문장을 사용합니다.',e);
  }
  if(!todayNews.length)todayNews=FALLBACK_NEWS;
}

canvas.width=COLS*CELL;
canvas.height=ROWS*CELL;
board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
document.querySelectorAll('.cg-diff-btn').forEach(btn=>{
  btn.classList.toggle('is-active',btn.dataset.difficulty===difficulty);
});
highScore=loadHighScore();
updateHud();
draw();
loadNews();
