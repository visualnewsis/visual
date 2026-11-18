'use strict';
const source=id=>'https://www.newsis.com/view/'+id;
const places={creteil:{name:'크레테유',lon:2.455,lat:48.79},lille:{name:'릴',lon:3.057,lat:50.63},lyon:{name:'리옹',lon:4.835,lat:45.764},marseille:{name:'마르세유',lon:5.369,lat:43.296},rennes:{name:'렌',lon:-1.677,lat:48.117},paris:{name:'파리',lon:2.352,lat:48.857},nantes:{name:'낭트',lon:-1.554,lat:47.218}};
const periods=[
{label:'9월',date:'2026년 9월',title:'크레테유의 학교 봉쇄',context:'교직원 파업에 학생들이 합류했습니다. 출발 학교의 파업은 추가 인력 배치 뒤 끝났지만, 다른 학교의 행동은 계속됐습니다.',stat:'출발일은 보도마다 달라 월 단위로 표시',center:[2.45,48.8],width:440,height:360,primary:'creteil',records:{creteil:{date:'9월',text:'파리 남동쪽 교외 크레테유의 생텍쥐페리 고교에서는 교직원들이 인력 부족에 항의해 파업했습니다. 학생들도 교직원과 교육 자원을 늘려 달라며 학교 출입구를 막았습니다. 추가 인력이 배치된 뒤 이 학교의 파업은 끝났습니다.',who:'교직원·고교생',demand:'교직원 충원',source:'NISX20261007_0003816508'}}},
{label:'9.29',date:'9월 29일',title:'학생과 공공부문 노조',context:'학생단체는 긴축 예산에 반대하는 공공부문 노조와 함께 행동하자며 전국 학교에 참여를 촉구했습니다.',stat:'교육부: 416개 고교 시위·수업 차질. 오후 봉쇄 상태는 45곳.',center:[2.7,49.7],width:540,height:430,primary:'lille',records:{lille:{date:'9월 29일',text:'릴에서는 정부 예산안에 반대하는 행진이 열렸습니다.\n사진 속 참가자들은 공공서비스에 쓸 예산을 요구합니다.',who:'공공부문 노동조합 등',demand:'긴축 예산 반대',photo:'lille-sept29.jpg',caption:'릴 · 9월 29일 · AP/뉴시스',alt:'릴에서 공공서비스 예산을 요구하는 현수막을 들고 행진하는 시위대',source:'NISX20260930_0003809025'}}},
{label:'10.1–2',date:'10월 1~2일',title:'북부 릴에서 남부 마르세유까지',context:'교사 부족과 학교 환경에 항의하는 시위가 여러 도시에서 이어졌습니다. 리옹을 누른 뒤 17일 기록과 비교해보세요.',stat:'사진 촬영일과 기사 등록일은 다를 수 있습니다.',center:[2.5,46.9],width:1000,height:1000,primary:'lyon',records:{lille:{date:'10월 1일',text:'학생이 든 팻말에는 졸업장과 범죄수사대의 프랑스어 약자인\nBAC가 나란히 적혔습니다. 학생들은 교육 지원 확대를 요구했습니다.',who:'고교생',demand:'교육 지원 확대',photo:'lille.jpg',caption:'릴 · 10월 1일 · AP/뉴시스',alt:'졸업장을 원한다는 팻말을 든 릴의 학생',source:'NISX20261007_0003816508'},lyon:{date:'10월 2일',text:'리옹의 학생 시위는 열악한 학교 환경에 대한 항의였습니다. 뉴시스는 교사 부족과 과밀 학급, 낡은 시설을 쟁점으로 전했습니다. 사진에는 경찰의 최루탄을 피해 이동하는 학생들이 담겼습니다.',who:'고교생',demand:'교사 충원·학교 환경 개선',photo:'lyon.jpg',caption:'리옹 · 10월 2일 · AP/뉴시스',alt:'리옹에서 최루탄을 피해 이동하는 학생들',source:'NISX20261007_0003816508'},marseille:{date:'10월 초',text:'뉴시스는 학교 환경에 항의하는 학생 시위가 북부 릴에서 남부 마르세유까지 번졌다고 보도했습니다.',who:'고교생',demand:'교육환경 개선',source:'NISX20261007_0003816508'}}},
{label:'10.6',date:'10월 6일',title:'협상 결렬 뒤의 전국 행동',context:'2일 학생단체와 교육장관의 협상은 합의 없이 끝났습니다. 학생단체가 6일 행동을 촉구했고 교육계와 노동계도 연대했습니다.',stat:'뉴시스 10월 6일·8일 보도',center:[-1.4,48],width:600,height:480,primary:'rennes',records:{rennes:{date:'10월 6일',text:'렌에서는 교육 자원 부족에 항의하는 시위가 열렸습니다.\n경찰은 물대포로 해산을 시도했습니다.',who:'교육환경 개선 시위 참가자',demand:'교육 자원 확충',photo:'rennes-oct6.jpg',caption:'렌 · 10월 6일 · AP/뉴시스',alt:'렌에서 시위대를 향해 물대포를 쏘는 경찰',source:'NISX20261008_0003819026'}}},
{label:'10.17',date:'10월 17일',title:'생활비와 임금까지',context:'학생 시위에 노동조합과 노란 조끼 활동가 등이 합류했습니다. 교육환경에 더해 임금·연금·생활비가 집회의 쟁점이 됐습니다.',stat:'전국 참가자: 정부 55만명 / 주최 측 80만명',center:[2.2,46.8],width:1000,height:1000,primary:'paris',records:{paris:{date:'10월 17일',text:'레퓌블리크 광장에 모인 시위대가 도심을 행진했습니다.\n학생과 노동조합, 노란 조끼 활동가 등이 참여했습니다.',who:'학생·노동조합·노란 조끼 활동가 등',demand:'교육환경·생활비·임금·연금',photo:'paris-oct17.jpg',caption:'파리 · 10월 17일 · AP/뉴시스',alt:'파리의 생활비 상승 반대 시위에서 프랑스 국기를 든 참가자',source:'NISX20261018_0003830169'},lyon:{date:'10월 17일',text:'학생들의 공교육 개선 요구에 연대하며 생활비 상승에 항의하는 집회가 열렸습니다.',who:'교육 개선에 연대하는 집회 참가자',demand:'공교육 개선·생활비 부담 완화',photo:'lyon-oct17.jpg',caption:'리옹 · 10월 17일 · AP/뉴시스',alt:'리옹의 생활비 상승 반대 시위에서 프랑스 국기를 든 참가자',source:'NISX20261018_0003830169'},marseille:{date:'10월 17일',text:'마르세유도 생활비와 유가 상승에 항의하는 전국 집회에 함께했습니다.',who:'생활비 상승 반대 집회 참가자',demand:'생활비·유가 부담 완화',source:'NISX20261018_0003830169'},nantes:{date:'10월 17일',text:'전국 생활비 항의 집회가 열린 도시 중 하나입니다. 초기 보도에서 내무부는 낭트 참가자를 2만명으로 집계했습니다.',who:'생활비 상승 반대 집회 참가자',demand:'생활비 부담 완화',source:'NISX20261018_0003830159'}}}
];

