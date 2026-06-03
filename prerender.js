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

  // 3. Render + write each route.
  for (const route of PRERENDER_ROUTES) {
    let bodyHtml;
    try {
      bodyHtml = render(route);
    } catch (err) {
      // A single bad route must not silently ship an empty page; fail the build.
      throw new Error(`[prerender] render failed for ${route}: ${err.stack || err}`);
    }

    const html = template.replace(ROOT_RE, `<div id="root">${bodyHtml}</div>`);
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
