/**
 * Phase 7 (P7) — Profile Score AI Card
 *
 * GPT qualitative score + coaching narrative on top of Phase 55 completeness.
 *
 *   Phase 55 (existing): "how complete is your profile?" — number bar in header
 *   Phase 7  (this card): "how good is your profile content?" — score + narrative
 *
 * v1 scope: startup persona only.
 *
 * Behavior:
 *   - On mount: GET /profile-score/analysis (cheap, no compute)
 *   - If never analyzed: shows empty-state CTA "Analyze my profile"
 *   - If analyzed: shows score + summary + strengths + improvements + cached indicator
 *   - Re-analyze button calls POST /profile-score/analyze (5/day rate-limited, 30d cache)
 */
import { useState, useEffect } from 'react';
import { profileScoreAiAPI } from '../services/api';
import {
  Sparkles, RefreshCw, CheckCircle2, Lightbulb, AlertCircle, Loader2, Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

// Score → color (matches Phase 55 thresholds in PersonaDashboard)
function scoreColor(s) {
  if (s == null) return '#9ca3af';
  if (s >= 70) return '#16a34a';   // green
  if (s >= 40) return '#f59e0b';   // amber
  return '#ef4444';                 // red
}

function scoreLabel(s) {
  if (s == null) return 'Not analyzed';
  if (s >= 90) return 'Exceptional';
  if (s >= 70) return 'Strong';
  if (s >= 50) return 'Average';
  if (s >= 30) return 'Weak';
  return 'Poor';
}

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d >= 1) return `${d}d ago`;
  const h = Math.floor(ms / 3_600_000);
  if (h >= 1) return `${h}h ago`;
  const m = Math.floor(ms / 60_000);
  return m >= 1 ? `${m}m ago` : 'just now';
}

export default function ProfileScoreAiCard({ completenessScore = null }) {
  const [loading, setLoading] = useState(true);     // initial load
  const [analyzing, setAnalyzing] = useState(false); // re-analyze in flight
  const [data, setData] = useState(null);            // { score, narrative, computed_at, completeness_score }
  const [error, setError] = useState(null);

  useEffect(() => { fetchCached(); }, []);

  async function fetchCached() {
    setLoading(true);
    setError(null);
    try {
      const res = await profileScoreAiAPI.getAnalysis();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load AI score');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(force = false) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await profileScoreAiAPI.analyze(force);
      setData(res);
      if (res.cached) toast.success('Showing cached analysis');
      else toast.success('Profile analyzed!');
    } catch (err) {
      const msg = err.message || 'Analysis failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ ...card, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 14 }}>Loading AI profile score…</span>
        </div>
      </div>
    );
  }

  const hasAnalysis = data?.score != null && data?.narrative;
  const narrative = hasAnalysis ? data.narrative : null;
  const aiScore = data?.score ?? null;
  const completeness = completenessScore ?? data?.completeness_score ?? null;

  return (
    <div style={{ ...card, padding: 20, marginBottom: 16 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color={G} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>AI Profile Insights</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
              Quality coaching by GPT — separate from completeness
            </p>
          </div>
        </div>

        {hasAnalysis && (
          <button
            onClick={() => handleAnalyze(true)}
            disabled={analyzing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid #e5e7eb', background: '#fff',
              fontSize: 12, fontWeight: 600, color: '#555',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              opacity: analyzing ? 0.6 : 1,
            }}
            title="Force re-analyze (counts toward 5/day rate limit)"
          >
            {analyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            <span>Re-analyze</span>
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {!hasAnalysis && !error && (
        <div style={{ textAlign: 'center', padding: '20px 12px' }}>
          <Wand2 size={32} color={G} style={{ marginBottom: 10, opacity: 0.7 }} />
          <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555', lineHeight: 1.5 }}>
            Get an AI assessment of your profile content quality with specific suggestions to improve.
          </p>
          <button
            onClick={() => handleAnalyze(false)}
            disabled={analyzing}
            style={{
              padding: '10px 20px', borderRadius: 8,
              background: G, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600,
              cursor: analyzing ? 'not-allowed' : 'pointer',
              opacity: analyzing ? 0.6 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {analyzing ? (
              <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles size={15} /> Analyze my profile</>
            )}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9ca3af' }}>
            Cached for 30 days · Up to 5 analyses per day
          </p>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !hasAnalysis && (
        <div style={{ display: 'flex', gap: 10, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
          <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: '#991b1b' }}>{error}</div>
        </div>
      )}

      {/* ── Analyzed state ── */}
      {hasAnalysis && (
        <>
          {/* Two scores side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* AI Quality Score */}
            <div style={{ padding: 14, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                AI Quality
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor(aiScore), lineHeight: 1 }}>
                  {aiScore}
                </span>
                <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>/ 100</span>
              </div>
              <div style={{ fontSize: 12, color: scoreColor(aiScore), fontWeight: 600, marginTop: 4 }}>
                {scoreLabel(aiScore)}
              </div>
            </div>

            {/* Completeness (Phase 55) for context */}
            {completeness != null && (
              <div style={{ padding: 14, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Completeness
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor(completeness), lineHeight: 1 }}>
                    {completeness}
                  </span>
                  <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  Fields filled
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {narrative.summary && (
            <div style={{
              padding: 12, borderRadius: 8,
              background: `${G}11`, borderLeft: `3px solid ${G}`,
              fontSize: 14, lineHeight: 1.5, color: '#333',
              marginBottom: 16,
            }}>
              {narrative.summary}
            </div>
          )}

          {/* Strengths */}
          {Array.isArray(narrative.strengths) && narrative.strengths.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Strengths
                </h4>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#444', lineHeight: 1.7 }}>
                {narrative.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {Array.isArray(narrative.improvements) && narrative.improvements.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Lightbulb size={14} color={G} />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  How to improve
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {narrative.improvements.map((imp, i) => (
                  <div key={i} style={{
                    padding: 12, borderRadius: 8,
                    background: '#fffaf0', border: '1px solid #fde68a',
                  }}>
                    <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {imp.field || 'General'}
                    </div>
                    {imp.why && (
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 1.5 }}>
                        <span style={{ color: '#888' }}>Why:</span> {imp.why}
                      </div>
                    )}
                    {imp.suggestion && (
                      <div style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.5, fontWeight: 500 }}>
                        <span style={{ color: '#888', fontWeight: 400 }}>Suggestion:</span> {imp.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: cached indicator */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#9ca3af' }}>
            <span>Last analyzed {timeAgo(data.computed_at)}</span>
            {narrative.model && <span>Model: {narrative.model}</span>}
          </div>
        </>
      )}
    </div>
  );
}
