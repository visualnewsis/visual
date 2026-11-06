# VISUAL NEWSIS / 굳이구지 — Grand Action Rig Specification v0.2

## Status and epistemic boundary
Browser visualization design, NOT measured manufacturer CAD. All coordinates, dimensions and angles below are **visualization assumptions**. SVG panels demonstrate intended hierarchy, not a verified collision-constrained simulation. Recalibrate against a licensed reference action before production.

## Coordinate system
Right-handed world coordinates: +X toward piano interior (away from player), +Y up, +Z toward camera. Unit `u` is arbitrary, NOT millimetres. Side view in SVG has +screenY down; convert via worldY=-svgY. Assembly coordinate origin: key balance pivot `K=(218,278,0)` in SVG layout. Side plate depth nominal 12u; key width 22u, gap 3u, these are display assumptions.

| Part | Static pivot / local reference (SVG x,y) | Visual length or envelope u | Rest angle | Display maximum / movement | Type |
|---|---|---|---|---|---|
| Key | balance pin (218,278) | x=58..509, thickness 17 | 0° | -7° around balance pin | rigid lever |
| Capstan | attached key point (360,264) | vertical stem 24 | 0° | follows key | child of key |
| Wippen | fixed flange (433,215) | lever 132 x 22 | 0° | -8° | rigid lever |
| Jack | attached wippen pivot (348,220) | height 54 | 0° | -16° relative wippen | hinged lever |
| Repetition lever | wippen local | envelope 56 x 36 | 0° | constrained small relative rotation | sprung hinged lever |
| Hammer shank | hammer flange (430,169) | 194 | 0° | -45° | rigid lever |
| Hammer head | shank-local centroid approx (236,112) | 39 x 40 | 0° | follows hammer | felt/wood assembly |
| Knuckle | shank-local (351,148) | ellipse 26 x 16 | 0° | follows hammer | contact roller |
| Backcheck | key-local (287,264) | 55 | 0° | follows key | catcher |
| Damper | vertical guide at x=473 | stem 88 | rest touches strings | lift +15u | translational guide |
| Strings | horizontal y=66..72 | x=42..555 | fixed | transverse oscillation shader | string set |
| Let-off button | fixed (330,193) | radius 5 | fixed | none | stop/contact |

The values are schematic and should NOT be treated as actual piano measurements. The supplied SVG renderer contains intentionally approximate state rotations, not an inverse-kinematics solver. Its side geometry should be visually recalibrated before 3D extrusion.

## Geometry requirements for Codex / Three.js
- Key: bevelled long wooden lever, ivory-colored cap at player end; wood underside and balance pin bushing, round pivot hole, felt rail stop.
- Capstan: metallic cylindrical threaded shaft with rounded head and small washer; the visible thread can be a normal map, not true mesh.
- Wippen: nonrectangular carved wooden body, tapering toward flange, round pivot boss and dark bushing; attach heel contact pad below.
- Jack: slender shaped wooden lever with angled toe, round pivot boss, return spring and stop; distinguish toe from upper contact tip.
- Repetition lever: curved fork/bridge around jack, slotted region, spring contact and leather/felt contact pad. Must rotate independently of jack.
- Hammer: tapered wooden shank, pear-shaped compressed-felt head with wood core, thin red felt accent only where physically appropriate; pivot flange with pin.
- Knuckle: rounded leather-covered cylinder on shank underside, separate contact collider.
- Backcheck: slim wooden stalk rising from key, angled leather catcher pad; must visually capture rebounding hammer.
- Damper: wire, weighted body, wooden head and cream felt wedge resting on top of horizontal string plane. Lift independently from hammer.
- Strings: 1–3 slender metal strings appropriate to the selected pitch; visually vibrating line/mesh with envelope, not displaced rigid bars.
- Hardware: flange blocks, polished pins, pivot bushings, adjustment screws and felt stops. Screws should follow realistic local attachment positions.

## Rig hierarchy
`ActionRoot` -> `FixedRails`, `StringGroup`, `KeyPivot` (KeyMesh, Capstan, Backcheck, DamperLiftContact), `WippenPivot` (WippenMesh, `JackPivot`, `RepetitionPivot`, Spring), `HammerPivot` (Shank, Head, Knuckle), `DamperGuide` (Damper), `LetOffStop`.

Each dynamic object has a rest transform, a pivot transform, a mesh and optional collision proxy. Geometry is constructed in local coordinates, never rescaled during animation. Mesh thickness is constant. Contact pairs: capstan/wippen heel; jack/knuckle; jack toe/let-off stop; repetition lever/knuckle; hammer felt/string; hammer tail/backcheck; key/damper underlever.

