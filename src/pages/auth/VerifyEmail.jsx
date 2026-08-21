import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { claimAPI, profileAPI, orgAPI } from '../../services/api';
import safeStorage from '../../utils/safeStorage';
import { Mail, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import PublicTour from '../../components/PublicTour';
import PageTourButton from '../../components/PageTourButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// s49e: After verify succeeds, flush profileData stashed by Register Step 2 to /profile/me.
// Cleanup is forgiving — failed PUT does not block dashboard redirect.
// Phase 60.10 fix: read from localStorage (was sessionStorage) so the stash
// survives Gmail opening the verify link in a new tab. Read both keys during
// transition so any user mid-flight on the old code still has their stash flushed.
async function flushPendingProfile() {
  let raw = null;
  try {
    raw = safeStorage.getItem('openi_pending_profile')
       || sessionStorage.getItem('openi_pending_profile');
    if (!raw) return;
    const profileData = JSON.parse(raw);
    const hasData = Object.values(profileData || {}).some(v =>
      Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
    );
    if (!hasData) {
      // Empty stash — clear and exit clean
      safeStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
      return;
    }
    // Phase 60.10 fix: try the PUT FIRST. Only remove the stash if it succeeds.
    // If it fails, leave the stash in place so MyProfile.jsx (next mount) can
    // retry. Console-log the failure so we can diagnose silent drops.
    try {
      await profileAPI.updateMyProfile(profileData);
      safeStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
    } catch (err) {
      console.warn('[verify-email] flushPendingProfile PUT failed:', err?.message || err);
      // Stash stays intact. MyProfile loadProfile() will pick it up.
    }
  } catch (err) {
    console.warn('[verify-email] flushPendingProfile parse error:', err?.message || err);
  }
}

// Phase 113 — flushPendingOrgJoin
// After successful verification, replay the org join-request the user
// selected at signup. Mirrors the flushPendingProfile pattern: read stash,
// fire POST, remove stash only on success (network failures keep the
// stash so the next mount can retry).
async function flushPendingOrgJoin() {
  let raw = null;
  try {
    raw = safeStorage.getItem('openi_pending_org_join');
    if (!raw) return;
    const stash = JSON.parse(raw);
    if (!stash || !stash.org_id) {
      safeStorage.removeItem('openi_pending_org_join');
      return;
    }
    try {
      const res = await orgAPI.requestJoin({ org_id: stash.org_id });
      safeStorage.removeItem('openi_pending_org_join');
      const orgName = res?.org_name || stash.org_name || 'the organization';
      if (res?.status === 'invited') {
        toast.success(`Request to join ${orgName} sent`);
      }
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      // 409 already-member OR 404 org-gone: clear stash, don't retry
      if (msg.includes('already a member') || msg.includes('not found')) {
        safeStorage.removeItem('openi_pending_org_join');
        console.warn('[verify-email] flushPendingOrgJoin terminal:', err?.message);
      } else {
        // Network / 5xx — leave stash, log
        console.warn('[verify-email] flushPendingOrgJoin transient:', err?.message);
      }
    }
  } catch (err) {
    console.warn('[verify-email] flushPendingOrgJoin parse error:', err?.message || err);
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
  // Issue 2 fix — claim-profile detection, reachable now for real (non-bypass) signups.
  const [claimCandidates, setClaimCandidates] = useState([]);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  // Detect existing profiles the just-verified startup user might own, then either
  // surface them (skipping the auto-redirect) or fall through to the normal redirect.
  const detectClaimAndFinish = async (user) => {
    let candidates = [];
    if (user?.role === 'startup') {
      try {
        const res = await claimAPI.detect();
        candidates = res?.candidates || [];
      } catch {
        // Silent failure — must never block verification success (matches Register.jsx pattern).
      }
    }
    if (candidates.length > 0) {
      setClaimCandidates(candidates);
    } else {
      setTimeout(() => navigate('/dashboard/profile?fresh=1', { replace: true }), 1500);
    }
  };

  const submitClaim = async (candidate) => {
    setClaimSubmitting(true);
    try {
      const res = await claimAPI.request({ target_startup_user_id: candidate.user_id });
      setClaimResult(res || { requested: true });
    } catch (err) {
      setClaimResult({ error: err?.message || 'Could not submit claim request.' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  const skipClaim = () => {
    setClaimCandidates([]);
    navigate('/dashboard/profile?fresh=1', { replace: true });
  };

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
      // Phase 113 — replay org-join request stashed at signup
      await flushPendingOrgJoin();
      setPhase('done');
      // Phase 65d: land users directly on /dashboard/profile with ?fresh=1
      // so MyProfile force-refetches the freshly-saved row. Previously we
      // redirected to /dashboard (home) which caused users who navigated
      // to My Profile during the post-verify session to see an empty form
      // even though their data was in the DB. The ?fresh=1 flag lets
      // MyProfile detect "post-verify" mount and skip any stale React state.
      toast.success('Email verified! Loading your profile…');
      // Issue 2 fix — check for a claimable existing profile before redirecting.
      await detectClaimAndFinish(data.user);
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
      // Phase 113 — replay org-join request stashed at signup
      await flushPendingOrgJoin();
      setPhase('done');
      // Phase 65d: land users directly on /dashboard/profile with ?fresh=1
      // so MyProfile force-refetches the freshly-saved row. Previously we
      // redirected to /dashboard (home) which caused users who navigated
      // to My Profile during the post-verify session to see an empty form
      // even though their data was in the DB. The ?fresh=1 flag lets
      // MyProfile detect "post-verify" mount and skip any stale React state.
      toast.success('Email verified! Loading your profile…');
      // Issue 2 fix — check for a claimable existing profile before redirecting.
      await detectClaimAndFinish(data.user);
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
        {/* Phase 65c — OpenI brand mark above the card. Wrapped in <Link> so
            users can bail out to home if they hit verify in error. */}
        <div className="text-center mb-4">
          <Link to="/" aria-label="Go to OpenI home" className="inline-block">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              className="mx-auto"
              style={{ height: 48, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3"
              style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF8E6' }}>
              {phase === 'done'
                ? <CheckCircle size={28} style={{ color: '#16a34a' }} />
                : phase === 'failed'
                  ? <AlertCircle size={28} style={{ color: '#dc2626' }} />
                  : <Mail size={28} style={{ color: '#D0A848' }} />}
            </div>
            <h1 id="tour-page-verify-email" className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
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
            <div className="mt-4 flex justify-center">
              <PageTourButton />
            </div>
          </div>

          {/* Confirm — explicit button click avoids pre-fetch consumption */}
          {phase === 'confirm' && (
            <div className="space-y-3">
              <button onClick={confirmLinkVerify}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{ background: '#D0A848', color: '#fff', cursor: 'pointer' }}>
                <CheckCircle size={16} /> Verify my email
              </button>
              <p className="text-center text-xs leading-relaxed" style={{ color: '#6e6e6e' }}>
                For security, email scanners cannot complete this step on your behalf.
                Click the button above to confirm.
              </p>
            </div>
          )}

          {/* Verifying — spinner only */}
          {phase === 'verifying' && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin" style={{ color: '#D0A848' }} />
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
                  background: (otp.length === 6 && email.trim() && !submitting) ? '#D0A848' : '#e5e7eb',
                  color:      (otp.length === 6 && email.trim() && !submitting) ? '#fff' : '#9ca3af',
                  cursor:     (otp.length === 6 && email.trim() && !submitting) ? 'pointer' : 'not-allowed',
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Verify email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: '#e5e7eb' }} />
                <span className="text-xs font-semibold" style={{ color: '#6e6e6e' }}>OR</span>
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
                Don&rsquo;t see the email? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder &mdash;
                and tap <strong>&ldquo;Not spam&rdquo;</strong> so you never miss a challenge invite or match.
              </div>
              <div className="text-center">
                <button type="button" onClick={resend} disabled={resending || !email.trim()}
                  className="text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ color: '#D0A848', background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer' }}>
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
                  background: (email.trim() && !resending) ? '#D0A848' : '#e5e7eb',
                  color:      (email.trim() && !resending) ? '#fff' : '#9ca3af',
                  cursor:     (email.trim() && !resending) ? 'pointer' : 'not-allowed',
                }}>
                {resending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send a fresh link & code
              </button>
              <p className="text-center text-xs" style={{ color: '#6e6e6e' }}>
                We will email you a new link and a new 6-digit code.
              </p>
            </div>
          )}

          {/* Done — no claim candidates: small success message; redirect handles routing */}
          {phase === 'done' && claimCandidates.length === 0 && (
            <div className="text-center py-4">
              <Loader2 size={20} className="inline-block animate-spin" style={{ color: '#D0A848' }} />
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>Taking you to your dashboard…</p>
            </div>
          )}

          {/* Done — claim candidates found, not yet resolved: show claim options */}
          {phase === 'done' && claimCandidates.length > 0 && !claimResult && (
            <div className="py-2">
              <p className="text-sm font-medium mb-3" style={{ color: '#111827' }}>
                We found existing profile(s) that might be yours. Claim one to keep its history, or skip.
              </p>
              <div className="space-y-2">
                {claimCandidates.map((c) => (
                  <div
                    key={c.user_id}
                    className="flex items-center justify-between border rounded-lg p-3"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex items-center gap-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded" style={{ background: '#f3f4f6' }} />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#111827' }}>{c.company_name}</p>
                        {c.sector && (
                          <p className="text-xs" style={{ color: '#6b7280' }}>{c.sector}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => submitClaim(c)}
                      disabled={claimSubmitting}
                      className="text-sm px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: '#D0A848', color: '#111827' }}
                    >
                      This is mine
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={skipClaim}
                className="mt-3 text-sm underline"
                style={{ color: '#6b7280' }}
              >
                None of these — continue to my dashboard
              </button>
            </div>
          )}

          {/* Done — claim result available: show outcome and continue */}
          {phase === 'done' && claimCandidates.length > 0 && claimResult && (
            <div className="text-center py-4">
              {claimResult.error ? (
                <p className="text-sm" style={{ color: '#dc2626' }}>{claimResult.error}</p>
              ) : (
                <p className="text-sm" style={{ color: '#16a34a' }}>Claim request submitted.</p>
              )}
              <button
                type="button"
                onClick={skipClaim}
                className="mt-3 text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{ background: '#D0A848', color: '#111827' }}
              >
                Continue to my dashboard
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <Link to="/dashboard/login" className="text-xs" style={{ color: '#6e6e6e' }}>
              Back to login
            </Link>
          </div>
        </div>
        {/* Page tour */}
        <PublicTour />
      </div>
    </div>
  );
}
