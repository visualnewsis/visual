/* 명절 잔소리 대작전 — 충무로딩
 * 구조: 설정값·데이터 → 픽셀 그리기 → 캐릭터 설정 → 공통(게이지·대화·소리) → 장면1 마을 → 장면2 큰상 → 엔딩
 * 개인 설정은 메모리에서만 쓰며 서버·분석 도구로 보내지 않는다. (음소거 여부만 localStorage에 저장)
 */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================= 조정 가능한 설정 ================= */
// 엔딩 판정 순서. 앞에 있을수록 우선한다. 특별 엔딩 순서를 바꾸려면 이 배열만 고치면 된다.
const ENDING_PRIORITY = ['hwabyeong', 'rude', 'full', 'together', 'jeonking', 'peace'];
const DANGER = { hp: 30, rep: 20, wt: 70 };          // 위험 안내 기준
const SPECIAL = { togetherHelp: 1, togetherSupport: 3, jeonKingEat: 2, jeonKingShare: 2 };
const QUESTION_COUNT = 7;
const REST_LIMIT = 2;                                  // 큰상에서 "잠깐 쉬기"를 쓸 수 있는 횟수
const JEON_PLATE = 10, JEON_GAIN = 10;                 // 부침개 10장 = 몸무게 증가량 최대
const START = { hp: 100, rep: 60, wt: 0, stress: 0, cheer: 0 };

const SOURCES = [
  ['“지긋지긋 잔소리”…추석때 듣기싫은 말 1위는?', 'https://www.newsis.com/view/NISX20260923_0003802486'],
  ['“취업했니” “결혼은” 요즘도 묻는 사람이 있나….추석 연휴 ‘금기어’', 'https://www.newsis.com/view/NISX20260921_0003798239'],
  ['“37세면 노산인데 괜찮아?”…아내, 임신 축하 대신 쏟아진 잔소리에 눈물', 'https://www.newsis.com/view/NISX20261003_0003813381'],
  ['시부모 잔소리보다 서운한 배우자의 방관…‘명절 파경’ 부르는 결정적 한방', 'https://www.newsis.com/view/NISX20260922_0003799674'],
  ['함익병, 추석 앞두고 “젊은 사람이 어른 비위 맞추는 게 이치” 직설 발언', 'https://www.newsis.com/view/NISX20260925_0003803455'],
];

/* ================= 외형 ================= */
const SKIN = '#f6d3b0';
const LOOKS = {
  female: { hair: '#3b2618', style: 'long', top: '#e8692a', bottom: '#6b4fa0', hanbok: true, ribbon: true },
  male: { hair: '#2b1d14', style: 'short', top: '#3a7bd5', bottom: '#4a3b2a', hanbok: true },
  neutral: { hair: '#4a3020', style: 'cap', cap: '#2f9e6b', top: '#e9b53f', bottom: '#4a5568', hanbok: true },
  spouse: { hair: '#2b1d14', style: 'bob', top: '#6c8ebf', bottom: '#3d3d52', hanbok: true },
  daughter: { hair: '#3b2618', style: 'pigtails', top: '#f28fb0', bottom: '#7a5ca8', scale: .7 },
  son: { hair: '#2b1d14', style: 'short', top: '#5fb88d', bottom: '#3a5a8a', scale: .7 },
  kid: { hair: '#4a3020', style: 'bob', top: '#ffd166', bottom: '#4a6fa5', scale: .7 },
  ijang: { hair: '#c9c9c9', style: 'short', top: '#8a6a43', bottom: '#4a4a4a', glasses: true },
  granny: { hair: '#d8d8d8', style: 'bun', top: '#8e5ba8', bottom: '#5a3d6e', hanbok: true },
  shop: { hair: '#3a2a20', style: 'perm', top: '#d9534f', bottom: '#4a4a4a', apron: true },
  grandpa: { hair: '#bdbdbd', style: 'flatcap', cap: '#6b5a45', top: '#5a7a5a', bottom: '#3d3d3d' },
  bigdad: { hair: '#9a9a9a', style: 'short', top: '#2f3e66', bottom: '#2a2a2a', glasses: true },
  bigmom: { hair: '#2e1f18', style: 'perm', top: '#9b2d3a', bottom: '#4a2a30', hanbok: true },
  aunt: { hair: '#4a2f22', style: 'bob', top: '#3f8f6b', bottom: '#2f4a3f' },
  uncle: { hair: '#1f1712', style: 'short', top: '#c9a03a', bottom: '#4a3b2a' },
  cousin: { hair: '#1f1712', style: 'bob', top: '#1a9aa8', bottom: '#2f3a4a' },
};

/* ================= 인물 ================= */
const NPC = {
  ijang: { name: '이장님', role: '마을 어귀', look: LOOKS.ijang },
  granny: { name: '정자 할머니', role: '정자 그늘', look: LOOKS.granny },
  shop: { name: '구멍가게 사장님', role: '가게 앞', look: LOOKS.shop },
  grandpa: { name: '옆집 할아버지', role: '감나무 집', look: LOOKS.grandpa },
  bigdad: { name: '큰아버지', role: '큰상 가운데', look: LOOKS.bigdad },
  bigmom: { name: '큰어머니', role: '큰상', look: LOOKS.bigmom },
  aunt: { name: '고모', role: '큰상', look: LOOKS.aunt },
  uncle: { name: '작은아버지', role: '큰상', look: LOOKS.uncle },
  cousin: { name: '다온', role: '사촌 · 믿을 만한 친척', look: LOOKS.cousin },
  spouse: { name: '하늘', role: '배우자', look: LOOKS.spouse },
};

/* ================= 대사: 장면 1 마을 ================= */
// 카테고리: minor / jobseeker / worker / nokids / pregnant / kid1 / kids
const VILLAGE = {
  ijang: {
    minor: '어이구, 많이 컸네! 근데 키는 아직 쪼끄맣다? 공부는 잘하고?',
    jobseeker: '왔구나! 그래, 요새 뭐 하고 지내? 아직 취직 전이지?',
    worker: '회사 다닌다며? 이제 국수는 언제 먹여 줄 거여?',
    nokids: '둘이 왔네, 좋을 때다~ 근데 소식은 아직이여?',
    pregnant: '아이고 경사네! 근데 몸은 괜찮어? 나이 있으면 조심해야 혀.',
    kid1: '하나 데리고 왔구먼! 혼자 크면 외로울 텐디.',
    kids: '애들이 줄줄이네! 키우느라 등골 휘겠구먼.',
    deflect: '이장님, 마을 어귀 장승 새로 칠하셨네요? 멋져요!',
    ok: '장승? 아, 그거… 근데 내가 묻는 말엔 대답을 안 했다?',
  },
  granny: {
    minor: '아가, 이리 와 봐. 얼굴이 왜 이리 핼쑥해? 공부만 하지 말고 밥 좀 먹어.',
    jobseeker: '요즘 취직하기 어렵다며? 그래도 눈을 쪼매 낮추면 되지 않겄어?',
    worker: '좋은 사람 있으면 놓치지 말어. 다 때가 있는 법이여.',
    nokids: '아이는 빨리 가질수록 좋은 거여. 내가 다 겪어 봐서 알어.',
    pregnant: '배 모양이 딱 보니 알겠네~ 근데 그 나이에 첫애면 힘들 텐디.',
    kid1: '동생 하나 만들어 줘야지. 형제가 있어야 의지가 되지.',
    kids: { daughters: '딸만 있어서 어쩐댜. 그래도 딸이 살갑긴 하지.', sons: '아들만 있으면 집이 남아나질 않겄네!', mixed: '딸 아들 골고루네~ 그래도 하나 더 낳지 그랴?' },
    deflect: '할머니, 정자 그늘 너무 시원해요~ 무릎은 좀 괜찮으세요?',
    ok: '무릎이야 늘 아프지. 근데 말 돌리지 말고, 아까 그 얘기.',
  },
  shop: {
    minor: '학생 왔네? 군것질 말고 공부에 써야지~ 성적은 좀 올랐어?',
    jobseeker: '우리 조카는 이번에 공기업 붙었다던데, 자기는 어디 준비해?',
    worker: '연봉은 좀 올랐어? 요즘 월급쟁이들 다 힘들다더라.',
    nokids: '애 없을 때 실컷 놀아 둬! 근데 계획은 있는 거지?',
    pregnant: '예정일이 언제여? 어머, 임신하면 커피는 절대 안 돼.',
    kid1: '하나면 돈도 덜 들고 좋지~ 근데 둘째는?',
    kids: '애 키우는 데 돈 많이 들 텐데, 맞벌이는 하는 거지?',
    deflect: '사장님, 식혜 하나 주세요! 올해도 직접 담그셨어요?',
    ok: '식혜야 있지. (따르며) 근데 아까 묻는 말엔 왜 대답을 안 혀? (HP 회복)',
  },
  grandpa: {
    minor: '커서 뭐 될 거냐? 의사? 판사? 그런 걸 해야 효도하는 거다.',
    jobseeker: '공무원이 최고여. 시험 한 번 더 쳐 봐.',
    worker: '회사에서 승진은 했냐? 몇 년 차여?',
    nokids: '집은 샀냐? 집이 있어야 애도 낳지.',
    pregnant: '애 낳으면 회사는 그만둘 거지?',
    kid1: '애가 어째 좀 작다? 잘 먹여야지.',
    kids: '애들 학원은 몇 개씩 보내? 요즘은 다 보낸다던데.',
    deflect: '할아버지 감나무 올해 대풍이네요! 몇 개나 따셨어요?',
    ok: '감이야 잘 열었지. 그래서 아까 그 얘기는?',
  },
};
const VILLAGE_FOLLOW = {
  ijang: '근데 말이여, 다 너 잘되라고 하는 소리여. 어른 말 들어서 손해 볼 거 없어.',
  granny: '에휴, 내가 오래 살아 봐서 하는 말이여. 나중에 후회 말고.',
  shop: '아니 뭐, 난 걱정돼서 그러지~ 다른 집 애들은 다 잘만 하던데.',
  grandpa: '요즘 것들은 어른이 말하면 듣는 척도 안 혀. 쯧.',
};
const VILLAGE_SOFT ='왔구나! 오랜만이네. 요즘은 어떻게 지내?';
const VILLAGE_REPEAT = { ijang: '큰집은 저 개울 건너 골목 끝이여~', granny: '정자 마루에 앉아 쉬었다 가도 돼.', shop: '오가는 길에 또 들러~', grandpa: '대문은 저 위 오른쪽이여.' };

/* ================= 대사: 장면 2 큰상 ================= */
// sens: 임신·출산·자녀 관련 민감 주제(건너뛰기 설정 대상), soft: 강도 낮추기 버전
const Q = {
  minor: [
    { who: 'bigmom', text: '이번 시험은 몇 등 했니? 다온이는 네 나이 때 전교권이었는데.', soft: '요즘 공부는 할 만하니?', deflect: '큰어머니, 이 식혜 직접 만드신 거예요? 진짜 맛있어요!' },
    { who: 'bigdad', text: '커서 뭐 할 거냐? 공부 말고 딴 데 정신 팔면 큰일 난다.', soft: '장래 희망은 정했니?', deflect: '큰아버지, 요즘 등산 다니신다면서요? 어디가 제일 좋았어요?' },
    { who: 'aunt', text: '키가 아직 그것밖에 안 컸어? 우유 좀 많이 마셔라.', soft: '많이 컸네~ 밥은 잘 먹지?', deflect: '고모, 머리 바꾸셨어요? 잘 어울려요!' },
    { who: 'uncle', text: '휴대폰만 보지 말고 책 좀 읽어라. 학원은 몇 개 다니니?', soft: '요즘 학원 다니느라 바쁘지?' },
  ],
  jobseeker: [
    { who: 'bigdad', text: '그래서 취직은 언제 하는 거냐? 언제까지 준비만 할 거야?', soft: '요즘 준비는 잘 돼 가니?' },
    { who: 'bigmom', text: '지난번 시험은 붙었어? 결과는 언제 나와?', soft: '시험 준비하느라 고생 많지?' },
    { who: 'aunt', text: '옆 동네 누구네 애는 이번에 대기업 들어갔다더라. 너는?', soft: '친구들은 다들 어디 다니니?' },
    { who: 'uncle', text: '원서는 몇 군데나 넣었어? 눈을 좀 낮춰 봐라.', soft: '요즘 채용이 많이 어렵다며?' },
  ],
  worker: [
    { who: 'aunt', text: '만나는 사람은 있어? 결혼은 언제 할 거야?', soft: '요즘 좋은 사람은 있니?' },
    { who: 'bigdad', text: '월급은 얼마나 받냐? 그 회사 괜찮은 데 맞아?', soft: '회사 다닐 만하니?' },
    { who: 'bigmom', text: '더 늦기 전에 가야지. 내가 소개 한번 해 줄까?', soft: '혹시 소개받을 생각은 있니?' },
    { who: 'uncle', text: '그 회사 오래 다닐 수 있는 데야? 승진은 했고?', soft: '요즘 회사 일은 바쁘니?' },
  ],
  nokids: [
    { who: 'bigmom', sens: true, text: '애는 언제 가질 거야? 아직 소식 없어?', soft: '요즘 둘이 어떻게 지내?' },
    { who: 'aunt', sens: true, text: '더 늦기 전에 하나는 있어야지. 나이 생각해야 한다.', soft: '둘이 보기 좋다~ 계획은… 아, 내가 괜히 묻나?' },
    { who: 'bigdad', sens: true, text: '둘이 사는 것도 좋지만, 그래도 애가 있어야 집이 시끌벅적하지.', soft: '둘이 사는 재미는 어떠냐?' },
  ],
  pregnant: [
    { who: 'bigmom', sens: true, text: '예정일이 언제야? 나이가 있어서 걱정이다. 노산이면 힘들 텐데.', soft: '예정일이 언제니? 몸은 괜찮고?' },
    { who: 'aunt', sens: true, text: '배 모양 보니까 딱 알겠다. 아들이지? 그렇지?', soft: '벌써 태명은 지었어?' },
    { who: 'bigdad', sens: true, text: '임신했으면 가려 먹어야 해. 커피는 절대 안 되고, 그것도 먹지 말고….', soft: '몸조심해라. 먹고 싶은 건 없니?' },
    { who: 'uncle', sens: true, text: '애 낳으면 회사는 그만두는 거지?', soft: '출산 휴가는 잘 쓸 수 있대?' },
  ],
  kid1: [
    { who: 'bigmom', sens: true, text: '둘째는 언제 낳을 거야? 터울 너무 지면 안 좋다.', soft: '애 키우느라 정신없지?' },
    { who: 'aunt', sens: true, text: '외동이면 애가 외로워. 형제는 하나 있어야지.', soft: '아이가 많이 컸네~' },
    { who: 'bigdad', text: '애가 좀 작은 거 아니냐? 잘 먹여야지.', soft: '애가 밥은 잘 먹니?' },
  ],
  kids: [
    { who: 'bigdad', sens: true, text: '애가 몇이라고? 요즘 세상에 대단하다. 돈 많이 들겠어.', soft: '애들 키우느라 고생이 많다.' },
    { who: 'bigmom', text: '애들 데리고 오느라 늦었구나. 다음엔 일찍 와서 전 좀 부쳐라.', soft: '애들 챙겨 오느라 힘들었지?' },
  ],
  kidsMix: {
    daughters: { who: 'aunt', sens: true, text: '딸만 있으니 아들 하나 더 낳아 보지 그래?', soft: '애들이 다 야무지네~' },
    sons: { who: 'bigmom', sens: true, text: '아들만 있으면 나중에 서운하대. 딸 하나 더 있어야지.', soft: '아이들 기운이 넘치네~' },
    mixed: { who: 'uncle', sens: true, text: '딸 아들 다 있으니 금메달이네! 이제 더는 안 낳지?', soft: '애들 사이좋게 잘 지내지?' },
  },
  kid3: { who: 'uncle', sens: true, text: '셋이나? 계획한 거야, 어쩌다 그런 거야?', soft: '셋이면 집이 늘 북적이겠다.' },
  married: [
    { who: 'uncle', text: '집은 장만했냐? 요즘 집값이 장난이 아니던데.', soft: '이사 간 데는 살 만하니?' },
  ],
  general: [
    { who: 'aunt', text: '얼굴이 좀 상했다? 살이 빠졌나? 아니, 쪘나?', soft: '요즘 많이 바빴지? 얼굴 보니 반갑다.', deflect: '고모, 이 송편 모양 고모가 빚으신 거죠? 예술이에요!' },
    { who: 'bigdad', text: '요즘 돈은 좀 모으고 있냐? 재테크는 하고?', soft: '요즘 사는 건 괜찮니?' },
    { who: 'bigmom', text: '올해도 일 다 끝나고 오는구나. 다음엔 일찍 와서 좀 거들어라.', soft: '먼 길 오느라 고생했다.' },
    { who: 'uncle', text: '다온이 좀 봐라. 얼마나 야무지냐. 너도 보고 좀 배워.', soft: '다온이랑은 자주 연락하니?' },
  ],
};
const LINES = {
  deflect: ['그나저나 올해 송편은 누가 빚었어요? 모양이 예술이네요!', '아 맞다, 다온아! 요즘 키우는 고양이 사진 있어?', '이 부침개 진짜 맛있다~ 반죽에 뭐 넣으셨어요?', '다들 이번 연휴에 어디 다녀오세요? 날씨가 진짜 좋대요.'],
  boundary: ['그 이야기는 오늘은 하지 않을게요. 맛있게 먹고 싶어서요.', '걱정해 주시는 마음은 알아요. 그 일은 제가 알아서 정할게요.', '그건 제가 편하게 말하기 어려운 이야기라서요. 다른 얘기 해요.'],
  askback: ['혹시 걱정돼서 하시는 말씀이에요? 저는 지금 제 속도로 잘 지내고 있어요.', '그 질문을 들으면 저는 조금 부담이 돼요. 어떤 게 궁금하셨어요?', '“그렇게 해야 한다”는 말씀이시죠? 저는 생각이 조금 달라요.'],
  rest: '잠깐 바람 좀 쐬고 올게요.',
  snap: ['그걸 왜 자꾸 물어보세요? 제 일은 제가 알아서 한다고요!', '아, 진짜 그만 좀 하세요! 명절마다 똑같잖아요!', '그런 건 본인 일이나 신경 쓰세요!'],
  // 반응은 '알았다' 대신 티 안 나게 서운하고 언짢은 말투로
  r_deflect: ['어? 아, 그거? (잠깐 신이 났다가) …근데 말 돌리는 솜씨는 여전하다?', '그래, 그 얘기도 좋지. (젓가락을 탁 내려놓으며) 내 얘긴 듣기 싫은가 보네.', '하하, 그렇지. 근데 너는 꼭 중요한 얘기만 나오면 딴 데로 새더라.'],
  r_deflect_meh: ['응? 아… 그래. (입꼬리만 웃는다) 대답하기 싫으면 싫다고 하지.', '그래, 뭐… 먹자, 먹어. (한숨을 길게 쉰다)'],
  r_boundary: ['그래, 그래. 이제 걱정도 마음대로 못 하는 세상이구나.', '알았다~ 네가 다 알아서 잘하겠지. 잘하겠지 뭐.'],
  r_boundary_meh: ['아니 뭐, 걱정돼서 그러지… 누가 들으면 내가 못된 소리 한 줄 알겠다.', '흠… (물을 벌컥 마신다) 그래, 하지 말자 하지 마.'],
  r_askback: ['음… 듣고 보니 내가 좀 그랬나? 근데 틀린 말은 아니잖아.', '그렇게 들렸으면 할 수 없고. 다 응원하는 뜻이었는데 서운하네.'],
  r_askback_meh: ['아니, 그냥 물어본 거지 뭐…. 요새는 묻지도 못하겠네.', '요즘 애들은 말도 참… (혀를 찬다) 아니다, 됐다.'],
  // 대답이 끝나도 한 번 더 이어지는 잔소리
  jab: ['아니 내가 뭐 틀린 말 했나? 다 너 잘되라고 하는 소리지.', '요즘 애들은 어른 말을 잔소리로만 들어요, 아주.', '(혼잣말처럼) 우리 땐 그런 건 상상도 못 했는데….', '말이 나와서 말인데, 그러니까 내 말은 말이다….', '서운하다, 서운해. 걱정해 주는 사람한테.', '그래도 명절에 이런 얘기 아니면 언제 하니?'],
  r_snap: ['…뭐, 뭐라고? (큰상 위에 정적이 흐른다)', '아니, 얘가 오늘 왜 이래? (모두 젓가락을 멈춘다)', '(고모가 들고 있던 송편이 데구루루 굴러간다)'],
  r_rest: ['어, 그래. 천천히 다녀와라. (얘기하다 말고 가네…)', '그래, 바람 좀 쐬고 와. 다녀와서 마저 하자.'],
  ally_spouse: ['(하늘이 당신을 한번 보고) 그 이야기는 저희 둘이 함께 정할 일이라서요. 대신 저희 지난달 여행 사진 보실래요?', '(하늘이 당신 손을 잡는다) 저희는 지금 충분히 잘 지내고 있어요. 걱정은 감사히 받을게요.', '(하늘) 그 얘기는 저희가 이미 같이 정했어요. 오늘은 맛있게 먹고 싶어요.'],
  ally_cousin: ['(다온이 끼어든다) 에이~ 그런 건 본인이 제일 잘 알죠! 대신 제 얘기 들어 보실래요? 저 요즘 수영 배워요!', '(다온) 큰상에서 그런 얘기하면 소화 안 돼요~ 이 전이나 드세요!', '(다온) 저도 그 질문 받으면 진짜 싫던데요? 우리 다른 얘기해요.'],
  r_ally: ['하하, 그래 그래. (웃는데 눈은 안 웃는다) 둘이 아주 한편이네.', '아이고, 알았다 알았다. 나만 나쁜 사람이지 뭐.', '그래, 내가 괜한 소리 했나 보다. 다들 나만 보고 그래.'],
};

