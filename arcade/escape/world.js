// 밤티에이 — 회사에서 탈출하라 (working title, replace freely)
// All world dimensions, checkpoints and text live here so the scene and
// the "escape progress" logic can be edited without touching game.js.

export const TITLE = {
  brand: "CHUNGMU-LOADING",
  main: "BTA 밤티에이",
  sub: "회사에서 탈출하라",
};

// Meters. Player eye height ~1.6m.
export const PLAYER_START = { x: 1, y: 1.6, z: 0 };
export const PLAYER_START_YAW = -Math.PI / 2; // facing +X, down the office aisle

export const CORRIDOR_WIDTH = 3.4;
export const CEILING_HEIGHT = 2.8;

// The route is not one straight hallway — the reference footage turns a real
// corner at the office exit door. PATH is a polyline of waypoints; segment A
// runs along +X (desk -> cubicles -> copier bay -> exit door), then the
// route turns 90° at the corner and segment B runs along +Z (the shared
// building corridor -> elevator lobby). Movement collision hugs this
// polyline instead of clamping a single rectangle.
export const PATH = [
  { x: 0, z: 0 },
  { x: 40, z: 0 }, // corner: office exit door
  { x: 40, z: 36 }, // elevator lobby back wall
];
export const CORNER = { x: 40, z: 0 };

// Zones along segment A (local x = world x, local z = world z).
export const ZONES = [
  { id: "desk", x0: 0, x1: 6, floor: "#cbbfa5", wall: "#e9e6de", label: "내 자리" },
  { id: "cubicle-a", x0: 6, x1: 16, floor: "#d8d2c0", wall: "#eef1ea", accent: "#8fb8a8", label: "파티션 구역" },
  { id: "cubicle-b", x0: 16, x1: 26, floor: "#dfdac9", wall: "#f2efe6", accent: "#bcd6ce", label: "두 번째 사무공간" },
  { id: "office-corridor", x0: 26, x1: 40, floor: "#e6e1d3", wall: "#efece3", label: "복사기·출구" },
];

// Zones along segment B. World x = 40 + lateral offset, world z = distance
// along this leg (it starts at half a corridor-width past the corner so the
// L-shaped walls meet cleanly — see the corner geometry notes in game.js).
export const ZONES_B = [
  { id: "building-corridor", z0: CORRIDOR_WIDTH / 2, z1: 30, floor: "#cfc6b6", wall: "#e4dccb", label: "공용 복도" },
  { id: "elevator-lobby", z0: 30, z1: 36, floor: "#d7d2c6", wall: "#e2ddd0", label: "엘리베이터 로비" },
];

// Discovery checkpoints — proximity in full 2D (x,z), not just along one
// axis, since the route now bends. No on-screen arrows or "go here" text;
// reaching each one just advances the escape percentage.
export const CHECKPOINTS = [
  { id: "stand-up", x: 4, z: 0, radius: 2.5, percent: 10, label: "책상에서 일어났다" },
  { id: "cubicle-a", x: 11, z: 0, radius: 3, percent: 25, label: "정수기 옆 파티션을 지났다" },
  { id: "cubicle-b", x: 21, z: 0, radius: 3, percent: 40, label: "두 번째 사무공간을 지났다" },
  { id: "exit-door", x: 39, z: 0, radius: 2.5, percent: 55, label: "복사기를 지나 출구를 찾았다" },
  { id: "building-corridor", x: 40, z: 16, radius: 5, percent: 70, label: "코너를 돌아 공용 복도에 들어섰다" },
  { id: "elevator-lobby", x: 40, z: 32, radius: 3, percent: 85, label: "엘리베이터 로비에 도착했다" },
];

// Requires interaction (E / tap), not just proximity.
export const CALL_BUTTON = {
  x: 38.8,
  y: 1.1,
  z: 34.5,
  percent: 100,
  label: "호출 버튼을 눌렀다",
};

export const ENDING = {
  title: "CHUNGMU-LOADING COMPLETE",
  copy: "퇴근 완료.",
};
