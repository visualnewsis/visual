# Browser acceptance checklist (NOT YET VERIFIED)

## Switch
- [ ] Cap is visually concave; no z-fighting between top dish and shell.
- [ ] Red stem visible with cap exploded; cross geometry aligned with socket.
- [ ] 4 clips and lower spring seat are visible when separated.
- [ ] Spring compresses for travel 0→4mm, resets exactly at 0.
- [ ] Metal moving leaf visually reaches fixed contact at nominal 2mm threshold; adjust geometry after actual render.
- [ ] Explode 0→1→0 is deterministic, no drift, stable pivot/origin.

## Espresso
- [ ] Stainless shell has readable thin edges, rounded silhouette, no inside-out normals.
- [ ] E61-inspired head is distinct from case, lower discharge visible, lever selectable.
- [ ] Filter locks and unlocks without obvious collision; basket open mouth and two streams visible.
- [ ] Gauge glass/needle/ticks are readable without depth sorting artifacts.
- [ ] Tray slots are physical gaps, steam wand attached at joint, cup warmer has slats.
- [ ] Tank/pump/boiler/pipes (tank currently NOT separately modeled) are visually distinct in inspection.
- [ ] No liquid stream when unlocked, stopped, or pressure=0.
- [ ] Detail reset returns all parts to exact original position.

## Static checks performed
- `node --check mx-switch.js` and `node --check espresso.js` passed.
- Archive file integrity tested. Runtime WebGL test not performed.
