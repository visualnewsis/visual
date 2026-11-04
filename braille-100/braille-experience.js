
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const status = document.getElementById('message-status');
const result = document.getElementById('message-result');
const submit = document.getElementById('message-submit');
const original = document.getElementById('message-original');
const braille = document.getElementById('message-braille');
let revision = 0;
const card = document.getElementById('message-card');
const cardPreview = document.getElementById('message-card-preview');
const shareButton = document.getElementById('message-share');
const saveLink = document.getElementById('message-save');
const shareStatus = document.getElementById('message-share-status');
const makeYourOwnUrl = 'https://visual.newsis.com/braille-100/#your-message';
let cardFile;
let cardBraille;
let cardUrl;

function clearCard() {
  cardFile = undefined;
  cardBraille = undefined;
  if (cardUrl) URL.revokeObjectURL(cardUrl);
  cardUrl = undefined;
  if (card) card.hidden = true;
  cardPreview?.removeAttribute('src');
  saveLink?.removeAttribute('href');
  if (shareButton) shareButton.disabled = true;
  if (shareStatus) shareStatus.textContent = '';
}

// Draw the same Unicode dot masks as the on-page result; never rasterize a font.
async function makeCard(text) {
  const columns = 22;
  const rows = [[]];
  const pushCell = char => {
    if (rows.at(-1).length === columns) rows.push([]);
    rows.at(-1).push(char);
  };
  // Keep words intact when they fit a line; only an overlong word may split.
  for (const [lineIndex, line] of text.replace(/\r\n?/g, '\n').split('\n').entries()) {
    if (lineIndex) rows.push([]);
    let spaces = [];
    for (const token of line.match(/[\u2800 \t]+|[^\u2800 \t]+/gu) || []) {
      if (/^[\u2800 \t]+$/u.test(token)) { spaces = Array.from(token); continue; }
      const word = Array.from(token);
      if (rows.at(-1).length && rows.at(-1).length + spaces.length + word.length > columns) {
        rows.push([]);
        spaces = [];
      }
      if (!rows.at(-1).length) spaces = [];
      spaces.forEach(pushCell);
      word.forEach(pushCell);
      spaces = [];
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = Math.max(760, 400 + rows.length * 100);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Card canvas unavailable');
  ctx.fillStyle = '#f5f2eb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#193f37';
  ctx.font = '400 32px "Noto Sans KR", sans-serif';
  ctx.fillText('점자로 적은 말', 90, 112);
  const top = 205 + Math.max(0, (canvas.height - 400 - rows.length * 100) / 2);
  rows.forEach((row, line) => row.forEach((char, col) => {
    if (/\s/.test(char)) return;
    const mask = char.codePointAt(0) - 0x2800;
    for (let bit = 0; bit < 8; bit++) {
      if (!(mask & (1 << bit))) continue;
      const right = bit >= 3 && bit <= 5 || bit === 7;
      const y = bit < 3 ? bit : bit < 6 ? bit - 3 : 3;
      ctx.beginPath();
      ctx.arc(99 + col * 40 + (right ? 18 : 0), top + line * 100 + y * 18, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }));
  ctx.fillStyle = '#a4b1a6';
  ctx.fillRect(90, canvas.height - 170, 900, 1);
  ctx.fillStyle = '#193f37';
  ctx.font = '500 25px "Noto Sans KR", sans-serif';
  ctx.fillText('내 말도 점자로 · visual.newsis.com/braille-100/', 90, canvas.height - 117);
  ctx.fillStyle = '#59675d';
  ctx.font = '400 22px "Noto Sans KR", sans-serif';
  ctx.fillText('훈맹정음 100년 · VISUAL NEWSIS', 90, canvas.height - 72);
  ctx.font = '400 19px "Noto Sans KR", sans-serif';
  ctx.fillText('자동 점역 · 화면에서 살펴보는 점자', 90, canvas.height - 38);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Card encoding failed')), 'image/jpeg', .94));
  return new File([blob], 'newsis-braille.jpg', {type: 'image/jpeg'});
}

if (card) {
  shareButton.addEventListener('click', async () => {
    if (!cardFile) return;
    const files = [cardFile];
    const currentRevision = revision;
    // Invoke share directly in this user gesture; the image was prepared on conversion.
    if (!navigator.share || !navigator.canShare?.({files})) {
      shareStatus.textContent = '이 브라우저에서는 이미지를 저장해 전해주세요. 기사 링크도 복사할 수 있습니다.';
      return;
    }
    shareButton.disabled = true;
    try {
      await navigator.share({files, title: '점자로 적은 말', text: `${cardBraille}\n\n내 말도 점자로\n${makeYourOwnUrl}`});
      if (revision === currentRevision) shareStatus.textContent = '공유창을 닫았습니다. 앱에 따라 안내 글이 빠졌다면 아래에서 기사 링크를 복사해주세요.';
    } catch (error) {
      if (revision === currentRevision) shareStatus.textContent = error.name === 'AbortError' ? '공유를 취소했습니다.' : '공유창을 열지 못했습니다. 이미지를 저장하거나 기사 링크를 복사해주세요.';
    } finally {
      if (revision === currentRevision && cardFile) shareButton.disabled = false;
    }
  });
  document.getElementById('message-copy-braille').addEventListener('click', async () => {
    if (!cardBraille) return;
    const currentRevision = revision;
    try {
      await navigator.clipboard.writeText(cardBraille);
      if (revision === currentRevision) shareStatus.textContent = '점자 텍스트를 복사했습니다. 메시지에 붙여넣어 전할 수 있습니다.';
    } catch {
      if (revision === currentRevision) shareStatus.textContent = '점자 텍스트를 복사하지 못했습니다. 위 점역 결과의 텍스트를 선택해 복사해주세요.';
    }
  });
  document.getElementById('message-copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(makeYourOwnUrl);
      shareStatus.textContent = '점자 체험 링크를 복사했습니다.';
    } catch {
      shareStatus.textContent = `이 주소를 복사해 주세요: ${makeYourOwnUrl}`;
    }
  });
}


function renderDots(text, target) {
  const fragment = document.createDocumentFragment();
  let word;
  let position = 0;
  for (const char of text) {
    position++;
    if (/\s/.test(char) || char === '\u2800') {
      const space = document.createElement('span');
      space.className = char === '\n' ? 'braille-break' : 'braille-space';
      if (target?.id === 'greeting-dots' && char !== '\n') {
        space.classList.add('greeting-blank');
        space.dataset.position = String(position);
        space.setAttribute('role', 'img');
        space.setAttribute('aria-label', `${position}번째 칸, 빈 칸`);
      }
      fragment.append(space);
      word = undefined;
      continue;
    }
    if (!word) {
      word = document.createElement('span');
      word.className = 'braille-word';
      fragment.append(word);
    }
    const mask = char.codePointAt(0) - 0x2800;
    const cell = document.createElement('span');
    cell.className = 'braille-cell';
    cell.dataset.position = String(position);
    for (const bit of [0,3,1,4,2,5,6,7]) {
      const dot = document.createElement('i');
      dot.className = mask & (1 << bit) ? 'raised' : '';
      // Standard literary Korean output is six-dot; support any eight-dot output faithfully.
      if (bit >= 6 && mask < 64) dot.hidden = true;
      cell.append(dot);
    }
    word.append(cell);
  }
  target.replaceChildren(fragment);
}

for (const id of ['hero-dots', 'return-dots']) {
  const target = document.getElementById(id);
  if (target) renderDots('⠈⠪⠐⠾⠀⠨⠎⠢⠕⠀⠨⠥⠴⠣⠌⠊', target);
}

const greetings = {
  "hello": {
    "text": "안녕하세요",
    "braille": "⠣⠒⠉⠻⠚⠠⠝⠬"
  },
  "welcome": {
    "text": "반갑습니다",
    "braille": "⠘⠒⠫⠃⠠⠪⠃⠉⠕⠊"
  },
  "again": {
    "text": "또 만나요",
    "braille": "⠠⠊⠥⠀⠑⠒⠉⠣⠬"
  },
  "thanks": {
    "text": "감사합니다",
    "braille": "⠫⠢⠇⠚⠃⠉⠕⠊"
  },
  "sorry": {
    "text": "미안합니다",
    "braille": "⠑⠕⠣⠒⠚⠃⠉⠕⠊"
  },
  "okay": {
    "text": "괜찮아요",
    "braille": "⠈⠧⠗⠒⠰⠣⠒⠴⠣⠬"
  },
  "together": {
    "text": "함께해요",
    "braille": "⠚⠢⠠⠈⠝⠚⠗⠬"
  },
  "help": {
    "text": "도와주세요",
    "braille": "⠊⠥⠧⠨⠍⠠⠝⠬"
  },
  "moment": {
    "text": "잠시만요",
    "braille": "⠨⠢⠠⠕⠑⠒⠬"
  }
};
function showGreeting(key) {
  const selected = greetings[key];
  if (!selected) return;
  document.getElementById('greeting-text').textContent = selected.text;
  document.getElementById('greeting-unicode').textContent = selected.braille;
  renderDots(selected.braille, document.getElementById('greeting-dots'));
  const blanks = Array.from(selected.braille).filter(char => char === "\u2800" || /\s/.test(char)).length;
  document.getElementById('greeting-count').textContent = `${selected.text} · 한글 ${Array.from(selected.text.replace(/\s/g, "")).length}글자, 점자 ${Array.from(selected.braille).length}칸${blanks ? ` (빈 칸 ${blanks}칸 포함)` : ""}`;
  document.querySelectorAll('.greeting-choice').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.greeting === key)));
}
if (document.getElementById('greeting-dots')) {
  showGreeting('hello');
  document.querySelectorAll('.greeting-choice').forEach(button => button.addEventListener('click', () => showGreeting(button.dataset.greeting)));
}

