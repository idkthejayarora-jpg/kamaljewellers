import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).default;
let saved = false, delivered;
globalThis.fetch = async (url, options) => {
  assert.equal(saved, true);
  assert.equal(url, 'https://example.com/leads');
  assert.equal(options.headers.Authorization, 'Bearer test-token');
  delivered = JSON.parse(options.body);
  return new Response('', { status: 200 });
};
const env = {
  KV: { get: async () => ({ enabled: true, url: 'https://example.com/leads', apiKey: 'test-token' }) },
  DB: { prepare: () => ({ bind: () => ({ run: async () => { saved = true; } }) }) },
};
const emailOnly = await worker.fetch(new Request('https://example.com/api/enquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: 'buyer@example.com', message: 'Bulk enquiry' }),
}), env);
assert.equal(emailOnly.status, 400);
assert.equal(saved, false);
const response = await worker.fetch(new Request('https://example.com/api/enquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '+91 98765-43210', email: 'buyer@example.com', message: 'Bulk enquiry' }),
}), env);
assert.equal(response.status, 200);
assert.equal(delivered.type, 'lead.created');
assert.equal(delivered.lead.email, null);
assert.equal(delivered.lead.message, 'Bulk enquiry');
globalThis.fetch = async () => { throw new Error('offline'); };
assert.equal((await worker.fetch(new Request('https://example.com/api/enquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '1234567890', message: 'Bulk enquiry' }),
}), env)).status, 200);

// A failed delivery waits and goes again with the same ID; a refusal that can't change doesn't.
const kv = new Map();
const queueEnv = {
  KV: {
    get: async (k, type) => (k === 'notify_config' ? { enabled: true, url: 'https://example.com/leads', apiKey: 'test-token' } : (kv.has(k) ? (type === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null)),
    put: async (k, v) => { kv.set(k, v); },
    delete: async (k) => { kv.delete(k); },
    list: async ({ prefix }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }),
  },
  DB: env.DB,
};
const ctx = { waitUntil() {} };
const enquire = () => worker.fetch(new Request('https://example.com/api/enquiries', { method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '1234567890', message: 'Bulk enquiry' }) }), queueEnv);
let answer = () => { throw new Error('offline'); };
const sent = [];
globalThis.fetch = async (url, options) => { sent.push(JSON.parse(options.body).lead?.id); return answer(); };
assert.equal((await enquire()).status, 200, 'the visitor never sees a failed delivery');
assert.equal(kv.size, 1, 'an offline Karamkaro: the lead waits');
const waitingId = sent[0];
await worker.scheduled({}, queueEnv, { waitUntil: (p) => p });
await new Promise(r => setTimeout(r, 0));
assert.equal(kv.size, 1, 'still offline: it keeps waiting');
answer = () => new Response('', { status: 503 });
await worker.scheduled({}, queueEnv, ctx); await new Promise(r => setTimeout(r, 0));
assert.equal(kv.size, 1, 'a server error keeps it too');
answer = () => new Response('', { status: 201 });
sent.length = 0;
await worker.scheduled({}, queueEnv, { waitUntil: async (p) => p }); await new Promise(r => setTimeout(r, 10));
assert.equal(kv.size, 0, 'delivered: it stops waiting');
assert.equal(sent[0], waitingId, 'with the same lead ID, so no second card');
answer = () => new Response('', { status: 400 });
await enquire();
assert.equal(kv.size, 0, 'a refusal that cannot change does not wait');
const off = { ...queueEnv, KV: { ...queueEnv.KV, get: async () => ({ enabled: false }) } };
await worker.fetch(new Request('https://example.com/api/enquiries', { method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '1234567890', message: 'x' }) }), off);
assert.equal(kv.size, 0, 'alerts switched off: nothing queues');
console.log('Karamkaro delivery and lead preservation checks passed');
