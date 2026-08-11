/**
 * OpenI Hub - tours / pagesActions (Phase 162, 9 Aug 2026)
 *
 * Tour batches 5 and 6: 15 cross-persona action surfaces plus the 5
 * per-persona recommendation surfaces.
 *
 * VERBATIM slice of the pre-split src/config/tours.js (2,022 lines), original
 * lines 1037-1316. The body below is byte-identical to the original, indentation
 * included - only this header, the `export const pagesActions = {` wrapper and the sentinels are new.
 * See ./index.js for the re-concat verification recipe and the invariants.
 */

export const pagesActions = {
// ─── BODY START (verbatim) ───
// --- lines 1037-1316 ---
  // ============================================================
  // Tour batch 5 (28 May 2026) — 15 cross-persona action surfaces
  // Discovery, registry, review, and detail pages visible across personas
  // ============================================================
  '/dashboard/startups': {
    title: 'Discover Startups',
    steps: [
      {
        target: '#tour-page-startups-header',
        title: 'The OpenI startup directory',
        content: 'Search 14,000+ startups across India. Useful for benchmarking, partnerships, deal sourcing, or finding collaboration targets.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-startups-filters',
        title: 'Filter by sector, stage, location, and more',
        content: 'Use the taxonomy filter bar to narrow by sector, technology, use case, function, and stage. Combine multiple filters to find exactly the startups you care about.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/students': {
    title: 'Source Students',
    steps: [
      {
        target: '#tour-page-students-header',
        title: 'Find student talent',
        content: 'Discover student innovators for internships, hackathons, research projects, and mentorship matching. Filter by city, state, graduation year, or skill.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/academia': {
    title: 'Source Academia',
    steps: [
      {
        target: '#tour-page-academia-header',
        title: 'Connect with universities + researchers',
        content: 'Find academic institutions and researchers for R&D collaborations, tech transfer, and student programs. Filter by institution type, location, and research area.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/mentors': {
    title: 'Mentors',
    steps: [
      {
        target: '#tour-page-mentors-header',
        title: 'Browse the mentor network',
        content: 'Onboarded mentors across academia, industry, and defence. Filter by expertise, availability, and rating. Send connection requests for active mentees.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-mentors-add',
        title: 'Add a mentor (admin)',
        content: 'Admins can add new mentors to the platform pool from here. Capture name, expertise areas, availability, and contact details.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/infrastructure': {
    title: 'Infrastructure & Test Facilities',
    steps: [
      {
        target: '#tour-page-infra-header',
        title: 'Browse OpenI labs + test facilities',
        content: 'Discover equipment and test infrastructure at partner labs. Book time slots, file requests, and track active bookings. Useful for startups needing specialised facilities.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/ipr': {
    title: 'IPR Database',
    steps: [
      {
        target: '#tour-page-ipr-header',
        title: 'Patents, trademarks, and IP records',
        content: 'Admins see the full OpenI IPR Database. Org personas see only IP linked to their organisation. Filter by type, status, or owner.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/deeptech': {
    title: 'DeepTech Qualification',
    steps: [
      {
        target: '#tour-page-deeptech-header',
        title: 'Qualify startups as DeepTech',
        content: 'A structured assessment across 5 dimensions (Tech Depth, Innovation, Team, Defence Readiness, Scalability). Useful for grant applications and DPIIT DeepTech eligibility.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-deeptech-assess',
        title: 'Start a new assessment',
        content: 'Click New Assessment to open the 16-question form. Auto-fills startup name from your profile. Save partial answers and return later if needed.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/feedback': {
    title: 'Startup Feedback',
    steps: [
      {
        target: '#tour-page-feedback-header',
        title: 'Track startup feedback on OpenI programs',
        content: 'Collect structured feedback from startups in your programs. View aggregate analytics or open the Submit form to log a new feedback entry.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/evaluations': {
    title: 'Evaluation Programs',
    steps: [
      {
        target: '#tour-page-evaluations-header',
        title: 'Manage evaluation programs',
        content: 'Run challenges, incubation calls, and startup evaluation workflows. Track applications, selected startups, and program lifecycle.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-evaluations-create',
        title: 'Launch a new program',
        content: 'Click New Program to create. Set criteria, deadlines, evaluation rubric, and invited reviewers. Publish to start accepting applications.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/cohorts': {
    title: 'Incubation Cohorts',
    steps: [
      {
        target: '#tour-page-cohorts-header',
        title: 'Manage incubation cohorts',
        content: 'Track startup incubation batches across DIA-CoEs and partner incubators. Monitor active members, graduated startups, and outcomes.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-cohorts-create',
        title: 'Start a new cohort',
        content: 'Click New Cohort to set up a fresh batch. Capture dates, lead incubator, equity terms, mentor pool assignments, and startup roster.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/challenge-invites': {
    title: 'Invited Challenges',
    steps: [
      {
        target: '#tour-page-invites-header',
        title: 'Private challenge invitations',
        content: 'Challenges you have been personally invited to apply to (not listed on the public Challenges page). Accept to open the apply form, decline to remove from this list.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/challenges-to-review': {
    title: 'Challenges to Review',
    steps: [
      {
        target: '#tour-page-review-queue-header',
        title: 'Your review queue',
        content: 'Challenges where you have been added as a reviewer, viewer, or editor. Click any card to open the challenge detail and review submitted applications.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/claims': {
    title: 'My Profile Claims',
    steps: [
      {
        target: '#tour-page-claims-header',
        title: 'Track your imported-profile claims',
        content: 'If your company was already in our directory before you signed up, we help you claim ownership. This page tracks the status of every claim you have submitted.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/clusters/:id': {
    title: 'Innovation Theme',
    steps: [
      {
        target: '#tour-page-cluster-detail-header',
        title: 'Theme deep-dive',
        content: 'See the startups grouped under this theme by sector, the avg profile score, and sub-group breakdowns. Useful for finding startups adjacent to one you already know.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/corporate/collabs': {
    title: 'Collaborations',
    steps: [
      {
        target: '#tour-page-collabs-header',
        title: 'Track active collaborations',
        content: 'Every active collaboration with startups — kanban-style across stages (Outreach, Discovery, Proof-of-Concept, Paid Pilot, Production). Drag between stages or click any card to drill in.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

  // ============================================================
  // Tour Batch 6 (28 May 2026) — Recommendation surfaces (5 personas)
  // ============================================================
  '/dashboard/investor/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for you',
        content: 'Startups matching your focus sectors and investment thesis, ranked by topical alignment. Update Focus Sectors and Looking For in My Profile to change the recommendations you see.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/incubator/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for cohort fit',
        content: 'Startups matching your incubator\'s focus sectors, ranked for cohort fit. Update Focus Sectors in My Profile to refine the recommendations.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/accelerator/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for batch fit',
        content: 'Startups matching your accelerator\'s focus sectors, ranked for batch fit. Update Focus Sectors in My Profile to refine the recommendations.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/student/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for your skills',
        content: 'Startups matching your research areas and skills, ranked by topical alignment. Update Research Areas and Skills in My Profile to refine the recommendations.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/academia/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for partnership',
        content: 'Startups matching your research areas and what you offer to industry, ranked by topical alignment. Update Research Areas and Industry Offerings in My Profile to refine the recommendations.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },


// ─── BODY END ───
};
