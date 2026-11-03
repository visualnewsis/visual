import './braille-experience.js';
const toggle = document.getElementById('dot-one');
const fallback = document.getElementById('dot-one-fallback');
const flip = document.getElementById('flip-paper');
const paper = document.getElementById('slate-paper');
const board = paper.querySelector('.learn-six');
let reading = false;
let dotOne = false;
function updateSlate(announce = true) {
  paper.dataset.face = reading ? 'read' : 'write';
  document.getElementById('slate-face').textContent = reading ? '읽는 면' : '찍는 면';
  document.getElementById('slate-side').textContent = reading ? '종이 앞면' : '종이 뒷면';
  document.getElementById('slate-direction').textContent = reading ? '왼쪽에서 오른쪽으로 읽습니다 →' : '← 오른쪽에서 왼쪽으로 씁니다';
  document.getElementById('slate-surface').textContent = reading ? '찍은 자국이 반대편에서 솟은 점이 됩니다.' : '찍은 곳은 오목한 자국이 됩니다.';
  board.setAttribute('aria-label', (reading ? '읽는 면. 왼쪽 위부터 1·2·3점, 오른쪽 위부터 4·5·6점. 솟은 점 ' : '찍는 면. 왼쪽 위부터 4·5·6점, 오른쪽 위부터 1·2·3점. 찍힌 점 ') + (dotOne ? '1·4점.' : '4점.'));
  toggle.hidden = reading;
  fallback.hidden = !reading;
  toggle.setAttribute('aria-pressed', String(dotOne));
  fallback.classList.toggle('fixed-raised', dotOne);
  flip.setAttribute('aria-label', (reading ? '찍는 면으로' : '읽는 면으로') + ' 종이 뒤집어 보기');
  document.getElementById('slate-instruction').textContent = reading ? '읽는 면입니다. 점을 바꾸려면 다시 뒤집어주세요.' : '4점은 미리 찍어두었습니다. 오른쪽 위의 1번 점을 눌러보세요.';
  const letter = document.getElementById('dot-letter');
  letter.firstChild.textContent = dotOne ? 'ㄴ ' : 'ㄱ ';
  letter.querySelector('span').textContent = dotOne ? '⠉' : '⠈';
  const description = (dotOne ? '읽는 면에서 1·4점으로 적은 첫소리 ㄴ입니다.' : '읽는 면에서 4점으로 적은 첫소리 ㄱ입니다.');
  document.getElementById('dot-description').textContent = description;
  if (announce) document.getElementById('slate-status').textContent = (reading ? '읽는 면입니다. ' : '찍는 면입니다. ') + description + (dotOne ? ' 1번 점이 찍혀 있습니다.' : ' 1번 점은 찍히지 않았습니다.');
}
toggle.addEventListener('click', () => { dotOne = !dotOne; updateSlate(); });
flip.addEventListener('click', () => { reading = !reading; updateSlate(); });
flip.hidden = false;
updateSlate(false);
// The shared header is inserted before page content; preserve the skip link's first tab stop.
const skipLink = document.querySelector('.skip-link');
if (skipLink) document.body.prepend(skipLink);
function inspect(cell,index){document.querySelectorAll('#greeting-dots .braille-cell').forEach(x=>x.setAttribute('aria-pressed',String(x===cell)));const copy=cell.cloneNode(true);const visual=document.createElement('span');visual.className='braille-cell';visual.append(...copy.childNodes);document.getElementById('inspect-dots').replaceChildren(visual);document.getElementById('inspect-description').textContent=document.getElementById('greeting-text').textContent+' · '+(cell.dataset.position||index+1)+'번째 칸 · 솟은 점 '+cell.dataset.points;}
document.getElementById('cell-inspector').hidden=false;
function prepareCells(){const target=document.getElementById('greeting-dots');target.removeAttribute('aria-hidden');target.setAttribute('role','group');target.setAttribute('aria-label','선택한 말의 점자 칸 살펴보기');[...target.querySelectorAll('.braille-cell')].forEach((cell,index)=>{const button=document.createElement('button');button.type='button';button.className='braille-cell';const order=[1,4,2,5,3,6,7,8];const points=[...cell.children].flatMap((dot,i)=>dot.classList.contains('raised')?[order[i]]:[]).sort((a,b)=>a-b).join('·');button.dataset.points=points;button.dataset.position=cell.dataset.position;button.setAttribute('aria-label',(cell.dataset.position||index+1)+'번째 칸, 솟은 점 '+points);button.setAttribute('aria-pressed','false');button.append(...cell.childNodes);cell.replaceWith(button);button.addEventListener('click',()=>inspect(button,index));});const first=target.querySelector('button');if(first)inspect(first,0);}
prepareCells();document.querySelectorAll('.greeting-choice').forEach(button=>button.addEventListener('click',prepareCells));
