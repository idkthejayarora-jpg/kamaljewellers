# Kamal Jewellers — logo files

A minimal mark that matches the website: the same lotus as the printed logo (measured from it), a hairline ring and
the KJ, in one flat colour. No black disc, no gold dust. `original-logo.png` is the previous printed artwork, for reference.

| Use | File |
|---|---|
| Dark backgrounds (the website) | `kamal-logo.svg` — gold `#C9A24B` |
| On photos / brown / dark imagery | `kamal-logo-cream.svg` — `#EFE9DC` |
| Light backgrounds, letterhead, **emboss, black ink** | `kamal-logo-black.svg` — `#171412` |
| **Hot-foil / gold stamping** | `kamal-logo.svg` — Pantone-match `#C9A24B` |
| Profile pictures (Instagram, WhatsApp, Google) | `kamal-logo-badge-1024.png` — mark on a dark disc |
| Below ~48 px (favicon, tiny icons) | `kamal-logo-small.svg`, `favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png` |

Print: keep the mark at least ~15 mm across; use the small version below that.
Regenerate or tweak: `python3 build-logo.py <outdir>` (writes the SVGs).
In use on the site: `logo.png` (256 px) and `logo-small.png` (128 px) in the repo root, plus the favicon and touch icon here.
