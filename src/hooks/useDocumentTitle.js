/**
 * useDocumentTitle — keep <title> in step with the route.
 *
 * WHY THIS EXISTS (UX audit, 21 Aug 2026)
 * ---------------------------------------
 * Before this hook the app set the document title exactly nowhere: a repo-wide
 * grep for `document.title` and for react-helmet returned no matches across
 * 124 routes. Every per-page title came from prerender.js, which rewrites the
 * static HTML for THREE routes (/marketplace, /reports, /faq). Two consequences,
 * both measured against production:
 *
 *   1. Every other route served the generic index.html title. /terms, /privacy,
 *      /register, /dashboard/login and all 92 dashboard pages read
 *      "OpenI Hub — AI Open Innovation Marketplace | Find Startups & Partners".
 *
 *   2. Worse, and invisible in a curl: because nothing ran client-side, moving
 *      between pages IN the SPA never changed the tab at all. Click Home →
 *      Reports and the tab still says the homepage title. Only a hard load
 *      picked up a prerendered one. Users with several tabs open cannot tell
 *      the pages apart, and any analytics keyed on page title attributes every
 *      in-app view to the homepage.
 *
 * PRERENDER PARITY IS DELIBERATE
 * ------------------------------
 * The three titles below for /marketplace, /reports and /faq are byte-identical
 * to ROUTE_META in prerender.js. They must stay that way: a crawler and a first
 * paint read the prerendered HTML, then React mounts and this hook runs. If the
 * strings disagreed, the tab would visibly flicker from one title to another on
 * every hard load of those pages. If you edit a title in one file, edit it in
 * the other — there is a test-shaped comment in prerender.js pointing back here.
 *
 * This hook does NOT replace prerendering. Crawlers that do not execute JS still
 * need the static HTML; this fixes the other 121 routes and all client-side
 * navigation.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SUFFIX = 'OpenI Hub';

/** Base title from index.html — the homepage keeps it, nothing else should. */
export const DEFAULT_TITLE =
  'OpenI Hub — AI Open Innovation Marketplace | Find Startups & Partners';

/**
 * Exact-match routes. Keys are pathnames; values are complete <title> strings.
 * The first three MUST match prerender.js ROUTE_META verbatim (see above).
 */
export const ROUTE_TITLES = {
  '/': DEFAULT_TITLE,
  '/landing': DEFAULT_TITLE,

  // ── prerendered: keep byte-identical to prerender.js ──
  '/marketplace': 'Innovation Challenges Marketplace | OpenI Hub',
  '/reports': 'Startup Ecosystem Reports & Insights | OpenI Hub',
  '/faq': 'Frequently Asked Questions | OpenI Hub',

  // ── public, previously falling back to the generic title ──
  '/terms': `Terms of Use | ${SUFFIX}`,
  '/privacy': `Privacy Policy | ${SUFFIX}`,
  '/register': `Create Your Account | ${SUFFIX}`,
  '/search': `Search | ${SUFFIX}`,
  '/verify-email': `Verify Your Email | ${SUFFIX}`,
  '/forgot-password': `Reset Your Password | ${SUFFIX}`,
  '/dashboard/login': `Sign In | ${SUFFIX}`,
  '/dashboard/register': `Register Your Startup | ${SUFFIX}`,
  '/dashboard/onboarding': `Get Started | ${SUFFIX}`,
};

/**
 * Prefix rules for dynamic and deep routes, longest-prefix-wins. Kept as an
 * ordered array rather than an object because match order is significant:
 * '/dashboard/corporate/challenges' must beat '/dashboard/corporate'.
 */
const PREFIX_TITLES = [
  ['/share/', `Shared Profile | ${SUFFIX}`],
  ['/challenges/share/', `Shared Challenge | ${SUFFIX}`],
  ['/watchlists/share/', `Shared Watchlist | ${SUFFIX}`],
  ['/public/deal-requests/share/', `Shared Deal Request | ${SUFFIX}`],
  ['/invite/accept/', `Accept Invitation | ${SUFFIX}`],
  ['/reset-password/', `Reset Your Password | ${SUFFIX}`],
  ['/claims/verify/', `Verify Your Claim | ${SUFFIX}`],
  ['/marketplace/', 'Innovation Challenges Marketplace | OpenI Hub'],
];

/**
 * Turn an unmapped dashboard path into something readable rather than leaving
 * it on the marketing title. '/dashboard/corporate/challenges' → 'Challenges'.
 * Deliberately simple: a wrong-but-specific title still beats every tab reading
 * "AI Open Innovation Marketplace", and mapping all 92 dashboard routes by hand
 * would rot the moment someone adds a page.
 */
function humanizeDashboardPath(pathname) {
  const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);
  if (!segments.length) return `Dashboard | ${SUFFIX}`;
  // Trailing numeric or token-ish segment is a record id, not a page name.
  const meaningful = segments.filter(s => !/^\d+$/.test(s) && s.length < 24);
  const last = meaningful[meaningful.length - 1] || segments[0];
  const label = last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return `${label} | ${SUFFIX}`;
}

/** Resolve a pathname to a full document title. Pure — safe to unit test. */
export function titleForPath(pathname) {
  if (!pathname) return DEFAULT_TITLE;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (ROUTE_TITLES[clean]) return ROUTE_TITLES[clean];

  const prefix = PREFIX_TITLES.find(([p]) => clean.startsWith(p));
  if (prefix) return prefix[1];

  if (clean.startsWith('/dashboard')) return humanizeDashboardPath(clean);

  return DEFAULT_TITLE;
}

/**
 * Mount once, high in the tree, inside the Router. Sets the title on every
 * location change. No cleanup that restores the previous title: the next
 * navigation sets it again, and restoring on unmount would race the incoming
 * route and leave the wrong title on screen.
 */
export default function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);
}
