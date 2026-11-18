'use strict';
// One reported demand determines the main sequence. Foreign records are a
// comparison branch; the closing returns to the exact school and demand.
const priorChapters=report.slice();
const nov16Followup={
 source:'NISX20261116_0003869075',
 germany:{
  title:'교육·생활비·징병,<br><em>청년들이 제기한 쟁점</em>',
  lead:'10월31일 프랑크푸르트의 청년 집회.\n11월14일에는 독일에서 두 번째 시위.\n생활비 상승·교육 예산 삭감·징병제에 항의.',
  photoLead:'10월31일, 프랑크푸르트에서 열린 첫 집회.\n교육·기후 지원과 생활비 대책,\n징병제 반대를 요구한 청년들.',
  body:"10월31일 독일 청년들은 교육·기후 지원, 생활비 대책과 징병제 반대를 함께 요구했다. 주최 측 전국 참가 집계는 약12만명. 사전에 참여 의사를 등록한16만명과는 다른 수치이며, 경찰 공식 참가 집계는 확인되지 않았다.\n\n11월14일에는 '젠지레겔트(Z세대가 해결한다)'가 주도한 두 번째 시위가 열렸다. 참가자들은 생활비 상승과 교육·복지·의료·문화 예산 삭감에 항의하고 징병제 추진에도 반대했다. dpa통신을 인용한11월16일 뉴시스 보도는 규모가10월31일 첫 집회보다 줄었고 전반적으로 평화롭게 진행됐다고 전했다.\n\n지도는 기존 프랑크푸르트 집회의 위치를 보여준다. 사진도10월31일 기록으로, 14일 후속 시위를 촬영한 모습은 아니다. 독일의 국내 정책을 향한 항의를 프랑스에서 직접 전해진 하나의 운동으로 단정할 수는 없다.",
  note:'사진은10월31일 프랑크푸르트의 AP/뉴시스 기록. 11월14일 보도는 독일 후속 시위에 관한 것으로, 프랑크푸르트의 새 집회나 사진 날짜로 바꾸지 않는다. 첫 집회 참가 집계와 사전 등록 인원도 구분한다.',
  refs:[['NISX20261101_0003849471','10월31일 독일 청년들의 요구·참가 집계'],['NISX20261102_0003850591','첫 집회 뒤 충돌·피해 후속 보도'],['NISX20261116_0003869075','11월14일 독일의 두 번째 시위']]
 },
 portugal:{
  title:'30여 도시서 주거난 항의<br><em>퇴거 보호·공공주택 요구</em>',
  lead:'퇴거 절차를 앞당기는 법안이 통과된 뒤,\n리스본 등 30여 도시에서 주거비 항의.\n임대료 인상 제한·공공주택 확대 요구.',
  photoLead:'11월14일, 리스본의 주거비 항의 집회.\n임대료 인상 제한과 퇴거 보호,\n공공주택 확대·부동산 투기 억제 요구.',
  body:"10월31일 주거난 항의 행진 뒤 농성장이 철거됐고11월1일에도 항의 집회가 이어졌다. 당시 총리는 법안 철회를 거부하고, 대안으로 수정을 언급했다.\n\n이후11월16일 뉴시스는 포르투갈 의회가 건물주의 세입자 퇴거 절차를 앞당기는 법안을 통과시켰다고 보도했다. 정확한 표결일과 시행일은 기사에 제시되지 않았다. 법안 통과와 실제 퇴거가 빨라졌는지를 보여주는 결과는 구분해야 한다.\n\n11월14일에는 리스본 등30여 도시에서 주거비 상승에 항의하는 시위가 열렸다. 시민들은 임대료 인상 제한과 퇴거 보호, 공공주택 확대, 부동산 투기 억제를 요구했다. 시민단체 '카사 파라 비베르'도 투기 대상이 아닌 거주할 집이 필요하다며 공공주택 건설을 촉구했다.\n\n사진은14일 리스본 집회에서 참가자가 스누피 그림을 들고 있는 모습. 11월1일 농성장 철거 뒤의 집회와는 날짜가 다른 현장이다. 전국30여 도시라는 범위를 이 사진에 담긴 인원 수로 읽어서는 안 된다.",
  note:'사진은11월14일 리스본의 AP/뉴시스 기록이며11월16일 종합 기사에 실렸다. 30여 도시는 포르투갈 전국 범위다. 법안의 정확한 표결일·시행일이나 퇴거 결과는 이 기사에서 확인되지 않는다.',
  refs:[['NISX20261116_0003869075','11월14일 주거비 시위·퇴거 절차 법안 통과'],['NISX20261102_0003850591','11월1일 농성장 철거 뒤 집회·당시 정부 응답']]
 }
};
photos.lisbonNovember14={city:'lisbon',file:'lisbon-nov14.jpg',alt:'11월14일 포르투갈 리스본의 주거비 항의 집회에서 스누피 그림을 든 참가자',credit:'리스본 · 2026.11.14 · AP/뉴시스',source:nov16Followup.source};
const nov5Followup={"body":"11월5일, 파리·리옹·마르세유 등에서 교육 지원 확대와 임금·연금 인상을 요구하는 시위가 열렸다. 학생들 곁에 노동자와 은퇴자도 함께했다. 전국 참가자는 11월8일 보도에 실린 내무부 집계로 57만5000명. CGT는 200여건의 시위에 약160만명이 참여했다고 주장했다. 두 수치는 같은 전국 행동을 서로 다른 주체가 집계한 것으로, 합산하지 않는다.\n\n교육부는 전체 교직원의 15% 이상이 파업에 참여했다고 밝혔다. 전국 고교 약3분의1은 문을 닫거나 정상 운영에 차질을 빚었다. 학생들이 출입구를 봉쇄한 학교도, 교사 파업으로 수업이 중단된 학교도 있었다. 11월2일의 봉쇄 고교 41곳과는 집계 대상이 다르다.\n\n교육·철도·공공병원·우편 등 여러 분야의 노조가 참여했고 대중교통 운행에도 차질이 생겼다. 에펠탑도 폐쇄됐다. 대부분의 시위는 평화롭게 진행됐지만, 리옹·렌 등 일부 도시에서는 경찰과 시위대의 충돌도 보도됐다.\n\n10월26일 교육 대책 발표 뒤에도 계속된 지원 확대 요구. 집회가 이어진 사실과 교원 채용·시설 개선이 얼마나 이뤄졌는지는 따로 확인할 문제다.","note":"11월5일 내무부 집계는 8일 보도의 57만5000명을 표기한다. 6일 보도의 60만명 이상 잠정치와 달라진 이유는 확인되지 않았다. CGT 주장과는 합산하지 않는다. 고교 운영 차질에는 학생 봉쇄와 교사 파업 등이 포함되며, 11월2일 봉쇄 고교41곳과 직접 비교하지 않는다. 파리 사진 한 장이 전국 참가 규모를 보여 주는 자료는 아니다.","refs":[["NISX20261106_0003857148","11월5일 전국 시위·내무부 잠정 집계·학교 운영 차질"],["NISX20261106_0003857342","11월5일 파리 현장 사진·CGT 주장 집계"],["NISX20261108_0003859085","8일 보도에 실린 11월5일 내무부 집계"]]};
for(const city of ['paris','lyon','marseille'])cityTimelines[city].push({label:'11월5일',date:'2026-11-05',kind:'protest',title:'교육 지원 확대·임금·연금 인상 요구',note:'전국 참가 규모와 각 도시의 인원은 구분',source:'NISX20261106_0003857148'});
cityTimelines.paris.push({label:'11월7일',date:'2026-11-07',kind:'protest',title:'학생·노조 공동 행진, 교육·생활비 개선 요구',note:'전국 집계와 파리 현장 인원은 구분',source:'NISX20261108_0003859085'});
cityTimelines.paris.push({label:'11월10일',date:'2026-11-10',kind:'protest',title:'교육 예산 증액을 요구한 학생 시위',note:'13일 기사 사진 설명의 파리 현장; 전국 파업 집계가 아님',source:'NISX20261113_0003867861'});
cityTimelines.paris.push({label:'11월14일',date:'2026-11-14',kind:'protest',title:'생활비·교육·경찰 권한을 둘러싼 토요 시위',note:'전국과 파리의 참가 집계는 구분',source:'NISX20261115_0003868287'});
function recut(index,patch,omit=[]){const b={...priorChapters[index],...patch};omit.forEach(k=>delete b[k]);return b}
const initialDemand={id:'staff',text:'교사·교직원을 늘려 달라',source:S.origin};
const responseAuditRows=[
 {id:'staff',label:'교원',
  demand:{main:initialDemand.text,detail:'교원 충원·결원 대체'},
  promise:{main:'감축 철회 · 일자리 500개',detail:'중등교육 인력 추가 계획',scope:'national',date:'2026-10-26'},
  localEvidence:{main:'크레테유에서 추가 인력 배치',scope:'one-school',date:'2026-09',source:S.origin},
  check:{main:'전국 채용 실적은 미확인',detail:'9월 크레테유 배치는 별도 사례',status:'unverified',scope:'national'}},
 {id:'class',label:'교실',
  demand:{main:'과밀학급을 줄여 달라',detail:'학생이 몰린 교실의 교육 여건'},
  promise:{main:'한 학급 28명 이하',detail:'모든 학교가 아닌 일부 고교 학급'},
  check:{main:'학급 축소 실적은 미제시',detail:'확인한 보도에 시행 뒤 결과가 없음',status:'unverified'}},
 {id:'building',label:'시설',
  demand:{main:'학교 시설을 고쳐 달라',detail:'폭염·위생·노후시설 개선'},
  promise:{main:'최대 40억유로',detail:'지자체에 저리 대출 · 무상 지원 아님'},
  check:{main:'개보수 완료 실적은 미제시',detail:'대출 지원 계획과 공사 완료는 다름',status:'unverified'}},
 {id:'admission',label:'진학',
  demand:{main:'대학 정원 25만명 확대',detail:'10월 27일 보도에서 확인한 학생단체 요구'},
  promise:{main:'1만5000명 증원',detail:'정부 발표안의 고등교육 정원'},
  check:{main:'발표안과 실제 증원은 구분',detail:'발표 당시 입학 결과가 아님',status:'planned'}}
];

