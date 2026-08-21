import { useState, useEffect } from 'react';
import { investorAPI } from '../../services/api';
import {
  Loader2, ChevronLeft, ChevronRight, Clock, Plus, X, CheckCircle,
  Trash2, Star, DollarSign, Target, TrendingUp, Briefcase, FileText, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isUpgradeError } from '../../utils/upgradeError';
import UpgradeCTA from '../../components/UpgradeCTA';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STAGES = [
  { key: 'sourced',    label: 'Sourced',    color: '#3b82f6', bg: '#eff6ff' },
  { key: 'evaluating', label: 'Evaluating', color: '#8b5cf6', bg: '#faf5ff' },
  { key: 'loi',        label: 'LOI',        color: '#f59e0b', bg: '#fefce8' },
  { key: 'diligence',  label: 'Diligence',  color: '#0891b2', bg: '#ecfeff' },
  { key: 'term_sheet', label: 'Term Sheet', color: '#ea580c', bg: '#fff7ed' },
  { key: 'closed',     label: 'Closed',     color: '#16a34a', bg: '#f0fdf4' },
  { key: 'passed',     label: 'Passed',     color: '#6b7280', bg: '#f3f4f6' },
];

const PRIORITY_COLORS = { low: '#6b7280', medium: '#f59e0b', high: '#dc2626' };

const EVAL_VECTORS = [
  { key: 'market',        label: 'Market' },
  { key: 'team',          label: 'Team' },
  { key: 'tech',          label: 'Tech' },
  { key: 'traction',      label: 'Traction' },
  { key: 'financials',    label: 'Financials' },
  { key: 'ip',            label: 'IP' },
  { key: 'scalability',   label: 'Scalability' },
  { key: 'strategic_fit', label: 'Strategic Fit' },
];

function StarRating({ value, onChange, readonly }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          fill={n <= value ? G : 'none'}
          stroke={n <= value ? G : '#ccc'}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
          onClick={() => !readonly && onChange && onChange(n)}
        />
      ))}
    </div>
  );
}

