/**
 * P4 — UI Walkthroughs: per-persona step definitions for react-joyride.
 *
 * Each tour has 10–15 steps. Step shape:
 *   {
 *     target:  '#tour-anchor-id',  // CSS selector; matches anchors added in PersonaDashboard / CorporateDashboard / DashboardLayout
 *     title:   'Short heading',     // shown bold at the top of the tooltip
 *     content: 'One or two sentences of guidance.',
 *     placement: 'bottom' | 'top' | 'right' | 'left' | 'auto',
 *     route:   '/dashboard/...'    // OPTIONAL — TourWrapper navigates to this route before the step shows
 *     disableBeacon: true          // applied to all first steps automatically
 *   }
 *
 * Conventions:
 *  - Anchor IDs prefixed `tour-` (avoid collision with anything else).
 *  - Sidebar nav anchors: `tour-nav-{slug}` where slug is the lowercased label
 *    with non-alphanumerics replaced by `-`. DashboardLayout adds these
 *    automatically on every NavLink render.
 *  - Topbar anchors: `tour-topbar-{name}` (notifications, profile, take-tour).
 *  - PersonaDashboard / CorporateDashboard anchors: `tour-{section}` (welcome,
 *    stat-cards, profile-score, quick-actions, ai-card, recent-applications, …).
 *
 * To add a step that lives on a different page (e.g. show the IPR page during
 * the startup tour), set `route: '/dashboard/ipr'` and target an element on
 * that page (e.g. `#tour-ipr-add-button`). TourWrapper handles the navigate +
 * brief pause for render.
 */

// Helpers ---------------------------------------------------------------
const navTarget = (slug) => `#tour-nav-${slug}`;

// Title styling is applied via styles in TourWrapper; we just set a plain
// string here for `content`. If you want a heading + body, use `title` + `content`.

// ── STARTUP — 15 steps ──────────────────────────────────────────────────
const startupSteps = [
  {
    target: '#tour-welcome',
    title: 'Welcome to OpenI Hub',
    content: 'You are signed in as a Startup. This quick tour will walk you through the key tools available to grow your venture.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#tour-stat-cards',
    title: 'Your Key Metrics',
    content: 'These cards summarise your active applications, projects, mentor sessions, IPR and DeepTech qualification at a glance.',
    placement: 'bottom',
  },
  {
    target: '#tour-profile-score',
    title: 'Profile Completeness & AI Score',
    content: 'A complete, well-written profile is what surfaces you to corporates and investors. The AI Insights card tells you exactly what to improve.',
    placement: 'top',
  },
  {
    target: '#tour-quick-actions',
    title: 'Quick Actions',
    content: 'Jump straight to the most-used flows: browse challenges, find investors, find labs, add IPR.',
    placement: 'top',
  },
  {
    target: navTarget('marketplace'),
    title: 'Marketplace — Open Challenges',
    content: 'Discover live RFPs and innovation challenges from corporates and government bodies. Apply directly here.',
    placement: 'right',
  },
  {
    target: navTarget('startups'),
    title: 'Discover Other Startups',
    content: 'Search 14,000+ startups across India. Useful for benchmarking, partnerships, and competitive analysis.',
    placement: 'right',
  },
  {
    target: navTarget('ipr'),
    title: 'Manage Your IPR',
    content: 'Record patents, trademarks and copyrights. IPR records boost your DeepTech qualification score.',
    placement: 'right',
  },
  {
    target: navTarget('infrastructure'),
    title: 'Find Lab & Test Infrastructure',
    content: 'Need access to specialised equipment? Browse partner labs, file requests, and book time slots.',
    placement: 'right',
  },
  {
    target: navTarget('deeptech-qual'),
    title: 'DeepTech Qualification',
    content: 'A self-assessment tool that scores your venture against the official DeepTech criteria — useful for grant applications.',
    placement: 'right',
  },
  {
    target: navTarget('my-network'),
    title: 'Your Network',
    content: 'Connect with mentors, investors, corporates and other founders. Accepted connections unlock direct messaging.',
    placement: 'right',
  },
  {
    target: navTarget('messaging'),
    title: 'Messaging',
    content: 'Direct messages with anyone in your network — corporates evaluating your application, mentors, investors.',
    placement: 'right',
  },
  {
    target: navTarget('meetings'),
    title: 'Schedule Meetings',
    content: 'Send and accept meeting invites with built-in scheduling. Integrates with your calendar.',
    placement: 'right',
  },
  {
    target: navTarget('my-claims'),
    title: 'Claim Your Listing',
    content: 'If your startup was already in our database before you signed up, claim the listing here to take ownership and edit it.',
    placement: 'right',
  },
  {
    target: navTarget('my-profile'),
    title: 'Edit Your Profile',
    content: 'Keep your tech stack, funding round, awards and team info up to date. Edits trigger AI re-scoring within 5 minutes.',
    placement: 'right',
  },
  {
    target: '#tour-topbar-take-tour',
    title: 'You can replay this anytime',
    content: 'Click this icon in the top bar whenever you want to revisit the tour. Good luck building!',
    placement: 'bottom',
  },
];

