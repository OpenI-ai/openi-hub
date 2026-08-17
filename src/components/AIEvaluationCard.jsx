import { Brain, ShieldAlert, Info } from 'lucide-react';

/**
 * Phase 172b — the AI evaluation result card.
 *
 * Extracted from ChallengeApplications.jsx (which was carrying it inline) because the
 * backend cutover made the card's job different. It used to show eight bars and a
 * number; the number is now the output of a weighted rubric that can CAP a score, and a
 * capped 2.0 and an honestly-earned 2.0 mean completely different things to a reviewer.
 * Dentsu's feedback was that the reasons "could be enhanced with a more robust backend
 * calculation" — a more defensible number that does not say why it is what it is just
 * moves the argument, so the cap, the evidence coverage and the model's confidence are
 * all surfaced here.
 *
 * NOT to be confused with src/components/AIEvaluationPanel.jsx, which is a dead
 * duplicate with no importers.
 *
 * Renders for BOTH scoring eras. Rows written before Phase 172 have no scoring_version,
 * no breakdown and no diagnostics; they fall back to the flat eight-bar view and are
 * labelled, because their number is on a different scale and silently mixing the two is
 * how a stale 4.5 outranks a fresh, well-founded 3.0.
 */

// Fallback labels for legacy rows only. Live rows carry persona-correct labels in
// score_breakdown — "tech_maturity" is displayed as "Team Strength" to an investor, so
// hardcoding corporate labels here would mislabel every non-corporate evaluation.
const LEGACY_VECTORS = [
  { k: 'solution_fit', l: 'Solution Fit' }, { k: 'tech_maturity', l: 'Tech Maturity' },
  { k: 'scalability', l: 'Scalability' }, { k: 'integration_feasibility', l: 'Integration' },
  { k: 'team_capability', l: 'Team' }, { k: 'cost_effectiveness', l: 'Cost' },
  { k: 'innovation_score', l: 'Innovation' }, { k: 'strategic_alignment', l: 'Strategy' },
];

// Match the backend bands (ACTION_SHORTLIST_AT 4.0, ACTION_EVALUATE_AT 3.0) rather than
// the old 3.5/2.5. When the colour disagrees with the recommendation pill beside it,
// the reviewer believes the colour.
function scoreColor(score) {
  if (score >= 4) return '#16a34a';
  if (score >= 3) return '#f59e0b';
  return '#dc2626';
}

function capSentence(evaluation) {
  const { cap_reason: reason, applied_cap: cap, score_breakdown: breakdown } = evaluation;
  if (!reason) return null;
  if (reason === 'low_evidence_coverage') {
    return `Score capped at ${cap} — almost nothing in this submission was backed by evidence, so the rating is an opinion about prose rather than about capability.`;
  }
  const [kind, dim] = String(reason).split(':');
  const row = (breakdown || []).find(r => r.key === dim);
  const label = row ? row.label : dim;
  const critical = kind === 'critical_floor';
  return `Score capped at ${cap} — ${label} scored ${row ? row.adjusted : 'low'} after weighing the evidence behind it${critical ? ', and it is a make-or-break dimension for this evaluator type' : ''}.`;
}

export default function AIEvaluationCard({ evaluation }) {
  if (!evaluation) return null;

  const isLegacy = !evaluation.scoring_version;
  const breakdown = Array.isArray(evaluation.score_breakdown) ? evaluation.score_breakdown : [];
  const rows = breakdown.length
    ? breakdown
    : LEGACY_VECTORS.map(v => ({ key: v.k, label: v.l, raw: evaluation[v.k], adjusted: evaluation[v.k] }));
  const cap = capSentence(evaluation);
  const claims = (evaluation.vector_details && evaluation.vector_details.unverified_claims) || [];
  const coverage = evaluation.evidence_coverage;
  const confidence = evaluation.mean_confidence;

  return (
    <div style={{ marginTop: 10, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span><Brain size={12} style={{ verticalAlign: -2 }} /> AI Evaluation</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(evaluation.overall_score) }}>
          {evaluation.overall_score}/5
        </span>
      </div>

      {/* How much of this was actually evidenced. A reviewer reading a 4.2 deserves to
          know it rests on two quotes out of eight dimensions. */}
      {!isLegacy && coverage !== null && coverage !== undefined && (
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>Evidence-backed: <strong style={{ color: coverage >= 0.5 ? '#16a34a' : '#f59e0b' }}>{Math.round(coverage * 100)}%</strong> of dimensions</span>
          {confidence !== null && confidence !== undefined && (
            <span>Model confidence: <strong style={{ color: confidence >= 0.5 ? '#16a34a' : '#f59e0b' }}>{Math.round(confidence * 100)}%</strong></span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4, marginBottom: 8 }}>
        {rows.map(r => {
          // Two bars, deliberately. The solid one is the score after the evidence behind
          // it was weighed — the number that actually drives the total — and the ghost
          // behind it is what the model first said. The gap between them IS the
          // criticality Dentsu asked for, and hiding it would make the adjusted score
          // look arbitrary.
          const adjusted = Number(r.adjusted ?? r.raw ?? 0);
          const raw = Number(r.raw ?? 0);
          const unevidenced = !isLegacy && r.evidence_present === false;
          return (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                title={r.is_critical ? 'Make-or-break dimension for this evaluator type' : undefined}
                style={{ fontSize: 10, color: unevidenced ? '#9ca3af' : '#666', width: 78, flexShrink: 0 }}>
                {r.label}{r.is_critical ? ' *' : ''}
              </span>
              <div style={{ position: 'relative', flex: 1, height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                {raw > adjusted && (
                  <div style={{ position: 'absolute', inset: 0, width: `${(raw / 5) * 100}%`, height: '100%', borderRadius: 3, background: '#ddd6fe' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, width: `${(adjusted / 5) * 100}%`, height: '100%', borderRadius: 3, background: unevidenced ? '#c4b5fd' : '#7c3aed' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 20 }}>
                {r.adjusted ?? r.raw ?? '-'}
              </span>
            </div>
          );
        })}
      </div>

      {cap && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 10, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, padding: '6px 8px', marginBottom: 6, lineHeight: 1.45 }}>
          <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{cap}</span>
        </div>
      )}

      {evaluation.explanation && (
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{evaluation.explanation}</div>
      )}

      {claims.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>UNVERIFIED CLAIMS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {claims.map((c, i) => (
              <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {(evaluation.red_flags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {evaluation.red_flags.map((f, i) => (
            <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>{f}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {evaluation.recommended_action && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: evaluation.recommended_action === 'shortlist' ? '#f0fdf4' : evaluation.recommended_action === 'reject' ? '#fef2f2' : '#eff6ff', color: evaluation.recommended_action === 'shortlist' ? '#16a34a' : evaluation.recommended_action === 'reject' ? '#dc2626' : '#2563eb' }}>
            AI: {evaluation.recommended_action}
          </span>
        )}
        {isLegacy && (
          <span
            title="Scored before the weighted evidence-based rubric. Not directly comparable with newer evaluations — re-evaluate to update."
            style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Info size={10} /> legacy scoring
          </span>
        )}
      </div>
    </div>
  );
}
