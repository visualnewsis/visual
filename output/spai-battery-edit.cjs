const fs=require('fs');
const root=__dirname+'/spai-battery-copy-20261105/';
function edit(file,pairs){let s=fs.readFileSync(root+file,'utf8');for(const [a,b] of pairs){if(!s.includes(a))throw Error(file+': '+a);s=s.replace(a,b);}fs.writeFileSync(root+file,s);}
edit('spai/index.html',[
['국내 회사가 이런 프로그램을 들이려면 어떤 절차를 거쳐야 할까.','국내 사업장의 감시 설비 설치에는 노사협의 절차가 있다.'],
['회사가 감시 프로그램을 쓰는지, 어떤 정보를 수집하는지 확인하려면 다음과 같은 방법이 있다.','회사에 수집 항목을 묻거나 자신의 기록 열람을 요청할 수 있다.'],
['        <p class="closing-ask">“쟤 지금 딴짓해요.”<br><span>그런데 AI는 정말 알고 있었을까?</span></p>',''],
['css/spai.css?v=20261016-orwell-2','css/spai.css?v=20261105-copy-ux1'],
['js/main.js?v=20261025-copy-1','js/main.js?v=20261105-copy-ux1']
]);
edit('spai/js/main.js',[
['"보고서 받기 →":"다음 →"','"보고서 보기 →":"다음 장면 →"'],
['>기록에 없는 하루</h3>','>실제로 한 일</h3>'],
['<p class="bk-caveat">${r.back.caveat}</p>','<details class="bk-detail"><summary>分류 기준과 한계</summary><p class="bk-caveat">${r.back.caveat}</p></details>'.replace('分','분')],
['고과 ${data.grade}는 의심 항목 ${data.flags}건만 반영했다. 뒷면의 업무 맥락은 평가에 들어가지 않았다. 이 규칙에서는 어떤 선택을 해도 A가 나오지 않는다. 14시 30분의 동영상 사이트 25분이 업무 영상이든 아니든 언제나 비업무 의심으로 잡히기 때문이다.','고과 ${data.grade}는 확인 필요·비업무 의심 ${data.flags}건으로 매겼다. 동영상 사이트 이용은 내용과 관계없이 비업무 의심으로 분류돼, 이 체험에서는 A가 나오지 않는다.'],
['const lines=[`선택한 네 구간 가운데 SPAI가 \'맥락 확인 필요\'나 \'비업무 의심\'으로 표시한 구간은 ${data.flags}개다. 이 중 실제로 일을 하지 않은 구간은 ${data.offTask?"개인 영상을 본 25분 하나다":"없다"}.`];','const lines=[];'],
['    lines.push(`고과 ${data.grade}는 PC 기록만으로 매겨졌다. 실제 업무 내용은 평가에 들어가지 않았다.`);',''],
['on?"앞면 다시 보기":"보고서 뒤집어 보기"','on?"PC 기록 다시 보기":"실제 한 일과 비교하기"'],
['  addEventListener("resize",fitCard,{passive:true});','  card.addEventListener("toggle",fitCard,true);\n  if(window.ResizeObserver){const cardSize=new ResizeObserver(fitCard);cardSize.observe(front);cardSize.observe(back);}\n  addEventListener("resize",fitCard,{passive:true});']
]);
edit('smartwatch/index.html',[
['<p class="deck">신변보호 스마트워치, 지급 이후의 점검</p>','<p class="deck">신변보호 스마트워치의 작동 조건과 관리 실태</p>'],
['SOS 버튼을 누르면 <span class="story-emphasis">112에 신고</span>된다','SOS 버튼으로 <span class="story-emphasis">112 긴급 신고</span>'],
['버튼·위치·배터리·고정부·통화</h2>','긴급 신고에 필요한 다섯 가지 기능</h2>'],
['워치 사용 여부,<br><span class="story-emphasis">주 1회 연락으로 확인</span>','사용 여부는 <span class="story-emphasis">주 1회 연락해 확인</span>'],
['위치 오차, 신고 뒤 출동, 가족의 보호 범위, 기기 반납. 과거 사건에서도 서로 다른 보호 문제가 드러났다.','과거 사건에서는 위치 오차와 출동, 가족 보호, 기기 반납 문제가 각각 나타났다.'],
['<span class="story-emphasis">전산 점검 강화</span>와 전수점검','전수점검과 <span class="story-emphasis">전산 점검 강화 추진</span>'],
['      <div class="end-copy">\r\n        <p>담당자에게 알림이 전달된 뒤에는 피해자의 안전 확인과 후속 조치가 이어져야 한다.</p>\r\n      </div>',''],
['워치를 지급한 이후의 책임</h2>','국정감사에서 나온 적극 조치 요구</h2>'],
['워치 전원 점검과 접근금지 갱신이 실제로 이뤄졌는지, 19일부터 시작될 전수점검에서 드러난 문제에 어떤 조치가 뒤따르는지 확인할 필요가 있다.','워치 전원 점검과 접근금지 갱신 여부는 감찰과 전수점검에서 확인할 사안이다. 전수점검은 10월 19일부터 진행될 예정이다.'],
['<p class="eyebrow">07 · 무엇이 바뀌나</p>','<p class="eyebrow">07 · 2026년 10월 14일 기준 개선 계획</p>'],
['<p>기기 사용과 점검, 경찰의 대응에서 개선이 필요한 점을 적어주세요.</p>','<p>기기 점검이나 경찰 대응에 바라는 점을 적어 복사할 수 있습니다. 의견은 자동으로 제출되지 않습니다.</p>'],
['aria-describedby="opinion-note"','aria-describedby="opinion-note opinion-count"'],
['<div class="opinion-actions">','<p id="opinion-count" class="opinion-count">0 / 3000자</p>\r\n        <div class="opinion-actions">'],
['css/smartwatch.css?v=20261014-agreed-12','css/smartwatch.css?v=20261105-copy-ux1'],
['js/main.js?v=20261014-agreed-12','js/main.js?v=20261105-copy-ux1']
]);
edit('smartwatch/js/main.js',[
["  if (opinionText && copyOpinion && opinionStatus) {","  if (opinionText && copyOpinion && opinionStatus) {\n    opinionText.addEventListener('input', function () {\n      document.getElementById('opinion-count').textContent = opinionText.value.length + ' / 3000자';\n      opinionStatus.textContent = '';\n    });"],
["의견을 복사했습니다. 국민신문고에서 직접 붙여넣고 제출해주세요.","복사했습니다. 제출하려면 국민신문고에서 붙여넣어주세요."]
]);
