const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

// Run the production scripts against a small DOM/timer harness. No network or build step.
function game(name) {
  let now = 0, timerId = 0;
  const elements = new Map(), intervals = new Map(), timeouts = new Map();
  const paint = new Proxy({measureText: text => ({width: text.length * 8})}, {
    get(target, key) { return key in target ? target[key] : () => {}; }
  });
  function element(key) {
    if (elements.has(key)) return elements.get(key);
    const listeners = new Map(), classes = new Set();
    const el = {
      value: '', hidden: true, disabled: false, innerHTML: '', textContent: '',
      width: 480, height: 560, clientWidth: 1000, offsetLeft: 200, offsetWidth: 50,
      style: {}, dataset: {}, listeners,
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name), toggle: () => {}
      },
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
      emit(type, props = {}) { for (const fn of listeners.get(type) || []) fn({preventDefault() {}, ...props}); },
      querySelector: selector => element(key + ' ' + selector), querySelectorAll: () => [],
      getContext: () => paint, getBoundingClientRect: () => ({left: 0, top: 0, width: 480, height: 560}),
      setAttribute() {}, removeAttribute() {}, appendChild() {}, append() {}, focus() {}, scrollIntoView() {}, remove() {}
    };
    elements.set(key, el);
    return el;
  }
  const document = element('document');
  document.querySelector = element;
  document.querySelectorAll = () => [];
  document.createElement = () => element('created-' + (++timerId));
  const window = element('window');
  const context = vm.createContext({
    document, window, console, performance: {now: () => now},
    Date: class extends Date { static now() { return now; } },
    matchMedia: () => ({matches: false}),
    requestAnimationFrame: () => ++timerId, cancelAnimationFrame() {},
    setInterval(fn) { const id = ++timerId; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(fn) { const id = ++timerId; timeouts.set(id, fn); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    fetch: () => new Promise(() => {})
  });
  window.setTimeout = context.setTimeout;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../arcade', name, 'app.js'), 'utf8'), context);
  return {context, element, intervals, setTime(value) { now = value; }, run(code) { return vm.runInContext(code, context); }};
}

function brickSimulation(hz) {
  const g = game('brickrunch');
  g.run('running=true;hasStarted=true;bricks=[];lastFrame=0;frameRemainder=0;ball={x:200,y:400,r:7,dx:2,dy:-1,speed:5.2,launched:true}');
  for (let frame = 1; frame <= hz / 2; frame++) g.run(`step(${frame * 1000 / hz})`);
  return g.run('({x:ball.x,y:ball.y})');
}

test('brickrunch preserves the same 60 Hz trajectory at 30, 60, 120 and 144 Hz', () => {
  for (const hz of [30, 60, 120, 144]) {
    const position = brickSimulation(hz);
    assert.equal(position.x, 260, `${hz} Hz x`);
    assert.equal(position.y, 370, `${hz} Hz y`);
  }
});

test('brickrunch holds arrow keys smoothly, releases on blur and limits stale frame work', () => {
  const g = game('brickrunch');
  g.run('running=true;bricks=[];lastFrame=0;frameRemainder=0');
  g.element('document').emit('keydown', {key: 'ArrowRight'});
  g.run('step(1000/60)');
  assert.equal(g.run('paddle.x'), 204);
  for (let i = 0; i < 10; i++) g.element('document').emit('keydown', {key: 'ArrowRight', repeat: true});
  assert.equal(g.run('paddle.x'), 204, 'OS key-repeat events do not teleport the paddle');
  g.element('window').emit('blur');
  g.run('step(1000/60)');
  assert.equal(g.run('paddle.x'), 204, 'blur clears held keys');
  g.run('ball={x:100,y:400,r:7,dx:2,dy:0,speed:5.2,launched:true};step(60000)');
  assert.equal(g.run('ball.x'), 112, 'at most six original physics ticks run after a long gap');
});

test('brickrunch checks collisions throughout a delayed frame', () => {
  const g = game('brickrunch');
  g.run('running=true;hasStarted=true;lastFrame=0;frameRemainder=0;bricks=[{x:180,y:70,w:54,h:24,alive:true,label:"test"},{x:300,y:70,w:54,h:24,alive:true,label:"other"}];ball={x:200,y:40,r:7,dx:0,dy:5.2,speed:5.2,launched:true};step(100)');
  assert.equal(g.run('bricks[0].alive'), false);
  assert.ok(g.run('ball.dy') < 0, 'ball bounces instead of passing through a brick');
  assert.equal(g.run('score'), 10);
});

test('late brickrunch news responses preserve the active and completed board', async () => {
  const g = game('brickrunch');
  g.context.fetch = async () => ({ok: true, json: async () => ({puzzles: [{title: 'news', url: 'https://www.newsis.com/'}]})});
  g.run('startGame();bricks[0].alive=false');
  await g.run('loadNews()');
  assert.equal(g.run('bricks[0].alive'), false);
  g.run('running=false');
  await g.run('loadNews()');
  assert.equal(g.run('bricks[0].alive'), false);
});

test('chungmuman obstacles cover the same distance at 30, 60 and 120 Hz', () => {
  for (const hz of [30, 60, 120]) {
    const g = game('chungmuman');
    g.run('playing=true;lastFrame=0;lastSpawn=0;objects=[{x:1000,el:document.createElement("div"),spec:{effect:"bad",action:"jump"},resolved:false}]');
    for (let frame = 1; frame <= hz; frame++) { g.setTime(frame * 1000 / hz); g.run(`frame(${frame * 1000 / hz})`); }
    assert.ok(Math.abs(g.run('objects[0].x') - 640) < 1e-7, `${hz} Hz`);
  }
});

test('puzzle guards loading controls and restarts the timer/result after completion', () => {
  const g = game('puzzle');
  assert.equal(g.element('#shuffleButton').disabled, true);
  assert.doesNotThrow(() => g.element('#shuffleButton').emit('click'));
  g.run('current={id:"one",image:"photo.jpg",category:"사진",title:"뉴스",description:"설명",credit:"뉴시스",url:"https://www.newsis.com/"};resetPuzzle()');
  assert.equal(g.intervals.size, 1);
  g.setTime(7000);
  g.run('order=Array.from({length:9},(_,i)=>i);finish()');
  assert.equal(g.intervals.size, 0);
  assert.equal(g.element('#result').hidden, false);
  g.element('#shuffleButton').emit('click');
  assert.equal(g.element('#result').hidden, true);
  assert.equal(g.element('#timer').textContent, '00:00');
  assert.equal(g.element('#moves').textContent, '0');
  assert.equal(g.intervals.size, 1);
  g.setTime(9000);
  for (const tick of g.intervals.values()) tick();
  assert.equal(g.element('#timer').textContent, '00:02');
  g.element('#shuffleButton').emit('click');
  assert.equal(g.intervals.size, 1, 'repeated shuffles do not leak timers');
});

test('dododok rejects blank submissions while preserving partial-entry article rewards', () => {
  const g = game('dododok');
  g.run('current={title:"오늘의 뉴스 제목",category:"사회",url:"https://www.newsis.com/"}');
  for (const value of ['', '   ', '\t\n']) {
    g.element('#typingInput').value = value;
    g.run('submitCurrent()');
    assert.equal(g.run('completed.length'), 0);
    assert.equal(g.run('advancing'), false);
  }
  g.element('#typingInput').value = '오';
  g.run('submitCurrent()');
  assert.equal(g.run('completed.length'), 1);
  assert.equal(g.run('advancing'), true);
});

function crosswordData(count) {
  return {updatedAt: 'test', puzzles: Array.from({length: count}, () => ({
    rows: 7, cols: 3,
    words: Array.from({length: 7}, (_, index) => ({
      number: index + 1, row: index, col: 0, direction: 'across', answer: '가나다',
      definition: '테스트 뜻풀이', clue: '세 글자 낱말', url: 'https://www.newsis.com/'
    }))
  }))};
}

async function loadCrossword(count, storage) {
  const g = game('words');
  g.context.sessionStorage = storage;
  g.context.fetch = async () => ({ok: true, json: async () => crosswordData(count)});
  await g.run('init()');
  assert.equal(g.element('#game').hidden, false, 'crossword renders successfully');
  assert.equal(g.element('#error').hidden, true, 'no loading error is displayed');
  assert.equal(g.run('words.length'), 7);
  return g;
}

test('single crossword loads on first visit and revisit without excluding its only board', async () => {
  for (const saved of [null, '0']) {
    let stored;
    const g = await loadCrossword(1, {getItem: () => saved, setItem: (key, value) => { stored = value; }});
    assert.equal(g.run('currentPuzzleIndex'), 0);
    assert.equal(stored, '0');
  }
});

test('multiple crosswords exclude the previous board when another board is available', async () => {
  const g = await loadCrossword(2, {getItem: () => '0', setItem() {}});
  assert.equal(g.run('currentPuzzleIndex'), 1);
});

test('crossword remains playable when session storage reads or writes are denied', async () => {
  await loadCrossword(1, {getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }});
  await loadCrossword(1, {getItem: () => '0', setItem() { throw new Error('denied'); }});
});
