/**
 * OpenI Hub — API Service Layer · sharing domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 404-526.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { BASE_URL, get, post, put, patch, del } from './core';

// ---8<--- BODY START  (pre-split api.js lines 404-526, VERBATIM)
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
// ---8<--- BODY END
