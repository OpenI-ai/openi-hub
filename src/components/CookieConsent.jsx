/**
 * CookieConsent — the "cookie banner" /privacy §6 refers to (8 Sep 2026).
 *
 * Google Analytics 4 sets cookies, so it must not load until the visitor opts
 * in. This banner renders ONLY when GA is configured (VITE_GA_MEASUREMENT_ID)
 * and no choice is stored yet; Accept loads gtag.js immediately, Decline keeps
 * it off. Either way the choice persists in localStorage and the banner never
 * shows again. Vercel Web Analytics is cookieless and unaffected.
 *
 * Mounted once in src/main.jsx, outside the router, so it uses a plain <a>
 * for the privacy link rather than react-router's <Link>.
 */
import { useState } from 'react';
import { needsConsentPrompt, setConsent } from '../utils/analytics';

const NAVY = '#0D2137';
const GOLD = '#D0A848';

export default function CookieConsent() {
  const [open, setOpen] = useState(() => needsConsentPrompt());
  if (!open) return null;

  const choose = (choice) => {
    setConsent(choice);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      data-testid="cookie-consent"
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 9999,
        maxWidth: 720, margin: '0 auto',
        background: NAVY, color: '#fff', borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        padding: '14px 16px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', gap: 12, fontSize: 13, lineHeight: 1.45,
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        We use optional analytics cookies (Google Analytics) to understand how
        people find and use OpenI Hub. Essential cookies that keep you signed in
        are always on. See our{' '}
        <a href="/privacy" style={{ color: GOLD, textDecoration: 'underline' }}>Privacy Policy</a>.
      </div>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <button
          type="button"
          onClick={() => choose('declined')}
          style={{
            background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose('accepted')}
          style={{
            background: GOLD, color: NAVY, border: 'none', fontWeight: 700,
            borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
