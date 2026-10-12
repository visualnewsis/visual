/* Match finished: Korea 2:0 Uzbekistan. Son scored the opener with a right-footed free kick. */
const recordMilestone = {
  goal: 59,
  totalGoals: 59,
  confirmed: true,
  date: '2026-10-06',
  opponent: '우즈베키스탄',
  venue: '용인미르스타디움',
  competition: '국가대표 친선경기',
  matchComplete: true,
  finalScore: '2:0',
  minute: '전반 6분',
  bodyPart: '오른발',
  method: '직접 프리킥',
  verifiedAt: '2026-10-06T22:14:54+09:00',
  source: 'https://www.newsis.com/view/NISX20261006_0003816328',
  photo: 'assets/intro-59-6.webp',
  mosaicPhoto: 'assets/intro-59-6-focus.webp',
  openingLastPhoto: 'assets/intro-59-6.webp',
  photoCredit: '2026 우즈베키스탄전 · 사진 = 뉴시스',
  photos: ['assets/intro-59-1.webp','assets/intro-59-2.webp','assets/intro-59-3.webp','assets/intro-59-4.webp','assets/intro-59-6.webp'],
  caption: '2026.10.06 · 우즈베키스탄전 · 용인미르스타디움'
};
const recordMilestoneSummary = recordMilestone.matchComplete
  ? `최종 한국 ${recordMilestone.finalScore} ${recordMilestone.opponent} · 통산 ${recordMilestone.totalGoals}골.`
  : '59호골 달성 확인 · 경기 진행 중.';
const recordMilestoneDescription = `전반 6분, 자신이 얻은 프리킥을 오른발로 낮게 차 선제골을 넣었다. 59호골로 차범근의 58골을 넘어 한국 남자 A매치 최다 득점 단독 1위에 올랐다. ${recordMilestone.matchComplete ? `최종 스코어 한국 ${recordMilestone.finalScore} 우즈베키스탄. 경기 후 통산 ${recordMilestone.totalGoals}골.` : '최종 스코어와 경기 후 총득점은 종료 후 확인한다.'}`;

// The independently audited historical list stays intact; the browser's complete archive includes the confirmed record goal.
const goalRecordData = [...goalData,[recordMilestone.date,recordMilestone.opponent,recordMilestone.venue,recordMilestone.finalScore,recordMilestone.competition]];
const goalRecordMeta = [...goalMatchMeta,{goalsInMatch:1,ordinal:1}];
const goalRecordHighlights = {...goalHighlights,59:['그 자리에 닿은 59번째 골.',recordMilestoneDescription]};
