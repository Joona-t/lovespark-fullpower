"""
Generate LoveSpark Cookie Annihilator icons (16, 48, 128px).
Pink cookie with bite taken out on dark rose background.
Requires: pip install Pillow
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (26, 10, 18)         # #1A0A12
COOKIE_COLOR = (255, 105, 180)  # #FF69B4
CHIP_COLOR = (255, 182, 193)    # #FFB6C1
BITE_COLOR = BG_COLOR


def draw_cookie(draw, size):
    """Draw a cookie with a bite taken out and chocolate chips."""
    margin = size * 0.12
    cx, cy = size / 2, size / 2
    r = (size / 2) - margin

    # Main cookie circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=COOKIE_COLOR)

    # Bite taken out (top-right)
    bite_r = r * 0.4
    bite_x = cx + r * 0.6
    bite_y = cy - r * 0.6
    draw.ellipse(
        [bite_x - bite_r, bite_y - bite_r, bite_x + bite_r, bite_y + bite_r],
        fill=BITE_COLOR
    )

    # Chocolate chips (small dots)
    chip_r = max(1, size * 0.06)
    chips = [
        (cx - r * 0.3, cy - r * 0.2),
        (cx + r * 0.1, cy + r * 0.3),
        (cx - r * 0.1, cy + r * 0.05),
        (cx + r * 0.3, cy - r * 0.1),
        (cx - r * 0.4, cy + r * 0.4),
    ]
    for (x, y) in chips:
        draw.ellipse([x - chip_r, y - chip_r, x + chip_r, y + chip_r], fill=CHIP_COLOR)


for s in SIZES:
    img = Image.new('RGBA', (s, s), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)
    draw_cookie(draw, s)
    img.save(f'icons/icon-{s}.png')
    print(f'Generated icon-{s}.png')
