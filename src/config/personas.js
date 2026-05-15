/**
 * OpenI Hub — Persona Configuration
 * Centralized metadata for all persona types, navigation, and profile fields.
 */

// ── Persona Categories ─────────────────────────────────────
export const PERSONA_CATEGORIES = {
  provider: { label: 'Innovation Provider', description: 'I have innovations to offer' },
  seeker:   { label: 'Innovation Seeker',   description: 'I am looking for innovations' },
};

export const PROVIDER_ROLES = ['startup', 'student', 'academia'];
export const SEEKER_ROLES   = ['corporate', 'government', 'investor', 'mentor', 'lab', 'incubator', 'accelerator', 'service_provider'];
export const ALL_PERSONA_ROLES = [...PROVIDER_ROLES, ...SEEKER_ROLES];
export const SELF_REGISTER_ROLES = ALL_PERSONA_ROLES; // admin/evaluator are NOT self-register

export function getPersonaCategory(role) {
  if (PROVIDER_ROLES.includes(role)) return 'provider';
  if (SEEKER_ROLES.includes(role))   return 'seeker';
  return null; // admin, evaluator
}

// ── Persona Definitions ────────────────────────────────────
export const PERSONAS = {
  startup:     { label: 'Startup',       category: 'provider', icon: 'Rocket',        color: '#D5AA5B', description: 'Tech startup or early-stage company' },
  student:     { label: 'Student',       category: 'provider', icon: 'GraduationCap', color: '#3b82f6', description: 'Student innovator or researcher' },
  academia:    { label: 'Academia',      category: 'provider', icon: 'BookOpen',      color: '#7c3aed', description: 'University or research institute' },
  corporate:   { label: 'Corporate',     category: 'seeker',   icon: 'Building2',     color: '#16a34a', description: 'Large enterprise seeking innovation' },
  government:  { label: 'Government',    category: 'seeker',   icon: 'Landmark',      color: '#0ea5e9', description: 'Government body or PSU' },
  investor:    { label: 'Investor',      category: 'seeker',   icon: 'TrendingUp',    color: '#f59e0b', description: 'Angel, VC, PE, or fund' },
  mentor:      { label: 'Mentor',        category: 'seeker',   icon: 'Users',         color: '#ec4899', description: 'Industry mentor or advisor' },
  lab:         { label: 'Lab',           category: 'seeker',   icon: 'FlaskConical',  color: '#14b8a6', description: 'Lab offering resources to innovators' },
  incubator:   { label: 'Incubator',     category: 'seeker',   icon: 'Home',          color: '#8b5cf6', description: 'Startup incubation program' },
  accelerator:       { label: 'Accelerator',       category: 'seeker',   icon: 'Zap',           color: '#ef4444', description: 'Growth acceleration program' },
  service_provider:  { label: 'Service Provider',  category: 'seeker',   icon: 'Briefcase',     color: '#0d9488', description: 'Startup services provider (cloud, legal, compliance)' },
};

// ── Navigation per Persona ─────────────────────────────────
// Phase 71d (11 May 2026) — canonical sidebar structure across every
// persona. Five groups, rendered with subtle <hr> dividers in
// DashboardLayout.jsx so a user switching personas always sees the same
// mental model in the same order.
//
//   GROUP 1 — Your hub        (My Dashboard, My Profile)
//   GROUP 2 — Recommended     (Recommended for You — only personas that have it)
//   GROUP 3 — Discover        (Find Startups / Find Students / Find Academia /
//                              Directory / Innovation Map — same order for ALL)
//   GROUP 4 — Persona actions (each persona's unique items: Challenges,
//                              Sessions, Programs, Marketplace, Deal Sourcing, …)
//   GROUP 5 — Workspace       (Watchlist, Projects, My Network, Messaging,
//                              Meetings, Events, Knowledge, Documents — same
//                              order for personas that include them)
//
// SECONDARY_NAV (Organization / Features / What's New) renders below in a
// separate sidebar block, unchanged from Phase 69.
//
// NOTE: Settings is rendered separately at the bottom of the sidebar in
// DashboardLayout.jsx — do NOT include it here or it will show up twice.

// Per-persona dashboard route override. Defaults to '/dashboard'.
const DASHBOARD_HOME = {
  corporate: '/dashboard/corporate',
};

// Group 3 — Discover. Identical order across every persona; "Find Startups"
// uses a persona-specific route when one exists (corporate has its own
// search page, others use /dashboard/startups).
const FIND_STARTUPS_ROUTE = {
  corporate: '/dashboard/corporate/search',
};

const discoverGroup = (role) => [
  { to: FIND_STARTUPS_ROUTE[role] || '/dashboard/startups', label: 'Find Startups',  icon: 'Rocket' },
  { to: '/dashboard/students',                              label: 'Find Students',  icon: 'GraduationCap' },
  { to: '/dashboard/academia',                              label: 'Find Academia',  icon: 'BookOpen' },
  // Phase 89 — Find Mentors in Group 3 (Discover). Was a Dashboard-tile-only
  // surface before Phase 89; sidebar entry added universally so users can
  // navigate back without bouncing through Dashboard.
  { to: '/dashboard/mentors',                               label: 'Find Mentors',   icon: 'Users' },
  { to: '/dashboard/directory',                             label: 'Directory',      icon: 'Search' },
  { to: '/dashboard/clusters',                              label: 'Innovation Map', icon: 'Layers' },
];

