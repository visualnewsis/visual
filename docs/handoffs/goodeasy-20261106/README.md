# 굳이구지 — 새 Mac 작업 인계

정리 기준: 이 방에서 소유자가 확정한 지시와 2026-11-05 마지막 성공 배포. 2026-11-06 기기 이전 요청으로 보존했다. **정책은 루트 AGENTS.md 24절이 단일 원본이다.** 이 문서는 실행 위치·상태·산출물 안내이며 별도의 정책 복제본이 아니다.

## 1. Mac에서 첫 작업

1. GitHub 인증 후 `https://github.com/visualnewsis/visual` 저장소의 최신 main을 받는다. Windows 작업 폴더 전체를 main으로 덮어 복원하지 않는다.
2. 저장소 루트의 `AGENTS.md`, 이 파일, 현재 `goodeasy/index.html`을 읽는다. `goodeasy/README.md`에는 과거 편성·noindex 개발 기록이 누적돼 있으므로 현재 상태를 그 문서만으로 정하지 않는다.
3. `git status --short`, `git branch --show-current`, `git fetch origin main`, `git log -1 origin/main`으로 기준을 확인한다. 미커밋 작업은 보존한다. 새로운 작업 브랜치는 `codex/`로 시작한다.
4. Mac에서는 기본 `git`을 사용한다. Windows의 `C:\Program Files\Git\cmd\git.exe`나 `github-myrepo` SSH 별칭을 복사해 명령을 실행하지 않는다. Mac 계정의 GitHub/SSH 인증을 별도로 설정한다. 비밀번호·토큰·쿠키·개인 키를 이 문서나 채팅에 넣지 않는다.
5. Python 3와 Node.js 실행 여부를 확인한다. 새 React/Next 서버나 새 배포 프로젝트를 만들지 않는다. 기존 HTML/CSS/순수 JS를 수정한다.

```sh
git clone https://github.com/visualnewsis/visual.git
cd visual
# 이미 clone돼 있다면 위 두 줄 대신 해당 저장소로 이동하고 상태를 먼저 확인한다.
python3 goodeasy/check.py .
node --check goodeasy/assets/landing-keyboard.js
# 로컬 화면 확인용일 때만 실행, 종료는 Ctrl+C
python3 -m http.server 8797 --bind 127.0.0.1
```

로컬 주소는 `http://127.0.0.1:8797/goodeasy/`다. 휴대폰에서 PC/Mac의 127.0.0.1 주소는 열리지 않는다. 사용자에게 모바일 확인을 제공할 때는 실제 공개 URL을 준다. 브라우저가 파일 URL을 차단하면 이를 우회하려고 브라우저 보안 정책을 무시하지 않는다.

## 2. 마지막으로 실제 검증한 공개 상태

| 번호 | 작품 | 경로 | 당시 상태 |
|---|---|---|---|
| 01 | 피아노 | `/goodeasy/piano/` | 본편·검색·랜딩 공개 |
| 02 | 카메라 | `/goodeasy/camera/` | 본편·검색·랜딩 공개 |
| 03 | 기타 | `/goodeasy/guitar/` | 본편·검색·랜딩 공개 |
| 04 | 낚시 릴 | `/goodeasy/fishing-reel/` | 본편·검색·랜딩 공개 |
| 05 | 기계식 손목시계 | `/goodeasy/watch/` | 본편·검색·랜딩 공개 |
| 06 | 재봉틀 | `/goodeasy/sewing-machine/` | 본편·검색·랜딩 공개 |
| 07 | 축음기 | `/goodeasy/gramophone/` | 본편·검색·랜딩 공개 |
| 08 | 기계식 키보드 | `/goodeasy/keyboard/` | 본편·검색·랜딩 공개, 상단 대표 체험도 키보드 |
| 09 | 필름 영사기 | `/goodeasy/projector/` | 주소 확인용·검색 제외·랜딩 제외, 출고 가능 판정 아님 |
| 10 | 에스프레소 머신 | `/goodeasy/espresso-machine/` | 주소 확인용·검색 제외·랜딩 제외, 출고 가능 판정 아님 |
| 보류 | 바이올린 | `/goodeasy/violin/` | 무기한 보류. 옛 11번 표시가 있어도 다음 편이 아님 |

