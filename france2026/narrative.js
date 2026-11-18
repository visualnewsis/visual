'use strict';
const S={onlineControl:'NISX20261028_0003843939',educationPlan:'NISX20261027_0003842306',fiscalLimit:'NISX20261027_0003842988',origin:'NISX20261007_0003816508',talks:'NISX20261006_0003815506',police:'NISX20261008_0003819026',march:'NISX20261018_0003830169',claim:'NISX20261020_0003833159',control:'NISX20261019_0003832208',after:'NISX20261020_0003833414',inequality:'NISX20261014_0003825864'};
const growthSources={debt:'NISX20260929_0003807804',fiscal:'NISX20261018_0003830611'};
const photos={
 nov5Students:{city:'paris',file:'paris-nov5-students.jpg',alt:'11월5일 파리에서 교육 예산 증액을 요구하며 구호를 외치는 학생들',credit:'파리 · 2026.11.5 · AP/뉴시스',source:'NISX20261106_0003857342'},
 openSchool:{file:"open-school-ai.jpg",ai:true,alt:"열린 교문과 빈 학교 마당을 표현한 AI 상징 이미지. 실제 크레테유 학교의 모습이 아닙니다.",credit:"AI 생성 · 열린 교문의 상징 이미지 · 실제 현장 아님"},
 schoolmarch:{city:'lyon',file:'lyon-school-march-oct2.jpg',alt:'10월 2일 리옹, 학교 봉쇄 현수막을 들고 교육환경 개선을 요구하며 행진하는 고등학생들',credit:'리옹 · 2026.10.2 · AP/뉴시스',source:'NISX20261007_0003816672'},
 voltaire:{city:'paris',file:'voltaire-students-oct1.jpg',alt:'2026년 10월 1일 파리 볼테르 고교의 입구를 봉쇄하며 교육 지원 확대를 요구하는 학생들',credit:'파리 볼테르 고교 · 2026.10.1 · AP/뉴시스',source:'NISX20261007_0003816672'},
 school:{city:'paris',file:'paris-school.jpg',alt:'10월 7일 파리, 봉쇄된 학교 앞에서 교육환경 개선을 요구하며 모인 학생들',credit:'파리 · 10월 7일 · AP/뉴시스',source:S.police},
 street:{city:'lille',file:'lille-oct1-street.jpg',alt:'10월 1일 릴, 불붙은 쓰레기통 너머로 경찰과 시위대가 대치하는 거리',credit:'릴 · 10월 1일 · AP/뉴시스',source:'NISX20261002_0003812822'},
 rennes:{city:'rennes',file:'rennes-oct6.jpg',alt:'10월 6일 렌, 교육 자원 확대 요구 시위에서 물대포를 사용하는 경찰',credit:'렌 · 10월 6일 · AP/뉴시스',source:S.police},
 lyon2:{city:'lyon',file:'lyon.jpg',alt:'10월 2일 리옹, 교육환경 개선 요구 시위에서 최루탄을 피해 이동하는 학생들',credit:'리옹 · 10월 2일 · AP/뉴시스',source:S.origin},
 lyon17:{city:'lyon',file:'lyon-oct17.jpg',alt:'10월 17일 리옹, 교육 개선에 연대하고 생활비 상승에 항의하는 집회 참가자들',credit:'리옹 · 10월 17일 · AP/뉴시스',source:S.march},
 lyon24:{city:'lyon',file:'lyon-oct24.jpg',alt:'10월 24일 리옹 집회에서 프랑스 국기를 든 참가자',credit:'리옹 · 10월 24일 · AP/뉴시스',source:'NISX20261025_0003839845'},
 after:{city:'paris',file:'paris-oct18-aftermath.jpg',alt:'10월 18일 파리, 전날 집회 뒤 불에 타고 뒤집힌 차량',credit:'파리 · 10월 18일 · AP/뉴시스',source:S.after}
};
// Lens and Rennes are different cities. Injury reporting is never illustrated by
// the Rennes photograph. Lens has a record, not a fabricated incident photo.
places.lens={name:'랑스',lon:2.8333,lat:50.4333};
cityTimelines.lens=[{label:'10월 5일',date:'2026-10-05',kind:'injury',title:'15세 소년의 부상 · 진압 논란',source:S.talks}];
const lensPeriod=periods.length;periods.push({label:'10.5',date:'10월 5일',title:'랑스의 부상과 진압 논란',context:'15세 소년의 부상과 진압용 섬광탄 사용 중단을 구분해 읽습니다.',stat:'10월 6일·8일 보도',center:[2.83,50.43],width:300,height:300,primary:'lens',records:{lens:{date:'10월 5일',isCase:true,factLabel:'확인 범위',text:'랑스에서는 경찰과 충돌하는 과정에서 15세 소년이 섬광탄 폭발로 손을 잃었습니다. 10월 8일 보도는 정부가 고교생 시위 진압용 섬광탄 사용을 중단했다고 전했습니다. 정확한 발표일과 폭발의 세부 경위는 단정하지 않습니다.',who:'15세 소년의 부상',demand:'부상 경위의 세부 표현은 보도별 차이',source:S.talks,contextSource:S.police,contextLabel:'정부의 사용 중단 보도 ↗'}}});
const national={center:[2.5,46.9],width:600,height:650};
const europe={center:[8.5,46],width:1800,height:1200,cities:['paris','brussels','milan','madrid'],scope:'유럽',period:5};
const lyonFrames=[
 {date:'10월 2일',photo:'lyon2',title:'교사 충원·학교 시설 개선',body:'교사 부족과 과밀학급, 노후시설에 항의하는 고교생 시위. 사진 속 학생들은 경찰의 최루탄을 피해 이동 중입니다.',who:'고교생',demand:'교사 · 교실 · 학교 시설',period:2,source:S.origin},
 {date:'10월 17일',photo:'lyon17',title:'생활비·임금·연금으로 넓어진 요구',body:'교육환경 개선에 더해 생활비 상승에도 항의한 집회입니다. 이날 전국 행동에는 노동조합과 노란 조끼 주요 인사들도 참여했습니다.',who:'교육 개선에 연대하는 집회 참가자',demand:'교육 여건 + 생활비 · 임금 · 연금',period:4,source:S.march},
 {date:'10월 24일',photo:'lyon24',title:'10월 24일, 리옹의 주말 집회',body:'2일과 17일에 이어 24일에도 열린 리옹 집회. 이날 참가자들은 생활비 부담 완화와 공공서비스 개선을 요구했습니다.',who:'집회 참가자',demand:'생활비 · 공공서비스 개선',period:8,source:'NISX20261025_0003839845'}
];
const schoolView={center:[2.4,48.82],width:24,height:22,cities:['paris','creteil'],selected:'creteil',local:true,period:0};
const coreReport=[
 {chapter:0,date:'9월',scope:'크레테유',detail:'파리 남동쪽 · 생텍쥐페리 고교에서 시작된 요구',kicker:'1막 · 교실에서 / 2026년 프랑스',title:'교문 밖으로',body:'9월, 파리 남동쪽 크레테유의 생텍쥐페리 고교. 인력 부족에 항의하던 교직원 파업에 학생들이 합류해 학교 출입구를 막았습니다. 요구는 교직원 충원과 교육 자원 확대였습니다.',note:'지도 표식은 크레테유 시내 위치이며, 학교 건물이나 촬영 지점을 가리키지 않습니다.',...schoolView,seconds:15,turn:'',refs:[[S.origin,'생텍쥐페리 고교의 요구']]},
 {chapter:0,date:'9월 말–10월 초',scope:'프랑스',detail:'추가 인력 배치 뒤에도 이어진 다른 학교의 시위',kicker:'여러 도시의 학교 · 교사 결원과 시설 문제',title:'한 학교의 충원,<br><em>다른 학교의 인력난</em>',body:'크레테유의 파업은 추가 인력 배치 뒤 종료됐지만, 교사 결원과 과밀학급·노후시설을 둘러싼 다른 학교의 항의는 계속됐습니다. 보도에 인용된 전문가는 교육 격차와 교외의 배제를 시위의 배경으로 짚었습니다.',note:'지역별 빈곤율이나 학교 성과를 비교한 지도는 아닙니다.',...national,cities:['creteil','lille','lyon','marseille','paris'],selected:'lille',period:2,seconds:18,turn:'',refs:[[S.origin,'여러 학교로 확산'],[S.inequality,'교육 격차·교외 분석']]},
 {chapter:1,date:'10월 1–2일',scope:'릴',detail:'1일 거리의 충돌 · 2일 정부와의 협상 불발',kicker:'2막 · 거리에서 / 릴',title:'학생단체·정부 협상<br><em>합의 없이 종료</em>',body:'10월 1일 릴. 경찰과 시위대가 대치하는 거리에서 불이 났습니다. 2일 교육장관과의 협상에서 합의에 이르지 못한 학생단체는 구체적인 약속이 없다며 6일 전국 행동을 촉구했습니다.',note:'사진 촬영은 10월 1일. 교육장관과의 협상보다 하루 앞선 충돌입니다.',center:[2.7,49.8],width:300,height:210,cities:['lille','paris'],selected:'lille',photo:'street',period:2,seconds:20,turn:'',refs:[['NISX20261002_0003812822','1일 릴 현장'],[S.talks,'2일 협상 불발']]},
 {chapter:1,date:'10월 5일',scope:'랑스',detail:'15세 소년의 부상 · 진압 방식에 대한 문제 제기',kicker:'북부 랑스 · 10월 5일',title:'섬광탄에 손을 잃은<br><em>15세 소년</em>',body:'랑스에서 경찰과 충돌하던 중 15세 소년이 섬광탄 폭발로 손을 잃으면서 고교생 시위의 진압 방식이 논란에 올랐습니다. 8일 보도에 따르면 정부는 고교생 시위 진압용 섬광탄 사용을 중단했습니다.',note:'폭발의 세부 경위는 보도마다 차이가 있습니다. 사용 중단을 전한 기사는 8일자이며, 정부의 정확한 발표일은 확인되지 않았습니다.',center:[2.7,49.9],width:260,height:190,cities:['lens','lille','paris'],selected:'lens',period:lensPeriod,seconds:20,turn:'',refs:[[S.talks,'5일 랑스 부상'],[S.police,'섬광탄 사용 중단 보도']]},
 {chapter:1,date:'10월 6일',scope:'렌',detail:'전국 행동의 날 · 물대포가 등장한 현장',kicker:'서부 렌 · 10월 6일 전국 행동',title:'시위대를 향한<br><em>물대포</em>',body:'10월 6일 렌의 시위 현장. 경찰은 교육 자원 확대를 요구하는 시위대를 물대포로 해산하려 했습니다.',note:'사진은 10월 6일 렌의 현장입니다. 사진 속 장면으로 전체 시위의 양상이나 참가자의 동기를 단정하지 않습니다.',center:[-.7,48.5],width:360,height:200,cities:['rennes','paris'],selected:'rennes',photo:'rennes',period:3,seconds:18,turn:'',refs:[[S.police,'렌 현장과 정부 대응']]},
 {chapter:1,date:'10월 7일',scope:'파리',detail:'봉쇄된 학교 앞 · 계속된 교육환경 개선 요구',kicker:'파리 · 10월 7일 학교 앞',title:'파리에서도 이어진<br><em>학교 봉쇄</em>',body:'10월 7일 파리의 봉쇄된 학교 앞에서는 교육환경 개선을 요구하는 집회가 이어졌습니다. 이후 학생 시위에 대학생·학부모·교사와 노동조합까지 합류하면서 참가자의 범위도 넓어졌습니다.',note:'사진은 7일 파리의 학교 앞. 크레테유 생텍쥐페리 고교와 다른 현장입니다.',center:[2.4,48.7],width:240,height:180,cities:['paris'],selected:'paris',photo:'school',period:6,seconds:18,turn:'',refs:[[S.police,'7일 파리 학교 앞'],['NISX20261025_0003839953','참여 주체 확대']]},
 {chapter:1,date:'10월 2일 → 24일',scope:'리옹',detail:'같은 도시의 서로 다른 날짜를 비교',kicker:'리옹 · 10월 2일·17일·24일',title:'교사 충원에서<br><em>생활비·임금까지</em>',body:'스크롤을 내리면 10월 2일·17일·24일의 리옹 사진과 집회 요구를 차례로 볼 수 있습니다. 날짜를 눌러 바로 이동할 수도 있습니다.',note:'동일한 사람·촬영 지점의 전후 사진이 아닙니다.',center:[4.4,46.5],width:360,height:270,cities:['lyon','paris'],selected:'lyon',photo:'lyon2',interaction:true,period:2,seconds:25,turn:'',refs:[[S.origin,'2일 교육환경'],[S.march,'17일 생활비'],['NISX20261025_0003839845','24일 집회']]},
 {chapter:1,date:'10월 18일 사진 · 28일 후속 보도',scope:'파리',detail:'집회 뒤의 피해 · SNS·모바일 인터넷 차단 검토',kicker:'파리 · 10월 18일 피해 현장',title:'정부, 시위 앞두고<br><em>SNS 차단 검토</em>',body:'17일 집회는 대부분 평화로웠지만 일부 참가자는 투석·방화·약탈에 가담했고, 내무장관은 일부 도시의 통제 실패를 인정했습니다. 정치권에서는 좌파가 불평등을, 우파가 이민과 치안을 부각하며 원인을 달리 해석했습니다.\n\n28일 뉴시스 보도에 따르면 정부는 24일 집회를 앞두고 일부 지역의 SNS·모바일 인터넷 접속 차단을 통신사들과 논의했습니다. 정부가 내세운 이유는 약탈 대상과 경찰 위치 등이 온라인으로 공유되는 것을 막겠다는 것. 통신사들은 기술·법적 문제와 결제·긴급 통신 등의 차질을 우려했고, 실제 차단은 이뤄지지 않았습니다.',note:'사진은 집회 다음 날인 18일의 피해 현장. 정부는 극좌를 배후로 지목했으나 파리 검찰은 파리 체포자들의 극좌 성향을 확인할 수 없다고 밝혔습니다. 온라인 폭력 선동 게시물의 24시간 내 삭제를 요구하는 수정안은 27일 상원 의결 단계로 보도됐으며, 접속 차단의 실제 시행과는 별개입니다.',center:[2.4,48.7],width:240,height:180,cities:['paris'],selected:'paris',photo:'after',period:7,seconds:22,turn:'',refs:[[S.march,'평화 행진·일부 폭력'],[S.control,'정부의 통제 실패 인정'],[S.claim,'주장과 수사 확인 범위'],[S.onlineControl,'SNS 차단 검토·미실행']]},
 {chapter:2,date:'10월 26일 대책 · 27일 보도',scope:'프랑스',detail:'정부의 교육 대책과 학생단체의 반응',kicker:'3막 · 정부의 대책',title:'정부의 대책,<br><em>학생들은 "불충분"</em>',body:'정부가 내놓은 대책은 교원 확충과 학교 시설 개선, 대입제도 개편. 학생단체는 불충분하다며 시위를 이어가겠다는 입장입니다. 대학 정원의 경우 학생단체는 25만명 증원을 요구했으나 정부 계획은 2027~2028년 1만5000명입니다.',note:'대입제도 전면 교체는 2028년 목표입니다. 새 제도의 설계와 법 개정 여부는 확정되지 않았습니다.',...national,cities:['creteil','paris','lille','lens','rennes','lyon','marseille'],annotation:'response',seconds:20,turn:'',refs:[[S.educationPlan,'교육 대책·학생단체 반응']]},
 {chapter:2,date:'국가부채 · 10월 27일 재정 보도',scope:'프랑스',detail:'생활 지원 요구와 재정 지출의 제약',kicker:'프랑스 · 저성장과 국가부채',title:'지원의 약속,<br><em>재정의 한계</em>',body:'교육·생활 지원 요구가 커진 가운데 국가부채는 GDP의 119%에 달했습니다. 재무장관은 추가 지출만큼 다른 예산을 줄여야 한다는 입장을 밝혔습니다.\n\n2019년 노란 조끼 시위 때 정부가 내놓은 감세·지원책은 170억유로 규모. 27일 보도에서 재무장관은 같은 방식의 대응이 어렵다고 설명했습니다. 국채금리 상승으로 돈을 빌리는 부담도 커졌고, 과반 의석이 없는 정부는 긴축 예산안의 의회 통과에도 어려움을 겪고 있습니다.',note:'저성장과 부채는 생활·재정의 배경 지표입니다. 개별 충돌의 원인은 협상과 진압 과정 등을 함께 살펴야 합니다.',...national,cities:['creteil','paris','lille','lens','rennes','lyon','marseille'],annotation:'economy',seconds:22,turn:'',refs:[[growthSources.debt,'누적 국가 부채'],[S.fiscalLimit,'2019년 지원책과 현재의 재정 제약']]},
 {chapter:2,date:'유럽의 별도 집회',scope:'유럽',detail:'교육 예산 · 물가와 임금 · 주거비',kicker:'유럽 · 서로 다른 거리의 요구',title:'교육과 생활비,<br><em>각국의 거리에서도</em>',body:'브뤼셀에서는 교육 예산, 밀라노에서는 생활비, 마드리드에서는 주거비가 집회의 쟁점이었습니다.',note:'계기와 주최자가 서로 다른 집회입니다. 지도 이동은 시위대의 이동 경로가 아닙니다.',...europe,seconds:18,turn:'',refs:[['NISX20261022_0003836934','교육·주거비'],['NISX20261019_0003831422','물가·임금']]},
 {chapter:2,date:'다시, 출발점',scope:'크레테유',detail:'생텍쥐페리 고교의 인력 배치 · 정부 대책의 이행 여부',kicker:'다시 크레테유 · 생텍쥐페리 고교',title:'다시 열린 교문,<br><em>다른 학교는?</em>',body:'크레테유 생텍쥐페리 고교의 파업은 추가 인력 배치 뒤 끝났습니다. 다른 학교의 시위가 이어지는 가운데 정부는 교원과 시설 확충을 약속했습니다. 후속 대책은 발표 단계로, 실제 충원·개선 여부는 아직 확인되지 않았습니다.',note:'"시위는 우리의 요구에 대한 답을 얻을 때 비로소 끝날 것." — 10월 24일 집회의 익명 10대 참가자',...schoolView,seconds:22,turn:'',refs:[[S.origin,'생텍쥐페리 고교의 인력 배치'],['NISX20261025_0003840125','10대 참가자의 말'],[S.educationPlan,'정부의 후속 약속']]}
];
const parisSchoolPeriod=periods.length;periods.push({label:'10.7',date:'10월 7일',title:'파리의 학교 앞에 남은 요구',context:'교육환경 개선을 요구한 고등학생들이 봉쇄된 학교 앞에 모였습니다.',stat:'AP 사진 촬영일 10월 7일 · 뉴시스 8일 보도',center:[2.352,48.857],width:500,height:450,primary:'paris',records:{paris:{date:'10월 7일',text:'봉쇄된 파리 학교 앞에서 고교생들이\n교육 여건 개선을 요구하며 구호를 외쳤습니다.',who:'고교생',demand:'교육환경 개선',source:S.police}}});
const report=[
 {...coreReport[0],chapter:-1,cover:true,photo:'voltaire',date:'10월 1일',scope:'파리 · 볼테르 고교',kicker:'2026년 가을 · 프랑스 학생 시위',title:'교문 밖으로',body:'교사 충원을 요구하며 교문을 막은 학생들. 학교에서 시작한 시위는 전국으로 번졌고, 일부 현장에서는 방화와 약탈까지 벌어졌습니다. 9월 크레테유의 학교 봉쇄부터 10월 정부의 교육 대책까지, 주요 현장과 기록을 따라갑니다.',note:'첫 사진은 10월 1일 파리 볼테르 고교의 입구 봉쇄 현장입니다. 크레테유의 발단 학교와는 다른 곳입니다.',turn:'',refs:[['NISX20261007_0003816672','볼테르 고교의 봉쇄 보도']]},
 {...coreReport[0],photo:'schoolmarch',selected:'lyon',period:2,actStart:true,kicker:'1막 · 교실에서',title:'교사 충원 요구하며<br><em>행진하는 고교생들</em>',date:'10월 2일',scope:'리옹',body:'10월 2일 리옹의 고교생 행진. 학생들은 학교 봉쇄 현수막을 들고 교사 충원과 과밀학급·노후시설 개선을 요구했습니다.',note:'사진은 리옹의 행진입니다. 첫 화면의 파리 볼테르 고교와 다른 현장이며, 같은 학생들의 이동 장면이 아닙니다.',turn:'',refs:[['NISX20261007_0003816672','리옹 고교생들의 행진'],[S.origin,'학교에 쌓인 요구']]},
 {...coreReport[0],kicker:'교문 밖으로 · 9월의 크레테유',title:'교직원 파업에<br><em>학생들의 교문 봉쇄</em>',turn:''},
 coreReport[1],
 {...coreReport[2],actStart:true,kicker:'2막 · 거리에서 / 릴'},
 coreReport[3],coreReport[4],{...coreReport[5],period:parisSchoolPeriod},coreReport[6],coreReport[7],
 {...coreReport[8],actStart:true},coreReport[9],coreReport[10],{...coreReport[11],photo:"openSchool",kicker:"10월 28일 기준 · 후속 보도에서 확인할 내용",title:"다시 학교로,<br><em>질문은 한국에도</em>",body:"크레테유 생텍쥐페리 고교의 교문은 추가 인력 배치 뒤 다시 열렸습니다. 다른 학교에 약속한 변화도 교실까지 닿을지는 지켜봐야 합니다.\n\n오늘의 생활을 지키는 지원과 다음 세대를 위한 투자. 둘을 함께 이어갈 방법은 무엇일까요. 프랑스의 거리에서 시작된 질문을 한국에서도 생각해 볼 때입니다.",note:"",refs:[[S.origin,"생텍쥐페리 고교의 인력 배치"],[S.educationPlan,"교육 대책·학생단체 반응"],[S.fiscalLimit,"지원 요구와 재정의 제약"]]}
];
// Reporting-led revision: location, funding and verified outcomes.
Object.assign(report[2],{"kicker": "파리 남동쪽 크레테유 · 시위의 발단", "title": "교직원 부족에 항의한<br><em>크레테유 고교</em>", "body": "파리 남동쪽 교외 크레테유의 생텍쥐페리 고교. 교직원 부족에 항의한 파업에 학생들이 합류해 출입구를 막았습니다. 학생들이 요구한 것은 학교 인력과 교육 자원의 확충이었습니다.\n\n뉴시스가 소개한 김지윤 박사의 분석은 교사 결원에 따른 수업 차질과 낡은 시설, 교외의 교육 격차를 배경으로 짚었습니다.", "note": "학교의 인력 부족은 보도된 발단이며, 교외의 구조적 배제는 전문가의 분석입니다. 지도 표식은 도시 위치로 학교 건물을 가리키지 않습니다."});
Object.assign(report[3],{"kicker": "크레테유에서 릴·리옹·마르세유로", "title": "릴·리옹·마르세유로<br><em>번진 학교 시위</em>", "body": "크레테유의 파업은 추가 인력 배치 뒤 끝났습니다. 그러나 다른 학교에서도 교사 부족과 과밀학급, 시설 문제를 제기하며 항의가 이어졌습니다. 한 학교에 인력을 보내는 조치로 여러 학교의 요구까지 해결된 것은 아니었습니다.\n\n지도는 북부 릴과 동남부 리옹, 남부 마르세유 등 보도에 등장한 현장을 보여줍니다. 각 도시의 빈곤 수준이나 시위 강도를 비교하는 지도는 아닙니다."});
Object.assign(report[10],{"title": "교원 감축 철회하고<br><em>시설 개선 지원 약속</em>", "body": "교사 부족과 과밀학급, 낡은 시설에 대한 요구에 정부는 26일 교육 대책을 발표했습니다. 교원 감축 계획 철회와 일자리 500개 추가, 일부 고교 학급의 학생 수 28명 이하 제한을 약속했습니다.\n\n학교 개보수에는 지방자치단체 대상 최대 40억유로의 저리 대출을 제시했습니다. 무상 지원이 아니라 상환을 전제로 한 대출입니다. 학생단체는 대책이 요구에 못 미친다며 시위를 계속하겠다고 밝혔습니다.", "note": "발표된 계획이며 실제 채용·시설 개선 완료를 뜻하지 않습니다. 대학 정원 요구와 정부 계획은 설명 아래 비교에 제시했습니다."});
Object.assign(report[11],{"kicker": "프랑스 · 교육 대책과 예산", "title": "추가 지출만큼<br><em>다른 예산 줄이겠다는 정부</em>", "body": "교원 충원과 시설 개선을 실행하려면 재원이 필요합니다. 27일 보도에서 재무장관은 추가 지출을 늘릴 경우 그만큼 다른 예산을 절감해야 한다는 입장을 밝혔습니다. 교원과 시설을 늘릴 예산을 확보하려면 다른 지출의 조정도 필요하다는 정부 입장입니다.\n\n국가부채는 2026년 2분기 GDP의 119%에 달했습니다. 정부는 국채 차입 비용과 예산안 처리에도 부담을 안고 있습니다. 부채 수치가 각 지역 시위의 원인을 설명하는 것은 아닙니다. 여기서는 정부가 약속을 이행할 때 마주하는 재정 여건으로 읽습니다."});
Object.assign(report[12],{"kicker": "크레테유 · 생텍쥐페리 고교", "title": "추가 인력 배치 뒤<br><em>생텍쥐페리 고교 파업 종료</em>", "body": "생텍쥐페리 고교에는 추가 인력이 배치됐고 파업이 종료됐습니다.\n\n다른 학교를 향한 교원 확충과 시설 개선은 정부가 발표한 계획입니다. 전국 대책이 각 학교에서 얼마나 시행됐는지는 아직 확인되지 않았습니다.", "note": "10월 28일까지 이 기사에 반영한 보도 기준입니다. 추가 인력의 정확한 규모와 다른 학교의 개선 완료 여부는 확인되지 않았습니다.", "date": "10월 28일 기준 · 보도로 확인한 변화", "scope": "크레테유", "detail": "추가 인력 배치 → 생텍쥐페리 고교의 파업 종료"});
Object.assign(report[13],{"kicker": "10월 28일 기준 · 후속 보도에서 확인할 내용", "title": "학교 개선 대책,<br><em>성과는 아직 미확인</em>", "body": "크레테유 생텍쥐페리 고교에서는 추가 인력 배치 뒤 파업이 끝났습니다. 정부는 전국의 교원과 학교 시설을 확충하겠다고 약속했습니다.\n\n그러나 약속한 교사가 배치됐는지, 과밀학급이 줄었는지, 시설 보수가 끝났는지는 더 확인해야 합니다. 이 기사에 반영한 보도만으로는 전국 학교의 개선 정도를 확인하기 어렵습니다.", "note": "10월 28일 기준, 이 기사에 반영한 보도에서 전국 대책의 이행 결과는 확인되지 않았습니다. 배경은 실제 학교가 아닌 AI 상징 이미지입니다."});
Object.assign(report[12],schoolView,{refs:[[S.origin,"생텍쥐페리 고교의 변화"],[S.educationPlan,"전국 대책의 발표"]]});
report[2].refs=[[S.origin,"학교의 발단"],[S.inequality,"교육 격차에 대한 분석"]];
report[13].refs=[[S.origin,"인력 배치와 파업 종료"],[S.educationPlan,"정부의 후속 약속"]];

