# Builds a short 1080p promo video (docs/kitty-promo.mp4, plus docs/kitty-promo.gif for the README) from the frames e2e/demo.ts recorded:
# an animated title card, the four demo scenes with big captions, and an end card with the repo link.
# Usage: python scripts/make-promo-video.py   (needs: pip install pillow imageio-ffmpeg)
import json
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'e2e', 'out', 'demo-v2')
SHEET = os.path.join(HERE, '..', 'src', 'content', 'assets', 'kitty-sprites.png')
OUT = os.path.join(HERE, '..', '..', '..', 'docs', 'kitty-promo.mp4')
W, H, FPS = 1920, 1080, 30
BG, CARD, GREEN, WHITE, GREY = (13, 17, 23), (22, 27, 34), (63, 185, 80), (240, 246, 252), (139, 148, 158)
CELL = 192
ANIM = {'walk': (0, 8), 'idle': (1, 6), 'wave': (5, 4)}

# scene label prefix -> (caption, seconds on screen)
SCENES = [
    ('1 ·', 'Tour any repo', 'Kitty walks you through the files that matter', 11.0),
    ('2 ·', 'Ask Git questions', 'Instant answers, with sources', 5.0),
    ('3 ·', '"Find me a Docker issue"', 'Kitty finds a good first issue and explains it', 10.0),
    ('4 ·', 'Check your PR', 'See what maintainers would send back, before they do', 6.5),
]


def font(size, bold=True):
    names = ('segoeuib.ttf', 'arialbd.ttf') if bold else ('segoeui.ttf', 'arial.ttf')
    for name in names + ('DejaVuSans-Bold.ttf',):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


SHEET_IMG = Image.open(SHEET).convert('RGBA')


def cat(anim, i, size, flip=False):
    row, n = ANIM[anim]
    c = SHEET_IMG.crop(((i % n) * CELL, row * CELL, (i % n + 1) * CELL, (row + 1) * CELL)).resize((size, size), Image.NEAREST)
    return c.transpose(Image.FLIP_LEFT_RIGHT) if flip else c


def centered(d, y, text, f, fill):
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)


def background():
    img = Image.new('RGB', (W, H), BG)
    glow = Image.new('RGB', (W, H), BG)
    ImageDraw.Draw(glow).ellipse([W * 0.15, H * 0.35, W * 0.85, H * 1.3], fill=(18, 44, 30))
    return Image.blend(img, glow.filter(ImageFilter.GaussianBlur(220)), 1.0)


BASE = background()


def scene_frame(n, title, sub):
    """One recorded moment: GitHub + side panel in a window, caption on top."""
    page = Image.open(os.path.join(SRC, f'{n:04d}-page.png')).convert('RGB')
    panel = Image.open(os.path.join(SRC, f'{n:04d}-panel.png')).convert('RGB')
    shot = Image.new('RGB', (page.width + 2 + panel.width, max(page.height, panel.height)), (48, 54, 61))
    shot.paste(page, (0, 0))
    shot.paste(panel, (page.width + 2, 0))
    top, bar = 190, 34
    s = (H - top - 40 - bar) / shot.height
    shot = shot.resize((int(shot.width * s), int(shot.height * s)), Image.LANCZOS)
    x, y = (W - shot.width) // 2, top
    img = BASE.copy()
    shadow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(shadow).rounded_rectangle([x - 6, y + 10, x + shot.width + 6, y + bar + shot.height + 22], 18, fill=170)
    img.paste((0, 0, 0), mask=shadow.filter(ImageFilter.GaussianBlur(22)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x - 1, y - 1, x + shot.width + 1, y + bar + shot.height + 1], 12, fill=CARD, outline=(48, 54, 61))
    for k, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([x + 16 + k * 22, y + 11, x + 28 + k * 22, y + 23], fill=col)
    d.text((x + 90, y + 6), 'github.com', font=font(18, False), fill=GREY)
    img.paste(shot, (x, y + bar))
    centered(d, 42, title, font(64), WHITE)
    centered(d, 122, sub, font(34, False), GREEN)
    return img


