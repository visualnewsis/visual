# Browser acceptance checks (not yet executed)

1. MX travel 0/2/4mm: cap+stem descend 0/.2/.4 model units, stem bottom remains above case floor; spring bottom stays y=-.635.
2. MX fixed/moving button share z=0 and y=-.345 at rest; at 2mm moving leaf rotates until spherical buttons meet. Check leaf pivot at lower anchor and whether the visual cam actually meets leaf.
3. MX keycap top must be one square concave grid joined to tapered walls, not a circular floating dish; underside cross hole must be open.
4. MX explode 0→1→0: spring, contacts, cap, stem and housing return to original local transforms.
5. Espresso side shell y=.05..3.10, top panel y=3.13; no hovering side wall.
6. Espresso basket mouth visible from above; no solid brass disk. `filter.traverse` action must be `lock` for every Mesh.
7. Espresso locked/unlocked: basket rotates around its center, not scene origin. Handle stays attached.
8. Espresso volume 0, 20, 40 gives empty, half, full; volume 1 is 2.5%, not 100%.
9. Espresso pressure needle rotates around center; lever's userData.action is `lever`.
10. Espresso detail 0→1: rear panel slides away and hides; tank/pump/boiler/pipes visible. Side shell remains.
11. Espresso lower drainage nozzle lies rear of basket, not on extraction path; cup streams only while locked+brewing+pressure positive.
12. Test material injection with all optional M entries, mouse raycast ancestry, camera and lighting, normal orientations, collisions and mobile frame time.
