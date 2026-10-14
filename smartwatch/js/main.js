(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var mqMobile = window.matchMedia('(max-width:819px)');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- 분해도: 기능 개념도 (실제 내부 구조와 다름) ---------- */
  var INK = '#2b2f33', GRAY = '#8a9099', FILL = '#e3e6e9', SIDE = '#c9cdd2', WHITE = '#fff', ACCENT = '#e8590c';
  var ISO = 'matrix(0.866,0.5,-0.866,0.5,0,0)'; // 평면(위에서 본 좌표)을 3/4 시점으로
  var K_X = 1.2247, K_Y = 0.7071;               // 원 반지름 r → 화면 타원 rx, ry
  var CX = 260, CY = 300;

  // 레이어: 조립 상태 오프셋(y0)과 분해 시 추가 이동(dy)
  var LAYERS = [
    { id: 'strap',   y0: 14, dy: 300, badge: 4 },
    { id: 'back',    y0: 22, dy: 160 },
    { id: 'battery', y0: 12, dy: 80,  badge: 3 },
    { id: 'module',  y0: 6,  dy: -10, badge: 2 },
    { id: 'case',    y0: 0,  dy: -100, badge: 1 },
    { id: 'screen',  y0: -4, dy: -190 }
  ];

  function disc(g, r, t, top, side) {
    var rx = r * K_X, ry = r * K_Y;
    if (t > 0) {
      el('path', {
        d: 'M' + (CX - rx) + ',' + CY + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (CX + rx) + ',' + CY +
           ' L' + (CX + rx) + ',' + (CY + t) + ' A' + rx + ' ' + ry + ' 0 0 1 ' + (CX - rx) + ',' + (CY + t) + ' Z',
        fill: side, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round'
      }, g);
    }
    el('ellipse', { cx: CX, cy: CY, rx: rx, ry: ry, fill: top, stroke: INK, 'stroke-width': 1.4 }, g);
    return { rx: rx, ry: ry };
  }

  function plane(g, dy) {
    return el('g', { transform: 'translate(' + CX + ',' + (CY + (dy || 0)) + ') ' + ISO }, g);
  }

  function badge(g, n, x2) {
    var b = el('g', { 'class': 'badge' }, g);
    el('line', { x1: 52, y1: CY, x2: x2, y2: CY, stroke: GRAY, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, b);
    el('circle', { cx: 38, cy: CY, r: 14, fill: INK }, b);
    var t = el('text', { x: 38, y: CY + 4.5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: WHITE, 'font-family': 'Noto Sans KR, sans-serif' }, b);
    t.textContent = n;
  }

  var builders = {
    strap: function (g) {
      var p0 = plane(g, 7), p1 = plane(g, 0);
      [p0, p1].forEach(function (p, i) {
        el('rect', { x: -46, y: -220, width: 92, height: 440, rx: 40, fill: i ? FILL : SIDE, stroke: INK, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' }, p);
      });
      // 버클(위 끝)과 구멍(아래 끝)
      el('rect', { x: -56, y: -232, width: 112, height: 34, rx: 8, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke' }, p1);
      for (var y = 104; y <= 188; y += 21) el('rect', { x: -8, y: y, width: 16, height: 10, rx: 5, fill: WHITE, stroke: INK, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, p1);
    },
    back: function (g) {
      disc(g, 104, 10, FILL, SIDE);
      var p = plane(g);
      el('circle', { cx: 0, cy: 0, r: 34, fill: 'none', stroke: GRAY, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }, p);
      el('circle', { cx: 0, cy: 0, r: 12, fill: GRAY }, p);
    },
    battery: function (g) {
      disc(g, 76, 12, GRAY, '#6f757d');
      var p = plane(g);
      el('circle', { cx: 0, cy: 0, r: 58, fill: 'none', stroke: '#b5bac1', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, p);
    },
    module: function (g) {
      disc(g, 90, 4, WHITE, FILL);
      var p = plane(g);
      el('rect', { x: -20, y: -20, width: 40, height: 40, rx: 4, fill: FILL, stroke: INK, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }, p);
      [44, 58, 72].forEach(function (r) {
        el('path', { d: 'M' + r * Math.cos(-0.6) + ',' + r * Math.sin(-0.6) + ' A' + r + ' ' + r + ' 0 0 1 ' + r * Math.cos(0.6) + ',' + r * Math.sin(0.6),
          fill: 'none', stroke: GRAY, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, p);
      });
    },
    case: function (g) {
      // 러그
      var p0 = plane(g, 10), p1 = plane(g, 0);
      [p0, p1].forEach(function (p, i) {
        var f = i ? FILL : SIDE;
        el('rect', { x: -36, y: -128, width: 72, height: 40, rx: 8, fill: f, stroke: INK, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' }, p);
        el('rect', { x: -36, y: 88, width: 72, height: 40, rx: 8, fill: f, stroke: INK, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' }, p);
      });
      var e = disc(g, 110, 22, FILL, SIDE);
      el('ellipse', { cx: CX, cy: CY, rx: 96 * K_X, ry: 96 * K_Y, fill: WHITE, stroke: INK, 'stroke-width': 1.2 }, g);
      // SOS 버튼(강조색)과 보조 버튼
      el('rect', { x: CX + e.rx - 3, y: CY + 3, width: 10, height: 15, rx: 3, fill: ACCENT, stroke: INK, 'stroke-width': 1.2 }, g);
      var a = 0.75;
      el('ellipse', { cx: CX + e.rx * Math.cos(a), cy: CY + e.ry * Math.sin(a) + 12, rx: 9, ry: 7, fill: FILL, stroke: INK, 'stroke-width': 1.2 }, g);
      // 연결(신호) — 5번 카드에서만 보임
      var s = el('g', { 'class': 'signal' }, g);
      [22, 38, 54].forEach(function (r) {
        var x0 = CX + e.rx + 20, y0 = CY - 10;
        el('path', { d: 'M' + (x0 + r * Math.cos(-0.7)) + ',' + (y0 + r * Math.sin(-0.7)) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x0 + r * Math.cos(0.7)) + ',' + (y0 + r * Math.sin(0.7)),
          fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, s);
      });
      var bx = CX + e.rx + 92, by = CY - 10;
      el('circle', { cx: bx, cy: by, r: 14, fill: INK }, s);
      el('text', { x: bx, y: by + 4.5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: WHITE, 'font-family': 'Noto Sans KR, sans-serif' }, s).textContent = '5';
    },
    screen: function (g) {
      var e = disc(g, 92, 3, INK, '#1c1f22');
      el('line', { x1: CX - e.rx * 0.62, y1: CY + e.ry * 0.18, x2: CX - e.rx * 0.08, y2: CY - e.ry * 0.62, stroke: '#6b7178', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    }
  };

  var svg = document.getElementById('watch-svg');
  var layerEls = {};
  if (svg) {
    LAYERS.forEach(function (L) {
      var g = el('g', { 'class': 'layer', 'data-id': L.id }, svg);
      builders[L.id](g);
      if (L.badge) {
        var x2 = { strap: CX - 62, battery: CX - 76 * K_X, module: CX - 90 * K_X, case: CX - 110 * K_X, screen: CX - 92 * K_X }[L.id];
        badge(g, L.badge, x2);
      }
      layerEls[L.id] = { g: g, L: L };
    });
  }

  function setExplode(e) {
    LAYERS.forEach(function (L) {
      var o = layerEls[L.id];
      o.g.style.transform = 'translateY(' + (L.y0 + L.dy * e) + 'px)';
      var b = o.g.querySelector('.badge');
      if (b) b.style.opacity = e > 0.5 ? 1 : 0;
    });
  }

  var LAYER_OF = { screen: 'screen', button: 'case', module: 'module', battery: 'battery', strap: 'strap', signal: 'case' };
  function setActive(key) {
    if (!svg) return;
    var mobile = mqMobile.matches;
    svg.classList.toggle('focus', !!key && !mobile);
    svg.classList.toggle('sig', key === 'signal' || mobile);
    for (var id in layerEls) layerEls[id].g.classList.toggle('on', LAYER_OF[key] === id);
  }

  var cards = [].slice.call(document.querySelectorAll('.xcard'));
  function onScrollExplode() {
    if (!svg) return;
    if (mqMobile.matches) { setExplode(1); setActive(null); return; }
    var mid = window.innerHeight * 0.55, active = null;
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var on = r.top < mid && r.bottom > mid;
      c.classList.toggle('on', on);
      if (on) active = c.getAttribute('data-layer');
    });
    var first = cards[0] && cards[0].getBoundingClientRect();
    var started = first && first.top < window.innerHeight * 0.85;
    setExplode(started ? 1 : 0);
    setActive(active);
  }

  if (svg) {
    setExplode(mqMobile.matches ? 1 : 0);
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; onScrollExplode(); });
    }, { passive: true });
    window.addEventListener('resize', onScrollExplode);
    onScrollExplode();
  }

  /* ---------- 등장 ---------- */
  var reveal = [].slice.call(document.querySelectorAll('.bars'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    reveal.forEach(function (n) { io.observe(n); });
  } else {
    reveal.forEach(function (n) { n.classList.add('in'); });
  }

  /* 원본과 같은 캔버스의 LCD 윤곽 SVG를 함께 축소한다. */
  if (!reduce) {
    var heroWatch = document.querySelector('.hero-art');
    var endWatch = document.querySelector('.end-art');
    if (heroWatch) {
      var lights = [].slice.call(heroWatch.querySelectorAll('img'));
      Promise.all(lights.map(function (img) {
        return img.complete ? Promise.resolve() : new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })).then(function () { heroWatch.classList.add('lcd-play'); });
    }
    if (endWatch && 'IntersectionObserver' in window) {
      var lcdObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { endWatch.classList.add('lcd-play'); lcdObserver.disconnect(); }
        });
      }, { threshold: .35 });
      lcdObserver.observe(endWatch);
    }
  }

  /* ---------- 독자가 직접 복사·제출하는 의견: 저장·전송 없음 ---------- */
  var opinionText = document.getElementById('opinion-text');
  var copyOpinion = document.getElementById('opinion-copy');
  var opinionStatus = document.getElementById('opinion-status');
  if (opinionText && copyOpinion && opinionStatus) {
    copyOpinion.addEventListener('click', async function () {
      var text = opinionText.value.trim();
      if (!text) {
        opinionStatus.textContent = '복사할 의견을 먼저 적어주세요.';
        opinionText.focus();
        return;
      }
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        opinionStatus.textContent = '의견을 복사했습니다. 국민신문고에서 직접 붙여넣고 제출해주세요.';
      } catch (error) {
        opinionText.focus();
        opinionText.select();
        opinionText.setSelectionRange(0, opinionText.value.length);
        opinionStatus.textContent = '자동 복사를 사용할 수 없습니다. 선택된 글을 복사한 뒤 국민신문고에 붙여넣어주세요.';
      }
    });
  }
})();
