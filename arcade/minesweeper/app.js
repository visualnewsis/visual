const $=selector=>document.querySelector(selector);
const COLS=9,ROWS=9,MINES=10;
let cells=[],firstClick=true,gameOver=false,revealedCount=0,flagCount=0,flagMode=false;
let timerInterval=null,seconds=0,todayNews=[];

const board=$('#board'),mineCounter=$('#mineCounter'),timerEl=$('#timer');
const faceParts=$('#faceParts'),faceBtn=$('#faceBtn'),flagModeBtn=$('#flagModeBtn');
const newsPanel=$('#newsPanel'),newsList=$('#newsList');

const numColors={1:'#0000ff',2:'#008200',3:'#ff0000',4:'#000084',5:'#840000',6:'#008284',7:'#840084',8:'#757575'};
const FALLBACK_NEWS=[
  {title:'오늘의 뉴스는 제목에서 시작됩니다',url:'https://www.newsis.com/'},
  {title:'읽는 속도와 쓰는 속도 사이',url:'https://www.newsis.com/'},
  {title:'진짜 뉴스는 늘 여기에 있습니다',url:'https://www.newsis.com/'}
];

function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function idx(r,c){return r*COLS+c}
function neighbors(r,c){
  const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(dr===0&&dc===0)continue;
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)out.push(idx(nr,nc));
  }
  return out;
}

function faceNormal(){faceParts.innerHTML='<circle cx="12" cy="15" r="2" fill="#000"/><circle cx="24" cy="15" r="2" fill="#000"/><path d="M10 23 Q18 29 26 23" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'}
function faceWorried(){faceParts.innerHTML='<circle cx="12" cy="15" r="2.5" fill="#000"/><circle cx="24" cy="15" r="2.5" fill="#000"/><ellipse cx="18" cy="25" rx="3" ry="4" fill="#000"/>'}
function faceDead(){faceParts.innerHTML='<path d="M9 12 L15 18 M15 12 L9 18" stroke="#000" stroke-width="2" stroke-linecap="round"/><path d="M21 12 L27 18 M27 12 L21 18" stroke="#000" stroke-width="2" stroke-linecap="round"/><path d="M10 25 Q18 20 26 25" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'}
function faceWin(){faceParts.innerHTML='<rect x="7" y="12" width="9" height="4" fill="#000"/><rect x="20" y="12" width="9" height="4" fill="#000"/><rect x="16" y="13" width="4" height="2" fill="#000"/><path d="M10 23 Q18 30 26 23" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'}

function buildCells(){
  cells=[];
  for(let i=0;i<ROWS*COLS;i++)cells.push({mine:false,revealed:false,flagged:false,adj:0,el:null});
}

function placeMines(excludeIdx){
  const exclude=[excludeIdx,...neighbors(Math.floor(excludeIdx/COLS),excludeIdx%COLS)];
  let placed=0;
  while(placed<MINES){
    const p=Math.floor(Math.random()*cells.length);
    if(cells[p].mine||exclude.includes(p))continue;
    cells[p].mine=true;placed++;
  }
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(cells[idx(r,c)].mine)continue;
    let count=0;
    neighbors(r,c).forEach(n=>{if(cells[n].mine)count++});
    cells[idx(r,c)].adj=count;
  }
}

function render(){
  board.innerHTML='';
  cells.forEach((cell,i)=>{
    const btn=document.createElement('div');
    btn.className='ms-cell';
    btn.addEventListener('click',()=>onCellTap(i));
    btn.addEventListener('contextmenu',e=>{e.preventDefault();onFlag(i)});
    cell.el=btn;
    board.appendChild(btn);
  });
}

function onCellTap(i){
  if(flagMode){onFlag(i)}else{onOpen(i)}
}

function updateMineCounter(){
  const remaining=MINES-flagCount;
  mineCounter.textContent=(remaining<0?'-'+String(Math.abs(remaining)).padStart(2,'0'):String(remaining).padStart(3,'0'));
}

function startTimer(){
  seconds=0;timerEl.textContent='000';
  timerInterval=setInterval(()=>{seconds++;timerEl.textContent=String(Math.min(seconds,999)).padStart(3,'0')},1000);
}
function stopTimer(){clearInterval(timerInterval)}

