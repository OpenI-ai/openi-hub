// Cache-busting P2 — runtime stale-bundle detector.
//
// Cache-Control headers already guarantee a *fresh navigation* gets the latest
// HTML+bundle (HTML is max-age=0,must-revalidate; assets are immutable+hashed).
// The one gap they cannot close: a tab left OPEN across a deploy never re-fetches
// HTML, so it keeps running the old in-memory bundle indefinitely. That is the
// "Vercel browser-cache bug indistinguishable from a broken feature" class.
//
// This hook closes it. On tab focus / visibility change it fetches the freshly
// served dist/version.json and compares it to the version this tab booted with
// (__APP_VERSION__, baked in by vite.config.js). If they differ, a deploy
// happened while this tab was idle — we show a persistent toast offering Reload.
//
// Cost: one tiny no-store fetch, rate-limited to once per minute, only while the
// tab is focused. Local dev (__APP_VERSION__ === 'dev') no-ops entirely.
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// eslint-disable-next-line no-undef -- injected by Vite `define` at build time.
const BOOT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const MIN_INTERVAL_MS = 60 * 1000;

export default function useVersionCheck() {
  const notified = useRef(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    // No deterministic build ID locally → nothing meaningful to compare against.
    if (BOOT_VERSION === 'dev') return undefined;

    async function check() {
      if (notified.current) return;
      const now = Date.now();
      if (now - lastCheck.current < MIN_INTERVAL_MS) return;
      lastCheck.current = now;
      try {
        const res = await fetch(`/version.json?t=${now}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.version && data.version !== BOOT_VERSION) {
          notified.current = true;
          toast(
            (t) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>A new version of OpenI Hub is available.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#D0A848',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reload
                </button>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    background: 'transparent',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '6px 4px',
                    cursor: 'pointer',
                  }}
                >
                  Later
                </button>
              </span>
            ),
            { id: 'version-update', duration: Infinity }
          );
        }
      } catch {
        // Offline / transient network error — leave it for the next focus.
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') check();
    }

    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
