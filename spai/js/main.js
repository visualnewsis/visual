(function(){
  "use strict";
  const {scenes,buildReport}=window.SPAI;
  const $=id=>document.getElementById(id);
  const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollTo=el=>el.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"start"});

  /* S0 히어로: 가상 로그 흐름과 감지 박스 */
  const heroLines=[
    ["09:01:12","활성 창","문서 편집기"],["09:14:40","무입력","2분 경과"],["09:15:02","분류","<b>저활동</b>"],
    ["09:32:18","사이트","검색 포털"],["09:47:51","분류","<b>미분류 사이트</b>"],["10:20:05","활성 창","사내 메신저"],
    ["11:10:00","입력","<b>중단</b>"],["11:50:00","무입력","40분"],["13:02:33","활성 창","스프레드시트"],
    ["14:30:09","사이트","동영상 사이트"],["14:30:09","분류","<b>비업무 의심</b>"],["15:11:47","입력","<i>재개</i>"],
    ["16:40:00","입력","<b>중단</b>"],["17:10:21","보고서","관리자 전달 대기"]
  ];
  const heroLog=$("heroLog");
  const fillHero=()=>{
    heroLog.innerHTML=heroLines.concat(heroLines).map(([t,k,v])=>`<li>${t}  ${k} · ${v}</li>`).join("");
  };
  fillHero();
  if(!reduceMotion){
    let offset=0;
    setInterval(()=>{
      offset=(offset+1)%heroLines.length;
      heroLog.style.transition=offset===0?"none":"transform .6s";
      heroLog.style.transform=`translateY(${-offset*2.1}em)`;
    },1600);
  }
  setTimeout(()=>$("detectBox").classList.add("is-locked"),reduceMotion?0:900);

  /* S4 체험 */
  const answers=new Array(scenes.length).fill(null);
  let index=0;
  const sim=$("sim"),stage=$("simStage"),progress=$("simProgress"),prevBtn=$("prevBtn"),nextBtn=$("nextBtn");

  function renderProgress(){
    progress.innerHTML=scenes.map((s,i)=>{
      const cls=i===index?"is-current":(answers[i]?"is-done":"");
      return `<li class="${cls}"${i===index?' aria-current="step"':""}>${s.time}</li>`;
    }).join("");
  }

  function traceHTML(choice){
    if(!choice)return `<span class="trace-head">SPAI 기록</span><span class="trace-line is-in trace-empty">선택을 기다리는 중…</span>`;
    return `<span class="trace-head">SPAI 기록 · 화면에 남은 흔적</span>`+choice.log.map(line=>`<span class="trace-line">${line}</span>`).join("");
  }

  function playTrace(box){
    const lines=[...box.querySelectorAll(".trace-line:not(.is-in)")];
    lines.forEach((line,i)=>setTimeout(()=>line.classList.add("is-in"),reduceMotion?0:180+i*320));
  }

  function renderScene(focus){
    const scene=scenes[index];
    const picked=scene.choices.find(c=>c.id===answers[index]);
    stage.innerHTML=`
      <div class="scene-time">${scene.time}</div>
      <p class="scene-name">${index+1} / ${scenes.length} · ${scene.scene}</p>
      <h3 class="scene-prompt" id="scenePrompt" tabindex="-1">${scene.prompt}</h3>
      <div class="choices" role="radiogroup" aria-labelledby="scenePrompt">
        ${scene.choices.map((c,i)=>`<button type="button" class="choice" role="radio" data-id="${c.id}" aria-checked="${c.id===answers[index]}" tabindex="${(picked?c.id===picked.id:i===0)?0:-1}"><span class="choice-key" aria-hidden="true">${i+1}</span><strong>${c.label}</strong><span>${c.detail}</span></button>`).join("")}
      </div>
      <div class="trace" aria-live="polite">${traceHTML(picked)}</div>`;
    if(picked)stage.querySelectorAll(".trace-line").forEach(l=>l.classList.add("is-in"));
    prevBtn.disabled=index===0;
    nextBtn.disabled=!picked;
    nextBtn.innerHTML=index===scenes.length-1?"보고서 받기 →":"다음 →";
    renderProgress();
    if(focus)$("scenePrompt").focus({preventScroll:true});
  }

  function choose(id){
    answers[index]=id;
    const radios=[...stage.querySelectorAll(".choice")];
    radios.forEach(r=>{const on=r.dataset.id===id;r.setAttribute("aria-checked",on);r.tabIndex=on?0:-1});
    const choice=scenes[index].choices.find(c=>c.id===id);
    const box=stage.querySelector(".trace");
    box.innerHTML=traceHTML(choice);
    playTrace(box);
    nextBtn.disabled=false;
    renderProgress();
  }

  stage.addEventListener("click",e=>{
    const btn=e.target.closest(".choice");
    if(btn)choose(btn.dataset.id);
  });
  stage.addEventListener("keydown",e=>{
    const radios=[...stage.querySelectorAll(".choice")];
    if(!radios.length)return;
    if(/^[1-3]$/.test(e.key)){const r=radios[+e.key-1];if(r){choose(r.dataset.id);r.focus()}return}
    const current=radios.indexOf(document.activeElement);
    if(current<0)return;
    const delta={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];
    if(!delta)return;
    e.preventDefault();
    const target=radios[(current+delta+radios.length)%radios.length];
    choose(target.dataset.id);
    target.focus();
  });

  prevBtn.addEventListener("click",()=>{if(index>0){index--;renderScene(true)}});
  nextBtn.addEventListener("click",()=>{
    if(!answers[index])return;
    if(index<scenes.length-1){index++;renderScene(true);scrollTo(sim);return}
    showReport();
  });

  $("startBtn").addEventListener("click",()=>{
    sim.hidden=false;
    index=0;
    renderScene(false);
    scrollTo(sim);
    setTimeout(()=>$("scenePrompt").focus({preventScroll:true}),reduceMotion?0:500);
  });

  /* S5 보고서 */
  const report=$("report"),verdict=$("verdict"),card=$("flipCard"),front=$("faceFront"),back=$("faceBack"),flipBtn=$("flipBtn"),flipLabel=$("flipLabel");
  const DAY_START=9*60,DAY_END=18*60;
  const toMin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
  let flipped=false;

  function obsLine(o){
    return [`<b>${o.app}</b>`,o.site,o.activity,o.idle].filter(Boolean).join(" · ");
  }

  function renderReport(data){
    const segs=data.rows.map(r=>{
      const a=toMin(r.scene.time),b=toMin(r.scene.until);
      const left=(a-DAY_START)/(DAY_END-DAY_START)*100,width=(b-a)/(DAY_END-DAY_START)*100;
      return `<span class="rp-seg rp-seg--${r.choice.classification}" style="left:${left}%;width:${width}%" title="${r.front.time} ${r.front.classificationLabel}"></span>`;
    }).join("");
    front.innerHTML=`
      <header class="rp-head">
        <div class="rp-brand">SP<span>AI</span><small>활동 요약 · 관리자 전달용</small></div>
        <div class="rp-meta">직원: 당신 (가상)<br>2026. 10. 16 (금)<br>관측 구간 ${data.rows.length}건</div>
      </header>
      <h3 class="rp-title" id="front-title" tabindex="-1">오늘의 활동 요약</h3>
      <div class="rp-timeline" aria-hidden="true">${segs}</div>
      <div class="rp-axis" aria-hidden="true"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
      <div class="rp-legend" aria-hidden="true"><span><i class="rp-seg--work"></i>업무 분류</span><span><i class="rp-seg--check"></i>맥락 확인 필요</span><span><i class="rp-seg--nonwork"></i>비업무 의심</span></div>
      <ol class="rp-rows">
        ${data.rows.map(r=>`<li class="rp-row">
          <span class="rp-time">${r.front.time}</span>
          <span class="rp-tag rp-tag--${r.front.classification}">${r.front.classificationLabel}</span>
          <span class="rp-obs">${obsLine(r.front.observed)} (${r.front.observed.visibleDuration})<br>→ ${r.front.interpretation}</span>
        </li>`).join("")}
      </ol>
      <div class="rp-grade">
        <div class="rp-grade-rule">
          <p class="rp-grade-label">SPAI 가상 고과</p>
          <p class="rp-grade-warn">실제 업무 성과가 아닌, 네 구간의 PC 기록만으로 산출한 가상 결과입니다.</p>
          <p>확인 필요·비업무 의심 항목 수로만 매긴다.<br>0건 A · 1건 B · 2건 C · 3건 이상 D</p>
          <p>오늘 해당 항목: <b>${data.flags}건</b></p>
        </div>
        <div class="grade-stamp" role="img" aria-label="고과 ${data.grade}"><span>고과</span><strong>${data.grade}</strong></div>
      </div>
      <footer class="rp-foot"><span>관리자 확인 필요 항목 <b>${data.flags}건</b></span><span class="rp-stamp">※ 뉴스용 가상 시뮬레이션 · PC 화면의 흔적만 관측</span></footer>`;
    back.innerHTML=`
      <header class="bk-head">
        <p class="bk-kicker">보고서 뒷면</p>
        <h3 class="bk-title" id="back-title" tabindex="-1">기록에 없는 하루</h3>
      </header>
      <ol class="bk-rows">
        ${data.rows.map(r=>`<li class="bk-row" data-verdict="${r.back.verdict}">
          <span class="bk-time">${r.back.time}</span>
          <div>
            <p class="bk-was">${r.front.interpretation}</p>
            <p class="bk-label">당신의 선택 · ${r.back.label}</p>
            <p class="bk-real">${r.back.realContext}</p>
            <p class="bk-reveal">${r.back.flipReveal}</p>
            <span class="bk-verdict bk-verdict--${r.back.verdict}">${r.back.verdictLabel}</span>
            <p class="bk-caveat">${r.back.caveat}</p>
          </div>
        </li>`).join("")}
      </ol>
      <footer class="bk-foot">
        <div class="grade-stamp grade-stamp--faded" aria-hidden="true"><span>고과</span><strong>${data.grade}</strong></div>
        <p>고과 ${data.grade}는 의심 항목 ${data.flags}건만 반영했다. 뒷면의 업무 맥락은 평가에 들어가지 않았다. 이 규칙에서는 어떤 선택을 해도 A가 나오지 않는다. 14시 30분의 동영상 사이트 25분이 업무 영상이든 아니든 언제나 비업무 의심으로 잡히기 때문이다.</p>
      </footer>`;
    // 기록이 맞은 행은 앞면 해석에 취소선을 긋지 않는다.
    back.querySelectorAll('.bk-row[data-verdict="match"] .bk-was').forEach(el=>el.style.textDecoration="none");
    renderVerdict(data);
  }


  // 마지막 글자의 받침 여부로 조사를 고른다.
  function josa(word,withFinal,withoutFinal){
    const code=word.charCodeAt(word.length-1)-0xac00;
    return code>=0&&code<=11171&&code%28!==0?withFinal:withoutFinal;
  }

  function renderVerdict(data){
    const pick=v=>data.rows.filter(r=>r.choice.verdict===v).map(r=>r.choice.short);
    const missed=pick("under"),inflated=pick("over");
    const t=data.tally;
    $("verdictTally").innerHTML=`선택한 ${data.rows.length}개 구간 · 기록이 놓친 일 <b>${t.under}</b> · 업무로만 잡힌 기록 <b>${t.over}</b> · 기록과 일치 <b>${t.match}</b>`;
    $("verdict-title").innerHTML=`의심 기록 ${data.flags}개 구간,<br><span>실제로 일을 쉰 구간은 ${data.offTask}개</span>`;
    const lines=[`선택한 네 구간 가운데 SPAI가 '맥락 확인 필요'나 '비업무 의심'으로 표시한 구간은 ${data.flags}개다. 이 중 실제로 일을 하지 않은 구간은 ${data.offTask?"개인 영상을 본 25분 하나다":"없다"}.`];
    if(missed.length){const w=missed.join(", ");lines.push(`기록에 제대로 잡히지 않은 일은 ${w}${josa(w,"이었다","였다")}.`)}
    if(inflated.length){const w=inflated.join(", ");lines.push(`${w}${josa(w,"은","는")} 업무 앱 사용으로 분류됐지만, 무엇을 남겼고 무슨 이야기를 했는지는 기록되지 않았다.`)}
    lines.push(`고과는 ${data.grade}였다. 보고서에는 PC 사용 기록이 남았지만, 그 시간에 무엇을 했는지는 빠져 있었다.`);
    $("verdictBody").innerHTML=lines.map(l=>`<p>${l}</p>`).join("");
  }

  function setFlipped(on,moveFocus){
    flipped=on;
    card.classList.toggle("is-flipped",on);
    flipBtn.setAttribute("aria-pressed",on);
    flipLabel.textContent=on?"앞면 다시 보기":"보고서 뒤집어 보기";
    front.inert=on;back.inert=!on;
    fitCard();
    front.setAttribute("aria-hidden",on);back.setAttribute("aria-hidden",!on);
    if(on&&verdict.hidden){verdict.hidden=false;$("flipHint").textContent="앞뒤를 다시 비교해 보세요."}
    if(moveFocus)setTimeout(()=>(on?$("back-title"):$("front-title")).focus({preventScroll:true}),reduceMotion?0:600);
  }

  // 도장은 보고서 하단이 화면에 들어올 때 찍힌다.
  const stampWatch=new IntersectionObserver(entries=>{
    for(const e of entries)if(e.isIntersecting){report.classList.add("is-shown");stampWatch.unobserve(e.target)}
  },{rootMargin:"0px 0px -25% 0px"});

  function showReport(){
    const data=buildReport(answers);
    renderReport(data);
    report.hidden=false;
    report.classList.remove("is-shown");
    stampWatch.observe(front.querySelector(".rp-grade"));
    verdict.hidden=true;
    $("flipHint").textContent="카드를 옆으로 밀어도 뒤집힙니다.";
    setFlipped(false,false);
    scrollTo(report);
    setTimeout(()=>$("front-title").focus({preventScroll:true}),reduceMotion?0:600);
  }

  // 앞뒤 길이가 달라 빈칸이 생기지 않도록 카드 높이를 보이는 면에 맞춘다.
  function fitCard(){
    if(report.hidden)return;
    card.style.height=(flipped?back:front).offsetHeight+"px";
  }
  addEventListener("resize",fitCard,{passive:true});
  if(document.fonts)document.fonts.ready.then(fitCard);

  flipBtn.addEventListener("click",()=>setFlipped(!flipped,true));

  // 가로 스와이프로 뒤집기(세로 스크롤은 유지)
  let sx=null,sy=null;
  card.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY});
  card.addEventListener("pointerup",e=>{
    if(sx===null)return;
    const dx=e.clientX-sx,dy=e.clientY-sy;
    sx=sy=null;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)setFlipped(!flipped,false);
  });
  card.addEventListener("pointercancel",()=>{sx=sy=null});

  $("retryBtn").addEventListener("click",()=>{
    answers.fill(null);
    index=0;
    report.hidden=true;
    verdict.hidden=true;
    renderScene(false);
    scrollTo(sim);
    setTimeout(()=>$("scenePrompt").focus({preventScroll:true}),reduceMotion?0:500);
  });
})();
