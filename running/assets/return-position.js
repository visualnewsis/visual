(function () {
  'use strict';
  // VISUAL NEWSIS addition, kept outside the draft files so syncing never overwrites it.
  // The pinned scenes are laid out by script, so after leaving the page (뉴시스TV on YouTube, a related story, a reload)
  // the browser's own restoration gives up and Back lands on the first screen. Remember the reading position and put it back.
  var KEY = 'visualNewsis:running:position';
  var MAX_AGE = 12 * 60 * 60 * 1000;
  var root = document.documentElement;
  var ready = false;
  var saveTimer = 0;

  function readSaved() {
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(KEY) || 'null');
      if (!saved || saved.path !== window.location.pathname) return null;
      if (!(saved.y >= 1) || !(Date.now() - saved.at < MAX_AGE)) return null;
      return saved.y;
    } catch (error) {
      return null;
    }
  }

  function navigationType() {
    try {
      var entry = window.performance.getEntriesByType('navigation')[0];
      if (entry && entry.type) return entry.type;
      var legacy = window.performance.navigation && window.performance.navigation.type;
      return legacy === 2 ? 'back_forward' : legacy === 1 ? 'reload' : 'navigate';
    } catch (error) {
      return 'navigate';
    }
  }

  function save() {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify({
        path: window.location.pathname,
        y: Math.round(window.pageYOffset || root.scrollTop || 0),
        at: Date.now()
      }));
    } catch (error) { /* private mode or blocked storage: the browser's own behaviour remains */ }
  }

  function restore(target) {
    var previousSnap = root.style.scrollSnapType;
    var started = Date.now();
    var stable = 0;
    var done = false;
    var timer = 0;
    var events = ['wheel', 'touchstart', 'keydown', 'mousedown'];

    function finish() {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      events.forEach(function (type) { window.removeEventListener(type, finish, true); });
      root.style.scrollSnapType = previousSnap;
      ready = true;
    }

    function attempt() {
      if (done) return;
      window.scrollTo({ top: target, left: 0, behavior: 'instant' });
      // The reading-rest gate remembers the last position it saw; bring it to this one so a long jump is not mistaken for a skipped scene.
      try { if (window.chapterRest) window.chapterRest.reset(); } catch (error) { /* gate not ready yet */ }
      stable = Math.abs((window.pageYOffset || 0) - target) <= 2 ? stable + 1 : 0;
      if ((stable >= 3 && document.readyState === 'complete') || Date.now() - started > 3500) {
        finish();
        return;
      }
      timer = window.setTimeout(attempt, 120);
    }

    // A reader who starts scrolling takes over immediately.
    events.forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
    // Proximity snapping would nudge the landing point while the layout is still settling.
    root.style.scrollSnapType = 'none';
    attempt();
  }

  var saved = null;
  var type = navigationType();
  if (type === 'back_forward' || type === 'reload') saved = readSaved();

  if (saved !== null) {
    try { window.history.scrollRestoration = 'manual'; } catch (error) { /* ignore */ }
    var begin = function () { restore(saved); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin);
    else begin();
  } else {
    ready = true;
  }

  window.addEventListener('scroll', function () {
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () { saveTimer = 0; save(); }, 250);
  }, { passive: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') save();
  });
}());
