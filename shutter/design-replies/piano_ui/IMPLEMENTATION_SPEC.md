# 굳이구지 02 · 관찰 조작계 구현 명세 v1

## 범위
첫 연주 화면은 변경하지 않는다. 관찰 화면에 진입할 때 마지막으로 연주한 음, 키다운 시간, 페달 스냅샷을 읽는다. 원본 연주 기록은 불변. 시안의 기구는 자리 표시용 추상 도식이며 v0.2의 기구 모델로 대체한다. UI 버튼은 설계 시안이며 현재 실제 브라우저 기능이 연결된 것은 아니다.

## 우선순위 / 배치
데스크톱 기준 1440×940px: 44px 외곽 여백, 565px 관찰 뷰포트, 하단 170px 툴바. 상시: 재생/일시정지, 처음, 단계 타임라인, 속도, 현재 음과 서스테인. 보조: 조립/분해, 카메라, 부품/라벨, 전체 화면, 페이지 이동. 모바일 기준 390×844px: 관찰 366×422px, 하단 고정 366×265px; 주요 조작 48px 이상. 모바일 세로에서도 작동하며 가로 보기를 강제하지 않는다. 공간 부족 시 설명 텍스트만 축약하고 관찰 기능은 유지.

## 상태 모델
```ts
type Playback = 'empty'|'ready'|'playing'|'paused'|'ended'|'loading'|'error';
type Assembly = 'assembled'|'exploding'|'exploded'|'reassembling';
type Camera = 'default'|'side'|'oblique'|'part';
type Observation = {
 playback: Playback; assembly: Assembly; camera: Camera;
 playbackTimeMs: number; durationMs: number; speed: .25|.5|1|2;
 lastPlayedNote: string|null; selectedNote: string|null;
 source: 'last-played'|'manual'; keyHoldMs:number|null;
 sustainAtPerformance:boolean; sustainOverride:null|boolean;
 selectedPart:string|null; labels:'off'|'selected'|'essential';
 fullscreen:boolean; errorMessage:string|null;
};
```
`lastPlayedNote`와 연주 이벤트 원본은 쓰기 금지. `selectedNote`만 관찰 대상 변경. 페달은 `sustainAtPerformance` 원본과 `sustainOverride` 관찰 실험값을 구분하고 화면에 출처 표시.

## 전이표
| 행동 | 전제 | 상태 변화 | 피드백 |
|---|---|---|---|
| 관찰 진입(연주 기록 없음) | 항상 | playback=empty | '먼저 건반을 연주해 주세요'; 재생 disabled; 연주로 돌아가기 |
| 관찰 진입(기록 있음) | 항상 | ready, source=last-played | 직전 음/누른 시간/페달 표시 |
| 재생 | ready/paused/ended & assembled | playing; ended면 시간 0부터 | 버튼 일시정지, 현재 단계 강조 |
| 일시정지 | playing | paused | 버튼 재생 |
| 처음부터 | 기록 있음 | paused,time=0 | 단계 01 강조; 재생 자동 시작 안 함 |
| 재생 완료 | playing | ended,time=duration | '다시 보기' 라벨 |
| 타임라인 드래그 | 기록 있음 & assembled | paused, time=clamp | 스크럽 위치 및 단계 설명 실시간 갱신 |
| 속도 변경 | 기록 있음 | speed 설정 | 배속 선택 강조; 무음 유지 |
| 분해 클릭 | assembled | 재생 중이면 paused; exploding→exploded | 재생/스크럽 disabled, 조립 복귀 표시 |
| 조립 복귀 | exploded | reassembling→assembled | 저장한 타임라인 위치 유지, paused |
| 관찰 음 선택 | 항상 | selectedNote, source=manual, paused,time=0 | '선택 관찰 음' 배지; 원본 직전 음 보존 |
| 직전 음으로 복귀 | 기록 있음 | selectedNote=lastPlayedNote,source=last-played | 원본 스냅샷 복원 |
| 페달 관찰 변경 | 기록 있음 | sustainOverride 설정 | '관찰 실험' 배지, 댐퍼 궤적 갱신 |
| 부품 선택 | 로딩 아님 | selectedPart 설정, camera 선택적 유지 | 선택 부품만 라벨 강조 |
| 전체 화면 실패 | 환경 미지원 | fullscreen=false | 인라인 확대 및 '전체 화면 미지원' 알림 |
| 모델 로딩 실패 | loading | error | 재시도/정적 단계 도해 대안 |

