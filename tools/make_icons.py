"""Generate the extension icons (16/32/48/128 px) into icons/.

Usage:  python tools/make_icons.py
Requires Pillow.  Re-run only when the mark changes; the PNGs are committed.
"""
from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
SIZES = (16, 32, 48, 128)
SS = 8  # supersampling factor

TOP = (58, 187, 114)     # light green
BOTTOM = (28, 122, 68)   # deep green
TILE = (255, 255, 255)
TILE_DIM = (206, 240, 219)


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (1, size))
    px = img.load()
    for y in range(size):
        k = y / max(size - 1, 1)
        px[0, y] = tuple(round(a + (b - a) * k) for a, b in zip(TOP, BOTTOM))
    return img.resize((size, size), Image.NEAREST)


def rounded_mask(size: int, radius: float) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius, fill=255)
    return mask


def make(size: int) -> Image.Image:
    s = size * SS
    base = gradient(s).convert("RGBA")
    base.putalpha(rounded_mask(s, s * 0.235))

    # 2x2 launcher grid, the last cell lighter so the mark reads as "links".
    pad = s * 0.235
    gap = s * 0.085
    cell = (s - 2 * pad - gap) / 2
    r = cell * 0.30
    draw = ImageDraw.Draw(base)
    for row in range(2):
        for col in range(2):
            x = pad + col * (cell + gap)
            y = pad + row * (cell + gap)
            fill = TILE_DIM if (row, col) == (1, 1) else TILE
            draw.rounded_rectangle((x, y, x + cell, y + cell), r, fill=fill)

    return base.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT / f"icon{size}.png"
        make(size).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)}")

    # A 440x280 small promo tile for the Chrome Web Store listing.
    promo = Image.new("RGBA", (440, 280), (14, 19, 25, 255))
    mark = make(128).resize((160, 160), Image.LANCZOS)
    promo.alpha_composite(mark, (140, 44))
    store = ROOT / "store"
    store.mkdir(parents=True, exist_ok=True)
    promo.convert("RGB").save(store / "promo-440x280.png", "PNG", optimize=True)
    print(f"wrote {(store / 'promo-440x280.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