// Separate the local outcome, announced measures, and follow-up questions.
report[12].body='크레테유 생텍쥐페리 고교에서는 교직원 부족에 항의한 파업에 학생들이 합류했습니다. 정부가 추가 인력을 배치한 뒤 이 학교의 파업은 종료됐습니다. 추가 인력의 정확한 규모와 직종은 이 기사에 반영한 보도에 제시되지 않았습니다.';
report[12].refs=[[S.origin,'추가 인력 배치와 파업 종료']];
report[13].title='교원·시설 확충,<br><em>학교별 이행 확인이 필요</em>';
report[13].body='정부 대책의 이행 여부를 확인하려면 실제 채용·배치 인원, 학급별 학생 수, 학교별 보수 진행 현황이 필요합니다. 10월 28일까지 이 기사에서 확인한 보도에는 이를 전국적으로 비교할 실적이 제시되지 않았습니다.\n\n후속 보도에서는 채용 발표와 실제 배치, 대출 지원과 보수 완료를 구분해 확인해야 합니다. 학생단체는 일부 양보를 인정하면서도 요구에 미치지 못한다며 시위를 이어가겠다고 밝혔습니다.';
report[13].refs=[[S.educationPlan,'교육 대책과 학생단체 반응']];
report.splice(13,0,{chapter:2,comparison:true,kicker:'10월 26일 발표 · 27일 뉴시스 보도',title:'학생들의 요구와<br><em>정부 대책을 비교하면</em>',body:'학생들은 교원 충원과 과밀학급 해소, 시설 개선을 요구했습니다. 정부는 중등교육 교원 감축 계획 철회와 일자리 500개 추가, 일부 고교 학급의 학생 수 28명 이하 제한을 약속했습니다. 학교 개보수는 지방자치단체 대상 최대 40억유로 저리 대출로 지원할 계획입니다.\n\n대학 정원은 학생단체가 25만명 증원을 요구한 데 비해 정부는 2027~2028년 1만5000명 증원을 제시했습니다. 학생단체는 일부 양보를 환영하면서도 시위를 계속하겠다고 밝혔습니다.',note:'수치는 정부가 발표한 계획으로, 집행 실적이 아닙니다. 28명 이하 제한은 일부 고교 학급에 해당합니다. 대출은 무상 지원과 다릅니다.',refs:[[S.educationPlan,'정부 발표·학생단체 요구']],seconds:25});


