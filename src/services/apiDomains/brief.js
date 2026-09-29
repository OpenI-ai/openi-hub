/**
 * OpenI Hub — Innovation Brief API (s121e, 26 Sep 2026).
 * NOT part of the W5-1 verbatim split (see ./index.js) — a later addition.
 */
import { get, post, put } from './core';

export const briefAPI = {
  get:         ()                                => get('/brief'),
  feedback:    (startup_user_id, action, undo, priority_label) => post('/brief/feedback', { startup_user_id, action, undo: undo === true, priority_label }),
  preferences: (payload)                         => put('/brief/preferences', payload),
  suggestions: ()                                => get('/brief/suggestions'),                 // s121j
  dismissSuggestion: (label)                     => post('/brief/suggestions/dismiss', { label }),
  // s122 — personalisation loop
  events:      (events)                          => post('/brief/events', { events }),
  taste:       ()                                => get('/brief/taste'),
  decideTaste: (key, decision)                   => put('/brief/taste', { key, decision }),
};

// s121g — admin, read-only previews.
export const briefPreviewAPI = {
  findUsers: (q)       => get(`/admin/brief-preview/users?q=${encodeURIComponent(q)}`),
  user:      (id)      => get(`/admin/brief-preview/${id}`),
  prospect:  (payload) => post('/admin/brief-preview/prospect', payload),
  editPriorities: (id, payload) => put(`/admin/brief-preview/${id}/priorities`, payload),  // s121i
  suggestions: (id) => get(`/admin/brief-preview/${id}/suggestions`),  // s121j
  label: (id, payload) => put(`/admin/brief-preview/${id}/labels`, payload),  // s121k
  quality: () => get('/admin/brief-quality'),
  painBrief: (payload) => post('/admin/brief-preview/prospect/pain-brief', payload),  // s122
  lens: (payload) => post('/admin/brief-preview/lens', payload),  // s122 — Grow / Cut / Venture lens
  taste: (id) => get(`/admin/brief-preview/${id}/taste`),  // s122 — what the brief learned about a client
};

// s122 — the agent runtime's run log (admin, read-only).
export const agentRunsAPI = {
  list: ({ graph, status, limit } = {}) => {
    const q = new URLSearchParams();
    if (graph) q.set('graph', graph);
    if (status) q.set('status', status);
    if (limit) q.set('limit', String(limit));
    const qs = q.toString();
    return get(`/admin/agent-runs${qs ? `?${qs}` : ''}`);
  },
  get: (id) => get(`/admin/agent-runs/${id}`),
};
