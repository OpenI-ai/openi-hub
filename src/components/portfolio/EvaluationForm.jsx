/**
 * EvaluationForm (Phase 16B.4)
 *
 * Reusable 8-vector evaluation form with sliders, notes, red flags, action items.
 * Used in both incubator and accelerator Portfolio Health tabs.
 *
 * Props:
 *   initial?: object (for edit mode)
 *   onSubmit: async (data) => void
 *   onCancel: () => void
 *   submitLabel?: string (default 'Save Evaluation')
 */
import { useState } from 'react';

const G = '#D0A848';

const VECTORS = [
  { key: 'market_score',        label: 'Market',        desc: 'Market size, timing, fit' },
  { key: 'team_score',          label: 'Team',          desc: 'Founder experience, composition, execution' },
  { key: 'tech_score',          label: 'Tech',          desc: 'Differentiation, defensibility, readiness' },
  { key: 'traction_score',      label: 'Traction',      desc: 'User growth, revenue, partnerships' },
  { key: 'financials_score',    label: 'Financials',    desc: 'Unit economics, runway, burn discipline' },
  { key: 'ip_score',            label: 'IP',            desc: 'Patents, trade secrets, proprietary data' },
  { key: 'scalability_score',   label: 'Scalability',   desc: 'Growth potential, unit economics at scale' },
  { key: 'strategic_fit_score', label: 'Strategic Fit', desc: 'Alignment with program focus/thesis' },
];

const CHECKPOINT_OPTIONS = [
  'Entry', 'Mid-program', 'Demo Day', 'Graduation', 'Custom',
];

export default function EvaluationForm({ initial, onSubmit, onCancel, submitLabel = 'Save Evaluation' }) {
  const [form, setForm] = useState(() => {
    const base = {
      checkpoint_label: 'Entry',
      evaluation_date: new Date().toISOString().slice(0, 10),
      market_score: 3, team_score: 3, tech_score: 3, traction_score: 3,
      financials_score: 3, ip_score: 3, scalability_score: 3, strategic_fit_score: 3,
      notes: '', red_flags: '', action_items: '',
    };
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      evaluation_date: initial.evaluation_date
        ? initial.evaluation_date.slice(0, 10)
        : base.evaluation_date,
    };
  });
  const [saving, setSaving] = useState(false);

  const setScore = (key, val) => setForm({ ...form, [key]: parseFloat(val) });

  const computeOverall = () => {
    const vals = VECTORS.map(v => form[v.key]).filter(v => v != null && !isNaN(v));
    if (!vals.length) return '—';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      {/* Checkpoint + date */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Checkpoint</label>
          <select value={form.checkpoint_label} onChange={e => setForm({ ...form, checkpoint_label: e.target.value })} style={inp}>
            {CHECKPOINT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={form.evaluation_date} onChange={e => setForm({ ...form, evaluation_date: e.target.value })} style={inp} />
        </div>
      </div>

      {/* 8 vectors with sliders */}
      <div style={{
        padding: 14, background: '#fafafa', border: '1px solid #eee', borderRadius: 10,
        display: 'grid', gap: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            8-Vector Scores (1–5)
          </div>
          <div style={{ fontSize: 11, color: '#5c5c5c' }}>
            Overall: <strong style={{ color: G, fontSize: 14 }}>{computeOverall()}</strong>
          </div>
        </div>
        {VECTORS.map(v => (
          <div key={v.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{v.label}</span>
                <span style={{ fontSize: 10, color: '#5c5c5c', marginLeft: 6 }}>— {v.desc}</span>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: G, minWidth: 28, textAlign: 'right',
                padding: '2px 7px', background: '#fff8ec', borderRadius: 5,
              }}>
                {form[v.key] ?? '—'}
              </div>
            </div>
            <input
              type="range" min="1" max="5" step="0.1"
              value={form[v.key] ?? 3}
              onChange={e => setScore(v.key, e.target.value)}
              style={{ width: '100%', accentColor: G, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb', marginTop: 1 }}>
              <span>1 Poor</span>
              <span>3 Average</span>
              <span>5 Excellent</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label style={lbl}>Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="General observations and context..." style={{ ...inp, resize: 'vertical' }} />
      </div>

      {/* Red flags */}
      <div>
        <label style={{ ...lbl, color: '#dc2626' }}>⚠ Red Flags</label>
        <textarea rows={2} value={form.red_flags} onChange={e => setForm({ ...form, red_flags: e.target.value })}
          placeholder="Issues requiring immediate attention (leave blank if none)..."
          style={{ ...inp, resize: 'vertical', borderColor: form.red_flags ? '#fecaca' : '#ddd' }} />
      </div>

      {/* Action items */}
      <div>
        <label style={lbl}>Action Items</label>
        <textarea rows={2} value={form.action_items} onChange={e => setForm({ ...form, action_items: e.target.value })}
          placeholder="What should the startup do next..."
          style={{ ...inp, resize: 'vertical' }} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" onClick={onCancel} disabled={saving}
          style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: saving ? 'default' : 'pointer' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: '9px 18px', background: saving ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
