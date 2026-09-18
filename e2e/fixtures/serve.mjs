// Static file server for E2E media fixtures. No dependencies on purpose: `npx serve`
// would fetch a package from the network before every CI job, which is a flake source
// unrelated to the library under test.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, extname, resolve } from 'node:path';
import { openLink, scenarioLink, simulatorDevice } from './open-link.mjs';

const [, , rootArg = 'e2e/fixtures/media', portArg = '8090'] = process.argv;
const root = resolve(rootArg);
const port = Number(portArg);

const TYPES = {
  '.mp4': 'video/mp4',
  '.ts': 'video/mp2t',
  '.m3u8': 'application/vnd.apple.mpegurl',
};

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// The one route that is not a file: iOS flows open their deep link through here (see
// open-link.mjs). It runs a process, so it answers loopback only, and only for a scenario
// link. The simulator comes from `&device=<udid>`, else E2E_SIM_UDID, else the booted one.
async function handleOpenLink(req, res) {
  const json = (status, body) =>
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));

  if (!LOOPBACK.has(req.socket.remoteAddress)) return json(403, { ok: false, error: 'loopback only' });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' });
  const link = scenarioLink(req.url);
  if (!link) return json(400, { ok: false, error: 'expected ?url=rnvtest://scenario/<name>' });
  const device = simulatorDevice(req.url);
  if (device === null) return json(400, { ok: false, error: 'device must be a simulator UDID' });

  const result = await openLink({
    link,
    device: device || process.env.E2E_SIM_UDID || 'booted',
    xcrun: process.env.E2E_XCRUN || 'xcrun',
    pauseMs: Number(process.env.E2E_OPEN_LINK_PAUSE_MS || 2000),
  });
  console.log(`[fixtures] open-link ${link}: ${JSON.stringify(result)}`);
  return json(result.ok ? 200 : 502, result);
}

const server = createServer((req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (path === '/__open-link') {
      handleOpenLink(req, res).catch((err) => {
        console.error(`[fixtures] open-link failed: ${err.message}`);
        res.destroy();
      });
      return;
    }
    const file = join(root, normalize(path));

    if (!file.startsWith(root)) {
      res.writeHead(404).end();
      return;
    }

    let size;
    try {
      const stat = statSync(file);
      if (!stat.isFile()) throw new Error('not a file');
      size = stat.size;
    } catch {
      res.writeHead(404).end();
      return;
    }

    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const range = req.headers.range;

    // AVPlayer and ExoPlayer both request byte ranges; without this, playback stalls.
    if (range) {
      // Parse range strictly: bytes=<int>-<int>, bytes=<int>-, or bytes=-<int>
      const rangeMatch = /^bytes=(\d+)?-(\d+)?$/.exec(range);

      if (rangeMatch && (rangeMatch[1] !== undefined || rangeMatch[2] !== undefined)) {
        const startStr = rangeMatch[1];
        const endStr = rangeMatch[2];

        let start, end;

        if (startStr === undefined && endStr !== undefined) {
          // bytes=-N: last N bytes
          const suffix = Number(endStr);
          start = Math.max(0, size - suffix);
          end = size - 1;
        } else if (startStr !== undefined && endStr === undefined) {
          // bytes=N-: from N to EOF
          start = Number(startStr);
          end = size - 1;
        } else {
          // bytes=N-M: from N to M
          start = Number(startStr);
          end = Number(endStr);
        }

        // Clamp end to size - 1
        end = Math.min(end, size - 1);

        // Check if range is satisfiable
        if (start >= size || start > end) {
          res.writeHead(416, {
            'Content-Range': `bytes */${size}`,
          });
          res.end();
          return;
        }

        // Valid range
        res.writeHead(206, {
          'Content-Type': type,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
        });
        const stream = createReadStream(file, { start, end });
        stream.on('error', () => res.destroy());
        stream.pipe(res);
        return;
      }
      // Malformed range header: fall through to full file response
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': size,
      'Accept-Ranges': 'bytes',
    });
    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (err) {
    console.error(`[fixtures] unexpected error: ${err.message}`);
    res.destroy();
  }
});

server.on('error', (err) => {
  console.error(`[fixtures] ${err.message}`);
  process.exit(1);
});

server.listen(port, () => console.log(`[fixtures] serving ${root} on :${port}`));