// City centers only. The records document distinct national protests, not a transmission route.
Object.assign(places.paris,{country:'프랑스',countryKey:'France'});
Object.assign(places,{
 brussels:{name:'브뤼셀',country:'벨기에',countryKey:'Belgium',lon:4.352,lat:50.847},
 milan:{name:'밀라노',country:'이탈리아',countryKey:'Italy',lon:9.19,lat:45.464},
 madrid:{name:'마드리드',country:'스페인',countryKey:'Spain',lon:-3.704,lat:40.417},
 lisbon:{name:'리스본',country:'포르투갈',countryKey:'Portugal',lon:-9.139,lat:38.722},
 athens:{name:'아테네',country:'그리스',countryKey:'Greece',lon:23.73,lat:37.98},
 tirana:{name:'티라나',country:'알바니아',countryKey:'Albania',lon:19.819,lat:41.328}
});
const europeRecords={
 paris:{country:'프랑스',countryKey:'France',date:'10월 17일',demand:'교육환경 개선 + 생활비·연료비 부담 완화',text:'고교생의 교육환경 개선 요구에 노동조합과 시민들이 합류했습니다.',status:'열린 집회 · 전국 참가자 집계는 앞 장면 참조',source:'NISX20261018_0003830169'},
 athens:{photo:'athens-oct20.jpg',caption:'그리스 · 아테네 · 10월 20일 텐트 농성 · AP/뉴시스',alt:'아테네 신타그마 광장에서 주거비에 항의하는 학생들의 텐트',date:'10월 21일',demand:'생활비 부담 완화·교육여건 개선',text:'학생들이 생활비와 교육여건 악화에 항의했습니다. 뉴시스가 인용한 AFP 보도에서 경찰은 아테네 집회에 최소 5,000명이 참여했다고 추산했습니다.',status:'열린 집회 · 프랑스와 다른 국내 교육·주거 여건',source:'NISX20261023_0003838580'},
 brussels:{date:'10월 9일',demand:'교육 개혁·교육 예산 삭감 반대',text:'학생과 교사들이 프랑스어권 지역의 교육 개혁과 예산 삭감에 반대해 모였습니다.',status:'열린 집회 · 해당 날짜의 뉴시스 사진 설명 기준',source:'NISX20261022_0003836934'},
 milan:{date:'10월 17일',demand:'생활비 부담 완화·임금·공공서비스 개선',text:'높아진 물가와 낮은 임금에 항의했습니다. 평화롭게 시작한 행진 뒤 일부의 폭력과 경찰 충돌도 벌어졌습니다.',status:'열린 집회 · 일부 폭력 가담자와 전체 참가자는 구분',source:'NISX20261019_0003831422'},
 madrid:{date:'10월 17일',demand:'주거비 부담 완화·세입자 보호',text:'마드리드 푸에르타델솔 광장에서는 높은 주거비 부담에 항의하며 세입자 보호를 요구하는 텐트 농성이 열렸습니다.',background:'스페인·포르투갈의 대도시에서는 임대료 부담으로 월급을 받아도 집을 빌려 살기 어렵다는 호소가 나왔습니다. 스페인 파업 지지 단체들은 임대료 제한과 공공주택 확대, 관광용 임대주택 규제 등을 요구했습니다.',status:'열린 농성 · 11월 11일 총파업은 별도 예고',source:'NISX20261023_0003838663'},
 lisbon:{date:'10월 17일 시작',demand:'주거비·생활비 부담 완화',text:'리스본 로시우 광장에서는 주거비와 생활비 부담에 항의하는 텐트 농성이 열렸습니다. 17일 시작된 농성장은 20일 철거됐습니다.',background:'이 광장은 리스본의 관광 중심지입니다. 뉴시스는 포르투갈의 집값 급등 여파가 젊은 층과 수도권 거주자에게 집중됐다고 전했습니다.',contextSource:'NISX20261019_0003831422',contextLabel:'뉴시스 · 리스본의 주거비 부담 ↗',status:'열린 농성 · 스페인과 공동 파업 참여는 23일 보도 기준 미정',followSource:'NISX20261023_0003838663',source:'NISX20261022_0003836934'},
 tirana:{date:'10월 18일',demand:'부패 척결·일자리·교육환경 개선',text:'학생들이 반정부 시위에 합류했습니다. 리조트 개발 반대 운동 등 자국의 계기가 있습니다.',status:'열린 집회 · 프랑스 학생 시위와 출발 계기가 다름',source:'NISX20261019_0003831053'}
};


