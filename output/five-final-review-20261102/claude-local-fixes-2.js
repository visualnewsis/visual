// GOODEASY local patches, round 2. Static code review only; nothing here was executed or rendered.
 
// ============================================================================
// A) gramophone-model.js — gooseneck must enter the soundbox BACK, not its diaphragm face
// After soundbox.rotation.y=-PI/2, R(x,y,z)=(-z,y,x): diaphragm (local x .048) is at hinge z -.037
// and faces +z; rim back face is at z -.126. The current gooseneck ends at (.155,.105,0) with
// radius .065, so it spans z -.065..+.065 and passes through the diaphragm (z -.0415..-.0325)
// and centre pad (z -.038..-.020). Sound would enter through the vibrating face.
// Replace line 176 (gooseneck tube) with the two lines below. Stylus tip is unchanged.
// ============================================================================
/*
 tube([V(0,0,0),V(-.02,-.06,-.10),V(.10,.03,-.26),V(.24,.105,-.26),V(.24,.105,-.18)],.065,brass,hinge,'hollow terminal gooseneck to soundbox back',32);
 const neck=cyl(.05,.05,.054,brass,hinge,.24,.105,-.153,'soundbox back neck');neck.rotation.x=Math.PI/2; // z -.18..-.126
*/
// Hand clearance vs soundbox cylinder (axis z through (.24,.105), r .205, z -.126..-.044):
// (-.02,-.06,-.10): radial .308 - tube .065 = .243 > .205. Segment crosses z=-.126 at radial ~.283-.065=.218.
// (.10,.03,-.26) and (.24,.105,-.26): z -.26+.065 = -.195 < -.126 (behind the box).
// Overlap with the arm tube near the hinge origin is the intended joint.
// Add a test: every gooseneck tube sample, except the last .055 of arc, keeps >= tube radius from the soundbox solid.
 
// ============================================================================
// B) violin-fittings.js — chinrest clamp sits ON the plate edge
// violin.js passes edgeX = max x of ribOuter (contour inset .012); edge = edgeX+.012 = plate contour.
// Clamp tube (r .0048) vertical therefore runs through the top plate edge wall (y .092..106)
// and the back plate edge wall (y -.121..-.105); the arm corner (edge, armY-.025 ~ .095..100)
// is inside the top plate. Replace the edge / pts lines inside the pad loop:
// ============================================================================
/*
  const edge=edgeX(z)+.012+.010,footX=Math.min(1.04,edge-.035),shoeTop=backY(footX,z),armY=underside(1.10,z)+.004;
  const pts=[[1.10,armY,z],[edge-.015,armY-.003,z],[edge,armY-.012,z],[edge,-.13,z],[edge-.025,shoeTop-.012,z],[footX,shoeTop-.012,z]].map(p=>new T.Vector3(...p));
*/
// Check: vertical now .010 outside the plate contour (> tube r .0048). At edge-.015 (.005 inside the contour)
// the arm is at armY-.003 ~ .117; minus tube r = .112 > top skin .106. The barrel (r .012) inner face moves
// to ribOuter+.010, still beside the rib.
 
// ============================================================================
// C) coffee-detail.js createCoffeeSurfaceMaterial — replace lines 318-327 of the injected GLSL
// Current: darkCoffee linear (.042,.010,.0045) has R:G = 4.2:1 -> under a 2+ intensity key light the lit
// centre reads maroon/cola. pigment = pow(smoothstep(.72,1,r),1.7) with coverage <= .36+.24*grain,
// then the rim is darkened 28% exactly where the crema sits, so crema is effectively absent on screen.
// Espresso liquid ~ sRGB #301F14 (linear .030,.014,.007, R:G ~ 2.1:1). Crema clings to the wall,
// so the contact line is lighter, not darker.
// ============================================================================
/*
float pigment=smoothstep(0.62,0.92,radius);
vec3 fineFoam=texture2D(map,vMapUv).rgb;
float fineGrain=clamp((fineFoam.r-fineFoam.g)*1.5,0.0,1.0);
float coverage=clamp(pigment*(0.70+fineGrain*.25),0.0,0.85);
vec3 darkCoffee=vec3(0.030,0.014,0.007);
vec3 thinCrema=vec3(0.33,0.17,0.07)*(0.92+fineGrain*.16);
diffuseColor.rgb=mix(darkCoffee,thinCrema,coverage);
diffuseColor.rgb=mix(diffuseColor.rgb,thinCrema*1.06,0.35*smoothstep(0.965,1.0,radius));
*/
// Visible crema (coverage > .3) starts near r ~ .75: about 40-45% of disc area. Lower 0.62/0.92 toward
// 0.70/0.95 for a thinner ring. Material colour 0x3a1b10 is overwritten by diffuseColor here.
 
// ============================================================================
// D) violin.js — violin-only ebony finish (guitarWood returns a new material per call, map is shared)
// guitarWood ebony: roughness .52 + clearcoat .32 gives a strong grazing-angle sheen on the long flat
// board; in violin-edge-after.png the board reads light grey/metallic. Oiled ebony is satin.
// After: const ebony=guitarWood(THREE,'ebony');
// ============================================================================
/*
 ebony.clearcoat=0; ebony.roughness=.66; ebony.bumpScale=.0004;
*/
 