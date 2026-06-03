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
//  - Pages that fetch listings at runtime (marketplace/reports) start in a
//    loading state, so only their static chrome + intro copy prerenders. That
//    is still a large GEO win over an empty <div id="root">.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import Landing from './pages/auth/Landing';
import PublicMarketplace from './pages/public/PublicMarketplace';
import PublicReports from './pages/public/PublicReports';

// Map a URL path to its public leaf component.
const ROUTES = {
  '/': Landing,
  '/marketplace': PublicMarketplace,
  '/reports': PublicReports,
};

export const PRERENDER_ROUTES = Object.keys(ROUTES);

/**
 * Render a single public route to a static HTML string.
 * @param {string} route - one of PRERENDER_ROUTES (e.g. '/', '/marketplace')
 * @returns {string} HTML markup for the #root contents
 */
export function render(route) {
  const Component = ROUTES[route];
  if (!Component) {
    throw new Error(`[prerender] no component mapped for route: ${route}`);
  }
  return renderToString(
    <StaticRouter location={route}>
      <Component />
    </StaticRouter>
  );
}
