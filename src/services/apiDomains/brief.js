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

// s124 — GET that returns a file, with the server's file name (the board pack).
async function blobGet(path, fallbackName) {
  const headers = {};
  const token = getToken();
  const role = getActiveRole();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (role) headers['X-Active-Role'] = role;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
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
  undoCoach:   (changeId)                        => post(`/brief/coach/${changeId}/undo`, {}),  // s123 the Coach
  asks:        ()                                => get('/brief/ask'),              // s123 Ask OpenI
  ask:         (question)                        => post('/brief/ask', { question }),
  // s123 action agents (Wave 2): offers, the agent's editable draft, do it, "Not now".
  actions:       ()                              => get('/brief/actions'),
  previewAction: (key, subject)                  => post(`/brief/actions/${key}/preview`, { subject }),
  executeAction: (id, draft)                     => post(`/brief/actions/${id}/execute`, { draft }),
  dismissAction: (id)                            => post(`/brief/actions/${id}/dismiss`, {}),
  // s123 A5: AI-evaluate a startup from the brief (5 AI credits; refunded if the evaluator is down).
  evaluate:      (startupUserId, priorityKey)    => post(`/brief/evaluate/${startupUserId}`, { priority_key: priorityKey || null }),
  evaluations:   ()                              => get('/brief/evaluations'),
  // s123 the Innovation Agent (Phase 1): my next moves, "Not now", run it now.
  inbox:         ()                              => get('/brief/inbox'),
  snoozeInbox:   (id)                            => post(`/brief/inbox/${encodeURIComponent(id)}/snooze`, {}),
  runAgent:      ()                              => post('/brief/agent/run', {}),
  agentSettings: (settings)                      => put('/brief/agent/settings', settings),  // Phase 1c weekly email on/off
  pipeline:      ()                              => get('/brief/pipeline'),                    // s123 Phase 2 pilot pipeline
  // s124 Phase 3 — the CEO view: competitors' startup deals, where to venture next, the board pack.
  ceo:           ()                              => get('/brief/ceo'),
  setCompetitors: (competitors)                  => put('/brief/ceo/competitors', { competitors }),
  runCeo:        ()                              => post('/brief/ceo/run', {}),
  boardPack:     ()                              => blobGet('/brief/ceo/board-pack.pdf', 'OpenI-Board-Pack.pdf'),
  // s125 — Rajeev: "we can't download this page?" Your own brief as a PDF ('outcome' = the "By outcome" view).
  myPdf:         (view)                          => blobGet(`/brief/pdf${view === 'outcome' ? '?view=outcome' : ''}`, 'OpenI-Innovation-Brief.pdf'),
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
  coach: (id) => post(`/admin/brief-preview/${id}/coach`, {}),  // s123 the Coach
  undoCoach: (id, changeId) => post(`/admin/brief-preview/${id}/coach/${changeId}/undo`, {}),  // s123
  asks: (id) => get(`/admin/brief-preview/${id}/ask`),  // s123 Ask OpenI
  ask: (id, question) => post(`/admin/brief-preview/${id}/ask`, { question }),  // s123
};

// s122 — the agent runtime's run log (admin, read-only).
export const agentRunsAPI = {
  measures: () => get('/admin/agent-measures'),  // s126: results per client
  list: ({ graph, status, limit } = {}) => {
    const q = new URLSearchParams();
    if (graph) q.set('graph', graph);
    if (status) q.set('status', status);
    if (limit) q.set('limit', String(limit));
    const qs = q.toString();
    return get(`/admin/agent-runs${qs ? `?${qs}` : ''}`);
  },
  get: (id) => get(`/admin/agent-runs/${id}`),
  // s126 — the agent control room: every graph, its health and quality trend; pause / resume; run a nightly job now.
  graphs: () => get('/admin/agent-graphs'),
  pause: (name, paused) => post(`/admin/agent-graphs/${name}/pause`, { paused }),
  runNow: (name) => post(`/admin/agent-graphs/${name}/run`, {}),
};

// s125 — the Programme Scout agent (admin): run tonight's read now; the pages it reads and what each returned.
export const programmeScoutAPI = {
  run:     () => post('/admin/programme-scout/run', {}),
  sources: () => get('/admin/programme-scout/sources'),
};

// s124 — the analyst's sector re-check (admin): proposals to review, run it, approve / reject.
export const sectorRecheckAPI = {
  overview: ({ from, status = 'pending', confidence, limit, offset, fresh } = {}) => {
    const q = new URLSearchParams({ status });
    if (fresh) q.set('fresh', '1');   // s125: re-read the sector list
    if (from) q.set('from', from);  // s125: the eight legacy sectors and OpenI's specific ones
    if (confidence) q.set('confidence', confidence);
    if (limit) q.set('limit', String(limit));
    if (offset) q.set('offset', String(offset));
    return get(`/admin/sector-recheck?${q.toString()}`);
  },
  run: (from, { all = false } = {}) => post('/admin/sector-recheck/run', all ? { from, all: true } : { from }),  // s125: a specific sector samples first
  nightly: (from, on) => post('/admin/sector-recheck/nightly', { from, on }),  // s125: keep going every night until done
  decide: (ids, decision) => post('/admin/sector-recheck/decide', { ids, decision }),
  autoApprove: (from) => post('/admin/sector-recheck/auto', { from }),  // s125: the agent approves its high-confidence proposals now
  // s125: hide the companies behind proposals from every client list ('not_a_startup' | 'insufficient_data'); Undo.
  hide: (ids, reason) => post('/admin/sector-recheck/hide', { ids, reason }),
  unhide: (ids) => post('/admin/sector-recheck/unhide', { ids }),
  // s126: approve every pending proposal of one confidence that moves `from` to `to`; Undo one bulk.
  bulkApprove: (from, to, confidence) => post('/admin/sector-recheck/bulk', { from, to, confidence }),
  bulkUndo: (bulkId) => post('/admin/sector-recheck/bulk/undo', { bulk_id: bulkId }),
};

// s125 Phase 4d (startups): corporates with open public challenges that match this startup, by corporate.
export const startupAgentAPI = {
  matches: () => get('/startup/agent'),
  setSettings: (settings) => put('/startup/agent/settings', settings),
  // s125 — what the startup does with the requirements shown (the Programme Scout learns from it).
  callEvents: (ids, action, source) => post('/startup/agent/calls/events', { ids, action, source }),
};
