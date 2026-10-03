/**
 * OpenI Hub — Disburse Grants API (s127, 3 Oct 2026).
 * NOT part of the W5-1 verbatim split (see ./index.js) — a later addition.
 * OpenI RECORDS grant payments a government body makes through its own treasury; it never moves money.
 */
import { get, post } from './core';

export const grantAPI = {
  schemes:       ()                     => get('/grants/schemes'),
  createScheme:  (data)                 => post('/grants/schemes', data),
  scheme:        (id)                   => get(`/grants/schemes/${id}`),
  searchStartups:(q)                    => get(`/grants/startups?q=${encodeURIComponent(q)}`),
  award:         (schemeId, data)       => post(`/grants/schemes/${schemeId}/grants`, data),
  grant:         (id)                   => get(`/grants/${id}`),
  approve:       (id, trancheId)        => post(`/grants/${id}/tranches/${trancheId}/approve`, {}),
  recordPayment: (id, trancheId, data)  => post(`/grants/${id}/tranches/${trancheId}/payment`, data),
  submitProof:   (id, trancheId, data)  => post(`/grants/${id}/tranches/${trancheId}/evidence`, data),
  mine:          ()                     => get('/grants/mine'),
};
