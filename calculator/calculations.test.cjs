'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateItem: calc } = require('./calculations.js');
function value(out, label) { return out.rows.find(r => r.label === label).value; }
function numeric(out, label) { return Number(value(out, label).replace(/[^\d.-]/g, '')); }
test('classic browser script exposes the same API without Node globals', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(require.resolve('./calculations.js'), 'utf8'), sandbox);
  assert.equal(sandbox.calculateItem('discount', ['1000','10','0','0']).big, '900원');
});
test('reject malformed numbers, infinity, invalid grouping and out-of-range discounts', () => {
  for (const bad of ['1e2','1a00','1,00','Infinity','NaN','','-1','1..2']) assert.throws(() => calc('discount', [bad,'0','0','0']));
  assert.throws(() => calc('discount',['100000','150','150','0']));
  assert.throws(() => calc('discount',['100000','0','0','-1']));
  assert.equal(calc('discount',['100,000','0','0','0']).big, '100,000원');
});
test('validation identifies the exact input field for accessible inline errors', () => {
  assert.throws(()=>calc('discount',['1000','150','0','0']),e=>e.fieldIndex===1);
  assert.throws(()=>calc('salary',['5000','1','1']),e=>e.fieldIndex===2);
  assert.throws(()=>calc('severance',['2025-02-29','2026-01-01','9000000','0']),e=>e.fieldIndex===0);
  assert.throws(()=>calc('loan',['1000','3','1.01','원리금균등']),e=>e.fieldIndex===2);
});

test('extremely small salary reports unsupported conditions instead of negative take-home pay', () => {
  assert.throws(()=>calc('salary',['0.01','1','0','']),e=>e.fieldIndex===0&&e.message.includes('추정할 수 없습니다'));
  assert.ok(!calc('salary',['100','1','0','0']).big.includes('-'));
});

