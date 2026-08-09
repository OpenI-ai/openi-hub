/**
 * OpenI Hub - tours / pagesUniversal (Phase 162, 9 Aug 2026)
 *
 * Tour batches 3 and 4: the 7 universal pages (home, network, meetings,
 * projects, documents, knowledge, whats-new) plus 13 persona-specific dashboards.
 *
 * VERBATIM slice of the pre-split src/config/tours.js (2,022 lines), original
 * lines 612-1036. The body below is byte-identical to the original, indentation
 * included - only this header, the `export const pagesUniversal = {` wrapper and the sentinels are new.
 * See ./index.js for the re-concat verification recipe and the invariants.
 */

export const pagesUniversal = {
// ─── BODY START (verbatim) ───
// --- lines 612-1036 ---
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
// ─── BODY END ───
};
