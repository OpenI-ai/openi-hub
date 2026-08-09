/**
 * OpenI Hub — API Service Layer · invites domain
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 649-700.
 * Do not reformat the body between the sentinels — the re-concat check
 * documented in ./index.js diffs it byte-for-byte against the original.
 */
import { request, get, post, del, blobRequest } from './core';

// ---8<--- BODY START  (pre-split api.js lines 649-700, VERBATIM)
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
// ---8<--- BODY END
