/**
 * OpenI Hub - tours barrel (Phase 162, 9 Aug 2026).
 *
 * src/config/tours.js was 2,022 lines, past the 1,000-line token-discipline
 * threshold in CLAUDE.md. It is now a thin re-export shim so none of its five
 * importers had to change; the implementation lives here.
 *
 * LAYOUT
 *   personaSteps.js      original 31-299     navTarget + 11 step arrays + TOURS
 *   pagesCore.js         original 324-611    Ship #12 / 22 May / 27 May batches
 *   pagesUniversal.js    original 612-1036   batches 3-4
 *   pagesActions.js      original 1037-1316  batches 5-6
 *   pagesSeeker.js       original 1317-1652  batches 7-8
 *   pagesAdminPublic.js  original 1653-2003  batch 9 + every-page coverage
 *   index.js (this file) original 2007-2022  resolvePageTour, verbatim
 *
 * The six modules together own original lines 31-299, 324-2003 and 2007-2022.
 * The three uncovered regions were structural, not logic, and are reconstructed
 * here: 1-30 (file JSDoc + the matchPath import), 300-323 (`export default
 * TOURS;` plus the PAGE_TOURS header comment and its opening brace) and
 * 2004-2006 (the "add more pages here" note plus the closing brace).
 *
 * RE-CONCAT VERIFICATION RECIPE
 *   For each module, take the lines between the `BODY START` and `BODY END`
 *   sentinels, split them on the `// --- lines A-B ---` provenance markers,
 *   sort every slice across every module by its original start line, assert the
 *   result is contiguous over 31-299 / 324-2003 / 2007-2022 with no overlap,
 *   then diff it against the matching line range of the pre-split file. It must
 *   be a byte-for-byte match. `.scratch/verify-w4-3.py` does exactly this.
 *
 * INVARIANTS - do not break these
 *   1. PAGE_TOURS KEY ORDER IS LOAD-BEARING. resolvePageTour below iterates
 *      Object.keys(PAGE_TOURS) and returns the FIRST matchPath hit, so the
 *      spread order must stay in original source order. Reordering the spreads
 *      can silently change which tour a dynamic route resolves to.
 *   2. All 107 route keys are unique (verified at split time), so the spreads
 *      cannot shadow one another today. Adding a key that already exists in an
 *      earlier group WOULD shadow it - grep before adding.
 *   3. Module bodies stay verbatim. Reformatting them voids the recipe above.
 *   4. Keep ../tours.js as a shim. Five files import from '../config/tours'
 *      (PageTourButton, PublicLayout, PublicTour, TourWrapper, DashboardLayout)
 *      and only ever pull `resolvePageTour` and `TOURS`.
 *   5. The directory is deliberately named tourData/, NOT tours/ - a sibling
 *      tours.js plus a tours/ directory makes './tours' ambiguous to resolve.
 */
import { matchPath } from 'react-router-dom';

import { TOURS } from './personaSteps.js';
import { pagesCore } from './pagesCore.js';
import { pagesUniversal } from './pagesUniversal.js';
import { pagesActions } from './pagesActions.js';
import { pagesSeeker } from './pagesSeeker.js';
import { pagesAdminPublic } from './pagesAdminPublic.js';

export { TOURS };
export default TOURS;

// Assembled in original source order - see INVARIANT 1 above.
export const PAGE_TOURS = {
  ...pagesCore,
  ...pagesUniversal,
  ...pagesActions,
  ...pagesSeeker,
  ...pagesAdminPublic,
};

// Resolve the PAGE_TOURS entry for a given pathname.
// Exact key match first (fast path, covers the vast majority of routes), then
// fall back to react-router pattern matching so dynamic detail routes like
// `/dashboard/find-mentees/42` resolve to their `:id` tour entry. Without this
// the `:id` keys were dead — both DashboardLayout's "Tour this page" button gate
// and TourWrapper did a literal `PAGE_TOURS[pathname]` lookup that never matched
// a real id-bearing path.
export function resolvePageTour(pathname) {
  if (!pathname) return null;
  if (PAGE_TOURS[pathname]) return PAGE_TOURS[pathname];
  for (const key of Object.keys(PAGE_TOURS)) {
    if (!key.includes(':')) continue; // only dynamic keys need pattern matching
    if (matchPath({ path: key, end: true }, pathname)) return PAGE_TOURS[key];
  }
  return null;
}
