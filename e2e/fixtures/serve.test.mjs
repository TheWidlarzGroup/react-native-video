import { test, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8199;
const BASE = `http://127.0.0.1:${PORT}`;
let proc;

// Stands in for `xcrun` on the /__open-link route: records its arguments and fails the
// first call, the way `simctl openurl` times out on a slow runner.
const fakeDir = mkdtempSync(join(tmpdir(), 'rnv-open-link-'));
const fakeXcrun = join(fakeDir, 'xcrun');
const fakeCalls = join(fakeDir, 'calls');
writeFileSync(
  fakeXcrun,
  `#!/bin/sh\necho "$@" >> "${fakeCalls}"\n[ "$(wc -l < "${fakeCalls}")" -gt 1 ] || exit 60\n`
);
chmodSync(fakeXcrun, 0o755);

beforeAll(async () => {
  proc = spawn('node', ['e2e/fixtures/serve.mjs', 'e2e/fixtures/media', String(PORT)], {
    stdio: 'ignore',
    env: { ...process.env, E2E_XCRUN: fakeXcrun, E2E_OPEN_LINK_PAUSE_MS: '10', E2E_SIM_UDID: 'SIM-1' },
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

afterAll(() => {
  proc?.kill();
  rmSync(fakeDir, { recursive: true, force: true });
});

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

test('a token cut off with /__go-offline loses the connection; other requests do not', async () => {
  expect((await fetch(`${BASE}/short.mp4?token=t1`)).status).toBe(200);
  expect((await fetch(`${BASE}/__go-offline?token=t1`)).status).toBe(200);
  await expect(fetch(`${BASE}/short.mp4?token=t1`)).rejects.toThrow();
  expect((await fetch(`${BASE}/short.mp4?token=t2`)).status).toBe(200);
  expect((await fetch(`${BASE}/short.mp4`)).status).toBe(200);
  expect((await fetch(`${BASE}/__go-offline`)).status).toBe(400);
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

const openLinkUrl = (link) => `${BASE}/__open-link?url=${encodeURIComponent(link)}`;

const elapsedMs = async (url, init) => {
  const start = performance.now();
  const res = await fetch(url, init);
  await res.arrayBuffer();
  return { res, ms: performance.now() - start };
};

test('?hold keeps a request waiting, then serves the file', async () => {
  const { res, ms } = await elapsedMs(`${BASE}/short.mp4?hold=300`, {
    headers: { Range: 'bytes=0-99' },
  });
  expect(res.status).toBe(206);
  expect(ms).toBeGreaterThanOrEqual(290);
});

test('?hold with holdId holds every request of the id until one moment, then none', async () => {
  const url = `${BASE}/short.mp4?hold=400&holdId=serve-test-1`;
  // Two parallel requests (AVPlayer's range requests) end together, not one hold apart.
  const [a, b] = await Promise.all([elapsedMs(url), elapsedMs(url, { headers: { Range: 'bytes=0-1' } })]);
  expect(a.res.status).toBe(200);
  expect(b.res.status).toBe(206);
  for (const { ms } of [a, b]) {
    expect(ms).toBeGreaterThanOrEqual(390);
    expect(ms).toBeLessThan(700);
  }
  // After that moment the id is not held again.
  expect((await elapsedMs(url)).ms).toBeLessThan(250);
  // Another id waits again.
  expect((await elapsedMs(`${BASE}/short.mp4?hold=300&holdId=serve-test-2`)).ms).toBeGreaterThanOrEqual(290);
});

test('?hold ignores a value that is not a positive number', async () => {
  for (const hold of ['0', '-5', 'abc', '']) {
    const { res, ms } = await elapsedMs(`${BASE}/short.mp4?hold=${hold}`);
    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(250);
  }
});

test('a held request whose client went away is dropped, and the server keeps serving', async () => {
  const controller = new AbortController();
  const pending = fetch(`${BASE}/short.mp4?hold=60000`, { signal: controller.signal });
  await new Promise((r) => setTimeout(r, 50));
  controller.abort();
  await expect(pending).rejects.toThrow();
  expect((await fetch(`${BASE}/short.mp4`, { method: 'HEAD' })).status).toBe(200);
});

test('/__open-link opens a scenario link on the simulator, retrying a failed attempt', async () => {
  const res = await fetch(openLinkUrl('rnvtest://scenario/mp4'), { method: 'POST' });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, attempts: 2 });
  expect(readFileSync(fakeCalls, 'utf8')).toBe(
    'simctl openurl SIM-1 rnvtest://scenario/mp4\nsimctl openurl SIM-1 rnvtest://scenario/mp4\n'
  );
});

test('/__open-link refuses anything but a scenario link', async () => {
  const before = readFileSync(fakeCalls, 'utf8');
  for (const link of ['https://example.com', 'rnvtest://scenario/mp4 --help', '']) {
    expect((await fetch(openLinkUrl(link), { method: 'POST' })).status).toBe(400);
  }
  expect(readFileSync(fakeCalls, 'utf8')).toBe(before);
});

test('/__open-link targets the simulator the flow names, and refuses a non-UDID', async () => {
  const udid = '7D16E67F-1E34-43CB-BD36-B95CCE24981A';
  const res = await fetch(`${openLinkUrl('rnvtest://scenario/hls')}&device=${udid}`, { method: 'POST' });
  expect(res.status).toBe(200);
  expect(readFileSync(fakeCalls, 'utf8').trimEnd().split('\n').at(-1)).toBe(
    `simctl openurl ${udid} rnvtest://scenario/hls`
  );
  const bad = await fetch(`${openLinkUrl('rnvtest://scenario/hls')}&device=booted`, { method: 'POST' });
  expect(bad.status).toBe(400);
});

test('/__open-link is POST only', async () => {
  expect((await fetch(openLinkUrl('rnvtest://scenario/mp4'))).status).toBe(405);
});