const koreaSource='NISX20260907_0003779374';
Object.assign(places,{gyeonggi:{name:'경기 52.41%',lon:127.3,lat:37.65},incheon:{name:'인천 49.78%',lon:126.705,lat:37.456}});
for(const id of ['brussels','milan','madrid']){const r=europeRecords[id];photos[id]={city:id,file:r.photo,alt:r.alt,credit:r.caption,source:r.source};}
photos.lillePlacard={city:'lille',file:'lille.jpg',alt:'교육 지원 확대를 요구하는 팻말을 든 릴의 학생',credit:'릴 · 2026.10.1 · AP/뉴시스',source:S.origin};
photos.parisMarch={city:'paris',file:'paris-oct17.jpg',alt:'파리의 생활비 상승 반대 집회 참가자',credit:'파리 · 2026.10.17 · AP/뉴시스',source:S.march};
const oldReport=report.slice();
const creteil={...oldReport[2],body:oldReport[2].body+'\n\n이 학교의 파업은 추가 인력 배치 뒤 끝났습니다. 하지만 다른 학교에서는 교사 부족과 시설 문제를 둘러싼 항의가 이어졌습니다.',lead:'교직원 부족에 항의한 파업에 학생들이 합류했습니다.\n이 학교의 파업은 추가 인력 배치 뒤 끝났지만,\n다른 학교에서도 비슷한 요구가 이어졌습니다.'};
const paris={...oldReport[7],title:'학교 앞 봉쇄에서<br><em>생활비 항의 집회까지</em>',kicker:'파리 · 10월 7일·17일·18일',gallery:['school','parisMarch','after'],lead:'교육환경 개선 요구에 생활비 항의가 더해졌습니다.\n17일 집회는 대부분 평화로웠지만 일부 폭력도 벌어졌습니다.',body:oldReport[7].body+'\n\n'+oldReport[9].body,note:'사진은 각각 7일 학교 앞, 17일 집회, 18일 피해 현장입니다. 서로 다른 날짜의 기록이며 연속 촬영이 아닙니다.',refs:[...oldReport[7].refs,...oldReport[9].refs]};
const lille={...oldReport[4],photo:'lillePlacard',gallery:['lillePlacard','street'],title:'교육 지원 요구한 학생들<br><em>릴 거리에서 경찰과 대치</em>',lead:'10월 1일 릴의 학생들은 교육 지원 확대를 요구했습니다.\n거리에서는 경찰과의 대치도 벌어졌습니다.\n이튿날 정부와 학생단체 협상은 합의 없이 끝났습니다.'};
const eu={...coreReport[10],scope:'유럽',local:false,kicker:'프랑스에서 유럽으로 · 2026년 10월',title:'브뤼셀의 교육 예산,<br><em>밀라노의 생활비</em>',center:[3,46],width:1500,height:1500,cities:['brussels','milan','madrid'],onlyCities:true,selected:'brussels',period:5,lead:'브뤼셀은 교육 개혁과 예산 삭감, 밀라노는 생활비,\n마드리드는 주거비가 집회의 쟁점이었습니다.\n계기와 주최자가 서로 다른 집회입니다.',body:'프랑스 밖에서도 교육과 생활 여건에 대한 항의가 이어졌습니다. 브뤼셀의 학생·교사는 교육 개혁과 예산 삭감에, 밀라노의 시위대는 생활비 상승에 항의했습니다. 마드리드에서는 세입자 보호를 요구하는 텐트 농성이 열렸습니다. 세 도시의 집회를 같은 조직이나 동일한 원인의 운동으로 묶을 수는 없습니다.',refs:[['NISX20261022_0003836934','브뤼셀 교육 예산'],['NISX20261019_0003831422','밀라노 생활비'],['NISX20261023_0003838663','마드리드 주거비']]};
const euScenes=['brussels','milan','madrid'].map((id,n)=>{const r=europeRecords[id];return {...eu,photo:id,selected:id,scope:places[id].name,date:r.date,kicker:places[id].country+' · '+places[id].name+' · '+r.date,title:['교육 예산 삭감에<br><em>반대하는 학생과 교사들</em>','물가·저임금에 항의한<br><em>밀라노의 집회</em>','주거비 부담에<br><em>광장에 텐트 친 시민들</em>'][n],lead:r.text,body:r.text+' '+(r.background||'')+(r.followup?'\n\n'+r.followup:''),note:'사진의 촬영 날짜를 기준으로 표시했습니다. 프랑스 집회의 이동 경로나 동일한 주최 단체를 뜻하지 않습니다.',refs:[[r.source,'현장과 요구'],...(r.followSource?[[r.followSource,'후속 집회 보도']]:[])]}});
const korea={...national,chapter:3,scope:'한국',korea:true,onlyCities:true,cities:['gyeonggi','incheon'],center:[127.5,36.6],width:350,height:450,date:'2026년 교육부 자료 · 9월 8일 뉴시스 보도',kicker:'한국 · 중학교 과밀학급',title:'한국 중학교 학급의<br><em>35.13%가 과밀</em>',lead:'전국 중학교 과밀학급 비율은 35.13%.\n경기는 52.41%, 인천은 49.78%로 더 높았습니다.\n교육 여건의 지역 차이는 한국에서도 확인됩니다.',body:'뉴시스가 고민정 의원실이 확보한 교육부 자료를 인용한 보도에 따르면 2026년 중학교 과밀학급 비율은 전국 35.13%, 경기 52.41%, 인천 49.78%였습니다. 기사에서 과밀학급은 학생 수 28명 이상인 학급입니다.\n\n이는 한국의 교육 여건을 보여주는 별도의 통계입니다. 프랑스 시위의 원인과 같다는 뜻이나 한국에서 같은 시위가 발생했다는 의미는 아닙니다.',detail:'중학교 과밀학급 비율 · 점은 지역 대표 위치',note:'지역 전체를 색칠한 행정구역 통계 지도가 아닙니다. 프랑스의 일부 고교 28명 이하 계획과 학교급·기준이 달라 직접 비교하지 않습니다.',refs:[[koreaSource,'교육부 자료를 인용한 뉴시스 보도']],seconds:22};
const ending={...korea,comparison:true,koreaSummary:true,kicker:'한국 · 전국 수치와 지역별 차이',title:'과밀학급은 줄었지만<br><em>지역별 차이는 여전</em>',lead:'전국 초·중·고 과밀학급 비율은 전년보다 낮아졌습니다.\n하지만 중학교는 경기·인천 등에서 전국 평균을 웃돌았습니다.',body:'2026년 전국 초·중·고 과밀학급 비율은 15.16%로 전년 20.03%보다 낮아졌습니다. 다만 중학교만 보면 전국 35.13%, 경기 52.41%, 인천 49.78%로 지역별 차이가 나타납니다.\n\n프랑스와 한국은 제도와 상황이 다릅니다. 학교에 필요한 인력과 공간이 어디에 부족한지는 전국 평균뿐 아니라 지역별 여건으로도 살펴볼 문제입니다.',note:korea.note};
// Keep one Lyon sequence; add the distinct school-march photograph to that sequence.
lyonFrames.unshift({date:'10월 2일 · 행진',photo:'schoolmarch',title:'교원·시설 확충을 요구한 행진',body:'학교 봉쇄 현수막을 든 리옹 고교생들의 행진입니다.',who:'고교생',demand:'교사 충원 · 학교 시설 개선',period:2,source:'NISX20261007_0003816672'});
report.splice(0,report.length,oldReport[0],creteil,paris,oldReport[3],lille,oldReport[5],oldReport[6],oldReport[8],oldReport[10],oldReport[11],oldReport[13],eu,...euScenes,korea,ending);
report.find(b=>b.interaction).lead=lyonFrames[0].body;
report[0].title='佛만의 불만은 아니다';
report[0].body='프랑스 학교의 인력 부족에서 시작해 유럽의 교육·생활비·주거비 요구를 살펴봅니다. 마지막에는 한국의 과밀학급 통계로 교육 여건의 지역 차이를 짚습니다. 나라마다 집회의 계기와 제도는 다릅니다.';

cityTimelines.paris.unshift({label:'10월 1일',date:'2026-10-01',kind:'protest',title:'볼테르 고교 입구 봉쇄',source:'NISX20261007_0003816672'});
periods[2].records.paris={date:'10월 1일',text:'파리 볼테르 고교의 학생들이 학교에 더 많은 지원을 요구하며 입구를 봉쇄했습니다.',who:'볼테르 고교 학생들',demand:'교육 지원 확대',source:'NISX20261007_0003816672'};
const lilleBudget=periods.flatMap(p=>Object.values(p.records||{})).find(r=>r.photo==='lille-sept29.jpg');
photos.lilleBudget={city:'lille',file:lilleBudget.photo,alt:lilleBudget.text,credit:lilleBudget.caption,source:lilleBudget.source};
lille.gallery=['lilleBudget','lillePlacard','street'];
lille.photo='lilleBudget';
lille.kicker='릴 · 9월 29일·10월 1일';
const parisSupport=periods.flatMap(p=>Object.values(p.records||{})).find(r=>r.photo==='paris-oct8.jpg');
photos.parisSupport={city:'paris',file:parisSupport.photo,alt:parisSupport.text,credit:parisSupport.caption,source:parisSupport.source};
paris.gallery=['school','parisSupport','parisMarch','after'];
paris.kicker='파리 · 10월 7일·8일·17일·18일';
paris.note='학교 앞 집회, 연대 집회, 도심 행진과 다음 날의 피해 현장을 날짜순으로 묶었습니다. 연속 촬영이 아닙니다.';
// Group each city once before widening the map to Europe and Korea.
const fallbackLeads = {
  3:'크레테유에는 추가 인력이 배치됐지만,\n다른 학교의 교사 부족과 과밀학급,\n낡은 시설을 둘러싼 항의는 계속됐습니다.',
  5:'랑스에서 15세 소년이 섬광탄에 손을 잃으며\n경찰의 진압 방식도 논란에 올랐습니다.',
  6:'교육 자원 확충을 요구한 렌의 시위.\n경찰은 물대포로 해산을 시도했습니다.',
  8:'교원 감축 철회와 일자리 500개 추가 약속.\n학교 개보수에는 지자체 대상 저리 대출을 제시했습니다.\n학생단체는 대책이 부족하다고 평가했습니다.',
  9:'교사와 시설을 늘리려면 재원이 필요합니다.\n재무장관은 더 쓰는 만큼 다른 예산을\n줄여야 한다는 입장입니다.',
  10:'학생단체는 일부 양보를 인정하면서도\n시위를 계속하겠다고 밝혔습니다.'
};
Object.entries(fallbackLeads).forEach(([i,text])=>{if(!report[i].lead)report[i].lead=text});
report[2]=paris;report[4]=lille;
const groupedReport=report.slice();
report.splice(0,report.length,...[0,1,3,4,5,6,7,2,8,9,10,11,12,13,14,15,16].map(i=>groupedReport[i]));
report[0].title='佛만의 문제라기엔<br>낯익은 교실';
report[0].body='교사 충원을 요구하던 학생들, 왜 거리로 나섰나';
report[16].title='프랑스에서 마주한 질문,<br><em>한국의 교실에도</em>';
report[16].lead='한국도 과밀학급과 교육 여건의 지역 차이를 안고 있습니다.\n학생 수의 변화가 각 교실의 여건 개선으로 이어지는지,\n우리 학교에서도 살펴야 할 문제입니다.';
report[16].body+='\n\n프랑스의 시위를 한국의 미래라고 단정할 수는 없습니다. 다만 교실에 필요한 공간과 인력이 충분한지, 개선이 필요한 지역에 지원이 닿는지는 한국에서도 확인해야 할 질문입니다.';
report.splice(15,0,{...eu,chapter:3,selected:undefined,kicker:'유럽에서 한국으로 · 학교에 필요한 지원',title:'거리의 요구를 따라,<br><em>우리 교실로</em>',lead:'프랑스의 교사·시설 요구, 브뤼셀의 교육 예산 논쟁.\n한국의 중학교에도 과밀학급이 남아 있습니다.\n학교에 필요한 공간이 충분한지, 지역별로 살펴봅니다.',body:'프랑스와 주변 유럽 도시에서 살펴본 집회는 계기와 요구가 서로 달랐습니다. 교육 여건을 개선해 달라는 목소리와 생활비·주거비 부담을 낮춰 달라는 요구를 같은 사건으로 묶을 수는 없습니다.\n\n한국으로 시선을 옮기면 무엇이 보일까요. 뉴시스가 보도한 교육부 자료로 한국 중학교의 과밀학급 비율과 지역별 차이를 살펴봅니다. 시위의 양상을 비교하기보다 학교의 여건이라는 질문을 이어갑니다.',refs:[[koreaSource,'한국 과밀학급 현황']],seconds:18});
// Attribute the Korea connection to the reported ministerial diagnosis.
const labourSource='NISX20261029_0003847029';
places.koreaContext={name:'한국 · 노동과 복지',lon:127.5,lat:36.6};
Object.assign(report[15],{kicker:'유럽에서 한국으로 · 교육을 넘어 노동과 복지로',title:'교실에서 시작된 요구,<br><em>삶을 받치는 제도의 문제로</em>',lead:'유럽의 거리에서는 교육·생활비·주거비 요구를 살펴봤습니다.\n한국에서도 노동과 복지 제도가 변화를 따라가는지\n묻는 목소리가 나왔습니다.',body:'프랑스 학생들의 교육환경 개선 요구와 각국의 생활비·주거비 집회는 서로 다른 사건입니다. 한국의 상황을 그대로 대입할 수는 없습니다.\n\n29일 김영훈 고용노동부 장관은 프랑스의 연금개혁 갈등과 노동·복지제도의 위기를 언급하며 한국 역시 비슷한 도전에 직면했다고 진단했습니다. 다음 장에서는 이 발언을 통해 한국의 노동과 복지 문제로 시선을 옮깁니다.',refs:[[labourSource,'노동장관의 한국 진단']],note:'노동장관의 정책 진단입니다. 이번 학생 시위의 원인이나 한국과의 동일성을 입증하는 자료는 아닙니다.'});
Object.assign(report[16],{cities:['koreaContext'],selected:'koreaContext',kicker:'한국 · 10월 29일 노동장관의 진단',title:'달라지는 일자리,<br><em>제도 밖의 노동자들</em>',lead:'김영훈 노동장관은 프랑스의 노동·복지 위기를 언급하며\n한국도 비슷한 도전에 직면했다고 진단했습니다.\n기존 고용관계 밖 노동자를 위한 제도가 필요하다는 설명입니다.',body:'김영훈 고용노동부 장관은 29일 한국노동사회포럼에서 프랑스의 연금개혁 갈등을 사례로 들었습니다. 그는 기술 변화와 고용 형태의 다양화 속에서 전통적인 고용관계를 전제로 한 노동·복지제도가 한계에 직면했다고 진단했습니다.\n\n장관은 특수고용·플랫폼 노동자의 복지를 지원하고 이들의 요구를 전달할 기구로 가칭 K-노동복지회의소를 제안했습니다. 이는 정책 제안이며, 이미 시행된 제도나 효과가 확인된 대책은 아닙니다.\n\n한국 과밀학급 통계는 교육 여건을 보여주는 별도 자료로 남깁니다. 그 수치만으로 프랑스 학생 시위와 한국의 상황을 같은 원인으로 설명할 수는 없습니다.',detail:'노동·복지제도 변화에 대한 정책 진단',refs:[[labourSource,'노동·복지제도에 대한 장관 발언'],[koreaSource,'별도 참고 · 한국 과밀학급 현황']],note:'프랑스 연금 갈등을 언급한 장관의 진단과 이번 학생 시위의 발생 경위를 구분합니다.'});
Object.assign(report[17],{comparison:true,koreaSummary:false,closing:true,kicker:'프랑스의 거리에서, 한국에 남는 질문',title:'요구가 나온 뒤,<br><em>삶은 무엇이 달라지는가</em>',lead:'프랑스 학생들은 교사와 교실을 요구했습니다.\n한국에서는 새로운 고용 형태에 맞는 보호가 논의됩니다.\n서로 다른 현장의 요구에 제도가 어떻게 답할지가 남습니다.',body:'프랑스의 학생 시위는 교사 부족과 열악한 학교 환경에서 출발했습니다. 한국 노동장관이 제기한 문제는 변화하는 고용 형태 속에서 기존 노동·복지제도의 보호를 받기 어려운 노동자들입니다. 두 나라가 같은 상황이라는 결론은 아닙니다.\n\n학교에 필요한 인력이 실제로 배치되는지, 제도 밖 노동자에게 보호와 의견을 전달할 통로가 마련되는지. 발표된 대책이 현장에서 무엇을 바꾸는지 살피는 일이 남습니다.',refs:[[S.educationPlan,'프랑스 교육 대책'],[labourSource,'한국 노동·복지 논의']],note:'정책 발표와 제안은 이행 결과와 구분합니다.'});
// National context does not identify a local incident: no representative pin.
Object.assign(report[16],{cities:[],selected:undefined,detail:'대한민국 · 노동과 복지제도에 대한 논의'});
Object.assign(report[17],{comparison:false,korea:false,koreaSummary:false,photo:'openSchool',closing:true,kicker:'다시, 학교로',title:'교문이 열린 뒤,<br><em>확인해야 할 변화</em>',lead:'프랑스에서는 약속한 교사가 교실에 닿는지.\n한국에서는 제도 밖 노동자의 보호가 마련되는지.\n발표 이후, 현장에서 달라지는 삶을 살펴야 합니다.',body:'크레테유 생텍쥐페리 고교의 파업은 추가 인력 배치 뒤 끝났습니다. 그러나 한 학교의 변화가 전국 학교의 개선을 뜻하지는 않습니다. 약속한 교사의 배치와 시설 보수가 실제로 이뤄지는지 확인해야 합니다.\n\n한국에서는 기존 고용관계 밖 노동자들의 복지와 의견을 전달할 제도가 논의됩니다. 프랑스의 교실과 같은 문제는 아니지만, 발표된 대책이 현장의 삶을 어떻게 바꾸는지 살펴야 한다는 질문은 남습니다.',note:'열린 교문은 AI로 생성한 상징 이미지입니다. 실제 크레테유 학교나 정책 이행 결과를 촬영한 사진이 아닙니다.',refs:[[S.origin,'추가 인력 배치와 파업 종료'],[S.educationPlan,'프랑스 교육 대책'],[labourSource,'한국 노동·복지 논의']]});
// One Korea chapter: world-camera approach and the Korean reporting share one stop.
report[16].kicker='유럽에서 한국으로 · 10월 29일 노동장관의 진단';
report[16].body='유럽의 교육·생활비·주거비 집회와 한국의 상황을 같은 사건으로 묶을 수는 없습니다. 다만 한국에서도 노동과 복지 제도가 변화를 따라가는지에 대한 논의가 나왔습니다.\n\n'+report[16].body;
report.splice(15,1);
for(const id of ['brussels','milan','madrid']){photos[id].credit=places[id].country+' · '+photos[id].credit;}
report[15].readingFrames=[{"label": "한국에 남는 질문", "title": "달라지는 일자리,<br><em>따라가지 못한 제도</em>", "lead": "프랑스의 교실에서 시작한 이야기는\n교육과 생활을 뒷받침할 제도의 문제로 이어졌습니다.\n\n10월 29일 김영훈 노동장관은 프랑스의 연금 갈등과\n노동·복지 위기를 언급하며, 한국도 기술 변화 속에\n비슷한 도전에 직면했다고 진단했습니다."}, {"label": "누가 보호받는가", "title": "고용 형태는 다양해지고,<br><em>보호의 틀은 그대로</em>", "lead": "장관이 짚은 대상은 특수고용·플랫폼 노동자 등\n전통적인 고용관계 밖에서 일하는 사람들.\n\nAI 등 기술 변화로 일하는 방식이 달라지는데,\n기존 고용관계를 바탕으로 만든 노동·복지제도가\n이를 따라가지 못한다는 설명입니다."}, {"label": "어떤 대책이 필요한가", "title": "복지 지원에서<br><em>목소리를 낼 통로까지</em>", "lead": "제안된 대안은 가칭 'K-노동복지회의소'.\n특수고용·플랫폼 노동자의 복지를 지원하고\n이들의 요구를 사회에 전달하자는 구상입니다.\n\n아직 제안 단계입니다. 프랑스의 교사 충원 약속처럼,\n한국에서도 논의가 현장의 변화로 이어질지 남았습니다."}];
Object.assign(report[15],{title:report[15].readingFrames[0].title,lead:report[15].readingFrames[0].lead,seconds:45});

