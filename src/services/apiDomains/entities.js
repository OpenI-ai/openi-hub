/**
 * OpenI Hub — API Service Layer · entities domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 263-403.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { BASE_URL, get, post, put, del } from './core';

// ---8<--- BODY START  (pre-split api.js lines 263-403, VERBATIM)
export const startupAPI = {
  list:           (params = {}) => get(`/startups?${new URLSearchParams(params)}`),
  get:            (id, opts={})  => get(`/startups/${id}${opts.by ? `?by=${encodeURIComponent(opts.by)}` : ''}`),
  create:         (data)        => post('/startups', data),
  update:         (id, data)    => put(`/startups/${id}`, data),
  delete:         (id)          => del(`/startups/${id}`),
  getEvaluations: (id)          => get(`/startups/${id}/evaluations`),
  // Q3 (s27): cluster-mate discovery via s21 K=100 clusters
  getSimilar:     (id, limit = 8) => get(`/startups/${id}/similar?limit=${limit}`),
};

// ── Evaluations ─────────────────────────────────────────────
export const evaluationAPI = {
  list:   (params = {}) => get(`/evaluations?${new URLSearchParams(params)}`),
  create: (data)        => post('/evaluations', data),
  update: (id, data)    => put(`/evaluations/${id}`, data),
};

// ── Cohorts ─────────────────────────────────────────────────
export const cohortAPI = {
  list:       ()                => get('/cohorts'),
  get:        (id)              => get(`/cohorts/${id}`),
  create:     (data)            => post('/cohorts', data),
  addStartup: (id, startup_id)  => post(`/cohorts/${id}/startups`, { startup_id }),
};

// ── Mentors ─────────────────────────────────────────────────
export const mentorAPI = {
  list:   (params = {}) => get(`/mentors?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/mentors/${id}`),
  create: (data)        => post('/mentors', data),
  assign: (id, startup_id) => post(`/mentors/${id}/assign`, { startup_id }),
};

// ── Projects ────────────────────────────────────────────────
export const projectAPI = {
  list:       ()           => get('/projects'),
  get:        (id)         => get(`/projects/${id}`),
  create:     (data)       => post('/projects', data),
  update:     (id, data)   => put(`/projects/${id}`, data),
  createTask: (id, data)   => post(`/projects/${id}/tasks`, data),
};

// ── Messaging ───────────────────────────────────────────────
export const messageAPI = {
  listConversations:  ()           => get('/conversations'),
  createConversation: (data)       => post('/conversations', data),
  getMessages:        (id)         => get(`/conversations/${id}/messages`),
  sendMessage:        (id, content) => post(`/conversations/${id}/messages`, { content }),
};

// ── Events ──────────────────────────────────────────────────
export const eventAPI = {
  list:     (params = {}) => get(`/events?${new URLSearchParams(params)}`),
  get:      (id)          => get(`/events/${id}`),
  create:   (data)        => post('/events', data),
  // Testing-team fix (Jun 2026) — full edit; gated server-side (creator + same-org + admin)
  update:   (id, data)    => put(`/events/${id}`, data),
  publish:  (id)          => post(`/events/${id}/publish`),
  register: (id)          => post(`/events/${id}/register`),
  // Ship #10 follow-up (22 May 2026 late evening) — persistent per-user registration tracking
  unregister:       (id)  => del(`/events/${id}/register`),
  myRegistrations:  ()    => get(`/my/event-registrations`),
  // Ship #11 (21 May 2026) — DELETE gated server-side to creator + same-org co-creators
  delete:   (id)          => del(`/events/${id}`),
  // Ship #10 (22 May 2026) — direct PDF download URL. Auth handled via cookie/JWT
  // header on fetch, so caller can either fetch+blob OR build authed anchor.
  // We return the base URL; caller uses fetch with Authorization header.
  brochureUrl: (id)       => `${BASE_URL}/events/${id}/brochure`,
};

// ── Feedback ────────────────────────────────────────────────
export const feedbackAPI = {
  list:      (params = {}) => get(`/feedback?${new URLSearchParams(params)}`),
  create:    (data)        => post('/feedback', data),
  respond:   (id, response) => put(`/feedback/${id}/respond`, { response }),
  analytics: ()            => get('/feedback/analytics'),
};

// ── What's New (Phase 72 — auto-populated, persona-aware) ───────────
// Phase 74 — per-user seen-tracking (markSeen on page mount, unread-count
// poll for the sidebar badge).
export const whatsNewAPI = {
  list:         () => get('/whats-new'),
  unreadCount:  () => get('/whats-new/unread-count'),
  markSeen:     () => post('/whats-new/seen'),
};

// ── IPR Records ───────────────────────────────────────────────
export const iprAPI = {
  list:        (params = {}) => get(`/ipr?${new URLSearchParams(params)}`),
  myPortfolio: (params = {}) => get(`/ipr/my-portfolio?${new URLSearchParams(params)}`), // Phase 94
  get:         (id)          => get(`/ipr/${id}`),
  create:      (data)        => post('/ipr', data),
  update:      (id, data)    => put(`/ipr/${id}`, data),
};

// Phase 111 Ship 2b (25 May 2026) — IPR sharing: PDF + magic-link invite ONLY
// (no public token mode per D3 - IPR has legal exposure)
export const iprShareAPI = {
  pdfUrl:        (id)             => `${BASE_URL}/ipr/${id}/pdf`,
  inviteByEmail: (id, data)       => post(`/ipr/${id}/invite`, data),
};

// ── Infrastructure ────────────────────────────────────────────
export const infrastructureAPI = {
  list:          (params = {}) => get(`/infrastructure?${new URLSearchParams(params)}`),
  get:           (id)          => get(`/infrastructure/${id}`),
  create:        (data)        => post('/infrastructure', data),
  createBooking: (id, data)    => post(`/infrastructure/${id}/bookings`, data),
};

// ── Knowledge Base ────────────────────────────────────────────
export const knowledgeAPI = {
  list:   (params = {}) => get(`/knowledge?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/knowledge/${id}`),
  create: (data)        => post('/knowledge', data),
  update: (id, data)    => put(`/knowledge/${id}`, data),
  delete: (id)          => del(`/knowledge/${id}`),
  // Ship #5 (22 May 2026) — non-admin can suggest articles; backend emails admin
  suggest:  (data)        => post('/knowledge/suggest', data),
  // Phase 121 — contributor self-service request + status check
  requestContributor: (message) => post('/knowledge-contributors/request', { message }),
  myContributorStatus: ()       => get('/knowledge-contributors/mine'),
  // Phase 130 — submitter self-service status check for article suggestions
  mySuggestions: () => get('/knowledge/suggestions/mine'),
};

// Phase 121 — admin-only contributor-request moderation
export const knowledgeAdminAPI = {
  listRequests: (params = {}) => get(`/knowledge-contributors?${new URLSearchParams(params)}`),
  approve: (id, note) => put(`/knowledge-contributors/${id}/approve`, { admin_note: note }),
  reject:  (id, note) => put(`/knowledge-contributors/${id}/reject`, { admin_note: note }),
  // Phase 122 — admin-only article-suggestion moderation
  listSuggestions:   (params = {}) => get(`/knowledge/suggestions?${new URLSearchParams(params)}`),
  approveSuggestion: (id, note)    => put(`/knowledge/suggestions/${id}/approve`, { admin_note: note }),
  rejectSuggestion:  (id, note)    => put(`/knowledge/suggestions/${id}/reject`,  { admin_note: note }),
  dismissSuggestion: (id, note)    => put(`/knowledge/suggestions/${id}/dismiss`, { admin_note: note }),
};

// ── Documents ─────────────────────────────────────────────────
// ---8<--- BODY END
