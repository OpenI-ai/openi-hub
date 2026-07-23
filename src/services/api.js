/**
 * OpenI Hub — API Service Layer
 * Central place for all backend calls.
 * Base URL is read from .env: VITE_API_URL
 */

import safeStorage from '../utils/safeStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ───────────────────────────────────────────
// safeStorage instead of raw localStorage: in-app WebViews / private mode can
// throw SecurityError on storage access, which would otherwise break every
// request that reads the token (Sentry OPENI-HUB-FRONTEND-F).
export function getToken()          { return safeStorage.getItem('openi_token'); }
export function setToken(t)         { safeStorage.setItem('openi_token', t); }
export function removeToken()       { safeStorage.removeItem('openi_token'); }

// Phase 60.3 (s50): active-role header. Stored in localStorage by AuthContext;
// authMiddleware on the server validates it against the user's roles[].
export function getActiveRole()     { return safeStorage.getItem('openi_active_role'); }

// ── Core fetch wrapper ──────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  const token      = getToken();
  const activeRole = getActiveRole();
  const headers    = {};

  if (token)      headers['Authorization']  = `Bearer ${token}`;
  if (activeRole) headers['X-Active-Role']  = activeRole;
  if (!isFormData) headers['Content-Type']  = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Global 401 interceptor — an expired/invalid JWT returns 401 from
    // authMiddleware on EVERY authed call. Without this, screens whose own
    // recovery actions (Retry/Skip) are themselves authed just keep 401'ing,
    // leaving the user stuck with no path out (the onboarding dead-end Tyler hit).
    // Clear the dead token and bounce to login with a session-expired reason.
    // Exempt the auth endpoints so a bad login/refresh can't trigger a redirect loop.
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (res.status === 401 && !isAuthEndpoint) {
      removeToken();
      try {
        window.dispatchEvent(new CustomEvent('openi:unauthorized', {
          detail: { message: data.message }
        }));
        if (!window.location.pathname.startsWith('/dashboard/login')) {
          window.location.href = '/dashboard/login?reason=expired';
        }
      } catch { /* SSR / non-browser context */ }
      const err = new Error(data.message || 'Your session has expired. Please sign in again.');
      err.status = 401;
      throw err;
    }
    // s49e: gated-action 403 — caller is logged in but email_verified_at IS NULL.
    // Surface a structured error with code AND emit a global event so any
    // un-caught path still surfaces an actionable UX (toast + redirect).
    if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
      try {
        window.dispatchEvent(new CustomEvent('openi:email-not-verified', {
          detail: { message: data.message }
        }));
      } catch { /* SSR / non-browser context */ }
      const err = new Error(data.message || 'Please verify your email to perform this action.');
      err.code = 'EMAIL_NOT_VERIFIED';
      err.status = 403;
      throw err;
    }
    // Generic error path. Surface the parsed body so callers can act on
    // structured responses — e.g. the createOrg 409 duplicate-recourse payload
    // { error, recourse: 'claim'|'join', org } (no `message` key), which the
    // OrgAdmin create-form catch reads to offer a claim/join CTA instead of a
    // dead-end "HTTP 409" toast.
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status   = res.status;
    if (data.recourse) err.recourse = data.recourse;
    if (data.org)      err.org      = data.org;
    if (data.startup)  err.startup  = data.startup;
    if (data.error)    err.error    = data.error;
    // Phase (upgrade journey): plan-gate 402/403 payloads carry these fields
    // so callers can render an UpgradeCTA instead of a bare toast dead-end.
    if (data.feature)     err.feature    = data.feature;
    if (data.limit != null) err.limit    = data.limit;
    if (data.used != null)  err.used     = data.used;
    if (data.plan)         err.plan      = data.plan;
    if (data.upgrade_url)  err.upgradeUrl = data.upgrade_url;
    throw err;
  }
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);

