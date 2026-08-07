const board = document.querySelector('#puzzleBoard');
const loading = document.querySelector('#loading');
const timerElement = document.querySelector('#timer');
const movesElement = document.querySelector('#moves');
const puzzleMeta = document.querySelector('#puzzleMeta');
const hintImage = document.querySelector('#hintImage');
const result = document.querySelector('#result');

let puzzles = [];
let current = null;
let order = [];
let selectedIndex = null;
let moves = 0;
let startedAt = 0;
let timerId = 0;
let lastPuzzleId = '';

function shuffledTiles() {
  const values = Array.from({length: 9}, (_, index) => index);
  do {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [values[index], values[target]] = [values[target], values[index]];
    }
  } while (values.every((value, index) => value === index));
  return values;
}

function imagePosition(tile) {
  const row = Math.floor(tile / 3);
  const column = tile % 3;
  return `${column * 50}% ${row * 50}%`;
}

function renderBoard() {
  board.innerHTML = order.map((tile, index) => `<button class="piece${index === selectedIndex ? ' is-selected' : ''}${tile === index ? ' is-set' : ''}" type="button" data-index="${index}" style="background-image:url('${current.image}');background-position:${imagePosition(tile)}" aria-label="현재 ${index + 1}번 자리에 놓인 사진 조각${index === selectedIndex ? ', 선택됨' : ''}" aria-pressed="${index === selectedIndex}"></button>`).join('');
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  timerElement.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

function isComplete() {
  return order.every((tile, index) => tile === index);
}

function finish() {
  clearInterval(timerId);
  board.querySelectorAll('button').forEach(button => { button.disabled = true; });
  document.querySelector('#resultCategory').textContent = `${current.category} · 조각 완성`;
  document.querySelector('#resultTitle').textContent = current.title;
  document.querySelector('#resultDescription').textContent = current.description;
  document.querySelector('#resultCredit').textContent = current.credit;
  const resultPhoto = document.querySelector('#resultPhoto');
  resultPhoto.style.backgroundImage = `url('${current.image}')`;
  resultPhoto.setAttribute('aria-label', current.title);
  document.querySelector('#articleLink').href = current.url;
  result.hidden = false;
  result.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
  window.gtag?.('event', 'photo_puzzle_complete', {article_id: current.id, moves});
}

function selectPiece(index) {
  if (selectedIndex === null) {
    selectedIndex = index;
    renderBoard();
    return;
  }
  if (selectedIndex === index) {
    selectedIndex = null;
    renderBoard();
    return;
  }
  [order[selectedIndex], order[index]] = [order[index], order[selectedIndex]];
  selectedIndex = null;
  moves += 1;
  movesElement.textContent = String(moves);
  renderBoard();
  if (isComplete()) finish();
}

function choosePuzzle() {
  const candidates = puzzles.filter(puzzle => puzzle.id !== lastPuzzleId);
  current = candidates[Math.floor(Math.random() * candidates.length)] || puzzles[0];
  lastPuzzleId = current.id;
  order = shuffledTiles();
  selectedIndex = null;
  moves = 0;
  movesElement.textContent = '0';
  result.hidden = true;
  puzzleMeta.textContent = '뉴시스 사진 · 9조각';
  hintImage.style.backgroundImage = `url('${current.image}')`;
  loading.hidden = true;
  renderBoard();
  startedAt = Date.now();
  clearInterval(timerId);
  updateTimer();
  timerId = setInterval(updateTimer, 1000);
}

board.addEventListener('click', event => {
  const piece = event.target.closest('.piece');
  if (piece && !piece.disabled) selectPiece(Number(piece.dataset.index));
});

document.querySelector('#hintButton').addEventListener('click', () => {
  hintImage.classList.add('is-visible');
  setTimeout(() => hintImage.classList.remove('is-visible'), 1300);
  window.gtag?.('event', 'photo_puzzle_hint', {article_id: current?.id});
});

document.querySelector('#shuffleButton').addEventListener('click', () => {
  order = shuffledTiles(); selectedIndex = null; moves = 0; movesElement.textContent = '0'; startedAt = Date.now(); renderBoard();
});
document.querySelector('#nextButton').addEventListener('click', choosePuzzle);

fetch('./data/puzzles.json', {cache: 'no-store'})
  .then(response => { if (!response.ok) throw new Error(response.status); return response.json(); })
  .then(data => {
    if (!Array.isArray(data.puzzles) || !data.puzzles.length) throw new Error('empty puzzle bank');
    puzzles = data.puzzles;
    choosePuzzle();
  })
  .catch(() => {
    loading.textContent = '오늘의 사진을 준비하지 못했습니다. 잠시 뒤 다시 찾아주세요.';
    puzzleMeta.textContent = '사진 준비 중';
  });