// ── STUDENT — 11 steps ──────────────────────────────────────────────────
const studentSteps = [
  { target: '#tour-welcome',                       title: 'Welcome, Student',         content: 'This tour shows you how to build a great academic profile and connect with startups, mentors and corporate challenges.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',                    title: 'Your Activity',            content: 'Track your projects, certifications, applications and active mentorships at a glance.', placement: 'bottom' },
  { target: '#tour-profile-score',                 title: 'Build a Standout Profile', content: 'A complete profile with projects and skills gets noticed faster. Aim for 80+ on the completeness score.', placement: 'top' },
  { target: '#tour-quick-actions',                 title: 'Quick Actions',            content: 'Add a project, browse open challenges or find a mentor — all from this panel.', placement: 'top' },
  { target: navTarget('my-portfolio'),             title: 'Your Portfolio',           content: 'Add projects, certifications and achievements. This is what corporates see when they search.', placement: 'right' },
  { target: navTarget('mentorships'),              title: 'Mentorships',              content: 'Browse and request mentors who match your interests. Active mentorships appear here.', placement: 'right' },
  { target: navTarget('marketplace'),              title: 'Open Challenges',          content: 'Many corporates run challenges open to students. Filter by sector and apply individually or as a team.', placement: 'right' },
  { target: navTarget('startups'),                 title: 'Discover Startups',        content: 'Looking for an internship or thesis collaboration? Search startups by domain and reach out directly.', placement: 'right' },
  { target: navTarget('recommended-for-you'),     title: 'Recommended for You',      content: 'Personalised startup recommendations based on your research areas and skills. The "+N theme" badge means we lifted that startup up the list because it matches your spot on the Innovation Map.', placement: 'right' },
  { target: navTarget('watchlist'),                title: 'Save for Later',           content: 'Bookmark startups, mentors or challenges you want to revisit. Watchlist syncs across devices.', placement: 'right' },
  { target: '#tour-topbar-take-tour',              title: 'Replay anytime',           content: 'Click this icon to revisit the tour whenever you want.', placement: 'bottom' },
];