test('range feedback is readable for money and unsupported choices', () => {
  assert.throws(()=>calc('discount',['0','0','0','0']),e=>e.message.startsWith('정가:')&&e.message.includes('0보다 크고'));
  assert.throws(()=>calc('hourly',['1000','월급','40','잘못된 선택']),e=>e.message==='주휴시간 포함 여부: 항목을 선택해 주세요.');
  assert.throws(()=>calc('salary',['5000','1','0','5000000']),e=>!e.message.includes('.667'));
});
test('sequential discounts and coupon cap preserve nonnegative payable', () => {
  assert.equal(calc('discount',['100000','30','20','5000']).big, '51,000원');
  const result=calc('discount',['1000','100','0','9999']);
  assert.equal(result.big,'0원'); assert.equal(value(result,'실제 적용 쿠폰'),'0원');
});
test('zero-interest amortization and bullet principal are explicit', () => {
  const equal=calc('loan',['120000','0','1','원리금균등']);
  assert.equal(equal.big,'약 10,000원'); assert.equal(value(equal,'총 이자'),'0원');
  const bullet=calc('loan',['120000','0','1','만기일시']);
  assert.equal(value(bullet,'매월 이자'),'0원'); assert.equal(value(bullet,'만기 상환 원금'),'120,000원');
});
test('loan formulas agree with monthly ledger and reject silent term rounding', () => {
  const principal=300000000, r=.042/12, months=360;
  const equal=calc('loan',[String(principal),'4.2','30','원리금균등']);
  const payment=numeric(equal,'월 상환액');
  let balance=principal, unrounded=principal*r/(1-Math.pow(1+r,-months)), interest=0;
  for(let m=0;m<months;m++){ const charge=balance*r;interest+=charge;balance-=unrounded-charge; }
  assert.ok(Math.abs(balance)<.001); assert.ok(Math.abs(numeric(equal,'총 이자')-interest)<1); assert.ok(payment>1400000);
  const declining=calc('loan',['120000','12','1','원금균등']);
  assert.equal(value(declining,'첫 달 상환액'),'11,200원'); assert.equal(value(declining,'총 이자'),'7,800원');
  assert.throws(()=>calc('loan',['100000','3','1.01','원리금균등']));
  assert.throws(()=>calc('loan',['100000','-1','1','원금균등']));
  assert.throws(()=>calc('loan',['100000','3','1','잘못된 방식']));
});
test('deposit and monthly installment use disclosed simple interest and tax', () => {
  const deposit=calc('deposit',['예금','1000000','12','12']);
  assert.equal(value(deposit,'세전 이자'),'120,000원'); assert.equal(deposit.big,'약 1,101,520원');
  const installment=calc('deposit',['적금','100000','12','12']);
  assert.equal(value(installment,'납입 원금'),'1,200,000원'); assert.equal(value(installment,'세전 이자'),'78,000원');
  assert.throws(()=>calc('deposit',['예금','1000','3','1.5']));
});
test('stock average preserves fractional holdings and distinguishes new purchase', () => {
  const result=calc('average',['100','0.5','200','0.5']);
  assert.equal(result.big,'150원'); assert.equal(value(result,'총 수량'),'1주');
  assert.equal(value(calc('average',['100','0','200','1']),'매수 구분'),'신규 매수');
  assert.equal(calc('average',['','0','200','1']).big,'200원');
  assert.throws(()=>calc('average',['0','1','200','1']));
  assert.throws(()=>calc('average',['100','1','200','0']));
});
test('stock break-even includes both fee sides and handles zero current price', () => {
  const result=calc('return',['100','50','1','1']);
  assert.equal(value(result,'본전까지 필요한 상승률'),'104.04%');
  const zero=calc('return',['100','0','1','0']);
  assert.match(value(zero,'본전까지 필요한 상승률'),/계산 불가/); assert.doesNotMatch(JSON.stringify(zero),/Infinity|NaN/);
  assert.throws(()=>calc('return',['100','50','1','100']));
});
test('retirement excludes the retirement date and checks a calendar year', () => {
  assert.throws(()=>calc('severance',['2025-01-01','2025-12-31','9000000','0']),/1년/);
  assert.throws(()=>calc('severance',['2024-01-01','2024-12-31','9000000','0']),/1년/);
  const result=calc('severance',['2025-01-01','2026-01-01','9200000','0']);
  assert.equal(value(result,'재직기간'),'365일'); assert.equal(value(result,'평균임금 산정기간'),'92일'); assert.equal(result.big,'약 3,000,000원');
});
test('retirement clamps missing calendar days and rejects nonexistent dates', () => {
  const may=calc('severance',['2025-01-01','2026-05-31','9200000','0']);
  assert.equal(value(may,'산정기간 시작일'),'2026-02-28'); assert.equal(value(may,'평균임금 산정기간'),'92일');
  const leap=calc('severance',['2023-01-01','2024-05-31','9200000','0']);
  assert.equal(value(leap,'산정기간 시작일'),'2024-02-29');
  assert.throws(()=>calc('severance',['2025-02-29','2026-05-31','9000000','0']));
  assert.throws(()=>calc('severance',['2025-01-01','2026-05-31','-1','0']));
});
test('2026 pension floors and caps follow current contribution basis', () => {
  const low=calc('salary',['120','1','0']);
  assert.equal(value(low,'국민연금'),'19,475원');
  const high=calc('salary',['12000','1','0']);
  assert.equal(value(high,'국민연금'),'313,025원');
  const annual=calc('salary',['6000','1','0']);
  assert.equal(value(annual,'국민연금'),'237,500원'); assert.equal(value(annual,'건강보험'),'179,750원');
  assert.equal(value(annual,'장기요양보험'),'23,620원');
});
test('salary children are not deducted twice and optional tax-free pay reduces bases', () => {
  assert.equal(calc('salary',['5000','2','0']).big,calc('salary',['5000','2','1']).big);
  assert.throws(()=>calc('salary',['5000','1','1']));
  const taxed=calc('salary',['6000','1','0']), exempt=calc('salary',['6000','1','0','200000']);
  assert.ok(numeric(exempt,'소득세 추정')<numeric(taxed,'소득세 추정'));
  assert.equal(value(exempt,'건강보험'),'172,560원');
  assert.throws(()=>calc('salary',['6000','1','0','5000001']));
  assert.match(exempt.detail,/간이세액표 방식과 다릅니다/);
});
test('salary credit limits change across low and high gross income brackets', () => {
  // Independent arithmetic: single person, no tax-free pay, all other credits excluded.
  function expectedIncomeTax(annual) {
    const monthly=annual/12;
    const pension=Math.min(6590000,Math.max(410000,Math.floor(monthly/1000)*1000))*.0475;
    const insurance=pension+monthly*(.03595+.004724+.009);
    const earned=annual<=45000000?7500000+(annual-15000000)*.15:annual<=100000000?12000000+(annual-45000000)*.05:Math.min(20000000,14750000+(annual-100000000)*.02);
    const base=annual-earned-insurance*12-1500000;
    const before=base<=50000000?base*.15-1260000:base<=88000000?base*.24-5760000:base<=150000000?base*.35-15440000:base*.38-19940000;
    const limit=annual===30000000?740000:annual===80000000?500000:200000;
    return Math.round((before-Math.min(limit,before<=1300000?before*.55:715000+(before-1300000)*.3))/12);
  }
  for(const annual of [30000000,80000000,150000000]) assert.equal(numeric(calc('salary',[String(annual/10000),'1','0']),'소득세 추정'),expectedIncomeTax(annual));
});
test('hourly conversion handles annual salary and sub-15-hour paid-rest eligibility', () => {
  const monthly=calc('hourly',['4000000','월급','40','포함']);
  const annual=calc('hourly',['48000000','연봉','40','포함']);
  assert.equal(monthly.big,annual.big);
  assert.equal(value(calc('hourly',['1000000','월급','10','포함']),'주휴 환산시간'),'0.0시간/주');
  assert.throws(()=>calc('hourly',['1000','월급','0','포함']));
});