const responseAuditFrames=[
 {label:'정부의 답',phase:'promise',kicker:'다시 전국의 학교로 · 10월 26일 정부 발표',title:'교사·교직원을 늘려 달라.<br><em>정부는 무엇을 약속했나</em>',lead:'처음의 요구 옆에 정부의 답을 놓았다.\n다음으로 넘기면 실제 변화의 근거를 확인할 수 있다.'},
 {label:'확인한 변화',phase:'check',kicker:'11월6일까지 이 기사에 반영한 뉴시스 보도',title:'500개 일자리,<br><em>채용 결과는 확인됐나</em>',lead:'9월 크레테유의 인력 배치는 확인.\n11월5일에도 교육 지원 확대 요구가 이어졌다.\n10월26일 전국 대책의 이행 실적은 미확인.'}
];
Object.assign(lyonFrames[0],{
 headline:'교사를 늘리고<br><em>낡은 학교를 고쳐달라</em>',
 body:'교사 충원과 학교 시설 개선을 요구한 고교생들.\n15일 뒤 같은 도시에서는 누가, 무엇을 요구했을까.',
 trail:{hero:true,stage:'school',label:'2일 · 고교생들의 요구',detail:'교사 충원 · 학교 시설 개선',addition:null}
});
Object.assign(lyonFrames[1],{
 headline:'교육 개선에 연대한 노동계<br><em>물가 인하·임금 인상 요구</em>',
 body:'교육 개선에 연대한 시민들의 생활비 항의.\n이날 전국 행동에서 CGT는 임금·연금 인상과\n물가 인하, 공공서비스 확충을 요구했다.',
 trail:{hero:true,stage:'solidarity',label:'17일 · 교육 개선 시위에 연대',detail:'학생들의 요구에 시민·노동계가 합류',addition:{label:'이날 전국 행동 · CGT의 요구',text:'생활비 부담을 줄여 달라',detail:'물가 인하 · 임금·연금 인상 · 공공서비스',source:S.march}}
});
const recutEurope=recut(11,{
 scope:'유럽',overview:true,center:[6,47],width:3300,height:2500,cities:['frankfurt','rome','lisbon'],selected:undefined,local:false,
 kicker:'佛만의 문제일까 · 계기는 달라도, 생활을 바꾸라는 요구',title:'서로 다른 제도에<br><em>던져진 질문</em>',menuLabel:'유럽 · 세 나라의 요구와 응답',
 photo:'frankfurt',period:europeFollowupPeriod,
 lead:'학교·기후 지원과 징병제 반대.\n독일 청년들은 미래를 결정하는 데\n자신들의 목소리를 담으라고 요구했습니다.',
 body:'독일에서는 10월 31일 청년들이 교육·기후 지원, 고물가 대책과 징병제 반대를 함께 요구했습니다. 주최 측 전국 집계는 약 12만명이며 경찰 공식 집계는 확인되지 않았습니다. 앞서 16만명이 참여 의사를 등록한 것과는 다른 수치입니다. 낮 집회는 대체로 평화로웠지만 프랑크푸르트 등 일부 도시에서는 행진 뒤 충돌과 상점 피해가 보도됐습니다. 이 사진은 상점 파손 장면이 아닙니다.\n\n이탈리아의 30일 총파업에서는 생활비·주거난과 군비 확대에 대한 항의가 함께 나왔습니다. 참가 규모는 내무부 전국 25만5000명, USB 노조 약 150만명으로 추산 주체에 따라 달랐습니다.\n\n포르투갈에서는 임대차 법안 철회를 요구한 31일 행진과 농성장 철거 뒤 11월 1일에도 항의 집회가 이어졌습니다. 총리는 철회를 거부하고 최종 표결 전 수정 가능성을 열어뒀습니다. 경찰과 활동가 단체의 부상 집계는 조사 범위와 주체가 달라 합치지 않습니다.\n\n세 나라를 같은 시위의 연속이나 프랑스와 같은 원인으로 묶을 수는 없습니다. 무엇을 지원하고 누구에게 부담을 지울지에 관한 요구라는 점을 비교합니다.',
 note:'사진은 각각 10월 31일 프랑크푸르트, 10월 30일 로마, 11월 1일 리스본의 AP/뉴시스 기록입니다. 시위의 계기·정책·날짜는 다릅니다. 포르투갈 법안의 최종 처리나 독일·이탈리아의 정책 변경 결과는 이 보도에서 확인되지 않습니다.',
 refs:[['NISX20261101_0003849471','독일 청년들의 요구·참가 집계'],[nov2Sources.europe,'독일 후속 기록·이탈리아 총파업·포르투갈 정부 응답']],
 readingFrames:[
  {label:'독일',photo:'frankfurt',kicker:'佛만의 문제일까 · 10월 31일 독일 / 사진 프랑크푸르트',title:'학교·기후·징병,<br><em>미래를 결정할 목소리</em>',lead:'교육·기후 지원과 고물가 대책을 요구한 청년들.\n독일에선 징병제 반대도 시위의 쟁점이었다.\n프랑스와는 다른 제도와 계기에서 나온 항의.'},
  {label:'이탈리아',photo:'romeStrike',kicker:'이탈리아 · 10월 30일 / 사진 로마',title:'생활비·주거난 앞에서<br><em>군비 확대를 묻다</em>',lead:'생활비·주거난, 군비 확대에 반대한 총파업.\n노동자와 학생들이 함께 나섰다.\n집세와 공공요금이 버겁다는 호소.'},
  {label:'포르투갈',photo:'lisbonGathering',kicker:'포르투갈 · 11월 1일 / 사진 리스본',title:'법안 철회 요구에,<br><em>정부는 수정 가능성만</em>',lead:'임대차 법안을 철회하라는 요구.\n총리는 철회를 거부하고 표결 전 수정 가능성만 제시.\n농성장 철거 뒤에도 시민들은 다시 모였다.'}
 ]
});
// Each country's detail and dated archive follow the photograph currently selected.
const europeParagraphs=recutEurope.body.split('\n\n');
recutEurope.readingFrames.forEach((frame,n)=>{
 frame.body=europeParagraphs[n]+'\n\n'+europeParagraphs[3];
 frame.period=n===0?priorChapters[11].period:europeFollowupPeriod;
 frame.refs=n===0?recutEurope.refs:[recutEurope.refs[1]];
 frame.note=n===0?'사진은 10월 31일 프랑크푸르트의 AP/뉴시스 기록이며 상점 파손 장면이 아닙니다. 전국 참가 집계와 사전 등록 인원은 다릅니다.':n===1?'사진은 10월 30일 로마. 참가 규모는 로마가 아닌 이탈리아 전국 집계이며 내무부와 노조 추산을 구분합니다.':'사진은 11월 1일 리스본의 해산 비판 집회. 31일 행진과 새벽 철거, 이후 집회를 구분합니다. 법안 최종 처리 결과는 이 보도에서 확인되지 않습니다.';
});
const europeanChapters=recutEurope.readingFrames.map((frame,n)=>recut(11+n,{
 ...frame,european:true,local:false,onlyCities:true,
 scope:['독일','이탈리아','포르투갈'][n],
 mapKicker:['독일 · 10월 31일 / 지도는 프랑크푸르트 위치','이탈리아 · 10월 30일 / 지도는 로마 위치','포르투갈 · 11월 1일 / 지도는 리스본 위치'][n],
 selected:photos[frame.photo].city,cities:[photos[frame.photo].city],
 menuLabel:['독일 · 미래를 결정할 목소리','이탈리아 · 생활비·주거·군비','포르투갈 · 법안 철회 요구와 정부의 답'][n],
 body:frame.body,
 readingFrames:[{...frame,label:'지도',view:'map',photo:undefined},{...frame,label:'현장 사진',view:'photo'}],
},['overview','gallery','galleryCopy','interaction','pivot']));

