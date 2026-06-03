// Cache-busting P2 — writes dist/version.json as a postbuild step.
//
// Runs AFTER `vite build` (npm `postbuild`, before prerender.js). It emits the
// build's commit SHA into a tiny JSON file that the running client polls on tab
// focus (src/hooks/useVersionCheck.js). When a tab left open across a deploy
// focuses, it sees version.json change and prompts the user to reload — closing
// the only stale-bundle vector that Cache-Control headers can't (an in-memory
// tab never re-fetches HTML on its own).
//
// version.json must NOT be long-cached, but it lives outside /assets/ and is not
// /index.html, so Vercel serves it with its default revalidating policy — and
// the client always requests it with `cache: 'no-store'` + a cache-buster query.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_ID } from './version-id.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const out = path.join(__dirname, 'dist', 'version.json');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify({ version: BUILD_ID }) + '\n', 'utf8');
  console.log(`[gen-version] wrote dist/version.json (version=${BUILD_ID})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
