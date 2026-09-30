/**
 * OpenI Hub - page tours for the s124 surfaces (30 Sep 2026).
 *
 * The CEO view on a company's Innovation Brief (Innovation Agent Phase 3):
 * competitors' startup deals, where to venture next, the quarterly board pack.
 * Rajeev's rule (29 Sep): every new feature ships with its tour.
 *
 * The CEO view is rendered for company accounts only, and the brief's tour is
 * shared by every persona, so it is described in the always-present "Agents
 * working for you" step (a step whose target never renders stalls the tour).
 * This module re-states the s123 brief entry with that one step extended and is
 * spread AFTER pagesS123 in ./index.js; the s123 steps are reused, not copied.
 */
import { pagesS123 } from './pagesS123.js';

const brief = pagesS123['/dashboard/brief'];
const CEO = ' Company accounts also get the CEO view ("CEO view: your competitors and where to venture next"): name up to 3 competitors (or keep the ones your agent suggests) and OpenI reads the news on each for the startups they bought, invested in or partnered with in the last 12 months, every line with its source, "On OpenI" where the startup is here. Below, "Where to venture next" names adjacent industries to enter through an acquisition, with startups on OpenI small enough to buy, each checked by the analyst for you; "Shortlist" puts one in your pilot pipeline. "Board pack (PDF)" downloads this quarter\'s pack for your board: your priorities, the pipeline, your competitors\' moves and where to venture next.';

export const pagesS124 = {
  '/dashboard/brief': {
    ...brief,
    steps: brief.steps.map(s => (s.target === '#tour-brief-agents' ? { ...s, content: `${s.content}${CEO}` } : s)),
  },
};
