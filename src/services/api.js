/**
 * OpenI Hub — API Service Layer
 * Central place for all backend calls.
 * Base URL is read from .env: VITE_API_URL
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ───────────────────────────────────────────
export function getToken()          { return localStorage.getItem('openi_token'); }
export function setToken(t)         { localStorage.setItem('openi_token', t); }
export function removeToken()       { localStorage.removeItem('openi_token'); }

// ── Core fetch wrapper ──────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  const token   = getToken();
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const del    = (path)        => request('DELETE', path);

// Blob fetch for binary downloads (PDF, etc.)
async function blobRequest(method, path) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `HTTP ${res.status}`); }
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

// ── Organizations (Phase 21) ─────────────────────────────────
export const orgAPI = {
  getMyOrg:       ()           => get('/org/my-org'),
  create:         (data)       => post('/org', data),
  update:         (data)       => put('/org', data),
  inviteMember:   (data)       => post('/org/members', data),
  updateMember:   (id, data)   => put(`/org/members/${id}`, data),
  removeMember:   (id)         => del(`/org/members/${id}`),
};

// ── Subscriptions ─────────────────────────────────────────────
export const subscriptionAPI = {
  getPlans:      ()       => get('/subscription/plans'),
  getMyPlan:     ()       => get('/subscription/my-plan'),
  createOrder:   (data)   => post('/subscription/create-order', data),
  verifyPayment: (data)   => post('/subscription/verify-payment', data),
  cancel:        ()       => post('/subscription/cancel'),
  downloadInvoice: (paymentId) => blobRequest('GET', `/subscription/invoice/${paymentId}`),
  featureAccess: ()       => get('/subscription/feature-access'),
};

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login:          (email, password) => post('/auth/login', { email, password }),
  me:             ()                => get('/auth/me'),
  changePassword: (currentPassword, newPassword) => put('/auth/change-password', { currentPassword, newPassword }),
  updateProfile:  (data)            => put('/auth/profile', data),
};

// ── Dashboard ───────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => get('/dashboard/stats'),
};

// ── Startups ────────────────────────────────────────────────
export const startupAPI = {
  list:           (params = {}) => get(`/startups?${new URLSearchParams(params)}`),
  get:            (id)          => get(`/startups/${id}`),
  create:         (data)        => post('/startups', data),
  update:         (id, data)    => put(`/startups/${id}`, data),
  delete:         (id)          => del(`/startups/${id}`),
  getEvaluations: (id)          => get(`/startups/${id}/evaluations`),
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
  register: (id)          => post(`/events/${id}/register`),
};

// ── Feedback ────────────────────────────────────────────────
export const feedbackAPI = {
  list:      (params = {}) => get(`/feedback?${new URLSearchParams(params)}`),
  create:    (data)        => post('/feedback', data),
  respond:   (id, response) => put(`/feedback/${id}/respond`, { response }),
  analytics: ()            => get('/feedback/analytics'),
};

// ── SME Experts ─────────────────────────────────────────────
export const smeAPI = {
  list:   (params = {}) => get(`/sme?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/sme/${id}`),
  create: (data)        => post('/sme', data),
  update: (id, data)    => put(`/sme/${id}`, data),
};

// ── IPR Records ───────────────────────────────────────────────
export const iprAPI = {
  list:   (params = {}) => get(`/ipr?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/ipr/${id}`),
  create: (data)        => post('/ipr', data),
  update: (id, data)    => put(`/ipr/${id}`, data),
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
};

// ── DeepTech Assessments ──────────────────────────────────────
export const deeptechAPI = {
  list:   (params = {}) => get(`/deeptech?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/deeptech/${id}`),
  create: (data)        => post('/deeptech', data),
};

// ── Govt API Integrations ─────────────────────────────────────
export const govtIntegrationAPI = {
  list: ()    => get('/integrations'),
  sync: (id)  => post(`/integrations/${id}/sync`),
  logs: ()    => get('/integrations/logs'),
};

// ── Profiles ─────────────────────────────────────────────────
export const profileAPI = {
  getMyProfile:   ()        => get('/profile/me'),
  updateMyProfile:(data)    => put('/profile/me', data),
  getPublic:      (userId)  => get(`/profile/${userId}`),
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
  recommendations:   ()              => get('/corporate/recommendations'),
  createChallenge:   (data)          => post('/corporate/challenges', data),
  listChallenges:    (params = {})   => get(`/corporate/challenges?${new URLSearchParams(params)}`),
  getChallenge:      (id)            => get(`/corporate/challenges/${id}`),
  updateChallenge:   (id, data)      => put(`/corporate/challenges/${id}`, data),
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
};

// ── Connections (Phase 18) ───────────��───────────────────────
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
  getMyApplications: ()           => get('/challenges/my-applications'),
  profileCheck:     ()            => get('/challenges/profile-check'),
};

// ── Persona Dashboard ─────────────────────────────────────────
export const personaDashboardAPI = {
  dashboard: () => get('/persona/dashboard'),
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
  getSharedChallenge: (token)      => get(`/public/challenges/share/${token}`),
  getTaxonomy:        ()            => get('/public/taxonomy'),
  // Search (Phase 14)
  globalSearch:      (q, limit = 5) => get(`/public/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  searchSuggest:     (q)            => get(`/public/search/suggest?q=${encodeURIComponent(q)}`),
  semanticSearch:    (q, type = 'startups', limit = 10) => get(`/public/search/semantic?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),
  // AI query-parsing (Phase 15)
  aiSearch:          (q, limit = 10) => get(`/public/search/ai?q=${encodeURIComponent(q)}&limit=${limit}`),
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
  listJobs:        ()                => get('/crawl/jobs'),
};