Object.assign(europeRecords.brussels,{photo:'brussels-oct9.jpg',caption:'브뤼셀 · 10월 9일 · AP/뉴시스',alt:'교육 개혁과 예산 삭감에 반대하며 행진하는 브뤼셀의 학생과 교사들'});
Object.assign(europeRecords.milan,{photo:'milan-oct17.jpg',caption:'밀라노 · 10월 17일 · AP/뉴시스',alt:'밀라노 생활비 항의 시위 현장에서 대치하는 경찰과 시위대'});
Object.assign(europeRecords.madrid,{photo:'madrid-oct17.jpg',caption:'마드리드 · 10월 17일 · AP/뉴시스',alt:'마드리드 푸에르타델솔 광장에 설치된 세입자 보호 요구 텐트들'});
Object.assign(europeRecords.tirana,{photo:'tirana-oct18.jpg',caption:'티라나 · 10월 18일 · AP/뉴시스',alt:'알바니아 티라나의 반정부 집회에서 대치하는 경찰과 시위대'});

// The Barcelona report describes French influence as reported, with organizers still under investigation.
Object.assign(places,{barcelona:{name:'바르셀로나',country:'스페인',countryKey:'Spain',lon:2.173,lat:41.385}});
europeRecords.barcelona={date:'10월 24일',demand:'경찰은 "구체적인 요구가 없었다"고 설명',text:'SNS 참여 요청으로 모인 청년들이 카탈루냐 광장 일대에서 경찰과 충돌했습니다. 뉴시스는 프랑스 청년 시위의 영향을 받은 것으로 전했습니다. 경찰은 128명을 체포했다고 밝혔으며, 당국은 조직 주체와 가담 경위를 조사 중입니다.',status:'경찰 발표: 128명 체포 · 조직 주체·가담 경위 조사 중',source:'NISX20261026_0003840275'};
const europeSequence=['brussels','milan','madrid','tirana','barcelona'];
const closingVoice={text:'시위는 우리의 요구에 대한 답을 얻을 때 비로소 끝날 것',attribution:'10월 24일 집회의 익명 10대 참가자 · 뉴시스 25일 보도',source:'NISX20261025_0003840125'};

periods.push({label:'유럽',date:'2026년 10월 · 도시별 날짜',title:'유럽, 서로 다른 거리의 요구',context:'각국의 집회는 계기와 요구가 다릅니다. 바르셀로나 24일 집회는 프랑스 청년 시위의 영향을 받은 것으로 보도됐으며 조직 주체 등은 조사 중입니다.',stat:'뉴시스 10월 19~26일 보도. 예정·논의·조사 중인 내용은 열린 집회와 구분.',center:[5.5,45],width:2050,height:1500,primary:'paris',records:Object.fromEntries(Object.entries(europeRecords).map(([id,r])=>[id,{date:r.date,who:id==='barcelona'?'청년 참가자 등':id==='brussels'?'학생·교사':id==='paris'?'학생·노동조합·시민 등':id==='tirana'?'학생·반정부 시위대':id==='athens'?'학생 등':'시민·노동자 등',demand:r.demand,text:id==='barcelona'?r.text:r.text+' '+(r.background||'')+' '+(r.followSource?'':r.status),source:r.source,contextSource:r.contextSource,contextLabel:r.contextLabel,photo:r.photo,caption:r.caption,alt:r.alt}]))});


// Uploaded NEWSIS originals; dates are taken from source captions, not upload filenames.
periods[2].records.lille.photos=[
 {photo:'lille.jpg',caption:'릴 · 10월 1일 · AP/뉴시스',alt:'졸업장을 원하고 범죄수사대는 원하지 않는다는 팻말을 든 학생',source:'NISX20261007_0003816508'},
 {photo:'lille-oct1-street.jpg',caption:'릴 · 10월 1일 · 불붙은 쓰레기통 너머 대치하는 경찰과 시위대 · AP/뉴시스',alt:'릴 거리의 불붙은 쓰레기통 너머에서 경찰과 시위대가 대치하고 있다',text:'팻말 사진과 같은 10월 1일, 릴에서 촬영한 다른 장면입니다.\n불붙은 쓰레기통 너머로 시위대와 경찰이 대치하고 있습니다.',source:'NISX20261002_0003812822'}
];
Object.assign(europeRecords.paris,{photo:'paris-oct17.jpg',caption:'파리 · 10월 17일 · AP/뉴시스',alt:'생활비 상승에 항의하는 파리의 집회에서 프랑스 국기를 든 참가자'});
Object.assign(periods[5].records.paris,{photo:europeRecords.paris.photo,caption:europeRecords.paris.caption,alt:europeRecords.paris.alt});
periods.push(
 {label:'10.8',date:'10월 8일',title:'학생 곁에 모인 사람들',context:'교육환경 개선을 요구한 학생들의 시위에 대학생과 학부모, 교사, 노동조합 등이 합류했습니다.',stat:'사진 촬영일: 10월 8일 / 보도: 10월 25일',center:[2.352,48.857],width:500,height:450,primary:'paris',records:{paris:{date:'10월 8일',text:'파리의 교육환경 개선 집회에서 한 참가자가 프랑스 국기를 흔들고 있습니다. 뉴시스는 고교생들의 시위에 대학생과 학부모, 교사, 공무원 노조 등이 합류했다고 전했습니다.',who:'학생·학부모·교사·노동조합 등',demand:'교육환경 개선',photo:'paris-oct8.jpg',caption:'파리 · 10월 8일 · AP/뉴시스',alt:'파리의 교육환경 개선 집회에서 프랑스 국기를 흔드는 참가자와 군중',source:'NISX20261025_0003839953'}}},
 {label:'10.18',date:'10월 18일',title:'행진 다음 날의 거리',context:'대다수의 평화적 행진과 일부 지역의 폭력·피해를 구분해 봅니다. 사진은 17일 집회 다음 날 촬영한 파리의 차량 피해입니다.',stat:'이 사진은 18일 파리의 피해 한 곳을 보여줍니다.',center:[2.352,48.857],width:500,height:450,primary:'paris',records:{paris:{date:'10월 18일',text:'파리 거리에 전날 시위로 불탄 자동차가 뒤집혀 있습니다.\n17일 집회에서 대다수는 평화적으로 행진했지만\n일부 지역에서는 방화·약탈과 경찰 충돌이 벌어졌습니다.',who:'집회 다음 날 파리 거리',demand:'전날 집회: 교육환경·생활비 개선',photo:'paris-oct18-aftermath.jpg',caption:'파리 · 10월 18일 · 전날 시위로 불탄 차량 · AP/뉴시스',alt:'파리 거리에서 전날 시위로 불에 탄 채 뒤집힌 자동차',source:'NISX20261020_0003833414'}}},
 {label:'10.24',date:'10월 24일',title:'일주일 뒤, 다시 거리로',context:'교육과 생활비 문제를 둘러싼 집회가 다음 주말에도 이어졌습니다. 27일 후속 보도는 전주보다 폭력 행위가 줄었다고 전했습니다. 체포 집계는 전국 수치이며 도시별 기록에 합산하지 않습니다.',stat:'24일 전국 참가자: 정부 41만명 / 주최 측 80만명 · 체포 1435명(27일 후속 보도)',center:[2.5,46.8],width:950,height:1000,primary:'paris',records:{paris:{date:'10월 24일',text:'파리 도심에 고물가 개선을 요구하는 시위대가 모였습니다. 뉴시스가 전한 청년 참가자들은 정부에 대한 실망과 소외감을 호소하며 요구에 대한 답을 원한다고 말했습니다. 학생단체 등은 행진 제한이 집회 권리를 침해한다고 비판했습니다. 정부는 폭력 시위대에 강경 대응한다는 방침을 밝혔습니다.\n28일 후속 보도에 따르면 정부는 이 집회를 앞두고 SNS·모바일 인터넷 차단을 논의했으나 실제로 시행하지 않았습니다.',who:'청년·시민 등 집회 참가자',demand:'교육환경·생활비 개선',photo:'paris-oct24.jpg',caption:'파리 · 10월 24일 · AP/뉴시스',alt:'파리 도심을 가득 메운 고물가 개선 요구 시위대',source:'NISX20261025_0003840125',contextSource:'NISX20261028_0003843939',contextLabel:'뉴시스 · 24일 집회 전 접속 차단 검토 ↗'},lyon:{date:'10월 24일',text:'리옹의 시위 참가자가 프랑스 국기를 들고 있습니다. 2일과 17일 사진에 이어 같은 도시에서 24일에도 시위가 열린 사실을 보여줍니다. 같은 참가자의 전후 사진은 아닙니다.',who:'집회 참가자',demand:'생활비·공공서비스 개선',photo:'lyon-oct24.jpg',caption:'리옹 · 10월 24일 · AP/뉴시스',alt:'리옹의 시위 현장에서 프랑스 국기를 든 참가자',source:'NISX20261025_0003839845'}}}
);


