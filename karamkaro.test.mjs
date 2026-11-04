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
const response = await worker.fetch(new Request('https://example.com/api/enquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '1234567890', message: 'Bulk enquiry' }),
}), env);
assert.equal(response.status, 200);
assert.equal(delivered.type, 'lead.created');
assert.equal(delivered.lead.message, 'Bulk enquiry');
globalThis.fetch = async () => { throw new Error('offline'); };
assert.equal((await worker.fetch(new Request('https://example.com/api/enquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Buyer', phone: '1234567890', message: 'Bulk enquiry' }),
}), env)).status, 200);
console.log('Karamkaro delivery and lead preservation checks passed');
