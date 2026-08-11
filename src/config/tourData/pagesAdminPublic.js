/**
 * OpenI Hub - tours / pagesAdminPublic (Phase 162, 9 Aug 2026)
 *
 * Tour batch 9 and the every-page coverage pass: 9 admin surfaces, the
 * dashboard index, public pages, auth pages and shared-link pages.
 *
 * VERBATIM slice of the pre-split src/config/tours.js (2,022 lines), original
 * lines 1653-2003. The body below is byte-identical to the original, indentation
 * included - only this header, the `export const pagesAdminPublic = {` wrapper and the sentinels are new.
 * See ./index.js for the re-concat verification recipe and the invariants.
 */

export const pagesAdminPublic = {
// ─── BODY START (verbatim) ───
// --- lines 1653-2003 ---
  // ============================================================
  // Tour Batch 9 (28 May 2026) — Admin surfaces (9 routes)
  // FINAL batch — locked P0 (Joy Ride tours for entire platform) closed.
  // ============================================================
  '/dashboard/admin/console': {
    title: 'Admin Console',
    steps: [
      {
        target: '#tour-page-admin-console',
        title: 'Admin Console',
        content: 'Central admin hub. KPI tiles drill into User Management, Startup Data, and Challenge Moderation. Use the role breakdown to spot persona-mix anomalies.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/users': {
    title: 'User Management',
    steps: [
      {
        target: '#tour-page-admin-users',
        title: 'User Management',
        content: 'View every user, edit roles, override plans, disable, or delete. Use the search and role filter to triage support requests. Plan overrides take effect immediately.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/challenges': {
    title: 'Challenge Moderation',
    steps: [
      {
        target: '#tour-page-admin-challenges',
        title: 'Challenge Moderation',
        content: 'Review every challenge across personas. Set status, feature on Marketplace, or moderate problematic content. Filter by status to focus on open or pending review.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/startups': {
    title: 'Startup Data',
    steps: [
      {
        target: '#tour-page-admin-startups',
        title: 'Startup Data',
        content: 'Edit imported startup profiles before founders claim them. The Find Duplicates scanner surfaces same-entity collisions across the 575k-row directory substrate for merge or delete.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/licenses': {
    title: 'License Management',
    steps: [
      {
        target: '#tour-page-admin-licenses',
        title: 'License Management',
        content: 'Plan summary across Free / Pro / Enterprise tiers. Override subscription plans for individual users, manage organizations, or reset usage quotas mid-cycle.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/claims': {
    title: 'Profile Claims',
    steps: [
      {
        target: '#tour-page-admin-claims',
        title: 'Profile Claims',
        content: 'Founder claims to imported startup profiles. Review each claim and approve, reject, or roll back. Admin notes are required for rollbacks since they restore the imported placeholder.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/analytics': {
    title: 'Platform Analytics',
    steps: [
      {
        target: '#tour-page-admin-analytics',
        title: 'Platform Analytics',
        content: 'Platform-wide KPIs — total users, challenges, connections, organizations. Time-series shows signups by role. Plan distribution donut summarises subscription mix.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/costs': {
    title: 'Service Costs Watchdog',
    steps: [
      {
        target: '#tour-page-admin-costs',
        title: 'Service Costs Watchdog',
        content: 'Daily cost watchdog runs at 02:00 IST across Cloudinary, OpenAI, Vercel, Resend, BetterStack, Sentry. Manual entry for Railway. Threshold alerts email rajeev@openi.ai.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/dashboard/admin/platform-health': {
    title: 'Platform Health',
    steps: [
      {
        target: '#tour-page-admin-platform-health',
        title: 'Platform Health',
        content: 'Real-signup metrics (excludes 575k imported substrate). MTD and YTD revenue in INR plus USD. Churn signals (active subs, renewing 30d, expired). Refresh-on-load, no cron lag.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

  // ── Every-page coverage (dashboard index + public + auth + shared-link) ──
  // Single-step welcome tours. Anchor ids live on each page's main heading.
  // Dashboard index (the bare /dashboard landing — admins + transient loads see it).
  '/dashboard': {
    title: 'Your Dashboard',
    steps: [
      {
        target: '#tour-page-dashboard-index',
        title: 'Welcome to OpenI Hub',
        content: 'This is your home base. Use the left navigation to reach your tools — challenges, marketplace, profile, and more. The ? button up top replays this tour any time.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

  // Public pages
  '/': {
    title: 'Welcome',
    steps: [
      {
        target: '#tour-page-landing',
        title: 'Welcome to OpenI Hub',
        content: 'The open innovation marketplace for India\u2019s deep-tech ecosystem. Search startups, post challenges, and connect directly. Free to start.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/landing': {
    title: 'Welcome',
    steps: [
      {
        target: '#tour-page-landing',
        title: 'Welcome to OpenI Hub',
        content: 'The open innovation marketplace for India\u2019s deep-tech ecosystem. Search startups, post challenges, and connect directly. Free to start.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/marketplace': {
    title: 'Marketplace',
    steps: [
      {
        target: '#tour-page-marketplace',
        title: 'Innovation Marketplace',
        content: 'Browse open innovation challenges and opportunities posted across the ecosystem. Sign in to apply.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/reports': {
    title: 'Reports',
    steps: [
      {
        target: '#tour-page-reports',
        title: 'Curated Insights',
        content: 'Curated startup and sector reports. Filter by sector or technology to find what matters to you.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/faq': {
    title: 'FAQ',
    steps: [
      {
        target: '#tour-page-faq',
        title: 'Questions about OpenI Hub',
        content: 'Common questions about the platform, personas, and pricing. Still stuck? Reach us at info@openi.ai.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/search': {
    title: 'Global Search',
    steps: [
      {
        target: '#tour-page-search',
        title: 'Search the Ecosystem',
        content: 'Search 575,000+ startups and the wider ecosystem. Toggle AI Ask for natural-language queries.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

  // Auth pages
  '/register': {
    title: 'Get Started',
    steps: [
      {
        target: '#tour-page-register',
        title: 'Choose your persona',
        content: 'Pick the persona that fits you \u2014 startup, investor, corporate, and more. Your dashboard and tools adapt to your choice.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/forgot-password': {
    title: 'Reset Password',
    steps: [
      {
        target: '#tour-page-forgot-password',
        title: 'Forgot your password?',
        content: 'Enter your email and we\u2019ll send a secure reset link.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/reset-password/:token': {
    title: 'Reset Password',
    steps: [
      {
        target: '#tour-page-reset-password',
        title: 'Set a new password',
        content: 'Choose a strong new password to regain access to your account.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/verify-email': {
    title: 'Verify Email',
    steps: [
      {
        target: '#tour-page-verify-email',
        title: 'Verify your email',
        content: 'Confirm your email address to activate your account and unlock the platform.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/verify-email/:token': {
    title: 'Verify Email',
    steps: [
      {
        target: '#tour-page-verify-email',
        title: 'Verify your email',
        content: 'Confirm your email address to activate your account and unlock the platform.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

  // Shared-link pages (public, login-gated apply)
  '/challenges/share/:token': {
    title: 'Shared Challenge',
    steps: [
      {
        target: '#tour-page-share-challenge',
        title: 'Shared Challenge',
        content: 'Someone shared this innovation challenge with you. Sign in to apply or explore similar opportunities in the Marketplace.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/watchlists/share/:token': {
    title: 'Shared Watchlist',
    steps: [
      {
        target: '#tour-page-share-watchlist',
        title: 'Shared Watchlist',
        content: 'A curated list of startups shared with you. Create an account to build and share your own.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/share/startup/:token': {
    title: 'Startup Profile',
    steps: [
      {
        target: '#tour-page-share-startup',
        title: 'Shared Startup Profile',
        content: 'A startup profile shared with you. Sign in to connect or save it to a watchlist.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/share/student-portfolio/:token': {
    title: 'Student Portfolio',
    steps: [
      {
        target: '#tour-page-share-student-portfolio',
        title: 'Shared Student Portfolio',
        content: 'A student portfolio shared with you, showcasing projects and skills.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/share/deeptech/:token': {
    title: 'Deep-Tech Assessment',
    steps: [
      {
        target: '#tour-page-share-deeptech',
        title: 'Shared Deep-Tech Assessment',
        content: 'A deep-tech readiness assessment shared with you, with detailed answers across key dimensions.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/share/eight-vector-self/:token': {
    title: '8-Vector Profile',
    steps: [
      {
        target: '#tour-page-share-eight-vector-self',
        title: 'Shared 8-Vector Profile',
        content: 'An 8-Vector self-assessment shared with you, breaking down a startup across eight dimensions.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },
  '/share/program-evals/:token': {
    title: 'Program Evaluation',
    steps: [
      {
        target: '#tour-page-share-program-evals',
        title: 'Shared Program Evaluation',
        content: 'A program evaluation snapshot shared with you, with score breakdown and notes.',
        placement: 'bottom',
        skipBeacon: true,
      },
    ],
  },

// ─── BODY END ───
};
