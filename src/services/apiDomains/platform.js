/**
 * OpenI Hub — API Service Layer · platform domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 135-262.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { BASE_URL, request, get, post, put, del, blobRequest } from './core';

// ---8<--- BODY START  (pre-split api.js lines 135-262, VERBATIM)

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
// ---8<--- BODY END
