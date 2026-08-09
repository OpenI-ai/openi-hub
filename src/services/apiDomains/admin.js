/**
 * OpenI Hub — API Service Layer · admin domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 1096-1208.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { get, post, put, del } from './core';

// ---8<--- BODY START  (pre-split api.js lines 1096-1208, VERBATIM)
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
// ---8<--- BODY END