## 작동 단계와 실제 기계 순서
표시 단계는 ①건반 누름 ②해머 이동 ③타현 ④해머 이탈/반발 ⑤현 진동 ⑥손 뗌·댐퍼 상태. **주의:** 실제 그랜드 액션에서 잭의 이탈(escapement)은 해머가 현에 닿기 직전에 발생한다. UI에서 '해머 이탈'은 타현 후 해머 반발과 구별해서 표시하고, 타임라인 내부 이벤트 순서는 `jackEscapement < hammerStrike < hammerRebound`로 강제한다. 구현 권장 레이블: '03 잭 이탈', '04 타현', '05 진동/반발', '06 손 뗌·댐퍼'. 디자인 시안의 6개 점은 이 정확한 순서로 치환할 것.

## 재생 오디오 정책
관찰 재생은 **무음**. 0.25×/0.5×/1×/2×는 기구 애니메이션 시간만 조절하며 음정이나 연주 오디오를 변형하지 않는다. 실제 타건 음성은 1단계에서만 재생. 2×도 관찰 모드이며 실제 타건 속도 재현을 뜻하지 않는다. 타임라인 드래그 중 무음.

## 타임라인 접근성
`role=slider`, `tabindex=0`, `aria-label='피아노 작동 단계 타임라인'`, `aria-valuemin=0`, `aria-valuemax=durationMs`, `aria-valuenow=timeMs`, `aria-valuetext='3단계, 잭 이탈, 0.42초'`. 좌/우 화살표는 단계 단위, Shift+좌/우는 10ms, Home/End는 시작/끝. 터치: 포인터 캡처, 드래그 중 스크롤 충돌 방지(트랙에서만 touch-action:none), 키보드 조작 시 재생 일시정지.

## 키보드 및 스크린리더
Space는 재생 버튼에 포커스가 있을 때 활성화. 전역 Space 단축키는 1단계 연주 키와 충돌할 수 있으므로 금지. Escape는 열린 팝오버→부품 확대→전체 화면 순으로 닫는다. 팝오버를 닫으면 열었던 버튼에 포커스 복귀. 분해 중 재생 버튼은 disabled 이유를 설명 텍스트로 제공. 오류 알림은 role=alert, 단계 변경은 과도한 낭독 방지를 위해 aria-live=off, 사용자가 확정한 조작 결과만 polite 영역에 공지. 아이콘 버튼은 '재생', '일시정지', '처음부터', '분해 보기', '조립 상태로 복귀', '시점 선택', '부품 선택', '전체 화면' 등 고유 aria-label을 가진다.

## 부품 라벨
기본은 selected. 최대 1개의 선택 라벨 + 2개의 맥락 라벨, 모바일은 1개 선택 라벨만. 충돌하면 위치 재배치, 불가능하면 라벨 대신 목록에 노출. 부품 메뉴는 검색 없이 10~12개 고정 목록; 메뉴 열림은 관찰 뷰를 가리지 않도록 우측 도킹(모바일은 하단 시트).

## 반응형/오류
모바일 44px 이상 터치 목표, 본 시안은 48px 권장. 320px 이하에서 3열 버튼이 불가능하면 2열로 전환. WebGL 미지원/저사양: 정적 6단계 SVG와 단계 설명 제공, 회전/분해 버튼 disabled 이유 명시. fullscreen API 미지원: 관찰 영역의 인라인 확대. 가로 회전은 권장만, 필수 아님.

## 검수
- [ ] 첫 연주에 시작 버튼 추가 없음
- [ ] 재생/일시정지/완료/초기/로딩/오류 상태
- [ ] 실제 연주 원본과 관찰 음이 독립
- [ ] 페달 ON 상태에서 손을 떼어도 댐퍼 유지; OFF 해제 시 복귀
- [ ] 이탈은 타현보다 앞서 발생
- [ ] 분해 중 재생·스크럽 불가, 조립 후 일시정지 복귀
- [ ] 모바일 44px 이상, 320px 레이아웃 검증
- [ ] Tab/Shift+Tab, 방향키, Home/End, Escape, 포커스 복귀
- [ ] 모든 아이콘에 접근 가능한 이름, 오류 대안 표시
- [ ] 0.25× 관찰 무음 및 실제 연주 오디오 분리
- [ ] 전체 화면 미지원 및 WebGL 오류 대체 경로

## 크레딧
Creative Director · 안재현 / VISUAL NEWSIS — 제작 과정 하단에만 절제해 표기.
