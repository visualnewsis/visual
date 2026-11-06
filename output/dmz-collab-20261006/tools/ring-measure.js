(async () => {
  const out = [];
  for (const f of [0.2, 0.5, 0.8]) {
    __dmz.go('incident', f);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    __dmz.go('incident', f);
    const w = __dmz.world, cam = w.camera; cam.updateMatrixWorld();
    const g = w.marks.blast.geometry.attributes.position, V = cam.position.constructor;
    let ymin = 1e9, ymax = -1e9;
    for (let i = 0; i < g.count; i++) { const v = new V(g.getX(i), g.getY(i), g.getZ(i)).project(cam); const y = (1 - v.y) / 2 * innerHeight; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    const card = [...document.querySelectorAll('[data-key=incident] .cap')].map(c => c.getBoundingClientRect()).find(r => r.height > 0);
    const lbl = [...document.querySelectorAll('.lbl')].find(l => /폭발 지점/.test(l.textContent) && getComputedStyle(l).visibility !== 'hidden');
    const lr = lbl ? lbl.querySelector('.lbl-in').getBoundingClientRect() : null;
    out.push({ f, oy: cam.view ? cam.view.offsetY : 0, ringTop: +ymin.toFixed(1), ringBottom: +ymax.toFixed(1), cardTop: card ? +card.top.toFixed(1) : null, gap: card ? +(card.top - ymax).toFixed(1) : null, labelTop: lr ? +lr.top.toFixed(1) : null, ringOpacity: +w.marks.blast.material.opacity.toFixed(2) });
  }
  return JSON.stringify({ vw: innerWidth, vh: innerHeight, rows: out });
})()
