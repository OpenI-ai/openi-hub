import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({ error }) => (
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
  </React.StrictMode>
);
