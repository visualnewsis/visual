/* Scroll follows the reader; the full photograph remains available in every mode. */
(() => {
  'use strict';
  const figures = [...document.querySelectorAll('.photo-pan')];
  if (!figures.length || !window.matchMedia || !window.CSS?.supports('position', 'sticky')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = figures.map(figure => ({
    figure, track: figure.querySelector('.pan-track'), frame: figure.querySelector('.pan-frame'),
    image: figure.querySelector('img'), button: figure.querySelector('.pan-toggle'),
    hint: figure.querySelector('.pan-hint'), full: false, travel: 0, verticalTravel: 0, top: 64
  }));
  const active = new Set();
  let scheduled = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  function draw(scene) {
    if (!scene.figure.classList.contains('is-pan')) return;
    const rect = scene.track.getBoundingClientRect();
    const distance = scene.track.offsetHeight - scene.frame.offsetHeight;
    const progress = distance > 0 ? clamp((scene.top - rect.top) / distance) : 0;
    const position = scene.figure.dataset.panFrom === 'right' ? 1 - progress : progress;
    const verticalPosition = scene.figure.dataset.panFrom === 'right' ? position * .55 : position;
    scene.image.style.transform = `translate3d(${-scene.travel * position}px,${-scene.verticalTravel * verticalPosition}px,0)`;
    scene.hint.style.opacity = progress > .1 ? '0' : '1';
  }
  function update() {
    scheduled = 0;
    active.forEach(draw);
  }
  function requestDraw() {
    if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(update);
  }
  function measure(scene) {
    const enabled = !motion.matches && !scene.full;
    scene.figure.classList.toggle('is-pan', enabled);
    scene.button.hidden = motion.matches;
    scene.figure.querySelector('.pan-toolbar').hidden = motion.matches;
    scene.hint.hidden = !enabled;
    scene.button.setAttribute('aria-pressed', String(scene.full));
    scene.button.textContent = scene.full ? '확대해서 둘러보기' : '사진 전체 보기';
    if (!enabled) {
      scene.track.style.height = '';
      scene.image.style.width = '';
      scene.image.style.transform = '';
      scene.image.style.height = '';
      return;
    }
    const width = scene.frame.clientWidth;
    const height = scene.frame.clientHeight;
    const aspect = Number(scene.image.getAttribute('width')) / Number(scene.image.getAttribute('height'));
    const imageWidth = Math.max(width * 1.35, height * aspect);
    scene.travel = imageWidth - width;
    scene.verticalTravel = Math.max(0, imageWidth / aspect - height);
    scene.top = parseFloat(getComputedStyle(scene.frame).top) || 0;
    scene.image.style.width = `${imageWidth}px`;
    scene.image.style.height = `${imageWidth / aspect}px`;
    scene.track.style.height = `${height + Math.max(height * .9, Math.min(scene.travel, height * 1.5))}px`;
    draw(scene);
  }
  scenes.forEach(scene => {
    scene.button.addEventListener('click', () => {
      scene.full = !scene.full;
      measure(scene);
      scene.figure.scrollIntoView({block: 'start', behavior: 'instant'});
      requestDraw();
    });
    scene.image.addEventListener('load', () => { measure(scene); requestDraw(); });
    // A failed photo must not leave an empty two-screen scroll section.
    scene.image.addEventListener('error', () => { scene.full = true; measure(scene); });
    measure(scene);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = scenes.find(item => item.figure === entry.target);
        if (entry.isIntersecting) active.add(scene); else active.delete(scene);
      });
      requestDraw();
    }, {rootMargin: '250px 0px'});
    scenes.forEach(scene => observer.observe(scene.figure));
  } else scenes.forEach(scene => active.add(scene));
  addEventListener('scroll', requestDraw, {passive: true});
  let resizeFrame = 0;
  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { scenes.forEach(measure); requestDraw(); });
  }, {passive: true});
  const preferenceChanged = () => { scenes.forEach(measure); requestDraw(); };
  if (motion.addEventListener) motion.addEventListener('change', preferenceChanged);
  else motion.addListener(preferenceChanged);
  addEventListener('pageshow', () => { scenes.forEach(measure); requestDraw(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });
})();
