/**
 * ReviewPanel — Phase 40 (P8)
 *
 * Generic review panel. Works on any entity type supported by the backend
 * (challenge, deal_request, govt_program, incubator_program, accelerator_batch).
 *
 * Shows consensus + every reviewer's score/verdict/comments and lets
 * editors/reviewers submit (or update) their own review with optional
 * criteria_scores breakdown.
 *
 * Props:
 *  - entityType: e.g. 'challenge', 'deal_request'
 *  - entityId:   number
 *  - title:      optional heading override
 *  - onChange:   optional callback fired after a successful submit
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Star, Loader2, CheckCircle2, XCircle, PauseCircle, Award,
  MessageSquare, Sliders, Plus, X, Save,
} from 'lucide-react';
import { collabAPI } from '../services/api';

const G = '#D5AA5B';

const VERDICT_META = {
  strong_yes: { label: 'Strong Yes', color: '#15803d', bg: '#dcfce7', icon: Award },
  shortlist:  { label: 'Shortlist',  color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 },
  hold:       { label: 'Hold',       color: '#b45309', bg: '#fef3c7', icon: PauseCircle },
  reject:     { label: 'Reject',     color: '#b91c1c', bg: '#fee2e2', icon: XCircle },
};

const VERDICT_ORDER = ['strong_yes', 'shortlist', 'hold', 'reject'];

function avatarColor(id) {
  const palette = ['#7c3aed', '#0284c7', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0891b2', '#4f46e5'];
  return palette[(id || 0) % palette.length];
}

function Avatar({ name, id, size = 28 }) {
  const initials = (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(id), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size / 2.5), fontWeight: 600, flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

function VerdictPill({ verdict, size = 'sm' }) {
  if (!verdict || !VERDICT_META[verdict]) return null;
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  const px = size === 'lg' ? '4px 10px' : '2px 8px';
  const fs = size === 'lg' ? 12 : 10;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: px, borderRadius: 20,
      background: meta.bg, color: meta.color,
      fontSize: fs, fontWeight: 600,
    }}>
      <Icon size={size === 'lg' ? 12 : 10} /> {meta.label}
    </span>
  );
}

function ScoreBadge({ score, size = 'md' }) {
  if (score == null) return <span style={{ fontSize: 11, color: '#999' }}>—</span>;
  const num = Number(score);
  const color = num >= 75 ? '#15803d' : num >= 50 ? '#b45309' : '#b91c1c';
  const dim = size === 'lg' ? 56 : 36;
  const fs = size === 'lg' ? 18 : 13;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%',
      background: '#fff', border: `3px solid ${color}`,
      color, fontWeight: 700, fontSize: fs,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {Math.round(num)}
    </div>
  );
}

export default function ReviewPanel({ entityType, entityId, title = 'Reviews', onChange }) {
  const [loading, setLoading]       = useState(true);
  const [reviews, setReviews]       = useState([]);
  const [consensus, setConsensus]   = useState({ avg: null, count: 0, verdicts: {} });
  const [myRole, setMyRole]         = useState(null);
  const [me, setMe]                 = useState(null);

  // form state
  const [score, setScore]           = useState(70);
  const [verdict, setVerdict]       = useState('');
  const [comments, setComments]     = useState('');
  const [criteria, setCriteria]     = useState([]); // [{key, value}]
  const [showCriteria, setShowCriteria] = useState(false);
  const [busy, setBusy]             = useState(false);

  // load reviews + my_role (uses collabAPI.list to get my_role consistently)
  const load = useCallback(async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const [rev, team] = await Promise.all([
        collabAPI.listReviews(entityType, entityId),
        collabAPI.list(entityType, entityId),
      ]);
      setReviews(rev.reviews || []);
      setConsensus(rev.consensus || { avg: null, count: 0, verdicts: {} });
      setMyRole(team.my_role || null);
      setMe(team.me || null);

      // pre-fill form with my existing review if present
      const myUserId = team.me?.id;
      const mine = (rev.reviews || []).find(r => r.reviewer_id === myUserId);
      if (mine) {
        if (mine.score != null) setScore(Number(mine.score));
        if (mine.verdict) setVerdict(mine.verdict);
        if (mine.comments) setComments(mine.comments);
        if (mine.criteria_scores && typeof mine.criteria_scores === 'object') {
          const arr = Object.entries(mine.criteria_scores).map(([k, v]) => ({ key: k, value: String(v) }));
          if (arr.length) {
            setCriteria(arr);
            setShowCriteria(true);
          }
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  const canReview = useMemo(
    () => ['editor', 'reviewer', 'owner'].includes(myRole),
    [myRole]
  );

  const myExisting = useMemo(
    () => me?.id ? reviews.find(r => r.reviewer_id === me.id) : null,
    [reviews, me]
  );

  const addCriterion  = () => setCriteria(prev => [...prev, { key: '', value: '' }]);
  const removeCriterion = (i) => setCriteria(prev => prev.filter((_, idx) => idx !== i));
  const updateCriterion = (i, field, val) =>
    setCriteria(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const submit = async () => {
    if (!verdict) return toast.error('Pick a verdict');
    // build criteria_scores object, dropping empties + non-numeric values
    const cs = {};
    for (const c of criteria) {
      const k = (c.key || '').trim();
      const v = parseFloat(c.value);
      if (k && !Number.isNaN(v)) cs[k] = v;
    }
    setBusy(true);
    try {
      await collabAPI.submitReview(entityType, entityId, {
        score: Number(score),
        verdict,
        comments: comments.trim() || null,
        criteria_scores: Object.keys(cs).length ? cs : null,
      });
      toast.success(myExisting ? 'Review updated' : 'Review submitted');
      load();
      onChange?.();
    } catch (err) {
      toast.error(err.message || 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888' }}>
          <Loader2 size={14} className="animate-spin" /> Loading reviews…
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} style={{ color: G }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            {title} <span style={{ color: '#999', fontWeight: 400 }}>({consensus.count || 0})</span>
          </h3>
        </div>
      </div>

      {/* Consensus */}
      {consensus.count > 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: 12, background: '#fafafa', border: '1px solid #f0f0f0',
          borderRadius: 10, marginBottom: 14,
        }}>
          <ScoreBadge score={consensus.avg} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Consensus · {consensus.count} {consensus.count === 1 ? 'reviewer' : 'reviewers'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VERDICT_ORDER.map(v => {
                const n = consensus.verdicts?.[v] || 0;
                if (!n) return null;
                const meta = VERDICT_META[v];
                return (
                  <span key={v} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 9px', borderRadius: 20,
                    background: meta.bg, color: meta.color,
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {meta.label} <span style={{ opacity: 0.7 }}>· {n}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: 12, background: '#fafafa', border: '1px dashed #e5e7eb',
          borderRadius: 10, marginBottom: 14, textAlign: 'center',
          fontSize: 12, color: '#888',
        }}>
          No reviews yet{canReview ? ' — be the first to score this.' : '.'}
        </div>
      )}

      {/* My review form */}
      {canReview && (
        <div style={{
          padding: 12, background: '#fffdf7', border: `1px solid ${G}33`,
          borderRadius: 10, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
              {myExisting ? 'Update your review' : 'Submit your review'}
            </div>
            <button
              onClick={() => setShowCriteria(s => !s)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: 'white', color: '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
              title="Optional criteria-by-criteria scoring"
            >
              <Sliders size={10} /> {showCriteria ? 'Hide' : 'Add'} criteria
            </button>
          </div>

          {/* Score slider */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#444' }}>Overall score</label>
              <ScoreBadge score={score} />
            </div>
            <input
              type="range" min={0} max={100} step={1}
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: G }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#999', marginTop: 2 }}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Verdict */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>
              Verdict
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VERDICT_ORDER.map(v => {
                const meta = VERDICT_META[v];
                const Icon = meta.icon;
                const active = verdict === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerdict(v)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px', borderRadius: 20,
                      background: active ? meta.bg : 'white',
                      color: active ? meta.color : '#666',
                      border: `1px solid ${active ? meta.color : '#e5e7eb'}`,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Icon size={11} /> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Criteria scores */}
          {showCriteria && (
            <div style={{ marginBottom: 10, padding: 10, background: 'white', border: '1px solid #f0e7c8', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>
                Optional. Add criteria like <code>market</code>, <code>team</code>, <code>tech</code> with scores (e.g. 4.2).
              </div>
              {criteria.length === 0 && (
                <div style={{ fontSize: 11, color: '#999', textAlign: 'center', padding: '4px 0 8px' }}>
                  No criteria yet.
                </div>
              )}
              {criteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={c.key}
                    onChange={e => updateCriterion(i, 'key', e.target.value)}
                    placeholder="criterion (e.g. market)"
                    style={{ flex: 2, padding: '5px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none' }}
                  />
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={c.value}
                    onChange={e => updateCriterion(i, 'value', e.target.value)}
                    placeholder="0–10"
                    style={{ flex: 1, padding: '5px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeCriterion(i)}
                    style={{ padding: '4px 6px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCriterion}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', background: 'none', border: '1px dashed #d4a843',
                  color: '#b45309', fontSize: 10, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                }}
              >
                <Plus size={10} /> Add criterion
              </button>
            </div>
          )}

          {/* Comments */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
              Comments <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Why did you give this score / verdict?"
              rows={3}
              style={{
                width: '100%', padding: '8px 10px', fontSize: 16,
                border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={submit}
              disabled={busy || !verdict}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 7,
                background: verdict ? G : '#e5e7eb',
                color: verdict ? '#fff' : '#999',
                border: 'none', fontSize: 12, fontWeight: 600,
                cursor: verdict && !busy ? 'pointer' : 'not-allowed',
              }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {myExisting ? 'Update review' : 'Submit review'}
            </button>
          </div>
        </div>
      )}

      {/* All reviews */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reviews.length === 0 && !canReview && (
          <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '4px 0 0 0' }}>
            No reviews yet.
          </p>
        )}
        {reviews.map(r => {
          const isMine = me?.id && r.reviewer_id === me.id;
          const cs = r.criteria_scores && typeof r.criteria_scores === 'object' ? r.criteria_scores : null;
          return (
            <div
              key={r.id}
              style={{
                padding: 10, borderRadius: 8,
                background: isMine ? '#fffdf7' : '#fff',
                border: `1px solid ${isMine ? '#f0e7c8' : '#f3f4f6'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: r.comments || cs ? 8 : 0 }}>
                <Avatar id={r.reviewer_id} name={r.reviewer_name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.reviewer_name || 'Reviewer'}
                    {isMine && (
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: G, color: '#fff', fontWeight: 700 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  {r.updated_at && (
                    <div style={{ fontSize: 10, color: '#999' }}>
                      {new Date(r.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <ScoreBadge score={r.score} />
                <VerdictPill verdict={r.verdict} />
              </div>
              {r.comments && (
                <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#444', lineHeight: 1.5, paddingLeft: 38 }}>
                  <MessageSquare size={11} style={{ flexShrink: 0, marginTop: 2, color: '#999' }} />
                  <span style={{ whiteSpace: 'pre-wrap' }}>{r.comments}</span>
                </div>
              )}
              {cs && Object.keys(cs).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 38 }}>
                  {Object.entries(cs).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 5,
                      background: '#f3f4f6', color: '#444', fontWeight: 500,
                    }}>
                      {k}: <strong style={{ color: '#1a1a1a' }}>{v}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
