/* 계산대로: 브라우저와 Node에서 함께 사용하는 순수 계산 함수.
 * 기준 확인: 2026-10-29. 연봉은 간이세액표가 아닌 연간 세액 월환산 추정.
 * https://www.nps.or.kr/eng/ntnlpnsplan/cntb/getOHAI0013M0.do
 * https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html
 * https://j.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6439
 * https://b.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7871&mi=6435
 * https://www.moel.go.kr/retirementpayCal.do
 * https://1350.moel.go.kr/rtmview.do?id=1000323938
 */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const MONEY_MAX = 1000000000000;
  function requireValue(ok, message, fieldIndex) {
    if (!ok) {
      const error = new Error(message);
      if (Number.isInteger(fieldIndex)) error.fieldIndex = fieldIndex;
      throw error;
    }
  }
  function number(value, label, min, max, integer) {
    const text = String(value == null ? '' : value).trim();
    // Accept plain decimals and correctly grouped thousands; never silently remove letters.
    requireValue(/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text), label + '에 올바른 숫자를 입력해 주세요.');
    const result = Number(text.replace(/,/g, ''));
    const range = min > 0 && min < 1 && result === 0 ? '0보다 크고 ' + Math.floor(max).toLocaleString('ko-KR') + ' 이하인 값' : min.toLocaleString('ko-KR', { maximumFractionDigits: 6 }) + ' 이상 ' + Math.floor(max).toLocaleString('ko-KR') + ' 이하인 값';
    requireValue(Number.isFinite(result) && result >= min && result <= max, label + ': ' + range + '을 입력해 주세요.');
    requireValue(!integer || Number.isInteger(result), label + ': 정수로 입력해 주세요.');
    return result;
  }
  function fieldNumber(raw, index, label, min, max, integer) {
    try { return number(raw[index], label, min, max, integer); }
    catch (error) { error.fieldIndex = index; throw error; }
  }
  function choice(value, values, label, index) {
    requireValue(values.indexOf(value) !== -1, label + ': 항목을 선택해 주세요.', index);
    return value;
  }
  function date(value, label, index) {
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(String(value)), label + ': 날짜를 확인해 주세요.', index);
    const parts = String(value).split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    requireValue(parts[0] >= 1900 && parts[0] <= 2200 && d.getUTCFullYear() === parts[0] && d.getUTCMonth() === parts[1] - 1 && d.getUTCDate() === parts[2], label + '에 실제 존재하는 날짜를 입력해 주세요.', index);
    return d;
  }
  function subtractMonths(d, count) {
    const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - count, 1));
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    first.setUTCDate(Math.min(d.getUTCDate(), lastDay));
    return first;
  }
  function won(value) {
    requireValue(Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER, '계산 가능한 금액 범위를 초과했습니다. 입력값을 줄여 주세요.');
    const rounded = Math.round(value);
    return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString('ko-KR') + '원';
  }
  function row(label, value) { return { label: label, value: value }; }
  function output(big, rows, note) {
    return { big: big, rows: rows, detail: rows.map(function (r) { return r.label + ' ' + r.value; }).join(' · ') + (note ? '\n' + note : '') };
  }
  function money(raw, index, label, allowZero) { return fieldNumber(raw, index, label, allowZero ? 0 : 0.01, MONEY_MAX); }
  function percent(raw, index, label) { return fieldNumber(raw, index, label, 0, 100); }

  function calculateItem(id, raw) {
    requireValue(Array.isArray(raw), '입력값을 확인해 주세요.');
    if (id === 'salary') {
      // Contract: [annual salary in 만원, dependents including self, children included in dependents, optional monthly non-taxable pay in 원].
      const annual = fieldNumber(raw, 0, '연봉(만원)', 0.01, 1000000) * 10000;
      const family = fieldNumber(raw, 1, '부양가족 수(본인 포함)', 1, 100, true);
      const children = fieldNumber(raw, 2, '부양가족에 포함된 자녀 수', 0, 99, true);
      requireValue(children <= family - 1, '자녀 수는 본인을 제외한 부양가족 수를 넘을 수 없습니다.', 2);
      const monthly = annual / 12;
      const exempt = raw[3] == null || String(raw[3]).trim() === '' ? 0 : fieldNumber(raw, 3, '월 비과세 급여', 0, monthly);
      const taxableMonthly = monthly - exempt;
      const gross = taxableMonthly * 12;
      const pensionBase = taxableMonthly === 0 ? 0 : Math.min(6590000, Math.max(410000, Math.floor(taxableMonthly / 1000) * 1000));
      const pension = pensionBase * 0.0475;
      const health = taxableMonthly * 0.03595;
      const care = health * (0.9448 / 7.19);
      const employment = taxableMonthly * 0.009;
      const insurance = pension + health + care + employment;
      const deduction = Math.min(20000000, gross <= 5000000 ? gross * 0.7 : gross <= 15000000 ? 3500000 + (gross - 5000000) * 0.4 : gross <= 45000000 ? 7500000 + (gross - 15000000) * 0.15 : gross <= 100000000 ? 12000000 + (gross - 45000000) * 0.05 : 14750000 + (gross - 100000000) * 0.02);
      // Children are part of family; do not deduct the same dependent twice.
      const taxBase = Math.max(0, gross - deduction - insurance * 12 - family * 1500000);
      const brackets = [[14000000, 0.06, 0], [50000000, 0.15, 1260000], [88000000, 0.24, 5760000], [150000000, 0.35, 15440000], [300000000, 0.38, 19940000], [500000000, 0.40, 25940000], [1000000000, 0.42, 35940000], [Infinity, 0.45, 65940000]];
      const bracket = brackets.find(function (b) { return taxBase <= b[0]; });
      const beforeCredit = Math.max(0, taxBase * bracket[1] - bracket[2]);
      const creditLimit = gross <= 33000000 ? 740000 : gross <= 70000000 ? Math.max(660000, 740000 - (gross - 33000000) * 0.008) : gross <= 120000000 ? Math.max(500000, 660000 - (gross - 70000000) * 0.5) : Math.max(200000, 500000 - (gross - 120000000) * 0.5);
      const credit = Math.min(creditLimit, beforeCredit <= 1300000 ? beforeCredit * 0.55 : 715000 + (beforeCredit - 1300000) * 0.3);
      const incomeTax = Math.max(0, beforeCredit - credit) / 12;
      const localTax = incomeTax * 0.1;
      const deductions = insurance + incomeTax + localTax;
      requireValue(monthly >= deductions, '입력한 연봉으로는 실수령액을 추정할 수 없습니다. 급여와 가입 조건을 확인해 주세요.', 0);
      return output('약 ' + won(monthly - deductions), [row('월 급여', won(monthly)), row('월 비과세 급여', won(exempt)), row('국민연금', won(pension)), row('건강보험', won(health)), row('장기요양보험', won(care)), row('고용보험', won(employment)), row('소득세 추정', won(incomeTax)), row('지방소득세 추정', won(localTax)), row('예상 공제 합계', won(deductions))], '2026년 10월 기준. 연간 세액을 12로 나눈 단순 추정이며 공식 근로소득 간이세액표 방식과 다릅니다. 부양가족은 본인·자녀를 포함한 공제대상자로 가정합니다. 자녀세액공제·기타 공제·보험료 상하한 및 가입 예외(국민연금 제외)는 미반영합니다. 국민연금 기준소득월액은 2026년 7월~2027년 6월 41만~659만원으로 가정하며 실제 명세서와 다를 수 있습니다.');
    }
    if (id === 'hourly') {
      const pay = money(raw, 0, '급여', false);
      const basis = choice(raw[1], ['월급', '연봉'], '급여 기준', 1);
      const hours = fieldNumber(raw, 2, '주당 근무시간', 0.01, 168);
      const paidRest = choice(raw[3], ['포함', '미포함'], '주휴시간 포함 여부', 3);
      const monthlyPay = basis === '연봉' ? pay / 12 : pay;
      const restHours = paidRest === '포함' && hours >= 15 ? Math.min(hours / 5, 8) : 0;
      const monthHours = (hours + restHours) * (365 / 7 / 12);
      return output('약 ' + won(monthlyPay / monthHours), [row('월 환산 근로시간', monthHours.toFixed(1) + '시간'), row('월 급여', won(monthlyPay)), row('주휴 환산시간', restHours.toFixed(1) + '시간/주')], '1년 365일·주 5일 균등 근무를 가정한 단순 환산입니다. 주 15시간 미만은 주휴시간을 더하지 않습니다. 실제 주휴수당 자격·연장수당·최저임금 충족 여부를 판정하지 않습니다.');
    }
    if (id === 'severance') {
      const start = date(raw[0], '입사일', 0);
      const end = date(raw[1], '퇴직일', 1);
      requireValue(end > start, '퇴직일은 입사일 다음 날 이후로 입력해 주세요.', 1);
      // A calendar year, not a fixed 365-day threshold, determines eligibility.
      const anniversary = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate()));
      requireValue(end >= anniversary, '퇴직금은 계속근로기간 1년 이상을 기준으로 계산합니다.', 1);
      const wages = money(raw, 2, '최근 3개월 임금 합계', false);
      const bonus = money(raw, 3, '최근 1년 상여금', true);
      const days = Math.round((end - start) / DAY);
      const periodStart = subtractMonths(end, 3);
      const periodDays = Math.round((end - periodStart) / DAY);
      const daily = (wages + bonus / 4) / periodDays;
      return output('약 ' + won(daily * 30 * days / 365), [row('재직기간', days.toLocaleString('ko-KR') + '일'), row('평균임금 산정기간', periodDays + '일'), row('산정기간 시작일', periodStart.toISOString().slice(0, 10)), row('1일 평균임금', won(daily))], '퇴직일은 마지막 근무일 다음 날이며 재직일수에서 제외합니다. 세전 단순 추정입니다. 주 15시간 이상 등 지급 요건을 가정하며 통상임금 우선 적용·제외기간·연차수당·퇴직소득세는 반영하지 않습니다.');
    }
    if (id === 'loan') {
      const principal = money(raw, 0, '대출금', false);
      const rate = percent(raw, 1, '연이율') / 100 / 12;
      const years = fieldNumber(raw, 2, '대출 기간(년)', 1 / 12, 100);
      const exactMonths = years * 12;
      requireValue(Math.abs(exactMonths - Math.round(exactMonths)) < 0.000001, '대출 기간은 개월 단위가 되도록 입력해 주세요. 예: 1.5년 = 18개월', 2);
      const months = Math.round(exactMonths);
      const method = choice(raw[3], ['원리금균등', '원금균등', '만기일시'], '상환 방식', 3);
      let first, total, label;
      if (method === '원금균등') { first = principal / months + principal * rate; total = principal + principal * rate * (months + 1) / 2; label = '첫 달 상환액'; }
      else if (method === '만기일시') { first = principal * rate; total = principal + first * months; label = '매월 이자'; }
      else { first = rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate)); total = first * months; label = '월 상환액'; }
      const rows = [row(label, won(first)), row('총 이자', won(Math.max(0, total - principal))), row('총 상환액', won(total)), row('상환기간', months + '개월')];
      if (method === '만기일시') rows.push(row('만기 상환 원금', won(principal)));
      if (method === '원금균등') rows.push(row('마지막 달 상환액', won(principal / months * (1 + rate))));
      return output('약 ' + won(first), rows, method + ' · 고정금리·월 단위 단순 추정입니다. 일수 계산·금리 변경·중도상환수수료·월별 원 단위 절사는 반영하지 않습니다.');
    }
    if (id === 'deposit') {
      const kind = choice(raw[0], ['예금', '적금'], '상품', 0);
      const amount = money(raw, 1, kind === '적금' ? '월 납입액' : '원금', false);
      const annual = percent(raw, 2, '연이율') / 100;
      const months = fieldNumber(raw, 3, '기간(개월)', 1, 1200, true);
      const principal = kind === '적금' ? amount * months : amount;
      const interest = kind === '적금' ? amount * annual / 12 * months * (months + 1) / 2 : amount * annual * months / 12;
      const tax = interest * 0.154;
      return output('약 ' + won(principal + interest - tax), [row('납입 원금', won(principal)), row('세전 이자', won(interest)), row('이자과세', won(tax)), row('세후 이자', won(interest - tax))], '단리·일반과세 15.4%를 가정합니다. 적금은 매월 초 같은 금액을 납입합니다. 우대금리·비과세·일수 계산·금융기관의 원 단위 절사는 미반영합니다.');
    }
    if (id === 'average') {
      const oldCount = fieldNumber(raw, 1, '보유 수량', 0, 1000000000);
      const oldPrice = oldCount === 0 ? 0 : money(raw, 0, '현재 평단', false);
      const price = money(raw, 2, '추가 매수가', false);
      const count = fieldNumber(raw, 3, '추가 수량', 0.000001, 1000000000);
      const totalCount = oldCount + count;
      const total = oldPrice * oldCount + price * count;
      const direction = oldCount === 0 ? '신규 매수' : price < oldPrice ? '물타기' : price > oldPrice ? '불타기' : '같은 가격 추가매수';
      return output(won(total / totalCount), [row('매수 구분', direction), row('총 수량', totalCount.toLocaleString('ko-KR', { maximumFractionDigits: 6 }) + '주'), row('총 매입금', won(total))], '소수 수량은 최대 소수점 6자리로 표시하며 수수료·세금은 제외합니다.');
    }
    if (id === 'return') {
      const buyPrice = money(raw, 0, '매수가', false);
      const sellPrice = money(raw, 1, '매도가 또는 현재가', true);
      const count = fieldNumber(raw, 2, '수량', 0.000001, 1000000000);
      const feeRate = percent(raw, 3, '매매 수수료') / 100;
      requireValue(feeRate < 1, '매매 수수료는 100% 미만으로 입력해 주세요.', 3);
      const buy = buyPrice * count, sell = sellPrice * count;
      const fee = (buy + sell) * feeRate;
      const profit = sell - buy - fee;
      const rate = profit / buy * 100;
      const rows = [row('매입금', won(buy)), row('평가·매도금', won(sell)), row('왕복 수수료', won(fee)), row('손익금액', won(profit))];
      if (profit < 0) rows.push(row('본전까지 필요한 상승률', sellPrice === 0 ? '현재가 0원에서는 계산 불가' : ((buyPrice * (1 + feeRate) / (1 - feeRate) / sellPrice - 1) * 100).toFixed(2) + '%'));
      return output((rate >= 0 ? '+' : '') + rate.toFixed(2) + '% · ' + (profit >= 0 ? '+' : '') + won(profit), rows, '매수·매도에 같은 수수료율을 적용한 단순 손익입니다. 수익률의 분모는 매입금이며 거래세·양도소득세·환율은 제외합니다.');
    }
    if (id === 'discount') {
      const price = money(raw, 0, '정가', false);
      const first = percent(raw, 1, '1차 할인율');
      const second = percent(raw, 2, '추가 할인율');
      const coupon = money(raw, 3, '금액 쿠폰', true);
      const discounted = price * (1 - first / 100) * (1 - second / 100);
      const appliedCoupon = Math.min(coupon, discounted);
      const final = Math.max(0, discounted - appliedCoupon);
      const saving = price - final;
      return output(won(final), [row('정가', won(price)), row('할인 적용 금액', won(discounted)), row('실제 적용 쿠폰', won(appliedCoupon)), row('총 할인액', won(saving)), row('실제 할인율', (saving / price * 100).toFixed(2) + '%')], '할인율을 순서대로 적용한 뒤 쿠폰을 차감합니다. 초과 쿠폰 잔액·배송비·판매처별 절사·쿠폰 조건은 반영하지 않습니다.');
    }
    throw new Error('계산식을 찾지 못했습니다.');
  }
  root.calculateItem = calculateItem;
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculateItem: calculateItem };
})(typeof globalThis !== 'undefined' ? globalThis : this);