/* ================= 상태 ================= */
const setup = { gender: null, genderText: '', marital: null, status: null, mix: null, soft: false, skipFamily: false };
const opts = { caption: true, defense: true };
let state = null;
let muted = false;
try { muted = localStorage.getItem('jansori-muted') === '1'; } catch (e) { /* 저장소 차단 시 기본값 */ }

function category() {
  if (setup.marital === 'single') return setup.status || 'worker';
  if (setup.status === 'nokids' || setup.status === 'pregnant' || setup.status === 'kid1') return setup.status;
  return 'kids';
}
const isMarried = () => setup.marital === 'married';
const kidCount = () => ({ kid1: 1, kid2: 2, kid3: 3 }[setup.status] || 0);
function playerLook() {
  const base = setup.gender === 'female' ? LOOKS.female : setup.gender === 'male' ? LOOKS.male : LOOKS.neutral;
  return Object.assign({}, base, setup.status === 'minor' ? { scale: .86 } : {});
}
function kidLooks() {
  const n = kidCount();
  if (n === 1) return [LOOKS.kid];
  const out = [];
  for (let i = 0; i < n; i++) {
    if (setup.mix === 'daughters') out.push(LOOKS.daughter);
    else if (setup.mix === 'sons') out.push(LOOKS.son);
    else out.push(i % 2 ? LOOKS.son : LOOKS.daughter);
  }
  return out;
}
const ally = () => (isMarried() ? NPC.spouse : NPC.cousin);
const PLAYER = () => ({ name: '나', role: '플레이어', look: playerLook() });

/* ================= 픽셀 그리기 ================= */
// 12×16 픽셀 인물. (cx, by) = 발밑 중앙
function drawPerson(c, cx, by, L, o = {}) {
  const dir = o.dir || 'down', f = o.frame || 0, s = (o.scale || 1) * (L.scale || 1);
  c.save();
  c.translate(Math.round(cx), Math.round(by));
  c.scale(s, s);
  c.translate(-6, -16);
  const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(6, 15.6, 5, 1.6, 0, 0, Math.PI * 2); c.fill();
  const shoe = '#3a2a22';
  if (!o.seated) {
    const l = f === 1 ? -1 : 0, r = f === 2 ? -1 : 0;
    P(3, 12 + l, 2, 3, L.bottom); P(7, 12 + r, 2, 3, L.bottom);
    P(3, 15 + l, 2, 1, shoe); P(7, 15 + r, 2, 1, shoe);
  } else {
    P(2, 13, 8, 2, L.bottom);
  }
  const bw = o.belly ? 10 : 8, bx = o.belly ? 1 : 2;
  P(bx, 8, bw, 5, L.top);
  if (o.belly) P(3, 10, 6, 2, shade(L.top, .15));
  P(bx - 1, 8, 1, 4, L.top); P(bx + bw, 8, 1, 4, L.top);
  const handY = o.wave ? 6 : 12;
  P(bx - 1, handY, 1, 1, SKIN); P(bx + bw, o.waveR ? 6 : 12, 1, 1, SKIN);
  if (L.hanbok && dir !== 'up') { P(4, 8, 4, 1, '#fffaf0'); P(6, 9, 1, 2, '#c0392b'); }
  if (L.apron && dir !== 'up') P(3, 9, 6, 4, '#f4f1ea');
  // 머리
  P(3, 2, 6, 6, SKIN); P(2, 3, 8, 4, SKIN);
  const h = L.hair;
  if (dir === 'up') {
    if (L.style === 'bald') { P(2, 3, 8, 3, SKIN); P(2, 4, 8, 2, h); }
    else if (L.style === 'cap' || L.style === 'flatcap') { P(2, 1, 8, 3, L.cap); P(2, 4, 8, 3, h); }
    else P(2, 1, 8, 6, h);
    if (L.style === 'long') P(2, 7, 8, 3, h);
    if (L.style === 'bun') P(4, -1, 4, 2, h);
    if (L.style === 'pigtails') { P(0, 3, 2, 3, h); P(10, 3, 2, 3, h); }
  } else {
    let ex1 = 4, ex2 = 7;
    if (dir === 'left') { ex1 = 3; ex2 = 6; } else if (dir === 'right') { ex1 = 5; ex2 = 8; }
    P(ex1, 5, 1, 1, '#2a1a12'); P(ex2, 5, 1, 1, '#2a1a12');
    if (dir === 'down') { P(3, 6, 1, 1, '#f4a3a3'); P(8, 6, 1, 1, '#f4a3a3'); P(5, 7, 2, 1, o.mouth || '#c0605a'); }
    switch (L.style) {
      case 'long': P(2, 1, 8, 2, h); P(3, 3, 6, 1, h); P(2, 3, 1, 7, h); P(9, 3, 1, 7, h); break;
      case 'bob': P(2, 1, 8, 2, h); P(3, 3, 6, 1, h); P(2, 3, 1, 4, h); P(9, 3, 1, 4, h); break;
      case 'bun': P(2, 1, 8, 2, h); P(2, 3, 1, 2, h); P(9, 3, 1, 2, h); P(4, -1, 4, 2, h); break;
      case 'perm': P(2, 1, 8, 2, h); P(1, 2, 1, 3, h); P(10, 2, 1, 3, h); P(3, 0, 2, 1, h); P(7, 0, 2, 1, h); P(2, 3, 8, 1, h); break;
      case 'cap': P(2, 1, 8, 2, L.cap); P(2, 3, 9, 1, shade(L.cap, .3)); P(2, 4, 1, 2, h); P(9, 4, 1, 2, h); break;
      case 'flatcap': P(2, 1, 8, 2, L.cap); P(1, 3, 10, 1, shade(L.cap, .3)); P(2, 4, 1, 2, h); P(9, 4, 1, 2, h); break;
      case 'bald': P(2, 4, 1, 2, h); P(9, 4, 1, 2, h); break;
      case 'pigtails': P(2, 1, 8, 2, h); P(3, 3, 6, 1, h); P(0, 3, 2, 3, h); P(10, 3, 2, 3, h); break;
      default: P(2, 1, 8, 2, h); P(3, 3, 6, 1, h); P(2, 3, 1, 2, h); P(9, 3, 1, 2, h);
    }
    if (L.glasses) { P(3, 5, 2, 1, 'rgba(30,30,40,.75)'); P(7, 5, 2, 1, 'rgba(30,30,40,.75)'); P(5, 5, 2, 1, '#333'); }
    if (L.ribbon) { P(8, 0, 3, 1, '#e74c3c'); P(9, 1, 1, 1, '#e74c3c'); }
  }
  c.restore();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.round(v * (1 - k));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function blob(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1); }
}
function drawFace(canvas, L) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save(); c.scale(2.6, 2.6); drawPerson(c, 6.2, 16, Object.assign({}, L, { scale: 1 }), { dir: 'down' }); c.restore();
}

/* ================= 공통 UI ================= */
function renderSources() {
  document.querySelectorAll('.source-list').forEach(ul => {
    ul.innerHTML = '';
    SOURCES.forEach(([t, u]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t;
      li.appendChild(a); ul.appendChild(li);
    });
  });
}
const screens = ['scrTitle', 'scrSetup', 'scrGame', 'scrEnd'];
function show(id) {
  screens.forEach(s => { $('#' + s).hidden = s !== id; });
  const top = $('#app').getBoundingClientRect().top + window.scrollY - 8;
  if (window.scrollY > top) window.scrollTo({ top, behavior: 'auto' });
}

/* 소리: Web Audio 짧은 신호음 + 자막 */
let actx = null;
const SFX = {
  talk: [[660, .04]], select: [[523, .05], [784, .07]], eat: [[392, .06], [523, .06], [659, .09]],
  warn: [[330, .12], [262, .18]], door: [[130, .2], [98, .3]], good: [[523, .07], [659, .07], [784, .12]],
  bad: [[300, .1], [220, .16]], water: [[880, .05], [660, .08]], breath: [[262, .4], [196, .5]], dish: [[1200, .03], [900, .04]],
};
const CAP = {
  select: '띠링', eat: '냠냠 · 부침개 먹는 소리', warn: '삐삐 · 경고음', door: '끼이익 · 대문 여는 소리', good: '짠! · 성공 효과음',
  bad: '뿌우 · 아쉬운 효과음', water: '꿀꺽 · 물 마시는 소리', breath: '후우 · 숨 고르는 소리', dish: '달그락 · 그릇 소리',
};
let capTimer = 0;
function sfx(kind) {
  if (opts.caption && CAP[kind]) {
    const el = $('#caption');
    el.textContent = '🔈 ' + CAP[kind]; el.hidden = false;
    clearTimeout(capTimer); capTimer = setTimeout(() => { el.hidden = true; }, 1600);
  }
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    SFX[kind].forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'breath' ? 'sine' : 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d;
    });
  } catch (e) { /* 오디오 미지원 */ }
}
function setMuted(v) {
  muted = v;
  const b = $('#btnMute');
  b.textContent = v ? '🔇' : '🔊';
  b.setAttribute('aria-pressed', String(v));
  b.setAttribute('aria-label', v ? '소리 켜기' : '소리 끄기');
  try { localStorage.setItem('jansori-muted', v ? '1' : '0'); } catch (e) { /* 무시 */ }
}

