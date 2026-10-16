(() => {
  // Deliberate easter eggs only. New stories and featured cards never opt in.
  const allowed = new Set(['../buy-live/','../senior/','../dmz/']);
  const cards = [...document.querySelectorAll('.story[data-preview-src]')]
    .filter(card => allowed.has(card.getAttribute('href')));
  const desktop = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = null;
  const stops = new Map();
  cards.forEach(card => {
    let delay = 0, timeout = 0, video = null, hovered = false, attempted = false;
    function stop() {
      clearTimeout(delay);clearTimeout(timeout);
      card.classList.remove('is-previewing');
      if (video) {
        const old = video; video = null;
        old.pause();old.removeAttribute('src');old.load();old.remove();
      }
      if (current === card) current = null;
    }
    stops.set(card, stop);
    function play() {
      if (!hovered || attempted || !desktop.matches || reduced.matches || document.hidden || card.hidden) return;
      if (current && current !== card) stops.get(current)();
      current = card;attempted = true;
      const node = document.createElement('video');
      video = node;
      node.className = 'story-preview';
      node.muted = true;node.defaultMuted = true;node.playsInline = true;
      node.preload = 'none';node.setAttribute('aria-hidden','true');node.tabIndex = -1;
      const stopThis = () => {if (video === node) stop();};
      node.addEventListener('error',stopThis,{once:true});
      node.addEventListener('ended',stopThis,{once:true});
      node.addEventListener('playing', () => {
        // `playing` already guarantees decoded data. A hidden video's frame
        // callback may wait for presentation, so never use it to unhide itself.
        if (video === node && hovered) {
          clearTimeout(timeout);
          card.classList.add('is-previewing');
        }
      },{once:true});
      card.querySelector('.story-image').append(node);
      node.src = card.dataset.previewSrc;
      timeout = setTimeout(stop,4000);
      node.play().catch(stopThis);
    }
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !desktop.matches || reduced.matches) return;
      hovered = true;attempted = false;
      delay = setTimeout(play,300);
    });
    card.addEventListener('pointerleave', () => {hovered = false;stop();});
    card.addEventListener('click',stop);
  });
  const stopAll = () => stops.forEach(stop => stop());
  desktop.addEventListener('change',stopAll);
  reduced.addEventListener('change',stopAll);
  document.addEventListener('visibilitychange', () => {if (document.hidden) stopAll();});
  addEventListener('pagehide',stopAll);
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (!entry.isIntersecting) stops.get(entry.target)();}));
  cards.forEach(card => observer.observe(card));
})();
