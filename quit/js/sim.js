/* 퇴사 후 생존기간 시뮬레이터
   제도 수치(RULES)는 2026년 10월 기준이다. 출처는 기사 하단 '자료'에 정리했다. */
(() => {
  'use strict';

  const RULES = {
    // 구직급여: 이직 전 평균임금의 60%. 1일 상한 6만8100원(2026. 1. 1 이후 이직자), 하한 = 최저임금 1만320원 × 80% × 8시간
    ui: {
      rate: 0.6,
      dailyMax: 68100,
      dailyMin: 66048,
      waitDays: 7,
      capDays: 365,
      // 고용보험법 별표1: 피보험기간 1년 미만 / 1~3년 / 3~5년 / 5~10년 / 10년 이상
      days: { under50: [120, 150, 180, 210, 240], over50: [120, 180, 210, 240, 270] },
      // 이직 전 18개월 중 피보험 단위기간 180일(주휴일 포함 주 6일 산입 기준 약 7개월)을 근속으로 어림
      minTenureYears: 7 / 12
    },
    // 건강보험 임의계속가입: 직장가입자 본인부담분(7.19%의 절반) + 장기요양(건보료의 13.14%)
    health: { empShare: 0.03595, ltcRatio: 0.1314 },
    // 국민연금 지역가입자: 보험료율 9.5% 전액 본인 부담, 기준소득월액 상한 659만원(2026. 7~2027. 6)
    pension: { rate: 0.095, incomeCap: 6590000, incomeFloor: 410000 },
    horizonMonths: 36
  };

  const PRESETS = {
    junior: { savings: 1200, salary: 280, tenure: 2, living: 180, side: 0, age50: false },
    mid: { savings: 3500, salary: 380, tenure: 5, living: 230, side: 0, age50: false },
    senior: { savings: 8000, salary: 520, tenure: 12, living: 300, side: 0, age50: false }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const won = (manwon) => Math.round(manwon * 10000);
  const fmtMan = (manwon) => {
    const v = Math.round(manwon);
    if (Math.abs(v) >= 10000) {
      const eok = Math.trunc(v / 10000);
      const rest = Math.abs(v % 10000);
      return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만원` : `${eok}억원`;
    }
    return `${v.toLocaleString('ko-KR')}만원`;
  };

  function tenureIndex(years) {
    if (years < 1) return 0;
    if (years < 3) return 1;
    if (years < 5) return 2;
    if (years < 10) return 3;
    return 4;
  }

  function unemployment(state) {
    const r = RULES.ui;
    const eligible = state.reason === 'justified' && state.tenure >= r.minTenureYears;
    const avgDaily = won(state.salary) * 3 / 91;
    const daily = Math.round(Math.min(Math.max(avgDaily * r.rate, r.dailyMin), r.dailyMax));
    const days = (state.age50 ? r.days.over50 : r.days.under50)[tenureIndex(state.tenure)];
    return { eligible, daily, days, total: eligible ? daily * days : 0 };
  }

  // 월(30일 단위)마다 들어오는 구직급여(만원). 대기기간 이후부터 소정급여일수만큼, 이직 후 1년 안에서만 지급.
  function uiForMonth(ui, month) {
    if (!ui.eligible) return 0;
    const start = RULES.ui.waitDays + 1;
    const end = Math.min(RULES.ui.waitDays + ui.days, RULES.ui.capDays);
    const from = Math.max(start, (month - 1) * 30 + 1);
    const to = Math.min(end, month * 30);
    return to >= from ? ((to - from + 1) * ui.daily) / 10000 : 0;
  }

  function monthlyCosts(state) {
    const health = state.healthMode === 'custom'
      ? state.healthCustom
      : (won(state.salary) * RULES.health.empShare * (1 + RULES.health.ltcRatio)) / 10000;
    const pension = state.pensionMode === 'pay'
      ? (Math.min(Math.max(won(state.salary), RULES.pension.incomeFloor), RULES.pension.incomeCap) * RULES.pension.rate) / 10000
      : 0;
    return { health, pension, living: state.living };
  }

  function simulate(state) {
    const ui = unemployment(state);
    const costs = monthlyCosts(state);
    const severance = state.tenure >= 1 ? state.salary * state.tenure : 0;
    const start = state.savings + severance;
    const series = [start];
    let balance = start;
    let months = null;
    for (let m = 1; m <= RULES.horizonMonths; m += 1) {
      const prev = balance;
      balance += uiForMonth(ui, m) + state.side - costs.living - costs.health - costs.pension;
      series.push(balance);
      if (months === null && balance < 0) {
        months = m - 1 + (prev > 0 ? prev / (prev - balance) : 0);
      }
    }
    const uiMonthly = ui.eligible ? ui.total / 10000 / Math.ceil(ui.days / 30) : 0;
    return { ui, costs, severance, start, series, months, uiMonthly };
  }

  // ---------- 화면 ----------
  const form = $('#simForm');
  if (!form) return;
  const out = {
    months: $('#resMonths'),
    date: $('#resDate'),
    summary: $('#resSummary'),
    chart: $('#simChart'),
    legend: $('#simLegend'),
    flow: $('#simFlow'),
    ui: $('#resUi'),
    belt: $('#beltResult')
  };

  function readState() {
    // 음수 입력은 0으로 처리한다
    const val = (name) => {
      const el = form.elements[name];
      const n = Number(el.value);
      const max = el.max === '' ? Number.MAX_SAFE_INTEGER / 1000000 : Number(el.max);
      return Math.min(max, Math.max(0, Number.isFinite(n) ? n : 0));
    };
    return {
      savings: val('savings'),
      salary: val('salary'),
      tenure: val('tenure'),
      living: val('living'),
      side: val('side'),
      age50: form.elements.age50.checked,
      reason: form.elements.reason.value,
      healthMode: form.elements.healthMode.value,
      healthCustom: val('healthCustom'),
      pensionMode: form.elements.pensionMode.value
    };
  }

  function monthsText(months) {
    if (months === null) return `${RULES.horizonMonths}개월 이상`;
    const totalDays = Math.round(months * 30);
    const whole = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    if (whole === 0) return `${days}일`;
    return days ? `${whole}개월 ${days}일` : `${whole}개월`;
  }

  // 어림셈이므로 결과 기간 앞에 '약'을 붙인다
  const approx = (months) => (months === null ? `${RULES.horizonMonths}개월 이상` : `약 ${monthsText(months)}`);

  function dateText(months) {
    if (months === null) return `${RULES.horizonMonths}개월 안에는 0원 아래로 내려가지 않는다`;
    const d = new Date();
    d.setDate(d.getDate() + Math.round(months * 30));
    return `오늘 퇴사하면 ${d.getFullYear()}년 ${d.getMonth() + 1}월께 잔고가 0원 아래로 내려간다`;
  }

  function drawChart(lines) {
    const W = 640;
    const H = 300;
    const pad = { l: 34, r: 40, t: 34, b: 40 };
    const all = lines.flatMap((l) => l.series);
    const max = Math.max(...all, 1);
    const min = Math.min(...all, 0);
    const x = (m) => pad.l + (m / RULES.horizonMonths) * (W - pad.l - pad.r);
    const y = (v) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
    const path = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    let svg = `<rect x="${pad.l}" y="${y(0)}" width="${W - pad.l - pad.r}" height="${Math.max(0, y(min) - y(0))}" class="sim-red-zone"/>`;
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(0)}" y2="${y(0)}" class="sim-zero"/>`;
    for (let m = 0; m <= RULES.horizonMonths; m += 6) {
      svg += `<text x="${x(m)}" y="${H - 10}" class="sim-tick" text-anchor="middle">${m === 0 ? '퇴사' : `${m}개월`}</text>`;
    }
    svg += `<text x="${pad.l + 6}" y="${y(max) - 10}" class="sim-tick">${fmtMan(max)}</text>`;
    svg += `<text x="${W - pad.r + 4}" y="${y(0) + 5}" class="sim-tick">0</text>`;
    lines.slice().reverse().forEach((l) => {
      svg += `<path d="${path(l.series)}" class="sim-line sim-line--${l.key}"/>`;
    });
    const main = lines[0];
    if (main.months !== null) {
      const cx = x(main.months);
      svg += `<circle cx="${cx}" cy="${y(0)}" r="6" class="sim-dot"/>`;
      svg += `<text x="${Math.min(Math.max(cx, pad.l + 60), W - pad.r - 60)}" y="${y(0) - 14}" class="sim-dot-label" text-anchor="middle">${approx(main.months)}</text>`;
    }
    out.chart.innerHTML = svg;
    out.legend.innerHTML = lines.map((l) => `<li class="sim-legend--${l.key}"><i></i>${l.label} <b>${approx(l.months)}</b></li>`).join('');
  }

  function render() {
    const state = readState();
    form.elements.healthCustom.closest('.field').hidden = state.healthMode !== 'custom';
    const base = simulate(state);
    const alt = simulate({ ...state, reason: state.reason === 'justified' ? 'voluntary' : 'justified' });
    const beltPct = Number(form.elements.belt.value) || 0;
    const belt = simulate({ ...state, living: state.living * (1 - beltPct / 100) });

    out.months.textContent = approx(base.months);
    const bar = $('#resBarValue');
    if (bar) bar.textContent = approx(base.months);
    out.date.textContent = dateText(base.months);
    const outflow = base.costs.living + base.costs.health + base.costs.pension;
    out.summary.textContent = '월급은 멈추고, 생활비와 보험료는 계속 빠져나간다.';
    $('#ledgerSavings').textContent = fmtMan(state.savings);
    $('#ledgerSeverance').textContent = '+ ' + fmtMan(base.severance);
    $('#ledgerStart').textContent = fmtMan(base.start);
    $('#stepSeverance').textContent = fmtMan(base.severance);
    $('#stepStart').textContent = fmtMan(base.start);
    const net = outflow - state.side;
    $('#ledgerNet').textContent = net > 0
      ? '실업급여가 없는 달에는 통장에서 ' + fmtMan(net) + '씩 줄어든다.'
      : '실업급여 없이도 매달 수입이 지출' + (net === 0 ? '과 같다.' : '보다 ' + fmtMan(-net) + ' 많다.');
    $('#beltSpend').textContent = '월 ' + fmtMan(state.living) + ' → ' + fmtMan(state.living * (1 - beltPct / 100));

    out.ui.innerHTML = base.ui.eligible
      ? `실업급여(구직급여)는 하루 <b>${base.ui.daily.toLocaleString('ko-KR')}원</b> × <b>${base.ui.days}일</b>, 모두 <b>${fmtMan(base.ui.total / 10000)}</b>으로 계산했다.`
      : (state.reason === 'justified' ? '근속 기간이 짧아 수급 요건(피보험 단위기간 180일)을 채우지 못한 것으로 보고 <b>실업급여는 넣지 않았다</b>.' : '정당한 이직 사유가 없는 자발적 퇴사로 보고 <b>실업급여는 넣지 않았다</b>.');

    out.flow.innerHTML = [
      ['out', '생활비', base.costs.living],
      ['out', '건강보험료', base.costs.health],
      ['out', '국민연금', base.costs.pension],
      ['in', '실업급여(지급 기간 월평균)', base.uiMonthly],
      ['in', '부수입', state.side],

    ].map(([kind, label, v]) => `<li class="flow--${kind}"><span>${label}</span><b>${kind === 'out' ? '−' : '+'}${fmtMan(v)}</b></li>`).join('');

    const lines = [
      { key: 'main', label: '내 조건', series: base.series, months: base.months },
      { key: 'alt', label: state.reason === 'justified' ? '실업급여를 못 받으면' : '실업급여를 받으면', series: alt.series, months: alt.months }
    ];
    if (beltPct > 0) lines.push({ key: 'belt', label: `생활비 ${beltPct}% 절감`, series: belt.series, months: belt.months });
    drawChart(lines);

    let beltText = '막대를 움직이면 생활비를 줄였을 때의 결과를 그래프에 함께 표시한다.';
    if (beltPct > 0) {
      if (base.months === null) {
        // 두 조건 모두 계산 범위(36개월)를 넘으면 차이를 알 수 없다
        beltText = `두 조건 모두 ${RULES.horizonMonths}개월 이상이라 차이를 계산할 수 없다.`;
      } else if (belt.months === null) {
        beltText = `생활비를 ${beltPct}% 줄이면 ${RULES.horizonMonths}개월 안에는 잔고가 0원 아래로 내려가지 않는다.`;
      } else {
        const gain = belt.months - base.months;
        beltText = gain > 0.05
          ? `생활비를 ${beltPct}% 줄이면 잔고가 0원 아래로 내려가는 시점이 약 ${monthsText(gain)} 늦어진다.`
          : `생활비를 ${beltPct}% 줄여도 잔고가 0원 아래로 내려가는 시점은 거의 같다.`;
      }
    }
    out.belt.textContent = beltText;
    form.elements.belt.setAttribute('aria-valuetext', `${beltPct}%`);
    $('#beltValue').textContent = `${beltPct}%`;
  }

  form.addEventListener('input', render);
  form.addEventListener('change', (e) => {
    if (e.target.type === 'number') {
      const el = e.target;
      const n = Number(el.value);
      el.value = String(Math.min(el.max === '' ? Number.MAX_SAFE_INTEGER / 1000000 : Number(el.max), Math.max(0, Number.isFinite(n) ? n : 0)));
    }
    render();
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  // 생활비 막대는 결과 영역에 있어 form 밖에 놓이므로 직접 연결한다
  form.elements.belt.addEventListener('input', render);
  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      Object.entries(p).forEach(([k, v]) => {
        const el = form.elements[k];
        if (el.type === 'checkbox') el.checked = v; else el.value = v;
      });
      document.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  });
  render();

  // 모바일에서 입력란을 보는 동안에만 화면 아래에 결과 한 줄을 띄운다(결과 영역이 보이면 숨김)
  const bar = $('#resBar');
  if (bar && 'IntersectionObserver' in window) {
    let formOn = false;
    let resultOn = false;
    const sync = () => {
      const show = formOn && !resultOn;
      bar.hidden = !show;
      bar.classList.toggle('is-on', show);
    };
    new IntersectionObserver(([e]) => { formOn = e.isIntersecting; sync(); }).observe(form);
    new IntersectionObserver(([e]) => { resultOn = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe($('.result-head'));
  }

  window.QuitSim = { RULES, simulate };
})();
