# GOODEASY | 02 Guitar + 06 Violin | Procedural Three.js Models v2

**Deliverable:** actual JavaScript ES modules. Not screenshots, not SVG placeholders, not verified CAD.

## Contents
- `guitar.js`: `export function buildGuitar(THREE, materials={})`
- `violin.js`: `export function buildViolin(THREE, materials={})`
- `model-utils.js`: shared shape/extrude/tube/lathe-style primitives, browser-only optional procedural canvas wood grain
- `integration-example.js`: scene/camera/light setup and import usage
- `CHECKS.md`: limitations, geometry checks and implementation QA

## Import and data contract
```js
import { buildGuitar } from './guitar.js';
import { buildViolin } from './violin.js';
const model = buildGuitar(THREE, materials);
scene.add(model.group);
// {group, strings:[{midi, from:[x,y,z], to:[x,y,z], mesh}], parts:{...}}
```

- `materials`: `{wood,darkWood,ivory,steel,brass,black,felt}`. Values are `THREE.Material` instances; omitted values use internal fallbacks.
- `THREE` is **injected**; no import, CDN, loader or network dependency within the modules. The host app must provide its **existing local Three.js**.
- Coordinates: **X = instrument length** (negative neck/scroll, positive tail); **Y = up from soundboard**; **Z = across strings**. String `from`/`to` are in **group-local coordinates** and equal world coordinates if `group.matrixWorld` is identity. For transformed group, call `group.localToWorld(new THREE.Vector3(...from))` after `group.updateWorldMatrix(true,true)`.
- MIDI: guitar `[40,45,50,55,59,64]` (E2 A2 D3 G3 B3 E4); violin `[55,62,69,76]` (G3 D4 A4 E5).
- The returned string meshes are independently addressable and replaceable with shader-driven displacement for vibration. `parts.body`, `parts.bridge`, `parts.neck` and `parts.bow` are independent scene graph groups where present.
- `bow` exists only for violin and is a `THREE.Group`; `parts.bowHair` separates hair from bow stick. Bow sound is **not** synthesized by this geometry module.

## Composition and lighting
### Guitar / first interaction
Camera suggestion `(1.55, 1.45, 2.5)` looking at `(0.02, 0.10, 0)`; focal length equivalent around 50–65 mm, orthographic or perspective fov 35–40°. This creates a close diagonal over **bridge, soundhole, vibrating strings**. Large warm area key light `(0.4, 3, 2.3)` and low blue/neutral fill `(-1.8, 1.2, -1.5)`. Do not place a play button over strings. Prefer a clickable/capturable raycast layer following the **actual string meshes** with slightly larger transparent hit tubes.

### Violin / first interaction
Camera suggestion `(0.75, 1.45, 2.05)` looking at `(-0.02, 0.16, 0)`; 50–65 mm equivalent. Frame **bow hair at contact and f-holes**, avoid a front-on symmetrical view. Warm raking key `(1.5, 2.7, 1.6)` reveals varnish arch and ribs, restrained cool rim `(-1.5, 1.0, -1.2)`. Map pointer delta to `bow.position.z`, clamp travel, gate sound by **actual movement**; stop on no movement, `pointerup`, `pointercancel`, `window.blur`, `visibilitychange:hidden`.

## Implementation notes
- For animated plucks, do not permanently displace endpoint objects: use a shader/vertex displacement along the string, taper to zero at endpoints, and decay amplitude after attack.
- For violin, model geometry is only the contact representation. Audio is a synthetic approximation, **not a physical bowed-string simulation or sampled acoustic violin**.
- First experience has **no play/observation replay button**; controls for slow observation belong to the second screen only.
- Preserve the raw user performance log; pass a deep-copied snapshot to observation UI.
- Creative director credit: **크리에이티브 디렉터 = 안재현**.

## Source reference (geometry vocabulary, not dimensions)
- Yamaha musical instrument guide: https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/mechanism/
- Yamaha acoustic guitar structure: https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/structure/
- Yamaha violin structure: https://www.yamaha.com/en/musical_instrument_guide/violin/structure/
- Yamaha violin mechanism: https://www.yamaha.com/en/musical_instrument_guide/violin/mechanism/

Source URLs are reference pointers; this package does **not** claim a current live review of every page. No original manufacturer's CAD/mesh data was used.
