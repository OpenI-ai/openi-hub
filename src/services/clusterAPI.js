/**
 * clusterAPI.js — Stage C cluster browse endpoints.
 * Mirrors the pattern in services/api.js but lives in its own file
 * to avoid editing the central API surface.
 */

import { getToken } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function get(path) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const clusterAPI = {
  list: (params) => get(`/clusters${qs(params)}`),
  getOne: (id) => get(`/clusters/${id}`),
  listStartups: (id, params) => get(`/clusters/${id}/startups${qs(params)}`),
  // Phase 68: top-N startups per sector for the hub-and-spoke diagram.
  representatives: (id, params) => get(`/clusters/${id}/representatives${qs(params)}`),
};

// s106 — standalone Innovation Maps: one micro-focused map per curated
// term across four dimensions (sector / technology / function / usecase).
export const mapsAPI = {
  list: () => get('/maps'),
  getOne: (dimension, slug) => get(`/maps/${dimension}/${slug}`),
  listStartups: (dimension, slug, params) => get(`/maps/${dimension}/${slug}/startups${qs(params)}`),
  representatives: (dimension, slug, params) => get(`/maps/${dimension}/${slug}/representatives${qs(params)}`),
  // s107 — semantic map discovery (query embedded vs term definitions).
  suggest: (q) => get(`/maps/suggest${qs({ q })}`),
  // s123 — the map as a branded PDF, for internal use. Returns { blob, name }.
  downloadPdf: async (dimension, slug) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/maps/${dimension}/${slug}/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'OpenI-Innovation-Map.pdf';
    return { blob: await res.blob(), name };
  },
};