def title_card(t, dur):
    """Kitty walks in from the left, then waves next to the name."""
    img = BASE.copy()
    d = ImageDraw.Draw(img)
    size, k = 288, int(t * 10)
    stop = W / 2 - size / 2
    walk = min(1.0, t / 1.6)
    cx = -size + (stop + size) * walk
    c = cat('walk', k, size) if walk < 1 else cat('wave', int(t * 6), size)
    img.paste(c, (int(cx), 250), c)
    if t > 1.4:
        a = min(1.0, (t - 1.4) / 0.5)
        f = tuple(int(BG[i] + (WHITE[i] - BG[i]) * a) for i in range(3))
        g = tuple(int(BG[i] + (GREEN[i] - BG[i]) * a) for i in range(3))
        centered(d, 580, 'Meet Kitty', font(110), f)
        centered(d, 725, 'A pixel cat that guides you around GitHub', font(46, False), g)
    return img


def end_card(t, dur):
    img = BASE.copy()
    d = ImageDraw.Draw(img)
    c = cat('idle', int(t * 6), 220)
    img.paste(c, (W // 2 - 110, 130), c)
    centered(d, 380, 'GitKitty', font(120), WHITE)
    centered(d, 530, 'Free & open source Chrome extension', font(44, False), GREEN)
    link = 'github.com/Krish6115/GitKitty'
    f = font(52)
    w = d.textlength(link, font=f)
    d.rounded_rectangle([(W - w) / 2 - 40, 650, (W + w) / 2 + 40, 750], 50, fill=(35, 134, 54))
    centered(d, 664, link, f, WHITE)
    centered(d, 820, 'Repo tours  ·  Git tutor  ·  Good first issues  ·  PR check', font(34, False), GREY)
    centered(d, 900, 'Powered by BharatCode', font(28, False), GREY)
    return img


def scene_clips():
    """[(image, seconds)] per scene: identical frames merged, then fitted to the scene's length."""
    frames = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
    out = []
    for prefix, title, sub, secs in SCENES:
        mine = [f for f in frames if f['label'].startswith(prefix)]
        shots = []
        for i, fr in enumerate(mine):
            nxt = mine[i + 1]['t'] if i + 1 < len(mine) else fr['t'] + 2500
            ms = max(150, min(1800, nxt - fr['t']))
            try:
                im = scene_frame(fr['n'], title, sub)
            except FileNotFoundError:
                continue
            if shots and ImageChops.difference(im, shots[-1][0]).getbbox() is None:
                shots[-1][1] += ms
                continue
            shots.append([im, ms])
        shots[-1][1] += 1500  # let the final state sink in
        total = sum(ms for _, ms in shots)
        out.append([(im, max(0.12, ms / total * secs)) for im, ms in shots])
        print(f'{title}: {len(shots)} shots -> {secs}s')
    return out


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    count = 0
    prev = None

    def emit(img):
        nonlocal count, prev
        ff.stdin.write(img.tobytes())
        count += 1
        prev = img

    def fade_from(img, frames=10):
        if prev is None:
            return
        for i in range(1, frames + 1):
            emit(Image.blend(prev, img, i / (frames + 1)))

    def card(fn, dur):
        first = True
        for i in range(int(dur * FPS)):
            im = fn(i / FPS, dur)
            if first:
                fade_from(im)
                first = False
            emit(im)

    card(title_card, 3.6)
    for clip in scene_clips():
        fade_from(clip[0][0])
        carry = 0.0
        for im, secs in clip:
            carry += secs * FPS
            while carry >= 1:
                emit(im)
                carry -= 1
    card(end_card, 4.5)
    ff.stdin.close()
    ff.wait()
    print(f'{count / FPS:.1f}s, {os.path.getsize(OUT) / 1e6:.1f} MB -> {os.path.normpath(OUT)}')
    gif = OUT[:-4] + '.gif'
    pal = 'fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle'
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-i', OUT, '-vf', pal, gif], check=True)
    print(f'{os.path.getsize(gif) / 1e6:.1f} MB -> {os.path.normpath(gif)}')


if __name__ == '__main__':
    sys.exit(main())
