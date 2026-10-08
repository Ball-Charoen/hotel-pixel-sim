/* Building geometry in canvas pixels, taken from assets/art-templates/guide-building-320x300-x2.png.
   The owner's building-t0.png uses the same layout, so window lights and walkers line up with it. */
export const W = 320, H = 300;
export const ROOF = { x: 12, y: 16, w: 296, h: 50 };
export const WALL = { x: 20, y: 66, w: 279, h: 220 };
export const GROUND_Y = 286;

/* Floor bands (top..bottom) and the y where feet stand. Index 0 = lobby, 1 = floor 1, 2 = floor 2. */
export const FLOORS = [
  { top: 207, bottom: 286 },
  { top: 137, bottom: 198 },
  { top: 66, bottom: 128 },
];
export const ROOM_X = [41, 108, 174, 241];
export const ROOM_W = 46;
export const ROOM_Y = { 2: 74, 1: 145 };
export const ROOM_H = 41;

/* Room order matches the old hostel picture: floor 2 rooms 5-8 first, then floor 1 rooms 1-4.
   Lights fill rooms in this order; rooms closed for repair are the last ones. */
export const ROOMS = [2, 1].flatMap(f => ROOM_X.map(x => ({ floor: f, x, y: ROOM_Y[f], w: ROOM_W, h: ROOM_H })));

/* Where staff walk: x is the sprite centre. Stairs sit at the right end of every floor. */
export const WALK_MIN = 34, WALK_MAX = 286, STAIRS_X = 286;
export const DESK_X = 70; // reception desk in the lobby
export const SPRITE = 32;
