import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [mfaStep, setMfaStep]         = useState(false);
  const [mfaToken, setMfaToken]       = useState(null);  // Phase 54: server-issued challenge token
  const [loading, setLoading]         = useState(true);

  // Restore session from localStorage on page load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('openi_token');
      const storedUser  = localStorage.getItem('openi_user');
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('openi_token');
      localStorage.removeItem('openi_user');
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!res.ok) throw new Error(data.message || 'Invalid credentials');

    if (data.mfa_required) {
      setMfaToken(data.mfa_token);
      setMfaStep(true);
      return true;
    }

    // No MFA — complete login immediately
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
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
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
    setMfaStep(false);
    setMfaToken(null);
    return true;
  };

  const register = async (name, email, password, role, organization_name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email.trim().toLowerCase(), password, role, organization_name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    // Auto-login after registration (skip MFA for new users)
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    localStorage.setItem('openi_token', data.token);
    localStorage.setItem('openi_user', JSON.stringify(userData));
    return data;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('openi_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    setMfaStep(false);
    setMfaToken(null);
    localStorage.removeItem('openi_token');
    localStorage.removeItem('openi_user');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyMFA, mfaStep, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
