import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Toaster } from 'react-hot-toast';
import App from './App';
import useVersionCheck from './hooks/useVersionCheck';
import './index.css';

// Cache-busting P2 — headless component so the version-poll hook can run inside
// the React tree (alongside <Toaster>) without wrapping <App>. Renders nothing.
function VersionWatcher() {
  useVersionCheck();
  return null;
}

// Sentry — must init before React renders so route + error capture work.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    // Phase 102: filter noise from api.js defensive .json().catch()
    // The shared request() wrapper uses `await res.json().catch(() => ({}))`
    // to gracefully handle empty/204 responses. Sentry's auto-instrumentation
    // captures the underlying SyntaxError BEFORE our catch swallows it,
    // producing noise issues that never affect users.
    ignoreErrors: [
      /Unexpected end of JSON input/,
      /Failed to execute 'json' on 'Response'/,
      // Stale-bundle chunk-load failures — handled by the vite:preloadError
      // auto-reload above, so the error is recovered noise, not a user-facing bug.
      /Failed to fetch dynamically imported module/,
      /Importing a module script failed/,
      /error loading dynamically imported module/,
    ],
  });
}

// Stale-bundle recovery (Sentry "Failed to fetch dynamically imported module").
// When a user keeps a tab open across a Vercel deploy, React.lazy() tries to fetch
// an old hashed chunk URL that 404s after the new build. Vite fires a
// `vite:preloadError` event in that case. We force a one-time reload to pull the
// fresh index.html + new chunk hashes. A sessionStorage guard prevents a reload
// loop if the reload itself can't recover (e.g. genuine network outage).
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'openi_chunk_reload_ts';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  // Only auto-reload once per 10s window — guards against an infinite loop.
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(KEY, String(Date.now()));
    event.preventDefault(); // stop the default unhandled-rejection surfacing
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');

const tree = (
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={() => (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h2>Something went wrong.</h2>
        <p>The error has been reported. Please refresh to continue.</p>
      </div>
    )}>
      <App />
    </Sentry.ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { borderRadius: '10px', background: '#1a1a1a', color: '#fff', fontSize: '13px' },
        success: { iconTheme: { primary: '#D0A848', secondary: '#fff' } },
      }}
    />
    <VersionWatcher />
  </React.StrictMode>
);

// prerender.js (build-time SSR) renders the bare public LEAF page into #root so
// crawlers and AI answer engines see real body HTML (GEO). That static markup is
// intentionally leaf-only — it is NOT wrapped in <App> (BrowserRouter/AuthProvider/
// chrome). The client tree below IS the full <App>, so hydrateRoot() always saw a
// structural server/client mismatch on prerendered routes (Sentry OPENI-HUB-FRONTEND-E,
// 86 recoverable hydration errors). We therefore do NOT hydrate: the prerendered HTML
// has already served its crawler purpose by the time JS runs, so we clear it and let
// React createRoot() rebuild #root cleanly. No hydration pass → no mismatch. The
// rebuilt content is visually identical, so there is no perceptible flash.
// Fixes OPENI-HUB-FRONTEND-E
// s54: replaceChildren() is unsupported on Chrome <86 (Sentry OPENI-HUB-FRONTEND-R,
// hard crash on Chrome Mobile 80 / Android 10). Use a while-loop clear instead — same
// result, universally supported.
if (rootElement.hasChildNodes()) {
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
}
ReactDOM.createRoot(rootElement).render(tree);