// Blob fetch for binary downloads (PDF, etc.)
async function blobRequest(method, path) {
  const token      = getToken();
  const activeRole = getActiveRole();
  const headers    = {};
  if (token)      headers['Authorization'] = `Bearer ${token}`;
  if (activeRole) headers['X-Active-Role'] = activeRole;
  const res = await fetch(`${BASE_URL}${path}`, { method, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Mirror request()'s global 401 interceptor — an expired token during a
    // PDF download must also auto-logout + redirect, not throw a raw error.
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (res.status === 401 && !isAuthEndpoint) {
      removeToken();
      try {
        window.dispatchEvent(new CustomEvent('openi:unauthorized', {
          detail: { message: err.message }
        }));
        if (!window.location.pathname.startsWith('/dashboard/login')) {
          window.location.href = '/dashboard/login?reason=expired';
        }
      } catch { /* SSR / non-browser context */ }
      const e = new Error(err.message || 'Your session has expired. Please sign in again.');
      e.status = 401;
      throw e;
    }
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.blob();
}

// ── File Upload ───────────────────────────────────────────────
export const uploadAPI = {
  upload: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', `/upload?folder=${folder}`, formData, true);
  },
};

// Phase 60.8 (s50) — public logo upload at register time. No auth required;
// backend rate-limits by IP. Bypasses request() wrapper to skip Authorization
// + X-Active-Role headers that don't exist for unauthenticated users.
export const publicUploadAPI = {
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/public/logo-upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed (HTTP ${res.status})`);
    return data;
  },
};

// ── Organizations (Phase 21) ─────────────────────────────────
export const orgAPI = {
  getMyOrg:       ()           => get('/org/my-org'),
  create:         (data)       => post('/org', data),
  update:         (data)       => put('/org', data),
  inviteMember:   (data)       => post('/org/members', data),
  updateMember:   (id, data)   => put(`/org/members/${id}`, data),
  removeMember:   (id)         => del(`/org/members/${id}`),
  // Phase 113 — domain-match suggestion at signup + user-requests-to-join flow
  lookupByDomain: (domain)     => get(`/public/org-by-domain?domain=${encodeURIComponent(domain || '')}`),
  requestJoin:    (data)       => post('/org/members/request-join', data),
  // Phase 113-Tier-B5 — count of pending invites (sidebar badge)
  pendingInvitesCount: ()      => get('/org/pending-invites-count'),
};

// Phase 87a/b — typeahead lookups for org-name fields (investors,
// accelerators+incubators blended, corporates). Backend blends curated
// seed JSON with live platform profiles.
export const lookupAPI = {
  search: (which, q) => get(`/lookup/${which}?q=${encodeURIComponent(q || '')}`),
};

// ── Subscriptions ─────────────────────────────────────────────
export const subscriptionAPI = {
  getPlans:      ()       => get('/subscription/plans'),
  getMyPlan:     ()       => get('/subscription/my-plan'),
  createOrder:   (data)   => post('/subscription/create-order', data),
  verifyPayment: (data)   => post('/subscription/verify-payment', data),
  cancel:        ()       => post('/subscription/cancel'),
  // A.5: mid-period billing cycle change
  changeBillingCycle: (data) => post('/subscription/change-cycle', data),
  // Phase 128 — prorated mid-period plan-tier change (upgrade or downgrade)
  changePlan:       (data) => post('/subscription/change-plan', data),
  verifyPlanChange: (data) => post('/subscription/verify-plan-change', data),
  downloadInvoice: (paymentId) => blobRequest('GET', `/subscription/invoice/${paymentId}`),
  featureAccess: ()       => get('/subscription/feature-access'),
  // Phase 123 — real recurring auto-renew (Razorpay Subscriptions API)
  createRecurringOrder:   (data) => post('/subscription/create-recurring-order', data),
  verifyRecurringPayment: (data) => post('/subscription/verify-recurring-payment', data),
  toggleAutoRenew:        (data) => post('/subscription/toggle-auto-renew', data),
};

// ── Billing Address (Phase 60.11) ─────────────────────────────
// Mandatory billing details for GST-compliant invoices. One row per
// (user, active role). The backend hard-gates Razorpay checkout on this.
export const billingAddressAPI = {
  get:    ()         => get('/billing-address'),
  upsert: (payload)  => put('/billing-address', payload),
};

// ── AI Credit Packs (Phase 26) ────────────────────────────────
export const creditAPI = {
  listPacks:       ()            => get('/credits/packs'),
  myBalance:       ()            => get('/credits/my-balance'),
  createOrder:     (packId)      => post('/credits/create-order', { pack_id: packId }),
  verifyPayment:   (payload)     => post('/credits/verify-payment', payload),
};

// ── Profile Views & Provider Analytics (Phase 37) ─────────────
export const profileViewAPI = {
  recordView:          (userId)  => post(`/profile-views/${userId}`, {}),
  whoViewedMe:         ()        => get('/profile-views/who-viewed'),
  viewStats:           ()        => get('/profile-views/stats'),
  watchlistAlerts:     ()        => get('/watchlist-alerts'),
  applicationInsights: ()        => get('/application-insights'),
};

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login:          (email, password) => post('/auth/login', { email, password }),
  me:             ()                => get('/auth/me'),
  changePassword: (currentPassword, newPassword) => put('/auth/change-password', { currentPassword, newPassword }),
  updateProfile:  (data)            => put('/auth/profile', data),
  // Phase 97 — silent session refresh. Re-mints a 24h JWT for the currently-authed user.
  // Called by useSessionRefresh() in AuthContext when the token has <1h left.
  refresh:        ()                => post('/auth/refresh'),
};

// ── MFA (Phase 54) ─────────────────────────────────────────
export const mfaAPI = {
  status:  ()                    => get('/auth/mfa/status'),
  setup:   ()                    => post('/auth/mfa/setup'),
  enable:  (code)                => post('/auth/mfa/enable',  { code }),
  disable: (password, code)      => post('/auth/mfa/disable', { password, code }),
  verify:  (mfa_token, code)     => post('/auth/mfa/verify',  { mfa_token, code }),
};

// ── Multi-persona roles (Phase 60.4) ───────────────────────
export const rolesAPI = {
  list:       ()                       => get('/auth/roles'),
  add:        (role, profile = {})     => post('/auth/roles/add',         { role, profile }),
  setPrimary: (role)                   => post('/auth/roles/set-primary', { role }),
  remove:     (role)                   => post('/auth/roles/remove',      { role }),
};

// ── Dashboard ───────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => get('/dashboard/stats'),
};

// ── Startups ────────────────────────────────────────────────
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
export const documentAPI = {
  list:   (params = {}) => get(`/documents?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/documents/${id}`),
  create: (data)        => post('/documents', data),
  update: (id, data)    => put(`/documents/${id}`, data),
  remove: (id)          => del(`/documents/${id}`),
};

// ── Watchlists ────────────────────────────────────────────────
export const watchlistAPI = {
  list:           ()           => get('/watchlists'),
  get:            (id)         => get(`/watchlists/${id}`),
  create:         (data)       => post('/watchlists', data),
  remove:         (id)         => del(`/watchlists/${id}`),
  addStartup:     (id, sid)    => post(`/watchlists/${id}/startups`, { startup_id: sid }),
  removeStartup:  (id, sid)    => del(`/watchlists/${id}/startups/${sid}`),
  // Ship #4 (22 May 2026) — watchlist PDF download URL (caller does authed fetch+blob)
  pdfUrl:        (id)                  => `${BASE_URL}/watchlists/${id}/pdf`,
  // Ship #4 follow-up (22 May 2026 late evening) — tokenized public sharing
  createShare:   (id, opts = {})       => post(`/watchlists/${id}/shares`, opts),
  listShares:    (id)                  => get(`/watchlists/${id}/shares`),
  revokeShare:   (shareId)             => del(`/watchlists/shares/${shareId}`),
  // Phase 109 (25 May 2026) — per-user collaborators (editor/viewer roles + magic-link email invite)
  inviteCollaborators: (id, data)          => post(`/watchlists/${id}/collaborators`, data),
  listCollaborators:   (id)                => get(`/watchlists/${id}/collaborators`),
  removeCollaborator:  (id, collabId)      => del(`/watchlists/${id}/collaborators/${collabId}`),
  updateCollaboratorRole: (id, collabId, data) => patch(`/watchlists/${id}/collaborators/${collabId}`, data),
};

// PUBLIC unauthed read by share token. Hits /api/public/watchlists/share/:token.
// Note: no Authorization header — this is the recipient-side fetch from a
// possibly-unauthenticated browser. We call request() directly with skipAuth.
export const publicWatchlistShare = {
  read: (token) => fetch(`${BASE_URL}/public/watchlists/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `HTTP ${r.status}`);
      return body;
    }),
};