// Editorial spine: unresolved demands, policing, then wider participation.
// Dates are evidence order, never an asserted single cause of every clash.
const beforeEscalation=report.slice();
Object.assign(beforeEscalation[0],{body:'교사 충원 요구에서 협상 결렬, 진압 논란, 시민들의 연대까지. 무엇이 시위의 쟁점을 바꿨는지 주요 기록을 따라갑니다.'});
Object.assign(beforeEscalation[2],{kicker:'1막 · 교실의 요구',title:'한 학교의 충원,<br><em>남아 있는 다른 교실</em>',lead:'크레테유의 파업은 추가 인력 배치 뒤 종료.\n다른 학교에서는 교사 결원과 낡은 시설에 대한\n항의가 이어졌습니다.'});
Object.assign(beforeEscalation[3],{photo:'lillePlacard',gallery:['lillePlacard','street'],kicker:'10월 1일 · 협상 전날의 릴',title:'교육 지원을 요구한 거리,<br><em>이미 벌어진 충돌</em>',lead:'교육 지원을 요구한 팻말과 경찰과의 대치.\n같은 날 릴의 서로 다른 현장입니다.',note:'10월 1일 촬영. 다음 날 협상 결렬의 결과로 벌어진 충돌이 아닙니다.'});
const talksScene={...national,chapter:1,scope:'프랑스',date:'10월 2일',cities:[],onlyCities:true,pivot:'협상',kicker:'2막 · 첫 번째 전환 / 10월 2일 협상',title:'대화는 열렸지만,<br><em>합의는 없었다</em>',lead:'학생단체와 교육장관의 협상은 합의 없이 종료.\n학생단체는 구체적인 약속이 없다며\n10월 6일 전국 행동을 촉구했습니다.',body:'10월 2일 학생단체와 교육장관은 합의점을 찾지 못했습니다. 학생단체는 구체적인 개선 약속이 없다고 비판하며 6일 전국 행동을 촉구했습니다.\n\n교원 충원과 시설 개선 요구는 해결되지 않은 채 남았습니다. 협상 이전에도 충돌이 있었으므로 결렬을 모든 폭력의 시작으로 볼 수는 없습니다.',note:'전국 단위의 협상과 행동 예고를 설명하는 지도입니다. 회담 장소나 시위대 이동 경로를 표시하지 않습니다.',detail:'협상 결과와 학생단체의 후속 행동',refs:[[S.talks,'협상 결과·전국 행동 촉구']],seconds:30,readingFrames:[
 {label:'협상 결과',kicker:'첫 번째 전환 · 10월 2일',title:'대화는 열렸지만,<br><em>합의는 없었다</em>',lead:'학생단체와 교육장관의 협상은 합의 없이 종료.\n학생단체는 구체적인 약속이 없다며\n10월 6일 전국 행동을 촉구했습니다.'},
 {label:'남은 요구',kicker:'협상 이후 · 해결되지 않은 교육 요구',title:'다시 거리로 가져간<br><em>교사와 교실의 문제</em>',lead:'교원 충원, 과밀학급 해소, 노후시설 개선.\n학생단체가 요구한 교육 여건의 변화는\n합의에 담기지 못했습니다.\n\n해결되지 않은 교육 요구는\n이후 집회에서도 계속됐습니다.'}
]};
Object.assign(beforeEscalation[4],{pivot:'진압',onlyCities:true,cities:['lens','lille'],kicker:'두 번째 전환 · 10월 5일 랑스',title:'교실의 요구에 겹친<br><em>진압 방식의 논란</em>',lead:'랑스에서 경찰과 충돌하던 15세 소년이\n섬광탄 폭발로 손을 잃었습니다.\n학생 시위를 어떻게 진압했는지도 쟁점으로.',readingFrames:[
 {label:'10월 5일 · 부상',kicker:'두 번째 전환 · 북부 랑스',title:'15세 소년의 부상,<br><em>진압을 둘러싼 질문</em>',lead:'랑스에서 경찰과 충돌하던 15세 소년이\n섬광탄 폭발로 손을 잃었습니다.\n교육 요구에 진압 방식의 논란이 겹쳤습니다.'},
 {label:'논쟁과 정부 대응',kicker:'부상 이후 · 10월 6일·8일 뉴시스 보도',title:'과도한 물리력인가,<br><em>비례적인 대응인가</em>',lead:'학생단체는 과도한 물리력이라고 비판했고,\n내무장관은 비례적인 대응이었다고 맞섰습니다.\n\n8일 보도에서는 고교생 시위 진압용\n섬광탄 사용 중단이 확인됩니다.'}
],body:'10월 5일 랑스에서는 15세 소년이 경찰과 충돌하던 중 손을 잃었습니다. 8일 뉴시스는 섬광탄으로 인한 부상과 정부의 고교생 시위 진압용 섬광탄 사용 중단을 전했습니다.\n\n6일 보도에서 학생단체는 과도한 물리력을 비판했고 내무장관은 비례적 대응이라고 맞섰습니다. 교육 여건뿐 아니라 진압 방식도 논쟁의 대상이 됐습니다.',note:'사건 현장 사진이나 부상 재현을 사용하지 않습니다. 폭발의 세부 경위와 정부의 정확한 사용 중단 발표일은 단정하지 않습니다.'});
Object.assign(beforeEscalation[5],{kicker:'진압 논란을 보여주는 다른 현장 · 10월 6일 렌',title:'전국 행동의 날,<br><em>렌의 물대포</em>',lead:'교육 자원 확충을 요구한 렌의 시위.\n경찰은 물대포로 해산을 시도했습니다.\n랑스의 부상 사건과는 다른 날짜·현장입니다.'});
Object.assign(beforeEscalation[7],{pivot:'참여',kicker:'세 번째 전환 · 학생 곁에 모인 사람들',title:'학생들의 교문 앞에<br><em>학부모와 교사도</em>',lead:'학생들의 교육환경 개선 시위에\n학부모·교사·대학생 등이 합류했습니다.',refs:[[S.police,'참여 주체 확대·진압 대응'],['NISX20261025_0003839953','8일 파리 현장'],[S.march,'17일 행진'],[S.after,'18일 피해 기록'],[S.onlineControl,'SNS 차단 검토·미실행']]});
// The four Lyon stops repeated the Paris expansion. Retain two distinct dates
// that let readers compare the changing demands in another city.
lyonFrames.splice(0,lyonFrames.length,lyonFrames[0],lyonFrames[2]);
Object.assign(beforeEscalation[6],{photo:lyonFrames[0].photo,kicker:'리옹의 두 날짜 · 교육 요구에서 생활비까지',title:'다른 도시에서도 넓어진<br><em>거리의 요구</em>',lead:lyonFrames[0].body,body:'10월 2일과 17일 리옹의 서로 다른 집회를 비교합니다. 교원·시설 확충을 요구한 고교생 행진에 이어 17일에는 교육 개선 연대와 생활비 항의가 함께 나타났습니다.',note:'같은 참가자나 같은 촬영 지점의 전후가 아닙니다. 날짜별 요구의 차이를 살펴보는 별도 현장입니다.'});
Object.assign(beforeEscalation[10],{kicker:'3막 · 요구에 돌아온 정부의 답 / 10월 26일 발표',title:'교원 충원과 시설 개선,<br><em>답은 충분했나</em>',lead:'정부는 교원·시설 확충 등을 약속했습니다.\n학생단체는 일부 양보를 인정하면서도\n불충분하다며 시위를 이어가겠다는 입장입니다.'});
Object.assign(beforeEscalation[9],{kicker:'교육 대책의 다음 문제 · 재원을 어떻게 마련할까',title:'개선하겠다는 약속,<br><em>그 비용을 둘러싼 갈등</em>',lead:'정부는 교육 지원을 늘려야 하는 동시에\n국가부채와 지출 절감 압박을 받고 있습니다.\n재무장관은 더 쓰는 만큼 다른 예산을 줄여야 한다는 입장.'});
Object.assign(beforeEscalation[11],{title:'교육·생활비·주거비,<br><em>다른 나라의 요구들</em>',lead:'프랑스에서는 교육 요구와 진압 논쟁을 살펴봤습니다.\n브뤼셀·밀라노·마드리드의 쟁점은 각각 무엇일까요.\n서로 다른 집회에서 제도에 요구하는 변화를 봅니다.'});
Object.assign(beforeEscalation[15],{kicker:'한국 · 요구를 전달할 통로에 관한 논의',title:'누가 요구를 전달하고,<br><em>제도는 어떻게 답할까</em>',refs:[[labourSource,'노동자의 보호·요구 전달 기구 제안']],note:'프랑스의 학생 시위와 한국의 고용 문제는 서로 다른 사안입니다. 한국 부분은 10월 29일 노동장관의 진단과 제안에 근거합니다.',readingFrames:[
 {label:'한국으로 이어지는 질문',kicker:'한국 · 서로 다른 현장에서 이어받는 질문',title:'누가 요구를 전달하고,<br><em>제도는 어떻게 답할까</em>',lead:'프랑스에서는 협상이 합의에 이르지 못했고,\n학생들의 시위에 학부모와 교사도 합류했습니다.\n\n한국에서는 어떤 사람이 기존 제도의 보호를 받고,\n누가 자신의 요구를 전달하기 어려운지가\n노동·복지 논의의 쟁점으로 제기됐습니다.'},
 {label:'보호의 틈',kicker:'10월 29일 · 김영훈 노동장관의 진단',title:'일하는 방식의 변화,<br><em>기존 제도의 한계</em>',lead:'장관은 프랑스의 연금·노동 갈등을 언급하며\n한국도 기술 변화에 따른 도전에 직면했다고 진단.\n\n특수고용·플랫폼 노동자처럼 전통적인 고용관계\n밖에서 일하는 이들을 보호할 새로운 제도가\n필요하다는 설명입니다.'},
 {label:'요구를 전달할 통로',kicker:'가칭 K-노동복지회의소 · 아직 제안 단계',title:'복지 지원과 함께,<br><em>당사자의 목소리도</em>',lead:'제안된 기구의 역할은 복지 지원과\n노동자의 요구를 사회에 전달하는 일입니다.\n\n보호가 필요한 사람에게 지원이 닿는지,\n그들의 요구가 제도 논의에 반영되는지.\n한국에서 확인할 과제입니다.'}
],body:'프랑스에서는 교육 요구를 둘러싼 협상이 합의에 이르지 못했고, 진압 논쟁과 참여 주체의 확대가 이어졌습니다. 한국의 노동·복지 문제를 같은 사건으로 볼 수는 없지만, 당사자의 요구를 제도가 어떻게 받아들일지라는 질문을 이어갈 수 있습니다.\n\n10월 29일 김영훈 고용노동부 장관은 프랑스의 연금·노동 갈등을 언급하며 기술 변화에 따라 기존 고용관계에 기반한 제도가 한계를 드러낸다고 진단했습니다. 특수고용·플랫폼 노동자의 복지를 지원하고 이들의 요구를 전달할 가칭 K-노동복지회의소를 제안했습니다. 이 기구는 제안 단계로, 설치나 효과가 확인된 대책은 아닙니다.'});
beforeEscalation[15].lead=beforeEscalation[15].readingFrames[0].lead;
Object.assign(beforeEscalation[16],{kicker:'다시, 학교로 · 실제 변화가 있었던 출발점',title:'교문을 연 건<br><em>추가 인력의 배치</em>',lead:'크레테유 고교의 파업은 추가 인력이 오자 끝났습니다.\n다른 학교에 약속한 교사와 시설 개선은 이행될까요.\n\n한국에서도 새 기구의 이름보다 중요한 것은\n보호와 요구의 전달이 실제로 가능해지는지입니다.',body:'크레테유 생텍쥐페리 고교에서는 추가 인력 배치 뒤 파업이 끝났습니다. 다른 학교에 대한 교원·시설 확충 약속은 실제 이행 여부를 확인해야 합니다.\n\n한국에서 제안된 노동자 지원 기구도 마찬가지로 발표 이후를 살펴야 합니다. 당사자의 요구를 듣고 필요한 지원으로 답하는 일이 현장에서 이뤄지는지, 두 나라의 서로 다른 과제를 따라 확인할 질문입니다.'});
// Keep the map-led stage; remove a duplicate government-plan scene to make
// space for the negotiation rather than lengthening the whole chapter list.
report.splice(0,report.length,...[beforeEscalation[0],beforeEscalation[1],beforeEscalation[2],beforeEscalation[3],talksScene,beforeEscalation[4],beforeEscalation[5],beforeEscalation[7],beforeEscalation[6],beforeEscalation[10],beforeEscalation[9],...beforeEscalation.slice(11)]);
// 2026-10-30: concrete demands before escalation; each country adds evidence.
// The single return to Creteil's staffing outcome is reserved for the ending.
Object.assign(report[0],{
 title:'프랑스, 왜<br>거리로 나왔나',
 coverTitle:'<span class="tricolor-blue">프랑스,</span> 왜<br><span class="tricolor-red">거리</span>로 나왔나',
 coverDeck:'교사 충원을 요구한 학생들, 그 곁에 모인 시민들.<br>거리의 요구와 정부의 답을 따라갑니다.',
 body:'교사가 없어 취소되는 수업과 낡은 학교 시설. 프랑스 학생들이 요구한 일상의 변화는 무엇이었을까요. 협상 결렬, 진압 논쟁, 시민들의 합류를 거쳐 정부가 내놓은 답을 살펴봅니다. 유럽의 교육비·생활비·주거비 항의와 한국의 노동·복지 논의까지, 서로 다른 현장에서 요구와 대응을 짚습니다.'
});
Object.assign(report[1],{
 kicker:'1막 · 9월, 파리 남동쪽 크레테유',
 title:'교직원은 파업,<br><em>학생들은 교문 봉쇄</em>',
 lead:'교직원 부족에 항의한 파업에\n학생들도 합류해 학교 출입구를 막았습니다.\n요구는 학교 인력과 교육 자원의 확충.',
 body:'파리 남동쪽 크레테유의 생텍쥐페리 고교. 9월 교직원 부족에 항의한 파업에 학생들도 합류해 출입구를 막았습니다. 학교 인력과 교육 자원을 늘려 달라는 요구였습니다.\n\n지도는 이 학교가 있는 도시의 위치를 보여줍니다. 다음 장에서 살펴보는 수업 차질과 인력 요구는 프랑스 여러 학교에 관한 보도이며, 모두 이 학교에서 발생한 일로 묶지 않습니다.',
 note:'학교 건물이나 학생들의 이동 경로를 표시한 지도가 아닙니다.',
 refs:[[S.origin,'크레테유의 학교 봉쇄']]
});
Object.assign(report[2],{
 kicker:'여러 학교의 사정 · 학생들이 요구한 변화',
 title:'빠진 교사 자리,<br><em>취소된 수업</em>',
 lead:'대체 교사가 없어 취소된 수업,\n책상과 의자가 모자란 교실.\n\n학생들은 교사·보조인력 충원과\n낡은 시설 개선을 요구했습니다.',
 body:'뉴시스는 결근한 교사를 대신할 인력이 없어 수업이 취소되거나 책상·의자가 부족한 사례를 전했습니다. 학생들의 요구에는 교사 결원의 신속한 대체, 과밀학급 축소, 교육보조인력 충원, 학교 간호사·사회복지사 확충이 포함됐습니다. 폭염에 취약하거나 비위생적인 시설, 과도한 시간표도 개선 대상이었습니다.\n\n9월 30일 보도에서 고교생노조연합 회장은 대학입학 자격시험을 앞둔 학년에 철학·프랑스어 교사가 없는 학교도 있다고 주장했습니다. 보도된 사례와 단체의 주장을 구분하며, 지도에 표시된 모든 학교의 사정이 같다고 가정하지 않습니다.',
 note:'취소된 수업은 교사 결원에 관한 보도입니다. 학교 봉쇄 때문에 중단된 수업의 집계와 구분합니다.',
 refs:[[S.origin,'교사 결원·수업 취소 사례'],['NISX20260930_0003809025','대체 교사·학교 인력 확충 요구']]
});
delete report[4].readingFrames;
Object.assign(report[4],{lead:'학생단체와 교육장관의 협상은 합의 없이 종료.\n학생단체는 구체적인 약속이 없다며\n10월 6일 전국 행동을 촉구했습니다.'});
Object.assign(report[8],{kicker:'같은 시기, 리옹의 두 집회 · 10월 2일·17일',detail:'파리와 비교해 보는 같은 시기의 요구',refs:[['NISX20261007_0003816672','2일 고교생 행진'],[S.march,'17일 교육·생활비 요구']]});
Object.assign(report[12],{
 kicker:'벨기에 · 브뤼셀 / 10월 9일',
 title:'교육비 부담에<br><em>예산 삭감까지</em>',
 lead:'브뤼셀에서는 학생과 교사가 함께 나섰습니다.\n교육비 부담에 더해 교육 예산 삭감과\n정부의 긴축정책에도 반대했습니다.',
 body:'10월 9일 브뤼셀의 학생·교사들은 프랑스어권 지역의 교육 개혁과 예산 삭감에 반대해 행진했습니다. 뉴시스는 벨기에에서 교육비 부담과 교육 예산 삭감, 정부 긴축정책을 둘러싼 항의가 이어졌다고 전했습니다.\n\n프랑스에서는 부족한 학교 인력을 늘려 달라는 요구를 살폈습니다. 브뤼셀에서는 교육에 배정할 예산과 그 부담을 둘러싼 갈등을 봅니다. 제도와 주최자가 다른 집회이며, 프랑스 학생들이 이동한 현장이 아닙니다.',
 note:'사진은 10월 9일 브뤼셀의 프랑스어권 교육 개혁·예산 삭감 반대 집회입니다.',
 refs:[['NISX20261022_0003836934','교육비·교육 예산·긴축정책에 대한 항의']]
});
Object.assign(report[13],{
 kicker:'이탈리아 · 밀라노 / 사진 17일 · 후속 기록 24일',
 title:'충돌 뒤에도 이어진<br><em>생활비 항의</em>',
 lead:'17일 생활비 항의 행진에서 벌어진 일부 충돌.\n사진은 이날의 현장입니다.\n\n24일에는 약 1만명이 행진했고,\n큰 충돌 없이 끝났다고 보도됐습니다.',
 body:'밀라노의 요구는 물가와 저임금, 부실한 공공서비스에 대한 항의였습니다. 10월 17일 평화롭게 시작한 행진 도중 일부가 경찰에 돌 등을 던지고 바리케이드에 불을 질렀습니다. 이 장의 사진은 17일 현장입니다.\n\n이후 집회가 모두 같은 양상으로 끝난 것은 아닙니다. 25일 뉴시스 보도에 따르면 24일 밀라노에서는 학생단체·시민단체 등이 참여한 약 1만명 규모의 행진이 큰 충돌 없이 종료됐습니다. 다른 이탈리아 도시의 충돌을 이날 밀라노의 결과로 옮겨 설명하지 않습니다.',
 note:'사진은 17일, 약 1만명 행진과 종료 양상은 24일에 관한 별도 보도입니다.',
 refs:[['NISX20261019_0003831422','17일 요구와 일부 충돌'],['NISX20261025_0003839745','24일 밀라노 행진의 종료 양상']]
});
Object.assign(report[14],{
 kicker:'스페인 · 마드리드 / 10월 17일 텐트 농성',
 title:'월급을 받아도<br><em>살 집이 없다면</em>',
 lead:'광장의 텐트에 담긴 세입자 보호 요구.\n파업 지지 단체들은 임대료 제한과\n공공주택 확대도 촉구했습니다.',
 body:'10월 17일 마드리드 푸에르타델솔 광장에는 세입자 보호 법률 강화를 요구하는 텐트 농성장이 들어섰습니다. 23일 뉴시스는 스페인·포르투갈 대도시에서 월급을 받아도 임대료를 감당하기 어렵다는 호소를 전했습니다.\n\n스페인 파업 지지 단체들의 요구는 임대료 상한제, 공공주택 확대, 관광용 임대주택 규제와 강제퇴거 방지였습니다. 노조들은 11월 11일 총파업을 예고했습니다. 포르투갈과의 공동 행동은 논의 단계로, 참여가 확정된 것은 아닙니다.',
 note:'사진은 17일의 농성. 파업 요구와 향후 일정은 23일 보도 기준이며 실제 개최 여부와 구분합니다.',
 refs:[['NISX20261023_0003838663','세입자 보호·임대료 제한·공공주택 요구']]
});
Object.assign(report[15],{
 kicker:'한국 · 노동·복지 논의로 이어지는 질문',
 title:'일하는 방식이 달라지면,<br><em>보호의 방식은</em>',
 readingFrames:[
  {label:'달라진 일터',kicker:'한국 · 10월 29일 노동장관의 진단',title:'일하는 방식이 달라지면,<br><em>보호의 방식은</em>',lead:'프랑스의 학교에서 유럽의 생활과 주거까지.\n거리에서는 일상을 바꿀 지원을 요구했습니다.\n\n한국에선 특수고용·플랫폼 노동자의 보호가\n노동·복지제도 개편의 과제로 제기됐습니다.'},
  {label:'지원과 참여',kicker:'한국 · 노동장관의 제안 / 시행된 대책 아님',title:'복지 지원과 함께,<br><em>요구를 전할 통로</em>',lead:'김영훈 노동장관은 기존 고용관계에 맞춘\n제도가 달라진 일터를 담지 못한다고 진단.\n\n복지 지원과 요구 전달을 맡을 기구를 제안했습니다.\n누구의 삶에 어떤 변화가 생길지 확인해야 합니다.'}
 ],
 body:'유럽의 집회에서 살펴본 요구는 교사와 학교 예산, 생활비, 주거비였습니다. 한국에서 같은 시위가 일어났다는 뜻이 아니라, 생활에 필요한 지원과 당사자가 요구를 전달할 통로라는 질문을 이어갑니다.\n\n10월 29일 김영훈 고용노동부 장관은 프랑스의 연금개혁 갈등과 노동·복지제도 위기를 언급했습니다. 기술 변화로 고용 형태가 다양해지는 가운데 전통적인 고용관계에 맞춰 설계된 제도에 한계가 있다는 진단입니다. 이번 프랑스 학생 시위 전체의 원인을 설명한 발언으로 사용하지 않습니다.\n\n장관은 특수고용·플랫폼 노동자 등의 복지 지원과 요구 전달을 맡을 가칭 K-노동복지회의소를 제안했습니다. 설치나 성과가 확인된 제도가 아닙니다. 지원 대상과 실제 참여 방식이 어떻게 정해질지 살펴볼 문제로 남아 있습니다.',
 note:'한국의 상황은 노동장관의 진단과 정책 제안을 근거로 설명합니다. 프랑스와 동일한 위기라고 단정하지 않습니다.',
 refs:[[labourSource,'달라진 고용 형태와 노동자 보호에 관한 진단']]
});
report[15].lead=report[15].readingFrames[0].lead;
Object.assign(report[16],{
 kicker:'다시, 크레테유 · 변화가 학교에 도착했을 때',
 title:'인력이 배치된 뒤,<br><em>다시 열린 교문</em>',
 lead:'크레테유 고교의 파업은\n추가 인력이 배치된 뒤 끝났습니다.\n\n다른 학교에 약속한 교사와 시설 개선도\n실제 교실의 변화로 이어질까요.',
 body:'크레테유 생텍쥐페리 고교의 파업은 추가 인력이 배치된 뒤 종료됐습니다. 학교 인력을 늘려 달라는 요구에 실제 배치가 뒤따른 사례입니다.\n\n정부는 이후 다른 학교의 교원과 시설 확충도 약속했습니다. 발표된 계획과 완료된 변화는 다릅니다. 필요한 교사가 채워지고 낡은 시설이 개선되는지, 이 이야기는 학교의 일상에서 다시 확인해야 합니다.',
 note:'마지막 이미지는 열린 교문을 표현한 AI 상징 이미지입니다. 실제 크레테유 학교나 개선 완료 현장의 사진이 아닙니다.',
 refs:[[S.origin,'추가 인력 배치 뒤 파업 종료'],[S.educationPlan,'교원·시설 확충 계획과 학생단체 반응']]
});
// France's funding dilemma leads directly to Belgium's education budget.
// The map arrival still supplies the geographic transition, without a recap stop.
report.splice(11,1);
// 2026-10-30: one question, two readings — complaints and France alone.
// Education is the entry point; growth, pensions and public choices widen it.
const publicSources={
 retirementDebate:'NISX20260930_0003809403'
};
Object.assign(report[0],{
 title:'불만의 문제일까?',
 kicker:'2026년 가을 · 프랑스에서 시작된 질문',
 coverTitle:'<span class="title-reading" aria-hidden="true"><span class="title-word"><span class="title-glyph"><span class="glyph-korean">불</span><span class="glyph-france" lang="ko">佛</span></span><span class="title-man">만</span>의</span><br>문제일까?</span><span class="title-accessible">불만의 문제일까? 프랑스만의 문제일까?</span>',
 coverDeck:'교실에서 거리로, 교육에서 생활과 노후로.<br>프랑스의 요구는 어디까지 이어질까.',
 body:'교사 부족과 과밀학급에 항의한 프랑스 학생들. 그 곁에 생활비와 임금, 연금을 이야기하는 사람들이 모였습니다. 학생들의 구체적인 요구에서 출발해 협상과 진압 논쟁, 정부 대책과 재정 제약을 살펴봅니다. 이어 유럽의 교육·생활·주거 문제와 한국의 교육·정년·노동자 보호 논의로 시선을 옮깁니다.\n\n제목의 \'불\'은 프랑스를 줄여 쓰는 한자 \'佛\'로 바뀝니다. 불만의 내용은 무엇이고, 프랑스만의 문제인지 묻는 두 가지 질문입니다.'
});
report[1].kicker='기 · 무엇이 불만이었나 / 9월 크레테유';
report[1].body+='\n\n이 학교의 파업은 추가 인력 배치 뒤 종료됐습니다. 그러나 다른 학교에서는 교사 결원과 과밀학급, 시설 개선을 요구하는 시위가 이어졌습니다.';
report[2].lead='대체 교사가 없어 취소된 수업,\n학생이 몰린 교실과 낡은 시설.\n요구는 교사·보조인력 충원과 교육환경 개선.';
report[4].kicker='승 · 요구는 왜 거리에 남았나 / 10월 2일 협상';
report[7].body+='\n\n10월 19일 뉴시스는 노동총동맹(CGT)이 학생 시위를 지지하며 물가 인하와 임금·연금 인상을 요구했다고 전했습니다. 학생들의 교육 요구와 노동자의 생활 요구가 함께 등장한 것입니다.';
report[7].refs.push(['NISX20261019_0003831053','CGT의 물가·임금·연금 요구']);
report[8].date='10월 2일 → 17일';
lyonFrames[1].title='교육에서 생활비·임금·연금까지';
lyonFrames[1].body='교육 개선에 연대한 집회에 생활비 항의도 더해졌습니다. 이날 전국 행동에는 노동조합과 노란 조끼 주요 인사들도 참여했습니다.';
report[9].kicker='정부의 답 · 10월 26일 교육 대책 발표';
Object.assign(report[10],{
 kicker:'전 · 요구에 답할 여력은 / 프랑스의 재정과 연금',
 title:'느린 성장 속,<br><em>늘어나는 지원 요구</em>',
 cities:[],onlyCities:true,selected:undefined,
 readingFrames:[
  {label:'성장과 재정',kicker:'전 · 요구에 답할 여력은 / 프랑스',title:'느린 성장 속,<br><em>늘어나는 지원 요구</em>',lead:'프랑스은행의 2026년 성장률 전망은 0.4%.\n거리에서는 교육·생활 지원을 요구하지만,\n정부는 더 쓰는 만큼 다른 지출을 줄여야 한다는 입장.'},
  {label:'연금의 시간',kicker:'또 하나의 갈등 · 2023년 연금개혁과 이후 유예',title:'연금을 받는 시점을<br><em>늦춘다는 것</em>',lead:'2023년 개혁은 연금 수급 개시연령을\n62세에서 64세로 단계적으로 높이는 내용.\n\n이후 인상 일정은 일부 유예됐습니다.\n2026년 9월부터 출생연도별 조정이 적용됩니다.'}
 ],
 body:'프랑스은행은 2026년 9월 기본 시나리오에서 그해 실질 GDP 성장률을 0.4%로 전망했습니다. 연간 확정 실적이 아닌 당시의 전망입니다. 국가부채는 2026년 2분기 GDP의 119%였습니다. 10월 27일 보도에서 재무장관은 추가 지출만큼 다른 예산을 절감해야 한다는 입장을 밝혔습니다. 저성장과 부채는 정부의 대응 여건이며, 모든 시위나 충돌을 하나의 원인으로 설명하는 지표는 아닙니다.\n\n연금은 별도로 이어져 온 갈등입니다. 2023년 개혁은 연금 수급 개시연령을 62세에서 64세로 단계적으로 높이는 내용이었습니다. 프랑스 정부의 공식 안내에 따르면 연령과 가입기간 인상 일정이 2028년까지 유예되면서, 2026년 9월 1일부터 출생연도에 따른 조정이 적용됩니다. 64세 기준은 1969년 이후 출생자에게 적용됩니다. 모든 사람이 지금 64세에 은퇴한다거나 개혁이 전면 폐지됐다는 뜻은 아닙니다.\n\n2026년 10월 집회의 연금 인상 요구와 2023년부터 이어진 수급 개시연령 개혁은 서로 다른 쟁점입니다. 학교 인력과 생활 지원, 노후소득을 함께 살피되 각각의 요구와 정책의 시점을 구분합니다.',
 note:'성장률은 2026년 9월 전망, 국가부채는 2분기 잔액입니다. 연금 수급 개시연령과 한국의 고용상 정년은 서로 다른 제도입니다.',
 refs:[[growthSources.debt,'뉴시스 · 2분기 국가부채'],[S.fiscalLimit,'뉴시스 · 정부의 추가 지출 제약'],['NISX20261019_0003831053','뉴시스 · 10월 집회의 연금 인상 요구']]
});
report[10].lead=report[10].readingFrames[0].lead;
report[11].kicker='프랑스만의 문제일까 · 벨기에 브뤼셀';
report[11].detail='10월 9일 · 교육 개혁과 예산 삭감에 대한 항의';
report[12].detail='17일 사진 · 24일 후속 집회의 요구와 종료 양상';
report[13].detail='10월 17일 · 세입자 보호를 요구한 텐트 농성';
Object.assign(report[14],{
 kicker:'결 · 한국에 남는 질문 / 교실·일터·노후',
 title:'낯설지 않은 요구,<br><em>서로 다른 사정</em>',
 readingFrames:[
  {label:'교실',kicker:'결 · 한국에 남는 질문 / 교육부 자료·뉴시스 9월 8일 보도',title:'과밀은 줄었지만,<br><em>교실의 차이는 남았다</em>',lead:'전국 초·중·고 과밀학급 비율은\n2025년 20.03%에서 2026년 15.16%로 감소.\n\n중학교는 35.13%가 여전히 과밀학급입니다.\n한 반에 28명 이상인 학급을 집계한 수치.'},
  {label:'퇴직과 연금',kicker:'한국 · 정년 연장 논의 / 두 시점 사이의 소득',title:'퇴직한 뒤,<br><em>연금이 나오기 전까지</em>',lead:'정년을 60세로 정한 직장에서 퇴직한다면.\n1969년 이후 출생자의 일반 노령연금은 65세부터.\n\n노동계는 이 사이의 소득 공백을 줄이기 위해\n정년 연장 논의를 서둘러 달라고 요구했습니다.'},
  {label:'제도의 바깥',kicker:'한국 · 10월 29일 노동장관의 진단과 제안',title:'일하는 방식이 달라지면,<br><em>보호의 방식은</em>',lead:'특수고용·플랫폼 노동자처럼\n전통적인 고용관계 밖에서 일하는 사람들.\n\n노동장관은 이들의 복지를 지원하고\n요구를 전달할 새 기구를 제안했습니다.'}
 ],
 body:'한국에서도 교육과 일, 노후의 서로 다른 문제를 확인할 수 있습니다. 교육부 자료를 전한 9월 8일 뉴시스 보도에 따르면 전국 초·중·고의 과밀학급 비율은 2025년 20.03%에서 2026년 15.16%로 줄었습니다. 그러나 중학교는 35.13%, 경기 중학교는 52.41%, 인천 중학교는 49.78%가 과밀학급이었습니다. 기준은 학급당 학생 28명 이상입니다. 전국적인 개선과 지역·학교급의 차이를 함께 봅니다. 이 수치로 한국 전체의 교사 부족이나 프랑스와의 교육 수준 차이를 단정하지 않습니다.\n\n고용노동부 안내상 사업주는 정년을 60세 이상으로 정해야 합니다. 국민연금공단에 따르면 일반 노령연금 수급 개시연령은 출생연도에 따라 다르며 1969년 이후 출생자는 65세입니다. 최소 가입기간 등의 수급 요건이 있고, 조기노령연금은 별도의 요건과 감액이 적용됩니다. 60세 퇴직과 65세 일반 노령연금 사이의 간격은 누구나 5년간 무소득이라는 뜻이 아닙니다. 9월 30일 한국노총은 이 소득 공백을 줄이기 위한 정년 연장 논의 재개를 촉구했습니다. 프랑스의 연금 수급 시점을 늦추는 개혁과 한국의 고용 기간을 늘리자는 요구는 방향과 제도가 다릅니다.\n\n10월 29일 김영훈 고용노동부 장관은 기술 변화로 고용 형태가 다양해지면서 기존 노동·복지제도에 한계가 생긴다고 진단했습니다. 특수고용·플랫폼 노동자의 복지를 지원하고 요구를 전달할 가칭 K-노동복지회의소를 제안했습니다. 설치나 효과가 확인된 대책이 아니라 장관의 진단과 제안입니다.',
 note:'한국의 교육 통계, 정년·연금 제도, 노동장관의 발언을 각각의 근거로 읽습니다. 프랑스의 시위를 한국의 미래로 예측하는 비교가 아닙니다.',
 refs:[[koreaSource,'뉴시스 · 교육부 과밀학급 자료'],[publicSources.retirementDebate,'뉴시스 · 정년 연장 논의 재개 요구'],[labourSource,'뉴시스 · 달라진 고용 형태와 노동자 보호']]
});
report[14].lead=report[14].readingFrames[0].lead;
Object.assign(report[15],{
 chapter:3,korea:false,photo:undefined,comparison:true,closing:true,koreaSummary:false,
 scope:'함께 남은 질문',date:'2026년 10월 30일 편집',detail:'교육·생활·노후를 둘러싼 선택',
 kicker:'불만의 문제일까, 佛만의 문제일까',
 title:'무엇을 지키고,<br><em>비용은 누가 나눌까</em>',
 lead:'배울 기회, 감당할 생활비, 일한 뒤의 노후.\n각자의 요구에 답할 제도와 재원을 묻는 일.\n\n그 논의에 누구의 목소리가 담겨야 할까요.',
 body:'학교에 필요한 교사와 공간, 감당할 수 있는 생활비와 주거비, 일한 뒤의 소득. 살펴본 현장의 요구는 서로 다르지만, 제도가 일상을 어떻게 뒷받침할지를 묻고 있습니다.\n\n정부의 재정 여건과 당사자가 감당하는 부담도 함께 드러났습니다. 무엇을 지키고 비용을 어떻게 나눌지, 그 결정에 누구의 목소리를 담을지. 이 작품은 하나의 정책 정답이나 한국의 미래 예측 대신 그 질문을 남깁니다.',
 note:'여러 현장의 보도와 공공자료를 종합해 제시한 편집상의 질문입니다.',
 refs:[[S.fiscalLimit,'프랑스 · 지원 요구와 정부의 재정 제약'],[publicSources.retirementDebate,'한국 · 정년과 소득 공백 논의'],[labourSource,'한국 · 노동자 보호와 요구 전달']]
});
const chapterLabels=['처음 · 불만의 문제일까?','기 · 교직원과 학생들의 요구','교실 · 교사 부족과 과밀학급','릴 · 협상 전날의 거리','승 · 합의 없는 협상','랑스 · 부상과 진압 논쟁','렌 · 전국 행동의 현장','파리 · 학생 곁에 모인 사람들','리옹 · 교육에서 생활비까지','정부의 답 · 요구와 대책','전 · 저성장·재정·연금','벨기에 · 교육비와 예산 삭감','이탈리아 · 충돌 이후의 집회','스페인 · 임대료와 공공주택','결 · 한국의 교실·일터·노후','마지막 · 무엇을 지키고, 누가 나눌까'];
report.forEach((b,i)=>b.menuLabel=chapterLabels[i]);

