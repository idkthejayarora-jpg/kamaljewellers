#!/usr/bin/env python3
"""Kamal Jewellers mark — rebuilt as clean vectors.
Same elements as the original badge (black disc, gold lotus with swept base wings
and pod, brush-script KJ, ring of gold dust). No SVG filters: the dust is
deterministic dots, so it prints, embosses and scales the same everywhere.
Run:  python3 build_logo.py <outdir>
"""
import math, random, sys, os

CX = CY = 500
GOLD_STOPS = [(0, '#9A7127'), (.42, '#D4A949'), (.74, '#F2D88A'), (1, '#FBEBB5')]

def grad(id_, x1, y1, x2, y2):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in GOLD_STOPS)
    return f'<linearGradient id="{id_}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'

import re as _re
def mirror(d):
    """mirror an absolute-coordinate path (x,y pairs) about the vertical axis x=500"""
    return _re.sub(r'(-?\d+\.?\d*),(-?\d+\.?\d*)', lambda m: f'{1000-float(m.group(1)):g},{m.group(2)}', d)

# Measured from the original artwork (500px grid, doubled): an upright "tulip" lotus —
# egg-shaped centre petal, scimitar inner petals, cup-like outer petals, wings that
# sweep up at the tips, and an onion-shaped pod.
CENTER = 'M500,214 C474,262 430,332 430,426 C430,480 464,508 500,508 C536,508 570,480 570,426 C570,332 526,262 500,214 Z'
INNER_L = 'M418,226 C438,234 454,246 454,254 C436,304 426,354 428,412 C430,456 452,486 486,502 C440,500 394,478 374,436 C360,396 362,308 382,252 C390,238 404,230 418,226 Z'
OUTER_L = 'M304,250 C324,244 350,246 378,254 C360,300 358,356 372,408 C390,456 432,490 486,506 C410,502 346,474 320,426 C296,386 296,320 304,250 Z'
WING_L = 'M278,508 C330,552 424,556 498,518 C490,562 474,592 440,604 C376,626 310,588 278,508 Z'
POD = 'M500,642 C466,618 424,598 422,562 C422,530 456,514 500,514 C544,514 578,530 578,562 C576,598 534,618 500,642 Z'

def lotus_paths():
    return [(OUTER_L, ''), (mirror(OUTER_L), ''), (INNER_L, ''), (mirror(INNER_L), ''), (CENTER, '')]

def wings_pod():
    return [WING_L, mirror(WING_L), POD]

def monogram():
    """brush-script KJ as monoline strokes (round caps); (d, width) — traced from the original"""
    return [
        ('M468,668 C452,710 430,762 410,816', 31),                              # K stem
        ('M522,668 C504,704 484,728 458,752', 27),                              # K arm
        ('M466,752 C486,764 500,786 514,806 C518,812 526,812 534,804', 27),     # K leg + flick
        ('M364,724 C372,698 398,676 438,670', 23),                              # K swash (top-left curl)
        ('M556,710 C580,696 606,686 634,682', 25),                              # J top bar
        ('M620,688 C622,734 618,774 598,798 C584,814 562,812 552,790', 29),     # J stem + hook
    ]

def dust(seed, n, r_in, r_out, k=2.7, rmin=1.2, rmax=4.4):
    rnd = random.Random(seed)
    layers = {0: [], 1: [], 2: []}
    for _ in range(n):
        a = rnd.random() * math.tau
        u = rnd.random() ** k
        r = r_out - (r_out - r_in) * u
        s = rmin + (rmax - rmin) * (rnd.random() ** 1.6) * (1.0 - .45 * u)
        x, y = CX + r * math.cos(a), CY + r * math.sin(a)
        layers[int(rnd.random() * 3)].append((x, y, s, rnd.random() * math.pi, .45 + .5 * rnd.random()))
    paths = []
    for opac, pts in zip((1, .78, .55), layers.values()):
        d = ''
        for x, y, s, th, e in pts:
            rx, ry = s * 1.5, s * e * 1.5          # short streaks, randomly turned
            dx, dy = 2 * rx * math.cos(th), 2 * rx * math.sin(th)
            d += f'M{x-dx/2:.1f},{y-dy/2:.1f}a{rx:.1f},{ry:.1f} {math.degrees(th):.0f} 1 0 {dx:.1f},{dy:.1f}a{rx:.1f},{ry:.1f} {math.degrees(th):.0f} 1 0 {-dx:.1f},{-dy:.1f}'
        paths.append((d, opac))
    return paths

def art(fill, mask_id='cut', small=False, dust_fill=None):
    """lotus + monogram + dust, painted with `fill`; petal gaps via mask so flat colours work too"""
    petals = lotus_paths(); wp = wings_pod()
    gap = 9
    m = [f'<mask id="{mask_id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="#000"/>']
    for d, t in petals:
        m.append(f'<path d="{d}" transform="{t}" fill="#fff" stroke="#000" stroke-width="{gap}" stroke-linejoin="round"/>')
    for d in wp:
        m.append(f'<path d="{d}" fill="#fff" stroke="#000" stroke-width="{gap}" stroke-linejoin="round"/>')
    m.append('</mask>')
    lot = f'<g mask="url(#{mask_id})" fill="{fill}"><rect x="240" y="190" width="520" height="460"/></g>'
    kj = ''.join(f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>' for d, w in monogram())
    if small:   # favicon / tiny sizes: fewer, bigger specks and a heavier monogram
        layers = dust(7, 420, 356, 456, k=1.6, rmin=3.2, rmax=8.5)
        kj = kj.replace('stroke-width="2', 'stroke-width="3').replace('stroke-width="1', 'stroke-width="2')
    else:       # a dense fine band at the rim (as on the original) plus the feathered spray inward
        layers = dust(7, 2600, 326, 454) + dust(11, 1500, 426, 456, k=1.2, rmin=1.1, rmax=3.0)
    dd = ''.join(f'<path d="{d}" fill="{dust_fill or fill}" opacity="{o}"/>' for d, o in layers)
    return ''.join(m), lot + kj + dd

def dust_grad():
    stops = [(0, '#7C5A1F'), (.5, '#C09A45'), (1, '#E8CF86')]
    return '<linearGradient id="kjd" gradientUnits="userSpaceOnUse" x1="120" y1="800" x2="880" y2="200">' + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>'

def svg(kind, small=False):
    head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-label="Kamal Jewellers">'
    defs_g = grad('kjg', 300, 560, 700, 260) + dust_grad()
    flat = {'gold': '#C9A24B', 'black': '#171512', 'ivory': '#F3EEE4'}
    if kind in flat:
        mask, body = art(flat[kind], small=small)
        return f'{head}<defs>{mask}</defs>{body}</svg>'
    mask, body = art('url(#kjg)', small=small, dust_fill='url(#kjd)')
    disc = '<circle cx="500" cy="500" r="494" fill="#050403"/>' if kind == 'badge' else ''
    return f'{head}<defs>{defs_g}{mask}</defs>{disc}{body}</svg>'

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    names = {'badge': 'kamal-logo', 'transparent': 'kamal-logo-transparent', 'gold': 'kamal-logo-gold', 'black': 'kamal-logo-black', 'ivory': 'kamal-logo-ivory'}
    for k, n in names.items():
        s = svg(k)
        open(os.path.join(out, n + '.svg'), 'w').write(s)
        print(n, len(s) // 1024, 'KB')
    s = svg('badge', small=True)
    open(os.path.join(out, 'kamal-logo-small.svg'), 'w').write(s); print('kamal-logo-small', len(s) // 1024, 'KB')
