# Validation and limitations

## Verified here
- ES module JavaScript syntax (`node --check`) on every source file.
- Exports exist with exact `buildGuitar(THREE,materials)` and `buildViolin(THREE,materials)` signatures.
- Explicit return objects include `group`, `strings`, `parts`; violin includes `bow`.
- Correct open-string MIDI values are assigned.
- No imports from a remote URL or third-party package; only relative `model-utils.js`.

## NOT verified here
- **No live WebGL screenshot/render QA**: the current environment did not provide the target site's local Three.js bundle or its renderer settings. Geometry may require tuning after actual browser inspection.
- This is **not CAD**, dimensionally accurate lutherie data, measured violin plate arching, or a physically accurate bridge/f-hole carving.
- The guitar's bridge pin / soundhole / rosette and violin f-hole / carved bridge / scroll shapes are **stylized**. The violin's arched patch and rib silhouette are approximations. Acoustic and mechanical behavior is not simulated.
- String endpoints define the **speaking length** for animation, not every segment around the pegs/bridge; tuning post continuations are separately rendered.
- Canvas wood grain is procedural, deterministic visual texture only, not a scan of real spruce/maple.
- Material appearance depends on the host's tone mapping, output color space, lights, shadow settings and device GPU.

## Browser acceptance checklist
1. Import both modules from the host's static server (not file://) with its existing `THREE`.
2. Confirm meshes have no WebGL errors and are visually distinguishable: guitar narrow waist, real soundhole, six pins; violin C-bouts, paired f-holes, bridge openings, separate bow/hair/frog.
3. Confirm guitar `[40,45,50,55,59,64]`, violin `[55,62,69,76]` and 6/4 `strings` counts.
4. Confirm each `strings[i].mesh` is attached to the returned group; raycast using an invisible wider hit cylinder if needed.
5. Confirm `parts.body`, `parts.bridge`, `parts.neck`, and violin `parts.bowHair` can be toggled independently.
6. Validate both default camera framings at 1440x900 and 390x844; adjust for responsive crop.
7. Confirm violin sound stops after no movement and on pointercancel/blur/hidden in **host input controller** (not part of geometry module).
8. Test Safari/iOS and Android touch capture and WebGL performance; reduce tube subdivisions selectively if needed.
