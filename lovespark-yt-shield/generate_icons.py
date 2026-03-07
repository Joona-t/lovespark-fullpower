"""
Generate LoveSpark YouTube Shield icons (16, 48, 128px).
Pink shield on dark rose background.
Requires: pip install Pillow
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (26, 10, 18)         # #1A0A12
SHIELD_COLOR = (255, 105, 180)  # #FF69B4
HIGHLIGHT = (255, 182, 193)     # #FFB6C1


def draw_shield(draw, size):
    """Draw a simple shield shape centered in the canvas."""
    margin = size * 0.15
    cx = size / 2
    top = margin
    bottom = size - margin
    left = margin
    right = size - margin
    mid_y = top + (bottom - top) * 0.55

    # Shield outline as polygon
    points = [
        (cx, top),                  # top center
        (right, top + (mid_y - top) * 0.3),  # top right
        (right, mid_y),             # mid right
        (cx, bottom),               # bottom point
        (left, mid_y),              # mid left
        (left, top + (mid_y - top) * 0.3),   # top left
    ]
    draw.polygon(points, fill=SHIELD_COLOR)

    # Inner highlight triangle
    inner_margin = size * 0.3
    inner_top = top + size * 0.15
    inner_points = [
        (cx, inner_top),
        (cx + size * 0.12, inner_top + size * 0.15),
        (cx - size * 0.12, inner_top + size * 0.15),
    ]
    draw.polygon(inner_points, fill=HIGHLIGHT)


for s in SIZES:
    img = Image.new('RGBA', (s, s), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)
    draw_shield(draw, s)
    img.save(f'icons/icon-{s}.png')
    print(f'Generated icon-{s}.png')
