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