// Phase 110 (25 May 2026) — Startup Profile sharing (3 modes)
export const startupProfileShareAPI = {
  pdfUrl:        (userId)             => `${BASE_URL}/startup-profile/${userId}/pdf`,
  createShare:   (userId, opts = {})  => post(`/startup-profile/${userId}/shares`, opts),
  listShares:    (userId)             => get(`/startup-profile/${userId}/shares`),
  revokeShare:   (shareId)            => del(`/startup-profile/shares/${shareId}`),
};

// PUBLIC unauthed read by share token. Hits /api/public/startup-profile/share/:token.
export const publicStartupProfileShare = {
  read: (token) => fetch(`${BASE_URL}/public/startup-profile/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `HTTP ${r.status}`);
      return body;
    }),
};

// ── DeepTech Assessments ──────────────────────────────────────
export const deeptechAPI = {
  list:   (params = {}) => get(`/deeptech?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/deeptech/${id}`),
  create: (data)        => post('/deeptech', data),
};

// Phase 111 Ship 2a (25 May 2026) — DeepTech sharing
export const deeptechShareAPI = {
  pdfUrl:        (id)             => `${BASE_URL}/deeptech/${id}/pdf`,
  createShare:   (id, opts = {})  => post(`/deeptech/${id}/shares`, opts),
  listShares:    (id)             => get(`/deeptech/${id}/shares`),
  revokeShare:   (shareId)        => del(`/deeptech/shares/${shareId}`),
};

// Phase 111 Ship 2c (25 May 2026) — 8-Vector Self-Assessment + sharing
export const eightVectorSelfAPI = {
  listMine:      ()               => get('/eight-vector-self'),
  create:        (data)           => post('/eight-vector-self', data),
  get:           (id)             => get(`/eight-vector-self/${id}`),
  pdfUrl:        (id)             => `${BASE_URL}/eight-vector-self/${id}/pdf`,
  createShare:   (id, opts = {})  => post(`/eight-vector-self/${id}/shares`, opts),
  listShares:    (id)             => get(`/eight-vector-self/${id}/shares`),
  revokeShare:   (shareId)        => del(`/eight-vector-self/shares/${shareId}`),
};

export const publicEightVectorSelfShare = {
  read: (token) => fetch(`${BASE_URL}/public/eight-vector-self/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `HTTP ${r.status}`);
      return body;
    }),
};

