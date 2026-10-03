#!/usr/bin/env python3
"""Kamal Jewellers logo — lotus + KJ + hairline ring, flat colour, no disc, no dust.
The lotus is measured from the original printed logo, so it is still the same mark.
Run:  python3 build-logo.py <outdir>     (writes the SVGs; PNGs are rendered from them)
"""
import sys, os

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


PETALS = [OUTER_L, mirror(OUTER_L), INNER_L, mirror(INNER_L), CENTER]
SHAPES = PETALS + [WING_L, mirror(WING_L), POD]

# KJ — upright monoline script-free letters, drawn to share the lotus's weight
def kj(style):
    if style == 'geo':
        return [('M428,664 V814', 0), ('M428,744 L508,664', 0), ('M452,722 L516,814', 0),
                ('M556,664 H626', 0), ('M592,664 V774 C592,808 568,822 540,812', 0)]
    # 'script' — the original's brush KJ, lightened
    return [('M468,668 C452,710 430,762 410,816', 0), ('M522,668 C504,704 484,728 458,752', 0),
            ('M466,752 C486,764 500,786 514,806 C518,812 526,812 534,804', 0), ('M364,724 C372,698 398,676 438,670', 0),
            ('M556,710 C580,696 606,686 634,682', 0), ('M620,688 C622,734 618,774 598,798 C584,814 562,812 552,790', 0)]

def mark(color, style='geo', heavy=1.0, ring=True, scale=1.14, disc=None):
    gap = 10 * heavy
    m = ['<mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="#000"/>']
    for d in SHAPES:
        m.append(f'<path d="{d}" fill="#fff" stroke="#000" stroke-width="{gap}" stroke-linejoin="round"/>')
    m.append('</mask>')
    lot = f'<g mask="url(#cut)" fill="{color}"><rect x="240" y="190" width="520" height="460"/></g>'
    sw = 15 * heavy
    ks = ''.join(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="butt" stroke-linejoin="miter"/>' for d, _ in kj(style)) if style == 'geo' else \
         ''.join(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw+3}" stroke-linecap="round" stroke-linejoin="round"/>' for d, _ in kj(style))
    body = f'<g transform="translate(500 500) scale({scale}) translate(-500 -515)">{lot}<g transform="translate(0 22)">{ks}</g></g>'
    rg = f'<circle cx="500" cy="500" r="472" fill="none" stroke="{color}" stroke-width="{6*heavy*1.0}"/>' if ring else ''
    bg = f'<circle cx="500" cy="500" r="496" fill="{disc}"/>' if disc else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-label="Kamal Jewellers"><defs>{"".join(m)}</defs>{bg}{rg}{body}</svg>'

GOLD, CREAM, INK, DARK = '#C9A24B', '#EFE9DC', '#171412', '#171412'
FILES = {   # name -> (colour, heavy, disc)
    'kamal-logo': (GOLD, 1.5, None), 'kamal-logo-cream': (CREAM, 1.5, None), 'kamal-logo-black': (INK, 1.5, None),
    'kamal-logo-badge': (GOLD, 1.5, DARK), 'kamal-logo-small': (GOLD, 2.6, None),
}
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for n, (c, h, d) in FILES.items():
        open(f'{out}/{n}.svg', 'w').write(mark(c, 'geo', heavy=h, disc=d)); print(n)
