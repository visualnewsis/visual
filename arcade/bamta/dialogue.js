export const COWORKER_LINES={
  office:[
    '벌써 가? 난 이것만 마무리하고 가려고.',
    '엘리베이터 오늘 좀 느리더라. 미리 눌러 놔.',
    '국장님 아직 안 가셨어. 아까 복도에서 봤어.',
    '퇴근길에 비 온대. 우산 챙겼어?',
    '내일 보자. 오늘도 수고했어.'
  ],
  hallway:[
    '이제 퇴근하세요? 저는 물 한 잔만 마시고 가려고요.',
    '오늘 마지막 기사까지 올리셨어요? 그럼 얼른 들어가세요.',
    '국장님 방금 엘리베이터 쪽으로 가셨어요.',
    '저도 곧 갈게요. 먼저 내려가 계세요.',
    '신문도 챙겨 가시네요. 집에서도 읽으시려고요?'
  ],
  writing:[
    '잠깐만. 이 문장만 고치면 끝이야.',
    '사진 설명이 제일 오래 걸리네. 먼저 가.',
    '저장만 하고 나도 나갈게.',
    '아, 제목 또 바뀌었어. 이번엔 진짜 마지막이래.'
  ],
  photos:[
    '이 사진 둘 중에 뭐가 나아? 아냐, 내가 더 볼게.',
    '사진 전송이 아직 안 끝났어. 먼저 가.',
    '모니터만 봤더니 눈 아프다. 너라도 얼른 퇴근해.',
    '내일 쓸 사진까지 정리하고 있어. 거의 끝났어.'
  ],
  desk:[
    '응, 나 들었어. 먼저 가도 돼.',
    '이거 저장하고 바로 일어날 거야.',
    '오늘 진짜 길었다. 조심히 가.',
    '퇴근하고 연락해. 저녁은 먹어야지.'
  ]
};

export function nextCoworkerLine(person){
  const lines=COWORKER_LINES[person.dialogue]||COWORKER_LINES.desk;
  const index=person.talkIndex||0;person.talkIndex=(index+1)%lines.length;
  return lines[index];
}
