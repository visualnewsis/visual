# VISUAL NEWSIS 굳이구지 — 구현 인계 보완 v1.1

1. `HANDOFF_SPEC.md`: 정확한 부품 포인터, 6구간 순서, 반응형 실측 배치, 접근성, 모델 자산/검증 갭, 크레딧 정정.
2. `icons.svg`: 외부 글꼴 의존 없는 SVG path symbol 스프라이트. HTML에서 `<svg class="obs-icon" aria-hidden="true"><use href="icons.svg#play"></use></svg>`.
3. `icons-preview.svg`: 아이콘 가시화 시트(로컬 브라우저에서 열기).
4. `tokens.css`: 기존 UI 토큰을 계승한 기본 CSS 및 breakpoint.
5. `state-machine.js`: 순수 JavaScript 상태 전이 참고 구현(렌더링 엔진과 분리).

이 ZIP은 구현 **인계 자료**다. 완성된 3D 모델, 실측 CAD, 충돌 검증, 작동 웹앱이 포함된 것은 아니다.