export const publicDeepTechShare = {
  read: (token) => fetch(`${BASE_URL}/public/deeptech/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `HTTP ${r.status}`);
      return body;
    }),
};

// ── Govt API Integrations ─────────────────────────────────────
// ── Phase 36: Innovation Source Discovery ──────────────────────
export const discoveryAPI = {
  students: (params = {}) => get(`/discover/students?${new URLSearchParams(params)}`),
  academia: (params = {}) => get(`/discover/academia?${new URLSearchParams(params)}`),
};

export const govtIntegrationAPI = {
  list: ()    => get('/integrations'),
  sync: (id)  => post(`/integrations/${id}/sync`),
  logs: ()    => get('/integrations/logs'),
  // Phase 35B: AI Intelligence
  aiEvaluate:           (data)          => post('/govt/ai/evaluate', data),
  aiListEvaluations:    (entityId)      => get(`/govt/ai/evaluations/${entityId}`),
  aiUpdateEvaluation:   (id, data)      => put(`/govt/ai/evaluations/${id}`, data),
  aiAdvisor:            (data)          => post('/govt/ai/advisor', data),
  aiAnalyze:            (entityId)      => post(`/govt/ai/analyze/${entityId}`),
};

// ── Profiles ─────────────────────────────────────────────────
export const profileAPI = {
  getMyProfile:   ()        => get('/profile/me'),
  updateMyProfile:(data)    => put('/profile/me', data),
  getPublic:      (userId)  => get(`/profile/${userId}`),
};

// ── Phase 7 (P7) — Profile Score AI ──────────────────────────
// Layered on top of Phase 55 deterministic completeness score.
// s24 (P7b): all 11 personas supported. Manual=30d cache + 5/day rate limit.
//            Auto-compute on save (P7c) is server-side, debounced 5min, 24h cache.
export const profileScoreAiAPI = {
  // Trigger or return cached. Pass force=true to bypass cache (still rate-limited).
  analyze:      (force = false) => post('/profile-score/analyze', { force }),
  // Read cached only — never compute. Returns nulls if never analyzed.
  getAnalysis:  ()              => get('/profile-score/analysis'),
  // Admin: force-recompute for any user, bypasses cache + rate limit.
  analyzeUser:  (userId)        => post(`/admin/profile-score/analyze/${userId}`, {}),
};

// ── Startup Profile Sections (child tables) ──────────────────
export const startupProfileAPI = {
  // section = products | team | funding | clients | patents | competitors | news | acquisitions
  list:   (section)          => get(`/startup-profile/${section}`),
  create: (section, data)    => post(`/startup-profile/${section}`, data),
  update: (section, id, data) => put(`/startup-profile/${section}/${id}`, data),
  remove: (section, id)      => del(`/startup-profile/${section}/${id}`),
  // Full public profile (for corporates/investors)
  getFullProfile: (userId)   => get(`/startup-profile/public/${userId}`),
};

// ── Corporate Features ───────────────────────────────────────
export const corporateAPI = {
  dashboard:         ()              => get('/corporate/dashboard'),
  getTaxonomy:       ()              => get('/corporate/taxonomy'),
  searchStartups:    (params = {})   => get(`/corporate/startups?${new URLSearchParams(params)}`),
  recommendations:   (params = {})   => get(`/corporate/recommendations?${new URLSearchParams(params)}`),
  createChallenge:   (data)          => post('/corporate/challenges', data),
  listChallenges:    (params = {})   => get(`/corporate/challenges?${new URLSearchParams(params)}`),
  getChallenge:      (id)            => get(`/corporate/challenges/${id}`),
  updateChallenge:   (id, data)      => put(`/corporate/challenges/${id}`, data),
  deleteChallenge:   (id)            => del(`/corporate/challenges/${id}`),
  updateApplication: (cid, aid, data) => put(`/corporate/challenges/${cid}/applications/${aid}`, data),
  createCollab:      (data)          => post('/corporate/collaborations', data),
  listCollabs:       (params = {})   => get(`/corporate/collaborations?${new URLSearchParams(params)}`),
  updateCollab:      (id, data)      => put(`/corporate/collaborations/${id}`, data),
  exportChallengePdf: (id)           => blobRequest('GET', `/corporate/challenges/${id}/pdf`),
  // Templates
  listTemplates:     ()              => get('/corporate/templates'),
  createTemplate:    (data)          => post('/corporate/templates', data),
  deleteTemplate:    (id)            => del(`/corporate/templates/${id}`),
  // Team members
  listMembers:       (cid)           => get(`/corporate/challenges/${cid}/members`),
  addMember:         (cid, data)     => post(`/corporate/challenges/${cid}/members`, data),
  updateMember:      (cid, uid, data) => put(`/corporate/challenges/${cid}/members/${uid}`, data),
  removeMember:      (cid, uid)      => del(`/corporate/challenges/${cid}/members/${uid}`),
  // Bug #2: reviewer-side inbox
  myReviewerQueue:   ()              => get('/challenges/my-reviewer-queue'),
  // Application notes & docs
  listAppNotes:      (cid, aid)      => get(`/corporate/challenges/${cid}/applications/${aid}/notes`),
  createAppNote:     (cid, aid, data) => post(`/corporate/challenges/${cid}/applications/${aid}/notes`, data),
  listAppDocs:       (cid, aid)      => get(`/corporate/challenges/${cid}/applications/${aid}/documents`),
  createAppDoc:      (cid, aid, data) => post(`/corporate/challenges/${cid}/applications/${aid}/documents`, data),
  // Challenge recommendations
  challengeRecs:     (id)            => get(`/corporate/challenges/${id}/recommended-startups`),
  // Collaboration milestones
  listMilestones:    (coId)          => get(`/corporate/collaborations/${coId}/milestones`),
  createMilestone:   (coId, data)    => post(`/corporate/collaborations/${coId}/milestones`, data),
  updateMilestone:   (coId, mid, data) => put(`/corporate/collaborations/${coId}/milestones/${mid}`, data),
  deleteMilestone:   (coId, mid)     => del(`/corporate/collaborations/${coId}/milestones/${mid}`),
  // Collaboration tasks
  listTasks:         (coId)          => get(`/corporate/collaborations/${coId}/tasks`),
  createTask:        (coId, data)    => post(`/corporate/collaborations/${coId}/tasks`, data),
  updateTask:        (coId, tid, data) => put(`/corporate/collaborations/${coId}/tasks/${tid}`, data),
  deleteTask:        (coId, tid)     => del(`/corporate/collaborations/${coId}/tasks/${tid}`),
  // Phase 35: Corporate AI Intelligence
  aiEvaluate:        (data)          => post('/corporate/evaluations', data),
  listEvaluations:   (challengeId)   => get(`/corporate/evaluations/${challengeId}`),
  updateEvaluation:  (id, data)      => put(`/corporate/evaluations/${id}`, data),
  aiAdvisor:         (data)          => post('/corporate/challenges/ai-advisor', data),
  aiAnalyze:         (challengeId)   => post(`/corporate/challenges/${challengeId}/ai-analyze`),
  // T32-99c: corporate-side invite ops
  sendInvites:       (cid, data)     => post(`/challenges/${cid}/invites`, data),
  listInvites:       (cid)           => get(`/challenges/${cid}/invites`),
  revokeInvite:      (cid, iid, source) => del(`/challenges/${cid}/invites/${iid}${source ? `?source=${encodeURIComponent(source)}` : ''}`),
  // Phase 101 Sub-C: remindInvitee — re-send the invite email as a reminder
  remindInvitee:     (cid, iid, data) => post(`/challenges/${cid}/invites/${iid}/remind`, data || {}),
};

// ── Partner API self-serve key management (Enterprise) ────────
export const partnerAPI = {
  listKeys:  ()     => get('/partner-api/keys'),
  createKey: (name) => post('/partner-api/keys', { name }),
  deleteKey: (id)   => del(`/partner-api/keys/${id}`),
};

// ── SSO config self-serve (Enterprise) — Phase 127 ─────────────
export const ssoAPI = {
  getConfig:    ()     => get('/corporate/sso/config'),
  upsertConfig: (data) => post('/corporate/sso/config', data),
  deleteConfig: ()     => del('/corporate/sso/config'),
};

// ── T32-99c: invite + notification APIs ──────────────────────
export const inviteAPI = {
  myInvites: (status)   => get(`/my/challenge-invites${status ? `?status=${status}` : ''}`),
  accept:    (id)       => post(`/challenge-invites/${id}/accept`),
  decline:   (id)       => post(`/challenge-invites/${id}/decline`),
};

// ── Cross-Ecosystem Phase F: generic applicant-invite APIs ───
// One shared subsystem for the 4 call-for-applications personas
// (investor deal requests / incubator programs / accelerator batches / lab announcements).
// The controller requires entityType + entityId on every op (owner-gate).
export const applicantInviteAPI = {
  create: (entityType, entityId, { userIds = [], emails = [], message } = {}) =>
    post('/applicant-invites', { entityType, entityId, userIds, emails, message }),
  list: (entityType, entityId) =>
    get(`/applicant-invites?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`),
  revoke: (id, entityType, entityId, source) =>
    del(`/applicant-invites/${id}?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}${source ? `&source=${encodeURIComponent(source)}` : ''}`),
  remind: (id, entityType, entityId, message) =>
    post(`/applicant-invites/${id}/remind`, { entityType, entityId, message }),
  myInvites: (status) => get(`/my/applicant-invites${status ? `?status=${status}` : ''}`),
  respond: (id, status) => post(`/applicant-invites/${id}/respond`, { status }),
};

// ── Scout-add: in-app "Add Startup" ─────────────────────────
// Creates a claimable imported stub in startup_profiles. On a dedup hit the
// backend returns 409 with { error, recourse:'claim'|'join', startup:{...} },
// surfaced on the thrown error as err.status/err.recourse/err.startup.
export const startupAddAPI = {
  add: ({ company_name, website, sector, description } = {}) =>
    post('/startups/add', { company_name, website, sector, description }),
};

// ── Bulk-add: CSV "Bulk Upload" (scout-add, per-row) ────────────
// Uploads a CSV file (multipart/form-data) and returns
// { summary: {created, duplicate, error}, results: [...] } synchronously.
export const startupBulkUploadAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', '/startups/bulk-upload', formData, true);
  },
  downloadTemplate: () => blobRequest('GET', '/startups/bulk-upload/template'),
};

export const notificationAPI = {
  list:        ()        => get('/my/notifications'),
  unreadCount: ()        => get('/my/notifications/unread-count'),
  markRead:    (id)      => post(`/my/notifications/${id}/read`),
  markAllRead: ()        => post('/my/notifications/mark-all-read'),
};

// ── Investor Features ─────────────────────────────────────────
export const investorAPI = {
  dashboard:            ()              => get('/investor/dashboard'),
  recommendedStartups:  ()              => get('/investor/recommended-startups'),
  // Deals
  listDeals:            (params = {})   => get(`/investor/deals?${new URLSearchParams(params)}`),
  createDeal:           (data)          => post('/investor/deals', data),
  getDeal:              (id)            => get(`/investor/deals/${id}`),
  updateDeal:           (id, data)      => put(`/investor/deals/${id}`, data),
  // Evaluations
  addEvaluation:        (dealId, data)  => post(`/investor/deals/${dealId}/evaluations`, data),
  listEvaluations:      (dealId)        => get(`/investor/deals/${dealId}/evaluations`),
  // Deal milestones
  listDealMilestones:   (dealId)        => get(`/investor/deals/${dealId}/milestones`),
  createDealMilestone:  (dealId, data)  => post(`/investor/deals/${dealId}/milestones`, data),
  updateDealMilestone:  (dealId, mid, d) => put(`/investor/deals/${dealId}/milestones/${mid}`, d),
  deleteDealMilestone:  (dealId, mid)   => del(`/investor/deals/${dealId}/milestones/${mid}`),
  // Deal tasks
  listDealTasks:        (dealId)        => get(`/investor/deals/${dealId}/tasks`),
  createDealTask:       (dealId, data)  => post(`/investor/deals/${dealId}/tasks`, data),
  updateDealTask:       (dealId, tid, d) => put(`/investor/deals/${dealId}/tasks/${tid}`, d),
  deleteDealTask:       (dealId, tid)   => del(`/investor/deals/${dealId}/tasks/${tid}`),
  // Portfolio
  listPortfolio:        ()              => get('/investor/portfolio'),
  addToPortfolio:       (data)          => post('/investor/portfolio', data),
  updatePortfolio:      (id, data)      => put(`/investor/portfolio/${id}`, data),
  // Phase 31: Deal Sourcing
  listDealRequests:     ()              => get('/investor/deal-requests'),
  createDealRequest:    (data)          => post('/investor/deal-requests', data),
  getDealRequest:       (id)            => get(`/investor/deal-requests/${id}`),
  updateDealRequest:    (id, data)      => put(`/investor/deal-requests/${id}`, data),
  deleteDealRequest:    (id)            => del(`/investor/deal-requests/${id}`),
  updateDealRequestApp: (drId, appId, d) => put(`/investor/deal-requests/${drId}/applications/${appId}`, d),
  promoteToPipeline:    (drId, appId)   => post(`/investor/deal-requests/${drId}/promote/${appId}`),
  // Phase 35B: AI Intelligence
  aiEvaluate:           (data)          => post('/investor/ai/evaluate', data),
  aiListEvaluations:    (entityId)      => get(`/investor/ai/evaluations/${entityId}`),
  aiUpdateEvaluation:   (id, data)      => put(`/investor/ai/evaluations/${id}`, data),
  aiAdvisor:            (data)          => post('/investor/ai/advisor', data),
  aiAnalyze:            (entityId)      => post(`/investor/ai/analyze/${entityId}`),
};

// ── Incubator Features (Phase 16A) ───────────────────────────
export const incubatorAPI = {
  dashboard:            ()              => get('/incubator/dashboard'),
  recommendedStartups:  ()              => get('/incubator/recommended-startups'),
  // Programs
  listPrograms:         (params = {})   => get(`/incubator/programs?${new URLSearchParams(params)}`),
  createProgram:        (data)          => post('/incubator/programs', data),
  getProgram:           (id)            => get(`/incubator/programs/${id}`),
  updateProgram:        (id, data)      => put(`/incubator/programs/${id}`, data),
  deleteProgram:        (id)            => del(`/incubator/programs/${id}`),
  // Program startups (pipeline)
  listProgramStartups:  (id)            => get(`/incubator/programs/${id}/startups`),
  addProgramStartup:    (id, data)      => post(`/incubator/programs/${id}/startups`, data),
  updateProgramStartup: (id, sid, data) => put(`/incubator/programs/${id}/startups/${sid}`, data),
  removeProgramStartup: (id, sid)       => del(`/incubator/programs/${id}/startups/${sid}`),
  // Mentor pool
  listMentorPool:       ()              => get('/incubator/mentor-pool'),
  addMentorToPool:      (data)          => post('/incubator/mentor-pool', data),
  updateMentorInPool:   (mid, data)     => put(`/incubator/mentor-pool/${mid}`, data),
  removeMentorFromPool: (mid)           => del(`/incubator/mentor-pool/${mid}`),
  // Mentor assignments
  listAssignments:      (id)            => get(`/incubator/programs/${id}/assignments`),
  createAssignment:     (id, data)      => post(`/incubator/programs/${id}/assignments`, data),
  updateAssignment:     (id, aid, data) => put(`/incubator/programs/${id}/assignments/${aid}`, data),
  deleteAssignment:     (id, aid)       => del(`/incubator/programs/${id}/assignments/${aid}`),
  // Milestones
  listMilestones:       (id)            => get(`/incubator/programs/${id}/milestones`),
  createMilestone:      (id, data)      => post(`/incubator/programs/${id}/milestones`, data),
  updateMilestone:      (id, mid, data) => put(`/incubator/programs/${id}/milestones/${mid}`, data),
  deleteMilestone:      (id, mid)       => del(`/incubator/programs/${id}/milestones/${mid}`),
  // Phase 35B: AI Intelligence
  aiEvaluate:           (data)          => post('/incubator/ai/evaluate', data),
  aiListEvaluations:    (entityId)      => get(`/incubator/ai/evaluations/${entityId}`),
  aiUpdateEvaluation:   (id, data)      => put(`/incubator/ai/evaluations/${id}`, data),
  aiAdvisor:            (data)          => post('/incubator/ai/advisor', data),
  aiAnalyze:            (entityId)      => post(`/incubator/ai/analyze/${entityId}`),
};

// ── Accelerator Features (Phase 16B) ─────────────────────────
export const acceleratorAPI = {
  dashboard:            ()              => get('/accelerator/dashboard'),
  recommendedStartups:  ()              => get('/accelerator/recommended-startups'),
  // Batches
  listBatches:          (params = {})   => get(`/accelerator/batches?${new URLSearchParams(params)}`),
  createBatch:          (data)          => post('/accelerator/batches', data),
  getBatch:             (id)            => get(`/accelerator/batches/${id}`),
  updateBatch:          (id, data)      => put(`/accelerator/batches/${id}`, data),
  deleteBatch:          (id)            => del(`/accelerator/batches/${id}`),
  // Batch startups (pipeline)
  listBatchStartups:    (id)            => get(`/accelerator/batches/${id}/startups`),
  addBatchStartup:      (id, data)      => post(`/accelerator/batches/${id}/startups`, data),
  updateBatchStartup:   (id, sid, data) => put(`/accelerator/batches/${id}/startups/${sid}`, data),
  removeBatchStartup:   (id, sid)       => del(`/accelerator/batches/${id}/startups/${sid}`),
  // Demo days
  listDemoDays:         ()              => get('/accelerator/demo-days'),
  createDemoDay:        (data)          => post('/accelerator/demo-days', data),
  updateDemoDay:        (id, data)      => put(`/accelerator/demo-days/${id}`, data),
  deleteDemoDay:        (id)            => del(`/accelerator/demo-days/${id}`),
  // Corporate partners
  listCorporatePartners:()              => get('/accelerator/corporate-partners'),
  addCorporatePartner:  (data)          => post('/accelerator/corporate-partners', data),
  updateCorporatePartner:(pid, data)    => put(`/accelerator/corporate-partners/${pid}`, data),
  removeCorporatePartner:(pid)          => del(`/accelerator/corporate-partners/${pid}`),
  // Investor network
  listInvestorNetwork:  ()              => get('/accelerator/investors'),
  addInvestor:          (data)          => post('/accelerator/investors', data),
  updateInvestor:       (iid, data)     => put(`/accelerator/investors/${iid}`, data),
  removeInvestor:       (iid)           => del(`/accelerator/investors/${iid}`),
  // Batch milestones
  listBatchMilestones:  (id)            => get(`/accelerator/batches/${id}/milestones`),
  createBatchMilestone: (id, data)      => post(`/accelerator/batches/${id}/milestones`, data),
  updateBatchMilestone: (id, mid, data) => put(`/accelerator/batches/${id}/milestones/${mid}`, data),
  deleteBatchMilestone: (id, mid)       => del(`/accelerator/batches/${id}/milestones/${mid}`),
  // Phase 35B: AI Intelligence
  aiEvaluate:           (data)          => post('/accelerator/ai/evaluate', data),
  aiListEvaluations:    (entityId)      => get(`/accelerator/ai/evaluations/${entityId}`),
  aiUpdateEvaluation:   (id, data)      => put(`/accelerator/ai/evaluations/${id}`, data),
  aiAdvisor:            (data)          => post('/accelerator/ai/advisor', data),
  aiAnalyze:            (entityId)      => post(`/accelerator/ai/analyze/${entityId}`),
};

// ── Program Service Partners (Phase 16B.1, shared incubator+accelerator) ───
export const programPartnersAPI = {
  list:             ()               => get('/program-partners'),
  directory:        (params = {})    => get(`/program-partners/directory?${new URLSearchParams(params)}`),
  add:              (data)           => post('/program-partners', data),
  update:           (id, data)       => put(`/program-partners/${id}`, data),
  remove:           (id)             => del(`/program-partners/${id}`),
};

// ── Portfolio 8-Vector Evaluations (Phase 16B.4, shared incubator+accelerator) ───
export const portfolioEvalsAPI = {
  list:             (params = {})    => get(`/program-evals?${new URLSearchParams(params)}`),
  create:           (data)            => post('/program-evals', data),
  get:              (id)              => get(`/program-evals/${id}`),
  update:           (id, data)        => put(`/program-evals/${id}`, data),
  remove:           (id)              => del(`/program-evals/${id}`),
  portfolioHealth:  (params = {})    => get(`/program-evals/portfolio-health?${new URLSearchParams(params)}`),
  // Phase 111 Ship 2d (25 May 2026) — sharing
  pdfUrl:           (id)              => `${BASE_URL}/program-evals/${id}/pdf`,
  createShare:      (id, opts = {})   => post(`/program-evals/${id}/shares`, opts),
  listShares:       (id)              => get(`/program-evals/${id}/shares`),
  revokeShare:      (shareId)         => del(`/program-evals/shares/${shareId}`),
};

// Phase 111 Ship 2d — public unauthed read by share token
export const publicProgramEvalShare = {
  read: (token) => fetch(`${BASE_URL}/public/program-evals/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `HTTP ${r.status}`);
      return body;
    }),
};

