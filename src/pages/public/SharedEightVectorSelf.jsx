/**
 * Phase 111 Ship 2c (25 May 2026) — SharedEightVectorSelf.
 * Public page for viewing an 8-Vector self-assessment via tokenized URL.
 * Backend: GET /api/public/eight-vector-self/share/:token
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight, AlertCircle, Sparkles, Award } from 'lucide-react';
import { publicEightVectorSelfShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const VECTOR_NAMES = {
  people: 'People', strategic: 'Strategic Direction', customer: 'Customer Focus',
  operations: 'Operations Excellence', innovation: 'Innovation', financial: 'Financial Health',
  risk: 'Risk Management', impact: 'Impact & Sustainability',
};
const VECTOR_COLORS = {
  people: '#a78bfa', strategic: '#60a5fa', customer: '#34d399', operations: '#fbbf24',
  innovation: '#f472b6', financial: '#fb923c', risk: '#f87171', impact: '#22d3ee',
};

export default function SharedEightVectorSelf() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  const load = async () => {
    try { setData(await publicEightVectorSelfShare.read(token)); }
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
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: G, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Go to OpenI Hub <ArrowRight size={14} />
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const a = data.assessment || {};
  const meta = data.share_meta || {};
  const vectorScores = a.vector_scores || {};
  const overall = a.overall_score != null ? Number(a.overall_score) : 0;
  const ownerName = a.owner_name || 'OpenI Hub user';

  return (
    <PublicLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Header */}
        <div style={{ ...card, padding: 28, marginBottom: 16, textAlign: 'center' }}>
          <Award size={36} color={G} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>8-Vector Self-Assessment</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>{a.startup_name || 'Startup'}</h1>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 18px' }}>Assessed by {ownerName}</p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: '#fff8ec', border: `1.5px solid ${G}` }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: G }}>{overall.toFixed(1)}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>/ 5.0</span>
          </div>
        </div>

        {/* Vector breakdown */}
        {Object.keys(vectorScores).length > 0 && (
          <div style={{ ...card, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vector Breakdown</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(vectorScores).map(([key, score]) => {
                const name = VECTOR_NAMES[key] || key;
                const color = VECTOR_COLORS[key] || G;
                const pct = Math.min(100, Math.max(0, (Number(score) || 0) / 5 * 100));
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{Number(score).toFixed(1)} / 5</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {a.notes && (
          <div style={{ ...card, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{a.notes}</p>
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 24, padding: 24, textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #fff8ec 100%)', borderRadius: 14, border: '1px solid rgba(213,170,91,0.3)' }}>
          <Sparkles size={24} color={G} style={{ margin: '0 auto 8px', display: 'block' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Run your own 8-Vector assessment</h3>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px' }}>OpenI Hub gives every startup a free 8-Vector self-evaluation.</p>
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
