/**
 * OpenI Hub — Innovation Brief API (s121e, 26 Sep 2026).
 * NOT part of the W5-1 verbatim split (see ./index.js) — a later addition.
 */
import { get, post, put, BASE_URL, getToken, getActiveRole } from './core';

// s122 action A2 — POST that returns a file (core's blobRequest sends no body).
async function blobPost(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  const role = getActiveRole();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (role) headers['X-Active-Role'] = role;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'OpenI-Innovation-Brief.pdf';
  return { blob: await res.blob(), name };
}

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
  // s123 — Agents working for you + Run Scout now
  agents:      ()                                => get('/brief/agents'),
  scout:       ()                                => post('/brief/scout', {}),
  landscape:   ()                                => get('/brief/landscape'),       // s123 innovation landscape
  buildMaps:   ()                                => post('/brief/maps/build', {}),  // s123 map-builder agent
  knows:       ()                                => get('/brief/knows'),            // s123 What OpenI knows
  refreshKnows: ()                               => post('/brief/knows/refresh', {}),
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
  correctLens: (payload) => put('/admin/brief-preview/lens/tag', payload),  // s123 — one-click map correction
  pdf: (payload) => blobPost('/admin/brief-preview/pdf', payload),  // s122 action A2 — brief PDF for presentations
  taste: (id) => get(`/admin/brief-preview/${id}/taste`),  // s122 — what the brief learned about a client
  // s122 — "Save to watchlist": the admin's own "<Client> — <priority>" lists, shareable with the client.
  watchlists: (client) => get(`/admin/brief-preview/watchlist?client=${encodeURIComponent(client)}`),
  saveWatchlist: (payload) => post('/admin/brief-preview/watchlist', payload),
  agents: (id) => get(`/admin/brief-preview/${id}/agents`),  // s123
  scout: (id) => post(`/admin/brief-preview/${id}/scout`, {}),  // s123
  landscape: (id) => get(`/admin/brief-preview/${id}/landscape`),  // s123
  buildMaps: (id) => post(`/admin/brief-preview/${id}/maps/build`, {}),  // s123
  knows: (id) => get(`/admin/brief-preview/${id}/knows`),  // s123
  refreshKnows: (id) => post(`/admin/brief-preview/${id}/knows/refresh`, {}),  // s123
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
