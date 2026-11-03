# Builds docs/kitty-demo.gif from the frames e2e/demo.ts recorded: GitHub (left) + Kitty's side panel (right),
# with a caption bar per scene. Identical frames are merged and long waits are shortened.
# Usage: python scripts/make-demo-gif.py
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'e2e', 'out', 'demo-v2')
OUT = os.path.join(HERE, '..', '..', '..', 'docs', 'kitty-demo.gif')
SCALE = 0.75
BAR = 46
MAX_MS = 850  # no single frame stays longer than this (waits get shortened)


def font(size):
    for name in ('segoeuib.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def compose(n, label, f):
    page = Image.open(os.path.join(SRC, f'{n:04d}-page.png')).convert('RGB')
    panel = Image.open(os.path.join(SRC, f'{n:04d}-panel.png')).convert('RGB')
    w, h = page.width + 2 + panel.width, max(page.height, panel.height) + BAR
    canvas = Image.new('RGB', (w, h), (13, 17, 23))
    canvas.paste(page, (0, BAR))
    canvas.paste(panel, (page.width + 2, BAR))
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, 0, w, BAR], fill=(22, 27, 34))
    d.rectangle([0, BAR - 3, w, BAR], fill=(35, 134, 54))
    d.text((16, 11), label, fill=(240, 246, 252), font=f)
    d.text((w - 210, 13), 'GitKitty · Kitty', fill=(139, 148, 158), font=font(18))
    return canvas.resize((int(w * SCALE), int(h * SCALE)), Image.LANCZOS)


def main():
    frames = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
    f = font(22)
    images, durations = [], []
    for i, fr in enumerate(frames):
        try:
            img = compose(fr['n'], fr['label'], f)
        except FileNotFoundError:
            continue
        nxt = frames[i + 1]['t'] if i + 1 < len(frames) else fr['t'] + 2500
        ms = max(120, min(MAX_MS, nxt - fr['t']))
        if images and ImageChops.difference(img, images[-1]).getbbox() is None:
            durations[-1] = min(MAX_MS * 2, durations[-1] + ms)  # same picture: hold it a little longer
            continue
        images.append(img)
        durations.append(ms)
    durations[-1] = 3500
    pal = [im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for im in images]
    pal[0].save(OUT, save_all=True, append_images=pal[1:], duration=durations, loop=0, optimize=True, disposal=1)
    print(f'{len(images)} frames, {sum(durations) / 1000:.0f}s, {os.path.getsize(OUT) / 1e6:.1f} MB -> {os.path.normpath(OUT)}')


if __name__ == '__main__':
    sys.exit(main())
