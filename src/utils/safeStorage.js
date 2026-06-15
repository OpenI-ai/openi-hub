/**
 * safeStorage — crash-proof localStorage wrapper.
 *
 * Some browsers (in-app WebViews opened from WhatsApp/Instagram/Gmail links,
 * private mode, hardened third-party-storage blocking) expose `window.localStorage`
 * but throw a SecurityError (DOMException 18) the moment any property is accessed.
 * An unguarded read at app boot then crashes the React render (Sentry
 * OPENI-HUB-FRONTEND-F: "Failed to read the 'localStorage' property from 'Window'").
 *
 * Every method here is wrapped in try/catch and degrades gracefully:
 *   - getItem → returns null on failure (caller behaves as "no stored value")
 *   - setItem / removeItem → no-op on failure
 * The app then runs unauthenticated for those visitors, which is correct: a
 * storage-denied browser cannot persist a session anyway.
 */

export function getItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const safeStorage = { getItem, setItem, removeItem };
export default safeStorage;
