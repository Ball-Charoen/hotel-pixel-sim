#!/usr/bin/env python3
"""Build assets/sprites/staff-portraits.png (384x48: 8 faces of 48x48) from AI portrait images.

Each input is one square head-and-shoulders portrait on a plain white or magenta background
(docs/art-prompts-chatgpt.md, section 5), in the same order as the rows of staff-sprites.png.

  python3 tools/portraits.py OUT.png FACE1 ... FACE8 [--preview P.png]

- background flood-filled from the top, left and right edges only (a white shirt touching the bottom stays)
- each source pixel snaps to the palette first, then each 48x48 pixel takes the most common result in the middle of its block
"""
import argparse, os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__))
from pixelate import write_png, nearest
from spritesheet import load, bgish, people_palette

SIZE = 48


def face(img, pal, cache):
    n = len(img)
    bg = Counter([img[0][0], img[0][-1], img[n // 2][0], img[n // 2][-1]]).most_common(1)[0][0]
    mask = [[False] * n for _ in range(n)]
    stack = [(x, 0) for x in range(n)] + [(0, y) for y in range(n)] + [(n - 1, y) for y in range(n)]
    while stack:
        x, y = stack.pop()
        if 0 <= x < n and 0 <= y < n and not mask[y][x] and bgish(img[y][x], bg):
            mask[y][x] = True
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    s = n / SIZE
    out = []
    for ty in range(SIZE):
        row = []
        for tx in range(SIZE):
            q = s / 4
            block = [(img[y][x], mask[y][x]) for y in range(int(ty * s + q), int((ty + 1) * s - q))
                     for x in range(int(tx * s + q), int((tx + 1) * s - q))]
            solid = [nearest(p, pal, cache) for p, m in block if not m]
            row.append(Counter(solid).most_common(1)[0][0] if len(solid) >= len(block) / 2 else None)
        out.append(row)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('out'); ap.add_argument('faces', nargs=8); ap.add_argument('--preview')
    a = ap.parse_args()
    pal, cache = people_palette(), {}
    faces = [face(load(p), pal, cache) for p in a.faces]
    strip = [[p for f in faces for p in f[y]] for y in range(SIZE)]
    write_png(a.out, strip)
    print(f'{a.out}: {SIZE * 8}x{SIZE}')
    if a.preview:
        S, bg = 4, (233, 240, 242)
        write_png(a.preview, [[bg if p is None else p for p in row for _ in range(S)] for row in strip for _ in range(S)])
        print(f'preview: {a.preview}')


if __name__ == '__main__':
    sys.exit(main())
