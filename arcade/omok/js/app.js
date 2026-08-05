const SIZE = 15;
const EMPTY = 0;
const HUMAN = 1;
const AI = 2;
const DIRECTIONS = [[1,0],[0,1],[1,1],[1,-1]];

const elements = {
  intro: document.querySelector('#introView'), game: document.querySelector('#gameView'), result: document.querySelector('#resultView'),
  start: document.querySelector('#startButton'), replay: document.querySelector('#replayButton'), resign: document.querySelector('#resignButton'),
  finish: document.querySelector('#finishButton'), finishHint: document.querySelector('#finishHint'), share: document.querySelector('#shareButton'),
  canvas: document.querySelector('#board'), thinking: document.querySelector('#thinking'), turn: document.querySelector('#turnIndicator'),
  humanPlayer: document.querySelector('#humanPlayer'), aiPlayer: document.querySelector('#aiPlayer'), moveCount: document.querySelector('#moveCount'),
  elapsed: document.querySelector('#elapsedTime'), message: document.querySelector('#gameMessage'), toast: document.querySelector('#toast')
};

let board = createBoard();
let moves = [];
let humanMoves = [];
let gameOver = false;
let aiThinking = false;
let startedAt = 0;
let timer = null;
let keyboardCursor = { x: 7, y: 7 };
let articles = [];

fetch('./data/articles.json').then(response => response.json()).then(data => { articles = data; }).catch(() => {});

function createBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY)); }

function showView(target) {
  [elements.intro, elements.game, elements.result].forEach(view => { view.hidden = view !== target; view.classList.toggle('is-active', view === target); });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function startGame() {
  board = createBoard(); moves = []; humanMoves = []; gameOver = false; aiThinking = false; keyboardCursor = { x: 7, y: 7 };
  startedAt = Date.now(); clearInterval(timer); timer = setInterval(updateTimer, 1000);
  elements.moveCount.textContent = '0'; elements.finish.disabled = true; elements.finishHint.textContent = '10수 뒤에 열립니다';
  elements.message.innerHTML = '<span>오늘의 첫 수</span><p>중앙과 가장자리, 어느 쪽에서 이야기를 시작하시겠습니까?</p>';
  setTurn('human'); showView(elements.game); resizeCanvas(); drawBoard(); elements.canvas.focus();
}

function resizeCanvas() {
  const size = Math.max(300, Math.floor(elements.canvas.getBoundingClientRect().width));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  elements.canvas.width = size * ratio; elements.canvas.height = size * ratio;
  const ctx = elements.canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); drawBoard();
}

function geometry() {
  const size = elements.canvas.getBoundingClientRect().width;
  const pad = size * .055; return { size, pad, gap: (size - pad * 2) / (SIZE - 1) };
}

function drawBoard() {
  const ctx = elements.canvas.getContext('2d');
  const { size, pad, gap } = geometry();
  ctx.clearRect(0, 0, size, size);
  const wash = ctx.createLinearGradient(0, 0, size, size); wash.addColorStop(0, 'rgba(255,255,255,.12)'); wash.addColorStop(1, 'rgba(83,44,15,.1)'); ctx.fillStyle = wash; ctx.fillRect(0,0,size,size);
  ctx.strokeStyle = 'rgba(47,31,18,.72)'; ctx.lineWidth = 1;
  for (let i = 0; i < SIZE; i++) {
    const p = pad + i * gap; ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(size - pad, p); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, size - pad); ctx.stroke();
  }
  [[3,3],[11,3],[7,7],[3,11],[11,11]].forEach(([x,y]) => { ctx.beginPath(); ctx.fillStyle = '#3b2818'; ctx.arc(pad+x*gap,pad+y*gap,Math.max(2,gap*.07),0,Math.PI*2); ctx.fill(); });
  moves.forEach((move,index) => drawStone(ctx, move.x, move.y, move.player, index === moves.length - 1));
  if (!gameOver && !aiThinking && board[keyboardCursor.y][keyboardCursor.x] === EMPTY) {
    ctx.strokeStyle = 'rgba(165,66,47,.9)'; ctx.lineWidth = 2; ctx.strokeRect(pad+keyboardCursor.x*gap-gap*.33,pad+keyboardCursor.y*gap-gap*.33,gap*.66,gap*.66);
  }
}

function drawStone(ctx, x, y, player, latest) {
  const { pad, gap } = geometry(); const cx = pad+x*gap, cy = pad+y*gap, radius = gap*.42;
  const gradient = ctx.createRadialGradient(cx-radius*.35,cy-radius*.4,radius*.08,cx,cy,radius);
  if (player === HUMAN) { gradient.addColorStop(0,'#667069'); gradient.addColorStop(.42,'#1c221e'); gradient.addColorStop(1,'#030504'); }
  else { gradient.addColorStop(0,'#fff'); gradient.addColorStop(.5,'#e6e2d7'); gradient.addColorStop(1,'#aaa69a'); }
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.38)'; ctx.shadowBlur=gap*.18; ctx.shadowOffsetY=gap*.11; ctx.fillStyle=gradient; ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.fill(); ctx.restore();
  if (latest) { ctx.fillStyle = player === HUMAN ? '#d8b36d' : '#8b3326'; ctx.beginPath(); ctx.arc(cx,cy,Math.max(2,gap*.075),0,Math.PI*2); ctx.fill(); }
}

