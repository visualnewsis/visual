# 닿소리 홀소리 구성

- 랜딩: `onepoint/index.html`
- 작품: `onepoint/작품명/index.html`
- 이미지: `onepoint/images/`
- 랜딩과 기사 더보기 목록: `onepoint/assets/stories.js`의 `stories`
- 공통 카드 디자인: `onepoint/assets/stories.css`

## 새 작품 연결

1. 작품 폴더와 이미지를 추가한다.
2. `stories`에 slug, title, image를 추가한다. 기존 작품의 더보기에는 새 작품이 자동 반영된다.
3. 새 기사에 아래 두 파일을 연결하고 `data-current`를 작품 폴더명으로 지정한다.

```html
<link rel="stylesheet" href="../assets/stories.css?v=20260915-1">
<script defer src="../assets/stories.js?v=20260915-1" data-current="작품폴더명"></script>
```

4. 랜딩의 정적 카드 목록과 JSON-LD에도 같은 작품을 추가한다. 정적 목록은 JavaScript가 꺼져 있을 때도 탐색할 수 있게 남긴다.
5. 공통 파일 변경 시 연결된 페이지의 캐시 버전을 함께 갱신한다.

공통 주제는 `모음 하나 자음 하나 바뀌었을 뿐인데`, 최하단 서명은 `닿소리 홀소리 / 안재현 기자 / VISUAL NEWSIS`다. 기존 기사 구조를 유지해 새 작품을 추가한다. 더보기는 작품 엔딩 뒤, 최하단 서명 앞에 배치되며 현재 작품은 제외한다.

이 문서는 구현 연결 방법이며 프로젝트 정책은 루트 `AGENTS.md`를 따른다.
