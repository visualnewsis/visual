/**
 * 폭염 사이 폭우 (NEWSIS INTERACTIVE)
 * Main Interactive Scripts (Vanilla JavaScript)
 */

document.addEventListener("DOMContentLoaded", () => {
  initRain();
  initScrollProgress();
  initSoundControl();
  initHeroVideo();
  initHeroSlider();
  initHeatDroughtSlider();
  initSoilTrigger();
  initTurnSlides();
  initWeatherScroll();
  initDepthCalculator();
  initSafetyTabs();
});

/* -------------------------------------------------------------------------- */
/* 0. Rain Generator                                                          */
/* -------------------------------------------------------------------------- */
function initRain() {
  document.querySelectorAll("[data-rain]").forEach((container) => {
    const count = parseInt(container.getAttribute("data-rain"), 10) || 54;
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("i");
      drop.style.setProperty("--x", `${(i * 37) % 100}%`);
      drop.style.setProperty("--delay", `${-(i % 11) * 0.11}s`);
      drop.style.setProperty("--speed", `${0.48 + (i % 8) * 0.055}s`);
      drop.style.setProperty("--alpha", `${0.24 + (i % 5) * 0.1}`);
      container.appendChild(drop);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 1. Scroll Progress Bar                                                     */
/* -------------------------------------------------------------------------- */
function initScrollProgress() {
  const progressBar = document.getElementById("reading-progress");
  if (!progressBar) return;

  const onScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* -------------------------------------------------------------------------- */
/* 2. Sound Control (Rain Audio)                                              */
/* -------------------------------------------------------------------------- */
function initSoundControl() {
  const soundBtn = document.getElementById("sound-btn");
  const audio = document.getElementById("rain-audio");
  const btnText = document.getElementById("sound-btn-text");
  if (!soundBtn || !audio) return;

  let isPlaying = false;

  soundBtn.addEventListener("click", async () => {
    if (isPlaying) {
      audio.pause();
      soundBtn.classList.remove("is-playing");
      soundBtn.setAttribute("aria-pressed", "false");
      soundBtn.setAttribute("aria-label", "빗소리 효과 켜기");
      if (btnText) btnText.textContent = "빗소리 켜기";
      isPlaying = false;
    } else {
      audio.volume = 0.22;
      try {
        await audio.play();
        soundBtn.classList.add("is-playing");
        soundBtn.setAttribute("aria-pressed", "true");
        soundBtn.setAttribute("aria-label", "빗소리 효과 끄기");
        if (btnText) btnText.textContent = "빗소리 끄기";
        isPlaying = true;
      } catch (err) {
        console.warn("Audio playback was prevented:", err);
        isPlaying = false;
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Hero Video Resilience                                                   */
/* -------------------------------------------------------------------------- */
function initHeroVideo() {
  const video = document.getElementById("hero-video");
  if (!video) return;

  const resumeVideo = () => {
    if (document.visibilityState === "visible") {
      video.muted = true;
      video.play().catch(() => undefined);
    }
  };

  resumeVideo();
  document.addEventListener("visibilitychange", resumeVideo);
  window.addEventListener("pageshow", resumeVideo);
}

/* -------------------------------------------------------------------------- */
/* 4. Hero Heat/Flood Comparison Slider                                       */
/* -------------------------------------------------------------------------- */
function initHeroSlider() {
  const slider = document.getElementById("extreme-slider");
  const heatPanel = document.getElementById("extreme-heat");
  const floodPanel = document.getElementById("extreme-flood-panel");
  const divider = document.getElementById("extreme-divider");
  if (!slider || !heatPanel || !floodPanel || !divider) return;

  const updateSplit = (val) => {
    heatPanel.style.width = `${val}%`;
    floodPanel.style.left = `${val}%`;
    divider.style.left = `${val}%`;
  };

  slider.addEventListener("input", (e) => {
    updateSplit(e.target.value);
  });
}

/* -------------------------------------------------------------------------- */
/* 5. Chapter 1 Heat/Drought Slider                                           */
/* -------------------------------------------------------------------------- */
function initHeatDroughtSlider() {
  const slider = document.getElementById("heat-drought-range");
  const container = document.getElementById("heat-drought-interactive");
  if (!slider || !container) return;

  slider.addEventListener("input", (e) => {
    container.style.setProperty("--heat-dry-split", `${e.target.value}%`);
  });
}

/* -------------------------------------------------------------------------- */
/* 6. Chapter 2 Soil Comparison Rain Trigger                                  */
/* -------------------------------------------------------------------------- */
function initSoilTrigger() {
  const triggerBtn = document.getElementById("soil-trigger-btn");
  const soilCompare = document.getElementById("soil-compare");
  if (!triggerBtn || !soilCompare) return;

  const btnText = triggerBtn.querySelector("span");

  triggerBtn.addEventListener("click", () => {
    const isRaining = soilCompare.classList.toggle("is-raining");
    if (btnText) {
      btnText.textContent = isRaining ? "비 멈추기" : "두 땅에 같은 비 내리기";
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 7. Chapter 3 Turn Slideshow                                                */
/* -------------------------------------------------------------------------- */
function initTurnSlides() {
  const slidesContainer = document.getElementById("turn-slides");
  const navContainer = document.getElementById("turn-slide-nav");
  if (!slidesContainer || !navContainer) return;

  const slides = slidesContainer.querySelectorAll("figure");
  const buttons = navContainer.querySelectorAll("button");
  if (slides.length === 0) return;

  let currentIndex = 0;
  let timer = null;

  const showSlide = (index) => {
    currentIndex = index;
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
    buttons.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle("active", isActive);
      if (isActive) {
        btn.setAttribute("aria-current", "true");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  };

  const startTimer = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stopTimer();
    timer = window.setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      showSlide(nextIndex);
    }, 4200);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      showSlide(idx);
      startTimer();
    });
  });

  startTimer();
}

/* -------------------------------------------------------------------------- */
/* 8. Chapter 4 Weather Pressure Map Scroll Interaction                       */
/* -------------------------------------------------------------------------- */
const weatherScenes = [
  {
    day: "8월 15일",
    eyebrow: "비구름 접근",
    title: "남해의 수증기를 머금은 구름이 다가왔습니다.",
    body: "서쪽에서 접근한 저기압과 북동쪽 고기압 사이로 남풍이 강해졌습니다.",
    cloud: 22,
    jet: 35,
    rain: 18,
    phase: "수증기 유입",
  },
  {
    day: "8월 16일",
    eyebrow: "남해안 집중",
    title: "강한 바람길이 수증기를 거제 앞으로 밀어 올렸습니다.",
    body: "남쪽의 따뜻하고 습한 공기가 하층제트를 타고 계속 유입됐습니다.",
    cloud: 49,
    jet: 70,
    rain: 56,
    phase: "비구름 발달",
  },
  {
    day: "8월 17일",
    eyebrow: "비구름 정체",
    title: "동쪽 고기압에 막힌 비구름이 같은 자리에 멈췄습니다.",
    body: "거제 지형에서 발달한 비구름은 빠져나가지 못한 채 기록적인 비를 쏟았습니다.",
    cloud: 57,
    jet: 100,
    rain: 100,
    phase: "이동 정체",
  },
];

function initWeatherScroll() {
  const steps = document.querySelectorAll("[data-weather-step]");
  const weatherMap = document.getElementById("weather-map");
  const moistureJet = document.getElementById("moisture-jet");
  const rainSystem = document.getElementById("rain-system");
  const rainSystemLabel = document.getElementById("rain-system-label");
  const blockingArrow = document.getElementById("blocking-arrow");
  const blockingArrowLabel = document.getElementById("blocking-arrow-label");
  const weatherPhase = document.getElementById("weather-phase");
  const readoutDay = document.getElementById("weather-readout-day");
  const readoutTitle = document.getElementById("weather-readout-title");

  if (!steps.length || !weatherMap) return;

  const updateWeatherScene = (index) => {
    const scene = weatherScenes[index];
    if (!scene) return;

    // Update active step text
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });

    // Update map aria label
    weatherMap.setAttribute("aria-label", `${scene.day} 기압 배치 개념도`);

    // Update moisture jet
    if (moistureJet) {
      moistureJet.style.opacity = `${scene.jet / 100}`;
    }

    // Update rain system
    if (rainSystem) {
      rainSystem.style.left = `${scene.cloud}%`;
      rainSystem.style.setProperty("--rain-strength", scene.rain / 100);
      rainSystem.classList.toggle("is-stalled", index === 2);
    }
    if (rainSystemLabel) {
      rainSystemLabel.textContent = index === 2 ? "강수대 정체" : "강수대 이동";
    }

    // Update blocking arrow
    if (blockingArrow) {
      blockingArrow.className = `blocking-arrow step-${index}`;
    }
    if (blockingArrowLabel) {
      blockingArrowLabel.textContent =
        index === 2 ? "동쪽으로 빠져나가지 못함" : "동쪽으로 이동";
    }

    // Update phase indicator
    if (weatherPhase) {
      weatherPhase.setAttribute("aria-label", `현재 단계: ${scene.phase}`);
      const phaseItems = weatherPhase.querySelectorAll("i");
      phaseItems.forEach((item, i) => {
        item.classList.toggle("active", i <= index);
      });
    }

    // Update readout
    if (readoutDay) {
      readoutDay.textContent = `${scene.day} · ${scene.eyebrow}`;
    }
    if (readoutTitle) {
      readoutTitle.textContent = scene.title;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (active) {
        const stepIndex = Number(active.target.dataset.weatherStep);
        updateWeatherScene(stepIndex);
      }
    },
    { rootMargin: "-30% 0px -45% 0px", threshold: [0, 0.25, 0.6] },
  );

  steps.forEach((step) => observer.observe(step));
}

/* -------------------------------------------------------------------------- */
/* 9. Chapter 6 Rainfall Depth Calculator                                     */
/* -------------------------------------------------------------------------- */
function initDepthCalculator() {
  const slider = document.getElementById("depth-slider");
  const waterVolume = document.getElementById("water-volume");
  const waterCmLabel = document.getElementById("water-volume-cm");
  const summaryText = document.getElementById("depth-summary");
  const presetContainer = document.getElementById("depth-presets");
  if (!slider || !waterVolume) return;

  const presets = presetContainer ? presetContainer.querySelectorAll("button") : [];

  const updateDepth = (rainMm) => {
    const val = Number(rainMm);
    const waterCm = val / 10;
    const heightPercent = Math.min(100, Math.max(0, (waterCm / 180) * 100));

    waterVolume.style.height = `${heightPercent}%`;
    if (waterCmLabel) {
      waterCmLabel.textContent = `${waterCm.toFixed(1)}㎝`;
    }

    if (summaryText) {
      const mmFormatted = val % 1 ? val.toFixed(1) : val.toFixed(0);
      summaryText.innerHTML = `<b>${mmFormatted}㎜</b>의 비는 바닥에 <strong>${waterCm.toFixed(1)}㎝</strong> 높이로 쌓이는 양입니다.`;
    }

    slider.value = val;

    presets.forEach((btn) => {
      const btnVal = Number(btn.getAttribute("data-value"));
      btn.classList.toggle("active", Math.abs(btnVal - val) < 0.01);
    });
  };

  slider.addEventListener("input", (e) => {
    updateDepth(Number(e.target.value));
  });

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-value"));
      updateDepth(val);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 10. Chapter 7 Flood Safety Depth Tabs                                      */
/* -------------------------------------------------------------------------- */
const safetyLevels = [
  {
    cm: 15,
    marker: 10,
    title: "발목 위로 차오른 빠른 물",
    warning: "성인도 중심을 잃을 수 있습니다.",
    image: "images/low-person-torrent.jpg",
  },
  {
    cm: 30,
    marker: 17,
    title: "무릎 아래까지 차오른 빠른 물",
    warning: "작은 승용차가 떠밀릴 수 있습니다.",
    image: "images/low-cars-trapped.jpg",
  },
  {
    cm: 60,
    marker: 27,
    title: "허벅지까지 차오른 빠른 물",
    warning: "SUV와 트럭도 휩쓸릴 수 있습니다.",
    image: "images/low-stranded-car.jpg",
  },
];

function initSafetyTabs() {
  const tabsContainer = document.getElementById("safety-tabs");
  const img = document.getElementById("safety-img");
  const depthLine = document.getElementById("safety-depth-line");
  const cmText = document.getElementById("safety-cm-text");
  const titleText = document.getElementById("safety-title-text");
  const warningText = document.getElementById("safety-warning-text");

  if (!tabsContainer || !img) return;

  const buttons = tabsContainer.querySelectorAll("button");

  const updateSafety = (index) => {
    const data = safetyLevels[index];
    if (!data) return;

    img.src = data.image;
    img.alt = data.title;

    if (depthLine) {
      depthLine.style.setProperty("--depth-position", `${data.marker}%`);
    }
    if (cmText) {
      cmText.textContent = `${data.cm}㎝`;
    }
    if (titleText) {
      titleText.textContent = data.title;
    }
    if (warningText) {
      warningText.textContent = data.warning;
    }

    buttons.forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      updateSafety(idx);
    });
  });
}