- 공개 랜딩: https://visual.newsis.com/goodeasy/
- 검수 모음: https://visual.newsis.com/goodeasy/review/ (직접 링크·상태를 다시 확인할 것. 내부 기록을 일반 랜딩으로 노출하지 않음.)
- **미완료 핵심:** 영사기·에스프레소는 기계 구조, 연결, 화면 누락, 시각 품질의 재검수가 남아 있다. 과거 ‘검수 통과/출고 가능’이라는 대화만 믿고 발행하지 않는다. 본인이 실제 새 화면과 작동을 확인해야 한다.
- 파일 날짜의 과거 지정: 카메라 10/27, 기타 10/28, 릴 10/29, 시계 10/30 각 10시(+09:00). 키보드 `datePublished`는 `2026-11-05T10:00:00+09:00`이다. 새 요청 없이 이 과거 날짜를 ‘내일’로 다시 해석하거나 예약을 만들지 않는다.
- 바이올린의 옆판 변형·뜬 검은 지판, 에스프레소의 원두·커피 질감/물 흐름, 영사기의 필름 방향·기본 조립 상태·빈 화면은 사용자가 반복 지적한 항목이다. 자료만 보고 일괄 완료했다고 보고하지 않는다.

## 3. 키보드 마지막 배포와 재사용할 코드

- `aecba63632113fe0e25ccd5ea5bd57bff5beba1a`: 키보드 본편만 공개. 랜딩은 당시 7편이었다.
- `4120a15e1f7cebe862113f0ee19faaa6d76d4984`: 8편 카드 추가. **이 커밋만으로는 상단 축음기 체험이 남아 있어 요청이 미완성이었다.**
- `144e73e299cf6c31c7a9995328a76b4464579cc7`: 랜딩 맨 위를 실제 키보드 체험으로 교체한 완료 커밋.
- 완료 배포: https://github.com/visualnewsis/visual/actions/runs/41989973208 — success 확인. 품질검사 41989973256도 success 확인.
- 수정 대상: `goodeasy/index.html`, `goodeasy/assets/landing-keyboard.js`, `goodeasy/assets/landing-keyboard.css`.
- 재사용 모델: `goodeasy/assets/models/keyboard-hero.js`의 `buildKeyboardHero`, `goodeasy/assets/quality-kit.js`의 `makeStage`, `goodeasy/assets/keyboard-audio.js`의 합성 스위치 소리.
- 상단: ‘자, 한 줄 써볼까요?’ / 실제 타이핑 / 3D 키캡 클릭 / 음소거·지우기 / 소리 안내. 정적 AI 배경은 모델 준비 후 숨긴다.
- 링크: `keyboard/#opening-quote`. 모형을 보기 전에 명언을 먼저 읽고 안쪽 보기로 이어지는 사용자 지시를 보존한다.
- 한글 입력: Windows IME 첫 `Process`/`keyCode 229` 이벤트를 놓치지 않도록 조건을 추가했다. 새 코드에서 삭제하지 않는다. Mac·iPhone·Android의 실제 IME/터치/발음은 새 기기에서 다시 검증할 것.
- 실제 확인: 공개 HTML/JS/CSS가 커밋과 일치, HTTP 200과 올바른 MIME, 3D ready=true, 타이핑 후 audioState=running, 화면 키캡 클릭으로 X 입력, 콘솔 오류 0. 소리를 직접 청취한 음질 평가나 전체 기계 모델 정확성 보증과는 다르다.
- 본 서비스는 `.mjs`를 적절한 JavaScript MIME으로 내보내지 않는 이력이 있다. 브라우저 모듈은 기존 `.js` 경로를 따르고, `.mjs`는 Node 회귀검사용으로 유지한다.
- 기존 GA 설정은 `G-6BKMWE02W5`가 한 번만 포함되는지 검사한다. 임의 ID 교체·중복 삽입 금지.

## 4. 이 폴더에서 바로 쓰는 최종 산출물

### 키보드 포털

- `keyboard-portal/00_사진포함_미리보기.html`: 사진·원고·캡션·하단 링크·내부 출처가 한 화면에 있는 최종본. 같은 폴더의 JPG를 상대경로로 읽으므로 함께 옮긴다.
- `keyboard-portal/01_포털_출고원고.txt`: CMS 복사용. 사진 삽입 위치 포함.
- `keyboard-portal/02_대표사진_실사_무문구.jpg`: 1500×900, John Petalcurin/Pexels 실사.
- `keyboard-portal/04_본문사진_AI_무문구.jpg`: 1536×1024, 키캡 하나 제거한 설명용 AI 이미지. 실제 자판 배열·구조와 차이가 있어 캡션 필수. 정확한 MX 분해도로 사용하지 않는다.
- `03_사진_출처와_검증.txt`, `05_AI이미지_제작기록.txt`, `06_삼단검수_기록.txt`: 내부 편집용. 기사 본문에 붙이지 않는다. 과거 PC 경로·원본 파일명은 기록이며 Mac에 파일이 존재한다는 뜻이 아니다.
- 확정 제목: **두드려라, 그러면 글자가 될 것이다…키보드는 어떤 원리? [굳이구지]**
- 부제: 키캡 아래 스템·스프링·접점…한 글자가 입력되기까지
- 명언 리드: “우리의 필기도구도 우리의 생각에 한몫한다.” — 니체의 1882년 편지 맥락. 키보드를 논한 발언처럼 소개하지 않는다.
- 출처: https://german.princeton.edu/node/2345 / https://www.cherry.de/en-gb/product/mx2a-red / https://docs.qmk.fm/how_keyboards_work / https://docs.qmk.fm/feature_debounce_type
- 실사: https://www.pexels.com/photo/close-up-photo-of-gaming-keyboard-2115257/ / https://www.pexels.com/license/
- 2㎜ 입력·4㎜ 전체 이동은 체리 MX2A 레드의 수치로 한정한다. 접점 신호와 컴퓨터의 문자 처리를 구별하고, 디바운싱은 누름·해제 양쪽의 접점 튐을 포함한다. 본편은 개념 모형·합성음이다.
- 카테고리는 IT·과학 계열 권고이며 실제 CMS에 있는 세부 항목을 확인한다. 이 방에서는 CMS 송고/예약을 수행하지 않았다.

