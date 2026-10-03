/**
 * s127d (3 Oct 2026) — unwired-button sweep (Rajeev: "it's a live platform and we need to ensure good User
 * Experience"). Find Mentors lost its admin-only "Add Mentor" button (it did nothing; mentors are added by the OpenI
 * team), so the step that pointed at it would stall the tour. This entry replaces pagesActions.js's verbatim one.
 * New module so the six split modules stay verbatim.
 */
export const pagesS127d = {
  '/dashboard/mentors': {
    title: 'Mentors',
    steps: [
      {
        target: '#tour-page-mentors-header',
        title: 'Browse the mentor network',
        content: 'Mentors across academia, industry and defence. Search by name or expertise and filter by background. Open a mentor to send a message or request a session: they are emailed and accept it in Meetings.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
};
