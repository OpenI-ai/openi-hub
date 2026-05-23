/**
 * Phase 108: Magic-link landing page for pending email invites.
 * URL: /invite/accept/:token
 *
 * Flow:
 *   1. Mount fetches GET /api/public/invite/accept/:token
 *   2. If invite is valid and the email already has an OpenI account ->
 *      redirect to /login?invite_token=<token>&email=<email>
 *      (after successful login, user is auto-routed to the entity via
 *       the verifyEmail consume hook on the backend that wires the
 *       pending invite into the real entity_invite table).
 *   3. If invite is valid and the email has NO account yet ->
 *      redirect to /register?invite_token=<token>&email=<email>
 *      (Register page reads these params, pre-fills email, locks it.
 *       After signup + email verification the consume hook fires.)
 *   4. If invite is consumed/revoked/expired/not-found -> show error state.
 *
 * Public route — no auth required.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';

const G = '#D5AA5B';
const DARK = '#0C2126';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.openi.ai/api';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | redirecting | error
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid invitation link.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/invite/accept/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setError(data?.message || `Invitation ${data?.status || 'invalid'}.`);
          return;
        }
        setInvite(data);
        setStatus('redirecting');
        // 600ms delay so user sees "verified, routing you..." flash
        setTimeout(() => {
          const params = new URLSearchParams({ invite_token: token, email: data.email });
          if (data.has_account) {
            navigate(`/login?${params.toString()}`);
          } else {
            navigate(`/register?${params.toString()}`);
          }
        }, 600);
      } catch (err) {
        setStatus('error');
        setError(err?.message || 'Could not verify invitation.');
      }
    })();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#fbf8f1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <img src="/openi-logo.svg" alt="OpenI Hub" style={{ height: 44, marginBottom: 24 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />

        {status === 'loading' && (
          <>
            <Loader2 size={36} className="spin" color={G} style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 6px' }}>Verifying your invitation</h2>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>One moment...</p>
          </>
        )}

        {status === 'redirecting' && invite && (
          <>
            <CheckCircle size={36} color={G} style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>Invitation verified</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              <strong>{invite.inviter_name}</strong>{invite.inviter_org ? ` (${invite.inviter_org})` : ''} invited you to collaborate on{' '}
              <strong>{invite.entity_type === 'challenge' ? 'an innovation challenge' : invite.entity_type === 'collaboration' ? 'a collaboration' : 'an OpenI Hub item'}</strong>.
            </p>
            <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
              {invite.has_account ? 'Redirecting you to login...' : 'Redirecting you to create your account...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={36} color="#d97706" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>Invitation unavailable</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}>{error}</p>
            <button onClick={() => navigate('/')}
              style={{ padding: '10px 22px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Go to OpenI Hub home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