// A damage/investigation case, not a separately counted demonstration.
places.limoges={name:'리모주',country:'프랑스',countryKey:'France',lon:1.262,lat:45.835};
const limogesCasePeriod=periods.length;
periods.push({label:'리모주',date:'10월 중순 · 피해·수사 기록',title:'시청 화재, 확인된 것과 수사 중인 것',context:'17일 집회가 열린 주말의 피해를 별도로 봅니다. 정확한 화재 일시와 가담 동기를 지도에서 재구성하지 않았습니다.',stat:'피해·수사 기록 · 집회 횟수에서 제외',center:[1.262,45.835],width:400,height:460,primary:'limoges',records:{limoges:{isCase:true,date:'10월 중순',text:'뉴시스는 리모주 시청 방화로 첨탑이 무너졌다고 보도했습니다. 21일 보도에 따르면 34세 남성이 방화 관여 혐의로 체포됐으며, 검찰의 구체적인 수사 결과는 공개되지 않았습니다.',who:'리모주 시청 방화',demand:'21일 보도 기준 구체적 수사 결과 미공개',source:'NISX20261025_0003839953',contextSource:'NISX20261021_0003835226',contextLabel:'뉴시스 · 방화 혐의자 수사 보도 ↗'}}});

const escalationFrames=[
 {title:'합의 없이<br><em>끝난 만남</em>',label:'10월 2일 · 학생단체–교육장관 회동',source:'NISX20261007_0003816508',sourceLabel:'뉴시스 · 협상과 전국 행동 ↗',moreSource:'NISX20261008_0003819026',moreLabel:'뉴시스 · 교육예산과 나라 살림 ↗'},
 {title:'물대포 앞의<br><em>시위대</em>',label:'렌 · 10월 6일 현장',source:'NISX20261008_0003819026',sourceLabel:'뉴시스 · 렌의 현장과 경찰 대응 ↗',moreSource:'NISX20261025_0003839953',moreLabel:'뉴시스 · 초기 충돌부터 전국 시위까지 ↗'},
 {title:'진압 논란,<br><em>대비 실패</em>',label:'10월 8·19일 보도 · 정부 대응',source:'NISX20261008_0003819026',sourceLabel:'뉴시스 · 섬광 수류탄 사용 중단 ↗',moreSource:'NISX20261019_0003832208',moreLabel:'뉴시스 · 내무장관의 대비 실패 인정 ↗'},
 {title:'폭력의 배후,<br><em>확인됐을까?</em>',label:'10월 20일 보도 · 정부 주장 / 검찰 설명',source:'NISX20261020_0003833159',sourceLabel:'뉴시스 · "극좌 배후" 주장과 검찰 설명 ↗',moreSource:'NISX20261021_0003835226',moreLabel:'뉴시스 · 블랙 블록과 전문가 해석 ↗',limit:'블랙 블록은 집단 행동의 전술을 가리키는 말입니다. 정부의 지목이나 전문가의 해석만으로 개별 가담자의 동기를 확정할 수는 없습니다.'},
 {title:'빼앗긴 물건은<br><em>어디로 갔을까</em>',label:'10월 21·22일 보도 · 약탈과 재판매 정황',source:'NISX20261022_0003837245',sourceLabel:'뉴시스 · 중고 사이트의 약탈 의심품 ↗',moreSource:'NISX20261021_0003835776',moreLabel:'뉴시스 · 일부 약탈 방식에 관한 설명 ↗',limit:'사진은 18일의 상점 피해입니다. 지나가는 사람을 가담자로 지목한 것이 아닙니다. 모든 시위 참가자나 판매품에 해당하는 설명도 아닙니다.'}
];