function positionFromPointer(event) {
  const rect = elements.canvas.getBoundingClientRect(); const { pad, gap } = geometry();
  const x = Math.round((event.clientX - rect.left - pad) / gap); const y = Math.round((event.clientY - rect.top - pad) / gap);
  return { x: Math.max(0,Math.min(SIZE-1,x)), y: Math.max(0,Math.min(SIZE-1,y)) };
}

function placeHuman(x,y) {
  if (gameOver || aiThinking || board[y][x] !== EMPTY) return;
  putStone(x,y,HUMAN); humanMoves.push({x,y}); keyboardCursor={x,y};
  if (checkWin(x,y,HUMAN)) return endGame('win');
  if (moves.length === SIZE*SIZE) return endGame('draw');
  updateProgress(); setTurn('ai'); aiThinking = true; elements.thinking.hidden = false;
  setTimeout(aiMove, 420 + Math.random()*320);
}

function putStone(x,y,player) { board[y][x]=player; moves.push({x,y,player}); elements.moveCount.textContent=String(moves.length); drawBoard(); }

function aiMove() {
  if (gameOver) return;
  const move = chooseAiMove(); putStone(move.x,move.y,AI);
  aiThinking=false; elements.thinking.hidden=true;
  if (checkWin(move.x,move.y,AI)) return endGame('lose');
  if (moves.length === SIZE*SIZE) return endGame('draw');
  updateProgress(); setTurn('human'); elements.message.innerHTML='<span>판세 읽기</span><p>상대의 뜻을 살피되, 당신의 흐름을 놓치지 마세요.</p>'; elements.canvas.focus();
}

function chooseAiMove() {
  if (!moves.length) return {x:7,y:7};
  const candidates=[];
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(board[y][x]===EMPTY && hasNeighbor(x,y,2)) {
    const win=scorePoint(x,y,AI), block=scorePoint(x,y,HUMAN); const center=14-(Math.abs(x-7)+Math.abs(y-7));
    candidates.push({x,y,score:win*1.06+block*.98+center*.8+Math.random()*4});
  }
  candidates.sort((a,b)=>b.score-a.score); return candidates[0] || {x:7,y:7};
}

function hasNeighbor(x,y,distance) { for(let yy=Math.max(0,y-distance);yy<=Math.min(SIZE-1,y+distance);yy++) for(let xx=Math.max(0,x-distance);xx<=Math.min(SIZE-1,x+distance);xx++) if(board[yy][xx]!==EMPTY) return true; return false; }

function scorePoint(x,y,player) {
  let total=0;
  for(const [dx,dy] of DIRECTIONS){
    let count=1, open=0;
    for(const sign of [-1,1]){ let step=1; while(inBounds(x+dx*step*sign,y+dy*step*sign)&&board[y+dy*step*sign][x+dx*step*sign]===player){count++;step++;} if(inBounds(x+dx*step*sign,y+dy*step*sign)&&board[y+dy*step*sign][x+dx*step*sign]===EMPTY) open++; }
    if(count>=5) total+=100000; else if(count===4&&open===2) total+=18000; else if(count===4) total+=7000; else if(count===3&&open===2) total+=2600; else if(count===3) total+=650; else if(count===2&&open===2) total+=180; else total+=count*12+open*3;
  }
  return total;
}

function checkWin(x,y,player){ return DIRECTIONS.some(([dx,dy])=>1+countLine(x,y,dx,dy,player)+countLine(x,y,-dx,-dy,player)>=5); }
function countLine(x,y,dx,dy,player){ let n=0; x+=dx;y+=dy; while(inBounds(x,y)&&board[y][x]===player){n++;x+=dx;y+=dy;} return n; }
function inBounds(x,y){ return x>=0&&x<SIZE&&y>=0&&y<SIZE; }

function setTurn(turn){ const human=turn==='human'; elements.turn.classList.toggle('is-ai',!human); elements.turn.querySelector('span').textContent=human?'당신의 차례':'상대가 수를 읽는 중'; elements.humanPlayer.classList.toggle('is-current',human); elements.aiPlayer.classList.toggle('is-current',!human); }

function updateProgress(){ const count=humanMoves.length; if(count>=10){elements.finish.disabled=false;elements.finishHint.textContent='지금 분석할 수 있습니다';}else{elements.finishHint.textContent=`${10-count}수 뒤에 열립니다`;} }
function updateTimer(){ const sec=Math.floor((Date.now()-startedAt)/1000); elements.elapsed.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }

function endGame(state='read') {
  if(gameOver) return; gameOver=true; aiThinking=false; clearInterval(timer); elements.thinking.hidden=true; drawBoard(); renderResult(state);
}