/* ================= 캐릭터 설정 ================= */
let stepIdx = 0;
function stepsList() {
  const s = ['gender', 'marital', 'status'];
  if (setup.status === 'kid2' || setup.status === 'kid3') s.push('mix');
  s.push('comfort', 'summary');
  return s;
}
const LABEL = {
  gender: { female: '여성', male: '남성', custom: '직접 입력', none: '선택하지 않음' },
  marital: { single: '미혼', married: '기혼' },
  status: { minor: '미성년자', jobseeker: '취업 준비 중', worker: '직장인', nokids: '자녀 없음', pregnant: '임신 중', kid1: '자녀 1명', kid2: '자녀 2명', kid3: '자녀 3명 이상' },
  mix: { daughters: '딸만', sons: '아들만', mixed: '딸과 아들' },
};
function optCard(key, value, label, sub, emoji, lookForPreview) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'opt-card';
  b.setAttribute('aria-pressed', String(setup[key] === value));
  if (lookForPreview) {
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32; cv.setAttribute('aria-hidden', 'true');
    drawFace(cv, lookForPreview); b.appendChild(cv);
  } else if (emoji) {
    const e = document.createElement('span'); e.className = 'em'; e.textContent = emoji; e.setAttribute('aria-hidden', 'true'); b.appendChild(e);
  }
  b.appendChild(document.createTextNode(label));
  if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
  b.addEventListener('click', () => {
    if (key === 'marital' && setup.marital !== value) { setup.status = null; setup.mix = null; }
    if (key === 'status' && !/kid2|kid3/.test(value)) setup.mix = null;
    setup[key] = value;
    sfx('select');
    renderStep();
    if (!(key === 'gender' && value === 'custom')) setTimeout(() => { if (stepValid()) nextStep(); }, 220);
  });
  return b;
}
function stepValid() {
  const k = stepsList()[stepIdx];
  if (k === 'gender') return !!setup.gender;
  if (k === 'marital') return !!setup.marital;
  if (k === 'status') return !!setup.status;
  if (k === 'mix') return !!setup.mix;
  return true;
}
function renderStep() {
  const steps = stepsList();
  stepIdx = clamp(stepIdx, 0, steps.length - 1);
  const k = steps[stepIdx];
  const body = $('#setupBody');
  body.innerHTML = '';
  $('#stepCount').textContent = `${stepIdx + 1} / ${steps.length}`;
  $('#stepDots').innerHTML = steps.map((_, i) => `<i class="${i <= stepIdx ? 'on' : ''}"></i>`).join('');
  const grid = () => { const g = document.createElement('div'); g.className = 'opt-grid'; body.appendChild(g); return g; };
  const note = t => { const p = document.createElement('p'); p.className = 'privacy'; p.textContent = t; body.appendChild(p); };
  const H = $('#setupH');
  if (k === 'gender') {
    H.textContent = '캐릭터 외형을 골라 주세요';
    const g = grid();
    g.append(optCard('gender', 'female', '여성', null, null, LOOKS.female), optCard('gender', 'male', '남성', null, null, LOOKS.male),
      optCard('gender', 'custom', '직접 입력', null, null, LOOKS.neutral), optCard('gender', 'none', '선택하지 않음', null, null, LOOKS.neutral));
    if (setup.gender === 'custom') {
      const inp = document.createElement('input');
      inp.className = 'custom-input'; inp.maxLength = 12; inp.placeholder = '원하는 표현을 적어 주세요 (선택)';
      inp.setAttribute('aria-label', '성별 직접 입력'); inp.value = setup.genderText;
      inp.addEventListener('input', () => { setup.genderText = inp.value; });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') nextStep(); });
      body.appendChild(inp);
      setTimeout(() => inp.focus({ preventScroll: true }), 30);
    }
    note('성별은 캐릭터 외형에만 쓰여요. 잔소리 강도나 능력치는 모두 똑같아요.');
  } else if (k === 'marital') {
    H.textContent = '결혼 여부는요?';
    const g = grid();
    g.append(optCard('marital', 'single', '미혼', null, '🙋'), optCard('marital', 'married', '기혼', '배우자와 함께 가요', '💑'));
  } else if (k === 'status') {
    H.textContent = isMarried() ? '지금 우리 집은요?' : '요즘 나는요?';
    const g = grid();
    if (!isMarried()) g.append(optCard('status', 'minor', '미성년자', '학생', '🎒'), optCard('status', 'jobseeker', '취업 준비 중', null, '📚'), optCard('status', 'worker', '직장인', null, '💼'));
    else g.append(optCard('status', 'nokids', '자녀 없음', null, '🏡'), optCard('status', 'pregnant', '임신 중', null, '🤰'),
      optCard('status', 'kid1', '자녀 1명', null, '🧒'), optCard('status', 'kid2', '자녀 2명', null, '👧🧒'), optCard('status', 'kid3', '자녀 3명 이상', null, '👨‍👩‍👧‍👦'));
  } else if (k === 'mix') {
    H.textContent = '아이들은요?';
    const g = grid();
    g.append(optCard('mix', 'daughters', '딸만', null, '👧'), optCard('mix', 'sons', '아들만', null, '👦'), optCard('mix', 'mixed', '딸과 아들', null, '👧👦'));
  } else if (k === 'comfort') {
    H.textContent = '편하게 플레이하기';
    const box = document.createElement('div'); box.className = 'opt-box';
    box.innerHTML = `<label class="opt"><input type="checkbox" id="cSoft"> 잔소리 강도 낮추기 <small>(질문이 순해지고 스트레스가 덜 올라요)</small></label>` +
      (isMarried() ? `<label class="opt"><input type="checkbox" id="cSkip"> 임신·출산·자녀 관련 질문 건너뛰기</label>` : '') +
      `<label class="opt"><input type="checkbox" id="cDef"> 방어 액션(타이밍 막기) 사용 <small>(놓쳐도 불이익 없음)</small></label>`;
    body.appendChild(box);
    const cs = $('#cSoft', box), ck = $('#cSkip', box), cd = $('#cDef', box);
    cs.checked = setup.soft; cs.addEventListener('change', () => { setup.soft = cs.checked; });
    if (ck) { ck.checked = setup.skipFamily; ck.addEventListener('change', () => { setup.skipFamily = ck.checked; }); }
    cd.checked = opts.defense; cd.addEventListener('change', () => { opts.defense = cd.checked; });
    note('게임 중에도 ⚙️ 설정과 대화창의 “이 주제 건너뛰기”로 바꿀 수 있어요.');
  } else {
    H.textContent = '이렇게 출발할까요?';
    const wrap = document.createElement('div'); wrap.className = 'summary';
    const cv = document.createElement('canvas'); cv.width = 48; cv.height = 48; cv.setAttribute('aria-hidden', 'true');
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    c.save(); c.scale(2, 2);
    const kids = kidLooks();
    const people = [playerLook()].concat(isMarried() ? [LOOKS.spouse] : [], kids);
    const gap = 22 / people.length;
    people.forEach((L, i) => drawPerson(c, 2 + gap / 2 + i * gap, 21, L, { scale: people.length > 2 ? .75 : 1 }));
    c.restore();
    wrap.appendChild(cv);
    const dl = document.createElement('dl');
    const rows = [['외형', setup.gender === 'custom' ? (setup.genderText.trim() || '직접 입력') : LABEL.gender[setup.gender]],
      ['결혼 여부', LABEL.marital[setup.marital]], ['상황', LABEL.status[setup.status]]];
    if (setup.mix) rows.push(['아이들', LABEL.mix[setup.mix]]);
    rows.push(['편의 설정', [setup.soft ? '강도 낮춤' : '보통 강도', setup.skipFamily ? '자녀 질문 건너뜀' : null, opts.defense ? '방어 액션 켬' : '방어 액션 끔'].filter(Boolean).join(' · ')]);
    if (isMarried()) rows.push(['함께 가는 사람', '배우자 하늘' + (kidCount() ? ` · 아이 ${kidCount()}명` : '')]);
    else rows.push(['든든한 편', '사촌 다온 (큰집에 있어요)']);
    rows.forEach(([a, b]) => { const dt = document.createElement('dt'); dt.textContent = a; const dd = document.createElement('dd'); dd.textContent = b; dl.append(dt, dd); });
    wrap.appendChild(dl);
    body.appendChild(wrap);
    note('🔒 이 설정은 지금 브라우저 안에서만 쓰이고 저장하거나 전송하지 않아요.');
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn ghost'; edit.textContent = '✏️ 수정하기';
    edit.addEventListener('click', () => { stepIdx = 0; renderStep(); });
    body.appendChild(edit);
  }
  const next = $('#btnSetupNext');
  next.disabled = !stepValid();
  next.textContent = k === 'summary' ? '게임 시작 ▶' : '다음 →';
  $('#btnSetupBack').textContent = stepIdx === 0 ? '← 처음으로' : '← 이전';
}
function nextStep() {
  if (!stepValid()) return;
  const steps = stepsList();
  if (steps[stepIdx] === 'summary') { startGame(); return; }
  stepIdx++; renderStep();
  const first = $('#setupBody button, #setupBody input');
  if (first) first.focus({ preventScroll: true });
}

