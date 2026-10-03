/**
 * s127c (3 Oct 2026) — Disburse Grants (Rajeev: "pls finish this wire up, Govt needs it"). Two new pages: the
 * government body's /dashboard/government/grants and the startup's /dashboard/my-grants. Every step points at an
 * element rendered as soon as the page loads; the scheme view, award form and milestone actions appear later, so the
 * steps describe them. New module so the six split modules and the earlier S12x modules stay verbatim.
 */
export const pagesS127c = {
  '/dashboard/government/grants': {
    title: 'Disburse Grants',
    steps: [
      {
        target: '#tour-page-grants',
        title: 'Grants, recorded end to end',
        content: 'Your treasury pays each grant through PFMS or your bank. OpenI keeps the record: the scheme and its budget, each award, each milestone, and each payment with its date and reference. OpenI never moves money.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-grants-totals',
        title: 'Sanctioned and disbursed',
        content: 'Sanctioned is what you have awarded; disbursed is the payments you have recorded. Both add up across all your schemes.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-grants-new',
        title: 'Schemes, awards, milestones',
        content: 'Create a scheme with its budget, open it, and award a grant to any startup with an OpenI account. Split the grant into milestones (40/30/30 to start; change it freely). Milestones are released in order: the startup sends proof, you approve it, then record the payment with its UTR or PFMS reference. The startup is emailed at each step.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/my-grants': {
    title: 'My Grants',
    steps: [
      {
        target: '#tour-page-my-grants',
        title: 'Your grants, milestone by milestone',
        content: 'Grants a government body awarded you on OpenI. For your next milestone, send what you achieved (and a link to a report or demo); the funder approves it and records the payment, with its date and reference, here.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
};
