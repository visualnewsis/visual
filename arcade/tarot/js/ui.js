const symbols = {fool:'○',magician:'∞',priestess:'☾',emperor:'♜',justice:'⚖',hermit:'⌁',fortune:'⊙',tower:'ϟ',star:'✦'};

export function renderDeck(container, cards, selected, onSelect) {
  container.innerHTML = cards.map((card, index) => `<button class="tarot-card" style="--i:${index};--x:${(index - 4) * 38}px;--r:${(index - 4) * 3}deg" type="button" data-id="${card.id}" aria-label="${selected.includes(card.id) ? `${card.name}, ${card.keyword[0]}, 선택됨` : `펼쳐진 카드 ${index + 1}` }" aria-pressed="${selected.includes(card.id)}" ${selected.length === 2 && !selected.includes(card.id) ? 'disabled' : ''}><span class="tarot-card__inner"><span class="card-back" aria-hidden="true"></span><span class="card-front"><img src="${card.image}" alt=""><span>${card.name}</span></span></span></button>`).join('');
  container.querySelectorAll('.tarot-card').forEach(button => button.addEventListener('click', () => onSelect(button.dataset.id)));
}

export function renderChosen(container, cards) {
  container.innerHTML = cards.map(card => `<article class="chosen-card"><div class="chosen-card__art"><img src="${card.image}" alt="${card.name} 라이더–웨이트 카드"></div><h3>${card.name}</h3><p>${card.keyword.join(' · ')}</p></article>`).join('');
}

export function renderReading(container, cards, reading) {
  const [first, second] = cards;
  container.innerHTML = `<p class="combination-reading">${reading.text.replace(/\n/g,'<br>')}</p>
    <div class="card-meanings">
      <article><span>첫 번째 카드 · 현재의 기운</span><h3>${first.name}</h3><p>${first.meaning}</p></article>
      <article><span>두 번째 카드 · 나아갈 방향</span><h3>${second.name}</h3><p>${second.meaning}</p></article>
    </div>
    <div class="fortune-domains">
      <article><span>관계운</span><p>${first.love} ${second.love}</p></article>
      <article><span>일과 기회</span><p>${first.work} ${second.work}</p></article>
      <article><span>금전운</span><p>${first.money} ${second.money}</p></article>
    </div>
    <div class="today-advice"><span>오늘의 행동</span><p>${first.advice}<br>${second.advice}</p></div>
    <p class="reading-note">이 해석은 전통 라이더–웨이트 상징을 바탕으로 오늘을 돌아보기 위한 이야기입니다.</p>`;
}

export function showScene(current, next) {
  current.classList.add('is-leaving');
  setTimeout(() => {
    current.hidden = true; current.classList.remove('is-active','is-leaving');
    next.hidden = false; next.classList.add('is-active','is-entering');
    next.scrollIntoView({ block: 'start' });
    setTimeout(() => next.classList.remove('is-entering'), 1200);
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 820);
}
