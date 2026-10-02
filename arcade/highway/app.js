/* 팔도 고속도로 타자
   노선 선택 → 다가오는 표지판 이름 입력 → 도착. 지나는 구간의 뉴시스 지역본부 목록으로 바로 가는 링크를 옆에 띄운다.
   노선 순서: 한국어 위키백과 각 고속도로 나들목·휴게소 표 (2026-10-02 확인). 경기권 본부 구분: 뉴시스 수도권 본부별 기사 목록 기준. */
(() => {
  'use strict';

  const REGIONS = {
    se:  { name: '서울', full: '서울' },
    gn:  { name: '경기남부', full: '경기남부', url: 'https://www.newsis.com/metro/list?cid=14000&scid=10803' },
    iw:  { name: '인천·경기서부', full: '인천·경기서부', url: 'https://www.newsis.com/metro/list?cid=14000&scid=10802' },
    ge:  { name: '경기동부', full: '경기동부', url: 'https://www.newsis.com/metro/list?cid=14000&scid=10804' },
    gb:  { name: '경기북부', full: '경기북부', url: 'https://www.newsis.com/metro/list?cid=14000&scid=10817' },
    cn:  { name: '대전/충남', full: '대전·충남', url: 'https://www.newsis.com/region/list?cid=10800&scid=10807' },
    sj:  { name: '세종', full: '세종', url: 'https://www.newsis.com/region/list?cid=10800&scid=10818' },
    cb:  { name: '충북', full: '충북', url: 'https://www.newsis.com/region/list?cid=10800&scid=10806' },
    dg:  { name: '대구/경북', full: '대구·경북', url: 'https://www.newsis.com/region/list?cid=10800&scid=10810' },
    us:  { name: '울산', full: '울산', url: 'https://www.newsis.com/region/list?cid=10800&scid=10814' },
    km:  { name: '경남', full: '경남', url: 'https://www.newsis.com/region/list?cid=10800&scid=10812' },
    bs:  { name: '부산', full: '부산', url: 'https://www.newsis.com/region/list?cid=10800&scid=10811' },
    jb:  { name: '전북', full: '전북', url: 'https://www.newsis.com/region/list?cid=10800&scid=10808' },
    jn:  { name: '전남광주', full: '전남·광주', url: 'https://www.newsis.com/region/list?cid=10800&scid=10809' },
    gw:  { name: '강원', full: '강원', url: 'https://www.newsis.com/region/list?cid=10800&scid=10805' },
    jj:  { name: '제주', full: '제주', url: 'https://www.newsis.com/region/list?cid=10800&scid=10813' }
  };
  const STAMP_ORDER = ['iw', 'gn', 'ge', 'gb', 'gw', 'cb', 'sj', 'cn', 'jb', 'jn', 'dg', 'us', 'km', 'bs', 'jj'];
  // 현재 고른 노선들로는 지나지 않는 본부
  const OFF_ROAD = {
    gb: '이번 노선들로는 지나지 않아요',
    sj: '세종~안성 고속도로 공사 중',
    jj: '바다 건너라 고속도로가 없어요'
  };

  // "이름|종류|본부|출구번호|노선번호"  종류 I 나들목 · S 휴게소 · J 분기점 · T 요금소
  const ROUTES = [
    {
      id: 'gyeongbu', name: '경부고속도로', no: '1', from: '서울', to: '부산', tag: '정석 코스',
      stops: [
        '양재|I|se|49', '서울만남의광장|S|se', '판교|I|gn|47', '수원신갈|I|gn|44', '기흥|I|gn|43', '오산|I|gn|42', '안성|I|gn|40',
        '북천안|I|cn|39-1', '천안삼거리|S|cn', '독립기념관|I|cn|37', '옥산|I|cb|36-1', '청주|I|cb|36', '남청주|I|cb|33', '죽암|S|cb',
        '대전|I|cn|30', '옥천|I|cb|28', '금강|I|cb|27', '영동|I|cb|26', '황간|I|cb|25', '추풍령|I|dg|24', '김천|I|dg|23', '구미|I|dg|21',
        '칠곡|S|dg', '왜관|I|dg|19', '북대구|I|dg|16', '경산|I|dg|12', '영천|I|dg|11', '건천|S|dg', '경주|I|dg|9', '언양|S|us',
        '서울산|I|us|6', '통도사|I|km|5', '양산|I|km|4', '부산|T|bs'
      ]
    },
    {
      id: 'seohaean', name: '서해안고속도로', no: '15', from: '서울', to: '목포', tag: '바닷가 코스',
      stops: [
        '금천|I|se', '광명역|I|gn|35', '목감|I|gn|34', '매송|I|gn|31', '비봉|I|gn|30', '화성|S|gn', '발안|I|gn|29', '서평택|I|gn|27',
        '행담도|S|cn', '송악|I|cn|26', '당진|I|cn|25', '서산|I|cn|23', '해미|I|cn|22', '홍성|I|cn|21', '광천|I|cn|20', '대천|I|cn|19',
        '무창포|I|cn|18', '춘장대|I|cn|17', '서천|I|cn|16', '군산|I|jb|14', '동군산|I|jb|13', '서김제|I|jb|12', '부안|I|jb|11',
        '줄포|I|jb|10', '선운산|I|jb|9', '고창|I|jb|8', '영광|I|jn|6', '함평|I|jn|5', '무안|I|jn|3', '목포|T|jn'
      ]
    },
    {
      id: 'honam', name: '호남고속도로', no: '25', from: '서울', to: '광주', tag: '경부 → 천안논산 → 호남',
      stops: [
        '양재|I|se|49|1', '판교|I|gn|47|1', '수원신갈|I|gn|44|1', '기흥|I|gn|43|1', '오산|I|gn|42|1', '안성|I|gn|40|1', '북천안|I|cn|39-1|1',
        '천안|I|cn|39|1', '남천안|I|cn', '남풍세|I|cn', '정안|I|cn', '정안알밤|S|cn', '남공주|I|cn', '탄천|I|cn', '서논산|I|cn', '연무|I|cn',
        '익산|I|jb|28', '삼례|I|jb|26', '전주|I|jb|25', '서전주|I|jb|24', '이서|S|jb', '김제|I|jb|23', '금산사|I|jb|22', '태인|I|jb|21',
        '정읍|I|jb|20', '내장산|I|jb|19', '백양사|I|jn|18', '장성|I|jn|16', '광주|T|jn'
      ]
    },
    {
      id: 'yeongdong', name: '영동고속도로', no: '50', from: '인천', to: '강릉', tag: '대관령 넘는 코스',
      stops: [
        '서창|J|iw|1', '서안산|I|gn|4', '안산|I|gn|5', '군포|I|gn|8', '동군포|I|gn|9', '부곡|I|gn|10', '북수원|I|gn|11', '동수원|I|gn|12',
        '마성|I|gn|14', '용인|I|gn|17', '양지|I|gn|19', '덕평자연|S|gn', '이천|I|gn|22', '여주|I|gn|24', '문막|I|gw|25', '원주|I|gw|28',
        '새말|I|gw|29', '횡성|S|gw', '둔내|I|gw|30', '면온|I|gw|31', '평창|I|gw|32', '속사|I|gw|33', '진부|I|gw|35', '대관령|I|gw|36',
        '강릉|J|gw|37'
      ]
    },
    {
      id: 'seoulyangyang', name: '서울양양고속도로', no: '60', from: '서울', to: '양양', tag: '짧고 빠른 코스',
      stops: [
        '강일|I|se', '미사|I|ge', '덕소삼패|I|ge|1', '화도|I|ge|2', '서종|I|ge|3', '설악|I|ge|4', '가평|S|ge', '강촌|I|gw|5',
        '남춘천|I|gw|6', '조양|I|gw|7', '동홍천|I|gw|9', '홍천|S|gw', '내촌|I|gw|10', '내린천|S|gw', '인제|I|gw|11', '서양양|I|gw|12',
        '양양|I|gw|14'
      ]
    }
  ].map((r) => ({
    ...r,
    stops: r.stops.map((s) => {
      const [name, kind, region, exit = '', hw = ''] = s.split('|');
      return { name, kind, region, exit, hw: hw || r.no };
    })
  }));

  const KIND_LABEL = { I: '나들목', S: '휴게소', J: '분기점', T: '요금소' };
  const LS_BEST = 'vn-highway-best-v1';
  const LS_STAMP = 'vn-highway-stamps-v1';

  const $ = (s) => document.querySelector(s);
  const el = {
    pick: $('#pick'), routes: $('#routes'), drive: $('#drive'), arrive: $('#arrive'),
    shield: $('#shield'), routeName: $('#routeName'), tTime: $('#tTime'), tCpm: $('#tCpm'), tErr: $('#tErr'),
    signs: $('#signs'), toast: $('#toast'), scene: $('#scene'), ovPause: $('#ovPause'),
    sideRegion: $('#sideRegion'), sideLink: $('#sideLink'), sideHint: $('#sideHint'), sidePassed: $('#sidePassed'),
    input: $('#typeInput'), typeHint: $('#typeHint'), strip: $('#strip'),
    stripFrom: $('#stripFrom'), stripTo: $('#stripTo'), stripCount: $('#stripCount')
  };

  // Fit the mobile driving panel to the area above the software keyboard.
  const mobileDrive = window.matchMedia('(max-width: 760px)');
  let viewportFrame = 0;
  function syncDriveViewport() {
    const active = mobileDrive.matches && !el.drive.hidden;
    document.documentElement.classList.toggle('mobile-driving', active);
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    el.drive.classList.toggle('drive-short', active && height < 300);
    el.drive.style.setProperty('--drive-height', `${height}px`);
    el.drive.style.setProperty('--drive-top', `${viewport ? viewport.offsetTop : 0}px`);
  }
  function queueDriveViewport() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(syncDriveViewport);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', queueDriveViewport);
    window.visualViewport.addEventListener('scroll', queueDriveViewport);
  }
  window.addEventListener('resize', queueDriveViewport);
  el.input.addEventListener('focus', queueDriveViewport);
  el.input.addEventListener('blur', queueDriveViewport);

  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가 환경 */ } }
  };

  // 두벌식 기준 대략의 타수: 초성 1, 중성 1(겹모음 2), 종성 1(겹받침 2)
  const COMPOUND_V = new Set([9, 10, 11, 14, 15, 16, 19]);
  const COMPOUND_F = new Set([3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18]);
  function strokes(text) {
    let n = 0;
    for (const ch of text) {
      const c = ch.charCodeAt(0) - 0xac00;
      if (c < 0 || c > 11171) { n += 1; continue; }
      const v = Math.floor((c % 588) / 28), f = c % 28;
      n += 1 + (COMPOUND_V.has(v) ? 2 : 1) + (f ? (COMPOUND_F.has(f) ? 2 : 1) : 0);
    }
    return n;
  }

  const S = {
    route: null, idx: 0, running: false, paused: false,
    startAt: 0, elapsed: 0, strokes: 0, errors: 0, passed: [], composing: false, raf: 0, speed: 1, lastHit: 0
  };

  /* ---------- 노선 선택 ---------- */
  function routeRegions(route) {
    return [...new Set(route.stops.map((s) => s.region))].filter((r) => r !== 'se');
  }
  function fmt(ms) { return (ms / 1000).toFixed(1); }

  function renderRoutes() {
    const best = store.get(LS_BEST, {});
    el.routes.innerHTML = ROUTES.map((r) => `
      <button class="route-card" type="button" data-id="${r.id}">
        <span class="shield"><b>${r.no}</b></span>
        <span class="rc-body">
          <span class="rc-name">${r.name}</span>
          <span class="rc-path">${r.from} → ${r.to} · 표지판 ${r.stops.length}개</span>
          <span class="rc-tag">${r.tag}</span>
          <span class="rc-regions">${routeRegions(r).map((k) => `<i>${REGIONS[k].name}</i>`).join('')}</span>
        </span>
        <span class="rc-best">${best[r.id] ? `최고 ${fmt(best[r.id])}초` : '첫 주행'}</span>
      </button>`).join('');
  }
  el.routes.addEventListener('click', (e) => {
    const card = e.target.closest('.route-card');
    if (card) startRoute(ROUTES.find((r) => r.id === card.dataset.id));
  });

  /* ---------- 표지판 ---------- */
  function signHTML(stop, isLast) {
    const kind = isLast ? `${KIND_LABEL[stop.kind]} · 도착` : KIND_LABEL[stop.kind];
    const icon = stop.kind === 'S'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-1.5v6h-1V2h-1.5v6h-1V2zM17 2c-1.7 0-3 2.2-3 5.5V13h2v9h2V2z" fill="currentColor"/></svg>'
      : stop.kind === 'T' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12h-6v-7H9v7z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 17 7v7h2V4H9v2h7L4 18z" fill="currentColor"/></svg>';
    return `
      <div class="post l"></div><div class="post r"></div>
      <div class="sign k-${stop.kind}">
        <div class="sign-top">
          <span class="sign-shield shield"><b>${stop.hw}</b></span>
          <span class="sign-kind">${kind}</span>
          ${stop.exit ? `<span class="sign-exit">${stop.exit}</span>` : ''}
        </div>
        <div class="sign-name">${[...stop.name].map((c) => `<span>${c}</span>`).join('')}</div>
        <div class="sign-icon">${icon}</div>
      </div>`;
  }

  function makeGantry(i, state) {
    const stop = S.route.stops[i];
    const g = document.createElement('div');
    g.className = `gantry ${state}`;
    g.dataset.idx = i;
    g.style.setProperty('--name-length', Math.max(5, stop.name.length));
    g.innerHTML = signHTML(stop, i === S.route.stops.length - 1);
    return g;
  }

  function layoutSigns() {
    el.signs.innerHTML = '';
    const n = S.route.stops.length;
    if (S.idx + 1 < n) el.signs.appendChild(makeGantry(S.idx + 1, 'far'));
    el.signs.appendChild(makeGantry(S.idx, 'near'));
  }

  function advanceSigns() {
    const near = el.signs.querySelector('.gantry.near');
    const far = el.signs.querySelector('.gantry.far');
    if (near) {
      near.classList.replace('near', 'pass');
      near.addEventListener('animationend', () => near.remove(), { once: true });
      setTimeout(() => near.remove(), 700);
    }
    if (far) {
      far.classList.replace('far', 'near');
    }
    // 호출 시점의 S.idx는 방금 친 표지판. 새로 멀리 세울 표지판은 그다음다음.
    const next = S.idx + 2;
    if (next < S.route.stops.length) {
      const g = makeGantry(next, 'far spawn');
      el.signs.insertBefore(g, el.signs.firstChild);
      requestAnimationFrame(() => requestAnimationFrame(() => g.classList.remove('spawn')));
    }
  }

  function paintTyped(value) {
    const near = el.signs.querySelector('.gantry.near .sign-name');
    if (!near) return;
    const target = S.route.stops[S.idx].name;
    const chars = near.children;
    let bad = false;
    for (let i = 0; i < chars.length; i++) {
      chars[i].className = '';
      if (i < value.length) {
        if (value[i] === target[i] && !bad) chars[i].className = 'ok';
        else if (i === value.length - 1 && S.composing && !bad) chars[i].className = 'typing';
        else { chars[i].className = 'bad'; bad = true; }
      }
    }
    el.input.classList.toggle('wrong', value.length > target.length || (bad && value.length > 0));
  }

  /* ---------- 진행 ---------- */
  function startRoute(route) {
    S.route = route;
    S.idx = 0; S.elapsed = 0; S.strokes = 0; S.errors = 0; S.passed = []; S.speed = 1;
    S.running = false; S.paused = false; S.startAt = 0;
    el.pick.hidden = true; el.arrive.hidden = true; el.drive.hidden = false; el.ovPause.hidden = true;
    el.routeName.textContent = route.name;
    el.stripFrom.textContent = route.from; el.stripTo.textContent = route.to;
    el.strip.innerHTML = route.stops.map((s, i) => `<i class="r-${s.region} k-${s.kind}" data-i="${i}" title="${s.name}"></i>`).join('') + '<span class="car" id="car"></span>';
    el.sidePassed.innerHTML = '';
    el.input.value = ''; el.input.classList.remove('wrong'); el.typeHint.hidden = true;
    layoutSigns();
    updateHud();
    enterRegion(route.stops[0].region, true);
    updateStrip();
    syncDriveViewport();
    el.input.focus({ preventScroll: true });
    if (!mobileDrive.matches) window.scrollTo({ top: el.drive.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
    setSpeed(1);
  }

  function elapsedNow() {
    return S.elapsed + (S.running && !S.paused ? performance.now() - S.startAt : 0);
  }

  function updateHud() {
    const ms = elapsedNow();
    el.tTime.textContent = fmt(ms);
    el.tCpm.textContent = ms > 1500 ? Math.round(S.strokes / (ms / 60000)) : 0;
    el.tErr.textContent = S.errors;
    el.shield.querySelector('b').textContent = S.route.stops[Math.min(S.idx, S.route.stops.length - 1)].hw;
  }
  function tick() {
    if (!S.running) return;
    updateHud();
    S.raf = requestAnimationFrame(tick);
  }

  function updateStrip() {
    const dots = el.strip.querySelectorAll('i');
    dots.forEach((d, i) => d.classList.toggle('done', i < S.idx));
    const cur = dots[Math.min(S.idx, dots.length - 1)];
    const car = el.strip.querySelector('.car');
    if (cur && car) car.style.left = `${cur.offsetLeft + cur.offsetWidth / 2}px`;
    el.stripCount.textContent = `${S.idx} / ${S.route.stops.length}`;
  }

  function enterRegion(key, silent) {
    const r = REGIONS[key];
    el.sideRegion.textContent = key === 'se' ? `${S.route.from} 출발` : r.full;
    if (r.url) {
      el.sideLink.hidden = false;
      el.sideLink.href = r.url;
      el.sideLink.textContent = `${r.name} 기사보기 ↗`;
      el.sideLink.classList.remove('pulse'); void el.sideLink.offsetWidth; el.sideLink.classList.add('pulse');
      el.sideHint.hidden = true;
      if (!S.passed.includes(key)) {
        S.passed.push(key);
        const li = document.createElement('li');
        li.innerHTML = `<a href="${r.url}" target="_blank" rel="noopener">${r.name}</a>`;
        el.sidePassed.appendChild(li);
      }
    } else {
      el.sideLink.hidden = true;
      el.sideHint.hidden = false;
    }
    if (!silent && r.url) showToast(`<b>${r.full}</b> 구간 진입`);
  }

  let toastTimer = 0;
  function showToast(html) {
    el.toast.innerHTML = html;
    el.toast.hidden = false;
    el.toast.classList.remove('show'); void el.toast.offsetWidth; el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 1800);
  }

  function setSpeed(v) {
    S.speed = v;
    el.scene.style.setProperty('--lane-dur', `${(0.9 / v).toFixed(2)}s`);
  }

  function hit() {
    const stop = S.route.stops[S.idx];
    if (!S.running) { S.running = true; S.startAt = performance.now(); tick(); }
    S.strokes += strokes(stop.name);
    const now = performance.now();
    // 빠르게 칠수록 차도 빨라진다
    const gap = S.lastHit ? now - S.lastHit : 3000;
    S.lastHit = now;
    setSpeed(Math.max(1, Math.min(3.2, 4200 / gap)));
    el.scene.classList.remove('boost'); void el.scene.offsetWidth; el.scene.classList.add('boost');

    const prevRegion = stop.region;
    advanceSigns();
    S.idx += 1;
    el.input.value = ''; el.input.classList.remove('wrong'); el.typeHint.hidden = true;
    updateStrip();
    if (S.idx >= S.route.stops.length) { finish(); return; }
    const nextRegion = S.route.stops[S.idx].region;
    if (nextRegion !== prevRegion) enterRegion(nextRegion);
    updateHud();
  }

  function miss() {
    S.errors += 1;
    el.input.classList.remove('shake'); void el.input.offsetWidth; el.input.classList.add('shake');
    el.input.value = '';
    paintTyped('');
    updateHud();
  }

  function check(submit) {
    if (!S.route || S.idx >= S.route.stops.length || S.paused) return;
    const raw = el.input.value;
    const value = raw.replace(/\s+/g, '');
    const target = S.route.stops[S.idx].name;
    if (!S.running && value) { S.running = true; S.startAt = performance.now(); tick(); }
    if (value === target && (!S.composing || submit)) { hit(); return; }
    if (submit || /\s$/.test(raw)) {
      if (value === target) hit();
      else if (value) miss();
      else el.input.value = '';
      return;
    }
    paintTyped(value);
    el.typeHint.hidden = !(value === target && S.composing);
  }

  el.input.addEventListener('compositionstart', () => { S.composing = true; });
  el.input.addEventListener('compositionend', () => { S.composing = false; setTimeout(() => check(false), 0); });
  el.input.addEventListener('input', (e) => { S.composing = e.isComposing || S.composing; check(false); });
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 조합 중인 마지막 글자가 확정된 뒤 판정
      setTimeout(() => { S.composing = false; check(true); }, 0);
    } else if (e.key === 'Escape') {
      pause();
    }
  });

  /* ---------- 일시정지 ---------- */
  function pause() {
    if (!S.running || S.paused || el.drive.hidden) return;
    S.elapsed += performance.now() - S.startAt;
    S.paused = true;
    cancelAnimationFrame(S.raf);
    el.ovPause.hidden = false;
    el.scene.classList.add('stopped');
  }
  function resume() {
    if (!S.paused) return;
    S.paused = false;
    S.startAt = performance.now();
    el.ovPause.hidden = true;
    el.scene.classList.remove('stopped');
    el.input.focus({ preventScroll: true });
    tick();
  }
  $('#btnResume').addEventListener('click', resume);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  el.sideLink.addEventListener('click', () => setTimeout(pause, 50));
  el.sidePassed.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(pause, 50); });
  el.scene.addEventListener('click', () => { if (!S.paused) el.input.focus({ preventScroll: true }); });

  $('#btnBack').addEventListener('click', toPick);
  function toPick() {
    S.running = false; cancelAnimationFrame(S.raf);
    el.drive.hidden = true; el.arrive.hidden = true; el.pick.hidden = false;
    el.input.blur();
    syncDriveViewport();
    renderRoutes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 도착 ---------- */
  function finish() {
    S.elapsed = elapsedNow();
    S.running = false; cancelAnimationFrame(S.raf);
    updateHud();
    const ms = S.elapsed;
    const best = store.get(LS_BEST, {});
    const isNew = !best[S.route.id] || ms < best[S.route.id];
    if (isNew) { best[S.route.id] = Math.round(ms); store.set(LS_BEST, best); }
    const stamps = new Set(store.get(LS_STAMP, []));
    S.passed.forEach((k) => stamps.add(k));
    store.set(LS_STAMP, [...stamps]);

    const total = S.route.stops.length;
    $('#arriveRoute').textContent = `${S.route.name} · ${S.route.from} → ${S.route.to}`;
    $('#arriveTo').textContent = S.route.to;
    $('#rTime').textContent = `${fmt(ms)}초`;
    $('#rCpm').textContent = Math.round(S.strokes / (ms / 60000));
    $('#rAcc').textContent = `${Math.round((total / (total + S.errors)) * 100)}%`;
    $('#rBest').textContent = `${fmt(best[S.route.id])}초`;
    $('#rNew').hidden = !isNew;
    $('#passedLinks').innerHTML = S.passed.map((k) =>
      `<a href="${REGIONS[k].url}" target="_blank" rel="noopener"><span>${REGIONS[k].full}</span>기사보기 ↗</a>`).join('');
    $('#stampCount').textContent = `${STAMP_ORDER.filter((k) => stamps.has(k)).length} / ${STAMP_ORDER.length}`;
    $('#stamps').innerHTML = STAMP_ORDER.map((k) => {
      const got = stamps.has(k);
      const note = !got && OFF_ROAD[k] ? `<small>${OFF_ROAD[k]}</small>` : '';
      return `<a class="stamp${got ? ' got' : ''}" href="${REGIONS[k].url}" target="_blank" rel="noopener"><b>${REGIONS[k].name}</b>${note}</a>`;
    }).join('');

    setTimeout(() => {
      el.drive.hidden = true; el.arrive.hidden = false;
      el.input.blur();
      syncDriveViewport();
      window.scrollTo({ top: el.arrive.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
    }, 650);
    if (typeof gtag === 'function') gtag('event', 'highway_finish', { route: S.route.id, seconds: Math.round(ms / 1000) });
  }
  $('#btnRetry').addEventListener('click', () => startRoute(S.route));
  $('#btnOther').addEventListener('click', toPick);

  window.addEventListener('resize', () => { if (!el.drive.hidden) updateStrip(); });
  renderRoutes();
})();
