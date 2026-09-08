/**
 * analytics — one front door for product analytics (added 7 Sep 2026).
 *
 * WHY THIS EXISTS
 * ---------------
 * Rajeev put a "Sign up" button on the OpenI LinkedIn company page pointing at
 *   /register?utm_source=linkedin&utm_medium=company_page&utm_campaign=signup_button
 * and asked whether anything on the site could actually see those visitors. A
 * repo-wide grep answered no: no Google Analytics, no Vercel Web Analytics, and
 * Register.jsx ignored utm_* entirely. This module fixes that with TWO backends,
 * both optional, both silent when not configured:
 *
 *   1. Vercel Web Analytics — `<Analytics />` in App.jsx auto-tracks page views
 *      (UTM fields become filters in the Vercel dashboard for free). We call
 *      `track()` for custom events. Needs "Enable" clicked once under
 *      Vercel → openi-hub → Analytics. No account, no cookie banner.
 *
 *   2. Google Analytics 4 — loads gtag.js ONLY when VITE_GA_MEASUREMENT_ID
 *      (the "G-XXXXXXXXXX" id from a GA4 property) is set at build time. GA4
 *      attributes a session to the utm_* on its landing page, so a `sign_up`
 *      event shows under "linkedin / company_page" in Acquisition reports.
 *      Script + beacon hosts are allow-listed in vercel.json's CSP — keep the
 *      two in step (see CLAUDE.md, the 31 Aug Turnstile lesson).
 *
 * UTM CAPTURE
 * -----------
 * On first load we copy utm_* from the URL into sessionStorage and merge them
 * into every custom event. That way a visitor who lands on /register, wanders
 * to /marketplace and comes back still counts as LinkedIn-sourced when they
 * finish signing up, even though the querystring is long gone.
 *
 * COOKIE CONSENT (8 Sep 2026)
 * ---------------------------
 * GA4 sets cookies (_ga, _ga_*). /privacy §6 promises "optional analytics cookies
 * are set only after you opt in via the cookie banner", so gtag.js is loaded ONLY
 * after the visitor accepts in <CookieConsent /> (src/components/CookieConsent.jsx).
 * The choice lives in localStorage under CONSENT_KEY ('accepted' | 'declined');
 * no choice yet = banner shows (only when GA is configured at all). Vercel Web
 * Analytics is cookieless and needs no consent, so it runs regardless.
 *
 * WHAT TO TRACK
 * -------------
 * Keep custom events few and named in snake_case. Today:
 *   sign_up  { method:'email', persona:<personaType>, utm_* }   — Register.jsx
 * GA4 treats `sign_up` as a recommended event and charts it without setup.
 */
import { track } from '@vercel/analytics';

// GA4 property "OpenI Hub", web stream openi.ai — created by Rajeev 8 Sep 2026.
// A Measurement ID is public by nature (it ships in every page's HTML), so the
// production default lives here; VITE_GA_MEASUREMENT_ID still overrides it
// (set it to '' on a preview/staging deploy to keep test traffic out of GA).
const DEFAULT_GA_ID = 'G-HB8W74H9GN';
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? DEFAULT_GA_ID;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const UTM_STORAGE_KEY = 'openi_utm';
const CONSENT_KEY = 'openi_cookie_consent';

/** Boolean the rest of the app can use to know whether GA is live. */
export const GA_ENABLED = Boolean(GA_ID);

function readUtmFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 100);
    }
    return found;
  } catch {
    return {};
  }
}

/** UTM fields captured for this browser tab, or {} when the visit had none. */
export function getUtm() {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persist utm_* from the current URL for the life of the tab. Called once at
 * boot; a later visit with fresh UTMs overwrites (last-touch attribution).
 */
export function captureUtm() {
  const fromUrl = readUtmFromUrl();
  if (Object.keys(fromUrl).length === 0) return getUtm();
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    /* sessionStorage blocked (private mode / hardened WebView) — events still fire, just unattributed */
  }
  return fromUrl;
}

function loadGtag() {
  if (typeof window === 'undefined' || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
  };
  window.gtag('js', new Date());
  // send_page_view:false — the SPA router fires page_view itself (trackPageView)
  // so in-app navigation counts. Leaving GA's default on would double-count
  // the first load.
  window.gtag('config', GA_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

/** 'accepted' | 'declined' | null (no choice yet, or storage blocked). */
export function getConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

/** True when the banner should show: GA is configured and nobody has chosen yet. */
export function needsConsentPrompt() {
  return GA_ENABLED && getConsent() === null;
}

/**
 * Record the visitor's choice. Accepting mid-session loads gtag.js right away
 * and sends the page they are on, since the router's page_view already fired
 * before GA existed.
 */
export function setConsent(choice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked — GA simply loads for this page view only, never persists */
  }
  if (choice === 'accepted' && GA_ENABLED) {
    loadGtag();
    trackPageView(window.location.pathname + window.location.search);
  }
}

/** Call once before React renders (src/main.jsx). Safe to call twice. */
export function initAnalytics() {
  captureUtm();
  if (GA_ENABLED && getConsent() === 'accepted') loadGtag();
}

/**
 * One page view. Vercel's <Analytics /> handles its own page views, so this
 * only talks to GA. Fired from App.jsx on every location change.
 */
export function trackPageView(path) {
  if (!GA_ENABLED || typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  } catch {
    /* analytics must never break the app */
  }
}

/**
 * One custom event, fanned out to every configured backend with the tab's
 * UTM fields merged in. Props must be flat primitives (Vercel's rule).
 */
export function trackEvent(name, props = {}) {
  const data = { ...getUtm(), ...props };
  try {
    track(name, data);
  } catch {
    /* Vercel script not injected (analytics disabled / dev) — ignore */
  }
  if (GA_ENABLED && typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', name, data);
    } catch {
      /* see above */
    }
  }
}
