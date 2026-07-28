// GEO P1 — body prerendering for public routes.
//
// Runs as a postbuild step AFTER `vite build` has produced dist/. It:
//   1. Builds an SSR bundle of src/entry-prerender.jsx in-memory via Vite's JS
//      API (so JSX + import.meta.env + path aliases all resolve correctly —
//      a plain Node import of the .jsx source would not).
//   2. Imports the bundle's render(route) function.
//   3. Reads the built dist/index.html (which has the P0 head meta + an empty
//      <div id="root"></div>).
//   4. For each public route, renders the leaf component to HTML and injects it
//      into #root, then writes a per-route index.html into dist/.
//
// No Chromium / libnss3.so — pure Node + Vite SSR. Runs inside Vercel's build
// container without extra system libraries (the reason react-snap was removed).
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const SSR_OUT = path.join(__dirname, '.ssr-prerender');

// Where each route's HTML file is written inside dist/.
//   '/'            -> dist/index.html
//   '/marketplace' -> dist/marketplace/index.html
function routeToOutputFile(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\//, ''), 'index.html');
}

// GEO P2 — per-route head meta. The built dist/index.html carries the homepage
// title/description/canonical/OG/Twitter tags. Without this, /marketplace and
// /reports would advertise the homepage's title + canonical, which is both an
// SEO duplicate-canonical bug and a weaker signal for AI answer engines.
// '/' is intentionally absent: it keeps the index.html meta as-is.
const SITE = 'https://www.openi.ai';
const ROUTE_META = {
  '/marketplace': {
    title: 'Innovation Challenges Marketplace | OpenI Hub',
    description:
      'Browse open innovation challenges from corporates, government and academia on OpenI Hub. Apply your startup, find partners, and respond to live problem statements. Free to start.',
    path: '/marketplace',
    ogTitle: 'Innovation Challenges Marketplace — OpenI Hub',
    ogDescription:
      'Browse and apply to open innovation challenges from corporates, government and academia. Find partners and respond to live problem statements.',
  },
  '/reports': {
    title: 'Startup Ecosystem Reports & Insights | OpenI Hub',
    description:
      'Curated startup ecosystem reports and data-driven insights for innovators, investors and corporates. Explore sector trends across 575,000+ startups on OpenI Hub.',
    path: '/reports',
    ogTitle: 'Startup Ecosystem Reports & Insights — OpenI Hub',
    ogDescription:
      'Curated startup ecosystem reports and insights for innovators, investors and corporates. Sector trends across 575,000+ startups.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | OpenI Hub',
    description:
      'Answers to common questions about OpenI Hub — how to search 575,000+ startups in plain English, run innovation challenges, pricing, and our ISO/IEC 27001:2022 security posture.',
    path: '/faq',
    ogTitle: 'OpenI Hub FAQ — Searching Startups, Challenges & Pricing',
    ogDescription:
      'How OpenI Hub helps corporates, investors, government and academia search startups, run innovation challenges, and connect with the deep-tech ecosystem.',
  },
};

// Escape the five HTML-significant chars so a meta value can never break out of
// its attribute or element. All current values are static and safe; this keeps
// the rewrite robust if copy is edited later.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Rewrite the homepage head tags in `html` to the per-route values. Returns the
// html unchanged when the route has no override (e.g. '/'). Throws if a tag the
// override targets is missing, so a template change can't silently no-op P2.
function applyRouteMeta(html, route) {
  const meta = ROUTE_META[route];
  if (!meta) return html;

  const subs = [
    [/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`],
    [
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${esc(meta.description)}" />`,
    ],
    [
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${SITE}${meta.path}" />`,
    ],
    [
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${esc(meta.ogTitle)}" />`,
    ],
    [
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${esc(meta.ogDescription)}" />`,
    ],
    [
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${SITE}${meta.path}" />`,
    ],
    [
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${esc(meta.ogTitle)}" />`,
    ],
    [
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${esc(meta.ogDescription)}" />`,
    ],
  ];

  let out = html;
  for (const [re, replacement] of subs) {
    if (!re.test(out)) {
      throw new Error(`[prerender] head meta tag not found for ${route}: ${re}`);
    }
    out = out.replace(re, replacement);
  }
  return out;
}