### 키보드 사이트 썸네일

- `keyboard-thumbnail/keyboard-site-thumbnail-360x240.jpg`: 사이트 등록용 최종 JPG.
- `keyboard-mobile-top-360x203.jpg`, `keyboard-mobile-center-360x203.jpg`: 모바일 크롭 QA.
- `keyboard-thumbnail-source.jpg`: 대형 원본. 작은 360px 파일을 확대하지 않는다.
- 문구: ‘굳이구지 08 · 기계식 키보드 / 한 줄 써볼까요?’ 어두운 스튜디오·금빛 질감·민트/아이보리 타이포. 기존 기타편 양식 참고로 이미지 생성 도구에서 제작했다.
- 세 파일 모두 실제 열어 글자·키보드 외곽선 보존 확인. 포털 첫 실사 사진과 혼동하지 않는다.

## 5. GPT·Claude 검수 연결 재개

- 이 작업의 실제 GPT 대화: https://chatgpt.com/c/6aebe9c5-83a8-83e8-976f-3da55b6d8d69
- 실제 Claude 독립검수 대화: https://claude.ai/chat/b0f6b615-fa9a-481a-8a0d-17b463689d83
- Mac에서 사용자가 직접 로그인해야 할 수 있다. Windows 브라우저 탭 ID나 실행 중인 핸들은 재사용할 수 없다. 먼저 해당 환경의 연결 도구를 탐색하고 실제 가능한 브라우저/API를 사용한다.
- GPT는 실제 이미지와 원고/화면을 보고 디자인·문체 검수, Claude는 원고·코드와 공식 자료를 독립 검수했다. Pexels 봇 차단이나 실제 동작 미검증 범위는 각 기록에 명시했다. 이 과거 승인으로 다음 변경을 자동 통과시키지 않는다.
- 원시 브라우저 DOM 덤프에는 관계없는 사이드바 채팅 제목이 섞일 수 있어 이 인계 묶음에 넣지 않았다. 계정 세션·인증정보도 포함하지 않는다.

## 6. Windows에만 있던 파일의 위치

현재 저장소 안의 `docs/handoffs/goodeasy-20261106/`에 위 최종 산출물을 이식했다. **Mac은 이 폴더를 기준으로 한다.** 아래는 과거 작업을 찾을 때만 쓰는 원래 PC 위치다.

- 저장소: `C:/Users/user/Documents/editshop`
- 실제 서비스 작업 worktree: `C:/Users/user/.codex/worktrees/piano-finish/editshop` / `codex/piano-finish`
- 최종 포털: 원래 저장소 `output/goodeasy-keyboard-portal-20261105-reviewed/` (끝의 `-reviewed` 없는 폴더는 이전 원고/접점 이미지다.)
- 썸네일: `output/goodeasy-keyboard-thumbnail-20261105/`
- 공개 확인·검수: `output/keyboard-landing-release-20261105/`, `output/keyboard-release-20261105/`
- 월·화 포털 기존 묶음: `output/goodeasy-portals-20261102-03/`. 존재 여부와 최종 여부를 따로 확인할 것. 이 인계에는 자동 복사하지 않았다.
- 과거 붙여넣기 첨부·생성 이미지·출력물 전체, 다른 작업자의 미커밋 변경은 Git clone만으로 모두 옮겨지지 않는다. 필요한 것을 지정해 별도 이관하며, 전체 output이나 인증 폴더를 무차별 커밋하지 않는다.

## 7. 새 작업을 끝낼 때

AGENTS.md의 변경·검증·배포 원칙을 따른다. 랜딩 상단까지 실제 확인했는지, 카드 공개만 했는지, 주소만 공개했는지 구체적으로 말한다. 실기기 확인과 viewport/코드 확인을 구분한다. 파일 발행일을 CMS 예약으로 착각하지 않는다. 원격 main의 새 작업을 보존하고 force push 하지 않는다.
