(() => {
  const $ = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const journey = $('journey');
  const finishPin = $('finish-pin-track');
  const finishSticky = finishPin.querySelector('.journey-sticky');
  const finishWrap = finishPin.querySelector('.journey-wrap');
  const archive = $('goal-archive');
  const archivePin = $('archive-pin-track'), archiveScreen = $('archive-screen'), archiveReader = $('archive-reader');
  const stage = journey.querySelector('.journey-stage');
  const input = $('goal-range');
  const play = $('goal-play'), playLabel = $('goal-play-label'), startOverlay = $('goal-start');
  const status = $('goal-play-status');
  const narrative = journey.querySelector('.journey-narrative');
  const photo = $('goal-photo');
  const backdrop = $('goal-photo-backdrop');
  const photoMessage = $('goal-photo-message');
  const cache = new Map();
  const total = goalRecordData.length;
  let photoIndex = 0, photoRequest = 0;
  let selected = 0, timer = null, playing = false, request = 0;
  let selectedReady = Promise.resolve();

  const photoQueue = [];
  let activeLoads = 0;
  function drainPhotos() {
    while(activeLoads < 2 && photoQueue.length) {
      const {src, resolve} = photoQueue.shift(); activeLoads++;
      const img = new Image(); img.decoding = 'async';
      let finished = false;
      function finish(ok) {
        if(finished) return;
        finished = true; activeLoads--;
        const entry=cache.get(src);
        if(entry){if(ok)entry.image=img;else cache.delete(src);}
        resolve(ok); drainPhotos();
      }
      img.onload = async () => {
        try { if(img.decode) await img.decode(); finish(true); }
        catch { finish(false); }
      };
      img.onerror = () => finish(false);
      img.src = src;
    }
  }
  function preload(src, background=false) {
    if(cache.has(src)) {
      // Promote a prefetched-but-waiting image when the reader seeks directly to it.
      if(!background){const index=photoQueue.findIndex(task=>task.src===src);if(index>0)photoQueue.unshift(...photoQueue.splice(index,1));}
      return cache.get(src).ready;
    }
    if(!background)for(const stale of photoQueue.splice(0)){cache.delete(stale.src);stale.resolve(false);}
    let resolve;
    const ready=new Promise(done=>{resolve=done});
    if(cache.size>=10)cache.delete(cache.keys().next().value);
    // Retain decoded image objects, not just successful-download flags.
    cache.set(src,{ready,image:null});
    const task={src,resolve};background?photoQueue.push(task):photoQueue.unshift(task);
    drainPhotos();return ready;
  }
  function playbackSource(n) {
    const image=goalPlaybackPhotos[n]||goalPhotoData[n];
    return image && (innerWidth<=800?image.mobile:image.src);
  }
  function warmNextPhotos(n) {
    for(let next=n+1;next<=Math.min(total,n+2);next++){
      const source=playbackSource(next);if(source)preload(source,true);
    }
  }
  function showPhoto(n, index) {
    const image = goalPhotoData[n];
    const frames = image?.frames || (image ? [image] : []);
    photoIndex = Math.max(0, Math.min(frames.length-1,index));
    const frame = image && (goalPlaybackPhotos[n] || frames[photoIndex]), token = ++photoRequest;
    // Hold the decoded photograph through the next load instead of flashing a number.
    const credit = $('goal-credit');
    photo.setAttribute('aria-busy','true');
    photoMessage.hidden = !!photo.src && !photo.hidden;
    photoMessage.textContent = '사진을 준비하고 있습니다.';
    function unavailable(message) {
      if(selected !== n || token !== photoRequest) return;
      photo.hidden = backdrop.hidden = true;
      photo.setAttribute('aria-busy','false');
      photoMessage.textContent = message; photoMessage.hidden = false;
      credit.hidden = true;
    }
    const source = frame && playbackSource(n);
    selectedReady = source ? preload(source).then(ok => {
      if(selected !== n || token !== photoRequest) return;
      if(!ok) { unavailable('사진을 불러오지 못했습니다.'); return; }
      photo.src = backdrop.src = source;
      photo.alt = frame.alt || `${goalRecordData[n-1][0]} ${goalRecordData[n-1][1]}전 손흥민 · 제공 사진 ${photoIndex+1}`;
      photo.style.objectPosition = backdrop.style.objectPosition = image.position || 'center';
      photo.hidden = false; backdrop.hidden = true; photoMessage.hidden = true;
      photo.setAttribute('aria-busy','false'); credit.hidden = false;
      const suffix = frame.captionSuffix ?? image.captionSuffix;
      $('goal-credit').textContent = [frame.credit || image.credit,suffix].filter(Boolean).join(' · ');
      warmNextPhotos(n);
    }) : Promise.resolve().then(()=>unavailable('이 경기의 제공 사진이 없습니다.'));
    return selectedReady;
  }
  function archiveDescription(n) {
    if(n === 59) return '우즈베키스탄전 전반 6분, 오른발 프리킥으로 59호골. 차범근의 58골을 넘어섰다.';
    if(goalRecordHighlights[n]) return goalRecordHighlights[n][1];
    const {goalsInMatch,ordinal} = goalRecordMeta[n-1];
    return `${goalRecordData[n-1][2]}에서 더한 한 골.${goalsInMatch>1 ? ` 이 경기 ${goalsInMatch}골 중 ${ordinal}번째 골.` : ''}`;
  }
  function render(n) {
    n = Math.min(total, Math.max(1, Math.round(n)));
    if (selected === n) return selectedReady;
    selected = n;
    const [day, rival, city, tally, match] = goalRecordData[n - 1];
    const highlight = goalRecordHighlights[n];
    const image = goalPhotoData[n];
    input.value = String(n);
    input.setAttribute('aria-valuetext', `${n}호골, ${day.replaceAll('-', '.')} ${rival}전`);
    input.style.setProperty('--progress', `${(n - 1) / (total-1) * 100}%`);
    $('goal-count').textContent = String(n).padStart(2, '0');
    $('goal-player-position').textContent = `${String(n).padStart(2,'0')} / ${total}`;
    $('goal-title').textContent = highlight ? highlight[0] : `${rival}전, ${n}번째 골`;
    $('goal-context').hidden = false;
    $('goal-context').textContent = archiveDescription(n);
    $('goal-date').textContent = day.replaceAll('-', '.');
    $('goal-opponent').textContent = `${rival}전`;
    $('goal-place').textContent = city;
    $('goal-score').textContent = tally;
    $('goal-competition').textContent = match;
    const ready = showPhoto(n, Math.max(0,image?.frames?.findIndex(frame=>frame.src===image.src) || 0));
    // Record/photo changes use the existing frame; only viewport changes resize it.
    return ready;
  }
  function updatePlayerControls() {
    const ended = selected === total && !playing;
    play.setAttribute('aria-pressed', String(playing));
    playLabel.textContent = playing ? '일시정지' : ended ? '다시 재생' : '재생';
    play.setAttribute('aria-label', playing ? '59골 재생 일시정지' : ended ? '첫 골부터 다시 재생' : '선택한 골부터 재생');
    startOverlay.hidden = false;
    startOverlay.setAttribute('aria-pressed',String(playing));
    const action = playing ? '재생 일시정지' : ended ? '첫 골부터 다시 재생' : '선택한 골부터 재생';
    startOverlay.setAttribute('aria-label',action);
    $('goal-start-label').textContent = action;
  }
  function stop(message) {
    playing = false; request += 1; clearTimeout(timer); timer = null;
    narrative.setAttribute('aria-live', 'polite');
    updatePlayerControls();
    if (message) status.textContent = message;
  }
  async function schedule(token) {
    await selectedReady;
    if (!playing || token !== request) return;
    const delay = goalRecordHighlights[selected] ? 3200 : 1800;
    timer = setTimeout(async () => {
      if (!playing || token !== request) return;
      if (selected === total) return stop('59번째 골까지 도착했습니다. 단독 최다골의 순간입니다.');
      await render(selected + 1);
      if (playing && token === request) schedule(token);
    }, delay);
  }
  async function start() {
    if (playing || !archive.open) return;
    if (!selected) render(1);
    playing = true;
    const token = ++request;
    if (selected === total) render(1);
    updatePlayerControls();
    narrative.setAttribute('aria-live', 'off');
    status.textContent = '59골 전체 재생 중 · 주요 골에서 조금 더 머뭅니다.';
    schedule(token);
  }
  function togglePlayback() { playing ? stop('잠시 멈췄습니다. 선택한 골을 살펴보세요.') : start(); }
  play.addEventListener('click', togglePlayback);
  startOverlay.addEventListener('click', togglePlayback);
  $('goal-restart').addEventListener('click', () => {
    stop('첫 골부터 다시 재생합니다.');
    render(1);
    start();
  });
  input.addEventListener('pointerdown', () => stop('골 번호를 선택하고 있습니다.'));

  input.addEventListener('input', () => {
    stop('선택한 골의 기록입니다.'); render(Number(input.value)); updatePlayerControls();
  });
  const observer = new IntersectionObserver(entries => {
    updateArchivePlayback();
  }, {threshold: [0, .9, 1]});
  observer.observe(archiveReader);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop('재생을 멈췄습니다.');
  });
  const archiveInvite = new IntersectionObserver(entries => {
    if(entries.some(entry=>entry.isIntersecting)){
      if(!archive.open)archive.classList.add('is-inviting');
      archiveInvite.unobserve(archive);
    }
  },{threshold:.35});
  archiveInvite.observe(archive);
  archive.addEventListener('toggle', () => {
    configureFinish();
    if (archive.open) { archive.classList.remove('is-inviting'); if (!selected) render(1); updatePlayerControls(); }
    else { stop('전체 골 기록을 접었습니다.'); }
    configureArchive();
    if (archive.open) {
      // Wait for the expanded layout and native scroll anchoring before revealing the player.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!archive.open) return;
        const top = scrollY + archiveReader.getBoundingClientRect().top - sonReadingTop();
        window.scrollTo({top: Math.max(0, top), behavior: 'instant'});
        updateArchivePlayback();
      }));
    }
    scheduleScroll();
  });
  $('archive-close').addEventListener('click',()=>{archive.open=false;stop('전체 골 기록을 접었습니다.');document.documentElement.classList.remove('is-reading-archive');});
  const handoff = $('handoff');
  const handoffFold = $('handoff-fold');
  const handoffCopy = handoff.querySelector('.handoff-copy');
  const handoffSticky = handoff.querySelector('.handoff-sticky');
  const compare = handoff.querySelector('.record-comparison');
  const duo = $('handoff-duo'), exchange = $('handoff-exchange'), smile = $('handoff-smile'), solo = $('handoff-solo'), shared = $('handoff-shared');
  if(recordMilestone.photo){solo.src=recordMilestone.photo;solo.alt='2026년 우즈베키스탄전 59호골 뒤 팬들에게 인사하는 손흥민의 뒷모습';}
  const handoffButtons = [...handoff.querySelectorAll('[data-handoff]')];
  const sonDate = compare.querySelector('.record-person--son time');
  let handoffPhase = -1, manualPhase = null;
  const recordGoal = recordMilestone.goal;
  const chaPerson=compare.querySelector('.record-person--cha'), sonPerson=compare.querySelector('.record-person--son');
  const ribbon=$('time-ribbon'), ribbonLine=$('time-ribbon-line'), ribbonTicks=$('time-ribbon-ticks'), ribbonLabels=$('time-ribbon-labels');
  const yearLabels=[...compare.querySelectorAll('[data-year]')];
  function setHandoff(phase) {
    if(phase===handoffPhase)return;
    const n=phase===4?recordGoal:58;
    handoffPhase=phase;handoff.dataset.phase=String(phase);
    handoffButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.handoff)===phase)));
    $('handoff-son-count').textContent=String(n);
    const day=phase===4?recordMilestone.date:goalData[57][0];
    sonDate.textContent=day?day.replaceAll('-','.'):'단독 최다골 · 경신 가정';
    if(day)sonDate.setAttribute('datetime',day);else sonDate.removeAttribute('datetime');
    $('handoff-son-era').textContent=phase===4?(day?day.slice(0,4):'그다음 골'):'2026';
    compare.setAttribute('aria-label',phase===4?`${recordMilestone.confirmed?'':'경신 후 발행 가정: '}차범근 58골, 손흥민 ${recordGoal}골로 단독 최다 득점`:`1978년 12월 17일 차범근 58골. 2026년 9월 28일 손흥민 58골. 같은 숫자, 서로 다른 날짜.`);
    const photos=[duo,exchange,smile,shared,solo];
    photos.forEach((photo,index)=>{photo.classList.toggle('is-current',index===phase);photo.setAttribute('aria-hidden',String(index!==phase));photo.style.opacity=index===phase?(innerWidth<=800?'1':index<3?'.72':'.85'):'0';});
    const headings=['58골과 58골.','47년 넘게 지켜온 기록.','차범근과 나란히.','58골, 웃지 못했다.',`${recordGoal}호골, 차범근을 넘었다.`];
    const descriptions=[
      '1978년, 차범근이 58번째 골을 넣었다. 손흥민이 태어나기도 전이었다.',
      '차범근의 58골은 47년 넘게 한국 남자 A매치 최다골 기록으로 남았다.',
      '손흥민도 58골. 차범근과 공동 1위에 올랐다. 단독 1위까지는 한 골이 남아 있었다.',
      '우루과이전 58호골로 공동 1위에 올랐다. 하지만 한국은 1:4로 졌다.',
      '한국의 2:0 승리를 연 59번째 골. 차범근의 마지막 골 이후 1만7460일, 47년 9개월 19일 만의 새 기록.'
    ];
    $('handoff-text').textContent=headings[phase];$('handoff-description').textContent=descriptions[phase];
    $('handoff-caption').textContent=phase===4?'2026 우즈베키스탄전 · 사진 = 뉴시스':phase===3?'2026 우루과이전 · 한국 1:4 패배 · 사진 = 뉴시스':phase===0?'2018년 함께 선 두 사람 · 사진 = 뉴시스':'2025년 최다 출전 기념식 · 사진 = 뉴시스';
  }
  function renderTimeFold(fold,phase){
    const mobile=innerWidth<=800;
    const width=compare.getBoundingClientRect().width || (mobile?innerWidth-40:Math.min(1180,innerWidth-64));
    const g=SonTimeFold.layout(width,fold,mobile,handoff.classList.contains('is-tight'));
    compare.style.setProperty('--record-width',`${g.panelWidth}px`);
    compare.dataset.fold=g.fold.toFixed(4);
    chaPerson.style.left=`${g.left.x}px`;chaPerson.style.top=`${g.left.y}px`;
    sonPerson.style.left=`${g.right.x}px`;sonPerson.style.right='auto';sonPerson.style.top=`${g.right.y}px`;
    ribbon.setAttribute('viewBox',`0 0 ${width} ${g.height}`);
    ribbonLine.setAttribute('points',g.nodes.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
    ribbonTicks.setAttribute('d',g.nodes.map(p=>`M${p.x.toFixed(2)} ${(p.y-4).toFixed(2)}v8`).join(' '));
    ribbon.style.opacity=String(g.ribbonOpacity);ribbonLabels.style.opacity=String(g.labelOpacity);
    yearLabels.forEach(label=>{
      const node=g.nodes[Number(label.dataset.year)-1978];
      label.setAttribute('x',node.x.toFixed(2));label.setAttribute('y',(node.y+24).toFixed(2));
      label.style.display=mobile&&['1980','2020'].includes(label.dataset.year)?'none':'';
    });
    compare.querySelector('.record-equal').style.opacity=phase===4?'0':String(g.equalOpacity);
  }
  function updateHandoff(){
    const bounds=handoffFold.getBoundingClientRect();
    // Native page snapping must not jump across the reversible five-scene track.
    document.documentElement.classList.toggle('is-reading-handoff',handoff.classList.contains('is-enhanced') && bounds.top<innerHeight && bounds.bottom>sonReadingTop());
    if(!handoff.classList.contains('is-enhanced')){
      const phase=manualPhase??0;setHandoff(phase);renderTimeFold([0,.28,.72,1,1][phase],phase);return;
    }
    const length=Math.max(1,handoffFold.offsetHeight-handoffSticky.offsetHeight);
    const stickyTop=parseFloat(getComputedStyle(handoffSticky).top)||0;
    const progress=Math.max(0,Math.min(1,(stickyTop-bounds.top)/length));
    const phase=progress<.14?0:progress<.38?1:progress<.64?2:progress<.82?3:4;
    setHandoff(phase);renderTimeFold(Math.max(0,Math.min(1,(progress-.14)/.5)),phase);
  }
  handoffButtons.forEach(button=>button.addEventListener('click',()=>{
    const phase=Number(button.dataset.handoff);
    if(!handoff.classList.contains('is-enhanced')){manualPhase=phase;updateHandoff();return;}
    const top=scrollY+handoffFold.getBoundingClientRect().top;
    window.scrollTo({top:top-sonReadingTop()+(handoffFold.offsetHeight-handoffSticky.clientHeight)*[.06,.26,.51,.73,.94][phase],behavior:'instant'});updateHandoff();
  }));
  document.addEventListener('goal:select', event => {
    archive.open = true;
    stop('모자이크에서 선택한 골의 기록입니다.');
    render(Number(event.detail));
    updatePlayerControls();
  });

  const tribute = $('tribute');
  const tributeStage = tribute.querySelector('.inheritance-stage');
  const tributeFrame = tribute.querySelector('.inheritance-frame');
  const tributeCard = tribute.querySelector('.inheritance-card');
  const chaQuote = $('inheritance-cha'), sonQuote = $('inheritance-son'), inheritanceClosing = $('inheritance-closing');
  function updateTribute() {
    document.documentElement.classList.toggle('is-reading-inheritance',tribute.classList.contains('is-enhanced') && tribute.getBoundingClientRect().top <= sonReadingTop() && tribute.getBoundingClientRect().bottom > innerHeight);
    // Normal flow (short screens, enlarged type, reduced motion) exposes both voices.
    if (!tribute.classList.contains('is-enhanced')) {
      tribute.style.setProperty('--inheritance-progress','1');
      sonQuote.removeAttribute('aria-hidden'); sonQuote.inert = false;
      inheritanceClosing.removeAttribute('aria-hidden');
      return;
    }
    const stickyTop = parseFloat(getComputedStyle(tributeStage).top) || 0;
    const distance = stickyTop - tribute.getBoundingClientRect().top;
    const travel = Math.max(1, tribute.offsetHeight - tributeStage.offsetHeight);
    // Hold the elder's words first; retain both voices at the end of the same frame.
    const progress = Math.max(0, Math.min(1, (distance / travel - .18) / .5));
    tribute.style.setProperty('--inheritance-progress',String(progress));
    const revealed = progress > .1;
    sonQuote.setAttribute('aria-hidden',String(!revealed)); sonQuote.inert = !revealed;
    inheritanceClosing.setAttribute('aria-hidden',String(progress<.85));
  }
  function configureTribute(textSize) {
    const eligible = !motion.matches && innerHeight >= 560 && innerWidth >= 320 && textSize <= 20;
    tribute.classList.toggle('is-enhanced',eligible);
    if (eligible) {
      // Measure the static end arrangement, independent of the currently visible phase.
      const room = tributeCard.clientHeight;
      const first = chaQuote.offsetHeight, second = sonQuote.offsetHeight;
      if (first + second + 24 > room || tributeFrame.scrollHeight > tributeFrame.clientHeight + 1 || tributeFrame.scrollWidth > tributeFrame.clientWidth + 1) {
        tribute.classList.remove('is-enhanced');
      }
    }
    const shift = Math.max(0,(tributeCard.clientHeight - chaQuote.offsetHeight) / 2);
    tribute.style.setProperty('--inheritance-cha-shift',`${shift}px`);
    updateTribute();
  }
  function configureLayout() {
    const textSize = Math.max(parseFloat(getComputedStyle(document.body).fontSize), parseFloat(getComputedStyle(document.documentElement).fontSize));
    document.documentElement.classList.toggle('has-scene-stops', !motion.matches && textSize <= 20 && innerHeight >= 600);
    configureHandoff(textSize);
    configureTribute(textSize);
    configureFinish();
    configureArchive();
    updateAll();
  }
  function configureHandoff(textSize) {
    const eligible=!motion.matches && innerHeight>=560 && innerWidth>=320 && textSize<=20;
    const wasEnhanced=handoff.classList.contains('is-enhanced');
    handoff.classList.toggle('is-enhanced',eligible);
    if(!eligible)return;
    if(!wasEnhanced)handoff.classList.remove('is-tight');
    // Reserve identical copy rows in CSS; never cycle through scenes to measure them.
    // Establish both record positions before measuring, including on the first load.
    updateHandoff();
    const fits=()=>handoffSticky.scrollHeight<=handoffSticky.clientHeight+1 && handoffCopy.scrollWidth<=handoffCopy.clientWidth+1;
    if(!fits())handoff.classList.add('is-tight');
    if(!fits())handoff.classList.remove('is-enhanced');
  }
  let archiveMeasureKey='';
  function measureArchiveRows() {
    const width=archiveReader.clientWidth;
    if(!archive.open || !width)return;
    const key=`${width}:${getComputedStyle(document.documentElement).fontSize}:${getComputedStyle(narrative).fontSize}`;
    if(key===archiveMeasureKey)return;
    // Measure every caption offscreen once per width, without changing the playing record.
    const probe=document.createElement('div');probe.className='archive-reader';
    probe.setAttribute('aria-hidden','true');
    Object.assign(probe.style,{position:'fixed',left:'-100000px',top:'0',width:`${width}px`,padding:'0',display:'block',visibility:'hidden',pointerEvents:'none'});
    const stories=[],facts=[];
    goalRecordData.forEach((record,index)=>{
      const header=archiveReader.querySelector('.journey-story').cloneNode(true),highlight=goalRecordHighlights[index+1];
      header.style.height='auto';header.querySelector('.journey-number strong').textContent=String(index+1).padStart(2,'0');
      header.querySelector('h3').textContent=highlight?highlight[0]:`${record[1]}전, ${index+1}번째 골`;
      const description=header.querySelector('p');description.hidden=false;description.textContent=archiveDescription(index+1);
      const row=archiveReader.querySelector('.journey-facts').cloneNode(true);row.style.height='auto';
      row.querySelector('#goal-date').textContent=record[0].replaceAll('-','.');
      row.querySelector('#goal-opponent').textContent=`${record[1]}전`;row.querySelector('#goal-place').textContent=record[2];
      row.querySelector('#goal-score').textContent=record[3];row.querySelector('#goal-competition').textContent=record[4];
      for(const clone of [header,row]){clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));probe.append(clone);}
      stories.push(header);facts.push(row);
    });
    document.body.append(probe);
    const headerHeight=Math.ceil(Math.max(...stories.map(node=>node.getBoundingClientRect().height)));
    const factsHeight=Math.ceil(Math.max(...facts.map(node=>node.getBoundingClientRect().height)));
    probe.remove();
    archiveReader.style.setProperty('--archive-story-height',`${headerHeight}px`);
    archiveReader.style.setProperty('--archive-facts-height',`${factsHeight}px`);
    archiveMeasureKey=key;
  }
  function configureArchive() {
    const textSize = Math.max(parseFloat(getComputedStyle(document.body).fontSize), parseFloat(getComputedStyle(document.documentElement).fontSize));
    const eligible = archive.open && !motion.matches && innerHeight >= 560 && innerWidth >= 320 && textSize <= 20;
    archivePin.classList.toggle('is-pinned', eligible);
    measureArchiveRows();
    if (!eligible) return;
    const availableHeight = Math.min(innerHeight - sonReadingTop(), archiveScreen.clientHeight);
    const fits = () => archiveReader.scrollHeight <= availableHeight && archiveReader.scrollWidth <= archiveReader.clientWidth + 1 && stage.scrollHeight <= stage.clientHeight + 1;
    if (!fits()) archivePin.classList.remove('is-pinned');
  }
  function updateArchivePlayback() {
    const rect = archiveReader.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(sonReadingTop(), rect.top));
    const visible = archive.open && rect.height > 0 && visibleHeight / rect.height >= .9;
    document.documentElement.classList.toggle('is-reading-archive', visible);
    if (!visible && playing) stop('화면을 벗어나 재생을 멈췄습니다. 재생을 누르면 계속됩니다.');

  }
  function configureFinish() {
    const textSize = Math.max(parseFloat(getComputedStyle(document.body).fontSize), parseFloat(getComputedStyle(document.documentElement).fontSize));
    const eligible = !archive.open && !motion.matches && innerHeight >= 560 && innerWidth >= 320 && textSize <= 20;
    finishPin.classList.toggle('is-pinned', eligible);
    finishPin.classList.remove('is-tight');
    if (!eligible) return;
    const availableHeight = Math.min(innerHeight - sonReadingTop(), finishSticky.clientHeight);
    const fits = () => finishWrap.scrollHeight <= availableHeight && finishWrap.scrollWidth <= finishWrap.clientWidth + 1;
    if (!fits()) finishPin.classList.add('is-tight');
    if (!fits()) finishPin.classList.remove('is-pinned');
  }
  document.addEventListener('finish:change', configureFinish);
  let raf = 0;
  function updateAll() { raf = 0; updateHandoff(); updateTribute(); updateArchivePlayback(); }
  function scheduleScroll() { if (!raf) raf = requestAnimationFrame(updateAll); }
  window.addEventListener('scroll', scheduleScroll, {passive: true});
  window.addEventListener('resize', configureLayout);
  motion.addEventListener('change', () => { if (motion.matches) stop('움직임 줄이기 설정에 따라 자동 재생을 멈췄습니다.'); configureLayout(); });
  window.addEventListener('load', configureLayout, {once: true});
  configureLayout();
})();