function onFlag(i){
  if(gameOver||cells[i].revealed)return;
  const cell=cells[i];
  cell.flagged=!cell.flagged;
  flagCount+=cell.flagged?1:-1;
  updateMineCounter();
  cell.el.innerHTML=cell.flagged?'<span class="ms-flag"></span>':'';
}

function onOpen(i){
  if(gameOver||cells[i].flagged||cells[i].revealed)return;
  if(firstClick){placeMines(i);firstClick=false;startTimer()}
  if(cells[i].mine){loseGame(i);return}
  floodOpen(i);
  checkWin();
}

function floodOpen(start){
  const stack=[start];
  while(stack.length){
    const i=stack.pop();
    const cell=cells[i];
    if(cell.revealed||cell.flagged)continue;
    cell.revealed=true;revealedCount++;
    cell.el.classList.add('revealed');
    if(cell.adj>0){
      cell.el.textContent=cell.adj;
      cell.el.style.color=numColors[cell.adj];
    }else{
      cell.el.textContent='';
      const r=Math.floor(i/COLS),c=i%COLS;
      neighbors(r,c).forEach(n=>{if(!cells[n].revealed&&!cells[n].mine)stack.push(n)});
    }
  }
}

function loseGame(clickedIdx){
  gameOver=true;stopTimer();faceDead();
  cells.forEach((cell,i)=>{
    if(cell.mine){
      cell.el.classList.add('revealed');
      if(i===clickedIdx)cell.el.classList.add('mine-hit');
      cell.el.innerHTML='<span class="ms-mine-dot"></span>';
    }
  });
  showNews('지뢰를 밟았어요.','뉴스만큼은 (지뢰)가짜뉴스가 아닌\n진짜 뉴스를 확인하세요');
  window.gtag?.('event','minesweeper_lose');
}

function checkWin(){
  if(revealedCount===ROWS*COLS-MINES){
    gameOver=true;stopTimer();faceWin();
    cells.forEach(cell=>{
      if(cell.mine&&!cell.flagged){cell.flagged=true;cell.el.innerHTML='<span class="ms-flag"></span>'}
    });
    flagCount=MINES;updateMineCounter();
    showNews('승리! 지뢰를 모두 찾았어요!','이제 지뢰(가짜뉴스)를 피해\n진짜 뉴스만 볼 수 있어요');
    window.gtag?.('event','minesweeper_win',{time:seconds});
  }
}

function showNews(title,subtitle){
  $('#newsTitle').textContent=title;
  $('#newsSubtitle').innerHTML=subtitle.split('\n').join('<br>');
  newsList.innerHTML='';
  todayNews.forEach(n=>{
    const a=document.createElement('a');
    a.href=n.url;a.textContent=n.title;a.target='_blank';a.rel='noopener';
    newsList.appendChild(a);
  });
  newsPanel.hidden=false;
  newsPanel.setAttribute('data-show','');
}

function resetGame(){
  gameOver=false;firstClick=true;revealedCount=0;flagCount=0;
  stopTimer();timerEl.textContent='000';
  mineCounter.textContent=String(MINES).padStart(3,'0');
  faceNormal();
  newsPanel.hidden=true;newsPanel.removeAttribute('data-show');
  buildCells();render();
}

faceBtn.addEventListener('click',resetGame);
faceBtn.addEventListener('mousedown',()=>{if(!gameOver)faceWorried()});
faceBtn.addEventListener('mouseup',()=>{if(!gameOver)faceNormal()});

flagModeBtn.addEventListener('click',()=>{
  flagMode=!flagMode;
  flagModeBtn.setAttribute('aria-pressed',String(flagMode));
});

async function loadNews(){
  try{
    const res=await fetch('../puzzle/data/puzzles.json',{cache:'no-store'});
    if(!res.ok)throw new Error(res.status);
    const data=await res.json();
    const items=(data.puzzles||[]).filter(p=>p.title&&p.url);
    todayNews=shuffle(items).slice(0,3);
  }catch(e){
    console.warn('오늘의 뉴스를 불러오지 못해 기본 문장을 사용합니다.',e);
  }
  if(!todayNews.length)todayNews=FALLBACK_NEWS;
}

faceNormal();
mineCounter.textContent=String(MINES).padStart(3,'0');
buildCells();render();
loadNews();
