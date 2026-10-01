/**
 * OpenI Hub - page tours for the s125 surfaces (1 Oct 2026).
 *
 * Innovation Agent Phase 4 (trust and autonomy) on a company's Innovation Brief:
 * the "Suggest only / Auto: free steps" switch, "Done for you" with Undo, and
 * "Why?" (the evidence behind each next move). Rajeev's rule (29 Sep): every new
 * feature ships with its tour.
 *
 * The inbox renders for company accounts only, and the brief's tour is shared by
 * every persona, so it is described in the always-present "Agents working for
 * you" step (a step whose target never renders stalls the tour). This module
 * re-states the s124 brief entry with that one sentence replaced and is spread
 * AFTER pagesS124 in ./index.js; the earlier steps are reused, not copied.
 */
import { pagesS124 } from './pagesS124.js';

const brief = pagesS124['/dashboard/brief'];
const OLD = 'It only suggests; nothing happens without your click.';
const NEW = 'Under each next move, "Why?" shows what it rests on: the analyst\'s reason, the search Scout ran, and links to the startup\'s profile and website. By default your agent only suggests ("Suggest only"): nothing happens without your click. Switch to "Auto: free steps" and, after each run, it also shortlists up to 3 startups it found and the analyst checked (each goes on your watchlist) and drafts a challenge for your top priority; they appear under "Done for you", where "Undo" takes a shortlist back and "Review" opens the draft. It never launches a challenge, invites, writes intros, books meetings, adds priorities or spends credits on its own.';

export const pagesS125 = {
  '/dashboard/brief': {
    ...brief,
    steps: brief.steps.map(s => (s.target === '#tour-brief-agents' ? { ...s, content: s.content.replace(OLD, NEW) } : s)),
  },
};