// Group 5 — Workspace. Same order for every persona that includes it. A
// persona can omit any item by passing { workspace: ['watchlist', ...] }
// listing only the keys it wants. Default = all items.
const WORKSPACE_ITEMS = {
  watchlist: { to: '/dashboard/watchlist',  label: 'Watchlist',    icon: 'Star' },
  projects:  { to: '/dashboard/projects',   label: 'Projects',     icon: 'FolderKanban' },
  network:   { to: '/dashboard/network',    label: 'My Network',   icon: 'Users' },
  messaging: { to: '/dashboard/messaging',  label: 'Messaging',    icon: 'MessageSquare' },
  meetings:  { to: '/dashboard/meetings',   label: 'Meetings',     icon: 'CalendarCheck' },
  events:    { to: '/dashboard/events',     label: 'Events',       icon: 'Calendar' },
  knowledge: { to: '/dashboard/knowledge',  label: 'Knowledge',    icon: 'BookOpen' },
  documents: { to: '/dashboard/documents',  label: 'Documents',    icon: 'FolderOpen' },
};
const DEFAULT_WORKSPACE_KEYS = Object.keys(WORKSPACE_ITEMS);

/**
 * Build the canonical 5-group nav structure for a persona.
 *
 * @param {string} role - persona role key (e.g. 'corporate')
 * @param {object} cfg
 * @param {?{to:string,label:string,icon:string}} cfg.recommended - optional Recommended-for-You link
 * @param {Array} cfg.actions - persona-specific action items (Group 4)
 * @param {?Array<string>} cfg.workspace - keys from WORKSPACE_ITEMS (default: all)
 * @returns {{groups: Array<{key:string, items:Array}>}}
 */
function buildPersonaNav(role, { recommended = null, actions = [], workspace = DEFAULT_WORKSPACE_KEYS } = {}) {
  const groups = [];

  // GROUP 1 — Your hub
  groups.push({
    key: 'hub',
    items: [
      { to: DASHBOARD_HOME[role] || '/dashboard', label: 'My Dashboard', icon: 'LayoutDashboard', end: true },
      { to: '/dashboard/profile',                 label: 'My Profile',   icon: 'User' },
    ],
  });

  // GROUP 2 — Recommended (right under My Profile per Phase 71d decision)
  if (recommended) {
    groups.push({
      key: 'recommended',
      items: [recommended],
    });
  }

  // GROUP 3 — Discover (always identical order)
  groups.push({
    key: 'discover',
    items: discoverGroup(role),
  });

  // GROUP 4 — Persona-specific actions
  if (actions.length > 0) {
    groups.push({
      key: 'actions',
      items: actions,
    });
  }

  // GROUP 5 — Workspace
  const wsItems = workspace
    .map((k) => WORKSPACE_ITEMS[k])
    .filter(Boolean);
  if (wsItems.length > 0) {
    groups.push({
      key: 'workspace',
      items: wsItems,
    });
  }

  return { groups };
}

// Phase 69 — meta / info nav items that every persona should see, rendered
// in a separate sidebar block below the persona-specific items.
export const SECONDARY_NAV = [
  { to: '/dashboard/organization', label: 'Organization', icon: 'Building2' },
  { to: '/dashboard/features',     label: 'Features',     icon: 'Map' },
  { to: '/dashboard/whats-new',    label: "What's New",   icon: 'Sparkles' },
];

