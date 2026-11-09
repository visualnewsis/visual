/* Keep the first paint and recovery independent of the 3D module graph. */
(() => {
  document.documentElement.classList.add('gd-js');
  const hosts = new Map();
  let earlyModuleError = false;
  window.addEventListener('goodeasy:record', event => {
    window.GoodeasyLastRecord = event.detail?.record
      ? JSON.parse(JSON.stringify(event.detail.record)) : null;
  });
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const item = hosts.get(entry.target);
      if (item && !entry.target.classList.contains('gd-load-ready') && !entry.target.classList.contains('gd-load-failed')) {
        item.timer = setTimeout(() => {
          if (entry.target.classList.contains('gd-load-ready')) return;
          item.el.querySelector('strong').textContent = '3D 모형을 불러오는 데 시간이 걸립니다';
          item.el.querySelector('button').hidden = false;
        }, 12000);
      }
      visibility.unobserve(entry.target);
    }
  });
  function panel(host) {
    if (hosts.has(host)) return hosts.get(host);
    host.classList.add('gd-load-host');
    const el = document.createElement('div');
    el.className = 'gd-load-panel';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="gd-load-dot" aria-hidden="true"></span><strong>3D 모형을 준비하고 있습니다</strong><p>조작은 준비되는 대로 바로 이어집니다.</p><button type="button" hidden>다시 불러오기</button>';
    host.append(el);
    const item = {host, el, timer: 0};
    hosts.set(host, item);
    el.querySelector('button').onclick = () => location.reload();
    visibility.observe(host);
    return item;
  }
  function ready(canvas) {
    const host = canvas.closest('.gd-load-host');
    const item = hosts.get(host);
    if (!item || host.classList.contains('gd-load-ready')) return;
    clearTimeout(item.timer);
    visibility.unobserve(host);
    host.dataset.gdReadyMs = String(Math.round(performance.now()));
    host.classList.add('gd-load-ready');
    host.classList.remove('gd-load-failed');
    item.el.hidden = true;
    if (host.closest('#play')) document.body.classList.remove('gd-rendering');
  }
  function fail(target, error) {
    const host = hosts.has(target) ? target : target?.closest('.gd-load-host') || (target?.tagName === 'CANVAS' ? target.parentElement : target);
    if (!host) return;
    const item = panel(host);
    clearTimeout(item.timer);
    visibility.unobserve(host);
    host.classList.remove('gd-load-ready');
    host.classList.add('gd-load-failed');
    item.el.hidden = false;
    item.el.querySelector('strong').textContent = '3D 그래픽을 시작하지 못했습니다';
    item.el.querySelector('p').textContent = /WebGL|context|그래픽/i.test(String(error?.message || error))
      ? '브라우저의 그래픽 가속이 꺼져 있거나 그래픽을 사용할 수 없는 상태입니다. 그래픽 가속을 확인한 뒤 다시 시도해 주세요.'
      : '연결 상태를 확인한 뒤 다시 불러와 주세요.';
    item.el.querySelector('button').hidden = false;
    if (host.closest('#play')) document.body.classList.remove('gd-rendering');
  }
  window.GoodeasyLoading = {ready, fail, watch: panel};
  function loadScript(script) {
    const active = document.createElement('script');
    active.type = 'module';
    active.src = script.dataset.gdSrc;
    active.dataset.gdTarget = script.dataset.gdTarget;
    script.replaceWith(active);
  }
  function start() {
    if (document.querySelector('script[src*="quality-stage.js"]')) document.body.classList.add('gd-rendering');
    document.querySelectorAll('#play .stage,.string-bench,#bow-pad,.hero-stage,.mechanism-preview,.scene-wrap,.projector-preview').forEach(panel);
    if (earlyModuleError) for (const {host} of hosts.values()) fail(host, new Error('module network'));
    const lazy = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        for (const script of document.querySelectorAll('script[data-gd-src]')) {
          if (document.querySelector(script.dataset.gdTarget) === entry.target) loadScript(script);
        }
        lazy.unobserve(entry.target);
      }
    }, {rootMargin: '180px'});
    for (const script of document.querySelectorAll('script[data-gd-src]')) {
      const target = document.querySelector(script.dataset.gdTarget);
      if (target) lazy.observe(target); else loadScript(script);
    }
  }
  window.addEventListener('error', event => {
    if (event.target?.tagName !== 'SCRIPT' || !/goodeasy|quality-stage|scene|observation|app\.js/.test(event.target.src || '')) return;
    earlyModuleError = true;
    const target = event.target.dataset?.gdTarget && document.querySelector(event.target.dataset.gdTarget);
    if (target) {panel(target); fail(target, new Error('module network'));}
    else for (const {host} of hosts.values()) if (!host.classList.contains('gd-load-ready')) fail(host, new Error('module network'));
  }, true);
  window.addEventListener('webglcontextlost', event => {event.preventDefault(); fail(event.target, new Error('WebGL context lost'));}, true);
  window.addEventListener('webglcontextrestored', event => {
    const item = hosts.get(event.target.closest('.gd-load-host'));
    if (item) {item.el.querySelector('strong').textContent = '3D 모형을 다시 준비하고 있습니다'; item.host.classList.remove('gd-load-failed');}
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
