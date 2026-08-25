// Kamal Jewellers API Worker
// Bindings: KV (kv_namespace), DB (d1), PHOTOS (r2 — optional, added when R2 enabled)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// no-store matters: without an explicit Cache-Control, browsers fall back to
// heuristic caching and can serve a stale /api/content for ages — which looks
// exactly like "Studio saves aren't showing up on the site".
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });

const fail = (msg, status = 400) => json({ error: msg }, status);

// ── Crypto ───────────────────────────────────────────────────────────────────
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// base64url helpers — no +/=/ chars so tokens are always safe in HTTP headers
function b64url(u8) {
  return btoa(String.fromCharCode(...u8))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function b64dec(s) {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(t + '='.repeat((4 - t.length % 4) % 4));
}

async function hmacSign(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return b64url(new Uint8Array(sig));
}

async function makeToken(secret) {
  const enc = s => b64url(new TextEncoder().encode(s));
  const h = enc(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = enc(JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  return `${h}.${p}.${await hmacSign(secret, `${h}.${p}`)}`;
}

async function verifyToken(token, secret) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [h, p, sig] = parts;
  if (sig !== await hmacSign(secret, `${h}.${p}`)) return false;
  try {
    const payload = JSON.parse(b64dec(p));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

async function isAuthed(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/, '');
  const secret = await env.KV.get('jwt_secret');
  return verifyToken(token, secret);
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function handleAuth(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { password } = body;
  if (!password) return fail('Password required');
  const [stored, salt] = await Promise.all([
    env.KV.get('password_hash'),
    env.KV.get('password_salt'),
  ]);
  if (!stored || !salt) return fail('Admin not configured', 500);
  const hash = await sha256(password + salt);
  if (hash !== stored) return fail('Invalid password', 401);
  const secret = await env.KV.get('jwt_secret');
  return json({ token: await makeToken(secret) });
}

async function handleChangePassword(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { newPassword } = body;
  if (!newPassword || newPassword.length < 6) return fail('Password must be at least 6 characters');
  const salt = await env.KV.get('password_salt');
  const hash = await sha256(newPassword + salt);
  await env.KV.put('password_hash', hash);
  return json({ ok: true });
}

// ── Content ───────────────────────────────────────────────────────────────────
// Stored in D1, not KV. KV is eventually consistent and its reads carry a
// 60-second minimum edge cache, so a Studio save could take up to a minute to
// appear on the site. D1 is strongly consistent — the next request sees it.
// KV is still written as a backup, and still read as a fallback, so this
// survives the table not existing yet and can be rolled back safely.
async function handleGetContent(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT json FROM site_content WHERE id='main'`
    ).first();
    if (row && row.json) return json({ data: JSON.parse(row.json) });
  } catch (e) {
    console.error('content read from D1 failed, falling back to KV', e);
  }
  const data = await env.KV.get('site_content', 'json');
  return json({ data: data || null });
}

async function handleSaveContent(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const payload = JSON.stringify(body.data);

  let savedToD1 = false;
  try {
    await env.DB.prepare(
      `INSERT INTO site_content (id,json,updated_at) VALUES ('main',?,?)
       ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`
    ).bind(payload, new Date().toISOString()).run();
    savedToD1 = true;
  } catch (e) {
    console.error('content write to D1 failed', e);
  }

  // Backup copy. If D1 failed outright this is the only copy, so surface that.
  try {
    await env.KV.put('site_content', payload);
  } catch (e) {
    if (!savedToD1) return fail('Could not save: ' + e.message, 500);
  }

  return json({ ok: true, store: savedToD1 ? 'd1' : 'kv' });
}

// ── Lead notifications (WhatsApp via CallMeBot) ───────────────────────────────
// Kept in its own KV key, NOT in site_content — that blob is served publicly
// from GET /api/content, so an API key stored there would be world-readable.
async function handleGetNotify(env) {
  const cfg = await env.KV.get('notify_config', 'json');
  return json({ data: cfg || { enabled: false, phone: '', apiKey: '' } });
}

async function handleSaveNotify(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { enabled, phone, apiKey } = body.data || {};
  await env.KV.put('notify_config', JSON.stringify({
    enabled: !!enabled,
    phone: String(phone || '').trim(),
    apiKey: String(apiKey || '').trim(),
  }));
  return json({ ok: true });
}

// Fire-and-forget WhatsApp ping. Never throws — a notification problem must
// never cost us the lead itself, which is already safely in the database.
async function sendWhatsApp(env, text) {
  try {
    const cfg = await env.KV.get('notify_config', 'json');
    if (!cfg || !cfg.enabled) return { ok: false, reason: 'disabled' };
    const digits = String(cfg.phone || '').replace(/[^\d]/g, '');
    if (!digits || !cfg.apiKey) return { ok: false, reason: 'not configured' };
    const url = 'https://api.callmebot.com/whatsapp.php'
      + '?phone=' + encodeURIComponent(digits)
      + '&apikey=' + encodeURIComponent(cfg.apiKey)
      + '&text=' + encodeURIComponent(text);
    const res = await fetch(url, { method: 'GET' });
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    return { ok: res.ok, status: res.status, detail };
  } catch (err) {
    console.error('whatsapp notify failed', err);
    return { ok: false, reason: err.message };
  }
}

async function handleTestNotify(env) {
  const r = await sendWhatsApp(env, 'Kamal Jewellers — test alert. Lead notifications are working.');
  if (r.ok) return json({ ok: true });
  return fail('Could not send: ' + (r.reason || r.detail || ('HTTP ' + r.status)), 400);
}

// ── Analytics ─────────────────────────────────────────────────────────────────
// Location comes from request.cf, which Cloudflare fills in on every request at
// no cost — so there's no permission prompt, no lat/long, and no gap in the
// data from people who decline. City-level is all this needs to answer
// "where are my customers?".
async function handleTrack(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: true }); } // never argue with a beacon
  const { type, label, path, session, device } = body || {};
  if (type !== 'view' && type !== 'tap') return json({ ok: true });

  const cf = request.cf || {};
  const row = env.DB.prepare(
    `INSERT INTO events (id,created_at,type,label,path,session,city,region,country,device)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    crypto.randomUUID(),
    new Date().toISOString(),
    type,
    String(label || '').slice(0, 120) || null,
    String(path || '').slice(0, 120) || null,
    String(session || '').slice(0, 40) || null,
    cf.city || null,
    cf.region || null,
    cf.country || null,
    device === 'mobile' ? 'mobile' : 'desktop'
  ).run();

  // Don't make the visitor's browser wait on our bookkeeping
  if (ctx && ctx.waitUntil) ctx.waitUntil(row.catch(e => console.error('track', e)));
  else await row.catch(e => console.error('track', e));

  return json({ ok: true });
}

async function handleStats(request, env) {
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)));
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const q = (sql, ...binds) => env.DB.prepare(sql).bind(...binds).all();

  const [totals, daily, taps, collections, cities, devices] = await Promise.all([
    q(`SELECT COUNT(*) AS views, COUNT(DISTINCT session) AS visitors
        FROM events WHERE type='view' AND created_at >= ?`, since),
    q(`SELECT substr(created_at,1,10) AS day,
              COUNT(*) AS views,
              COUNT(DISTINCT session) AS visitors
        FROM events WHERE type='view' AND created_at >= ?
        GROUP BY day ORDER BY day`, since),
    q(`SELECT label, COUNT(*) AS n FROM events
        WHERE type='tap' AND label IS NOT NULL AND created_at >= ?
        GROUP BY label ORDER BY n DESC LIMIT 12`, since),
    q(`SELECT label, COUNT(*) AS n FROM events
        WHERE type='tap' AND label LIKE 'collection:%' AND created_at >= ?
        GROUP BY label ORDER BY n DESC LIMIT 12`, since),
    q(`SELECT COALESCE(city,'Unknown') AS city, COALESCE(region,'') AS region,
              COUNT(DISTINCT session) AS n
        FROM events WHERE created_at >= ?
        GROUP BY city, region ORDER BY n DESC LIMIT 12`, since),
    q(`SELECT COALESCE(device,'desktop') AS device, COUNT(DISTINCT session) AS n
        FROM events WHERE created_at >= ? GROUP BY device`, since),
  ]);

  return json({
    days,
    totals: totals.results[0] || { views: 0, visitors: 0 },
    daily: daily.results,
    taps: taps.results,
    collections: collections.results,
    cities: cities.results,
    devices: devices.results,
  });
}

