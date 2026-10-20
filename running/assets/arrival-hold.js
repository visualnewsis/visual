(function () {
  'use strict';
  // VISUAL NEWSIS addition, kept outside the draft files so syncing never overwrites it.
  // In the safety-guide book, the page turn from "달리기 전" to "중단·완주 뒤" is driven by scroll distance, so a thumb that is
  // still moving carries the reader straight through the new page. When the turn completes on a phone, hold the page at its
  // top for a moment by pausing scrolling, then let the reader continue with the next swipe.
  var HOLD_MS = 1200;
  var narrow = window.matchMedia('(max-width: 900px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var lastY = window.scrollY || 0;
  var armed = true;
  var timer = 0;

  function arrivalY() {
    var book = window.guidanceBookController;
    if (!book || !book.enabled || typeof book.positionFor !== 'function') return null;
    var y = book.positionFor('recovery');
    return typeof y === 'number' && isFinite(y) ? y : null;
  }

  function release() {
    window.clearTimeout(timer);
    timer = 0;
    root.classList.remove('vn-arrival-hold');
  }

  function hold(y) {
    root.classList.add('vn-arrival-hold');
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    timer = window.setTimeout(release, HOLD_MS);
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY || 0;
    var previous = lastY;
    lastY = y;
    if (timer || !narrow.matches || reduced.matches) return;
    var arrive = arrivalY();
    if (arrive === null) return;
    if (y < arrive - 120) {
      armed = true;
      return;
    }
    var step = y - previous;
    // Only a forward, ordinary scroll that crosses the arrival point is held; a jump (menu tab, link, restored position) is not.
    if (armed && previous < arrive - 2 && y >= arrive - 2 && step > 0 && step < window.innerHeight * 0.6) {
      armed = false;
      hold(arrive);
    } else if (y > arrive + 2) {
      armed = false;
    }
  }, { passive: true });

  window.addEventListener('pagehide', release);
  document.addEventListener('visibilitychange', function () { if (document.hidden) release(); });
}());
