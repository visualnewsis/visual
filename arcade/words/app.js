const $=selector=>document.querySelector(selector);
const board=$('#board'),loading=$('#loading'),game=$('#game'),error=$('#error'),progress=$('#progress');
let data,words=[],cells=new Map(),activeWord=null,solved=new Set(),puzzles=[],currentPuzzleIndex=0;

function key(row,col){return `${row}-${col}`}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))}
function wordCells(word){return Array.from({length:[...word.answer].length},(_,index)=>({row:word.row+(word.direction==='down'?index:0),col:word.col+(word.direction==='across'?index:0)}))}
function memberships(row,col){return words.filter(word=>wordCells(word).some(cell=>cell.row===row&&cell.col===col))}

function selectWord(word,focus=true){
  activeWord=word;
  document.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('selected'));
  document.querySelectorAll('.clue-button').forEach(button=>button.classList.toggle('active',Number(button.dataset.number)===word.number));
  wordCells(word).forEach(({row,col})=>cells.get(key(row,col))?.classList.add('selected'));
  if(focus){
    const first=wordCells(word).find(({row,col})=>!cells.get(key(row,col))?.querySelector('input').value)||wordCells(word)[0];
    cells.get(key(first.row,first.col))?.querySelector('input').focus();
  }
}

function move(row,col){
  if(!activeWord)return;
  const list=wordCells(activeWord),index=list.findIndex(cell=>cell.row===row&&cell.col===col),next=list[index+1];
  if(next)cells.get(key(next.row,next.col))?.querySelector('input').focus();
}

function checkWords(){
  solved.clear();
  document.querySelectorAll('.cell.correct').forEach(cell=>cell.classList.remove('correct'));
  words.forEach(word=>{
    const letters=[...word.answer];
    const correct=wordCells(word).every(({row,col},index)=>cells.get(key(row,col))?.querySelector('input').value===letters[index]);
    if(correct){solved.add(word.number);wordCells(word).forEach(({row,col})=>cells.get(key(row,col))?.classList.add('correct'))}
  });
  progress.textContent=`${solved.size} / ${words.length}`;
  if(solved.size===words.length)finish();
}

function commitCell(input,row,col){
  const value=[...input.value.normalize('NFC')].pop()||'';
  input.value=value;
  if(value){move(row,col);checkWords()}
}

function focusCell(row,col){
  const options=memberships(row,col);
  if(!options.length)return;
  if(!activeWord||!options.includes(activeWord))selectWord(options[0],false);
}

function cycleCell(row,col){
  const options=memberships(row,col);
  if(options.length<2)return;
  selectWord(activeWord===options[0]?options[1]:options[0],false);
}

function renderBoard(){
  board.style.gridTemplateColumns=`repeat(${data.cols},1fr)`;
  board.style.gridTemplateRows=`repeat(${data.rows},1fr)`;
  board.style.aspectRatio=`${data.cols} / ${data.rows}`;
  const numbers=new Map();
  words.forEach(word=>{
    const start=key(word.row,word.col),list=numbers.get(start)||[];
    numbers.set(start,[...list,word.number]);
  });
  for(let row=0;row<data.rows;row++)for(let col=0;col<data.cols;col++){
    const cell=document.createElement('div');cell.className='cell';cell.setAttribute('role','gridcell');
    if(memberships(row,col).length){
      cell.classList.add('active');
      const input=document.createElement('input');
      let composing=false,ignoreFinalInput=false;
      input.inputMode='text';input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;
      input.setAttribute('aria-label',`${row+1}행 ${col+1}열`);
      input.addEventListener('focus',()=>focusCell(row,col));
      cell.addEventListener('click',()=>cycleCell(row,col));
      input.addEventListener('compositionstart',()=>{composing=true});
      input.addEventListener('compositionend',event=>{
        composing=false;
        input.value=event.data||input.value;
        commitCell(input,row,col);
        ignoreFinalInput=true;
        queueMicrotask(()=>{ignoreFinalInput=false});
      });
      input.addEventListener('input',event=>{
        if(composing||event.isComposing||ignoreFinalInput)return;
        commitCell(input,row,col);
      });
      input.addEventListener('keydown',event=>{
        if(event.isComposing)return;
        if(event.key==='Backspace'&&!input.value&&activeWord){
          const list=wordCells(activeWord),index=list.findIndex(item=>item.row===row&&item.col===col),previous=list[index-1];
          if(previous){event.preventDefault();const target=cells.get(key(previous.row,previous.col)).querySelector('input');target.value='';target.focus()}
        }
      });
      cell.append(input);
      if(numbers.has(key(row,col))){const sup=document.createElement('sup');sup.textContent=numbers.get(key(row,col)).join('·');cell.append(sup)}
    }
    cells.set(key(row,col),cell);board.append(cell);
  }
}

