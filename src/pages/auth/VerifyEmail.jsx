import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import { Mail, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// s49e: After verify succeeds, flush profileData stashed by Register Step 2 to /profile/me.
// Cleanup is forgiving — failed PUT does not block dashboard redirect.
// Phase 60.10 fix: read from localStorage (was sessionStorage) so the stash
// survives Gmail opening the verify link in a new tab. Read both keys during
// transition so any user mid-flight on the old code still has their stash flushed.
async function flushPendingProfile() {
  let raw = null;
  try {
    raw = localStorage.getItem('openi_pending_profile')
       || sessionStorage.getItem('openi_pending_profile');
    if (!raw) return;
    const profileData = JSON.parse(raw);
    const hasData = Object.values(profileData || {}).some(v =>
      Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
    );
    if (!hasData) {
      // Empty stash — clear and exit clean
      localStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
      return;
    }
    // Phase 60.10 fix: try the PUT FIRST. Only remove the stash if it succeeds.
    // If it fails, leave the stash in place so MyProfile.jsx (next mount) can
    // retry. Console-log the failure so we can diagnose silent drops.
    try {
      await profileAPI.updateMyProfile(profileData);
      localStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
    } catch (err) {
      console.warn('[verify-email] flushPendingProfile PUT failed:', err?.message || err);
      // Stash stays intact. MyProfile loadProfile() will pick it up.
    }
  } catch (err) {
    console.warn('[verify-email] flushPendingProfile parse error:', err?.message || err);
  }
}

const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
};

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeVerification } = useAuth();

  // ── STATE ────────────────────────────────────────────────
  // Phase 60.11 (s50): Link path is now CONFIRM-CLICK gated, not auto-mount.
  // - 'confirm'  : token is in URL, show button, wait for user click
  // - 'verifying': button clicked, POSTing to /auth/verify-email
  // - 'input'    : no token in URL, OTP entry form
  // - 'done'     : verified, dashboard redirect imminent
  // - 'failed'   : token rejected (consumed twice, expired, invalid)
  const [phase, setPhase] = useState(token ? 'confirm' : 'input');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── 1) Cross-tab sync — if another tab finished verification, jump to dashboard.
  // The success path writes openi_token to localStorage via completeVerification.
  // We listen for storage events; when openi_token appears, redirect.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'openi_token' && e.newValue && phase !== 'done') {
        toast.success('Verified in another tab. Taking you to your dashboard…');
        setPhase('done');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [phase, navigate]);

  // ── 2) Confirm button — link path. Pre-fetchers (Gmail / Outlook Safe Links /
  // Postmark click-tracking) do GET to render previews, which would consume a
  // single-use token if we auto-fired on mount. Confirm-button-gate prevents that.
  const confirmLinkVerify = async () => {
    setErrorMsg('');
    setPhase('verifying');
    try {
      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setPhase('failed');
        setErrorMsg(data.message || 'Verification link is invalid or has expired.');
        return;
      }
      completeVerification({ token: data.token, user: data.user });
      await flushPendingProfile();
      setPhase('done');
      toast.success('Email verified! Redirecting to your dashboard…');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch {
      setPhase('failed');
      setErrorMsg('Could not verify your email right now. Please try again.');
    }
  };

  // ── 3) OTP path — submit 6-digit code ────────────────────
  const submitOtp = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    if (!email.trim()) { setErrorMsg('Please enter your email.'); return; }
    if (!/^\d{6}$/.test(otp.trim())) { setErrorMsg('OTP must be 6 digits.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setErrorMsg(data.message || 'Invalid code.');
        return;
      }
      completeVerification({ token: data.token, user: data.user });
      await flushPendingProfile();
      setPhase('done');
      toast.success('Email verified! Redirecting to your dashboard…');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch {
      setErrorMsg('Could not verify your email right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4) Resend — fresh link + OTP ────────────────────────
  const resend = async () => {
    setErrorMsg('');
    if (!email.trim()) { setErrorMsg('Please enter your email to resend the code.'); return; }
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not resend the code.');
        return;
      }
      setResentAt(new Date());
      toast.success('A fresh verification email has been sent.');
      // If the user landed here after a failed link, switch them to OTP input
      if (phase === 'failed') setPhase('input');
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3"
              style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF8E6' }}>
              {phase === 'done'
                ? <CheckCircle size={28} style={{ color: '#16a34a' }} />
                : phase === 'failed'
                  ? <AlertCircle size={28} style={{ color: '#dc2626' }} />
                  : <Mail size={28} style={{ color: '#D5AA5B' }} />}
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
              {phase === 'done' ? 'Email verified!'
                : phase === 'failed' ? 'Verification failed'
                : phase === 'verifying' ? 'Verifying your email…'
                : phase === 'confirm' ? 'Confirm your email'
                : 'Verify your email'}
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {phase === 'done' ? 'Logging you in to OpenI Hub…'
                : phase === 'failed' ? errorMsg
                : phase === 'verifying' ? 'Please wait a moment.'
                : phase === 'confirm' ? 'Click the button below to confirm this is really you.'
                : 'Two ways to verify: enter the 6-digit code below, or click the link in our email.'}
            </p>
          </div>

          {/* Confirm — explicit button click avoids pre-fetch consumption */}
          {phase === 'confirm' && (
            <div className="space-y-3">
              <button onClick={confirmLinkVerify}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{ background: '#D5AA5B', color: '#fff', cursor: 'pointer' }}>
                <CheckCircle size={16} /> Verify my email
              </button>
              <p className="text-center text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                For security, email scanners cannot complete this step on your behalf.
                Click the button above to confirm.
              </p>
            </div>
          )}

          {/* Verifying — spinner only */}
          {phase === 'verifying' && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin" style={{ color: '#D5AA5B' }} />
            </div>
          )}

          {/* Input — OTP form */}
          {phase === 'input' && (
            <form onSubmit={submitOtp} className="space-y-4">
              {/* OPTION A — Type the 6-digit code */}
              <div className="rounded-lg p-3 text-xs" style={{ background: '#FFF8E6', border: '1px solid #FCD34D', color: '#854D0E' }}>
                <strong>Option A — Type the 6-digit code below</strong>
                <div className="mt-1 leading-snug">
                  Open our email titled &ldquo;Verify your OpenI Hub email&rdquo;
                  and copy the 6-digit code into the box below.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>6-digit code</label>
                <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ ...inputStyle, fontFamily: 'Courier New, monospace', fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
                  autoComplete="one-time-code" autoFocus />
              </div>
              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <button type="submit" disabled={submitting || otp.length !== 6 || !email.trim()}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{
                  background: (otp.length === 6 && email.trim() && !submitting) ? '#D5AA5B' : '#e5e7eb',
                  color:      (otp.length === 6 && email.trim() && !submitting) ? '#fff' : '#9ca3af',
                  cursor:     (otp.length === 6 && email.trim() && !submitting) ? 'pointer' : 'not-allowed',
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Verify email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: '#e5e7eb' }} />
                <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>OR</span>
                <div className="h-px flex-1" style={{ background: '#e5e7eb' }} />
              </div>

              {/* OPTION B — Click the link */}
              <div className="rounded-lg p-3 text-xs" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
                <strong>Option B — Click the verification link in the email</strong>
                <div className="mt-1 leading-snug">
                  In the same email, click the gold &ldquo;Verify Email&rdquo; button.
                  It opens a new tab where you confirm and we&rsquo;ll log you in automatically.
                </div>
              </div>

              {/* Spam-folder reminder + resend */}
              <div className="text-center text-xs leading-relaxed pt-1" style={{ color: '#6b7280' }}>
                Don&rsquo;t see the email? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
              </div>
              <div className="text-center">
                <button type="button" onClick={resend} disabled={resending || !email.trim()}
                  className="text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ color: '#D5AA5B', background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer' }}>
                  {resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {resentAt ? `Sent again at ${resentAt.toLocaleTimeString()}` : 'Resend code & link'}
                </button>
              </div>
            </form>
          )}

          {/* Failed — let them resend or jump to OTP */}
          {phase === 'failed' && (
            <div className="space-y-3">
              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Your email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} autoComplete="email" />
              </div>
              <button onClick={resend} disabled={resending || !email.trim()}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{
                  background: (email.trim() && !resending) ? '#D5AA5B' : '#e5e7eb',
                  color:      (email.trim() && !resending) ? '#fff' : '#9ca3af',
                  cursor:     (email.trim() && !resending) ? 'pointer' : 'not-allowed',
                }}>
                {resending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send a fresh link & code
              </button>
              <p className="text-center text-xs" style={{ color: '#9ca3af' }}>
                We will email you a new link and a new 6-digit code.
              </p>
            </div>
          )}

          {/* Done — small success message; redirect handles routing */}
          {phase === 'done' && (
            <div className="text-center py-4">
              <Loader2 size={20} className="inline-block animate-spin" style={{ color: '#D5AA5B' }} />
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>Taking you to your dashboard…</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <Link to="/dashboard/login" className="text-xs" style={{ color: '#9ca3af' }}>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
