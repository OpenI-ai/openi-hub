import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incubatorAPI } from '../../services/api';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import {
  Loader2, Plus, X, Calendar, GraduationCap, Search, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = {
  draft:      { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  accepting:  { bg: '#eff6ff', color: '#2563eb', label: 'Accepting Applications' },
  active:     { bg: '#f0fdf4', color: '#16a34a', label: 'Active' },
  completed:  { bg: '#fef3c7', color: '#ca8a04', label: 'Completed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

const PROGRAM_TYPES = ['incubation', 'pre-incubation', 'residency', 'virtual'];

export default function IncubatorPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', focus_sectors: '', program_type: 'incubation',
    duration_months: 6, equity_taken: '', funding_offered_min: '', funding_offered_max: '', funding_currency: 'INR',
    application_deadline: '', start_date: '', end_date: '', total_seats: 10, status: 'draft',
  });

  useEffect(() => { load(); }, [statusFilter, search]);

  const load = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const d = await incubatorAPI.listPrograms(params);
      setPrograms(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load programs'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Program name required');
    try {
      const payload = {
        ...form,
        focus_sectors: form.focus_sectors ? form.focus_sectors.split(',').map(s => s.trim()).filter(Boolean) : null,
        duration_months: form.duration_months || null,
        equity_taken: form.equity_taken || null,
        funding_offered_min: form.funding_offered_min || null,
        funding_offered_max: form.funding_offered_max || null,
        application_deadline: form.application_deadline || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      await incubatorAPI.createProgram(payload);
      toast.success('Program created');
      setShowCreate(false);
      setForm({
        name: '', description: '', focus_sectors: '', program_type: 'incubation',
        duration_months: 6, equity_taken: '', funding_offered_min: '', funding_offered_max: '', funding_currency: 'INR',
        application_deadline: '', start_date: '', end_date: '', total_seats: 10, status: 'draft',
      });
      load();
    } catch (err) { toast.error(err.message || 'Failed to create'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span id="tour-page-incubator-programs-header" />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Incubation Programs</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Manage your incubation cohorts, applications, and pipeline</p>
        </div>
        <button id="tour-page-incubator-programs-create" onClick={() => setShowCreate(true)}
          style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Program
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px' }}>
          <Search size={15} style={{ color: '#888' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..."
            style={{ border: 'none', outline: 'none', fontSize: 16, flex: 1, background: 'transparent' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #eee', borderRadius: 10, fontSize: 16, background: '#fff', cursor: 'pointer' }}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="accepting">Accepting</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Empty state */}
      {programs.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <GraduationCap size={42} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 6 }}>No programs yet</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>Create your first incubation program to get started</div>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Create Program
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {programs.map(p => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
            const milestonePct = p.milestone_total > 0 ? Math.round((p.milestone_done / p.milestone_total) * 100) : 0;
            return (
              <div key={p.id} style={{ ...card, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => navigate(`/dashboard/incubator/programs/${p.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                {/* Status + Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                  <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.program_type}</span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{p.name}</h3>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description || 'No description provided'}
                </p>

                {/* Sectors */}
                {(p.focus_sectors || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {p.focus_sectors.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fff8ec', color: G }}>{s}</span>
                    ))}
                    {p.focus_sectors.length > 3 && <span style={{ fontSize: 9, color: '#999' }}>+{p.focus_sectors.length - 3}</span>}
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5', marginBottom: 10 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{p.startup_count || 0}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>STARTUPS</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{p.selected_count || 0}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>SELECTED</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{p.total_seats || '—'}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>SEATS</div>
                  </div>
                </div>

                {/* Milestone progress */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 4 }}>
                    <span>Milestones</span>
                    <span>{p.milestone_done}/{p.milestone_total}</span>
                  </div>
                  <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${milestonePct}%`, background: G, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#888' }}>
                  {p.application_deadline ? (
                    <span><Calendar size={11} style={{ verticalAlign: -2, marginRight: 3 }} />Deadline: {new Date(p.application_deadline).toLocaleDateString()}</span>
                  ) : (
                    <span>—</span>
                  )}
                  <ArrowRight size={13} style={{ color: '#ccc' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>New Incubation Program</h2>
              <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={() => setShowCreate(false)} />
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={lbl}>Program Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={lbl}>Focus Sectors (comma-separated)</label>
                  <input value={form.focus_sectors} onChange={e => setForm({ ...form, focus_sectors: e.target.value })} placeholder="DeepTech, AI, Robotics" style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Program Type</label>
                    <select value={form.program_type} onChange={e => setForm({ ...form, program_type: e.target.value })} style={inp}>
                      {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Duration (months)</label>
                    <input type="number" value={form.duration_months} onChange={e => setForm({ ...form, duration_months: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Equity (%)</label>
                    <input type="number" step="0.1" value={form.equity_taken} onChange={e => setForm({ ...form, equity_taken: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Currency</label>
                    <select value={form.funding_currency} onChange={e => setForm({ ...form, funding_currency: e.target.value })} style={inp}>
                      {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Funding Min</label>
                    <input type="number" value={form.funding_offered_min} onChange={e => setForm({ ...form, funding_offered_min: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Funding Max</label>
                    <input type="number" value={form.funding_offered_max} onChange={e => setForm({ ...form, funding_offered_max: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Application Deadline</label>
                    <input type="date" value={form.application_deadline} onChange={e => setForm({ ...form, application_deadline: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Total Seats</label>
                    <input type="number" value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}>
                      <option value="draft">Draft</option>
                      <option value="accepting">Accepting Applications</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