// GEO P1b — real initial data for /marketplace. Without this, the prerendered
// HTML freezes at the component's default loading/empty state (useEffect data
// fetching never runs during renderToString), which Google classifies as a
// Soft 404. Fetched here with a plain Node fetch() against the public,
// unauthenticated backend endpoints, using the exact same default params the
// client sends on first mount (page=1/limit=12, limit=12) so prerendered
// markup matches what a real first paint would show.
const API_URL = process.env.VITE_API_URL || 'https://api.openi.ai/api';

async function fetchMarketplaceInitialData() {
  try {
    const [challengesRes, dealRequestsRes] = await Promise.all([
      fetch(`${API_URL}/public/challenges?page=1&limit=12`),
      fetch(`${API_URL}/public/deal-requests?limit=12`),
    ]);
    if (!challengesRes.ok || !dealRequestsRes.ok) {
      throw new Error(
        `non-OK response (challenges: ${challengesRes.status}, deal-requests: ${dealRequestsRes.status})`
      );
    }
    const [challenges, dealRequests] = await Promise.all([
      challengesRes.json(),
      dealRequestsRes.json(),
    ]);
    return { challenges, dealRequests };
  } catch (err) {
    // Never fail the build over a flaky/unreachable API at build time — fall
    // back to the component's existing default loading/empty state.
    console.warn(
      `[prerender] failed to fetch /marketplace initial data, falling back to default loading state: ${err.message}`
    );
    return null;
  }
}

async function buildSsrBundle() {
  await build({
    // Keep this self-contained: do not inherit the app's client build config.
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    build: {
      ssr: true,
      write: true,
      outDir: SSR_OUT,
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(__dirname, 'src', 'entry-prerender.jsx'),
        output: { entryFileNames: 'entry-prerender.js' },
      },
    },
    // import.meta.env.VITE_API_URL etc. are only used inside functions that are
    // not called during renderToString, so no env injection is needed here.
  });
  return path.join(SSR_OUT, 'entry-prerender.js');
}

async function main() {
  // 1. Build + import the SSR bundle.
  const bundlePath = await buildSsrBundle();
  const mod = await import(`file://${bundlePath}`);
  const { render, PRERENDER_ROUTES } = mod;
  if (typeof render !== 'function' || !Array.isArray(PRERENDER_ROUTES)) {
    throw new Error('[prerender] SSR bundle missing render() or PRERENDER_ROUTES');
  }

  // 2. Read the client-built index.html template.
  const templatePath = path.join(DIST, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8');

  // The empty mount node Vite leaves in the built HTML.
  const ROOT_RE = /<div id="root"><\/div>/;
  if (!ROOT_RE.test(template)) {
    throw new Error('[prerender] could not find empty <div id="root"></div> in dist/index.html');
  }

  // 3. Fetch real initial data for routes that need it, then render + write.
  const ROUTE_INITIAL_DATA = {
    '/marketplace': await fetchMarketplaceInitialData(),
  };

  for (const route of PRERENDER_ROUTES) {
    let bodyHtml;
    try {
      bodyHtml = render(route, ROUTE_INITIAL_DATA[route]);
    } catch (err) {
      // A single bad route must not silently ship an empty page; fail the build.
      throw new Error(`[prerender] render failed for ${route}: ${err.stack || err}`);
    }

    const withBody = template.replace(ROOT_RE, `<div id="root">${bodyHtml}</div>`);
    const html = applyRouteMeta(withBody, route);
    const outFile = routeToOutputFile(route);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html, 'utf8');
    console.log(`[prerender] wrote ${path.relative(__dirname, outFile)} (${bodyHtml.length} chars body)`);
  }

  // 4. Clean up the throwaway SSR bundle.
  await fs.rm(SSR_OUT, { recursive: true, force: true });
  console.log('[prerender] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
