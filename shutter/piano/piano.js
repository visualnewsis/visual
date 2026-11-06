/* 굳이구지 / Piano interaction study. Creative Director: 안재현.
   Original geometric model and synthesized audio; no external models or recordings. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const solfege = ['도','도♯','레','레♯','미','파','파♯','솔','솔♯','라','라♯','시'];
  const bindings = ['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon','Quote','BracketRight','Backquote','Backslash','KeyZ','KeyX','KeyC','KeyV'];
  const labels = ['A','W','S','E','D','F','T','G','Y','H','U','J','K','O','L','P',';','\'',']','`','\\','Z','X','C','V'];
  const keyboard = $('keyboard');
  const mobile = matchMedia('(max-width:700px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const notes = [];
  const inputs = new Map();
  const voices = new Map();
  const states = new Map();
  let last = null, pedal = false, audio = null, master = null, compressor = null;
  let replay = null, yaw = -.72, spread = .15, frame = 0, visible = true;
  let dirtyUntil = performance.now() + 600;
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
  function wake(duration = 900) {
    dirtyUntil = Math.max(dirtyUntil, performance.now() + duration);
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
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
    replay = null;
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
  function replayLast() {
    if (!last) return;
    replay = { start:performance.now(), midi:last.midi, hold:Math.min(1800, Math.max(120, last.duration ?? performance.now() - last.start)) };
    $('replay-status').textContent = `${noteName(last.midi)} · 누름 → 타현 → 뗌 · 느린 무음 관찰 (누름 구간 0.12~1.8초)`;
    wake(7000);
  }
  $('explore-link').addEventListener('click', () => { refreshContext(); replayLast(); });
  $('replay').addEventListener('click', replayLast);
  $('spread').addEventListener('input', e => { spread = Number(e.target.value) / 100; wake(); });

  // Spatial geometry renderer. Project real x/y/z vertices; sort faces back to front.
  const preview = $('action-preview'), detail = $('action-detail');
  function makeRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let faces = [], width = 1, height = 1, zoom = 1, horizontalZoom = 1, angle = 0, pitch = .34, centerY = .55;
    function project(v) {
      const x = v[0] * Math.cos(angle) + v[2] * Math.sin(angle);
      const z = -v[0] * Math.sin(angle) + v[2] * Math.cos(angle);
      return [width/2 + x*horizontalZoom, height*centerY + (z*Math.sin(pitch)-v[1]*Math.cos(pitch))*zoom, z*Math.cos(pitch)+v[1]*Math.sin(pitch)];
    }
    function face(points, color) {
      const p = points.map(project);
      faces.push({ p, color, depth:p.reduce((n,v)=>n+v[2],0)/p.length });
    }
    function box(x,y,z,w,h,d,color) {
      const a=[x-w/2,y-h/2,z-d/2], b=[x+w/2,y-h/2,z-d/2], c=[x+w/2,y-h/2,z+d/2], e=[x-w/2,y-h/2,z+d/2];
      const A=[a[0],a[1]+h,a[2]],B=[b[0],b[1]+h,b[2]],C=[c[0],c[1]+h,c[2]],E=[e[0],e[1]+h,e[2]];
      face([a,b,B,A],color[1]||color[0]);face([b,c,C,B],color[2]||color[0]);face([c,e,E,C],color[1]||color[0]);face([e,a,A,E],color[2]||color[0]);face([A,B,C,E],color[0]);
    }
    function rod(a,b,r,color) {
      const vector=b.map((v,i)=>v-a[i]);
      const length=Math.hypot(...vector);
      const n=vector.map(v=>v/length);
      const tangent=Math.abs(n[1])<.9 ? [0,1,0] : [1,0,0];
      const u=[n[1]*tangent[2]-n[2]*tangent[1],n[2]*tangent[0]-n[0]*tangent[2],n[0]*tangent[1]-n[1]*tangent[0]];
      const ul=Math.hypot(...u);u.forEach((_,i)=>u[i]/=ul);
      const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
      const ring=(p,i)=>p.map((q,j)=>q+r*(u[j]*Math.cos(i*Math.PI/3)+v[j]*Math.sin(i*Math.PI/3)));
      for(let i=0;i<6;i++)face([ring(a,i),ring(b,i),ring(b,i+1),ring(a,i+1)],color[i%color.length]);
    }
    return {
      begin(options) {
        const rect=canvas.getBoundingClientRect(), ratio=Math.min(devicePixelRatio||1,2);
        width=rect.width;height=rect.height;
        if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
        ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
        angle=options.angle;pitch=options.pitch;zoom=options.zoom;horizontalZoom=options.horizontalZoom??zoom;centerY=options.centerY;faces=[];
      },box,rod,
      finish() {
        faces.sort((a,b)=>b.depth-a.depth);
        for(const f of faces){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle='#00000015';ctx.lineWidth=.4;ctx.stroke();}
      },
      label(text,v) {const p=project(v);ctx.font='10px Arial, sans-serif';ctx.fillStyle='#d7c29d';ctx.fillText(text,p[0]+8,p[1]);ctx.beginPath();ctx.arc(p[0],p[1],2,0,7);ctx.fill();}
    };
  }
  const small = makeRenderer(preview), large = makeRenderer(detail);
  const wood=['#b88c55','#795735','#9f7746'], ivory=['#e2dcc8','#928a75','#c2b79d'];
  const brass=['#b89658','#725c33','#947a43'], felt=['#e4dfc8','#aaa48c','#c1bca3'];
  function motion(midi,time,slow=false) {
    let s=states.get(midi), age=time-s.start, held=s.down;
    if(slow && replay){age=(time-replay.start)/3;held=age<replay.hold;}
    const hammer=age<0 ? 0 : age<25 ? age/25 : age<190 ? 1-(age-25)/165*.73 : held ? .27 : 0;
    const vibration=age>=25 ? Math.exp(-(age-25)/(held||pedal?1600:240)) : 0;
    return { hammer:reduced.matches?(held?.27:0):Math.max(0,hammer), held, vibration:reduced.matches?0:vibration, age };
  }
  function build(r,x,m,time,explode=0,full=false) {
    const lift=m.held||pedal ? 12 : 0;
    const e=explode*20;
    const front=m.held?-3:0;
    // Key front, wooden lever, abstract action linkage; all driven by note state.
    r.box(x,-5+front,-23,full?13:5.7,6,48,ivory);
    r.rod([x,front,-4],[x,m.held?4:0,48],full?3:1.7,wood);
    r.box(x,3,15,full?19:7,4,7,brass);
    r.rod([x,7+e,42],[x,18+e+(m.held?7:0),53],full?2.8:1.2,wood);
    const end=[x,35+23*m.hammer+e*1.6,14+8*m.hammer];
    r.rod([x,10+e,57],end,full?1.9:.9,wood);
    r.box(end[0],end[1]+3,end[2],full?10:2.7,11,6,felt);
    const stringY=64+e*1.6;
    for(let j=-1;j<=1;j++){
      const offset=j*(full?2:1);
      const wobble=Math.sin(time*.032+j)*m.vibration*.7;
      r.rod([x+offset,stringY,-12],[x+offset,stringY+wobble,34],full?.24:.13,brass);
      r.rod([x+offset,stringY+wobble,34],[x+offset,stringY,111],full?.24:.13,brass);
    }
    r.rod([x,15,81],[x,stringY+lift+e*.2+5,81],full?.7:.35,brass);
    r.box(x,stringY+lift+e*.2+4,81,full?12:2.7,7,11,felt);
    if(full){r.box(x,-13,32,30,4,172,['#473724','#30271c','#382e20']);r.box(x,-8,16,24,9,8,wood);}
  }
  function render(time) {
    frame=0;
    const p=preview.getBoundingClientRect(), d=detail.getBoundingClientRect();
    if(p.bottom>0&&p.top<innerHeight){
      const active=notes.filter(n=>!mobile.matches||n.midi<=72);
      const count=mobile.matches?8:15;
      small.begin({angle:0,pitch:.58,zoom:p.height/112,horizontalZoom:p.width/(count*8+8),centerY:.66});
      small.box(0,-13,50,count*8+8,12,140,['#26251f','#10120e','#181b15']);
      small.box(0,56,111,count*8+5,5,5,brass);
      small.box(0,-1,50,count*8+6,4,5,wood);
      active.forEach(n=>build(small,(n.slot-(count-1)/2)*8,motion(n.midi,time),time));
      small.finish();
    }
    if(d.bottom>0&&d.top<innerHeight){
      let selected=last?.midi??60;
      if(replay)selected=replay.midi;
      const m=motion(selected,time,!!replay);
      large.begin({angle:yaw,pitch:.36,zoom:Math.min(d.width/155,d.height/133),centerY:.65});
      build(large,0,m,time,spread,true);large.finish();
      large.label('건반',[0,-8,-45]);large.label('해머',[0,42+spread*32,24]);large.label('현',[0,64+spread*32,10]);large.label('댐퍼',[0,76+spread*36,81]);
      if(replay && (time-replay.start)/3>replay.hold+500){replay=null;$('replay-status').textContent=`${noteName(selected)} 관찰 완료 · 누름과 뗌을 3배 느리게 보았습니다.`;}
    }
    if(replay||[...states.values()].some(s=>s.down)||time<dirtyUntil)wake(0);
  }
  let drag=null;
  detail.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,yaw};detail.setPointerCapture(e.pointerId);});
  detail.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){yaw=Math.max(-1.5,Math.min(1.5,drag.yaw+(e.clientX-drag.x)*.008));wake();}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>detail.addEventListener(event,()=>{drag=null;}));
  detail.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw=Math.max(-1.5,Math.min(1.5,yaw+(e.key==='ArrowLeft'?-.12:.12)));wake();}});
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting)||preview.getBoundingClientRect().bottom>0;wake();});
  observer.observe(preview);observer.observe(detail);
  window.addEventListener('resize',()=>wake());
  window.addEventListener('scroll',()=>{visible=preview.getBoundingClientRect().bottom>0||detail.getBoundingClientRect().bottom>0;wake(100);},{passive:true});
  wake();
})();
