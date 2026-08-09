/**
 * OpenI Hub — API Service Layer · CORE
 *
 * VERBATIM slice of the pre-split src/services/api.js, lines 1-134 — the fetch
 * kernel every domain module depends on: BASE_URL, the token helpers, request(),
 * the verb shorthands, and blobRequest().
 *
 * ONE INTENTIONAL DEVIATION from verbatim: the safeStorage import path is
 * '../../utils/safeStorage' here (one level deeper than the original's
 * '../utils/safeStorage'). ./index.js documents how the re-concat check
 * normalizes that single line.
 *
 * Do not reformat the body between the sentinels.
 */

// ---8<--- BODY START  (pre-split api.js lines 1-134, VERBATIM)
/**
 * OpenI Hub — API Service Layer
 * Central place for all backend calls.
 * Base URL is read from .env: VITE_API_URL
 */

import safeStorage from '../../utils/safeStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ───────────────────────────────────────────
// safeStorage instead of raw localStorage: in-app WebViews / private mode can
// throw SecurityError on storage access, which would otherwise break every
// request that reads the token (Sentry OPENI-HUB-FRONTEND-F).
export function getToken()          { return safeStorage.getItem('openi_token'); }
export function setToken(t)         { safeStorage.setItem('openi_token', t); }
export function removeToken()       { safeStorage.removeItem('openi_token'); }

// Phase 60.3 (s50): active-role header. Stored in localStorage by AuthContext;
// authMiddleware on the server validates it against the user's roles[].
export function getActiveRole()     { return safeStorage.getItem('openi_active_role'); }

// ── Core fetch wrapper ──────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  const token      = getToken();
  const activeRole = getActiveRole();
  const headers    = {};

  if (token)      headers['Authorization']  = `Bearer ${token}`;
  if (activeRole) headers['X-Active-Role']  = activeRole;
  if (!isFormData) headers['Content-Type']  = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Global 401 interceptor — an expired/invalid JWT returns 401 from
    // authMiddleware on EVERY authed call. Without this, screens whose own
    // recovery actions (Retry/Skip) are themselves authed just keep 401'ing,
    // leaving the user stuck with no path out (the onboarding dead-end Tyler hit).
    // Clear the dead token and bounce to login with a session-expired reason.
    // Exempt the auth endpoints so a bad login/refresh can't trigger a redirect loop.
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (res.status === 401 && !isAuthEndpoint) {
      removeToken();
      try {
        window.dispatchEvent(new CustomEvent('openi:unauthorized', {
          detail: { message: data.message }
        }));
        if (!window.location.pathname.startsWith('/dashboard/login')) {
          window.location.href = '/dashboard/login?reason=expired';
        }
      } catch { /* SSR / non-browser context */ }
      const err = new Error(data.message || 'Your session has expired. Please sign in again.');
      err.status = 401;
      throw err;
    }
    // s49e: gated-action 403 — caller is logged in but email_verified_at IS NULL.
    // Surface a structured error with code AND emit a global event so any
    // un-caught path still surfaces an actionable UX (toast + redirect).
    if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
      try {
        window.dispatchEvent(new CustomEvent('openi:email-not-verified', {
          detail: { message: data.message }
        }));
      } catch { /* SSR / non-browser context */ }
      const err = new Error(data.message || 'Please verify your email to perform this action.');
      err.code = 'EMAIL_NOT_VERIFIED';
      err.status = 403;
      throw err;
    }
    // Generic error path. Surface the parsed body so callers can act on
    // structured responses — e.g. the createOrg 409 duplicate-recourse payload
    // { error, recourse: 'claim'|'join', org } (no `message` key), which the
    // OrgAdmin create-form catch reads to offer a claim/join CTA instead of a
    // dead-end "HTTP 409" toast.
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status   = res.status;
    if (data.recourse) err.recourse = data.recourse;
    if (data.org)      err.org      = data.org;
    if (data.startup)  err.startup  = data.startup;
    if (data.error)    err.error    = data.error;
    // Phase (upgrade journey): plan-gate 402/403 payloads carry these fields
    // so callers can render an UpgradeCTA instead of a bare toast dead-end.
    if (data.feature)     err.feature    = data.feature;
    if (data.limit != null) err.limit    = data.limit;
    if (data.used != null)  err.used     = data.used;
    if (data.plan)         err.plan      = data.plan;
    if (data.upgrade_url)  err.upgradeUrl = data.upgrade_url;
    throw err;
  }
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);

// Blob fetch for binary downloads (PDF, etc.)
async function blobRequest(method, path) {
  const token      = getToken();
  const activeRole = getActiveRole();
  const headers    = {};
  if (token)      headers['Authorization'] = `Bearer ${token}`;
  if (activeRole) headers['X-Active-Role'] = activeRole;
  const res = await fetch(`${BASE_URL}${path}`, { method, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Mirror request()'s global 401 interceptor — an expired token during a
    // PDF download must also auto-logout + redirect, not throw a raw error.
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (res.status === 401 && !isAuthEndpoint) {
      removeToken();
      try {
        window.dispatchEvent(new CustomEvent('openi:unauthorized', {
          detail: { message: err.message }
        }));
        if (!window.location.pathname.startsWith('/dashboard/login')) {
          window.location.href = '/dashboard/login?reason=expired';
        }
      } catch { /* SSR / non-browser context */ }
      const e = new Error(err.message || 'Your session has expired. Please sign in again.');
      e.status = 401;
      throw e;
    }
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.blob();
}
// ---8<--- BODY END

// Internals promoted to module exports so the 8 domain slices can reach them.
// NOT re-exported by ./index.js — they were module-private in the original and
// the public surface must stay exactly the 85 names it was.
export { BASE_URL, request, get, post, put, patch, del, blobRequest };