if (form) {
  form.hidden = false;
  document.getElementById('message-nojs').hidden = true;
  input.addEventListener('input', () => {
    revision++;
    clearCard();
    if (!result.hidden) { result.hidden = true; status.textContent = '말을 고쳤습니다. 다시 점자로 옮겨보세요.'; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearCard();
    const text = input.value.normalize('NFC').trim();
    if (!text) { status.textContent = '전하고 싶은 말을 먼저 적어주세요.'; input.focus(); return; }
    if (Array.from(text).length > 100) { status.textContent = '한 번에 100자까지 옮길 수 있습니다.'; return; }
    // Limit unsupported input explicitly rather than silently dropping or inventing glyphs.
    if (/[^가-힣a-zA-Z0-9\s.,!?·:;'"()\-]/u.test(text)) {
      status.textContent = '완성된 한글, 영문, 숫자와 기본 문장부호로 적어주세요. 이모지·한자·단독 자모는 아직 지원하지 않습니다.';
      return;
    }
    const currentRevision = revision;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = '당신이 쓴 말을 점자로 옮기고 있습니다.';
    try {
      const {loadBrailleEngine} = await import('./braille-engine.js');
      const translate = await loadBrailleEngine();
      if (revision !== currentRevision) { status.textContent = '말을 고쳤습니다. 다시 점자로 옮겨보세요.'; return; }
      const translated = translate(text);
      if (!translated || /[^\u2800-\u28ff\s]/u.test(translated)) throw new Error('지원하지 않는 표현');
      original.textContent = text;
      braille.textContent = translated;
      result.hidden = false;
      status.textContent = '점자로 옮겼습니다. 아래에서 확인해보세요.';
      try {
        await document.fonts?.ready;
        const file = await makeCard(translated);
        // Production img-src permits data: previews, but intentionally excludes blob:.
        const previewSource = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Card preview unavailable'));
          reader.readAsDataURL(file);
        });
        if (revision !== currentRevision) return;
        cardFile = file;
        cardBraille = translated;
        cardUrl = URL.createObjectURL(file);
        cardPreview.src = previewSource;
        saveLink.href = cardUrl;
        shareButton.disabled = false;
        card.hidden = false;
      } catch {
        if (revision === currentRevision) status.textContent = '점자로 옮겼습니다. 공유 이미지는 준비하지 못했습니다. 다시 시도해주세요.';
      }
    } catch {
      result.hidden = true;
      status.textContent = '지금은 이 문장을 옮기지 못했습니다. 연결을 확인하거나 더 짧고 간단한 문장으로 다시 시도해주세요.';
    } finally {
      form.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });
}