function renderClues(){
  const list=$('#clueList');
  [...words].sort((a,b)=>a.number-b.number).forEach(word=>{
    const item=document.createElement('li'),row=document.createElement('div'),button=document.createElement('button'),link=document.createElement('a');
    row.className='clue-row';button.className='clue-button';button.type='button';button.dataset.number=word.number;
    button.innerHTML=`<b>${word.number}</b><span class="clue-copy"><strong>${escapeHtml(word.definition||'오늘의 기사에서 핵심 내용을 나타내는 낱말.')}</strong><small><em>기사 속 맥락</em><span>${escapeHtml(word.clue)}</span></small></span>`;
    button.addEventListener('click',()=>selectWord(word));
    link.className='article-link';link.href=word.url;link.target='_blank';link.rel='noopener';link.textContent='힌트 보기';
    link.addEventListener('click',()=>window.gtag?.('event','crossword_article_click',{word:word.answer,title:word.title}));
    row.append(button,link);item.append(row);list.append(item);
  });
}

function hint(){
  if(!activeWord)selectWord(words[0],false);
  const letters=[...activeWord.answer];
  const target=wordCells(activeWord).find(({row,col},index)=>cells.get(key(row,col)).querySelector('input').value!==letters[index]);
  if(!target)return;
  const index=wordCells(activeWord).findIndex(cell=>cell.row===target.row&&cell.col===target.col),input=cells.get(key(target.row,target.col)).querySelector('input');
  input.value=letters[index];input.focus();checkWords();window.gtag?.('event','crossword_hint');
}

function loadPuzzle(index){
  currentPuzzleIndex=index;
  data=puzzles[index];
  words=data.words;
  cells=new Map();
  activeWord=null;
  solved=new Set();

  board.innerHTML='';
  $('#clueList').innerHTML='';
  $('#articles').innerHTML='';
  $('#result').hidden=true;

  renderBoard();
  renderClues();
  progress.textContent=`0 / ${words.length}`;
  selectWord(words[0],false);
  window.scrollTo({top:document.querySelector('#puzzle').offsetTop,behavior:'smooth'});
}

function nextPuzzle(){
  if(puzzles.length<2)return;
  let next=currentPuzzleIndex;
  while(next===currentPuzzleIndex){
    next=Math.floor(Math.random()*puzzles.length);
  }
  loadPuzzle(next);
  window.gtag?.('event','crossword_next_puzzle',{puzzle:next+1});
}

function finish(){
  const unique=[...new Map(words.map(word=>[word.url,word])).values()].slice(0,6);
  $('#articles').innerHTML=
    unique.map(word=>`<a href="${word.url}" target="_blank" rel="noopener"><small>${word.category} · ${word.answer}</small><b>${word.title} ↗</b></a>`).join('')
    + (puzzles.length>1?'<button id="nextPuzzle" type="button">다른 문제 풀기</button>':'');

  $('#result').hidden=false;

  document.querySelector('#nextPuzzle')?.addEventListener('click',nextPuzzle);

  $('#result').scrollIntoView({behavior:'smooth'});
  window.gtag?.('event','crossword_complete',{words:words.length});
}

async function init(){
  try{
    const response=await fetch('./data/crossword.json',{cache:'no-store'});
    if(!response.ok)throw new Error(response.status);

    const payload=await response.json();

    puzzles=Array.isArray(payload.puzzles)&&payload.puzzles.length
      ? payload.puzzles
      : [payload];

    puzzles=puzzles.filter(puzzle=>
      Array.isArray(puzzle.words)&&puzzle.words.length>=7
    );

    if(!puzzles.length)throw new Error('invalid crossword');

    currentPuzzleIndex=Math.floor(Math.random()*puzzles.length);
    data=puzzles[currentPuzzleIndex];
    words=data.words;

    renderBoard();
    renderClues();
    progress.textContent=`0 / ${words.length}`;
    loading.hidden=true;
    game.hidden=false;
    selectWord(words[0],false);

  }catch(reason){
    console.error(reason);
    loading.hidden=true;
    error.hidden=false;
  }
}

$('#hint').addEventListener('click',hint);
$('#check').addEventListener('click',()=>{checkWords();if(solved.size<words.length){const first=words.find(word=>!solved.has(word.number));if(first)selectWord(first);window.gtag?.('event','crossword_check',{solved:solved.size})}});
init();
