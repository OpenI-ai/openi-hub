import { createContext, useContext, useState, useEffect } from 'react';
import { seedFromUser } from '../services/tourService';

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

  // Restore session from localStorage on page load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('openi_token');
      const storedUser  = localStorage.getItem('openi_user');
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Phase 60.3: restore active role (validated against user.roles[])
        const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
        const roles = getRolesFromUser(parsed);
        const resolved = (stored && roles.includes(stored)) ? stored : getPrimaryRoleFromUser(parsed);
        setActiveRoleState(resolved);
        if (resolved) localStorage.setItem(ACTIVE_ROLE_KEY, resolved);
        seedFromUser(parsed);
      }
    } catch {
      localStorage.removeItem('openi_token');
      localStorage.removeItem('openi_user');
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Phase 60.3 — switch active role. Persists to localStorage so api.js reads
  // it for the X-Active-Role header on every authed request.
  const switchRole = (role) => {
    const roles = getRolesFromUser(user);
    if (!role || !roles.includes(role)) return false;
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
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
    if (primary) localStorage.setItem(ACTIVE_ROLE_KEY, primary);
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
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
    if (primary) localStorage.setItem(ACTIVE_ROLE_KEY, primary);
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
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
    if (primary) localStorage.setItem(ACTIVE_ROLE_KEY, primary);
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
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
    if (primary) localStorage.setItem(ACTIVE_ROLE_KEY, primary);
    localStorage.setItem('openi_token', token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
    seedFromUser(userData);
    return true;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('openi_user', JSON.stringify(updated));
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
    localStorage.setItem('openi_user', JSON.stringify(updated));
    if (nextActiveRole && rolesArray.includes(nextActiveRole)) {
      localStorage.setItem(ACTIVE_ROLE_KEY, nextActiveRole);
      setActiveRoleState(nextActiveRole);
    }
  };

  const logout = () => {
    setUser(null);
    setMfaStep(false);
    setMfaToken(null);
    setActiveRoleState(null);
    localStorage.removeItem('openi_token');
    localStorage.removeItem('openi_user');
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

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
