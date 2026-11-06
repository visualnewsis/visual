
function threadPath(state = {}) {
  // Pure, conceptual 3D lockstitch thread path.
  // All coordinates are machine-group LOCAL coordinates.
  // Returns ONE ordered, continuous upper-thread polyline:
  // spool -> guides -> needle eye -> upper branch ->
  // common turning point -> lower branch -> fabric hole.
  // No Three.js, scene objects, clocks, or mutable shared state.

  const clamp = (x, a = 0, b = 1) =>
    Math.max(a, Math.min(b, x));

  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  const mix = (a, b, t) => a + (b - a) * t;
  const blend = (a, b, t) => a.map((v, i) => mix(v, b[i], t));

  const p = clamp(Number(state.phase) || 0);
  const eyeY = Number.isFinite(state.eyeY)
    ? state.eyeY
    : 1.20 + 0.45 * Math.cos(2 * Math.PI * p);

  const takeupY = Number.isFinite(state.takeupY)
    ? state.takeupY
    : 2.8;

  const H = [-0.85, 0.66, -0.42];
  const NX = -0.85;
  const R = 0.375;

  // Stationary case extent:
  // Y = 0.5825..0.75, radial extent <= 0.22.
  // Upper clearance >= 0.84, lower clearance <= 0.53.
  const UPPER_Y = 0.865;
  const LOWER_Y = 0.505;

  const eye = [NX, eyeY, 0];
  const scarf = [NX, eyeY + 0.035, -0.045];
  const hole = [NX, 1.05, 0];

  // Hook starts at +Z at p=.58 and advances continuously.
  // Its angular displacement at p=.82 is approximately 3.016 rad.
  const hookPhase = clamp((p - 0.58) / 0.24);
  const phi = hookPhase * (4 * Math.PI * 0.24);

  const polar = (angle, y, radius = R) => [
    H[0] + radius * Math.sin(angle),
    y,
    H[2] + radius * Math.cos(angle)
  ];

  // Single-loop envelope; eases in at capture and eases out
  // through cast-off/take-up without abrupt visibility switching.
  const grow = smooth(0.505, 0.61, p);
  const release = smooth(0.82, 0.94, p);
  const fullness = grow * (1 - release);

  // Capture-stage loop is compact; the two branches separate
  // vertically as the hook transports it around the case.
  const wrap = smooth(0.58, 0.72, p);
  const separation = fullness * wrap;

  // After cast-off, keep the loop OUTSIDE the case while it
  // tightens. Never collapse the wrapped points directly into
  // the needle axis.
  const clearance = 0.385;
  const transportAngle = phi;
  const exitAngle = 4 * Math.PI * 0.24;
  const sweepAngle = mix(transportAngle, exitAngle, release);

  // Progressive angular travel of the lower and upper branches.
  // Both branch paths terminate at EXACTLY the same turning point.
  const turningPoint = polar(
    sweepAngle,
    mix(0.855, 0.685, separation),
    clearance
  );

  // The turning point lies outside the case radius throughout.
  // At strong separation, create an upper and lower race excursion
  // without passing through the case's volume.
  const upperBranch = [];
  const lowerBranch = [];

  const steps = 14;
  const startAngle = 0;
  const endAngle = sweepAngle;

  const entrance = blend(
    [NX, eyeY - 0.075, -0.055],
    polar(0, UPPER_Y, clearance),
    fullness
  );

  // Above-case strand: higher than case top throughout wrapping.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = mix(startAngle, endAngle, t);
    const point = polar(a, UPPER_Y, clearance);

    // Preserve endpoint identity, and distribute the upper
    // height departure smoothly along the arc.
    const lift = separation * Math.sin(Math.PI * t) * 0.025;
    point[1] += lift;

    upperBranch.push(point);
  }

  // Under-case strand: return along the outside of the case.
  // Its Y remains below 0.53 except at common turning point
  // and the external needle-side entrance/exit transitions.
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const a = mix(startAngle, endAngle, t);
    const point = polar(a, LOWER_Y, clearance);

    const sag = separation * Math.sin(Math.PI * t) * 0.02;
    point[1] -= sag;

    lowerBranch.push(point);
  }

  // Smoothly establish a real over/under split. The transition
  // runs around the OUTSIDE of the case, not through its centre.
  const overUnder = smooth(0.58, 0.70, p) *
    (1 - smooth(0.83, 0.94, p));

  const starter = polar(0, 0.86, clearance);
  const finish = polar(0, 0.50, clearance);

  const upper = upperBranch.map((q, i) => {
    const t = i / steps;
    return blend(
      blend(entrance, turningPoint, t),
      q,
      overUnder
    );
  });

  const lower = lowerBranch.map((q, i) => {
    const t = (steps - i) / steps;
    return blend(
      blend(turningPoint, finish, t),
      q,
      overUnder
    );
  });

  // Build a shared turning junction, avoiding disconnected ends.
  // The turning junction descends around the outer radial
  // clearance between the upper and lower runs.
  const bridge = [];
  const upperEnd = upper[upper.length - 1];
  const lowerStart = lower[0];

  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const y = mix(upperEnd[1], lowerStart[1], t);
    const a = sweepAngle + Math.sin(Math.PI * t) * 0.035;
    bridge.push(polar(a, y, clearance + 0.014));
  }

  // Scarf-side entrance and a lower outside-case exit.
  // Both are continuous with their respective branches.
  const upperEntrance = blend(
    scarf, starter, fullness
  );

  const lowerExit = blend(
    [NX, 1.035, -0.04],
    finish,
    fullness
  );

  // Recovery follows the same outside corridor in reverse:
  // geometry contracts in stages instead of passing through
  // the bobbin case. At p>=.94 the remaining small loop
  // disappears into the needle/fabric entry corridor.
  const retract = smooth(0.83, 0.94, p);
  const upperCollapsed = [NX, Math.min(eyeY, 1.075), -0.035];
  const lowerCollapsed = [NX, 1.045, -0.025];

  const routedUpper = upper.map((q, i) => {
    const t = i / steps;
    const target = blend(upperCollapsed, lowerCollapsed, t);
    const radialSafe = [
      mix(q[0], target[0], retract * retract),
      mix(q[1], target[1], retract),
      mix(q[2], target[2], retract * retract)
    ];
    return radialSafe;
  });

  const routedLower = lower.map((q, i) => {
    const t = (steps - i) / steps;
    const target = blend(lowerCollapsed, upperCollapsed, t);
    return [
      mix(q[0], target[0], retract * retract),
      mix(q[1], target[1], retract),
      mix(q[2], target[2], retract * retract)
    ];
  });

  const spoolToEye = [
    [0.88, 3.47, 0.22],
    [0.88, 3.74, 0.04],
    [0.63, 3.05, 0.45],
    [-1.08, 2.97, 0.49],
    [-1.39, 2.57, 0.59],
    [-1.39, 2.55, 0.613],
    [-1.41, 2.35, 0.64],
    [-1.14, 2.18, 0.51],
    [-1.31, takeupY, 0.57],
    [-0.85, 1.84, 0.30],
    [-0.85, eyeY + 0.12, 0.10],
    [-0.85, eyeY, 0.025],
    eye
  ];

  const result = [
    ...spoolToEye,
    upperEntrance,
    ...routedUpper,
    ...bridge.map((q, i) => {
      const t = (i + 1) / 7;
      return blend(
        q,
        blend(upperCollapsed, lowerCollapsed, t),
        retract
      );
    }),
    ...routedLower,
    blend(lowerExit, lowerCollapsed, retract),
    [NX, 1.025, -0.025],
    hole
  ];

  // Adjacent points are welded conceptually by one polyline:
  // the renderer must build ONE TubeGeometry from this array.
  // Remove near-duplicates without moving any surviving point.
  const filtered = [];
  for (const point of result) {
    const prev = filtered[filtered.length - 1];
    if (!prev || Math.hypot(
      point[0] - prev[0],
      point[1] - prev[1],
      point[2] - prev[2]
    ) > 1e-5) {
      filtered.push(point);
    }
  }

  return filtered;
}
