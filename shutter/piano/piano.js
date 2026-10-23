/* 굳이구지 / Piano interaction study. Creative Director: 안재현.
   Immediate DOM-key input and synthesized audio. 3D observation loads independently. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const solfege = ['도','도♯','레','레♯','미','파','파♯','솔','솔♯','라','라♯','시'];
  const bindings = ['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon','Quote','BracketRight','Backquote','Backslash','KeyZ','KeyX','KeyC','KeyV'];
  const labels = ['A','W','S','E','D','F','T','G','Y','H','U','J','K','O','L','P',';','\'',']','`','\\','Z','X','C','V'];
  const keyboard = $('keyboard');
  const mobile = matchMedia('(max-width:700px)');
  const notes = [];
  const inputs = new Map();
  const voices = new Map();
  const states = new Map();
  let last = null, pedal = false, audio = null, master = null, compressor = null;
  const noteName = midi => names[midi % 12] + (Math.floor(midi / 12) - 1);
  let whiteSlot = -1;
  for (let midi = 60; midi <= 84; midi++) {
    const black = [1,3,6,8,10].includes(midi % 12);
    if (!black) whiteSlot++;
    const index = midi - 60;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `piano-key ${black ? 'black' : 'white'}`;
    button.dataset.note = String(midi);
    button.dataset.upper = String(midi > 72);
    button.style.setProperty('--slot', whiteSlot);
    button.setAttribute('aria-label', `${solfege[midi % 12]} ${noteName(midi)} · ${labels[index].trim()}`);
    button.setAttribute('aria-pressed', 'false');
    const hint = document.createElement('kbd');
    hint.textContent = labels[index];
    const pitch = document.createElement('span');
    pitch.className = 'pitch';
    pitch.textContent = black ? '♯' : noteName(midi);
    button.append(hint, pitch);
    keyboard.append(button);
    notes.push({ midi, black, slot: whiteSlot + (black ? .5 : 0), button });
    states.set(midi, { down: false, start: -10000, released: -10000 });
    // Screen-reader/keyboard activation that does not generate PointerEvents.
    button.addEventListener('click', e => {
      if (e.detail !== 0) return;
      const source = `assistive:${midi}`;
      noteOn(midi, source);
      setTimeout(() => noteOff(source), 240);
    });
  }

  function audioMessage(message, error = false) {
    $('audio-status').textContent = message;
    $('audio-status').classList.toggle('error', error);
  }
  function ensureAudio() {
    try {
      if (!audio) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) throw new Error('unsupported');
        audio = new Context({ latencyHint: 'interactive' });
        master = audio.createGain();
        master.gain.value = Number($('volume').value) / 100 * .65;
        compressor = audio.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 16;
        compressor.ratio.value = 5;
        master.connect(compressor).connect(audio.destination);
      }
      if (audio.state !== 'running') {
        audio.resume().then(() => {
          audioMessage(audio.state === 'running' ? '소리 켜짐 · 헤드폰으로 작은 울림까지 들어보세요.' : '소리가 일시 정지됐습니다. 건반을 다시 눌러주세요.', audio.state !== 'running');
        }).catch(() => audioMessage('소리를 켜지 못했습니다. 브라우저의 사이트 소리 권한을 확인한 뒤 건반을 다시 눌러주세요.', true));
      } else audioMessage(Number($('volume').value) ? '소리 켜짐 · 합성음으로 연주 중' : '음량이 0입니다. 음량을 올려주세요.');
      return audio;
    } catch (_) {
      audioMessage('이 브라우저에서는 소리를 사용할 수 없습니다. 최신 Safari 또는 Chrome에서 다시 열어주세요. 건반과 모형은 계속 움직입니다.', true);
      return null;
    }
  }
  function endVoice(midi, hard = false) {
    const voice = voices.get(midi);
    if (!voice || !audio) return;
    voices.delete(midi);
    const t = audio.currentTime;
    voice.envelope.gain.cancelScheduledValues(t);
    // The common envelope is constant until release; per-partial gains carry decay.
    voice.envelope.gain.setValueAtTime(voice.level, t);
    voice.envelope.gain.exponentialRampToValueAtTime(.00001, t + (hard ? .018 : .18));
    voice.nodes.forEach(node => { try { node.stop(t + (hard ? .025 : .22)); } catch (_) {} });
  }
  function strike(midi) {
    const ctx = ensureAudio();
    if (!ctx) return;
    endVoice(midi, true);
    const start = ctx.currentTime + .025;
    const envelope = ctx.createGain();
    const level = .17;
    envelope.gain.value = level;
    envelope.connect(master);
    const nodes = [];
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const amplitudes = [1,.44,.27,.15,.09,.055,.025];
    amplitudes.forEach((amplitude, i) => {
      const partial = i + 1;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial * Math.sqrt(1 + .00012 * partial * partial);
      gain.gain.setValueAtTime(.00001, start);
      gain.gain.exponentialRampToValueAtTime(amplitude, start + .004);
      gain.gain.exponentialRampToValueAtTime(.00001, start + 8 / Math.sqrt(partial));
      oscillator.connect(gain).connect(envelope);
      oscillator.start(start);
      oscillator.stop(start + 8.1);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      nodes.push(oscillator);
    });
    const voice = { envelope, nodes, level };
    // Disconnect the envelope after the final oscillator, including retriggers.
    let ended = 0;
    nodes.forEach(node => {
      const cleanup = node.onended;
      node.onended = () => {
        cleanup();
        if (++ended === nodes.length) {
          envelope.disconnect();
          if (voices.get(midi) === voice) voices.delete(midi);
        }
      };
    });
    voices.set(midi, voice);
  }
  function refreshContext() {
    if (!last) return;
    const name = noteName(last.midi);
    $('note-name').textContent = name;
    $('note-caption').textContent = `${solfege[last.midi % 12]} · ${Math.round(440 * 2 ** ((last.midi - 69) / 12))} Hz`;
    $('detail-note').textContent = name;
    $('context-copy').textContent = `방금 연주한 ${name}. 같은 음의 건반·해머·현·댐퍼를 보고 있습니다.`;
    $('replay').disabled = false;
  }
  function wake() { window.dispatchEvent(new Event('piano:change')); }
  function noteOn(midi, source) {
    if (inputs.has(source)) return;
    const already = [...inputs.values()].includes(midi);
    inputs.set(source, midi);
    if (already) return;
    const time = performance.now();
    states.set(midi, { down:true, start:time, released:-10000 });
    notes[midi - 60].button.classList.add('is-down');
    notes[midi - 60].button.setAttribute('aria-pressed', 'true');
    last = { midi, start:time, duration:null };
    $('replay-status').textContent = '방금 누른 음의 동작을 느리게 다시 볼 수 있습니다.';
    refreshContext();
    strike(midi);
    wake();
  }
  function noteOff(source) {
    const midi = inputs.get(source);
    if (midi === undefined) return;
    inputs.delete(source);
    if ([...inputs.values()].includes(midi)) return;
    const state = states.get(midi);
    state.down = false;
    state.released = performance.now();
    if (last && last.midi === midi && last.start === state.start) last.duration = state.released - last.start;
    const button = notes[midi - 60].button;
    button.classList.remove('is-down');
    button.setAttribute('aria-pressed', 'false');
    if (!pedal) endVoice(midi);
    wake(1000);
  }
  function releaseAll() {
    [...inputs.keys()].forEach(noteOff);
    if (pedal) setPedal(false);
    [...voices.keys()].forEach(midi => endVoice(midi));
  }
  function setPedal(on) {
    pedal = on;
    $('sustain').setAttribute('aria-pressed', String(on));
    $('pedal-status').textContent = on ? 'ON' : 'OFF';
    if (!on) [...voices.keys()].forEach(midi => { if (!states.get(midi).down) endVoice(midi); });
    wake();
  }
  const pointers = new Map();
  function keyAt(x,y) { return document.elementFromPoint(x,y)?.closest('.piano-key'); }
  keyboard.addEventListener('pointerdown', e => {
    const button = e.target.closest('.piano-key');
    if (!button || e.button !== 0) return;
    e.preventDefault();
    button.focus({ preventScroll:true });
    keyboard.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, Number(button.dataset.note));
    noteOn(Number(button.dataset.note), `pointer:${e.pointerId}`);
  });
  keyboard.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const button = keyAt(e.clientX, e.clientY);
    const midi = button ? Number(button.dataset.note) : null;
    if (pointers.get(e.pointerId) === midi) return;
    noteOff(`pointer:${e.pointerId}`);
    pointers.set(e.pointerId, midi);
    if (midi !== null) noteOn(midi, `pointer:${e.pointerId}`);
  });
  const releasePointer = e => { pointers.delete(e.pointerId); noteOff(`pointer:${e.pointerId}`); };
  ['pointerup','pointercancel','lostpointercapture'].forEach(event => keyboard.addEventListener(event, releasePointer));
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || e.target.closest('input,textarea,select,[contenteditable=true]')) return;
    const index = bindings.indexOf(e.code);
    if (index < 0 || (mobile.matches && index > 12) || e.target.closest('a,button:not(.piano-key),summary')) return;
    e.preventDefault();
    noteOn(index + 60, `key:${e.code}`);
  });
  document.addEventListener('keyup', e => noteOff(`key:${e.code}`));
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); else wake(); });
  mobile.addEventListener('change', () => { releaseAll(); pointers.clear(); wake(); });
  $('sustain').addEventListener('click', () => setPedal(!pedal));
  $('volume').addEventListener('input', e => {
    if (master) master.gain.setTargetAtTime(Number(e.target.value) / 100 * .65, audio.currentTime, .015);
    audioMessage(Number(e.target.value) ? `음량 ${e.target.value}%` : '음량이 0입니다. 음량을 올려주세요.');
  });
  const snapshot = () => Object.freeze({
    last: last ? Object.freeze({...last, duration:last.duration ?? performance.now()-last.start, pedal}) : null,
    pedal, audioState:audio?.state??'uninitialized', activeVoices:voices.size, notes: [...states.entries()].map(([midi,s]) => ({midi,...s}))
  });
  window.PianoExperience = Object.freeze({snapshot});
  window.dispatchEvent(new Event('piano:ready'));
})();
