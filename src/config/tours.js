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
  // Add more pages here (route -> { title, steps }) in follow-up phases.
};
