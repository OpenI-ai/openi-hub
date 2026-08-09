/**
 * OpenI Hub - page/persona tour definitions (thin re-export since Phase 162).
 *
 * react-joyride step sets for every persona dashboard and every routed page.
 *
 * The implementation moved to ./tourData/ on 9 Aug 2026; this file was 2,022
 * lines, past the 1,000-line token-discipline threshold in CLAUDE.md. This path
 * is kept because five components import it directly - see ./tourData/index.js
 * for the layout, the re-concat verification recipe and the invariants.
 */
export { TOURS, PAGE_TOURS, resolvePageTour } from './tourData/index.js';
export { default } from './tourData/index.js';