// ── ACADEMIA — 12 steps ─────────────────────────────────────────────────
const academiaSteps = [
  { target: '#tour-welcome',                       title: 'Welcome, Academic',        content: 'OpenI Hub helps universities and research institutes connect with startups, file IPR, track grants and run programs.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',                    title: 'Your Research Activity',   content: 'Active research projects, publications, grants, applications, lab bookings — all surfaced here.', placement: 'bottom' },
  { target: '#tour-profile-score',                 title: 'Institutional Profile',    content: 'Complete your institution profile so startups and funders can find you. Higher completeness = better discoverability.', placement: 'top' },
  { target: '#tour-quick-actions',                 title: 'Quick Actions',            content: 'Add research, publications, grants in one click.', placement: 'top' },
  { target: navTarget('research'),                 title: 'Research Projects',        content: 'Manage all your active and completed research projects with collaborators, funding and outputs.', placement: 'right' },
  { target: navTarget('publications'),             title: 'Publications',             content: 'Track your published papers with citation counts and DOI. Boosts your profile score.', placement: 'right' },
  { target: navTarget('grants'),                   title: 'Grants',                   content: 'Manage active grants — total value, duration, sponsor and milestones.', placement: 'right' },
  { target: navTarget('ipr-database'),             title: 'IPR Database',             content: 'Record patents, copyrights and trademarks owned by your institution.', placement: 'right' },
  { target: navTarget('marketplace'),              title: 'Industry Challenges',      content: 'Corporates often partner with academia on RFPs. Browse open challenges and apply.', placement: 'right' },
  { target: navTarget('startups'),                 title: 'Find Startups',            content: 'Discover startups for collaboration, mentoring or industry-academic projects.', placement: 'right' },
  { target: navTarget('recommended-for-you'),     title: 'Recommended for You',      content: 'Personalised startup recommendations based on your research areas and offerings. We bridge your research focus to the closest themes on the Innovation Map — the "+N theme" badge shows how much that match lifted the row.', placement: 'right' },
  { target: '#tour-topbar-take-tour',              title: 'Replay anytime',           content: 'You can replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── CORPORATE — 12 steps ────────────────────────────────────────────────
const corporateSteps = [
  { target: '#tour-welcome',                  title: 'Welcome, Corporate',         content: 'OpenI Hub helps you discover startups, run innovation challenges, and manage open-innovation collaborations.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-corp-pipeline',            title: 'Collaboration Pipeline',     content: 'Active collaborations across all stages — from outreach to signed Proof-of-Concept agreements — visible right here.', placement: 'bottom' },
  { target: '#tour-corp-applications',        title: 'Recent Applications',        content: 'Latest startup applications to your live challenges. Click any row to open the full application + reviews panel.', placement: 'bottom' },
  { target: '#tour-corp-recommended',         title: 'AI-Recommended Startups',    content: 'Our AI matches startups to your sector, focus areas and corporate strategy. Refreshed weekly.', placement: 'top' },
  { target: navTarget('find-startups'),       title: 'Search 14,000+ Startups',    content: 'Powerful filters: sector, stage, location, funding, tech stack. Save searches for repeat use.', placement: 'right' },
  { target: navTarget('challenges'),          title: 'Run Innovation Challenges',  content: 'Post a challenge or RFP, invite reviewers via Collaborators, score applications via the Reviews panel.', placement: 'right' },
  { target: navTarget('collaborations'),      title: 'Track Collaborations',       content: 'Proof-of-Concept agreements, paid pilots, pilots-to-production — manage every active collaboration with milestones and budget.', placement: 'right' },
  { target: navTarget('watchlist'),           title: 'Watchlist',                  content: 'Bookmark startups for later. Watchlists are private to you (and your colleagues if shared).', placement: 'right' },
  { target: navTarget('projects'),            title: 'Projects',                   content: 'Project management for active engagements. Track tasks, owners, deadlines, deliverables.', placement: 'right' },
  { target: navTarget('directory'),           title: 'Directory',                  content: 'Cross-persona search — find investors, government bodies, accelerators, mentors.', placement: 'right' },
  { target: navTarget('meetings'),            title: 'Meetings',                   content: 'Schedule with anyone in your network. Booked meetings sync to your calendar.', placement: 'right' },
  { target: '#tour-topbar-take-tour',         title: 'Replay anytime',             content: 'The tour is always available from the top bar.', placement: 'bottom' },
];

// ── GOVERNMENT — 12 steps ──────────────────────────────────────────────
const governmentSteps = [
  { target: '#tour-welcome',              title: 'Welcome, Government',         content: 'Use OpenI Hub to discover and track innovative startups, post RFPs, manage programs and integrate with public APIs.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',           title: 'Your Coverage',               content: 'Tracked startups, DeepTech ventures, active programs, open challenges and unicorn candidates — all visible here.', placement: 'bottom' },
  { target: '#tour-quick-actions',        title: 'Quick Actions',               content: 'Post a challenge/RFP, discover startups, manage programs in one click.', placement: 'top' },
  { target: navTarget('challenges-rfps'), title: 'Challenges & RFPs',           content: 'Post structured RFPs with criteria, deadlines and budgets. Invite reviewers and track applications.', placement: 'right' },
  { target: navTarget('find-startups'),   title: 'Discover Startups',           content: 'Filter the database by DPIIT status, sector, deeptech qualification, location, founder demographics and more.', placement: 'right' },
  { target: navTarget('programs'),        title: 'Programs',                    content: 'Run multi-stage programs (Mentorship, Pre-incubation, Funding). Track cohorts and outcomes.', placement: 'right' },
  { target: navTarget('cohorts'),         title: 'Cohorts',                     content: 'Cohort-level analytics: total funding, employment created, IPR filed, current stages.', placement: 'right' },
  { target: navTarget('projects'),        title: 'Projects',                    content: 'Active projects across your programs — tasks, owners, deliverables, status.', placement: 'right' },
  { target: navTarget('govt-apis'),       title: 'Govt. API Integrations',      content: 'Connect MCA, GST, Udyam, DPIIT, ITR APIs to auto-verify startups during program intake.', placement: 'right' },
  { target: navTarget('watchlist'),       title: 'Watchlist',                   content: 'Bookmark startups of strategic interest for follow-up.', placement: 'right' },
  { target: navTarget('directory'),       title: 'Directory',                   content: 'Cross-persona search across investors, corporates, accelerators and academic institutions.', placement: 'right' },
  { target: '#tour-topbar-take-tour',     title: 'Replay anytime',              content: 'You can replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── INVESTOR — 13 steps ────────────────────────────────────────────────
const investorSteps = [
  { target: '#tour-welcome',                 title: 'Welcome, Investor',         content: 'Use OpenI Hub to source deals, manage your pipeline, track portfolio companies and run deal-screening reviews.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',              title: 'Your Activity',             content: 'Active deals, watchlists and tracked startups — at a glance.', placement: 'bottom' },
  { target: '#tour-quick-actions',           title: 'Quick Actions',             content: 'Open your deal pipeline, portfolio or browse startups directly from here.', placement: 'top' },
  { target: navTarget('deal-pipeline'),      title: 'Deal Pipeline',             content: 'Kanban-style pipeline of deals from sourced → diligence → term-sheet → closed. Drag-drop between stages.', placement: 'right' },
  { target: navTarget('portfolio'),          title: 'Portfolio',                 content: 'Your invested startups with current valuation, last update, board observers and follow-on opportunities.', placement: 'right' },
  { target: navTarget('deal-sourcing'),      title: 'Deal Sourcing',             content: 'Post deal requests publicly. Startups self-apply with their pitch deck and metrics. Each request supports collaborator reviews.', placement: 'right' },
  { target: navTarget('find-startups'),      title: 'Find Startups',             content: 'Filter 14,000+ startups by stage, sector, recurring revenue, tech, geography. AI surfaces best fits to your thesis.', placement: 'right' },
  { target: navTarget('marketplace'),        title: 'Marketplace',               content: 'Browse open challenges and RFPs — useful for understanding what corporates are buying, signalling validation.', placement: 'right' },
  { target: navTarget('deeptech'),           title: 'DeepTech Index',            content: 'Browse startups scored against DeepTech criteria — Tech Readiness Level, intellectual property, talent, capital intensity. Useful for thesis-fit.', placement: 'right' },
  { target: navTarget('watchlist'),          title: 'Watchlist',                 content: 'Bookmark candidates pre-pipeline. Set reminders to revisit.', placement: 'right' },
  { target: navTarget('my-network'),         title: 'Your Network',              content: 'Co-investors, founders, advisors, mentors. Accepted connections unlock messaging and shared deal-rooms.', placement: 'right' },
  { target: navTarget('meetings'),           title: 'Meetings',                  content: 'Schedule pitch meetings with founders directly. Auto-syncs to calendar.', placement: 'right' },
  { target: '#tour-topbar-take-tour',        title: 'Replay anytime',            content: 'The tour is always available from the top bar.', placement: 'bottom' },
];

// ── MENTOR — 10 steps ──────────────────────────────────────────────────
const mentorSteps = [
  { target: '#tour-welcome',           title: 'Welcome, Mentor',          content: 'OpenI Hub connects you with startups, students and academic researchers who need your guidance.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',        title: 'Your Mentees',             content: 'Active mentees, total sessions, tracked projects and feedback given — all surfaced here.', placement: 'bottom' },
  { target: '#tour-quick-actions',     title: 'Quick Actions',            content: 'Browse startups, jump to your projects or give feedback in one click.', placement: 'top' },
  { target: navTarget('sessions'),     title: 'Mentor Sessions',          content: 'Manage past and upcoming mentor sessions. Add notes, track outcomes, schedule follow-ups.', placement: 'right' },
  { target: navTarget('availability'), title: 'Set Your Availability',    content: 'Tell mentees when you are free. Slots are bookable — saves the back-and-forth.', placement: 'right' },
  { target: navTarget('startups'),     title: 'Browse Startups',          content: 'Looking for new mentees? Filter startups by sector, stage and your area of expertise.', placement: 'right' },
  { target: navTarget('projects'),     title: 'Projects',                 content: 'Track ongoing projects with your mentees — tasks, deadlines, deliverables.', placement: 'right' },
  { target: navTarget('feedback'),     title: 'Give Feedback',            content: 'Provide structured feedback on startups you have evaluated or mentored. Helps the platform surface mentor signal.', placement: 'right' },
  { target: navTarget('messaging'),    title: 'Messaging',                content: 'Direct messages with your mentees and other connections.', placement: 'right' },
  { target: '#tour-topbar-take-tour',  title: 'Replay anytime',           content: 'Click this icon in the top bar to revisit the tour.', placement: 'bottom' },
];

// ── LAB — 10 steps ─────────────────────────────────────────────────────
const labSteps = [
  { target: '#tour-welcome',           title: 'Welcome, Lab',             content: 'OpenI Hub helps your lab list equipment, manage bookings, file IPR and connect with startups needing infra access.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',        title: 'Your Capacity',            content: 'Equipment count, active bookings, IPR records and current capacity — at a glance.', placement: 'bottom' },
  { target: '#tour-quick-actions',     title: 'Quick Actions',            content: 'Manage infrastructure, IPR or browse startups in one click.', placement: 'top' },
  { target: navTarget('equipment'),    title: 'Equipment Catalog',        content: 'Add and manage your equipment listings. Each item has specs, location, hourly rate and availability calendar.', placement: 'right' },
  { target: navTarget('bookings'),     title: 'Booking Management',       content: 'Approve or decline incoming booking requests. Manage your slot schedule.', placement: 'right' },
  { target: navTarget('publications'), title: 'Publications',             content: 'List your lab publications and patents. Boosts profile visibility for collaboration.', placement: 'right' },
  { target: navTarget('ipr-database'), title: 'IPR Database',             content: 'Record patents and copyrights owned by your lab. Useful for licensing conversations with startups.', placement: 'right' },
  { target: navTarget('startups'),     title: 'Find Startups',            content: 'Discover startups in your domain who may need your equipment or collaboration.', placement: 'right' },
  { target: navTarget('directory'),    title: 'Directory',                content: 'Cross-persona search — find corporates, govt bodies and academic institutions for partnerships.', placement: 'right' },
  { target: '#tour-topbar-take-tour',  title: 'Replay anytime',           content: 'Replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── INCUBATOR — 12 steps ───────────────────────────────────────────────
const incubatorSteps = [
  { target: '#tour-welcome',                 title: 'Welcome, Incubator',         content: 'Run your incubation programs, manage your mentor pool, and source startups — all from here.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',              title: 'Your Programs at a Glance',  content: 'Total/active programs, pipeline startups, pending applications, graduated cohorts and active mentors.', placement: 'bottom' },
  { target: '#tour-quick-actions',           title: 'Quick Actions',              content: 'Manage programs, the mentor pool, or discover startups directly from this panel.', placement: 'top' },
  { target: navTarget('programs'),           title: 'Programs',                   content: 'Create, edit and run your incubation programs. Each program supports cohorts, applications, milestones, equity terms.', placement: 'right' },
  { target: navTarget('mentor-pool'),        title: 'Mentor Pool',                content: 'Manage your mentor roster. Assign mentors to specific programs or startups.', placement: 'right' },
  { target: navTarget('service-partners'),   title: 'Service Partners',           content: 'Legal, accounting, design, cloud credits — manage your service partner ecosystem your portfolio benefits from.', placement: 'right' },
  { target: navTarget('find-startups'),      title: 'Find Startups',              content: 'Source candidates for upcoming programs. Filter by sector, stage, geography and DeepTech score.', placement: 'right' },
  { target: navTarget('find-students'),      title: 'Find Students',              content: 'Source student innovators for pre-incubation programs.', placement: 'right' },
  { target: navTarget('find-academia'),      title: 'Find Academia',              content: 'Partner with academic institutions for research-driven incubation tracks.', placement: 'right' },
  { target: navTarget('projects'),           title: 'Projects',                   content: 'Track active projects across your portfolio with milestones and outcomes.', placement: 'right' },
  { target: navTarget('directory'),          title: 'Directory',                  content: 'Cross-persona search — find corporates, investors, govt bodies for ecosystem partnerships.', placement: 'right' },
  { target: '#tour-topbar-take-tour',        title: 'Replay anytime',             content: 'You can replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── ACCELERATOR — 12 steps ─────────────────────────────────────────────
const acceleratorSteps = [
  { target: '#tour-welcome',                  title: 'Welcome, Accelerator',       content: 'Run your batches, manage your partner network, and source the best startups for the next cohort.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',               title: 'Your Batches',               content: 'Total/active batches, pipeline startups, graduated, corporate partners and investor network.', placement: 'bottom' },
  { target: '#tour-quick-actions',            title: 'Quick Actions',              content: 'Manage batches, partners and discover startups in one click.', placement: 'top' },
  { target: navTarget('batches'),             title: 'Manage Batches',             content: 'Create cohorts with start/end dates, batch leads, equity terms, milestones and Demo Day planning.', placement: 'right' },
  { target: navTarget('partners-network'),    title: 'Partners & Network',         content: 'Manage your corporate partners and investor network. These are the relationships that make your accelerator valuable.', placement: 'right' },
  { target: navTarget('service-partners'),    title: 'Service Partners',           content: 'Legal, design, cloud credits, recruiting — track service partners your portfolio benefits from.', placement: 'right' },
  { target: navTarget('find-startups'),       title: 'Source Startups',            content: 'Discover and shortlist startups for upcoming batches. Save filters and bookmarks.', placement: 'right' },
  { target: navTarget('find-students'),       title: 'Find Students',              content: 'Source student talent for hackathons, pre-acceleration or talent matching.', placement: 'right' },
  { target: navTarget('find-academia'),       title: 'Find Academia',              content: 'Partner with universities for research, tech transfer and student programs.', placement: 'right' },
  { target: navTarget('watchlist'),           title: 'Watchlist',                  content: 'Bookmark candidates pre-application. Useful for proactive outreach next cohort.', placement: 'right' },
  { target: navTarget('projects'),            title: 'Projects',                   content: 'Active projects with portfolio companies — tasks, deadlines, KPIs.', placement: 'right' },
  { target: '#tour-topbar-take-tour',         title: 'Replay anytime',             content: 'You can replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── SERVICE PROVIDER — 10 steps ────────────────────────────────────────
const serviceProviderSteps = [
  { target: '#tour-welcome',          title: 'Welcome, Service Provider',  content: 'OpenI Hub helps service providers — legal, design, cloud, marketing — connect with the startup ecosystem.', placement: 'bottom', disableBeacon: true },
  { target: '#tour-stat-cards',       title: 'Your Activity',              content: 'Services offered, active client connections and certifications — at a glance.', placement: 'bottom' },
  { target: '#tour-quick-actions',    title: 'Quick Actions',              content: 'Browse open challenges, find startups or manage your services from this panel.', placement: 'top' },
  { target: navTarget('my-services'), title: 'My Services',                content: 'Add and edit your service offerings. Each service has a category, pricing model, deliverables and SLA.', placement: 'right' },
  { target: navTarget('clients'),     title: 'Client Management',          content: 'Track active and past clients. Add notes, log interactions and manage renewals.', placement: 'right' },
  { target: navTarget('reviews'),     title: 'Reviews & Ratings',          content: 'See reviews from your clients and respond. Higher ratings boost visibility in startup search.', placement: 'right' },
  { target: navTarget('marketplace'), title: 'Marketplace',                content: 'Browse open RFPs and challenges that need service providers. Apply directly.', placement: 'right' },
  { target: navTarget('find-startups'),title: 'Find Startups',             content: 'Discover startups by sector and stage who likely need your services.', placement: 'right' },
  { target: navTarget('directory'),   title: 'Directory',                  content: 'Cross-persona search — find investors, corporates, incubators for partnerships.', placement: 'right' },
  { target: '#tour-topbar-take-tour', title: 'Replay anytime',             content: 'Replay this tour any time from the top bar.', placement: 'bottom' },
];

// ── Export ──────────────────────────────────────────────────────────────
export const TOURS = {
  startup:           { steps: startupSteps },
  student:           { steps: studentSteps },
  academia:          { steps: academiaSteps },
  corporate:         { steps: corporateSteps },
  government:        { steps: governmentSteps },
  investor:          { steps: investorSteps },
  mentor:            { steps: mentorSteps },
  lab:               { steps: labSteps },
  incubator:         { steps: incubatorSteps },
  accelerator:       { steps: acceleratorSteps },
  service_provider:  { steps: serviceProviderSteps },
};

export default TOURS;

// ═══════════════════════════════════════════════════════════════
// Ship #12 (22 May 2026) — PAGE_TOURS for per-page walkthroughs
// ═══════════════════════════════════════════════════════════════
//
// Page-keyed tour dictionary. Separate from the role-keyed TOURS above
// (which is the first-login persona walkthrough). PAGE_TOURS surfaces a
// "Tour this page" button in the topbar when the user is on a covered
// route. Tour fires via the `openi-page-tour` window event.
//
// To add a new page tour:
//   1. Add tour-anchor IDs (id="tour-page-<page>-<element>") to the
//      target page's JSX
//   2. Add an entry below keyed by route path. Steps follow the same
//      shape as TOURS[role].steps (target, title, content, placement,
//      disableBeacon optional).
//
// MyProfile shipped first as the highest-traffic page. Other pages
// (Marketplace, Directory, Challenges, Recommendations) deferred to a
// follow-up where copy can be reviewed by user / cohort.

export const PAGE_TOURS = {
  '/dashboard/profile': {
    title: 'My Profile',
    steps: [
      {
        target: '#tour-page-profile-header',
        title: 'Your profile, all in one place',
        content: 'This is your master profile. Everything you fill in here surfaces on directory listings, recommendations and challenge applications.',
        placement: 'bottom',
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
  // ============================================================
  // Tour batch 3 (28 May 2026) — 7 universal-page tours
  // Covers high-traffic dashboard surfaces visible to every persona:
  // Home, Network, Meetings, Projects, Documents, Knowledge, What's New
  // ============================================================
  '/dashboard/home': {
    title: 'Your Dashboard',
    steps: [
      {
        target: '#tour-welcome',
        title: 'Your home base',
        content: 'This is your persona-tailored dashboard. The cards, stats, and quick-actions you see depend on your role on OpenI.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-stat-cards',
        title: 'Key activity at a glance',
        content: 'These KPI tiles surface the metrics that matter most for your role — applications, projects, mentor sessions, and more.',
        placement: 'bottom',
      },
      {
        target: '#tour-quick-actions',
        title: 'Quick actions',
        content: 'The most common workflows for your persona — one click away. Browse challenges, find startups, add a project, schedule a meeting.',
        placement: 'top',
      },
    ],
  },
  '/dashboard/network': {
    title: 'My Network',
    steps: [
      {
        target: '#tour-page-network-header',
        title: 'Your professional network on OpenI',
        content: 'Build connections with founders, mentors, investors, corporates, academics — anyone active on the platform. Accepted connections unlock direct messaging.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-network-tabs',
        title: 'Tabs for every stage',
        content: 'Switch between your established connections, pending requests (incoming + outgoing), and Discover — where you find new people to connect with.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-network-search',
        title: 'Find people fast',
        content: 'Search by name or organisation. Combine with tab filters to narrow to the right people in your network.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/meetings': {
    title: 'Meetings',
    steps: [
      {
        target: '#tour-page-meetings-header',
        title: 'Schedule with anyone on OpenI',
        content: 'Send meeting invites to any active user — founders, mentors, investors. Accepted invites sync to your calendar via .ics or Google Meet links.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-meetings-create',
        title: 'Schedule a new meeting',
        content: 'Click Schedule Meeting to pick attendees via typeahead, set the time, add an agenda, and optionally attach a Google Meet URL. Attendees get email + bell notification.',
        placement: 'left',
      },
      {
        target: '#tour-page-meetings-tabs',
        title: 'Filter by status',
        content: 'Switch between Upcoming meetings, your Past meeting history, or All for the full list. Useful for reviewing context before a follow-up.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/projects': {
    title: 'Project Management',
    steps: [
      {
        target: '#tour-page-projects-header',
        title: 'Track every project end-to-end',
        content: 'Manage projects, tasks, milestones, collaborators, and budgets all in one place. Useful for tracking incubation cohorts, corporate pilots, mentor engagements.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-projects-toggle',
        title: 'Projects vs Tasks view',
        content: 'Toggle between the top-level Projects view (with milestones + budget) and the Tasks view (drilling into individual to-dos across all your projects).',
        placement: 'bottom',
      },
      {
        target: '#tour-page-projects-create',
        title: 'Start a new project',
        content: 'Click New Project to open the create form. Set the title, owner, timeline, and link it to a startup or program. You can add tasks + milestones immediately or come back later.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/documents': {
    title: 'Document Repository',
    steps: [
      {
        target: '#tour-page-documents-header',
        title: 'Centralised file storage',
        content: 'Store program documents, pitch decks, RFP responses, contracts, MoUs — anything your team needs to share. Files are scoped to your organisation by default.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-documents-upload',
        title: 'Upload your first file',
        content: 'Click Upload Document to attach a file. Pick a folder (or create one), set access level (org-wide, restricted, or public link), and add tags for fast retrieval.',
        placement: 'left',
      },
      {
        target: '#tour-page-documents-stats',
        title: 'At-a-glance overview',
        content: 'See your storage usage, restricted file count, and starred items here. Hover any tile for context on what counts toward each metric.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/knowledge': {
    title: 'Knowledge Hub',
    steps: [
      {
        target: '#tour-page-knowledge-header',
        title: 'Industry reports + curated articles',
        content: 'Browse research reports, sector primers, SOPs, training modules, and ecosystem playbooks curated by OpenI. New articles publish weekly.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-knowledge-search',
        title: 'Search + filter',
        content: 'Type keywords and combine with the type filters (Reports / Articles / SOPs / Training) for fast lookup. Filter chips highlight when active.',
        placement: 'bottom',
      },
      {
        target: '#tour-page-knowledge-add',
        title: 'Suggest an article',
        content: 'See something missing? Click Suggest an Article to send a recommendation to OpenI editors. Admins can publish articles directly from the admin console.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/whats-new': {
    title: "What's New",
    steps: [
      {
        target: '#tour-page-whats-new-header',
        title: 'Latest platform updates',
        content: 'See what we shipped recently — new features, bug fixes, performance improvements. Updates are filtered to your role so you only see what is relevant.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-whats-new-refresh',
        title: 'Stay in sync',
        content: 'Click Refresh to pull the latest entries on demand. The list also auto-loads on first visit each session, so you rarely need to refresh manually.',
        placement: 'left',
      },
    ],
  },
  // ============================================================
  // Tour batch 4 (28 May 2026) — 13 persona-specific dashboard tours
  // CorporateDashboard reuses existing role-tour anchors
  // (#tour-welcome, #tour-corp-pipeline, #tour-corp-applications,
  // #tour-corp-recommended) — no new anchors needed.
  // ============================================================
  '/dashboard/corporate': {
    title: 'Corporate Dashboard',
    steps: [
      {
        target: '#tour-welcome',
        title: 'Your corporate command center',
        content: 'This dashboard surfaces everything you need to run open innovation: live challenges, applications, AI-recommended startups, and collaboration pipeline.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-corp-pipeline',
        title: 'Collaboration Pipeline',
        content: 'Track every active collaboration from outreach to Proof-of-Concept and paid pilots. Hover any stage for filterable details.',
        placement: 'bottom',
      },
      {
        target: '#tour-corp-applications',
        title: 'Recent Applications',
        content: 'Latest startup applications to your challenges. Click any row to open the full application + reviews panel.',
        placement: 'top',
      },
      {
        target: '#tour-corp-recommended',
        title: 'AI-Recommended Startups',
        content: 'Curated weekly — startups matching your sector, focus areas, and corporate strategy. Connect or shortlist directly from here.',
        placement: 'top',
      },
    ],
  },
  '/dashboard/investor/portfolio': {
    title: 'Portfolio',
    steps: [
      {
        target: '#tour-page-portfolio-header',
        title: 'Your invested companies',
        content: 'Every startup you have invested in lives here — with current valuation, equity stake, exit status, and follow-on opportunities.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-portfolio-add',
        title: 'Add a portfolio company',
        content: 'Click Add to Portfolio to log a new investment. Capture startup name, entry date, valuation, equity %, and currency.',
        placement: 'left',
      },
      {
        target: '#tour-page-portfolio-stats',
        title: 'Portfolio health at a glance',
        content: 'Total invested, active count, exited companies, failed, and total exit value — auto-aggregated as you add or update positions.',
        placement: 'bottom',
      },
    ],
  },
  '/dashboard/investor/deals': {
    title: 'Deal Pipeline',
    steps: [
      {
        target: '#tour-page-deals-header',
        title: 'Your deal pipeline',
        content: 'Kanban-style pipeline of deals from sourced through diligence, term-sheet, and closed. Drag deals between stages or click for full detail.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-deals-create',
        title: 'Create a new deal',
        content: 'Click Create Deal to start tracking a new opportunity. Capture startup name, investment type, and notes. Add terms, milestones, and 8-vector evaluation later.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/incubator/programs': {
    title: 'Incubation Programs',
    steps: [
      {
        target: '#tour-page-incubator-programs-header',
        title: 'Manage your programs',
        content: 'Every incubation program you run lives here — with applications, cohorts, milestones, and equity terms.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-incubator-programs-create',
        title: 'Launch a new program',
        content: 'Click New Program to create. Set the title, focus areas, duration, equity terms, and milestones. Save as draft, then publish to start accepting applications.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/accelerator/batches': {
    title: 'Accelerator Batches',
    steps: [
      {
        target: '#tour-page-accelerator-batches-header',
        title: 'Your batches and cohorts',
        content: 'Manage every accelerator batch end-to-end — pitch pipeline, demo day planning, equity terms, and graduation tracking.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-accelerator-batches-create',
        title: 'Create a new batch',
        content: 'Click New Batch to start a fresh cohort. Set dates, batch lead, equity terms, demo day, and milestones. Add startups individually or via bulk import.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/mentor/sessions': {
    title: 'Mentor Sessions',
    steps: [
      {
        target: '#tour-page-mentor-sessions-header',
        title: 'Your mentoring history',
        content: 'Every mentoring session you have given — with the mentee, topic, date, status, and outcome notes. Filter by status to focus on what needs follow-up.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-mentor-sessions-create',
        title: 'Log a new session',
        content: 'Click New Session to record a meeting you just had — or schedule a future one. Include topic, mentee, date, and key takeaways for future reference.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/mentor/availability': {
    title: 'Mentor Availability',
    steps: [
      {
        target: '#tour-page-mentor-availability-header',
        title: 'Set your weekly availability',
        content: 'Tell mentees when you are free. They can book directly into your open slots — no scheduling back-and-forth.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-mentor-availability-save',
        title: 'Save your slots',
        content: 'Click Save All after editing your weekly schedule. Changes take effect immediately — bookable slots refresh for mentees instantly.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/lab/equipment': {
    title: 'Lab Equipment',
    steps: [
      {
        target: '#tour-page-lab-equipment-header',
        title: 'Equipment + booking management',
        content: 'List the equipment your lab offers for use by startups. Manage incoming booking requests and approve or decline based on availability.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-lab-equipment-add',
        title: 'Add equipment',
        content: 'Click Add Equipment to list a new piece. Capture name, category, specs, location, hourly rate, and availability window. Startups can request bookings immediately.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/lab/publications': {
    title: 'Lab Publications',
    steps: [
      {
        target: '#tour-page-lab-publications-header',
        title: 'Showcase your research output',
        content: 'List your lab publications, patents, and conference papers. Higher publication count boosts your lab visibility for collaboration and licensing.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-lab-publications-add',
        title: 'Add a publication',
        content: 'Click Add Publication to log a new paper. Capture title, authors, journal, year, and DOI. Optionally link to the full text via URL.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/student/portfolio': {
    title: 'Student Portfolio',
    steps: [
      {
        target: '#tour-page-student-portfolio-header',
        title: 'Your projects and credentials',
        content: 'Showcase the work that makes you stand out — research projects, hackathons, certifications, and side projects. Corporates and startups search by skills and tags here.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-student-portfolio-add',
        title: 'Add a project or certification',
        content: 'Click the Add button to capture a new project or certification. Include description, skills used, GitHub or demo link, and tag with your research areas.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/student/mentorships': {
    title: 'Student Mentorships',
    steps: [
      {
        target: '#tour-page-student-mentorships-header',
        title: 'Track your mentoring journey',
        content: 'Log every mentor connection — from initial request through active mentorship to completion. Useful for reflection, references, and showing your network growth.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-student-mentorships-create',
        title: 'Add a mentorship',
        content: 'Click New Mentorship to start tracking. Capture the mentor name, organisation, status, and notes about what you are learning together.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/academia/research': {
    title: 'Academic Portfolio',
    steps: [
      {
        target: '#tour-page-academia-portfolio-header',
        title: 'Research, publications, and grants',
        content: 'Track every research project, published paper, and active grant in one place. Each section has its own tab — switch between Research, Publications, and Grants.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-academia-portfolio-add',
        title: 'Add to your portfolio',
        content: 'The Add button is context-aware — it opens a research, publication, or grant form based on which tab you are on. Each capture the metadata that matters for academic visibility.',
        placement: 'left',
      },
    ],
  },
  '/dashboard/sp/services': {
    title: 'Service Provider Hub',
    steps: [
      {
        target: '#tour-page-sp-services-header',
        title: 'Your services + clients',
        content: 'List the services you offer — legal, design, cloud, accounting, marketing — and manage your client relationships. The Reviews tab shows ratings from past clients.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '#tour-page-sp-services-add',
        title: 'Add a service or client',
        content: 'The Add button switches based on the active tab — add a new service offering on the Services tab, or log a new client on the Clients tab. Reviews come from clients directly.',
        placement: 'left',
      },
    ],
  },
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
    title: 'Invitations Inbox',
    steps: [
      {
        target: '#tour-page-invites-header',
        title: 'Private challenge invitations',
        content: 'Challenges you have been personally invited to apply to (not listed on the public Marketplace). Accept to open the apply form, decline to remove from this list.',
        placement: 'bottom',
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
      },
    ],
  },


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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
      },
    ],
  },


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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
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
        disableBeacon: true,
      },
    ],
  },

  // Add more pages here (route -> { title, steps }) in follow-up phases.
};
