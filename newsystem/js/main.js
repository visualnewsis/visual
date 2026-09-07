(() => {
  const STEPS = [
    { en: "INPUT", title: "사실을 받습니다", lines: ["사진, 숫자, 현장의 목소리.", "흩어진 신호를 빠짐없이 수집합니다."] },
    { en: "QUESTION", title: "질문을 찾습니다", lines: ["무엇이 보이지 않았는지,", "독자가 어디에서 멈추는지 먼저 묻습니다."] },
    { en: "PLAN", title: "체험을 설계합니다", lines: ["독자를 구경꾼으로 두지 않고", "사건의 조건 안에 잠시 놓습니다."] },
    { en: "DATA", title: "데이터로 증명합니다", lines: ["체험으로 느낀 문제를", "숫자와 기록으로 다시 확인합니다."] },
    { en: "OUTPUT", title: "한 장면으로 남깁니다", lines: ["고르고, 자르고, 배열해", "맥락이 보이는 뉴스로 출력합니다."] },
  ];

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero NEW SYSTEM / NEWSIS ITEM auto-rotate
  const hero = document.getElementById("top");
  const markSystem = document.getElementById("mark-system");
  const markItem = document.getElementById("mark-item");
  let heroMode = "system";
  let heroLocked = false;
  let heroTimer = 0;

  const setHeroMode = (mode) => {
    heroMode = mode;
    hero.classList.remove("reading-system", "reading-item");
    hero.classList.add(`reading-${mode}`);
    if (markSystem) markSystem.setAttribute("aria-pressed", String(mode === "system"));
    if (markItem) markItem.setAttribute("aria-pressed", String(mode === "item"));
  };

  const startHeroRotation = () => {
    if (reduceMotion || heroLocked) return;
    heroTimer = window.setInterval(() => {
      setHeroMode(heroMode === "system" ? "item" : "system");
    }, 3600);
  };

  const lockHeroMode = (mode) => {
    heroLocked = true;
    window.clearInterval(heroTimer);
    setHeroMode(mode);
  };

  if (markSystem) markSystem.addEventListener("click", () => lockHeroMode("system"));
  if (markItem) markItem.addEventListener("click", () => lockHeroMode("item"));
  startHeroRotation();

  // Reveal-on-scroll for works section
  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (revealTargets.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // Reading progress + flow step tracking
  const progressBar = document.querySelector("#reading-progress-bar i");
  const flowSection = document.getElementById("system");
  const flowTriggers = flowSection ? Array.from(flowSection.querySelectorAll(".flow-trigger")) : [];
  const processBoard = document.getElementById("process-board");
  const processCopy = document.getElementById("process-copy");
  const processProgressBar = document.getElementById("process-progress-bar");
  const processStepLabel = document.getElementById("process-step-label");

  let currentStep = -1;

  const renderStep = (index) => {
    if (index === currentStep) return;
    currentStep = index;
    const step = STEPS[index];
    processBoard.className = `process-board process-step-${index + 1}`;
    processStepLabel.textContent = `0${index + 1} / 05`;
    processCopy.innerHTML = `<span>${step.en}</span><h3>${step.title}</h3><p>${step.lines
      .map((line) => `<span>${line}</span>`)
      .join("")}</p>`;
    processCopy.style.animation = "none";
    void processCopy.offsetHeight;
    processCopy.style.animation = "";
    processProgressBar.style.width = `${((index + 1) / STEPS.length) * 100}%`;
  };

  const onScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) {
      progressBar.style.width = `${scrollHeight > 0 ? Math.min(100, (window.scrollY / scrollHeight) * 100) : 0}%`;
    }
    if (flowTriggers.length) {
      const center = window.innerHeight * 0.56;
      let closestIndex = 0;
      let closestDistance = Infinity;
      flowTriggers.forEach((trigger, index) => {
        const rect = trigger.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * 0.45 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      renderStep(closestIndex);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  renderStep(0);
  onScroll();
})();