// ── Service Provider Enhancement (Phase 16C) ────────────────
export const spAPI = {
  dashboard:      ()           => get('/sp/dashboard'),
  listServices:   ()           => get('/sp/services'),
  createService:  (data)       => post('/sp/services', data),
  updateService:  (id, data)   => put(`/sp/services/${id}`, data),
  deleteService:  (id)         => del(`/sp/services/${id}`),
  listClients:    ()           => get('/sp/clients'),
  createClient:   (data)       => post('/sp/clients', data),
  updateClient:   (id, data)   => put(`/sp/clients/${id}`, data),
  deleteClient:   (id)         => del(`/sp/clients/${id}`),
  listReviews:    (userId)     => get(userId ? `/sp/reviews/${userId}` : '/sp/reviews'),
  createReview:   (data)       => post('/sp/reviews', data),
};

// ── Mentor Enhancement (Phase 16D) ──────────────────────────
export const mentorEnhAPI = {
  dashboard:         ()           => get('/mentor-enh/dashboard'),
  listSessions:      (params={})  => get(`/mentor-enh/sessions?${new URLSearchParams(params)}`),
  createSession:     (data)       => post('/mentor-enh/sessions', data),
  updateSession:     (id, data)   => put(`/mentor-enh/sessions/${id}`, data),
  deleteSession:     (id)         => del(`/mentor-enh/sessions/${id}`),
  getAvailability:   ()           => get('/mentor-enh/availability'),
  setAvailability:   (slots)      => put('/mentor-enh/availability', { slots }),
};

