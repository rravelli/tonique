#!/usr/bin/env python3
"""Turns the `page_images` captures into the site's images, as lossless WebP.

Usage: crop_shots.py CAPTURES_FOLDER

`hero.png` becomes `public/hero.webp` and `theme-<id>.png`
`public/themes/<id>.webp`, whole; the crops below become
`public/shots/<name>.webp`. Needs Pillow.
"""
import sys
from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
THEMES = ["dark", "light", "studio", "console", "session", "slate", "tape", "graphite", "high-contrast"]
# name: (capture, left, top, width, height), in pixels of the 3250 × 2025 captures.
SHOTS = {
    "loop": ("theme-dark", 552, 136, 1208, 680),
    "mix": ("theme-dark", 1828, 220, 1422, 800),
    "bring": ("browser", 0, 136, 1572, 884),
    "warp": ("clip", 0, 1170, 1504, 846),
    "filter": ("effects", 16, 1540, 708, 466),
    "echo": ("effects", 756, 1540, 504, 466),
    "spectrum": ("effects", 1296, 1540, 800, 466),
    "utility": ("effects", 2130, 1540, 436, 466),
    "graph": ("graph", 556, 220, 2694, 1640),
}


def save(image, path):
    image.convert("RGB").save(path, "WEBP", lossless=True, quality=100, method=6)
    print("Wrote", path.relative_to(PUBLIC.parent))


def main():
    captures = Path(sys.argv[1])
    save(Image.open(captures / "hero.png"), PUBLIC / "hero.webp")
    for theme in THEMES:
        save(Image.open(captures / f"theme-{theme}.png"), PUBLIC / "themes" / f"{theme}.webp")
    for name, (capture, left, top, width, height) in SHOTS.items():
        image = Image.open(captures / f"{capture}.png")
        save(image.crop((left, top, left + width, top + height)), PUBLIC / "shots" / f"{name}.webp")


if __name__ == "__main__":
    main()
