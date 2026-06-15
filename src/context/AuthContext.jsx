import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { seedFromUser } from '../services/tourService';
import { authAPI } from '../services/api';
import safeStorage from '../utils/safeStorage';

// Phase 97 — session hardening config.
// SILENT_REFRESH_INTERVAL_MS: how often we check the token's exp.
// REFRESH_THRESHOLD_MS: if exp - now < this, call /auth/refresh.
// IDLE_TIMEOUT_MS: how long of zero user activity before forced logout.
const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;  // 10 minutes
const REFRESH_THRESHOLD_MS       = 60 * 60 * 1000;  // 1 hour
const IDLE_TIMEOUT_MS            = 60 * 60 * 1000;  // 60 minutes

// Decode a JWT's payload without verifying. Used only to read `exp`, never for trust.
function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Phase 60.3 (s50) — multi-persona helpers
const ACTIVE_ROLE_KEY = 'openi_active_role';

function getRolesFromUser(u) {
  if (!u) return [];
  if (Array.isArray(u.roles) && u.roles.length) return u.roles;
  if (u.role) return [u.role];
  return [];
}
function getPrimaryRoleFromUser(u) {
  if (!u) return null;
  if (u.primary_role) return u.primary_role;
  if (Array.isArray(u.roles) && u.roles.length) return u.roles[0];
  return u.role || null;
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [mfaStep, setMfaStep]         = useState(false);
  const [mfaToken, setMfaToken]       = useState(null);  // Phase 54: server-issued challenge token
  const [activeRole, setActiveRoleState] = useState(null); // Phase 60.3
  const [loading, setLoading]         = useState(true);

  // Restore session from localStorage on page load.
  // Phase 60.10 fix: also fire a background /auth/me refetch so the cached
  // roles[] gets refreshed against the canonical backend state. Otherwise a
  // user who added a role in a previous session would see a stale roles[]
  // after page reload, because we only set localStorage at login time.
  useEffect(() => {
    let active = true;
    try {
      const storedToken = safeStorage.getItem('openi_token');
      const storedUser  = safeStorage.getItem('openi_user');
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        const stored = safeStorage.getItem(ACTIVE_ROLE_KEY);
        const roles = getRolesFromUser(parsed);
        const resolved = (stored && roles.includes(stored)) ? stored : getPrimaryRoleFromUser(parsed);
        setActiveRoleState(resolved);
        if (resolved) safeStorage.setItem(ACTIVE_ROLE_KEY, resolved);
        seedFromUser(parsed);

        // Background refresh — get canonical roles[] from server. If the user
        // added/removed a role in another session, this catches it. Failure
        // is fine — we already rendered from cache.
        fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` },
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (!active || !data?.user) return;
            const fresh = { ...data.user, token: storedToken };
            setUser(fresh);
            safeStorage.setItem('openi_user', JSON.stringify(fresh));
            // Re-resolve active role against fresh roles[] in case the cached
            // active role is no longer valid (was removed in another session).
            const freshRoles = getRolesFromUser(fresh);
            const cachedActive = safeStorage.getItem(ACTIVE_ROLE_KEY);
            const nextActive = (cachedActive && freshRoles.includes(cachedActive))
              ? cachedActive
              : getPrimaryRoleFromUser(fresh);
            if (nextActive) {
              safeStorage.setItem(ACTIVE_ROLE_KEY, nextActive);
              setActiveRoleState(nextActive);
            }
          })
          .catch(() => { /* silent — cache fallback is fine */ });
      }
    } catch {
      safeStorage.removeItem('openi_token');
      safeStorage.removeItem('openi_user');
      safeStorage.removeItem(ACTIVE_ROLE_KEY);
    } finally {
      setLoading(false);
    }
    return () => { active = false; };
  }, []);

  // Phase 60.3 — switch active role. Persists to localStorage so api.js reads
  // it for the X-Active-Role header on every authed request.
  const switchRole = (role) => {
    const roles = getRolesFromUser(user);
    if (!role || !roles.includes(role)) return false;
    safeStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRoleState(role);
    return true;
  };

  // Phase 54: login is step 1 of a possibly-two-step flow.
  // Backend returns either:
  //   { token, user }                                → logged in (no MFA required)
  //   { mfa_required: true, mfa_token }              → caller must call verifyMFA next
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    // s49e: Email-not-verified gate — backend issues a fresh code, client redirects to /verify-email
    if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
      const err = new Error(data.message || 'Please verify your email first.');
      err.code = 'EMAIL_NOT_VERIFIED';
      err.email = data.email || email.trim().toLowerCase();
      throw err;
    }
    if (!res.ok) throw new Error(data.message || 'Invalid credentials');

    if (data.mfa_required) {
      setMfaToken(data.mfa_token);
      setMfaStep(true);
      return true;
    }

    // No MFA — complete login immediately
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    const primary = getPrimaryRoleFromUser(userData);
    setActiveRoleState(primary);
    if (primary) safeStorage.setItem(ACTIVE_ROLE_KEY, primary);
    safeStorage.setItem('openi_token', data.token);
    safeStorage.setItem('openi_user', JSON.stringify(userData));
    seedFromUser(userData);
    return true;
  };

  const verifyMFA = async (code) => {
    if (!mfaToken) throw new Error('Session expired. Please log in again.');
    const res = await fetch(`${API_URL}/auth/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfa_token: mfaToken, code: String(code || '').trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid code');

    const userData = { ...data.user, token: data.token };
    setUser(userData);
    const primary = getPrimaryRoleFromUser(userData);
    setActiveRoleState(primary);
    if (primary) safeStorage.setItem(ACTIVE_ROLE_KEY, primary);
    safeStorage.setItem('openi_token', data.token);
    safeStorage.setItem('openi_user', JSON.stringify(userData));
    seedFromUser(userData);
    setMfaStep(false);
    setMfaToken(null);
    return true;
  };

  const register = async (name, email, password, role, organization_name, terms_accepted = false) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email.trim().toLowerCase(), password, role, organization_name, terms_accepted }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    // s49e: backend may return { verification_required, email } instead of { token, user }
    // when email-verify is required. Caller decides what to render next.
    if (data.verification_required) {
      return data;
    }
    // Bypass-list path (admin / *@demo.openi.ai): backend issued a session token immediately.
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    const primary = getPrimaryRoleFromUser(userData);
    setActiveRoleState(primary);
    if (primary) safeStorage.setItem(ACTIVE_ROLE_KEY, primary);
    safeStorage.setItem('openi_token', data.token);
    safeStorage.setItem('openi_user', JSON.stringify(userData));
    seedFromUser(userData);
    return data;
  };

  // s49e: After /verify-email or /verify-otp succeeds, backend returns { verified, token, user }.
  // This helper finalizes the session.
  const completeVerification = ({ token, user: userObj }) => {
    if (!token || !userObj) return false;
    const userData = { ...userObj, token };
    setUser(userData);
    const primary = getPrimaryRoleFromUser(userData);
    setActiveRoleState(primary);
    if (primary) safeStorage.setItem(ACTIVE_ROLE_KEY, primary);
    safeStorage.setItem('openi_token', token);
    safeStorage.setItem('openi_user', JSON.stringify(userData));
    seedFromUser(userData);
    return true;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    safeStorage.setItem('openi_user', JSON.stringify(updated));
  };

  // Phase 60.10 — after a roles change (POST /auth/roles/add etc), the backend
  // returns the canonical updated roles list. This helper rewrites the cached
  // user object's roles[] AND optionally flips the activeRole atomically, so
  // RoleTabs + DashboardLayout immediately see the new state without
  // depending on a re-fetch from /auth/me.
  // `nextRoles` should be an array of role strings (or objects with .role).
  const applyRolesUpdate = (nextRoles, nextActiveRole = null) => {
    if (!user) return;
    const rolesArray = (nextRoles || []).map(r => (typeof r === 'string' ? r : r?.role)).filter(Boolean);
    const updated = { ...user, roles: rolesArray };
    setUser(updated);
    safeStorage.setItem('openi_user', JSON.stringify(updated));
    if (nextActiveRole && rolesArray.includes(nextActiveRole)) {
      safeStorage.setItem(ACTIVE_ROLE_KEY, nextActiveRole);
      setActiveRoleState(nextActiveRole);
    }
  };

  const logout = () => {
    setUser(null);
    setMfaStep(false);
    setMfaToken(null);
    setActiveRoleState(null);
    safeStorage.removeItem('openi_token');
    safeStorage.removeItem('openi_user');
    safeStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  // Phase 97 — silent session refresh. Every 10 min (and on activeRole change),
  // check the token's exp claim. If <1h remains, call /auth/refresh to mint a
  // fresh 24h token. On refresh failure, do nothing — the token will expire
  // naturally and the next API call will 401, triggering logout via the
  // existing fetch wrapper. The refresh endpoint is authMiddleware-gated, so
  // it cannot recover an already-expired session.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const tick = async () => {
      const token = safeStorage.getItem('openi_token');
      if (!token) return;
      const payload = decodeJwtPayload(token);
      if (!payload?.exp) return;
      const msLeft = payload.exp * 1000 - Date.now();
      if (msLeft > REFRESH_THRESHOLD_MS) return; // plenty of time left
      try {
        const data = await authAPI.refresh();
        if (cancelled || !data?.token || !data?.user) return;
        const refreshed = { ...data.user, token: data.token };
        setUser(refreshed);
        safeStorage.setItem('openi_token', data.token);
        safeStorage.setItem('openi_user', JSON.stringify(refreshed));
      } catch {
        // silent — natural expiry path will handle it
      }
    };
    // Fire once immediately so a freshly-mounted app catches a near-expiry token,
    // then on interval.
    tick();
    const id = setInterval(tick, SILENT_REFRESH_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.id]);

  // Phase 97 — idle logout. 60 min of no mouse/keyboard/click → clear token +
  // redirect to /login?reason=idle. Timer freezes while any role="dialog"
  // element is open (Phase 96 modals + others), so users mid-form aren't
  // kicked out. Re-armed on every recognized activity event.
  const idleTimerRef = useRef(null);
  useEffect(() => {
    if (!user) return undefined;
    const arm = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        // If a modal is open, defer — re-arm and try again later.
        if (typeof document !== 'undefined' &&
            document.querySelectorAll('[role="dialog"]').length > 0) {
          arm();
          return;
        }
        try {
          safeStorage.removeItem('openi_token');
          safeStorage.removeItem('openi_user');
          safeStorage.removeItem(ACTIVE_ROLE_KEY);
        } catch { /* ignore */ }
        // Hard redirect — clears all in-memory React state including this
        // provider's `user`, and lands on Login with the idle banner.
        window.location.href = '/dashboard/login?reason=idle';
      }, IDLE_TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, arm, { passive: true }));
    arm();
    return () => {
      events.forEach(ev => window.removeEventListener(ev, arm));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user?.id]);

  if (loading) return null;

  // Phase 60.3 — derived role helpers, exposed for components that need them
  const roles        = getRolesFromUser(user);
  const primaryRole  = getPrimaryRoleFromUser(user);

  return (
    <AuthContext.Provider value={{
      user, login, logout, verifyMFA, mfaStep, register, completeVerification, updateUser,
      // Phase 60.3 multi-persona
      roles, primaryRole, activeRole, switchRole,
      // Phase 60.10 — atomic roles+activeRole refresh after backend mutations
      applyRolesUpdate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