export const PERSONA_NAV = {
  startup: buildPersonaNav('startup', {
    actions: [
      { to: '/dashboard/marketplace',     label: 'Marketplace',    icon: 'Target' },
      { to: '/dashboard/claims',          label: 'My Claims',      icon: 'BadgeCheck' },
      { to: '/dashboard/ipr',             label: 'IPR',            icon: 'Shield' },
      { to: '/dashboard/infrastructure',  label: 'Infrastructure', icon: 'Building2' },
      { to: '/dashboard/deeptech',        label: 'DeepTech Qual.', icon: 'Zap' },
      { to: '/dashboard/feedback',        label: 'Feedback',       icon: 'ThumbsUp' },
    ],
  }),
  student: buildPersonaNav('student', {
    recommended: { to: '/dashboard/student/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/student/portfolio',   label: 'My Portfolio',  icon: 'FolderKanban' },
      { to: '/dashboard/student/mentorships', label: 'Mentorships',   icon: 'Users' },
      { to: '/dashboard/marketplace',         label: 'Marketplace',   icon: 'Target' },
    ],
  }),
  academia: buildPersonaNav('academia', {
    recommended: { to: '/dashboard/academia/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/academia/research',     label: 'Research',     icon: 'FlaskConical' },
      { to: '/dashboard/academia/publications', label: 'Publications', icon: 'BookOpen' },
      { to: '/dashboard/academia/grants',       label: 'Grants',       icon: 'DollarSign' },
      { to: '/dashboard/marketplace',           label: 'Marketplace',  icon: 'Target' },
      { to: '/dashboard/ipr',                   label: 'IPR Database', icon: 'Shield' },
    ],
  }),
  corporate: buildPersonaNav('corporate', {
    recommended: { to: '/dashboard/corporate/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/corporate/challenges', label: 'Challenges',     icon: 'Target' },
      { to: '/dashboard/corporate/collabs',    label: 'Collaborations', icon: 'Link2' },
    ],
  }),
  government: buildPersonaNav('government', {
    actions: [
      { to: '/dashboard/corporate/challenges', label: 'Challenges/RFPs', icon: 'Target' },
      { to: '/dashboard/evaluations',          label: 'Programs',        icon: 'FileText' },
      { to: '/dashboard/cohorts',              label: 'Cohorts',         icon: 'GraduationCap' },
      { to: '/dashboard/govt-apis',            label: 'Govt. APIs',      icon: 'Link2' },
    ],
  }),
  investor: buildPersonaNav('investor', {
    recommended: { to: '/dashboard/investor/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/marketplace',            label: 'Marketplace',   icon: 'Target' },
      { to: '/dashboard/investor/deal-requests', label: 'Deal Sourcing', icon: 'FileText' },
      { to: '/dashboard/investor/deals',         label: 'Deal Pipeline', icon: 'GitBranch' },
      { to: '/dashboard/investor/portfolio',     label: 'Portfolio',     icon: 'Briefcase' },
      { to: '/dashboard/deeptech',               label: 'DeepTech',      icon: 'Zap' },
    ],
  }),
  mentor: buildPersonaNav('mentor', {
    actions: [
      { to: '/dashboard/mentor/sessions',     label: 'Sessions',     icon: 'CalendarCheck' },
      { to: '/dashboard/mentor/availability', label: 'Availability', icon: 'Clock' },
      { to: '/dashboard/feedback',            label: 'Feedback',     icon: 'ThumbsUp' },
    ],
  }),
  lab: buildPersonaNav('lab', {
    actions: [
      { to: '/dashboard/lab/equipment',    label: 'Equipment',    icon: 'FlaskConical' },
      { to: '/dashboard/lab/bookings',     label: 'Bookings',     icon: 'CalendarCheck' },
      { to: '/dashboard/lab/publications', label: 'Publications', icon: 'FileText' },
      { to: '/dashboard/ipr',              label: 'IPR Database', icon: 'Shield' },
    ],
  }),
  incubator: buildPersonaNav('incubator', {
    recommended: { to: '/dashboard/incubator/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/incubator/programs',       label: 'Programs',         icon: 'GraduationCap' },
      { to: '/dashboard/incubator/mentors',        label: 'Mentor Pool',      icon: 'Users' },
      { to: '/dashboard/program/service-partners', label: 'Service Partners', icon: 'Link2' },
    ],
  }),
  accelerator: buildPersonaNav('accelerator', {
    recommended: { to: '/dashboard/accelerator/recommended-startups', label: 'Recommended for You', icon: 'Sparkles' },
    actions: [
      { to: '/dashboard/accelerator/batches',      label: 'Batches',            icon: 'Zap' },
      { to: '/dashboard/accelerator/partners',     label: 'Partners & Network', icon: 'Building2' },
      { to: '/dashboard/program/service-partners', label: 'Service Partners',   icon: 'Link2' },
    ],
  }),
  service_provider: buildPersonaNav('service_provider', {
    actions: [
      { to: '/dashboard/sp/services', label: 'My Services', icon: 'Briefcase' },
      { to: '/dashboard/sp/clients',  label: 'Clients',     icon: 'Building2' },
      { to: '/dashboard/sp/reviews',  label: 'Reviews',     icon: 'Star' },
      { to: '/dashboard/marketplace', label: 'Marketplace', icon: 'Target' },
    ],
  }),
};