// Close on the people in the street, using a photograph not seen earlier.
photos.closingMarch={city:'paris',file:'paris-oct24.jpg',alt:'2026년 10월 24일, 프랑스 파리 도심에서 고물가 개선을 요구하며 모인 시위 참가자들',credit:'파리 · 2026.10.24 · AP/뉴시스',source:'NISX20261025_0003840125'};
Object.assign(report[report.length-1],{
 photo:'closingMarch',comparison:false,scope:'파리',date:'10월 24일',cities:[],selected:undefined,
 lead:'배울 기회, 감당할 생활비, 일한 뒤의 노후.\n거리에서 나온 요구는 달랐습니다.\n\n누구의 삶을 어떻게 지킬지.\n그 결정에 누구의 목소리가 담겨야 할까요.',
 note:'사진은 2026년 10월 24일 파리의 고물가 개선 요구 집회입니다. 마지막 질문은 여러 현장의 보도와 공공자료를 종합해 제시한 편집상의 질문입니다.'
});
report[report.length-1].refs.unshift(['NISX20261025_0003840125','파리 집회 현장과 참가자들의 목소리']);

// 2026-11-01: update outcomes, not just the pre-demonstration warnings.
const followupSources={security:'NISX20261030_0003848125',gdp:'NISX20261030_0003848960',europe:'NISX20261031_0003849178',tactics:'NISX20261031_0003849429',halloween:'NISX20261101_0003849471',arrests:'NISX20261101_0003849998'};
photos.parisHalloween={city:'paris',file:'paris-oct31.jpg',alt:'10월 31일 파리의 교육·생활비 항의 집회에서 경찰 사이로 보이는 핼러윈 가면을 쓴 참가자',credit:'파리 · 2026.10.31 · AP/뉴시스',source:followupSources.halloween};
photos.frankfurt={city:'frankfurt',file:'frankfurt-oct31.jpg',alt:'10월 31일 독일 프랑크푸르트의 시위에서 분홍색 복장으로 북을 연주하며 모여드는 참가자들',credit:'독일 · 프랑크푸르트 · 2026.10.31 · AP/뉴시스',source:followupSources.halloween};