// ── Enquiries ─────────────────────────────────────────────────────────────────
async function handleSubmitEnquiry(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { name, phone, email, interest, message } = body;
  if (!name || !phone || !message) return fail('Name, phone and message are required');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO enquiries (id,created_at,name,phone,email,interest,message) VALUES (?,?,?,?,?,?,?)'
  ).bind(id, now, name, phone, email || null, interest || null, message).run();

  // Alert after the row is safely stored, and outside the response path so the
  // visitor's form never waits on (or fails because of) the notification.
  const text = 'New lead — Kamal Jewellers\n'
    + 'Name: ' + name + '\n'
    + 'Contact: ' + phone + '\n'
    + (interest ? 'Looking for: ' + interest + '\n' : '')
    + 'Open Studio → Leads to reply.';
  if (ctx && ctx.waitUntil) ctx.waitUntil(sendWhatsApp(env, text));
  else await sendWhatsApp(env, text);

  return json({ ok: true, id });
}

async function handleListEnquiries(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM enquiries ORDER BY created_at DESC'
  ).all();
  return json({ data: results });
}

async function handleUpdateEnquiry(id, request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { status } = body;
  await env.DB.prepare('UPDATE enquiries SET status=? WHERE id=?').bind(status, id).run();
  return json({ ok: true });
}

