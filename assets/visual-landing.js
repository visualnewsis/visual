(() => {
  const root = document.getElementById('vn-hub');
  if (!root) return;
  const cards = [...root.querySelectorAll('.archive-card')];
  const buttons = [...root.querySelectorAll('[data-filter]')];
  const count = root.querySelector('#vn-hub-count');
  const featured = new URL(root.querySelector('.vn-lead a').href).pathname;

  function filter(value) {
    let visible = 0;
    cards.forEach(card => {
      const isFeatured = new URL(card.href).pathname === featured;
      card.hidden = isFeatured || (value !== 'all' && card.dataset.corner !== value);
      if (!card.hidden) visible++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
    count.textContent = `${visible}개의 이야기`;
  }
  buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset.filter)));
  filter('all');

  const toggle = root.querySelector('#vn-hub-games-toggle');
  const gameList = root.querySelector('#vn-hub-game-list');
  const total = gameList.querySelectorAll('a').length;
  toggle.addEventListener('click', () => {
    const open = gameList.hidden;
    gameList.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '게임 목록 접기 −' : `전체 게임 ${total}개 보기 +`;
  });

  // Split only when both requested lines fit their actual rendered container.
  const titleLines = {
    spai: ['"쟤 지금 딴짓해요"', '회사가 고용한 SPAI'],
    son7: ['전설로 남은 자리,', '마침내 손에 닿다'],
    homecoming: ['열아홉에 산화한 형', '여든일곱 동생 곁으로'],
    battery: ['알아볼지도', '리튬이온 배터리편'],
    'adult-missing': ['사람은 사라지고', '확인도 실종됐다'],
    children: ['아이가 자라는 동안', '주변은 얼마나 사라질까요']
  };
  const wrappingTargets = cards.flatMap(card => {
    const slug = new URL(card.href).pathname.split('/').filter(Boolean)[0];
    const heading = card.querySelector('h3');
    return heading && titleLines[slug] ? [{ heading, lines: titleLines[slug], original: heading.innerHTML, originalText: heading.textContent, card }] : [];
  });
  const gameHeading = root.querySelector('#vn-hub-play h2');
  if (gameHeading) wrappingTargets.push({ heading: gameHeading, lines: ['한 판 하고,', '다시 뉴스.'], original: gameHeading.innerHTML, originalText: gameHeading.textContent, card: gameHeading.parentElement });
  function updateTitleWrapping() {
    wrappingTargets.forEach(({ heading, lines, original, originalText }) => {
      if (!heading.getClientRects().length) return;
      const width = heading.clientWidth;
      const style = getComputedStyle(heading);
      const probe = document.createElement('span');
      Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', whiteSpace: 'pre', width: 'max-content', font: style.font, letterSpacing: style.letterSpacing, pointerEvents: 'none' });
      document.body.append(probe);
      const measure = text => { probe.textContent = text; return probe.getBoundingClientRect().width; };
      const fits = width > 0 && lines.every(line => measure(line) <= width - 2);
      const needsWrap = measure(originalText) > width - 2;
      probe.remove();
      if (fits && needsWrap) {
        if (heading.dataset.editorialWrap === 'true') return;
        heading.replaceChildren(...lines.map(line => { const span = document.createElement('span'); span.className = 'vn-title-line'; span.textContent = line; return span; }));
        heading.dataset.editorialWrap = 'true';
      } else if (heading.dataset.editorialWrap === 'true') {
        heading.innerHTML = original;
        delete heading.dataset.editorialWrap;
      }
    });
  }
  let wrappingFrame;
  const scheduleWrapping = () => { cancelAnimationFrame(wrappingFrame); wrappingFrame = requestAnimationFrame(updateTitleWrapping); };
  addEventListener('resize', scheduleWrapping, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleWrapping);
    wrappingTargets.forEach(target => observer.observe(target.card));
  }
  if (document.fonts) document.fonts.ready.then(scheduleWrapping);
  scheduleWrapping();

})();
