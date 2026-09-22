"""Generate the extension icons into icons/ and the store artwork into store/.

Usage:  python tools/make_icons.py
Requires Pillow.  Re-run only when the mark changes; the PNGs are committed.

Store artwork sizes follow the Microsoft Edge Add-ons requirements, which are a
superset of what the Chrome Web Store asks for:
  logo-300x300.png     Edge extension logo, 1:1, required (min 128x128)
  icon64.png           Opera add-ons icon, exactly 64x64
  promo-440x280.png    small promotional tile, optional
  promo-1400x560.png   large promotional tile, optional
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


BACKDROP = (14, 19, 25, 255)


def promo_tile(width: int, height: int, mark_px: int) -> Image.Image:
    """Backdrop + centred mark, with a faint echo of the popup's link grid."""
    tile = Image.new("RGBA", (width, height), BACKDROP)

    ghost = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ghost)
    cell = mark_px * 0.30
    gap = cell * 0.34
    cols, rows = 3, 2
    block_w = cols * cell + (cols - 1) * gap
    block_h = rows * cell + (rows - 1) * gap
    x0 = width / 2 + mark_px * 0.42
    y0 = (height - block_h) / 2
    for r in range(rows):
        for c in range(cols):
            x = x0 + c * (cell + gap)
            y = y0 + r * (cell + gap)
            if x + cell > width - cell * 0.4:
                continue
            draw.rounded_rectangle((x, y, x + cell, y + cell), cell * 0.28,
                                   fill=(255, 255, 255, 20))
    tile.alpha_composite(ghost)

    mark = make(mark_px)
    tile.alpha_composite(mark, (int(width / 2 - mark_px * 1.15), int((height - mark_px) / 2)))
    return tile.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT / f"icon{size}.png"
        make(size).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)}")

    store = ROOT / "store"
    store.mkdir(parents=True, exist_ok=True)

    # Store artwork that no store loads from the package itself.
    for name, px in (("logo-300x300.png", 300), ("icon64.png", 64)):
        make(px).save(store / name, "PNG", optimize=True)
        print(f"wrote {(store / name).relative_to(ROOT)}")

    for name, (w, h, mark_px) in {
        "promo-440x280.png": (440, 280, 150),
        "promo-1400x560.png": (1400, 560, 340),
    }.items():
        promo_tile(w, h, mark_px).save(store / name, "PNG", optimize=True)
        print(f"wrote {(store / name).relative_to(ROOT)}")


if __name__ == "__main__":
    main()
