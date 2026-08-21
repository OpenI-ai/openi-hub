import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import safeStorage from '../../utils/safeStorage';

const DEMO_ACCOUNTS = [
  // V2 demo accounts — all 11 personas, password Demo@123, MFA-bypassed via *@demo.openi.ai pattern
  { email: 'startup@demo.openi.ai',          password: 'Demo@123', role: 'Startup' },
  { email: 'student@demo.openi.ai',          password: 'Demo@123', role: 'Student' },
  { email: 'academia@demo.openi.ai',         password: 'Demo@123', role: 'Academia' },
  { email: 'corporate@demo.openi.ai',        password: 'Demo@123', role: 'Corporate' },
  { email: 'govt@demo.openi.ai',             password: 'Demo@123', role: 'Government' },
  { email: 'investor@demo.openi.ai',         password: 'Demo@123', role: 'Investor' },
  { email: 'lab@demo.openi.ai',              password: 'Demo@123', role: 'Lab' },
  { email: 'incubator@demo.openi.ai',        password: 'Demo@123', role: 'Incubator' },
  { email: 'accelerator@demo.openi.ai',      password: 'Demo@123', role: 'Accelerator' },
  { email: 'serviceprovider@demo.openi.ai',  password: 'Demo@123', role: 'Service Provider' },
  { email: 'mentor@demo.openi.ai',           password: 'Demo@123', role: 'Mentor' },
];