// ── Profile Field Definitions per Persona ───────────────────
// Used by Register.jsx and MyProfile.jsx to render the correct form fields
export const PROFILE_FIELDS = {
  startup: [
    // ── Brief Information ─────────────────────────────
    { name: 'company_name',   label: 'Company Name',        type: 'text',     required: true },
    { name: 'logo_url',       label: 'Company Logo',        type: 'logo',     placeholder: 'https://yoursite.com/logo.png' },
    { name: 'tagline',        label: 'Tagline',              type: 'text' },
    { name: 'sector',         label: 'Sector',               type: 'taxonomy_select', taxonomy: 'sectors' },
    { name: 'stage',          label: 'Stage',                type: 'select', options: ['Ideation','Pre-seed','Seed','Series A','Series B','Growth','Listed'] },
    { name: 'startup_type',   label: 'Startup Type',         type: 'select', options: ['Product','Service','Platform','Marketplace'] },
    { name: 'business_model', label: 'Business Model',       type: 'select', options: ['B2B','B2C','B2B2C','D2C','B2G','SaaS'] },
    { name: 'revenue_model',  label: 'Revenue Model',        type: 'select', options: ['SaaS','Subscription','Marketplace Fee','Licensing','Freemium','Transaction Fee','Advertising','Hardware','Consulting'] },
    { name: 'product_type',   label: 'Product Type',         type: 'select', options: ['Software','Hardware','Hybrid'] },
    // Phase 60.10 (s50): founded_year dropped — redundant with incorporation_date
    { name: 'incorporation_date', label: 'Incorporation Date', type: 'date' },
    { name: 'employee_range', label: 'Employee Range',       type: 'select', options: ['1-10','11-50','51-200','201-500','500+'] },
    // Phase 60.10 (s50): unified location triple. headquarters dropped (redundant with city).
    { name: 'country',        label: 'Country',              type: 'country' },
    { name: 'state',          label: 'State',                type: 'state' },
    { name: 'city',           label: 'City',                 type: 'city' },
    { name: 'website',        label: 'Website',              type: 'url' },
    // ── About Us ──────────────────────────────────────
    { name: 'description',    label: 'About the Company',    type: 'textarea' },
    { name: 'mission',        label: 'Mission',              type: 'textarea' },
    { name: 'vision',         label: 'Vision',               type: 'textarea' },
    { name: 'video_url',      label: 'Video URL (Demo/Pitch)', type: 'url', placeholder: 'YouTube or Vimeo link' },
    // ── Technology & Innovation ───────────────────────
    { name: 'technologies',   label: 'Technologies',         type: 'taxonomy_tags', taxonomy: 'technologies', placeholder: 'Search technologies...' },
    { name: 'focus_areas',    label: 'Focus Areas / Use Cases', type: 'taxonomy_tags', taxonomy: 'usecases', placeholder: 'Search use cases...' },
    { name: 'tech_readiness', label: 'Tech Readiness Level (1=concept · 9=proven in production)', type: 'number', min: 1, max: 9 },
    { name: 'is_deeptech',    label: 'Is DeepTech?',         type: 'checkbox' },
    // ── Business Traction ─────────────────────────────
    { name: 'revenue_range',  label: 'Revenue Range',        type: 'select', options: ['Pre-revenue','<1 Cr','1-10 Cr','10-50 Cr','50-100 Cr','>100 Cr'] },
    { name: 'customer_count', label: 'Number of Customers',  type: 'number', min: 0 },
    { name: 'mrr_range',      label: 'MRR (Monthly Recurring Revenue)', type: 'money_range', variant: 'revenue' },
    { name: 'arr_range',      label: 'ARR (Annual Recurring Revenue)', type: 'money_range', variant: 'revenue' },
    { name: 'growth_rate',    label: 'Growth Rate',          type: 'text', placeholder: 'e.g., 3x YoY, 25% MoM' },
    { name: 'unit_economics', label: 'Unit Economics — Customer Acquisition Cost (CAC) and Lifetime Value (LTV)', type: 'textarea' },
    // ── Financials ────────────────────────────────────
    { name: 'funding_raised_range', label: 'Total Funding Raised', type: 'money_range', variant: 'revenue' },
    { name: 'total_funding_rounds', label: 'Total Funding Rounds', type: 'number', min: 0 },
    { name: 'last_funding_date', label: 'Last Funding Date', type: 'date' },
    { name: 'last_funding_amount_range', label: 'Last Funding Amount', type: 'money_range', variant: 'revenue' },
    { name: 'total_investors', label: 'Total Investors',     type: 'number', min: 0 },
    { name: 'investor_names', label: 'Key Investors',        type: 'org_typeahead', lookup: 'investors', placeholder: 'Start typing… e.g., Sequoia, Accel' },
    { name: 'burn_rate_range', label: 'Monthly Burn Rate',    type: 'money_range', variant: 'revenue' },
    { name: 'runway_months',  label: 'Runway (months)',      type: 'number', min: 0, max: 600 },
    // ── Awards & Recognition ──────────────────────────
    { name: 'awards',              label: 'Awards',                type: 'tags', placeholder: 'e.g., NASSCOM DeepTech, CII Award' },
    { name: 'certifications',      label: 'Certifications',        type: 'tags', placeholder: 'e.g., ISO 27001, SOC 2' },
    { name: 'accelerator_programs', label: 'Accelerator Programs', type: 'org_typeahead', lookup: 'accelerators', placeholder: 'Start typing… e.g., Y Combinator, T-Hub' },
    // ── Registration & Legal ──────────────────────────
    { name: 'dpiit_number',   label: 'DPIIT Number',         type: 'text' },
    // ── Social & Links ────────────────────────────────
    { name: 'linkedin_url',   label: 'LinkedIn URL',         type: 'url' },
    { name: 'twitter_url',    label: 'X (Twitter) URL',      type: 'url' },
    { name: 'github_url',     label: 'GitHub URL',           type: 'url' },
    { name: 'crunchbase_url', label: 'Crunchbase URL',       type: 'url' },
    { name: 'product_hunt_url', label: 'Product Hunt URL',   type: 'url' },
    { name: 'youtube_url',    label: 'YouTube URL',          type: 'url' },
    { name: 'pitch_deck_url', label: 'Pitch Deck URL',       type: 'url' },
  ],
  student: [
    { name: 'institution',      label: 'Institution',        type: 'text',   required: true },
    { name: 'logo_url',         label: 'Profile Photo',      type: 'logo',   placeholder: 'Upload a photo' },
    { name: 'degree',           label: 'Degree',             type: 'text' },
    { name: 'department',       label: 'Department',         type: 'text' },
    { name: 'graduation_year',  label: 'Graduation Year',    type: 'year' },
    { name: 'country',          label: 'Country',            type: 'country' },
    { name: 'state',            label: 'State',              type: 'state' },
    { name: 'city',             label: 'City',               type: 'city' },
    { name: 'research_areas',   label: 'Research Areas',     type: 'tags', placeholder: 'e.g., AI, Robotics' },
    { name: 'skills',           label: 'Skills',             type: 'tags', placeholder: 'e.g., Python, CAD' },
    { name: 'project_title',    label: 'Project Title',      type: 'text' },
    { name: 'project_desc',     label: 'Project Description', type: 'textarea' },
    { name: 'bio',              label: 'About Me',           type: 'textarea' },
    { name: 'looking_for',      label: 'Looking For',        type: 'multiselect', options: ['Mentorship','Funding','Co-founder','Internship','Collaboration','Lab Access'] },
    { name: 'linkedin_url',     label: 'LinkedIn URL',       type: 'url' },
    { name: 'portfolio_url',    label: 'Portfolio',          type: 'url' },
    { name: 'resume_url',       label: 'Resume',             type: 'url' },
  ],
  academia: [
    { name: 'institution_name', label: 'Institution Name',    type: 'text',   required: true },
    { name: 'logo_url',         label: 'Institution Logo',    type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'institution_type', label: 'Institution Type',    type: 'select', options: ['University','Research Institute','College','Think Tank','Other'] },
    { name: 'department',       label: 'Department',          type: 'text' },
    { name: 'designation',      label: 'Designation',         type: 'text' },
    { name: 'country',          label: 'Country',             type: 'country' },
    { name: 'state',            label: 'State',               type: 'state' },
    { name: 'city',             label: 'City',                type: 'city' },
    { name: 'website',          label: 'Website',             type: 'url' },
    { name: 'research_areas',   label: 'Research Areas',      type: 'tags', placeholder: 'e.g., AI, Materials Science' },
    { name: 'publications_count', label: 'Publications Count', type: 'number', min: 0 },
    { name: 'patents_count',    label: 'Patents Count',       type: 'number', min: 0 },
    { name: 'bio',              label: 'About',               type: 'textarea' },
    { name: 'offerings',        label: 'What We Offer',       type: 'multiselect', options: ['Research Collaboration','IP Licensing','Consulting','Student Interns','Lab Access','Joint Publications'] },
    { name: 'linkedin_url',     label: 'LinkedIn URL',        type: 'url' },
    { name: 'google_scholar_url', label: 'Google Scholar URL', type: 'url' },
  ],
  corporate: [
    { name: 'company_name',        label: 'Company Name',        type: 'text',   required: true },
    { name: 'logo_url',            label: 'Company Logo',        type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'industry',            label: 'Industry',            type: 'taxonomy_select', taxonomy: 'industries' },
    { name: 'company_size',        label: 'Company Size',        type: 'select', options: ['1-50','51-200','201-1000','1001-5000','5000+'] },
    // Phase 60.10 (s50): unified location triple. headquarters dropped (redundant with city).
    { name: 'country',             label: 'Country',             type: 'country' },
    { name: 'state',               label: 'State',               type: 'state' },
    { name: 'city',                label: 'City',                type: 'city' },
    { name: 'website',             label: 'Website',             type: 'url' },
    { name: 'description',         label: 'About the Company',   type: 'textarea' },
    { name: 'innovation_areas',    label: 'Innovation Areas',    type: 'taxonomy_tags', taxonomy: 'sectors', placeholder: 'Search sectors...' },
    { name: 'annual_revenue_range', label: 'Annual Revenue',      type: 'money_range', variant: 'revenue' },
    { name: 'contact_person',      label: 'Contact Person',      type: 'text' },
    { name: 'contact_designation', label: 'Contact Designation', type: 'text' },
    { name: 'looking_for',         label: 'Looking For',         type: 'multiselect', options: ['Proof of Concept','Pilot','Procurement','Co-development','Investment','Licensing'] },
    { name: 'linkedin_url',        label: 'LinkedIn URL',        type: 'url' },
  ],
  government: [
    { name: 'body_name',    label: 'Body / Organization Name', type: 'text',   required: true },
    { name: 'logo_url',     label: 'Organization Logo',         type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'body_type',    label: 'Type',                     type: 'select', options: ['Ministry','PSU','Defence','State Govt','Regulatory','Other'] },
    { name: 'department',   label: 'Department',               type: 'text' },
    { name: 'designation',  label: 'Designation',              type: 'text' },
    { name: 'country',      label: 'Country',                  type: 'country' },
    { name: 'state',        label: 'State',                    type: 'state' },
    { name: 'city',         label: 'City',                     type: 'city' },
    { name: 'website',      label: 'Website',                  type: 'url' },
    { name: 'description',  label: 'About',                    type: 'textarea' },
    { name: 'focus_areas',  label: 'Focus Areas',              type: 'tags', placeholder: 'e.g., Defence, Smart Cities' },
    { name: 'programs',     label: 'Programs',                 type: 'tags', placeholder: 'e.g., iDEX, Make in India' },
    { name: 'contact_person', label: 'Contact Person',         type: 'text' },
    { name: 'looking_for',   label: 'Looking For',             type: 'multiselect', options: ['Innovation Partners','Proof of Concept','Procurement','Technology Transfer'] },
    { name: 'linkedin_url',  label: 'LinkedIn URL',            type: 'url' },
  ],
  investor: [
    // ── Fund Identity ─────────────────────────────────
    { name: 'firm_name',       label: 'Firm / Fund Name',      type: 'text', required: true },
    { name: 'logo_url',        label: 'Fund Logo',             type: 'logo', placeholder: 'https://yoursite.com/logo.png' },
    { name: 'investor_type',   label: 'Investor Type',         type: 'select', options: ['Angel','Seed Fund','Venture Capital','Private Equity','CVC (Corporate VC)','Family Office','HNI','Debt Fund','Government Fund','Impact Fund','Micro VC','Other'] },
    { name: 'investment_types', label: 'Investment Instruments', type: 'multiselect', options: ['Equity','SAFE','Convertible Note','Debt','Revenue Share','ESOP','Mezzanine','Venture Debt'] },
    { name: 'fund_size_range', label: 'Fund Size',             type: 'money_range', variant: 'revenue' },
    { name: 'total_aum_range', label: 'Total AUM',             type: 'money_range', variant: 'revenue' },
    { name: 'available_to_deploy_range', label: 'Available to Deploy', type: 'money_range', variant: 'revenue' },
    { name: 'fund_vintage_year', label: 'Fund Vintage Year',   type: 'year' },
    // ── Investment Focus ──────────────────────────────
    { name: 'investment_stage', label: 'Investment Stages',     type: 'multiselect', options: ['Pre-seed','Seed','Series A','Series B','Series C','Series D+','Growth','Late Stage','Pre-IPO','Debt'] },
    { name: 'ticket_size_range_label', label: 'Ticket Size',          type: 'money_range', variant: 'ticket' },
    { name: 'focus_sectors',   label: 'Focus Sectors',          type: 'tags', placeholder: 'e.g., DeepTech, AI, Defence, SaaS' },
    { name: 'geographic_focus', label: 'Geographic Focus',      type: 'tags', placeholder: 'e.g., India, Southeast Asia, US' },
    { name: 'looking_for',     label: 'Looking For',            type: 'multiselect', options: ['DeepTech','AI/ML','Defence','Healthcare','CleanTech','FinTech','SaaS','B2B','B2C','Hardware','Biotech','SpaceTech','EdTech'] },
    { name: 'investment_thesis', label: 'Investment Thesis',    type: 'textarea', placeholder: 'Describe your investment philosophy, what you look for in startups, and your competitive advantage as an investor' },
    // ── Track Record ──────────────────────────────────
    { name: 'portfolio_count', label: 'Portfolio Companies',     type: 'number', min: 0 },
    { name: 'investments_made', label: 'Total Investments Made', type: 'number', min: 0 },
    { name: 'notable_exits',   label: 'Notable Exits',          type: 'tags', placeholder: 'e.g., Acquired by Cisco 2023, IPO 2024' },
    { name: 'follow_on_capacity', label: 'Follow-on Capacity?', type: 'checkbox' },
    { name: 'average_response_days', label: 'Avg Response Time (days)', type: 'number', min: 0, max: 365 },
    // ── Team ──────────────────────────────────────────
    { name: 'team_partners',   label: 'Partner Names',          type: 'tags', placeholder: 'e.g., Rajiv Menon, Priya Shah' },
    { name: 'co_investor_preferences', label: 'Co-Investor Preferences', type: 'textarea', placeholder: 'Preferred co-investors, syndication style, lead vs follow' },
    // ── Location & Contact ────────────────────────────
    { name: 'country',         label: 'Country',                type: 'country' },
    { name: 'state',           label: 'State',                  type: 'state' },
    { name: 'city',            label: 'City',                   type: 'city' },
    { name: 'website',         label: 'Website',                type: 'url' },
    { name: 'bio',             label: 'About the Fund',         type: 'textarea' },
    // ── Social ────────────────────────────────────────
    { name: 'linkedin_url',    label: 'LinkedIn URL',           type: 'url' },
    { name: 'crunchbase_url',  label: 'Crunchbase URL',         type: 'url' },
  ],
  mentor: [
    { name: 'designation',      label: 'Designation',           type: 'text' },
    { name: 'logo_url',         label: 'Profile Photo',         type: 'logo',   placeholder: 'Upload a photo' },
    { name: 'organisation',     label: 'Organisation',          type: 'text' },
    { name: 'expertise',        label: 'Expertise Areas',       type: 'tags', placeholder: 'e.g., Strategy, Technology, Fundraising' },
    { name: 'years_experience', label: 'Years of Experience',   type: 'number', min: 0, max: 80 },
    { name: 'country',          label: 'Country',               type: 'country' },
    { name: 'state',            label: 'State',                 type: 'state' },
    { name: 'city',             label: 'City',                  type: 'city' },
    { name: 'bio',              label: 'About Me',              type: 'textarea' },
    { name: 'max_mentees',      label: 'Max Mentees',           type: 'number', min: 0, max: 10000 },
    { name: 'offering',         label: 'What I Offer',          type: 'multiselect', options: ['Strategy','Technology','Fundraising','Marketing','Operations','Legal','Product','HR'] },
    { name: 'hourly_rate',      label: 'Hourly Rate',           type: 'number', min: 0 },
    { name: 'hourly_rate_currency', label: 'Rate Currency',     type: 'select', options: ['INR','USD'] },
    { name: 'availability',     label: 'Availability',          type: 'select', options: ['available','busy','limited'] },
    { name: 'linkedin_url',     label: 'LinkedIn URL',          type: 'url' },
  ],
  lab: [
    { name: 'lab_name',       label: 'Lab Name',             type: 'text',   required: true },
    { name: 'logo_url',       label: 'Lab Logo',             type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'parent_org',     label: 'Parent Organisation',  type: 'text' },
    { name: 'lab_type',       label: 'Lab Type',             type: 'select', options: ['Government','University','Private','Shared','CoWorking'] },
    { name: 'country',        label: 'Country',              type: 'country' },
    { name: 'state',          label: 'State',                type: 'state' },
    { name: 'city',           label: 'City',                 type: 'city' },
    { name: 'website',        label: 'Website',              type: 'url' },
    { name: 'description',    label: 'About the Lab',        type: 'textarea' },
    { name: 'equipment',      label: 'Equipment Available',  type: 'tags', placeholder: 'e.g., 3D Printer, CNC, Spectrum Analyzer' },
    { name: 'capabilities',   label: 'Capabilities',         type: 'tags', placeholder: 'e.g., Prototyping, Testing, Simulation' },
    { name: 'certifications', label: 'Certifications',       type: 'tags', placeholder: 'e.g., ISO 9001, NABL' },
    { name: 'capacity',       label: 'Capacity (people)',    type: 'number', min: 0, max: 10000 },
    { name: 'hourly_rate',    label: 'Hourly Rate',    type: 'number', min: 0 },
    { name: 'daily_rate',     label: 'Daily Rate',     type: 'number', min: 0 },
    { name: 'rate_currency',  label: 'Rate Currency',  type: 'select', options: ['INR','USD'] },
    { name: 'contact_person', label: 'Contact Person',       type: 'text' },
    { name: 'linkedin_url',   label: 'LinkedIn URL',         type: 'url' },
  ],
  incubator: [
    { name: 'incubator_name',   label: 'Incubator Name',      type: 'text',   required: true },
    { name: 'logo_url',         label: 'Incubator Logo',      type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'parent_org',       label: 'Parent Organisation', type: 'text' },
    { name: 'country',          label: 'Country',             type: 'country' },
    { name: 'state',            label: 'State',               type: 'state' },
    { name: 'city',             label: 'City',                type: 'city' },
    { name: 'website',          label: 'Website',             type: 'url' },
    { name: 'description',      label: 'About',               type: 'textarea' },
    { name: 'focus_sectors',    label: 'Focus Sectors',        type: 'tags', placeholder: 'e.g., AI, HealthTech, CleanTech' },
    { name: 'program_duration', label: 'Program Duration',     type: 'text',   placeholder: 'e.g., 6 months' },
    { name: 'cohort_size',      label: 'Cohort Size',          type: 'number', min: 0, max: 10000 },
    { name: 'equity_taken',     label: 'Equity Taken (%)',     type: 'number', min: 0, max: 100 },
    { name: 'funding_offered_range', label: 'Funding Offered',      type: 'money_range', variant: 'ticket' },
    { name: 'portfolio_count',  label: 'Portfolio Count',      type: 'number', min: 0 },
    { name: 'services',         label: 'Services Offered',     type: 'multiselect', options: ['Office Space','Mentorship','Funding','Legal','Networking','Marketing','Technical Support'] },
    { name: 'linkedin_url',     label: 'LinkedIn URL',         type: 'url' },
  ],
  accelerator: [
    { name: 'accelerator_name', label: 'Accelerator Name',    type: 'text',   required: true },
    { name: 'logo_url',         label: 'Accelerator Logo',    type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'parent_org',       label: 'Parent Organisation', type: 'text' },
    { name: 'country',          label: 'Country',             type: 'country' },
    { name: 'state',            label: 'State',               type: 'state' },
    { name: 'city',             label: 'City',                type: 'city' },
    { name: 'website',          label: 'Website',             type: 'url' },
    { name: 'description',      label: 'About',               type: 'textarea' },
    { name: 'focus_sectors',    label: 'Focus Sectors',        type: 'tags', placeholder: 'e.g., DeepTech, SaaS' },
    { name: 'program_duration', label: 'Program Duration',     type: 'text',   placeholder: 'e.g., 3 months' },
    { name: 'batch_size',       label: 'Batch Size',           type: 'number', min: 0, max: 10000 },
    { name: 'equity_taken',     label: 'Equity Taken (%)',     type: 'number', min: 0, max: 100 },
    { name: 'funding_offered_range', label: 'Funding Offered',      type: 'money_range', variant: 'ticket' },
    { name: 'portfolio_count',  label: 'Portfolio Count',      type: 'number', min: 0 },
    { name: 'demo_day',         label: 'Has Demo Day?',        type: 'checkbox' },
    { name: 'services',         label: 'Services Offered',     type: 'multiselect', options: ['Office Space','Mentorship','Funding','Legal','Networking','Marketing','Technical Support','Corporate Partnerships'] },
    { name: 'corporate_partners', label: 'Corporate Partners', type: 'org_typeahead', lookup: 'corporates', placeholder: 'Start typing… e.g., Google, Tata, Reliance' },
    { name: 'linkedin_url',     label: 'LinkedIn URL',         type: 'url' },
  ],
  service_provider: [
    { name: 'company_name',         label: 'Company Name',            type: 'text',   required: true },
    { name: 'logo_url',             label: 'Company Logo',            type: 'logo',   placeholder: 'https://yoursite.com/logo.png' },
    { name: 'tagline',              label: 'Tagline',                  type: 'text',   placeholder: 'e.g., Empowering startups with cloud & compliance' },
    { name: 'service_categories',   label: 'Service Categories',       type: 'multiselect', options: ['Cloud Credits (AWS/Azure/GCP)','Legal Services','Financial/Accounting','Compliance/Regulatory','HR/Recruitment','Marketing/PR','IP/Patent Services','Mentorship Programs','Office Space/Co-working','Design/Branding','Software Development','Data Analytics'] },
    { name: 'description',          label: 'About the Company',        type: 'textarea' },
    { name: 'pricing_model',        label: 'Pricing Model',            type: 'select', options: ['Free','Subscription','Per-use','Subscription + Per-use','Equity-based','Custom/Negotiable'] },
    { name: 'target_startup_stages', label: 'Target Startup Stages',   type: 'multiselect', options: ['Ideation','Pre-seed','Seed','Series A','Series B','Growth','Listed'] },
    { name: 'sectors_served',       label: 'Sectors Served',           type: 'tags', placeholder: 'e.g., DeepTech, SaaS, HealthTech' },
    { name: 'country',              label: 'Country',                  type: 'country' },
    { name: 'state',                label: 'State',                    type: 'state' },
    { name: 'city',                 label: 'City',                     type: 'city' },
    { name: 'website',              label: 'Website',                  type: 'url' },
    { name: 'team_size',            label: 'Team Size',                type: 'number', min: 0 },
    { name: 'years_in_business',    label: 'Years in Business',        type: 'number', min: 0, max: 200 },
    { name: 'certifications',       label: 'Certifications',           type: 'tags', placeholder: 'e.g., ISO 27001, SOC 2, AWS Partner' },
    { name: 'client_testimonials',  label: 'Client Testimonials',      type: 'textarea' },
    { name: 'portfolio_url',        label: 'Portfolio / Case Studies URL', type: 'url' },
    { name: 'contact_person',       label: 'Contact Person',           type: 'text' },
    { name: 'contact_email',        label: 'Contact Email',            type: 'text' },
    { name: 'looking_for',          label: 'Looking For',              type: 'multiselect', options: ['Startups','Incubators','Accelerators','Corporates','Government Programs'] },
    { name: 'linkedin_url',         label: 'LinkedIn URL',             type: 'url' },
  ],
};

