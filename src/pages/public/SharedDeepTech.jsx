/**
 * Phase 111 Ship 2a (25 May 2026) — SharedDeepTech.
 * Public page for viewing a DeepTech assessment via tokenized URL.
 * Backend: GET /api/public/deeptech/share/:token
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight, AlertCircle, Sparkles, CheckCircle2, XCircle, Award } from 'lucide-react';
import { publicDeepTechShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function SharedDeepTech() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  const load = async () => {
    try { setData(await publicDeepTechShare.read(token)); }
    catch (err) { setError(err.message || 'Assessment not found'); }
    finally { setLoading(false); }
  };

  if (loading) return <PublicLayout><div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} color={G} className="animate-spin" /></div></PublicLayout>;

  if (error || !data) {
    const status = (error || '').toLowerCase();
    const isExpired = status.includes('expired');
    const isRevoked = status.includes('revoked');
    return (
      <PublicLayout>
        <div style={{ maxWidth: 540, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#d97706" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
            {isRevoked ? 'Share link revoked' : isExpired ? 'Share link expired' : 'Share link not found'}
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            {isRevoked ? 'The assessment owner revoked access to this link.' : isExpired ? 'Please ask the owner for a new link.' : 'The link is invalid or has been removed.'}
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: G, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Go to OpenI Hub <ArrowRight size={14} />
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const a = data.assessment || {};
  const meta = data.share_meta || {};
  const score = a.percentage != null ? Number(a.percentage) : (a.score != null ? Number(a.score) : 0);
  const verdictColor = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  const VerdictIcon = score >= 70 ? CheckCircle2 : XCircle;

  return (
    <PublicLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Header */}
        <div style={{ ...card, padding: 28, marginBottom: 16, textAlign: 'center' }}>
          <Award size={36} color={G} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>DeepTech Assessment</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>{a.startup_name || 'Startup'}</h1>
          {a.assessor_name && <p style={{ fontSize: 12, color: '#888', margin: '0 0 18px' }}>Assessed by {a.assessor_name}</p>}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: `${verdictColor}15`, border: `1.5px solid ${verdictColor}` }}>
            <VerdictIcon size={20} color={verdictColor} />
            <span style={{ fontSize: 36, fontWeight: 800, color: verdictColor }}>{score.toFixed(0)}%</span>
            {a.verdict && <span style={{ fontSize: 13, fontWeight: 600, color: verdictColor, marginLeft: 6 }}>{a.verdict}</span>}
          </div>
        </div>

        {/* Answers */}
        {a.answers && Object.keys(a.answers).length > 0 && (
          <div style={{ ...card, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Detailed Answers</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.entries(a.answers).map(([q, ans]) => (
                <div key={q} style={{ padding: 12, background: '#fafafa', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{q}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ans === 'yes' ? '#16a34a' : ans === 'no' ? '#dc2626' : '#888' }}>{String(ans).toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 24, padding: 24, textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #fff8ec 100%)', borderRadius: 14, border: '1px solid rgba(213,170,91,0.3)' }}>
          <Sparkles size={24} color={G} style={{ margin: '0 auto 8px', display: 'block' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Run your own DeepTech assessment</h3>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px' }}>OpenI Hub gives every startup a free DeepTech qualification.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: G, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Sign up free <ArrowRight size={14} />
          </Link>
        </div>

        {meta.created_at && (
          <div style={{ marginTop: 18, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Shared {new Date(meta.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            {meta.expires_at && <> · Expires {new Date(meta.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