// Distinguish documented injuries from attributed explanations of escalation.
report[5].readingFrames[1]={label:'전술과 진압',kicker:'프랑스 전체 · 전문가 분석 / 10월 31일 보도',title:'하나의 단체가 아닌,<br><em>공유되는 과격 전술</em>',lead:'검은 옷과 복면으로 함께 움직이는 \'블랙 블록\'.\n전문가는 일부 청년에게 이 전술이 번졌다고 분석.\n\n경찰노조 대표는 강경 진압이 어린 참가자들의\n동조를 키울 수도 있다고 설명했습니다.'};
report[5].body+='\n\n31일 뉴시스는 블랙 블록을 정식 지도부가 있는 단체가 아니라 참가자들이 공유하는 전술로 설명했습니다. 전문가 티에리 뱅상은 극좌 출신이 아닌 일부 청년들도 이 방식을 채택한다고 분석했습니다. 특정 정치 성향을 학생 전체의 동기로 단정할 근거는 아닙니다.\n\n경찰노조 대표 올리비에 카프는 위험한 투척물 때문에 직접 개입하게 된다고 설명하면서도, 강경 진압을 겪은 어린 참가자들이 폭력 가담자에게 동조할 수 있다고 지적했습니다. 이는 진압과 과격화의 관계에 관한 설명이며 개별 사건의 인과관계가 확인됐다는 뜻은 아닙니다. 28일 마크롱 대통령은 손 절단 사고를 정당화할 수 없다는 취지로 말하며 충돌 진정을 호소했습니다.';
report[5].refs.push([followupSources.tactics,'과격 전술·진압 방식에 대한 분석과 당사자 설명']);