// Phase 65e (8 May 2026) — trimmed Step 2 to a strict 3-field minimum per
// persona. Was 7 in Phase 65; reduced because a 7-field form is still a
// "wall" for first-time users. Strategy per persona:
//   1. the required identity field (e.g. company_name) — primary key into
//      directory and persona profile tables
//   2. one high-signal classification (sector / industry / expertise / etc.)
//      — without this, recommendation engine has zero signal for new users
//   3. one short text field (tagline / bio / description) — gives search
//      vector and Directory cards something to render
//
// Everything else (stage, location triple, urls, financials, technologies)
// moves to My Profile, where the user fills it in at their own pace.
// REGISTER_FIELDS is still picked by name from PROFILE_FIELDS so all input
// rendering / validation / min-max bounds are reused.
const REGISTER_FIELD_NAMES = {
  startup:          ['company_name','sector','tagline'],
  student:          ['institution','research_areas','bio'],
  academia:         ['institution_name','research_areas','bio'],
  corporate:        ['company_name','industry','description'],
  government:       ['body_name','body_type','description'],
  investor:         ['firm_name','investor_type','bio'],
  mentor:           ['organisation','expertise','bio'],
  lab:              ['lab_name','lab_type','description'],
  incubator:        ['incubator_name','focus_sectors','description'],
  accelerator:      ['accelerator_name','focus_sectors','description'],
  service_provider: ['company_name','service_categories','tagline'],
};

