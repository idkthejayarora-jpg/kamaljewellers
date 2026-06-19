# Kamal Jewellers — Website + Admin Setup

Your site is **static** (hosted free on GitHub Pages) and uses **Supabase** (free)
as its backend for editable text, photo storage, and the enquiry inbox.

You only need to do this setup **once**. It takes about 15 minutes.

---

## What you have

| File | What it is |
|------|------------|
| `index.html` | The public website |
| `admin.html` | Your private admin panel (edit text, upload photos, read enquiries) |
| `config.js` | Where you paste your Supabase keys (3 lines) |
| `content-defaults.js` | The starting text/structure (shared by site + admin) |
| `supabase-schema.sql` | Database + security setup — you paste this into Supabase once |

---

## Step 1 — Create a free Supabase project
1. Go to **https://supabase.com** → sign up (free) → **New project**.
2. Give it a name (e.g. `kamal-jewellers`), set a database password (save it somewhere), pick the region closest to Delhi, click **Create**.
3. Wait ~2 minutes for it to finish provisioning.

## Step 2 — Set up the database & storage
1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase-schema.sql` from this folder, copy **everything**, paste it in, click **Run**.
3. You should see "Success". This creates the content table, the enquiries table, the photo storage bucket, and all the security rules.

## Step 3 — Get your keys
1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **`anon` `public`** key.
   > These two are *safe to be public* — that's by design. **Never** copy the `service_role` key into the website.

## Step 4 — Put the keys in `config.js`
Open `config.js` and fill in the first two lines:
```js
window.KAMAL_CONFIG = {
  SUPABASE_URL:      "https://xxxxxxxx.supabase.co",   // your Project URL
  SUPABASE_ANON_KEY: "eyJhbGciOi...",                  // your anon public key
  ADMIN_EMAIL:       "admin@kamaljewellers.in"         // (set the matching user in Step 5)
};
```

## Step 5 — Create your one admin login
1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
2. Email: use the **same** email you put in `ADMIN_EMAIL` above (e.g. `admin@kamaljewellers.in` — it doesn't have to be a real inbox).
3. Password: choose the password you'll type to log in.
4. **Tick "Auto Confirm User"** so it works immediately, then create.

That's it — you log in at `admin.html` with just that password.
To change the password later: Authentication → Users → (your user) → reset password.

## Step 6 — Test it locally (optional but recommended)
From this folder, run:
```bash
python3 -m http.server 4321
```
Then open **http://localhost:4321** (the site) and **http://localhost:4321/admin.html** (the admin).
Log in, change some text, click **Save changes**, refresh the site to see it update. Submit a test enquiry on the site and watch it appear in the admin **Enquiries** tab.

---

## Step 7 — Put it live on GitHub Pages
1. Create a new repository on GitHub (e.g. **`kamal-jewellers-web`**), public.
2. From this folder:
   ```bash
   git add -A
   git commit -m "Kamal Jewellers site + admin"
   git remote add origin https://github.com/<your-username>/kamal-jewellers-web.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root → Save.**
4. After a minute your site is live at:
   - Site: `https://<your-username>.github.io/kamal-jewellers-web/`
   - Admin: `https://<your-username>.github.io/kamal-jewellers-web/admin.html`

> Whenever you edit content/photos in the admin, it saves to Supabase instantly —
> you do **not** need to re-deploy GitHub Pages. You only push to GitHub if you
> change the actual code/design.

---

## Using the admin
- **Content tab** — edit every piece of text (hero, philosophy line, all 10 collection names & descriptions, reviews, contact details, footer). Click **Save changes**.
- **Photos tab** — per collection, click **Add photo**, choose a file, position & crop it (the shaded box is exactly what shows on the site), then **Upload**. First photo = the collection's cover. Use ‹ › to reorder, ✕ to delete. Photo changes save automatically.
- **Enquiries tab** — every enquiry from the site's "Enquire" button lands here with the person's name, phone (tap-to-call / WhatsApp), email, what they're interested in, and their message. Mark read or delete.

---

## Security, in plain words
- The site uses the **public** Supabase key — anyone can *read* your published content and *submit* an enquiry. That's intended.
- Only your admin login can **edit content, upload photos, or read enquiries**. This is enforced by Supabase's Row-Level Security (set up by the SQL in Step 2), not just by the password screen — so it can't be bypassed.
- Keep the `service_role` key (in the Supabase dashboard) private. It's never used by this site.
