/* Building geometry in canvas pixels. T0 comes from assets/art-templates/guide-building-320x300-x2.png;
   T1/T2 (16 rooms, 4 floors) use the layout below and the owner's building-t1/t2.png should follow it
   (see assets/sprites/README-TH.txt). Floor index 0 = lobby, higher = upper floors. */
export const W = 320, H = 300;
export const GROUND_Y = 286;
export const WALL_X = 20, WALL_W = 279;
export const ROOM_X = [41, 108, 174, 241];
export const ROOM_W = 46;
export const WALK_MIN = 34, WALK_MAX = 286, STAIRS_X = 286;
export const DESK_X = 70;              // reception desk in the lobby
export const REST_X = [178, 262];      // restaurant tables in the lobby (Type 2)
export const SPRITE = 32;

function rooms(floors, roomTop, roomH) {
  // Lights fill the top floor first; rooms closed for repair are the last ones (bottom floor).
  return floors.slice(1).map((f, i) => i + 1).reverse()
    .flatMap(fi => ROOM_X.map(x => ({ floor: fi, x, y: floors[fi].top + roomTop, w: ROOM_W, h: roomH })));
}

const T0_FLOORS = [{ top: 207, bottom: 286 }, { top: 137, bottom: 198 }, { top: 66, bottom: 128 }];
export const LAYOUT_T0 = {
  roof: { x: 12, y: 16, w: 296, h: 50 }, wallTop: 66, floors: T0_FLOORS, rooms: rooms(T0_FLOORS, 8, 41),
};

const T1_FLOORS = [{ top: 242, bottom: 286 }, { top: 194, bottom: 238 }, { top: 146, bottom: 190 }, { top: 98, bottom: 142 }, { top: 50, bottom: 94 }];
export const LAYOUT_T1 = {
  roof: { x: 12, y: 16, w: 296, h: 34 }, wallTop: 50, floors: T1_FLOORS, rooms: rooms(T1_FLOORS, 5, 30),
};

export const layoutFor = roomCount => (roomCount > 8 ? LAYOUT_T1 : LAYOUT_T0);

/* Old names kept for the T0 layout. */
export const FLOORS = T0_FLOORS;
export const ROOMS = LAYOUT_T0.rooms;
export const ROOF = LAYOUT_T0.roof;
export const WALL = { x: WALL_X, y: LAYOUT_T0.wallTop, w: WALL_W, h: GROUND_Y - LAYOUT_T0.wallTop };
