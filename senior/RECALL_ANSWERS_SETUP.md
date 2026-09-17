# 편집#011 `<보기>` 답변 — 구글시트 연동 설정

`senior/index.html`의 마지막 `<보기>` 회수 장면(`#recall`)은 독자가 직접 답을 적어 제출하는 곳이다.
아래 설정을 마치면 제출한 답이 구글시트에 저장되고, **제출 즉시 다른 독자에게도 공개**된다(사전 승인 없음, 링크·전화번호·흔한 욕설·음란 표현은 브라우저 단에서 먼저 막는다).
부적절한 답은 시트에서 그 행을 지우면 다음 로드부터 화면에서 사라진다. 본인이 쓴 글은 독자 스스로도 지울 수 있다(같은 브라우저에서만).

설정 전까지는 `RECALL_ENDPOINT`가 비어 있어 각자의 브라우저(localStorage)에만 남는 채로 정상 동작한다.

## 1. 구글시트 만들기

1. 새 구글시트를 하나 만든다(제목 예: "편집#011 보기 답변").
2. 첫 행(헤더)은 비워두거나 `제출시각 / 답변 / 토큰`처럼 적어둔다. A열=시각, B열=답변 텍스트, C열=삭제용 토큰으로 쌓인다.

## 2. Apps Script 붙여넣기

1. 방금 만든 시트에서 상단 메뉴 **확장 프로그램 → Apps Script**를 클릭한다.
2. 기본으로 열린 `Code.gs`의 내용을 전부 지우고 아래 코드를 붙여넣는다.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'delete') {
    var id = Number(data.id);
    var token = (data.token || '').toString();
    if (!id || !token) {
      return json_({ ok: false });
    }
    // id는 시트의 행 번호(제출 시 반환한 값)다. 해당 행의 토큰(C열)이 일치할 때만 지운다.
    var row = sheet.getRange(id, 1, 1, 3).getValues()[0];
    if (row[2] && row[2].toString() === token) {
      sheet.deleteRow(id);
      return json_({ ok: true });
    }
    return json_({ ok: false });
  }

  // 기본 동작(action 없음 또는 'submit'): 새 답변 추가.
  var text = (data.text || '').toString().trim().slice(0, 80);
  var token = (data.token || '').toString();
  if (!text) {
    return json_({ ok: false });
  }
  sheet.appendRow([new Date(), text, token]);
  var id = sheet.getLastRow();
  return json_({ ok: true, id: id });
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var answers = [];
  for (var i = 0; i < rows.length; i++) {
    var text = rows[i][1];
    if (text && text.toString().trim()) {
      // id는 1부터 시작하는 실제 행 번호. 토큰(C열)은 여기서 절대 돌려주지 않는다(삭제 권한이므로).
      answers.push({ id: i + 1, text: text.toString() });
    }
  }
  return json_({ answers: answers });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
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

코드를 수정할 때마다(예: 나중에 필터 로직을 시트 쪽에도 추가할 때) **배포 → 배포 관리 → 수정(연필 아이콘) → 새 버전**으로 다시 배포해야 반영된다. URL은 그대로 유지된다.

## 4. 사이트에 URL 연결

`senior/index.html`에서 아래 줄을 찾는다(`<보기> 최종 회수` 스크립트 안, `RECALL_ENDPOINT` 상수):

```javascript
const RECALL_ENDPOINT = ''; // Apps Script 배포 후 여기에 Web App URL을 넣는다.
```

따옴표 안에 3단계에서 복사한 URL을 붙여넣는다:

```javascript
const RECALL_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
```

저장하고 배포하면 이후 제출되는 답부터 시트에 쌓이고, 페이지를 새로고침한 모든 방문자에게 보인다.

## 5. 본인 글 삭제(독자용)

- 독자가 제출한 답 옆에는 자신이 쓴 글에 한해 `×` 버튼이 보인다. 누르면 제출 시 이 브라우저에 남겨둔 토큰으로 본인 글만 지운다.
- 이건 로그인이 아니라 브라우저에 남는 약한 식별이다. 브라우저 데이터를 지우거나 다른 기기·브라우저로 보면 그 글은 더 이상 "내 글"로 인식되지 않아 삭제 버튼이 안 보인다.

## 6. 운영 — 답변 삭제(편집부용, 사후 조치)

- 부적절한 답변을 발견하면 구글시트를 열어 해당 행을 그냥 삭제(마우스 우클릭 → 행 삭제)한다.
- 별도의 승인 절차는 없다. 삭제한 답변은 독자가 다음에 페이지를 새로고침할 때부터 보이지 않는다.
- 시트에 쌓인 데이터는 안재현 기자 본인 구글 계정 소유이며, 언제든 시트에서 직접 열람·백업·삭제할 수 있다.
- 사이트의 브라우저 단 필터(링크·전화번호·흔한 욕설·음란 표현 차단)는 최대한 보수적으로 걸러내도록 만들었지만 완전하지 않다. API를 직접 호출하는 등 필터를 우회하는 제출은 걸러지지 않으므로, 최종 방어선은 여전히 이 시트 확인이다.

## 참고

- 이 연동은 정적 사이트(HTML/CSS/JS)에 별도 서버를 새로 만들지 않고, Google Apps Script를 가벼운 저장소로 쓰는 방식이다.
- `RECALL_ENDPOINT`가 비어 있으면 자동으로 이 브라우저에만 남는 이전 방식(localStorage)으로 동작하므로, 설정 전에 배포해도 페이지는 정상 작동한다.
