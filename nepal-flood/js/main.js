(() => {
  const clamp = (v) => Math.max(0, Math.min(1, v));

  const progress = (el) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const total = Math.max(1, el.offsetHeight - window.innerHeight);
    return clamp(-rect.top / total);
  };

  const collapsePassage = document.getElementById("collapse-passage");
  const collapseChainItems = Array.from(document.querySelectorAll("#collapse-chain > span"));

  const sequence = document.getElementById("sequence");
  const cinematic = document.getElementById("cinematic");
  const layerImpact = document.getElementById("layer-impact");
  const layerFloodEdge = document.getElementById("layer-flood-edge");
  const layerFloodCore = document.getElementById("layer-flood-core");
  const dropReadoutLabel = document.getElementById("drop-readout-label");
  const cinematicNo = document.getElementById("cinematic-no");
  const cinematicLabel = document.getElementById("cinematic-label");
  const cinematicTitle = document.getElementById("cinematic-title");
  const cinematicBody = document.getElementById("cinematic-body");
  const cinematicSteps = Array.from(document.querySelectorAll("#cinematic-steps > div"));
  const cinematicScrubInput = document.getElementById("cinematic-scrub-input");

  const STAGES = [
    { no: "00", label: "붕괴 전", titleLines: ["홍수가 시작되기 전,", "상류의 모습"], body: "빙하와 암석, 그 아래로 이어지는 물길.<br />붕괴와 홍수를 이해하기 위한 설명용 장면이다." },
    { no: "01", label: "붕괴", titleLines: ["빙하 아래", "기반암이 무너졌다"], body: "기반암이 붕괴하며 거대한 빙하를<br />함께 쓸어내린 것으로 분석됐다." },
    { no: "02", label: "추락", titleLines: ["빙하와 암석이", "쏟아져 내렸다"], body: "처음 지진으로 해석됐던 진동은<br />이후 붕괴가 만든 신호로 정정됐다." },
    { no: "03", label: "혼합", titleLines: ["물·토사·암석이", "뒤섞였다"], body: "물과 토사, 암석이 뒤섞인 흐름.<br />강물이 급증한 정확한 과정은 아직 조사 중이다." },
    { no: "04", label: "대홍수", titleLines: ["거대한 홍수가", "하류를 덮쳤다"], body: "물은 토사와 바위를 품고 하류로 밀려갔다.<br />물이 급증한 세부 과정은 아직 조사 중이다." },
  ];
  const DROP_READOUT_LABELS = ["붕괴 전", "빙하·암석 붕괴", "빙하·암석 추락", "물·토사·암석", "하류의 대홍수"];

  const damagePassage = document.getElementById("damage-passage");
  const damageImages = Array.from(document.querySelectorAll("#damage-images img"));
  const damageTitle = document.getElementById("damage-title");
  const damageBody = document.getElementById("damage-body");
  const damageCount = document.getElementById("damage-count");
  const DAMAGE = [
    { title: "얼음과 바위가<br /><b>거대한 흐름으로</b>", body: "물은 토사와 바위를 품은 채 강을 따라 내려가며<br />하천 주변 가옥과 학교 등 하류의 피해를 키웠다." },
    { title: "도로와 건물도<br /><b>함께 무너졌다</b>", body: "강을 따라 들어선 도로와 다리, 차량과<br />발전시설은 진흙과 잔해 아래 묻혔다." },
    { title: "마지막에 무너진 건<br /><b>삶의 터전이었다</b>", body: "얼음과 바위로 시작된 흐름은 결국<br />집과 일터, 가족의 일상을 덮쳤다." },
  ];

  const evidenceSequence = document.getElementById("evidence-sequence");
  const evidenceArticles = Array.from(document.querySelectorAll("#evidence-stage > article"));
  const formulaStage = document.getElementById("formula-stage");

  const warningGap = document.getElementById("warning-gap");
  const warningArticles = Array.from(document.querySelectorAll("#warning-stage > article"));
  const warningRailItems = Array.from(document.querySelectorAll("#warning-rail > i"));

  const finalPassage = document.getElementById("final-passage");
  const finalImages = Array.from(document.querySelectorAll("#final-images img"));
  const finalFirst = document.getElementById("final-first");
  const finalReveal = document.getElementById("final-reveal");

  let manualCinematicProgress = null;

  const renderCinematicStage = (e) => {
    const r = e * STAGES.length;
    const stageIndex = Math.min(STAGES.length - 1, Math.floor(r));
    const impact = clamp((r - 1) / 0.55);
    const flood = clamp((r - 3) / 1.65);
    const o = 47 - flood * 17;
    const s = Math.min(49, o + 0.55);
    const c = Math.max(0, flood * 50 - 1);

    cinematic.style.setProperty("--p", e);
    cinematic.style.setProperty("--break", impact);
    cinematic.style.setProperty("--flood", flood);
    cinematic.className = `cinematic living-cinematic hypothesis-cinematic stage-${stageIndex}`;

    layerImpact.style.opacity = String(impact);
    layerImpact.style.clipPath = `circle(${impact * 88}% at 51% 25%)`;
    layerImpact.style.transform = `scale(${1.04 + impact * 0.05}) translateY(${clamp((r - 1.7) / 1.3) * 2.3}%)`;

    layerFloodEdge.style.opacity = String(flood * 0.24);
    layerFloodEdge.style.mixBlendMode = "screen";
    layerFloodEdge.style.clipPath = `polygon(${o}% 0, ${100 - o}% 0, ${50 + flood * 50}% ${flood * 100}%, ${50 - flood * 50}% ${flood * 100}%)`;

    layerFloodCore.style.opacity = String(flood);
    layerFloodCore.style.clipPath = `polygon(${s}% 0, ${100 - s}% 0, ${50 + c}% ${flood * 100}%, ${50 - c}% ${flood * 100}%)`;

    dropReadoutLabel.textContent = DROP_READOUT_LABELS[stageIndex];

    const stage = STAGES[stageIndex];
    cinematicNo.textContent = stage.no;
    cinematicLabel.textContent = stage.label;
    cinematicTitle.innerHTML = stage.titleLines.map((line) => `<span class="scene-title-line">${line}</span>`).join("");
    cinematicBody.innerHTML = stage.body;
    cinematicSteps.forEach((el, i) => el.classList.toggle("passed", i <= stageIndex));
    cinematicScrubInput.value = String(Math.round(e * 100));
  };

  cinematicScrubInput.addEventListener("input", (event) => {
    const value = Number(event.target.value) / 100;
    manualCinematicProgress = value;
    renderCinematicStage(value);
  });

  const renderCollapseChain = (e) => {
    collapseChainItems.forEach((el, n) => {
      const isLast = n === collapseChainItems.length - 1;
      const bonus = isLast ? 10 : 0;
      const r = n === 0 ? 1 : clamp((e - (n - 0.5) * 0.13) / 0.14);
      el.style.setProperty("--reveal", String(r));
      el.style.setProperty("--drop", `${r * (n * 7 + bonus)}px`);
      el.style.setProperty("--mobile-drop", `${r * (n * 2 + bonus * 0.6)}px`);
    });
  };

  const renderDamage = (e) => {
    const n = e * (DAMAGE.length - 1);
    const active = Math.min(DAMAGE.length - 1, Math.round(n));
    damageImages.forEach((img, i) => {
      const diff = i - n;
      const abs = Math.abs(diff);
      img.style.opacity = String(clamp(1 - abs * 1.12));
      img.style.transform = `translate3d(0, ${diff * 24}%, 0) scale(${1.05 + abs * 0.025})`;
      img.style.filter = `blur(${abs * 3}px) saturate(.64) contrast(1.08) brightness(.74)`;
    });
    damageTitle.innerHTML = DAMAGE[active].title;
    damageBody.innerHTML = DAMAGE[active].body;
    damageCount.textContent = `0${active + 1} / 03`;
  };

  const renderEvidence = (e) => {
    const n = 6;
    const r = Math.min(n - 1, Math.floor(e * n));
    const i = Math.min(3, r);
    const activeIndex = Math.floor(i / 2);
    const detailMode = i % 2 === 1;
    const formulaPhase = r - 4;
    const inFormula = formulaPhase >= 0;
    const t = clamp((clamp((e * n - 4) / 2) - 0.32) / 0.36) * 108 - 8;
    const l = t + 8;

    evidenceSequence.classList.toggle("formula-mode", inFormula);
    evidenceArticles.forEach((article, idx) => {
      article.classList.remove("active", "past", "future", "detail", "value-only");
      if (idx === activeIndex) {
        article.classList.add("active", detailMode ? "detail" : "value-only");
      } else if (idx < activeIndex) {
        article.classList.add("past");
      } else {
        article.classList.add("future");
      }
    });
    formulaStage.classList.toggle("visible", inFormula);
    const maskBefore = `linear-gradient(90deg, transparent 0%, transparent ${t}%, #000 ${l}%, #000 100%)`;
    const maskAfter = `linear-gradient(90deg, #000 0%, #000 ${t}%, transparent ${l}%, transparent 100%)`;
    const before = document.getElementById("formula-before");
    const after = document.getElementById("formula-after");
    before.style.webkitMaskImage = maskBefore;
    before.style.maskImage = maskBefore;
    after.style.webkitMaskImage = maskAfter;
    after.style.maskImage = maskAfter;
  };

  const renderWarning = (e) => {
    const n = Math.min(warningArticles.length - 1, Math.floor(e * warningArticles.length));
    warningArticles.forEach((article, idx) => {
      article.classList.remove("active", "past", "future");
      if (idx === n) article.classList.add("active");
      else if (idx < n) article.classList.add("past");
      else article.classList.add("future");
    });
    warningRailItems.forEach((el, idx) => el.classList.toggle("active", idx === n));
  };

  const renderFinal = (e) => {
    const n = clamp((e - 0.3) / 0.24);
    const r = clamp((e - 0.2) / 0.18);
    const i = clamp((e - 0.57) / 0.13);
    finalImages[0].style.opacity = String(1 - n);
    finalImages[0].style.objectPosition = "28% center";
    finalImages[0].style.transform = `scale(${1.025 + e * 0.035})`;
    finalImages[0].style.filter = `blur(${n * 4}px) saturate(.62) brightness(.7)`;
    finalImages[1].style.opacity = String(n);
    finalImages[1].style.transform = `scale(${1.07 - n * 0.045})`;
    finalImages[1].style.filter = `blur(${(1 - n) * 5}px) saturate(.58) brightness(.66)`;

    finalFirst.style.opacity = String(1 - r);
    finalFirst.style.transform = `translate3d(0, ${-r * 7}svh, 0)`;

    finalReveal.style.opacity = String(i);
    finalReveal.style.transform = `translate3d(0, ${(1 - i) * 8}svh, 0) scale(${1.12 - i * 0.12})`;
    finalReveal.style.filter = `blur(${(1 - i) * 9}px)`;
  };

  const onScroll = () => {
    renderCollapseChain(progress(collapsePassage));
    const sequenceProgress = manualCinematicProgress ?? progress(sequence);
    renderCinematicStage(sequenceProgress);
    renderDamage(progress(damagePassage));
    renderEvidence(progress(evidenceSequence));
    renderWarning(progress(warningGap));
    renderFinal(progress(finalPassage));
    manualCinematicProgress = null;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Restore scroll position when returning from an outbound link (e.g. the video)
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  const scrollRestoreKey = "nepal-flood-scroll-y";
  const savedScrollY = sessionStorage.getItem(scrollRestoreKey);
  if (savedScrollY !== null) {
    sessionStorage.removeItem(scrollRestoreKey);
    const y = parseInt(savedScrollY, 10);
    if (!Number.isNaN(y)) {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      onScroll();
    }
  }

  // Video: remember scroll position before leaving for YouTube
  const videoButton = document.getElementById("video-poster-button");
  if (videoButton) {
    videoButton.addEventListener("click", () => {
      sessionStorage.setItem(scrollRestoreKey, String(window.scrollY));
    });
  }

  // Share button
  const shareButton = document.getElementById("share-button");
  const shareStatus = document.getElementById("share-status");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "마른 하늘 대홍수, 뒤집힌 재난 공식",
        url: location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          shareStatus.textContent = "링크가 복사됐습니다.";
        }
      } catch (error) {
        // user cancelled share sheet; no-op
      }
    });
  }
})();
