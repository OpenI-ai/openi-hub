/**
 * OpenI Hub - tours / pagesCore (Phase 162, 9 Aug 2026)
 *
 * Ship #12 + the 22 May follow-up + the 27 May batch: profile, marketplace,
 * directory, corporate challenges/recommended/search, watchlist, messaging,
 * settings, clusters, evaluate, events.
 *
 * VERBATIM slice of the pre-split src/config/tours.js (2,022 lines), original
 * lines 324-611. The body below is byte-identical to the original, indentation
 * included - only this header, the `export const pagesCore = {` wrapper and the sentinels are new.
 * See ./index.js for the re-concat verification recipe and the invariants.
 */

export const pagesCore = {
// ─── BODY START (verbatim) ───
// --- lines 324-611 ---
  '/dashboard/profile': {
    title: 'My Profile',
    steps: [
      {
        target: '#tour-page-profile-header',
        title: 'Your profile, all in one place',
        content: 'This is your master profile. Everything you fill in here surfaces on directory listings, recommendations and challenge applications.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-profile-completeness',
        title: 'Profile Completeness',
        content: 'Aim for 80+ to be eligible for most challenges and surface in directory searches. Each section you complete adds to the score.',
        placement: 'left',
      },
      {
        target: '#tour-page-profile-save',
        title: 'Save Changes',
        content: 'The sticky Save bar at the bottom shows when you have unsaved edits. Click Save Profile to commit; the button turns gold when you have pending changes.',
        placement: 'top',
      },
    ],
  },
  // Ship #12 follow-up (22 May 2026 late evening) — 4 more page tours.
  '/dashboard/marketplace': {
    title: 'Innovation Marketplace',
    steps: [
      {
        target: '#tour-page-marketplace-header',
        title: 'Innovation Marketplace',
        content: 'This is where you discover open challenges from corporates, government bodies, investors and incubators. Anyone can apply if they match the brief.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-marketplace-tabs',
        title: 'Browse vs My Applications',
        content: 'Switch between browsing the live marketplace and tracking the applications you have already submitted. The My Applications view shows status and review feedback.',
        placement: 'left',
      },
      {
        target: '#tour-page-marketplace-search',
        title: 'Search and filter',
        content: 'Use the search bar for keywords and the Filters button for sector, technology, location and use-case. Save time by narrowing to the briefs that actually match your capabilities.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/directory': {
    title: 'Directory',
    steps: [
      {
        target: '#tour-page-directory-header',
        title: 'The OpenI Directory',
        content: 'Every innovator, mentor, investor, lab and partner on the platform lives here. Use this to discover, connect, and grow your network.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-directory-search',
        title: 'Search across the ecosystem',
        content: 'Type a name, organisation, or tagline. Press Search or Enter to query the catalogue. The dropdown next to it lets you sort by relevance, recency or alphabetical order.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-directory-filters',
        title: 'Refine by persona, location, sector',
        content: 'Click Filters to narrow by persona type (Startup, Investor, Mentor, etc.), geography (city/state), or sector/skill. Combine filters to find the right people fast.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/corporate/challenges': {
    title: 'Innovation Challenges',
    steps: [
      {
        target: '#tour-page-challenges-header',
        title: 'Your challenges, all in one place',
        content: 'Every challenge you launched lives here. Click any card to see the application queue, invite startups, manage RFI responses, and review submissions.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-challenges-new',
        title: 'Launch a new challenge',
        content: 'Click New Challenge to open the template picker. Start from a curated template (Defence, Healthcare, ClimateTech and more) or pick Blank to build from scratch. You can save as draft and publish later.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/corporate/recommended-startups': {
    title: 'Recommended Startups',
    steps: [
      {
        target: '#tour-page-recs-header',
        title: 'Curated for you',
        content: 'Startups matching your innovation areas, ranked by topical alignment and applied signal. We surface providers whose offerings overlap with what your organisation cares about.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-recs-basedon',
        title: 'Why these recommendations?',
        content: 'These tags show which of your interests we used to rank the list. Update your Innovation Areas in My Profile to change the recommendations you see.',
        placement: 'bottom',
      },
    ],
  },
  // ============================================================
  // Tour batch (27 May 2026) — 7 new page tours
  // Covers: Watchlist, Messaging (+ Notifications bell), Settings/Billing,
  // Innovation Map, 8-Vector Eval, Events, Corporate Search
  // ============================================================
  '/dashboard/watchlist': {
    title: 'Startup Watchlist',
    steps: [
      {
        target: '#tour-page-watchlist-header',
        title: 'Curate your startup watchlists',
        content: 'A watchlist is a saved list of startups you are tracking. Organize them by program, sector, or any theme that matters to you. Multiple watchlists per account.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-watchlist-create',
        title: 'Create a new watchlist',
        content: 'Click New Watchlist to start a fresh list. Pick a name, description, and visibility (Internal, Public, or Restricted). You can edit the metadata or delete the list later.',
        placement: 'left',
      },
      {
        target: '#tour-page-watchlist-add',
        title: 'Add startups to the active list',
        content: 'Click Add Startup to search the directory and add matches. Each row shows status and your score. Direct messaging is available on any startup whose founder has claimed their profile on OpenI.',
        placement: 'left',
      },
      {
        target: '#tour-page-watchlist-share',
        title: 'Share or export your watchlist',
        content: 'Generate a magic-link to share read-only access with people who do not have OpenI accounts, invite specific OpenI users as editors or viewers, or export the list as a PDF for offline review.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/messaging': {
    title: 'Messaging',
    steps: [
      {
        target: '#tour-page-messaging-header',
        title: 'Direct + group messaging',
        content: 'Every active OpenI user can be reached here. Use Messaging to coordinate on a challenge, exchange documents privately, or follow up after a meeting.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-messaging-new',
        title: 'Start a new conversation',
        content: 'Click New Conversation to message any active OpenI user. Pick Direct (1-to-1) or Group (multi-member with a name). Use the typeahead to find people by name or email.',
        placement: 'left',
      },
      {
        target: '#tour-page-messaging-composer',
        title: 'Compose + send',
        content: 'Type a message and press Enter to send. Shift+Enter for a new line. Your conversations sync in real time — the unread badge updates as new messages arrive.',
        placement: 'top',
      },
      {
        target: '#tour-topbar-bell',
        title: 'Don\u2019t miss a message',
        content: 'The bell in the top bar shows an unread badge whenever a new message arrives. It is also where Watchlist invitations, challenge invites, and meeting RSVPs surface.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/settings': {
    title: 'Settings',
    steps: [
      {
        target: '#tour-page-settings-current-plan',
        title: 'Your current plan',
        content: 'This card shows your active plan, billing cycle (Monthly or Annual), and next billing date. Free accounts have no billing date.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-settings-cycle',
        title: 'Monthly vs Annual',
        content: 'Toggle between Monthly and Annual billing cycles. Annual saves ~17% compared to month-to-month. The plan cards below update to reflect the cycle you select.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-settings-plans-grid',
        title: 'Compare and upgrade',
        content: 'Pick the plan that fits how you use OpenI. Upgrade or downgrade any time. Enterprise customers with non-India billing addresses are billed in USD via Razorpay automatically.',
        placement: 'top',
      },
    ],
  },
  '/dashboard/clusters': {
    title: 'Innovation Map',
    steps: [
      {
        target: '#tour-page-clusters-header',
        title: 'The OpenI Innovation Map',
        content: 'We cluster every startup in the OpenI directory into themes using semantic embeddings. Each theme groups startups working on similar problems — a map of where innovation is happening.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-clusters-grid',
        title: 'Drill into any theme',
        content: 'Click a theme card to see the startups inside it grouped by sector with a sub-group breakdown. Useful for scanning a category quickly or for finding adjacent startups to a known one.',
        placement: 'top',
      },
    ],
  },
  '/dashboard/evaluate': {
    title: '8-Vector Evaluation',
    steps: [
      {
        target: '#tour-page-8vector-header',
        title: 'OpenI 8-Vector framework',
        content: 'A structured rubric to evaluate a startup across 8 dimensions — People, Solution, Tech, Innovation, Scalability, Integration, Team, Strategic Fit. Free for all OpenI users.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-8vector-name',
        title: 'Who are you assessing?',
        content: 'Enter the startup name first. This is required to save the assessment. The same form is reusable across assessments — each save creates a new record under your account.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-8vector-save',
        title: 'Save your assessment',
        content: 'Click Save Assessment to persist your scoring. Once saved, the Share button appears so you can send a magic-link or PDF to a teammate. Pro tier adds AI-powered auto-fill.',
        placement: 'top',
      },
    ],
  },
  '/dashboard/events': {
    title: 'Events Repository',
    steps: [
      {
        target: '#tour-page-events-header',
        title: 'Ecosystem events',
        content: 'Workshops, demo days, conferences, and community events. Public events are visible to everyone; draft events stay visible only to the creator until published.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-events-create',
        title: 'Create an event',
        content: 'Available to corporates, government, investors, incubators, accelerators, and labs. Set the type, date, location (or Google Meet link), and audience. Save as draft first, publish when ready.',
        placement: 'left',
      },
      {
        target: '#tour-page-events-filters',
        title: 'Narrow by type or status',
        content: 'Filter by event type (Workshop, Demo Day, Conference, etc.) and status (Upcoming, Live, Completed). Search by title or tag for fast lookups.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/corporate/search': {
    title: 'Discover Startups',
    steps: [
      {
        target: '#tour-page-corp-search-header',
        title: 'Find startups for your innovation needs',
        content: 'Corporate-specific search across the OpenI directory. Browse startups, filter by sector and technology, start collaborations or open conversations directly.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-page-corp-search-filters',
        title: 'Refine with the taxonomy',
        content: 'Filter by sector, function, technology, use-case, and stage. Combine multiple filters to narrow to the exact innovation areas you care about.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-corp-search-results',
        title: 'Take action from any card',
        content: 'Click a startup to view the full profile. Or use Collab to kick off a tracked collaboration, and the chat icon to open a direct conversation.',
        placement: 'top',
      },
    ],
  },
// ─── BODY END ───
};