/* ================= 게임 상태 · 게이지 ================= */
function newState() {
  return {
    scene: 'village', st: Object.assign({}, START), ended: false, busy: false,
    soft: setup.soft, skipFamily: setup.skipFamily,
    count: { deflect: 0, boundary: 0, askback: 0, help: 0, rest: 0, snap: 0, short: 0, eat: 0, share: 0 },
    support: 0, helpCount: 0, allyOffers: 0, combo: 0, restUsed: 0, breathers: 0, warned: {}, talked: {}, rested: false,
    plate: JEON_PLATE, qi: 0, qn: QUESTION_COUNT, speaker: null, eatAnim: 0, cool: {},
  };
}
const STAT_LABEL = { hp: 'HP', rep: '평판', wt: '몸무게 증가', stress: '스트레스', cheer: '응원' };
// 받침 유무에 따라 '로/으로'를 붙인다(ㄹ 받침은 '로')
function ro(word) {
  const last = word[word.length - 1];
  // 숫자는 읽는 소리 기준: 영·삼·육은 받침이 있어 '으로'
  if (/[0-9]/.test(last)) return word + ('036'.includes(last) ? '으로' : '로');
  const c = word.charCodeAt(word.length - 1) - 0xAC00;
  if (c < 0 || c > 11171) return word + '로';
  const jong = c % 28;
  return word + (jong === 0 || jong === 8 ? '로' : '으로');
}
// HP 감소·평판 하락·몸무게 증가는 원인과 함께 알림창으로 알린다
const NOTICE_DEFAULT = { hp: '스트레스 증가', rep: '친척들의 반응', wt: '음식 섭취' };
function noticeFor(k, diff, cause) {
  // 스트레스는 원인을 따로 넘긴 경우(연속 잔소리 등)에만 알린다
  if (k === 'stress') { if (cause && diff > 0) notice(`😣 ${ro(cause)} 스트레스가 ${diff} 올랐다.`, 'stress'); return; }
  if (!NOTICE_DEFAULT[k]) return;
  const why = ro(cause || NOTICE_DEFAULT[k]), n = Math.abs(diff);
  if (k === 'hp' && diff < 0) notice(`❤️ ${why} HP가 ${n} 감소했다.`, 'hp');
  else if (k === 'rep' && diff < 0) notice(`⭐ ${why} 평판이 ${n} 떨어졌다.`, 'rep');
  else if (k === 'wt' && diff > 0) notice(`🍳 ${why} 몸무게가 ${n} 늘었다.`, 'wt');
}
function notice(msg, kind, ms) {
  const box = $('#notices');
  const el = document.createElement('p');
  el.className = 'notice ' + (kind || '');
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms || 3200);
}
function apply(d, why, cause) {
  if (!state || state.ended) return;
  const s = state.st;
  let slot = 0;
  ['hp', 'rep', 'wt', 'stress', 'cheer'].forEach(k => {
    if (!d[k]) return;
    const old = s[k];
    s[k] = clamp(old + d[k], 0, 100);
    const diff = s[k] - old;
    if (!diff) return;
    noticeFor(k, diff, cause && cause[k]);
    const good = (k === 'stress' || k === 'wt') ? diff < 0 : diff > 0;
    floatText(`${STAT_LABEL[k]} ${diff > 0 ? '+' : ''}${diff}`, k === 'wt' ? '' : (good ? 'pos' : 'neg'), slot++);
    const hb = { hp: '.hb-hp', rep: '.hb-rep', wt: '.hb-wt' }[k];
    if (hb) { const el = $(hb); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
  if (why) floatText(why, '', slot++);
  updateHUD();
  checkDanger();
  if (checkLimits()) return;
  if (s.stress >= 100) breather(false);
}
// 잔소리가 끊기지 않고 이어질수록 스트레스가 점점 더 크게 오른다. 쉬기·물 마시기·숨 고르기로 끊긴다
function chainNag() {
  state.combo = Math.min((state.combo || 0) + 1, 5);
  apply({ stress: 2 + state.combo * 2 }, '', { stress: `연속 잔소리 ×${state.combo}` });
}
function expose(base) {
  const soft = state.soft;
  // 스트레스가 쌓인 채 질문을 받으면 '휴식 부족'으로 HP가 더 깎인다
  const s = state.st.stress;
  const extra = ((s >= 60 ? 3 : 0) + (s >= 85 ? 3 : 0)) / (soft ? 2 : 1);
  apply({ stress: soft ? Math.round(base * .6) : base, hp: -(soft ? Math.round(base * .4) : Math.round(base * .8)) }, '', { hp: '스트레스 증가' });
  if (extra && !state.ended) apply({ hp: -extra }, '휴식 부족', { hp: '휴식 부족' });
}
function floatText(txt, cls, slot) {
  const hb = $('#headbars');
  const el = document.createElement('span');
  el.className = 'floater ' + cls;
  el.textContent = txt;
  const x = parseFloat(hb.style.left) || 100, y = (parseFloat(hb.style.top) || 100) - hb.offsetHeight - 8;
  el.style.left = clamp(x + (slot % 2 ? 46 : -46) * Math.ceil(slot / 2) * (slot ? 1 : 0), 50, $('#stage').clientWidth - 50) + 'px';
  el.style.top = Math.max(4, y - (slot > 2 ? 22 : 0)) + 'px';
  el.style.animationDelay = (slot * 0.08) + 's';
  $('#floaters').appendChild(el);
  setTimeout(() => el.remove(), 1700);
}
function updateHUD() {
  const s = state.st;
  $('#gStress').style.width = s.stress + '%'; $('#gStressN').textContent = s.stress;
  $('#gCheer').style.width = s.cheer + '%'; $('#gCheerN').textContent = s.cheer;
  $('.g-stress').classList.toggle('hot', s.stress >= 70);
  $('#hHp').textContent = s.hp; $('#hRep').textContent = s.rep; $('#hWt').textContent = '+' + s.wt;
  $('#hbHp').style.width = s.hp + '%'; $('#hbHpN').textContent = s.hp;
  $('#hbRep').style.width = s.rep + '%'; $('#hbRepN').textContent = s.rep;
  $('#hbWt').style.width = s.wt + '%'; $('#hbWtN').textContent = '+' + s.wt;
  const dHp = s.hp <= DANGER.hp, dRep = s.rep <= DANGER.rep, dWt = s.wt >= DANGER.wt;
  $('.hb-hp').classList.toggle('danger', dHp); $('.hb-rep').classList.toggle('danger', dRep); $('.hb-wt').classList.toggle('danger', dWt);
  const spans = $('#hudStats').children;
  spans[0].classList.toggle('danger', dHp); spans[1].classList.toggle('danger', dRep); spans[2].classList.toggle('danger', dWt);
  let near;
  if (dHp) near = '⚠ 홧병 엔딩 위험 (HP 낮음)';
  else if (dRep) near = '⚠ 버르장머리 엔딩 위험 (평판 낮음)';
  else if (dWt) near = '⚠ 뚱보 엔딩 위험 (몸무게 증가량 높음)';
  else near = '지금 가까운 엔딩: ' + ENDINGS[evaluateEnding(true)].title;
  $('#hudEnding').textContent = near;
}
function warn(msg) {
  // 위험 안내도 같은 알림창 묶음에 더 오래 띄워 겹치지 않게 한다
  notice(msg, 'warn', 5000); sfx('warn');
}
function checkDanger() {
  const s = state.st, w = state.warned;
  if (s.hp <= DANGER.hp && !w.hp) { w.hp = 1; warn('⚠ HP가 30 이하예요! 물 마시기·잠깐 쉬기·정자에서 쉬기로 회복할 수 있어요.'); }
  if (s.rep <= DANGER.rep && !w.rep) { w.rep = 1; warn('⚠ 평판이 20 이하예요! 쏘아붙이는 답이 계속되면 버르장머리 엔딩이에요.'); }
  if (s.wt >= DANGER.wt && !w.wt) { w.wt = 1; warn('⚠ 몸무게 증가량 70! 부침개를 더 먹으면 뚱보 엔딩이 가까워요.'); }
}
function checkLimits() {
  const s = state.st;
  let key = null;
  if (s.hp <= 0) key = 'hwabyeong'; else if (s.rep <= 0) key = 'rude'; else if (s.wt >= 100) key = 'full';
  if (!key) return false;
  const msg = { hwabyeong: 'HP 0 · 스트레스 과부하', rude: '평판 0 · 큰상에 정적이…', full: '몸무게 증가량 최대 · 부침개가 동났다!' }[key];
  endGame(key, msg);
  return true;
}

/* ================= 엔딩 ================= */
const ENDINGS = {
  hwabyeong: { title: '홧병 엔딩', eyebrow: 'ENDING · 스트레스 과부하', text: '질문이 너무 많이 쌓였어요. HP가 바닥나 “스트레스 과부하” 상태가 되었습니다.\n당신은 조용히 일어나 마루 끝에 앉아 달을 봅니다. 오늘은 여기까지 해도 괜찮아요.\n쌓일 땐 자리를 잠시 벗어나 쉬는 것도 나를 돌보는 방법이에요. (게임 속 표현이며 실제 질병을 뜻하지 않아요.)' },
  rude: { title: '버르장머리 엔딩', eyebrow: 'ENDING · 평판 0', text: '참다 참다 던진 말이 너무 뾰족했나 봐요. 큰아버지 안경이 콧등으로 스르륵, 고모 젓가락 사이 송편이 데구루루… 큰상에 정적이 흐릅니다.\n평판은 친척들의 반응을 보여 주는 게임 수치일 뿐, 당신의 가치를 뜻하지 않아요. 다음엔 “선 긋기”처럼 단단하지만 부드러운 말로도 충분히 마음을 전할 수 있어요.' },
  full: { title: '뚱보 엔딩', eyebrow: 'ENDING · 몸무게 증가량 최대', text: '말 대신 부침개를 고르고, 또 골랐더니… 큰상 위 부침개가 한 장도 남지 않았어요! 당신은 만족스럽게 배를 통통 두드립니다.\n잔소리는 귓등으로, 고소함은 입안으로. 몸무게 증가량은 게임 속 수치일 뿐, 실제 몸이나 외모와는 상관없어요.' },
  together: { title: '서로 편이 된 엔딩', eyebrow: 'SPECIAL ENDING', text: '혼자 버티지 않았어요. 도움을 청했고, {ally}는 당신 대신 싸우는 대신 당신의 뜻을 존중하며 옆에 섰습니다.\n“그 얘기는 저희가 정할게요.” 함께 정리한 대화 덕에 큰상 분위기도 한결 부드러워졌어요.' },
  jeonking: { title: '부침개 대장 엔딩', eyebrow: 'SPECIAL ENDING', text: '부침개를 맛있게 먹고, 덜어 드리고, 상도 함께 차렸어요. “이 집 부침개는 네가 다 챙기는구나!” 웃음이 번지고 질문 대신 음식 이야기가 오갑니다.\n긴장이 풀린 큰상, 오늘의 대장은 당신이에요.' },
  peace: { title: '평화로운 귀가 엔딩', eyebrow: 'ENDING', text: '때론 넘기고 때론 짧게 답하며 큰상을 무사히 마쳤어요. 보름달 아래, 자신에게 편한 방식으로 명절을 마무리하고 집으로 돌아갑니다.' },
};
const PEACE_VARIANTS = {
  deflect: ['화제 전환의 달인', '감나무, 송편, 여행 이야기… 당신이 꺼낸 화제마다 대화가 새 길로 흘렀어요. 평화롭게 식사를 마치고 보름달 아래 집으로 돌아갑니다.'],
  boundary: ['단단한 경계선', '“그 이야기는 오늘 하지 않을게요.” 정중하지만 분명한 말로 선을 지켰어요. 마음이 덜 흔들린 채 귀갓길에 오릅니다.'],
  askback: ['부드러운 되묻기', '“왜 궁금하셨어요?” 부드럽게 되짚자 어른들도 자기 말을 한 번 더 돌아봤어요. 조금 달라진 공기 속에 집으로 향합니다.'],
  rest: ['내 속도로', '물 한 잔, 바람 한 번. 중간중간 쉬어 가며 자신의 속도로 명절을 보냈어요. 지치지 않고 집으로 돌아갑니다.'],
};
const CONDITIONS = {
  hwabyeong: s => s.st.hp <= 0,
  rude: s => s.st.rep <= 0,
  full: s => s.st.wt >= 100,
  together: s => s.helpCount >= SPECIAL.togetherHelp && s.support >= SPECIAL.togetherSupport,
  jeonking: s => s.count.eat >= SPECIAL.jeonKingEat && s.count.share >= SPECIAL.jeonKingShare && s.st.wt < 100,
  peace: () => true,
};
function evaluateEnding() {
  return ENDING_PRIORITY.find(k => CONDITIONS[k](state)) || 'peace';
}
async function endGame(key, msg) {
  if (state.ended) return;
  state.ended = true;
  closeDialog();
  $('#ovBreath').hidden = true;
  await fade(msg || '명절 마무리', 1300);
  showEnding(key || evaluateEnding());
  unfade();
}
function showEnding(key) {
  const E = ENDINGS[key];
  let title = E.title, text = E.text.replace('{ally}', isMarried() ? '배우자 하늘' : '사촌 다온');
  const c = state.count;
  const restN = c.rest + (state.st && state.rested ? 1 : 0);
  if (key === 'peace') {
    const best = [['deflect', c.deflect], ['boundary', c.boundary], ['askback', c.askback], ['rest', restN]].sort((a, b) => b[1] - a[1])[0];
    if (best[1] >= 2) { title += ' · ' + PEACE_VARIANTS[best[0]][0]; text = PEACE_VARIANTS[best[0]][1]; }
  }
  $('#endEyebrow').textContent = E.eyebrow;
  $('#endH').textContent = title;
  $('#endText').textContent = text;
  const s = state.st;
  $('#endStats').innerHTML = '';
  [['❤️ HP', s.hp], ['⭐ 평판', s.rep], ['🍳 몸무게 증가', '+' + s.wt], ['📣 응원', s.cheer]].forEach(([a, b]) => {
    const d = document.createElement('div'); d.innerHTML = `<small>${a}</small><b>${b}</b>`; $('#endStats').appendChild(d);
  });
  const styles = [['🔀 화제 돌리기', c.deflect], ['🚧 선 긋기', c.boundary], ['🔁 되묻기', c.askback], ['🤝 도움 요청', c.help], ['🌿 쉬어 가기', restN],
    ['⏩ 짧게 답하기', c.short], ['🥞 부침개', c.eat], ['🤲 나누기·돕기', c.share], ['💥 쏘아붙이기', c.snap]].filter(x => x[1] > 0);
  const max = Math.max(0, ...styles.map(x => x[1]));
  $('#endStyle').innerHTML = '';
  if (!styles.length) styles.push(['🙂 조용히 지켜보기', 1]);
  styles.forEach(([n, v]) => { const sp = document.createElement('span'); sp.textContent = `${n} ${v}`; if (v === max && max > 0) sp.className = 'top'; $('#endStyle').appendChild(sp); });
  drawEndArt(key);
  state.scene = 'ending';
  show('scrEnd');
  sfx(key === 'hwabyeong' || key === 'rude' ? 'bad' : 'good');
  $('#btnRetry').focus({ preventScroll: true });
}

/* ================= 대화창 ================= */
const dlg = { open: false, typing: false, timer: 0, resolve: null, full: '', buttons: [], after: null };
function say(sp, text, choices, o = {}) {
  return new Promise(resolve => {
    const box = $('#dialog');
    dlg.open = true; dlg.resolve = resolve; dlg.full = text; dlg.buttons = [];
    box.hidden = false;
    $('#dlgName').textContent = sp.name; $('#dlgRole').textContent = sp.role || '';
    drawFace($('#dlgFace'), sp.look);
    $('#btnSkipTopic').hidden = !o.skippable;
    $('#defense').hidden = true;
    const choicesEl = $('#dlgChoices'); choicesEl.innerHTML = '';
    const textEl = $('#dlgText'); textEl.textContent = '';
    state.speaker = o.speakerId || null;
    let i = 0;
    dlg.typing = true;
    clearInterval(dlg.timer);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      clearInterval(dlg.timer); dlg.typing = false; textEl.textContent = text;
      if (o.defense && opts.defense) { runDefense().then(ok => done({ value: ok })); return; }
      renderChoices(choices && choices.length ? choices : [{ label: '다음 ▶', value: 'next', next: true }]);
    };
    dlg.after = finish;
    if (reduce) finish();
    else dlg.timer = setInterval(() => {
      i += 2; textEl.textContent = text.slice(0, i);
      if (i % 8 === 0) sfx('talk');
      if (i >= text.length) finish();
    }, 32);
    function renderChoices(list) {
      list.forEach((ch, n) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'choice' + (ch.rude ? ' rude' : '') + (ch.next ? ' next' : '');
        b.innerHTML = (ch.next ? '' : `<span class="k">${n + 1}</span>`) + '<span></span>';
        const inner = b.lastChild;
        if (ch.tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = ch.tag; inner.appendChild(t); }
        inner.appendChild(document.createTextNode(ch.label));
        b.addEventListener('click', () => { sfx('select'); done(ch); });
        choicesEl.appendChild(b); dlg.buttons.push(b);
      });
      if (!isTouch()) dlg.buttons[0].focus({ preventScroll: true });
    }
    function done(v) {
      if (dlg.resolve !== resolve) return;
      dlg.resolve = null;
      choicesEl.innerHTML = ''; dlg.buttons = [];
      resolve(v);
    }
    dlg.skip = () => done({ value: 'skip' });
  });
}
function closeDialog() {
  clearInterval(dlg.timer);
  dlg.open = false; dlg.typing = false; dlg.resolve = null; dlg.buttons = [];
  $('#dialog').hidden = true;
  if (state) state.speaker = null;
}
function finishTyping() { if (dlg.typing && dlg.after) dlg.after(); }

/* 방어 액션: 초록 칸에서 누르면 성공. 놓치거나 시간이 지나도 벌점 없음 */
const defense = { active: false, press: null };
function runDefense() {
  if (!opts.defense) return Promise.resolve(null);
  return new Promise(resolve => {
    const wrap = $('#defense'), zone = $('#defZone'), mark = $('#defMark');
    wrap.hidden = false;
    const zw = 16, zx = 15 + Math.random() * (85 - zw - 15);
    zone.style.left = zx + '%'; zone.style.width = zw + '%';
    const t0 = performance.now();
    let pos = 0, raf = 0;
    defense.active = true;
    const loop = now => {
      const t = (now - t0) / 1000;
      pos = 50 - 50 * Math.cos(t * Math.PI / .8);
      mark.style.left = pos + '%';
      if (t > 9) return end(null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const end = ok => {
      if (!defense.active) return;
      defense.active = false; cancelAnimationFrame(raf);
      defense.press = null;
      setTimeout(() => { wrap.hidden = true; resolve(ok); }, 350);
    };
    defense.press = () => {
      const ok = pos >= zx && pos <= zx + zw;
      sfx(ok ? 'good' : 'bad');
      floatText(ok ? '🛡️ 방어 성공!' : '괜찮아요, 말은 전해졌어요', ok ? 'pos' : '', 0);
      end(ok);
    };
    $('#btnDefend').focus({ preventScroll: true });
  });
}

/* 숨 고르기 */
let breathTimer = 0;
function breather(voluntary) {
  return new Promise(resolve => {
    const ov = $('#ovBreath');
    if (!ov.hidden) { resolve(); return; }
    ov.hidden = false;
    $('#breathH').textContent = voluntary ? '잠깐 쉬기' : '잠깐, 숨 고르기';
    $('#breathMsg').textContent = voluntary
      ? '마루 끝에 나와 숨을 고릅니다. 4초 들이쉬고, 4초 내쉬고.'
      : '스트레스 게이지가 가득 찼어요. 게임 오버가 아니에요. 잠시 마당에 나와 바람을 쐽니다.';
    const btn = $('#btnBreathDone'); btn.disabled = true;
    let n = 0;
    const word = $('#breathWord'); word.textContent = '들이쉬고';
    clearInterval(breathTimer);
    breathTimer = setInterval(() => { n++; word.textContent = n % 2 ? '내쉬고' : '들이쉬고'; if (n >= 1) btn.disabled = false; }, voluntary ? 1600 : 2400);
    sfx('breath');
    btn.onclick = () => {
      clearInterval(breathTimer); ov.hidden = true;
      if (!voluntary) {
        state.breathers++;
        state.st.stress = 40; state.combo = 0;
        apply({}, '숨 고르기 완료');
      }
      resolve();
      if (dlg.buttons[0] && !isTouch()) dlg.buttons[0].focus({ preventScroll: true });
    };
    setTimeout(() => btn.focus({ preventScroll: true }), 50);
  });
}

/* 장면 전환 */
function fade(text, ms) {
  const f = $('#fader'); $('#faderText').textContent = text || ''; f.classList.add('on');
  return wait(ms || 900);
}
function unfade() { $('#fader').classList.remove('on'); }

/* ================= 캔버스 · 입력 ================= */
const stage = $('#stage'), cv = $('#cv'), ctx = cv.getContext('2d');
let zoom = 3, LW = 320, LH = 200;
const isTouch = () => stage.classList.contains('is-touch');
function resize() {
  const r = stage.getBoundingClientRect();
  if (!r.width) return;
  zoom = r.width < 560 ? 2 : Math.max(2, Math.round(r.width / 330));
  // 큰상 장면은 인물이 많아 한 단계 작게 그린다
  if (state && state.scene === 'house') zoom = Math.max(2, zoom - 1);
  LW = Math.ceil(r.width / zoom); LH = Math.ceil(r.height / zoom);
  cv.width = LW; cv.height = LH;
  ctx.imageSmoothingEnabled = false;
}
const keys = new Set();
const input = { x: 0, y: 0, run: false, padRun: false };
const MOVE = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };

document.addEventListener('keydown', e => {
  if (!state || (state.scene !== 'village' && state.scene !== 'house')) return;
  if ($('#scrGame').hidden) return;
  const k = e.key, tag = (e.target.tagName || '').toLowerCase();
  if (k === 'Escape') { e.preventDefault(); toggleSettings(); return; }
  if (!$('#ovSettings').hidden || !$('#ovBreath').hidden) return;
  if (defense.active) {
    if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') { e.preventDefault(); defense.press && defense.press(); }
    return;
  }
  if (dlg.open) {
    if (dlg.typing && (k === 'Enter' || k === ' ' || k === 'e' || k === 'E')) { e.preventDefault(); finishTyping(); return; }
    if (/^[1-9]$/.test(k) && dlg.buttons[+k - 1]) { e.preventDefault(); dlg.buttons[+k - 1].click(); return; }
    if (/^Arrow/.test(k) && dlg.buttons.length) {
      e.preventDefault();
      const i = dlg.buttons.indexOf(document.activeElement);
      const d = (k === 'ArrowDown' || k === 'ArrowRight') ? 1 : -1;
      dlg.buttons[(i + d + dlg.buttons.length) % dlg.buttons.length].focus({ preventScroll: true });
      return;
    }
    if ((k === 'e' || k === 'E' || (k === 'Enter' && tag !== 'button')) && dlg.buttons.length === 1) { e.preventDefault(); dlg.buttons[0].click(); }
    return;
  }
  if (MOVE[e.code]) { e.preventDefault(); keys.add(e.code); }
  if (k === 'Shift') input.run = true;
  if ((k === 'e' || k === 'E' || k === 'Enter') && tag !== 'button' && state.scene === 'village') { e.preventDefault(); interact(); }
});
document.addEventListener('keyup', e => { keys.delete(e.code); if (e.key === 'Shift') input.run = false; });
window.addEventListener('blur', () => { keys.clear(); input.run = false; });

/* 터치 패드 */
(function setupTouch() {
  const pad = $('#pad'), knob = $('#knob');
  let pid = null;
  const move = e => {
    const r = pad.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy), max = r.width / 2 - 10;
    if (m > max) { dx *= max / m; dy *= max / m; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const mag = Math.min(1, m / max);
    input.x = mag < .2 ? 0 : dx / (Math.hypot(dx, dy) || 1) * mag;
    input.y = mag < .2 ? 0 : dy / (Math.hypot(dx, dy) || 1) * mag;
  };
  pad.addEventListener('pointerdown', e => { pid = e.pointerId; pad.setPointerCapture(pid); move(e); e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
  const up = e => { if (e.pointerId !== pid) return; pid = null; input.x = input.y = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  $('#tAct').addEventListener('click', () => {
    if (dlg.open) { if (dlg.typing) finishTyping(); else if (dlg.buttons.length === 1) dlg.buttons[0].click(); return; }
    interact();
  });
  $('#tRun').addEventListener('click', () => { input.padRun = !input.padRun; $('#tRun').classList.toggle('on', input.padRun); });
  const mark = () => stage.classList.add('is-touch');
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) mark();
  window.addEventListener('touchstart', mark, { passive: true, once: true });
})();
$('#dlgText').addEventListener('click', finishTyping);

/* ================= 장면 1: 마을 ================= */
const T = 16, MW = 36, MH = 28;
const G = { GRASS: 0, PATH: 1, WATER: 2, BRIDGE: 3, PADDY: 4, YARD: 5 };
let ground, solid, objects, npcs, player, followers, trail;
function buildMap() {
  ground = new Uint8Array(MW * MH); solid = new Uint8Array(MW * MH); objects = [];
  const fill = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) ground[j * MW + i] = t; };
  const block = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) solid[j * MW + i] = 1; };
  const obj = (type, x, y, w = 1, h = 1, extra = {}) => { objects.push(Object.assign({ type, x, y, w, h }, extra)); if (extra.walk !== true) block(x, y, w, h); };
  // 길과 물
  fill(15, 0, 2, MH, G.WATER); block(15, 0, 2, MH);
  fill(0, 23, 15, 2, G.PATH); fill(15, 23, 2, 2, G.BRIDGE); for (let i = 15; i < 17; i++) for (let j = 23; j < 25; j++) solid[j * MW + i] = 0;
  fill(17, 23, 6, 2, G.PATH); fill(21, 8, 2, 17, G.PATH); fill(21, 8, 11, 2, G.PATH); fill(29, 7, 2, 1, G.PATH);
  fill(2, 12, 11, 8, G.PADDY); block(2, 12, 11, 8);
  fill(3, 7, 6, 2, G.YARD); fill(26, 4, 8, 2, G.YARD);
  // 테두리 나무
  for (let x = 0; x < MW; x++) { obj(x % 3 ? 'tree' : 'atree', x, 0); obj(x % 4 ? 'tree' : 'atree', x, MH - 1); }
  for (let y = 1; y < MH - 1; y++) { if (y !== 23 && y !== 24) obj(y % 3 ? 'tree' : 'atree', 0, y); if (y > 6) obj(y % 2 ? 'tree' : 'atree', MW - 1, y); }
  block(0, 23, 1, 2);
  // 마을 어귀
  obj('jangseung', 3, 22); obj('jangseung', 3, 25, 1, 1, { female: true }); obj('stone', 6, 21);
  obj('hay', 4, 20); obj('hay', 11, 21); obj('scare', 7, 16, 1, 1, { walk: true });
  obj('atree', 13, 21); obj('ptree', 9, 26 - 1);
  // 북서쪽 초가집
  obj('house', 4, 4, 4, 3, { roof: 'thatch' }); obj('jangdok', 9, 6); obj('ptree', 11, 3); obj('ptree', 12, 9); obj('ptree', 2, 9); obj('tree', 6, 10); obj('atree', 13, 6);
  // 개울 동쪽 골목
  obj('bigtree', 17, 7); obj('pavilion', 17, 10, 3, 2); obj('house', 17, 15, 3, 3, { roof: 'thatch' }); obj('hay', 18, 20);
  obj('house', 24, 12, 4, 3, { roof: 'tile' }); obj('shop', 24, 18, 4, 3);
  obj('ptree', 30, 12); obj('ptree', 32, 15); obj('ptree', 30, 18); obj('ptree', 33, 20); obj('ptree', 31, 23); obj('atree', 28, 25); obj('jangdok', 29, 15);
  obj('lantern', 20, 21); obj('lantern', 23, 16); obj('lantern', 20, 16); obj('lantern', 23, 11); obj('lantern', 28, 7); obj('lantern', 31, 7);
  // 큰집
  for (let x = 25; x <= 34; x++) if (x !== 29 && x !== 30) obj('wall', x, 6);
  for (let y = 1; y < 6; y++) { obj('wall', 25, y, 1, 1, { side: true }); obj('wall', 34, y, 1, 1, { side: true }); }
  obj('mansion', 26, 1, 8, 3); obj('gate', 29, 6, 2, 1);
  // NPC
  // (x, y) = 평소 자리, (bx, by) = 플레이어가 다가오면 막아서는 길 위 지점
  npcs = [
    { id: 'ijang', x: 10.5, y: 22.6, dir: 'down', bx: 11, by: 24.2 },
    { id: 'granny', x: 20.5, y: 12.8, dir: 'right', bx: 21.9, by: 13.6 },
    { id: 'shop', x: 23.5, y: 21.8, dir: 'left', bx: 21.9, by: 20.6 },
    { id: 'grandpa', x: 25.5, y: 10.8, dir: 'down', bx: 25, by: 9.2 },
  ];
  npcs.forEach(n => { n.hx = n.x; n.hy = n.y; n.hdir = n.dir; });
}
// 길을 막아설 때 먼저 건네는 말
const CALL = { ijang: '어이, 거기! 잠깐 서 봐!', granny: '아가, 아가! 이리 좀 와 봐.', shop: '어머, 이게 누구야! 잠깐만~', grandpa: '어허, 인사도 없이 그냥 지나가려고?' };
const INTERCEPT_RANGE = 3.2;
function faceTo(a, x, y) {
  const dx = x - a.x, dy = y - a.y;
  a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}
