/**
 * s127 (3 Oct 2026) — applicant triage (AGENTIC_PLATFORM_PLAN G4; Rajeev: "finish balance agents"). A challenge's page
 * (/dashboard/corporate/challenges/:id) had no page tour; it gets one step on the Applications header, which is always
 * rendered once the challenge loads (with or without applicants). The fit badges and "Best fit first" appear only when
 * there are applicants, so this step describes them.
 * New module so the six split modules and the earlier S12x modules stay verbatim.
 */
export const pagesS127 = {
  '/dashboard/corporate/challenges/:id': {
    title: 'Your challenge',
    steps: [
      {
        target: '#tour-challenge-applicants',
        title: 'Applicants, best fit first',
        content: 'Every application gets a fit (Strong / Possible / Weak) with the reasons: how close the startup is to this challenge and what it shares with it. Your agent learns from you: once you shortlist or turn down applicants, new ones like them move up or down ("Like applicants you shortlisted"). "Best fit first" sorts the list by it. New applicants also appear in your morning Daily alerts. The fit never changes an application; the decisions stay yours.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
};
