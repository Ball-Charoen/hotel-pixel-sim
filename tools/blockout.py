#!/usr/bin/env python3
"""Draw building "blockout" images for an image AI to paint over (docs/art-prompts-chatgpt.md).

Same shapes as the in-game placeholder (src/scene/placeholders.js) and LAYOUT_T1 in src/scene/layout.js,
enlarged from 320x300 to 1024x960 plus 64 px of sky on top = a 1024x1024 square.
Every box (windows, floors, desk, door) sits exactly where the game expects it, so art painted over it
lines up with the window lights and the walking staff.

  python3 tools/blockout.py OUT_DIR      -> blockout-t1.png, blockout-t2.png

T0 is not drawn any more: its layout now comes from the owner's finished art (see src/scene/layout.js).
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pixelate import write_png

W, H, GROUND_Y, WALL_X, WALL_W = 320, 300, 286, 20, 279
ROOM_X, ROOM_W, STAIRS_X, DESK_X, REST_X = [41, 108, 174, 241], 46, 286, 70, [178, 262]
T0 = dict(roof=(12, 16, 296, 50), wall_top=66, floors=[(207, 286), (137, 198), (66, 128)], room_top=8, room_h=41)
T1 = dict(roof=(12, 16, 296, 34), wall_top=50, floors=[(242, 286), (194, 238), (146, 190), (98, 142), (50, 94)], room_top=5, room_h=30)
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
C = {k: hexc(v) for k, v in dict(sky='#bfe0ea', grass='#6e8f5a', roof='#7a4b32', wall='#e9d9bf', teak='#8c5a3c', win='#9db3b8',
                                   jade='#1f7a65', cream='#f4efe2', door='#5b3724', lamp='#f2b33d', brick='#b5643c', leaf='#6ba55a').items()}
GLYPH = {'H': ['101', '101', '111', '101', '101'], 'O': ['111', '101', '101', '101', '111'], 'S': ['111', '100', '111', '001', '111'],
         'T': ['111', '010', '010', '010', '010'], 'E': ['111', '100', '110', '100', '111'], 'L': ['100', '100', '100', '100', '111'],
         'F': ['111', '100', '110', '100', '100'], 'D': ['110', '101', '101', '101', '110']}


def draw(L, restaurant=False):
    img = [[C['sky']] * W for _ in range(H)]

    def rect(x, y, w, h, col):
        for yy in range(max(0, round(y)), min(H, round(y + h))):
            for xx in range(max(0, round(x)), min(W, round(x + w))):
                img[yy][xx] = col

    def text(s, x, y, col, sc=2):
        for i, ch in enumerate(s):
            for ry, row in enumerate(GLYPH[ch]):
                for rx, on in enumerate(row):
                    if on == '1':
                        rect(x + (i * 4 + rx) * sc, y + ry * sc, sc, sc, col)

    F = L['floors']
    rect(0, GROUND_Y, W, H - GROUND_Y, C['grass'])
    rx, ry, rw, rh = L['roof']; step = round(rh / 3)
    rect(rx + 36, ry, rw - 72, step, C['roof']); rect(rx + 16, ry + step, rw - 32, step, C['roof'])
    rect(rx, ry + 2 * step, rw, rh - 2 * step, C['roof'])
    rect(WALL_X, L['wall_top'], WALL_W, GROUND_Y - L['wall_top'], C['wall'])
    for i in range(1, len(F)):
        rect(WALL_X, F[i][1], WALL_W, F[i - 1][0] - F[i][1], C['teak'])
    for top, _ in F[1:]:
        for x in ROOM_X:
            y = top + L['room_top']
            rect(x - 2, y - 2, ROOM_W + 4, L['room_h'] + 4, C['teak']); rect(x, y, ROOM_W, L['room_h'], C['win'])
            rect(x + ROOM_W / 2 - 1, y, 2, L['room_h'], C['teak'])
    for _, bottom in F:
        for k in range(6):
            rect(STAIRS_X + 4 + k * 1.5, bottom - (k + 1) * 6, 8 - k, 2, C['teak'])
    lobby_top = F[0][0]; sign_y = lobby_top + 7; door_h = min(52, GROUND_Y - lobby_top - 6); hotel = len(F) > 3
    rect(30, sign_y, 52 if hotel else 60, 18, C['jade']); text('HOTEL' if hotel else 'HOSTEL', 37, sign_y + 4, C['cream'])
    rect(DESK_X - 26, GROUND_Y - 18, 52, 18, C['teak']); rect(DESK_X - 26, GROUND_Y - 20, 52, 3, C['door'])
    if restaurant:
        rect(REST_X[0], sign_y, 44, 18, C['brick']); text('FOOD', REST_X[0] + 6, sign_y + 4, C['cream'])
        for x in (REST_X[0] + 8, REST_X[0] + 52):
            rect(x, GROUND_Y - 14, 24, 4, C['teak']); rect(x + 10, GROUND_Y - 10, 4, 10, C['teak'])
            rect(x - 6, GROUND_Y - 10, 4, 10, C['door']); rect(x + 26, GROUND_Y - 10, 4, 10, C['door'])
            rect(x + 4, GROUND_Y - 16, 5, 2, C['cream']); rect(x + 15, GROUND_Y - 16, 5, 2, C['cream'])
        rect(132, GROUND_Y - door_h, 24, door_h, C['door'])
    else:
        rect(228, GROUND_Y - door_h, 30, door_h, C['door']); rect(252, GROUND_Y - 28, 3, 3, C['lamp'])
        rect(170, GROUND_Y - 10, 12, 10, C['brick']); rect(166, GROUND_Y - 24, 20, 14, C['leaf'])
    return img


def to_square(img, size=1024):
    """320x300 -> size x size: scale to size wide, sky band fills the top."""
    sc = size / W; out_h = round(H * sc); pad = size - out_h
    rows = [[C['sky']] * size for _ in range(pad)]
    for y in range(out_h):
        src = img[min(H - 1, int(y / sc))]
        rows.append([src[min(W - 1, int(x / sc))] for x in range(size)])
    return rows


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    for name, L, rest in (('t1', T1, False), ('t2', T1, True)):
        p = os.path.join(out, f'blockout-{name}.png')
        write_png(p, to_square(draw(L, rest)))
        print(p)