function walkNpc(n, x, y, done) { n.walking = true; n.target = { x, y }; n.onArrive = done; }
function updateNpcs(dt) {
  npcs.forEach(n => {
    if (!n.walking) return;
    const dx = n.target.x - n.x, dy = n.target.y - n.y, d = Math.hypot(dx, dy), step = 5.5 * dt;
    if (d <= step) {
      n.x = n.target.x; n.y = n.target.y; n.walking = false; n.anim = 0;
      const cb = n.onArrive; n.onArrive = null; if (cb) cb();
    } else {
      n.x += dx / d * step; n.y += dy / d * step; n.anim = (n.anim || 0) + dt * 10;
      faceTo(n, n.target.x, n.target.y);
    }
  });
}
// 아직 인사하지 않은 이웃 근처에 오면 이웃이 길 위로 나와 막아서고 말을 건다
function checkIntercept() {
  for (const n of npcs) {
    if (state.talked[n.id] || n.walking) continue;
    const d = Math.hypot(player.x - n.bx, player.y - n.by);
    if (d > INTERCEPT_RANGE) continue;
    let tx = n.bx, ty = n.by;
    if (d < 1.1) { const hx = n.hx - player.x, hy = n.hy - player.y, m = Math.hypot(hx, hy) || 1; tx = player.x + hx / m * 1.1; ty = player.y + hy / m * 1.1; }
    state.busy = true; state.intercept = n.id;
    player.anim = 0;
    faceTo(player, tx, ty);
    sfx('select');
    const hint = $('#hint'); hint.hidden = false; hint.textContent = `🚧 ${NPC[n.id].name}이(가) 길을 막아섰어요!`;
    walkNpc(n, tx, ty, () => { faceTo(n, player.x, player.y); talkVillage(n, true); });
    return true;
  }
  return false;
}
const isSolid = (tx, ty) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || solid[ty * MW + tx] === 1;
function blocked(x, y) {
  const hw = .3;
  for (const [px, py] of [[x - hw, y - .3], [x + hw, y - .3], [x - hw, y - .02], [x + hw, y - .02]]) if (isSolid(Math.floor(px), Math.floor(py))) return true;
  for (const n of npcs) if (!n.walking && Math.hypot(n.x - x, (n.y - y) * 1.4) < .62) return true;
  return false;
}
function updateVillage(dt) {
  let dx = 0, dy = 0;
  keys.forEach(c => { dx += MOVE[c][0]; dy += MOVE[c][1]; });
  if (dx || dy) { const m = Math.hypot(dx, dy); dx /= m; dy /= m; } else { dx = input.x; dy = input.y; }
  const moving = Math.hypot(dx, dy) > .05;
  const sp = (input.run || input.padRun ? 7 : 4) * dt;
  if (moving) {
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx > 0 ? 'right' : 'left'; else player.dir = dy > 0 ? 'down' : 'up';
    const nx = player.x + dx * sp, ny = player.y + dy * sp;
    if (!blocked(nx, player.y)) player.x = clamp(nx, .35, MW - .35);
    if (!blocked(player.x, ny)) player.y = clamp(ny, .4, MH - .05);
    player.anim += dt * (input.run || input.padRun ? 12 : 8);
    const last = trail[0];
    if (!last || Math.hypot(last.x - player.x, last.y - player.y) > .12) { trail.unshift({ x: player.x, y: player.y, dir: player.dir }); if (trail.length > 80) trail.pop(); }
  } else player.anim = 0;
  followers.forEach((f, i) => {
    const t = trail[Math.min(trail.length - 1, 9 + i * 7)];
    if (t) { const moved = Math.hypot(f.x - t.x, f.y - t.y) > .01; f.x = t.x; f.y = t.y; f.dir = t.dir; f.anim = moved ? player.anim : 0; }
  });
  if (checkIntercept()) return;
  // 상호작용 안내
  const tg = nearestTarget();
  const hint = $('#hint');
  if (tg && !dlg.open) { hint.hidden = false; hint.textContent = (isTouch() ? '대화 버튼 · ' : 'E · ') + tg.label; }
  else hint.hidden = true;
}
function targets() {
  const list = npcs.map(n => ({ x: n.x, y: n.y, r: 1.5, label: NPC[n.id].name + (state.talked[n.id] ? '' : ' 💬'), fn: () => talkVillage(n) }));
  list.push({ x: 18.5, y: 12.2, r: 1.7, label: state.rested ? '정자 (이미 쉬었어요)' : '정자 마루에 앉아 쉬기 🌿', fn: restPavilion });
  list.push({ x: 30, y: 7.2, r: 1.8, label: '큰집 대문 들어가기 🚪', fn: enterGate });
  return list;
}
function nearestTarget() {
  let best = null, bd = 9;
  targets().forEach(t => { const d = Math.hypot(t.x - player.x, t.y - player.y); if (d < t.r && d < bd) { bd = d; best = t; } });
  return best;
}
function interact() {
  if (!state || state.scene !== 'village' || dlg.open || state.busy || state.ended) return;
  const t = nearestTarget();
  if (t) t.fn();
}
async function talkVillage(n, intercepted) {
  state.busy = true;
  state.intercept = null;
  $('#hint').hidden = true;
  const P = NPC[n.id];
  // NPC가 플레이어를 바라보게
  faceTo(n, player.x, player.y);
  if (state.talked[n.id]) {
    await say(P, VILLAGE_REPEAT[n.id]);
    closeDialog(); state.busy = false; return;
  }
  state.talked[n.id] = true;
  const cat = category();
  let line = VILLAGE[n.id][cat];
  if (typeof line === 'object') line = line[setup.mix] || line.mixed;
  if (state.soft) line = VILLAGE_SOFT;
  if (intercepted) line = CALL[n.id] + ' ' + line;
  expose(6);
  if (state.ended) return;
  const married = isMarried();
  const c = await say(P, line, [
    { tag: '🔀 화제 돌리기', label: VILLAGE[n.id].deflect, value: 'deflect' },
    { tag: '🚧 정중하게 선 긋기', label: '그 얘기는 제가 천천히 생각해 볼게요. 명절 잘 보내세요!', value: 'boundary' },
    { tag: '⏩ 짧게 답하고 이동', label: '네, 네~ 들어가 볼게요!', value: 'short' },
    { tag: '🤝 도움 요청', label: married ? '(하늘에게 눈짓) 우리 큰집에서 기다리시지?' : '(사촌 다온에게 SOS 문자를 보낸다)', value: 'help' },
    { tag: '💥 쏘아붙이기', label: '제 인생은 제가 알아서 해요! 신경 끄세요!', value: 'snap', rude: true },
  ]);
  if (state.ended) return;
  const v = c.value;
  state.count[v]++;
  if (v === 'deflect') {
    apply({ stress: -2, rep: 3, cheer: 2 });
    await say(P, VILLAGE[n.id].ok);
    if (n.id === 'shop') { apply({ hp: 6 }, '식혜 한 잔'); sfx('water'); }
  } else if (v === 'boundary') {
    apply({ stress: -3, rep: -1, cheer: 8 }, '', { rep: '정중한 선 긋기' });
    await say(P, pick(['그려, 그려. 요즘은 어른이 말도 못 혀.', '아이고~ 무서워서 무슨 말을 못 하겄네.']));
  } else if (v === 'short') {
    apply({ stress: 2, hp: -1 }, '', { hp: '서두른 대답' });
    await say(P, '…대답이 왜 그렇게 짧어? 서운하게.');
  } else if (v === 'help') {
    state.helpCount++; state.support++;
    apply({ stress: -5, cheer: 6, rep: 1 });
    if (married) await say(NPC.spouse, '어르신, 저희 큰집에서 다들 기다리셔서요! 이따 또 인사드릴게요.');
    else await say(NPC.cousin, '📱 다온: “큰집에서 다들 너 찾아! 얼른 와~” (전화를 받는 척 자리를 뜬다)');
    if (state.ended) return;
    await say(P, '어이구, 혼자선 대답도 못 하나 보네. 그려, 가 봐라.');
  } else if (v === 'snap') {
    apply({ stress: -4, rep: -16, cheer: -2 }, '', { rep: '쏘아붙인 말' });
    if (state.ended) return;
    await say(P, '…아이고, 깜짝이야. 요즘 애들은 참….');
  }
  if (state.ended) return;
  // 한 번 답해도 끝나지 않는 잔소리 2탄. 도움을 청했거나 쏘아붙였으면 생략
  if (v === 'deflect' || v === 'boundary' || v === 'short') {
    chainNag();
    if (state.ended) return;
    const c2 = await say(P, VILLAGE_FOLLOW[n.id], [
      { tag: '🙂 웃으며 넘기기', label: '하하… 네, 명심할게요.', value: 'smile' },
      { tag: '🚧 한 번 더 선 긋기', label: '말씀은 감사해요. 그래도 그건 제가 정할게요.', value: 'boundary' },
      { tag: '🏃 인사하고 자리 뜨기', label: '큰집에서 기다리셔서요! 안녕히 계세요~', value: 'leave' },
    ]);
    if (state.ended) return;
    if (c2.value === 'smile') {
      apply({ hp: -2, rep: 1 }, '', { hp: '꾹 참은 웃음' });
      if (state.ended) return;
      await say(P, '그려, 명심혀. 다 너 잘되라고 하는 소리여. 다음에 또 얘기하자고.');
      if (state.ended) return;
      chainNag();
    } else if (c2.value === 'boundary') {
      state.count.boundary++;
      apply({ cheer: 6, rep: -1 }, '', { rep: '거듭된 선 긋기' });
      if (state.ended) return;
      await say(P, '(입을 삐죽이며) 그려, 잘났다 잘났어. 어여 가 봐.');
    } else {
      await say(P, '벌써 가? 얼굴 한 번 보기 힘드네, 참.');
    }
    if (state.ended) return;
  }
  closeDialog(); state.busy = false; updateGoal();
  // 대화가 끝나면 원래 자리로 비켜 준다
  if (n.x !== n.hx || n.y !== n.hy) walkNpc(n, n.hx, n.hy, () => { n.dir = n.hdir; });
}
async function restPavilion() {
  state.busy = true;
  if (state.rested) { await say({ name: '정자', role: '마을 쉼터', look: LOOKS.granny }, '이미 한 번 쉬었어요. 큰집이 기다리고 있어요!'); closeDialog(); state.busy = false; return; }
  state.rested = true;
  await breather(true);
  state.combo = 0;
  apply({ hp: 8, stress: -12, cheer: 3 }, '정자에서 쉼');
  state.busy = false;
}
async function enterGate() {
  state.busy = true;
  const c = await say({ name: '큰집 대문', role: '목표 지점', look: playerLook() }, '큰집 대문 앞이에요. 안에서 웃음소리와 부침개 냄새가 새어 나옵니다. 들어갈까요?',
    [{ label: '🚪 들어간다', value: 'go' }, { label: '조금 더 둘러본다', value: 'stay' }]);
  closeDialog();
  if (c.value !== 'go') { state.busy = false; return; }
  sfx('door');
  await fade('큰집 안방 · 큰상 앞', 1100);
  startHouse();
  unfade();
}
function updateGoal() {
  if (state.scene === 'village') {
    const n = Object.keys(state.talked).length;
    $('#goalText').textContent = `큰집 대문까지 가기 · 이웃 인사 ${n}/4`;
  } else if (state.scene === 'house') {
    $('#goalText').textContent = `큰상 질문에 대응하기 (${Math.min(state.qi + 1, state.qn)}/${state.qn})`;
  }
}

