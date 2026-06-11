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
    ],
  });
}

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
        success: { iconTheme: { primary: '#D5AA5B', secondary: '#fff' } },
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
if (rootElement.hasChildNodes()) {
  rootElement.replaceChildren();
}
ReactDOM.createRoot(rootElement).render(tree);
