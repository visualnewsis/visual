# 맥북 이전 보존 기록 · 2026-11-06

통이 재개 기준은 `codex/tongi-macbook-20261106` 브랜치의 [인수인계](../tongi-demo/HANDOFF.md)다. 이 브랜치는 당시 최신 origin/main 기반으로 통이와 이 이전 기록만 추가한다.

현재 Windows 저장소는 `codex/deploy-main`이며 당시 origin/main과 이력이 갈라져 있었다. 강제 동기화나 대규모 병합 대신 별도 보존 브랜치를 만든다. 실서비스 main과 배포 자동화는 바꾸지 않는다. 원래 작업 브랜치·index·미커밋 파일도 덮어쓰지 않는다.

`codex/macbook-backup-20261106-windows`는 현재 Windows 작업 경로의 기존 커밋과 추적 중인 변경·추적되지 않은 콘텐츠/이미지/작업 스크립트/검토 기록을 보존한다. 다른 등록 worktree도 `codex/macbook-backup-20261106-*` 브랜치로 각각 보존한다. worktree 자체를 중첩 저장하지 않고 각자의 Git 이력을 유지한다. 최신 main에 이미 들어간 내용과 과거 시안이 함께 존재하므로 보존 브랜치를 통째로 main에 병합하지 않는다.

`inventory.json`에 원래 경로·브랜치·기준 커밋·저장 대상·제외 대상을, `commits.json`에 실제 보존 커밋과 브랜치를 기록한다. 원래 Gitignore의 설치 의존성·로컬 AI 설정·캐시는 포함하지 않는다. 추가로 재설치 가능한 실행 파일·로그·캐시·개인 자격 증명 이름과 GitHub 제한 초과 파일을 제외한다. 콘텐츠 ZIP은 자격 증명 파일명과 흔한 토큰 패턴도 검사한다. 이것은 보조 검사이며 보안 감사를 의미하지 않는다.

실제 대화 원문과 계정별 Codex 세션은 이 저장소에 자동 저장되지 않는다. 통이 대화의 최신 결정·실행 방법은 HANDOFF.md에 정리했다. 채팅 계정/승인된 검토 링크의 접근 권한은 Git clone과 별개다. 예전 보고서 DOCX/PDF는 `output/tongi-demo/history/`에 보존하며 현재 범위와 다른 역사 자료다.

맥에서 원하는 보존 브랜치는 `git fetch origin` 후 `git switch --track origin/브랜치명`으로 열 수 있다. Node/Python 등의 설치 파일을 Windows에서 복사하지 말고 macOS용을 설치한다. 이 보존 브랜치들은 공개 서비스 배포 요청을 의미하지 않는다.
