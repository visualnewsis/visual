# 편집#011 `<보기>` 답변 — 구글시트 연동 설정

`senior/index_v2.html`의 마지막 `<보기>` 회수 장면(`#recall`)은 독자가 직접 답을 적어 제출하는 곳이다.
아래 설정을 마치면 제출한 답이 구글시트에 저장되고, **제출 즉시 다른 독자에게도 공개**된다(사전 승인 없음).
부적절한 답은 시트에서 그 행을 지우면 다음 로드부터 화면에서 사라진다.

설정 전까지는 `RECALL_ENDPOINT`가 비어 있어 각자의 브라우저(localStorage)에만 남는 채로 정상 동작한다.

## 1. 구글시트 만들기

1. 새 구글시트를 하나 만든다(제목 예: "편집#011 보기 답변").
2. 첫 행(헤더)은 비워두거나 `제출시각 / 답변`처럼 적어둔다. A열=시각, B열=답변 텍스트로 쌓인다.

## 2. Apps Script 붙여넣기

1. 방금 만든 시트에서 상단 메뉴 **확장 프로그램 → Apps Script**를 클릭한다.
2. 기본으로 열린 `Code.gs`의 내용을 전부 지우고 아래 코드를 붙여넣는다.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var text = (data.text || '').toString().trim().slice(0, 80);
  if (!text) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.appendRow([new Date(), text]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var answers = rows
    .map(function (r) { return r[1]; })
    .filter(function (v) { return v && v.toString().trim(); })
    .map(function (v) { return v.toString(); });
  return ContentService.createTextOutput(JSON.stringify({ answers: answers }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. 저장한다(플로피 디스크 아이콘, 또는 Ctrl+S).

## 3. 웹 앱으로 배포

1. Apps Script 화면 우측 상단 **배포 → 새 배포**를 클릭한다.
2. 유형 선택에서 **웹 앱**을 고른다.
3. 설정:
   - **실행 사용자**: 나(본인 계정)
   - **액세스 권한이 있는 사용자**: 전체(익명 포함) — 이래야 독자의 브라우저에서 글을 쓸 수 있다.
4. **배포**를 누르고, 구글 계정 권한 요청이 뜨면 승인한다.
5. 배포가 끝나면 나오는 **웹 앱 URL**(`https://script.google.com/macros/s/.../exec` 형태)을 복사한다.

## 4. 사이트에 URL 연결

`senior/index_v2.html`에서 아래 줄을 찾는다(`<보기> 최종 회수` 스크립트 안, `RECALL_ENDPOINT` 상수):

```javascript
const RECALL_ENDPOINT = ''; // Apps Script 배포 후 여기에 Web App URL을 넣는다.
```

따옴표 안에 3단계에서 복사한 URL을 붙여넣는다:

```javascript
const RECALL_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
```

저장하고 배포하면 이후 제출되는 답부터 시트에 쌓이고, 페이지를 새로고침한 모든 방문자에게 보인다.

## 5. 운영 — 답변 삭제(사후 조치)

- 부적절한 답변을 발견하면 구글시트를 열어 해당 행을 그냥 삭제(마우스 우클릭 → 행 삭제)한다.
- 별도의 승인 절차는 없다. 삭제한 답변은 독자가 다음에 페이지를 새로고침할 때부터 보이지 않는다.
- 시트에 쌓인 데이터는 안재현 기자 본인 구글 계정 소유이며, 언제든 시트에서 직접 열람·백업·삭제할 수 있다.

## 참고

- 이 연동은 정적 사이트(HTML/CSS/JS)에 별도 서버를 새로 만들지 않고, Google Apps Script를 가벼운 저장소로 쓰는 방식이다.
- `RECALL_ENDPOINT`가 비어 있으면 자동으로 이 브라우저에만 남는 이전 방식(localStorage)으로 동작하므로, 설정 전에 배포해도 페이지는 정상 작동한다.
