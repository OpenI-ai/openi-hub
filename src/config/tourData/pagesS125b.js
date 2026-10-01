/**
 * s125b (1 Oct 2026) — "Innovation Brief" becomes "Innovation Agent" for every persona (Rajeev: "why are we
 * calling this your Innovation Brief? How about your Innovation Agent?" … "i guess it should be same for all
 * personas?" … "next: Innovation Agent rename"). The page and its tour are named after the agent; the PDF it
 * produces keeps the name "Innovation Brief" (the brief is what the agent writes for you).
 * Derived from pagesS125 so the six split modules and the earlier S12x modules stay verbatim.
 */
import { pagesS125 } from './pagesS125.js';

const brief = pagesS125['/dashboard/brief'];
const AGENT = 'Your Innovation Agent works for you: it picks startups and opportunities';
const BRIEF_OLD = 'Startups and opportunities picked';

export const pagesS125b = {
  '/dashboard/brief': {
    ...brief,
    title: 'Innovation Agent',
    steps: brief.steps.map(s => (s.target === '#tour-page-brief'
      ? { ...s, title: 'Your Innovation Agent', content: s.content.replace(BRIEF_OLD, AGENT).replace('saves this brief as', 'saves what it found as your Innovation Brief,') }
      : s)),
  },
};
