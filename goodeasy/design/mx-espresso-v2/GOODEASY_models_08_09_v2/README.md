# GOODEASY 08/09 procedural Three.js models — v2

This package contains **modified executable model code**, not merely an errata note. v1 remains untouched at its original location. No external imports, fetch, textures or loaders; pass the already-loaded Three.js namespace as `T`.

```js
import { buildMXSwitch } from './mx-switch.js';
import { buildEspresso } from './espresso.js';
const sw=buildMXSwitch(THREE, materials);
const machine=buildEspresso(THREE, materials);
scene.add(sw.group, machine.group); // normally use separate scenes
sw.update({travel:2,explode:0});
machine.update({locked:true,brewing:true,volume:20,pressure:9,grind:.5},0.7);
```

## 08 — MX switch changes
- Single rounded-square, grid-sampled concave cap top meets tapered wall at y=.84, rather than a floating round dish. The cap underside is open; cross-shaped socket walls have an open cross aperture. No boolean/CAD claim.
- Spring bottom at y=-.635; `spring.scale.y` compresses geometry above the bottom, keeping the spring base fixed in assembled mode. Rest helix height .45 model units; 4 mm travel compresses to .05.
- Lower case floor top y=-.73; stem bottom at rest approximately -.30 and at 4mm approximately -.70, retaining .03 clearance.
- Fixed button and leaf button both z=0 and y=-.345. Leaf pivot is (.28,-.68,0); leaf contact at (.28,-.345,0) rest. Rotation around Z deflects leaf top toward fixed x=.48. At 2mm center gap equals 2×.052 (touching spheres); contact remains closed above 2mm. The contact is a **kinematic simplified approximation**; it does not solve metal bending forces or hysteresis.
- `parts` includes `lowerHousing,upperHousing,stem,spring,fixedContact,movingLeaf,keycap`; all explode offsets are local Y, with `update({travel:0..4,explode:0..1})`.

## 09 — Espresso changes
- Side shell now extends y=.05..3.10; top panel at 3.13. Rear sheet is separate `parts.rearPanel`, slides backwards and hides near full detail, leaving front and side shell present.
- Filter is a local-pivot group positioned at (HX=-.62,1.15,HZ=1.72). All basket, annular lip, bottom, perforation dots, and handle meshes are LOCAL to that group. Rotation therefore occurs around the basket center.
- Solid brass cap removed, replaced by TorusGeometry annular rim. Basket mouth remains open. Basket bottom micro-perforations are **surface markers, not drilled-through perforations**.
- Every direct mesh child of filter has `userData.action='lock'`, and `filter.userData.action='lock'`. Lever meshes have `userData.action='lever'` (never `action='action'`).
- `volume` means 0..40 mL; cup fill is `clamp(volume/40,0,1)`.
- Needle geometry is child of `needlePivot` at dial center; `pressure` (0..12 illustrative bar) rotates the pivot.
- E61-inspired lower drainage chamber is offset towards machine rear by .47 along Z, separated from central basket and cup stream axis. It is **not a fully verified E61 hydraulic circuit**.
- Added `parts.tank`, retained `parts.pump`, `parts.boiler`, `parts.pipes`; `detail` separates internals and rear panel.
- Two visible coffee streams only while `locked && brewing && pressure > 0`.

## Visual/model assumptions and unverified items
- Both models are educational, stylized meshes. Not a CAD reproduction of a specific Cherry MX switch or E61 machine.
- Switch cross-socket fit, stem clearance under repeated travel, contact timing across exploded states, mesh self-intersections, winding/normals, glass sorting, shadows, mobile performance, and exact mechanical tolerances have **not been verified in a WebGL browser**.
- Basket perforations are not actual through holes; exterior sheet shell is hollow but not a manufacturing-grade folded stainless assembly. E61 drain layout is illustrative. `grind` is stored in state but does not yet simulate flow resistance; `volume` is input, not numerically integrated from flow.
- No sound, hydraulic pressure simulation, heat simulation, or physical spring/leaf elasticity solver is supplied.
- JS parse check and ZIP CRC test are performed before delivery; these do not establish visual or physical correctness.