export default function Login() {
  const { login, verifyMFA, mfaStep } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Quick-login demo panel is gated by ?demo=1 in the URL. Prevents public exposure
  // of admin@drdo.gov.in / Admin@123 etc. while keeping the convenience for testing.
  const showDemoAccounts = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '1';

  // Phase 97 — Login banner shown after idle-logout redirect.
  // Also covers reason=expired, emitted by the global 401 interceptor in api.js
  // when an expired/invalid JWT is detected mid-session.
  const loginReason = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('reason');
  const idleReason = loginReason === 'idle';
  const expiredReason = loginReason === 'expired';

  // Login-gated share links (5 Jun 2026): a ?redirect=<path> param lets an invited
  // visitor land straight on the shared profile after signing in, instead of /dashboard.
  // Only honour internal relative paths (must start with a single '/', not '//' or a
  // scheme) so the param can't be abused as an open redirect.
  const redirectTarget = (() => {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('redirect');
    if (!raw) return null;
    if (!raw.startsWith('/') || raw.startsWith('//')) return null;
    return raw;
  })();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // If backend short-circuited MFA (demo personas / mfa_bypass_login=true),
      // login() set user + saved localStorage. mfaStep stays false → navigate now.
      // If MFA is required, mfaStep flips true and we render the OTP form instead.
      // Read user from localStorage (state may not be flushed yet) to decide route.
      const stored = safeStorage.getItem('openi_user');
      const u = stored ? JSON.parse(stored) : null;
      if (u) {
        if (u.profile_completed === false) navigate('/dashboard/profile');
        else if (redirectTarget) navigate(redirectTarget);
        else navigate('/dashboard');
      }
      // else: MFA path — stay on this page, mfaStep is now true and the form switches.
    } catch (err) {
      // s49e: Email-not-verified — backend has already re-issued a fresh code/link.
      // Redirect to /verify-email so the user can enter the OTP or click the new link.
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        const target = `/verify-email?email=${encodeURIComponent(err.email || email.trim().toLowerCase())}`;
        navigate(target, { replace: true });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMFA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMFA(otp);
      // Redirect to profile if not completed, otherwise dashboard
      const stored = safeStorage.getItem('openi_user');
      const u = stored ? JSON.parse(stored) : null;
      if (u && u.profile_completed === false) {
        navigate('/dashboard/profile');
      } else if (redirectTarget) {
        navigate(redirectTarget);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" aria-label="Go to OpenI home" className="inline-block">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              className="mx-auto mb-4"
              style={{ height: 60, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              onError={e => {
                e.target.style.display = 'none';
                // Logo is now wrapped in <Link>; fallback Shield div is the Link's next sibling.
                if (e.target.parentElement && e.target.parentElement.nextSibling) {
                  e.target.parentElement.nextSibling.style.display = 'inline-flex';
                }
              }}
            />
          </Link>
          <div
            className="items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-md mx-auto"
            style={{ backgroundColor: '#D0A848', display: 'none' }}
          >
            <Shield size={26} style={{ color: '#ffffff' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a', fontFamily: 'Lexend, Inter, sans-serif' }}>
            Open<span style={{ color: '#D0A848' }}>I</span> Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Secure platform for Open Innovation Ecosystem</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          {!mfaStep ? (
            <>
              <h2 className="font-semibold text-lg mb-6" style={{ color: '#1a1a1a' }}>Sign in to your account</h2>

              {idleReason && !error && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session expired due to inactivity. Please sign in again to continue.
            </div>
          )}
          {expiredReason && !error && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session has expired. Please sign in again to continue.
            </div>
          )}
          {error && (
                <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6e6e6e' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@openi.gov.in"
                      required
                      className="login-input w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
                      style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a' }}
                      onFocus={e => { e.target.style.borderColor = '#D0A848'; e.target.style.backgroundColor = '#ffffff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium" style={{ color: '#374151' }}>Password</label>
                    <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: '#D0A848' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6e6e6e' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="login-input w-full rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none transition-all"
                      style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a' }}
                      onFocus={e => { e.target.style.borderColor = '#D0A848'; e.target.style.backgroundColor = '#ffffff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#6e6e6e' }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm mt-2"
                  style={{ backgroundColor: '#D0A848', color: '#ffffff' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c49a4a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#D0A848'}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Demo accounts — shown only when login URL includes ?demo=1. Hidden from
                  public visitors to avoid exposing credentials (e.g. admin@drdo.gov.in). */}
              {showDemoAccounts && (
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <p className="text-xs text-center mb-3" style={{ color: '#6e6e6e' }}>Quick login (click to fill credentials)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map(({ email: e, password: p, role }) => (
                      <button
                        key={e}
                        onClick={() => { setEmail(e); setPassword(p); }}
                        className="text-left px-3 py-2 rounded-lg transition-all"
                        style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                        onMouseEnter={el => { el.currentTarget.style.borderColor = '#D0A848'; el.currentTarget.style.backgroundColor = '#fffbf0'; }}
                        onMouseLeave={el => { el.currentTarget.style.borderColor = '#e5e7eb'; el.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      >
                        <div className="text-xs font-medium" style={{ color: '#D0A848' }}>{role}</div>
                        <div className="text-[10px] truncate" style={{ color: '#6e6e6e' }}>{e}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-lg mb-2" style={{ color: '#1a1a1a' }}>Two-Factor Authentication</h2>
              <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Enter the 6-digit code from your authenticator app.</p>

              {error && (
                <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMFA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="login-input w-full rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none transition-all"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a' }}
                    onFocus={e => { e.target.style.borderColor = '#D0A848'; e.target.style.backgroundColor = '#ffffff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb'; }}
                  />
                  <p className="text-xs mt-2 text-center" style={{ color: '#6e6e6e' }}>Open your authenticator app (Google Authenticator, 1Password, Authy) and enter the current code.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                  style={{ backgroundColor: '#D0A848', color: '#ffffff' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c49a4a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#D0A848'}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Verifying…' : 'Verify & Continue'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Registration link */}
        <div className="text-center mt-5">
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Don&apos;t have an account?{' '}
            <Link to="/landing" className="font-semibold" style={{ color: '#D0A848' }}>
              Join OpenI Hub
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#6e6e6e' }}>
          &copy; {new Date().getFullYear()} OpenI Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
