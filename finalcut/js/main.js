(() => {
  const canvas = document.querySelector(".signal-field");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let w = 0;
  let h = 0;
  const pointer = { x: -1000, y: -1000 };
  const points = Array.from({ length: 46 }, (_, i) => ({
    x: ((i * 73) % 997) / 997,
    y: ((i * 137) % 991) / 991,
    phase: i * 0.7,
    speed: 0.2 + (i % 6) * 0.03,
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    const positions = points.map((p) => ({
      x: p.x * w + Math.sin(t * 0.00018 * p.speed + p.phase) * 18,
      y: p.y * h + Math.cos(t * 0.00016 * p.speed + p.phase) * 14,
    }));
    positions.forEach((p, i) => {
      const near = Math.hypot(p.x - pointer.x, p.y - pointer.y) < 180;
      positions.slice(i + 1).forEach((q) => {
        if (Math.hypot(p.x - q.x, p.y - q.y) < 118) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(125, 255, 207, ${near ? 0.24 : 0.055})`;
          ctx.lineWidth = near ? 0.8 : 0.45;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      });
      ctx.beginPath();
      ctx.fillStyle = near ? "rgba(125,255,207,.9)" : "rgba(255,255,255,.2)";
      ctx.arc(p.x, p.y, near ? 2.3 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!reduceMotion) raf = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  canvas.addEventListener("pointermove", onPointerMove);
  if (reduceMotion) {
    draw(0);
  } else {
    raf = requestAnimationFrame(draw);
  }

  const range = document.getElementById("tuner-range");
  const valueLabel = document.getElementById("tuner-value");
  const message = document.getElementById("tuner-message");
  const messageText = message ? message.querySelector("b") : null;
  if (range) {
    const update = (value) => {
      range.style.setProperty("--clarity", `${value}%`);
      if (valueLabel) valueLabel.textContent = String(value);
      if (message) message.style.setProperty("--blur", `${(100 - value) / 14}px`);
      if (messageText) messageText.style.opacity = String(Math.max(0.12, value / 100));
    };
    const AGE_BASE_YEAR = 2026;
    const AGE_BASE_VALUE = 42;
    const age = AGE_BASE_VALUE + (new Date().getFullYear() - AGE_BASE_YEAR);
    range.value = String(age);
    update(age);
    range.addEventListener("input", (event) => update(Number(event.target.value)));
  }
})();
