/**
 * PortfolioHealthTab (Phase 16B.4)
 *
 * Reusable tab content consumed by IncubatorProgramDetail + AcceleratorBatchDetail.
 * Shows portfolio radar chart, at-risk startups, per-startup latest evals,
 * and evaluation CRUD modal.
 *
 * Props:
 *   owner: 'incubator' | 'accelerator'
 *   parentId: program_id OR batch_id (used to scope health query + pipeline list)
 *   pipelineStartups: array of pipeline entries from the parent detail page
 *                     (incubator_program_startups OR accelerator_batch_startups)
 */
import { useState, useEffect } from 'react';
import { portfolioEvalsAPI } from '../../services/api';
import {
  Loader2, Plus, X, Edit3, Trash2, AlertTriangle, TrendingUp,
  Target, Users, BarChart3, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PortfolioRadarChart from './PortfolioRadarChart';
import EvaluationForm from './EvaluationForm';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function PortfolioHealthTab({ owner, parentId, pipelineStartups = [] }) {
  const [health, setHealth] = useState(null);
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [targetStartupId, setTargetStartupId] = useState(null); // pipeline entry id

  // Focused view state
  const [focusedStartupId, setFocusedStartupId] = useState(null); // pipeline entry id for trend view

  useEffect(() => { load(); }, [parentId, owner]);

  const load = async () => {
    if (!parentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const scope = owner === 'incubator' ? { program_id: parentId } : { batch_id: parentId };
      const [h, e] = await Promise.all([
        portfolioEvalsAPI.portfolioHealth(scope),
        portfolioEvalsAPI.list(scope),
      ]);
      setHealth(h);
      setEvals(Array.isArray(e) ? e : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load portfolio health');
    } finally {
      setLoading(false);
    }
  };

  const openNewEval = (startupId) => {
    setTargetStartupId(startupId);
    setEditingEval(null);
    setShowForm(true);
  };

  const openEditEval = (ev) => {
    setEditingEval(ev);
    setTargetStartupId(owner === 'incubator' ? ev.program_startup_id : ev.batch_startup_id);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingEval) {
        await portfolioEvalsAPI.update(editingEval.id, data);
        toast.success('Evaluation updated');
      } else {
        const payload = owner === 'incubator'
          ? { ...data, program_startup_id: targetStartupId }
          : { ...data, batch_startup_id: targetStartupId };
        await portfolioEvalsAPI.create(payload);
        toast.success('Evaluation saved');
      }
      setShowForm(false);
      setEditingEval(null);
      setTargetStartupId(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const removeEval = async (id) => {
    if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;
    try {
      await portfolioEvalsAPI.remove(id);
      toast.success('Evaluation deleted');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ color: G }} /></div>;
  }

  const hasAnyEvals = evals.length > 0;
  const pipelineKey = owner === 'incubator' ? 'program_startup_id' : 'batch_startup_id';

  // Build a map: pipeline_id → latest eval (from health response)
  const latestMap = {};
  (health?.startups_latest || []).forEach(s => { latestMap[s.pipeline_id] = s; });

  // Build a map: pipeline_id → full eval history (for trend view)
  const historyMap = {};
  evals.forEach(e => {
    const pid = e[pipelineKey];
    if (!historyMap[pid]) historyMap[pid] = [];
    historyMap[pid].push(e);
  });
  // Sort each startup's history by date
  Object.keys(historyMap).forEach(pid => {
    historyMap[pid].sort((a, b) => new Date(a.evaluation_date) - new Date(b.evaluation_date));
  });

  const focusedHistory = focusedStartupId ? historyMap[focusedStartupId] || [] : null;
  const focusedStartup = pipelineStartups.find(ps => ps.id === focusedStartupId);

  return (
    <div>
      {/* Header with Add Evaluation button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, color: '#666' }}>
            {hasAnyEvals
              ? `${health?.startups_evaluated || 0} startups evaluated · Portfolio avg ${health?.portfolio_overall_avg || '—'}/5 · ${health?.at_risk_count || 0} at risk`
              : 'No evaluations yet — score each portfolio startup across 8 dimensions to track progress'
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {focusedStartupId && (
            <button onClick={() => setFocusedStartupId(null)}
              style={{ padding: '8px 14px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ← Portfolio View
            </button>
          )}
          <button onClick={() => openNewEval(pipelineStartups[0]?.id || null)} disabled={!pipelineStartups.length}
            style={{ padding: '8px 14px', background: pipelineStartups.length ? G : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: pipelineStartups.length ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={14} /> New Evaluation
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyEvals && (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <BarChart3 size={42} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 6 }}>No evaluations yet</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 18, maxWidth: 480, margin: '0 auto 18px' }}>
            Score each startup in your pipeline across 8 dimensions (Market, Team, Tech, Traction, Financials, IP, Scalability, Strategic Fit) and track their progress over multiple checkpoints.
          </div>
          {pipelineStartups.length > 0 ? (
            <button onClick={() => openNewEval(pipelineStartups[0].id)}
              style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Start First Evaluation
            </button>
          ) : (
            <div style={{ fontSize: 12, color: '#dc2626' }}>Add startups to the pipeline tab first.</div>
          )}
        </div>
      )}

      {/* Focused single-startup trend view */}
      {focusedStartupId && focusedHistory && (
        <div style={{ ...card, padding: 20, marginBottom: 14 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
              {focusedStartup?.startup_name || 'Startup'} — Progression
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {focusedHistory.length} checkpoint{focusedHistory.length === 1 ? '' : 's'} tracked
            </div>
          </div>
          {focusedHistory.length >= 2 ? (
            <PortfolioRadarChart
              title="Current vs Previous Checkpoint"
              data={focusedHistory[focusedHistory.length - 1]}
              previous={focusedHistory[focusedHistory.length - 2]}
              size="lg"
            />
          ) : (
            <PortfolioRadarChart title="Latest Checkpoint" data={focusedHistory[0]} size="lg" />
          )}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              All Checkpoints
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {focusedHistory.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{ev.checkpoint_label}</span>
                      <span style={{ fontSize: 10, color: '#888' }}>{ev.evaluation_date?.slice(0, 10)}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#fff8ec', color: G, fontWeight: 700 }}>
                        Overall {ev.overall_score || '—'}
                      </span>
                    </div>
                    {ev.action_items && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 3, fontStyle: 'italic' }}>→ {ev.action_items}</div>
                    )}
                    {ev.red_flags && (
                      <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <AlertTriangle size={10} /> {ev.red_flags}
                      </div>
                    )}
                  </div>
                  <button onClick={() => openEditEval(ev)} style={btnIcon}><Edit3 size={11} /></button>
                  <button onClick={() => removeEval(ev.id)} style={{ ...btnIcon, borderColor: '#fee', color: '#dc2626' }}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio overview (hidden when focused on a single startup) */}
      {!focusedStartupId && hasAnyEvals && (
        <>
          {/* Top row: radar + KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 14, marginBottom: 14 }}>
            <div style={{ ...card, padding: 20 }}>
              <PortfolioRadarChart
                title={`Portfolio Average Across 8 Vectors (${health?.startups_evaluated || 0} startups)`}
                data={health?.avg_vectors}
                size="md"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <KpiCard icon={Target} label="Portfolio Avg" value={health?.portfolio_overall_avg || '—'} color={G} suffix="/5" />
              <KpiCard icon={Users} label="Evaluated" value={health?.startups_evaluated || 0} color="#3b82f6" />
              <KpiCard icon={AlertTriangle} label="At Risk" value={health?.at_risk_count || 0} color={health?.at_risk_count > 0 ? '#dc2626' : '#16a34a'} />
              <KpiCard icon={TrendingUp} label="Checkpoints" value={evals.length} color="#8b5cf6" />
            </div>
          </div>

          {/* At-risk startups section */}
          {(health?.at_risk || []).length > 0 && (
            <div style={{ ...card, padding: 18, marginBottom: 14, borderLeft: '3px solid #dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Portfolio At Risk
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>— startups with overall score &lt; 3 or red flags set</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {health.at_risk.map(s => (
                  <div key={s.pipeline_id} style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{s.startup_name}</div>
                        {s.red_flags && (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontStyle: 'italic' }}>⚠ {s.red_flags}</div>
                        )}
                        {s.action_items && (
                          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>→ {s.action_items}</div>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', marginLeft: 10 }}>
                        {s.overall_score || '—'}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-startup table */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #f0f0f0', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Latest Evaluation Per Startup · Click for trend view
            </div>
            {pipelineStartups.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', fontSize: 13, color: '#999' }}>No pipeline startups</div>
            ) : (
              <div>
                {pipelineStartups.map(ps => {
                  const latest = latestMap[ps.id];
                  const history = historyMap[ps.id] || [];
                  return (
                    <div key={ps.id}
                      onClick={() => history.length && setFocusedStartupId(ps.id)}
                      style={{
                        padding: '12px 18px', borderBottom: '1px solid #f5f5f5',
                        display: 'flex', alignItems: 'center', gap: 14,
                        cursor: history.length ? 'pointer' : 'default',
                        background: '#fff', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => history.length && (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{ps.startup_name}</span>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', textTransform: 'uppercase' }}>
                            {ps.application_status}
                          </span>
                          {history.length > 0 && (
                            <span style={{ fontSize: 9, color: '#888' }}>
                              {history.length} checkpoint{history.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {latest?.action_items && (
                          <div style={{ fontSize: 10, color: '#666', marginTop: 3, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            → {latest.action_items}
                          </div>
                        )}
                      </div>
                      {/* Mini score strip */}
                      {latest ? (
                        <div style={{ display: 'flex', gap: 2 }}>
                          {['market_score','team_score','tech_score','traction_score','financials_score','ip_score','scalability_score','strategic_fit_score'].map(v => {
                            const val = parseFloat(latest[v] || 0);
                            const color = val >= 4 ? '#16a34a' : val >= 3 ? G : val >= 2 ? '#f59e0b' : '#dc2626';
                            return (
                              <div key={v} title={v.replace('_score', '')}
                                style={{
                                  width: 18, height: 18, borderRadius: 3,
                                  background: val ? `${color}33` : '#f3f4f6',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 9, fontWeight: 700, color: val ? color : '#ccc',
                                }}>
                                {val ? val.toFixed(1).replace('.0', '') : '—'}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>no eval yet</span>
                      )}
                      {/* Overall badge */}
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                        background: latest ? '#fff8ec' : '#f3f4f6',
                        color: latest ? G : '#999',
                        minWidth: 44, textAlign: 'center',
                      }}>
                        {latest?.overall_score || '—'}
                      </span>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openNewEval(ps.id)} title="Add evaluation"
                          style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: G }}>
                          <Plus size={11} />
                        </button>
                        {latest && (
                          <button onClick={() => {
                            const full = evals.find(e => e.id === latest.id);
                            if (full) openEditEval(full);
                          }} title="Edit latest eval"
                            style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: '#666' }}>
                            <Edit3 size={11} />
                          </button>
                        )}
                      </div>
                      {history.length > 0 && <ChevronRight size={14} style={{ color: '#ccc' }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Evaluation form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                  {editingEval ? 'Edit Evaluation' : 'New Evaluation'}
                </h2>
                {!editingEval && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    Startup:&nbsp;
                    <select value={targetStartupId || ''} onChange={e => setTargetStartupId(parseInt(e.target.value, 10))}
                      style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 5, fontSize: 11 }}>
                      {pipelineStartups.map(ps => (
                        <option key={ps.id} value={ps.id}>{ps.startup_name} ({ps.application_status})</option>
                      ))}
                    </select>
                  </div>
                )}
                {editingEval && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    {editingEval.startup_name || 'Startup'} · {editingEval.checkpoint_label}
                  </div>
                )}
              </div>
              <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={() => { setShowForm(false); setEditingEval(null); setTargetStartupId(null); }} />
            </div>
            <EvaluationForm
              initial={editingEval}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingEval(null); setTargetStartupId(null); }}
              submitLabel={editingEval ? 'Save Changes' : 'Save Evaluation'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, suffix = '' }) {
  return (
    <div style={{ ...card, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>
          {value}{suffix && <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

const btnIcon = { padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: '#666' };
