/* Building geometry in canvas pixels (320×300), one layout per building picture.
   Each layout is measured from the owner's art (ChatGPT, 9 Oct 2026): windows, floor beams, desk, stairs.
   T0 = assets/sprites/building-t0.png, T1 = building-t1.png (16 rooms, 4 floors). T2 (restaurant) uses
   the T1 layout until its art arrives; then measure it the same way (see docs/art-prompts-chatgpt.md).
   Floor index 0 = lobby, higher = upper floors. A floor's `bottom` is where staff feet stand.
   wall / deskX / restX / stairsX / walk only shape the placeholder art and where staff walk. */
export const W = 320, H = 300;
export const GROUND_Y = 286;
export const SPRITE = 32;

/* Rooms listed top floor first: lights fill the top floor first; rooms closed for repair are the last ones. */
function rooms(floors, xs, w, ys, h) {
  return floors.slice(1).map((f, i) => i + 1).reverse()
    .flatMap(fi => xs.map(x => ({ floor: fi, x, y: ys[fi - 1], w, h })));
}

const T0_FLOORS = [{ top: 228, bottom: 286 }, { top: 174, bottom: 216 }, { top: 121, bottom: 161 }];
export const LAYOUT_T0 = {
  roof: { x: 33, y: 3, w: 253, h: 118 }, wallTop: 121, wall: { x: 44, w: 228 }, floors: T0_FLOORS,
  rooms: rooms(T0_FLOORS, [69, 121, 173, 226], 25, [183, 129], 20),
  deskX: 90, restX: [178, 262], stairsX: 281, walk: [50, 281],
};

const T1_FLOORS = [{ top: 239, bottom: 286 }, { top: 190, bottom: 218 }, { top: 154, bottom: 181 }, { top: 118, bottom: 144 }, { top: 83, bottom: 109 }];
export const LAYOUT_T1 = {
  roof: { x: 31, y: 22, w: 257, h: 61 }, wallTop: 83, wall: { x: 37, w: 229 }, floors: T1_FLOORS,
  rooms: rooms(T1_FLOORS, [59, 112, 166, 218], 24, [197, 160, 124, 88], 15),
  deskX: 72, restX: [178, 262], stairsX: 272, walk: [45, 272],
};

export const layoutFor = roomCount => (roomCount > 8 ? LAYOUT_T1 : LAYOUT_T0);
