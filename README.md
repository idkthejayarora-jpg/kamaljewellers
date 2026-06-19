# Kamal Jewellers — Immersive Site + Admin

An immersive, water-wave single-page site for Kamal Jewellers (Sadar Bazar, Delhi),
with a self-serve admin panel for editing text, managing photos, and reading enquiries.

- **Public site:** `index.html` — Lenis liquid scroll, WebGL molten-gold hero, SVG ripple
  transitions, 10 collections, glassmorphism reviews, floating "Enquire" widget.
- **Admin panel:** `admin.html` — password login, content editor, photo upload with
  cropping, enquiry inbox.
- **Backend:** Supabase (free) — content + enquiries (Postgres) and photos (Storage),
  secured with Row-Level Security.
- **Hosting:** GitHub Pages (static, free).

## Quick start
See **[SETUP.md](SETUP.md)** for the full 15-minute, one-time setup.

Until you add Supabase keys to `config.js`, the site runs in **demo mode**:
default content shows and the enquiry form just pretends to send. Everything is
previewable that way.

```bash
python3 -m http.server 4321   # then open http://localhost:4321
```
