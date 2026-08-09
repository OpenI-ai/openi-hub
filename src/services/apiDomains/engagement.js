/**
 * OpenI Hub — API Service Layer · engagement domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 969-1095.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { BASE_URL, get, post, put, del, blobRequest } from './core';

// ---8<--- BODY START  (pre-split api.js lines 969-1095, VERBATIM)
export const recommendationsAPI = {
  trackClick: (payload) => post('/recommendations/click', payload),
};

// ── Onboarding (Phase 20) ───────────────────────────────────
export const onboardingAPI = {
  getStatus:     ()         => get('/onboarding/status'),
  completeStep:  (step_key) => post('/onboarding/complete-step', { step_key }),
  skip:          ()         => post('/onboarding/skip'),
};

// ── Admin Analytics (Phase 24) ──────────────────────────────
export const analyticsAPI = {
  overview:        ()            => get('/admin/analytics/overview'),
  timeseries:      (params = {}) => get(`/admin/analytics/timeseries?${new URLSearchParams(params)}`),
  personas:        ()            => get('/admin/analytics/personas'),
  funnel:          ()            => get('/admin/analytics/funnel'),
  featureAdoption: ()            => get('/admin/analytics/feature-adoption'),
  aiTelemetry:     (params = {}) => get(`/admin/analytics/ai-telemetry?${new URLSearchParams(params)}`),
};

// ── Connections (Phase 18) ──────────────────────────────────
export const connectionAPI = {
  list:             (params = {}) => get(`/connections?${new URLSearchParams(params)}`),
  incoming:         ()            => get('/connections/incoming'),
  outgoing:         ()            => get('/connections/outgoing'),
  stats:            ()            => get('/connections/stats'),
  check:            (userId)      => get(`/connections/check/${userId}`),
  mutual:           (userId)      => get(`/connections/mutual/${userId}`),
  send:             (data)        => post('/connections', data),
  respond:          (id, action)  => put(`/connections/${id}/respond`, { action }),
  remove:           (id)          => del(`/connections/${id}`),
  block:            (userId)      => post(`/connections/${userId}/block`),
};

// ─��� Challenge Applications (for startups / marketplace) ──────
export const challengeAPI = {
  listOpen:         (params = {}) => get(`/challenges/open?${new URLSearchParams(params)}`),
  getDetail:        (id)          => get(`/challenges/${id}`),
  apply:            (id, data)    => post(`/challenges/${id}/apply`, data),
  updateMyApplication: (id, data) => put(`/challenges/${id}/my-application`, data),
  getMyApplications: ()           => get('/challenges/my-applications'),
  profileCheck:     ()            => get('/challenges/profile-check'),
};

// ── Generic Collaboration (Phase 40) ──────────────────────────
// Works across challenge, deal_request, govt_program, etc.
export const collabAPI = {
  list:         (entityType, entityId)                     => get(`/collaborators/${entityType}/${entityId}`),
  invite:       (entityType, entityId, payload)            => post(`/collaborators/${entityType}/${entityId}`, payload),
  inviteByEmail: (payload)                                 => post('/collaborators/invite-by-email', payload),
  updateRole:   (entityType, entityId, collabId, role)     => put(`/collaborators/${entityType}/${entityId}/${collabId}`, { role }),
  remove:       (entityType, entityId, collabId)           => del(`/collaborators/${entityType}/${entityId}/${collabId}`),
  listReviews:  (entityType, entityId)                     => get(`/reviews/${entityType}/${entityId}`),
  submitReview: (entityType, entityId, payload)            => post(`/reviews/${entityType}/${entityId}`, payload),
  myCollaborations: ()                                     => get('/my/collaborations'),
};

// ── Persona Dashboard ─────────────────────────────────────────
export const personaDashboardAPI = {
  dashboard: () => get('/persona/dashboard'),
};

// ── P4 — UI Walkthroughs ──────────────────────────────────────
export const tourAPI = {
  markSeen: (role) => post(`/auth/tours/${role}/seen`, {}),
};

// ── Meetings ──────────────────────────────────────────────────
export const meetingAPI = {
  list:        (params = {}) => get(`/meetings?${new URLSearchParams(params)}`),
  get:         (id)          => get(`/meetings/${id}`),
  create:      (data)        => post('/meetings', data),
  update:      (id, data)    => put(`/meetings/${id}`, data),
  respond:     (id, rsvp)    => post(`/meetings/${id}/respond`, { rsvp }),
  searchUsers: (search)      => get(`/meetings/users?search=${encodeURIComponent(search)}`),
};

// ── Directory ─────────────────────────────────────────────────
export const directoryAPI = {
  search:  (params = {}) => get(`/directory/search?${new URLSearchParams(params)}`),
  filters: ()            => get('/directory/filters'),
};

// ── Public (no auth required) ───────────────────────────────
export const publicAPI = {
  listChallenges:    (params = {}) => get(`/public/challenges?${new URLSearchParams(params)}`),
  getChallengeDetail:(id)          => get(`/public/challenges/${id}`),
  listReports:       (params = {}) => get(`/public/reports?${new URLSearchParams(params)}`),
  getStats:          ()            => get('/public/stats'),
  getLandingContent: ()            => get('/public/landing-content'),
  downloadReportPdf: (id)          => blobRequest('GET', `/public/reports/${id}/pdf`),
  reportPdfUrl:       (id)          => `${BASE_URL}/public/reports/${id}/pdf`,
  getSharedChallenge: (token)      => get(`/public/challenges/share/${token}`),
  getSharedDealRequest: (token)    => get(`/public/deal-requests/share/${token}`),  // Phase 131 blank-page fix
  getTaxonomy:        ()            => get('/public/taxonomy'),
  // Search (Phase 14)
  globalSearch:      (q, limit = 5) => get(`/public/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  searchSuggest:     (q)            => get(`/public/search/suggest?q=${encodeURIComponent(q)}`),
  semanticSearch:    (q, type = 'startups', limit = 10) => get(`/public/search/semantic?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),
  // AI query-parsing (Phase 15)
  aiSearch:          (q, limit = 10) => get(`/public/search/ai?q=${encodeURIComponent(q)}&limit=${limit}`),
  // Phase 31: Public deal requests
  listDealRequests:  (params = {})   => get(`/public/deal-requests?${new URLSearchParams(params)}`),
  getDealRequest:    (id)            => get(`/public/deal-requests/${id}`),
  applyToDealRequest: (id, data)     => post(`/deal-requests/${id}/apply`, data),
  updateMyDealApplication: (id, data) => put(`/deal-requests/${id}/my-application`, data),
};

// ── Unified Opportunities / Marketplace UNION (Phase D) ─────
// One feed across every public "call for applications" object
// (challenge / deal_sourcing / cohort_incubator / cohort_accelerator /
// lab_facility). Auth required, no role guard — any persona browses.
export const opportunityAPI = {
  listAll: (params = {}) => get(`/opportunities?${new URLSearchParams(params)}`),
};

// ── Find Mentees (Cross-Ecosystem Visibility Phase E) ───────
// Reverse-direction feed: MENTORS discover provider personas (startup/student/
// academia) who opted in via seeking_mentor = true. Auth required, no role
// guard — feed self-excludes the viewer's own rows server-side.
export const menteeAPI = {
  listPublic: (params = {}) => get(`/mentees/public?${new URLSearchParams(params)}`),
  getPublic:  (id)          => get(`/mentees/public/${id}`),
};

// ── Crawling ────────────────────────────────────────────────
// ---8<--- BODY END
