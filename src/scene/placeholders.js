/* Placeholder art drawn in code with the game palette (assets/art-templates/hotel-pixel-32.hex).
   Replaced automatically when the owner's PNGs are in assets/sprites/ (see sprites.js). */
import { W, H, ROOF, WALL, GROUND_Y, FLOORS, ROOMS, STAIRS_X, DESK_X, SPRITE } from './layout.js';

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
};
function pixelText(ctx, text, x, y, color, scale = 2) {
  ctx.fillStyle = color;
  [...text].forEach((ch, i) => (GLYPH[ch] || []).forEach((row, ry) => [...row].forEach((on, rx) => {
    if (on === '1') ctx.fillRect(x + (i * 4 + rx) * scale, y + ry * scale, scale, scale);
  })));
}

/* Hostel (T0) cross-section, 320×300, without window lights (those are drawn live on top). */
export function drawBuilding() {
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = C.sky; g.fillRect(0, 0, W, H);
  g.fillStyle = C.grass; g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  // stepped roof
  g.fillStyle = C.roof;
  g.fillRect(ROOF.x + 36, ROOF.y, ROOF.w - 72, 17);
  g.fillRect(ROOF.x + 16, ROOF.y + 17, ROOF.w - 32, 17);
  g.fillRect(ROOF.x, ROOF.y + 34, ROOF.w, ROOF.h - 34);
  // walls and floor beams
  g.fillStyle = C.wall; g.fillRect(WALL.x, WALL.y, WALL.w, WALL.h);
  g.fillStyle = C.teak;
  g.fillRect(WALL.x, FLOORS[2].bottom, WALL.w, FLOORS[1].top - FLOORS[2].bottom);
  g.fillRect(WALL.x, FLOORS[1].bottom, WALL.w, FLOORS[0].top - FLOORS[1].bottom);
  // rooms (window frames), lights are added by the scene
  ROOMS.forEach(r => {
    g.fillStyle = C.teak; g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    g.fillStyle = C.winOff; g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = C.teak; g.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
  });
  // stairs on the right of every floor
  g.fillStyle = C.teak;
  FLOORS.forEach(f => { for (let k = 0; k < 6; k++) g.fillRect(STAIRS_X + 4 + k * 1.5, f.bottom - (k + 1) * 6, 8 - k, 2); });
  // lobby: sign, reception desk, door, plant
  g.fillStyle = C.jade; g.fillRect(30, 214, 60, 18);
  pixelText(g, 'HOSTEL', 37, 218, C.cream);
  g.fillStyle = C.teak; g.fillRect(DESK_X - 26, GROUND_Y - 18, 52, 18);
  g.fillStyle = C.door; g.fillRect(DESK_X - 26, GROUND_Y - 20, 52, 3);
  g.fillStyle = C.door; g.fillRect(228, GROUND_Y - 52, 30, 52);
  g.fillStyle = C.lamp; g.fillRect(252, GROUND_Y - 28, 3, 3);
  g.fillStyle = C.brick; g.fillRect(170, GROUND_Y - 10, 12, 10);
  g.fillStyle = C.leaf; g.fillRect(166, GROUND_Y - 24, 20, 14);
  return c;
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
