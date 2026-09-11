import { test, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'node:child_process';

const PORT = 8199;
const BASE = `http://127.0.0.1:${PORT}`;
let proc;

beforeAll(async () => {
  proc = spawn('node', ['e2e/fixtures/serve.mjs', 'e2e/fixtures/media', String(PORT)], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`${BASE}/short.mp4`, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('server did not start');
});

afterAll(() => proc?.kill());

test('serves a fixture with the right content type', async () => {
  const res = await fetch(`${BASE}/short.mp4`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('video/mp4');
});

test('serves the HLS manifest from a subdirectory', async () => {
  const res = await fetch(`${BASE}/hls/index.m3u8`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('application/vnd.apple.mpegurl');
});

test('honours Range requests', async () => {
  const res = await fetch(`${BASE}/short.mp4`, { headers: { Range: 'bytes=0-99' } });
  expect(res.status).toBe(206);
  expect(res.headers.get('content-range')).toMatch(/^bytes 0-99\/\d+$/);
  expect((await res.arrayBuffer()).byteLength).toBe(100);
});

test('404s an unknown path', async () => {
  expect((await fetch(`${BASE}/does-not-exist.mp4`)).status).toBe(404);
});

test('refuses to escape the root directory', async () => {
  const res = await fetch(`${BASE}/../../package.json`);
  expect(res.status).toBe(404);
});

test('ignores malformed Range header and serves full file', async () => {
  const res1 = await fetch(`${BASE}/short.mp4`, { headers: { Range: 'bytes=abc-def' } });
  expect(res1.status).toBe(200);

  // Verify server is still alive after malformed request
  const res2 = await fetch(`${BASE}/short.mp4`);
  expect(res2.status).toBe(200);
});

test('returns 416 for start beyond EOF', async () => {
  const res = await fetch(`${BASE}/short.mp4`, { headers: { Range: 'bytes=999999999-9999999999' } });
  expect(res.status).toBe(416);
  expect(res.headers.get('content-range')).toMatch(/^bytes \*\/\d+$/);
});

test('handles suffix ranges correctly (bytes=-N)', async () => {
  const res = await fetch(`${BASE}/short.mp4`, { headers: { Range: 'bytes=-100' } });
  expect(res.status).toBe(206);
  const data = await res.arrayBuffer();
  expect(data.byteLength).toBe(100);
  // The Content-Range header should indicate it's the last 100 bytes
  const contentRange = res.headers.get('content-range');
  expect(contentRange).toMatch(/^bytes \d+-\d+\/\d+$/);
});

test('handles open-ended ranges correctly (bytes=N-)', async () => {
  const res = await fetch(`${BASE}/short.mp4`, { headers: { Range: 'bytes=100-' } });
  expect(res.status).toBe(206);
  const data = await res.arrayBuffer();
  // Should return from byte 100 to EOF
  const contentRange = res.headers.get('content-range');
  expect(contentRange).toMatch(/^bytes 100-\d+\/\d+$/);
  // Verify Content-Length matches actual data
  const contentLength = parseInt(res.headers.get('content-length'), 10);
  expect(data.byteLength).toBe(contentLength);
});
