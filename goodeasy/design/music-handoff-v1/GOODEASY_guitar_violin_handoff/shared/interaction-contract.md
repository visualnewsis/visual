# 상호작용 계약 / 화면 상태

## 공통
- 초기 상태 `READY`는 입력 가능한 악기만 보여준다. **재생/처음부터/느리게 보기 버튼은 첫 체험에 없음**.
- 사용자 직접 조작 이벤트만 소리 시작. AudioContext는 사용자 gesture에서 resume. 소리 사용 불가면 시각 입력은 유지하고 `오디오를 켤 수 없습니다` 상태를 알림.
- 체험 이벤트 기록 `performanceLog`는 immutable source of truth. 관찰 진입 시 `structuredClone(performanceLog)` 또는 JSON-safe deep clone으로 `observationSnapshot` 생성. 관찰에서 선택 음/배속/타임라인을 바꿔도 원본 배열·객체는 수정하지 않는다.
- 기록 구조 `{version:1, instrument:'guitar'|'violin', tuning:[...], events:[...], capturedAtEpochMs, sustain:null}`. 바이올린의 페달은 없음.
- 첫 체험 → 관찰 → 제작 과정. 첫 체험 복귀 시 기존 입력 기록을 유지하고 사용자가 새 입력을 하면 새 이벤트 추가.
- 관찰 UI에서 재생/정지/속도 0.25/0.5/1/2, 부품 확대, 단면 표시, 단계 이동. 관찰 오디오는 기본 무음; 첫 체험 합성음과 구별.

## 상태 전이
| 기구 | 현재 | 이벤트 | 다음 | 소리/기록 |
|---|---|---|---|---|
| guitar | READY | pointerdown on string | PLUCKED | 단발음/1건 기록 |
| guitar | PLUCKED | crossing new string | PLUCKED | 새 현 단발음/1건 기록 |
| guitar | PLUCKED | pointerup/cancel/blur | READY | 포인터 종료; 이미 발생한 감쇠음은 자연 종료 가능 |
| violin | READY | pointerdown bow | CONTACT_IDLE | 무음/접촉 준비 |
| violin | CONTACT_IDLE | move speed>threshold | BOWING | 연속음 시작/샘플 |
| violin | BOWING | no movement >=80ms | CONTACT_IDLE | 즉시 게인 감쇠/발음 중단 |
| violin | BOWING/CONTACT_IDLE | pointerup/cancel/lostcapture/blur/hidden | READY | 즉시 stopSound/이벤트 종료 |
| both | any | enter observation | OBSERVING | 로그 복제, 첫 체험 입력 비활성 |
| both | OBSERVING | return | READY | 관찰 snapshot 폐기 가능; 원본 로그 보존 |

## 제스처 우선순위
1. 첫 체험 악기 SVG 입력 영역의 pointerdown은 악기 입력; `touch-action:none`은 해당 영역에만.
2. 악기 영역 밖은 일반 세로 스크롤; 화면 전체에서 preventDefault 금지.
3. 관찰 모드 타임라인 thumb > 부품 선택 > 3D 카메라 회전 > 페이지 스크롤. pointer capture는 단일 소유자.
4. 모바일 320px: 가로 스크롤로 악기 입력을 숨기지 말 것. 44px 이상 현 버튼 별도 노출. safe-area `env(safe-area-inset-bottom)` 적용.
5. 화면 가로보기는 선택적이며 강제하지 않음. `100dvh` 우선, `100svh` 폴백.

## 접근성 / 버튼 상태
- button 최소 44×44px; 기본 배경 #23292D/글자 #F3EEE5; focus 2px #F3D5A4 + 2px offset; pressed #75502E; disabled #1B2022/#7F898B; error #472D2D/#E3A39A.
- `aria-pressed`는 선택 현 버튼에만. `aria-live=polite`로 현재 현/관찰 진입을 알림; 반복 샘플은 live region으로 알리지 않는다.
- Escape는 열려 있는 보조 메뉴를 닫고 트리거로 포커스 복귀. 화면 전환 후 제목에 tabindex=-1로 초점 이동; 되돌아갈 때 직전 체험 조작으로 복귀.
- 확대 텍스트 200%, 320px 너비, prefers-reduced-motion에서 스크롤/애니메이션 생략 검수.

## 스타일 토큰
`--bg:#121619; --surface:#202529; --text:#F3EEE5; --muted:#AEB5B6; --accent:#D9AD71; --focus:#F3D5A4; --error:#E3A39A; --touch:44px; --space:4px/8px/12px/16px/24px; --radius:12px; --icon:20px; --stroke:1.75px;`.

## 크레딧
첫 체험 하단, 제작 과정, 사이트 푸터 모두 `크리에이티브 디렉터 = 안재현`.
