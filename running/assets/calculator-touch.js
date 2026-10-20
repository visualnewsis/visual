(function () {
  'use strict';
  // VISUAL NEWSIS addition, kept outside the draft files so syncing never overwrites it.
  // The draft's ▲/▼ buttons on the pace calculator use `touch-action: none` and grab the pointer on touch-down, so a swipe that
  // starts on them neither scrolls the page nor leaves the number alone (it steps once first). On phones those buttons fill most
  // of the calculator screen, which made it feel impossible to scroll past. For touch pointers only: let the page pan, step on a
  // tap, and keep the hold-to-repeat behaviour. Mouse and pen keep the draft's own handlers.
  var HOLD_DELAY = 380;
  var SLOW = 110;
  var FAST = 55;
  var FAST_AFTER = 1600;
  var MOVE_SLOP = 8;
  var state = null;

  function inputFor(button) {
    return document.getElementById(button.id.replace(/(Up|Down)$/, ''));
  }

  function swallowNextClick(button) {
    var timer = 0;
    function eat(event) {
      var hit = event.target && event.target.closest ? event.target.closest('.step-control') : null;
      if (hit !== button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      done();
    }
    function done() {
      window.clearTimeout(timer);
      document.removeEventListener('click', eat, true);
    }
    document.addEventListener('click', eat, true);
    timer = window.setTimeout(done, 500);
  }

  function stop() {
    if (!state) return;
    var current = state;
    state = null;
    window.clearTimeout(current.timer);
    current.button.classList.remove('is-held');
    // After a hold the browser still sends a click on release; the held repeats already counted.
    if (current.held) swallowNextClick(current.button);
  }

  function tick() {
    if (!state) return;
    var current = state;
    var input = inputFor(current.button);
    var before = input ? input.value : null;
    current.button.click();
    if (input && input.value === before) {
      stop();
      return;
    }
    current.timer = window.setTimeout(tick, window.performance.now() - current.started >= FAST_AFTER ? FAST : SLOW);
  }

  function begin() {
    if (!state) return;
    state.held = true;
    state.started = window.performance.now();
    tick();
  }

  document.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'touch' || event.isPrimary === false) return;
    var button = event.target && event.target.closest ? event.target.closest('.step-control') : null;
    if (!button) return;
    // Keep the draft's pointer-capturing handler out of touch input; a plain tap still reaches it as a click.
    event.stopPropagation();
    stop();
    button.classList.add('is-held');
    state = { button: button, pointer: event.pointerId, x: event.clientX, y: event.clientY, held: false, started: 0, timer: 0 };
    state.timer = window.setTimeout(begin, HOLD_DELAY);
  }, true);

  document.addEventListener('pointermove', function (event) {
    if (!state || event.pointerId !== state.pointer) return;
    if (Math.abs(event.clientX - state.x) > MOVE_SLOP || Math.abs(event.clientY - state.y) > MOVE_SLOP) stop();
  }, true);

  ['pointerup', 'pointercancel'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (state && event.pointerId === state.pointer) stop();
    }, true);
  });
  window.addEventListener('blur', stop);
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
}());
