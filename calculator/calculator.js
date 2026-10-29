const shops = {
  labor: {
    name:'계산인력소', color:'#2f7d50',
    items:[
      {id:'salary', label:'연봉 실수령액', title:'연봉 실수령액 계산기', kicker:'연봉은 이건데, 통장에는 얼마?',
        fields:[
          ['연봉','만원','5000'], ['부양가족 수 (본인 포함)','명','1'], ['그중 자녀 수','명','0'], ['월 비과세 급여','원','0']
        ],
        result:'예상 월 실수령액',},
      {id:'hourly', label:'시급', title:'시급 계산기', kicker:'내 한 시간은 얼마짜리일까요?',
        fields:[
          ['월급 또는 연봉','원','4000000'], ['급여 기준','월급 / 연봉','월급'],
          ['주당 근무시간','시간','40'], ['주휴시간 포함','선택','포함']
        ],
        result:'나의 실질 시급',},
      {id:'severance', label:'퇴직금', title:'퇴직금 계산기', kicker:'오늘 그만두면, 얼마를 받을까요?',
        fields:[
          ['입사일','날짜','2021-03-02'], ['퇴직일','날짜','2026-10-29'],
          ['최근 3개월 임금 합계','원','10500000'], ['최근 1년 상여금','원','3000000']
        ],
        result:'예상 퇴직금',}
    ]
  },
  bank: {
    name:'계산은행', color:'#2968a3',
    items:[
      {id:'loan', label:'대출이자', title:'대출이자 계산기', kicker:'빌리기 전에, 매달 얼마인지부터.',
        fields:[
          ['대출금','원','300000000'], ['연이율','%','4.2'],
          ['기간','년','30'], ['상환 방식','선택','원리금균등']
        ],
        result:'예상 월 상환액',},
      {id:'deposit', label:'예·적금', title:'예·적금 계산기', kicker:'금리보다 중요한 건, 만기에 얼마냐는 것.',
        fields:[
          ['상품','예금 / 적금','예금'], ['원금 또는 월 납입액','원','10000000'],
          ['연이율','%','3.2'], ['기간','개월','12']
        ],
        result:'예상 만기 수령액',}
    ]
  },
  stock: {
    name:'계산증권', color:'#b63b28',
    items:[
      {id:'average', label:'물타기·불타기', title:'물타기·불타기 계산기', kicker:'더 사면, 내 평단은 어디로 갈까요?',
        fields:[
          ['현재 평단','원','72300'], ['보유 수량','주','120'],
          ['추가 매수가','원','65000'], ['추가 수량','주','50']
        ],
        result:'새로운 평균단가',},
      {id:'return', label:'주식 수익률', title:'주식 수익률 계산기', kicker:'그래서 얼마 벌고, 얼마 잃었나요?',
        fields:[
          ['매수가','원','68000'], ['매도가 또는 현재가','원','74000'],
          ['수량','주','100'], ['매매 수수료','%','0']
        ],
        result:'예상 수익률',}
    ]
  },
  mart: {
    name:'계산마트', color:'#a95609',
    items:[
      {id:'discount', label:'할인율', title:'할인율 계산기', kicker:'',
        fields:[
          ['정가','원','189000'], ['1차 할인','%','30'],
          ['추가 할인','%','20'], ['금액 쿠폰','원','5000']
        ],
        result:'최종 결제금액',}
    ]
  }
};
(function () {
  'use strict';
  const dialog = document.getElementById('calc-dialog');
  const form = document.getElementById('calc-form');
  const fields = document.getElementById('calc-fields');
  const result = document.getElementById('calc-result');
  const status = document.getElementById('calc-status');
  const drafts = new Map();
  const depositAmounts = {'예금':'10000000','적금':'500000'};
  const hourlyAmounts = {'월급':'4000000','연봉':'48000000'};
  let activeShop, activeItem, lastTrigger, lastResult;
  let hourlyBasis = '월급';
  shops.labor.items.find(item=>item.id==='severance').fields[1][2] = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const options = {'급여 기준':['월급','연봉'],'주휴시간 포함':['포함','미포함'],'상환 방식':['원리금균등','원금균등','만기일시'],'상품':['예금','적금']};
  const hints = {
    salary: {0:'세전 연봉을 만원 단위로 입력하세요. 예: 5,000만원',1:'본인과 소득·나이 요건을 충족하는 공제대상 가족을 합한 수입니다.',2:'위 부양가족 수에 이미 포함된 자녀입니다. 별도 자녀세액공제는 반영하지 않습니다.',3:'월 급여에 포함된 비과세 금액입니다. 별도 추가 금액이 아닙니다.'},
    hourly:{2:'주 5일 균등 근무를 가정한 단순 시급 환산입니다.'},
    severance:{1:'마지막 근무일의 다음 날을 입력하세요. 이 날짜는 재직일수에서 제외됩니다.',2:'퇴직일 직전 3개월의 세전 임금 합계입니다. 상여금은 아래에 따로 입력하세요.'},
    loan:{2:'개월로 환산 가능한 기간을 입력하세요. 예: 1.5년 = 18개월'},
    deposit:{1:'예금은 한 번 맡기는 원금, 적금은 매월 납입하는 금액입니다.'},
    average:{1:'보유 수량이 0이면 신규 매수로 계산하며 현재 평단은 입력하지 않습니다.'},
    return:{3:'매수와 매도 각각에 같은 수수료율을 적용합니다. 거래세는 제외합니다.'},
    discount:{2:'30% 할인 뒤 20% 추가 할인은 총 44% 할인입니다.'}
  };
  const sourceLinks = {
    salary:[['국민연금공단 · 보험료 기준','https://www.nps.or.kr/eng/ntnlpnsplan/cntb/getOHAI0013M0.do'],['건강보험공단 · 2026년 요율','https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html'],['국세청 · 근로소득세액공제','https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6439']],
    severance:[['고용노동부 · 퇴직금 계산 안내','https://www.moel.go.kr/retirementpayCal.do']],
    hourly:[['고용노동부 · 노동정책 안내','https://www.moel.go.kr/']]
  };
  const basis = {
    salary:'2026년 10월 기준. 국민연금 근로자 4.75%, 기준소득월액 41만~659만원(2026.7~2027.6), 건강보험 근로자 3.595%, 장기요양은 건강보험료 × 0.9448 ÷ 7.19, 고용보험 0.9%를 적용합니다. 연간 세액을 월평균으로 나눈 단순 추정이며 공식 근로소득 간이세액표와 다릅니다. 자녀세액공제·기타 공제·국민연금 외 보험료 상하한 및 가입 예외는 반영하지 않습니다.',
    hourly:'월 환산 근로시간으로 급여를 나눈 단순 추정입니다. 주 5일 균등 근무·연 365일을 가정하고, 주 15시간 미만은 주휴시간을 더하지 않습니다. 실제 주휴수당 지급 자격이나 최저임금 충족 여부를 판정하지 않습니다.',
    severance:'1일 평균임금 × 30일 × 재직일수 ÷ 365의 세전 추정입니다. 계속근로 1년 이상, 주 15시간 이상 등 지급 요건을 가정합니다. 통상임금 우선 적용·제외기간·연차수당·퇴직소득세는 반영하지 않습니다.',
    loan:'고정금리·월 단위로 계산합니다. 원리금균등은 매월 상환액, 원금균등은 첫 달 상환액, 만기일시는 매월 이자를 표시합니다. 금리 변경·중도상환수수료·일수 계산·금융기관별 절사는 제외합니다.',
    deposit:'단리·일반과세 15.4% 기준입니다. 적금은 매월 초 같은 금액을 납입한다고 가정합니다. 우대금리·비과세·실제 납입일·금융기관별 절사는 반영하지 않습니다.',
    average:'기존 매입금과 추가 매입금을 합해 총 수량으로 나눕니다. 소수 수량을 허용하며 수수료·세금은 제외합니다.',
    return:'매수·매도에 같은 수수료율을 적용합니다. 수익률은 매입금 대비 손익이며 거래세·양도소득세·환율은 제외합니다. 본전 상승률은 같은 수수료율로 다시 계산한 목표 매도가 기준입니다.',
    discount:'할인율은 각각 0~100%까지 입력할 수 있습니다. 1차 할인, 추가 할인, 금액 쿠폰 순서로 적용합니다. 결제액을 초과하는 쿠폰은 남은 금액까지만 적용합니다. 배송비·판매처별 절사·쿠폰 사용 조건은 제외합니다.'
  };
  function el(tag, cls, text) { const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e; }
  function inputs() {return Array.from(fields.querySelectorAll('[data-field]'));}
  function remember() {if(activeItem)drafts.set(activeItem.id,inputs().map(e=>e.value));}
  function invalidate() {result.hidden=true;lastResult=null;status.textContent='';document.getElementById('copy-fallback')?.remove();inputs().forEach(e=>{e.removeAttribute('aria-invalid');document.getElementById(e.id+'-error').hidden=true;});}
  function fieldLabel(index) {
    if(activeItem.id==='deposit' && index===1) return inputs()[0]?.value==='적금'?'월 납입액':'예금 원금';
    return activeItem.fields[index][0];
  }
  function selectItem(shopKey, itemId, focusTitle) {
    remember();
    activeShop=shops[shopKey];activeItem=activeShop.items.find(e=>e.id===itemId)||activeShop.items[0];
    dialog.style.setProperty('--shop',activeShop.color);
    document.getElementById('calc-shop-name').textContent=activeShop.name;
    document.getElementById('calc-title').textContent=activeItem.title;
    document.getElementById('calc-kicker').textContent=activeItem.kicker||'할인에 할인을 더하면, 실제로 얼마일까요?';
    const tabs=document.getElementById('calc-tabs');tabs.replaceChildren();
    tabs.hidden=activeShop.items.length<2;
    for(const item of activeShop.items){const b=el('button','calc-tab',item.label);b.type='button';b.dataset.calcId=item.id;b.setAttribute('aria-pressed',String(item.id===activeItem.id));b.addEventListener('click',()=>{selectItem(shopKey,item.id,false);updateHash(item.id);tabs.querySelector('[data-calc-id="'+item.id+'"]').focus({preventScroll:true});});tabs.append(b);}
    fields.replaceChildren();
    const values=drafts.get(activeItem.id)||activeItem.fields.map(f=>f[2]);
    activeItem.fields.forEach((f,i)=>{
      const [label,unit]=f;const group=el('div','calc-field');const id='calc-field-'+i;const l=el('label','',label);l.htmlFor=id;group.append(l);
      // Preserve the calculation API without asking a question that cannot change this estimate.
      if(activeItem.id==='salary'&&i===2)group.hidden=true;
      let input;
      if(options[label]){input=el('select');for(const value of options[label]){const opt=el('option','',value);opt.value=value;input.append(opt);}group.append(input);}
      else {const box=el('div','calc-input-box');input=el('input');input.type=unit==='날짜'?'date':'text';if(unit!=='날짜'){input.inputMode='decimal';input.autocomplete='off';input.spellcheck=false;}box.append(input);if(unit!=='날짜')box.append(el('span','unit',unit));group.append(box);}
      input.id=id;input.dataset.field=i;input.value=activeItem.id==='salary'&&i===2?'0':values[i];
      const help=hints[activeItem.id]?.[i];if(help){const p=el('p','field-help',help);p.id=id+'-help';input.setAttribute('aria-describedby',p.id+' '+id+'-error');group.append(p);}else input.setAttribute('aria-describedby',id+'-error');
      const error=el('p','field-error');error.id=id+'-error';error.hidden=true;group.append(error);fields.append(group);
    });
    document.getElementById('result-caption').textContent=activeItem.id==='salary'?'예상 월 실수령액 · 단순 추정':activeItem.result;
    document.getElementById('calc-note').textContent=basis[activeItem.id];
    const sources=document.getElementById('calc-sources');sources.replaceChildren();
    for(const [label,url] of sourceLinks[activeItem.id]||[]){const p=el('p');const a=el('a','',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);sources.append(p);}
    dialog.querySelector('.calc-basis').open=false;
    invalidate();updateDependentFields();if(activeItem.id==='hourly')hourlyBasis=inputs()[1].value;dialog.scrollTop=0;
    if(focusTitle)document.getElementById('calc-title').focus({preventScroll:true});
  }
  function updateDependentFields() {
    if(activeItem.id==='deposit'){const a=inputs();fields.querySelector('label[for="calc-field-1"]').textContent=fieldLabel(1);}
    if(activeItem.id==='average'){const a=inputs();a[0].disabled=a[1].value.trim()!==''&&Number(a[1].value.replace(/,/g,''))===0;}
  }
  function updateHash(id,push) {const u=new URL(location.href);u.hash='calc='+id;if(push)history.pushState({calcDialog:true},'',u);else history.replaceState(history.state,'',u);}
  function openCalc(shopKey,itemId,trigger) {
    const push=!!trigger&&!dialog.open;
    lastTrigger=trigger||document.querySelector('[data-calc="'+itemId+'"]')||document.activeElement;selectItem(shopKey,itemId,false);
    if(!dialog.open){dialog.showModal();document.documentElement.classList.add('calc-open');}
    updateHash(activeItem.id,push);document.getElementById('calc-title').focus({preventScroll:true});
  }
  function openHash() {const match=/^#calc=([a-z]+)$/.exec(location.hash);if(!match)return;for(const [key,shop] of Object.entries(shops)){if(shop.items.some(i=>i.id===match[1])){if(!dialog.open||activeItem.id!==match[1])openCalc(key,match[1],null);return;}}}
  document.querySelectorAll('[data-calc]').forEach(b=>b.addEventListener('click',()=>openCalc(b.dataset.shop,b.dataset.calc,b)));
  document.querySelectorAll('.street-sign').forEach(a=>a.addEventListener('click',()=>{const card=document.querySelector(a.getAttribute('href'));if(card)requestAnimationFrame(()=>card.focus({preventScroll:true}));}));
  document.getElementById('close-calc').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{remember();document.documentElement.classList.remove('calc-open');if(history.state?.calcDialog)history.back();else if(location.hash.startsWith('#calc=')){const u=new URL(location.href);u.hash='';history.replaceState(null,'',u);}if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#calc='))openHash();else if(dialog.open)dialog.close();});
  window.addEventListener('popstate',()=>{if(location.hash.startsWith('#calc='))openHash();else if(dialog.open)dialog.close();});
  form.addEventListener('input',e=>{invalidate();if(activeItem.id==='deposit'&&e.target.dataset.field==='1')depositAmounts[inputs()[0].value]=e.target.value;if(activeItem.id==='hourly'&&e.target.dataset.field==='0'){hourlyAmounts[hourlyBasis]=e.target.value;delete hourlyAmounts[hourlyBasis==='월급'?'연봉':'월급'];}updateDependentFields();remember();});
  form.addEventListener('change',e=>{invalidate();if(activeItem.id==='deposit'&&e.target.dataset.field==='0'){const a=inputs();a[1].value=depositAmounts[a[0].value];status.textContent='상품별 입력 금액을 불러왔습니다. '+(a[0].value==='적금'?'매월 납입액':'한 번 맡기는 원금')+'을 확인해 주세요.';}if(activeItem.id==='hourly'&&e.target.dataset.field==='1'){const a=inputs();const raw=a[0].value.replace(/,/g,'');if(hourlyBasis!==a[1].value&&/^\d+(?:\.\d+)?$/.test(raw)&&Number.isFinite(Number(raw))){hourlyAmounts[hourlyBasis]=a[0].value;if(hourlyAmounts[a[1].value]===undefined)hourlyAmounts[a[1].value]=String(Math.round(Number(raw)*(a[1].value==='연봉'?12:1/12)));a[0].value=hourlyAmounts[a[1].value];status.textContent='급여 기준에 맞춰 금액을 자동 환산했습니다. 금액을 확인해 주세요.';}hourlyBasis=a[1].value;}updateDependentFields();remember();});
  form.addEventListener('focusout',e=>{const input=e.target;if(input.matches('input[type="text"]')&&/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(input.value)){const parts=input.value.replace(/,/g,'').split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');input.value=parts.join('.');if(activeItem.id==='deposit'&&input.dataset.field==='1')depositAmounts[inputs()[0].value]=input.value;remember();}});
  form.addEventListener('submit',e=>{
    e.preventDefault();invalidate();
    try{
      const out=calculateItem(activeItem.id,inputs().map(e=>e.value));lastResult=out;
      let caption=activeItem.result;if(activeItem.id==='salary')caption='예상 월 실수령액 · 단순 추정';
      if(activeItem.id==='loan')caption=inputs()[3].value==='원금균등'?'첫 달 상환액':inputs()[3].value==='만기일시'?'매월 납부할 이자':'매월 상환액';
      document.getElementById('result-caption').textContent=caption;
      document.getElementById('result-big').textContent=out.big;
      const rows=document.getElementById('result-rows');rows.replaceChildren();
      for(const row of out.rows||[]){const div=el('div','result-row'+(/총 할인액|예상 공제 합계|총 상환액|손익금액/.test(row.label)?' result-summary':''));div.append(el('dt','',row.label),el('dd','',row.value));rows.append(div);}
      document.getElementById('result-detail').textContent=out.detail.includes('\n')?out.detail.slice(out.detail.indexOf('\n')+1):out.detail;
      result.hidden=false;status.textContent='';
      result.scrollIntoView({block:'nearest',behavior:'instant'});result.focus({preventScroll:true});remember();
    }catch(err){
      status.textContent=err.message||'입력값을 확인해 주세요.';
      const index=Number.isInteger(err.fieldIndex)?err.fieldIndex:inputs().findIndex((input,i)=>!input.value.trim()||err.message.includes(activeItem.fields[i][0].replace(/\s*\(.+\)/,'')));
      const input=inputs()[index>=0?index:0];input.setAttribute('aria-invalid','true');const p=document.getElementById(input.id+'-error');p.textContent=status.textContent;p.hidden=false;input.focus();
    }
  });
  async function copy(text,success) {try{if(!navigator.clipboard||!window.isSecureContext)throw new Error('clipboard');await navigator.clipboard.writeText(text);status.textContent=success;}catch(e){status.textContent='자동 복사를 사용할 수 없습니다. 아래 텍스트를 선택해 복사하세요.';let fallback=document.getElementById('copy-fallback');if(!fallback){fallback=el('textarea');fallback.id='copy-fallback';fallback.setAttribute('aria-label','복사할 텍스트');fallback.style.cssText='width:100%;min-height:90px;margin-top:12px;font-size:16px';status.after(fallback);}fallback.value=text;fallback.focus();fallback.select();}}
  document.getElementById('copy-result').addEventListener('click',()=>{if(lastResult)copy(activeItem.title+'\n'+lastResult.big+'\n'+lastResult.detail,'계산 결과를 복사했습니다.');});
  document.getElementById('copy-link').addEventListener('click',()=>copy(location.href,'계산기 링크를 복사했습니다. 입력한 금액은 링크에 포함되지 않습니다.'));
  openHash();
})();
