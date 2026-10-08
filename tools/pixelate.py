#!/usr/bin/env python3
"""Turn an ordinary photo into game pixel art: crop to the target shape, shrink to the exact size,
map every pixel to the 32-colour game palette, save as a crisp PNG (no smoothing).

Uses only Python's standard library plus macOS `sips` (to read JPEG/HEIC/PNG), so nothing to install.

  python3 tools/pixelate.py PHOTO OUT.png --size 160x96 [--focus 0.5] [--contrast 1.1]
         [--saturation 1.2] [--brightness 0] [--dither 0.0] [--preview PREVIEW.png]

--crop       X,Y,W,H in photo pixels: use only this box (e.g. to leave out a person), then fit as usual
--focus      which part to keep when cropping: 0 = top/left, 0.5 = centre, 1 = bottom/right
--dither     0 = flat colours, 0.3-0.6 = soft ordered dithering (more texture)
--colors     only use these palette colours (comma-separated hex), e.g. to keep a scene's mood
--gamma      below 1 (e.g. 0.7) lifts dark shadows, above 1 darkens
--clean      remove lone stray pixels (0 = off, 1-2 passes)
--lightness-weight  below 1 (e.g. 0.4) = match colour/hue first, brightness second
--preview    also write a side-by-side preview (original | pixel art) enlarged 4x for review
"""
import argparse, math, os, struct, subprocess, sys, tempfile, zlib

PALETTE_FILE = os.path.join(os.path.dirname(__file__), '..', 'assets', 'art-templates', 'hotel-pixel-32.hex')


# ---------- PNG read / write (8-bit RGB/RGBA, non-interlaced, which is what sips writes) ----------
def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, idat, w = 8, b'', None
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        chunk = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', chunk)
            assert depth == 8 and ctype in (2, 6) and interlace == 0, f'unsupported PNG (depth {depth}, type {ctype})'
            ch = 3 if ctype == 2 else 4
        elif kind == b'IDAT':
            idat += chunk
        pos += 12 + length
    raw, stride, prev, rows, i = zlib.decompress(idat), w * ch, bytearray(w * ch), [], 0
    for _ in range(h):
        f, line = raw[i], bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            b = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append([tuple(line[x * ch:x * ch + 3]) for x in range(w)])
        prev = line
    return rows


def write_png(path, rows):
    """rows of (r,g,b) tuples; a None pixel makes the PNG transparent there (RGBA)."""
    h, w = len(rows), len(rows[0])
    alpha = any(px is None for row in rows for px in row)
    if alpha:
        raw = b''.join(b'\x00' + bytes(v for px in row for v in ((0, 0, 0, 0) if px is None else (*px, 255))) for row in rows)
    else:
        raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in rows)
    chunk = lambda k, d: struct.pack('>I', len(d)) + k + d + struct.pack('>I', zlib.crc32(k + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6 if alpha else 2, 0, 0, 0))
                           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


# ---------- colour ----------
def to_lab(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(v) for v in rgb)
    x, y, z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def load_palette(path, only=None):
    hexes = [l.lower() for l in open(path).read().split() if len(l) == 6]
    if only:
        want = [h.strip().lower().lstrip('#') for h in only.split(',')]
        missing = [h for h in want if h not in hexes]
        assert not missing, f'not in the game palette: {missing}'
        hexes = want
    cols = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in hexes]
    return [(c, to_lab(c)) for c in cols]


def clean(art, passes):
    """Replace a pixel that matches none of its 4 neighbours with the most common neighbour colour."""
    H, W = len(art), len(art[0])
    for _ in range(passes):
        out = [r[:] for r in art]
        for y in range(H):
            for x in range(W):
                nb = [art[yy][xx] for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= yy < H and 0 <= xx < W]
                if art[y][x] not in nb:
                    out[y][x] = max(set(nb), key=nb.count)
        art = out
    return art


def adjust(px, contrast, saturation, brightness, gamma=1.0):
    r, g, b = (255 * (v / 255) ** gamma for v in px)
    grey = 0.299 * r + 0.587 * g + 0.114 * b
    out = []
    for v in (r, g, b):
        v = grey + (v - grey) * saturation
        v = (v - 128) * contrast + 128 + brightness
        out.append(max(0, min(255, v)))
    return tuple(out)


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def nearest(px, pal, cache, lw=1.0):
    """Closest palette colour in Lab. lw < 1 matches hue more than brightness (keeps dark greens green)."""
    key = tuple(int(v) >> 2 for v in px)
    if key not in cache:
        L = to_lab(px)
        cache[key] = min(pal, key=lambda p: lw * (L[0] - p[1][0]) ** 2 + (L[1] - p[1][1]) ** 2 + (L[2] - p[1][2]) ** 2)[0]
    return cache[key]


