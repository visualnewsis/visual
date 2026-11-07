# 통이 × 굳이구지 피아노 — 샘플 전용 (2026-11-07)

## 현재 상태
실서비스 통이 안내는 main의 642b9f5b에서 철회했고, 배포 성공 및 공개 /goodeasy/ HTML에 통이 import/버튼이 없는 것을 확인했다. 이전 8e53aa6d와 3c1b2b 기록은 과거 작업이다. 이 샘플을 main에 병합하거나 실서비스에 적용하지 않았다.

## 보기
저장소 루트에서 Python 정적 서버를 실행한 뒤 `/output/tongi-piano-demo/`를 연다. 현재 Windows 미리보기는 http://127.0.0.1:8798/output/tongi-piano-demo/ 이다. Mac에서는 이 브랜치를 받아 저장소 루트에서 `python3 -m http.server 8798`을 실행한다. 별도 설치/서비스 서버는 필요 없다.

상단 자동 등장 ON/OFF, 다음 동작, 19개 장면 선택, 처음부터를 사용한다. 자동은 3.6초 간격이며 임의 스크롤이나 소리 재생을 하지 않는다. 건반/페달/분해/비교 실험을 실제로 조작해 볼 수 있다. 기사 안 빈 공간에만 등장하고 없으면 전용 시연 영역에 남는다. 큰 시연 영역은 실제 서비스 UI 확정안이 아니다.

## 파일
- index.html/sample.js/sample.css: 샘플 껍데기와 통이 반응
- piano.html: 기존 실제 피아노 원본의 경로만 바꾼 noindex 복사본. 원본 JS/CSS/3D 자산 재사용
- frame.css: 샘플 복사본 전용 강조와 좁은 화면 조정
- assets/: 승인된 PNG 캐릭터 재사용. 관절 애니메이션/3D 리깅은 아님
- mobile-check.html: 390×700 iframe 검증용
- evidence/: 캡처/검수 기록

## 검수
실제 GPT 디자인 세션: https://chatgpt.com/c/6aeaf754-aaec-83ee-9eaf-9e019838f5ea
실제 Claude 독립 검수: https://claude.ai/chat/a0e26e38-a703-44c3-835c-8fc1adb7bf63
GPT의 모바일 건반 잘림/PC 패널 분리 지적을 받아 무대 축소 및 좁은 화면 건반 높이 조정. Claude의 상태와 다른 대사/안보이는 타겟 지시/텍스트 충돌/초기 about:blank 오류 지적을 받아 수정했다. 실제 모델 검토 범위는 텍스트 및 전달된 이미지/코드이며 직접 브라우저 실행은 Codex가 수행했다.

실제 휴대폰, iPhone Safari/Android Chrome 실기기는 미확인. CSS viewport iframe으로 모바일 확인. 원본 공용 스크립트에서 초기 MutationObserver 오류가 관찰되며 이 작업에서 공용 파일을 변경하지 않았다. 샘플은 production 품질 승인/배포가 아니다.

최종 GPT 재검토에서 이동 경로 가림 우려를 수용해 위치 이동 transition을 제거하고, 등장 지점에서 8px 안팎으로 반응하도록 축소했다. 원본 각 토글의 aria-pressed 업데이트와 PianoExperience.snapshot 노출을 코드에서 대조했다. 재검수의 원문은 evidence/review.txt 참조.
