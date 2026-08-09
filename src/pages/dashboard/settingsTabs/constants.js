/**
 * Module-level constants extracted from Settings.jsx (Phase 166 / W5-3).
 * The block between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 18-64 of 1507. Nothing inside was reformatted.
 *
 * PROVIDER_BOOLEAN and SEEKER_BOOLEAN are deliberately NOT exported: their
 * only consumer is the BOOLEAN_FEATURES line directly below them, so exporting
 * them would widen the module surface for zero callers.
 */

// ---- BODY START (original lines 18-64) ----
const G = '#D0A848';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const FEATURE_LABELS = {
  // Usage-counted features
  challenge_create: 'Challenges Created',
  application_submit: 'Applications Submitted',
  application_review: 'Applications Reviewed',
  deal_request_apply: 'Deal Request Applications',
  conversation_create: 'Conversations Started',
  connection_request: 'Connection Requests',
  meeting_create: 'Meetings Scheduled',
  file_upload: 'Files Uploaded',
  ai_search_daily_cap: 'AI Ask (daily)',
  // Boolean flags
  semantic_search: 'Semantic Search',
  can_access_portfolio_health: 'Portfolio Health',
  can_access_deal_pipeline: 'Deal Pipeline',
  can_access_service_partners: 'Service Partners',
  rich_profile_sections_unlocked: 'Rich Profile Sections',
  multi_currency_enabled: 'Multi-Currency',
  can_create_programs_batches: 'Programs & Batches',
  eight_vector_evaluation: '8-Vector Evaluation',
  // Provider Growth features
  featured_badge: 'Featured Badge',
  search_ranking_boost: 'Priority Search Ranking',
  who_viewed_profile: 'Who Viewed My Profile',
  watchlist_alerts: 'Watchlist Add Alerts',
  application_insights: 'Application Insights',
  profile_score_ai: 'AI Profile Recommendations',
  multi_seat_org_admin: 'Multi-Seat Org Admin',
  api_access: 'API Access',
  sso_audit_logs: 'SSO & Audit Logs',
};
// Features that are boolean flags (not counted usage)
const PROVIDER_BOOLEAN = ['featured_badge', 'search_ranking_boost', 'who_viewed_profile', 'watchlist_alerts', 'application_insights', 'profile_score_ai'];
const SEEKER_BOOLEAN = ['semantic_search', 'can_access_deal_pipeline', 'can_access_portfolio_health', 'can_access_service_partners', 'eight_vector_evaluation', 'can_create_programs_batches', 'rich_profile_sections_unlocked', 'multi_seat_org_admin', 'api_access', 'sso_audit_logs'];

// Legacy compat
const BOOLEAN_FEATURES = [...new Set([...PROVIDER_BOOLEAN, ...SEEKER_BOOLEAN])];
const USAGE_FEATURES = ['challenge_create', 'application_submit', 'meeting_create', 'file_upload'];
// ---- BODY END ----

export { G, card, FEATURE_LABELS, BOOLEAN_FEATURES, USAGE_FEATURES };
