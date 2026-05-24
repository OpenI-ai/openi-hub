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
// Phase 111 Ship 2d imports — toast already present, getToken added above
import { portfolioEvalsAPI, getToken} from '../../services/api';
import {
  Loader2, Plus, X, Edit3, Trash2,
  AlertTriangle, TrendingUp, Target, Users, BarChart3,
  ChevronRight, Share2, FileDown, Globe, Copy,  // Phase 111 Ship 2d icons added
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

  // Phase 111 Ship 2d: Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEvalId, setShareEvalId] = useState(null);
  const [shareTab, setShareTab] = useState('pdf');
  const [shareList, setShareList] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMinting, setShareMinting] = useState(false);

  // Phase 111 Ship 2d: Share handlers
  const openProgramEvalShare = async (evalId) => {
    setShareEvalId(evalId);
    setShareOpen(true);
    setShareTab('pdf');
    setShareLoading(true);
    try {
      const r = await portfolioEvalsAPI.listShares(evalId);
      setShareList(Array.isArray(r) ? r : []);
    } catch {
      setShareList([]);
    } finally {
      setShareLoading(false);
    }
  };

  const downloadProgramEvalPdf = async () => {
    if (!shareEvalId) return;
    try {
      const res = await fetch(portfolioEvalsAPI.pdfUrl(shareEvalId), { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `program-eval-${shareEvalId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const mintNewProgramEvalShare = async () => {
    if (!shareEvalId) return;
    setShareMinting(true);
    try {
      const r = await portfolioEvalsAPI.createShare(shareEvalId, {});
      setShareList(prev => [r, ...prev]);
      toast.success('Share link created');
    } catch (err) {
      toast.error(err?.message || 'Failed to create share');
    } finally {
      setShareMinting(false);
    }
  };

  const copyProgramEvalLink = async (token) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/program-evals/${token}`);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const revokeProgramEvalShare = async (shareId) => {
    if (!confirm('Revoke this share link?')) return;
    try {
      await portfolioEvalsAPI.revokeShare(shareId);
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };

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
                  {/* Phase 111 Ship 2d: Share button per evaluation row */}
                  <button onClick={() => openProgramEvalShare(ev.id)} style={btnIcon} title="Share evaluation"><Share2 size={11} /></button>
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
      {/* Phase 111 Ship 2d: Share modal JSX */}
      {shareOpen && shareEvalId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share Portfolio Evaluation</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf', icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'link', icon: <Globe size={13} />, label: 'Public link' },
              ].map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? '2.5px solid #D5AA5B' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D5AA5B' : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Branded PDF of this portfolio evaluation snapshot.
                </p>
                <button onClick={downloadProgramEvalPdf}
                  style={{ width: '100%', padding: '11px 18px', background: '#D5AA5B', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download evaluation PDF
                </button>
              </div>
            )}

            {shareTab === 'link' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create a link anyone with the URL can use to view this evaluation. Default 30-day expiry; revocable anytime.
                </p>
                <button onClick={mintNewProgramEvalShare} disabled={shareMinting}
                  style={{ width: '100%', padding: '10px 16px', background: '#D5AA5B', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating...' : '+ Create new share link'}
                </button>

                {shareLoading ? (
                  <p style={{ color: '#888', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading...</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {shareList.map(s => {
                      const expired = s.expires_at && new Date(s.expires_at) < new Date();
                      const revoked = !!s.revoked_at;
                      const inactive = expired || revoked;
                      const shareUrl = `${window.location.origin}/share/program-evals/${s.token}`;
                      return (
                        <div key={s.id} style={{ padding: 10, borderRadius: 8, background: inactive ? '#fafafa' : '#fff8ec', border: `1px solid ${inactive ? '#eee' : 'rgba(213,170,91,0.3)'}`, opacity: inactive ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: revoked ? '#fef2f2' : (expired ? '#fef9e7' : '#f0fdf4'), color: revoked ? '#dc2626' : (expired ? '#a16207' : '#16a34a') }}>
                              {revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#fff', borderRadius: 6, border: '1px solid #eee', fontSize: 10, fontFamily: 'monospace' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>{shareUrl}</span>
                            {!inactive && (
                              <>
                                <button onClick={() => copyProgramEvalLink(s.token)} style={{ padding: '3px 7px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Copy</button>
                                <button onClick={() => revokeProgramEvalShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
