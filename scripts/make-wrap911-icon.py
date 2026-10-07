#!/usr/bin/env python3
"""Build the iOS app icon and launch image from the WRAP 911 wordmark colors.

Uses the trainer display font (Bebas Neue) and the palette in trainer/css/style.css.
No vinyl illustration, no green, no third-party marks.
"""
import os
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WOFF = os.path.join(ROOT, "fonts", "bebas-neue.woff2")
TTF = "/tmp/bebas-neue.ttf"
BG = (9, 7, 13, 255)          # #09070d
GOLD = (255, 176, 0, 255)     # #ffb000
MAGENTA = (255, 45, 140, 255) # #ff2d8c


def load_font():
    font = TTFont(WOFF)
    font.flavor = None
    font.save(TTF)
    return TTF


def tracked(draw, text, font, fill, cx, y, tracking):
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking
    return total


def mark(size, wrap_px, num_px, tracking_wrap, tracking_num):
    img = Image.new("RGB", (size, size), BG[:3])
    draw = ImageDraw.Draw(img)
    wrap_font = ImageFont.truetype(TTF, wrap_px)
    num_font = ImageFont.truetype(TTF, num_px)
    wrap_h = wrap_font.getbbox("WRAP")[3]
    num_h = num_font.getbbox("911")[3]
    gap = int(size * 0.03)
    block = wrap_h + gap + num_h
    top = (size - block) / 2
    tracked(draw, "WRAP", wrap_font, GOLD, size / 2, top, tracking_wrap)
    tracked(draw, "911", num_font, MAGENTA, size / 2, top + wrap_h + gap, tracking_num)
    return img


def assert_no_green(img):
    px = img.convert("RGB").getdata()
    for r, g, b in px:
        if g > 80 and g > r + 30 and g > b + 30:
            raise SystemExit("icon contains a green pixel")


def main():
    load_font()
    icon = mark(1024, 168, 460, 18, 8)
    assert_no_green(icon)
    icon_path = os.path.join(
        ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
    )
    icon.save(icon_path, "PNG")
    art = os.environ.get("ICON_ARTIFACT")
    if art:
        os.makedirs(os.path.dirname(art), exist_ok=True)
        icon.save(art, "PNG")
    splash = mark(2732, 420, 1180, 46, 22)
    assert_no_green(splash)
    splash_dir = os.path.join(ROOT, "ios/App/App/Assets.xcassets/Splash.imageset")
    for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
        splash.save(os.path.join(splash_dir, name), "PNG")
    # Small-size proof for the author, not shipped.
    small = os.environ.get("ICON_SMALL")
    if small:
        sheet = Image.new("RGB", (60 + 80 + 120 + 180 + 40, 200), (255, 255, 255))
        x = 10
        for edge in (60, 80, 120, 180):
            sheet.paste(icon.resize((edge, edge), Image.Resampling.LANCZOS), (x, 20))
            x += edge + 10
        sheet.save(small, "PNG")
    print("wrote", icon_path)


if __name__ == "__main__":
    main()
