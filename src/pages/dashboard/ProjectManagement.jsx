import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { projectAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban, Plus, ChevronRight, CheckCircle2, Clock, AlertTriangle,
  Users, Calendar, Search, Circle, PlayCircle,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

/* Map backend status values to display labels */
const normalizeStatus = (s) => {
  if (!s) return 'Planning';
  const map = { active: 'Active', completed: 'Completed', on_hold: 'On Hold', cancelled: 'Cancelled' };
  return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
};
const normalizePriority = (p) => {
  if (!p) return 'Medium';
  const map = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return map[p.toLowerCase()] || p.charAt(0).toUpperCase() + p.slice(1);
};
const normalizeTaskStatus = (s) => {
  if (!s) return 'Todo';
  const map = { todo: 'Todo', in_progress: 'In Progress', review: 'In Progress', done: 'Done' };
  return map[s.toLowerCase()] || s;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtBudget = (n) => n != null ? `₹${Number(n).toFixed(2)} Cr` : '—';

const STATUS_STYLE = {
  Active:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'On Hold':{ bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Planning: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  Completed:{ bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  Cancelled:{ bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const PRIORITY_STYLE = {
  Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  High:     { bg: '#fff8ec', color: '#D5AA5B', border: 'rgba(213,170,91,0.4)' },
  Medium:   { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  Low:      { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

const TASK_STATUS = {
  'Done':        { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'In Progress': { icon: PlayCircle,   color: '#D5AA5B', bg: '#fff8ec', border: 'rgba(213,170,91,0.4)' },
  'Blocked':     { icon: AlertTriangle,color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'Todo':        { icon: Circle,       color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const EMPTY_PROJECT = {
  title: '',
  description: '',
  status: 'active',
  priority: 'medium',
  start_date: '',
  end_date: '',
  budget: '',
  lead_id: '',
  startup_id: '',
};

export default function ProjectManagement() {
  const { user } = useAuth() || {};
  const [projects, setProjects]     = useState([]);
  const [allTasks, setAllTasks]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('projects'); // 'projects' | 'tasks' | 'detail'
  const [selected, setSelected]     = useState(null);
  const [taskFilter, setTaskFilter] = useState('All');
  const [search, setSearch]         = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState(EMPTY_PROJECT);

  useEffect(() => {
    projectAPI.list()
      .then(async (data) => {
        const raw = data.projects || data || [];
        // Normalise backend fields to what the UI expects
        const list = raw.map(p => ({
          ...p,
          name: p.title || p.name,
          startup: p.startup_name || p.startup || '—',
          status: normalizeStatus(p.status),
          priority: normalizePriority(p.priority),
          progress: p.progress ?? (p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0),
          budget: p.budget != null ? fmtBudget(p.budget) : '—',
          spent: p.spent != null ? fmtBudget(p.spent) : '—',
          start_date: fmtDate(p.start_date),
          end_date: fmtDate(p.end_date),
          pm: p.lead_name || p.pm || '—',
          team: p.team || 1,
          tasks: {
            total: Number(p.total_tasks) || 0,
            done: Number(p.done_tasks) || 0,
            pending: Math.max(0, (Number(p.total_tasks) || 0) - (Number(p.done_tasks) || 0)),
            blocked: 0,
          },
          milestones: p.milestones || [],
        }));
        setProjects(list);

        // Fetch tasks per project (detail endpoint returns tasks array)
        const taskPromises = list.map(p =>
          projectAPI.get(p.id)
            .then(detail => (detail.tasks || []).map(t => ({
              ...t,
              project: p.name,
              startup: p.startup,
              status: normalizeTaskStatus(t.status),
              priority: normalizePriority(t.priority),
              assignee: t.assignee_name || t.assignee || '—',
              due: fmtDate(t.due_date),
            })))
            .catch(() => [])
        );
        const allTaskArrays = await Promise.all(taskPromises);
        setAllTasks(allTaskArrays.flat());
      })
      .catch(err => toast.error(err.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  async function reloadProjects() {
    setLoading(true);
    try {
      const data = await projectAPI.list();
      const raw = data.projects || data || [];
      const list = raw.map(p => ({
        ...p,
        name: p.title || p.name,
        startup: p.startup_name || p.startup || '—',
        status: normalizeStatus(p.status),
        priority: normalizePriority(p.priority),
        progress: p.progress ?? (p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0),
        budget: p.budget != null ? fmtBudget(p.budget) : '—',
        spent: p.spent != null ? fmtBudget(p.spent) : '—',
        start_date: fmtDate(p.start_date),
        end_date: fmtDate(p.end_date),
        pm: p.lead_name || p.pm || '—',
        team: p.team || 1,
        tasks: {
          total: Number(p.total_tasks) || 0,
          done: Number(p.done_tasks) || 0,
          pending: Math.max(0, (Number(p.total_tasks) || 0) - (Number(p.done_tasks) || 0)),
          blocked: 0,
        },
        milestones: p.milestones || [],
      }));
      setProjects(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reload projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e) {
    if (e) e.preventDefault();
    if (!form.title || !form.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    setCreating(true);
    try {
      // Ship #3 frontend swap (21 May 2026) — send startup_user_id (FK to users.id)
      // instead of legacy startup_id (FK to startups.id). Backend Ship #3 ALTER
      // added startup_user_id column + controller accepts both keys. Closes the
      // SERIAL collision that caused FK violation for self-registered startups.
      //
      // Auto-detect startup ownership from logged-in user:
      //   - If form.startup_id explicitly set (admin overrides), send as startup_id
      //     (legacy path — preserves admin's intent to FK to a specific startups row)
      //   - If user is startup persona, default startup_user_id to their own user.id
      //   - Otherwise both null (org-level project)
      const explicitLegacyStartupId = form.startup_id
        ? parseInt(form.startup_id, 10)
        : null;
      const startup_user_id = explicitLegacyStartupId
        ? null
        : (user?.role === 'startup' ? user.id : null);
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        status: form.status || 'active',
        priority: form.priority || 'medium',
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        lead_id: form.lead_id ? parseInt(form.lead_id, 10) : (user?.id || null),
        startup_id: explicitLegacyStartupId,
        startup_user_id,
      };
      await projectAPI.create(payload);
      toast.success('Project created');
      setShowCreate(false);
      setForm(EMPTY_PROJECT);
      await reloadProjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  const filteredTasks = allTasks.filter(t => {
    const matchFilter = taskFilter === 'All' || t.status === taskFilter;
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (t.project || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <LoadingSkeleton type="card" />;

  if (view === 'detail' && selected) {
    return <ProjectDetail project={selected} onBack={() => setView('projects')} tasks={allTasks} onTaskCreated={reloadProjects} />;
  }

  // Summary aggregates from real data
  const activeCount   = projects.filter(p => p.status === 'Active').length;
  const pendingTasks  = allTasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length;
  const blockedTasks  = allTasks.filter(t => t.status === 'Blocked').length;

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Project Management</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Track milestones, tasks, collaboration & financial health</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #eee', borderRadius: 9, padding: 3, gap: 2 }}>
            {['projects', 'tasks'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                  background: view === v ? G : 'transparent',
                  color: view === v ? '#fff' : '#666',
                }}
              >{v}</button>
            ))}
          </div>
          <button
            onClick={() => { setForm(EMPTY_PROJECT); setShowCreate(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: G, color: '#fff',
              border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = GH}
            onMouseLeave={e => e.currentTarget.style.background = G}
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Phase 96 - Create Project Modal */}
      {showCreate && (
        <div
          onClick={() => !creating && setShowCreate(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateProject}
            style={{
              background: '#fff', borderRadius: 12, padding: 28,
              width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>New Project</h2>
              <button
                type="button"
                onClick={() => !creating && setShowCreate(false)}
                disabled={creating}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: creating ? 'not-allowed' : 'pointer', color: '#888', padding: 0, lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                  placeholder="e.g. Q3 Product Launch"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="What is this project about?"
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Start Date">
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
                </Field>
                <Field label="End Date">
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
                </Field>
              </div>

              <Field label="Budget (in Cr, optional)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g. 5.5"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button
                type="button"
                onClick={() => !creating && setShowCreate(false)}
                disabled={creating}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1.5px solid #ddd',
                  background: '#fff', color: '#666', fontSize: 13, fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >Cancel</button>
              <button
                type="submit"
                disabled={creating || !form.title.trim()}
                style={{
                  padding: '9px 22px', borderRadius: 8, border: 'none',
                  background: (creating || !form.title.trim()) ? '#ccc' : G,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: (creating || !form.title.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
                }}
              >{creating ? 'Creating…' : 'Create Project'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Projects', value: projects.length, icon: FolderKanban, bg: '#fff8ec', fg: G },
          { label: 'Active',         value: activeCount,     icon: PlayCircle,   bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Tasks Pending',  value: pendingTasks,    icon: Clock,        bg: '#f0f9ff', fg: '#0284c7' },
          { label: 'Blocked Tasks',  value: blockedTasks,    icon: AlertTriangle,bg: '#fef2f2', fg: '#dc2626' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} style={{ ...card, padding: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={16} color={fg} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Projects view */}
      {view === 'projects' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>No projects found.</div>
          )}
          {projects.map(p => {
            const ss = STATUS_STYLE[p.status] || STATUS_STYLE['Planning'];
            const ps = PRIORITY_STYLE[p.priority] || PRIORITY_STYLE['Medium'];
            const budgetNum = parseFloat((p.budget || '0').toString().replace(/[₹\sCr,]/g, '')) || 0;
            const spentNum  = parseFloat((p.spent  || '0').toString().replace(/[₹\sCr,]/g, '')) || 0;
            const pctSpent  = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;
            const tasks     = p.tasks || { total: 0, done: 0, pending: 0, blocked: 0 };
            const milestones = p.milestones || [];
            return (
              <div key={p.id} style={{ ...card, padding: 22, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onClick={() => { setSelected(p); setView('detail'); }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: '#1a1a1a', fontSize: 15, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{p.status}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{p.priority}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>{p.sector} · PM: {p.pm} · Team: {p.team} members</div>
                    {/* Progress bar */}
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#888' }}>Overall Progress</span>
                        <span style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 600 }}>{p.progress}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', background: p.progress > 70 ? '#16a34a' : p.progress > 40 ? G : '#ef4444', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Middle: tasks */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Done',    value: tasks.done    || 0, color: '#16a34a' },
                      { label: 'Pending', value: tasks.pending || 0, color: G },
                      { label: 'Blocked', value: tasks.blocked || 0, color: '#dc2626' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Right: budget */}
                  <div style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#888' }}>Budget Used</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pctSpent > 85 ? '#dc2626' : '#1a1a1a' }}>{pctSpent}%</span>
                    </div>
                    <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ width: `${pctSpent}%`, height: '100%', background: pctSpent > 85 ? '#dc2626' : '#16a34a', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{p.spent || '—'} of {p.budget || '—'}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.start_date || p.start} → {p.end_date || p.end}</div>
                  </div>

                  <ChevronRight size={16} color="#ccc" style={{ alignSelf: 'center' }} />
                </div>

                {/* Milestones */}
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {milestones.map((m, i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, padding: '3px 9px', borderRadius: 20,
                      background: m.done ? '#f0fdf4' : '#f8fafc',
                      color: m.done ? '#16a34a' : '#64748b',
                      border: `1px solid ${m.done ? '#bbf7d0' : '#e2e8f0'}`,
                    }}>
                      <CheckCircle2 size={10} />
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks view */}
      {view === 'tasks' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                placeholder="Search tasks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                  background: '#fff', border: '1.5px solid #eee', borderRadius: 9,
                  fontSize: 16, outline: 'none', color: '#1a1a1a',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Todo', 'In Progress', 'Blocked', 'Done'].map(f => (
                <button key={f} onClick={() => setTaskFilter(f)} style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer',
                  background: taskFilter === f ? G : '#fff',
                  color: taskFilter === f ? '#fff' : '#666',
                  borderColor: taskFilter === f ? G : '#eee',
                }}>{f}</button>
              ))}
            </div>
          </div>

          <div style={{ ...card, overflow: 'hidden' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No tasks found</div>
            ) : filteredTasks.map((t, i) => {
              const ts = TASK_STATUS[t.status] || TASK_STATUS['Todo'];
              const StatusIcon = ts.icon;
              const pp = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE['Medium'];
              return (
                <div key={t.id} style={{
                  padding: '13px 20px',
                  borderBottom: i < filteredTasks.length - 1 ? '1px solid #f5f5f5' : 'none',
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  <StatusIcon size={16} color={ts.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{t.project}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: pp.bg, color: pp.color, border: `1px solid ${pp.border}`, whiteSpace: 'nowrap' }}>{t.priority}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, whiteSpace: 'nowrap' }}>{t.status}</span>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {t.assignee}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {t.due}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Phase 96 - shared form helpers for Create Project + Add Task modals
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  fontSize: 16,
  color: '#1a1a1a',
  background: '#fff',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  outline: 'none',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const EMPTY_TASK = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  assignee_id: '',
};

function ProjectDetail({ project: p, onBack, tasks: allTasks = [], onTaskCreated }) {
  const [tab, setTab] = useState('overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [localTasks, setLocalTasks] = useState(null);

  async function handleCreateTask(e) {
    if (e) e.preventDefault();
    if (!taskForm.title || !taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setCreatingTask(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description || null,
        status: taskForm.status || 'todo',
        priority: taskForm.priority || 'medium',
        due_date: taskForm.due_date || null,
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id, 10) : null,
      };
      const newTask = await projectAPI.createTask(p.id, payload);
      toast.success('Task added');
      setShowAddTask(false);
      setTaskForm(EMPTY_TASK);
      // Optimistic update — append to local task list so user sees it immediately
      setLocalTasks(prev => {
        const base = prev || projectTasks;
        return [...base, { ...newTask, status: normalizeTaskStatus(newTask.status), priority: normalizePriority(newTask.priority), due: fmtDate(newTask.due_date) }];
      });
      // Also trigger parent reload so the projects list count refreshes
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add task');
    } finally {
      setCreatingTask(false);
    }
  }

  const ss = STATUS_STYLE[p.status] || STATUS_STYLE['Planning'];
  const budgetNum = parseFloat((p.budget || '0').toString().replace(/[₹\sCr,]/g, '')) || 0;
  const spentNum  = parseFloat((p.spent  || '0').toString().replace(/[₹\sCr,]/g, '')) || 0;
  const pctSpent  = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;
  const projectTasks = localTasks || p.tasks_list || allTasks.filter(t => t.project === p.name) || [];
  const milestones   = p.milestones || [];

  const TABS = ['overview', 'tasks', 'milestones', 'financials', 'team'];

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: G, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Projects
      </button>

      {/* Project header */}
      <div style={{ ...card, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 20, fontWeight: 700 }}>{p.name}</h1>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{p.status}</span>
            </div>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{p.sector} · {p.start_date || p.start} → {p.end_date || p.end} · PM: {p.pm || p.project_manager}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{p.progress}%</div>
            <div style={{ fontSize: 12, color: '#888' }}>Overall Progress</div>
          </div>
        </div>
        <div style={{ marginTop: 16, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${p.progress}%`, height: '100%', background: p.progress > 70 ? '#16a34a' : G, borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            border: 'none', cursor: 'pointer',
            background: tab === t ? G : 'transparent',
            color: tab === t ? '#fff' : '#666',
          }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { label: 'Tasks Done',    value: `${(p.tasks||{}).done||0}/${(p.tasks||{}).total||0}`, color: '#16a34a' },
            { label: 'Tasks Pending', value: (p.tasks||{}).pending || 0,  color: G },
            { label: 'Tasks Blocked', value: (p.tasks||{}).blocked || 0,  color: '#dc2626' },
            { label: 'Budget Used',   value: `${pctSpent}%`,              color: pctSpent > 85 ? '#dc2626' : '#16a34a' },
            { label: 'Budget Spent',  value: p.spent || '—',              color: '#1a1a1a' },
            { label: 'Remaining',     value: budgetNum > 0 ? `₹${(budgetNum - spentNum).toFixed(2)} Cr` : '—', color: '#1a1a1a' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Milestones</h3>
          </div>
          {milestones.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No milestones yet.</div>
          )}
          {milestones.map((m, i) => (
            <div key={i} style={{
              padding: '14px 22px', borderBottom: i < milestones.length - 1 ? '1px solid #f5f5f5' : 'none',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: m.done || m.completed ? '#f0fdf4' : '#f8fafc',
                border: `2px solid ${m.done || m.completed ? '#16a34a' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={14} color={m.done || m.completed ? '#16a34a' : '#ccc'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 500 }}>{m.name || m.title}</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{m.date || m.due_date}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                background: m.done || m.completed ? '#f0fdf4' : '#f8fafc',
                color: m.done || m.completed ? '#16a34a' : '#64748b',
                border: `1px solid ${m.done || m.completed ? '#bbf7d0' : '#e2e8f0'}`,
              }}>{m.done || m.completed ? 'Completed' : 'Upcoming'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Financials */}
      {tab === 'financials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Budget Overview</h3>
            {[
              { label: 'Total Budget',  value: p.budget || '—',  color: '#1a1a1a' },
              { label: 'Spent to Date', value: p.spent || '—',   color: pctSpent > 85 ? '#dc2626' : '#16a34a' },
              { label: 'Remaining',     value: budgetNum > 0 ? `₹${(budgetNum - spentNum).toFixed(2)} Cr` : '—', color: '#1a1a1a' },
              { label: '% Utilized',    value: `${pctSpent}%`,   color: pctSpent > 85 ? '#dc2626' : G },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pctSpent}%`, height: '100%', background: pctSpent > 85 ? '#dc2626' : '#16a34a', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Budget Utilization</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888', width: 60 }}>Spent</span>
              <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pctSpent}%`, height: '100%', background: G, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, color: '#888', width: 40, textAlign: 'right' }}>{pctSpent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Team / Tasks tabs — simplified list */}
      {(tab === 'tasks' || tab === 'team') && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>
              {tab === 'tasks' ? 'Project Tasks' : 'Team Members'}
            </h3>
            {tab === 'tasks' && (
              <button
                onClick={() => { setTaskForm(EMPTY_TASK); setShowAddTask(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', background: G, color: '#fff',
                  border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}
              ><Plus size={12} /> Add Task</button>
            )}
          </div>
          {tab === 'tasks' && (
            projectTasks.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No tasks yet.</div>
              : projectTasks.map((t, i, arr) => {
                  const ts = TASK_STATUS[t.status] || TASK_STATUS['Todo'];
                  const StatusIcon = ts.icon;
                  return (
                    <div key={t.id || i} style={{ padding: '13px 22px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StatusIcon size={15} color={ts.color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>{t.assignee || t.assigned_to} · Due {t.due || t.due_date}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{t.status}</span>
                    </div>
                  );
                })
          )}
          {tab === 'team' && (
            <div style={{ padding: 22 }}>
              {(p.pm || p.project_manager) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(213,170,91,0.3)' }}>
                    {(p.pm || p.project_manager || '?')[0]}
                  </div>
                  <div>
                    <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 600 }}>{p.pm || p.project_manager}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>Project Manager</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Lead</span>
                </div>
              )}
              {p.team > 1 && <div style={{ color: '#888', fontSize: 12, padding: '12px 0' }}>+ {p.team - 1} more team members</div>}
            </div>
          )}
        </div>
      )}

      {/* Phase 96 - Add Task Modal */}
      {showAddTask && (
        <div
          onClick={() => !creatingTask && setShowAddTask(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateTask}
            style={{
              background: '#fff', borderRadius: 12, padding: 28,
              width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Add Task</h2>
              <button
                type="button"
                onClick={() => !creatingTask && setShowAddTask(false)}
                disabled={creatingTask}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: creatingTask ? 'not-allowed' : 'pointer', color: '#888', padding: 0, lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Title *">
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  autoFocus
                  placeholder="e.g. Wireframes for landing page"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Status">
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} style={inputStyle}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={inputStyle}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
              </div>

              <Field label="Due Date">
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button
                type="button"
                onClick={() => !creatingTask && setShowAddTask(false)}
                disabled={creatingTask}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1.5px solid #ddd',
                  background: '#fff', color: '#666', fontSize: 13, fontWeight: 600,
                  cursor: creatingTask ? 'not-allowed' : 'pointer',
                }}
              >Cancel</button>
              <button
                type="submit"
                disabled={creatingTask || !taskForm.title.trim()}
                style={{
                  padding: '9px 22px', borderRadius: 8, border: 'none',
                  background: (creatingTask || !taskForm.title.trim()) ? '#ccc' : G,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: (creatingTask || !taskForm.title.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
                }}
              >{creatingTask ? 'Adding…' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