// A curated history of records used in this work, not a census of all protests.
const cityTimelines={
 limoges:[{label:'10월 중순',date:null,kind:'damage',title:'시청 방화·첨탑 붕괴',note:'피해 기록 · 집회 집계에서 제외',source:'NISX20261025_0003839953'}],
 creteil:[{label:'9월',date:null,kind:'protest',title:'교직원 파업·학생들의 학교 봉쇄',note:'시작일은 보도마다 달라 월 단위로 표시',source:'NISX20261007_0003816508'}],
 lille:[
  {label:'9월 29일',date:'2026-09-29',kind:'protest',title:'긴축 예산 반대 행진',source:'NISX20260930_0003809025'},
  {label:'10월 1일',date:'2026-10-01',kind:'protest',title:'학교 지원 확대 요구 · BAC 팻말',source:'NISX20261007_0003816508'},
  {label:'10월 22일',date:'2026-10-22',kind:'protest',title:'학생·청년의 생활 여건 항의 행진',source:'NISX20261023_0003837712'}
 ],
 lyon:[
  {label:'10월 2일',date:'2026-10-02',kind:'protest',title:'학교 환경 개선 요구',source:'NISX20261007_0003816508'},
  {label:'10월 17일',date:'2026-10-17',kind:'protest',title:'공교육 개선 연대·생활비 항의',source:'NISX20261018_0003830169'},
  {label:'10월 22일',date:'2026-10-22',kind:'protest',title:'학생·청년의 생활 여건 항의 집회',source:'NISX20261023_0003837712'},
  {label:'10월 24일',date:'2026-10-24',kind:'protest',title:'생활비·공공서비스 개선 요구',source:'NISX20261025_0003839845'}
 ],
 marseille:[
  {label:'10월 초',date:null,kind:'protest',title:'학교 환경에 항의한 학생 시위',note:'해당 기록의 정확한 날짜는 미확정',source:'NISX20261007_0003816508'},
  {label:'10월 17일',date:'2026-10-17',kind:'protest',title:'생활비·유가 상승 항의',source:'NISX20261018_0003830169'},
  {label:'10월 22일',date:'2026-10-22',kind:'protest',title:'학생·청년의 생활 여건 항의 집회',source:'NISX20261023_0003837712'}],
 rennes:[{label:'10월 6일',date:'2026-10-06',kind:'protest',title:'교육 자원 확충 요구',source:'NISX20261008_0003819026'},{label:'10월 13일',date:'2026-10-13',kind:'protest',title:'교육환경 개선 요구 집회',source:'NISX20261019_0003831130'}],
 paris:[
  {label:'10월 7일',date:'2026-10-07',kind:'protest',title:'학교 앞 교육환경 개선 요구',source:'NISX20261008_0003819026'},
  {label:'10월 8일',date:'2026-10-08',kind:'protest',title:'학생·학부모·교사 등의 연대 집회',source:'NISX20261025_0003839953'},
  {label:'10월 13일',date:'2026-10-13',kind:'protest',title:'교육환경 개선 요구 행진',source:'NISX20261019_0003831130'},
  {label:'10월 17일',date:'2026-10-17',kind:'protest',title:'교육환경·생활비 개선 집회',source:'NISX20261018_0003830169'},
  {label:'10월 18일',date:'2026-10-18',kind:'aftermath',title:'전날 시위로 불탄 차량 사진',source:'NISX20261020_0003833414'},
  {label:'10월 22일',date:'2026-10-22',kind:'protest',title:'금지 명령 취소 뒤 열린 평화적 정지 집회',source:'NISX20261023_0003837712'},
  {label:'10월 24일',date:'2026-10-24',kind:'protest',title:'고물가 개선 요구 집회',source:'NISX20261025_0003840125'}
 ],
 nantes:[{label:'10월 17일',date:'2026-10-17',kind:'protest',title:'생활비 상승 항의 집회',source:'NISX20261018_0003830159'},
  {label:'10월 22일',date:'2026-10-22',kind:'protest',title:'학생·청년의 생활 여건 항의 집회',source:'NISX20261023_0003837712'}],
 athens:[{label:'10월 21일',date:'2026-10-21',kind:'protest',title:'교육여건·생활비 부담 항의 집회',source:'NISX20261023_0003838580'}],
 brussels:[{label:'10월 9일',date:'2026-10-09',kind:'protest',title:'교육 개혁·교육 예산 삭감 반대',source:'NISX20261022_0003836934'}],
 milan:[{label:'10월 17일',date:'2026-10-17',kind:'protest',title:'생활비·임금·공공서비스 개선 요구',source:'NISX20261019_0003831422'},{label:'10월 24일',date:'2026-10-24',kind:'protest',title:'학생·시민단체 등의 행진 · 큰 충돌 없이 종료',source:'NISX20261025_0003839745'}],
 madrid:[{label:'10월 17일',date:'2026-10-17',kind:'protest',title:'세입자 보호 요구 텐트 농성',source:'NISX20261023_0003838663'}],
 lisbon:[{label:'10월 17일 시작',date:'2026-10-17',kind:'camp',title:'주거비·생활비 항의 텐트 농성',note:'20일 농성장 철거 · 시작일을 한 번만 집계',source:'NISX20261022_0003836934'}],
 tirana:[{label:'10월 18일',date:'2026-10-18',kind:'protest',title:'학생들이 합류한 반정부 집회',source:'NISX20261019_0003831053'}],
 barcelona:[{label:'10월 24일',date:'2026-10-24',kind:'protest',title:'SNS로 모인 청년들의 집회',note:'조직 주체·참가 경위는 조사 중',source:'NISX20261026_0003840275'}]
};
// National resource observations and a separately attributed regional analysis.
// These are not city poverty scores or participant residence data.
const educationFrames=[
 {kind:'analysis',title:'같은 수도권,<br><em>같은 학교일까?</em>',scope:'파리 외곽 · 보도에서 짚은 맥락',facts:[{value:'불평등·차별',label:'교육 문제에서 넓어진 논쟁'}],credit:'뉴시스가 소개한 김지윤 박사 분석 · 10월 18일 보도',source:'NISX20261014_0003825864'},
 {kind:'fiscal',title:'더 써달라는 거리,<br><em>빚을 줄이라는 시장</em>',scope:'프랑스 전체 · 재정의 제약',facts:[{value:'119%',label:'1년간 생산 규모(GDP) 대비 공공부채 · 2026년 2분기'}],credit:'뉴시스 9월 29일 부채 보도 · 10월 21일 재정 분석',source:'NISX20261021_0003834565'}
];
const fiscalContext={ratio:119,asOf:'2026년 2분기',label:'GDP 대비 공공부채',source:'NISX20260929_0003807804'};

