import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, setToken } from '../../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

const G = '#D0A848';

const ERROR_MESSAGES = {
  missing_state: 'Your SSO session is missing required information. Please try signing in again.',
  invalid_or_expired_state: 'Your SSO sign-in link has expired or was already used. Please try signing in again.',
  sso_not_configured: 'SSO is not configured for this organization.',
  domain_not_allowed: 'Your email domain is not authorized to sign in via SSO for this organization.',
  account_belongs_to_another_organization: 'This account is already associated with a different organization.',
  account_not_found_contact_admin: 'No account was found for your email. Please contact your organization admin.',
  no_email_in_claims: "Your identity provider didn't return an email address. Please contact your admin.",
  sso_login_failed: 'Something went wrong completing SSO sign-in. Please try again.',
};

// Phase 127 — SSO (OIDC) callback landing page.
// Backend redirects here with either #token=<jwt> (success) or #error=<code> (failure)
// in the URL fragment (never a query string — see ssoService.js header for rationale).
export default function SSOCallback() {
  const navigate = useNavigate();
  const { completeVerification } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const errorCode = params.get('error');

    if (errorCode) {
      setErrorMessage(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.sso_login_failed);
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMessage(ERROR_MESSAGES.sso_login_failed);
      setStatus('error');
      return;
    }

    (async () => {
      try {
        setToken(token);
        const { user } = await authAPI.me();
        const ok = completeVerification({ token, user });
        if (!ok) throw new Error('Failed to complete sign-in');
        navigate('/dashboard', { replace: true });
      } catch {
        setErrorMessage('Could not complete sign-in. Please try again.');
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
      <div
        style={{
          width: '100%', maxWidth: 420, background: '#ffffff', border: '1px solid #eeeeee',
          borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 32, textAlign: 'center',
        }}
      >
        <Link to="/" style={{ display: 'inline-block', marginBottom: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>
            Open<span style={{ color: G }}>I</span>
          </span>
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: G, margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Signing you in…</h1>
            <p style={{ fontSize: 13, color: '#5c5c5c', margin: 0 }}>Completing your single sign-on request.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={32} style={{ color: '#c0392b', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Sign-in failed</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}>{errorMessage}</p>
            <Link
              to="/dashboard/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, background: G, color: '#fff', textDecoration: 'none',
              }}
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
