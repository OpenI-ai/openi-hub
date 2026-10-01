/**
 * s125b (1 Oct 2026) — "Innovation Brief" becomes "Innovation Agent" for every persona (Rajeev: "why are we
 * calling this your Innovation Brief? How about your Innovation Agent?" … "i guess it should be same for all
 * personas?" … "next: Innovation Agent rename"). The page and its tour are named after the agent; the PDF it
 * produces keeps the name "Innovation Brief" (the brief is what the agent writes for you).
 * Also (same day): the Sector re-check reads faster — Rajeev: "at this rate it'll take 32 nights. Can we pls
 * expedite this?" One press reads up to 20,000, and a "keep going" sector is read every 2 hours, not once a night.
 * Derived from pagesS125 so the six split modules and the earlier S12x modules stay verbatim.
 */
import { pagesS125 } from './pagesS125.js';
import { pagesAdminPublic } from './pagesAdminPublic.js';

const brief = pagesS125['/dashboard/brief'];
const sector = pagesS125['/dashboard/admin/sector-recheck'];
const FAST_OLD = 'one press of "Check all" reads up to 4,000 (the button says how many), and "Keep going every night until done" lets the analyst read the next batch each night until the sector is finished.';
const FAST_NEW = 'one press of "Check all" reads up to 20,000 (the button says how many), and "Keep going until done" lets the analyst read the next batch every 2 hours until the sector is finished.';
const AGENT = 'Your Innovation Agent works for you: it picks startups and opportunities';
const BRIEF_OLD = 'Startups and opportunities picked';
// Rajeev (1 Oct): "26 matches in this brief" -> "26 matches your agent found" — yes, change it.
const STATS_OLD = 'How many matches this brief holds';
const STATS_NEW = 'How many matches your agent found';

// s125 — the landing page now leads with the Innovation Agent (headline chosen by Rajeev, 1 Oct).
const WELCOME = { target: '#tour-page-landing', title: 'Your innovation team that works while you sleep', content: 'OpenI\u2019s agents find startups for your priorities every night, check each one against your business, and suggest your next move. Every suggestion shows its evidence, and nothing happens without your OK. Free to start.', placement: 'bottom', skipBeacon: true };
const AGENTS = { target: '#tour-landing-agents', title: 'How your Innovation Agent works', content: 'Scout searches, the Analyst checks, your agent ranks, the Map builder fills the gaps, and you get next moves. Below: what the agent does for companies, investors and startups, and how you stay in charge.', placement: 'top', skipBeacon: true };
const landing = key => ({ ...pagesAdminPublic[key], steps: [WELCOME, AGENTS] });

export const pagesS125b = {
  '/': landing('/'),
  '/landing': landing('/landing'),
  '/dashboard/admin/sector-recheck': {
    ...sector,
    steps: sector.steps.map(s => (s.target === '#tour-page-admin-sector-recheck' ? { ...s, content: s.content.replace(FAST_OLD, FAST_NEW) } : s)),
  },
  '/dashboard/brief': {
    ...brief,
    title: 'Innovation Agent',
    steps: brief.steps.map(s => (s.target === '#tour-page-brief'
      ? { ...s, title: 'Your Innovation Agent', content: s.content.replace(BRIEF_OLD, AGENT).replace('saves this brief as', 'saves what it found as your Innovation Brief,') }
      : s.target === '#tour-brief-stats' ? { ...s, content: s.content.replace(STATS_OLD, STATS_NEW) } : s)),
  },
};
