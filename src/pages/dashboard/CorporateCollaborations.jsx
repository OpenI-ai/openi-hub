import { useState, useEffect } from 'react';
import { corporateAPI } from '../../services/api';
import { Link2, Loader2, ChevronRight, ChevronLeft, Clock, Plus, Edit3, X, CheckCircle, Trash2, DollarSign, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STAGES = [
  { key: 'exploring', label: 'Exploring', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'poc',       label: 'PoC',       color: '#f59e0b', bg: '#fefce8' },
  { key: 'pilot',     label: 'Pilot',     color: '#8b5cf6', bg: '#faf5ff' },
  { key: 'scaling',   label: 'Scaling',   color: '#16a34a', bg: '#f0fdf4' },
  { key: 'completed', label: 'Completed', color: '#6b7280', bg: '#f3f4f6' },
];

const PRIORITY_COLORS = { low: '#6b7280', medium: '#f59e0b', high: '#dc2626' };

export default function CorporateCollaborations() {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  // Detail view
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [mForm, setMForm] = useState({ title: '', description: '', due_date: '' });
  const [tForm, setTForm] = useState({ title: '', description: '', assignee_name: '', priority: 'medium', due_date: '' });
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ budget_estimated: '', budget_spent: '', currency: 'INR' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await corporateAPI.listCollabs(); setCollabs(d); }
    catch { toast.error('Failed to load collaborations'); }
    finally { setLoading(false); }
  };

  const moveToStage = async (id, newStatus) => {
    try { await corporateAPI.updateCollab(id, { status: newStatus }); toast.success(`Moved to ${newStatus}`); load(); }
    catch (err) { toast.error(err.message); }
  };

  const saveNotes = async (id) => {
    try { await corporateAPI.updateCollab(id, { notes: editNotes }); toast.success('Notes saved'); setEditing(null); load(); }
    catch (err) { toast.error(err.message); }
  };

  const openDetail = async (co) => {
    setSelectedCollab(co);
    setBudgetForm({ budget_estimated: co.budget_estimated || '', budget_spent: co.budget_spent || '', currency: co.currency || 'INR' });
    try {
      const [ms, ts] = await Promise.all([corporateAPI.listMilestones(co.id), corporateAPI.listTasks(co.id)]);
      setMilestones(ms); setTasks(ts);
    } catch { toast.error('Failed to load details'); }
  };

  const toggleMilestone = async (m) => {
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    try { await corporateAPI.updateMilestone(selectedCollab.id, m.id, { status: newStatus }); const ms = await corporateAPI.listMilestones(selectedCollab.id); setMilestones(ms); }
    catch { toast.error('Failed to update milestone'); }
  };

  const addMilestone = async () => {
    if (!mForm.title) return;
    try { await corporateAPI.createMilestone(selectedCollab.id, mForm); const ms = await corporateAPI.listMilestones(selectedCollab.id); setMilestones(ms); setMForm({ title: '', description: '', due_date: '' }); setShowAddMilestone(false); toast.success('Milestone added'); }
    catch { toast.error('Failed to add milestone'); }
  };

  const toggleTask = async (t) => {
    const newStatus = t.status === 'done' ? 'todo' : 'done';
    try { await corporateAPI.updateTask(selectedCollab.id, t.id, { status: newStatus }); const ts = await corporateAPI.listTasks(selectedCollab.id); setTasks(ts); }
    catch { toast.error('Failed to update task'); }
  };

  const addTask = async () => {
    if (!tForm.title) return;
    try { await corporateAPI.createTask(selectedCollab.id, tForm); const ts = await corporateAPI.listTasks(selectedCollab.id); setTasks(ts); setTForm({ title: '', description: '', assignee_name: '', priority: 'medium', due_date: '' }); setShowAddTask(false); toast.success('Task added'); }
    catch { toast.error('Failed to add task'); }
  };

  const saveBudget = async () => {
    try { await corporateAPI.updateCollab(selectedCollab.id, budgetForm); toast.success('Budget saved'); setBudgetEdit(false); load(); }
    catch { toast.error('Failed to save budget'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  // ── DETAIL VIEW ───────────────────────────────────────────
  if (selectedCollab) {
    const co = collabs.find(c => c.id === selectedCollab.id) || selectedCollab;
    const stage = STAGES.find(s => s.key === co.status) || STAGES[0];
    const msDone = milestones.filter(m => m.status === 'completed').length;
    const tsDone = tasks.filter(t => t.status === 'done').length;
    const budgetPct = co.budget_estimated ? Math.min(100, Math.round((co.budget_spent || 0) / co.budget_estimated * 100)) : 0;
    const budgetColor = budgetPct > 90 ? '#dc2626' : budgetPct > 75 ? '#f59e0b' : '#16a34a';

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setSelectedCollab(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#5c5c5c', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
          <ChevronLeft size={16} /> Back to Collaborations
        </button>

        {/* Header */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{co.startup_name || co.title || 'Collaboration'}</h2>
              {co.title && co.startup_name && <div style={{ fontSize: 12, color: '#5c5c5c', marginTop: 2 }}>{co.title}</div>}
              <div style={{ fontSize: 11, color: '#6e6e6e', marginTop: 4 }}><Clock size={11} style={{ verticalAlign: -1 }} /> Started {new Date(co.started_at || co.created_at).toLocaleDateString()}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: stage.bg, color: stage.color }}>{stage.label}</span>
          </div>

          {/* Budget Section */}
          <div style={{ marginTop: 16, padding: 14, background: '#f9fafb', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}><DollarSign size={12} style={{ verticalAlign: -2 }} /> Budget</span>
              <button onClick={() => setBudgetEdit(!budgetEdit)} style={{ fontSize: 10, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{budgetEdit ? 'Cancel' : 'Edit'}</button>
            </div>
            {budgetEdit ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" placeholder="Estimated" value={budgetForm.budget_estimated} onChange={e => setBudgetForm(f => ({ ...f, budget_estimated: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
                <input type="number" placeholder="Spent" value={budgetForm.budget_spent} onChange={e => setBudgetForm(f => ({ ...f, budget_spent: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
                <select value={budgetForm.currency} onChange={e => setBudgetForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
                  <option>INR</option><option>USD</option><option>EUR</option>
                </select>
                <button onClick={saveBudget} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5c5c5c', marginBottom: 4 }}>
                  <span>Spent: {co.currency || 'INR'} {parseFloat(co.budget_spent || 0).toLocaleString()}</span>
                  <span>Estimated: {co.currency || 'INR'} {parseFloat(co.budget_estimated || 0).toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${budgetPct}%`, background: budgetColor, transition: 'width 0.3s' }} />
                </div>
                {co.budget_estimated > 0 && <div style={{ fontSize: 10, color: budgetColor, textAlign: 'right', marginTop: 2 }}>{budgetPct}% utilized</div>}
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Target size={14} style={{ verticalAlign: -2, marginRight: 6, color: G }} />Milestones ({msDone}/{milestones.length})
            </h3>
            <button onClick={() => setShowAddMilestone(!showAddMilestone)} style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          {/* Progress bar */}
          {milestones.length > 0 && (
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${milestones.length ? (msDone / milestones.length * 100) : 0}%`, background: G, transition: 'width 0.3s' }} />
            </div>
          )}
          {/* Add form */}
          {showAddMilestone && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <input placeholder="Milestone title" value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))}
                style={{ flex: 2, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
              <input type="date" value={mForm.due_date} onChange={e => setMForm(f => ({ ...f, due_date: e.target.value }))}
                style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
              <button onClick={addMilestone} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Add</button>
              <button onClick={() => setShowAddMilestone(false)} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={14} /></button>
            </div>
          )}
          {/* Milestone list */}
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
                  <button onClick={async () => { await corporateAPI.deleteMilestone(selectedCollab.id, m.id); const ms = await corporateAPI.listMilestones(selectedCollab.id); setMilestones(ms); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', flexShrink: 0 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              Tasks ({tsDone}/{tasks.length})
            </h3>
            <button onClick={() => setShowAddTask(!showAddTask)} style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add Task
            </button>
          </div>
          {/* Add form */}
          {showAddTask && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 10, padding: 12, background: '#f9fafb', borderRadius: 10 }}>
              <input placeholder="Task title" value={tForm.title} onChange={e => setTForm(f => ({ ...f, title: e.target.value }))}
                style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Assignee" value={tForm.assignee_name} onChange={e => setTForm(f => ({ ...f, assignee_name: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
                <select value={tForm.priority} onChange={e => setTForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
                <input type="date" value={tForm.due_date} onChange={e => setTForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addTask} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Add Task</button>
                <button onClick={() => setShowAddTask(false)} style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          {/* Task list */}
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
                  <button onClick={async () => { await corporateAPI.deleteTask(selectedCollab.id, t.id); const ts = await corporateAPI.listTasks(selectedCollab.id); setTasks(ts); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', flexShrink: 0 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Notes</h3>
          <textarea value={co.notes || ''} readOnly rows={3} style={{ width: '100%', padding: 10, fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical', background: '#f9fafb', color: '#555' }} />
        </div>
      </div>
    );
  }

  // ── KANBAN VIEW ───────────────────────────────────────────
  const grouped = {};
  STAGES.forEach(s => { grouped[s.key] = collabs.filter(c => c.status === s.key); });

  return (
    <div style={{ padding: 24 }}>
      <div id="tour-page-collabs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Link2 size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Collaborations
        </h1>
        <span style={{ fontSize: 12, color: '#5c5c5c' }}>{collabs.length} total</span>
      </div>

      {collabs.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Link2 size={32} style={{ color: '#ddd', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#5c5c5c' }}>No collaborations yet</p>
          <p style={{ fontSize: 12, color: '#6e6e6e' }}>Start a collaboration from the Startup Search page</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 12, overflowX: 'auto' }}>
          {STAGES.map(stage => (
            <div key={stage.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: stage.bg }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{grouped[stage.key]?.length || 0}</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {(grouped[stage.key] || []).map(co => {
                  const msTotal = parseInt(co.milestone_total) || 0;
                  const msDone = parseInt(co.milestone_done) || 0;
                  const msPct = msTotal > 0 ? Math.round(msDone / msTotal * 100) : 0;
                  return (
                    <div key={co.id} style={{ ...card, padding: 14, cursor: 'pointer' }}
                      onClick={() => openDetail(co)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = stage.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {co.logo_url ? (
                          <img
                            src={co.logo_url}
                            alt=""
                            style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}
                            onError={(e) => {
                              const fallback = document.createElement('div');
                              fallback.textContent = (co.startup_name || co.title || '?').charAt(0).toUpperCase();
                              fallback.style.cssText = `width:30px;height:30px;border-radius:8px;background:${G}12;color:${G};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
                              e.target.replaceWith(fallback);
                            }}
                          />
                        ) : (
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${G}12`, color: G, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {(co.startup_name || co.title || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.startup_name || 'Unknown Startup'}</div>
                          {co.title && <div style={{ fontSize: 10, color: '#5c5c5c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.title}</div>}
                        </div>
                      </div>

                      {co.sector && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{co.sector}</span>}

                      {co.notes && <p style={{ fontSize: 10, color: '#5c5c5c', marginTop: 6, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{co.notes}</p>}

                      {/* Mini milestone progress */}
                      {msTotal > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <div style={{ flex: 1, height: 3, background: '#f0f0f0', borderRadius: 2 }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${msPct}%`, background: G }} />
                          </div>
                          <span style={{ fontSize: 9, color: '#6e6e6e' }}>{msDone}/{msTotal}</span>
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: '#6e6e6e', marginTop: 6 }}>
                        <Clock size={10} style={{ verticalAlign: -1 }} /> {new Date(co.started_at || co.updated_at).toLocaleDateString()}
                      </div>

                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditing(co.id); setEditNotes(co.notes || ''); }}
                          style={{ padding: '3px 8px', fontSize: 10, borderRadius: 6, background: '#f9fafb', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                          <Edit3 size={10} /> Notes
                        </button>
                        {stage.key !== 'completed' && (
                          <button onClick={(e) => { e.stopPropagation(); const idx = STAGES.findIndex(s => s.key === stage.key); if (idx < STAGES.length - 1) moveToStage(co.id, STAGES[idx + 1].key); }}
                            style={{ flex: 1, padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 6, background: STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.bg || '#f3f4f6', color: STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.color || '#666', border: 'none', cursor: 'pointer' }}>
                            {STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.label} <ChevronRight size={10} style={{ verticalAlign: -1 }} />
                          </button>
                        )}
                      </div>

                      {/* Inline notes edit */}
                      {editing === co.id && (
                        <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                            style={{ width: '100%', padding: 8, fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <button onClick={() => saveNotes(co.id)} style={{ flex: 1, padding: '4px', fontSize: 10, borderRadius: 6, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
                            <button onClick={() => setEditing(null)} style={{ padding: '4px 8px', fontSize: 10, borderRadius: 6, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}><X size={10} /></button>
                          </div>
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
