"""
Generate LoveSpark Popup Fortress icons (16, 48, 128px).
Pink castle/fortress on dark rose background.
Requires: pip install Pillow
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (26, 10, 18)         # #1A0A12
FORT_COLOR = (255, 105, 180)    # #FF69B4
HIGHLIGHT = (255, 182, 193)     # #FFB6C1


def draw_fortress(draw, size):
    """Draw a simple fortress/castle shape centered in the canvas."""
    m = size * 0.12  # margin
    # Base wall
    wall_top = size * 0.45
    wall_bottom = size - m
    wall_left = m + size * 0.1
    wall_right = size - m - size * 0.1
    draw.rectangle([wall_left, wall_top, wall_right, wall_bottom], fill=FORT_COLOR)

    # Left tower
    tw = size * 0.2
    draw.rectangle([m, size * 0.2, m + tw, wall_bottom], fill=FORT_COLOR)
    # Left tower battlement
    bh = size * 0.08
    draw.rectangle([m, size * 0.2 - bh, m + tw * 0.4, size * 0.2], fill=FORT_COLOR)
    draw.rectangle([m + tw * 0.6, size * 0.2 - bh, m + tw, size * 0.2], fill=FORT_COLOR)

    # Right tower
    rx = size - m - tw
    draw.rectangle([rx, size * 0.2, rx + tw, wall_bottom], fill=FORT_COLOR)
    draw.rectangle([rx, size * 0.2 - bh, rx + tw * 0.4, size * 0.2], fill=FORT_COLOR)
    draw.rectangle([rx + tw * 0.6, size * 0.2 - bh, rx + tw, size * 0.2], fill=FORT_COLOR)

    # Gate (arch)
    cx = size / 2
    gate_w = size * 0.15
    gate_h = size * 0.2
    draw.rectangle([cx - gate_w, wall_bottom - gate_h, cx + gate_w, wall_bottom], fill=BG_COLOR)
    draw.pieslice(
        [cx - gate_w, wall_bottom - gate_h - gate_w, cx + gate_w, wall_bottom - gate_h + gate_w],
        180, 360, fill=BG_COLOR
    )


for s in SIZES:
    img = Image.new('RGBA', (s, s), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)
    draw_fortress(draw, s)
    img.save(f'icons/icon-{s}.png')
    print(f'Generated icon-{s}.png')