// Replace an annual forecast with the newly reported quarterly observation.
const economyUpdate=report[10];
economyUpdate.readingFrames[0]={label:'성장과 물가',kicker:'전 · 10월 30일 발표 / GDP 잠정치·물가 전망',title:'경제는 멈췄는데,<br><em>생활비는 오른다면</em>',lead:'3분기 GDP는 전분기보다 0.1% 감소(잠정치).\n10월 소비자물가는 전년보다 3.4% 상승 전망.\n\n지원 확대를 요구하는 거리와\n지출을 줄이겠다는 정부가 마주했습니다.'};
economyUpdate.title=economyUpdate.readingFrames[0].title;
economyUpdate.lead=economyUpdate.readingFrames[0].lead;
economyUpdate.kicker=economyUpdate.readingFrames[0].kicker;
economyUpdate.body='10월 30일 발표된 잠정 자료에서 프랑스의 3분기 실질 GDP는 전분기보다 0.1% 감소했습니다. 재무장관은 세 분기 연속 성장이 나타나지 않고 있다고 설명했습니다. 9월의 연간 성장률 전망과 관측 기간·성격이 다른 수치입니다.\n\n10월 소비자물가는 전년 동월보다 3.4% 오를 것으로 예상됐습니다. 9월 3.1%보다 높으며 에너지 가격 상승이 주된 배경으로 제시됐습니다. 가계·정부 소비가 늘었어도 수출 감소가 성장에 부담을 줬다는 보도입니다. 학생 시위가 GDP 감소를 일으켰다는 인과관계로 사용하지 않습니다.\n\n국가부채는 2026년 2분기 GDP의 119%였습니다. 재무장관은 27일 추가 지출만큼 다른 예산을 절감해야 한다고 밝혔고, 30일에도 예산의 재정 건전화 목표를 강조했습니다. 생활 지원 요구와 재정 제약이 맞서는 조건을 봅니다.\n\n연금은 별도로 이어져 온 갈등입니다. 2023년 개혁은 수급 개시연령을 62세에서 64세로 단계적으로 높이는 내용이었습니다. 이후 연령·가입기간 인상 일정이 일부 유예돼 2026년 9월부터 출생연도별 조정이 적용됩니다. 64세 기준은 1969년 이후 출생자에게 적용됩니다. 모든 사람이 지금 64세에 은퇴하거나 개혁이 전면 폐지됐다는 뜻은 아닙니다. 10월 집회의 연금 인상 요구와도 구분합니다.';
economyUpdate.note='GDP는 전분기 대비 3분기 잠정치, 물가는 전년 동월 대비 10월 전망입니다. 국가부채는 2분기 잔액입니다. 서로 다른 기간과 지표를 직접 비교하지 않습니다.';
economyUpdate.refs.unshift([followupSources.gdp,'3분기 GDP 잠정치·10월 물가 전망']);

// New German reporting replaces the older Belgian example in the main story.
// Belgian and Rennes material remains in the dated record map.
Object.assign(report[11],{
 photo:'frankfurt',selected:'frankfurt',scope:'프랑크푸르트',date:'10월 31일',cities:['frankfurt'],center:[10.4,51],width:800,height:1000,period:europeHalloweenPeriod,
 kicker:'佛만의 문제일까 · 독일 / 10월 31일',title:'학교와 생활비,<br><em>기후와 징병제까지</em>',
 lead:'독일 34개 도시에서도 청년들이 거리로.\n학교 지원과 고물가 대책, 기후 보호,\n징병제 부활 반대가 함께 등장했습니다.\n\n전국 약 12만명은 주최 측 집계입니다.',
 body:'10월 31일 독일의 청년단체 Gen Z regelt는 약 34개 도시에서 집회를 열었습니다. 학교 재정 지원 확대, 고물가 대책, 기후 보호, 징병제 부활 반대를 요구했습니다. 주최 측은 전국 약 12만명이 참여했다고 집계했습니다. 경찰 공식 집계는 확인되지 않았습니다. 사진은 프랑크푸르트의 현장으로 전국 인원을 이 도시의 규모로 읽지 않습니다.\n\n전날 보도에 나온 16만명은 웹사이트에 참여 의사를 등록한 사람 수였습니다. 실제 집회 참가 집계와 다릅니다. 단체는 자신들의 미래에 관한 결정에서 청년의 목소리를 빼지 말라는 취지를 밝혔습니다. 프랑스와 조직·제도가 다른 집회이며, 모든 요구를 같은 원인으로 묶지 않습니다.\n\n대체로 평화롭게 진행됐지만 쾰른과 프랑크푸르트에서는 일부 충돌도 보도됐습니다. 이 사진 속 인물을 폭력 가담자로 지목하지 않습니다.',
 note:'사진은 10월 31일 프랑크푸르트. 약 12만명은 독일 전국 주최 측 집계이며 경찰 공식 집계는 미확인입니다.',
 refs:[[followupSources.halloween,'독일 청년 시위의 요구와 사후 집계'],[followupSources.europe,'집회 전 등록 인원과 예고']],menuLabel:'독일 · 청년이 요구한 미래'
});
report[12].kicker='이탈리아 · 밀라노 / 사진 17일 · 후속 기록 31일 보도';
report[12].lead='24일 행진은 큰 충돌 없이 끝났지만,\n25~26일에는 별도 소요가 보도됐습니다.\n\n정부는 군인 500명 파견 방침을 밝혔고,\n일부 고급 매장은 예방적으로 문을 닫았습니다.';
report[12].body+='\n\n31일 보도는 25~26일 밀라노의 기물 파손·약탈 등 별도 소요와 정부의 군인 500명 파견 방침을 전했습니다. 패션 지구의 일부 고급 매장은 추가 소요를 우려해 문을 닫고 진열 상품을 치웠습니다. 24일의 평화적 종료만으로 이후까지 잠잠했다고 읽지 않도록 날짜를 나눕니다. 파견 방침과 실제 배치 완료도 구분합니다.';
report[12].note='사진은 10월 17일입니다. 24일 행진, 25~26일 소요와 31일 보도된 후속 대책은 서로 다른 날짜의 기록입니다.';
report[12].refs.push([followupSources.europe,'25~26일 소요·군인 파견 방침·매장 폐점']);
report[13].body+='\n\n11월 1일 보도에서는 31일 리스본에서 수천명이 주택난에 항의한 사실이 확인됩니다. 17일 시작 농성이나 스페인의 11월 11일 파업 예고와는 별도 기록입니다. 국가별 주거 요구가 함께 나타났음을 보여주며 하나의 공동 집회로 설명하지 않습니다.';
report[13].refs.push([followupSources.halloween,'31일 리스본의 주택난 항의 후속 기록']);

report.splice(6,1);
report.splice(report.indexOf(economyUpdate),0,{
 chapter:1,photo:'parisHalloween',scope:'파리',date:'10월 31일',detail:'세 번째 토요 집회 · 11월 1일 후속 집계',cities:['paris'],selected:'paris',onlyCities:true,center:[2.352,48.857],width:240,height:180,period:halloweenPeriod,
 kicker:'대책 발표 뒤 · 10월 31일 / 전국 참가 규모',title:'규모는 줄었지만,<br><em>요구는 남았다</em>',
 readingFrames:[
  {label:'참가 규모',kicker:'대책 발표 뒤 · 10월 31일 / 전국 집계',title:'규모는 줄었지만,<br><em>요구는 남았다</em>',lead:'전국 참가자 내무부 32만명, 청년단체·노조 50만명.\n내무부 집계는 17일 55만명, 24일 41만명보다 감소.\n\n교육과 생활비 개선을 요구하는\n세 번째 토요 집회는 계속됐습니다.'},
  {label:'진행과 후속 수사',kicker:'11월 1일 밤 후속 보도 / 체포·수사 구분',title:'대체로 평화로웠지만,<br><em>일부 현장에선 충돌</em>',lead:'전반적으로 이전 두 토요일보다 평화로웠다는 보도.\n일부 도시에서는 해산 과정에 충돌이 있었습니다.\n\n전국 체포는 779명으로 후속 집계.\n검찰은 폭발물 투척을 살인미수 혐의로 조사 중.'}
 ],
 lead:'전국 참가자 내무부 32만명, 청년단체·노조 50만명.\n교육과 생활비 개선을 요구하는 집회는 계속됐습니다.',
 body:'10월 31일 프랑스의 세 번째 토요 집회에서 내무부는 전국 32만명, 청년단체와 노동조합은 50만명이 참가했다고 집계했습니다. 내무부 기준 17일 55만명, 24일 41만명보다 감소했습니다. 감소와 요구의 해소는 같은 뜻이 아닙니다.\n\n당국은 집회 전에 경찰·헌병 7만명 배치를 발표하고 일부 도심 행진을 제한했습니다. 실제 행진은 대체로 축제 분위기였지만 마무리 무렵 파리 샤랑통 문 인근과 리옹·툴루즈 등에서 일부 충돌이 발생했습니다. 시위 전체를 폭동으로 묶지 않습니다.\n\n11월 1일 밤 뉴시스는 대부분의 시위가 이전 두 토요일보다 훨씬 평화롭게 진행됐다고 전했습니다. 내무부 인용 체포 집계는 779명입니다. 앞선 565명은 31일 오후 9시 시점의 중간 수치여서 최종 상황처럼 사용하지 않습니다. 파리 검찰은 경찰관이 경상을 입은 수제 폭발물 투척을 살인미수 혐의로 조사한다고 밝혔습니다. 혐의 조사와 유죄 판단은 다릅니다.\n\n학생단체는 11월 2~3일 대학·고교 행동을 촉구했고 5일 노동계 행동도 예고됐습니다. 11월 1일 기준 계획이며 실제 개최나 참여 결과가 아닙니다.',
 note:'사진은 10월 31일 파리의 한 현장입니다. 참가·체포 수는 전국 집계입니다. 11월 행동은 예고, 폭발물 사건은 수사 단계로 구분합니다.',
 refs:[[followupSources.security,'집회 전 경찰·헌병 배치 계획'],[followupSources.halloween,'31일 참가 규모·진행·향후 행동 예고'],[followupSources.arrests,'1일 밤 체포 집계·폭발물 사건 수사']],menuLabel:'10월 31일 · 줄어든 규모, 이어진 요구'
});
report[10].menuLabel='전 · 성장 정체·물가·연금';

// Read the German demands and the subsequent incidents as distinct records.
const germanyUpdate=report.find(b=>b.photo==='frankfurt');
germanyUpdate.detail='10월 31일 · 청년들의 요구와 일부 현장의 충돌';
germanyUpdate.readingFrames=[
 {label:'청년들의 요구',kicker:'佛만의 문제일까 · 독일 / 10월 31일',title:'학교와 생활비,<br><em>기후와 징병제까지</em>',lead:'학교와 기후에 쓸 돈을 늘려 달라는 요구,\n고물가 대책과 징병제 부활 반대.\n\n무엇을 우선하고 청년이 어떤 부담을 질지.\n미래의 결정에 참여하겠다는 목소리입니다.'},
 {label:'일부 현장의 충돌',kicker:'뉴시스 11월 1일 보도 · 평화적 집회와 일부 충돌',title:'대체로 평화로웠지만,<br><em>일부 도시에서는 충돌</em>',lead:'쾰른에서는 폭죽 투척에 경찰이 물대포로 대응.\n프랑크푸르트에서는 투석으로 경찰들이 다쳤습니다.\n\n집회는 전반적으로 평화로웠다는 보도.\n청년들의 요구와 일부 현장의 충돌을 나눠 봅니다.'}
];
germanyUpdate.lead=germanyUpdate.readingFrames[0].lead;
germanyUpdate.body+='\n\n학교·기후 지원 확대, 고물가 대책과 징병제 반대를 함께 내건 요구는 공공정책의 우선순위와 청년이 감당할 부담이라는 질문으로 읽을 수 있습니다. 이는 요구를 묶어 읽는 편집상의 해석입니다. 독일 정부의 실제 국방·교육 예산 증감을 비교한 통계가 아닙니다.';
germanyUpdate.note+=' 정책의 우선순위에 관한 문장은 편집상의 해석입니다. 일부 도시의 충돌은 11월 1일 뉴시스 보도에 근거합니다.';

