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
})();