export const REGISTER_FIELDS = Object.fromEntries(
  Object.entries(REGISTER_FIELD_NAMES).map(([persona, names]) => {
    const fullList = PROFILE_FIELDS[persona] || [];
    const byName = new Map(fullList.map(f => [f.name, f]));
    const picked = names.map(n => byName.get(n)).filter(Boolean);
    return [persona, picked];
  })
);

// Helper: get the primary "org name" field key for each persona
export const ORG_NAME_FIELD = {
  startup:     'company_name',
  student:     'institution',
  academia:    'institution_name',
  corporate:   'company_name',
  government:  'body_name',
  investor:    'firm_name',
  mentor:      'organisation',
  lab:         'lab_name',
  incubator:   'incubator_name',
  accelerator:      'accelerator_name',
  service_provider: 'company_name',
};

// ── Phase 37: Plan Configuration per Persona Category ────────
export const PLAN_CONFIG = {
  provider: {
    plans: [
      { name: 'free', label: 'Free', price: 0, priceNote: '/forever' },
      { name: 'provider_growth', label: 'Growth', price: 499, priceNote: '/month' },
    ],
    upgradeTarget: 'provider_growth',
    upgradeLabel: 'Growth',
  },
  seeker: {
    plans: [
      { name: 'free', label: 'Free', price: 0, priceNote: '/forever' },
      { name: 'seeker_pro', label: 'Pro', price: 2499, priceNote: '/month' },
      { name: 'seeker_enterprise', label: 'Enterprise', price: 9999, priceNote: '/month' },
    ],
    upgradeTarget: 'seeker_pro',
    upgradeLabel: 'Pro',
  },
};

export const PLAN_LABELS = {
  free: 'Free',
  provider_growth: 'Growth',
  seeker_pro: 'Pro',
  seeker_enterprise: 'Enterprise',
  pro: 'Pro (Legacy)',
  enterprise: 'Enterprise (Legacy)',
};
