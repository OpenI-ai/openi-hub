/**
 * Phase 53 — ClaimVerify
 * Public landing page for /claims/verify/:token
 * Calls the API, shows result, and redirects to dashboard on success.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { claimAPI } from '../../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const G = '#D0A848';

export default function ClaimVerify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [mergedFields, setMergedFields] = useState([]);

  useEffect(() => {
    (async () => {
      if (!token) { setState('error'); setMessage('No token provided.'); return; }
      try {
        const res = await claimAPI.verify(token);
        setState('success');
        setMessage(res.message || 'Claim approved.');
        setMergedFields(res.merged_fields || []);
      } catch (err) {
        setState('error');
        setMessage(err.message || 'Could not verify claim. The link may have expired.');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-md">
        {/* Phase 65c — OpenI brand mark */}
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
        <div className="w-full rounded-2xl p-8 shadow-sm" style={{ background: '#fff' }}>
        {state === 'loading' && (
          <div className="text-center py-6">
            <Loader2 size={40} className="mx-auto mb-4 animate-spin" style={{ color: G }} />
            <h1 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>Verifying your claim…</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>This should only take a moment.</p>
          </div>
        )}
        {state === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <CheckCircle2 size={32} style={{ color: '#10B981' }} />
            </div>
            <h1 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>Claim Successful</h1>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{message}</p>
            {mergedFields.length > 0 && (
              <p className="text-xs mb-4" style={{ color: '#047857' }}>
                Merged {mergedFields.length} field{mergedFields.length === 1 ? '' : 's'} from the imported profile: {mergedFields.join(', ')}.
              </p>
            )}
            <button onClick={() => navigate('/dashboard?claim_verified=1')}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: G, color: '#fff' }}>
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        )}
        {state === 'error' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#FEF2F2' }}>
              <XCircle size={32} style={{ color: '#EF4444' }} />
            </div>
            <h1 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>Claim Verification Failed</h1>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{message}</p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              If your link has expired, you can request a new claim from your dashboard.
            </p>
            <Link to="/dashboard/claims"
              className="inline-block w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: G, color: '#fff' }}>
              View My Claims
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
