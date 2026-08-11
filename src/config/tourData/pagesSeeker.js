/**
 * OpenI Hub - tours / pagesSeeker (Phase 162, 9 Aug 2026)
 *
 * Tour batches 7 and 8: the 14 remaining Innovation Seeker routes plus the
 * 11 universal long-tail routes.
 *
 * VERBATIM slice of the pre-split src/config/tours.js (2,022 lines), original
 * lines 1317-1652. The body below is byte-identical to the original, indentation
 * included - only this header, the `export const pagesSeeker = {` wrapper and the sentinels are new.
 * See ./index.js for the re-concat verification recipe and the invariants.
 */

export const pagesSeeker = {
// ─── BODY START (verbatim) ───
// --- lines 1317-1652 ---
  // ============================================================
  // Tour Batch 7 (28 May 2026) — Innovation Seeker remaining (14 routes)
  // Persona priority per user EOD: persona-facing > admin
  // ============================================================
  '/dashboard/investor/deal-requests': {
    title: 'Deal Sourcing Requests',
    steps: [
      {
        target: '#tour-page-investor-deal-requests',
        title: 'Deal Sourcing Requests',
        content: 'Post your investment thesis as a public request. Startups apply with their pitch + materials; you review applications and shortlist matches. Use New Request to publish a fresh thesis.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/incubator/mentors': {
    title: 'Mentor Pool',
    steps: [
      {
        target: '#tour-page-incubator-mentors',
        title: 'Mentor Pool',
        content: 'Your incubator\'s curated mentor roster. Add mentors with specific expertise, set availability windows, then assign them to startups in your programs. Active mentors get matched first.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/incubator/programs/:id': {
    title: 'Program Detail',
    steps: [
      {
        target: '#tour-page-incubator-program-detail',
        title: 'Program Detail',
        content: 'Detailed view of a single program — cohort startups, milestones, assigned mentors, and progress KPIs. Use the action panels to add members, schedule reviews, and track demo-day prep.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/accelerator/batches/:id': {
    title: 'Batch Detail',
    steps: [
      {
        target: '#tour-page-accelerator-batch-detail',
        title: 'Batch Detail',
        content: 'Detailed view of a single accelerator batch — enrolled startups, milestones, perk allocations, and demo-day status. Use Add Startup to onboard new members mid-batch.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/accelerator/partners': {
    title: 'Partnerships & Network',
    steps: [
      {
        target: '#tour-page-accelerator-partners',
        title: 'Partnerships & Network',
        content: 'Manage your corporate partners, investor network, and demo-day events from one surface. Switch tabs to add partners, invite investors, or schedule the next demo-day.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/program/service-partners': {
    title: 'Service Partners',
    steps: [
      {
        target: '#tour-page-program-service-partners',
        title: 'Service Partners',
        content: 'Curated network of legal, accounting, design, and infrastructure service partners for your portfolio startups. Add partners by category, attach perk values, and track which startups use which services.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/govt-apis': {
    title: 'Government API Integrations',
    steps: [
      {
        target: '#tour-page-govt-apis',
        title: 'Government API Integrations',
        content: 'Connect to central + state government databases (DPIIT, MCA, GST, Startup India) for one-click startup verification. Sync All refreshes every integration. Add Integration onboards new APIs.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/lab/bookings': {
    title: 'Equipment Bookings',
    steps: [
      {
        target: '#tour-page-lab-equipment-header',
        title: 'Equipment Bookings',
        content: 'View bookings of your lab equipment by startups and other researchers. Each booking has a time window, contact, and status. Switch to the Equipment tab to manage the underlying inventory.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/lab/announcements': {
    title: 'Facility Announcements',
    steps: [
      {
        target: '#tour-page-lab-announcements',
        title: 'Facility Announcements',
        content: 'Post open calls inviting startups to apply for your lab\'s facilities, equipment time, or programs. Use New Announcement to create one; published calls appear in the ecosystem\'s Lab Facility Calls feed.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/browse-facilities': {
    title: 'Lab Facility Calls',
    steps: [
      {
        target: '#tour-page-browse-facilities',
        title: 'Lab Facility Calls',
        content: 'Discover open calls from labs across the ecosystem inviting startups to apply for facility access. Search and open any call to view its details and apply.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/find-mentees': {
    title: 'Find Mentees',
    steps: [
      {
        target: '#tour-page-find-mentees',
        title: 'Find Mentees',
        content: 'Discover startups, students, and academics who have opted in to being mentored. Filter by persona, open a profile, and reach out to start a mentorship.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/sp/clients': {
    title: 'Active Clients',
    steps: [
      {
        target: '#tour-page-sp-services-header',
        title: 'Active Clients',
        content: 'Clients currently engaged on your services. Track engagement status, billing, and renewal dates. Switch to Services tab to manage your offerings or Reviews tab to see feedback.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/sp/reviews': {
    title: 'Reviews',
    steps: [
      {
        target: '#tour-page-sp-services-header',
        title: 'Reviews',
        content: 'Client reviews and ratings on your services. Use these as social proof on your public listing. Respond to reviews publicly to demonstrate engagement.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/student/certifications': {
    title: 'Certifications',
    steps: [
      {
        target: '#tour-page-student-portfolio-header',
        title: 'Certifications',
        content: 'Industry certifications, MOOCs, and courses you have completed. Adds credibility to your profile and helps mentors match you to startups needing your specific skills. Use Add to log a new certification.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/academia/grants': {
    title: 'Research Grants',
    steps: [
      {
        target: '#tour-page-academia-portfolio-header',
        title: 'Research Grants',
        content: 'Grants funding your research — agency, amount, period, and status. Helps surface IP-licensing opportunities for startups exploring your domain. Use Add to log a new grant.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/academia/publications': {
    title: 'Publications',
    steps: [
      {
        target: '#tour-page-academia-portfolio-header',
        title: 'Publications',
        content: 'Your published research — papers, patents, conference talks. Surfaces in startup discovery when corporates search for academic partners. Use Add to log a new publication.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },


  // ============================================================
  // Tour Batch 8 (28 May 2026) — Universal long-tail (11 routes)
  // Startup profile views + onboarding + org-admin + utilities
  // ============================================================
  '/dashboard/startup-profile': {
    title: 'Startup Profile',
    steps: [
      {
        target: '#tour-page-startup-profile',
        title: 'Startup Profile',
        content: 'Public-facing profile of a startup — header banner, financials, team, products, funding rounds, patents, clients, and recent news. Used by corporates and investors to evaluate. Share via the top-right Share button.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/startup-profile/:id': {
    title: 'Startup Profile',
    steps: [
      {
        target: '#tour-page-startup-profile',
        title: 'Startup Profile',
        content: 'Public-facing profile of a startup — header banner, financials, team, products, funding rounds, patents, clients, and recent news. Used by corporates and investors to evaluate. Share via the top-right Share button.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/startups/:id': {
    title: 'Startup Profile',
    steps: [
      {
        target: '#tour-page-startup-profile',
        title: 'Startup Profile',
        content: 'Public-facing profile of a startup — header banner, financials, team, products, funding rounds, patents, clients, and recent news. Used by corporates and investors to evaluate. Share via the top-right Share button.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/profile/:id': {
    title: 'User Profile',
    steps: [
      {
        target: '#tour-page-user-profile',
        title: 'User Profile',
        content: 'Public profile of another OpenI user. Shows their persona, organization, headline meta, and visible profile fields. Use Connect to request a connection — they will be notified.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/organization': {
    title: 'Organization',
    steps: [
      {
        target: '#tour-page-organization',
        title: 'Organization',
        content: 'Manage your organization\'s seats, members, and plan. Admins can invite new members, change roles, and view billing. Non-admins see read-only org details and current plan tier.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/onboarding': {
    title: 'Welcome to OpenI Hub',
    steps: [
      {
        target: '#tour-page-onboarding',
        title: 'Welcome to OpenI Hub',
        content: 'Guided onboarding for your persona — typically 5-7 steps from filling your profile to inviting your team. Progress bar tracks completion. Skippable, but completing all steps boosts your discoverability.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/features': {
    title: 'Feature Map',
    steps: [
      {
        target: '#tour-page-features',
        title: 'Feature Map',
        content: 'Explore every platform capability grouped by tier (Free / Pro / Enterprise). Locked features show what unlocks at higher tiers. Use Upgrade buttons to switch plans without leaving the page.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/pipeline': {
    title: 'Startup Pipeline',
    steps: [
      {
        target: '#tour-page-pipeline',
        title: 'Startup Pipeline',
        content: 'Kanban-style tracker for every startup in your pipeline — Application, Screening, Selected, Onboarded, Graduated, Rejected. Drag cards between stages or click for details. Search across all stages with the top-right search box.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/crawling': {
    title: 'Startup Crawling & Enrichment',
    steps: [
      {
        target: '#tour-page-crawling',
        title: 'Startup Crawling & Enrichment',
        content: 'Discover and enrich startup data from public sources — Crunchbase, AngelList, LinkedIn, official websites. Admin-only utility. Click Enrich Missing Data to batch-fill empty fields across the imported directory.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/roles/add': {
    title: 'Add another role',
    steps: [
      {
        target: '#tour-page-add-role',
        title: 'Add another role',
        content: 'OpenI Hub supports multiple personas per user — e.g. startup founder + mentor + investor. Add a new role to get a separate dashboard for that persona. Switch between roles using the tabs at the top of any dashboard page.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/register': {
    title: 'Startup Registration',
    steps: [
      {
        target: '#tour-page-register-startup',
        title: 'Startup Registration',
        content: 'Multi-step startup registration. Each step gates the next — fields marked * are mandatory. Step indicator at top shows progress. You can revisit completed steps to edit answers before final submission.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },


// ─── BODY END ───
};
