/* Placeholder art drawn in code with the game palette (assets/art-templates/hotel-pixel-32.hex).
   Replaced automatically when the owner's PNGs are in assets/sprites/ (see sprites.js). */
import { W, H, GROUND_Y, LAYOUT_T0, SPRITE } from './layout.js';

export const C = {
  ink: '#1d2b34', dark: '#3a3a44', slate: '#7d8fa0', cream: '#f4efe2', wall: '#e9d9bf', sky: '#bfe0ea', mist: '#e8f0f2',
  winOff: '#9db3b8', lamp: '#f2b33d', gold: '#e8b730', roof: '#7a4b32', teak: '#8c5a3c', door: '#5b3724', brick: '#b5643c',
  red: '#c0473a', pink: '#c8577a', jade: '#1f7a65', teal: '#3e8e7e', leaf: '#6ba55a', grass: '#6e8f5a', blue: '#4f6fb0',
  skin: ['#f1c9a5', '#e0ac82', '#c68b5e', '#9a6644'], hair: ['#2b2222', '#4a3426', '#1e2430', '#b6542f'],
};

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

/* 3×5 pixel letters for the lobby sign. */
const GLYPH = {
  H: ['101', '101', '111', '101', '101'], O: ['111', '101', '101', '101', '111'], S: ['111', '100', '111', '001', '111'],
  T: ['111', '010', '010', '010', '010'], E: ['111', '100', '110', '100', '111'], L: ['100', '100', '100', '100', '111'],
  F: ['111', '100', '110', '100', '100'], D: ['110', '101', '101', '101', '110'],
};
function pixelText(ctx, text, x, y, color, scale = 2) {
  ctx.fillStyle = color;
  [...text].forEach((ch, i) => (GLYPH[ch] || []).forEach((row, ry) => [...row].forEach((on, rx) => {
    if (on === '1') ctx.fillRect(x + (i * 4 + rx) * scale, y + ry * scale, scale, scale);
  })));
}

/* Building cross-section, 320×300, without window lights (drawn live on top).
   L = layout (T0 hostel or T1/T2 hotel); restaurant = Type 2 dining area in the lobby. */
export function drawBuilding(L = LAYOUT_T0, { restaurant = false } = {}) {
  const c = canvas(W, H), g = c.getContext('2d');
  const R = L.roof, F = L.floors, lobby = F[0], { x: WALL_X, w: WALL_W } = L.wall;
  const STAIRS_X = L.stairsX, DESK_X = L.deskX, REST_X = L.restX;
  g.fillStyle = C.sky; g.fillRect(0, 0, W, H);
  g.fillStyle = C.grass; g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  // stepped roof
  const step = Math.round(R.h / 3);
  g.fillStyle = C.roof;
  g.fillRect(R.x + 36, R.y, R.w - 72, step);
  g.fillRect(R.x + 16, R.y + step, R.w - 32, step);
  g.fillRect(R.x, R.y + 2 * step, R.w, R.h - 2 * step);
  // walls and floor beams
  g.fillStyle = C.wall; g.fillRect(WALL_X, L.wallTop, WALL_W, GROUND_Y - L.wallTop);
  g.fillStyle = C.teak;
  for (let i = 1; i < F.length; i++) g.fillRect(WALL_X, F[i].bottom, WALL_W, F[i - 1].top - F[i].bottom);
  // rooms (window frames), lights are added by the scene
  L.rooms.forEach(r => {
    g.fillStyle = C.teak; g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    g.fillStyle = C.winOff; g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = C.teak; g.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
  });
  // stairs on the right of every floor
  g.fillStyle = C.teak;
  F.forEach(f => { for (let k = 0; k < 6; k++) g.fillRect(STAIRS_X + 4 + k * 1.5, f.bottom - (k + 1) * 6, 8 - k, 2); });
  // lobby: sign, reception desk, door
  const signY = lobby.top + 7;
  const doorH = Math.min(52, GROUND_Y - lobby.top - 6);
  g.fillStyle = C.jade; g.fillRect(30, signY, F.length > 3 ? 52 : 60, 18);
  pixelText(g, F.length > 3 ? 'HOTEL' : 'HOSTEL', 37, signY + 4, C.cream);
  g.fillStyle = C.teak; g.fillRect(DESK_X - 26, GROUND_Y - 18, 52, 18);
  g.fillStyle = C.door; g.fillRect(DESK_X - 26, GROUND_Y - 20, 52, 3);
  if (restaurant) {
    // dining area: sign, two tables with chairs, a pass-through counter
    g.fillStyle = C.brick; g.fillRect(REST_X[0], signY, 44, 18);
    pixelText(g, 'FOOD', REST_X[0] + 6, signY + 4, C.cream);
    [REST_X[0] + 8, REST_X[0] + 52].forEach(x => {
      g.fillStyle = C.teak; g.fillRect(x, GROUND_Y - 14, 24, 4); g.fillRect(x + 10, GROUND_Y - 10, 4, 10);
      g.fillStyle = C.door; g.fillRect(x - 6, GROUND_Y - 10, 4, 10); g.fillRect(x + 26, GROUND_Y - 10, 4, 10);
      g.fillStyle = C.cream; g.fillRect(x + 4, GROUND_Y - 16, 5, 2); g.fillRect(x + 15, GROUND_Y - 16, 5, 2);
    });
    g.fillStyle = C.door; g.fillRect(132, GROUND_Y - doorH, 24, doorH);
  } else {
    g.fillStyle = C.door; g.fillRect(228, GROUND_Y - doorH, 30, doorH);
    g.fillStyle = C.lamp; g.fillRect(252, GROUND_Y - 28, 3, 3);
    g.fillStyle = C.brick; g.fillRect(170, GROUND_Y - 10, 12, 10);
    g.fillStyle = C.leaf; g.fillRect(166, GROUND_Y - 24, 20, 14);
  }
  return c;
}