/* 마을 그리기 */
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function drawTile(c, tx, ty, t, time) {
  const x = tx * T, y = ty * T, r = hash(tx, ty);
  const P = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(x + a, y + b, w, h); };
  switch (ground[ty * MW + tx]) {
    case G.PATH: P(0, 0, T, T, '#dcbc80'); if (r > .5) P(r * 12 | 0, (r * 97 % 12) | 0, 2, 1, '#c4a265'); if (r < .3) P(3, 10, 1, 1, '#c4a265'); break;
    case G.WATER: {
      P(0, 0, T, T, '#5aa9d6');
      const o = ((time * 6 + ty * 5) % 16) | 0; P((o + tx * 3) % 14, 4, 3, 1, '#9fd8f2'); P((o + 8) % 14, 11, 4, 1, '#9fd8f2');
      break;
    }
    case G.BRIDGE: P(0, 0, T, T, '#a8703f'); for (let i = 0; i < T; i += 4) P(0, i, T, 1, '#7a4a24'); P(0, 0, T, 2, '#6b3d1c'); P(0, T - 2, T, 2, '#6b3d1c'); break;
    case G.PADDY: {
      P(0, 0, T, T, '#e3b84a');
      for (let i = 1; i < T; i += 3) P(i, (i * 7 + tx) % 5 + 3, 1, 4, '#c9962e');
      const isP = (i, j) => i >= 0 && j >= 0 && i < MW && j < MH && ground[j * MW + i] === G.PADDY;
      if (!isP(tx, ty - 1)) P(0, 0, T, 2, '#8b6b3a'); if (!isP(tx, ty + 1)) P(0, T - 2, T, 2, '#8b6b3a');
      if (!isP(tx - 1, ty)) P(0, 0, 2, T, '#8b6b3a'); if (!isP(tx + 1, ty)) P(T - 2, 0, 2, T, '#8b6b3a');
      break;
    }
    case G.YARD: P(0, 0, T, T, '#ead6a8'); if (r > .7) P(5, 7, 2, 1, '#d6bf8a'); break;
    default:
      P(0, 0, T, T, r > .82 ? '#a9c55a' : '#9cc45b');
      if (r > .55) P((r * 13) | 0, (r * 51 % 13) | 0, 1, 2, '#83ab48');
      if (r < .06) { P(6, 6, 2, 2, '#f5f0e5'); P(7, 7, 1, 1, '#e9b53f'); }
      else if (r < .12) { P(4, 9, 2, 1, '#e8692a'); P(10, 4, 2, 1, '#d9822b'); }
  }
}
function drawObject(c, o, time) {
  const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
  const P = (a, b, ww, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x + a), Math.round(y + b), ww, hh); };
  switch (o.type) {
    case 'tree': case 'atree': case 'ptree': {
      P(6, 8, 4, 8, '#6b4226');
      const leaf = o.type === 'atree' ? ['#c8621f', '#e08a2e', '#f0b34a'] : ['#3f6e2e', '#55883a', '#6fa14a'];
      blob(c, x + 8, y + 2, 9, leaf[0]); blob(c, x + 7, y, 7, leaf[1]); blob(c, x + 5, y - 2, 3, leaf[2]);
      if (o.type === 'ptree') [[3, 1], [11, -1], [8, 5], [13, 4], [5, -4]].forEach(([a, b]) => { P(a, b, 2, 2, '#ff7a1a'); P(a, b, 1, 1, '#ffb066'); });
      break;
    }
    case 'bigtree':
      P(5, 4, 6, 12, '#5a3820');
      blob(c, x + 8, y - 8, 16, '#4b7a34'); blob(c, x + 4, y - 12, 10, '#5f9142'); blob(c, x + 14, y - 4, 8, '#d9822b'); blob(c, x + 2, y - 16, 4, '#7bab55');
      break;
    case 'house': {
      P(2, h * .45, w - 4, h * .55, '#efe2c4');
      P(2, h * .45, w - 4, 2, '#7a4a24'); P(2, h - 2, w - 4, 2, '#7a4a24');
      for (let i = 2; i < w - 2; i += 16) P(i, h * .45, 2, h * .55, '#7a4a24');
      P(w / 2 - 6, h - 15, 12, 13, '#8b5a2b'); P(w / 2 - 1, h - 15, 1, 13, '#5a3a1a');
      P(6, h * .55, 9, 7, '#fbf6e6'); P(10, h * .55, 1, 7, '#c9b48a'); P(w - 15, h * .55, 9, 7, '#fbf6e6'); P(w - 11, h * .55, 1, 7, '#c9b48a');
      if (o.roof === 'thatch') {
        P(-3, -3, w + 6, h * .5 + 5, '#c9a25a'); P(-1, -5, w + 2, 4, '#d9b56b'); P(0, h * .5 - 1, w, 3, '#9c7a3e');
        for (let i = 0; i < w; i += 5) P(i, 2 + (i % 3), 1, h * .35, '#b08a45');
      } else {
        P(-5, h * .2, w + 10, h * .28, '#4a5568'); P(-6, h * .2 - 2, 3, 3, '#4a5568'); P(w + 3, h * .2 - 2, 3, 3, '#4a5568');
        P(1, -3, w - 2, h * .25, '#5a6578'); P(-2, -4, w + 4, 2, '#2d3748');
        for (let i = -4; i < w + 4; i += 3) P(i, h * .2 + 1, 1, h * .26, '#6b7689');
      }
      break;
    }
    case 'mansion': {
      P(0, h * .4, w, h * .6, '#efe2c4');
      P(0, h - 6, w, 6, '#a8703f'); for (let i = 0; i < w; i += 6) P(i, h - 6, 1, 6, '#7a4a24');
      for (let i = 4; i < w; i += 20) P(i, h * .4, 3, h * .6 - 6, '#8b3a1e');
      for (let i = 10; i < w - 10; i += 20) { P(i, h * .5, 10, 10, '#fbf6e6'); P(i + 5, h * .5, 1, 10, '#c9b48a'); P(i, h * .5 + 5, 10, 1, '#c9b48a'); }
      P(-8, h * .12, w + 16, h * .32, '#3d4656'); P(-10, h * .12 - 3, 4, 4, '#3d4656'); P(w + 6, h * .12 - 3, 4, 4, '#3d4656');
      P(4, -6, w - 8, h * .2, '#4b5568'); P(0, -8, w, 3, '#252c38');
      for (let i = -8; i < w + 8; i += 3) P(i, h * .12 + 1, 1, h * .3, '#566177');
      // 처마 등불
      [[16, 1], [w - 20, 1]].forEach(([a]) => { P(a, h * .44, 4, 5, '#d7282f'); P(a, h * .44 + 5, 4, 2, '#1d4f9e'); });
      break;
    }
    case 'wall':
      P(0, 4, T, 12, '#b5a990'); P(2, 7, 5, 3, '#9d9078'); P(9, 11, 5, 3, '#9d9078'); P(5, 13, 3, 2, '#c8bea8');
      P(-1, 1, T + 2, 4, '#4a5568'); P(-1, 1, T + 2, 1, '#2d3748');
      break;
    case 'gate':
      P(-2, 0, w + 4, h, '#5a3a1a'); P(1, 3, w / 2 - 2, h - 3, '#8b4a22'); P(w / 2 + 1, 3, w / 2 - 2, h - 3, '#8b4a22');
      P(w / 2 - 2, 8, 1, 3, '#e9b53f'); P(w / 2 + 1, 8, 1, 3, '#e9b53f');
      P(-6, -8, w + 12, 8, '#3d4656'); P(-8, -10, w + 16, 3, '#252c38');
      P(4, -4, 8, 3, '#fff3c4'); c.fillStyle = '#7a3b1c'; c.font = '5px sans-serif'; c.fillText('큰집', x + 5, y - 1.3);
      break;
    case 'pavilion':
      P(-2, h - 8, w + 4, 6, '#a8703f'); P(-2, h - 8, w + 4, 1, '#c98b54');
      [0, w - 3].forEach(a => P(a, 0, 3, h - 2, '#8b3a1e'));
      P(-8, -10, w + 16, 12, '#3d4656'); P(-10, -12, 4, 4, '#3d4656'); P(w + 6, -12, 4, 4, '#3d4656'); P(0, -16, w, 6, '#4b5568'); P(-2, -17, w + 4, 2, '#252c38');
      c.fillStyle = '#7a3b1c'; c.font = '5px sans-serif'; c.fillText('쉼터 정자', x + 8, y + h - 10);
      break;
    case 'shop':
      P(0, h * .35, w, h * .65, '#f3e6c8');
      P(4, h * .5, w - 8, h * .5 - 2, '#7fb7c9'); P(w / 2 - 1, h * .5, 2, h * .5 - 2, '#5a8a9a');
      P(-3, h * .22, w + 6, 6, '#d7282f'); for (let i = -3; i < w + 3; i += 6) P(i, h * .22, 3, 6, '#fff');
      P(-2, -2, w + 4, h * .26, '#4a5568');
      P(6, h * .02, w - 12, 9, '#fff3c4'); c.fillStyle = '#7a3b1c'; c.font = 'bold 7px sans-serif'; c.fillText('구멍가게', x + 9, y + h * .02 + 7.5);
      P(-6, h - 8, 7, 6, '#a8703f'); P(-5, h - 10, 2, 2, '#e74c3c'); P(-2, h - 10, 2, 2, '#e74c3c'); P(w - 1, h - 8, 7, 6, '#a8703f'); P(w, h - 10, 2, 2, '#f1c40f'); P(w + 3, h - 10, 2, 2, '#f1c40f');
      break;
    case 'jangseung':
      P(5, -10, 6, 26, '#9a6b3e'); P(4, -13, 8, 4, '#2a2a2a'); P(6, -7, 1, 2, '#2a2a2a'); P(9, -7, 1, 2, '#2a2a2a'); P(7, -3, 2, 2, '#c0392b');
      P(5, 1, 6, 1, '#2a2a2a'); P(6, 3, 4, 1, '#d7282f');
      break;
    case 'stone':
      P(0, 2, T, 14, '#9a9a8e'); P(1, 1, T - 2, 2, '#b5b5a8'); c.fillStyle = '#3a3a30'; c.font = 'bold 5px sans-serif'; c.fillText('햇살', x + 3, y + 8); c.fillText('마을', x + 3, y + 14);
      break;
    case 'hay': blob(c, x + 8, y + 10, 7, '#d9b356'); P(2, 9, 12, 1, '#b08a2e'); P(4, 4, 8, 1, '#e8cc7a'); break;
    case 'scare': P(7, -4, 2, 16, '#6b4226'); P(1, -1, 14, 2, '#6b4226'); blob(c, x + 8, y - 7, 3, '#f3d9a4'); P(4, -11, 8, 2, '#c9a25a'); P(3, 0, 10, 6, '#3a7bd5'); break;
    case 'jangdok': [[1, 6, 8], [7, 4, 9], [3, 0, 6]].forEach(([a, b, s]) => { blob(c, x + a + s / 2, y + b + 6, s / 2, '#6b3d1c'); P(a + s / 2 - 2, b + 6 - s / 2 - 1, 4, 2, '#4a2a12'); }); break;
    case 'lantern': {
      P(7, -6, 2, 22, '#4a3020'); P(3, -8, 10, 2, '#4a3020');
      const g = .5 + .3 * Math.sin(time * 3 + o.x);
      c.fillStyle = `rgba(255,190,90,${g * .35})`; c.beginPath(); c.arc(x + 4, y + 2, 7, 0, Math.PI * 2); c.fill();
      P(2, -5, 5, 4, '#1d4f9e'); P(2, -1, 5, 5, '#d7282f'); P(3, 4, 3, 1, '#e9b53f');
      break;
    }
  }
}
function drawGarland(c, time) {
  const x1 = 28 * T + 4, x2 = 31 * T + 4, yy = 7 * T - 7;
  c.strokeStyle = '#4a3020'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, yy); c.quadraticCurveTo((x1 + x2) / 2, yy + 8, x2, yy); c.stroke();
  const cols = ['#d7282f', '#e9b53f', '#2f9e6b', '#1d4f9e', '#f5f0e5'];
  for (let i = 1; i < 12; i++) {
    const t = i / 12, px = x1 + (x2 - x1) * t, py = yy + 8 * 2 * t * (1 - t) + Math.sin(time * 4 + i) * .5;
    c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(px - 2, py); c.lineTo(px + 2, py); c.lineTo(px, py + 4); c.fill();
  }
}
function drawVillage(time) {
  const mapW = MW * T, mapH = MH * T;
  let camX = mapW <= LW ? (mapW - LW) / 2 : clamp(player.x * T - LW / 2, 0, mapW - LW);
  let camY = mapH <= LH ? (mapH - LH) / 2 : clamp(player.y * T - 8 - LH / 2, 0, mapH - LH);
  // 대화창이 열리면 플레이어가 대화창 위 빈 곳에 보이도록 카메라를 내린다
  const d = $('#dialog');
  if (!d.hidden) {
    const visH = d.offsetTop / (stage.clientWidth / LW);
    camY = Math.max(camY, player.y * T - 8 - visH / 2);
  }
  state.camY = state.camY == null ? camY : state.camY + (camY - state.camY) * .18;
  camX = Math.round(camX); camY = Math.round(state.camY);
  ctx.fillStyle = '#3f6e2e'; ctx.fillRect(0, 0, LW, LH);
  ctx.save(); ctx.translate(-camX, -camY);
  const x0 = Math.max(0, Math.floor(camX / T)), y0 = Math.max(0, Math.floor(camY / T));
  const x1 = Math.min(MW - 1, Math.ceil((camX + LW) / T)), y1 = Math.min(MH - 1, Math.ceil((camY + LH) / T));
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(ctx, tx, ty, ground[ty * MW + tx], time);
  const items = [];
  objects.forEach(o => { if ((o.x + o.w + 2) * T > camX && (o.x - 2) * T < camX + LW && (o.y + o.h + 2) * T > camY && (o.y - 2) * T < camY + LH) items.push({ y: (o.y + o.h) * T - .1, draw: () => drawObject(ctx, o, time) }); });
  npcs.forEach(n => items.push({ y: n.y * T, draw: () => {
    drawPerson(ctx, n.x * T, n.y * T, NPC[n.id].look, { dir: n.dir, frame: n.walking ? (Math.floor(n.anim) % 2) + 1 : 0 });
    if (!state.talked[n.id]) { const b = Math.sin(time * 5) * 1.5; ctx.fillStyle = '#fff'; ctx.fillRect(n.x * T - 3, n.y * T - 25 + b, 7, 8); ctx.fillStyle = '#e8692a'; ctx.fillRect(n.x * T - 1, n.y * T - 24 + b, 3, 4); ctx.fillRect(n.x * T - 1, n.y * T - 19 + b, 3, 1); }
  } }));
  followers.forEach(f => items.push({ y: f.y * T - .01, draw: () => drawPerson(ctx, f.x * T, f.y * T, f.look, { dir: f.dir, frame: f.anim ? (Math.floor(player.anim) % 2) + 1 : 0 }) }));
  items.push({ y: player.y * T, draw: () => drawPerson(ctx, player.x * T, player.y * T, playerLook(), { dir: player.dir, frame: player.anim ? (Math.floor(player.anim) % 2) + 1 : 0 }) });
  items.sort((a, b) => a.y - b.y).forEach(i => i.draw());
  drawGarland(ctx, time);
  // 가을 저녁빛
  ctx.restore();
  ctx.fillStyle = 'rgba(255,170,90,.08)'; ctx.fillRect(0, 0, LW, LH);
  return { sx: (player.x * T - camX), sy: (player.y * T - camY) - 16 * (playerLook().scale || 1) };
}

