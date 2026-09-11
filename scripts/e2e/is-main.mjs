// `import.meta.main` only exists on Node >= 22.18 (and Bun); on older Node it is
// `undefined`, so a script guarded by it silently exits 0 without doing anything.
// Compare the module path against argv[1] instead, which works on every Node version.
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMain(importMetaUrl) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(resolve(process.argv[1]));
  } catch {
    return false;
  }
}
