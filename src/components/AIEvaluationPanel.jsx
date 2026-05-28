/**
 * Phase 35B: Shared AI Evaluation Panel Component
 *
 * Reusable across all personas (Corporate, Investor, Incubator, Accelerator, Govt).
 * Shows 8-vector scores, explanation, red flags, and recommended action.
 */
import { Sparkles, Brain, Loader2, BarChart3, Zap, X } from 'lucide-react';

const G = '#D5AA5B';

const VECTORS = [
  { k: 'solution_fit', l: 'Solution Fit' },
  { k: 'tech_maturity', l: 'Tech Maturity' },
  { k: 'scalability', l: 'Scalability' },
  { k: 'integration_feasibility', l: 'Integration' },
  { k: 'team_capability', l: 'Team' },
  { k: 'cost_effectiveness', l: 'Cost' },
  { k: 'innovation_score', l: 'Innovation' },
  { k: 'strategic_alignment', l: 'Strategy' },
];

const ACTION_COLORS = {
  shortlist: { bg: '#f0fdf4', color: '#16a34a' },
  evaluate: { bg: '#eff6ff', color: '#2563eb' },
  reject: { bg: '#fef2f2', color: '#dc2626' },
  skip: { bg: '#f3f4f6', color: '#6b7280' },
};

// ── Evaluation Score Card ────────────────────────────────────
export function EvalScoreCard({ evaluation }) {
  if (!evaluation) return null;
  const ac = ACTION_COLORS[evaluation.recommended_action] || ACTION_COLORS.evaluate;

  return (
    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span><Brain size={12} style={{ verticalAlign: -2 }} /> AI Evaluation</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: evaluation.overall_score >= 3.5 ? '#16a34a' : evaluation.overall_score >= 2.5 ? '#f59e0b' : '#dc2626' }}>
          {evaluation.overall_score}/5
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4, marginBottom: 8 }}>
        {VECTORS.map(v => (
          <div key={v.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#666', width: 65, flexShrink: 0 }}>{v.l}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ width: `${((evaluation[v.k] || 0) / 5) * 100}%`, height: '100%', borderRadius: 3, background: '#7c3aed' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 14 }}>{evaluation[v.k] || '-'}</span>
          </div>
        ))}
      </div>
      {evaluation.explanation && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{evaluation.explanation}</div>}
      {(evaluation.red_flags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {evaluation.red_flags.map((f, i) => <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>{f}</span>)}
        </div>
      )}
      {evaluation.recommended_action && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ac.bg, color: ac.color }}>
          AI: {evaluation.recommended_action}
        </span>
      )}
    </div>
  );
}

// ── AI Evaluate Button ───────────────────────────────────────
export function AIEvaluateButton({ onEvaluate, loading, hasEvaluation }) {
  return (
    <button onClick={onEvaluate} disabled={loading}
      style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7,
        background: hasEvaluation ? '#f0fdf4' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        color: hasEvaluation ? '#16a34a' : '#fff',
        border: hasEvaluation ? '1px solid #bbf7d0' : 'none',
        cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? <Loader2 size={11} className="animate-spin" style={{ verticalAlign: -2 }} /> : <Sparkles size={11} style={{ verticalAlign: -2 }} />}
      {' '}{hasEvaluation ? 'Re-evaluate' : 'AI Evaluate'}
    </button>
  );
}

// ── AI Advisor Panel ─────────────────────────────────────────
export function AIAdvisorPanel({ suggestions, onApply, onClose }) {
  if (!suggestions) return null;
  return (
    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Brain size={14} /> AI Suggestions
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={12} /></button>
      </div>
      {suggestions.refined_description && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Refined Description</div>
          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, marginBottom: 4 }}>{suggestions.refined_description}</div>
          <button onClick={() => onApply('description', suggestions.refined_description)}
            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        {suggestions.sectors?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Sectors</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
              {suggestions.sectors.map(s => <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#eff6ff', color: '#2563eb' }}>{s}</span>)}
            </div>
            <button onClick={() => onApply('sectors', suggestions.sectors)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
          </div>
        )}
        {suggestions.technologies?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Technologies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
              {suggestions.technologies.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
            </div>
            <button onClick={() => onApply('technologies', suggestions.technologies)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
          </div>
        )}
        {suggestions.budget_range && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Budget</div>
            <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{suggestions.budget_range}</div>
            <button onClick={() => onApply('budget_range', suggestions.budget_range)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
          </div>
        )}
        {suggestions.timeline && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Timeline</div>
            <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{suggestions.timeline}</div>
            <button onClick={() => onApply('timeline', suggestions.timeline)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
          </div>
        )}
      </div>
      {suggestions.evaluation_criteria?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Evaluation Criteria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {suggestions.evaluation_criteria.map((c, i) => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>{c}</span>)}
          </div>
        </div>
      )}
      {suggestions.suggestions?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Tips</div>
          {suggestions.suggestions.map((s, i) => <div key={i} style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>- {s}</div>)}
        </div>
      )}
    </div>
  );
}

// ── AI Analysis Results Panel ────────────────────────────────
export function AIAnalysisPanel({ analysisData, applications }) {
  if (!analysisData) return null;
  return (
    <div>
      {analysisData.top_pick && (
        <div style={{ background: '#fff', border: '2px solid #7c3aed', borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: '0 1px 4px rgba(124,58,237,0.1)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} /> Top Pick
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            {(applications || []).find(a => a.id === analysisData.top_pick.application_id)?.startup_name || 'Startup'}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{analysisData.top_pick.rationale}</div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {(analysisData.analyses || []).sort((a, b) => (a.ranking || 99) - (b.ranking || 99)).map(analysis => {
          const app = (applications || []).find(a => a.id === analysis.application_id) || {};
          return (
            <div key={analysis.application_id || analysis.idx} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  #{analysis.ranking} {app.startup_name || `Application #${analysis.application_id}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 60, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: `${analysis.fit_score || 0}%`, height: '100%', borderRadius: 3, background: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }}>{analysis.fit_score}/100</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 6, lineHeight: 1.5 }}>{analysis.summary}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(analysis.strengths || []).length > 0 && (
                  <div style={{ flex: 1 }}>
                    {analysis.strengths.map((s, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', margin: '0 3px 3px 0' }}>{s}</span>)}
                  </div>
                )}
                {(analysis.weaknesses || []).length > 0 && (
                  <div style={{ flex: 1 }}>
                    {analysis.weaknesses.map((w, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', margin: '0 3px 3px 0' }}>{w}</span>)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Advisor Button ────────────────────────────────────────
export function AIAdvisorButton({ onClick, loading }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none',
        cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI Advisor
    </button>
  );
}

// ── AI Analysis Button ───────────────────────────────────────
export function AIAnalysisButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7,
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none',
        cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? <Loader2 size={11} className="animate-spin" /> : <BarChart3 size={11} />} AI Analysis
    </button>
  );
}