async function handleDeleteEnquiry(id, env) {
  await env.DB.prepare('DELETE FROM enquiries WHERE id=?').bind(id).run();
  return json({ ok: true });
}

// ── Photos (R2) ───────────────────────────────────────────────────────────────
async function handleUploadPhoto(request, env) {
  if (!env.PHOTOS) return fail('Photo storage not yet enabled — enable R2 in Cloudflare dashboard', 503);
  let form;
  try { form = await request.formData(); } catch { return fail('Invalid form data'); }
  const file = form.get('file');
  const collection = (form.get('collection') || 'general').replace(/[^a-z0-9-]/gi, '');
  if (!file) return fail('No file provided');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `${collection}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });
  return json({ ok: true, key, url: `/photos/${key}` });
}

async function handleDeletePhoto(key, env) {
  if (!env.PHOTOS) return fail('Photo storage not yet enabled', 503);
  await env.PHOTOS.delete(decodeURIComponent(key));
  return json({ ok: true });
}

async function handleServePhoto(key, env) {
  if (!env.PHOTOS) return new Response('Photo storage not yet enabled', { status: 503 });
  const obj = await env.PHOTOS.get(decodeURIComponent(key));
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(obj.body, { headers });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    // Photo serving (public, bypasses auth)
    if (path.startsWith('/photos/')) {
      return handleServePhoto(path.slice('/photos/'.length), env);
    }

    try {
      // Public endpoints
      if (path === '/api/auth'    && method === 'POST') return handleAuth(request, env);
      if (path === '/api/content' && method === 'GET')  return handleGetContent(env);
      if (path === '/api/enquiries' && method === 'POST') return handleSubmitEnquiry(request, env, ctx);
      if (path === '/api/track'     && method === 'POST') return handleTrack(request, env, ctx);

      // Protected endpoints
      if (!await isAuthed(request, env)) return fail('Unauthorized', 401);

      if (path === '/api/content'  && method === 'POST') return handleSaveContent(request, env);
      if (path === '/api/password' && method === 'POST') return handleChangePassword(request, env);
      if (path === '/api/enquiries' && method === 'GET')  return handleListEnquiries(env);
      if (path === '/api/photos'   && method === 'POST')  return handleUploadPhoto(request, env);
      if (path === '/api/notify'   && method === 'GET')   return handleGetNotify(env);
      if (path === '/api/notify'   && method === 'POST')  return handleSaveNotify(request, env);
      if (path === '/api/notify/test' && method === 'POST') return handleTestNotify(env);
      if (path === '/api/stats'    && method === 'GET')   return handleStats(request, env);

      const enqMatch   = path.match(/^\/api\/enquiries\/(.+)$/);
      const photoMatch = path.match(/^\/api\/photos\/(.+)$/);

      if (enqMatch && method === 'PATCH')  return handleUpdateEnquiry(enqMatch[1], request, env);
      if (enqMatch && method === 'DELETE') return handleDeleteEnquiry(enqMatch[1], env);
      if (photoMatch && method === 'DELETE') return handleDeletePhoto(photoMatch[1], env);

      return fail('Not found', 404);
    } catch (err) {
      console.error(err);
      return fail('Internal error: ' + err.message, 500);
    }
  },
};
