#!/usr/bin/env python3
"""Render Brief PageSpec JSON to 576x288 monochrome-green PNGs and a short walkthrough video.

The glasses do not draw HTML. This renderer approximates the Even G2 canvas
(4-bit green greyscale, no fill, left-aligned text) so the demo can be shown
when the official evenhub-simulator window is not available.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / "demo"
FRAMES_JSON = DEMO / "frames.json"
OUT = DEMO / "frames"
VIDEO = DEMO / "brief-walkthrough.mp4"

GREEN = [
    (0, 0, 0),
    (8, 28, 10),
    (14, 48, 16),
    (22, 72, 24),
    (32, 96, 36),
    (42, 122, 46),
    (58, 150, 58),
    (74, 176, 68),
    (96, 198, 80),
    (120, 214, 96),
    (150, 228, 112),
    (176, 236, 128),
    (198, 242, 150),
    (216, 248, 170),
    (232, 252, 196),
    (246, 255, 220),
]


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def brightness_to_level(text_color: int) -> int:
    # SDK textColor is 0-4. Map onto the brighter end of 4-bit green.
    return {0: 5, 1: 8, 2: 10, 3: 13, 4: 15}.get(text_color, 15)


def render_page(page: dict) -> Image.Image:
    img = Image.new("RGB", (576, 288), GREEN[0])
    draw = ImageDraw.Draw(img)
    body_font = font(16)
    for block in page["texts"]:
        color = GREEN[brightness_to_level(int(block.get("textColor", 4)))]
        x, y = int(block["x"]) + 8, int(block["y"]) + 6
        for i, line in enumerate(block["content"].split("\n")):
            draw.text((x, y + i * 20), line, fill=color, font=body_font)
    # subtle frame so the canvas bounds are visible in screenshots
    draw.rectangle((0, 0, 575, 287), outline=GREEN[3])
    return img


def main() -> None:
    frames = json.loads(FRAMES_JSON.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, page in frames.items():
        dest = OUT / f"{name}.png"
        render_page(page).save(dest)
        paths.append(dest)
        print("wrote", dest)

    # Build a short walkthrough from the official frames, 3s each, no audio.
    if shutil.which("ffmpeg") and paths:
        listing = DEMO / "frames" / "concat.txt"
        listing.write_text("".join(f"file '{p.name}'\nduration 3\n" for p in paths) + f"file '{paths[-1].name}'\n")
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
                "-pix_fmt", "yuv420p", "-vf", "fps=30,scale=1152:576:flags=neighbor",
                str(VIDEO),
            ],
            check=True,
            cwd=OUT,
        )
        print("wrote", VIDEO)


if __name__ == "__main__":
    main()
