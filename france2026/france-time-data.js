'use strict';
// Event dates, not publication dates. These are records included in the story,
// never a complete census of schools, demonstrations, or continuing protests.
const franceTimeDates=[
 {id:'sep29',label:'9.29',date:'9월 29일',iso:'2026-09-29',period:1,evidence:'union',part:0,photo:'lilleBudget',
  title:'9월 29일<br><em>학생단체, 공공부문 노조에 연대</em>',
  lead:'고교생 단체 USL은 전국 봉쇄를 촉구하며\n긴축 예산에 반대하는 공공부문 노조에 연대.\n릴에서는 예산안 반대 행진이 열렸다.',
  photoTitle:'릴, 9월 29일<br><em>공공서비스 예산을 요구한 행진</em>',
  photoLead:'사진은 릴에서 열린 예산안 반대 행진.\n참가자 개인을 USL 소속으로 특정하지 않는다.',
  records:[{city:'lille',issue:'public',text:'공공서비스 예산',source:'NISX20260930_0003809025'}],
  refs:[['NISX20260930_0003809025','USL의 전국 봉쇄 촉구·노조 연대·릴 행진']]},
 {id:'oct1',label:'10.1',date:'10월 1일',iso:'2026-10-01',period:2,evidence:'union',part:1,photo:'lillePlacard',
  title:'10월 1일<br><em>릴과 파리의 교육 지원 요구</em>',
  lead:'릴의 학생들은 교육 지원 확대를 요구했다.\n파리 볼테르 고교에서는 학교 입구 봉쇄.\n이튿날에는 학생단체와 교육장관의 협상이 열렸다.',
  photoTitle:'릴 학생의 팻말<br><em>졸업시험과 범죄수사대, 두 BAC</em>',
  photoLead:"'LE BAC'는 졸업시험, 'LA BAC'는 범죄수사대.\n교육 지원 요구와 경찰 대응에 대한 항의를\n비슷한 약자를 겹쳐 표현한 팻말.",
  records:[{city:'lille',issue:'education',text:'교육 지원 확대',source:S.origin},{city:'paris',issue:'education',text:'학교 입구 봉쇄',source:'NISX20261007_0003816672'}],
  refs:[[S.origin,'릴의 BAC 팻말'],['NISX20261007_0003816672','1일 볼테르 고교 봉쇄'],[S.talks,'2일 협상과 전국 행동 촉구']]},
 {id:'oct2',label:'10.2',date:'10월 2일',iso:'2026-10-02',period:2,evidence:'lyon',photo:'schoolmarch',
  title:'10월 2일<br><em>리옹의 교사·시설 개선 요구</em>',
  lead:'리옹 고교생들은 교사 충원과 시설 개선을 요구.\n같은 날 정부와 학생단체의 협상은 합의 없이 종료.\n학생단체는 6일 전국 행동을 촉구했다.',
  photoTitle:'교사를 늘리고<br><em>낡은 학교를 고쳐달라</em>',
  photoLead:'교사 충원과 학교 시설 개선을 요구한 고교생들.\n17일의 리옹 기록과 날짜를 바꿔 비교할 수 있다.',
  records:[{city:'lyon',issue:'education',text:'교사·시설 개선',source:'NISX20261007_0003816672'}],
  refs:[['NISX20261007_0003816672','2일 리옹 고교생의 행진'],[S.talks,'같은 날 협상 불발·6일 행동 촉구']]},
 {id:'oct8',label:'10.8',date:'10월 8일',iso:'2026-10-08',period:6,evidence:'parents',photo:'parisSupport',
  title:'10월 8일 파리<br><em>교육 요구에 함께한 사람들</em>',
  lead:'교육 개선을 요구하는 학생들 곁에\n대학생·학부모·교사·공무원 노조도 합류.\n학교 여건을 함께 문제 삼은 연대.',
  photoTitle:'파리의 교육 연대 집회<br><em>학생 곁의 학부모·교사·대학생</em>',
  photoLead:'사진은 10월 8일 파리의 집회.\n고교생 시위에 여러 주체가 합류했다고\n뉴시스는 25일 보도에서 전했다.',
  records:[{city:'paris',issue:'education',text:'교육 개선 연대',source:'NISX20261025_0003839953'}],
  refs:[['NISX20261025_0003839953','8일 파리 사진·참여 주체의 확대'],['NISX20261007_0003816672','앞선 전국 행동의 학부모·교원 참여'],[S.talks,'랑스 부상과 진압 논쟁'],[S.police,'진압용 섬광탄 사용 중단 보도']]},
 {id:'oct17',label:'10.17',date:'10월 17일',iso:'2026-10-17',period:4,evidence:'lyon',photo:'lyon17',
  title:'10월 17일<br><em>교육 연대에 생활비 요구도</em>',
  lead:'리옹에서는 교육 개선에 연대한 생활비 항의.\n파리·마르세유 등에서도 생활비·유가 상승에 항의.\n전국 행동에서 CGT는 임금·연금 인상도 요구했다.',
  photoTitle:'교육 개선에 연대한 노동계<br><em>물가 인하·임금 인상 요구</em>',
  photoLead:'교육 개선에 대한 연대와 생활비 항의.\nCGT는 전국 행동에서 임금·연금 인상 촉구.\n2일과 참가자·촬영 지점이 다른 별도 집회.',
  records:[{city:'lyon',issue:'mixed',text:'교육 연대 + 생활비',source:S.march},{city:'paris',issue:'mixed',text:'교육 연대 + 생활비',source:S.march},{city:'marseille',issue:'living',text:'생활비·유가 항의',source:S.march}],
  refs:[[S.march,'17일 리옹·파리·마르세유와 CGT의 전국 요구']]},
 {id:'oct24',label:'10.24',date:'10월 24일',iso:'2026-10-24',period:8,evidence:'voice',photo:'closingMarch',
  title:"10월24일 파리<br><em>참가자가 원한 요구의 답변</em>",
  lead:"10월24일 파리 집회의 익명10대 참가자.\n그가 강조한 것은 요구에 대한 답변이었다.\n26일 정부 대책 발표보다 앞선 발언이다.",
  photoTitle:"파리,10월24일<br><em>요구에 대한 답변을 강조한 참가자</em>",
  photoLead:"익명10대 참가자가 강조한 것은\n요구에 대한 답변이었다.\n사진 속 인물을 발언자로 특정하지 않는다.",
  records:[{city:'paris',issue:'living',text:'생활비 집회·참가자의 말',source:'NISX20261025_0003840125'}],
  refs:[['NISX20261025_0003840125','24일 파리 집회와 익명 10대의 말']]},
 {id:'oct26',label:'10.26',date:'10월 26일',iso:'2026-10-26',evidence:'answer',national:true,
  title:'10월 26일<br><em>정부가 내놓은 교육 대책</em>',
  lead:'교원 감축 철회 · 일자리 500개 추가 약속.\n일부 고교 학급 28명 이하 · 시설 보수용 저리 대출.\n학생단체는 지원 규모가 부족하다고 평가했다.',
  records:[],refs:[[S.educationPlan,'26일 전국 교육 대책·학생단체 반응'],[S.fiscalLimit,'27일 재정 관련 보도']]},
 {id:'oct31',label:'10.31',date:'10월 31일',iso:'2026-10-31',period:10,evidence:'after',photo:'parisHalloween',
  title:'10월 31일<br><em>대책 뒤에도 교육·생활비 요구</em>',
  lead:'정부 발표 뒤에도 집회는 계속됐다.\n전국 참가자는 내무부 32만명, 단체·노조 50만명.\n집회 규모가 교실의 개선 실적은 아니다.',
  photoTitle:'파리, 10월 31일<br><em>교육·생활비 개선을 요구한 집회</em>',
  photoLead:'전국 참가 집계와 파리 사진의 범위는 다르다.\n학생단체는 답변이 부족하다며 추가 행동을 촉구.\n11월5일 실제 집회는 6일 후속 보도로 확인.',
  records:[{city:'paris',issue:'mixed',text:'교육·생활비 개선',source:'NISX20261101_0003849471'}],
  refs:[['NISX20261101_0003849471','31일 참가 규모와 파리 사진'],['NISX20261102_0003850275','추가 행동 촉구와 체포 집계 범위'],['NISX20261102_0003850264','피해와 수사'],['NISX20261103_0003852329','3일 보도·현지 정치 분석'],['NISX20261106_0003857148','5일 실제 전국 시위 후속'],['NISX20261106_0003857342','5일 현장 사진·CGT 주장 집계']]}
];
// Relationships are between reported demands, national calls and local records.
// None asserts a documented person-to-person transmission between two cities.
const franceDemandConnections={
 sep29:{from:'creteil',to:'lille',kind:'national-call',label:'전국 행동 촉구',relay:'USL · 전국 봉쇄 촉구',
  question:'학교의 충원 요구는<br><em>릴의 거리와 어떻게 연결됐을까</em>',
  preview:'크레테유 학생들은 교직원 충원을 요구했다.\n릴에서는 긴축 예산에 반대한 행진.\n그 사이, 전국 행동을 촉구한 학생단체의 기록.',
  title:'학교 지원 요구를<br><em>전국 봉쇄 호소로 묶은 USL</em>',
  lead:'9월 29일, USL은 전국 학교 봉쇄를 촉구.\n긴축 반대 공공부문 노조에 연대하자는 호소.\n릴에서는 같은 날 예산안 반대 행진.',
  body:'USL(고교생노조연합)은 교사 증원과 학교 시설 개선 등을 요구하는 프랑스의 고교생 단체다. 크레테유에서 제기한 교직원 충원과 학교 지원 요구는 여러 학교에서도 나왔다. 9월 29일 USL은 공교육 예산과 교원 결원 등을 문제 삼으며 전국 학교에 봉쇄와 시위 참여를 촉구했다. 공공부문 노조의 긴축 예산 반대 행동에 연대하자는 호소였다.\n\n릴에서 확인되는 것은 같은 날의 예산안 반대 행진이다. 학생단체의 전국 행동 촉구와 릴의 현장 기록을 함께 읽는다. 이 사진 속 개인의 소속이나 참여 동기를 특정하지 않는다.',
  limit:'크레테유에서 릴로 직접 연락이 전달된 경로나 릴 시위의 최초 시작일은 확인한 보도에 제시되지 않았다.',
  refs:[[S.origin,'크레테유의 교직원 충원 요구'],['NISX20260930_0003809025','USL 전국 봉쇄 촉구·공공부문 노조 연대·릴 행진']]},
 oct2:{from:'creteil',to:'lyon',kind:'shared-demand',label:'공통 요구·확산 배경',relay:'공통 요구 · 교사와 시설',
  question:'리옹의 고교생들도<br><em>왜 교사와 시설을 요구했을까</em>',
  preview:'10월 2일 리옹에서도 교사 충원과 시설 개선 요구.\n다른 학교들에 쌓인 교육 여건의 문제와\n요구가 공유된 배경을 확인한다.',
  title:'여러 학교에 쌓인 문제,<br><em>리옹에서도 나온 교육 요구</em>',
  lead:'리옹에서도 교사 충원·시설 개선 요구.\n여러 학교에 쌓인 교원 부족·과밀·학교 간 격차.\nSNS 확산은 전문가가 짚은 배경.',
  body:'10월 2일 리옹의 고교생 행진에서도 교사 충원과 학교 시설 개선 요구가 확인된다. 앞선 학교와 같은 교육 지원 요구라는 연결이다. 여러 학교에서는 결원을 대체하지 못한 수업 취소와 과밀학급, 낡은 시설 등이 문제로 제기돼 왔다.\n\n보르도 정치대학의 티베르주 교수는 학교 간 격차와 악화된 학습 여건을 배경으로 짚고, SNS를 통한 수평적 확산을 분석했다. 이는 리옹의 특정 학교가 어떤 게시물을 보고 행동했는지 확인한 자료와는 구분한다.\n\n같은 날 정부와 학생단체의 협상은 합의 없이 끝났다. 이후 6일 전국 행동을 촉구한 기록은 다음 단계에서 살핀다. 협상 불발을 이미 열린 2일 리옹 행진의 원인으로 쓰지 않는다.',
  limit:'릴에서 리옹으로 시위가 직접 전달된 순서나 학교 간 연락은 확인되지 않았다. 이 단계에서는 도시 사이의 전파선을 그리지 않는다.',
  refs:[['NISX20261007_0003816672','2일 리옹 고교생의 행진'],[S.origin,'여러 학교의 교육 여건'],[S.talks,'학교 간 격차·SNS 확산에 관한 전문가 분석']]},
 oct8:{from:'creteil',to:'paris',kind:'national-call',label:'재동원 호소·교육계 연대',relay:'협상 불발 뒤 · 공동 행동 호소',
  question:'학생들의 요구 곁에<br><em>교사·학부모는 왜 모였을까</em>',
  preview:'2일 정부와 학생단체의 협상은 합의 없이 종료.\n학생단체와 교육계 노조는 다시 행동을 촉구했다.\n8일 파리에서 확인한 교육 연대 집회로 간다.',
  title:'합의 없는 협상 뒤,<br><em>교육계도 공동 행동을 촉구</em>',
  lead:'합의 없는 협상 뒤, USL은 6일 행동을 촉구.\nFSU 등 교육계 노조도 교직원들의 참여를 호소.\n교육 문제에 진압 방식에 대한 우려도 겹쳤다.',
  body:'2일 교육장관과 학생단체의 대화는 합의에 이르지 못했다. 학생단체는 구체적인 약속이 없다며 6일 전국 행동에 참여해 달라고 호소했다. FSU 등 교육계 노조도 공동 성명으로 파업을 포함한 행동 참여를 촉구했다.\n\n뉴시스는 대학생·학부모·교사·공무원 노조 등이 교육 개선 시위에 합류했다고 전했다. 교육 여건의 문제와 함께 청소년에 대한 경찰 대응도 우려를 불렀다. 사진은 8일 파리의 교육 연대 집회다. 6일의 전국 행동 호소와 8일의 사진은 서로 다른 날짜의 기록이다.',
  limit:'파리 사진 속 개별 참가자의 소속·참여 동기를 특정하지 않는다. 크레테유 학생들이 이곳으로 이동한 경로를 표시하는 것도 아니다.',
  refs:[[S.talks,'2일 협상 불발·6일 행동 촉구·FSU 공동 성명'],['NISX20261007_0003816672','전국 행동에 합류한 주체'],['NISX20261025_0003839953','8일 파리 사진과 교육 연대']]},
 oct17:{from:'lyon',to:'lyon',kind:'solidarity',label:'교육 연대·요구의 확대',relay:'리옹 · 2일의 교육 요구에서 17일의 연대로',
  question:'리옹의 교육 시위에<br><em>생활비 요구는 왜 함께 나왔을까</em>',
  preview:'2일 리옹에서는 고교생들의 교사·시설 개선 요구.\n17일에는 교육 시위에 연대한 생활비 항의.\n두 날짜 사이에 넓어진 참여와 요구를 따라간다.',
  title:'교육 개선에 연대하며<br><em>생활비·임금·연금 요구도</em>',
  lead:'17일 리옹, 교육 개선에 연대한 생활비 항의.\nCGT는 물가 인하·임금과 연금 인상,\n공공서비스 확충을 요구하며 전국 행동에 합류.',
  body:'2일 리옹의 고교생들은 교사 충원과 시설 개선을 요구했다. 17일 같은 도시에서는 학생들의 공교육 개선 시위에 연대해 생활비 상승에 항의하는 집회가 열렸다. 보도에서 직접 확인되는 연대 관계다.\n\n전국 행동에는 고교생·대학생·노동조합과 노란 조끼 주요 인사들도 참여했다. CGT는 물가 인하, 임금·연금 인상과 공공서비스 확충을 요구했다. 학교의 지원 요구에 교육 밖의 생활 부담을 함께 제기한 참여가 더해졌다.\n\n파리와 마르세유에서도 생활비·유가 항의가 기록됐다. 리옹에서 다른 도시로 시위대가 이동했다는 경로는 그리지 않는다. 리옹의 두 사진도 같은 사람이나 같은 촬영 지점의 전후 장면은 아니다.',
  limit:'리옹의 2일과 17일은 별도 집회다. CGT의 요구는 전국 행동의 요구이며 사진 속 개인의 요구로 단정하지 않는다.',
  refs:[['NISX20261007_0003816672','2일 리옹의 교육 개선 요구'],[S.march,'17일 리옹의 교육 연대·전국 참여 주체와 CGT 요구']]}
};
function franceTimeState(cutIndex){
 const cut=Math.max(0,Math.min(franceTimeDates.length-1,cutIndex));
 const last=new Map([['creteil',{city:'creteil',issue:'education',text:'교직원 충원 요구',source:S.origin,date:'9월',cut:-1}]]);
 for(let n=0;n<=cut;n++)for(const record of franceTimeDates[n].records)last.set(record.city,{...record,date:franceTimeDates[n].date,cut:n});
 return [...last.values()].map(record=>({...record,current:record.cut===cut}));
}
// The opening changes scale only when the reporting changes scope.
// National calls remain prose; every geographic anchor is an actual city.
function franceTimeCamera(w,h,frame={camera:'france'}){
 const views={origin:[2.455,48.79,42,38],north:[2.75,49.72,230,340],lille:[3.057,50.63,65,58],france:[2.5,46.9,600,650]};
 const view=views[frame.camera]||views.france,[cx,cy]=mapProjection.project(view[0],view[1]),top=Math.min(140,h*.23),bottom=Math.max(h*.56,h-240),usable=Math.max(h*.3,bottom-top),k=Math.max(view[2]/(w*.76),view[3]/(usable*.90));
 return{x:cx-w*k/2,y:cy-(top+usable*.5)*k,k};
}
function blendFranceTimeCameras(a,b,t,w,h){
 t=Math.max(0,Math.min(1,t));t=t*t*(3-2*t);
 const k=Math.exp(Math.log(a.k)+(Math.log(b.k)-Math.log(a.k))*t),x=(a.x+w*a.k/2)*(1-t)+(b.x+w*b.k/2)*t,y=(a.y+h*a.k/2)*(1-t)+(b.y+h*b.k/2)*t;
 return{x:x-w*k/2,y:y-h*k/2,k};
}
function createFranceTimeChapter(evidence){
 const frames=[];
 franceTimeDates.forEach((cut,cutIndex)=>{
  const connection=franceDemandConnections[cut.id];
  let body=evidence[cut.evidence].body;
  if(cut.part!==undefined)body=body.split('\n\n')[cut.part];
  if(cut.id==='oct2')body='10월 2일 리옹 고교생들은 교사 충원과 학교 시설 개선을 요구하며 행진했다.\n\n같은 날 교육장관과 학생단체의 협상은 합의 없이 끝났다. 학생단체는 구체적인 약속이 없다며 6일 전국 행동을 촉구했다. 사진은 협상장이 아닌 리옹의 고교생 행진이다.';
  const note=(cut.national?'교육 대책은 26일 발표, 재정 관련 설명은 27일 보도입니다. 배치 학교나 실제 채용 결과를 지도에 표시하지 않습니다.':cut.id==='oct8'?'사진은 10월 8일, 참여 확대를 전한 보도는 25일입니다.':cut.id==='oct31'?'사진은 10월 31일, 상세 내용은 11월1~6일 후속 보도를 포함합니다.':'날짜는 기사 등록일이 아닌 사건·사진의 날짜입니다.')+' 지도는 이 기사에 반영한 장소별 기록이며 전국 시위의 전체 분포나 계속 진행 중인 시위를 뜻하지 않습니다.';
  if(connection)body=connection.body;
  const refs=[...new Map([...cut.refs,...(connection?.refs||[])].map(pair=>[pair[0],pair])).values()];
  const frame={cutIndex,camera:cutIndex===0?'origin':cutIndex===1?'north':'france',view:'map',selected:connection?.to||(cut.photo?photos[cut.photo].city:cut.records[0]?.city),label:cut.date,title:connection?.question||cut.title,kicker:'프랑스 · '+cut.date+(connection?' / '+places[connection.from].name+'의 요구에서 '+places[connection.to].name+'의 기록으로':cut.national?' / 전국 대책':' / 그날 확인한 장소와 요구'),lead:connection?.preview||cut.lead,body,note:note+(connection?' '+connection.limit:''),refs,period:cut.period};
  frames.push(frame);
  if(connection)frames.push({...frame,camera:cutIndex===0?'north':'france',view:'connection',label:cut.date+' · 연결',title:connection.title,kicker:cut.date+' · '+connection.label,lead:connection.lead});
  if(cutIndex===0)frames.push({...frame,camera:'lille',view:'destination',label:'릴의 위치',title:'릴의 거리에서 나온<br><em>공공서비스 예산 요구</em>',kicker:'9월 29일 · 릴 / 전국 호소와 별도로 확인한 현장',lead:'크레테유에서 북쪽으로 시야를 옮기면 릴.\n이곳에서는 긴축 예산에 반대한 행진이 열렸다.\n두 도시 사이의 직접 연락 경로는 미확인.'});
  if(cut.photo)frames.push({...frame,view:'photo',photo:cut.photo,title:cut.photoTitle,kicker:photos[cut.photo].credit.replace(' · AP/뉴시스',''),lead:cut.photoLead});
 });
 return {temporal:true,scope:'프랑스',onlyCities:true,center:[2.5,46.9],width:600,height:650,cities:['creteil','lille','paris','lyon','marseille'],date:'9월~10월 31일',detail:'한 학교에서 전국 행동으로 시야를 넓히는 지도',period:1,
  title:frames[0].title,kicker:frames[0].kicker,lead:frames[0].lead,readingFrames:frames,
  menuLabel:'프랑스 · 도시마다 요구가 이어진 이유',
  body:'도시를 바꾸기 전에 그곳의 요구와 전국 행동을 연결한 기록을 확인한다. 크레테유의 충원 요구, USL의 전국 봉쇄 호소, 협상 불발 뒤 재동원, 교육계의 연대, 리옹에서 생활비 요구가 함께 나온 순서를 따라간다. 단체가 촉구한 전국 행동과 특정 도시의 현장 기록, 전문가가 분석한 확산 배경을 구분한다. 직접 전파 경로가 확인되지 않은 도시 사이에는 전파선을 그리지 않는다.',
  note:'크레테유의 발단 날짜는 보도 간 차이가 있어 9월로 표시합니다. 10월 26일은 전국 대책 발표이며 개별 학교의 이행 위치가 아닙니다. 지도에 없는 지역에 시위가 없었다는 뜻도 아닙니다.',
  refs:[...new Map(franceTimeDates.flatMap(c=>c.refs).map(pair=>[pair[0],pair])).values()]
 };
}
