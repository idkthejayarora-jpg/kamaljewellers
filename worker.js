// Kamal Jewellers API Worker
// Bindings: KV (kv_namespace), DB (d1), PHOTOS (r2 — optional, added when R2 enabled)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
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
async function handleGetContent(env) {
  const data = await env.KV.get('site_content', 'json');
  return json({ data: data || null });
}

async function handleSaveContent(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  await env.KV.put('site_content', JSON.stringify(body.data));
  return json({ ok: true });
}

// ── Enquiries ─────────────────────────────────────────────────────────────────
async function handleSubmitEnquiry(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid JSON'); }
  const { name, phone, email, interest, message } = body;
  if (!name || !phone || !message) return fail('Name, phone and message are required');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO enquiries (id,created_at,name,phone,email,interest,message) VALUES (?,?,?,?,?,?,?)'
  ).bind(id, now, name, phone, email || null, interest || null, message).run();
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
  async fetch(request, env) {
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
      if (path === '/api/enquiries' && method === 'POST') return handleSubmitEnquiry(request, env);

      // Protected endpoints
      if (!await isAuthed(request, env)) return fail('Unauthorized', 401);

      if (path === '/api/content'  && method === 'POST') return handleSaveContent(request, env);
      if (path === '/api/password' && method === 'POST') return handleChangePassword(request, env);
      if (path === '/api/enquiries' && method === 'GET')  return handleListEnquiries(env);
      if (path === '/api/photos'   && method === 'POST')  return handleUploadPhoto(request, env);

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
