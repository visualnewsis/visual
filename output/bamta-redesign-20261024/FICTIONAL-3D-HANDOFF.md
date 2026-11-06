# 가상 인물 3D 교체 · 2026-10-25

이 기록은 앞선 `ART-HANDOFF.md`의 얼굴 관련 내용을 대체한다. 참조 사진 기반 얼굴, 일반 직원 얼굴 이미지, 사진 매핑 코드는 전부 활성 게임에서 제거했다. 원본 첨부 사진은 이용하지 않는다.

## 구현

- `arcade/bamta/faces.js`: 모든 캐릭터의 두상을 완전한 구형 토폴로지 메시로 생성한다. 코의 능선과 끝, 볼과 눈 주위, 턱은 같은 표면을 변형해 만든다. 눈의 흰자·홍채·동공·눈꺼풀, 입술·귀·머리카락·국장 안경도 기하 구조다. 머리 전체에 이미지 map이 없고 얼굴 PlaneGeometry도 없다.
- `actors.js`: 기존 사진 투사 함수를 삭제하고 새 두상을 사용한다. 첫 여성 동료, 남성 복도 동료, 남성 국장과 착석 직원 세 명의 역할을 보존한다.
- `game.js`: 눈 깜박임과 기존 시선·호흡·착석 동작을 연결한다. 복도 동료의 신문 반응을 존댓말로 바꿨다.
- `dialogue.js`: 복도 동료의 대사 다섯 개를 모두 존댓말로 바꿨다. 사무실 대사는 기존 반말을 유지한다.
- `art.js`: 얼굴 이미지 네 개의 다운로드를 제거했다. 배포 대상에서도 해당 WebP 네 개를 삭제한다. 식물·재질·모니터 이미지만 계속 사용한다.

## ImageGen 디자인 의뢰

`fictional-3d-design-reference.png`는 가상의 여성 직원·남성 동료·중년 남성 편집자를 정면·사선·측면으로 요청한 디자인 참고 이미지다. 실존 인물의 사진이나 이전 레퍼런스를 입력하지 않았다. 이 이미지는 게임의 얼굴에 매핑하지 않으며 배포하지 않는다.

요청한 프롬프트: Create an original 3D character sculpt design reference sheet for a browser newsroom game, THREE fictional adult Korean office workers: a woman in her early thirties with elegant natural proportions and shoulder-length dark hair, a male coworker in his thirties with short swept hair, and an older male editor in his fifties with mature angular face and combed greying hair, NO resemblance to a real person, no photo reference. Each character shown as neutral clay-render head bust in front, three-quarter and exact profile views, 3 columns per row. Refined stylized realism, attractive natural adult faces, closed subtle lips, restrained eyes with anatomical lids and smaller iris, smoothly integrated nose bridge and nostrils, gently modeled cheekbones, full volumetric ears and back of skull. Consistent warm ivory sculpt material for skin, dark solid geometry hair masses with subtle strand grooves, neutral studio grey background, soft side lighting makes depth legible. Design must be feasible as genuine complete polygonal 3D meshes viewed from all angles. NOT photographic faces, NOT pasted portrait textures, NOT masks, NOT flat billboards, NOT Lego, NOT bobbleheads, NOT giant cartoon eyes. Bust turnaround sculpt study only, no text or UI.

ImageGen은 래스터 디자인을 만들며 실제 메시를 생성한 것은 아니다. 게임 메시의 실제 품질과 형태는 `mesh-turnaround.png`를 기준으로 확인한다. 이는 `export-heads.mjs`가 실제 production geometry를 내보낸 뒤 `render-heads.py`가 정면·45도·측면·후면으로 렌더한 검수 결과다. 게임 조명·GPU 결과와 동일한 스크린샷은 아니다.

## 검증과 제한

`node arcade/bamta/verify.mjs` 통과: 머리의 이미지 map 부재, 평면 얼굴 부재, 모든 좌표의 유효성, 가로·높이·깊이, 12방향 raycast로 두상 부피 확인, 배역 성별·착석·대사 순환·엘리베이터 동선과 두 엔딩·SEO·GA 검사.

Computer Use가 브라우저 URL을 확인할 수 없어 UI 제어를 중단했다. 이번 새 얼굴은 오프라인 메시 렌더로 검수했으며, 브라우저 GPU 화면과 실제 iPhone Safari·Android Chrome의 실기기 확인은 하지 못했다. 공용 파일·헤더·랜딩·배포 workflow는 변경하지 않았다.

배포 주소와 SHA는 `PUBLISHED.txt` 참조. 공개 배포 후 파일 일치 검사와 기존 배포·품질 workflow 결과를 확인한다.


## 정식 배포

사용자의 배포 완료 요청에 따라 같은 검증 버전을 https://visual.newsis.com/arcade/bamta/?v=mesh1 정식 주소로 반영했다. 커밋 a1ac352f16355ad9768b728a27a125b8a063a97e. 원격 최신 main을 부모로 사용하고 arcade/bamta/ 내부 파일만 반영했다. 미리보기는 유지한다. 정식 배포 품질 검사 통과, 서버 배포와 공개 파일 해시 대조는 배포 모니터에서 확인한다.
