/**
 * OpenI Hub — API Service Layer · personas domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 701-968.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { BASE_URL, get, post, put, del } from './core';

// ---8<--- BODY START  (pre-split api.js lines 701-968, VERBATIM)
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
// ---8<--- BODY END
