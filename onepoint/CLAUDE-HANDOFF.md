# 닿소리 홀소리 — Claude 인계 (2026-09-15)

먼저 루트 AGENTS.md와 최신 origin/main을 확인한다. 이 문서는 이번 구현·사용자 결정의 인계이며 프로젝트 정책을 대체하지 않는다.

## 확정 주소와 파일

- 랜딩: https://visual.newsis.com/onepoint/ → onepoint/index.html
- 보글보글 · 부글부글: onepoint/bogeul-bugeul/index.html
- 동동 · 둥둥: onepoint/boat/index.html
- 반짝 · 번쩍: onepoint/glow/index.html
- 졸졸졸 · 줄줄줄: onepoint/brook/index.html
- 이미지: onepoint/images/ (기존 파일명 보존)
- hangeul/sound-sample/은 로컬 디자인 시안이며 서비스 파일이 아니다. 이번 배포에 포함하지 않는다.

## 사용자 확정 디자인

- 코너명: 닿소리 홀소리
- 공통 주제: 모음 하나 자음 하나 바뀌었을 뿐인데
- 랜딩은 제목·공통 주제와 이미지/작품명 카드만 나열. PC 2열, 모바일 1열. 불필요한 설명, 작품 번호, 홍보 문구를 추가하지 않는다.
- 기사 첫 화면은 작은 코너명과 큰 비교 이미지. 모음 손잡이로 정지 이미지 두 장을 비교한다.
- 시작 상태는 손잡이가 오른쪽 끝, A컷 전체 노출. 왼쪽으로 밀면 오른쪽에서 B컷이 드러난다.
- 정적인 원본 비교 사진은 PC 2열, 모바일 1열.
- 기사 엔딩은 두 줄: 한 끗 차이 / 즐거운 우리말.
- 최하단은 왼쪽 닿소리 홀소리 / 가운데 안재현 기자 / 오른쪽 VISUAL NEWSIS.
- 공통 글로벌 헤더는 유지. 메뉴에서 알아볼지도 다음, 충무로딩 앞에 닿소리 홀소리 → https://visual.newsis.com/onepoint/ 를 추가했다.
- 기사 상단 섹션명도 랜딩으로 연결한다. 충무로딩 자체 헤더는 변경하지 않았다.

## 공통 더보기와 새 작품 추가

- onepoint/assets/stories.js: 작품 목록과 랜딩/더보기 카드 생성.
- onepoint/assets/stories.css: 카드, PC 이동 버튼, 모바일 가로 스크롤/scroll snap.
- 기사 본문과 엔딩 다음, 최하단 서명 전에 자동 배치.
- 제목은 세 줄: 다른 / 한 끗 차이 / 보러가기.
- 현재 작품은 제외하고 나머지 작품을 표시한다.
- 새 작품은 stories 배열에 slug/title/image를 등록한다. 기존 기사 더보기에도 자동 반영된다.
- 새 기사 HTML에는 stories.css와 stories.js를 연결하며 data-current는 작품 폴더명으로 지정한다. 상세 예시는 README.md.
- 랜딩의 정적 fallback 카드와 JSON-LD 목록도 같은 순서로 함께 갱신한다. 런타임 목록만 바꾸고 정적 목록을 빠뜨리지 않는다.
- 공유 파일 수정 시 해당 파일을 참조하는 페이지의 캐시 버전을 갱신한다.
- 현재 stories 버전: 20260915-1. 글로벌 헤더 JS 버전: 20260915-onepoint-1.
- 전역 AGENTS.md는 수정하지 않았다. 이번 onepoint 구성은 사용자가 직접 지정한 코너별 요구사항이다.

## SEO·배포

- 네 기사의 기존 시안용 noindex,nofollow 제거.
- 작품별 title, description, canonical, OG/Twitter 이미지·주소, Article JSON-LD 적용.
- 랜딩 CollectionPage/ItemList JSON-LD 적용.
- 기존 GA G-6BKMWE02W5를 각 페이지에 한 번만 사용.
- 공통 메뉴 캐시 갱신을 위해 기존 글로벌 헤더를 사용하는 추적 중인 HTML의 JS 버전 문자열만 변경했다. 해당 기사 본문은 변경하지 않았다.
- 기존 main push 기반 GitHub Actions 배포를 유지한다. workflow 변경 없음.
- 신규 작품 번호나 VISUAL NEWSIS 메인 ALL STORIES 편성은 이번 요청에 포함하지 않았다.

## 검증과 한계

- 기존 .github/scripts/check_visual_site.py 검사 통과.
- JS 문법, JSON-LD, 로컬 이미지/링크, 추적 태그 중복 검사.
- PC 및 모바일 viewport에서 랜딩 배치, 메뉴 순서, 현재 작품 제외, 더보기 이동 확인.
- 실제 iPhone Safari/Android Chrome 기기 터치는 미검증. 실기기 확인 없이 검증했다고 표현하지 않는다.

## 기존 PC 작업 보호

portal/homecoming/index.html 수정 및 다른 미등록 자료는 이번 작업과 무관하므로 커밋하지 않는다. 기존 보관본 office-before-sync-20260915도 유지한다. 다른 작업자의 수정과 섞이지 않도록 담당 파일만 스테이징한다.
