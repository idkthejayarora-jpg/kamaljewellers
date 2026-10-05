# Deploying

Two separate things live in this repo, and they deploy in **completely
different ways**. Most confusion comes from expecting one to carry the other.

| What | Where it runs | How it updates |
|---|---|---|
| `index.html`, `catalogue/`, `studio.html`, `site.css`, `track.js` | GitHub Pages | **Automatic** on `git push` |
| `worker.js` | Cloudflare Worker | **Manual** — Pages does not serve it |

So pushing to GitHub updates the website but **never** the Worker. Anything
that talks to `/api/*` stays broken until the Worker is deployed by hand.

---

## Updating the website

```bash
python3 stamp-css-version.py     # needed when site.css, motion.js or content-defaults.js changed
git add -A && git commit -m "..." && git push
```

Live within a minute or two.

`stamp-css-version.py` matters more than it looks. (It versions `motion.js` and
`content-defaults.js` the same way — they sit behind the same edge cache.) `site.css` is served with
a 4-hour cache while the HTML is only cached 10 minutes, so without a fresh
`?v=` stamp visitors get new markup pinned to an old stylesheet. The script
also stamps the build time into Studio's top bar.

**If a change seems missing:** read the build stamp in Studio's top bar. If it
is older than your latest deploy you are looking at a cached or long-open
tab — reload it. That is far and away the most common cause.

---

## Updating the Worker (manual)

Needed after any edit to `worker.js`.

1. Cloudflare dashboard → **Workers & Pages** → your worker
2. **Edit code**
3. Select all, paste the full contents of `worker.js`, **Deploy**

Sanity check — this returns `401` on the old Worker and `200` on the new one,
because `/api/track` is public only in the current code:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://kamaljewellers.shop/api/track \
  -H 'Content-Type: application/json' -d '{"type":"view"}'
```

### Database tables

Run once, before or just after the first deploy of the current Worker.
Cloudflare dashboard → **Storage & Databases → D1** → your database →
**Console** → paste the contents of `schema.sql` → run.

It creates:

- `site_content` — Studio's saved content. Lives in D1 rather than KV because
  KV is eventually consistent with a 60-second minimum read cache, which made
  saves take up to a minute to appear. Reads fall back to KV if the table is
  missing, so deploying before running this is safe.
- `events` — analytics behind Studio → Stats.

---

## What breaks without a Worker deploy

- **Stats** — 404
- **WhatsApp lead alerts** — never fire
- **Visit tracking** — silently discarded
- **Saves** — fall back to KV, so up to ~60s before the site reflects them

Leads and content saving keep working throughout; they existed in the
previous Worker.

---

## Note

`SETUP.md` describes a Supabase backend that is no longer used. The live
stack is Cloudflare Workers + D1 + KV + R2, all on free tiers.

---

## The site (rebuilt Oct 2026)

Quiet-luxury rebuild: ivory ground, ink type (Instrument Serif + Hanken
Grotesk), hairlines, one antique-brass accent, no dark/light toggle.

| Page | Files |
|---|---|
| Homepage `/` | `index.html`, `home.css`, `home.js` |
| Catalogue `/catalogue` (Instagram bio link) | `catalogue/index.html` + `home.css` |
| Sale product page | `product.html` + `home.css` |
| Studio / Admin | `studio.html`, `admin.html` (still use `site.css`) |

All of them read the same Studio content (`/api/content`). `home.css` is the
shared design system.

**Rollback:** the previous homepage is kept as `index-old.html` (noindex, still
works). To go back, swap the two filenames and push. `site.css`, `theme.js`,
`tile-style.js` and `motion.js`'s `apply()` exist only for that rollback and for
Studio's preview — delete them together with `index-old.html` once you're sure.