// ── Lab Enhancement (Phase 16E) ─────────────────────────────
export const labEnhAPI = {
  dashboard:          ()           => get('/lab-enh/dashboard'),
  listEquipment:      ()           => get('/lab-enh/equipment'),
  createEquipment:    (data)       => post('/lab-enh/equipment', data),
  updateEquipment:    (id, data)   => put(`/lab-enh/equipment/${id}`, data),
  deleteEquipment:    (id)         => del(`/lab-enh/equipment/${id}`),
  listBookings:       ()           => get('/lab-enh/bookings'),
  createBooking:      (data)       => post('/lab-enh/bookings', data),
  updateBooking:      (id, data)   => put(`/lab-enh/bookings/${id}`, data),
  listPublications:   ()           => get('/lab-enh/publications'),
  createPublication:  (data)       => post('/lab-enh/publications', data),
  deletePublication:  (id)         => del(`/lab-enh/publications/${id}`),
};

// ── Lab Facility Announcements (Cross-Ecosystem Visibility Phase C) ──
// Owner: manage own "call for applications". Public: any logged-in persona
// browses OPEN+PUBLIC announcements from OTHER labs (self-excluded server-side).
export const labAnnouncementAPI = {
  // Owner-scoped
  list:        ()           => get('/lab-announcements'),
  create:      (data)       => post('/lab-announcements', data),
  update:      (id, data)   => put(`/lab-announcements/${id}`, data),
  remove:      (id)         => del(`/lab-announcements/${id}`),
  // Cross-org browse (auth required, any persona)
  listPublic:  (params={})  => get(`/lab-announcements/public?${new URLSearchParams(params)}`),
  getPublic:   (id)         => get(`/lab-announcements/public/${id}`),
};

