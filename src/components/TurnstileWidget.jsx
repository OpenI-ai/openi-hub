import { useEffect, useRef } from 'react';

// s101 — Cloudflare Turnstile widget, feature-flagged by VITE_TURNSTILE_SITE_KEY:
// with the key unset the component renders nothing and the backend (its own
// flag unset) skips verification, so both sides deploy as a no-op and the
// CAPTCHA activates only when the key pair is configured. Managed mode is
// usually invisible — most humans never see a challenge.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileWidget({ onToken }) {
  const containerRef = useRef(null);
  // The callback lives in a ref so a new onToken identity (parent re-render)
  // doesn't tear down and re-render the widget, which would void its token.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return undefined;
    let widgetId = null;
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }

    return () => {
      cancelled = true;
      if (widgetId !== null && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch { /* already gone */ }
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}