/* 시작 */
function startGame() {
  state = newState();
  opts.caption = $('#optCaption').checked;
  $('#optSoft').checked = setup.soft; $('#optSkipFamily').checked = setup.skipFamily; $('#optDefense').checked = opts.defense;
  $('#optSkipFamily').closest('label').hidden = !isMarried();
  buildMap();
  player = { x: 1.6, y: 24.2, dir: 'right', anim: 0 };
  trail = [];
  followers = [];
  const fl = (isMarried() ? [LOOKS.spouse] : []).concat(kidCount() ? kidLooks() : []);
  fl.forEach((L, i) => followers.push({ x: player.x - .1 * (i + 1), y: player.y, dir: 'right', look: L, anim: 0 }));
  closeDialog();
  stage.classList.remove('in-house');
  $('#food').hidden = true; $('#touch').classList.remove('off');
  $('#warn').hidden = true; $('#hint').hidden = true;
  show('scrGame');
  resize();
  updateHUD(); updateGoal();
  fade('햇살마을 어귀 · 추석 오후', 10).then(() => wait(900)).then(unfade);
  state.scene = 'village';
}

/* ================= 장면 2: 큰상 ================= */
let seats = {};
function layoutHouse() {
  const tw = Math.min(LW * .78, 230), th = 40;
  const tx = (LW - tw) / 2;
  // 대화창이 열리면 큰상을 대화창 위로 올려 플레이어 자리가 가려지지 않게 한다
  const d = $('#dialog'), f = $('#food');
  const sc = stage.clientWidth / LW || 1;
  const avail = d.hidden ? LH : d.offsetTop / sc;
  const minTy = (f.hidden ? 0 : (f.offsetTop + f.offsetHeight) / sc) + 22;
  const want = clamp(avail - 4 - 26 - th, minTy, Math.max(minTy, LH * .42));
  state.houseTy = state.houseTy == null ? want : state.houseTy + (want - state.houseTy) * .15;
  const ty = Math.round(state.houseTy);
  const top = ty + 2;
  seats = {
    table: { x: tx, y: ty, w: tw, h: th },
    bigmom: { x: tx + tw * .22, y: top, dir: 'down' },
    bigdad: { x: tx + tw * .5, y: top, dir: 'down' },
    aunt: { x: tx + tw * .78, y: top, dir: 'down' },
    uncle: { x: tx - 8, y: ty + th - 2, dir: 'right' },
    cousin: { x: tx + tw + 8, y: ty + th - 2, dir: 'left' },
    player: { x: tx + tw * .5, y: ty + th + 26, dir: 'up' },
    spouse: { x: tx + tw * .5 - 22, y: ty + th + 26, dir: 'up' },
  };
  kidLooks().forEach((_, i) => { if (!kidCount()) return; seats['kid' + i] = { x: tx + tw * .5 + 20 + i * 13, y: ty + th + 26, dir: 'up' }; });
}
function drawHouse(time) {
  const c = ctx;
  layoutHouse();
  const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const wallH = Math.round(LH * .34);
  P(0, 0, LW, wallH, '#efe2c4');
  for (let i = 0; i < LW; i += 40) { P(i, 0, 3, wallH, '#8b5a2b'); }
  P(0, wallH - 4, LW, 4, '#7a4a24');
  // 병풍
  const sw = Math.min(LW * .6, 200), sx = (LW - sw) / 2, sy = 8, sh = wallH - 16;
  for (let i = 0; i < 6; i++) {
    const px = sx + i * sw / 6;
    P(px, sy, sw / 6 - 1, sh, '#f7edd5'); P(px, sy, sw / 6 - 1, 2, '#7a3b1c'); P(px, sy + sh - 2, sw / 6 - 1, 2, '#7a3b1c');
    blob(c, px + sw / 12, sy + sh * .55, Math.max(2, sw / 30), i % 2 ? '#c96d6d' : '#7da36a');
    P(px + sw / 12 - .5, sy + sh * .55, 1, sh * .35, '#6b4226');
  }
  // 창호
  if (LW > 260) [[8, 10], [LW - 48, 10]].forEach(([x, y]) => { P(x, y, 40, wallH - 22, '#fbf6e6'); for (let i = 0; i <= 40; i += 10) P(x + i, y, 1, wallH - 22, '#a8703f'); for (let j = 0; j < wallH - 22; j += 10) P(x, y + j, 40, 1, '#a8703f'); });
  // 장판
  P(0, wallH, LW, LH - wallH, '#e7c37a');
  for (let y = wallH + 12; y < LH; y += 18) P(0, y, LW, 1, '#d4ab5e');
  const tb = seats.table;
  // 친척(상 뒤)
  const drawRel = id => {
    const s = seats[id]; if (!s) return;
    const L = NPC[id].look;
    const talking = state.speaker === id;
    const bob = talking ? Math.round(Math.sin(time * 10)) : 0;
    drawPerson(c, s.x, s.y + bob, L, { dir: s.dir, seated: true, mouth: talking && Math.sin(time * 14) > 0 ? '#7a2a2a' : undefined, wave: id === 'cousin' && state.allyWave > time });
    if (talking) { P(s.x - 4, s.y - 30, 9, 9, '#fff'); P(s.x - 4, s.y - 30, 9, 1, '#2a1a12'); c.fillStyle = '#e0464f'; c.fillRect(Math.round(s.x - 1), Math.round(s.y - 28), 3, 4); c.fillRect(Math.round(s.x - 1), Math.round(s.y - 23), 3, 1); }
  };
  ['bigmom', 'bigdad', 'aunt'].forEach(drawRel);
  // 큰상
  P(tb.x - 4, tb.y + tb.h - 2, tb.w + 8, 6, '#6b2a14');
  P(tb.x, tb.y + tb.h + 4, 6, 8, '#6b2a14'); P(tb.x + tb.w - 6, tb.y + tb.h + 4, 6, 8, '#6b2a14');
  P(tb.x - 4, tb.y, tb.w + 8, tb.h, '#a5492a'); P(tb.x - 4, tb.y, tb.w + 8, 2, '#c8643c'); P(tb.x - 2, tb.y + 2, tb.w + 4, 1, '#8b3a1e');
  // 음식
  const dish = (x, y, r, col, rim) => { blob(c, x, y, r + 1, rim || '#f3f3f3'); blob(c, x, y, r, col); };
  const cx = tb.x + tb.w / 2, cy = tb.y + tb.h / 2;
  dish(cx, cy, 8, '#e9c46a', '#ffffff');
  for (let i = 0; i < Math.min(state.plate, 10); i++) { const a = i * 2.4; blob(c, cx + Math.cos(a) * 4, cy + Math.sin(a) * 3 - i * .4, 3, i % 2 ? '#e2b04a' : '#f0c75a'); P(cx + Math.cos(a) * 4 - 1, cy + Math.sin(a) * 3 - i * .4, 2, 1, '#5a8a3a'); }
  dish(tb.x + tb.w * .18, cy - 6, 6, '#f5f0e5'); [[-2, -1, '#f8f8f8'], [2, 0, '#a7d08c'], [0, 2, '#f4b6c2'], [-3, 2, '#f8f8f8']].forEach(([a, b, col]) => P(tb.x + tb.w * .18 + a - 1, cy - 6 + b - 1, 3, 2, col));
  dish(tb.x + tb.w * .82, cy - 6, 6, '#fffaf1'); P(tb.x + tb.w * .82 - 4, cy - 9, 4, 4, '#d7282f'); P(tb.x + tb.w * .82 + 1, cy - 8, 4, 4, '#e9c46a');
  dish(tb.x + tb.w * .3, cy + 9, 5, '#8b5a2b'); for (let i = -3; i < 4; i += 2) P(tb.x + tb.w * .3 + i, cy + 7, 1, 4, '#c47a3a');
  dish(tb.x + tb.w * .7, cy + 9, 5, '#f7e7c6'); P(tb.x + tb.w * .7 - 1, cy + 8, 2, 1, '#fff');
  // 김
  for (let i = 0; i < 3; i++) { const t = (time * .8 + i / 3) % 1; c.fillStyle = `rgba(255,255,255,${.5 * (1 - t)})`; c.fillRect(Math.round(cx - 3 + i * 3 + Math.sin(time * 3 + i) * 1.5), Math.round(cy - 10 - t * 12), 1, 3); }
  // 옆자리
  ['uncle', 'cousin'].forEach(drawRel);
  // 앞줄(플레이어 쪽)
  if (isMarried()) {
    const s = seats.spouse, talking = state.speaker === 'spouse';
    drawPerson(c, s.x, s.y + (talking ? Math.round(Math.sin(time * 10)) : 0), LOOKS.spouse, { dir: 'up', seated: true });
    if (talking) { P(s.x - 4, s.y - 30, 9, 9, '#fff'); c.fillStyle = '#2f9e6b'; c.fillRect(Math.round(s.x - 2), Math.round(s.y - 27), 5, 3); }
  }
  kidLooks().forEach((L, i) => { if (!kidCount()) return; const s = seats['kid' + i]; drawPerson(c, s.x, s.y, L, { dir: 'up', seated: true }); });
  const ps = seats.player;
  const eating = state.eatAnim > time;
  drawPerson(c, ps.x, ps.y + (eating ? Math.round(Math.sin(time * 20)) : 0), playerLook(), { dir: 'up', seated: true, belly: state.st.wt >= 60 });
  if (eating) {
    const t = 1 - (state.eatAnim - time) / .9;
    const fx = cx + (ps.x - cx) * Math.min(1, t * 1.6), fy = cy + (ps.y - 14 - cy) * Math.min(1, t * 1.6) - Math.sin(Math.min(1, t * 1.6) * Math.PI) * 12;
    if (t < .65) { blob(c, fx, fy, 3, '#f0c75a'); P(fx - 1, fy, 2, 1, '#5a8a3a'); }
    else { c.fillStyle = '#7a3b1c'; c.font = 'bold 7px sans-serif'; c.fillText('냠냠', ps.x + 7, ps.y - 18); }
  }
  // 저녁빛
  c.fillStyle = 'rgba(255,170,90,.06)'; c.fillRect(0, 0, LW, LH);
  return { sx: ps.x, sy: ps.y - 16 * (playerLook().scale || 1) };
}
function buildQuestions() {
  const cat = category();
  let spec = shuffle(Q[cat] || []);
  if (cat === 'kids') {
    spec.unshift(Q.kidsMix[setup.mix] || Q.kidsMix.mixed);
    if (setup.status === 'kid3') spec.splice(1, 0, Q.kid3);
  }
  spec = spec.slice(0, 4);
  const married = isMarried() ? Q.married.slice() : [];
  return spec.concat(married, shuffle(Q.general));
}
async function startHouse() {
  state.scene = 'house';
  stage.classList.add('in-house');
  resize();
  $('#hint').hidden = true;
  $('#touch').classList.add('off');
  $('#food').hidden = false;
  $('#food').classList.toggle('mini', window.innerWidth < 760);
  syncFoodToggle();
  keys.clear(); input.x = input.y = 0;
  state.queue = buildQuestions();
  state.qi = 0;
  updateGoal(); updateFood();
  await wait(700);
  await say(NPC.bigmom, '왔니? 어서 앉아라. 부침개 방금 부쳤다!', [{ label: '잘 먹겠습니다!', value: 'ok' }], { speakerId: 'bigmom' });
  if (state.ended) return;
  let asked = 0;
  while (asked < state.qn && state.queue.length) {
    const q = state.queue.shift();
    if (q.sens && state.skipFamily) continue;
    state.qi = asked; updateGoal();
    await askQuestion(q);
    if (state.ended) return;
    asked++;
    closeDialog();
    await wait(500);
  }
  if (state.ended) return;
  state.qi = state.qn - 1; updateGoal();
  await say(NPC.bigdad, '자, 이제 과일 먹고 슬슬 일어나자. 다들 오느라 수고 많았다.', [{ label: '(큰상 자리를 마무리한다)', value: 'end' }], { speakerId: 'bigdad' });
  if (state.ended) return;
  endGame(null, '보름달 뜬 귀갓길');
}
async function askQuestion(q) {
  const rel = NPC[q.who];
  const text = state.soft && q.soft ? q.soft : q.text;
  expose(state.soft ? 8 : 14);
  if (state.ended) return;
  const A = ally(), allyId = isMarried() ? 'spouse' : 'cousin';
  // 스트레스가 높으면 믿을 만한 사람이 먼저 손을 내민다
  if (state.st.stress >= 60 && state.allyOffers < 1) {
    state.allyOffers++;
    const offer = isMarried() ? '(하늘이 당신 손등을 톡 친다) 내가 한마디 거들까? 네가 원할 때만.' : '(다온이 눈짓한다) 내가 끼어들어 줄까? 싫으면 가만있을게.';
    state.allyWave = performance.now() / 1000 + 3;
    const o = await say(A, offer, [{ tag: '🤝 함께 대응', label: '응, 같이 얘기해 줘', value: 'yes' }, { tag: '🙂 고마워', label: '고마워. 이번엔 내가 말해 볼게', value: 'no' }], { speakerId: allyId });
    if (state.ended) return;
    if (o.value === 'yes') { await allyHelp(rel, q, true); return; }
    state.support++;
    apply({ cheer: 4 }, '든든함');
  }
  const help = isMarried() ? '하늘, 같이 얘기해 줄래?' : '(다온에게 눈짓) 다온아, 나 좀…';
  const c = await say(rel, text, [
    { tag: '🔀 회피 · 화제 돌리기', label: q.deflect || pick(LINES.deflect), value: 'deflect' },
    { tag: '🚧 선 긋기', label: pick(LINES.boundary), value: 'boundary' },
    { tag: '🔁 되묻기', label: q.askback || pick(LINES.askback), value: 'askback' },
    { tag: '🤝 지원 요청', label: help, value: 'help' },
    state.restUsed < REST_LIMIT
      ? { tag: `🌿 잠깐 쉬기 (남은 ${REST_LIMIT - state.restUsed}번)`, label: LINES.rest, value: 'rest' }
      : { tag: '🌿 잠깐 쉬기 (다 썼어요)', label: '…또 일어나기엔 눈치가 보인다. 꾹 참고 듣는다.', value: 'endure' },
    { tag: '💥 욱하기', label: pick(LINES.snap), value: 'snap', rude: true },
  ], { speakerId: q.who, skippable: true });
  if (state.ended) return;
  const v = c.value;
  if (v === 'skip') {
    apply({ stress: -(state.soft ? 5 : 8), hp: state.soft ? 4 : 7 }, '주제 건너뜀');
    if (q.sens && !state.skipFamily) { state.skipFamily = true; $('#optSkipFamily').checked = true; }
    await say({ name: '안내', role: '편의 기능', look: playerLook() }, q.sens ? '이 주제를 건너뛰었어요. 이후 임신·출산·자녀 질문은 나오지 않아요. (⚙️ 설정에서 바꿀 수 있어요)' : '이 질문을 건너뛰었어요. 큰아버지가 슬쩍 다른 이야기를 꺼냅니다.');
    return;
  }
  if (v === 'endure') {
    state.count.short++;
    apply({ hp: -3 }, '', { hp: '꾹 참은 화' });
    if (state.ended) return;
    chainNag();
    if (state.ended) return;
    await say(rel, pick(LINES.jab), null, { speakerId: q.who });
    return;
  }
  state.count[v]++;
  if (v === 'deflect' || v === 'boundary' || v === 'askback') {
    const line = c.label;
    const ok = await say(PLAYER(), line, null, { defense: true });
    if (state.ended) return;
    const success = ok.value === true;
    if (v === 'deflect') apply(success ? { stress: -6, rep: 4, cheer: 4, hp: 2 } : { stress: -2, rep: 2, cheer: 3 });
    if (v === 'boundary') apply(success ? { stress: -5, rep: 0, cheer: 12, hp: 3 } : { stress: -2, rep: -2, cheer: 10 }, '', { rep: '선 긋기' });
    if (v === 'askback') apply(success ? { stress: -4, rep: 2, cheer: 9 } : { stress: 0, rep: -3, cheer: 7, hp: -2 }, '', { rep: '되묻는 말', hp: '신경전' });
    if (state.ended) return;
    const pool = LINES['r_' + v + (ok.value === false ? '_meh' : '')];
    await say(rel, pick(pool), null, { speakerId: q.who });
    if (state.ended) return;
    // 방어에 성공하지 못하면 잔소리가 한 번 더 이어진다
    if (!success) {
      chainNag();
      if (state.ended) return;
      await say(rel, pick(LINES.jab), null, { speakerId: q.who });
    }
  } else if (v === 'help') {
    await say(PLAYER(), help);
    if (state.ended) return;
    await allyHelp(rel, q, false);
  } else if (v === 'rest') {
    await say(PLAYER(), LINES.rest);
    closeDialog();
    state.restUsed++; state.combo = 0;
    await breather(true);
    if (state.ended) return;
    apply({ hp: 10, stress: -15, rep: -2 }, '숨 고르고 복귀', { rep: '잠깐 자리 비움' });
    if (state.ended) return;
    await say(rel, pick(LINES.r_rest), null, { speakerId: q.who });
  } else if (v === 'snap') {
    apply({ stress: -6, rep: -18, hp: -4, cheer: -2 }, '', { rep: '욱한 말', hp: '치솟은 화' });
    if (state.ended) return;
    await say(rel, pick(LINES.r_snap), null, { speakerId: q.who });
  }
}
async function allyHelp(rel, q, offered) {
  const A = ally(), allyId = isMarried() ? 'spouse' : 'cousin';
  state.helpCount++; state.support++;
  if (offered) state.count.help++;
  await say(A, pick(isMarried() ? LINES.ally_spouse : LINES.ally_cousin), null, { speakerId: allyId });
  if (state.ended) return;
  state.combo = 0;
  apply({ stress: -12, hp: 6, cheer: 10, rep: 1 }, '함께 대응');
  if (state.ended) return;
  const c = await say(rel, pick(LINES.r_ally), [
    { tag: '🤝 서로 지지하기', label: isMarried() ? '(하늘에게) 고마워, 다음엔 내가 네 편 들게.' : '(다온에게) 고마워, 다음엔 내가 도와줄게!', value: 'thanks' },
    { tag: '🙂 그냥 넘어가기', label: '(고개를 끄덕이고 식사를 이어 간다)', value: 'skip' },
  ], { speakerId: q.who });
  if (state.ended) return;
  if (c.value === 'thanks') { state.support++; apply({ cheer: 5 }, '서로 응원'); }
}

