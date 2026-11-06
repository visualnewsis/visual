
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const status = document.getElementById('message-status');
const result = document.getElementById('message-result');
const submit = document.getElementById('message-submit');
const original = document.getElementById('message-original');
const braille = document.getElementById('message-braille');
const dots = document.getElementById('message-dots');
let revision = 0;

function renderDots(text, target = dots) {
  const fragment = document.createDocumentFragment();
  let word;
  for (const char of text) {
    if (/\s/.test(char) || char === '\u2800') {
      const space = document.createElement('span');
      space.className = char === '\n' ? 'braille-break' : 'braille-space';
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
  thanks: {text:'감사합니다', braille:'⠫⠢⠇⠚⠃⠉⠕⠊'},
  hello: {text:'안녕하세요', braille:'⠣⠒⠉⠻⠚⠠⠝⠬'},
  welcome: {text:'반갑습니다', braille:'⠘⠒⠫⠃⠠⠪⠃⠉⠕⠊'}
};
function showGreeting(key) {
  const selected = greetings[key];
  if (!selected) return;
  document.getElementById('greeting-text').textContent = selected.text;
  document.getElementById('greeting-unicode').textContent = selected.braille;
  renderDots(selected.braille, document.getElementById('greeting-dots'));
  document.getElementById('greeting-count').textContent = `${selected.text} · 한글 ${Array.from(selected.text).length}글자, 점자 ${Array.from(selected.braille).length}칸`;
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
    if (!result.hidden) { result.hidden = true; status.textContent = '말을 고쳤습니다. 다시 점자로 옮겨보세요.'; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
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
      const {loadBrailleEngine} = await import('./braille-engine.mjs');
      const translate = await loadBrailleEngine();
      if (revision !== currentRevision) { status.textContent = '말을 고쳤습니다. 다시 점자로 옮겨보세요.'; return; }
      const translated = translate(text);
      if (!translated || /[^\u2800-\u28ff\s]/u.test(translated)) throw new Error('지원하지 않는 표현');
      original.textContent = text;
      braille.textContent = translated;
      renderDots(translated);
      result.hidden = false;
      status.textContent = '점자로 옮겼습니다. 아래에서 확인해보세요.';
    } catch {
      result.hidden = true;
      status.textContent = '지금은 이 문장을 옮기지 못했습니다. 연결을 확인하거나 더 짧고 간단한 문장으로 다시 시도해주세요.';
    } finally {
      form.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });
}
