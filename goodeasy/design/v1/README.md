# GOODEASY 02–07 | 1차 화면 및 2차 조작·기구 시트

## 포함 파일
- `screens/`: 6편 × 데스크톱 1440×900 + 모바일 390×844 = 12개 SVG
- `details/`: 6편별 기구 콘셉트/조작 4상태 = 6개 SVG
- `docs/IMPLEMENTATION.md`: 개별 상태·전달 데이터·320px/가로·접근성·모델링 기준
- `docs/SOURCES.md`: 참고 출처 및 검증 경계
- `docs/items.json`: 6편 구성 데이터
- `src/tokens.css`: 정적 CSS 반응형·포커스 토큰
- `src/interaction-core.js`: Vanilla JS 이벤트/스냅샷 상태 참조 구현
- `src/demo.html`: 낚시 릴 이벤트 상태 테스트 페이지 (3D 모델 미연결)

## 중요
SVG는 **실제 편집 가능한 벡터 화면 디자인**이나, 실제 작동하는 기구·검증된 3D CAD·완성 웹앱은 아닙니다. 6개 디자인은 서로 다른 형태/행동을 사용하지만 공유 브랜드 스타일이 있습니다. 데모는 기구 물리 시뮬레이터가 아닙니다.

`src/demo.html`의 ES module은 file:// 직접 열기에서 브라우저 보안 정책상 막힐 수 있습니다. 배포는 기존 정적 웹 서버에서 수행하면 됩니다. React, 신규 백엔드 불필요.
