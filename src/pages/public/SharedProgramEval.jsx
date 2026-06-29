/**
 * Phase 111 Ship 2d (25 May 2026) — SharedProgramEval.
 * Public page for viewing a portfolio program evaluation via tokenized URL.
 * Backend: GET /api/public/program-evals/share/:token
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight, AlertCircle, Sparkles, Award, Calendar, User } from 'lucide-react';
import { publicProgramEvalShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function SharedProgramEval() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  const load = async () => {
    try { setData(await publicProgramEvalShare.read(token)); }
    catch (err) { setError(err.message || 'Evaluation not found'); }
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

  const e = data.evaluation || {};
  const meta = data.share_meta || {};
  const scores = e.scores || {};
  const overall = e.overall_score != null ? Number(e.overall_score) : 0;

  return (
    <PublicLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Header */}
        <div style={{ ...card, padding: 28, marginBottom: 16, textAlign: 'center' }}>
          <Award size={36} color={G} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>Portfolio Evaluation</p>
          <h1 id="tour-page-share-program-evals" style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>{e.startup_name || e.title || 'Portfolio Snapshot'}</h1>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18, fontSize: 12, color: '#666' }}>
            {e.evaluation_date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} /> {new Date(e.evaluation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            {e.evaluator_name && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <User size={11} /> {e.evaluator_name}
              </span>
            )}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '14px 28px', borderRadius: 12, background: '#fff8ec', border: `1.5px solid ${G}` }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: G }}>{overall.toFixed(1)}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>/ 5.0</span>
          </div>
        </div>

        {/* Scores breakdown */}
        {Object.keys(scores).length > 0 && (
          <div style={{ ...card, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Score Breakdown</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(scores).map(([key, score]) => {
                const pct = Math.min(100, Math.max(0, (Number(score) || 0) / 5 * 100));
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>{String(key).replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{Number(score).toFixed(1)} / 5</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: G, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {e.notes && (
          <div style={{ ...card, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{e.notes}</p>
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 24, padding: 24, textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #fff8ec 100%)', borderRadius: 14, border: '1px solid rgba(213,170,91,0.3)' }}>
          <Sparkles size={24} color={G} style={{ margin: '0 auto 8px', display: 'block' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Run portfolio evaluations on OpenI Hub</h3>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px' }}>Incubators and accelerators use OpenI Hub for 8-Vector portfolio health tracking.</p>
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
