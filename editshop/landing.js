(() => {
  const cards = [...document.querySelectorAll('.story[data-kind]')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const count = document.getElementById('story-count');
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.kind !== button.dataset.filter;
      if (!card.hidden) visible++;
    });
    count.textContent = `${visible}개의 이야기`;
  }));
})();