const extraEuropeanRecords=[
 {city:'brussels',photo:'brussels',scope:'벨기에',date:'10월 9일',title:'학교에 쓸 예산을<br><em>줄이지 말라는 목소리</em>',lead:'브뤼셀의 학생·교사들은 교육 개혁에 반대했다.\n예산을 줄이지 말고 지원을 늘려 달라는 요구.\n프랑스와 닮았지만, 항의 대상은 벨기에 정책.',body:'10월 9일 브뤼셀에서 학생과 교사들이 프랑스어권 지역의 교육 개혁과 예산 삭감에 반대하는 전국 단위 시위에 참여했다. 프랑스의 교원 충원 요구와 교육 지원이라는 쟁점은 겹치지만, 다른 제도와 정책을 향한 행동이다. 프랑스 시위에 동조하기 위해 열렸다는 근거는 이 보도에 없다.',refs:[['NISX20261022_0003836934','브뤼셀 사진·교육 예산 반대 요구']]},
 {city:'tirana',photo:'tirana',scope:'알바니아',date:'10월 18일',title:'개발 특혜 논란에서<br><em>등록금·교육 문제까지</em>',lead:'리조트 개발을 둘러싼 특혜·환경 훼손 논란.\n높은 등록금과 열악한 대학 환경에 대한 불만이\n학생들의 반정부 시위 참여로 이어졌다.',body:'알바니아에서는 쿠슈너와 연계된 리조트 개발의 특혜·환경 훼손 논란이 시위의 계기로 보도됐다. 높은 등록금과 열악한 대학 환경에 대한 항의도 겹쳤다. 10월 18일 티라나 사진은 총리 사퇴를 요구하는 시위대와 경찰의 충돌을 기록한다. 이후 24일 집회 보도에서도 등록금 인하·교육 투자·교육계 부패 척결 요구가 확인된다. 프랑스 학교 봉쇄가 이 시위를 시작시켰다는 뜻은 아니다.',refs:[['NISX20261019_0003831422','개발 논란·교육 문제·18일 사진'],['NISX20261025_0003839845','24일 집회와 구체적인 교육 요구']]},
 {city:'athens',photo:'athensCamp',scope:'그리스',date:'10월 20~21일',title:'비싼 집세 때문에<br><em>학업을 포기해야 할 때</em>',lead:'임대료와 학생 주택 부족에 항의하는 학생들.\n주거비 때문에 학업을 포기해야 한다는 호소.\n집을 구하기 어려운데, 공부는 어떻게 이어갈까?',body:'10월 20일 아테네 신타그마 광장에서는 학생들이 임대료와 저렴한 학생 주택 부족에 항의하며 텐트를 설치했다. 21일에는 아테네 등 여러 도시에서 생활비 부담과 교육 여건 악화에 항의하는 학생 시위가 열렸다. 경찰의 아테네 참가자 추산은 최소 5000명으로, 20일 텐트 사진의 인원 수가 아니다. 뉴시스가 전한 대학생의 호소는 비싼 임대료를 감당하지 못하면 학업도 포기해야 한다는 것이었다. 프랑스와의 직접적인 조직 연계는 확인되지 않았다.',refs:[['NISX20261023_0003838580','20일 텐트 사진·21일 학생 시위·주거 부담']]},
 {city:'madrid',photo:'madrid',scope:'스페인',date:'10월 17일',title:'주거비 부담에 항의한 시민들<br><em>세입자 보호법 강화 요구</em>',lead:"10월17일, 마드리드 광장의 텐트 농성.\n시민들은 세입자 보호법 강화를 요구했고,\n노동계는 주거비 공동 대응을 논의했다.",body:"10월17일 마드리드 푸에르타델솔 광장에서 시위 참가자들은 텐트를 치고 농성하며 세입자 보호 법률 강화를 요구했다.\n\n10월23일 보도는 스페인 노동계가 주거 여건 개선과 임금 인상을 요구하며 포르투갈 노조와 공동 행동을 논의했다고 전했다. 두 나라가 같은 날 함께 집회를 열었다는 뜻은 아니다.\n\n같은 스페인에서도24일 바르셀로나 집회는 별도다. 뉴시스는 프랑스 청년 시위의 영향을 받은 것으로 전했지만, 조직 주체와 가담 경위는 조사 중이었다. 경찰은 구체적인 요구가 없었다고 설명했다. 이를 마드리드의 주거 요구나 국경을 넘은 조직적 연대로 단정하지 않는다. 사진은 바르셀로나가 아닌17일 마드리드다.",refs:[['NISX20261023_0003838663','마드리드 농성·양국 공동 행동 논의'],['NISX20261026_0003840275','별도 바르셀로나 집회·영향 보도와 조사 중인 내용']]},
 {city:'copenhagen',photo:'copenhagenStudents',scope:'덴마크',date:'11월 4일',title:'학생수당 삭감안에<br><em>수업을 거부한 학생들</em>',lead:"부모 소득에 따른 학생수당 삭감안에 반대.\n고교생·대학생 단체12곳은11월4일\n코펜하겐에서 의회까지 행진했다.",body:"11월4일 코펜하겐에서 고교생·대학생 단체12곳이 정부의 학생수당 삭감안에 반대하며 시청 광장에서 의회까지 행진했다. 뉴시스가 전한 현지 보도의 행진 참가자는 약1만2000~1만3000명. 전국57개교에서 수업을 거부한 학생 약4만명과는 범위가 다르다.\n\n정부가 제시한 삭감안은 부모와 함께 사는 학생의 수당(SU)을 부모 소득에 따라 줄이는 내용이었다. 정부가 내놓은 정책안으로, 실제 수당 지급액의 변화를 확인한 자료는 아니다.\n\n학생들은 국방비를 늘리려고 교육 지원을 줄여서는 안 된다고 주장했다. 연립정부에 참여한 정당들은 재정을 고려하면 필요한 조치라며 삭감안을 옹호했다.\n\n같은 기사는9월부터 프랑스에서 이어진 교육환경 개선 요구가 고물가·공공서비스 문제와 맞물려 유럽 다른 나라로 확대된 흐름도 짚었다. 덴마크의 항의 대상은 자국의 학생수당 삭감안이다. 프랑스의 특정 학교에서 코펜하겐으로 누가 어떻게 시위를 전달했는지 확인한 자료는 제시되지 않았다.",refs:[['NISX20261105_0003856225','덴마크 학생수당 삭감 반대·행진과 수업 거부의 집계 범위']]}
];
photos.tirana={city:'tirana',file:'tirana-oct18.jpg',alt:europeRecords.tirana.alt,credit:'알바니아 · 티라나 · 2026.10.18 · AP/뉴시스',source:'NISX20261019_0003831422'};
photos.athensCamp={city:'athens',file:'athens-oct20.jpg',alt:'10월 20일 아테네 신타그마 광장에 학생들이 주거비에 항의하며 설치한 텐트',credit:'그리스 · 아테네 · 2026.10.20 · AP/뉴시스',source:'NISX20261023_0003838580'};
places.copenhagen={name:'코펜하겐',country:'덴마크',countryKey:'Denmark',lon:12.5683,lat:55.6761};
photos.copenhagenStudents={city:'copenhagen',file:'copenhagen-nov4.jpg',alt:'11월4일 덴마크 코펜하겐 의회 앞에서 학생수당 삭감안에 반대하며 구호를 외치는 학생 시위 참가자들',credit:'덴마크 · 코펜하겐 · 2026.11.04 · AP/뉴시스',source:'NISX20261105_0003856225'};
cityTimelines.copenhagen=[{label:'11월4일',date:'2026-11-04',kind:'protest',title:'학생수당 삭감 반대 행진·수업 거부',source:'NISX20261105_0003856225'}];
const denmarkPeriod=periods.length;
periods.push({label:'11.4',date:'11월4일',title:'덴마크 학생수당 삭감 반대',context:'덴마크 정부의 학생수당 삭감 계획에 학생들이 반대했다.',stat:'전국 57개교 수업 거부 약 4만명 · 코펜하겐 행진 약 1만2000~1만3000명',center:[10.4,56],width:660,height:680,primary:'copenhagen',records:{copenhagen:{date:'11월4일',who:'고교생·대학생 단체 12곳 등',demand:'학생수당 삭감 반대',text:'학생들은 정부의 학생수당 삭감 계획에 반대하며 코펜하겐에서 의회까지 행진했다. 전국의 수업 거부 학생 수와 코펜하겐 행진 참가자 수는 범위가 다르다.',photo:'copenhagen-nov4.jpg',caption:photos.copenhagenStudents.credit,alt:photos.copenhagenStudents.alt,source:'NISX20261105_0003856225'}}});
const extraEuropeanChapters=extraEuropeanRecords.map(r=>{
 const frame={label:'지도',view:'map',title:r.title,kicker:r.scope+' · '+r.date,lead:r.lead,body:r.body,refs:r.refs,period:r.city==='copenhagen'?denmarkPeriod:5,note:'각국의 국내 요구와 별도 집회. 프랑스에서 이 도시로 직접 전달된 경로를 그리지 않습니다. 사진 촬영일과 집회·보도 날짜를 구분합니다.'};
 const view={brussels:[4.7,50.5,360,330],tirana:[20,41.1,400,470],athens:[23.5,38.5,1000,850],madrid:[-3,40,1150,900],copenhagen:[10.4,56,660,680]}[r.city];
 return {...europeanChapters[0],...frame,date:r.date,detail:'각국의 요구와 현장 기록',center:view.slice(0,2),width:view[2],height:view[3],european:true,scope:r.scope,photo:r.photo,selected:r.city,cities:[r.city],mapKicker:r.scope+' · '+r.date+' / 지도는 '+places[r.city].name+' 위치',menuLabel:r.scope+' · '+r.title.replace(/<[^>]+>/g,' '),readingFrames:[frame,{...frame,label:'현장 사진',view:'photo',photo:r.photo}]};
});
const lisbonNovember14Period=periods.length;
periods.push({label:'11.14 포르투갈',date:'11월14일',title:'퇴거 보호·공공주택 요구',context:'리스본 등30여 도시의 주거비 항의. 프랑스와는 제도·주최자가 다른 포르투갈의 국내 요구다.',center:[-8,39.6],width:360,height:560,primary:'lisbon',records:{lisbon:{date:'11월14일',who:'주거비 상승에 항의한 시민들',demand:'임대료 인상 제한·퇴거 보호·공공주택 확대·투기 억제',text:nov16Followup.portugal.body,photo:'lisbon-nov14.jpg',caption:photos.lisbonNovember14.credit,alt:photos.lisbonNovember14.alt,source:nov16Followup.source}}});
cityTimelines.lisbon.push({label:'11월14일',date:'2026-11-14',kind:'protest',title:'주거비 항의·퇴거 보호와 공공주택 확대 요구',note:'리스본 등30여 도시는 전국 범위이며 이 도시의 참가 인원 수가 아님',source:nov16Followup.source});
// Update each country and its reading sheet together; older dated records stay intact.
for(const [chapter,update] of [[europeanChapters[0],nov16Followup.germany],[europeanChapters[2],nov16Followup.portugal]]){
 const portugal=chapter.selected==='lisbon',photo=portugal?'lisbonNovember14':chapter.photo;
 Object.assign(chapter,{title:update.title,lead:update.lead,body:update.body,note:update.note,refs:update.refs,photo,...(portugal?{date:'11월14일',period:lisbonNovember14Period,kicker:'포르투갈 · 11월14일 · 리스본 주거비 항의',mapKicker:'포르투갈 · 11월14일 · 리스본 등30여 도시'}:{mapKicker:'독일 · 10월31일~11월14일 · 교육·생활비·징병 요구'})});
 chapter.readingFrames=chapter.readingFrames.map(frame=>({...frame,title:update.title,lead:frame.view==='photo'?update.photoLead:update.lead,body:update.body,note:update.note,refs:update.refs,period:chapter.period,...(frame.view==='photo'?{photo}:{}),...(portugal?{kicker:chapter.kicker}:{})}));
}
const orderedEuropeanChapters=[extraEuropeanChapters[0],europeanChapters[0],europeanChapters[1],extraEuropeanChapters[1],extraEuropeanChapters[2],extraEuropeanChapters[3],europeanChapters[2],extraEuropeanChapters[4]];

