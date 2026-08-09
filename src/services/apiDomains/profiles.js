/**
 * OpenI Hub — API Service Layer · profiles domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 527-648.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { get, post, put, del, blobRequest } from './core';

// ---8<--- BODY START  (pre-split api.js lines 527-648, VERBATIM)
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

// ── Audit log self-serve export (Enterprise) ───────────────────
// Backend: auditExportController.js — GET /corporate/audit-log/export,
// scoped to req.user.id. Table view uses JSON via get(); CSV/JSON file
// downloads use blobRequest() since the endpoint requires a Bearer header
// (a plain <a href> can't attach one).
export const auditLogAPI = {
  list: (params = {}) => get(`/corporate/audit-log/export?${new URLSearchParams({ ...params, format: 'json' })}`),
  exportBlob: (params = {}, format = 'csv') =>
    blobRequest('GET', `/corporate/audit-log/export?${new URLSearchParams({ ...params, format })}`),
};

// ── Bulk data export self-serve (Enterprise) ───────────────────
// Backend: dataExportController.js — GET /corporate/data-export.
export const dataExportAPI = {
  list: (params = {}) => get(`/corporate/data-export?${new URLSearchParams({ ...params, format: 'json' })}`),
  exportBlob: (params = {}, format = 'csv') =>
    blobRequest('GET', `/corporate/data-export?${new URLSearchParams({ ...params, format })}`),
};

// ── T32-99c: invite + notification APIs ──────────────────────
// ---8<--- BODY END
