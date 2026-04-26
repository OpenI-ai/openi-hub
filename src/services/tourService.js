/**
 * P4 — UI Walkthroughs state service.
 *
 * Hybrid persistence: localStorage for instant reads, backend column for cross-device sync.
 * Source of truth on server-side: users.tours_completed JSONB
 * Source of truth on client: localStorage.openi_tours (mirrored from user.tours_completed at login)
 */
import { tourAPI } from './api';

const LS_KEY = 'openi_tours';

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLS(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded etc. — non-fatal */
  }
}

/**
 * Seed localStorage from a freshly-logged-in user's tours_completed JSONB.
 * Call once after login; merges (does not overwrite) so a tour completed in
 * another browser doesn't clobber one finished locally that hasn't synced yet.
 */
export function seedFromUser(user) {
  if (!user || !user.tours_completed) return;
  const local  = readLS();
  const merged = { ...user.tours_completed, ...local };
  writeLS(merged);
}

/**
 * Whether the current user has already completed the tour for this role.
 * Checks localStorage first (fast path); the user prop is the fallback in case
 * localStorage was cleared.
 */
export function hasUserSeenTour(user, role) {
  if (!role) return true;
  const ls = readLS();
  if (ls[role]) return true;
  if (user?.tours_completed?.[role]) return true;
  return false;
}

/**
 * Mark the tour as completed for this role.
 * - Updates localStorage immediately (next render skips auto-start).
 * - Fires backend POST in the background (.catch swallow so a failure doesn't
 *   break UX). If the backend update fails the user just sees the tour again on
 *   their next device, which is acceptable.
 */
export async function markTourSeen(role) {
  if (!role) return;
  const ls = readLS();
  ls[role] = new Date().toISOString();
  writeLS(ls);
  tourAPI.markSeen(role).catch(err => {
    console.warn('[tourService] backend markSeen failed', err?.message || err);
  });
}

/** Used by the manual "Take a tour" replay button — clears nothing, just dispatches. */
export function fireReplayEvent(role) {
  window.dispatchEvent(new CustomEvent('openi-replay-tour', { detail: { role } }));
}