# ---------- resize ----------
def crop_resize(rows, W, H, focus):
    h, w = len(rows), len(rows[0])
    if w / h > W / H:   # too wide: crop sides
        cw, ch = h * W / H, h
    else:               # too tall: crop top/bottom
        cw, ch = w, w * H / W
    x0, y0 = (w - cw) * (focus if w / h > W / H else 0.5), (h - ch) * (focus if w / h <= W / H else 0.5)
    out = []
    for ty in range(H):
        sy0, sy1 = y0 + ty * ch / H, y0 + (ty + 1) * ch / H
        row = []
        for tx in range(W):
            sx0, sx1 = x0 + tx * cw / W, x0 + (tx + 1) * cw / W
            if sx1 - sx0 < 1 or sy1 - sy0 < 1:   # enlarging: bilinear sample at the centre
                cx, cy = (sx0 + sx1) / 2 - 0.5, (sy0 + sy1) / 2 - 0.5
                ix, iy = max(0, min(w - 2, int(cx))), max(0, min(h - 2, int(cy)))
                fx, fy = max(0, min(1, cx - ix)), max(0, min(1, cy - iy))
                px = [rows[iy][ix][k] * (1 - fx) * (1 - fy) + rows[iy][ix + 1][k] * fx * (1 - fy)
                      + rows[iy + 1][ix][k] * (1 - fx) * fy + rows[iy + 1][ix + 1][k] * fx * fy for k in range(3)]
            else:                                 # shrinking: average the covered pixels
                acc, n = [0, 0, 0], 0
                for yy in range(int(sy0), max(int(sy0) + 1, int(math.ceil(sy1)))):
                    for xx in range(int(sx0), max(int(sx0) + 1, int(math.ceil(sx1)))):
                        p = rows[min(yy, h - 1)][min(xx, w - 1)]
                        acc = [a + b for a, b in zip(acc, p)]; n += 1
                px = [a / n for a in acc]
            row.append(tuple(px))
        out.append(row)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('photo'); ap.add_argument('out')
    ap.add_argument('--size', default='160x96'); ap.add_argument('--focus', type=float, default=0.5)
    ap.add_argument('--contrast', type=float, default=1.1); ap.add_argument('--saturation', type=float, default=1.2)
    ap.add_argument('--brightness', type=float, default=0); ap.add_argument('--dither', type=float, default=0.0)
    ap.add_argument('--lightness-weight', type=float, default=1.0, dest='lw')
    ap.add_argument('--colors'); ap.add_argument('--clean', type=int, default=0)
    ap.add_argument('--gamma', type=float, default=1.0); ap.add_argument('--crop')
    ap.add_argument('--preview'); ap.add_argument('--palette', default=PALETTE_FILE)
    a = ap.parse_args()
    W, H = (int(v) for v in a.size.lower().split('x'))
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'in.png')
        subprocess.run(['sips', '-s', 'format', 'png', a.photo, '--out', png], check=True, capture_output=True)
        src = read_png(png)
    if a.crop:
        cx, cy, cw, ch = (int(v) for v in a.crop.split(','))
        src = [r[cx:cx + cw] for r in src[cy:cy + ch]]
    pal, cache = load_palette(a.palette, a.colors), {}
    small = crop_resize(src, W, H, a.focus)
    art = []
    for y, row in enumerate(small):
        out = []
        for x, px in enumerate(row):
            px = adjust(px, a.contrast, a.saturation, a.brightness, a.gamma)
            if a.dither:
                d = (BAYER[y % 4][x % 4] / 16 - 0.5) * 48 * a.dither
                px = tuple(max(0, min(255, v + d)) for v in px)
            out.append(nearest(px, pal, cache, a.lw))
        art.append(out)
    art = clean(art, a.clean)
    write_png(a.out, art)
    used = len({c for r in art for c in r})
    print(f'{a.out}: {W}x{H}, {used} palette colours used (source {len(src[0])}x{len(src)})')
    if a.preview:
        S = 4
        before = [[tuple(int(v) for v in p) for p in r] for r in small]
        gap = [(255, 255, 255)] * 4
        rows = []
        for y in range(H * S):
            l = [p for p in before[y // S] for _ in range(S)]
            r = [p for p in art[y // S] for _ in range(S)]
            rows.append(l + gap * S + r)
        write_png(a.preview, rows)
        print(f'preview: {a.preview}')


if __name__ == '__main__':
    sys.exit(main())
