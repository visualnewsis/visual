# GOODEASY | 08 MX switch + 09 espresso machine | procedural 3D handoff v1

## Integration
No imports, network calls, or external models. Import these local ES modules into the existing Three.js environment:

```js
import {buildMXSwitch} from './mx-switch.js';
import {buildEspresso} from './espresso.js';
const sw=buildMXSwitch(THREE,materials);
scene.add(sw.group);
sw.update({travel:2.1,explode:0});
const machine=buildEspresso(THREE,materials);
scene.add(machine.group);
machine.update({locked:true,brewing:true,volume:.4,pressure:9,grind:.5},0);
```

Materials accepted: `{wood,darkWood,ivory,steel,brass,black,felt,glass,red,coffee}`. Supplied materials are reused, missing ones fall back to local MeshStandard/Physical materials. Do not dispose shared supplied materials when disposing models.

## 08 switch: structure and controls
`buildMXSwitch(T,M)` returns `{group,parts,update({travel,explode})}`. `travel` is **millimetres** clamped 0–4; geometry model units are centimetres (travel converted by 0.1). `explode` is 0–1 and offsets named part groups on +/−Y, reversible. `parts` includes `keycap`, `upperHousing`, `stem`, `spring`, `fixedContact`, `movingLeaf`, `lowerHousing`. Coil and two metal contact members are separately selectable. `movingLeaf.userData.closed` changes at 2mm (illustrative actuation threshold). This is a contact animation model, **not** an electrical simulation.

Keycap is a sloped bevel shell with radial concave top and underside cross socket representation. Top housing has open center and four corner clips; bottom housing has a spring seat and two pins. Stem has central slider, cross mount and side cams. Important limitation: cross mount/socket clearance is schematic; cross socket is not a verified through-cut CSG bore, and lower pin count/placement varies by switch design. Not Cherry MX dimensional CAD.

## 09 espresso: structure and controls
`buildEspresso(T,M)` returns `{group,eye:[5,4,9],parts,update(state,detail)}`. Required `parts`: `pump,boiler,filter,cup,body,head,gauge`, plus `steamWand,pipes,dripTray,cupWarmer`. `filter.userData.action='lock'`; filter handle and basket also carry `action='lock'`. Lever shaft and ball have `action='lever'` (lever action string is deliberately named `lever`, not `lock`).

State: `{locked:boolean,brewing:boolean,volume:0..1,pressure:0..12,grind:0..1}`. Locked filter visibly rises and rotates to seat; brewing changes lever and, only when locked and pressure positive, reveals two pour streams. Cup coffee surface height follows volume; gauge needle follows pressure. `detail` 0..1 separates internal pump/boiler. **Grind** is stored as an input parameter only: flow/pressure dependence is not simulated. No thermodynamics, hydraulic pressure solution, espresso extraction chemistry, or physical fluid dynamics. The gauge needle is an illustration, not an instrument reading.

The body is an open-bottom thin-walled rounded extrusion with top and front panels. The E61-inspired exposed head is assembled from several independent stepped metal castings, vertical lower discharge and a right-side lever. Basket has a real open annulus but the metal basket floor perforations are visual dark dots, not boolean through-holes. Drip tray slots are true empty gaps between separate slats, not painted lines. Internal parts are inspectable and detachable by reference.

## Assumptions and unverified aspects
- Units are **illustrative**, not exact measurements. No manufacturer CAD or endorsement.
- This is a **first geometry/code handoff**, not visually approved. Real WebGL rendering, shadows, camera framing, self-intersections, winding/normal checks, GPU cost, pointer hitboxes, mobile frame rate and accessibility have **not been verified**.
- E61-style visual vocabulary is generic. It is **not** a functional E61 group mechanism model. Lever, pump and boiler positions are pedagogical.
- Switch actuation threshold 2mm is a modeling assumption, not a universal MX specification. Contact shape, spring force, clip tolerances and solder pin configuration require reference-based engineering validation.
- Coffee flow streams are simple cylinders (two visible jets), not particle-based liquid. Cup and gauge shapes are visual approximations.
- Camera recommendation: keyboard switch `eye=[3,3,5]`, target `[0,0,0]`, FOV 32–40°; espresso use returned `eye=[5,4,9]`, target `[0,1.55,0.5]`, FOV 30–38°. Use different compositions, not one generic nine-episode template.
- Existing repo and Codex were **not** modified. Integrate these modules manually in the existing local Three.js project.
