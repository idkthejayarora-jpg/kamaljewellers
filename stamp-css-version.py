#!/usr/bin/env python3
"""
Stamp site.css's content hash onto every <link> that loads it (and the same for
motion.js and content-defaults.js on their <script> tags).

Why this exists
---------------
The live site serves HTML with `Cache-Control: max-age=600` (and Cloudflare
leaves it DYNAMIC), but site.css comes back with `max-age=14400` and
`cf-cache-status: HIT` — four hours, cached at the edge AND in the browser.

So after a deploy visitors get the NEW html paired with the OLD stylesheet,
and the site looks unchanged or subtly broken for hours. Bumping a version
in the URL sidesteps it: the HTML is fresh within minutes, and a changed
`?v=` makes both Cloudflare and the browser treat the CSS as a new file.

Usage: run it after changing site.css, before committing.
    python3 stamp-css-version.py
"""
import hashlib
import pathlib
import re
import sys

root = pathlib.Path(__file__).parent
# site.css was the original problem; motion.js and content-defaults.js have the
# same 4-hour edge cache and are just as capable of pairing new HTML with old code.
ASSETS = [("site.css", "href"), ("motion.js", "src"), ("content-defaults.js", "src")]
PAGES = [root / "index.html", root / "studio.html",
         root / "product.html", root / "catalogue" / "index.html"]

for name, _ in ASSETS:
    if not (root / name).exists():
        sys.exit(f"{name} not found next to this script")

for name, attr in ASSETS:
    digest = hashlib.sha256((root / name).read_bytes()).hexdigest()[:10]
    # Matches href="site.css", "../site.css", and any existing ?v=... stamp
    pattern = re.compile(rf'({attr}=")((?:\.\./)?{re.escape(name)})(?:\?v=[^"]*)?(")')
    changed = []
    for page in PAGES:
        if not page.exists():
            continue
        text = page.read_text()
        stamped, n = pattern.subn(rf'\1\2?v={digest}\3', text)
        if n and stamped != text:
            page.write_text(stamped)
            changed.append(f"{page.relative_to(root)} ({n} ref{'s' if n > 1 else ''})")
    print(f"{name} hash: {digest}")
    print("  updated: " + (", ".join(changed) if changed else "nothing (already current)"))

# Stamp a visible build marker into Studio's top bar.
#
# Cached pages have repeatedly looked like "the deploy didn't work". A stamp
# you can read off the screen settles it in seconds: if the number on screen
# is older than the newest build, it's a stale page, not a failed deploy.
import datetime
studio = root / "studio.html"
if studio.exists():
    build = datetime.datetime.now().strftime("%d %b %H:%M")
    text = studio.read_text()
    stamped, n = re.subn(
        r'(<span class="build" id="buildStamp"[^>]*>)[^<]*(</span>)',
        rf'\g<1>build {build}\g<2>',
        text,
    )
    if n:
        studio.write_text(stamped)
        print(f"build stamp: {build}")
    else:
        print("build stamp: marker not found in studio.html — skipped")
