import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const clip = '0123456789';
const meta = { size: clip.length, writeHttpMetadata: h => h.set('Content-Type', 'video/mp4') };
const PHOTOS = {
  head: async () => meta,
  get: async (_, { range } = {}) => ({
    ...meta,
    body: range ? clip.slice(range.offset, range.offset + range.length) : clip,
  }),
};
const request = (range, method) => worker.fetch(new Request('https://example.com/photos/videos/clip.mp4', {
  method, headers: range ? { Range: range } : {},
}), { PHOTOS });

const part = await request('bytes=0-1');
assert.equal(part.status, 206);
assert.equal(part.headers.get('Content-Range'), 'bytes 0-1/10');
assert.equal(part.headers.get('Content-Length'), '2');
assert.equal(await part.text(), '01');
assert.equal(await (await request('bytes=-3')).text(), '789');
assert.equal((await request('bytes=10-')).status, 416);
assert.equal(await (await request()).text(), clip);
const head = await request(null, 'HEAD');
assert.equal(head.headers.get('Content-Length'), '10');
assert.equal(await head.text(), '');
