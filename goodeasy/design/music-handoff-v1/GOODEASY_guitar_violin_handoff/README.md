# GOODEASY 02 기타 / 06 바이올린 구현 인계 v1.0

정적 HTML / CSS / Vanilla JavaScript 전용. 경로 `/goodeasy/guitar/`, `/goodeasy/violin/`.

- `02_guitar/{desktop,mobile,components}.svg` 및 `06_violin/...`: **입력 좌표와 상태 검토용 SVG**, 최종 비주얼이 아님. 한국어는 SVG `<text>`이며 편집 가능.
- 이미지 생성으로 받은 직전 PC·모바일 보드가 **미감 목표**. 그 렌더의 잘못된 문자/구조는 기계 검증에 사용하지 말 것.
- `shared/interaction-contract.md`: 포인터·키보드·취소·상태·복사 규칙.
- `shared/interaction-core.js`: 라이브러리 없는 이벤트/기록 로직 예제. 실제 악기 음원이나 완성 앱 아님.
- `shared/sources.md`: 확인한 제작사 원문 링크.
- `shared/series-number-mapping.csv`: 기존 7편 → 현재 9편 대응.
- SVG의 목재 형상은 교육용 단순화이며 CAD·실측 치수·검증된 운동학이 아님.

### 출시 전 필수 검수
1. guitar 각 현에 대해 보이는 선과 입력 히트 영역 일치. 6개 현 E2 A2 D3 G3 B3 E4.
2. violin 활 정지/포인터 취소/탭 전환/창 blur/hidden 시 발음 중단.
3. 관찰은 직전 행동의 복제본을 소비하고 첫 체험 원본을 변경하지 않음.
4. 첫 체험에 재생 버튼 없음. 관찰 단계에서만 타임라인/재생.
5. iOS Safari/Android Chrome/키보드/스크린리더 검수. 오디오 시작은 사용자 제스처에서만.
6. 크레딧 `크리에이티브 디렉터 = 안재현`: 첫 체험 하단, 제작 과정, 푸터.