export default function InvestorDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dealNotes, setDealNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Inline terms editing
  const [termsEdit, setTermsEdit] = useState(false);
  const [termsForm, setTermsForm] = useState({ investment_amount: '', equity_pct: '', valuation: '', investment_type: '', currency: 'INR' });

  // Add evaluation form
  const [showAddEval, setShowAddEval] = useState(false);
  const [evalForm, setEvalForm] = useState(() => {
    const init = {};
    EVAL_VECTORS.forEach(v => { init[v.key] = 0; });
    init.notes = '';
    return init;
  });

  // Milestones
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mForm, setMForm] = useState({ title: '', description: '', due_date: '' });

  // Tasks
  const [showAddTask, setShowAddTask] = useState(false);
  const [tForm, setTForm] = useState({ title: '', description: '', assignee_name: '', priority: 'medium', due_date: '' });

  // Create deal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ startup_name: '', title: '', investment_type: '', notes: '' });
  const [upgradeError, setUpgradeError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await investorAPI.listDeals();
      setDeals(Array.isArray(d) ? d : d.deals || []);
    } catch { toast.error('Failed to load deals'); }
    finally { setLoading(false); }
  };

  const moveToStage = async (id, newStage) => {
    try {
      await investorAPI.updateDeal(id, { status: newStage });
      toast.success(`Moved to ${STAGES.find(s => s.key === newStage)?.label || newStage}`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openDetail = async (deal) => {
    setSelectedDeal(deal);
    setDealNotes(deal.notes || '');
    setTermsForm({
      investment_amount: deal.investment_amount || '',
      equity_pct: deal.equity_pct || '',
      valuation: deal.valuation || '',
      investment_type: deal.investment_type || '',
      currency: deal.currency || 'INR',
    });
    try {
      const [evals, ms, ts] = await Promise.all([
        investorAPI.listEvaluations(deal.id),
        investorAPI.listDealMilestones(deal.id),
        investorAPI.listDealTasks(deal.id),
      ]);
      setEvaluations(Array.isArray(evals) ? evals : evals.evaluations || []);
      setMilestones(Array.isArray(ms) ? ms : ms.milestones || []);
      setTasks(Array.isArray(ts) ? ts : ts.tasks || []);
    } catch { toast.error('Failed to load deal details'); }
  };

  // ── Terms ──
  const saveTerms = async () => {
    try {
      await investorAPI.updateDeal(selectedDeal.id, termsForm);
      toast.success('Terms updated');
      setTermsEdit(false);
      load();
      setSelectedDeal(prev => ({ ...prev, ...termsForm }));
    } catch (err) { toast.error(err.message); }
  };

  // ── Notes ──
  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      await investorAPI.updateDeal(selectedDeal.id, { notes: dealNotes });
      toast.success('Notes saved');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setNotesSaving(false); }
  };

  // ── Evaluations ──
  const addEvaluation = async () => {
    try {
      await investorAPI.addEvaluation(selectedDeal.id, evalForm);
      const evals = await investorAPI.listEvaluations(selectedDeal.id);
      setEvaluations(Array.isArray(evals) ? evals : evals.evaluations || []);
      const reset = {};
      EVAL_VECTORS.forEach(v => { reset[v.key] = 0; });
      reset.notes = '';
      setEvalForm(reset);
      setShowAddEval(false);
      toast.success('Evaluation added');
    } catch { toast.error('Failed to add evaluation'); }
  };

  // ── Milestones ──
  const addMilestone = async () => {
    if (!mForm.title) return;
    try {
      await investorAPI.createDealMilestone(selectedDeal.id, mForm);
      const ms = await investorAPI.listDealMilestones(selectedDeal.id);
      setMilestones(Array.isArray(ms) ? ms : ms.milestones || []);
      setMForm({ title: '', description: '', due_date: '' });
      setShowAddMilestone(false);
      toast.success('Milestone added');
    } catch { toast.error('Failed to add milestone'); }
  };

  const toggleMilestone = async (m) => {
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    try {
      await investorAPI.updateDealMilestone(selectedDeal.id, m.id, { status: newStatus });
      const ms = await investorAPI.listDealMilestones(selectedDeal.id);
      setMilestones(Array.isArray(ms) ? ms : ms.milestones || []);
    } catch { toast.error('Failed to update milestone'); }
  };

  // ── Tasks ──
  const addTask = async () => {
    if (!tForm.title) return;
    try {
      await investorAPI.createDealTask(selectedDeal.id, tForm);
      const ts = await investorAPI.listDealTasks(selectedDeal.id);
      setTasks(Array.isArray(ts) ? ts : ts.tasks || []);
      setTForm({ title: '', description: '', assignee_name: '', priority: 'medium', due_date: '' });
      setShowAddTask(false);
      toast.success('Task added');
    } catch { toast.error('Failed to add task'); }
  };

  const toggleTask = async (t) => {
    const newStatus = t.status === 'done' ? 'todo' : 'done';
    try {
      await investorAPI.updateDealTask(selectedDeal.id, t.id, { status: newStatus });
      const ts = await investorAPI.listDealTasks(selectedDeal.id);
      setTasks(Array.isArray(ts) ? ts : ts.tasks || []);
    } catch { toast.error('Failed to update task'); }
  };

  // ── Create deal ──
  const handleCreate = async () => {
    if (!createForm.startup_name) { toast.error('Startup name is required'); return; }
    setUpgradeError(null);
    try {
      await investorAPI.createDeal(createForm);
      toast.success('Deal created');
      setCreateForm({ startup_name: '', title: '', investment_type: '', notes: '' });
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err.message);
      if (isUpgradeError(err)) setUpgradeError(err);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  // ── DETAIL VIEW ──────────────────────────────────────────
  if (selectedDeal) {
    const deal = deals.find(d => d.id === selectedDeal.id) || selectedDeal;
    const stage = STAGES.find(s => s.key === (deal.status || 'sourced')) || STAGES[0];
    const msDone = milestones.filter(m => m.status === 'completed').length;
    const tsDone = tasks.filter(t => t.status === 'done').length;

    return (
      <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>
        <button onClick={() => setSelectedDeal(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#5c5c5c', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
          <ChevronLeft size={16} /> Back to Pipeline
        </button>

        {/* ── Header ── */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{deal.startup_name || 'Untitled Deal'}</h2>
              {deal.title && <div style={{ fontSize: 12, color: '#5c5c5c', marginTop: 2 }}>{deal.title}</div>}
              <div style={{ fontSize: 11, color: '#6e6e6e', marginTop: 4 }}>
                <Clock size={11} style={{ verticalAlign: -1 }} /> Created {new Date(deal.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {deal.investment_amount && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                  <DollarSign size={12} style={{ verticalAlign: -2 }} />{deal.currency || 'INR'} {parseFloat(deal.investment_amount).toLocaleString()}
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: stage.bg, color: stage.color }}>{stage.label}</span>
            </div>
          </div>

          {/* ── Move stage ── */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button key={s.key} onClick={() => moveToStage(deal.id, s.key)}
                style={{
                  padding: '4px 12px', fontSize: 10, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: 'none',
                  background: (deal.status || 'sourced') === s.key ? s.color : s.bg,
                  color: (deal.status || 'sourced') === s.key ? '#fff' : s.color,
                  opacity: (deal.status || 'sourced') === s.key ? 1 : 0.7,
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Investment Terms ── */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Briefcase size={14} style={{ verticalAlign: -2, marginRight: 6, color: G }} />Investment Terms
            </h3>
            <button onClick={() => setTermsEdit(!termsEdit)} style={{ fontSize: 10, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {termsEdit ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {termsEdit ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Amount</label>
                <input type="number" placeholder="Amount" value={termsForm.investment_amount} onChange={e => setTermsForm(f => ({ ...f, investment_amount: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Equity %</label>
                <input type="number" step="0.1" placeholder="Equity %" value={termsForm.equity_pct} onChange={e => setTermsForm(f => ({ ...f, equity_pct: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Valuation</label>
                <input type="number" placeholder="Valuation" value={termsForm.valuation} onChange={e => setTermsForm(f => ({ ...f, valuation: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Type</label>
                <select value={termsForm.investment_type} onChange={e => setTermsForm(f => ({ ...f, investment_type: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                  <option value="">Select type</option>
                  <option value="equity">Equity</option>
                  <option value="convertible_note">Convertible Note</option>
                  <option value="safe">SAFE</option>
                  <option value="debt">Debt</option>
                  <option value="revenue_share">Revenue Share</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Currency</label>
                <select value={termsForm.currency} onChange={e => setTermsForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                  <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={saveTerms} style={{ padding: '6px 18px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
              {[
                { label: 'Amount', val: deal.investment_amount ? `${deal.currency || 'INR'} ${parseFloat(deal.investment_amount).toLocaleString()}` : '--' },
                { label: 'Equity', val: deal.equity_pct ? `${deal.equity_pct}%` : '--' },
                { label: 'Valuation', val: deal.valuation ? `${deal.currency || 'INR'} ${parseFloat(deal.valuation).toLocaleString()}` : '--' },
                { label: 'Type', val: deal.investment_type ? deal.investment_type.replace(/_/g, ' ') : '--' },
                { label: 'Currency', val: deal.currency || 'INR' },
              ].map(item => (
                <div key={item.label} style={{ padding: 10, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#5c5c5c', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>{item.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 8-Vector Evaluation ── */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <BarChart3 size={14} style={{ verticalAlign: -2, marginRight: 6, color: G }} />8-Vector Evaluation
            </h3>
            <button onClick={() => setShowAddEval(!showAddEval)} style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add Evaluation
            </button>
          </div>

          {/* Existing evaluations summary */}
          {evaluations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
              {EVAL_VECTORS.map(v => {
                const avg = evaluations.length > 0
                  ? (evaluations.reduce((sum, ev) => sum + (parseFloat(ev[v.key]) || 0), 0) / evaluations.length).toFixed(1)
                  : 0;
                return (
                  <div key={v.key} style={{ padding: 8, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#5c5c5c', marginBottom: 4 }}>{v.label}</div>
                    <StarRating value={Math.round(avg)} readonly />
                    <div style={{ fontSize: 10, color: '#6e6e6e', marginTop: 2 }}>{avg}/5</div>
                  </div>
                );
              })}
            </div>
          )}

          {evaluations.length > 0 && (
            <div style={{ fontSize: 10, color: '#5c5c5c', marginBottom: 8 }}>{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} recorded</div>
          )}

          {/* Add evaluation form */}
          {showAddEval && (
            <div style={{ padding: 14, background: '#f9fafb', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                {EVAL_VECTORS.map(v => (
                  <div key={v.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{v.label}</div>
                    <StarRating value={evalForm[v.key]} onChange={val => setEvalForm(f => ({ ...f, [v.key]: val }))} />
                  </div>
                ))}
              </div>
              <textarea placeholder="Evaluation notes (optional)" value={evalForm.notes} onChange={e => setEvalForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                style={{ width: '100%', padding: 8, fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addEvaluation} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Submit Evaluation</button>
                <button onClick={() => setShowAddEval(false)} style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {evaluations.length === 0 && !showAddEval && (
            <div style={{ textAlign: 'center', padding: 16, color: '#ccc', fontSize: 12 }}>No evaluations yet</div>
          )}
        </div>

        {/* ── Milestones ── */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Target size={14} style={{ verticalAlign: -2, marginRight: 6, color: G }} />Milestones ({msDone}/{milestones.length})
            </h3>
            <button onClick={() => setShowAddMilestone(!showAddMilestone)} style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          {milestones.length > 0 && (
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${milestones.length ? (msDone / milestones.length * 100) : 0}%`, background: G, transition: 'width 0.3s' }} />
            </div>
          )}
          {showAddMilestone && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <input placeholder="Milestone title" value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))}
                style={{ flex: 2, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
              <input type="date" value={mForm.due_date} onChange={e => setMForm(f => ({ ...f, due_date: e.target.value }))}
                style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
              <button onClick={addMilestone} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Add</button>
              <button onClick={() => setShowAddMilestone(false)} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={14} /></button>
            </div>
          )}
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: '#ccc', fontSize: 12 }}>No milestones yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {milestones.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: m.status === 'completed' ? '#f0fdf410' : '#fff', border: '1px solid #f0f0f0' }}>
                  <button onClick={() => toggleMilestone(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.status === 'completed' ? '#16a34a' : '#ddd', flexShrink: 0 }}>
                    <CheckCircle size={18} fill={m.status === 'completed' ? '#16a34a' : 'none'} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: m.status === 'completed' ? '#999' : '#333', textDecoration: m.status === 'completed' ? 'line-through' : 'none' }}>{m.title}</div>
                    {m.description && <div style={{ fontSize: 10, color: '#6e6e6e' }}>{m.description}</div>}
                  </div>
                  {m.due_date && (
                    <span style={{ fontSize: 10, color: m.status === 'completed' ? '#16a34a' : new Date(m.due_date) < new Date() ? '#dc2626' : '#f59e0b', fontWeight: 500, flexShrink: 0 }}>
                      {new Date(m.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <button onClick={async () => { await investorAPI.deleteDealMilestone(selectedDeal.id, m.id); const ms = await investorAPI.listDealMilestones(selectedDeal.id); setMilestones(Array.isArray(ms) ? ms : ms.milestones || []); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', flexShrink: 0 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tasks ── */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              Tasks ({tsDone}/{tasks.length})
            </h3>
            <button onClick={() => setShowAddTask(!showAddTask)} style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add Task
            </button>
          </div>
          {showAddTask && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 10, padding: 12, background: '#f9fafb', borderRadius: 10 }}>
              <input placeholder="Task title" value={tForm.title} onChange={e => setTForm(f => ({ ...f, title: e.target.value }))}
                style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Assignee" value={tForm.assignee_name} onChange={e => setTForm(f => ({ ...f, assignee_name: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
                <select value={tForm.priority} onChange={e => setTForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
                <input type="date" value={tForm.due_date} onChange={e => setTForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addTask} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Add Task</button>
                <button onClick={() => setShowAddTask(false)} style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: '#ccc', fontSize: 12 }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <button onClick={() => toggleTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'done' ? '#16a34a' : '#ddd', flexShrink: 0 }}>
                    <CheckCircle size={18} fill={t.status === 'done' ? '#16a34a' : 'none'} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: t.status === 'done' ? '#999' : '#333', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {t.assignee_name && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#f3f4f6', color: '#666' }}>{t.assignee_name}</span>}
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: `${PRIORITY_COLORS[t.priority]}12`, color: PRIORITY_COLORS[t.priority], fontWeight: 600 }}>{t.priority}</span>
                    </div>
                  </div>
                  {t.due_date && <span style={{ fontSize: 10, color: t.status === 'done' ? '#16a34a' : new Date(t.due_date) < new Date() ? '#dc2626' : '#888', flexShrink: 0 }}>{new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                  <button onClick={async () => { await investorAPI.deleteDealTask(selectedDeal.id, t.id); const ts = await investorAPI.listDealTasks(selectedDeal.id); setTasks(Array.isArray(ts) ? ts : ts.tasks || []); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', flexShrink: 0 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <FileText size={14} style={{ verticalAlign: -2, marginRight: 6, color: G }} />Notes
            </h3>
            <button onClick={saveNotes} disabled={notesSaving}
              style={{ padding: '4px 14px', fontSize: 10, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', opacity: notesSaving ? 0.6 : 1 }}>
              {notesSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <textarea value={dealNotes} onChange={e => setDealNotes(e.target.value)} rows={4}
            style={{ width: '100%', padding: 10, fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', resize: 'vertical', color: '#555', boxSizing: 'border-box' }} />
        </div>
      </div>
    );
  }

  // ── KANBAN VIEW ──────────────────────────────────────────
  const grouped = {};
  STAGES.forEach(s => { grouped[s.key] = deals.filter(d => (d.status || 'sourced') === s.key); });

  return (
    <div style={{ padding: 24 }}>
      <div id="tour-page-deals-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <TrendingUp size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Deal Pipeline
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#5c5c5c' }}>{deals.length} deals</span>
          <button id="tour-page-deals-create" onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> Create Deal
          </button>
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreate && (
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>New Deal</h3>
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Startup Name *</label>
              <input placeholder="e.g. ArmorTech" value={createForm.startup_name} onChange={e => setCreateForm(f => ({ ...f, startup_name: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Deal Title</label>
              <input placeholder="e.g. Series A Lead" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Investment Type</label>
              <select value={createForm.investment_type} onChange={e => setCreateForm(f => ({ ...f, investment_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                <option value="">Select type</option>
                <option value="equity">Equity</option>
                <option value="convertible_note">Convertible Note</option>
                <option value="safe">SAFE</option>
                <option value="debt">Debt</option>
                <option value="revenue_share">Revenue Share</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#5c5c5c', display: 'block', marginBottom: 2 }}>Notes</label>
              <input placeholder="Initial notes" value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {upgradeError && (
            <UpgradeCTA compact feature={upgradeError.feature} plan={upgradeError.plan} />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} style={{ padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Create Deal</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {deals.length === 0 && !showCreate ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <TrendingUp size={32} style={{ color: '#ddd', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#5c5c5c' }}>No deals in pipeline</p>
          <p style={{ fontSize: 12, color: '#6e6e6e' }}>Create your first deal to start tracking</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`, gap: 10, overflowX: 'auto' }}>
          {STAGES.map(stage => (
            <div key={stage.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: stage.bg }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: 10, color: '#666', marginLeft: 'auto' }}>{grouped[stage.key]?.length || 0}</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {(grouped[stage.key] || []).map(deal => {
                  const msTotal = parseInt(deal.milestone_total) || 0;
                  const msDone2 = parseInt(deal.milestone_done) || 0;
                  const msPct = msTotal > 0 ? Math.round(msDone2 / msTotal * 100) : 0;
                  return (
                    <div key={deal.id} style={{ ...card, padding: 12, cursor: 'pointer' }}
                      onClick={() => openDetail(deal)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = stage.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${G}18`, color: G, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {(deal.startup_name || '?')[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.startup_name || 'Unknown'}</div>
                          {deal.title && <div style={{ fontSize: 10, color: '#5c5c5c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.title}</div>}
                        </div>
                      </div>

                      {deal.investment_amount && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                          <DollarSign size={10} style={{ verticalAlign: -1 }} /> {deal.currency || 'INR'} {parseFloat(deal.investment_amount).toLocaleString()}
                        </div>
                      )}

                      {deal.investment_type && (
                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#f59e0b', textTransform: 'capitalize' }}>{deal.investment_type.replace(/_/g, ' ')}</span>
                      )}

                      {/* Mini milestone progress */}
                      {msTotal > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <div style={{ flex: 1, height: 3, background: '#f0f0f0', borderRadius: 2 }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${msPct}%`, background: G }} />
                          </div>
                          <span style={{ fontSize: 9, color: '#6e6e6e' }}>{msDone2}/{msTotal}</span>
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: '#6e6e6e', marginTop: 6 }}>
                        <Clock size={10} style={{ verticalAlign: -1 }} /> {new Date(deal.updated_at || deal.created_at).toLocaleDateString()}
                      </div>

                      {/* Stage advance button */}
                      {stage.key !== 'closed' && stage.key !== 'passed' && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            const idx = STAGES.findIndex(s => s.key === stage.key);
                            if (idx < STAGES.length - 2) moveToStage(deal.id, STAGES[idx + 1].key);
                          }}
                            style={{
                              width: '100%', padding: '4px 8px', fontSize: 10, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: 'none',
                              background: STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.bg || '#f3f4f6',
                              color: STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.color || '#666',
                            }}>
                            {STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.label} <ChevronRight size={10} style={{ verticalAlign: -1 }} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
