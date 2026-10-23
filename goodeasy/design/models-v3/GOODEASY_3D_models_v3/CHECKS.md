# v3 verification checklist

## Static inspections
- Guitar rib geometry has `Shape.holes` (annular), no solid full-outline side wall.
- Guitar top/bottom rib surfaces meet the corresponding plates at y=.085 and y=-.115.
- Guitar fret positions are calculated from actual `saddleX-nutX` = 2.97, with 12 frets on the board.
- Violin bridge profile is vertical in YZ, extruded in X; windows are actual holes in that bridge mesh.
- Violin string endpoints follow nut -> individually arched bridge crest -> tailpiece; returned endpoints are nut -> crest.
- Bow contact reference is interpolated on speaking segment index 2 at x=.03.
- Arch patch winding faces +Y. F-holes are surface graphics.

## Must still test in the host browser
1. Orbit and zoom both models; look for inverted face normals, holes, unexpected silhouette discontinuities, and intersections.
2. Confirm actual visible gap through guitar soundhole and ribs from side/below.
3. Inspect 12 frets and tuner/bridge-pin alignments; inspect violin feet against arch.
4. Verify violin four string crests align with bridge; ensure hair touches intended string without unwanted multi-string audio.
5. Animate bow along Z and implement movement-dependent audio with pointercancel, blur, visibilitychange and inactivity stops.
6. Test touch and keyboard equivalents and snapshot-copy recording into observation screen.
7. Profile draw calls, high-resolution tubes, shadows and materials on target phones.

No browser WebGL render was run as part of this package build.