/* Scaffolding drawn over the building while it is being extended. */
export function drawScaffold(g) {
  g.globalAlpha = 0.85;
  g.fillStyle = C.teak;
  for (let x = 14; x <= 304; x += 36) g.fillRect(x, 8, 3, GROUND_Y - 8);
  for (let y = 14; y < GROUND_Y; y += 34) g.fillRect(12, y, 296, 2);
  g.fillStyle = C.gold; g.fillRect(250, 2, 4, 40); g.fillRect(210, 2, 60, 4); g.fillRect(212, 6, 2, 16);
  g.globalAlpha = 1;
}

/* Staff sheet in the owner's layout: 8 rows (staff) × 4 frames (idle, walk1, walk2, serve), 32×32 each, facing right. */
export function drawStaffSheet() {
  const uniforms = [C.jade, C.blue, C.pink, C.brick, C.teal, C.red, C.gold, C.slate];
  const c = canvas(SPRITE * 4, SPRITE * 8), g = c.getContext('2d');
  for (let row = 0; row < 8; row++) {
    const skin = C.skin[row % 4], hair = C.hair[(row + 1) % 4], uni = uniforms[row];
    for (let f = 0; f < 4; f++) {
      const ox = f * SPRITE, oy = row * SPRITE;
      const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(ox + x, oy + y, w, h); };
      // legs (feet on the bottom row, y = 31)
      const legs = f === 1 ? [[11, 13], [18, 20]] : f === 2 ? [[14, 15], [16, 17]] : [[13, 14], [17, 18]];
      legs.forEach(([a, b]) => { px(a, 25, b - a + 1, 6, C.ink); px(a, 31, b - a + 2, 1, C.dark); });
      // body and arms
      px(11, 16, 10, 10, uni);
      px(14, 16, 4, 2, C.cream);
      if (f === 3) { px(21, 18, 6, 2, uni); px(26, 17, 3, 3, skin); px(24, 15, 6, 2, C.cream); } // serving: arm out with tray
      else px(21, 17, 2, 7, uni);
      px(9, 17, 2, 7, uni);
      // head, hair, eye
      px(12, 7, 8, 9, skin);
      px(11, 5, 10, 3, hair); px(11, 8, 2, row % 2 ? 6 : 3, hair);
      px(17, 10, 2, 2, C.ink);
      px(19, 13, 1, 1, C.red);
    }
  }
  return c;
}