const cutOpening=recut(0,{
 coverDeck:'빠진 교사를 채우고, 낡은 학교를 고쳐 달라.<br>한 학교에서 나온 요구는<br>어떻게 여러 도시의 행동과 이어졌을까.',
 body:'대체 교사가 없어 취소되는 수업, 학생이 몰린 교실, 낡고 비위생적인 시설. 고교생들은 인력을 채우고 배울 환경을 바꿔 달라며 교문을 막았다.\n\n교사·교직원 충원 요구가 다른 학교에서 되풀이되고 노조·학부모·교사의 연대와 만난 과정을 따라간다. 리옹의 10월 2일과 17일 사진에서는 교육에 생활비 요구가 함께 나온 변화를 대조한다. 마지막에는 시위가 시작된 생텍쥐페리 고교의 실제 충원과 전국 대책의 약속을 분리해 확인한다.',
 refs:[['NISX20260930_0003809025','학생들이 요구한 교원·학급·시설 개선'],[S.origin,'크레테유의 파업과 추가 인력 배치'],[S.march,'교육 개선 연대와 생활비 항의'],...priorChapters[0].refs]
});
const cutOrigin=recut(1,{
 demandStep:{id:'origin',demand:'staff',sources:[S.origin,S.talks]},
 title:'교직원 파업에<br><em>교문을 막은 학생들</em>',date:'9월',
 kicker:'9월 · 크레테유 / 생텍쥐페리 고교',menuLabel:'크레테유 · 교직원을 늘려 달라',
 lead:'교직원 부족에 항의한 생텍쥐페리 고교의 파업.\n학생들도 교문을 막고 충원을 요구했다.\n수업을 할 사람과 학교에 쓸 자원이 필요했다.',
 body:'9월, 파리 남동쪽 크레테유의 생텍쥐페리 고교. 교직원 부족에 항의하던 파업에 학생들이 동참했다. 학교 출입구를 막고 요구한 것은 교직원 충원과 교육 자원 확대. 교직원들의 파업을 지지한 봉쇄였다.\n\n인력을 채워 달라는 요구는 이 학교만의 사정이었을까. 다른 학교에서는 결원 교사를 대체하지 못해 수업을 취소한다는 목소리가 나왔다.',
 note:'진한 선은 파리·크레테유의 실제 시 경계, 옅은 선은 주변 광역 행정 경계입니다. 지도 점은 도시 위치이며 학교 건물·촬영 지점이 아닙니다. 시위 시작일은 10월 6일 보도에선 9월 17~18일, 7일 보도에선 21일로 달라 9월로만 표기했다.',
 refs:[[S.origin,'교직원 파업·학생 봉쇄·충원 요구'],[S.talks,'발단 날짜와 학생들의 구체적 요구']]
});
const cutShared=recut(2,{
 demandStep:{id:'shared',from:'origin',demand:'staff',sources:[S.origin,S.talks]},
 title:'다른 학교에서도<br><em>교사가 없어 빠진 수업</em>',kicker:'9월 말 · 여러 도시에서 나온 같은 요구',
 menuLabel:'다른 학교 · 결원을 채우지 못한 교실',selected:'creteil',onlyCities:true,local:true,cities:['creteil'],center:[2.455,48.79],width:42,height:38,
 lead:'대체 교사가 없어 취소된 수업.\n책상·의자가 모자란 교실도 SNS로 공유됐다.\n다른 학교 학생들도 인력과 지원을 요구했다.',
 body:'대체 교사가 없어 취소된 수업, 책상과 의자도 모자란 교실. 학교의 이런 모습은 수년 전부터 SNS로 공유돼 왔다. 학생들은 교사 증원뿐 아니라 결원 교사의 신속한 대체, 교육보조인력과 간호사·사회복지사 충원을 요구했다.\n\n2008년보다 중등교육 학생은 약 25만명 늘었지만 교사는 감소했다. 물가를 감안한 학교 재정도 수년간 줄었다. 과밀학급과 폭염에 취약한 낡은 시설 역시 여러 학교에서 제기한 문제다.\n\n프랑스 교육부 통계국(DEPP)의 2026년4월 자료에서도 수업의 공백이 드러난다. 2024~2025학년도 공립 중·고교 수업 시간의9.8%가 진행되지 않았다. 전체 수업 시간을 기준으로7.5%포인트는 자리를 비운 교사를 대체하지 못한 시간,2.3%포인트는 학교 전체가 문을 닫은 시간이었다. 병가·연수·시험 운영 등이 함께 포함돼 있어 모두 교사 정원 부족 때문이라고 해석할 수는 없다. 조사 대상은 마요트를 제외한 프랑스 공립 중·고교다.\n\n티베르주 보르도 정치대 교수는 학교 간 격차를 배경으로 짚고, SNS를 통한 수평적 확산을 특징으로 분석했다. 이 분석과 별도로, 학생단체가 전국 행동을 조직한 기록도 있다. USL(고교생노조연합)은 교사 증원과 학교 시설 개선 등을 요구하는 프랑스의 고교생 단체다. 9월 29일에는 전국 봉쇄를 촉구하며 공공부문 노조 시위에 연대했다.',
 note:'점은 보도에 나온 도시이며 시위대의 이동 경로나 학교별 여건을 표시하지 않습니다. 학생·교사 수는 중등교육 전체의 배경 통계, SNS 확산은 전문가 분석입니다. 수업 시간 통계: 프랑스 교육부 DEPP, 교육통계브리프26.14(2026년4월). 2024~2025학년도 조사로,2026년 시위 기간의 수업 손실률은 아니다.',
 refs:[[S.origin,'학생·교사 수 변화와 결원·수업 취소'],['NISX20260930_0003809025','구체적 충원 요구·전국 봉쇄와 노조 연대'],[S.talks,'학교 간 격차와 SNS 확산에 관한 분석']]
});
const cutSolidarity=recut(3,{
 demandStep:{id:'union',from:'shared',demand:'staff',sources:['NISX20260930_0003809025',S.talks]},
 documentary:true,photo:'lilleBudget',gallery:['lilleBudget','lillePlacard'],period:1,pivot:'연대',
 galleryLabels:['9월 29일 · 노조 연대','10월 1일 · 학생 팻말'],
 title:'학생단체가 연대한<br><em>공공부문 노조의 시위</em>',kicker:'9월 29일 · 사진은 릴에서 열린 예산안 반대 행진',
 menuLabel:'릴 · 긴축 반대 노조와 학생들의 연대',
 lead:'9월 29일, USL은 전국 학교 봉쇄를 촉구하며\n긴축 예산에 반대하는 공공부문 노조에 연대했다.\n교사 충원 요구가 공공서비스 예산 문제와 만났다.',
 body:'9월 29일 USL은 공교육 예산 부족과 교사 결원, 학교 환경을 문제 삼아 전국 봉쇄를 촉구했다. 이날 긴축 예산에 반대하는 공공부문 노조 시위에도 연대했다. 교원을 늘려 달라는 학교의 요구와 공공서비스에 예산을 쓰라는 노동계의 요구가 만난 구체적인 연결이다. 사진은 같은 날 릴에서 열린 예산안 반대 행진이며, 사진 속 개별 참가자를 USL 소속으로 특정하지 않는다.\n\n10월 1일 릴 고교생의 팻말에는 졸업시험과 범죄수사대의 비슷한 약자 BAC가 겹쳐 쓰였다. 교육 지원 요구와 경찰 대응에 대한 항의를 함께 담은 표현이다.\n\n이튿날인 2일 교육장관과 학생단체의 협상은 합의 없이 끝났다. 학생단체는 구체적인 약속이 없다며 6일 전국 행동을 촉구했다. 노조 연대가 협상 불발 뒤 처음 생긴 것은 아니다.',
 note:'9월 29일 행진과 10월 1일 팻말은 다른 기록입니다. 2일 협상 결과를 1일 사진의 현장으로 표현하지 않습니다.',
 refs:[['NISX20260930_0003809025','USL의 전국 봉쇄 촉구·공공부문 노조 연대'],[S.origin,'릴 학생의 BAC 팻말'],[S.talks,'2일 협상 불발·6일 전국 행동 촉구']],
 galleryCopy:[
  {title:'학생단체가 연대한<br><em>공공부문 노조의 시위</em>',kicker:'9월 29일 · 사진은 릴에서 열린 예산안 반대 행진',lead:'9월 29일, USL은 전국 학교 봉쇄를 촉구하며\n긴축 예산에 반대하는 공공부문 노조에 연대했다.\n학교 인력과 공공서비스 예산을 둘러싼 요구.',period:1},
  {title:'릴 학생의 팻말,<br><em>학교 지원을 요구하다</em>',kicker:'10월 1일 릴 사진 · 이튿날인 2일에는 정부와 협상',lead:"졸업시험 'LE BAC'와 범죄수사대 'LA BAC'를 겹친 팻말.\n이튿날 협상은 합의 없이 끝났고,\n학생단체는 구체적 약속을 요구하며 6일 행동을 촉구했다.",period:2}
 ]
});
const cutParents=recut(6,{
 demandStep:{id:'parents',from:'union',demand:'staff',sources:['NISX20261007_0003816672','NISX20261025_0003839953']},
 documentary:true,photo:'parisSupport',gallery:undefined,galleryCopy:undefined,period:6,pivot:'참여',
 title:'학생 곁에 모인<br><em>학부모·교사·대학생</em>',kicker:'10월 8일 파리 사진 · 교육 개선 시위에 합류한 사람들',
 menuLabel:'파리 · 교육 요구를 함께한 사람들',
 lead:'교사와 학교에 더 지원하라는 요구에\n학부모·교사·대학생·공무원 노조도 합류.\n교육 여건을 바꾸라는 목소리를 함께 냈다.',
 body:'교사와 시설을 늘려 달라는 학생들의 시위에 대학생과 학부모, 교사, 공무원 노조 등이 합류했다. 6일 전국 행동을 전한 보도에서도 교원단체·학부모·대학생의 참여가 확인된다. 학교의 교육 여건을 함께 문제 삼은 연대다.\n\n진압 방식에 대한 반발도 겹쳤다. 일부 학부모·교사들은 청소년 체포와 최루가스 등에 우려를 제기했다. 5일 랑스에서는 경찰과 충돌하던 15세 소년이 섬광탄 폭발로 손을 잃었고, 학생단체와 내무장관은 물리력의 적절성을 두고 맞섰다. 8일 보도는 고교생 시위 진압용 섬광탄 사용 중단을 전했다.\n\n참여가 넓어진 배경에는 교육 요구에 대한 공감과 경찰 대응 논쟁이 함께 있다. 하나의 사건만으로 모든 집회의 원인을 설명할 수는 없다. 17일 리옹에서는 교육 개선에 연대한 시민들의 생활비 항의까지 함께 기록됐다.',
 note:'사진은 10월 8일 파리의 교육 연대 집회이며 랑스 부상 현장이 아닙니다. 사진 속 개인의 신분·소속은 특정하지 않습니다.',
 refs:[['NISX20261025_0003839953','파리 교육 연대 집회와 참여 주체'],['NISX20261007_0003816672','6일 전국 행동·학부모와 교원단체의 참여'],[S.talks,'랑스 부상과 진압 논쟁'],[S.police,'고교생 진압용 섬광탄 사용 중단'],[S.march,'17일 리옹의 교육 연대·생활비 항의']]
},['annotation','readingFrames']);
const cutLyon=recut(7,{
 demandStep:{id:'lyon',from:'parents',demand:'staff',sources:[lyonFrames[0].source,S.march]},
 lyonFocus:true,trail:lyonFrames[0].trail,pivot:'요구',
 title:lyonFrames[0].headline,kicker:'리옹 · 같은 도시의 두 날짜 / 10월 2일·17일',
 menuLabel:'리옹 · 두 날짜에서 달라진 요구',lead:lyonFrames[0].body,
 body:'리옹의 두 기록을 비교한다. 10월 2일 고교생들은 교원 충원과 학교 시설 개선을 요구하며 행진했다. 17일 같은 도시의 별도 집회에서는 공교육 개선 시위에 연대해 생활비 상승에 항의하는 시민들의 모습이 기록됐다.\n\n17일 전국 행동에는 학생·대학생·노동조합과 노란 조끼 주요 인사들도 참여했다. CGT는 물가 인하와 임금·연금 인상, 공공서비스 확충을 요구했다. 교육 요구가 사라지고 생활비 요구로 교체된 것이 아니라, 교육 개선에 대한 연대와 다른 생활의 요구가 함께 나온 장면이다.\n\n사진 속 개인의 요구를 소속 단체의 요구로 단정하지 않는다. 대다수 참가자는 평화적으로 행진했고 일부 현장에서는 충돌과 약탈도 발생했다.',
 note:'같은 도시에서 15일 간격으로 촬영한 별도 집회입니다. 같은 사람·같은 촬영 지점의 전후 사진이 아니며, 첫 사진의 사람들이 두 번째 집회로 이동했다고 표현하지 않습니다.',
 refs:[[lyonFrames[0].source,'2일 리옹 고교생들의 교육 개선 행진'],[S.march,'17일 리옹의 연대 집회·전국 행동의 참여와 CGT 요구']]
});
const cutVoice=recut(15,{
 closing:false,preAudit:true,menuLabel:"파리 · 요구에 대한 답변",
 kicker:'10월 24일 파리 · 26일 교육 대책 발표 전',
 title:"참가자가 원한 것은<br><em>요구에 대한 답변</em>",
 lead:"10월24일 파리 집회에서 익명의10대 참가자가 강조한 것은 요구에 대한 답변이었다.\n26일 정부 대책 발표보다 앞선 발언이다.",
 body:"10월24일 파리 집회에서 익명의10대 참가자가 강조한 것은 요구에 대한 답변이었다. 정부의26일 교육 대책 발표보다 앞선 발언이다.\n\n교직원 충원과 교육 지원을 요구한 학생들. 정부가 내놓은 대책과 학생단체의 평가는 어떤 차이가 있었을까.",
 note:"발언의 취지를 풀어 쓴 설명이다. 사진 속 인물을 발언자로 특정하지 않으며26일 교육 대책에 대한 반응도 아니다.",
 refs:[['NISX20261025_0003840125','24일 파리 집회 · 익명 10대 참가자의 말']]
});
const cutAnswer=recut(8,{
 demandStep:{id:'answer',from:'lyon',demand:'staff',sources:[S.educationPlan,S.fiscalLimit]},
 comparison:true,responseIntro:true,audit:false,readingFrames:undefined,
 kicker:'10월 26일 · 정부의 교육 대책',menuLabel:'정부의 답 · 교원과 학교 지원 약속',
 title:'교원을 늘려 달라는 요구에<br><em>500개 일자리 추가 약속</em>',
 lead:"학생단체는 일부 양보를 인정했다.\n그러면서도 교원·학교 지원 규모가 부족하다며\n정부 대책이 충분하지 않다고 평가했다.",
 body:"10월26일 정부는 중등교육 교원 감축 철회와 일자리500개 추가안을 발표했다. 일부 고교 학급은28명 이하로 제한하는 방안과 지자체 대상 최대40억유로의 학교 개보수 저리 대출도 제시했다. 무상 지원과는 다른 방식이다.\n\n대학 정원에 관해 학생단체는25만명 증원을 요구했고 정부는1만5000명 증원안을 제시했다. 학생단체는 일부 양보를 인정하면서도 규모가 부족하다고 평가했다.\n\n재원도 쟁점이었다. 재무장관은 추가 지출만큼 다른 예산을 줄여야 한다는 입장을 밝혔다. 부유세는 공정성 측면에서 긍정적이라고 평가하면서도 단기 재정 문제의 해법으로는 부정적인 입장을 보였다.",
 note:"정부가 발표한 대책이다. 발표안의 일자리 숫자와 실제 채용 인원은 다르며 일부 고교의 인원 기준을 전국 모든 학급에 적용하지 않는다.",
 refs:[[S.educationPlan,'교원·시설·대입 대책과 학생단체의 반응'],[S.fiscalLimit,'추가 지출에 관한 재무장관의 입장과 예산 제약']]
},['interaction','gallery','galleryCopy','annotation','closing']);
const cutAfter=recut(9,{
 demandStep:{id:'followup',from:'answer',demand:'staff',sources:[S.educationPlan,nov2Sources.europe]},
 title:'약속을 들은 뒤에도<br><em>교육·생활비 개선 요구</em>',menuLabel:'10월 31일 · 대책 뒤에도 나온 요구',
 kicker:'10월 31일 · 정부 대책 발표 뒤의 파리',
 lead:'교육·생활비 개선을 요구한 집회는 계속됐다.\n내무부 32만명, 청년단체·노조 50만명 집계.\n참가 규모로 교실의 개선 여부를 알 수는 없다.',
 body:'정부 대책 뒤인 10월 31일에도 교육·생활비 개선을 요구하는 집회가 열렸다. 전국 참가자는 내무부 32만명, 청년단체·노조 50만명 집계다. 내무부 기준으로 앞선 두 주말보다 줄었지만, 참가 규모를 교원 충원이나 교실 개선의 실적으로 읽을 수는 없다.\n\n11월 2일 보도는 집회가 대체로 평화로웠고 폭력·약탈도 17일보다 줄었다고 전했다. 내무부 발표 치안 인력 159명 부상, 전국 체포 779명은 각각 집계 성격이 다르다. 체포에는 집회와 핼러윈 야간 단속 등이 포함된다. 검찰의 폭발물 투척 혐의 살인미수 수사는 진행 중이다.\n\n학생단체가 추가 행동을 촉구한 뒤, 11월5일에는 교육 지원 확대와 임금·연금 인상을 요구하는 전국 시위가 실제로 열렸다. 8일 보도에 실린 내무부 집계는57만5000명, CGT 주장은 약160만명이다. 두 집계는 합산하지 않는다. 3일 보도에서 전한 현지 정치 분석과 5일 실제 집회의 결과는 구분해 읽는다.\n\n한편 독일·이탈리아·포르투갈의 거리에도 교육·생활비·주거 요구가 나왔다. 프랑스 시위가 국경을 넘어 전파됐다는 근거는 아니다. 각국의 계기와 요구를 따로 살핀다.',
 note:'10월 31일 파리 사진입니다. 참가자·체포·부상 집계의 범위가 다릅니다. 11월5일 실제 집회는 6일 후속 보도로 갱신했습니다. 정치적 의미에 관한 분석과 정책 이행 실적은 별개입니다.',
 refs:[...priorChapters[9].refs,...nov5Followup.refs]
},['readingFrames']);
const cutKorea=recut(14,{
 menuLabel:'한국 · 학교의 변화는 어디에 닿았나',kicker:'한국 · 교육부 자료 / 뉴시스 9월 8일 보도',
 title:'과밀은 줄었다.<br><em>어느 교실까지 달라졌나</em>',
 lead:'전국 초·중·고 과밀학급 비율은\n2025년 20.03%에서 2026년 15.16%로 감소.\n중학교는 여전히 35.13%. 기준은 학급당 28명 이상.',
 body:'한국의 교육부 자료에서는 전국 초·중·고 과밀학급 비율이 2025년 20.03%에서 2026년 15.16%로 감소했다. 전체 수치의 개선이 모든 교실의 개선을 뜻하는 것은 아니다.\n\n중학교 과밀학급 비율은35.13%, 경기 중학교는52.41%, 인천 중학교는49.78%다. 기준은 학급당 학생28명 이상. 전국 평균뿐 아니라 초·중·고와 지역을 나눠야 지원이 더 필요한 곳을 찾을 수 있다.\n\n어느 지역에 교실과 교원이 더 필요한지, 그 비용을 누가 어떻게 나눌지. 증세나 지출 조정은 누구의 부담을 늘리고 누구의 교육 여건을 바꾸는지 따져볼 선택이다. 필요한 곳에 지원이 닿도록 우선순위를 정하고, 학생·교사·학부모의 참여 속에 비용 분담을 논의하는 것이 이 기사에서 짚는 과제다.\n\n한국 통계는 프랑스의 교원 부족을 설명하거나 한국에서 같은 시위가 일어날 것을 예측하는 자료가 아니다. 두 나라를 하나의 미래로 겹쳐 보는 대신, 교육 여건의 격차와 대책의 실제 효과를 각각 확인할 필요가 있다. 약속한 지원이 어느 학교에 도착했는지 살피기 위해 프랑스의 교문으로 돌아간다.',
 note:'한국의28명 이상 과밀학급 기준과 프랑스가 제시한 일부 고교의28명 이하 기준은 대상과 기준이 달라 수치로 직접 비교하지 않는다. 지원의 우선순위와 비용 분담에 관한 대목은 자료를 바탕으로 한 편집적 제언이다.',
 refs:[['NISX20260907_0003779374','교육부 자료 · 전국 감소와 초·중·고와 지역별 과밀 차이']]
},['readingFrames']);
const cutSchoolResult=recut(1,{
 demandStep:{id:'local-result',from:'origin',demand:'staff',sources:[S.origin]},
 schoolResult:true,actStart:false,period:0,kicker:'다시 크레테유 · 9월의 개별 학교에서 확인된 변화',
 title:'생텍쥐페리 고교<br><em>인력 충원 뒤 파업 종료</em>',
 menuLabel:'다시 크레테유 · 실제로 확인된 충원',
 lead:'생텍쥐페리 고교에는 추가 인력이 배치됐다.\n그 뒤 이 학교의 파업은 종료.\n배치 규모와 직종은 보도에 제시되지 않았다.',
 body:'처음 교직원을 늘려 달라고 요구했던 생텍쥐페리 고교. 추가 인력이 배치됐고 이 학교의 파업은 끝났다고 10월 7일 보도가 전했다. 요구, 실제 배치, 파업 종료가 한 학교의 기록에서 이어진다. 다만 배치된 사람의 수와 직종은 이 보도에 제시되지 않았다.\n\n이 학교의 파업이 끝난 것은 9월이다. 정부가 일자리500개 추가안을 발표한 10월26일 전국 대책 발표보다 앞선 일이다. 따라서 이 학교의 인력 배치를 전국 대책이 실행됐다는 근거로 볼 수는 없다. 다른 학교에서도 처음 요구가 해결됐는지 보려면 전국 대책 발표안과 실제 변화의 자료를 분리해 읽어야 한다.',
 note:'9월 개별 학교의 인력 배치와 10월 26일 전국 대책 발표안은 서로 다른 기록입니다. 지도의 학교 건물 위치나 인원 변화를 재현하지 않습니다.',
 refs:[[S.origin,'추가 인력 배치와 생텍쥐페리 고교의 파업 종료']]
});
const endingAudit=recut(8,{
 demandStep:{id:'verify',from:'answer',demand:'staff',sources:[S.origin,S.educationPlan]},
 closing:true,comparison:true,audit:true,photo:undefined,scope:'프랑스',
 menuLabel:'마지막 · 처음의 요구는 어디까지 해결됐나',
 kicker:responseAuditFrames[0].kicker,title:responseAuditFrames[0].title,lead:responseAuditFrames[0].lead,
 auditRows:responseAuditRows,auditShownIds:['staff','class','building'],readingFrames:responseAuditFrames,
 body:'교사·교직원 충원 요구 옆에 정부의 약속을 놓고, 다시 확인된 결과로 바꿔 본다. 다른 학교의 인력과 수업이 나아졌는지는 집회의 참가 규모나 정부 발표 숫자만으로 판단할 수 없다.\n\n9월 크레테유의 추가 인력 배치는 확인된다. 이 사례를 10월 26일 전국 대책 발표안의 일자리 500개가 실제 채용됐다는 근거로 사용할 수 없다. 전국 채용·학급 축소·개보수 완료 실적은 이 기사에 반영한 보도에서 확인되지 않았다.\n\n11월 2일 방학 뒤에는 전국 고교 41곳에서 봉쇄 시위가 다시 열렸다. 교육부의 이날 오전 집계다. 학생 대표들은 정부의 답이 충분하지 않다고 밝혔다. 시위 재개 자체가 정책 미이행의 수치 증명은 아니다. 11월5일에는 학생·노동자·은퇴자들이 교육 지원 확대와 임금·연금 인상을 요구하며 다시 거리로 나왔다. 전국 참가자는 8일 보도에 실린 내무부 집계57만5000명, CGT 주장 약160만명으로 서로 다른 집계다. 고교 약3분의1의 운영 차질은 학생 봉쇄와 교사 파업 등을 포함하며 2일 봉쇄 고교41곳과는 집계 대상이 다르다.\n\n확인 자료의 부재를 정책 미이행으로 판정하지 않는다. 전국 대책이 학교의 변화로 이어졌는지는 채용·배치 현황, 대상 학급의 실제 인원, 개보수 완료 기록으로 확인해야 한다.\n\n대학 정원에 관해 학생단체는25만명 증원을 요구했고 정부는1만5000명 증원안을 제시했다. 대입 지원제도의 선발 기준과 불합격 사유 공개 확대, 지원 시스템 개편도 정부 발표안에 담겼다. 발표 내용은 실제 입학 정원이나 제도 변경 결과와 구분한다.',
 note:'5일 전국 시위와 학교 운영 차질을 확인했으며, 참가 규모를 전국 채용·시설 개선 실적으로 해석하지 않습니다. 9월 생텍쥐페리 고교의 인력 배치, 10월26일 전국 대책의 약속, 확인되지 않은 실적을 구분합니다.',
 refs:[...nov5Followup.refs,['NISX20261103_0003852984','방학 뒤 봉쇄 재개·규모 축소·학생 대표의 반응'],['NISX20260930_0003809025','처음의 교원·학급·시설 개선 요구'],[S.educationPlan,'정부 대책의 대상과 조건'],[S.origin,'크레테유의 실제 인력 배치']]
},['annotation','interaction','gallery','galleryCopy']);
const franceTimeChapter=createFranceTimeChapter({union:cutSolidarity,parents:cutParents,lyon:cutLyon,voice:cutVoice,answer:cutAnswer,after:cutAfter});
report.splice(0,report.length,cutOpening,cutOrigin,cutShared,franceTimeChapter,...orderedEuropeanChapters,cutKorea,cutSchoolResult,endingAudit);
const mainPhotoKeys=report.flatMap(b=>b.temporal?b.readingFrames.filter(f=>f.photo).map(f=>f.photo):b.european?[b.photo]:b.gallery?b.gallery:b.interaction?lyonFrames.map(f=>f.photo):b.photo?(b.readingFrames?b.readingFrames.map(f=>f.photo||b.photo):[b.photo]):[]).concat('nov5Students');
const mainPhotoFiles=new Set(mainPhotoKeys.map(k=>photos[k].file));