// ── Academia Enhancement (Phase 16G) ────────────────────────
export const academiaEnhAPI = {
  dashboard:            ()           => get('/academia-enh/dashboard'),
  listProjects:         ()           => get('/academia-enh/projects'),
  createProject:        (data)       => post('/academia-enh/projects', data),
  updateProject:        (id, data)   => put(`/academia-enh/projects/${id}`, data),
  deleteProject:        (id)         => del(`/academia-enh/projects/${id}`),
  listPublications:     ()           => get('/academia-enh/publications'),
  createPublication:    (data)       => post('/academia-enh/publications', data),
  updatePublication:    (id, data)   => put(`/academia-enh/publications/${id}`, data),
  deletePublication:    (id)         => del(`/academia-enh/publications/${id}`),
  listGrants:           ()           => get('/academia-enh/grants'),
  createGrant:          (data)       => post('/academia-enh/grants', data),
  updateGrant:          (id, data)   => put(`/academia-enh/grants/${id}`, data),
  deleteGrant:          (id)         => del(`/academia-enh/grants/${id}`),
  // s32 P1.4 Discovery surface — startups recommended via cluster bridge
  recommendedStartups:  ()           => get('/academia/recommended-startups'),
};

// ── Student Enhancement (Phase 16F) ─────────────────────────
export const studentEnhAPI = {
  dashboard:            ()           => get('/student-enh/dashboard'),
  listProjects:         ()           => get('/student-enh/projects'),
  createProject:        (data)       => post('/student-enh/projects', data),
  updateProject:        (id, data)   => put(`/student-enh/projects/${id}`, data),
  deleteProject:        (id)         => del(`/student-enh/projects/${id}`),
  listCertifications:   ()           => get('/student-enh/certifications'),
  createCertification:  (data)       => post('/student-enh/certifications', data),
  updateCertification:  (id, data)   => put(`/student-enh/certifications/${id}`, data),
  deleteCertification:  (id)         => del(`/student-enh/certifications/${id}`),
  listMentorships:      (params={})  => get(`/student-enh/mentorships?${new URLSearchParams(params)}`),
  createMentorship:     (data)       => post('/student-enh/mentorships', data),
  updateMentorship:     (id, data)   => put(`/student-enh/mentorships/${id}`, data),
  deleteMentorship:     (id)         => del(`/student-enh/mentorships/${id}`),
  // s32 P1.4 Discovery surface — startups recommended via cluster bridge
  recommendedStartups:  ()           => get('/student/recommended-startups'),
  // Investor/discovery view of another student's structured portfolio.
  portfolioByUser:      (userId)     => get(`/student-enh/${userId}/portfolio`),
  // My Portfolio public share links.
  createPortfolioShare: (opts = {})  => post('/student-enh/portfolio/shares', opts),
  listPortfolioShares:  ()           => get('/student-enh/portfolio/shares'),
  revokePortfolioShare: (shareId)    => del(`/student-enh/portfolio/shares/${shareId}`),
};

// PUBLIC unauthed read by share token. Hits /api/public/student-portfolio/share/:token.
export const publicStudentPortfolioShare = {
  read: (token) => fetch(`${BASE_URL}/public/student-portfolio/share/${encodeURIComponent(token)}`)
    .then(async r => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || body.error || `HTTP ${r.status}`);
      return body;
    }),
};

// ── s36 Recommendations click-through analytics ──────────────
// trackClick fires a POST and returns immediately (204). Don't await on
// the click handler — navigation must not be gated by analytics.
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
export const crawlAPI = {
  stats:           ()                => get('/crawl/stats'),
  listSources:     ()                => get('/crawl/sources'),
  createSource:    (data)            => post('/crawl/sources', data),
  toggleSource:    (id)              => put(`/crawl/sources/${id}/toggle`),
  triggerCrawl:    (id)              => post(`/crawl/sources/${id}/trigger`),
  listStartups:    (params = {})     => get(`/crawl/startups?${new URLSearchParams(params)}`),
  getStartup:      (id)              => get(`/crawl/startups/${id}`),
  approveStartup:  (id)              => put(`/crawl/startups/${id}/approve`),
  rejectStartup:   (id, reason)      => put(`/crawl/startups/${id}/reject`, { reason }),
  approveBatch:    (payload)         => post('/crawl/startups/batch/approve', payload),
  rejectBatch:     (ids, reason)     => post('/crawl/startups/batch/reject', { ids, reason }),
  runSchedule:     (id)              => post(`/crawl/schedules/${id}/run`),
  listJobs:        ()                => get('/crawl/jobs'),
  // Phase 58: Unified pipeline health (worker + watchdog + retries + RSS auto-disable + pool)
  pipelineHealth:  ()                => get('/pipeline/health'),
  // Phase 23: Imported startups
  listImported:    (params = {})     => get(`/crawl/imported?${new URLSearchParams(params)}`),
  // Phase 29: Enrichment
  enrichProfile:     (userId)         => post(`/crawl/enrich/${userId}`),
  batchEnrich:       ()               => post('/crawl/enrich/batch'),
  listEnrichment:    (params = {})    => get(`/crawl/enrichment?${new URLSearchParams(params)}`),
  enrichmentStats:   ()               => get('/crawl/enrichment/stats'),
  getEnrichment:     (id)             => get(`/crawl/enrichment/${id}`),
  approveEnrichment: (id, fields)     => put(`/crawl/enrichment/${id}/approve`, { fields }),
  rejectEnrichment:  (id, reason)     => put(`/crawl/enrichment/${id}/reject`, { reason }),
  approveEnrichmentBatch: (payload)   => post('/crawl/enrichment/batch/approve', payload),
  rejectEnrichmentBatch:  (ids, reason) => post('/crawl/enrichment/batch/reject', { ids, reason }),
  requestCrawl:      (query)          => post('/crawl/request', { query }),
  myRequests:        ()               => get('/crawl/requests/mine'),
  listSchedules:     ()               => get('/crawl/schedules'),
  createSchedule:    (data)           => post('/crawl/schedules', data),
  toggleSchedule:    (id)             => put(`/crawl/schedules/${id}/toggle`),
  // Phase 38: Self-service auto-fill for startup owners
  autoFillMyProfile: (force = false)        => post('/enrich/my-profile', { force }),
  applyMyAutoFill:   (enrichmentId, fields) => post('/enrich/my-profile/apply', { enrichment_id: enrichmentId, fields }),
  autoFillQuota:     ()                     => get('/enrich/my-profile/quota'),
};