## State and events
`REST -> DRIVE -> LET_OFF -> FREE_FLIGHT -> STRIKE -> REBOUND -> CHECKED -> RESET -> REST`. State may transition from RESET to DRIVE before full key release if jack has re-engaged. Do not simply map hammer angle to key depth. Integrate hammer angular velocity after jack release, clamp penetration with contact resolution, and model impact as brief impulse. Damping of string vibration depends on damper contact. State machine is descriptive; continuous dynamics and contact guards are required.

Pedal: `damperLift = max(keyDrivenLift, sustainPedalLift)` for damped notes. On key-up with sustain ON, key resets but damper remains raised. On sustain OFF with key up, damper returns and string envelope decays rapidly. Highest undamped notes are an exception; choose a damped midrange note such as C4 for this lesson.

Playback: user keyboard input triggers existing audio and current-note state unchanged. Inspection mode may replay cached key velocity and event timeline at 0.25x/0.5x/1x; use time-stretched visualization but DO NOT retune audio or alter the live instrument. For high-speed repetition simulate partial key release, jack reset and a new impulse. Fixed physics timestep recommended; render interpolated at screen refresh.

## Six key frames (descriptive, not linear pose morphing)
1. REST: key level, jack under knuckle, damper on strings.
2. PRESS: key front descends, capstan raises wippen, jack drives hammer, damper begins lift.
3. LET-OFF: jack toe meets let-off button, jack escapes from knuckle; hammer continues under inertia.
4. STRIKE: hammer felt touches string briefly; string vibration starts. The hammer is already mechanically decoupled.
5. CHECK: hammer rebounds and backcheck catches it while key remains down; damper remains raised.
6. RELEASE: key rises, backcheck releases, jack repositions under knuckle; damper drops unless sustain pedal held.

## Explode and reassembly
Initial `explode=0`: fully assembled. When entering explode mode, freeze the inspection playback at a valid pose, preferably REST, then interpolate each group to a preauthored local offset; do not play the action while disconnected. Preserve pivot and connector markers, with thin dashed guide lines showing original mounting position. Suggested world-Z offsets (visualization assumptions): key -45u, wippen +20u, hammer +55u, damper +80u, strings +105u. These are layer offsets for clarity, not true physical disassembly paths. Reverse interpolation to zero before resuming playback. Allow individual part focus and isolate but maintain ghost silhouette of the original assembly.

## Materials and lighting
Maple wood: base #B68C5F, roughness .62, fine longitudinal grain. Felt: #E4D6C0, roughness .95, soft silhouette and short-fiber normal map. Leather/knuckle: #956C50, roughness .82. Nickel/steel: #A6ADB0, metalness .8, roughness .3. Brass: #B6975D, metalness .7, roughness .35. Black shell: #11171B, clearcoat .6, roughness .18. Use subtle red felt only at actual contact/bushing points.

Lighting: large warm key light upper-left at 3500–4200K, neutral soft fill from camera, restrained cool rim light to distinguish pivot hardware. No saturated emissive glow. Ambient occlusion restrained; contact shadows should clarify assembly.

Camera: orthographic or long-lens perspective, initial 10–18° azimuth and 5–10° elevation, aiming at jack/knuckle/hammer. Offer precise side view and oblique inspection; orbit clamp to prevent occlusion. On mobile, frame the single action and use part-focus camera presets. Do not change camera during six-phase comparison.

## Acceptance tests
- [ ] All major parts have non-box silhouette and consistent thickness.
- [ ] Every moving rigid part keeps fixed length and pivot.
- [ ] Capstan contacts wippen heel; jack contacts knuckle until let-off.
- [ ] Jack actually separates before hammer touches string.
- [ ] Hammer rebounds and backcheck captures it without crossing meshes.
- [ ] Jack can reset during partial key release; repeated strike is possible.
- [ ] Key release returns damper when sustain OFF.
- [ ] Key release keeps damper raised when sustain ON; pedal-up returns it.
- [ ] Explode mode pauses animation and reassembly restores exact rest transforms.
- [ ] Desktop and mobile cameras show jack, hammer, string and damper distinctly.
- [ ] Existing piano keyboard, sound output and last-note state remain unchanged.
- [ ] Visual claims are compared against manufacturer reference video or permitted photographs.

## References
Yamaha: https://www.yamaha.com/en/musical_instrument_guide/piano/mechanism/mechanism003.html
Yamaha pedal comparison: https://www.yamaha.com/en/musical_instrument_guide/piano/selection/
Kawai action: https://kawaius.com/technology/piano-action/
Kawai regulation: https://kawaius.com/wp-content/uploads/2019/04/Kawai-Grand-Piano-Regulation-Manual.pdf
KTH: https://www.speech.kth.se/music/5_lectures/askenflt/timing.html
UCLouvain action analysis: https://dial.uclouvain.be/pr/boreal/object/boreal%3A215131/datastream/PDF_01/view