function summarizeTimeline(rows){
 const dates=new Set(),undated=new Set();let followups=0;
 for(const row of rows){
  if(!['protest','camp'].includes(row.kind)){followups++;continue}
  if(row.date&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&row.date<=reportDataAsOf)dates.add(row.date);
  else if(!row.date)undated.add(row.label+'|'+row.title);
 }
 return{days:dates.size,undated:undated.size,followups};
}

const endingFrames=[
 {title:'교원·시설 확충,<br><em>정부의 교육 대책</em>',label:'정부가 내놓은 교육 대책',source:'NISX20261019_0003831053',sourceLabel:'뉴시스 · 교사 충원·학생 참여 ↗',moreSource:'NISX20261008_0003819026',moreLabel:'뉴시스 · 시설·시간표 개선 ↗'},
 {title:'부수지 않았어도<br><em>함께 배상?</em>',label:'10월 26일 보도 · 법안 추진',source:'NISX20261026_0003840897',sourceLabel:'뉴시스 · 기물파손 연대배상 법안 논란 ↗',limit:'보도 당시 추진 중인 법안입니다. 제정·시행된 법으로 설명하지 않습니다.'},
 {title:'폭력의 책임,<br><em>학교의 숙제</em>',label:'다시, 학교로',source:'NISX20261025_0003840125',sourceLabel:'뉴시스 · 청년들이 시위를 이어가는 이유 ↗',moreSource:'NISX20261025_0003839953',moreLabel:'뉴시스 · 작은 학생 시위가 커진 과정 ↗'}
];
// The October 18 shop image is an aftermath record, never an additional gathering.
periods[7].records.paris.photos=[
 {...periods[7].records.paris},
 {photo:'paris-shop-oct18.jpg',caption:'파리 · 10월 18일 · 약탈당한 상점 · AP/뉴시스',alt:'깨진 유리창과 쓰레기가 남은 파리 상점 앞을 여성이 개와 함께 지나고 있다',text:'18일 파리에 남은 상점 피해입니다. 22일 보도는 약탈 의심품이 중고 사이트에 나타났고 빈티드가 관련 게시물을 삭제했다고 전했습니다. 사진 속 행인을 가담자로 지목하는 설명은 아닙니다.',source:'NISX20261022_0003837245'}
];
europeRecords.milan.followSource='NISX20261025_0003839745';
europeRecords.milan.followup='24일 밀라노에서는 약 1만명이 행진했고, 큰 충돌 없이 끝났다고 보도됐습니다.';
periods[5].records.milan.contextSource='NISX20261025_0003839745';
periods[5].records.milan.contextLabel='뉴시스 · 24일 밀라노 집회 ↗';
periods[5].records.milan.text+=' 24일 밀라노에서는 약 1만명이 행진했고 큰 충돌 없이 끝났다고 보도됐습니다.';

europeRecords.milan.status='17일 일부 충돌 · 24일 약 1만명 행진은 큰 충돌 없이 종료';
europeRecords.milan.followLabel='뉴시스 · 24일 밀라노 집회 ↗';

