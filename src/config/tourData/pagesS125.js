/**
 * OpenI Hub - page tours for the s125 surfaces (1 Oct 2026).
 *
 * Innovation Agent Phase 4 (trust and autonomy) on a company's Innovation Brief, and
 * the sector re-check's auto-approve on the admin page. On the brief:
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
import { pagesS122 } from './pagesS122.js';
import { pagesUniversal } from './pagesUniversal.js';

const brief = pagesS124['/dashboard/brief'];
const OLD = 'It only suggests; nothing happens without your click.';
const NEW = 'Under each next move, "Why?" shows what it rests on: the analyst\'s reason, the search Scout ran, and links to the startup\'s profile and website. By default your agent only suggests ("Suggest only"): nothing happens without your click. Switch to "Auto: free steps" and, after each run, it also shortlists up to 3 startups it found and the analyst checked (each goes on your watchlist) and drafts a challenge for your top priority; they appear under "Done for you", where "Undo" takes a shortlist back and "Review" opens the draft. It never launches a challenge, invites, writes intros, books meetings, adds priorities or spends credits on its own.';

// s125 — the admin "Sector re-check" page: the agent approves its own high-confidence proposals.
// Told in the always-present status step (the auto line renders only after the page loads its data).
const sector = pagesS124['/dashboard/admin/sector-recheck'];
const AUTO = ' The agent approves its own high-confidence proposals that change a sector: after each run, and every night with the newly filed startups. Each approval is recorded like yours and never overwrites a profile someone edited. Medium and low confidence, and a "Probably not a startup" that keeps the sector, still wait for you. "Approve high confidence now" clears the backlog at once.';

// s125 — all eight older broad sectors (a picker), and hiding what is not a startup / too thin to place.
const INTRO_OLD = 're-reads each startup filed under "Financial Services" and proposes the right sector from OpenI\'s own list, keeping "Financial Services" for real banks and other established financial companies.';
const INTRO_NEW = 're-reads each startup filed under one of OpenI\'s eight older broad sectors (pick it under "Sector to re-check": Financial Services, IT & Software, Retail & Consumer and the rest) and proposes the right sector from OpenI\'s own list, keeping the broad one for real incumbents such as banks, IT services firms or utilities.';
const HIDE = ' Two more buttons act on the ticked rows: "Hide: not a startup" takes a fund, agency or established company out of every client list (search, discovery, briefs and recommendations); "Hide until more data" hides a company whose profile is too thin to place, and it comes back by itself once the crawler fills it in, to be re-checked. Both are recorded, and "Undo" beside a hidden company shows it again.';
const sectorSteps = sector.steps.map((s) => {
  if (s.target === '#tour-page-admin-sector-recheck') return { ...s, content: s.content.replace(INTRO_OLD, INTRO_NEW) };
  if (s.target === '#tour-sector-recheck-status') return { ...s, content: `${s.content}${AUTO}` };
  if (s.target === '#tour-sector-recheck-review') return { ...s, content: `${s.content}${HIDE}` };
  return s;
});

// s125 Phase 4c: the Coach's new knobs, told in the same Agents step (it already describes the Coach).
const COACH_OLD = 'Each change is tested on your own decisions and kept only if it helps; press "Undo" to put one back.';
const COACH_NEW = 'It can also put a stage you keep passing on (for example idea-to-seed startups) last in every section, without hiding any; ease a minimum it raised when a section gets too thin; and, when you pass on most of what a priority shows, ask Scout to search again for that priority ("Searched"). Each change is tested on your own decisions and kept only if it helps; press "Undo" to put one back.';

// s125 Phase 4d: investors have the agent too (deal flow).
const WHO_OLD = 'For company accounts, your Innovation Agent runs all of these for you';
const WHO_NEW = 'For company and investor accounts, your Innovation Agent runs all of these for you';
const DEAL = ' For investors, its next moves include "Add to your deal pipeline" for a startup you shortlisted.';

// s125 Phase 4d (startups): "Requirements from corporates, government and defence" (renamed 1 Oct; was "Corporates looking for startups like you") on a startup's home page.
// The shared home tour gains one step; for other personas its target is absent and the tour skips it.
const home = pagesUniversal['/dashboard/home'];
const STARTUP_AGENT = { target: '#tour-startup-agent', title: 'Requirements from corporates, government and defence', content: 'For startups: the companies with open public challenges on OpenI that match what you do, grouped by company, each with why it matches and a link to apply. Below them, "From outside OpenI": defence problem statements, government grants and challenges, corporate innovation programmes and investor or accelerator calls that fit you, each labelled with who asks. OpenI\'s Programme Scout reads them every night from the publishers\' own sites and finds new programmes by itself; you apply on their site. Only calls open now are shown. "Weekly email" sends you the new ones on Mondays; untick it to stop.', placement: 'top', skipBeacon: true };

// s125 — Rajeev (1 Oct): "we can't download this page?" Told in the always-present first step.
const PDF = ' "Download PDF" (top right) saves this brief as a branded PDF to share or present; a startup\'s PDF lists its matching challenges and open calls.';

// s125 — "Run now" for the Programme Scout on Agent Runs (Rajeev, 1 Oct: "yes, add the Run now button").
const runs = pagesS122['/dashboard/admin/agent-runs'];
const SCOUT = { target: '#tour-programme-scout', title: 'Programme Scout', content: 'The agent that finds startup requirements from defence, government, corporates and investors. It runs by itself every night at 00:20 IST, reading official pages and finding new programmes on listing sites (always storing the programme\'s official page). "Run now" starts it straight away; its run appears in the list below when it finishes. "Show the pages it reads" lists every page, who asks, whether OpenI or the agent added it, and what it returned last time.', placement: 'bottom', skipBeacon: true };

export const pagesS125 = {
  '/dashboard/admin/agent-runs': { ...runs, steps: [...runs.steps, SCOUT] },
  '/dashboard/home': { ...home, steps: [...home.steps, STARTUP_AGENT] },
  '/dashboard/admin/sector-recheck': {
    ...sector,
    steps: sectorSteps,
  },
  '/dashboard/brief': {
    ...brief,
    // s125 — a startup's brief leads with its agent card (step skipped on other accounts' briefs, where it is absent).
    steps: brief.steps.flatMap(s => (s.target === '#tour-brief-agents' ? [{ ...s, content: `${s.content.replace(OLD, NEW).replace(COACH_OLD, COACH_NEW).replace(WHO_OLD, WHO_NEW)}${DEAL}` }]
      : s.target === '#tour-brief-stats' ? [s, STARTUP_AGENT]
        : s.target === '#tour-page-brief' ? [{ ...s, content: `${s.content}${PDF}` }] : [s])),
  },
};