// ── Directory Crawlers (Phase 51) ──────────────────────────
// Admin-only: run directory-source crawlers (YC, Product Hunt, etc.),
// view run history and per-source stats, bulk auto-approve rows.
export const directoryCrawlAPI = {
  stats:             ()                       => get('/directory-crawl/stats'),
  listRuns:          (params = {})            => get(`/directory-crawl/runs?${new URLSearchParams(params)}`),
  getRun:            (id)                     => get(`/directory-crawl/runs/${id}`),
  runYC:             (params = {})            => post('/directory-crawl/run/yc', params),
  autoApprove:       (source, limit = 500)    => post(`/directory-crawl/approve/${source}`, { limit }),
};

// ── Profile Claiming (Phase 53) ─────────────────────────────
export const claimAPI = {
  // User endpoints
  detect:       ()                            => post('/claims/detect', {}),
  request:      (data)                        => post('/claims/request', data),
  mine:         ()                            => get('/claims/mine'),
  verify:       (token)                       => get(`/claims/verify/${token}`),
  // Admin endpoints
  list:         (params = {})                 => get(`/claims?${new URLSearchParams(params)}`),
  detail:       (id)                          => get(`/claims/${id}`),
  approve:      (id, admin_note)              => put(`/claims/${id}/approve`, { admin_note }),
  reject:       (id, admin_note)              => put(`/claims/${id}/reject`, { admin_note }),
  rollback:     (id, admin_note)              => post(`/claims/${id}/rollback`, { admin_note }),
};

// ── Admin Console (Phase 28) ────────────────────────────────
export const adminAPI = {
  // System
  systemHealth:       ()            => get('/admin/system-health'),
  // Users
  listUsers:          (params = {}) => get(`/admin/users?${new URLSearchParams(params)}`),
  getUser:            (id)          => get(`/admin/users/${id}`),
  updateUser:         (id, data)    => put(`/admin/users/${id}`, data),
  overridePlan:       (id, plan)    => put(`/admin/users/${id}/plan`, { plan }),
  toggleActive:       (id)          => put(`/admin/users/${id}/toggle-active`),
  deleteUser:         (id)          => del(`/admin/users/${id}`),
  // Challenges
  listChallenges:     (params = {}) => get(`/admin/challenges?${new URLSearchParams(params)}`),
  updateChallengeStatus: (id, status) => put(`/admin/challenges/${id}/status`, { status }),
  toggleFeature:      (id)          => put(`/admin/challenges/${id}/feature`),
  deleteChallenge:    (id)          => del(`/admin/challenges/${id}`),
  // Startups
  listStartups:       (params = {}) => get(`/admin/startups?${new URLSearchParams(params)}`),
  updateStartup:      (id, data)    => put(`/admin/startups/${id}`, data),
  deleteStartup:      (id)          => del(`/admin/startups/${id}`),
  findDuplicates:     ()            => get('/admin/startups/duplicates'),
  mergeStartups:     (primary_id, secondary_ids) => post('/admin/startups/merge', { primary_id, secondary_ids }),
  // Licenses
  listLicenses:       (params = {}) => get(`/admin/licenses?${new URLSearchParams(params)}`),
  resetUsage:         (id, feature) => put(`/admin/licenses/${id}/reset-usage`, { feature }),
  // P7d (s24): Profile Score AI distribution (histogram + per-persona + outliers + intent)
  profileScoreDistribution: ()       => get('/admin/profile-score/distribution'),
  // s30 P1.3: Stage B cluster_boost telemetry (summary + per_persona + top_anchor_clusters)
  clusterBoostImpact:       (windowDays = 30) => get(`/admin/clusters/boost-impact?window_days=${windowDays}`),
  // s36: click-through analytics (per_persona CTR + top startups + top clusters + lift effect)
  clusterClickImpact:       (windowDays = 30) => get(`/admin/clusters/click-impact?window_days=${windowDays}`),
  // Phase 102-3: admin cost dashboard
  costsSummary:             ()              => get('/admin/costs/summary'),
  // A: Admin Platform-Health dashboard
  platformHealth:           ()              => get('/admin/dashboard/platform-health'),
  costsAlerts:              ()              => get('/admin/costs/alerts'),
  costsManual:              (data)          => post('/admin/costs/manual', data),
  costsClearAlert:          (id)            => del(`/admin/costs/alerts/${id}`),
  // R: DR Drill + db-backup workflow history via GitHub Actions API
  drillHistory:             ()              => get('/admin/drill/history'),
  // Phase 102-uptime: BetterStack uptime summary
  uptimeSummary:            ()              => get('/admin/uptime/summary'),
  // Phase 102-sentry: Sentry errors summary
  errorsSummary:            ()              => get('/admin/errors/summary'),
  // Phase 119: Email outbox health (queue depth, recent sends, exhausted alerts)
  emailOutboxHealth:        ()              => get('/admin/email-outbox'),
  emailOutboxAckAlert:      (id)            => post(`/admin/email-outbox/alerts/${id}/ack`, {}),
};