// The reporting cutoff is separate from planned actions, which are never counted.
const reportDataAsOf='2026-11-05';
places.frankfurt={name:'프랑크푸르트',country:'독일',countryKey:'Germany',lon:8.6821,lat:50.1109};
places.toulouse={name:'툴루즈',country:'프랑스',countryKey:'France',lon:1.4442,lat:43.6047};
const halloweenPeriod=periods.length;
periods.push({
 label:'10.31',date:'10월 31일',title:'규모는 줄었지만, 이어진 요구',
 context:'세 번째 토요 집회. 대체로 평화롭게 진행된 행진과 일부 현장의 충돌을 구분합니다. 11월 1일 밤 후속 보도까지 반영했습니다.',
 stat:'전국 참가자: 내무부 32만명 / 청년단체·노조 50만명 · 체포 779명(1일 후속 집계)',
 center:[2.5,46.8],width:1000,height:1000,primary:'paris',records:{
  paris:{date:'10월 31일',who:'고교생·노동조합·기후운동가 등',demand:'교육 여건·생활비 개선',
   text:'내무부는 전국 32만명, 청년단체와 노동조합은 50만명이 참가했다고 집계했습니다. 두 수치는 전국 단위이며 파리 참가자 수가 아닙니다. 행진은 대체로 평화로웠지만 샤랑통 문 부근에서 일부 참가자와 경찰이 충돌했습니다. 11월 1일 후속 보도는 체포 인원을 779명으로 전했습니다. 검찰의 폭발물 투척 관련 살인미수 혐의 조사는 유죄 판단과 구분합니다.',
   photo:'paris-oct31.jpg',caption:'파리 · 2026.10.31 · 핼러윈 가면을 쓴 집회 참가자 · AP/뉴시스',alt:'10월 31일 파리의 교육·생활비 항의 집회에서 경찰 사이로 보이는 핼러윈 가면을 쓴 참가자',
   source:'NISX20261101_0003849471',contextSource:'NISX20261101_0003849998',contextLabel:'뉴시스 · 1일 밤 체포·수사 후속 보도 ↗'},
  lyon:{date:'10월 31일',who:'집회 참가자',demand:'교육·생활비 관련 전국 행동',text:'11월 1일 보도는 리옹에서도 31일 집회 중 충돌이 있었다고 전했습니다. 프랑스 전체 참가자·체포 수를 리옹 수치로 표시하지 않습니다.',source:'NISX20261101_0003849471'},
  toulouse:{date:'10월 31일',who:'집회 참가자',demand:'교육·생활비 관련 전국 행동',text:'11월 1일 보도는 툴루즈에서도 충돌이 있었다고 전했습니다. 정확한 집회 장소와 경로는 재구성하지 않습니다.',source:'NISX20261101_0003849471'}
 }
});
const europeHalloweenPeriod=periods.length;
periods.push({
 label:'유럽 10.31',date:'10월 31일 · 유럽',title:'다른 나라, 서로 다른 요구',
 context:'독일 청년들의 학교·기후·징병제 문제와 리스본의 주거 요구를 구분합니다. 독일의 16만명은 사전 등록, 12만명은 주최 측의 사후 참가 집계입니다.',
 stat:'독일: 주최 측 전국 약 12만명 · 경찰 공식 집계 미확인',center:[5,47],width:2000,height:1700,primary:'frankfurt',records:{
  frankfurt:{date:'10월 31일',who:'청년단체 Gen Z regelt 등',demand:'학교·기후 보호 지원, 고물가 대책, 징병제 부활 반대',
   text:'독일 약 34개 도시에서 청년들이 집회를 열었습니다. 주최 측은 전국 약 12만명이 참여했다고 집계했으며 경찰 공식 집계는 확인되지 않았습니다. 16만명은 집회 전 웹사이트에 참여 의사를 등록한 수치입니다. 사진은 프랑크푸르트의 한 현장이며 전국 인원을 이 도시의 규모로 읽지 않습니다.',
   photo:'frankfurt-oct31.jpg',caption:'독일 · 프랑크푸르트 · 2026.10.31 · AP/뉴시스',alt:'10월 31일 독일 프랑크푸르트의 시위에서 분홍색 복장으로 북을 연주하며 모여드는 참가자들',source:'NISX20261101_0003849471',contextSource:'NISX20261031_0003849178',contextLabel:'뉴시스 · 집회 전 등록·예고 보도 ↗'},
  lisbon:{date:'10월 31일',who:'주거 문제 집회 참가자',demand:'주택난 해소',text:'리스본에서는 수천명이 주택난에 항의했습니다. 앞선 17일 시작 농성과 구분되는 31일의 집회 기록입니다.',source:'NISX20261101_0003849471'}
 }
});
cityTimelines.paris.push(
 {label:'10월 31일',date:'2026-10-31',kind:'protest',title:'교육·생활비 항의 · 대체로 평화, 일부 충돌',source:'NISX20261101_0003849471'},
 {label:'11월 1일 후속',date:'2026-11-01',kind:'investigation',title:'폭발물 투척 관련 살인미수 혐의 조사',note:'수사 중 · 별도 집회로 집계하지 않음',source:'NISX20261101_0003849998'}
);
cityTimelines.lyon.push({label:'10월 31일',date:'2026-10-31',kind:'protest',title:'전국 행동 중 충돌 보도',source:'NISX20261101_0003849471'});
cityTimelines.toulouse=[{label:'10월 31일',date:'2026-10-31',kind:'protest',title:'전국 행동 중 충돌 보도',source:'NISX20261101_0003849471'}];
cityTimelines.frankfurt=[{label:'10월 31일',date:'2026-10-31',kind:'protest',title:'청년들의 학교·생활·기후·징병제 요구',note:'전국 참가 규모를 이 도시의 수치로 표시하지 않음',source:'NISX20261101_0003849471'}];
cityTimelines.lisbon.push({label:'10월 31일',date:'2026-10-31',kind:'protest',title:'수천명의 주택난 항의 집회',source:'NISX20261101_0003849471'});
cityTimelines.milan.push({label:'10월 25~26일',date:null,kind:'damage',title:'기물 파손·약탈 등 소요 보도',note:'피해·소요 후속 기록 · 날짜별 집회 횟수로 환산하지 않음',source:'NISX20261031_0003849178'});
periods[5].records.milan.text+=' 31일 보도는 25~26일의 별도 소요와 군인 500명 파견 방침, 매장들의 예방적 폐점을 전했습니다. 24일 행진의 종료 양상과 이후의 사건은 구분합니다.';
periods[5].records.milan.contextSource='NISX20261031_0003849178';
periods[5].records.milan.contextLabel='뉴시스 · 25~26일 소요와 후속 치안 대책 ↗';

// Interpret the demands using the existing NEWSIS report; no outside citation link.
periods[europeHalloweenPeriod].records.frankfurt.text+=' 학교·기후 지원 확대와 징병제 반대를 함께 내건 요구는 공공정책의 우선순위와 청년이 감당할 부담이라는 질문으로 읽을 수 있습니다. 이는 편집상의 해석입니다. 뉴시스는 독일 집회가 전반적으로 평화로웠지만 쾰른과 프랑크푸르트에서 일부 충돌이 있었다고 전했습니다. 사진 속 인물의 가담 여부를 보여주는 자료는 아닙니다.';

