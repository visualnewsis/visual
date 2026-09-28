# 인수인계 — 편집# 「AT, 라리가 '2강 IN'」

- 작성: 2026-09-25(금), 집 PC에서 작성
- 목표 출고일: **2026-09-28(월)**, 회사 PC에서 출고
- 상세 작업 이력은 같은 폴더의 `CLAUDE_CHANGELOG.md`에 있다.

---

## 0. 가장 먼저 할 일 — 파일을 회사 PC로 옮기기

**이 폴더는 아직 git에 커밋되지 않았다.** 파일이 집 PC(`C:\Users\user\Documents\editshop\atleti-2gang\`)에만 있다.

이 저장소는 `main`에 push하면 GitHub Pages로 바로 공개 배포된다. 그래서 출고 전에는 `main`에 올리면 안 된다. 옮기는 방법은 둘 중 하나다.

- **A. 작업 브랜치로 push (권장)**: 집 PC에서 `atleti-2gang/` 폴더만 새 브랜치(예: `draft/atleti-2gang`)에 커밋해 push한다. 회사 PC에서 그 브랜치를 받으면 된다. main에 올리지 않으면 공개되지 않는다.
- **B. 폴더 통째로 복사**: USB나 클라우드로 `atleti-2gang/` 폴더(약 4.3MB)를 옮긴다.

집 PC 작업 트리에는 이 작품과 무관한 미커밋 변경도 있다(`homecoming/`, `portal/homecoming/`, 여러 `print-test` 파일 등). **함께 커밋하지 말 것.**

---

## 1. 폴더 구조

```
atleti-2gang/
├─ atleti_2gang_in_claude_v1.html   ← 본문(단일 HTML/CSS/JS, 약 100KB)
├─ CLAUDE_CHANGELOG.md              ← 작업 이력 전체
├─ HANDOFF.md                       ← 이 문서
└─ images/
   ├─ hero-derby-bellingham.jpg     히어로 (레알전)
   ├─ celebrate-barrios.jpg         '팀 전체' 챕터
   ├─ board-liverpool-ucl.jpg       실제 경기 → 전술판 전환
   ├─ villarreal-shield.jpg         이강인 스포트라이트
   ├─ simeone-sideline.jpg          '새로운 시도' 챕터
   ├─ sociedad-away.jpg             소시에다드전
   ├─ osasuna-duel.jpg              데이비드 3경기 연속 골
   ├─ real-duel-portrait.jpg        REAL 모드
   ├─ simeone-lee-touchline.jpg     질문 전환
   ├─ ending-kangin-back.jpg        엔딩 배경
   ├─ simeone-wave-ucl.jpg          엔딩 시메오네
   ├─ simeone-airport.jpg           (미사용)
   ├─ avatar-lee-gol.jpg            (미사용 · 구단 SNS 그래픽)
   ├─ avatar-baena-gol.jpg          (미사용 · 구단 SNS 그래픽)
   └─ faces/                        전술판 선수 얼굴 256×256
      ├─ lee-newsis.jpg             이강인 (뉴시스 사진 celebrate-barrios에서 크롭)
      └─ baena, david, julian, giuliano, llorente, pubill,
         cardoso, koke, lookman, hjulmand.jpg   (위키미디어 공용 CC BY-SA)
```

- 미사용 사진 3장은 출고 전에 지워도 된다.
- 원본 사진 위치: `D:\Workkk\이미지\NISI2026…jpg` 외 14장
- 기획 패키지 위치: `D:\Workkk\이미지\AT_2GANG_IN_MASTER_V4.zip`

---

## 2. 현재 페이지 구성 (위에서 아래로)

| 순서 | 내용 |
|---|---|
| 히어로 | 제목 `AT, 라리가 / 2강 IN`(두 줄 폭 자동 맞춤), 질문 "이강인을 움직이면 누가 살아날까?", 7라운드 순위 띠 |
| **직접 해보기 1** | 이강인 드래그 → 3개 자리(우측 안쪽 / 중앙 10번 / 세컨드 스트라이커)에 붙음 → 주변 선수가 차례로 반응. 렌즈(전체/공간/패스), 근거 배지. 아래에 '둘 다 넣으면?' 이동 버튼 |
| 챕터 | 한 명을 움직이면 팀 전체가 움직입니다 (세비야전 9명·22패스·74초, 편집#005 「120%의 이강인」 링크) |
| 01 | 리버풀전 사진 → 전술판 전환 |
| 02 | 이강인은 안으로, 9번은 골문 앞으로. 오른쪽 측면이 빕니다 |
| 03 | 새로운 시도 — 소시에다드전 교체, 시메오네 실제 인용 2개(ESPN) |
| 04 | 데이비드 세 경기 연속 골, 구단 역사상 7번째 |
| 05 · **직접 해보기 2** | 최전방 선택(데이비드/훌리안/둘 다) → 12/11 → 한 명 빼기(바에나/줄리아노/중원) → 재배열. 훌리안은 이강인이 우측일 때만 선택 가능 |
| 06 · **직접 해보기 3** | 나의 AT ↔ REAL 전환. 레알전 5단계 해설(레알 왼쪽 공략 → 푸빌·요렌테·줄리아노 → PK(그리말도) → 요렌테 RB → 데이비드 골) |
| 질문 전환 | "이강인은 어디에 있어야 할까?"에 취소선 → "누구를 살리고, 무엇을 내려놓을까" |
| 07 | 내가 짠 AT 결과 카드 + 공유(링크에 상태 저장 `?at=…`) + 처음부터 다시 |
| 엔딩 | 첫 질문 되받기 → "한 명이 아니었습니다" → 독자가 내려놓은 것 → 2강 IN → NEXT 11월 8일 바르사전 → 시메오네 |
| 공통 | 편집# 더보기 캐러셀, 편집# 브랜드 배너, 푸터, '근거·방법론' 드로어(출처 S01~S14, 사진 크레디트) |

---

## 3. 출고 전 반드시 할 일 (체크리스트)

### 3-1. 메인 관리자 결정이 필요한 것 (AGENTS.md 규정)
- [ ] **편집# 번호 부여**: 현재 번호 없이 `편집#`으로만 표기했다. 번호를 정하면 배너 워터마크, OG 제목 등에 반영한다.
- [ ] **편집# 캐러셀 등록**: `assets/editshop-carousel.js`의 stories 목록에 추가하고 캐시 버전을 올린다. 공용 파일이라 승인이 필요하다.
- [ ] **편집# 랜딩(`editshop/index.html`) 노출 여부**: 공용 랜딩이라 승인이 필요하다.
- [ ] 필요하면 VISUAL NEWSIS 메인 `ALL STORIES` 반영

### 3-2. 파일·메타 정리
- [ ] 파일명 `atleti_2gang_in_claude_v1.html`을 **`index.html`로 변경**한다. canonical과 OG URL이 `https://visual.newsis.com/atleti-2gang/` 기준이다.
- [ ] **발행일 수정**: `2026-09-25T09:00:00+09:00`를 실제 출고 시각으로 바꾼다. 네 곳에 있다: `article:published_time`, `article:modified_time`, JSON-LD의 `datePublished`, `dateModified`.
- [ ] 폴더명 `atleti-2gang`을 그대로 쓸지 확정한다. 바꾸면 canonical, OG, JSON-LD의 URL도 모두 바꿔야 한다.
- [ ] 미사용 이미지 3장 삭제 여부 결정

### 3-3. 사실 재확인 (출고 당일)
- [ ] **순위**: 9월 20일 7라운드 직후 기준으로 바르사 21, AT 16, 레알 15. AT의 다음 리그 경기가 10월 10일(알라베스 원정)이라 9월 28일 출고 시점에도 유효하다. 당일 한 번 더 확인할 것.
- [ ] **11월 8일 바르사 홈경기**: 라리가 공식 일정 기준
- [ ] 이강인 기록 "리그 7경기·UCL 1경기, 528분, 2골 1도움 (9월 24일 기준, AS)"
- [ ] 레알전 PK를 그리말도가 넣은 것 (DSN 등 보도)
- [ ] AS 원문(S03)은 사이트 차단으로 직접 열지 못했다. 시메오네 인용은 **ESPN 영문 보도 번역**이다(본문에 명시함).
- [ ] 사진 캡션의 상대팀과 경기 날짜 표기, 뉴시스 원 크레디트(AP·EPA 등) 확인

### 3-4. 선택 사항 (논의만 했고 반영하지 않음)
- [ ] 엔딩 NEXT 카드에 "다음 경기: 10월 10일 알라베스 원정" 한 줄 추가
- [ ] 순위 띠에 "(10월 10일 8라운드 전까지 유지)" 추가
- [ ] 전술판 LB 슬롯을 `GRIMALDO`로 표기할지 여부 (현재는 LB)
- [ ] 국내 해설위원 코멘트 한 줄 (자체 취재 보강 — 수상 경쟁력용)

### 3-5. 검증
- [ ] **실제 아이폰 Safari·안드로이드 Chrome에서 이강인 드래그와 페이지 스크롤이 서로 방해하지 않는지** 확인한다. 지금까지는 headless Chrome의 터치 에뮬레이션으로만 확인했다.
- [ ] 실제 배포 경로에서 이미지, 공용 헤더, 캐러셀이 뜨는지 확인한다(`../assets/…`, `../kangin/`, `../shelter/images/ending.webp` 참조).
- [ ] 출고 뒤 실제 URL 응답을 확인한다. GA 태그는 1회만 들어가 있다(이미 확인).

---

## 4. 수정할 때 알아둘 구조 (JS 주요 지점)

| 찾을 문자열 | 내용 |
|---|---|
| `const ASSETS=` | 사진 슬롯. `avatars`는 선수 얼굴(`{src,pos,size}`), `faces`는 위키 크레디트 목록, `photos`는 사진 목록 |
| `const SOURCES=` | 출처 S01~S14. 드로어에 자동 표시된다 |
| `const STATES=` | 전술 상태 6개. 문구(`copy`), 얻는 것/잃는 것(`gain`/`cost`), 확인/해석(`fact`/`interp`), 변화 한 줄(`head`), 좌표(`pos`) |
| `const KIND=` | 근거 표시 세 가지: 경기 보도로 재구성 / 보도 + 기자 해석 / 가상 조합 |
| `function bothLayout` | 12/11 배치와 선수를 뺀 뒤 재배열 |
| `const SAC=` | 뺄 수 있는 선수별 문구 |
| `const REAL_STEPS=` | 레알전 해설 5단계 |
| `const KO=` | 선수 한글 이름 |
| `?at=역할.최전방.둘다.뺀선수` | 공유 링크 상태 (예: `?at=TEN.DAVID.1.baena`) |

- 공용 파일(`assets/*`, `editshop/index.html`, 루트 `index.html`)은 **하나도 수정하지 않았다.**
- `.claude/launch.json`(git 무시 대상)에 로컬 확인용 서버 항목 `static-site-atleti`(포트 5177)를 추가했다. 서버 스크립트는 집 PC 임시 폴더에 있으므로, 회사 PC에서는 아무 정적 서버로 저장소 루트를 열면 된다.

---

## 5. 지금까지 받은 피드백 요약 (다음 작업자 참고)

- AI 같은 말투는 금지다. 사람이 쓰는 기사체로 쓰고, "바깥 통로" 같은 번역투 대신 축구 용어("오른쪽 측면이 빕니다")를 쓴다.
- 판단을 묻는 질문에는 먼저 답만 하고, 수정은 지시를 받은 뒤에 한다.
- 모바일에서 스크롤 고정(sticky pin) 연출은 쓰지 않는다.
- 편집# 완성도 기준: 도입의 맥락(순위), 실명 인용, 수미상관 결말, 다음 일정.
- 외부 리뷰(GPT) 지적 6개와 버그 3개는 모두 반영했다(changelog 마지막 항목 참조).