/* 큰상 음식 */
const FOOD_COOL = { jeon: .8, water: 10, chat: 12, share: 4, help: 8 };
function updateFood() {
  const now = performance.now() / 1000;
  document.querySelectorAll('#food [data-food]').forEach(b => {
    const k = b.dataset.food, left = (state.cool[k] || 0) - now;
    const busy = defense.active || !$('#ovBreath').hidden || state.ended;
    b.disabled = busy || left > 0 || ((k === 'jeon' || k === 'share') && state.plate <= 0);
    b.dataset.left = left > 0 ? Math.ceil(left) : '';
  });
}
async function useFood(k) {
  if (!state || state.scene !== 'house' || state.ended) return;
  const now = performance.now() / 1000;
  if ((state.cool[k] || 0) > now) return;
  state.cool[k] = now + FOOD_COOL[k];
  const s = state;
  if (k === 'jeon') {
    if (s.plate <= 0) return;
    s.plate--; s.count.eat++; s.eatAnim = now + .9; sfx('eat');
    await wait(500);
    apply({ wt: JEON_GAIN, hp: 2, stress: -2 }, '고소한 부침개', { wt: '부침개 한 장' });
  } else if (k === 'water') {
    state.combo = 0; sfx('water'); apply({ hp: 7, stress: -6 }, '물 한 잔');
  } else if (k === 'chat') {
    sfx('select');
    apply({ hp: 4, stress: -5, rep: 2, cheer: 3 }, isMarried() ? '“하늘, 요즘 보는 드라마 뭐야?”' : '“다온아, 요즘 보는 드라마 있어?”');
  } else if (k === 'share') {
    if (s.plate <= 0) return;
    s.plate--; s.count.share++; sfx('dish');
    apply({ rep: 4, cheer: 2 }, '“큰어머니도 하나 드세요!”');
  } else if (k === 'help') {
    s.count.share++; sfx('dish');
    apply({ rep: 3, hp: -2, stress: -3, cheer: 3 }, '상차림 함께', { hp: '상차림 노동' });
  }
  if (s.ended) return;
  if (s.plate <= 0 && s.st.wt < 100) {
    s.plate = JEON_PLATE;
    floatText('큰어머니: “부침개 더 부쳐 왔다!”', '', 3);
  }
  updateFood();
}
function syncFoodToggle() {
  const mini = $('#food').classList.contains('mini');
  $('#foodToggle').setAttribute('aria-expanded', String(!mini));
}

/* ================= 머리 위 상태 바 배치 ================= */
function placeHeadbars(anchor) {
  const hb = $('#headbars');
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const sc = sw / LW;
  let x = anchor.sx * sc, y = anchor.sy * sc - 6;
  const w = hb.offsetWidth, h = hb.offsetHeight;
  x = clamp(x, w / 2 + 6, sw - w / 2 - 6);
  let minTop = h + 6;
  const food = $('#food');
  if (!food.hidden) minTop = food.offsetTop + food.offsetHeight + h + 6;
  const d = $('#dialog');
  let maxTop = sh - 6;
  if (!d.hidden) maxTop = d.offsetTop - 6;
  y = clamp(y, minTop, Math.max(minTop, maxTop));
  // 대화창에 가려지면 위쪽 빈 공간으로 올린다
  hb.style.left = x + 'px'; hb.style.top = y + 'px';
}

/* ================= 루프 ================= */
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const time = now / 1000;
  if (state && !$('#scrGame').hidden) {
    let anchor = null;
    if (state.scene === 'village' && player) {
      const paused = dlg.open || state.busy || !$('#ovSettings').hidden || !$('#ovBreath').hidden || state.ended;
      if (!paused) updateVillage(dt); else if (!state.intercept) $('#hint').hidden = true;
      if ($('#ovSettings').hidden) updateNpcs(dt);
      anchor = drawVillage(time);
    } else if (state.scene === 'house') {
      anchor = drawHouse(time);
      updateFood();
    }
    if (anchor) placeHeadbars(anchor);
  }
  requestAnimationFrame(frame);
}

/* ================= 타이틀 · 엔딩 그림 ================= */
function sky(c, w, h, top, bottom) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function moon(c, x, y, r) { c.fillStyle = 'rgba(255,243,196,.25)'; c.beginPath(); c.arc(x, y, r + 6, 0, 7); c.fill(); blob(c, x, y, r, '#fff3c4'); blob(c, x - r / 3, y - r / 4, 2, '#f1e3a6'); }
function drawTitleArt() {
  const cv2 = $('#titleArt'), c = cv2.getContext('2d'); c.imageSmoothingEnabled = false;
  const W = cv2.width, H = cv2.height;
  sky(c, W, H, '#5b3a6e', '#f3a86b');
  moon(c, 262, 32, 14);
  c.fillStyle = '#7a4a6e'; for (let x = 0; x < W; x++) c.fillRect(x, 70 + Math.sin(x / 30) * 8, 1, 80);
  c.fillStyle = '#5a6b3a'; for (let x = 0; x < W; x++) c.fillRect(x, 86 + Math.sin(x / 18 + 1) * 5, 1, 60);
  // 큰집 지붕
  const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  P(170, 74, 110, 26, '#efe2c4'); for (let i = 172; i < 280; i += 18) P(i, 74, 3, 26, '#8b3a1e');
  P(160, 62, 130, 14, '#3d4656'); P(156, 59, 6, 5, '#3d4656'); P(288, 59, 6, 5, '#3d4656'); P(172, 52, 106, 12, '#4b5568'); P(168, 50, 114, 3, '#252c38');
  P(0, 108, W, 32, '#dcbc80'); P(0, 106, W, 2, '#c4a265');
  // 감나무
  P(36, 70, 6, 40, '#6b4226'); blob(c, 39, 58, 22, '#4b7a34'); blob(c, 30, 52, 12, '#5f9142');
  [[24, 50], [44, 46], [50, 62], [30, 66], [40, 56], [56, 52]].forEach(([x, y]) => { P(x, y, 3, 3, '#ff7a1a'); P(x, y, 1, 1, '#ffb066'); });
  // 줄 깃발
  c.strokeStyle = '#3a2a20'; c.beginPath(); c.moveTo(70, 40); c.quadraticCurveTo(150, 60, 240, 44); c.stroke();
  for (let i = 1; i < 16; i++) { const t = i / 16, x = 70 + 170 * t, y = 40 + (1 - t) * t * 2 * 20 + (44 - 40) * t * t + 0; c.fillStyle = ['#d7282f', '#e9b53f', '#2f9e6b', '#1d4f9e', '#f5f0e5'][i % 5]; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.lineTo(x, y + 6); c.fill(); }
  // 인물
  c.save(); c.scale(2, 2);
  drawPerson(c, 48, 66, LOOKS.female, { dir: 'down' });
  drawPerson(c, 63, 66, LOOKS.neutral, { dir: 'down', wave: true });
  drawPerson(c, 78, 66, LOOKS.male, { dir: 'down' });
  drawPerson(c, 108, 66, LOOKS.bigmom, { dir: 'left' });
  drawPerson(c, 122, 66, LOOKS.bigdad, { dir: 'left' });
  c.restore();
  // 말풍선
  P(222, 78, 74, 22, '#fff'); P(222, 78, 74, 1, '#2a1a12'); P(222, 99, 74, 1, '#2a1a12'); P(222, 78, 1, 22, '#2a1a12'); P(295, 78, 1, 22, '#2a1a12'); P(232, 100, 6, 4, '#fff');
  c.fillStyle = '#2a1a12'; c.font = 'bold 9px sans-serif'; c.fillText('취업은? 결혼은?', 226, 92);
}
function drawEndArt(key) {
  const cv2 = $('#endArt'), c = cv2.getContext('2d'); c.imageSmoothingEnabled = false;
  const W = cv2.width, H = cv2.height;
  const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const pl = playerLook();
  const indoor = key === 'rude' || key === 'full' || key === 'jeonking' || key === 'together';
  if (indoor) {
    P(0, 0, W, 60, '#efe2c4'); for (let i = 0; i < W; i += 40) P(i, 0, 3, 60, '#8b5a2b'); P(0, 60, W, 60, '#e7c37a');
    P(40, 70, 160, 22, '#a5492a'); P(40, 70, 160, 2, '#c8643c'); P(46, 92, 6, 10, '#6b2a14'); P(188, 92, 6, 10, '#6b2a14');
  } else {
    sky(c, W, H, '#2a2450', '#7a5a8a'); moon(c, 190, 30, 16);
    P(0, 90, W, 30, '#5a6b3a'); P(0, 98, W, 22, '#dcbc80');
  }
  c.save(); c.scale(2, 2);
  if (key === 'hwabyeong') {
    c.restore();
    P(20, 76, 120, 12, '#a8703f'); P(20, 76, 120, 2, '#c98b54');
    c.save(); c.scale(2, 2);
    drawPerson(c, 40, 40, pl, { dir: 'up', seated: true });
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px sans-serif'; c.fillText('후우…', 92, 52);
    blob(c, 100, 64, 3, '#f3f3f3'); P(98, 60, 1, 3, 'rgba(255,255,255,.5)');
    return;
  }
  if (key === 'rude') {
    ['bigmom', 'bigdad', 'aunt'].forEach((id, i) => drawPerson(c, 36 + i * 22, 36, NPC[id].look, { dir: 'down', seated: true }));
    drawPerson(c, 60, 58, pl, { dir: 'up', seated: true });
    c.restore();
    c.fillStyle = '#e0464f'; c.font = 'bold 14px sans-serif'; ['!', '!!', '?!'].forEach((t, i) => c.fillText(t, 66 + i * 44, 22));
    blob(c, 180, 84, 3, '#f8f8f8'); blob(c, 194, 88, 3, '#a7d08c');
    return;
  }
  if (key === 'full') {
    drawPerson(c, 60, 58, pl, { dir: 'down', seated: true, belly: true });
    c.restore();
    [70, 120, 170].forEach(x => { blob(c, x, 80, 9, '#fff'); blob(c, x, 80, 7, '#f3eee2'); });
    c.fillStyle = '#7a3b1c'; c.font = 'bold 11px sans-serif'; c.fillText('통통 ♪', 140, 50);
    return;
  }
  if (key === 'together') {
    drawPerson(c, 52, 58, pl, { dir: 'down', seated: true, waveR: true });
    drawPerson(c, 68, 58, isMarried() ? LOOKS.spouse : LOOKS.cousin, { dir: 'down', seated: true, wave: true });
    c.restore();
    c.fillStyle = '#e0464f'; c.font = '14px sans-serif'; c.fillText('♥', 114, 40); c.fillText('♥', 150, 30);
    return;
  }
  if (key === 'jeonking') {
    drawPerson(c, 60, 58, pl, { dir: 'down', seated: true, wave: true, waveR: true });
    ['bigmom', 'uncle'].forEach((id, i) => drawPerson(c, 30 + i * 60, 58, NPC[id].look, { dir: i ? 'left' : 'right', seated: true }));
    c.restore();
    blob(c, 120, 50, 12, '#fff'); for (let i = 0; i < 5; i++) blob(c, 116 + i * 2, 48 - i, 6, i % 2 ? '#e2b04a' : '#f0c75a');
    c.fillStyle = '#e9b53f'; c.font = 'bold 12px sans-serif'; c.fillText('✦ 부침개 대장 ✦', 72, 22);
    return;
  }
  // peace
  drawPerson(c, 50, 54, pl, { dir: 'right', frame: 1 });
  const fl = (isMarried() ? [LOOKS.spouse] : []).concat(kidCount() ? kidLooks() : []);
  fl.forEach((L, i) => drawPerson(c, 36 - i * 10, 54, L, { dir: 'right', frame: (i % 2) + 1 }));
  c.restore();
  P(118, 86, 10, 10, '#d7282f'); P(118, 86, 10, 2, '#e9b53f');
}

/* ================= 버튼 연결 ================= */
function toggleSettings(force) {
  const ov = $('#ovSettings');
  const open = force !== undefined ? force : ov.hidden;
  ov.hidden = !open;
  if (open) { keys.clear(); $('#btnSettingsClose').focus({ preventScroll: true }); }
  else if (dlg.buttons[0] && !isTouch()) dlg.buttons[0].focus({ preventScroll: true });
}
$('#btnStart').addEventListener('click', () => { stepIdx = 0; renderStep(); show('scrSetup'); sfx('select'); });
$('#btnSetupNext').addEventListener('click', nextStep);
$('#btnSetupBack').addEventListener('click', () => { if (stepIdx === 0) { show('scrTitle'); return; } stepIdx--; renderStep(); });
$('#btnMute').addEventListener('click', () => setMuted(!muted));
$('#btnSettings').addEventListener('click', () => toggleSettings(true));
$('#btnSettingsClose').addEventListener('click', () => toggleSettings(false));
$('#btnToTitle').addEventListener('click', () => { toggleSettings(false); closeDialog(); if (state) { state.ended = true; state.scene = 'title'; } show('scrTitle'); });
$('#optCaption').addEventListener('change', e => { opts.caption = e.target.checked; if (!opts.caption) $('#caption').hidden = true; });
$('#optDefense').addEventListener('change', e => { opts.defense = e.target.checked; });
$('#optSoft').addEventListener('change', e => { setup.soft = e.target.checked; if (state) state.soft = e.target.checked; });
$('#optSkipFamily').addEventListener('change', e => { setup.skipFamily = e.target.checked; if (state) state.skipFamily = e.target.checked; });
$('#btnBreathDone').addEventListener('keydown', e => e.stopPropagation());
$('#btnDefend').addEventListener('click', () => defense.press && defense.press());
$('#btnSkipTopic').addEventListener('click', () => { if (dlg.skip) { finishTyping(); dlg.skip(); } });
$('#foodToggle').addEventListener('click', () => { $('#food').classList.toggle('mini'); syncFoodToggle(); });
document.querySelectorAll('#food [data-food]').forEach(b => b.addEventListener('click', () => useFood(b.dataset.food)));
$('#btnRetry').addEventListener('click', () => startGame());
$('#btnReSetup').addEventListener('click', () => { stepIdx = 0; renderStep(); show('scrSetup'); });
window.addEventListener('resize', () => { if (!$('#scrGame').hidden) resize(); });

renderSources();
setMuted(muted);
drawTitleArt();
requestAnimationFrame(frame);
})();