// 2 November reporting: scopes, injuries and separate post-gathering events.
const nov2Sources={europe:'NISX20261102_0003850591',schools:'NISX20261102_0003850275',investigation:'NISX20261102_0003850264'};
periods[halloweenPeriod].context='세 번째 토요 집회. 전반적으로 줄어든 폭력과 일부 현장의 피해를 함께 봅니다. 779명은 집회·핼러윈 야간 단속 등을 포함한 전국 체포 집계입니다.';
periods[halloweenPeriod].stat='전국 참가자: 내무부 32만명 / 청년단체·노조 50만명 · 체포 779명(집회·핼러윈 단속 등 포함)';
Object.assign(periods[halloweenPeriod].records.paris,{
 text:'내무부 전국 참가자 32만명, 청년단체·노조 50만명. 11월 2일 보도는 집회·핼러윈 야간 단속 등을 포함한 전국 체포가 779명이라고 설명했습니다. 치안 인력 부상은 159명으로 발표됐습니다. 검찰은 경찰·헌병 15명이 폭발물에 맞았고 2도 화상 부상자도 있다며 살인미수 혐의 수사를 밝혔습니다. 혐의 조사와 유죄 판단은 다릅니다.',
 contextSource:nov2Sources.investigation,contextLabel:'뉴시스 · 피해 집계와 폭발물 사건 수사 후속 ↗'
});
periods[8].stat='24일 전국 참가자: 정부 41만명 / 주최 측 80만명';
periods[europeHalloweenPeriod].records.frankfurt.text+=' 11월 2일 후속 보도는 프랑크푸르트에서 경찰관 100명 이상이 다치고 13~29세 54명이 붙잡혔다고 전했습니다. 상점 17곳이 파손됐고 그중 5곳에 약탈 피해가 있었습니다. 참가자 부상 규모는 확인되지 않았으며 주최 측은 폭력과 거리를 둔다고 밝혔습니다.';
periods[europeHalloweenPeriod].records.frankfurt.contextSource=nov2Sources.europe;
periods[europeHalloweenPeriod].records.frankfurt.contextLabel='뉴시스 · 행진 뒤 충돌·상점 피해 후속 보도 ↗';
cityTimelines.frankfurt.push({label:'11월 2일 후속 보도',date:'2026-11-02',kind:'damage',title:'31일 행진 뒤 경찰 부상·상점 피해',note:'후속 피해 집계 · 별도 집회로 집계하지 않음',source:nov2Sources.europe});
cityTimelines.paris[cityTimelines.paris.length-1]={label:'11월 2일 후속 보도',date:'2026-11-02',kind:'investigation',title:'폭발물 투척 살인미수 혐의 수사·피해 집계',note:'수사 중 · 집회와 핼러윈 단속 집계를 구분',source:nov2Sources.investigation};

places.rome={name:'로마',country:'이탈리아',countryKey:'Italy',lon:12.4964,lat:41.9028};
places.porto={name:'포르투',country:'포르투갈',countryKey:'Portugal',lon:-8.611,lat:41.1496};
const europeFollowupPeriod=periods.length;
periods.push({
 label:'유럽 후속',date:'10월 30일~11월 1일',title:'총파업과 주거 농성, 그 이후',
 context:'이탈리아의 30일 총파업과 포르투갈의 31일 행진·1일 농성장 철거 및 항의 집회는 서로 다른 사건입니다. 날짜와 집계 주체를 구분합니다.',
 stat:'이탈리아 전국 참가자: 내무부 25만5000명 / USB 노조 약 150만명 · 11월 2일 보도',center:[4,43],width:2200,height:1800,primary:'rome',records:{
  rome:{date:'10월 30일',who:'노동자·대학생·고교생 등',demand:'생활비·주거 부담 완화, 군비 확대 반대',
   text:'전국 60여곳의 총파업과 집회에 USB 노조는 약 150만명, 내무부는 25만5000명이 참여했다고 추산했습니다. 두 수치 모두 이탈리아 전국 집계입니다. 대부분 평화롭게 끝났지만 로마·토리노·비첸차에서 일부 충돌이 보도됐습니다.',
   photo:'rome-oct30.jpg',caption:'이탈리아 · 로마 · 2026.10.30 · AP/뉴시스',alt:'10월 30일 로마의 전국 총파업 집회에서 깃발을 흔들고 확성기로 구호를 외치는 참가자들',source:nov2Sources.europe},
  lisbon:{date:'10월 31일~11월 1일',who:'주거 문제 집회 참가자',demand:'주거비 부담 완화·임대차 법안 철회',
   text:'31일 행진 뒤 호시우 광장에 텐트가 세워졌고 1일 새벽 경찰이 농성장을 철거했습니다. 리스본 6명·포르투 7명이 해산 명령 불응 혐의로 체포됐다는 보도입니다. 경찰관 부상은 13명, 리스본 활동가 단체는 참가자 30명 이상 부상을 주장했습니다. 집계 범위와 발표 주체가 달라 합산하지 않습니다. 사진은 1일 해산을 비판하는 집회에서 연주에 맞춰 노래하는 시민들입니다.',
   photo:'lisbon-nov1.jpg',caption:'포르투갈 · 리스본 호시우 광장 · 2026.11.1 · AP/뉴시스',alt:'11월 1일 리스본 호시우 광장에서 경찰의 농성장 해산을 비판하며 오케스트라 연주에 맞춰 노래하는 시민들',source:nov2Sources.europe},
  porto:{isCase:true,date:'11월 1일',who:'주거 농성장 해산',demand:'해산 명령 불응 혐의 7명 체포 보도',text:'1일 새벽 경찰이 포르투의 농성장 철거에 나섰습니다. 해산 명령 불응 혐의로 7명이 체포됐다고 보도됐습니다. 새 집회 개최 횟수로 집계하지 않습니다.',source:nov2Sources.europe}
 }
});
cityTimelines.rome=[{label:'10월 30일',date:'2026-10-30',kind:'protest',title:'생활비·주거난·군비 확대 반대 총파업과 집회',note:'참가 규모는 이탈리아 전국 단위 집계',source:nov2Sources.europe}];
cityTimelines.porto=[{label:'11월 1일',date:'2026-11-01',kind:'aftermath',title:'주거 농성장 철거·해산 명령 불응 혐의 체포',note:'해산 후속 기록 · 별도 집회 집계 제외',source:nov2Sources.europe}];
cityTimelines.lisbon.push(
 {label:'11월 1일 새벽',date:'2026-11-01',kind:'aftermath',title:'호시우 광장 농성장 철거와 해산',note:'경찰·활동가 단체의 피해 집계를 구분',source:nov2Sources.europe},
 {label:'11월 1일',date:'2026-11-01',kind:'protest',title:'해산 비판 집회 · 연주에 맞춰 노래하는 시민들',source:nov2Sources.europe}
);
