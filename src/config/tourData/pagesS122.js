/**
 * OpenI Hub - page tours for the s121/s122 surfaces (29 Sep 2026).
 *
 * Rajeev (29 Sep): "add joyride function for all new features. Our users are
 * using joyride from day one." A separate module rather than an edit to
 * pagesAdminPublic.js, so the six split modules stay verbatim for the
 * re-concat recipe in ./index.js (INVARIANT 3). Keys are new (grep-checked),
 * so spreading this LAST shadows nothing (INVARIANT 2).
 *
 * Every target is always rendered once the page has loaded: a step pointing at
 * something that appears only later (e.g. the Strategy map, which exists only
 * after a brief is built) would stall the tour, so those are described in the
 * nearest always-present step instead.
 */
export const pagesS122 = {
  '/dashboard/brief': {
    title: 'Innovation Brief',
    steps: [
      {
        target: '#tour-page-brief',
        title: 'Your Innovation Brief',
        content: 'Startups and opportunities picked for you from your profile and your open challenges. It re-ranks as you use it, and OpenI adds new matches every night.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-brief-stats',
        title: 'What changed',
        content: 'How many matches this brief holds, what is new since your last visit, and how many startups are on your shortlist.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-brief-priorities',
        title: 'Your priorities drive it',
        content: 'Switch a priority off, move it up, or add your own focus area. Shortlist or mark "Not relevant" on any card and the brief re-ranks straight away. A shortlisted startup is also saved to a watchlist named after the priority, e.g. "Innovation Brief — Retail media", ready to share.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-brief-taste',
        title: 'It learns from you',
        content: 'OpenI learns what you prefer from your shortlists and passes, and says so here in plain words. Keep what is right, press "Not me" on what is not. Your own priorities are never changed.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/brief-preview': {
    title: 'Brief Preview',
    steps: [
      {
        target: '#tour-page-admin-brief-preview',
        title: 'Brief Preview',
        content: 'See exactly the brief any client sees, or build one for a prospect with no account. Viewing saves nothing; 👍 / 👎 on a card measures accuracy.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-brief-preview-modes',
        title: 'A client or a prospect',
        content: 'Pick an existing account, or type a prospect\'s priorities (or draft them from public news with "Pain points"). Once the brief is built, "Show the strategy map" places every startup as Grow revenue, Cut cost / improve efficiency or Venture into adjacent markets, and says whether to partner with, source from or invest in it.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/agent-runs': {
    title: 'Agent Runs',
    steps: [
      {
        target: '#tour-page-admin-agent-runs',
        title: 'Agent Runs',
        content: 'Every run of OpenI\'s agents (pain brief, strategy map and the ones to come), step by step: what each step read, what it answered, the model, tokens, cost and time.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-agent-runs-summary',
        title: 'Health at a glance',
        content: 'How many runs finished OK and what they cost. Filter by status to find failed runs, then click a run to see which step went wrong.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
};
