#!/usr/bin/env python3
"""Build assets/sprites/staff-sprites.png (128x256: 8 staff rows x 4 frames of 32x32) from AI images.

Each input is one staff member: a square image split 2x2 (idle, walk1 / walk2, serve), facing right,
on a plain white or magenta background (docs/art-prompts-chatgpt.md, section 4).

  python3 tools/spritesheet.py OUT.png ROW1 ROW2 ... ROW8 [--height 28] [--preview P.png]

- background = the colour touching the cell edges, removed by flood fill (an enclosed white eye stays)
- every character gets the same scale (tallest one = --height px, about the AI image's own pixel size), feet on the bottom row
- the body is centred using the idle frame, so the character does not jump between frames
- each 32x32 pixel takes the most common colour of the source block, then snaps to the game palette
"""
import argparse, os, subprocess, sys, tempfile
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__))
from pixelate import read_png, write_png, load_palette, nearest, PALETTE_FILE

CELL = 32


def load(path):
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'in.png')
        subprocess.run(['sips', '-s', 'format', 'png', path, '--out', png], check=True, capture_output=True)
        return read_png(png)


def near(a, b, tol):
    return sum(abs(x - y) for x, y in zip(a, b)) <= tol


def bgish(p, bg):
    """Background or its blurry fringe: close to the bg colour, or tinted like it (magenta / pale grey)."""
    if near(p, bg, 45):
        return True
    r, g, b = p
    if bg[0] > 150 and bg[2] > 150 and bg[1] < 100:          # magenta background
        return r > g + 60 and b > g + 60
    return min(p) > 205 and max(p) - min(p) < 25               # white background: pale grey halo


def cells(img):
    """Split 2x2 and mark background (connected to the edges) as None."""
    n = len(img) // 2
    out = []
    for cy in (0, 1):
        for cx in (0, 1):
            c = [row[cx * n:(cx + 1) * n] for row in img[cy * n:(cy + 1) * n]]
            bg = Counter([c[0][0], c[0][-1], c[-1][0], c[-1][-1]]).most_common(1)[0][0]
            mask = [[False] * n for _ in range(n)]
            stack = [(x, y) for x in range(n) for y in (0, n - 1)] + [(x, y) for y in range(n) for x in (0, n - 1)]
            while stack:
                x, y = stack.pop()
                if 0 <= x < n and 0 <= y < n and not mask[y][x] and bgish(c[y][x], bg):
                    mask[y][x] = True
                    stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            out.append([[None if mask[y][x] else c[y][x] for x in range(n)] for y in range(n)])
    return out


def bbox(c):
    ys = [y for y, row in enumerate(c) if any(p is not None for p in row)]
    xs = [x for x in range(len(c[0])) if any(row[x] is not None for row in c)]
    return min(xs), min(ys), max(xs), max(ys)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('out'); ap.add_argument('rows', nargs=8)
    ap.add_argument('--height', type=int, default=20); ap.add_argument('--preview')
    a = ap.parse_args()
    # pink #c8577a is left out: no uniform uses it, and it is what the magenta background's blurry edge turns into
    keep = [h for h in open(PALETTE_FILE).read().split() if len(h) == 6 and h.lower() != 'c8577a']
    pal, cache = load_palette(PALETTE_FILE, ','.join(keep)), {}
    chars = [cells(load(p)) for p in a.rows]
    tallest = max(bbox(f)[3] - bbox(f)[1] + 1 for ch in chars for f in ch)
    scale = tallest / a.height                                   # source px per game px
    sheet = [[None] * (CELL * 4) for _ in range(CELL * 8)]
    for r, ch in enumerate(chars):
        ix0, _, ix1, _ = bbox(ch[0])
        left = round(CELL / 2 - (ix1 - ix0 + 1) / scale / 2)    # idle body centred; grid starts at its left edge
        for f, cell in enumerate(ch):
            feet = bbox(cell)[3]
            for ty in range(CELL):
                for tx in range(CELL):
                    sx0, sy0 = ix0 + (tx - left) * scale, feet + 1 - (CELL - ty) * scale
                    q = scale / 4                                # middle half of the block: ignores blurry edges
                    block = [cell[y][x] for y in range(int(sy0 + q), int(sy0 + scale - q)) for x in range(int(sx0 + q), int(sx0 + scale - q))
                             if 0 <= y < len(cell) and 0 <= x < len(cell)]
                    solid = [p for p in block if p is not None]
                    if block and len(solid) >= len(block) / 2:
                        sheet[r * CELL + ty][f * CELL + tx] = nearest(Counter(solid).most_common(1)[0][0], pal, cache)
    # drop lone specks (no solid neighbour) left by blurry edges
    for y in range(len(sheet)):
        for x in range(len(sheet[0])):
            if sheet[y][x] is not None and not any(
                    0 <= y + dy < len(sheet) and 0 <= x + dx < len(sheet[0]) and sheet[y + dy][x + dx] is not None
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                sheet[y][x] = None
    write_png(a.out, sheet)
    print(f'{a.out}: 128x256, scale {scale:.1f} source px per pixel')
    if a.preview:
        S, bg = 6, (233, 240, 242)
        write_png(a.preview, [[bg if p is None else p for p in row for _ in range(S)] for row in sheet for _ in range(S)])
        print(f'preview: {a.preview}')


if __name__ == '__main__':
    sys.exit(main())
