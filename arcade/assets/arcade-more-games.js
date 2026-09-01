const ARCADE_GAMES = Object.freeze([
  { number: '01', name: '조각 사진관', path: '/arcade/puzzle/' },
  { number: '02', name: '뉴스 오목', path: '/arcade/omok/' },
  { number: '03', name: '벽크크', path: '/arcade/brickrunch/', isNew: true },
  { number: '04', name: '넌 내 도도독', path: '/arcade/dododok/', isNew: true },
  { number: '05', name: '충무맨', path: '/arcade/chungmuman/' },
  { number: '06', name: '제목있음', path: '/arcade/output/' },
  { number: '07', name: '이슈 훔친 두더지', path: '/arcade/mole/', isNew: true },
  { number: '08', name: '충무로 타로#', path: '/arcade/tarot/' },
  { number: '09', name: '낱말수선소', path: '/arcade/words/' },
  { number: '10', name: '가짜뉴스 지뢰찾기', path: '/arcade/minesweeper/', isNew: true }
]);

function normalizeArcadePath(pathname) {
  const withoutIndex = pathname.replace(/index\.html$/i, '');
  return withoutIndex.endsWith('/') ? withoutIndex : `${withoutIndex}/`;
}

function renderArcadeMoreGames() {
  const section = document.querySelector('.other-games');
  if (!section) return;

  const currentPath = normalizeArcadePath(window.location.pathname);
  const links = ARCADE_GAMES.filter((game) => game.path !== currentPath).map((game) => `
    <a href="${game.path}" data-arcade-game="${game.name}">
      <span class="arcade-more-games__meta"><span>${game.number}</span>${game.isNew ? '<em class="arcade-more-games__new">NEW</em>' : ''}</span>
      <b>${game.name}</b>
    </a>`).join('');

  section.classList.add('arcade-more-games');
  section.setAttribute('aria-labelledby', 'arcadeMoreGamesTitle');
  section.innerHTML = `
    <div class="arcade-more-games__intro">
      <p>PLAY ANOTHER</p>
      <h2 id="arcadeMoreGamesTitle">다른 게임도<br>하러가기</h2>
    </div>
    <nav aria-label="다른 충무로딩 게임">${links}</nav>`;

  section.addEventListener('click', (event) => {
    const link = event.target.closest('[data-arcade-game]');
    if (!link || typeof window.gtag !== 'function') return;
    window.gtag('event', 'select_other_game', {
      game_name: link.dataset.arcadeGame,
      link_url: link.href
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderArcadeMoreGames, { once: true });
} else {
  renderArcadeMoreGames();
}
