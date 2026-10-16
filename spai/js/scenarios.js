/*
  편집# 016 SPAI — 4장면 × 3선택 데이터
  - observables: 가상 시스템 SPAI가 화면 밖에서 볼 수 있는 흔적만 적는다.
  - realContext: 독자가 고른 선택지 문장 안에서만 맥락을 쓴다. 고르지 않은 일을 새로 만들지 않는다.
  - verdict: under(기록이 맥락을 놓침) / over(기록이 활동을 부풀림) / match(기록과 실제가 맞음)
  - 점수·확률·순위는 만들지 않는다. SPAI는 실제 제품이 아니라 뉴스용 가상 시스템이다.
*/
(function(root){
  const scenes=[
    {
      id:"s1",time:"09:20",until:"10:10",scene:"오전 보고서 준비",
      prompt:"오후 회의에 올릴 기획안의 근거를 마련해야 한다. 무엇부터 할까?",
      choices:[
        {
          id:"s1-read",label:"긴 문서를 정독한다",
          short:"보고서 정독",
          detail:"40쪽짜리 정책 보고서를 처음부터 끝까지 읽는다.",
          observables:{app:"PDF 뷰어",site:null,activity:"스크롤 위주, 키보드 입력 거의 없음",idle:"무입력 2분 이상 구간 9회",visibleDuration:"50분"},
          log:["09:20 활성 창 · PDF 뷰어","09:31 무입력 2분 경과 · 저활동 전환","09:58 무입력 구간 누적 9회"],
          classification:"check",
          reportInterpretation:"저활동 구간 반복 · 맥락 확인 필요",
          realContext:"보고서 40쪽을 읽으며 기획안의 근거 3개를 찾았다. 읽는 동안 손은 거의 움직이지 않았다.",
          flipReveal:"입력이 끊긴 50분 동안 보고서를 읽고 있었다.",
          verdict:"under",
          caveat:"상용 제품 ActivTrak은 기본 설정에서 입력이 2분간 없으면 '수동(passive)' 시간으로 분류한다. 정독은 입력이 적은 일이다."
        },
        {
          id:"s1-write",label:"바로 초안을 쓴다",
          short:"초안 작성",
          detail:"빈 문서를 열고 기획안 초안부터 써 내려간다.",
          observables:{app:"문서 편집기",site:null,activity:"키보드 입력 지속",idle:"무입력 구간 없음",visibleDuration:"50분"},
          log:["09:20 활성 창 · 문서 편집기","09:20 키보드 입력 감지","10:10 입력 활동 50분 지속"],
          classification:"work",
          reportInterpretation:"입력 활동 많음 · 업무 앱",
          realContext:"초안을 쓰고 절반을 지워 반 페이지가 남았다. 지운 문장까지 모두 입력 활동으로 기록됐다.",
          flipReveal:"기록에는 입력량만 남고, 지운 분량과 결과물은 나타나지 않는다.",
          verdict:"over",
          caveat:"입력 활동은 마우스·키보드가 움직였다는 신호다. 문장의 품질이나 결과물은 측정하지 않는다."
        },
        {
          id:"s1-search",label:"관련 자료를 넓게 찾는다",
          short:"자료 출처 대조",
          detail:"검색 결과와 기사, 온라인 커뮤니티의 반응 글까지 훑어본다.",
          observables:{app:"웹브라우저",site:"사이트 14곳 · 온라인 커뮤니티 포함",activity:"잦은 탭 전환, 클릭 위주",idle:"무입력 구간 2회",visibleDuration:"50분"},
          log:["09:20 활성 창 · 웹브라우저","09:42 온라인 커뮤니티 접속 · 미분류 사이트","10:05 사이트 14곳 이동"],
          classification:"check",
          reportInterpretation:"미분류 사이트 다수 · 잦은 창 전환",
          realContext:"현장 반응을 보려고 커뮤니티 글을 확인했고, 검색 결과 사이를 오가며 자료 출처를 대조했다.",
          flipReveal:"온라인 커뮤니티 접속은 취재 목적이었다.",
          verdict:"under",
          caveat:"생산성 분류는 관리자가 정한다. ActivTrak 문서는 같은 소셜미디어도 팀에 따라 생산적·비생산적으로 달리 분류할 수 있다고 설명한다."
        }
      ]
    },
    {
      id:"s2",time:"11:10",until:"11:50",scene:"회의 시간",
      prompt:"11시 팀 회의가 잡혀 있다. 어떻게 참여할까?",
      choices:[
        {
          id:"s2-room",label:"회의실에서 대면 회의를 한다",
          short:"대면 회의",
          detail:"노트북을 두고 회의실로 가서 팀장·동료와 40분간 회의한다.",
          observables:{app:"활성 창 없음 (화면 잠김)",site:null,activity:"입력 없음",idle:"40분 연속 무입력",visibleDuration:"40분"},
          log:["11:10 입력 중단","11:12 무입력 2분 경과 · 저활동 전환","11:50 무입력 40분 · 자리 비움 추정"],
          classification:"check",
          reportInterpretation:"40분 연속 무입력 · 자리 비움 추정",
          realContext:"회의실에서 팀장·동료와 오후 마감 순서를 정했다.",
          flipReveal:"'자리 비움'으로 추정된 40분. 실제로는 회의실에서 동료들과 마감 순서를 정했다.",
          verdict:"under",
          caveat:"PC 모니터링 소프트웨어는 PC 앞의 활동을 기록한다. 화면 밖의 회의는 '입력 없음'으로만 남는다."
        },
        {
          id:"s2-video",label:"자리에서 온라인 회의에 들어간다",
          short:"온라인 회의",
          detail:"화상회의 앱으로 접속해 동료의 발표를 듣는다.",
          observables:{app:"화상회의 앱",site:null,activity:"입력 거의 없음, 창 고정",idle:"무입력 구간 6회",visibleDuration:"40분"},
          log:["11:10 활성 창 · 화상회의 앱","11:30 무입력 구간 반복","11:50 화상회의 앱 40분"],
          classification:"work",
          reportInterpretation:"화상회의 앱 사용 · 업무 앱",
          realContext:"동료의 발표를 끝까지 들었고 질문을 한 번 했다. 기록과 실제가 대체로 맞았다.",
          flipReveal:"화상회의 앱 사용 기록은 맞았다. 실제로 집중했는지는 기록으로 확인할 수 없다.",
          verdict:"match",
          caveat:"앱이 켜져 있던 시간은 측정할 수 있지만, 그 시간에 집중했는지는 측정하지 않는다."
        },
        {
          id:"s2-sheet",label:"회의 대신 자리에서 자료를 정리한다",
          short:"자료 정리",
          detail:"회의는 건너뛰고 오전에 모은 수치를 표로 정리한다.",
          observables:{app:"스프레드시트",site:null,activity:"입력·클릭 지속",idle:"무입력 구간 1회",visibleDuration:"40분"},
          log:["11:10 활성 창 · 스프레드시트","11:10 키보드 입력 감지","11:50 업무 앱 40분"],
          classification:"work",
          reportInterpretation:"업무 앱 사용 · 입력 활동 많음",
          realContext:"표 정리는 끝냈다. 회의에 빠져 마감 순서는 나중에 메신저로 전해 들어야 했다.",
          flipReveal:"자료 정리 기록은 맞았다. 회의에 불참한 사실은 기록에 나타나지 않는다.",
          verdict:"match",
          caveat:"PC 기록은 그 시간에 한 일을 보여주지만, 하지 않은 일의 영향까지 보여주지는 않는다."
        }
      ]
    },
    {
      id:"s3",time:"14:30",until:"14:55",scene:"영상 확인",
      prompt:"점심 뒤, 동영상 사이트를 열었다. 무엇을 볼까?",
      choices:[
        {
          id:"s3-research",label:"업무에 필요한 원본 영상을 찾는다",
          short:"원본 영상 확인",
          detail:"기획안에 인용할 기자회견 원본 영상에서 해당 발언을 찾는다.",
          observables:{app:"웹브라우저",site:"동영상 사이트",activity:"입력 거의 없음, 구간 이동 클릭",idle:"무입력 구간 5회",visibleDuration:"25분"},
          log:["14:30 동영상 사이트 접속","14:30 분류 · 비업무 사이트","14:55 동영상 사이트 25분"],
          classification:"nonwork",
          reportInterpretation:"동영상 사이트 25분 · 비업무 의심",
          realContext:"기자회견 원본에서 인용할 발언 두 문장을 찾아 받아 적었다.",
          flipReveal:"업무 영상이었지만 개인 영상과 똑같이 '비업무 의심'으로 분류됐다.",
          verdict:"under",
          caveat:"사이트 단위로 분류하면 같은 동영상 사이트 안의 업무 영상과 개인 영상이 하나로 묶인다."
        },
        {
          id:"s3-learn",label:"팀장이 추천한 강좌 영상을 본다",
          short:"업무 강좌 수강",
          detail:"데이터 분석 강좌 영상을 보며 업무에 쓸 기능을 익힌다.",
          observables:{app:"웹브라우저",site:"동영상 사이트",activity:"입력 거의 없음",idle:"무입력 구간 6회",visibleDuration:"25분"},
          log:["14:30 동영상 사이트 접속","14:30 분류 · 비업무 사이트","14:55 동영상 사이트 25분"],
          classification:"nonwork",
          reportInterpretation:"동영상 사이트 25분 · 비업무 의심",
          realContext:"팀장이 권한 데이터 분석 강좌를 들었다. 당장의 성과로 보이지는 않지만 업무와 관련된 학습이었다.",
          flipReveal:"업무 관련 강좌도 기록에는 비업무 사이트 이용으로 표시됐다.",
          verdict:"under",
          caveat:"교육·참고 콘텐츠는 직무와 회사 방침에 따라 업무로도, 비업무로도 분류될 수 있다."
        },
        {
          id:"s3-personal",label:"좋아하는 예능 클립을 본다",
          short:"개인 영상 시청",
          detail:"잠깐 머리를 식히려고 예능 클립을 몇 개 본다.",
          observables:{app:"웹브라우저",site:"동영상 사이트",activity:"입력 거의 없음",idle:"무입력 구간 6회",visibleDuration:"25분"},
          log:["14:30 동영상 사이트 접속","14:30 분류 · 비업무 사이트","14:55 동영상 사이트 25분"],
          classification:"nonwork",
          reportInterpretation:"동영상 사이트 25분 · 비업무 의심",
          realContext:"실제로 개인 영상을 봤다. 이 25분은 기록이 맞았다.",
          offTask:true,
          flipReveal:"개인 영상 시청 기록은 맞았다. 다만 업무 영상을 봤어도 같은 기록이 남는다.",
          verdict:"match",
          caveat:"25분 휴식을 어떻게 평가할지는 회사 규정과 관리자 판단에 달렸다."
        }
      ]
    },
    {
      id:"s4",time:"16:40",until:"17:10",scene:"마감 직전",
      prompt:"퇴근 전 마감이 다가온다. 마지막 30분, 무엇에 쓸까?",
      choices:[
        {
          id:"s4-call",label:"거래처에 전화를 건다",
          short:"거래처 전화",
          detail:"휴대전화로 거래처 담당자와 통화해 마감 일정을 다시 잡는다.",
          observables:{app:"활성 창 없음",site:null,activity:"입력 없음",idle:"30분 연속 무입력",visibleDuration:"30분"},
          log:["16:40 입력 중단","16:42 무입력 2분 경과 · 저활동 전환","17:10 무입력 30분 · 퇴근 전 자리 비움 추정"],
          classification:"check",
          reportInterpretation:"30분 연속 무입력 · 자리 비움 추정",
          realContext:"휴대전화로 거래처와 통화해 밀린 마감 일정을 다시 잡았다. 통화는 PC 밖에서 이뤄졌다.",
          flipReveal:"거래처와 마감 일정을 조정했지만 PC에는 입력 없는 시간으로 기록됐다.",
          verdict:"under",
          caveat:"PC 모니터링은 PC에서 일어난 일만 본다. 휴대전화 통화는 이 기록에 나타나지 않는다."
        },
        {
          id:"s4-doc",label:"마감 문서를 마무리한다",
          short:"마감 문서 작성",
          detail:"기획안의 문장을 다듬고 표를 붙여 제출한다.",
          observables:{app:"문서 편집기",site:null,activity:"키보드 입력 지속",idle:"무입력 구간 없음",visibleDuration:"30분"},
          log:["16:40 활성 창 · 문서 편집기","16:40 키보드 입력 감지","17:10 입력 활동 30분 지속"],
          classification:"work",
          reportInterpretation:"입력 활동 많음 · 업무 앱",
          realContext:"기획안을 다듬어 제출했다. 기록과 실제가 맞았다.",
          flipReveal:"기록과 실제가 맞았다.",
          verdict:"match",
          caveat:"기록과 실제가 맞더라도 기록은 '얼마나 입력했나'까지만 말한다."
        },
        {
          id:"s4-chat",label:"메신저로 동료들과 조율한다",
          short:"메신저 업무·잡담 대화",
          detail:"사내 메신저로 동료들과 남은 일을 나누고, 이야기를 이어간다.",
          observables:{app:"사내 메신저",site:null,activity:"짧은 입력 반복, 잦은 창 전환",idle:"무입력 구간 없음",visibleDuration:"30분"},
          log:["16:40 활성 창 · 사내 메신저","16:52 입력 활동 활발","17:10 업무 앱 30분"],
          classification:"work",
          reportInterpretation:"업무 앱 사용 · 입력 활동 활발",
          realContext:"절반은 남은 일을 나누는 업무 대화였고, 절반은 동료와의 잡담이었다.",
          flipReveal:"사내 메신저에서 나눈 잡담도 모두 업무 활동으로 분류됐다.",
          verdict:"over",
          caveat:"앱 단위 분류는 그 앱 안에서 오간 대화의 내용까지 구분하지 않는다."
        }
      ]
    }
  ];

  const classificationLabels={work:"업무 분류",nonwork:"비업무 의심",check:"맥락 확인 필요"};
  const verdictLabels={under:"기록이 놓친 일",over:"업무로만 잡힌 기록",match:"기록과 일치"};

  // 선택 4개로 보고서 앞·뒷면을 만든다. 앞뒤는 같은 행(row)을 공유한다.
  function buildReport(choiceIds){
    if(!Array.isArray(choiceIds)||choiceIds.length!==scenes.length)throw new Error("선택 4개가 필요합니다");
    const rows=choiceIds.map((id,i)=>{
      const scene=scenes[i];
      const choice=scene.choices.find(c=>c.id===id);
      if(!choice)throw new Error(`장면 ${scene.id}에 없는 선택: ${id}`);
      return {scene,choice,
        front:{time:`${scene.time}–${scene.until}`,observed:choice.observables,interpretation:choice.reportInterpretation,classification:choice.classification,classificationLabel:classificationLabels[choice.classification]},
        back:{time:`${scene.time}–${scene.until}`,label:choice.label,realContext:choice.realContext,flipReveal:choice.flipReveal,verdict:choice.verdict,verdictLabel:verdictLabels[choice.verdict],caveat:choice.caveat}};
    });
    const count=key=>rows.filter(r=>r.choice.verdict===key).length;
    const flags=rows.filter(r=>r.choice.classification!=="work").length;
    const offTask=rows.filter(r=>r.choice.offTask).length;
    return {rows,flags,offTask,grade:gradeFor(flags),tally:{under:count("under"),over:count("over"),match:count("match")}};
  }

  // SPAI 가상 고과 규칙: 확인 필요·비업무 의심 항목 수로만 매긴다. 규칙은 화면에 그대로 공개한다.
  const gradeRule=[{max:0,grade:"A"},{max:1,grade:"B"},{max:2,grade:"C"},{max:Infinity,grade:"D"}];
  function gradeFor(flags){
    return gradeRule.find(r=>flags<=r.max).grade;
  }

  function allPaths(){
    const out=[];
    const walk=(i,acc)=>{
      if(i===scenes.length){out.push(acc.slice());return}
      for(const c of scenes[i].choices){acc.push(c.id);walk(i+1,acc);acc.pop()}
    };
    walk(0,[]);
    return out;
  }

  root.SPAI={scenes,classificationLabels,verdictLabels,buildReport,allPaths,gradeFor};
})(typeof window!=="undefined"?window:globalThis);