// 2 November follow-ups: update the scope of counts and show what is still planned.
const politicsSource='NISX20261103_0003852329';
const frenchFollowup=report.find(b=>b.photo==='parisHalloween');
frenchFollowup.detail='10월 31일 집회 · 11월 2~3일 피해·개학·정치 후속 보도';
frenchFollowup.readingFrames[1]={label:'피해와 수사',kicker:'11월 2일 보도 / 단속 집계·수사 단계',title:'대체로 평화로웠지만,<br><em>일부 현장에선 충돌</em>',lead:'치안 인력 159명 부상이라는 내무부 발표.\n폭발물 투척 혐의는 검찰이 살인미수로 수사 중.\n\n집회와 핼러윈 야간 단속 등을 합친\n체포 집계는 779명이었습니다.'};
frenchFollowup.readingFrames.push({label:'거리와 정치',kicker:'11월 3일 보도 / 5일 집회 예고·현지 정치 분석',title:'다음 집회를 앞둔 거리,<br><em>정치권에 쏠린 책임</em>',lead:'5일에는 고물가 항의·임금 인상 요구 집회 예고.\n학생단체도 시위 지속을 촉구했습니다.\n\n뉴시스가 전한 현지 분석은 정부 책임론이\n대선의 정책 논쟁까지 압도한다고 짚었습니다.'});
frenchFollowup.body='10월 31일 프랑스의 세 번째 토요 집회에서 내무부는 전국 32만명, 청년단체·노조는 50만명이 참여했다고 집계했습니다. 내무부 기준 17일 55만명, 24일 41만명보다 줄었습니다. 참가 감소가 요구의 해소를 뜻하는 것은 아닙니다.\n\n11월 2일 보도는 집회가 대체로 평화롭게 진행됐고 신체적 폭력과 약탈 규모도 17일보다 낮았다고 전했습니다. 내무부는 치안 인력 159명이 다쳤다고 밝혔습니다. 검찰은 경찰·헌병 15명이 폭발물에 맞았고 2도 화상 부상자도 있다며 살인미수 혐의 수사에 착수했습니다.\n\n체포 779명은 집회뿐 아니라 핼러윈 야간 단속 등을 포함한 전국 집계입니다.\n\n프랑스 학교의 2일 수업 재개를 앞둔 보도에서 학생단체들은 2~3일 봉쇄와 추가 행동을 촉구했습니다. 5일에는 철도·공공서비스 부문 총파업과 학생·노조 집회가 예고됐습니다. 마크롱 대통령은 청년 요구가 대책에 반영됐다며 차분한 수업 재개를 촉구했지만 학생단체는 답변이 부족하다며 압박을 이어가겠다고 밝혔습니다.\n\n리옹의 시위 조직에 참여한 대학생은 대입지원제도 파르쿠르슈프 폐지와 교육 재원 확충을 요구했습니다. 학생단체가 압박을 이어가는 가운데 개학과 다음 파업을 앞둔 긴장도 계속됐습니다.';
frenchFollowup.body+='\n\n11월 3일 뉴시스는 르몽드의 분석을 인용해 시위 수습과 민생 문제가 대선 논쟁을 압도하고 있다고 전했습니다. 비판은 정부의 시위 대응뿐 아니라 마크롱 집권 기간의 성과로도 향했습니다.\n\n같은 현지 분석은 극우 국민연합(RN)과 급진좌파 굴복하지않는프랑스(LFI)의 지지세가 커지고 중도 진영의 입지는 좁아졌다고 평가했습니다. LFI가 시위의 정당성을 주장하며 정부에 양보를 요구하는 모습도 보도됐습니다.\n\n3일 보도에 따르면 5일에는 노조 연합체가 고물가에 항의하고 임금 인상을 요구하는 추가 집회를 예고했습니다. 대학생·고교생 단체도 시위 지속을 촉구했습니다.';
frenchFollowup.note='사진은 10월 31일 파리. 체포 779명은 집회·핼러윈 단속 등을 포함한 전국 집계입니다. 봉쇄 촉구와 5일 파업은 11월 2일 보도 기준 예고, 폭발물 사건은 수사 단계입니다. 정치권 흐름은 11월 3일 뉴시스가 전한 현지 매체의 분석이며 5일 집회는 예고입니다.';
frenchFollowup.refs.push([politicsSource,'정부 책임론·대선 논쟁에 대한 현지 분석과 5일 집회 예고'],[nov2Sources.investigation,'폭발물 사건 수사·부상 집계'],[nov2Sources.schools,'개학·봉쇄 촉구·5일 파업 예고와 체포 집계 범위']);

germanyUpdate.readingFrames[1]={label:'행진 뒤의 충돌',kicker:'뉴시스 11월 2일 후속 보도 / 프랑크푸르트',title:'낮 집회는 평화롭게,<br><em>행진 뒤 일부 도심은 충돌</em>',lead:'프랑크푸르트 상점 17곳 파손, 그중 5곳 약탈.\n경찰관 100명 이상 부상·54명 붙잡혔다는 보도.\n\n참가자 부상 규모는 확인되지 않았습니다.\n주최 측은 폭력과 거리를 둔다고 밝혔습니다.'};
germanyUpdate.body='10월 31일 독일 청년들은 약 34개 도시에서 학교 재정 지원, 고물가 대책, 기후 보호와 징병제 반대 등을 요구했습니다. 주최 측 집계는 전국 약 12만명이며 경찰 공식 집계는 확인되지 않았습니다. 앞선 16만명은 참여 의사를 등록한 수치로 실제 참가 집계와 다릅니다.\n\n11월 2일 뉴시스는 낮 집회가 대체로 평화로웠지만 일부 도시에서 행진이 끝난 뒤 폭력이 발생했다고 전했습니다. 프랑크푸르트에서는 경찰관 100명 이상이 다치고 13~29세 54명이 붙잡혔다고 보도됐습니다. 상점 17곳이 파손됐고 그중 5곳은 약탈 피해를 봤습니다. 참가자 부상 규모는 확인되지 않았습니다.\n\n쾰른에서는 경찰이 물대포로 군중을 해산했고 베를린에서도 경찰을 향한 병·폭죽 투척이 보도됐습니다. 주최 측은 폭력과 거리를 두겠다고 밝혔습니다. \n\n단체는 자신들의 미래에 관한 결정에 청년의 목소리를 담으려는 취지를 밝혔습니다. 학교·기후 지원과 징병제 반대를 함께 제기한 요구를 정책의 우선순위와 부담 배분의 질문으로 읽는 것은 편집상의 해석입니다. 사진은 31일 프랑크푸르트 집회입니다.';
germanyUpdate.note='사진은 AP/뉴시스의 10월 31일 프랑크푸르트 집회. 전국 참가 집계와 도시별 피해 수치를 구분합니다. 피해·체포 수는 11월 2일 후속 보도 기준입니다.';
germanyUpdate.refs.push([nov2Sources.europe,'행진 뒤 충돌·경찰 부상·상점 피해 후속 보도']);

photos.romeStrike={city:'rome',file:'rome-oct30.jpg',alt:'10월 30일 로마의 전국 총파업 집회에서 깃발을 흔들고 확성기로 구호를 외치는 참가자들',credit:'이탈리아 · 로마 · 2026.10.30 · AP/뉴시스',source:nov2Sources.europe};
photos.lisbonGathering={city:'lisbon',file:'lisbon-nov1.jpg',alt:'11월 1일 리스본 호시우 광장에서 농성장 해산을 비판하며 오케스트라 연주에 맞춰 노래하는 시민들',credit:'포르투갈 · 리스본 · 2026.11.1 · AP/뉴시스',source:nov2Sources.europe};
Object.assign(report[12],{
 photo:'romeStrike',selected:'rome',scope:'로마',date:'10월 30일',detail:'전국 총파업·집회 · 참가 규모는 집계 주체별',cities:['rome'],center:[12.5,42.6],period:europeFollowupPeriod,
 kicker:'이탈리아 · 10월 30일 총파업 / 사진 로마',title:'생활비와 주거난,<br><em>군비 확대에 대한 항의</em>',
 lead:'전국 60여곳에서 노동자·학생의 총파업과 집회.\n생활비·주거난·군비 확대에 반대했습니다.\n\n참가자 내무부 25만5000명, USB 노조 약 150만명.\n추산 주체가 다른 전국 단위 집계입니다.',
 body:'10월 30일 이탈리아에서 생활비 상승과 주거난, 군비 확대에 반대하는 총파업·집회가 열렸습니다. 로마·밀라노·나폴리·토리노 등에서 노동자와 대학생·고교생이 함께 행진했고 일부 학부모도 동참했습니다.\n\nUSB 노조는 전국 60여곳에서 약 150만명이 참여했다고 추산했습니다. 내무부 집계는 25만5000명이었습니다. 두 수치 모두 로마 한 도시가 아닌 이탈리아 전국 집계입니다. 참가자들은 집세·공공요금·생필품 부담과 임금 구매력 저하를 호소했습니다.\n\n대부분의 집회는 평화롭게 끝났지만 로마·토리노·비첸차에서 충돌이 보도됐습니다. 비첸차에서는 경찰관 4명과 참가자 3명이 다쳤다고 전해졌습니다. 앞선 밀라노의 17·24일 행진과 25~26일 소요에 이어, 총파업에서는 생활비·주거·군비 지출 문제가 함께 제기됐습니다.',
 note:'사진은 10월 30일 로마의 총파업 집회. 25만5000명·약 150만명은 각각 내무부·USB 노조의 이탈리아 전국 집계입니다.',
 refs:[[nov2Sources.europe,'30일 이탈리아 총파업·참가 집계·일부 충돌']],menuLabel:'이탈리아 · 생활비·주거·군비 지출'
});
Object.assign(report[13],{
 photo:'lisbonGathering',selected:'lisbon',scope:'리스본',date:'11월 1일',detail:'31일 주거 행진 뒤 농성장 철거·1일 항의 집회',cities:['lisbon'],center:[-8,39.6],period:europeFollowupPeriod,
 kicker:'포르투갈 · 리스본 / 11월 1일',title:'집을 요구한 광장,<br><em>철거 뒤 다시 모인 사람들</em>',
 lead:'주거비·임대차 법안 반대 행진 뒤\n31일 밤 세운 텐트는 1일 새벽 철거됐습니다.\n\n시민들은 다시 광장에 모여 연주에 맞춰 노래하며\n주거 요구와 경찰 대응에 대한 비판을 이어갔습니다.',
 body:'10월 31일 리스본에서 수천명이 주거비 부담과 임대차 법안에 반대해 행진했습니다. 참가자들은 호시우 광장에 텐트를 세웠고 경찰은 11월 1일 새벽 리스본과 포르투의 농성장 철거에 나섰습니다. 경찰은 일부 참가자가 병과 페인트를 던졌다고 밝혔습니다.\n\n해산 명령 불응 혐의로 리스본 6명·포르투 7명이 체포됐다고 보도됐습니다. 경찰관 13명이 다쳐 8명이 병원으로 옮겨졌습니다. 리스본 활동가 단체는 참가자 30명 이상이 다쳤다고 주장했습니다. \n\n사진은 1일 호시우 광장의 해산 비판 집회에서 시민들이 오케스트라 연주에 맞춰 노래하는 모습입니다. 철거 이후에도 시민들의 항의는 이어졌습니다.\n\n참가자들은 세입자 퇴거를 쉽게 하고 신규 계약의 임대료 상한을 없애는 법안의 철회를 요구했습니다. 몬테네그루 총리는 철회는 거부했지만 최종 표결 전 수정 가능성을 열어뒀습니다. 보도 당시 법안은 최종 표결을 앞두고 있었습니다. 앞선 17일 시작 농성과 마드리드의 텐트 농성은 날짜별 기록에서 별도로 확인할 수 있습니다.',
 note:'사진은 11월 1일 해산 비판 집회. 31일 행진·1일 새벽 철거·이후 집회를 구분하며 경찰과 활동가 단체의 부상 집계를 합치지 않습니다.',
 refs:[[nov2Sources.europe,'리스본·포르투 농성장 철거·피해 집계·임대차 법안']],menuLabel:'포르투갈 · 주거 농성과 해산 이후'
});

// Different documented photographs accompany each reading state.
photos.parisFire={city:'paris',file:'paris-oct31-fire.jpg',alt:'10월 31일 파리 시위 도중 불타는 차량에 소방관이 물을 뿌리는 모습',credit:'파리 · 2026.10.31 차량 화재 · AP/뉴시스',source:nov2Sources.investigation};
photos.macronMeeting={city:'paris',file:'macron-oct22-meeting.jpg',alt:'10월 22일 파리 엘리제궁에서 전국 시위와 관련한 안보회의에 참석한 마크롱 대통령의 자료사진',credit:'마크롱 · 2026.10.22 파리 회의 자료사진 · AP/뉴시스',source:S.educationPlan};
photos.frankfurtMarch={city:'frankfurt',file:'frankfurt-oct31-march.jpg',alt:'10월 31일 프랑크푸르트에서 팻말과 깃발을 들고 행진하는 시위 참가자들',credit:'독일 · 프랑크푸르트 행진 · 2026.10.31 · AP/뉴시스',source:nov2Sources.europe};
frenchFollowup.readingFrames.forEach((f,n)=>f.photo=['parisHalloween','parisFire','macronMeeting'][n]);
germanyUpdate.readingFrames.forEach((f,n)=>f.photo=['frankfurt','frankfurtMarch'][n]);
frenchFollowup.note='집회·차량 화재는 10월 31일 파리, 마크롱은 10월 22일 엘리제궁 회의 자료사진입니다. 차량 화재 사진을 수사 대상 폭발물 사건의 현장으로 특정하지 않습니다. 체포 779명은 집회·핼러윈 단속 등을 포함한 전국 집계입니다. 봉쇄 촉구·5일 행동 예고와 폭발물 사건 수사를 구분하며, 정치권 흐름은 11월 3일 뉴시스가 전한 현지 매체의 분석입니다.';
germanyUpdate.note='두 사진은 10월 31일 프랑크푸르트의 행진을 기록한 AP/뉴시스 사진입니다. 전국 참가 집계와 도시별 피해 수치를 구분합니다. 피해·체포 수는 11월 2일 후속 보도 기준이며 사진은 상점 파손 현장이 아닙니다.';

// One reader-controlled sequence for photographs and explanatory records.
const parisSequence=report.find(b=>b.scope==='파리'&&b.gallery);
parisSequence.gallery=['school','parisSupport','parisMarch'];
parisSequence.note='10월 7일 학교 앞 집회, 8일 연대 집회, 17일 도심 행진을 날짜순으로 묶었습니다. 서로 다른 현장이며 연속 촬영이 아닙니다. 18일 피해 사진은 날짜별 기록에서 볼 수 있습니다.';
lyonFrames[0].headline='교사와 시설을 요구한<br><em>리옹 고교생들의 행진</em>';
lyonFrames[1].headline='교육 요구에 더해진<br><em>생활비·임금·연금</em>';
lyonFrames[1].body='교육 개선에 연대한 집회에\n생활비 항의도 더해졌습니다.\n\n이날 전국 행동에는 노동조합과\n노란 조끼 주요 인사들도 참여했습니다.';

const annotations={
 economy:'<div class="economy-line"><span>국가부채 <b>119<small>%</small></b></span></div><small>GDP 대비 국가부채 잔액 · 2026년 2분기<br>뉴시스 9월 29일 보도</small>',
 response:'<div class="response-gap"><span>대학 정원 확대</span><dl><div><dt>학생단체 요구</dt><dd>25만명</dd></div><div><dt>정부 계획</dt><dd>1만5000명</dd></div></dl><small>정부 계획: 2027~2028년 증원 · 시행 전</small></div>'
};
