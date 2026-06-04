// IndexNow — pings Bing/Yandex with the site's URLs after a production build.
//
// Runs as the last postbuild step (npm `postbuild`, after gen-version + prerender).
// It reads public/sitemap.xml, extracts every <loc>, and POSTs the list to the
// IndexNow API so Bing/Yandex re-crawl changed pages quickly (the Bing analogue
// of Google's recrawl — quota ~10k URLs/day vs GSC's ~10 manual requests).
//
// SAFE BY DESIGN:
//  - No-op unless VERCEL_ENV === 'production' (skips local builds + preview builds).
//  - Never throws: any network/parse error is logged and swallowed so a flaky
//    IndexNow endpoint can never fail a Vercel deploy (process exits 0 regardless).
//  - Key + key-file are public by design (that is how IndexNow proves ownership).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KEY = '9694112683b05c9da88fc8c7d674717f';
const HOST = 'www.openi.ai';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function readSitemapUrls() {
  const xml = await fs.readFile(
    path.join(__dirname, 'public', 'sitemap.xml'),
    'utf8'
  );
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  return [...new Set(locs)].filter(Boolean);
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(
      `[indexnow] skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}, not production)`
    );
    return;
  }
  const urlList = await readSitemapUrls();
  if (urlList.length === 0) {
    console.log('[indexnow] no URLs in sitemap.xml — nothing to submit');
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  console.log(`[indexnow] submitted ${urlList.length} URLs — HTTP ${res.status}`);
}

main().catch((err) => {
  // Never fail the build on an IndexNow hiccup.
  console.error('[indexnow] non-fatal error:', err?.message ?? err);
});
