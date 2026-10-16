/* Progressive enhancement. Logo geometry and cover come from the live page. */
(() => {
  // A reload is a new first visit to the intro, even if the browser would
  // otherwise restore the document's previous scroll position.
  if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
    history.scrollRestoration = 'manual';
    const reset = () => scrollTo({top:0,left:0,behavior:'instant'});
    reset();
    addEventListener('pageshow',reset,{once:true});
  }
  const hero = document.querySelector('.hero');
  const mark = hero?.querySelector('.shop-mark svg');
  // Editorial selection is the existing feature card, never the newest story.
  const cover = hero?.querySelector('.feature-main .feature-image img');
  const copy = hero?.querySelector('.hero-top .eyebrow');
  if (copy) copy.textContent = '뉴스의 다음 페이지';
  if (!hero || !mark || !cover) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup = () => {};
  // Lifetime is this document only: returning upward cannot replay; reload can.
  let completed = false;
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  function start() {
    cleanup();
    if (completed || motion.matches || !cover.complete || !cover.naturalWidth) return;
    // Reuse the original central subpath, including its relative coordinates.
    const d = mark.querySelector('path').getAttribute('d');
    const parts = d.split('zm');
    const origin = d.match(/^M[\d.]+ [\d.]+/);
    if (parts.length !== 2 || !origin) return;
    const hole = origin[0] + 'm' + parts[1];
    const zone = document.createElement('div');
    zone.className = 'vf-zone';
    hero.before(zone);
    zone.append(hero);
    const overlay = document.createElement('div');
    overlay.className = 'vf-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const svg = el('svg');
    const defs = el('defs');
    const mask = el('clipPath', {id:'vf-aperture', clipPathUnits:'userSpaceOnUse'});
    const aperture = el('path', {d:hole});
    mask.append(aperture);
    defs.append(mask);
    const paper = el('rect', {fill:getComputedStyle(document.body).backgroundColor});
    // Keep the picture in HTML, with the same object-fit renderer as the card.
    // SVG <image> sampling can otherwise change the texture at handoff.
    const apertureWindow = document.createElement('div');
    apertureWindow.className = 'vf-window';
    const image = document.createElement('img');
    image.className = 'vf-image';
    image.alt = '';
    image.src = cover.currentSrc || cover.src;
    const coverStyle = getComputedStyle(cover);
    Object.assign(image.style, {objectFit:coverStyle.objectFit,objectPosition:coverStyle.objectPosition});
    apertureWindow.append(image);
    // Wait for the overlay's own image renderer before covering original content.
    let imageReady = false;
    image.addEventListener('load', () => {imageReady = true; schedule();}, {once:true});
    const logo = el('g', {color:getComputedStyle(mark).color});
    [...mark.children].forEach(child => logo.append(child.cloneNode(true)));
    // Do not replay the original awning's entrance animation on the clone.
    logo.querySelectorAll('*').forEach(node => node.style.animation = 'none');
    svg.append(defs, paper, logo);
    overlay.append(svg, apertureWindow);
    document.body.append(overlay);
    let frame = 0, distance = 0, top = 64, width = 0, height = 0, disposed = false;
    let previousScroll = scrollY, started = false;
    const clamp = value => Math.max(0, Math.min(1, value));
    const range = (p,a,b) => clamp((p-a)/(b-a));
    const mix = (a,b,t) => a+(b-a)*t;
    const ease = t => t*t*(3-2*t);
    function measure() {
      if (disposed) return;
      top = document.querySelector('.vnh-header')?.getBoundingClientRect().bottom || 64;
      document.documentElement.style.setProperty('--vf-top', `${top}px`);
      width = document.documentElement.clientWidth;
      height = overlay.clientHeight;
      distance = Math.min(height * 1.25, 1100);
      zone.style.height = `${hero.offsetHeight + distance}px`;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      paper.setAttribute('width',width);
      paper.setAttribute('height',height);
      render();
    }
    function render() {
      if (disposed) return;
      frame = 0;
      // Read all live screen geometry before any writes. In particular, hero
      // unpins at the end and cannot be used as a fixed overlay's coordinate space.
      const p = clamp((top-zone.getBoundingClientRect().top)/distance);
      const upward = scrollY < previousScroll - 1;
      previousScroll = scrollY;
      // No reverse playback, including when the first pass is interrupted.
      if (p >= 1 || (started && upward)) {
        completed = true;
        const before = cover.getBoundingClientRect().top;
        const root = document.documentElement;
        const behavior = root.style.getPropertyValue('scroll-behavior');
        const priority = root.style.getPropertyPriority('scroll-behavior');
        root.style.setProperty('scroll-behavior','auto','important');
        cleanup();
        // Removing the pin distance must not move the actual card on screen.
        scrollBy(0,cover.getBoundingClientRect().top-before);
        if (behavior) root.style.setProperty('scroll-behavior',behavior,priority);
        else root.style.removeProperty('scroll-behavior');
        return;
      }
      if (imageReady && p > 0) started = true;
      const bounds = svg.getBoundingClientRect();
      const screen = mark.getScreenCTM();
      const card = cover.closest('.feature-image').getBoundingClientRect();
      const sx = width / bounds.width, sy = height / bounds.height;
      const target = {x:(card.left-bounds.left)*sx, y:(card.top-bounds.top)*sy,w:card.width*sx,h:card.height*sy};
      // getScreenCTM includes the original SVG's preserveAspectRatio letterbox.
      const source = {x:(screen.e-bounds.left)*sx,y:(screen.f-bounds.top)*sy,s:screen.a*sx};
      const active = imageReady && p > 0 && p < 1;
      const handoff = range(p,.96,1);
      // The hole's centre is (57,68.5). Scale until its narrow dimension
      // covers the viewport; no approximation of the actual logo path.
      const travel = ease(range(p,0,.30));
      const zoom = ease(range(p,.24,.78));
      const scale = mix(source.s, Math.max(width/26,height/25)*1.6,zoom);
      const x = mix(source.x,width/2-57*scale,travel);
      const y = mix(source.y,height/2-68.5*scale,travel);
      const matrix = `translate(${x} ${y}) scale(${scale})`;
      logo.setAttribute('transform', matrix);
      aperture.setAttribute('transform', matrix);
      logo.querySelector('.shop-awning').style.opacity = 1-range(p,.30,.48);
      // Finish alignment before removing the overlay. Its rectangle keeps
      // tracking the card even through unpin, reverse scroll and large jumps.
      const settle = ease(range(p,.79,.96));
      const box = {left:mix(0,target.x,settle),top:mix(0,target.y,settle),width:mix(width,target.w,settle),height:mix(height,target.h,settle)};
      Object.entries(box).forEach(([key,value]) => image.style[key] = `${value}px`);
      image.style.opacity = range(p,.18,.36)*(1-handoff);
      paper.style.opacity = range(p,0,.10)*(1-range(p,.79,.96));
      logo.style.opacity = 1-range(p,.72,.82);
      overlay.style.visibility = active ? 'visible' : 'hidden';
      zone.classList.toggle('vf-active',active);
      zone.classList.toggle('vf-cover-hidden',active && p < .96);
      // Bring the original surrounding copy back while the cover settles, not
      // abruptly on the exact frame where sticky releases.
      zone.style.setProperty('--vf-copy', Math.max(1-range(p,0,.18),range(p,.82,.96)));
    }
    function schedule() {if (!disposed && !frame) frame = requestAnimationFrame(render);}
    function focus(event) {
      // Keyboard navigation must never leave the focused original behind a layer.
      if (hero.contains(event.target)) {completed = true;cleanup();}
    }
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',measure);
    hero.addEventListener('focusin',focus);
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    cleanup = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      removeEventListener('scroll',schedule);
      removeEventListener('resize',measure);
      hero.removeEventListener('focusin',focus);
      observer.disconnect();
      zone.before(hero);zone.remove();overlay.remove();
    };
    measure();
  }
  async function initialize() {
    if (!cover.complete) await new Promise(resolve => {
      cover.addEventListener('load',resolve,{once:true});
      cover.addEventListener('error',resolve,{once:true});
    });
    if (!cover.naturalWidth) return;
    // Optional editorial high-resolution rendition, selected BEFORE animation.
    // Both the original card and overlay use it; never swap during the zoom.
    const highSource = cover.dataset.viewfinderSrc;
    if (highSource) {
      const original = ['src','srcset','sizes'].map(name => [name,cover.getAttribute(name)]);
      let promoted = false;
      const high = new Image();
      high.src = highSource;
      try {
        await high.decode();
        const sameRatio = Math.abs(high.naturalWidth/high.naturalHeight-cover.naturalWidth/cover.naturalHeight) < .001;
        if (sameRatio && high.naturalWidth >= cover.naturalWidth && scrollY === 0) {
          cover.removeAttribute('srcset');
          cover.removeAttribute('sizes');
          promoted = true;
          cover.src = high.src;
          await cover.decode();
        }
      } catch {
        if (promoted) {
          original.forEach(([name,value]) => value === null ? cover.removeAttribute(name) : cover.setAttribute(name,value));
          try {await cover.decode();} catch {return;}
        }
      }
    }
    start();
    motion.addEventListener('change',start);
  }
  initialize();
})();
