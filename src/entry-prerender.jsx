// SSR prerender entry — used ONLY at build time by prerender.js.
// Renders public leaf page components to static HTML so crawlers and AI
// answer engines see real body content in the raw HTML (GEO P1).
//
// Design notes (locked):
//  - We render the LEAF page component directly, NOT <App>, to avoid App.jsx's
//    hardcoded <BrowserRouter> which calls window.history (absent in Node SSR).
//  - We wrap ONLY in <StaticRouter> — NOT <AuthProvider>. AuthContext gates its
//    children behind `if (loading) return null` with loading cleared inside a
//    useEffect that never runs during renderToString. No public component uses
//    useAuth, so AuthProvider is unnecessary and would render empty markup.
//  - /marketplace receives real initial data (challenges + deal requests)
//    fetched by prerender.js at build time and passed in as the `initialData`
//    prop below, so its prerendered HTML shows actual listings instead of a
//    frozen loading/empty state. Other listing pages (reports) still start in
//    their default loading state, so only their static chrome + intro copy
//    prerenders — still a GEO win over an empty <div id="root">.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import Landing from './pages/auth/Landing';
import PublicMarketplace from './pages/public/PublicMarketplace';
import PublicReports from './pages/public/PublicReports';
import PublicFAQ from './pages/public/PublicFAQ';
import Terms from './pages/auth/Terms';
import Privacy from './pages/auth/Privacy';

// Map a URL path to its public leaf component.
const ROUTES = {
  '/': Landing,
  '/marketplace': PublicMarketplace,
  '/reports': PublicReports,
  '/faq': PublicFAQ,
  // Added 21 Aug 2026 (UX audit). Both were serving the generic homepage
  // <title> and description because nothing prerendered them and nothing set
  // a title client-side. They are also the ideal prerender candidates: pure
  // static markup, no data fetch, no auth, no loading state — the rendered
  // HTML is the whole page rather than chrome around a spinner.
  '/terms': Terms,
  '/privacy': Privacy,
};

export const PRERENDER_ROUTES = Object.keys(ROUTES);

/**
 * Render a single public route to a static HTML string.
 * @param {string} route - one of PRERENDER_ROUTES (e.g. '/', '/marketplace')
 * @param {object|null} [initialData] - optional prefetched data to seed the
 *   component's initial render (currently only used by /marketplace).
 *   Components that don't accept this prop simply ignore it.
 * @returns {string} HTML markup for the #root contents
 */
export function render(route, initialData) {
  const Component = ROUTES[route];
  if (!Component) {
    throw new Error(`[prerender] no component mapped for route: ${route}`);
  }
  return renderToString(
    <StaticRouter location={route}>
      <Component initialData={initialData} />
    </StaticRouter>
  );
}