function analyzePlay(){
  const count=Math.max(1,humanMoves.length); let center=0,edge=0,attack=0;
  humanMoves.forEach(({x,y})=>{const dist=Math.max(Math.abs(x-7),Math.abs(y-7));if(dist<=3)center++;if(dist>=5)edge++;if(neighborsOf(x,y,AI)>=1)attack++;});
  const values={center:Math.round(center/count*100),edge:Math.round(edge/count*100),attack:Math.round(attack/count*100)};
  const profile=Object.entries(values).sort((a,b)=>b[1]-a[1])[0][0]; return {...values,profile};
}
function neighborsOf(x,y,player){let n=0;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(inBounds(xx,yy)&&board[yy][xx]===player)n++;return n;}

function renderResult(state){
  const analysis=analyzePlay(); const copy={
    center:{name:'중심을 지키는 수',title:'흔들리지 않는 중심이 다음 장면을 만듭니다.',description:'당신은 판의 중심에서 흐름을 정리했습니다. 복잡한 상황일수록 먼저 기준을 세우는 사람입니다.'},
    attack:{name:'흐름을 바꾸는 수',title:'작은 틈을 발견하면 망설이지 않는군요.',description:'당신은 상대의 움직임 가까이에서 변화를 만들었습니다. 오늘은 숫자와 신호 뒤의 원인을 좇아볼 때입니다.'},
    edge:{name:'바깥을 넓히는 수',title:'가장자리에서 시작된 수가 판 전체를 움직입니다.',description:'당신은 당장의 중심보다 앞으로 열릴 공간을 보았습니다. 멀리서 시작된 변화가 어디까지 닿는지 살펴보세요.'}
  }[analysis.profile];
  const stateCopy={win:'당신의 오목 · 승',lose:'충무로 기사의 오목 · 승',draw:'무승부',read:'오늘의 수를 먼저 읽었습니다'}[state];
  document.querySelector('#resultState').textContent=`${stateCopy} · ${moves.length}수`;
  document.querySelector('#resultTitle').textContent=copy.title; document.querySelector('#resultSummary').textContent=copy.description;
  document.querySelector('#styleName').textContent=copy.name; document.querySelector('#styleDescription').textContent='승패보다 중요한 것은 당신이 반복해서 선택한 자리입니다. 그 선택을 오늘의 뉴스와 연결했습니다.';
  setStat('center',analysis.center);setStat('attack',analysis.attack);setStat('edge',analysis.edge); renderMiniBoard(); renderArticle(analysis.profile); showView(elements.result);
}

function setStat(name,value){document.querySelector(`#${name}Value`).textContent=`${value}%`;requestAnimationFrame(()=>{document.querySelector(`#${name}Bar`).style.width=`${value}%`;});}
function renderMiniBoard(){const el=document.querySelector('#miniBoard');el.innerHTML='';humanMoves.forEach(({x,y})=>{const stone=document.createElement('i');stone.className='mini-stone';stone.style.left=`${x/14*100}%`;stone.style.top=`${y/14*100}%`;el.append(stone);});}
function renderArticle(profile){const article=articles.find(item=>item.profile===profile)||articles[0];if(!article)return;const card=document.querySelector('#storyCard');card.href=article.url;document.querySelector('#storyImage').style.backgroundImage=`linear-gradient(90deg,rgba(10,15,12,.08),rgba(10,15,12,.18)),url('${article.image}')`;document.querySelector('#storyIssue').textContent=article.issue;document.querySelector('#storyHeadline').textContent=article.title;document.querySelector('#storyDescription').textContent=article.description;}

async function shareResult(){const text=`뉴스 오목에서 오늘의 수를 읽었습니다. ${document.querySelector('#resultTitle').textContent}`;try{if(navigator.share){await navigator.share({title:'뉴스 오목 — 한 수 앞의 뉴스',text,url:location.href});}else{await navigator.clipboard.writeText(`${text}\n${location.href}`);showToast('결과 링크를 복사했습니다.');}}catch(error){if(error.name!=='AbortError')showToast('공유하지 못했습니다. 다시 시도해주세요.');}}
function showToast(text){elements.toast.textContent=text;setTimeout(()=>elements.toast.textContent='',2400);}

elements.start.addEventListener('click',startGame);elements.replay.addEventListener('click',startGame);elements.resign.addEventListener('click',startGame);elements.finish.addEventListener('click',()=>endGame('read'));elements.share.addEventListener('click',shareResult);
elements.canvas.addEventListener('pointerup',event=>{const {x,y}=positionFromPointer(event);placeHuman(x,y);});
elements.canvas.addEventListener('keydown',event=>{if(gameOver||aiThinking)return;const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(keys[event.key]){event.preventDefault();keyboardCursor.x=Math.max(0,Math.min(14,keyboardCursor.x+keys[event.key][0]));keyboardCursor.y=Math.max(0,Math.min(14,keyboardCursor.y+keys[event.key][1]));drawBoard();}else if(event.key==='Enter'||event.key===' '){event.preventDefault();placeHuman(keyboardCursor.x,keyboardCursor.y);}});
window.addEventListener('resize',()=>{if(!elements.game.hidden)resizeCanvas();});
