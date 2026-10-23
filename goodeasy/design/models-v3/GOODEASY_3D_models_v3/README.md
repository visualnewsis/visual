# GOODEASY / Guitar 02 + Violin 06 / procedural 3D v3

This package contains executable Three.js ES modules, **not** manufacturer CAD, photogrammetry, physically validated instrument dimensions, or an approved final visual. No new image generation was used.

## API
```js
import { buildGuitar } from './guitar.js';
import { buildViolin } from './violin.js';
const guitar = buildGuitar(THREE, materials);
const violin = buildViolin(THREE, materials);
scene.add(guitar.group, violin.group);
// each: {group, strings:[{midi,from,to,mesh,...}], parts:{...}}
```
- Inject the host's already-local `THREE`; modules import only `./model-utils.js`. No network, loader, or additional dependency.
- `materials={wood,darkWood,ivory,steel,brass,black,felt}` accepts Three.js materials; missing values use internal procedural fallbacks.
- X runs from nut/scroll (negative) to tail (positive); Y is top normal; Z spreads strings. `from/to` are **group-local** and equal world coordinates only for an untransformed group. Transform with `group.localToWorld(...)` after updating matrices.
- Guitar MIDI `[40,45,50,55,59,64]`; violin `[55,62,69,76]`.
- Geometry and interactive input/audio logic are distinct: this package constructs objects but does not synthesize sound, raycast, or implement pointer lifecycle.

## Specific v2 -> v3 repairs
1. **Guitar hollow ribs**: `body.side` is now an annular extrusion: outer organic outline minus an inset inner contour. `parts.ribs` spans Y `.085` to `-.115`, joining `parts.top` (Y `.101` to `.085`) and `parts.back` (Y `-.115` to `-.130`). The top retains its genuine soundhole opening. This is a *hollow shell representation*, not a modeled brace system or verified wood thickness.
2. **Guitar scale**: nut X `-2.34`, saddle X `.63`; scale length `2.97` model units. Fret positions use `nutX + (saddleX-nutX)*(1-2^(-n/12))`. Fingerboard runs about `-2.34` to `-.78`; 12 frets fall on the board. Fret placement and board extent are aligned; the length is not a real-world millimetre measurement.
3. **Violin bridge upright**: YZ-profile `Shape` extruded along X using `rotateY(PI/2)`. Two visible feet sit on the arched top at about Y `.138`, with an open central arch and two actual window cutouts. Crown has individual heights for each string.
4. **Violin strings over bridge**: speaking segments are **nut -> bridge crest**; bridge crest -> tailpiece is a separate `parts.afterlength` mesh. Returned `from/to` refer only to the speaking segment. `afterlengthMesh` and `tailEndpoint` are additional convenience fields.
5. **Violin bow contact**: bow hair at X `.03` is aligned to the interpolated Y of the selected A4 speaking segment (index `2`), rather than floating at Y `.315`. `bow.userData` reports selected string/contact, movement axis Z, and a visualization-only tolerance. Bow can translate along Z; sound must stop when motion stops or pointer is cancelled/blurred/hidden in the host app. This is **not** a collision solver; crossing other strings may require a bow-angle/contact filter.
6. **Violin top normals**: patch winding now uses `(a,a+1,b)` and `(b,a+1,b+1)` so XZ parameterization faces +Y. **f-holes remain surface-dark graphic approximations, not real cut-through perforations.**

## Suggested framing and light
- Guitar: camera `(1.55,1.45,2.5)` looking at `(.02,.10,0)`, focus on the soundhole, bridge and strings. Warm large key from `(.4,3,2.3)`, subdued neutral fill. Avoid a playback button on the first interaction screen.
- Violin: camera `(.75,1.45,2.05)` looking at `(-.02,.16,0)`, focus on the bow-hair/string crossing and f-hole graphics. Raking warm key `(1.5,2.7,1.6)` and restrained cool rim. Do **not** reuse the guitar framing.

## References and boundaries
- Yamaha acoustic guitar structure: https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/structure/
- Yamaha acoustic guitar mechanism: https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/mechanism/
- Yamaha violin structure: https://www.yamaha.com/en/musical_instrument_guide/violin/structure/
- Yamaha violin mechanism: https://www.yamaha.com/en/musical_instrument_guide/violin/mechanism/
These are instrument terminology references, **not** sources for the numeric coordinates. Links have not been revalidated live during this v3 build.

## Validation status (important)
- `node --check` passed for the JS modules. Package ZIP is verified by `unzip -t`.
- **Not verified:** actual WebGL rendering, normals/culling with a particular material, geometry self-intersection, visible string clearance in all camera angles, detailed bridge fit, sound accuracy, physical bow contact across all four strings, performance on low-end mobile devices, or actual instrument/CAD fidelity.
- `horizontalExtrude` has a negative-Y depth convention; geometry positions were adjusted accordingly.
- A renderer screenshot, live orbit inspection, and raycast/pointer/audio QA are required before calling this a visually acceptable service asset.

**Creative director:** 크리에이티브 디렉터 = 안재현
